/**
 * The timeline on the mat, drawn in the flip-book engine's own scene (a MatLayer): the cards, the masking tape with its
 * printed years, and the roll that lays it. Same mat, same window light, same shadows as the posters: the cards use the
 * posters' own shaders (shaders.ts PROP_FRAGMENT, with two faces and a crop added; PROP_SHADOW_FRAGMENT unchanged).
 *
 * Where things lie and how they move is worked out in ./timelineScene.ts (plain numbers, tested). This file only turns
 * that into meshes, once per frame inside the engine's loop, and moves the HTML links that lie over the cards (writes
 * only, no layout reads).
 */
import {
  BoxGeometry, CanvasTexture, ClampToEdgeWrapping, CylinderGeometry, Group, LatheGeometry, LinearFilter, LinearMipmapLinearFilter, Mesh,
  NoColorSpace, PlaneGeometry, ShaderMaterial, SphereGeometry, Vector2, Vector3, type BufferGeometry, type PerspectiveCamera,
} from 'three';
import { PROP_FRAGMENT, PROP_SHADOW_FRAGMENT, PROP_VERTEX } from '../flipbook/shaders';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';
import { whenQuiet } from '../flipbook/quiet';
import {
  PILE_PAD, drawFace, drawPileShadow, drawSheet, drawTape, faceCanvas, sheetRects, sheetSize, type MatStop, type Pictures,
} from './timelineCards';
import {
  OPEN_REDUCED_S, PEN, PEN_START, ROLL, TAPE, cardPose, cardSize, clamp01, holdLength, introDue, introEnd, layoutCards, openingOrder, outCubic,
  penRows, penStep, penStop, penTarget, planFlights, pushedTops, rollRadius, rollTop, rollY, smooth, stepOpenTo, wantOpen, yOf,
  type Flight, type Hold, type PlacedCard,
} from './timelineScene';

/* ---------- shaders ---------- */

/**
 * PROP_FRAGMENT with two faces, read from the card's inner top corner (uAnchor 1: the right edge) over the part the card
 * is now (uCrop). An opening card turns to its open face the moment it starts to grow (a clean swap, never a mix of the two), and
 * the growing card then shows more and more of that face; a closing card shrinks over its open face and turns back at
 * the very end. The card is one opaque sheet throughout.
 */
const CARD_FRAGMENT = PROP_FRAGMENT
  .replace('uniform sampler2D tMap;', 'uniform sampler2D tMap;\nuniform sampler2D tOpen;\nuniform vec2 uCrop;\nuniform float uAnchor;\nuniform float uOpen;')
  .replace('vec4 tex = texture2D(tMap, vUv);', `vec2 at = vec2(uAnchor > 0.5 ? 1.0 - (1.0 - vUv.x) * uCrop.x : vUv.x * uCrop.x, 1.0 - (1.0 - vUv.y) * uCrop.y);
  vec4 tex = vec4(mix(texture2D(tMap, at).rgb, texture2D(tOpen, at).rgb, step(0.06, uOpen)), 1.0);`);

/**
 * Tinker Verse's pile of prints: the posters' own shader as a cut-out (the picture's own outline, the mat showing
 * round the prints). Its picture is sent premultiplied, so the prints' edges stay clean where they meet the clear mat.
 */
const PILE_FRAGMENT = PROP_FRAGMENT.replace('vec4 tex = texture2D(tMap, vUv);', 'vec4 tex = texture2D(tMap, vUv);\n  tex.rgb /= max(tex.a, 0.0001);');
/** The pile's shadow on the mat: its own soft shape, drawn once (timelineCards.ts drawPileShadow), in the colour and
 *  light of every shadow on the mat. */
const PILE_SHADOW_FRAGMENT = PROP_SHADOW_FRAGMENT
  .replace('uniform vec2 uSize;', 'uniform sampler2D tMap;\nuniform vec2 uSize;')
  .replace(/void main\(\) \{[\s\S]*\}\s*$/, `void main() {
  float a = texture2D(tMap, vUv).a * uAlpha;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), a);
}
`);
/** How long the pile takes to rise a little under the pointer, or settle back. */
const PILE_LIFT_S = 0.22;

/** The sheet a picked-up stop turns into: the posters' own shader, darkened as it turns away from the window. */
const SHEET_FRAGMENT = PROP_FRAGMENT
  .replace('uniform float uDawn;', 'uniform float uDawn;\nuniform float uShade;')
  .replace('col = mix(col, lit, 0.2) * dawnLight();', 'col = mix(col, lit, 0.2) * dawnLight() * uShade;');

