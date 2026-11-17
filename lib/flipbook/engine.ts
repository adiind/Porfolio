/**
 * The 3D flip book: one WebGL canvas showing a book lying on a coloured table.
 *
 * Every leaf is the same flat grid, bent into a turning page by the vertex
 * shader (see curl.ts for the maths). The page on top is drawn from separate
 * layers so its giant word and cut-out float above the sheet and slide against
 * each other as the view moves. Nothing here knows about a particular project;
 * books arrive as data.
 */

import {
  CanvasTexture, ClampToEdgeWrapping, Color, DoubleSide, Group, LinearFilter, LinearMipmapLinearFilter, Mesh,
  MirroredRepeatWrapping, NoColorSpace, OrthographicCamera, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, Scene,
  ShaderMaterial, Texture, Vector2, Vector3, Vector4, WebGLRenderTarget, WebGLRenderer,
} from 'three';
import { DEFAULT_CURL, leafShadowSpan } from './curl';
import {
  beginDrag, createFlipState, endDrag, isSettled, setCurrent, stepFlip, updateDrag, type FlipState,
} from './flipState';
import { liveSceneFor, type LiveInput, type LivePage } from './live';
import { composeBack, composePage, pageSources, type BookImages, type PageLayers } from './pageArt';
import {
  LEAF_FRAGMENT, LEAF_VERTEX, PROP_ALPHA_SHADOW_FRAGMENT, PROP_CURL_VERTEX, PROP_FRAGMENT, PROP_SHADOW_FRAGMENT, PROP_VERTEX, SUN_FRAGMENT,
  SUN_VERTEX, TABLE_FRAGMENT, TABLE_VERTEX,
} from './shaders';
import type { MatLayer } from './matLayer';
import type { FlipBook } from './types';

export interface FlipBookEngineOptions {
  reducedMotion: boolean;
  /** The page the book is heading to changed. */
  onPage?(page: number): void;
  /** A call-to-action drawn on a page was clicked. */
  onCta?(href: string): void;
  onError?(error: unknown): void;
  /** Where the resting sheet sits on screen, in CSS pixels from the canvas corner. */
  onLayout?(rect: { left: number; top: number; right: number; bottom: number; spread: boolean; leaves: number }): void;
  /** The reader leaned in over one page to read it, or stepped back. */
  onLean?(leaning: boolean): void;
  /**
   * The reader came from the home page, where this book lay closed on the mat.
   * The book starts exactly there (same place, size and angle on screen, the
   * mat's grid in the same place under it) and the view then comes down to it.
   */
  arrival?: MatArrival;
  /** A poster (or nothing: null) was clicked on the stage. */
  onProp?(id: string | null): void;
  /** The closed book was clicked from the wide view of the stage. */
  onBookPick?(): void;
  /** Where the stage's frame falls on screen at the wide view, in CSS pixels: the words laid over the scene are fitted to it. */
  onStageLayout?(frame: { left: number; top: number; width: number; height: number }): void;
  /** The opening has finished: the room is lit. */
  onLit?(): void;
  /** The pointer has come onto a poster or booklet of the stage (its id), or off it (null). */
  onHover?(id: string | null): void;
  /** A book set with `gradual` has every page drawn with its own pictures. */
  onFilled?(slug: string): void;
  /** Expose window.__flipbook for review captures. */
  debug?: boolean;
}

/**
 * One thing lying on the mat beside the book: a poster (a picture on a card)
 * or a cut-out. Places are in table units (the closed book is one unit wide),
 * measured from the middle of the closed book, x to the right and y up.
 */
export interface StageProp {
  id: string; image: HTMLImageElement | HTMLCanvasElement; x: number; y: number; w: number; h: number; radius: number;
  /** The picture brings its own outline (its transparent parts stay clear). */
  cutout?: boolean;
  /** It stands up from the mat (the printer): its shadow is a small pool at its foot, not its whole outline. */
  standing?: boolean;
  /** Turned on the mat, in degrees clockwise. */
  turn?: number;
  /**
   * A card that belongs to another card's set: it is not on the mat at the wide view. When the card named here is
   * flown to, this one is dealt out from under it to its `open` place.
   */
  dealtFrom?: string;
  /** Where the card lies while its set is open (the card that was clicked has one too: it slides there). */
  open?: { x: number; y: number };
  /** Its shadow follows the picture's own outline (its alpha), not a rounded box: for cut-outs that are not boxes. */
  alphaShadow?: boolean;
  /** The near right corner is lifted off the mat by this much (table units), as a sheet of paper curls. */
  curl?: number;
  /**
   * A sheet to be read: flown to, the camera comes close enough to read it. The whole sheet when it can be read whole
   * (it would be at least `minPx` CSS pixels tall), else as much of it as fits from its top, never less than two thirds.
   * `aside`: CSS pixels kept clear at the window's right for the words and controls beside it.
   */
  read?: { minPx: number; aside: number };
  /** Only to be read: it never lifts under the pointer and a click passes over it (the home page's greeting and facts). */
  still?: boolean;
  /**
   * Held back: while true it is not drawn (nor its shadow), though it lies at rest from the first moments of the opening,
   * so that it can be shown in one frame exactly where something else (the loading greeting) has just come to rest.
   * Set it to false to show it. A prop that has this field (true or false) lands first and takes no landing slot.
   */
  held?: boolean;
  /**
   * Lies under the prop with this id, edges peeking out (the cards a poster holds, seen at rest): drawn just beneath it,
   * lands with it, and a click on its edges is a click on that prop.
   */
  under?: string;
  /** A dealt card that can be picked: while its set is open, a click on it reports its id (and it lifts under the pointer). */
  pick?: boolean;
}

/**
 * The home page as a place: the book lies closed among posters on the mat, seen
 * from a wide view. The camera flies down to whatever is picked.
 */
export interface StageSpec {
  props: StageProp[];
  /** What the wide view frames: its middle and size, in table units. */
  frame: { x: number; y: number; w: number; h: number };
  /** The closed book's turn on the mat, in degrees (clockwise). */
  turn: number;
  /** One home-page pixel in table units: shadows and the mat's grid are sized from it. */
  unit: number;
}

/** Where the closed book and the mat were on screen when the reader left the home page. All in CSS pixels. */
export interface MatArrival {
  /** The middle of the closed book, its width, and its turn in degrees (clockwise). */
  x: number; y: number; w: number; turn: number;
  /** The mat's top left corner and its size. */
  matX: number; matY: number; matW: number; matH: number;
  /** The sunlight's clock, in seconds, so the light carries on from where it was. */
  sun: number;
}

export interface FlipBookEngine {
  /**
   * `gradual`: `images` may hold only the cover's pictures (the home stage lights up on the closed book). Then only the
   * cover is drawn now; every other page is drawn once its pictures have come in through addImages, one at a time and
   * only while nothing on screen moves. Without it every page is drawn at once, as a book opened on its own page is.
   */
  setBook(book: FlipBook, images: BookImages, startPage?: number, gradual?: boolean): Promise<void>;
  /** More pictures for a book set with `gradual` (ignored for any other book). */
  addImages(book: FlipBook, more: BookImages): void;
  next(): void;
  prev(): void;
  goTo(page: number): void;
  readonly page: number;
  readonly pageCount: number;
  /** True while the book is open as two-page spreads (each leaf carries two of the book's pages). */
  readonly spread: boolean;
  /**
   * Lean in over one page of an open spread so its words can be read (-1 the
   * left page, 1 the right), or step back (0). Turning a page steps back too.
   */
  lean(side: -1 | 0 | 1): void;
  readonly leaning: boolean;
  /** Come down from the home page's view of the closed book to the reading view, then open the cover. */
  arrive(): void;
  /** Close the book and go back up to the home page's view of it. Resolves when it is there. */
  leave(): Promise<void>;
  /** Seconds on the sunlight's clock, to hand back to the home page. */
  readonly sunClock: number;
  /**
   * Lay the posters out round the book and start from the wide view. Call before setBook.
   * The first time the room is dark; pass `lit` when the lights are already on (another book has been picked up).
   */
  setStage(stage: StageSpec, lit?: boolean): void;
  /** Bring the light up (the opening). */
  dawn(): void;
  /** How far the light has come up, 0 (dark room) to 1 (full): the shaders' uDawn (the loading greeting keeps time with it). */
  readonly dawnLevel: number;
  /** Fly down to one poster, or back up to the wide view (null). */
  focusOn(id: string | null): Promise<void>;
  /**
   * Where a point of the window (CSS pixels from the canvas corner) falls on the mat, in table units, seen from the
   * stage's resting wide view (not scrolled, not leaning with the pointer). Things laid on the mat under words that are
   * real text use it to lie exactly under them. Null before the stage is set.
   */
  stagePoint(x: number, y: number): { x: number; y: number } | null;
  /** The page has been scrolled: move the wide view that far down the mat (table units). */
  setScroll(units: number): void;
  /**
   * Where a thing on the stage lies on screen just now, in CSS pixels from the canvas corner ('book' is the live book):
   * the keyboard's focus ring is drawn round it. Null when there is no such thing.
   */
  screenRect(id: string): { left: number; top: number; width: number; height: number } | null;
  /** Lift a thing off the mat as the pointer resting on it does (it has keyboard focus); null lets it down again. */
  lift(id: string | null): void;
  /**
   * Give a prop a new picture (same shape, any resolution): a sharper copy that has come in, or a card whose photograph has
   * arrived. The caller picks the moment (not while it is moving, so the change is never seen mid-motion).
   */
  setPropImage(id: string, image: HTMLImageElement | HTMLCanvasElement): void;
  /** Where a point of a prop's picture is on screen now (CSS pixels from the canvas corner): u across, v down, 0 to 1. */
  screenPoint(id: string, u: number, v: number): { x: number; y: number } | null;
  /**
   * Draw something more on the mat, in this scene and this light (the timeline: lib/mat/timelineLayer.ts). It is updated
   * every frame after the camera is placed. Returns the way to take it off again.
   */
  addLayer(layer: MatLayer): () => void;
  resize(): void;
  dispose(): void;
}

const FOV = 24;
const PITCH = (9 * Math.PI) / 180;
const STACK_GAP = 0.0006;
const LIGHT = new Vector3(-0.3, 0.3, 0.9);
const SHADOW_SLANT = 0.33;
/** One grid square of the mat when nobody has said otherwise: a closed book is ten squares wide, as on the home page. */
const MAT_CELL = 0.1;
/** From the wide view of the stage the mat is seen at a slant, so it has depth. */
const STAGE_PITCH = (15 * Math.PI) / 180;
const DEPTH_WORD = 0.034;
const DEPTH_FG = 0.078;
const CORNER = 0.036;
/** Landscape pages are wide, close to 5:3, like an open picture book. */
const LANDSCAPE_H = 0.6;
const BOW = 0.02;
const COVER_STIFFNESS = 0.35;

interface Leaf {
  mesh: Mesh;
  material: ShaderMaterial;
  flat: Texture;
  back: Texture;
  layered: { base: Texture; word: Texture; fg: Texture | null; shadow: Texture } | null;
  cta: PageLayers['cta'];
  pop: number;
  popVel: number;
  /** A page that is drawn again every frame (see ./live). Its canvases feed `layered`. */
  live: LivePage | null;
  liveClock: number;
  liveHeld: boolean;
  wasTop: boolean;
  lastT: number;
  turnVel: number;
  /** Spread books: the page on the leaf's back, sharp, and redrawn every frame if it is a live page. */
  backHi: Texture | null;
  backLive: LivePage | null;
  backCanvas: HTMLCanvasElement | null;
  backClock: number;
  backPlayed: number;
  /** The sheet has been turned to bring its back in (in flight or lying open on the left): its story started then. */
  backShown: boolean;
  /** A gradual book: whether the small flat face and back are drawn yet (until then they are plain paper). */
  flatDone: boolean;
  backDone: boolean;
  /** A gradual book: the layers or the sharp back were drawn before the page's pictures came in (paper with its words). */
  rough: boolean;
  backRough: boolean;
}

interface Tween { from: number; to: number; elapsed: number; duration: number; ease: (x: number) => number; done?: () => void }

/**
 * Colours are composited in display space (see shaders.ts), so hex values go
 * to the GPU as written instead of being converted to linear light.
 */
const displayColor = (hex: string, out = new Color()): Color => {
  const value = parseInt(hex.replace('#', ''), 16);
  out.r = ((value >> 16) & 255) / 255;
  out.g = ((value >> 8) & 255) / 255;
  out.b = (value & 255) / 255;
  return out;
};

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const smooth01 = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const easeInCubic = (x: number) => x ** 3;

/** Critically or under-damped spring step. Returns the new [value, velocity]. */
function spring(value: number, velocity: number, target: number, omega: number, zeta: number, dt: number): [number, number] {
  let v = velocity;
  let x = value;
  let remaining = dt;
  while (remaining > 1e-5) {
    const h = Math.min(remaining, 1 / 120);
    v += (omega * omega * (target - x) - 2 * zeta * omega * v) * h;
    x += v * h;
    remaining -= h;
  }
  return [x, v];
}