const TAPE_VERTEX = /* glsl */ `
varying vec2 vUv; varying float vY;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`;
/** The tape: its picture, a little see-through, lit by the window like the cards; cut off where the roll still holds it. */
const TAPE_FRAGMENT = /* glsl */ `
uniform sampler2D tMap; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uEnd; uniform float uOpacity;
varying vec2 vUv; varying float vY;
void main() {
  if (vY < uEnd) discard;
  vec4 t = texture2D(tMap, vUv);
  float a = t.a * uOpacity;
  if (a < 0.004) discard;
  vec3 col = t.rgb;
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  gl_FragColor = vec4(mix(col, lit, 0.32), a);
}`;
const ROLL_VERTEX = /* glsl */ `
varying vec2 vUv; varying vec3 vN;
void main() { vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
/**
 * The roll of the same tape: its side shows the tape's ruler wound round and the edge where the tape comes off; its two
 * ends show the wound layers and the cardboard core (slightly telescoped, as a used roll is, so they show from above).
 */
const ROLL_FRAGMENT = /* glsl */ `
uniform sampler2D tSun; uniform vec2 uScreen; uniform vec3 uLight; uniform float uPart; uniform float uR; uniform float uRc; uniform float uFlip;
varying vec2 vUv; varying vec3 vN;
void main() {
  vec3 paper = vec3(0.984, 0.965, 0.918); vec3 edge = vec3(0.89, 0.851, 0.753); vec3 navy = vec3(0.094, 0.125, 0.31);
  vec3 col = paper;
  if (uPart < 0.5) {
    float a = fract(vUv.x * 28.0);
    float tick = (1.0 - smoothstep(0.03, 0.06, a)) * (1.0 - smoothstep(0.16, 0.2, min(vUv.y, 1.0 - vUv.y)));
    col = mix(col, navy, tick * 0.75);
    col = mix(col, edge, 1.0 - smoothstep(0.0, 0.04, min(vUv.y, 1.0 - vUv.y)));
    float crepe = fract(vUv.x * 300.0); col *= 1.0 - 0.03 * step(0.6, crepe);
    float du = fract(vUv.x - 0.02);
    col *= 1.0 - 0.32 * (1.0 - smoothstep(0.0, 0.018, du));
    col = mix(col, vec3(1.0), 0.5 * (1.0 - smoothstep(0.0, 0.004, abs(fract(vUv.x + 0.5) - 0.5 - 0.019))));
  } else if (uPart < 2.5) {
    float k = uFlip > 0.5 ? 1.0 - vUv.y : vUv.y;
    float rp = mix(uR, uRc, k);
    float layer = fract(rp / 1.7);
    col = mix(edge, paper, 0.45 + 0.55 * smoothstep(0.15, 0.6, layer));
    col = mix(col, edge * 0.92, 1.0 - smoothstep(0.0, 1.2, rp - uRc - 0.6));
  } else {
    col = vec3(0.78, 0.66, 0.48) * (0.92 + 0.08 * step(0.5, fract(vUv.x * 40.0)));
  }
  col *= clamp(0.36 + 0.76 * dot(normalize(vN), uLight), 0.32, 1.12);
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  gl_FragColor = vec4(mix(col, lit, 0.3), 1.0);
}`;
/** How long picking a stop up and turning it over takes, and putting it back. */
const PICK_S = 0.9;
const PICK_BACK_S = 0.7;
/** The turn hands over from the card to its back a little short of edge-on (79 degrees), so it never vanishes for a frame. */
const EDGE_ON = Math.PI * 0.44;
/** The window's light comes from the top right (shadows fall down and to the left). */
const LIGHT = new Vector3(0.35, 0.45, 0.9).normalize();

/* ---------- the pen ---------- */

const PEN_VERTEX = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/**
 * The marker's plastic and steel, lit by the same window as everything on the mat: its colour (and the barrel's print),
 * a soft diffuse from the top right, a highlight that stays under the window while the barrel turns (the light and the
 * eye are fixed, only the normal turns), a little of the blue mat bounced into its underside, and the window's dappled
 * sunlight laid over it as on the cards.
 */
const PEN_FRAGMENT = /* glsl */ `
uniform vec3 uColor; uniform float uShine; uniform float uGloss; uniform sampler2D tPrint; uniform float uPrint;
uniform sampler2D tSun; uniform vec2 uScreen; uniform vec3 uLight; uniform float uAlpha;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 col = uColor;
  if (uPrint > 0.5) { vec4 p = texture2D(tPrint, vUv); col = mix(col, p.rgb, p.a); }
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float diff = max(dot(N, uLight), 0.0);
  float under = clamp(-N.z, 0.0, 1.0);
  vec3 V = normalize(cameraPosition - vW);
  vec3 H = normalize(uLight + V);
  float nh = max(dot(N, H), 0.0);
  float spec = pow(nh, uGloss) * uShine;
  float sheen = pow(nh, 6.0) * uShine * 0.18;
  vec3 c = col * (0.40 + 0.70 * diff) * (1.0 - 0.32 * under) + vec3(0.03, 0.07, 0.16) * under * 0.55;
  c += vec3(1.0, 0.98, 0.94) * (spec + sheen);
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * c * sun, 1.0 - 2.0 * (1.0 - c) * (1.0 - sun), step(0.5, sun));
  gl_FragColor = vec4(mix(c, lit, 0.26), uAlpha);
}`;

/** The barrel's print: a thin ruled band and small navy lettering, wound round the barrel (u round it, v along it). */
function drawPenPrint(): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);
  // (v runs along the barrel, from the cap end at the bottom of the picture to the end plug at its top; u runs round it)
  ctx.fillStyle = 'rgba(24,32,79,0.92)';
  ctx.fillRect(0, 452, 1024, 9);
  ctx.fillRect(0, 470, 1024, 3);
  // the lettering, along the barrel, on one side of it (a quarter of the way round)
  ctx.save();
  ctx.translate(300, 250); ctx.rotate(-Math.PI / 2);
  ctx.font = '700 64px "FB Geist", Arial, sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText('FINE', -150, 0);
  ctx.font = '500 44px "FB Geist", Arial, sans-serif'; ctx.fillText('0.8 mm', 20, 2);
  ctx.restore();
  return c;
}

/** The pen's shape (mat pixels): a cap with a clip at one end, a cream barrel, an end plug. Along its local y axis. */
const CAP_PROFILE: [number, number][] = [[0, -81], [5.6, -81], [8.3, -80.3], [9.3, -79.1], [9.6, -77.4], [9.6, -31.2], [9.35, -30.4], [9.0, -30.2]];
const END_PROFILE: [number, number][] = [[9.0, 74], [8.75, 76.4], [8.2, 77.2], [7.9, 79.4], [7.0, 80.6], [4.5, 81], [0, 81]];
/** The radius it rolls on (its cap). */
const PEN_ROLL_R = 9.6;

/* ---------- the layer ---------- */

export interface TimelinePlace {
  /** the stage's wide-view frame (table units): one 1440 by 900 drawing of the mat */
  frame: { x: number; y: number; w: number; h: number };
  /** table units per mat pixel (the stage's `unit`) */
  unit: number;
}

/** What the page tells the layer each frame: where the timeline is held on the page, and how many CSS px make a table unit. */
export interface TimelinePage {
  hold(): Hold | null;
  perUnit(): number | null;
}

/** The HTML lying over the cards: one button per card (Tinker Verse's pile too), and words placed on the mat. */
export interface TimelineOverlay {
  cards: Map<string, HTMLElement>;
  /** elements with data-mx / data-my (mat pixels) are placed there, scaled by --k */
  words: HTMLElement[];
  root: HTMLElement;
  /** Links lying over the rows on the back of a picked stop (by row; for Tinker Verse, its prints and Instagram links,
   *  timelineCards.ts tinkerLinks), and the back itself */
  sheet?: { box: HTMLElement | null; rows: HTMLElement[] };
}

interface CardMesh {
  placed: PlacedCard; flight: Flight; step: number;
  rest: CanvasTexture; open: CanvasTexture | null;
  mesh: Mesh; mat: ShaderMaterial; shadow: Mesh; shade: ShaderMaterial;
}

export interface TimelineLayer extends MatLayer {
  /** Draws every face and loads it to the GPU, a little at a time. Resolves when the timeline can be shown. */
  ready: Promise<void>;
  bindOverlay(overlay: TimelineOverlay | null): void;
  /** For review captures: the intro's clock and every stop's open amount. */
  state(): {
    intro: number; introEnd: number; open: number[]; current: number;
    pen: { y: number; target: number; angle: number }; hover: number; picked: string | null; pick: number;
    tops: Record<string, number>;
    /** how far Tinker Verse's pile has risen under the pointer, 0 to 1 */
    pile: number;
  };
  /** Where the pointer is over the window (CSS px), or null when it has left. Hover follows its moves only. */
  pointer(x: number, y: number): void;
  pointerLeft(): void;
  /** Picks a stop up and turns it over (its story on its back), or puts it back (null). */
  pick(id: string | null): void;
  readonly picked: string | null;
  /** Called when the picked stop has landed or gone back (for the page's pills). */
  onPick: ((id: string | null, settled: boolean) => void) | null;
}

export function createTimelineLayer(opts: {
  stops: MatStop[]; pictures: Pictures; place: TimelinePlace; page: TimelinePage; reduced: boolean;
}): TimelineLayer {
  const { stops, pictures, place, page, reduced } = opts;
  const u = place.unit;
  const cards = layoutCards(stops);
  const steps = openingOrder(cards);
  const plan = planFlights(cards);
  const endT = introEnd(plan);
  const open = steps.map(() => 0);
  /* the pen: the row it stops at for each step, where it is, its speed, and how far it has turned */
  const rows = penRows(steps);
  const pen = { y: PEN_START, v: 0 };
  let penTargetY = PEN_START;
  let penAngle = 0;
  /* hover: the step under the pointer (latched), and the one it may change to once the pointer has rested there */
  let hover = -1;
  let pending = -1; let pendingT = 0;
  let pointerAt: { x: number; y: number } | null = null; let pointerMoved = false;
  const rects = new Map<string, { l: number; t: number; w: number; h: number }>();
  /* the stop picked up and turned over: which, and how far (0 lying in its place, 1 the sheet down in the middle) */
  let pickedId: string | null = null; let pickTo = 0; let pickK = 0;
  let pickFrom: { x: number; y: number; w: number; h: number; k: number } | null = null;
  let onPick: ((id: string | null, settled: boolean) => void) | null = null;
  let frozenWant: number[] | null = null; let lastWant: number[] = open.map(() => 0);
  /* Tinker Verse's pile: it is not a scroll step (it never grows); under the pointer it rises a little */
  const pileId = cards.find((c) => c.stop.fill)?.stop.id ?? null;
  let pileLift = 0; let pileWant = 0;
  /** The step whose card is under a point of the window (CSS px), by where the cards are drawn now. */
  const hitStep = (x: number, y: number): number => {
    let hit = -1;
    steps.forEach((card, i) => { const r = rects.get(card.stop.id); if (r && x >= r.l && x <= r.l + r.w && y >= r.t && y <= r.t + r.h) hit = i; });
    return hit;
  };
  let ctx: MatLayerContext | null = null;
  let introT = -1;
  let current = -1;
  let overlay: TimelineOverlay | null = null;
  let offset = 0;
  const meshes: CardMesh[] = [];
  const disposables: { dispose(): void }[] = [];
  const unitPlane = new PlaneGeometry(1, 1);
  disposables.push(unitPlane);
  let visible = false;
  let resolveReady: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  /** mat pixels (of the timeline's window) to table units */
  const tx = (X: number) => place.frame.x + (X - 720) * u;
  const ty = (Y: number) => place.frame.y - (Y - 450) * u - offset;

  const texture = (canvas: HTMLCanvasElement, maxAniso: number): CanvasTexture => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = NoColorSpace; t.wrapS = ClampToEdgeWrapping; t.wrapT = ClampToEdgeWrapping;
    t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.anisotropy = maxAniso;
    disposables.push(t);
    return t;
  };

  /* the tape and the roll */
  let tape: Mesh | null = null; let tapeMat: ShaderMaterial | null = null;
  let tapeShadow: Mesh | null = null; let tapeShade: ShaderMaterial | null = null;
  let roll: { group: Group; side: Mesh; endA: Mesh; endB: Mesh; core: Mesh; mats: ShaderMaterial[]; r: number } | null = null;
  let rollShadow: Mesh | null = null; let rollShade: ShaderMaterial | null = null;
  let penParts: { group: Group; mats: ShaderMaterial[] } | null = null;
  let penShadow: Mesh | null = null; let penShade: ShaderMaterial | null = null;
  let sheetMesh: Mesh | null = null; let sheetMat: ShaderMaterial | null = null;
  let sheetShadow: Mesh | null = null; let sheetShade: ShaderMaterial | null = null;
  let sheetTex: CanvasTexture | null = null; let sheetFor: string | null = null;
  const tapeLen = TAPE.bot - TAPE.top;

  const shadowMaterial = (dawn: { value: number }, screen: Vector2): ShaderMaterial => {
    const m = new ShaderMaterial({
      vertexShader: PROP_VERTEX, fragmentShader: PROP_SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uSize: { value: new Vector2(1, 1) }, uSheet: { value: new Vector2(1, 1) }, uRadius: { value: 14 * u }, uLift: { value: 0 },
        uUnit: { value: u }, uAlpha: { value: 0 }, uDawn: dawn, uScreen: { value: screen },
      },
    });
    disposables.push(m);
    return m;
  };
  /** The pile's shadow: its drawn shape, with the same uniforms as the others so the shared code can set them. */
  const pileShadowMaterial = (map: CanvasTexture, dawn: { value: number }, screen: Vector2): ShaderMaterial => {
    const m = shadowMaterial(dawn, screen);
    m.fragmentShader = PILE_SHADOW_FRAGMENT;
    m.uniforms.tMap = { value: map };
    m.needsUpdate = true;
    return m;
  };
  /** Lays the pile's shadow sheet under it: (x, y) the pile's middle (mat px), `cs` how much of its width faces up. */
  const pileShadowAt = (m: CardMesh, x: number, y: number, cs: number) => {
    const st = m.placed.stop;
    const SW = (st.restW + PILE_PAD.l + PILE_PAD.r) * u; const SH = (st.restH + PILE_PAD.t + PILE_PAD.b) * u;
    m.shadow.position.set(tx(x + ((PILE_PAD.r - PILE_PAD.l) / 2) * cs), ty(y + (PILE_PAD.b - PILE_PAD.t) / 2), 0.0005);
    m.shadow.scale.set(SW * Math.max(0.02, cs), SH, 1);
  };

  const attach = (c: MatLayerContext) => {
    ctx = c;
    const years: { y: number; label: string }[] = [];
    for (let yr = 2028; yr >= 2016; yr -= 1) years.push({ y: yOf(Date.UTC(yr, 0, 1)) - TAPE.top, label: String(yr - 1) });
    const tapeTex = texture(drawTape(TAPE.w, tapeLen, years), c.maxAnisotropy);
    tapeMat = new ShaderMaterial({
      vertexShader: TAPE_VERTEX, fragmentShader: TAPE_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { tMap: { value: tapeTex }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uEnd: { value: 1e6 }, uOpacity: { value: 0.9 } },
    });
    disposables.push(tapeMat);
    const tapeGeo = new PlaneGeometry(TAPE.w * u, tapeLen * u);
    disposables.push(tapeGeo);
    tape = new Mesh(tapeGeo, tapeMat); tape.frustumCulled = false; tape.renderOrder = 4;
    tapeShade = shadowMaterial(c.dawn, c.screenSize); tapeShade.uniforms.uUnit.value = u * 0.35; tapeShade.uniforms.uRadius.value = 2 * u;
    tapeShadow = new Mesh(unitPlane, tapeShade); tapeShadow.frustumCulled = false; tapeShadow.renderOrder = 3;
    // the roll: depth-tested against itself, drawn after everything lying flat
    const mk = (part: number, flip = 0) => {
      const m = new ShaderMaterial({
        vertexShader: ROLL_VERTEX, fragmentShader: ROLL_FRAGMENT, depthTest: true, depthWrite: true, transparent: true,
        uniforms: { tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uLight: { value: LIGHT }, uPart: { value: part }, uR: { value: ROLL.r0 }, uRc: { value: ROLL.rc }, uFlip: { value: flip } },
      });
      disposables.push(m);
      return m;
    };
    const mats = [mk(0), mk(1), mk(2, 1), mk(3)];
    const group = new Group(); const body = new Group(); body.rotation.z = Math.PI / 2; group.add(body);
    const side = new Mesh(new CylinderGeometry(1, 1, 1, 96, 1, true), mats[0]);
    const endA = new Mesh(new CylinderGeometry(1, 1, 1, 96, 1, true), mats[1]);
    const endB = new Mesh(new CylinderGeometry(1, 1, 1, 96, 1, true), mats[2]);
    const core = new Mesh(new CylinderGeometry(1, 1, 1, 48, 1, true), mats[3]);
    [side, endA, endB, core].forEach((m) => { m.frustumCulled = false; m.renderOrder = 40; body.add(m); });
    roll = { group, side, endA, endB, core, mats, r: -1 };
    rollShade = shadowMaterial(c.dawn, c.screenSize); rollShade.uniforms.uRadius.value = 8 * u;
    rollShadow = new Mesh(unitPlane, rollShade); rollShadow.frustumCulled = false; rollShadow.renderOrder = 4.5;
    // the pen: one group that rolls (turned about the pen's own axis), holding the parts laid along that axis
    const printTex = texture(drawPenPrint(), c.maxAnisotropy);
    const penMat = (color: number[], shine: number, gloss: number, printed = false) => {
      const m = new ShaderMaterial({
        vertexShader: PEN_VERTEX, fragmentShader: PEN_FRAGMENT, depthTest: true, depthWrite: true, transparent: true,
        uniforms: {
          uColor: { value: new Vector3(...color) }, uShine: { value: shine }, uGloss: { value: gloss }, tPrint: { value: printTex },
          uPrint: { value: printed ? 1 : 0 }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uLight: { value: LIGHT }, uAlpha: { value: 0 },
        },
      });
      disposables.push(m);
      return m;
    };
    const navy = [0.094, 0.125, 0.31]; const cream = [0.955, 0.93, 0.87]; const steel = [0.74, 0.76, 0.8];
    const penMats = [penMat(navy, 0.55, 60), penMat(cream, 0.4, 44, true), penMat(navy, 0.55, 60), penMat(steel, 1.1, 90)];
    const lathe = (pts: [number, number][]) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), 72);
    const capGeo = lathe(CAP_PROFILE); const endGeo = lathe(END_PROFILE);
    const barrelGeo = new CylinderGeometry(9.0, 9.0, 104.2, 72, 1, true); barrelGeo.translate(0, -30.2 + 104.2 / 2, 0);
    // the clip: a steel strip standing off the top of the cap, a bridge where it is fixed, a small bead at its free end
    const clipGeo = new BoxGeometry(3.4, 37, 1.25); clipGeo.translate(0, -57.5, 11.25);
    const bridgeGeo = new BoxGeometry(3.4, 5.5, 2.4); bridgeGeo.translate(0, -74.6, 10.4);
    const beadGeo = new SphereGeometry(1.15, 16, 12); beadGeo.scale(1.3, 1.6, 1); beadGeo.translate(0, -39.6, 10.35);
    disposables.push(capGeo, endGeo, barrelGeo, clipGeo, bridgeGeo, beadGeo);
    const penBody = new Group(); penBody.rotation.z = -Math.PI / 2; penBody.scale.setScalar(u);
    const parts = [new Mesh(capGeo, penMats[0]), new Mesh(barrelGeo, penMats[1]), new Mesh(endGeo, penMats[2]),
      new Mesh(clipGeo, penMats[3]), new Mesh(bridgeGeo, penMats[3]), new Mesh(beadGeo, penMats[3])];
    parts.forEach((m) => { m.frustumCulled = false; m.renderOrder = 42; penBody.add(m); });
    const penGroup = new Group(); penGroup.add(penBody);
    penShade = shadowMaterial(c.dawn, c.screenSize); penShade.uniforms.uRadius.value = 8 * u;
    penShadow = new Mesh(unitPlane, penShade); penShadow.frustumCulled = false; penShadow.renderOrder = 9.5;
    penParts = { group: penGroup, mats: penMats };
    // the sheet a stop turns into when it is picked up (its picture is drawn when it is picked)
    sheetMat = new ShaderMaterial({
      vertexShader: PROP_VERTEX, fragmentShader: SHEET_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        tMap: { value: null }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uSize: { value: new Vector2(1, 1) },
        uRadius: { value: 16 * u }, uCutout: { value: 0 }, uAlpha: { value: 1 }, uDawn: c.dawn, uShade: { value: 1 },
      },
    });
    disposables.push(sheetMat);
    sheetMesh = new Mesh(unitPlane, sheetMat); sheetMesh.frustumCulled = false; sheetMesh.renderOrder = 60; sheetMesh.visible = false;
    sheetShade = shadowMaterial(c.dawn, c.screenSize); sheetShade.uniforms.uRadius.value = 16 * u;
    sheetShadow = new Mesh(unitPlane, sheetShade); sheetShadow.frustumCulled = false; sheetShadow.renderOrder = 55; sheetShadow.visible = false;
    // the cards: drawn and uploaded one at a time in quiet moments, so building them never holds a frame
    const queue = [...cards];
    const next = () => {
      if (!ctx) return;
      const placed = queue.shift();
      if (!placed) {
        c.scene.add(tapeShadow!, tape!, rollShadow!, group, penShadow!, penParts!.group, sheetShadow!, sheetMesh!);
        meshes.forEach((m) => c.scene.add(m.shadow, m.mesh));
        visible = true;
        c.invalidate();
        resolveReady();
        return;
      }
      const { stop } = placed;
      const restCanvas = faceCanvas(stop); drawFace(restCanvas, stop, 0, pictures);
      const rest = texture(restCanvas, c.maxAnisotropy);
      // (the pile is a cut-out: its picture goes up premultiplied, PILE_FRAGMENT undoes it)
      if (stop.fill) rest.premultiplyAlpha = true;
      let openTex: CanvasTexture | null = null;
      if (!stop.fill) { const oc = faceCanvas(stop); drawFace(oc, stop, 1, pictures); openTex = texture(oc, c.maxAnisotropy); }
      const pileShadow = stop.fill ? texture(drawPileShadow(stop), c.maxAnisotropy) : null;
      c.renderer.initTexture(rest);
      if (openTex) c.renderer.initTexture(openTex);
      if (pileShadow) c.renderer.initTexture(pileShadow);
      const mat = new ShaderMaterial({
        vertexShader: PROP_VERTEX, fragmentShader: stop.fill ? PILE_FRAGMENT : CARD_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          tMap: { value: rest }, tOpen: { value: openTex ?? rest }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize },
          uSize: { value: new Vector2(1, 1) }, uRadius: { value: 14 * u }, uCutout: { value: stop.fill ? 1 : 0 }, uAlpha: { value: 0 }, uDawn: c.dawn,
          uCrop: { value: new Vector2(1, 1) }, uAnchor: { value: placed.lane === 0 ? 1 : 0 }, uOpen: { value: 0 },
        },
      });
      disposables.push(mat);
      const shade = pileShadow ? pileShadowMaterial(pileShadow, c.dawn, c.screenSize) : shadowMaterial(c.dawn, c.screenSize);
      const mesh = new Mesh(unitPlane, mat); mesh.frustumCulled = false;
      const shadow = new Mesh(unitPlane, shade); shadow.frustumCulled = false;
      meshes.push({ placed, flight: plan.get(placed)!, step: steps.indexOf(placed), rest, open: openTex, mesh, mat, shadow, shade });
      idle(next, needed);
    };
    // (needed once any of the timeline's window shows: its intro plays when most of it does)
    const needed = () => { const hold = page.hold(); return Boolean(hold) && window.scrollY > hold!.start - hold!.view * 0.85; };
    idle(next, needed);
    window.addEventListener('scroll', onScroll, { passive: true });
  };
  const onScroll = () => ctx?.invalidate();

  const placeRoll = (y: number) => {
    const R2 = roll!;
    const r = rollRadius(y);
    const W = ROLL.w * u; const t = ROLL.tele * u; const R = r * u; const Rc = ROLL.rc * u;
    if (Math.abs(r - R2.r) > 0.5) {
      // (its ends are rebuilt as it gets thinner: from the outside of the roll, telescoped a little, in to the core)
      const swap = (m: Mesh, g: BufferGeometry) => { m.geometry.dispose(); m.geometry = g; };
      swap(R2.side, new CylinderGeometry(R, R, W, 96, 1, true));
      swap(R2.endA, new CylinderGeometry(Rc, R, t, 96, 1, true)); R2.endA.position.y = W / 2 + t / 2;
      swap(R2.endB, new CylinderGeometry(R, Rc, t, 96, 1, true)); R2.endB.position.y = -W / 2 - t / 2;
      swap(R2.core, new CylinderGeometry(Rc, Rc, W + 2 * t + 2 * u, 48, 1, true));
      R2.mats.forEach((m) => { m.uniforms.uR.value = r; });
      R2.r = r;
    }
    R2.group.position.set(tx(TAPE.x), ty(y), R + 0.0015);
    // rolled, not slid: it turns by the length laid over its radius
    R2.group.rotation.x = -((y - rollTop()) * u) / (((ROLL.r0 + r) / 2) * u);
    const reach = 70 * u; const sw = W + 2 * t; const sh = R * 1.9;
    rollShadow!.position.set(tx(TAPE.x) - 0.34 * R * 0.35, ty(y) - 0.44 * R * 0.35, 0.0004);
    rollShadow!.scale.set(sw + reach * 2, sh + reach * 2, 1);
    const su = rollShade!.uniforms;
    su.uSize.value.set(sw, sh); su.uSheet.value.set(sw + reach * 2, sh + reach * 2); su.uLift.value = 0.6; su.uAlpha.value = 1;
    // the tape is down from its torn top end to where the roll touches the mat
    tape!.position.set(tx(TAPE.x), ty((TAPE.top + TAPE.bot) / 2), 0.0015);
    tapeMat!.uniforms.uEnd.value = ty(y);
    const len = Math.max(0, y - TAPE.top) * u; const treach = 40 * u;
    tapeShadow!.position.set(tx(TAPE.x), ty((TAPE.top + y) / 2), 0.0003);
    tapeShadow!.scale.set(TAPE.w * u + treach * 2, len + treach * 2, 1);
    tapeShade!.uniforms.uSize.value.set(TAPE.w * u * 0.96, Math.max(len - 8 * u, 0));
    tapeShade!.uniforms.uSheet.value.set(TAPE.w * u + treach * 2, len + treach * 2);
    tapeShade!.uniforms.uAlpha.value = 0.55;
    tapeShadow!.visible = len > 0.001;
  };

  /* ---------- the pen on the tape ---------- */
  const PEN_DROP_AT = 0.72; const PEN_DROP_S = 0.6;
  const placePen = (T: number) => {
    if (!penParts || !penShadow || !penShade) return;
    // it drops onto the top of the tape once the roll has gone by (landed by 1.32 s, inside the 1.7 s intro)
    const k = T < 0 ? 0 : reduced ? 1 : clamp01((T - PEN_DROP_AT) / PEN_DROP_S);
    const drop = 1 - outCubic(k);
    const bounce = k > 0.75 && k < 1 ? Math.sin(Math.PI * (k - 0.75) * 4) * 0.012 : 0;
    const alpha = Math.min(1, k * 3);
    const z = PEN_ROLL_R * u + 0.0015 + drop * 0.22 + bounce;
    penParts.group.position.set(tx(TAPE.x), ty(pen.y), z);
    // rolled, not slid: it turns by the distance it has travelled over its radius (and a little as it lands)
    penParts.group.rotation.x = penAngle - drop * 1.2;
    penParts.group.visible = alpha > 0.003;
    penParts.mats.forEach((m) => { m.uniforms.uAlpha.value = alpha; });
    const lift = (z - PEN_ROLL_R * u) / u; // mat px above resting
    const R = PEN_ROLL_R * u; const sw = PEN.len * u * 0.98; const sh = R * 1.7; const reach = 60 * u;
    penShadow.position.set(tx(TAPE.x) - (0.34 * R * 0.35 + lift * u * 0.3), ty(pen.y) - (0.44 * R * 0.35 + lift * u * 0.38), 0.0006);
    penShadow.scale.set(sw + reach * 2, sh + reach * 2, 1);
    const su = penShade.uniforms;
    su.uSize.value.set(sw, sh); su.uSheet.value.set(sw + reach * 2, sh + reach * 2);
    su.uLift.value = 0.55 + drop * 2.2; su.uAlpha.value = alpha * (1 - drop * 0.6);
    penShadow.visible = alpha > 0.003;
  };

  /* ---------- a stop picked up and turned over ---------- */
  /** Where the sheet lies (mat pixels): across the middle of the timeline's window, its top edge just under the title's
   *  line (so it covers every folded stop, whatever its height). */
  const SHEET_TOP = 164;
  const sheetAt = (stop: MatStop) => ({ x: 720, y: SHEET_TOP + sheetSize(stop).h / 2 });
  let SHEET_AT = { x: 720, y: 480 };
  /** The first half of the turn is the card rising and turning away; the second, its back coming round as the sheet. */
  const pickPhase = (k: number) => (k < 0.5 ? { half: 0, t: smooth(k / 0.5) } : { half: 1, t: smooth((k - 0.5) / 0.5) });
  /** Halfway: lifted toward the eye (table units), on the way from the card's place to the sheet's. */
  const pickPlace = (from: { x: number; y: number }, t: number, half: number) => {
    const mid = { x: (from.x + SHEET_AT.x) / 2, y: (from.y + SHEET_AT.y) / 2 };
    if (half === 0) return { x: from.x + (mid.x - from.x) * t, y: from.y + (mid.y - from.y) * t, z: 0.36 * Math.sin(t * Math.PI / 2) };
    return { x: mid.x + (SHEET_AT.x - mid.x) * t, y: mid.y + (SHEET_AT.y - mid.y) * t, z: 0.36 + (0.055 - 0.36) * t };
  };
  const placeSheet = (): boolean => {
    if (!sheetMesh || !sheetMat || !sheetShadow || !sheetShade || !ctx) return false;
    const card = pickedId ? meshes.find((m) => m.placed.stop.id === pickedId) : null;
    if (!card || pickK <= 0 || !pickFrom) { sheetMesh.visible = sheetShadow.visible = false; return false; }
    if (sheetFor !== pickedId) {
      sheetTex?.dispose();
      sheetTex = texture(drawSheet(card.placed.stop, pictures), ctx.maxAnisotropy);
      ctx.renderer.initTexture(sheetTex);
      sheetMat.uniforms.tMap.value = sheetTex; sheetFor = pickedId;
    }
    const k = pickPhase(pickK);
    if (k.half === 0) { sheetMesh.visible = sheetShadow.visible = false; return false; }
    const at = pickPlace(pickFrom, k.t, 1);
    // its back comes round at the card's size and grows to the sheet's as it comes down (brought closer to read)
    const S = sheetSize(card.placed.stop);
    const grow = pickFrom.h / S.h + (1 - pickFrom.h / S.h) * smooth(k.t / 0.8);
    const W = S.w * u * grow; const H = S.h * u * grow;
    sheetMesh.visible = sheetShadow.visible = true;
    sheetMesh.position.set(tx(at.x), ty(at.y), 0.004 + at.z);
    sheetMesh.scale.set(W, H, 1);
    // its back comes round: from edge-on to flat, turning the same way the card turned away
    const turn = (card.placed.lane === 0 ? -1 : 1) * (1 - k.t) * EDGE_ON;
    sheetMesh.rotation.y = turn;
    sheetMat.uniforms.uSize.value.set(W, H);
    sheetMat.uniforms.uShade.value = 0.72 + 0.28 * Math.cos(turn);
    const reach = 190 * u;
    sheetShadow.position.set(tx(at.x - at.z / u * 0.3), ty(at.y + at.z / u * 0.38), 0.0007);
    const cs = Math.cos(turn);
    sheetShadow.scale.set(W * cs + reach * 2, H + reach * 2, 1);
    const su = sheetShade.uniforms;
    su.uSize.value.set(W * Math.max(0.02, cs), H); su.uSheet.value.set(W * cs + reach * 2, H + reach * 2);
    su.uLift.value = 0.8 + at.z * 6; su.uAlpha.value = 0.95 * Math.sqrt(Math.max(0, cs));
    return false;
  };

  /* the HTML over the cards: placed from the camera, written only when it changed */
  const v3 = new Vector3();
  const lastBox = new Map<HTMLElement, string>();
  const project = (camera: PerspectiveCamera, view: { width: number; height: number }, X: number, Y: number, z = 0) => {
    v3.set(tx(X), ty(Y), z).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * view.width, y: (-v3.y * 0.5 + 0.5) * view.height };
  };
  const placeBox = (el: HTMLElement, camera: PerspectiveCamera, view: { width: number; height: number }, X: number, Y: number, W: number, H: number, z: number) => {
    const a = project(camera, view, X, Y, z); const b = project(camera, view, X + W, Y + H, z);
    const c2 = project(camera, view, X, Y + H, z); const d = project(camera, view, X + W, Y, z);
    const l = Math.min(a.x, c2.x); const r = Math.max(b.x, d.x); const t = Math.min(a.y, d.y); const bt = Math.max(b.y, c2.y);
    const key = `${l.toFixed(1)},${t.toFixed(1)},${(r - l).toFixed(1)},${(bt - t).toFixed(1)}`;
    const id = el.dataset.stop; if (id) rects.set(id, { l, t, w: r - l, h: bt - t });
    if (lastBox.get(el) === key) return;
    lastBox.set(el, key);
    el.style.transform = `translate(${l.toFixed(1)}px, ${t.toFixed(1)}px)`;
    el.style.width = `${(r - l).toFixed(1)}px`;
    el.style.height = `${(bt - t).toFixed(1)}px`;
  };

  const update = (dt: number, camera: PerspectiveCamera, view: { width: number; height: number }): boolean => {
    if (!ctx || !visible) return false;
    const hold = page.hold(); const perUnit = page.perUnit();
    if (!hold || !perUnit) return false;
    offset = hold.start / perUnit;
    const scrollY = window.scrollY;
    let moving = false;
    // the intro: once the timeline is in view, it plays by itself
    if (introT < 0 && (introDue(scrollY, hold) || reduced)) introT = reduced ? endT : 0;
    if (introT >= 0 && introT < endT) { introT = Math.min(endT, introT + dt); moving = true; }
    const T = Math.max(0, introT);
    const done = introT >= endT;
    // the pen: its row follows the page's scroll (it waits at each stop, then rolls on); the stop it has reached opens
    const leaving = scrollY > hold.start + holdLength(hold);
    penTargetY = done && !pickedId ? penTarget(scrollY, hold, rows) : penTargetY;
    const before = pen.y;
    if (done && penStep(pen, penTargetY, dt, reduced)) moving = true;
    penAngle += (pen.y - before) / PEN_ROLL_R;
    current = done && !leaving ? penStop(pen.y, rows) : -1;
    // hover: only the pointer's own moves change it (never a card moving under a still pointer), and only once the
    // pointer has rested on the new card (or off every card) for a moment, so neighbours never flicker
    if (!done || pickedId || leaving) { hover = -1; pending = -1; pendingT = 0; pileWant = 0; }
    else {
      if (pointerMoved) {
        pointerMoved = false;
        // (the pile rises while the pointer is over it: it has no larger face to open into)
        const pr = pileId ? rects.get(pileId) : undefined;
        pileWant = pointerAt && pr && pointerAt.x >= pr.l && pointerAt.x <= pr.l + pr.w && pointerAt.y >= pr.t && pointerAt.y <= pr.t + pr.h ? 1 : 0;
        const under = pointerAt ? hitStep(pointerAt.x, pointerAt.y) : -1;
        if (under === hover) { pending = hover; pendingT = 0; } else if (under !== pending) { pending = under; pendingT = 0; }
      }
      if (pending !== hover) {
        pendingT += dt; moving = true;
        if (pendingT >= (pending < 0 ? 0.2 : 0.12)) { hover = pending; pendingT = 0; }
      }
    }
    const want = pickedId && frozenWant ? frozenWant : wantOpen(open.length, current, hover, (i) => steps[i].lane);
    lastWant = want;
    if (stepOpenTo(open, want, dt, reduced)) moving = true;
    // (never past what is wanted, and still once there: no frame steps it back and forth)
    if (pileLift !== pileWant) {
      const r = dt / (reduced ? OPEN_REDUCED_S : PILE_LIFT_S);
      pileLift = pileWant > pileLift ? Math.min(pileWant, pileLift + r) : Math.max(pileWant, pileLift - r);
      moving = true;
    }
    // picking a stop up and turning it over
    if (pickK !== pickTo) {
      const was = pickK;
      pickK = pickTo > pickK ? Math.min(1, pickK + dt / (reduced ? 0.2 : PICK_S)) : Math.max(0, pickK - dt / (reduced ? 0.2 : PICK_BACK_S));
      moving = true;
      if (pickK === pickTo) onPick?.(pickTo ? pickedId : null, true);
      if (was > 0 && pickK === 0) { pickedId = null; pickFrom = null; frozenWant = null; }
    }
    placeRoll(introT < 0 ? rollTop() : reduced ? TAPE.bot - 4 : rollY(T));
    if (introT < 0) tapeMat!.uniforms.uEnd.value = 1e6;
    // sizes and places now (an open stop pushes the ones under it down)
    const sizes = new Map<PlacedCard, { w: number; h: number }>();
    meshes.forEach((m) => sizes.set(m.placed, (cardSize(m.placed.stop, m.step >= 0 ? open[m.step] : 0))));
    const tops = pushedTops(cards, sizes);
    const middle = (p: PlacedCard) => { const s = sizes.get(p)!; return { x: p.inner - p.dir * s.w / 2, y: tops.get(p)! + s.h / 2, h: s.h }; };
    meshes.forEach((m, i) => {
      const p = m.placed; const s = sizes.get(p)!;
      const here = middle(p);
      const pose = introT < 0
        ? { x: here.x, y: here.y, lift: 0, drop: 1, alpha: 0, under: false, flying: false }
        : cardPose(p, m.flight, T, here, m.flight.prev ? middle(m.flight.prev) : null, reduced);
      const W = s.w * u; const H = s.h * u;
      m.mesh.position.set(tx(pose.x), ty(pose.y), 0.004 + pose.drop * 0.3 + pose.lift * 0.035);
      m.mesh.scale.set(W, H, 1);
      const mu = m.mat.uniforms;
      mu.uSize.value.set(W, H);
      mu.uCrop.value.set(s.w / p.stop.openW, s.h / p.stop.openH);
      mu.uAlpha.value = pose.alpha;
      const k = m.step >= 0 ? open[m.step] : 0;
      mu.uOpen.value = k;
      const reach = 150 * u;
      m.shadow.position.set(tx(pose.x), ty(pose.y), 0.0005);
      m.shadow.scale.set(W + reach * 2, H + reach * 2, 1);
      const su = m.shade.uniforms;
      su.uSize.value.set(W, H); su.uSheet.value.set(W + reach * 2, H + reach * 2);
      su.uLift.value = pose.lift + pose.drop * 2; su.uAlpha.value = pose.alpha * (1 - pose.drop);
      if (p.stop.fill) {
        // the pile: its own shadow sheet, moved further down and to the left the higher the pile is (hopping in, or
        // risen under the pointer), and a little fainter
        const L = smooth(pileLift);
        m.mesh.position.z += L * 0.05;
        const off = pose.lift * 1.6 + pose.drop * 3 + L * 0.9;
        pileShadowAt(m, pose.x - off * 6, pose.y + off * 7.5, 1);
        su.uAlpha.value = (pose.alpha * (1 - pose.drop) * (1 - 0.14 * L)) / (1 + 0.25 * pose.lift);
      }
      m.mesh.visible = m.shadow.visible = pose.alpha > 0.003;
      // flat cards in lane order; one still coming out from under the card above it lies under every card already down;
      // one hopping lies over the mat and the tape
      const order = pose.under ? 5.6 + i * 0.001 : pose.flying ? 8 + i * 0.001 : 6 + i * 0.01;
      m.mesh.renderOrder = order; m.shadow.renderOrder = 5;
      if (pickedId === p.stop.id && pickK > 0) {
        // picked up: for the first half of the turn it is this card that rises and turns; then the sheet takes over
        // (it keeps the size and face it had when it was clicked, while the others fold under it)
        if (!pickFrom) pickFrom = { x: pose.x, y: pose.y, w: s.w, h: s.h, k: mu.uOpen.value };
        const k = pickPhase(pickK);
        if (k.half === 0) {
          const at = pickPlace(pickFrom, k.t, 0);
          const PW = pickFrom.w * u; const PH = pickFrom.h * u;
          const turn = (p.lane === 0 ? 1 : -1) * k.t * EDGE_ON; const cs = Math.cos(turn);
          m.mesh.position.set(tx(at.x), ty(at.y), 0.004 + at.z);
          m.mesh.scale.set(PW, PH, 1); mu.uSize.value.set(PW, PH);
          mu.uCrop.value.set(pickFrom.w / p.stop.openW, pickFrom.h / p.stop.openH); mu.uOpen.value = pickFrom.k;
          m.mesh.rotation.y = turn;
          m.mesh.renderOrder = 59;
          m.shadow.position.set(tx(at.x - at.z / u * 0.3), ty(at.y + at.z / u * 0.38), 0.0005);
          m.shadow.scale.set(PW * cs + reach * 2, PH + reach * 2, 1);
          su.uSize.value.set(PW * Math.max(0.02, cs), PH); su.uSheet.value.set(PW * cs + reach * 2, PH + reach * 2);
          su.uLift.value = 0.6 + at.z * 9; su.uAlpha.value = 0.9 * Math.sqrt(Math.max(0, cs));
          if (p.stop.fill) {
            // the pile's own shadow, narrowing as it turns and fading as it rises
            pileShadowAt(m, at.x - (at.z / u) * 0.3, at.y + (at.z / u) * 0.38, cs);
            su.uAlpha.value = 0.9 * Math.sqrt(Math.max(0, cs)) * (1 - 0.45 * Math.min(1, at.z / 0.36));
          }
          m.shadow.renderOrder = 58;
        } else { m.mesh.visible = false; m.shadow.visible = false; }
      } else m.mesh.rotation.y = 0;
      if (pose.flying) moving = true;
    });
    placePen(introT < 0 ? -1 : T);
    if (placeSheet()) moving = true;
    // the links over the cards, and the words on the mat
    if (overlay) {
      camera.updateMatrixWorld();
      meshes.forEach((m) => {
        const el = overlay!.cards.get(m.placed.stop.id);
        if (!el) return;
        const s = sizes.get(m.placed)!; const c = middle(m.placed);
        placeBox(el, camera, view, c.x - s.w / 2, c.y - s.h / 2, s.w, s.h, 0.004);
      });
      if (overlay.sheet?.box && pickedId && pickK === 1) {
        const card = meshes.find((m) => m.placed.stop.id === pickedId);
        const S = card ? sheetSize(card.placed.stop) : { w: 0, h: 0 };
        const x0 = SHEET_AT.x - S.w / 2; const y0 = SHEET_AT.y - S.h / 2; const z = 0.004 + 0.055;
        placeBox(overlay.sheet.box, camera, view, x0, y0, S.w, S.h, z);
        if (card) sheetRects(card.placed.stop).forEach((r, j) => { const el = overlay!.sheet!.rows[j]; if (el) placeBox(el, camera, view, x0 + r.x, y0 + r.y, r.w, r.h, z); });
      }
      const a = project(camera, view, 0, 450); const b = project(camera, view, 1440, 450);
      const k = ((b.x - a.x) / 1440).toFixed(4);
      if (lastBox.get(overlay.root) !== k) { lastBox.set(overlay.root, k); overlay.root.style.setProperty('--k', k); }
      if (!overlay.root.dataset.placed) overlay.root.dataset.placed = 'true';
      overlay.words.forEach((el) => {
        const p = project(camera, view, Number(el.dataset.mx), Number(el.dataset.my));
        const key = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        if (lastBox.get(el) === key) return;
        lastBox.set(el, key);
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      });
    }
    return moving;
  };

  return {
    ready,
    attach,
    update,
    bindOverlay(next) { overlay = next; lastBox.clear(); ctx?.invalidate(); },
    state: () => ({
      intro: introT, introEnd: endT, open: [...open], current, hover, picked: pickedId, pick: pickK,
      pen: { y: pen.y, target: penTargetY, angle: penAngle },
      tops: Object.fromEntries([...rects.entries()].map(([id, r]) => [id, Math.round(r.t * 10) / 10])),
      pile: pileLift,
    }),
    pointer(x, y) { pointerAt = { x, y }; pointerMoved = true; ctx?.invalidate(); },
    pointerLeft() { pointerAt = null; pointerMoved = true; ctx?.invalidate(); },
    pick(id) {
      if (id) {
        if (pickedId && pickedId !== id) return;
        // (any stop, Tinker Verse's pile too, which is not one of the scroll steps)
        const card = cards.find((c) => c.stop.id === id);
        if (!card || introT < endT) return;
        // while it is up, every other stop folds, so the sheet lies over the whole timeline with nothing peeking out
        pickedId = id; pickTo = 1; frozenWant = steps.map(() => 0);
        SHEET_AT = sheetAt(card.stop);
        onPick?.(id, false);
      } else if (pickedId) {
        // on the way back the stop opens again (it lands as it was picked up), and the pen's stop in the other lane too
        pickTo = 0; onPick?.(null, false);
        const at = steps.findIndex((c) => c.stop.id === pickedId);
        frozenWant = wantOpen(open.length, current, at, (i) => steps[i].lane);
      }
      ctx?.invalidate();
    },
    get picked() { return pickedId; },
    get onPick() { return onPick; },
    set onPick(fn) { onPick = fn; },
    dispose() {
      window.removeEventListener('scroll', onScroll);
      if (ctx) {
        const scene = ctx.scene;
        meshes.forEach((m) => scene.remove(m.mesh, m.shadow));
        if (tape) scene.remove(tape); if (tapeShadow) scene.remove(tapeShadow); if (rollShadow) scene.remove(rollShadow);
        if (roll) { scene.remove(roll.group); [roll.side, roll.endA, roll.endB, roll.core].forEach((m) => m.geometry.dispose()); }
        if (penParts) scene.remove(penParts.group); if (penShadow) scene.remove(penShadow);
        if (sheetMesh) scene.remove(sheetMesh); if (sheetShadow) scene.remove(sheetShadow);
        sheetTex?.dispose();
      }
      disposables.forEach((d) => d.dispose());
      ctx = null;
    },
  };
}

/**
 * Run soon, once the visitor has let go of the page (lib/flipbook/quiet.ts): drawing a card and sending it to the
 * graphics card holds the page for a moment, and eight of them in a row under a moving finger was a visible stutter on
 * the way down to the timeline. `needed` says the timeline is coming into view: then a card waits at most half a second.
 */
function idle(fn: () => void, needed: () => boolean) {
  whenQuiet(fn, () => (needed() ? 500 : 6000));
}