export function createFlipBookEngine(canvas: HTMLCanvasElement, opts: FlipBookEngineOptions): FlipBookEngine {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x101010, 1);
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new Scene();
  /** More things on the mat (addLayer), and the canvas's size in CSS pixels for them. */
  const layers: MatLayer[] = [];
  const layerView = { width: 1, height: 1 };
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 40);
  const drawnView = new PerspectiveCamera(FOV, 1, 0.05, 40);
  const bookGroup = new Group();
  scene.add(bookGroup);

  const leafGeometry = new PlaneGeometry(1, 1, 72, 28);
  /** How far the opening has come: 0 dark, 1 lit. Every material shares this one value. */
  const dawnUniform = { value: 1 };
  const blank = (() => {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 2;
    const t = new CanvasTexture(c);
    t.colorSpace = NoColorSpace;
    return t;
  })();

  const castSpan = new Vector4(0, 0, 0, 0);
  const camLocal = new Vector3();
  const restCamLocal = new Vector3();
  const stage = displayColor('#333333');
  const stageLight = displayColor('#444444');
  const stageTarget = displayColor('#333333');
  const stageLightTarget = displayColor('#444444');

  const tableMaterial = new ShaderMaterial({
    vertexShader: TABLE_VERTEX,
    fragmentShader: TABLE_FRAGMENT,
    uniforms: {
      uStage: { value: stage },
      uStageLight: { value: stageLight },
      uPageH: { value: LANDSCAPE_H },
      uLeftAmt: { value: 0 },
      uBookOffset: { value: new Vector2(0, 0) },
      uCastSpan: { value: castSpan },
      uCastAmt: { value: 0 },
      uCastSoft: { value: 0.05 },
      tSurface: { value: blank as Texture },
      uSurfaceAmt: { value: 0 },
      uPool: { value: new Vector2(0.42, 0.1) },
      uPoolSize: { value: new Vector2(2.1, 1.7) },
      uBoard: { value: displayColor('#2b160d') },
      uBoardAmt: { value: 0 },
      uCorner: { value: CORNER },
      uMat: { value: 0 },
      uCell: { value: MAT_CELL },
      uMatOrigin: { value: new Vector2(2.5, 2.5) },
      uMatRect: { value: new Vector4(0, 0, -1, -1) },
      uBookTurn: { value: 0 },
      uMatEdge: { value: 0 },
      uDawn: dawnUniform,
      tSun: { value: blank as Texture },
      uScreen: { value: new Vector2(1, 1) },
    },
  });

  // the sunlight: the home page's picture of window light, drawn small each frame and shared by the mat and the pages
  const sunTarget = new WebGLRenderTarget(4, 4, { depthBuffer: false });
  sunTarget.texture.colorSpace = NoColorSpace;
  sunTarget.texture.minFilter = LinearFilter;
  sunTarget.texture.magFilter = LinearFilter;
  const sunMaterial = new ShaderMaterial({
    vertexShader: SUN_VERTEX,
    fragmentShader: SUN_FRAGMENT,
    uniforms: { uRes: { value: new Vector2(4, 4) }, uT: { value: 40 }, uM: { value: new Vector2(0, 0) } },
    depthTest: false,
    depthWrite: false,
  });
  const sunScene = new Scene();
  const sunQuad = new Mesh(new PlaneGeometry(2, 2), sunMaterial);
  sunQuad.frustumCulled = false;
  sunScene.add(sunQuad);
  const sunCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const screenSize = new Vector2(1, 1);
  tableMaterial.uniforms.tSun.value = sunTarget.texture;
  tableMaterial.uniforms.uScreen.value = screenSize;
  const sunLean = new Vector2(0, 0);
  const sunLeanTarget = new Vector2(0, 0);
  /** The book lies on the sunlit mat (set per book). */
  let onMat = false;
  let sunClock = opts.arrival?.sun ?? 40;
  const light = LIGHT.clone();
  let shadowSlant = SHADOW_SLANT;
  const draw = () => {
    if (onMat) {
      sunMaterial.uniforms.uT.value = sunClock;
      sunMaterial.uniforms.uM.value.copy(sunLean);
      renderer.setRenderTarget(sunTarget);
      renderer.render(sunScene, sunCamera);
      renderer.setRenderTarget(null);
    }
    renderer.render(scene, camera);
    // (the view as it was last drawn: screenPoint answers from it, never from a view resize() is part way through measuring)
    drawnView.copy(camera);
    retire();
  };
  /** The photographed table top a book asked for, if any. */
  let surface: Texture | null = null;
  const table = new Mesh(new PlaneGeometry(60, 60), tableMaterial);
  table.position.z = -0.006;
  table.frustumCulled = false;
  scene.add(table);

  let book: FlipBook | null = null;
  let images: BookImages | null = null;
  /**
   * The book was set with only some of its pictures (setBook `gradual`): a page is drawn once all of its own are in.
   * Once every page has been drawn this goes back to false and the book behaves as one set whole.
   */
  let gradual = false;
  let leaves: Leaf[] = [];
  let state: FlipState = createFlipState(1);
  state.reduced = opts.reducedMotion;
  let portrait = false;
  /** Open as two-page spreads: leaf k carries page 2k on its face and page 2k + 1 on its back. */
  let spread = false;
  const frontPage = (leaf: number): number => (spread ? leaf * 2 : leaf);
  const backPage = (leaf: number): number => (spread ? leaf * 2 + 1 : -1);
  const soloNow = (): boolean => Boolean(book?.solo) && !spread;
  let pageH = LANDSCAPE_H;
  let dist = 2;
  const target = new Vector3(0.45, 0, 0);
  // leaning in: the camera comes down over one page of an open spread so its words can be read
  let lean = 0; let leanVel = 0; let leanTarget = 0; let leanSide: -1 | 1 = -1;
  let closeDist = 2;
  let viewDist = 2;
  const viewTarget = new Vector3(0.45, 0, 0);
  const setLean = (side: -1 | 0 | 1) => {
    const next = side !== 0 && spread && !(side === -1 && state.current === 0) ? 1 : 0;
    if (next) leanSide = side as -1 | 1;
    if (next === leanTarget) return;
    leanTarget = next;
    opts.onLean?.(next === 1);
    invalidate();
  };
  // coming from the home page: 1 while the view is still the home page's (straight down, the closed book small
  // and where it lay), 0 once it has come down to the reading view
  const arrival = opts.arrival ?? null;
  let stageSpec: StageSpec | null = null;
  const far = (): boolean => Boolean(arrival || stageSpec);
  interface PropMesh { prop: StageProp; mesh: Mesh; shadow: Mesh; texture: Texture; lift: number }
  /** A prop's picture as the GPU takes it: drawn as written (no colour conversion), smooth when shrunk. */
  const propTexture = (image: HTMLImageElement | HTMLCanvasElement): Texture => {
    const texture = new Texture(image);
    texture.colorSpace = NoColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.anisotropy = maxAnisotropy;
    texture.needsUpdate = true;
    return texture;
  };
  /**
   * A texture per picture, kept while a prop shows it: laid out again (another book picked up), the same picture is not
   * sent to the GPU again. What no prop shows any more is let go after the next frame is drawn (`retire`).
   */
  const propTextures = new Map<HTMLImageElement | HTMLCanvasElement, Texture>();
  const propTextureFor = (image: HTMLImageElement | HTMLCanvasElement): Texture => {
    let texture = propTextures.get(image);
    if (!texture) { texture = propTexture(image); propTextures.set(image, texture); }
    return texture;
  };
  /**
   * Things the stage no longer uses, let go once the next frame is drawn: by then the new props have taken up the same
   * shader programs (disposed first, the last material using a program deletes it, and the new ones compile it again)
   * and any picture handed back again (setPropImage, just after setStage) has found its texture still there.
   */
  const retired: Array<{ dispose(): void }> = [];
  let sweep = false;
  const retire = () => {
    if (!retired.length && !sweep) return;
    retired.splice(0).forEach((item) => item.dispose());
    sweep = false;
    const used = new Set(propMeshes.map((item) => item.texture));
    propTextures.forEach((texture, image) => { if (!used.has(texture)) { texture.dispose(); propTextures.delete(image); } });
  };
  let propMeshes: PropMesh[] = [];
  let focus: StageProp | null = null;
  /** When the poster flown to opens into a set of cards: the box that holds the whole set, for the camera. */
  let focusBox: { x: number; y: number; w: number; h: number } | null = null;
  let hoverProp: string | null = null;
  let dawning = false;
  let litTold = false;
  let viewTan = 0.2;
  let viewAspect = 1.6;
  let away = arrival ? 1 : 0;
  let awayTween: { from: number; to: number; elapsed: number; duration: number; done?: () => void } | null = null;
  let awayDist = 2;
  const awayTarget = new Vector3(0, 0, 0);
  const scrolled = new Vector3(0, 0, 0);
  /** How far down the mat the wide view has been scrolled, in table units. */
  let stageScroll = 0;
  /** When the wide view last travelled with the page's scroll (a gradual book draws nothing while it does). */
  let scrolledAt = 0;
  const moveAway = (to: number, duration: number) => new Promise<void>((resolve) => {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; resolve(); } };
    if (opts.reducedMotion || !far()) { away = far() ? to : 0; awayTween = null; invalidate(); finish(); return; }
    const tween = { from: away, to, elapsed: 0, duration, done: finish };
    awayTween = tween;
    invalidate();
    // frames can be starved while the tab is hidden; never let a hand-over hang on them (a move that a newer one has
    // taken over only resolves: it must not end the newer one or put the camera back where it was going)
    window.setTimeout(() => { if (!finished) { if (awayTween === tween) { awayTween = null; away = to; invalidate(); } finish(); } }, duration * 1000 + 400);
  });
  let disposed = false;
  let generation = 0;
  let lastEmitted = -1;
  /** Where a mouse pointer is on the sheet, for pages that answer to it. */
  let pointerUv: { u: number; v: number } | null = null;

  // view
  const tilt = new Vector2(0, 0);
  const tiltVel = new Vector2(0, 0);
  const tiltTarget = new Vector2(0, 0);
  let swayClock = 0;
  let swayLeft = 0;
  // hover lift and end-of-book nudge
  let peekForward = 0; let peekForwardVel = 0; let peekForwardTarget = 0;
  let peekBack = 0; let peekBackVel = 0; let peekBackTarget = 0;
  let nudge = 0; let nudgeVel = 0;
  // the sheet flexes a little each time a page lands, then settles
  let bow = BOW; let bowVel = 0;
  // book slide (changing books)
  let slideY = 0;
  let slide: Tween | null = null;
  // review overrides
  const override = new Map<number, number>();
  let popOverride: number | null = null;

  /** The table takes its colour from the page on top (or from the book when the page has no colour world of its own). */
  let stageOverride: { stage: string; light: string } | null = null;
  const applyStage = () => {
    if (!book) return;
    const tone = book.pages[frontPage(state.current)]?.tone;
    displayColor(stageOverride?.stage ?? tone?.stage ?? book.theme.stage, stageTarget);
    displayColor(stageOverride?.light ?? tone?.stageLight ?? book.theme.stageLight, stageLightTarget);
  };

  /* ---------- textures ---------- */

  const makeTexture = (source: HTMLCanvasElement, alpha: boolean, mipmaps: boolean): Texture => {
    const texture = new CanvasTexture(source);
    texture.colorSpace = NoColorSpace;
    texture.premultiplyAlpha = alpha;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.generateMipmaps = mipmaps;
    texture.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter;
    texture.magFilter = LinearFilter;
    texture.anisotropy = mipmaps ? maxAnisotropy : 1;
    texture.needsUpdate = true;
    return texture;
  };

  const sizes = () => {
    const flatW = portrait ? 512 : 800;
    const fullW = portrait ? 1024 : 1600;
    return { flatW, flatH: Math.round(flatW * pageH), fullW, fullH: Math.round(fullW * pageH) };
  };

  /** A page can be drawn as itself: all its pictures are in (always, unless the book is gradual; a blank board needs none). */
  const drawable = (page: number): boolean => {
    if (!gradual || !book || !images || page < 0 || page >= book.pages.length) return true;
    const have = images;
    return pageSources(book, page).every((src) => have.has(src));
  };
  /**
   * The cover has been lifted. Until then the inside of a gradual book cannot be seen, so a page whose pictures are
   * still on their way is not drawn at all; after it, such a page is drawn as paper with its words until they land.
   */
  const opened = (): boolean => state.current > 0 || state.t[0] > 0.001;
  /** A face not drawn yet: plain paper in its page's own deepest colour, the colour its edge shows at the side of the stack. */
  const plainFace = (page: number): Texture => {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 2;
    const ctx = c.getContext('2d');
    const meta = book?.pages[Math.min(Math.max(0, page), (book?.pages.length ?? 1) - 1)];
    if (ctx) { ctx.fillStyle = meta?.tone?.deep ?? book?.theme.paper ?? '#ffffff'; ctx.fillRect(0, 0, 2, 2); }
    return makeTexture(c, false, false);
  };

  const dropLayers = (leaf: Leaf) => {
    if (!leaf.layered) return;
    leaf.rough = false;
    leaf.live?.dispose();
    leaf.live = null;
    leaf.liveHeld = false;
    leaf.wasTop = false;
    leaf.layered.base.dispose();
    leaf.layered.word.dispose();
    leaf.layered.fg?.dispose();
    leaf.layered.shadow.dispose();
    leaf.layered = null;
    const u = leaf.material.uniforms;
    u.uLayered.value = 0;
    u.tBase.value = blank; u.tWord.value = blank; u.tFg.value = blank; u.tShadow.value = blank;
  };

  const liveInput = (leaf: Leaf, index: number, dt: number): LiveInput => {
    const t = effectiveT(index);
    return {
      dt,
      pointer: index === state.current ? pointerUv : null,
      turn: t,
      turnVel: leaf.turnVel,
      onTop: index === state.current && t < 0.05,
      reduced: opts.reducedMotion,
    };
  };

  const ensureLayers = (index: number) => {
    const leaf = leaves[index];
    if (!leaf || leaf.layered || !book || !images) return;
    const { fullW, fullH } = sizes();
    const page = frontPage(index);
    if (page >= book.pages.length) {
      // an even-count spread book ends on a left-hand page: the last leaf's face is a blank board
      const tiny = () => { const c = document.createElement('canvas'); c.width = 2; c.height = 2; return c; };
      leaf.layered = {
        base: makeTexture(composeBack(book, book.pages.length - 1, fullW, fullH), false, true),
        word: makeTexture(tiny(), true, false),
        fg: null,
        shadow: makeTexture(tiny(), false, false),
      };
      const u = leaf.material.uniforms;
      u.tBase.value = leaf.layered.base;
      u.tWord.value = leaf.layered.word;
      u.tFg.value = blank;
      u.tShadow.value = leaf.layered.shadow;
      u.uHasFg.value = 0;
      u.uWordTint.value = 0;
      u.uLayered.value = 1;
      return;
    }
    // A gradual book: a page whose pictures are still coming waits while the book is shut, and after that is drawn without
    // them: a page that carries its own words by its own scene (its photographs left out), any other as paper with its
    // words (pageArt roughPage). It is drawn again once they land.
    const rough = !drawable(page);
    if (rough && !opened()) return;
    const scene = portrait || (rough && !book.pages[page].selfCaptioned) ? null : liveSceneFor(book.pages[page]);
    if (scene) {
      try {
        // a live page paints its own three layers, again every frame; a small screen gets smaller canvases
        const liveW = canvas.clientWidth < 720 ? Math.round(fullW * 0.7) : fullW;
        const live = scene.create(images, liveW, Math.round(liveW * pageH));
        leaf.live = live;
        leaf.rough = rough;
        live.frame(liveInput(leaf, index, 0));
        leaf.layered = {
          base: makeTexture(live.canvases.base, false, true),
          word: makeTexture(live.canvases.word, true, true),
          fg: makeTexture(live.canvases.fg, true, true),
          shadow: makeTexture(live.canvases.shadow, false, false),
        };
        const u = leaf.material.uniforms;
        u.tBase.value = leaf.layered.base;
        u.tWord.value = leaf.layered.word;
        u.tFg.value = leaf.layered.fg;
        u.tShadow.value = leaf.layered.shadow;
        u.uHasFg.value = 1;
        u.uFgCenter.value.set(0.5, 0.5);
        u.uFgClip.value.set(-1, -1, 2);
        u.uWordTint.value = 0;
        u.uLayered.value = 1;
        return;
      } catch (error) {
        // the still picture takes over
        leaf.live?.dispose();
        leaf.live = null;
        console.warn('Live page fell back to its still picture.', error);
      }
    }
    const layers = composePage(book, page, { width: fullW, height: fullH, images, layered: true, rough });
    if (!layers.base || !layers.word || !layers.shadow) return;
    leaf.layered = {
      base: makeTexture(layers.base, false, true),
      word: makeTexture(layers.word, true, true),
      fg: layers.fg ? makeTexture(layers.fg, true, true) : null,
      shadow: makeTexture(layers.shadow, false, false),
    };
    leaf.rough = rough;
    leaf.cta = layers.cta;
    const u = leaf.material.uniforms;
    u.tBase.value = leaf.layered.base;
    u.tWord.value = leaf.layered.word;
    u.tFg.value = leaf.layered.fg ?? blank;
    u.tShadow.value = leaf.layered.shadow;
    u.uHasFg.value = leaf.layered.fg ? 1 : 0;
    u.uFgCenter.value.set(layers.fgCenter[0], layers.fgCenter[1]);
    if (layers.fgClip) u.uFgClip.value.set(layers.fgClip[0], layers.fgClip[1], layers.fgClip[2]);
    else u.uFgClip.value.set(-1, -1, 2);
    if (layers.wordTint) {
      displayColor(layers.wordTint.panel, u.uWordPanel.value);
      displayColor(layers.wordTint.art, u.uWordArt.value);
      u.uWordFrame.value.set(...layers.wordTint.frame);
      u.uWordTint.value = 1;
    } else {
      u.uWordTint.value = 0;
    }
    u.uLayered.value = 1;
  };

  /**
   * Sharp, layered textures for the page on top and its neighbours; the rest
   * stay light. Building a page's layers takes a few tens of milliseconds, so
   * the neighbours are built one per frame once the book is at rest, never in
   * the middle of a turn.
   */
  let windowPending = false;
  const windowOf = (centre: number) => (book?.solo || spread ? [centre, centre + 1] : [centre, centre + 1, centre - 1]).filter((i) => i >= 0 && i < leaves.length);
  const refreshWindow = (immediate: boolean) => {
    const wanted = windowOf(state.current);
    // the sheet that has just left the top keeps its layers until it is out of sight
    const leaving = (i: number) => (Boolean(book?.solo) || spread) && i === state.current - 1 && state.t[i] < 0.985;
    leaves.forEach((leaf, i) => { if (!wanted.includes(i) && !leaving(i)) dropLayers(leaf); });
    ensureLayers(state.current);
    if (immediate) {
      wanted.forEach(ensureLayers);
      windowPending = false;
    } else {
      windowPending = wanted.some((i) => !leaves[i].layered);
    }
    // spread books: the left-hand page is the back of the leaf just turned, and the next one to land is the back of the leaf on top
    const backs = spread ? [state.current - 1, state.current].filter((i) => i >= 0 && i < leaves.length) : [];
    leaves.forEach((leaf, i) => { if (!backs.includes(i)) dropBack(leaf); });
    backs.forEach((i) => ensureBack(i));
    pump();
  };
  /** Build one missing neighbour. Returns true while more remain. */
  const fillWindow = (): boolean => {
    // (a gradual book's page that cannot be drawn yet is skipped, not tried again every frame)
    const missing = windowOf(state.current).find((i) => !leaves[i].layered && (drawable(frontPage(i)) || opened()));
    if (missing === undefined) { windowPending = false; return false; }
    ensureLayers(missing);
    return true;
  };

  const dropBack = (leaf: Leaf) => {
    if (!leaf.backHi) return;
    leaf.backRough = false;
    leaf.backLive?.dispose();
    leaf.backLive = null;
    leaf.backHi.dispose();
    leaf.backHi = null;
    if (leaf.backCanvas) { leaf.backCanvas.width = 1; leaf.backCanvas.height = 1; }
    leaf.backCanvas = null;
    leaf.backPlayed = 0;
    leaf.backShown = false;
    leaf.material.uniforms.tBack.value = leaf.back;
  };

  const ensureBack = (index: number, now = false) => {
    const leaf = leaves[index];
    const behind = backPage(index);
    if (!leaf || leaf.backHi || !book || !images || behind < 0 || behind >= book.pages.length) return;
    // a gradual book: the back of the sheet lying on top cannot be seen until it turns, so it is drawn while nothing moves
    if (gradual && !now && index === state.current && state.t[index] < 0.001) { pump(); return; }
    const rough = !drawable(behind);
    if (rough && !opened()) return;
    const { fullW, fullH } = sizes();
    const scene = rough && !book.pages[behind].selfCaptioned ? null : liveSceneFor(book.pages[behind]);
    if (scene) {
      try {
        const live = scene.create(images, fullW, fullH);
        live.frame({ dt: 0, pointer: null, turn: 0, turnVel: 0, onTop: false, reduced: opts.reducedMotion });
        const face = document.createElement('canvas');
        live.flatten(face);
        leaf.backLive = live;
        leaf.backCanvas = face;
        leaf.backHi = makeTexture(face, false, true);
        leaf.backRough = rough;
        leaf.material.uniforms.tBack.value = leaf.backHi;
        return;
      } catch (error) {
        leaf.backLive?.dispose();
        leaf.backLive = null;
        console.warn('Live page fell back to its still picture.', error);
      }
    }
    const layers = composePage(book, behind, { width: fullW, height: fullH, images, layered: false, rough });
    leaf.backHi = makeTexture(layers.flat, false, true);
    leaf.backRough = rough;
    leaf.material.uniforms.tBack.value = leaf.backHi;
  };

  /** The small flat drawing of one side of a leaf: its page pressed flat, or the reverse of the sheet where it has no page. */
  const faceCanvas = (index: number, side: 'front' | 'back'): { canvas: HTMLCanvasElement; cta: PageLayers['cta'] } => {
    const b = book!;
    const { flatW, flatH } = sizes();
    const n = b.pages.length;
    const page = frontPage(index);
    if (side === 'front') {
      if (page >= n) return { canvas: composeBack(b, n - 1, flatW, flatH), cta: null };
      const layers = composePage(b, page, { width: flatW, height: flatH, images: images!, layered: false });
      return { canvas: layers.flat, cta: layers.cta };
    }
    const behind = backPage(index);
    return {
      canvas: behind >= 0 && behind < n
        ? composePage(b, behind, { width: flatW, height: flatH, images: images!, layered: false }).flat
        : composeBack(b, Math.min(page, n - 1), flatW, flatH),
      cta: null,
    };
  };

  const disposeLeaves = () => {
    dropPressing();
    leaves.forEach((leaf) => {
      dropBack(leaf);
      dropLayers(leaf);
      leaf.flat.dispose();
      leaf.back.dispose();
      leaf.material.dispose();
      bookGroup.remove(leaf.mesh);
    });
    leaves = [];
  };

  const buildLeaves = () => {
    if (!book || !images) return;
    // an even number of pages in a spread book ends on a left-hand page, so one more leaf (blank on its face) lets it be turned to
    const count = spread ? Math.floor(book.pages.length / 2) + 1 : book.pages.length;
    leaves = Array.from({ length: count }, (_, index) => {
      const page = frontPage(index);
      const behind = backPage(index);
      const meta = book!.pages[Math.min(page, book!.pages.length - 1)];
      // a gradual book's sheets are all there from the start (the closed book is as thick as ever), but their small faces
      // are plain paper until they are drawn, one at a time (pump); the sheet on top shows its own layers meanwhile
      const front = gradual ? null : faceCanvas(index, 'front');
      const flat = front ? makeTexture(front.canvas, false, true) : plainFace(page);
      const back = gradual ? plainFace(behind >= 0 ? behind : page) : makeTexture(faceCanvas(index, 'back').canvas, false, true);
      const material = new ShaderMaterial({
        vertexShader: LEAF_VERTEX,
        fragmentShader: LEAF_FRAGMENT,
        side: DoubleSide,
        alphaToCoverage: true,
        uniforms: {
          uT: { value: 0 },
          uStiff: { value: index === 0 ? COVER_STIFFNESS : DEFAULT_CURL.stiffness },
          uSkew: { value: DEFAULT_CURL.skew },
          uLead: { value: DEFAULT_CURL.leadGain },
          uLag: { value: DEFAULT_CURL.lagStart },
          uPageH: { value: pageH },
          uGutterRise: { value: 0.012 },
          uBow: { value: BOW },
          uVanish: { value: soloNow() ? 1 : 0 },
          uLift: { value: new Vector2((count - index) * STACK_GAP, (index + 1) * STACK_GAP) },
          uCam: { value: camLocal },
          uRestCam: { value: restCamLocal },
          tFlat: { value: flat },
          tBack: { value: back },
          tBase: { value: blank },
          tWord: { value: blank },
          tFg: { value: blank },
          tShadow: { value: blank },
          uLayered: { value: 0 },
          uHasFg: { value: 0 },
          uPop: { value: 0 },
          uCorner: { value: CORNER },
          uResting: { value: 1 },
          // a drawn poster is lifted like cut paper: a shallow step and a light shadow.
          // photographic pages float higher, with a deeper one.
          // a live page's letters and its characters are real separate sheets, so both cast shadows
          uDepth: { value: meta.live ? new Vector2(0.038, 0.06) : meta.layout === 'poster' ? new Vector2(DEPTH_WORD, 0.042) : new Vector2(DEPTH_WORD, DEPTH_FG) },
          uShade: { value: meta.live ? new Vector2(0.26, 0.28) : meta.layout === 'poster' ? new Vector2(0, 0.2) : new Vector2(0.3, 0.4) },
          uFgCenter: { value: new Vector2(0.5, 0.5) },
          uFgClip: { value: new Vector3(-1, -1, 2) },
          uWordTint: { value: 0 },
          uThick: { value: meta.live ? 1 : 0 },
          // how far the floating layers throw their shadows; a live page keeps them close under its moving letters
          uReach: { value: meta.live ? 0.55 : 1 },
          uWordPanel: { value: new Color() },
          uWordArt: { value: new Color() },
          uWordFrame: { value: new Vector4(0, 0, 1, 1) },
          uLight: { value: light },
          uDawn: dawnUniform,
          tSun: { value: sunTarget.texture },
          uScreen: { value: screenSize },
          // on the mat the pages take a fifth of the window light, as the cards on the home page do
          uSunAmt: { value: onMat ? 0.2 : 0 },
          uFallX: { value: onMat ? -1 : 1 },
          uCastSpan: { value: castSpan },
          uCastAmt: { value: 0 },
          uCastSoft: { value: 0.05 },
        },
      });
      const mesh = new Mesh(leafGeometry, material);
      mesh.frustumCulled = false;
      bookGroup.add(mesh);
      return { mesh, material, flat, back, layered: null, cta: front?.cta ?? null, pop: 0, popVel: 0, live: null, liveClock: 0, liveHeld: false, wasTop: false, lastT: 0, turnVel: 0, backHi: null, backLive: null, backCanvas: null, backClock: 0, backPlayed: 0, backShown: false, flatDone: !gradual, backDone: !gradual, rough: false, backRough: false };
    });
  };

  /* ---------- a gradual book: its pages drawn one at a time, while nothing moves ---------- */

  /** Draw one small face of a leaf that was left as plain paper. */
  const drawFace = (index: number, side: 'front' | 'back', ready?: HTMLCanvasElement) => {
    const leaf = leaves[index];
    if (!leaf || !book || !images) return;
    const { canvas: drawn, cta } = ready ? { canvas: ready, cta: null } : faceCanvas(index, side);
    const texture = makeTexture(drawn, false, true);
    if (side === 'front') {
      leaf.flat.dispose();
      leaf.flat = texture;
      leaf.flatDone = true;
      if (cta) leaf.cta = cta;
      leaf.material.uniforms.tFlat.value = texture;
    } else {
      leaf.back.dispose();
      leaf.back = texture;
      leaf.backDone = true;
      if (!leaf.backHi) leaf.material.uniforms.tBack.value = texture;
    }
  };

  /**
   * A live page's small face, drawn over three idle moments: the first time a page is drawn its scene can take some
   * 60 ms to make, draw and press flat in one go (it prepares its pictures then), so each step gets a moment of its own.
   */
  let pressing: { leaf: Leaf; index: number; side: 'front' | 'back'; live: LivePage; drawn: boolean } | null = null;
  const dropPressing = () => { pressing?.live.dispose(); pressing = null; };
  const faceInSteps = (index: number, side: 'front' | 'back'): { key: string; run: () => void } => {
    const page = side === 'front' ? frontPage(index) : backPage(index);
    const scene = !portrait && book && page >= 0 && page < book.pages.length ? liveSceneFor(book.pages[page]) : null;
    const key = `face ${side} ${index}`;
    if (!scene) return { key, run: () => drawFace(index, side) };
    return {
      key: `${key} made`,
      run: () => {
        const { flatW, flatH } = sizes();
        // (a scene that fails is drawn the ordinary way, which falls back to its still picture)
        try { pressing = { leaf: leaves[index], index, side, live: scene.create(images!, flatW, flatH), drawn: false }; } catch { drawFace(index, side); }
      },
    };
  };
  const pressingStep = (): { key: string; run: () => void } | null => {
    const p = pressing;
    if (!p) return null;
    if (leaves[p.index] !== p.leaf) { dropPressing(); return null; }
    const key = `face ${p.side} ${p.index}`;
    if (!p.drawn) {
      return { key: `${key} drawn`, run: () => {
        try { p.live.frame({ dt: 0, pointer: null, turn: 0, turnVel: 0, onTop: false, reduced: true }); p.drawn = true; } catch { dropPressing(); drawFace(p.index, p.side); }
      } };
    }
    return { key: `${key} pressed`, run: () => {
      const flat = document.createElement('canvas');
      try { p.live.flatten(flat); dropPressing(); drawFace(p.index, p.side, flat); } catch { dropPressing(); drawFace(p.index, p.side); }
    } };
  };

  /**
   * A story page on the back of a sheet, drawn again with all its pictures while it may be on screen (a gradual book
   * draws it before they have all come in, since it carries its own words), carries on from where its story was rather
   * than starting again: started again, a page the reader had just watched play would empty and play once more
   * (Bambu's photographs faded out and in again).
   */
  const backStory = (leaf: Leaf): { played: number; entered: boolean } | null => (leaf.backLive ? { played: leaf.backPlayed, entered: leaf.backShown } : null);
  const carryOnBack = (index: number, was: { played: number; entered: boolean } | null) => {
    const leaf = leaves[index];
    if (!was?.entered || !leaf?.backLive || !leaf.backHi || !leaf.backCanvas) return;
    const t = effectiveT(index);
    leaf.backLive.frame({ dt: was.played, pointer: null, turn: 1 - t, turnVel: 0, onTop: index === state.current - 1 && t > 0.98, reduced: opts.reducedMotion });
    leaf.backLive.flatten(leaf.backCanvas);
    leaf.backHi.needsUpdate = true;
    leaf.backPlayed = was.played;
    leaf.backShown = true;
  };

  /**
   * The next piece of drawing a gradual book needs, or null. First what can be seen now or the moment a page turns
   * (the sheet on top, the one under it, the backs either side), drawn again once its pictures land if it had to be
   * drawn without them; then the small faces of every other sheet, nearest the open place first.
   */
  const nextDrawing = (): { key: string; run: () => void } | null => {
    if (!book || !images) return null;
    const n = book.pages.length;
    for (const i of windowOf(state.current)) {
      const leaf = leaves[i];
      const page = frontPage(i);
      if (!leaf.layered && (drawable(page) || opened())) return { key: `layers ${i}`, run: () => ensureLayers(i) };
      if (leaf.layered && leaf.rough && drawable(page)) return { key: `layers again ${i}`, run: () => { dropLayers(leaf); ensureLayers(i); } };
    }
    const backs = spread ? [state.current - 1, state.current].filter((i) => i >= 0 && i < leaves.length) : [];
    for (const i of backs) {
      const leaf = leaves[i];
      const behind = backPage(i);
      if (behind < 0 || behind >= n) continue;
      if (!leaf.backHi && drawable(behind)) return { key: `back ${i}`, run: () => ensureBack(i, true) };
      if (leaf.backHi && leaf.backRough && drawable(behind)) return { key: `back again ${i}`, run: () => { const was = backStory(leaf); dropBack(leaf); ensureBack(i, true); carryOnBack(i, was); } };
    }
    const step = pressingStep();
    if (step) return step;
    const order = leaves.map((_, i) => i).sort((a, b) => Math.abs(a - state.current) - Math.abs(b - state.current));
    for (const i of order) {
      const leaf = leaves[i];
      if (!leaf.flatDone && drawable(frontPage(i))) return faceInSteps(i, 'front');
      if (!leaf.backDone && drawable(backPage(i))) return faceInSteps(i, 'back');
    }
    return null;
  };

  /**
   * Nothing on screen moves that a slow frame would spoil: no flight, no slide, no page turning or held, no scrolling,
   * and the room is lit.
   */
  const calm = (): boolean => !awayTween && !slide && !press && !frozen && isSettled(state)
    && Math.abs(lean - leanTarget) < 1e-3 && (!stageSpec || dawnUniform.value >= 1) && performance.now() - scrolledAt > 200;
  let pumping = false;
  let lastTried = '';
  const drawings: Array<{ key: string; at: number; ms: number }> = [];
  let calmSince = 0;
  let filledTold = true;
  /** A held opening of the cover (see arrive): it goes ahead as soon as the first spread has been drawn. */
  let held: (() => void) | null = null;
  const idle = (fn: () => void) => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 250 }); else window.setTimeout(fn, 16);
  };
  /**
   * One piece of drawing per idle moment, never two in a row: drawing a page takes a few tens of milliseconds, and back
   * to back they would stall frame after frame while the words rise and the light moves. It waits while anything moves.
   */
  function pump() {
    if (pumping || disposed || !gradual) return;
    pumping = true;
    // (while the reader waits at the closed cover the first spread is drawn without pauses: nothing moves then)
    window.setTimeout(() => idle(() => {
      pumping = false;
      if (disposed || !gradual) return;
      if (!calm()) { calmSince = 0; pump(); return; }
      const now = performance.now();
      if (!calmSince) calmSince = now;
      // (let a motion that has just ended settle first: its last frames are the ones a stall would show)
      if (now - calmSince < 100 && !held) { pump(); return; }
      const work = nextDrawing();
      // (a piece that did not take the first time is not tried again and again; it is drawn when its page is turned to)
      if (work && work.key === lastTried) { console.warn(`Flip book: could not draw ${work.key} of ${book?.slug}.`); return; }
      if (work) {
        lastTried = work.key;
        const began = performance.now();
        work.run();
        // (review captures read how long each piece took: window.__flipbook.drawings)
        if (opts.debug) drawings.push({ key: work.key, at: Math.round(began), ms: Math.round(performance.now() - began) });
        invalidate();
        held?.();
        pump();
        return;
      }
      lastTried = '';
      const whole = leaves.every((leaf) => leaf.flatDone && leaf.backDone && !leaf.rough && !leaf.backRough);
      if (whole && !filledTold && book) {
        // every page is drawn: from here on the book behaves as one set whole
        filledTold = true;
        gradual = false;
        opts.onFilled?.(book.slug);
      }
    }), held ? 0 : 34);
  }

  /** The first spread of a gradual book is drawn: the back of the cover, and the page the cover uncovers. */
  const firstSpreadDrawn = (): boolean => {
    if (!gradual || !book) return true;
    const cover = leaves[0];
    const under = leaves[1];
    const back = !spread || backPage(0) >= book.pages.length || Boolean(cover?.backHi && !cover.backRough);
    const face = !under || Boolean(under.layered && !under.rough);
    return back && face;
  };
  /** Counts the cover openings asked for: a newer one, a book swapped in, or a way back up cancels a held one. */
  let opening = 0;

  /* ---------- camera ---------- */

  const easedAway = (): number => easeInOutCubic(Math.min(1, Math.max(0, away)));
  const placeCamera = (yaw: number, pitchAdd: number, out: Vector3, at: Vector3 = viewTarget, far: number = viewDist, resting = false) => {
    // seen from the home page the book is looked at straight down; the usual slant comes in on the way to it
    const wide = stageSpec ? STAGE_PITCH : 0;
    const p = (resting ? PITCH : PITCH + (wide - PITCH) * easedAway()) + pitchAdd;
    out.set(
      at.x + far * Math.sin(yaw) * Math.cos(p),
      at.y - far * Math.sin(p),
      at.z + far * Math.cos(yaw) * Math.cos(p),
    );
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    layerView.width = w; layerView.height = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // a solo book shows one wide sheet floating with air around it and its caption beneath;
    // a bound book reflows to tall pages on a phone and keeps room for the turned stack
    // a book that can open as spreads does so once the window is wide enough for two pages to stay readable
    const nextSpread = Boolean(book?.spread) && w >= 760 && aspect >= 1.15;
    const spreadChanged = nextSpread !== spread;
    const pageBefore = frontPage(state.current);
    spread = nextSpread;
    const solo = soloNow();
    const narrow = aspect < 0.9;
    const nextPortrait = narrow && !solo && !spread;
    const orientationChanged = nextPortrait !== portrait;
    portrait = nextPortrait;
    pageH = portrait ? 1.5 : LANDSCAPE_H;
    const strip = spread ? 1 : solo ? 0 : portrait ? 0.04 : 0.11;
    // (a little air at the sides: the view leans with the pointer, and the open book must not run off the edge)
    const fitW = spread ? 0.925 : portrait ? 0.92 : solo ? (narrow ? 0.95 : w < 1100 ? 0.86 : 0.7) : 0.8;
    // a short window keeps the sheet smaller so its caption still clears the page dots
    const fitH = spread ? 0.66 : portrait ? 0.64 : solo ? (narrow ? 0.42 : h < 760 ? 0.5 : 0.58) : 0.72;
    const tan = Math.tan((FOV / 2) * (Math.PI / 180));
    const distH = (pageH * Math.cos(PITCH) * 1.05) / fitH / (2 * tan);
    const distW = ((1 + strip) * 1.03) / fitW / (2 * tan * aspect);
    dist = Math.max(distH, distW);
    renderer.getDrawingBufferSize(screenSize);
    const sunW = Math.max(2, Math.round(w * 0.38));
    const sunH = Math.max(2, Math.round(h * 0.38));
    sunTarget.setSize(sunW, sunH);
    sunMaterial.uniforms.uRes.value.set(sunW, sunH);
    viewTan = tan;
    viewAspect = aspect;
    if (stageSpec) {
      const stage = stageSpec;
      // the wide view frames the whole stage: fitted to the window's width, or its height on a very wide window
      awayDist = Math.max(stage.frame.w / (2 * tan * aspect), (stage.frame.h * Math.cos(STAGE_PITCH)) / (2 * tan));
      awayTarget.set(stage.frame.x, stage.frame.y, 0);
      tableMaterial.uniforms.uCell.value = 24 * stage.unit;
    }
    if (arrival) {
      // straight down, far enough that the closed cover (one unit wide) is as wide as it was on the home page,
      // and off to one side so its middle lands where it lay
      awayDist = h / (2 * tan * Math.max(40, arrival.w));
      awayTarget.set(-(arrival.x - w / 2) / arrival.w, (arrival.y - h / 2) / arrival.w, 0);
      // the mat is printed so that, from up there, its grid falls exactly where the home page drew it
      tableMaterial.uniforms.uCell.value = 24 / arrival.w;
      tableMaterial.uniforms.uMatOrigin.value.set((arrival.x - arrival.matX) / 24, (arrival.y - arrival.matY) / 24);
      tableMaterial.uniforms.uMatRect.value.set(0, 0, arrival.matW / 24, arrival.matH / 24);
    }
    // leaning in, one page fills the window
    closeDist = Math.max((pageH * Math.cos(PITCH) * 1.05) / 0.8 / (2 * tan), 1.03 / 0.93 / (2 * tan * aspect));
    if (!nextSpread && leanTarget) { leanTarget = 0; lean = 0; leanVel = 0; opts.onLean?.(false); }
    // look below the sheet's middle so it sits high: clear of the controls, and of its caption when solo
    const raise = spread ? 0.03 : solo ? (narrow ? 0.17 : h < 760 ? 0.1 : 0.085) : portrait ? -0.004 : 0.012;
    target.set(0.5 - strip / 2, -raise * 2 * dist * tan, 0);
    tableMaterial.uniforms.uPageH.value = pageH;
    // an open spread is lit from over its spine and lies on its cover boards; a single sheet has neither
    tableMaterial.uniforms.uPool.value.set(spread ? 0 : 0.42, spread ? 0.04 : 0.1);
    tableMaterial.uniforms.uPoolSize.value.set(spread ? 2.5 : 2.1, spread ? 1.55 : 1.7);
    tableMaterial.uniforms.uBoardAmt.value = spread && book?.board ? 1 : 0;
    if ((orientationChanged || spreadChanged) && book && images) {
      // the same place in the book, whichever way its pages are now bound
      disposeLeaves();
      buildLeaves();
      leaves.forEach((leaf) => { leaf.material.uniforms.uPageH.value = pageH; });
      if (spreadChanged) {
        state = createFlipState(leaves.length);
        state.reduced = opts.reducedMotion;
        lastEmitted = -1;
      }
      setCurrent(state, spread ? Math.floor((pageBefore + 1) / 2) : pageBefore);
      for (let i = 0; i < state.count; i += 1) { state.t[i] = i < state.current ? 1 : 0; state.vel[i] = 0; }
      refreshWindow(true);
    }
    // tell the page shell where the sheet rests, so it can set the caption under it
    placeCamera(0, 0, camera.position, target, dist, true);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    let left = Infinity; let right = -Infinity; let top = Infinity; let bottom = -Infinity;
    for (const [x, y] of [[0, -pageH / 2], [1, -pageH / 2], [0, pageH / 2], [1, pageH / 2]]) {
      const point = new Vector3(x, y, 0).project(camera);
      const px = (point.x * 0.5 + 0.5) * w;
      const py = (-point.y * 0.5 + 0.5) * h;
      left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
    opts.onLayout?.({ left, top, right, bottom, spread, leaves: leaves.length });
    if (stageSpec) {
      const stage = stageSpec;
      // where the stage's frame falls on screen at the wide view (the words over the scene are fitted to it)
      camera.position.set(awayTarget.x, awayTarget.y - awayDist * Math.sin(STAGE_PITCH), awayDist * Math.cos(STAGE_PITCH));
      camera.lookAt(awayTarget);
      camera.updateMatrixWorld(true);
      let l = Infinity; let r = -Infinity; let t = Infinity; let b = -Infinity;
      const f = stage.frame;
      // (measured across its middle, both ways: seen at a slant its far edge is narrower than its near one)
      for (const [x, y] of [[f.x - f.w / 2, f.y], [f.x + f.w / 2, f.y], [f.x, f.y - f.h / 2], [f.x, f.y + f.h / 2]]) {
        const point = new Vector3(x, y, 0).project(camera);
        const px = (point.x * 0.5 + 0.5) * w;
        const py = (-point.y * 0.5 + 0.5) * h;
        l = Math.min(l, px); r = Math.max(r, px); t = Math.min(t, py); b = Math.max(b, py);
      }
      opts.onStageLayout?.({ left: l, top: t, width: r - l, height: b - t });
    }
    invalidate();
  };

  /* ---------- per-frame update ---------- */

  const effectiveT = (index: number): number => {
    const forced = override.get(index);
    if (forced !== undefined) return forced;
    let t = state.t[index];
    if (index === state.current) t = Math.max(t, peekForward + nudge);
    if (index === state.current - 1) t = Math.min(t, 1 - peekBack);
    return Math.min(1, Math.max(0, t));
  };

  const update = (dt: number): boolean => {
    let moving = false;

    if (stepFlip(state, dt)) moving = true;
    const settled = isSettled(state);

    // hover lift relaxes whenever a real turn is under way
    const forwardGoal = settled ? peekForwardTarget : 0;
    const backGoal = settled ? peekBackTarget : 0;
    [peekForward, peekForwardVel] = spring(peekForward, peekForwardVel, forwardGoal, 15, 1, dt);
    [peekBack, peekBackVel] = spring(peekBack, peekBackVel, backGoal, 15, 1, dt);
    [nudge, nudgeVel] = spring(nudge, nudgeVel, 0, 13, 0.55, dt);
    if (opts.reducedMotion) { bow = BOW; bowVel = 0; } else { [bow, bowVel] = spring(bow, bowVel, BOW, 15, 0.32, dt); }
    if (Math.abs(bow - BOW) > 2e-4 || Math.abs(bowVel) > 2e-3) moving = true;
    if (Math.abs(peekForward - forwardGoal) > 2e-4 || Math.abs(peekBack - backGoal) > 2e-4 || Math.abs(nudge) > 2e-4 || Math.abs(nudgeVel) > 2e-3) moving = true;

    // view: follow the pointer, plus a slow drift after each move so the depth is visible on touch screens
    if (opts.reducedMotion) {
      tilt.set(0, 0);
    } else {
      [tilt.x, tiltVel.x] = spring(tilt.x, tiltVel.x, tiltTarget.x, 7.5, 1, dt);
      [tilt.y, tiltVel.y] = spring(tilt.y, tiltVel.y, tiltTarget.y, 7.5, 1, dt);
      if (Math.abs(tilt.x - tiltTarget.x) > 5e-4 || Math.abs(tilt.y - tiltTarget.y) > 5e-4) moving = true;
      if (swayLeft > 0) {
        swayLeft = Math.max(0, swayLeft - dt);
        swayClock += dt;
        moving = true;
      }
    }
    const envelope = Math.min(1, swayLeft / 1.5) * Math.min(1, swayClock / 0.8);
    const yaw = (tilt.x * 5.5 + Math.sin(swayClock * 0.85) * 1.5 * envelope) * (Math.PI / 180);
    const pitchAdd = (-tilt.y * 3.4 + Math.sin(swayClock * 0.6 + 1.2) * 0.7 * envelope) * (Math.PI / 180);

    // book slide when books are swapped
    if (slide) {
      slide.elapsed += dt;
      const k = Math.min(1, slide.elapsed / slide.duration);
      slideY = slide.from + (slide.to - slide.from) * slide.ease(k);
      moving = true;
      if (k >= 1) {
        const done = slide.done;
        slide = null;
        done?.();
      }
    }
    // the home page's view of the book, and the way down from it
    if (awayTween) {
      awayTween.elapsed += dt;
      const k = Math.min(1, awayTween.elapsed / awayTween.duration);
      away = awayTween.from + (awayTween.to - awayTween.from) * k;
      moving = true;
      if (k >= 1) { const done = awayTween.done; awayTween = null; done?.(); }
    }
    const up = easedAway();
    // a closed book lies in the middle of the table, and slides over as its cover is opened
    const opened = spread && leaves.length ? smooth01(effectiveT(0)) : 1;
    const closedShift = spread ? 0.5 * (1 - opened) : 0.5 * up;
    // on the home page it lay at a small angle: it straightens as the view comes down
    const turn = (-(arrival ? arrival.turn : stageSpec ? stageSpec.turn : 0) * Math.PI / 180) * up;
    bookGroup.rotation.z = turn;
    // while the camera is down at a poster or a set of cards, the book is slid off the near edge of the table, out of the way
    const tucked = focus ? (1 - up) * 5 : 0;
    bookGroup.position.set(-closedShift * Math.cos(turn), slideY - closedShift * Math.sin(turn) - tucked, 0);
    tableMaterial.uniforms.uBookTurn.value = turn;
    tableMaterial.uniforms.uMatEdge.value = up;
    // Scrolling moves the view down the table, but the mat's print is slid along with it: to the eye the mat stays put
    // and the things lying on it travel up across it.
    if (stageSpec) tableMaterial.uniforms.uMatOrigin.value.y = 2.5 - stageScroll / tableMaterial.uniforms.uCell.value;
    // the opening: the light comes up, and the posters settle onto the mat one after another
    if (dawning && dawnUniform.value < 1) {
      dawnUniform.value = Math.min(1, dawnUniform.value + dt / 1.3);
      moving = true;
    }
    if (dawnUniform.value >= 1 && !litTold && stageSpec) { litTold = true; opts.onLit?.(); }
    let dealt = 0;
    let landingIndex = 0;
    // (each lands 0.075 after the one before: worked out first, so a prop lying under another can land with it)
    const orders = new Map<StageProp, number>();
    propMeshes.forEach((item) => {
      if (item.prop.under) return;
      orders.set(item.prop, item.prop.dealtFrom || item.prop.held !== undefined ? 0 : Math.min(landingIndex++, 10));
    });
    propMeshes.forEach((item) => {
      if (!item.prop.under) return;
      const above = stageSpec?.props.find((prop) => prop.id === item.prop.under);
      orders.set(item.prop, above ? orders.get(above) ?? 0 : 0);
    });
    propMeshes.forEach((item) => {
      // Hidden story cards do not take a landing slot from visible objects.
      // (each lands 0.075 after the one before; the tenth slot is the last that still lands as the light finishes, so any
      // later ones land with it. The posters and booklets take the first nine and land exactly as they always did.)
      // (a prop that can be held back lands first, at rest well before it is shown: see StageProp.held)
      const order = orders.get(item.prop) ?? 0;
      const t = Math.min(1, Math.max(0, (dawnUniform.value * 1.5 - 0.3 - order * 0.075) / 0.42));
      const landed = 1 - (1 - t) ** 3;
      const mine = focus === item.prop;
      const child = item.prop.dealtFrom;
      const inSet = focus !== null && (mine || child === focus.id) && focusBox !== null;
      // A set of cards (his words: "it drops down and then it just like bounces to the left and then multiplies as it's
      // bouncing"). The clicked card hops to the left end of the row in three shrinking bounces; at each bounce a card
      // peels off it and hops to its own place on the right. Every card has landed before the camera has.
      const going = 1 - up;
      const ease = (k: number): number => 1 - (1 - Math.min(1, Math.max(0, k))) ** 3;
      const lead = focus && focusBox ? focus : null;
      const leadAt = (when: number): { x: number; y: number } => {
        const k = ease(when / 0.7);
        const to0 = lead!.open ?? lead!;
        return { x: lead!.x + (to0.x - lead!.x) * k, y: lead!.y + (to0.y - lead!.y) * k };
      };
      let out = 0;
      let px = item.prop.x;
      let py = item.prop.y;
      let arc = 0;
      if (inSet && lead) {
        if (mine) {
          const k = Math.min(1, going / 0.7);
          ({ x: px, y: py } = leadAt(going));
          arc = Math.abs(Math.sin(Math.PI * 2.5 * k)) * (1 - k) ** 1.2;
          out = 1;
        } else {
          dealt += 1;
          const start = 0.1 + (dealt - 1) * 0.13;
          const k = Math.min(1, Math.max(0, (going - start) / 0.4));
          const from = leadAt(start);
          const to = item.prop.open ?? item.prop;
          px = from.x + (to.x - from.x) * ease(k);
          py = from.y + (to.y - from.y) * ease(k);
          arc = Math.sin(Math.PI * Math.min(1, k * 1.25)) * 0.8 + (k > 0.8 ? Math.sin(Math.PI * (k - 0.8) * 5) * 0.14 : 0);
          out = k;
        }
      } else if (child) {
        const home = stageSpec?.props.find((prop) => prop.id === child) ?? item.prop;
        px = home.x; py = home.y;
      }
      // what the camera is going to stays; the rest sinks away as the view comes down, so nothing crowds it
      const shown = item.prop.held ? 0 : child ? Math.min(1, out * 4) : landed * (mine ? 1 : up);
      // (a sheet flown to for reading stays almost flat on the mat: lifted toward the eye it would hide its own shadow)
      const liftTarget = inSet ? arc * 2.2 + (item.prop.pick && hoverProp === item.prop.id && going > 0.95 ? 0.45 : 0) : mine ? (item.prop.read ? 0.15 : 1) * (1 - up) : hoverProp === item.prop.id && up > 0.5 && !item.prop.still ? 0.45 : 0;
      item.lift += (liftTarget - item.lift) * Math.min(1, dt * (inSet ? 30 : 9));
      if (Math.abs(liftTarget - item.lift) > 0.002) moving = true;
      item.mesh.position.set(px, py, 0.004 + (1 - landed) * 0.3 + item.lift * 0.035);
      item.shadow.position.set(px, py, 0.002);
      (item.mesh.material as ShaderMaterial).uniforms.uAlpha.value = shown;
      const shade = (item.shadow.material as ShaderMaterial).uniforms;
      shade.uAlpha.value = shown * landed;
      shade.uLift.value = item.lift + (1 - landed) * 2;
      item.mesh.visible = shown > 0.003;
      item.shadow.visible = shown > 0.003;
    });
    if (onMat) {
      // with motion turned down the window light holds still instead of drifting under a page that is still drawing
      if (!opts.reducedMotion) sunClock += dt;
      sunLean.lerp(sunLeanTarget, Math.min(1, dt * 2.4));
      if (!opts.reducedMotion) moving = true;
    }

    stage.lerp(stageTarget, Math.min(1, dt * 5));
    stageLight.lerp(stageLightTarget, Math.min(1, dt * 5));
    if (Math.abs(stage.r - stageTarget.r) + Math.abs(stage.g - stageTarget.g) + Math.abs(stage.b - stageTarget.b) > 0.003) moving = true;

    // leaning in over a page, and stepping back
    if (opts.reducedMotion) { lean = leanTarget; leanVel = 0; } else [lean, leanVel] = spring(lean, leanVel, leanTarget, 8.5, 1, dt);
    if (Math.abs(lean - leanTarget) > 4e-4 || Math.abs(leanVel) > 4e-4) moving = true;
    const near = Math.min(1, Math.max(0, lean));
    viewDist = dist + (closeDist - dist) * near;
    viewTarget.set(
      target.x + (bookGroup.position.x + leanSide * 0.5 - target.x) * near,
      target.y + (-0.012 - target.y) * near,
      0,
    );
    if (focus && focusBox) {
      // flown down to a set of cards: the whole row fills the window's width
      viewDist = Math.max((focusBox.h * 1.05) / 0.62 / (2 * viewTan), (focusBox.w * 1.03) / 0.9 / (2 * viewTan * viewAspect));
      viewTarget.set(focusBox.x, focusBox.y - focusBox.h * 0.06, 0);
    } else if (focus && focus.read) {
      // flown down to read a sheet: whole if it can be read whole, else from its top; its left edge near the window's left,
      // the room at the right kept for the words beside it
      const W = Math.max(1, canvas.clientWidth);
      const H = Math.max(1, canvas.clientHeight);
      const whole = H * 0.94;
      const byWidth = ((W - focus.read.aside - W * 0.05) * focus.h) / (focus.w + Math.abs(Math.sin(((focus.turn ?? 0) * Math.PI) / 180)) * focus.h);
      const tall = whole >= focus.read.minPx ? Math.min(whole, byWidth) : Math.min(byWidth, Math.max(focus.read.minPx, whole), whole * 1.5);
      viewDist = (focus.h * Math.cos(PITCH) * H) / (tall * 2 * viewTan);
      const halfH = viewDist * viewTan;
      const halfW = halfH * viewAspect;
      // (a turned sheet leans out at one side: the margin takes that in, so no corner leaves the window)
      const lean = (Math.abs(Math.sin(((focus.turn ?? 0) * Math.PI) / 180)) * tall) / 2 / W;
      // (whole: its middle at the window's; from its top: its top edge just under the window's)
      viewTarget.set(focus.x - focus.w / 2 + halfW * (0.95 - lean * 2), tall <= whole ? focus.y : focus.y + focus.h / 2 - halfH * 0.93, 0);
    } else if (focus) {
      // flown down to a poster: it fills most of the window's height, a little left of the middle (its words sit to the right)
      viewDist = Math.max((focus.h * 1.05) / 0.66 / (2 * viewTan), (focus.w * 1.03) / 0.44 / (2 * viewTan * viewAspect));
      viewTarget.set(focus.x + viewDist * viewTan * viewAspect * 0.36, focus.y, 0);
    }
    if (up > 0) {
      viewDist += (awayDist - viewDist) * up;
      // (scrolled down the page, the wide view has travelled that far down the mat)
      scrolled.copy(awayTarget);
      scrolled.y -= stageScroll;
      viewTarget.lerp(scrolled, up);
    }

    // (on the stage the wide view still leans a little with the pointer, so the mat has depth)
    const still = (1 - near * 0.5) * (1 - up * (stageSpec ? 0.55 : 1));
    placeCamera(yaw * still, pitchAdd * still, camera.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(viewTarget);
    camLocal.copy(camera.position).sub(bookGroup.position);
    placeCamera(0, 0, restCamLocal);
    restCamLocal.sub(bookGroup.position);
    // whatever else lies on the mat (the timeline), placed for this camera
    for (const layer of layers) if (layer.update(dt, camera, layerView)) moving = true;

    // shadow of whatever is in the air
    let min0 = Infinity; let max0 = -Infinity; let min1 = Infinity; let max1 = -Infinity; let height = 0;
    let leftAmount = 0;
    leaves.forEach((leaf, index) => {
      const t = effectiveT(index);
      const u = leaf.material.uniforms;
      u.uT.value = t;
      u.uBow.value = bow;
      if (dt > 0) leaf.turnVel += ((t - leaf.lastT) / dt - leaf.turnVel) * Math.min(1, dt * 30);
      leaf.lastT = t;
      // a one-sheet book: once a turned sheet is out of sight its layers are let go
      if ((book?.solo || spread) && leaf.layered && index < state.current && t >= 0.985) dropLayers(leaf);
      const airborne = t > 0.002 && t < 0.998;
      u.uResting.value = airborne ? 0 : 1;
      if (airborne) {
        const span = leafShadowSpan(t, shadowSlant, { ...DEFAULT_CURL, stiffness: index === 0 ? COVER_STIFFNESS : 0 });
        min0 = Math.min(min0, span.min0); max0 = Math.max(max0, span.max0);
        min1 = Math.min(min1, span.min1); max1 = Math.max(max1, span.max1);
        height = Math.max(height, span.height);
      }
      leftAmount = Math.max(leftAmount, t > 0.5 ? (t - 0.5) * 2 : 0);

      // pop-up: the page on top stands up once the leaf before it has cleared
      const isTop = index === state.current && state.t[index] < 0.02 && state.drag?.leaf !== index
        && (index === 0 || effectiveT(index - 1) > 0.55);
      const popTarget = isTop ? 1 : 0;
      if (opts.reducedMotion) {
        leaf.pop = popTarget; leaf.popVel = 0;
      } else if (popTarget > leaf.pop) {
        [leaf.pop, leaf.popVel] = spring(leaf.pop, leaf.popVel, popTarget, 12, 0.5, dt);
      } else {
        [leaf.pop, leaf.popVel] = spring(leaf.pop, leaf.popVel, popTarget, 30, 1, dt);
      }
      if (Math.abs(leaf.pop - popTarget) > 1e-3 || Math.abs(leaf.popVel) > 1e-2) moving = true;
      u.uPop.value = popOverride ?? Math.max(0, leaf.pop);
    });

    // live pages: redraw the ones in view, at most sixty times a second
    leaves.forEach((leaf, index) => {
      const live = leaf.live;
      if (!live || !leaf.layered) return;
      const t = effectiveT(index);
      const top = index === state.current && t < 0.05;
      if (top && !leaf.wasTop) live.enter();
      leaf.wasTop = top;
      const inView = t < 0.97 && (index === state.current || index === state.current - 1
        || (index === state.current + 1 && effectiveT(state.current) > 0.004));
      if (!inView) return;
      if (opts.reducedMotion && leaf.liveHeld) return;
      leaf.liveClock += dt;
      if (dt > 0 && leaf.liveClock < 1 / 62) { moving = true; return; }
      const more = live.frame(liveInput(leaf, index, leaf.liveClock));
      leaf.liveClock = 0;
      leaf.liveHeld = true;
      leaf.layered.base.needsUpdate = true;
      leaf.layered.word.needsUpdate = true;
      if (leaf.layered.fg) leaf.layered.fg.needsUpdate = true;
      leaf.layered.shadow.needsUpdate = true;
      if (more) moving = true;
    });

    // spread books: live pages on the backs of leaves (the left-hand page, and the one about to land there)
    leaves.forEach((leaf, index) => {
      const live = leaf.backLive;
      if (!live || !leaf.backHi || !leaf.backCanvas) return;
      const t = effectiveT(index);
      const shown = index === state.current - 1 && t > 0.98;
      // Its story starts once, when the sheet is turned to bring it in, and plays on through the landing. (It used to start
      // again as the sheet landed: the page the reader had just watched come in emptied and played once more, which on
      // Bambu's photograph pages read as the page refreshing after every turn.) While the sheet is only lifted by the
      // pointer resting on its corner, or held in a drag, the story waits at its start, so it is not spent before the turn.
      const turned = index === state.current - 1 && t > 0.03;
      if (turned && !leaf.backShown) { live.enter(); leaf.backPlayed = 0; }
      leaf.backShown = turned;
      if (!turned) return;
      if (opts.reducedMotion && leaf.backClock < 0) return;
      leaf.backClock = Math.max(0, leaf.backClock) + dt;
      if (dt > 0 && leaf.backClock < 1 / 62) { moving = true; return; }
      const more = live.frame({ dt: leaf.backClock, pointer: null, turn: 1 - t, turnVel: -leaf.turnVel, onTop: shown, reduced: opts.reducedMotion });
      leaf.backPlayed += leaf.backClock;
      leaf.backClock = opts.reducedMotion ? -1 : 0;
      live.flatten(leaf.backCanvas);
      leaf.backHi.needsUpdate = true;
      if (more) moving = true;
    });

    const castAmount = height > 0 ? 0.24 * Math.min(1, height / 0.07) : 0;
    if (castAmount > 0) castSpan.set(min0, max0, min1, max1);
    const soft = 0.025 + 0.13 * Math.min(1, height);
    leaves.forEach((leaf) => {
      leaf.material.uniforms.uCastAmt.value = castAmount;
      leaf.material.uniforms.uCastSoft.value = soft;
    });
    tableMaterial.uniforms.uCastAmt.value = castAmount;
    tableMaterial.uniforms.uCastSoft.value = soft;
    tableMaterial.uniforms.uLeftAmt.value = soloNow() ? 0 : leftAmount;
    tableMaterial.uniforms.uBookOffset.value.set(bookGroup.position.x, bookGroup.position.y);

    if (state.current !== lastEmitted) {
      lastEmitted = state.current;
      applyStage();
      opts.onPage?.(state.current);
    }
    // (a gradual book's neighbours are drawn by pump, in idle moments and never during a flight)
    if (windowPending && settled && !slide && dt > 0 && !gradual) {
      if (fillWindow()) moving = true;
    }
    return moving;
  };

  /* ---------- loop ---------- */

  let raf = 0;
  let lastTime = 0;
  /** Review captures stop the clock and step it by hand. */
  let frozen = false;
  const frame = (now: number) => {
    raf = 0;
    if (disposed || frozen) return;
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
    lastTime = now;
    const moving = update(dt);
    draw();
    if (moving) schedule(); else lastTime = 0;
  };
  const schedule = () => { if (!raf && !disposed) raf = requestAnimationFrame(frame); };
  function invalidate() { schedule(); }

  const renderNow = () => {
    update(0);
    draw();
  };

  /* ---------- navigation ---------- */

  const afterMove = () => {
    bowVel += 0.3;
    swayClock = 0;
    swayLeft = opts.reducedMotion ? 0 : 7;
    lastTried = '';
    refreshWindow(false);
    invalidate();
  };

  const goTo = (page: number) => {
    if (!leaves.length) return;
    setLean(0);
    const clamped = Math.min(leaves.length - 1, Math.max(0, Math.round(page)));
    if (clamped === state.current) {
      // nothing further that way: let the page lift and fall back
      if (page > state.current && !opts.reducedMotion) { nudgeVel = 1.05; invalidate(); }
      return;
    }
    // carry any hover lift into the turn so the page does not jump
    if (clamped > state.current) state.t[state.current] = Math.max(state.t[state.current], peekForward);
    if (clamped < state.current && state.current > 0) state.t[state.current - 1] = Math.min(state.t[state.current - 1], 1 - peekBack);
    peekForward = 0; peekBack = 0; peekForwardVel = 0; peekBackVel = 0;
    ensureLayers(clamped);
    setCurrent(state, clamped);
    afterMove();
  };

  /* ---------- pointer ---------- */

  /** What lies under a point of the window on the stage: a poster, the closed book, or nothing. */
  const stageHit = (clientX: number, clientY: number): StageProp | 'book' | null => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(pagePlane, hit)) return null;
    for (let i = propMeshes.length - 1; i >= 0; i -= 1) {
      const prop = propMeshes[i].prop;
      if (prop.dealtFrom) continue;   // not on the mat until its set is opened
      if (prop.still || prop.held) continue;   // only to be read, or not shown yet
      if (Math.abs(hit.x - prop.x) <= prop.w / 2 && Math.abs(hit.y - prop.y) <= prop.h / 2) {
        // (the edges of cards lying under a poster are that poster's)
        return prop.under ? stageSpec?.props.find((each) => each.id === prop.under) ?? prop : prop;
      }
    }
    return Math.abs(hit.x) <= 0.52 && Math.abs(hit.y) <= pageH / 2 + 0.02 ? 'book' : null;
  };
  /** While a set of cards is open: the card that can be picked under a point of the window, where it lies in the open row. */
  const pickHit = (clientX: number, clientY: number): StageProp | null => {
    if (!focus || !focusBox || away > 0.05) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(pagePlane, hit)) return null;
    const lead = focus;
    return propMeshes.map((item) => item.prop).find((prop) => prop.pick && prop.dealtFrom === lead.id && prop.open
      && Math.abs(hit.x - prop.open.x) <= prop.w / 2 && Math.abs(hit.y - prop.open.y) <= prop.h / 2) ?? null;
  };
  /** Far from the book (the wide view), or down at a poster: the book's own page turning is switched off. */
  const offBook = (): boolean => far() && (away > 0.5 || focus !== null);

  const raycaster = new Raycaster();
  const pagePlane = new Plane(new Vector3(0, 0, 1), 0);
  const hit = new Vector3();
  const ndc = new Vector2();

  const pageUv = (clientX: number, clientY: number): { u: number; v: number } | null => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(pagePlane, hit)) return null;
    return { u: hit.x - bookGroup.position.x, v: (hit.y - bookGroup.position.y) / pageH + 0.5 };
  };

  const pagePixelWidth = (): number => {
    const rect = canvas.getBoundingClientRect();
    const a = new Vector3(0, 0, 0).project(camera);
    const b = new Vector3(1, 0, 0).project(camera);
    return Math.max(120, Math.abs(b.x - a.x) * 0.5 * rect.width);
  };

  interface Press { id: number; x: number; y: number; dir: 0 | 1 | -1; base: number; moved: boolean; samples: Array<{ time: number; t: number }> }
  let press: Press | null = null;

  const setHover = (clientX: number, clientY: number) => {
    const uv = pageUv(clientX, clientY);
    let forward = 0;
    let back = 0;
    let cursor = 'default';
    if (leanTarget) {
      cursor = 'zoom-out';
    } else if (uv && uv.v > -0.06 && uv.v < 1.06) {
      const top = leaves[state.current];
      const onCta = top?.cta && uv.u >= top.cta.u0 && uv.u <= top.cta.u1 && uv.v >= top.cta.v0 && uv.v <= top.cta.v1;
      if (onCta) cursor = 'pointer';
      else if (uv.u > (spread ? 0.02 : 0.4) && uv.u < 1.05) {
        if (state.current < leaves.length - 1) { cursor = 'pointer'; if (uv.u > 0.74) forward = 0.085; }
      } else if (uv.u > (spread ? -1.05 : -0.3) && uv.u <= (spread ? -0.02 : 0.4) && state.current > 0) {
        // on a spread the left page is for reading: its outer edge turns back, the rest of it leans in
        cursor = spread && uv.u >= -0.8 ? 'zoom-in' : 'pointer';
        if (spread ? uv.u < -0.8 : uv.u < 0.08) back = 0.07;
      }
    }
    canvas.style.cursor = cursor;
    if (forward !== peekForwardTarget || back !== peekBackTarget) {
      peekForwardTarget = forward;
      peekBackTarget = back;
      invalidate();
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (event.pointerType === 'mouse' && rect.width && rect.height) {
      tiltTarget.set(
        Math.min(1, Math.max(-1, ((event.clientX - rect.left) / rect.width) * 2 - 1)),
        Math.min(1, Math.max(-1, -(((event.clientY - rect.top) / rect.height) * 2 - 1))),
      );
      invalidate();
    }
    if (event.pointerType === 'mouse' && rect.width && rect.height) {
      sunLeanTarget.set((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5);
    }
    if (event.pointerType === 'mouse') {
      const uv = pageUv(event.clientX, event.clientY);
      pointerUv = uv && uv.u > -0.04 && uv.u < 1.04 && uv.v > -0.04 && uv.v < 1.04 ? uv : null;
    }
    if (offBook()) {
      if (stageSpec && event.pointerType === 'mouse') {
        const picked = focus ? pickHit(event.clientX, event.clientY) : null;
        const under = focus ? picked : stageHit(event.clientX, event.clientY);
        const next = under && under !== 'book' ? under.id : null;
        if (next !== hoverProp) { hoverProp = next; invalidate(); opts.onHover?.(next); }
        canvas.style.cursor = focus ? (picked ? 'pointer' : 'zoom-out') : under ? 'pointer' : 'default';
      }
      return;
    }
    if (!press || press.id !== event.pointerId) {
      if (event.pointerType === 'mouse') setHover(event.clientX, event.clientY);
      return;
    }
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) press.moved = true;
    if (press.dir === 0 && Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.1) {
      const dir = dx < 0 ? 1 : -1;
      const leafIndex = dir === 1 ? state.current : state.current - 1;
      if (leafIndex >= 0 && leafIndex < leaves.length - 1) {
        state.t[leafIndex] = effectiveT(leafIndex);
        if (beginDrag(state, dir)) {
          setLean(0);
          press.dir = dir;
          press.base = state.t[leafIndex];
          press.x = event.clientX;
          peekForward = 0; peekBack = 0; peekForwardTarget = 0; peekBackTarget = 0;
          if (dir === 1) { ensureLayers(Math.min(leaves.length - 1, state.current + 1)); ensureBack(state.current, true); }
        }
      } else if (dir === 1 && !opts.reducedMotion) {
        nudgeVel = 0.9;
      }
    }
    if (press.dir !== 0) {
      const span = pagePixelWidth() * 0.92;
      const travel = (press.x - event.clientX) / span;
      const t = press.base + travel;
      updateDrag(state, t);
      press.samples.push({ time: performance.now(), t: Math.min(1, Math.max(0, t)) });
      if (press.samples.length > 6) press.samples.shift();
      invalidate();
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, dir: 0, base: 0, moved: false, samples: [] };
    canvas.setPointerCapture?.(event.pointerId);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!press || press.id !== event.pointerId) return;
    const current = press;
    press = null;
    canvas.releasePointerCapture?.(event.pointerId);
    if (current.dir !== 0) {
      const samples = current.samples;
      let velocity = 0;
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const span = (last.time - first.time) / 1000;
        if (span > 0.012 && performance.now() - last.time < 120) velocity = (last.t - first.t) / span;
      }
      endDrag(state, velocity);
      afterMove();
      return;
    }
    if (offBook()) {
      if (!stageSpec || current.moved) return;
      if (focus) { opts.onProp?.(pickHit(event.clientX, event.clientY)?.id ?? null); return; }
      const under = stageHit(event.clientX, event.clientY);
      if (under === 'book') opts.onBookPick?.();
      else if (under) opts.onProp?.(under.id);
      return;
    }
    if (current.moved) return;
    if (leanTarget) { setLean(0); return; }
    const uv = pageUv(event.clientX, event.clientY);
    if (!uv || uv.v < -0.08 || uv.v > 1.08) return;
    const top = leaves[state.current];
    if (top?.cta && uv.u >= top.cta.u0 && uv.u <= top.cta.u1 && uv.v >= top.cta.v0 && uv.v <= top.cta.v1) {
      opts.onCta?.(top.cta.href);
      return;
    }
    if (uv.u > (spread ? 0.02 : 0.4) && uv.u < 1.08) goTo(state.current + 1);
    else if (spread && state.current > 0 && uv.u >= -0.8 && uv.u <= -0.02) setLean(-1);
    else if (uv.u > (spread ? -1.08 : -0.35) && uv.u <= (spread ? -0.02 : 0.4)) goTo(state.current - 1);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (!press || press.id !== event.pointerId) return;
    if (press.dir !== 0) { endDrag(state, 0); afterMove(); }
    press = null;
  };

  const onPointerLeave = () => {
    pointerUv = null;
    tiltTarget.set(0, 0);
    peekForwardTarget = 0;
    peekBackTarget = 0;
    invalidate();
  };

  let wheelSum = 0;
  let wheelLock = 0;
  const onWheel = (event: WheelEvent) => {
    if (offBook()) return;
    event.preventDefault();
    const now = performance.now();
    if (now < wheelLock) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    wheelSum += delta;
    if (Math.abs(wheelSum) > 46) {
      goTo(state.current + (wheelSum > 0 ? 1 : -1));
      wheelSum = 0;
      wheelLock = now + 520;
    }
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    opts.onError?.(new Error('The 3D view was lost.'));
  };

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('webglcontextlost', onContextLost);

  /* ---------- books ---------- */

  const runSlide = (from: number, to: number, duration: number, ease: (x: number) => number) => new Promise<void>((resolve) => {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; resolve(); } };
    slide = { from, to, elapsed: 0, duration, ease, done: finish };
    invalidate();
    // frames can be starved while the tab is hidden; never let a swap hang on them
    window.setTimeout(() => { if (!finished) { slide = null; slideY = to; finish(); invalidate(); } }, duration * 1000 + 350);
  });

  const setBook = async (nextBook: FlipBook, nextImages: BookImages, startPage = 0, slowly = false) => {
    const mine = ++generation;
    const hadBook = Boolean(book);
    const firstTone = nextBook.pages[startPage]?.tone;
    displayColor(firstTone?.stage ?? nextBook.theme.stage, stageTarget);
    displayColor(firstTone?.stageLight ?? nextBook.theme.stageLight, stageLightTarget);
    if (!hadBook) { stage.copy(stageTarget); stageLight.copy(stageLightTarget); }
    // (on the stage a book is swapped where it lies: nothing slides away)
    if (hadBook && !opts.reducedMotion && !far()) await runSlide(slideY, -pageH * 2.6, 0.36, easeInCubic);
    if (disposed || mine !== generation) return;
    disposeLeaves();
    override.clear();
    book = nextBook;
    // the surface this book lies on, and the colour of its cover boards
    surface?.dispose();
    surface = null;
    const tableImage = nextBook.table ? nextImages.get(nextBook.table) : undefined;
    if (tableImage) {
      surface = new Texture(tableImage);
      surface.colorSpace = NoColorSpace;
      surface.wrapS = MirroredRepeatWrapping;
      surface.wrapT = MirroredRepeatWrapping;
      surface.minFilter = LinearMipmapLinearFilter;
      surface.magFilter = LinearFilter;
      surface.anisotropy = maxAnisotropy;
      surface.needsUpdate = true;
    }
    tableMaterial.uniforms.tSurface.value = surface ?? blank;
    tableMaterial.uniforms.uSurfaceAmt.value = surface ? 1 : 0;
    // the home page's sunlit mat: the sun is up and to the right there, so everything is lit and shaded from that side
    onMat = nextBook.surface === 'mat';
    tableMaterial.uniforms.uMat.value = onMat ? 1 : 0;
    light.set(onMat ? 0.3 : LIGHT.x, LIGHT.y, LIGHT.z);
    shadowSlant = onMat ? -SHADOW_SLANT : SHADOW_SLANT;
    if (nextBook.board) displayColor(nextBook.board, tableMaterial.uniforms.uBoard.value);
    tableMaterial.uniforms.uCorner.value = CORNER;   // one corner for every book (Bambu's used to be 0.13, all four corners; Adi, 2026-11-16: make the curvature consistent)
    // refit for this kind of book before its pages exist, so the fit cannot rebuild a half-set stack
    images = null;
    resize();
    // (a gradual book's pictures grow as they land: it keeps its own map, so the caller's is never changed)
    images = slowly ? new Map(nextImages) : nextImages;
    gradual = slowly;
    filledTold = !slowly;
    lastTried = '';
    opening += 1;
    held = null;
    buildLeaves();
    state = createFlipState(leaves.length);
    state.reduced = opts.reducedMotion;
    setCurrent(state, startPage);
    for (let i = 0; i < state.count; i += 1) state.t[i] = i < state.current ? 1 : 0;
    lastEmitted = -1;
    peekForward = 0; peekBack = 0; nudge = 0;
    refreshWindow(false);
    // now that the leaves exist, tell the page shell how the book is bound
    resize();
    if (opts.reducedMotion || far()) {
      // (coming from the home page the book is already lying there: nothing drops in)
      slideY = 0;
      slide = null;
    } else {
      void runSlide(pageH * 2.4, 0, 0.62, easeOutCubic);
    }
    swayClock = 0;
    swayLeft = opts.reducedMotion ? 0 : 7;
    invalidate();
    renderNow();
  };

  const observer = new ResizeObserver(() => resize());
  observer.observe(canvas);
  resize();

  if (opts.debug) {
    (window as unknown as { __flipbook?: unknown }).__flipbook = {
      get ready() { return leaves.length > 0 && Boolean(leaves[state.current]?.layered); },
      /** False while a gradual book still has pages to draw. */
      get filled() { return !gradual; },
      /** Each piece of a gradual book drawn so far: what, when (page clock) and how long it took. */
      get drawings() { return drawings.slice(); },
      get pageCount() { return leaves.length; },
      get page() { return state.current; },
      setLeaf(index: number, t: number) { override.set(index, t); },
      go(index: number) { goTo(index); },
      /** Lean in over a page of the open spread (-1 left, 1 right) or step back (0). */
      lean(side: -1 | 0 | 1) { setLean(side); },
      /** How far the view is from the reading view toward the home page's (1), set outright or moved over time. */
      setAway(value: number) { awayTween = null; away = value; },
      moveAway(to: number, seconds: number) { awayTween = { from: away, to, elapsed: 0, duration: seconds }; },
      hover(forward: number, back: number) { peekForwardTarget = forward; peekBackTarget = back; },
      /** Step the book forward by an exact amount of time and draw it, for frame-accurate captures. */
      advance(seconds: number) {
        frozen = true;
        let left = seconds;
        while (left > 1e-6) { const h = Math.min(1 / 60, left); update(h); left -= h; }
        draw();
      },
      clearOverrides() { override.clear(); popOverride = null; },
      freeze(value: boolean) { frozen = value; if (!value) { lastTime = 0; invalidate(); } },
      /** Try a table colour without editing the book: pass null to go back to the page's own. */
      setStage(value: { stage: string; light: string } | null) {
        stageOverride = value;
        applyStage();
        stage.copy(stageTarget);
        stageLight.copy(stageLightTarget);
        renderNow();
      },
      setPop(value: number | null) { popOverride = value; },
      /** The live page on a leaf (the one on top by default), for holding its story at one position. */
      live(index?: number) { return leaves[index ?? state.current]?.live ?? null; },
      setPagePointer(u: number | null, v = 0.5) { pointerUv = u === null ? null : { u, v }; },
      setPointer(x: number, y: number) { tiltTarget.set(x, y); tilt.set(x, y); tiltVel.set(0, 0); },
      jump(index: number) {
        override.clear();
        setCurrent(state, index);
        for (let i = 0; i < state.count; i += 1) { state.t[i] = i < state.current ? 1 : 0; state.vel[i] = 0; }
        refreshWindow(true);
        leaves.forEach((leaf, i) => { leaf.pop = i === state.current ? 1 : 0; leaf.popVel = 0; });
        slide = null; slideY = 0; swayLeft = 0; swayClock = 0;
        applyStage();
        stage.copy(stageTarget);
        stageLight.copy(stageLightTarget);
        renderNow();
      },
      settle() { slide = null; slideY = 0; swayLeft = 0; swayClock = 0; leaves.forEach((leaf, i) => { leaf.pop = i === state.current ? 1 : 0; leaf.popVel = 0; }); },
      renderNow,
      state() { return { current: state.current, t: Array.from(state.t), portrait, pageH, dist }; },
    };
  }

  return {
    setBook,
    addImages(forBook: FlipBook, more: BookImages) {
      if (disposed || forBook !== book || !images || !gradual) return;
      const have = images;
      more.forEach((picture, src) => have.set(src, picture));
      lastTried = '';
      pump();
    },
    next: () => goTo(state.current + 1),
    prev: () => goTo(state.current - 1),
    goTo,
    lean: setLean,
    get leaning() { return leanTarget === 1; },
    arrive() {
      if (!far()) return;
      const mine = ++opening;
      held = null;
      void moveAway(0, 1.25).then(() => {
        if (disposed || mine !== opening || state.current !== 0 || leaves.length <= 1) return;
        // A gradual book opens once its first spread is drawn (its pictures were asked for first, and it is drawn now
        // that the view has come down and nothing moves), or after a moment anyway: then its pages are paper with their
        // words until their pictures land. (On a timer, not on frames: a hidden window starves frames.)
        const open = () => { if (mine !== opening || !held) return; held = null; if (!disposed && state.current === 0) goTo(1); };
        held = () => { if (firstSpreadDrawn()) open(); };
        held();
        if (held) { pump(); window.setTimeout(open, 1200); }
      });
    },
    async leave() {
      if (!far()) return;
      opening += 1;
      held = null;
      setLean(0);
      const wasOpen = state.current > 0;
      if (wasOpen) goTo(0);
      // give the cover time to close before the view lifts away
      if (wasOpen && !opts.reducedMotion) await new Promise<void>((resolve) => { window.setTimeout(resolve, 520); });
      await moveAway(1, 1.0);
    },
    get sunClock() { return sunClock; },
    get dawnLevel() { return dawnUniform.value; },
    setStage(next: StageSpec, alreadyLit = false) {
      // (the old props' materials and shapes go after the next frame, their textures then too unless a new prop shows the same picture)
      propMeshes.forEach((item) => { scene.remove(item.mesh, item.shadow); retired.push(item.mesh.material as ShaderMaterial, item.shadow.material as ShaderMaterial, item.mesh.geometry, item.shadow.geometry); });
      sweep = true;
      stageSpec = next;
      away = 1;
      focus = null;
      if (!alreadyLit) {
        dawnUniform.value = opts.reducedMotion ? 1 : 0;
        litTold = false;
      }
      propMeshes = next.props.map((prop, i) => {
        const texture = propTextureFor(prop.image);
        // (a curled sheet needs a finer grid to bend)
        const bend = (prop.curl ?? 0) > 0;
        const mesh = new Mesh(bend ? new PlaneGeometry(prop.w, prop.h, 40, 56) : new PlaneGeometry(prop.w, prop.h), new ShaderMaterial({
          vertexShader: bend ? PROP_CURL_VERTEX : PROP_VERTEX,
          fragmentShader: PROP_FRAGMENT,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            tMap: { value: texture }, tSun: { value: sunTarget.texture }, uScreen: { value: screenSize },
            uSize: { value: new Vector2(prop.w, prop.h) }, uRadius: { value: prop.radius }, uCutout: { value: prop.cutout ? 1 : 0 },
            uAlpha: { value: 0 }, uDawn: dawnUniform, uCurl: { value: prop.curl ?? 0 },
          },
        }));
        // the shadow's sheet reaches well past the card, down and to the left most of all
        const reach = 150 * next.unit;
        const shadow = new Mesh(new PlaneGeometry(prop.w + reach * 2, prop.h + reach * 2), new ShaderMaterial({
          vertexShader: PROP_VERTEX,
          fragmentShader: prop.alphaShadow ? PROP_ALPHA_SHADOW_FRAGMENT : PROP_SHADOW_FRAGMENT,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uSize: { value: prop.standing ? new Vector2(prop.w * 0.78, prop.h * 0.2) : new Vector2(prop.w, prop.h) },
            uSheet: { value: new Vector2(prop.w + reach * 2, prop.h + reach * 2) },
            uRadius: { value: prop.standing ? prop.h * 0.08 : prop.cutout ? prop.h * 0.06 : prop.radius }, uLift: { value: 0 }, uUnit: { value: next.unit },
            uAlpha: { value: 0 }, uDawn: dawnUniform, uScreen: { value: screenSize },
            // (the outline and the lifted corner, for a shadow that follows the picture: PROP_ALPHA_SHADOW_FRAGMENT)
            tMap: { value: texture }, uCurl: { value: prop.curl ?? 0 },
          },
        }));
        mesh.frustumCulled = false;
        shadow.frustumCulled = false;
        mesh.rotation.z = (-(prop.turn ?? 0) * Math.PI) / 180;
        shadow.rotation.z = mesh.rotation.z;
        // above the mat, under the book: every shadow first, then every card
        shadow.renderOrder = 1;
        // (a card lying under another is drawn just beneath it, in the order listed)
        const above = prop.under ? next.props.findIndex((each) => each.id === prop.under) : -1;
        mesh.renderOrder = above >= 0 ? 2 + above * 0.001 - 0.0005 + i * 1e-7 : 2 + i * 0.001;
        scene.add(shadow, mesh);
        return { prop, mesh, shadow, texture, lift: 0 };
      });
      resize();
      invalidate();
    },
    screenRect(id: string) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!stageSpec || !w || !h) return null;
      const item = id === 'book' ? null : propMeshes.find((each) => each.prop.id === id);
      if (id !== 'book' && !item) return null;
      // (the live book is found where stageHit finds it)
      const corners = item
        ? [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, y]) => new Vector3(x * item.prop.w, y * item.prop.h, 0).applyMatrix4(item.mesh.matrixWorld))
        : [[-0.52, -pageH / 2], [0.52, -pageH / 2], [-0.52, pageH / 2], [0.52, pageH / 2]].map(([x, y]) => new Vector3(x, y, 0));
      let left = Infinity; let right = -Infinity; let top = Infinity; let bottom = -Infinity;
      for (const corner of corners) {
        const point = corner.project(camera);
        const px = (point.x * 0.5 + 0.5) * w;
        const py = (-point.y * 0.5 + 0.5) * h;
        left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
      }
      return { left, top, width: right - left, height: bottom - top };
    },
    setPropImage(id: string, image: HTMLImageElement | HTMLCanvasElement) {
      const item = propMeshes.find((each) => each.prop.id === id);
      if (!item || disposed) return;
      // (the same picture handed again has been drawn again: it is sent again)
      if (image === item.prop.image) { item.texture.needsUpdate = true; invalidate(); return; }
      item.prop.image = image;
      item.texture = propTextureFor(image);
      (item.mesh.material as ShaderMaterial).uniforms.tMap.value = item.texture;
      const shade = (item.shadow.material as ShaderMaterial).uniforms;
      if (shade.tMap) shade.tMap.value = item.texture;
      // (the one it showed goes after the next frame, if nothing else shows it)
      sweep = true;
      invalidate();
    },
    screenPoint(id: string, u: number, v: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const item = propMeshes.find((each) => each.prop.id === id);
      if (!item || !w || !h) return null;
      item.mesh.updateMatrixWorld(true);
      const point = new Vector3((u - 0.5) * item.prop.w, (0.5 - v) * item.prop.h, 0).applyMatrix4(item.mesh.matrixWorld).project(drawnView);
      return { x: (point.x * 0.5 + 0.5) * w, y: (-point.y * 0.5 + 0.5) * h };
    },
    lift(id: string | null) {
      if (id === hoverProp) return;
      hoverProp = id;
      invalidate();
    },
    setScroll(units: number) {
      if (units === stageScroll) return;
      stageScroll = units;
      scrolledAt = performance.now();
      invalidate();
    },
    dawn() {
      if (dawning) return;
      dawning = true;
      invalidate();
      // a hidden window starves frames: the room must never stay dark
      window.setTimeout(() => { if (!disposed && dawnUniform.value < 1) { dawnUniform.value = 1; invalidate(); } }, 3600);
    },
    stagePoint(x: number, y: number) {
      if (!stageSpec) return null;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return null;
      // the resting wide view, as resize() places it to measure the stage's frame
      const eye = new PerspectiveCamera(FOV, w / h, 0.05, 40);
      eye.position.set(awayTarget.x, awayTarget.y - awayDist * Math.sin(STAGE_PITCH), awayDist * Math.cos(STAGE_PITCH));
      eye.up.set(0, 1, 0);
      eye.lookAt(awayTarget);
      eye.updateMatrixWorld(true);
      const ray = new Raycaster();
      ray.setFromCamera(new Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), eye);
      const point = new Vector3();
      return ray.ray.intersectPlane(new Plane(new Vector3(0, 0, 1), 0), point) ? { x: point.x, y: point.y } : null;
    },
    async focusOn(id: string | null) {
      if (!stageSpec) return;
      const next = id ? stageSpec.props.find((prop) => prop.id === id) ?? null : null;
      if (next) {
        focus = next;
        // does this card open into a set? Then the camera frames the whole set where it will lie
        const set = [next, ...stageSpec.props.filter((prop) => prop.dealtFrom === next.id)];
        if (set.length > 1) {
          const xs = set.map((prop) => (prop.open ?? prop).x);
          const ys = set.map((prop) => (prop.open ?? prop).y);
          const left = Math.min(...xs) - next.w / 2; const right = Math.max(...xs) + next.w / 2;
          const low = Math.min(...ys) - next.h / 2; const high = Math.max(...ys) + next.h / 2;
          focusBox = { x: (left + right) / 2, y: (low + high) / 2, w: right - left, h: high - low };
        } else focusBox = null;
        hoverProp = null;
        canvas.style.cursor = 'zoom-out';
        await moveAway(0, 1.15);
      } else if (focus) {
        await moveAway(1, 1.0);
        focus = null;
        focusBox = null;
        canvas.style.cursor = 'default';
        invalidate();
      }
    },
    get page() { return state.current; },
    get pageCount() { return leaves.length; },
    get spread() { return spread; },
    addLayer(layer: MatLayer) {
      layer.attach({ scene, renderer, sunTexture: sunTarget.texture, screenSize, dawn: dawnUniform, maxAnisotropy, invalidate });
      layers.push(layer);
      invalidate();
      return () => {
        const at = layers.indexOf(layer);
        if (at < 0) return;
        layers.splice(at, 1);
        layer.dispose();
        invalidate();
      };
    },
    resize,
    dispose() {
      disposed = true;
      layers.splice(0).forEach((layer) => layer.dispose());
      generation += 1;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      disposeLeaves();
      retired.splice(0).forEach((item) => item.dispose());
      propTextures.forEach((texture) => texture.dispose());
      propTextures.clear();
      leafGeometry.dispose();
      table.geometry.dispose();
      tableMaterial.dispose();
      surface?.dispose();
      sunTarget.dispose();
      sunMaterial.dispose();
      sunQuad.geometry.dispose();
      blank.dispose();
      renderer.dispose();
      if (opts.debug) delete (window as unknown as { __flipbook?: unknown }).__flipbook;
    },
  };
}
