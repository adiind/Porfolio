/**
 * Zomato on /mat, as a delivery rider's bag (built from Adi's photo of his real bag: review/home-mat-bag-real/reference). Drawn into the flip-book engine's own scene as a
 * MatLayer (the engine's camera, window light, opening light and loop). Picked up, the poster gives way to the bag, which
 * drops onto the mat, unzips, flips its lid, and the food comes out one piece at a time: the bill (his role and lines),
 * three takeaway containers (one per project, each opening on its real screen and his lines), the press clipping and his
 * photo. All solids are real geometry lit by the window; shadows are painted the engine's way (down and to the left),
 * thrown from each thing's real height.
 *
 * While the bag is open the layer frames the camera itself (an overview of everything, or one item close up), blended
 * with the engine's own flight on the way in and out.
 */
import {
  BoxGeometry, CanvasTexture, ClampToEdgeWrapping, DoubleSide, BackSide, FrontSide, Group, LinearFilter, LinearMipmapLinearFilter,
  BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Mesh, NoColorSpace, PerspectiveCamera, PlaneGeometry, Quaternion, Raycaster, Shape, ShapeGeometry, ShaderMaterial, Texture, Vector2, Vector3, Vector4,
  type Material, type Object3D,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';
import {
  TEXT, BIND, RIDER_RED, board, clipping, fabric, insidePrint, kraftPaper, label, linerWith, paperBagFront, photoPrint, receipt, rescueSheets, riderFlap, riderFront, riderLidTop, riderPlain, riderRim, riderStrap, roundCorners, type ClipRegion, type ProjectId,
} from './zomatoBagArt';
import { whenQuiet, whenStill } from '../flipbook/quiet';
import { createRescueScene } from './rescueScene';
import { createRescueDesk } from './rescueDesk';
import { NARROW, NARROW_BELOW_ASPECT, WIDE } from './rescueLayout';

/** The bag's own pictures (public/images/mat/zomato), and Food Rescue's paper bag and offer (shared with the old card). */
const BAG_PICTURES = [
  '/images/mat/zomato/wordmark.webp', '/images/mat/zomato/homepage.webp', '/images/mat/zomato/friends.webp', '/images/mat/zomato/eternal.webp',
  '/images/mat/food-rescue/bag.webp', '/images/mat/food-rescue/offer.webp',
] as const;

/* ---------- shaders ---------- */

const DAWN = /* glsl */ `
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}`;
const LIT_VERTEX = /* glsl */ `
varying vec3 vN; varying vec2 vUv; varying vec3 vP; varying vec3 vW;
void main() {
  vN = normalize(mat3(modelMatrix) * normal); vUv = uv; vP = position;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/**
 * A surface lit by the window. Its picture is laid on by projection from the solid's own axes (uProj: 1 top, 2 front,
 * 3 east, 4 west, 5 north), or by its uv (0, cropped by uRect); a face seen from behind shows uBack. Faces turned
 * toward the light are brighter (a face looking straight up keeps its colours, as the posters do), uSpec adds the
 * window's glint (foil, gloss).
 */
const LIT_FRAGMENT = /* glsl */ `
uniform sampler2D tMap; uniform float uUseMap; uniform vec3 uColor; uniform float uCut; uniform float uProj; uniform vec3 uSize;
uniform vec4 uRect; uniform vec3 uBack; uniform float uUseBack; uniform float uInside; uniform float uSpec; uniform float uGloss;
uniform float uFlat; uniform float uPrint; uniform vec3 uBox; uniform float uBind; uniform float uFoil;
uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn; uniform float uAlpha;
varying vec3 vN; varying vec2 vUv; varying vec3 vP; varying vec3 vW;
${DAWN}
void main() {
  vec2 uv = vUv * uRect.zw + uRect.xy;
  if (uProj > 0.5 && uProj < 1.5) uv = vec2(vP.x / uSize.x + 0.5, vP.y / uSize.y + 0.5);
  else if (uProj > 1.5 && uProj < 2.5) uv = vec2(vP.x / uSize.x + 0.5, vP.z / uSize.z + 0.5);
  else if (uProj > 2.5 && uProj < 3.5) uv = vec2(vP.y / uSize.y + 0.5, vP.z / uSize.z + 0.5);
  else if (uProj > 3.5 && uProj < 4.5) uv = vec2(-vP.y / uSize.y + 0.5, vP.z / uSize.z + 0.5);
  else if (uProj > 4.5) uv = vec2(-vP.x / uSize.x + 0.5, vP.z / uSize.z + 0.5);
  vec4 t = uUseMap > 0.5 ? texture2D(tMap, clamp(uv, 0.0, 1.0)) : vec4(uColor, 1.0);
  if (uCut > 0.5 && t.a < 0.5) discard;
  vec3 n = normalize(vN);
  vec3 base = t.rgb;
  if (uBind > 0.0) {
    // black piping along every edge, following the rounded corners: where a point is near two faces' planes at once
    vec3 dd = uBox - abs(vP);
    float m1 = min(dd.x, min(dd.y, dd.z)); float m3 = max(dd.x, max(dd.y, dd.z)); float m2 = dd.x + dd.y + dd.z - m1 - m3;
    base = mix(base, vec3(0.2, 0.17, 0.165), 1.0 - smoothstep(uBind * 0.8, uBind, m2));
  }
  // (a BackSide solid is seen from inside: three.js turns its winding, so gl_FrontFacing is true there; uInside says so)
  if (uInside > 0.5) n = -n;
  else if (!gl_FrontFacing) { n = -n; if (uUseBack > 0.5) base = uBack; }
  float k = clamp(0.66 + 0.42 * dot(n, uLight), 0.42, 1.1);
  k = mix(k, 1.0, uFlat);
  // white ink reads white whichever way the face turns (a print term, only for materials that ask for it)
  float ink = uPrint * smoothstep(0.78, 0.92, min(base.r, min(base.g, base.b)));
  k = mix(k, 1.0, ink);
  vec3 col = base * k;
  vec3 V = normalize(cameraPosition - vW);
  vec3 H = normalize(uLight + V);
  float nh = max(dot(n, H), 0.0);
  col += uSpec * (pow(nh, 60.0) * 0.9 + pow(nh, 9.0) * 0.12);
  col += uGloss * pow(nh, 140.0) * 0.5;
  // Broad, view-dependent highlights evoke crinkled reflective insulation in the existing window light.
  float foilGlance = pow(1.0 - abs(dot(n, V)), 2.0);
  float foilWindow = pow(nh, 12.0);
  col += uFoil * (0.20 * foilGlance + 0.42 * foilWindow);
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.2 * (1.0 - ink));
  gl_FragColor = vec4(col * dawnLight(), uAlpha);
}`;
const SHADOW_VERTEX = /* glsl */ `
varying vec2 vL;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vL = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`;
/** One thing's shadow on the mat: its footprint swept from its foot to its top along the light, soft with height. */
const SHADOW_FRAGMENT = /* glsl */ `
uniform vec2 uC; uniform float uAng; uniform vec2 uHalf; uniform float uR; uniform float uB; uniform float uT; uniform vec2 uDir;
uniform float uStrength; uniform float uAlpha; uniform float uDawn; uniform vec2 uScreen;
varying vec2 vL;
${DAWN}
float roundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x + s * p.y, -s * p.x + c * p.y); }
float caster(vec2 p) { return roundBox(rot(p - uC, uAng), uHalf, uR); }
void main() {
  float sweep = 0.0;
  for (int i = 0; i < 10; i++) {
    float t = float(i) / 9.0;
    float h = mix(uB, uT, t);
    float blur = 0.003 + h * 0.3;
    sweep = max(sweep, (1.0 - smoothstep(-blur, blur, caster(vL - uDir * h))) * mix(1.0, 0.72, t));
  }
  float halo = 1.0 - smoothstep(-(0.02 + uT * 0.8), 0.02 + uT * 0.8, caster(vL - uDir * uT * 1.6) + 0.01);
  float d0 = caster(vL);
  float contact = (1.0 - smoothstep(0.0, 0.006 + uT * 0.06, d0)) * step(-0.002, d0) * clamp(1.0 - uB / 0.03, 0.0, 1.0) * clamp(uT / 0.02, 0.0, 1.0);
  float dark = 1.0 - (1.0 - sweep * 0.6) * (1.0 - halo * 0.3) * (1.0 - contact * 0.55);
  dark *= uStrength * clamp(1.0 - uB * 1.2, 0.25, 1.0);
  if (dark * uAlpha < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark * uAlpha);
}`;

const LIGHT = new Vector3(0.35, 0.45, 0.9).normalize();
const SHADOW_DIR = new Vector2(-0.55, -0.7);

/* ---------- small helpers ---------- */

const asked = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string) => {
  const had = asked.get(src); if (had) return had;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.decoding = 'async';
    image.onload = () => { if (image.decode) image.decode().then(() => resolve(image), () => resolve(image)); else resolve(image); };
    image.onerror = () => { asked.delete(src); reject(new Error(`could not load ${src}`)); }; image.src = src;
  });
  asked.set(src, p); return p;
};
/** Start fetching the bag's pictures (the layer waits for the same ones), e.g. while the rest of the stage loads. */
export const preloadZomatoBag = () => Promise.all(BAG_PICTURES.map(loadImage));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeIO = (k: number) => { k = clamp01(k); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
const easeOut = (k: number) => 1 - (1 - clamp01(k)) ** 3;
const easeIn = (k: number) => clamp01(k) ** 2;
const hex = (s: string) => { const n = parseInt(s.slice(1), 16); return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const PROJ = { uv: 0, top: 1, front: 2, east: 3, west: 4, north: 5 } as const;

export type ItemId = 'receipt' | 'press' | 'photo' | ProjectId;

interface Caster { c: Vector2; ang: number; half: Vector2; r: number; base: number; top: number; on: boolean }
interface Item {
  id: ItemId; root: Group; w: number; d: number; h: number;
  rest: { x: number; y: number; turn: number }; stackZ: number;
  lid?: { pivot: Group; kind: 'hinge' | 'lift'; w: number; d: number; t: number; openAngle: number };
  fold?: Group;
  /** the story sheets that come out of a bag (their rest places are in the item's own frame) */
  cards?: Array<{ g: Group; w: number; d: number; to: Vector3; caster: Caster; turn: number }>;
  open: number; openTarget: number;
  /** progress out of the bag: 0 inside, 1 landed */
  out: number;
  casters: Caster[];
}

export interface BagLayer extends MatLayer {
  ready: Promise<void>;
  /** The camera is on its way to the poster: the bag lands and unpacks. */
  arrive(): void;
  /** Put everything back and close: resolves when the bag is shut (then the page flies the camera out). */
  pack(): Promise<void>;
  /** The camera is leaving: the bag lifts away and the poster comes back. */
  leave(): void;
  open(id: ItemId | null): void;
  /** Debug: freeze the unpacking at `clock` seconds with the camera low in front of the bag (null: back to normal). */
  frontView(clock?: number | null, elev?: number, zoom?: number): void;
  /** Debug: hold the camera over one item at an opening (0 closed, 1 open). */
  itemView(id: ItemId | null, open?: number, zoom?: number, pitch?: number): void;
  readonly opened: ItemId | null;
  readonly state: string;
  /** The Food Rescue journey (time, seek), once the bag's things are built: for the page's keys and clicks on the order log. */
  readonly rescue: ReturnType<typeof createRescueScene> | null;
  /** Food Rescue: which event's row of the order log is under a point of the window, or null (only while Food Rescue is open). */
  rescueStepAt(x: number, y: number, rect: DOMRect): number | null;
  /** Debug: the screen boxes (CSS px from the canvas corner) of the log board, the print, "My part" and the map for the current layout. */
  rescueRects(rect: DOMRect): Record<'board' | 'print' | 'part' | 'map', { x0: number; y0: number; x1: number; y1: number }>;
  /** What lies under a point of the window (CSS px from the canvas corner), when the bag is open. */
  hit(x: number, y: number, rect: DOMRect): ItemId | 'bag' | null;
  /** The link under a point when the press clipping is open (its headline's address), else null. */
  linkAt(x: number, y: number, rect: DOMRect): string | null;
}

export function createBagLayer(opts: { prop: { x: number; y: number; w: number; h: number; image: HTMLImageElement | HTMLCanvasElement }; /** the bag's own spot, from the click target's centre (table units) */ shift?: { x: number; y: number }; reduced: boolean }): BagLayer {
  const { prop } = opts;
  let ctx: MatLayerContext | null = null;
  const group = new Group();
  const disposables: Array<{ dispose(): void }> = [];
  const items: Item[] = [];
  const shadowMeshes: Array<{ mesh: Mesh; mat: ShaderMaterial; caster: Caster }> = [];
  let propMesh: Mesh | null = null; let propShadow: Mesh | null = null;
  /** The bag is built (and lies on the mat); `later` holds what is still to be made of the things inside it. */
  let built = false;
  const later: Array<() => void> = [];
  let laterAsked = false;
  // (each of these holds the page for a moment: they wait until the visitor has let go of it, lib/flipbook/quiet.ts.
  // A click on the bag before they are done builds them there and then, buildAll.)
  const idle = (fn: () => void) => whenQuiet(fn, 8000);
  // The things inside the bag are seen only once it is opened, and each takes 60 to 190 ms to make. They used to be made
  // the moment the room lit (before the first scroll) or forced through after 8 s under a moving page: either way the
  // visitor's scroll stuck. Now only after the page has been left alone for a second, never forced. (Adi, 2026-11-20.)
  const BAG_STILL_MS = 1000;
  const buildSoon = () => { if (!later.length) return; whenStill(() => { if (!ctx) return; later.shift()?.(); buildSoon(); }, BAG_STILL_MS); };
  const buildAll = () => { while (ctx && later.length) later.shift()!(); };
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => { resolveReady = r; });

  // the scene's state
  let state: 'rest' | 'in' | 'open' | 'packing' | 'out' = 'rest';
  let clock = 0;
  // Food Rescue (lib/mat/rescueScene.ts the 3D map, rescueDesk.ts the paper beside it): built with the bag's other things
  let rescueScene: ReturnType<typeof createRescueScene> | null = null;
  let rescueDesk: ReturnType<typeof createRescueDesk> | null = null;
  let stageBook: Object3D | null = null;
  let rescueAspect = 0;
  let follow = 0;           // 0 the engine's camera, 1 this layer's
  let hidePoster = 0;
  let opened: ItemId | null = null;
  let packDone: (() => void) | null = null;
  const camNow = { pos: new Vector3(), quat: new Quaternion(), valid: false };
  const camFrom = { pos: new Vector3(), quat: new Quaternion() };
  const camTo = { pos: new Vector3(), quat: new Quaternion() };
  let camT = 1; let camDur = 0.8;
  let lastCamera: PerspectiveCamera | null = null;
  let dbgItem: { id: ItemId; open: number; zoom: number; pitch: number } | null = null; // debug: look straight at one item, held at a given opening
  let dbg: { clock: number; elev: number; zoom: number } | null = null; // debug: hold the film at one moment and put the camera low in front of the bag

  /* ---- the bag ---- */
  // (same volume as the first concept's bag, now a square footprint about 1 : 1 : 0.95)
  const BAG = { x: -0.4, y: 0.3, w: 0.665, d: 0.665, h: 0.572, wall: 0.034 };
  /** On the home mat the bag sits a little larger and turned, so its front and flap show from above. */
  const BAG_S = 1.18; const BAG_TURN = -0.21;
  const LID = { lt: 0.06, LW: BAG.w + 0.016, LD: BAG.d + 0.016, zi: 0.024, zback: 0.05 };
  /** The photo's "front" runs from the flap's top edge to the foot: ftop is that edge's height above the foot, F its height. */
  const FRONT = { ftop: BAG.h + LID.lt - 0.003, F: BAG.h + LID.lt - 0.003 };
  const FLAP = { fw: LID.LW + 0.004, fh: 0.23 * FRONT.F, t: 0.012, fy: -BAG.d - 0.0145, fz: LID.lt - 0.003 - 0.115 * FRONT.F, r: 0.06, strip: [0.07 * FRONT.F, 0.18 * FRONT.F] as [number, number] };
  const STRAP = { w: 0.046, drop: 0.085, out: 0.062 };
  const ZIP = { hang: 0.0388 };
  /** How far the slider has run (0 parked at the front-left corner, 1 at the end of the right side). */
  const zipLen = { front: LID.LW - LID.zi * 2, side: LID.LD - LID.zi - LID.zback };
  const bag = new Group(); const bagLid = new Group(); const zip = new Group(); const pull = new Group();
  const setZip = (k: number) => {
    const dist = clamp01(k) * (zipLen.front + zipLen.side);
    const x0 = -LID.LW / 2 + LID.zi; const yF = -BAG.d - 0.008 + LID.zi; const turn = 0.05;
    let x: number; let y: number; let ang: number;
    if (dist <= zipLen.front) { x = x0 + dist; y = yF; ang = dist < turn ? -Math.PI / 2 * (1 - dist / turn) : 0; if (dist > zipLen.front - turn) ang = (Math.PI / 2) * (1 - (zipLen.front - dist) / turn); }
    else { x = x0 + zipLen.front; y = yF + (dist - zipLen.front); ang = Math.PI / 2; }
    zip.position.set(x, y, LID.lt + 0.003); pull.rotation.z = ang;
  };
  let bagCaster: Caster;
  let mouthY = 0; // where the paper bag's story comes out (its fold line)
  let pressRegions: ClipRegion[] = []; let pressParts: { upper: Mesh; lower: Mesh; /** how much of the sheet's height the lower half's picture takes */ lowerSpan: number } | null = null;

  const tex = (canvas: HTMLCanvasElement, flipY = true): Texture => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = NoColorSpace; t.wrapS = ClampToEdgeWrapping; t.wrapT = ClampToEdgeWrapping; t.flipY = flipY;
    t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.anisotropy = ctx?.maxAnisotropy ?? 4;
    disposables.push(t); return t;
  };
  const lit = (o: { map?: Texture; color?: string; proj?: keyof typeof PROJ; size?: [number, number, number]; cut?: boolean; spec?: number; gloss?: number; back?: string; side?: 'front' | 'back' | 'double'; rect?: [number, number, number, number]; flat?: number; print?: boolean; edge?: number; foil?: number }) => {
    const m = new ShaderMaterial({
      vertexShader: LIT_VERTEX, fragmentShader: LIT_FRAGMENT, transparent: true, depthTest: true, depthWrite: true,
      side: o.side === 'back' ? BackSide : o.side === 'double' ? DoubleSide : FrontSide,
      uniforms: {
        tMap: { value: o.map ?? null }, uUseMap: { value: o.map ? 1 : 0 }, uColor: { value: hex(o.color ?? '#ffffff') }, uCut: { value: o.cut ? 1 : 0 },
        uProj: { value: PROJ[o.proj ?? 'uv'] }, uSize: { value: new Vector3(...(o.size ?? [1, 1, 1])) }, uRect: { value: new Vector4(...(o.rect ?? [0, 0, 1, 1])) },
        uBack: { value: hex(o.back ?? '#ffffff') }, uUseBack: { value: o.back ? 1 : 0 }, uSpec: { value: o.spec ?? 0 }, uFlat: { value: o.flat ?? 0 }, uBox: { value: new Vector3(...(o.size ?? [1, 1, 1])).multiplyScalar(0.5) }, uBind: { value: o.edge ?? 0 }, uPrint: { value: o.print ? 1 : 0 }, uGloss: { value: o.gloss ?? 0 },
        uFoil: { value: o.foil ?? 0 }, uInside: { value: o.side === 'back' ? 1 : 0 }, uLight: { value: LIGHT }, tSun: { value: ctx!.sunTexture }, uScreen: { value: ctx!.screenSize }, uDawn: ctx!.dawn, uAlpha: { value: 1 },
      },
    });
    disposables.push(m); return m;
  };
  let hiddenMat: ShaderMaterial | null = null;
  const hidden = () => { if (!hiddenMat) { hiddenMat = lit({ color: '#000000' }); hiddenMat.visible = false; } return hiddenMat; };
  const allMats: ShaderMaterial[] = [];
  const track = <T extends Material | Material[]>(m: T): T => { (Array.isArray(m) ? m : [m]).forEach((x) => allMats.push(x as ShaderMaterial)); return m; };
  /** Pillow the flat faces of a rounded box outward by `amt` at their middles (padded panels). */
  const puffGeo = (geo: RoundedBoxGeometry, w: number, d: number, h: number, amt: number) => {
    const pos = geo.attributes.position; const nor = geo.attributes.normal; const hx = w / 2; const hy = d / 2; const hz = h / 2;
    const f = (v: number, hh: number) => Math.max(0, 1 - (v / hh) ** 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i); const nx = nor.getX(i); const ny = nor.getY(i); const nz = nor.getZ(i);
      const k = amt * (nx * nx * f(y, hy) * f(z, hz) + ny * ny * f(x, hx) * f(z, hz) + nz * nz * f(x, hx) * f(y, hy));
      pos.setXYZ(i, x + nx * k, y + ny * k, z + nz * k);
    }
    pos.needsUpdate = true;
  };
  const rbox = (w: number, d: number, h: number, r: number, mats: Material[] | Material, seg = 3, puff = 0) => {
    const geo = new RoundedBoxGeometry(w, d, h, seg, r); disposables.push(geo);
    if (puff > 0) puffGeo(geo, w, d, h, puff);
    const m = new Mesh(geo, track(mats)); m.frustumCulled = false; m.renderOrder = 40; return m;
  };
  /** A thin slab with rounded plan corners (radius r): an extruded rim, a plate on its top and one on its underside. */
  const slab = (w: number, d: number, t: number, r: number, top: Material, bottom: Material, edge: Material) => {
    const rr = (ww: number, dd: number, rad: number) => {
      const sh = new Shape(); const x = ww / 2; const y = dd / 2;
      sh.moveTo(-x + rad, -y); sh.lineTo(x - rad, -y); sh.quadraticCurveTo(x, -y, x, -y + rad); sh.lineTo(x, y - rad); sh.quadraticCurveTo(x, y, x - rad, y);
      sh.lineTo(-x + rad, y); sh.quadraticCurveTo(-x, y, -x, y - rad); sh.lineTo(-x, -y + rad); sh.quadraticCurveTo(-x, -y, -x + rad, -y);
      return sh;
    };
    const shape = rr(w, d, r);
    const shell = new ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 6 }); shell.translate(0, 0, -t / 2);
    const upG = new ShapeGeometry(shape, 6);
    const dnG = new ShapeGeometry(shape, 6);
    const idx = dnG.index; if (idx) { for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a); } }
    const dn = dnG.attributes.normal; for (let i = 0; i < dn.count; i++) dn.setZ(i, -1);
    disposables.push(shell, upG, dnG);
    const g = new Group();
    const body = new Mesh(shell, track([edge, edge])); const up = new Mesh(upG, track(top)); const down = new Mesh(dnG, track(bottom));
    up.position.z = t / 2 + 0.0003; down.position.z = -t / 2 - 0.0003;
    [body, up, down].forEach((m) => { m.frustumCulled = false; m.renderOrder = 40; g.add(m); });
    return g;
  };
  const plane = (w: number, h: number, mat: Material, segs: [number, number] = [1, 1]) => {
    const geo = new PlaneGeometry(w, h, segs[0], segs[1]); disposables.push(geo);
    const m = new Mesh(geo, track(mat)); m.frustumCulled = false; m.renderOrder = 40; return m;
  };
  const caster = (): Caster => ({ c: new Vector2(), ang: 0, half: new Vector2(), r: 0.01, base: 0, top: 0, on: true });
  const addShadow = (c: Caster, strength = 1) => {
    const geo = new PlaneGeometry(6, 6); disposables.push(geo);
    const m = new ShaderMaterial({
      vertexShader: SHADOW_VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uC: { value: c.c }, uAng: { value: 0 }, uHalf: { value: c.half }, uR: { value: 0 }, uB: { value: 0 }, uT: { value: 0 }, uDir: { value: SHADOW_DIR },
        uStrength: { value: strength }, uAlpha: { value: 1 }, uDawn: ctx!.dawn, uScreen: { value: ctx!.screenSize },
      },
    });
    disposables.push(m);
    const mesh = new Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 1.7;
    shadowMeshes.push({ mesh, mat: m, caster: c });
    return mesh;
  };

  /** An open-topped box: an outer rounded shell whose top is a rim (its middle cut clear), a lining box seen from inside. */
  const openBox = (w: number, d: number, h: number, r: number, wall: number, puff: number, outer: { side: Material; front?: Material; east?: Material; west?: Material; north?: Material; top: Material; bottom?: Material }, inner: { wall: Material; floor: Material }) => {
    const g = new Group();
    const shell = rbox(w, d, h, r, [outer.east ?? outer.side, outer.west ?? outer.side, outer.north ?? outer.side, outer.front ?? outer.side, outer.top, outer.bottom ?? outer.side], 6, puff);
    shell.position.z = h / 2; g.add(shell);
    const ih = h - wall * 0.7;
    const geo = new BoxGeometry(w - wall * 2, d - wall * 2, ih); disposables.push(geo);
    const lining = new Mesh(geo, track([inner.wall, inner.wall, inner.wall, inner.wall, hidden(), inner.floor])); lining.frustumCulled = false; lining.renderOrder = 40;
    lining.position.z = h - ih / 2 - 0.0005; g.add(lining);
    return g;
  };

  const attach = (c: MatLayerContext) => {
    ctx = c;
    // (built in a quiet moment of its own, not inside whatever task the last picture arrived in)
    void preloadZomatoBag().then((pictures) => new Promise<typeof pictures>((ok) => idle(() => ok(pictures)))).then(([mark, home, friends, eternal, paperBag, offerReal]) => {
      const rescueArt = { bag: paperBag, offer: offerReal };
      if (!ctx) return;
      const U = 1400; // canvas pixels per table unit for printed things
      /* the bag: Adi's red rider bag (reference/BAG-SPEC.md): a square-footprint padded box, rounded all over, black piping on every
         edge, a lid whose front flap hangs over the top of the front, its zip round the lid's left, front and right, a strap and buckle */
      {
        const { w, d, h, wall } = BAG; const u = 1400; const FL = 0.82;
        const ER = 0.022; const LR = 0.018; // piping widths: body, lid
        const mat = (map: Texture, proj: keyof typeof PROJ, size: [number, number, number], extra: Partial<Parameters<typeof lit>[0]> = {}) => lit({ map, proj, size, flat: FL, edge: ER, ...extra });
        const side = mat(tex(riderPlain({ u: 1000, W: d, H: h, bind: 0 })), 'east', [w, d, h]);
        const sideW = mat(tex(riderPlain({ u: 1000, W: d, H: h, bind: 0 })), 'west', [w, d, h]);
        const front = mat(tex(riderFront({ u, W: w, H: h, ftop: FRONT.ftop, F: FRONT.F, mark, bind: 0 })), 'front', [w, d, h], { print: true });
        const back = mat(tex(riderPlain({ u: 1000, W: w, H: h, bind: 0 })), 'north', [w, d, h]);
        const rim = mat(tex(riderRim({ u: 1000, W: w, D: d, wall, bind: 0.018 })), 'top', [w, d, h], { cut: true });
        const under = lit({ color: '#3a0a10' });
        const liningWall = lit({ map: tex(fabric(512, 512, { lining: true })), proj: 'uv', size: [w - wall * 2, d - wall * 2, h], side: 'back', spec: 0.28, foil: 0.55 });
        const liningFloor = lit({ map: tex(fabric(512, 512, { lining: true })), proj: 'top', size: [w - wall * 2, d - wall * 2, h], side: 'back', spec: 0.28, foil: 0.55 });
        const body = openBox(w, d, h, 0.05, wall, 0.012, { side, west: sideW, front, north: back, top: rim, bottom: under }, { wall: liningWall, floor: liningFloor });
        bag.add(body);

        // the lid: hinged along the back; plain red top, padded and piped; its front flap hangs over the body's front
        const { lt, LW, LD, zi, zback } = LID;
        const lmat = (map: Texture, proj: keyof typeof PROJ, print = false) => lit({ map, proj, size: [LW, LD, lt], flat: FL, edge: LR, print });
        const lidTop = lmat(tex(riderLidTop({ u: 1400, W: LW, D: LD, bind: 0, zi, back: zback, mark })), 'top', true);
        const sideMap = tex(riderPlain({ u: 1000, W: LD, H: lt, bind: 0 })); const frontMap = tex(riderPlain({ u: 1000, W: LW, H: lt, bind: 0 }));
        const lidFront = lmat(frontMap, 'front'); const lidSideE = lmat(sideMap, 'east'); const lidSideW = lmat(sideMap, 'west');
        const lidIn = lit({ map: tex(fabric(512, 512, { lining: true })), proj: 'top', size: [LW, LD, lt], spec: 0.28, foil: 0.55 });
        const lid = rbox(LW, LD, lt, 0.028, [lidSideE, lidSideW, lidSideW, lidFront, lidTop, lidIn], 6, 0.008);
        lid.position.set(0, -d / 2, lt / 2 - 0.003);
        bagLid.add(lid);

        // the flap: a thin shell (black edge) with rounded lower corners, a printed outer face and a red inner face
        { const { fw, fh, fy, fz, r } = FLAP;
          const shape = new Shape();
          shape.moveTo(-fw / 2, fh / 2); shape.lineTo(fw / 2, fh / 2); shape.lineTo(fw / 2, -fh / 2 + r);
          shape.quadraticCurveTo(fw / 2, -fh / 2, fw / 2 - r, -fh / 2); shape.lineTo(-fw / 2 + r, -fh / 2);
          shape.quadraticCurveTo(-fw / 2, -fh / 2, -fw / 2, -fh / 2 + r); shape.lineTo(-fw / 2, fh / 2);
          const shell = new ExtrudeGeometry(shape, { depth: FLAP.t, bevelEnabled: false, curveSegments: 8 }); shell.translate(0, 0, -FLAP.t / 2); shell.rotateX(Math.PI / 2);
          const outerG = new ShapeGeometry(shape, 8); outerG.rotateX(Math.PI / 2);
          const innerG = new ShapeGeometry(shape, 8); innerG.rotateX(-Math.PI / 2);
          disposables.push(shell, outerG, innerG);
          const black = lit({ color: BIND, flat: FL });
          const flapOut = mat(tex(riderFlap({ u: 1000, W: fw, H: fh, bind: 0.02, r, strip: FLAP.strip })), 'front', [fw, 1, fh], { spec: 0.18, edge: 0 });
          const flapIn = lit({ map: tex(fabric(512, 256, { color: RIDER_RED })), proj: 'front', size: [fw, 1, fh], flat: FL });
          const grp = new Group();
          const shellMesh = new Mesh(shell, track([black, black])); const outer = new Mesh(outerG, track(flapOut)); const inner = new Mesh(innerG, track(flapIn));
          outer.position.y = -FLAP.t / 2 - 0.0003; inner.position.y = FLAP.t / 2 + 0.0003;
          [shellMesh, outer, inner].forEach((m) => { m.frustumCulled = false; m.renderOrder = 40; grp.add(m); });
          grp.position.set(0, fy, fz);
          bagLid.add(grp); }

        // the zip's slider and pull (the pull hangs over the lid's edge)
        const metal = lit({ color: '#a6a8ae', spec: 0.5 });
        const slider = rbox(0.03, 0.022, 0.012, 0.005, metal, 3);
        const pullMat = lit({ color: '#1f2022', spec: 0.15, flat: FL });
        const tabH = rbox(0.014, 0.044, 0.004, 0.0019, pullMat, 3); tabH.position.set(0, -0.022, 0.0);
        const tabV = rbox(0.014, 0.004, 0.056, 0.0019, pullMat, 3); tabV.position.set(0, -ZIP.hang, -0.028);
        pull.add(tabH, tabV); zip.add(slider, pull);
        bagLid.add(zip);
        setZip(0);
        bagLid.position.set(0, d / 2, h);
        bag.add(bagLid);

        // the strap down the front, lying out on the mat, and its side-release buckle
        { const st = STRAP; const wm = tex(riderStrap(96, 420));
          const webMat = lit({ map: wm, proj: 'front', size: [st.w, 1, st.drop], flat: FL });
          const webTop = lit({ map: wm, proj: 'top', size: [st.w, st.out, 1], flat: FL });
          const dark = () => lit({ color: '#1b1918' });
          const down = rbox(st.w, 0.006, st.drop, 0.0025, [dark(), dark(), dark(), webMat, dark(), dark()], 3);
          down.position.set(0, -d / 2 - 0.003, st.drop / 2 - 0.004);
          const flat = rbox(st.w, st.out, 0.005, 0.0024, [dark(), dark(), dark(), dark(), webTop, dark()], 3);
          flat.position.set(0, -d / 2 - st.out / 2, 0.0035);
          const plastic = lit({ color: '#171617', spec: 0.35, flat: FL });
          const female = rbox(0.056, 0.05, 0.016, 0.0075, plastic, 4); female.position.set(0, -d / 2 - st.out - 0.01, 0.009);
          const slot = rbox(0.036, 0.016, 0.004, 0.0019, lit({ color: '#050505' }), 3); slot.position.set(0, -d / 2 - st.out - 0.03, 0.0145);
          const male = rbox(0.04, 0.034, 0.011, 0.0054, plastic, 4); male.position.set(0, -d / 2 - st.out + 0.03, 0.0065);
          const bar = rbox(0.05, 0.008, 0.008, 0.0039, plastic, 3); bar.position.set(0, -d / 2 - st.out + 0.012, 0.0085);
          bag.add(down, flat, female, slot, male, bar); }

        bag.position.set(BAG.x, BAG.y, 0); bag.scale.setScalar(BAG_S); bag.rotation.z = BAG_TURN;
        group.add(bag);
        bagCaster = caster(); bagCaster.half.set((w / 2) * BAG_S, (d / 2) * BAG_S); bagCaster.r = 0.05 * BAG_S; bagCaster.c.set(BAG.x, BAG.y); bagCaster.ang = BAG_TURN;
        group.add(addShadow(bagCaster, 1.0));
      }

      /* the things that come out of the bag: made a piece at a time once the room is lit (or all at once when the bag is
         picked up first), so the opening's light never waits on them; each is some tens of milliseconds of drawing */
      const addItem = (id: ItemId, root: Group, w: number, d: number, h: number, rest: Item['rest'], stackZ: number, extra: Partial<Item> = {}) => {
        const it: Item = { id, root, w, d, h, rest, stackZ, open: 0, openTarget: 0, out: 0, casters: [caster(), caster()], ...extra };
        it.casters[1].on = false;
        it.casters.forEach((cs) => group.add(addShadow(cs, id === 'rescue' ? 0.55 : 1)));
        (it.cards ?? []).forEach((cd) => { cd.caster.on = false; group.add(addShadow(cd.caster)); });
        root.visible = false;
        group.add(root); items.push(it);
        return it;
      };
      /** A box's lid: a rounded slab hinged along its back edge (the pivot), top and inside printed. */
      const hingedLid = (w: number, d: number, t: number, r: number, top: Material, inside: Material, edge: Material, h: number) => {
        const pivot = new Group();
        const lidMesh = slab(w, d, t, r, top, inside, edge);
        lidMesh.position.set(0, -d / 2, t / 2);
        pivot.add(lidMesh);
        pivot.position.set(0, d / 2, h);
        return pivot;
      };
      // Homepage & Search: a pizza box, white corrugated board, its label on the lid; inside, the home screen
      later.push(() => {
        const w = 0.56; const d = 0.56; const h = 0.06; const t = 0.014; const P = TEXT.projects.home; const px = 1000;
        const flute = lit({ map: tex(board(w * px, h * px * 3, { kind: 'flute' })), proj: 'front', size: [w, d, h] });
        const fluteE = lit({ map: tex(board(d * px, h * px * 3, { kind: 'flute' })), proj: 'east', size: [w, d, h] });
        const rim = lit({ map: tex(board(w * px, d * px, { kind: 'white', hole: 0.012 * px })), proj: 'top', size: [w, d, h], cut: true });
        const box = openBox(w, d, h, 0.028, 0.012, 0, { side: flute, east: fluteE, west: fluteE, top: rim }, {
          wall: lit({ map: tex(board(256, 256, { kind: 'white' })), proj: 'front', size: [w, d, h], side: 'back' }),
          floor: lit({ map: tex(linerWith(w * U, d * U, home, 0.94)), proj: 'top', size: [w - 0.024, d - 0.024, h], side: 'back' }),
        });
        const lw = w + 0.006; const ld = d + 0.006;
        const lab = label(U, P.title, P.role, mark, 0.4);
        const lidTop = lit({ map: tex(roundCorners(board(lw * U, ld * U, { kind: 'white', label: lab, labelAt: [(lw * U - lab.width) / 2, (ld * U - lab.height) / 2], print: (g) => { g.strokeStyle = 'rgba(207,37,52,0.55)'; g.lineWidth = 0.006 * U; g.beginPath(); g.roundRect(0.035 * U, 0.035 * U, lw * U - 0.07 * U, ld * U - 0.07 * U, 0.028 * U); g.stroke(); } }), 0.034 * U)), proj: 'top', size: [lw, ld, t], cut: true });
        const lidIn = lit({ map: tex(roundCorners(insidePrint(lw * U, ld * U, U, P.title, P.lines, 'white', P.foot), 0.034 * U), false), proj: 'top', size: [lw, ld, t], cut: true });
        const pivot = hingedLid(lw, ld, t, 0.03, lidTop, lidIn, flute, h);
        const root = new Group(); root.add(box, pivot);
        addItem('home', root, w, d, h + t, { x: 0.5, y: 0.44, turn: 3 }, 0.24, { lid: { pivot, kind: 'hinge', w, d, t, openAngle: -(Math.PI + Math.asin((h - 0.005) / d)) } });
      });
      // Friends Recommendation: a kraft paper meal box with a hinged lid; inside, the friends screen
      later.push(() => {
        const w = 0.58; const d = 0.44; const h = 0.1; const t = 0.014; const P = TEXT.projects.friends; const px = 1000;
        const kraft = lit({ map: tex(board(w * px, h * px * 2, { kind: 'kraft' })), proj: 'front', size: [w, d, h] });
        const kraftE = lit({ map: tex(board(d * px, h * px * 2, { kind: 'kraft' })), proj: 'east', size: [w, d, h] });
        const rim = lit({ map: tex(board(w * px, d * px, { kind: 'kraft', hole: 0.008 * px })), proj: 'top', size: [w, d, h], cut: true });
        const box = openBox(w, d, h, 0.034, 0.008, 0, { side: kraft, east: kraftE, west: kraftE, top: rim }, {
          wall: lit({ map: tex(board(256, 256, { kind: 'kraft' })), proj: 'front', size: [w, d, h], side: 'back' }),
          floor: lit({ map: tex(linerWith(w * U, d * U, friends, 0.95, 'kraft')), proj: 'top', size: [w - 0.016, d - 0.016, h], side: 'back' }),
        });
        const lw = w + 0.006; const ld = d + 0.006;
        const lab = label(U, P.title, P.role, mark, 0.42);
        const lidTop = lit({ map: tex(roundCorners(board(lw * U, ld * U, { kind: 'kraft', label: lab }), 0.036 * U)), proj: 'top', size: [lw, ld, t], cut: true });
        const lidIn = lit({ map: tex(roundCorners(insidePrint(lw * U, ld * U, U, P.title, P.lines, 'kraft', P.foot), 0.036 * U), false), proj: 'top', size: [lw, ld, t], cut: true });
        const pivot = hingedLid(lw, ld, t, 0.034, lidTop, lidIn, kraft, h);
        const root = new Group(); root.add(box, pivot);
        addItem('friends', root, w, d, h + t, { x: 0.25, y: -0.64, turn: -3 }, 0.1, { lid: { pivot, kind: 'hinge', w, d, t, openAngle: -(Math.PI + Math.asin((h - 0.004) / d)) } });
      });
      // Food Rescue: the supplied printed face on an upright, square-bottomed bag with triangular sides.
      // The folded top remains a hinged flap.
      later.push(() => {
        const IW = rescueArt.bag.width; const IH = rescueArt.bag.height; const s = 0.5 / IW; // table units per picture pixel
        const YH = 122; // the fold line, in the picture's pixels
        // the silhouette: for each picture row, the leftmost and rightmost opaque pixel (a little inside, so the edge is never half-transparent)
        const cvs = document.createElement('canvas'); cvs.width = IW; cvs.height = IH;
        const cg = cvs.getContext('2d', { willReadFrequently: true })!; cg.drawImage(rescueArt.bag, 0, 0);
        const px = cg.getImageData(0, 0, IW, IH).data;
        const ext = (y: number): [number, number] => {
          const yy = Math.max(0, Math.min(IH - 1, Math.round(y)));
          let l = -1; let r = -1;
          for (let x = 0; x < IW; x++) if (px[(yy * IW + x) * 4 + 3] > 200) { if (l < 0) l = x; r = x; }
          return l < 0 ? [IW / 2, IW / 2] : [l + 2, r - 2];
        };
        const Te = 0.018; const baseDepth = 0.5; const puffB = 0.038; const puffF = 0.018;
        const X = (xp: number) => (xp - IW / 2) * s; const Yw = (yp: number) => (IH / 2 - yp) * s;
        const kraftMat = lit({ color: '#b98a55', flat: 0.3, side: 'double' });
        const kraftIn = lit({ map: tex(kraftPaper(256, 256, { crinkle: true })), proj: 'top', size: [0.5, 0.58, 1], flat: 0.3 });
        const printTex = tex(cvs);
        const print = lit({ map: printTex, cut: true, flat: 0.3 });
        /** A piece of the bag: rows of the picture from y0 to y1, a grid fitted to the outline, a puffed printed top, a flat underside and a wall. */
        const piece = (y0: number, y1: number, rows: number, cols: number, puff: number, baseZ: number, edgeZ: number, originY: number) => {
          const ys: number[] = []; for (let j = 0; j <= rows; j++) ys.push(y0 + ((y1 - y0) * j) / rows);
          const E = ys.map((y) => ext(y));
          // smooth the outline a little (3 rows) so the traced edge is not jagged
          const Ls = E.map((_, j) => (E[Math.max(0, j - 1)][0] + E[j][0] + E[Math.min(rows, j + 1)][0]) / 3);
          const Rs = E.map((_, j) => (E[Math.max(0, j - 1)][1] + E[j][1] + E[Math.min(rows, j + 1)][1]) / 3);
          const nx = cols + 1; const pos: number[] = []; const pos0: number[] = []; const uv: number[] = []; const ring: number[] = [];
          for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
            const xp = Ls[j] + ((Rs[j] - Ls[j]) * i) / cols;
            const b = Math.pow(Math.max(0, Math.sin((Math.PI * i) / cols) * Math.sin((Math.PI * j) / rows)), 0.7);
            const edge = i === 0 || i === cols || j === 0 || j === rows;
            // The front rises from the folded mouth to a square base; the back stays on the mat.
            const faceZ = y0 === YH ? baseDepth * (0.5 + 0.5 * j / rows) : edgeZ;
            const backZ = y0 === YH ? baseDepth * 0.5 * (1 - j / rows) : baseZ;
            pos.push(X(xp), Yw(ys[j]) - originY, (edge ? faceZ : faceZ + puff * b));
            pos0.push(X(xp), Yw(ys[j]) - originY, backZ);
            uv.push(xp / IW, 1 - ys[j] / IH);
          }
          for (let i = 0; i <= cols; i++) ring.push(i);
          for (let j = 1; j <= rows; j++) ring.push(j * nx + cols);
          for (let i = cols - 1; i >= 0; i--) ring.push(rows * nx + i);
          for (let j = rows - 1; j >= 1; j--) ring.push(j * nx);
          const idx: number[] = []; const idxB: number[] = [];
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
            const a = j * nx + i; const b2 = a + 1; const c = a + nx; const d = c + 1;
            idx.push(a, c, b2, b2, c, d); idxB.push(a, b2, c, b2, d, c);
          }
          const g = new Group();
          const top = new BufferGeometry(); top.setAttribute('position', new Float32BufferAttribute(pos, 3)); top.setAttribute('uv', new Float32BufferAttribute(uv, 2)); top.setIndex(idx); top.computeVertexNormals();
          const bot = new BufferGeometry(); bot.setAttribute('position', new Float32BufferAttribute(pos0, 3)); bot.setAttribute('uv', new Float32BufferAttribute(uv, 2)); bot.setIndex(idxB); bot.computeVertexNormals();
          // the wall round the edge, from the underside up to the printed face
          const wp: number[] = []; const wi: number[] = [];
          ring.forEach((v, k) => { wp.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], pos0[v * 3], pos0[v * 3 + 1], pos0[v * 3 + 2]); const n = ring.length; const k2 = (k + 1) % n; wi.push(k * 2, k * 2 + 1, k2 * 2, k2 * 2, k * 2 + 1, k2 * 2 + 1); });
          const wall = new BufferGeometry(); wall.setAttribute('position', new Float32BufferAttribute(wp, 3)); wall.setIndex(wi); wall.computeVertexNormals();
          disposables.push(top, bot, wall);
          const mt = new Mesh(top, track(print)); const mb = new Mesh(bot, track(kraftIn)); const mw = new Mesh(wall, track(kraftMat));
          [mt, mb, mw].forEach((m) => { m.frustumCulled = false; m.renderOrder = 40; g.add(m); });
          return g;
        };
        const hingeY = Yw(YH); // the fold line, on the mat (table units from the bag's middle)
        const bottomY = IH - 8; // avoid transparent pixels at the rounded edge collapsing the base
        const body = piece(YH, bottomY, 44, 26, puffB, 0, Te, 0);
        const flapGrp = piece(0, YH, 10, 26, puffF, -Te * 0.5, Te * 0.5, hingeY);
        const pivot = new Group(); pivot.position.set(0, hingeY, baseDepth * 0.5 - Te * 0.5);
        pivot.add(flapGrp);
        const root = new Group();
        // Stand the original face and flap on their bottom edge; leave the story sheets on the mat.
        const upright = new Group(); upright.rotation.x = Math.PI / 2;
        upright.position.set(0, baseDepth / 2, -Yw(bottomY));
        upright.add(body, pivot);
        const angledBag = new Group(); angledBag.rotation.z = -10 * Math.PI / 180; angledBag.add(upright); root.add(angledBag);
        // Food Rescue's own view: one cancelled order on a small 3D map, with its order log on paper beside it
        if (ctx) {
          const live = ctx;
          rescueScene = createRescueScene(group, angledBag, () => live.invalidate(), opts.reduced);
          rescueDesk = createRescueDesk(group, rescueArt, live, opts.reduced);
        }
        // the story sheets lie inside the bag until it opens, then slide out from under the folded top onto the mat beside it
        const sheets = rescueSheets(rescueArt.offer, mark);
        const at: Array<[number, number]> = [[0.76, 0.3], [1.8, 0.17], [2.84, 0.3], [0.76, -0.54], [1.55, -0.54]]; // (x, y) of each sheet's middle, in the bag's frame
        const turns = [-1.2, 1, -0.8, 1.4, -1];
        const cards: NonNullable<Item['cards']> = sheets.map((cv, i) => {
          const sw = cv.width / 1400; const sd = cv.height / 1400;
          const g = new Group(); const m = lit({ map: tex(cv), cut: true, back: '#f2f0ea', side: 'double' });
          const p = plane(sw, sd, m); p.position.z = 0.002; g.add(p); g.visible = false; root.add(g);
          return { g, w: sw, d: sd, to: new Vector3(at[i][0], at[i][1], 0.003 + i * 0.0005), caster: caster(), turn: turns[i] };
        });
        // (the cards start under the fold: `mouth` is where they come out)
        mouthY = -Yw(bottomY) + hingeY;
        addItem('rescue', root, IW * s, baseDepth, IH * s, { x: 1.25, y: 0.48, turn: 0 }, 0.02, { lid: { pivot, kind: 'hinge', w: IW * s, d: IH * s, t: Te, openAngle: 2.4 }, cards });
      });
      // the bill, folded in half in the bag, unfolding as it lands
      later.push(() => {
        const w = 0.42; const cu = U * 1.6; const cv = receipt(w, 1.8, cu, mark); const hh = cv.height / cu;
        const map = tex(roundCorners(cv, 14));
        const top = lit({ map, rect: [0, 0.5, 1, 0.5], cut: true, back: '#f2f0ea', side: 'double' });
        const ov = 0.004; // the two halves overlap a hair, so no seam shows through the fold
        const bottom = lit({ map, rect: [0, 0, 1, 0.5 + ov / hh], cut: true, back: '#f2f0ea', side: 'double' });
        const lower = plane(w, hh / 2 + ov, bottom); lower.position.set(0, -hh / 4 + ov / 2, 0.0015);
        const fold = new Group(); fold.position.set(0, 0, 0.0038);
        const upper = plane(w, hh / 2, top); upper.position.set(0, hh / 4, 0); fold.add(upper);
        const root = new Group(); root.add(lower, fold);
        addItem('receipt', root, w, hh, 0.004, { x: -1.22, y: -0.06, turn: -3 }, 0.38, { fold });
      });
      // the press clipping: a tall newspaper column, folded in half in the bag (as the bill is), each headline a link
      later.push(() => {
        const w = 0.6; const cu = U * 1.3; const cv = clipping(w, cu); const hh = cv.height / cu; pressRegions = cv.regions ?? [];
        const map = tex(roundCorners(cv, 0.02 * cu));
        const top = lit({ map, rect: [0, 0.5, 1, 0.5], cut: true, back: '#e4dccb', side: 'double' });
        const ov = 0.004; // the two halves overlap a hair, so no seam shows through the fold
        const bottom = lit({ map, rect: [0, 0, 1, 0.5 + ov / hh], cut: true, back: '#e4dccb', side: 'double' });
        const lower = plane(w, hh / 2 + ov, bottom); lower.position.set(0, -hh / 4 + ov / 2, 0.0015);
        const fold = new Group(); fold.position.set(0, 0, 0.0038);
        const upper = plane(w, hh / 2, top); upper.position.set(0, hh / 4, 0); fold.add(upper);
        pressParts = { upper, lower, lowerSpan: 0.5 + ov / hh };
        const root = new Group(); root.add(lower, fold);
        // (its foot lies where the shorter clipping's did, so it is inside the window wherever that one was)
        addItem('press', root, w, hh, 0.004, { x: 1.06, y: -0.72 + hh / 2, turn: -4 }, 0.36, { fold });
      });
      // his photo at Zomato, a glossy print
      later.push(() => {
        const w = 0.46; const h2 = 0.29;
        const m = lit({ map: tex(roundCorners(photoPrint(eternal, w, h2, U), 0.024 * U)), gloss: 0.6, cut: true, back: '#f3f2ee', side: 'double' });
        const p = plane(w, h2, m); p.position.z = 0.0015;
        const root = new Group(); root.add(p);
        addItem('photo', root, w, h2, 0.003, { x: -0.5, y: -0.5, turn: 5 }, 0.34);
      });
      c.scene.add(group);
      group.visible = false;
      built = true;
      // (picked up before its pictures were in: everything is made now)
      if (state !== 'rest') buildAll();
      findProp();
      c.invalidate();
      resolveReady();
    }).catch((error: unknown) => { console.error('The Zomato bag could not be built', error); });
  };
  /** The engine's mesh for the (never drawn) click target, and its shadow. Found again after the stage is laid out anew. */
  const findProp = () => {
    if (!ctx) return;
    propMesh = null; propShadow = null;
    ctx.scene.traverse((o) => {
      const m = (o as Mesh).material as ShaderMaterial | undefined;
      if (m?.uniforms?.tMap?.value?.image === prop.image && m.uniforms.uSize) propMesh = o as Mesh;
    });
    const found = propMesh as Mesh | null;
    if (!found) return;
    ctx.scene.traverse((o) => {
      const m = (o as Mesh).material as ShaderMaterial | undefined;
      if (m?.uniforms?.uSheet && Math.abs(o.position.x - found.position.x) < 1e-6 && Math.abs(o.position.y - found.position.y) < 1e-6) propShadow = o as Mesh;
    });
  };

  /* ---------- the camera ---------- */
  const dummy = new PerspectiveCamera();
  const OVERVIEW = { x: 0.03, y: 0.12, w: 3.05, h: 2.04, pitch: 0.5 };
  const frame = (camera: PerspectiveCamera, cx: number, cy: number, w: number, h: number, pitch: number, out: { pos: Vector3; quat: Quaternion }) => {
    const tanH = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const dist = Math.max((h * Math.cos(pitch) * 1.05) / (2 * tanH), (w * 1.04) / (2 * tanH * camera.aspect));
    const P0 = group.position;
    const target = new Vector3(P0.x + cx, P0.y + cy, 0);
    dummy.position.set(target.x, target.y - dist * Math.sin(pitch), dist * Math.cos(pitch));
    dummy.up.set(0, 1, 0); dummy.lookAt(target);
    out.pos.copy(dummy.position); out.quat.copy(dummy.quaternion);
  };
  const itemFrame = (it: Item): [number, number, number, number] => {
    if (it.cards) return [it.rest.x + 1.4, it.rest.y + 0.1, 3.55, 1.6];
    const a = (it.rest.turn * -Math.PI) / 180;
    if (it.lid?.kind === 'hinge') {
      // the box and its lid lying open behind it
      const off = new Vector2(0, it.d / 2).rotateAround(new Vector2(), a);
      return [it.rest.x + off.x, it.rest.y + off.y, it.w * 1.25, it.d * 2.3];
    }
    if (it.lid?.kind === 'lift') {
      const off = new Vector2(0, it.d * 0.56).rotateAround(new Vector2(), a);
      return [it.rest.x + off.x, it.rest.y + off.y, it.w * 1.25, it.d * 2.35];
    }
    // (the two tall papers, the bill and the clipping, fill the window's height)
    if (it.id === 'receipt' || it.id === 'press') return [it.rest.x, it.rest.y, it.w * 1.3, it.d * 1.08];
    return [it.rest.x, it.rest.y, it.w * 1.5, it.d * 1.7];
  };
  const aimCamera = (camera: PerspectiveCamera, dur: number) => {
    camFrom.pos.copy(camNow.valid ? camNow.pos : camera.position); camFrom.quat.copy(camNow.valid ? camNow.quat : camera.quaternion);
    const it = opened ? items.find((i) => i.id === opened) : null;
    if (it?.id === 'rescue') {
      // (the map and its paper, laid out for a wide window or a tall one: rescueLayout.ts)
      const { FRAME: f } = camera.aspect < NARROW_BELOW_ASPECT ? NARROW : WIDE;
      frame(camera, f.cx, f.cy, f.w, f.h, f.pitch, camTo);
      rescueAspect = camera.aspect;
    } else if (it) { const [x, y, w, h] = itemFrame(it); frame(camera, x, y, w, h, 0.22, camTo); } else frame(camera, OVERVIEW.x, OVERVIEW.y, OVERVIEW.w, OVERVIEW.h, OVERVIEW.pitch, camTo);
    camT = 0; camDur = dur;
  };
  let wantAim = false; let aimDur = 0.8;

  /* ---------- motion ---------- */
  const T = { bagFrom: 0.3, bagFall: 0.48, zip0: 1.0, zip1: 1.3, lid0: 1.22, lid1: 1.6, item0: 1.5, gap: 0.19, fly: 0.72, unfold: 0.3 };
  const order: ItemId[] = ['receipt', 'press', 'photo', 'home', 'friends', 'rescue'];
  const inEnd = () => T.item0 + (order.length - 1) * T.gap + T.fly + T.unfold + 0.05;
  const STACK_LIFT = 0.05; // the bag is a little taller than the first one: the food sits that much higher
  const PK = { gap: 0.09, fly: 0.48, lid0: 0, lid1: 0 };
  const packEnd = () => (order.length - 1) * PK.gap + PK.fly + 0.32;

  const DROP_H = 3.2; // the bag falls in from, and lifts away to, above the top of the shot (never faded)
  const bagPose = (t: number) => {
    // drops from above, lands with a small settle (a few mm, once)
    const k = clamp01((t - T.bagFrom) / T.bagFall);
    let z = DROP_H * (1 - k * k);
    const s = (t - T.bagFrom - T.bagFall) / 0.28;
    if (s > 0 && s < 1) z = 0.022 * Math.sin(Math.PI * s) * (1 - s);
    return { z, shown: clamp01((t - T.bagFrom) / 0.14) };
  };
  const placeItem = (it: Item, s: number, settleT: number) => {
    // s: 0 in the bag, 1 on the mat; an arc up out of the bag, over, and down
    const bagTop = BAG.h * BAG_S + bag.position.z;
    // (the folded bill lies centred in the bag: its fold is a quarter of its length above its middle)
    const a = new Vector3(BAG.x, BAG.y + (it.fold ? it.d / 4 : 0), it.stackZ + STACK_LIFT + bag.position.z);
    const b = new Vector3(it.rest.x, it.rest.y, 0);
    // straight up out of the opening first, then across, then down onto the mat
    const e = easeIO((s - 0.2) / 0.8);
    const x = a.x + (b.x - a.x) * e; const y = a.y + (b.y - a.y) * e;
    const peak = bagTop + 0.16 + it.d * 0.12;
    let z = s < 0.4 ? a.z + (peak - a.z) * easeOut(s / 0.4) : peak + (b.z - peak) * easeIn((s - 0.4) / 0.6);
    if (settleT > 0 && settleT < 1) z += 0.012 * Math.sin(Math.PI * settleT) * (1 - settleT);
    it.root.position.set(x, y, Math.max(0, z));
    it.root.rotation.set(Math.sin(Math.PI * s) * 0.22, Math.sin(Math.PI * s) * -0.12, (it.rest.turn * -Math.PI / 180) * easeIO(s));
  };

  const updateLid = (it: Item, dt: number) => {
    if (!it.lid) return;
    const target = it.openTarget;
    const speed = target > it.open ? 1 / 0.62 : 1 / 0.45;
    it.open = target > it.open ? Math.min(target, it.open + dt * speed) : Math.max(target, it.open - dt * speed);
    const k = easeIO(it.open);
    if (it.cards) {
      // the paper bag: its folded top opens first, then the sheets come out, one after another, and lie out beside it
      it.lid.pivot.rotation.x = it.lid.openAngle * easeIO(it.open / 0.5);
      it.cards.forEach((cd, i) => {
        const s = easeIO((it.open - 0.25 - 0.07 * i) / 0.4);
        cd.g.visible = s > 0.002 && it.id !== 'rescue'; // (Food Rescue opens onto its map, not its old sheets)
        // inside the bag, out through its far end, then across the mat to its place beside it
        const start = new Vector3(0, 0, mouthY - 0.14); const mid = new Vector3(0, 0, mouthY + 0.12);
        if (s < 0.4) {
          const k = easeOut(s / 0.4);
          cd.g.position.lerpVectors(start, mid, k); cd.g.scale.setScalar(0.3 + 0.15 * k); cd.g.rotation.set(0, 0, 0);
        } else {
          const k = (s - 0.4) / 0.6; const e = easeIO(k);
          cd.g.position.lerpVectors(mid, cd.to, e); cd.g.position.z += Math.sin(Math.PI * k) * 0.1;
          cd.g.scale.setScalar(0.45 + 0.55 * easeOut(k)); cd.g.rotation.set(Math.sin(Math.PI * k) * 0.2, 0, (cd.turn * Math.PI / 180) * e);
        }
      });
    } else if (it.lid.kind === 'hinge') it.lid.pivot.rotation.x = it.lid.openAngle * k;
    else {
      // lifted off, carried behind the tray, turned over and laid down inside up
      const up = Math.sin(Math.PI * k) * 0.22;
      it.lid.pivot.position.set(0, (it.d * 1.04) * k, (it.h - it.lid.t / 2) * (1 - k) + it.lid.t / 2 * k + up);
      it.lid.pivot.rotation.x = Math.PI * k;
    }
  };

  const update = (dt: number, camera: PerspectiveCamera): boolean => {
    lastCamera = camera;
    if (!ctx || !built) return false;
    if (!laterAsked && later.length && ctx.dawn.value >= 1) { laterAsked = true; buildSoon(); }
    // (the stage laid out again, e.g. for another live book, builds its meshes anew)
    if (!propMesh || !propMesh.parent) findProp();
    if (!propMesh) return false;
    let moving = false;
    // the layout is centred so that the closed bag sits exactly where the (hidden) click target is
    group.position.set(propMesh.position.x - BAG.x - (opts.shift?.x ?? 0), propMesh.position.y - BAG.y - (opts.shift?.y ?? 0), 0);
    if (dbgItem) { state = 'open'; clock = 0; follow = 1; const di = items.find((i) => i.id === dbgItem!.id); if (di) { di.openTarget = dbgItem.open; di.open = dbgItem.open; } moving = true; }
    if (dbg) { state = 'in'; clock = dbg.clock; moving = true; } else if (state !== 'rest') { clock += dt; moving = true; }
    // the click target (a poster-shaped prop the engine flies to) is never drawn: the bag itself is on the mat
    hidePoster = 1;
    const pm = propMesh.material as ShaderMaterial;
    // How shown the engine wants this spot this frame (it deals the posters in, and sinks every poster but the one the
    // camera flies to as a close-up comes down: the Self card, the résumé...). The bag follows it while it rests closed,
    // so it goes with the others; once clicked it is the close-up itself and the engine keeps it at 1.
    const engineShown = pm.uniforms.uAlpha.value;
    pm.uniforms.uAlpha.value *= 1 - hidePoster;
    if (propShadow) (propShadow.material as ShaderMaterial).uniforms.uAlpha.value *= 1 - hidePoster;
    group.visible = true;

    let bagShown = 1;
    if (state === 'in') {
      bag.position.z = 0;
      const zk = easeIO((clock - T.zip0) / (T.zip1 - T.zip0));
      setZip(zk);
      bagLid.rotation.x = -2.5 * easeOut((clock - T.lid0) / (T.lid1 - T.lid0));
      items.forEach((it) => {
        const i = order.indexOf(it.id);
        const s0 = T.item0 + i * T.gap;
        const s = clamp01((clock - s0) / T.fly);
        it.out = s;
        placeItem(it, s, (clock - s0 - T.fly) / 0.22);
        it.root.visible = clock > T.lid0 + 0.1;
        if (it.fold) it.fold.rotation.x = Math.PI * (1 - easeIO((clock - s0 - T.fly) / T.unfold));
      });
      follow = dbg ? 1 : easeIO(clock / 1.15);
      if (!dbg && clock >= inEnd()) { state = 'open'; clock = 0; }
    } else if (state === 'packing') {
      items.forEach((it) => {
        const i = order.length - 1 - order.indexOf(it.id);
        const s0 = i * PK.gap;
        const s = 1 - clamp01((clock - s0) / PK.fly);
        if (it.fold) it.fold.rotation.x = Math.PI * easeIO((clock - s0) / 0.16);
        it.out = s; placeItem(it, s, 0);
        it.root.visible = s > 0.02 || clock < packEnd() - 0.32;
      });
      setZip(1 - easeIO((clock - packEnd() + 0.12) / 0.12));
      const lidK = clamp01((clock - (packEnd() - 0.38)) / 0.3);
      bagLid.rotation.x = -2.5 * (1 - easeIO(lidK));
      if (clock >= packEnd()) { state = 'open'; packDone?.(); packDone = null; }
    } else if (state === 'out') {
      // the bag stays on the mat while the camera leaves
      bag.position.z = 0;
      items.forEach((it) => { it.root.visible = false; });
      follow = 1 - easeIO(clock / 1.0);
      if (clock > 1.1) { state = 'rest'; clock = 0; follow = 0; camNow.valid = false; }
    } else if (state === 'rest') {
      bag.position.z = 0; bagLid.rotation.x = 0; setZip(0);
      items.forEach((it) => { it.root.visible = false; });
    } else if (state === 'open') {
      items.forEach((it) => { placeItem(it, 1, 0); it.root.visible = opened !== 'rescue' || it.id === 'rescue'; if (it.fold) it.fold.rotation.x = 0; });
    }
    items.forEach((it) => { if (updateLid) updateLid(it, dt); if (Math.abs(it.open - it.openTarget) > 1e-4) moving = true; });

    // Food Rescue: its clock runs here; the paper follows the same clock
    const tall = camera.aspect < NARROW_BELOW_ASPECT;
    if (rescueScene?.update(dt, tall)) moving = true;
    if (rescueScene && rescueDesk?.update(rescueScene.time, tall)) moving = true;
    if (state === 'open' && opened === 'rescue') {
      // (the engine re-places its closed book at the top of every frame, and reads the book's place for its shadow after
      // the layers have run: moving it here takes the book and its shadow out of this view for this frame only. On tall
      // windows its corner would otherwise show under the order log.)
      // (the book is the engine's group whose sheets carry the page shader's uCastAmt)
      if (!stageBook) stageBook = ctx.scene.children.find((o) => o !== group && o instanceof Group && o.children.some((leaf) => !!((leaf as Mesh).material as ShaderMaterial | undefined)?.uniforms?.uCastAmt)) ?? null;
      if (stageBook) stageBook.position.x += 500;
      // (the window changed shape: frame the view again for it)
      if (Math.abs(camera.aspect - rescueAspect) > 1e-3) { wantAim = true; aimDur = 0.01; }
    }

    // fade (the bag shows as it comes in)
    // the bag itself is never faded: it is there (opaque) or not drawn at all; only its shadow on the mat eases in and out
    const away = state === 'rest' ? engineShown : 1;
    allMats.forEach((m) => { m.uniforms.uAlpha.value = away; });
    bag.visible = true;
    group.visible = away > 0.003;
    // the zip's pull tucks away as the lid lifts (it would otherwise dangle off the opened lid)
    pull.scale.setScalar(Math.max(0.0001, 1 - clamp01((Math.abs(bagLid.rotation.x) - 0.25) / 0.6)));
    // shadows: from each thing's real height
    bag.rotation.z = dbg ? 0 : BAG_TURN; bagCaster.ang = bag.rotation.z;
    bagCaster.c.set(BAG.x, BAG.y); bagCaster.base = bag.position.z; bagCaster.top = bag.position.z + BAG.h * BAG_S;
    items.forEach((it) => {
      const [c0, c1] = it.casters;
      const a = it.root.rotation.z;
      c0.c.set(it.root.position.x, it.root.position.y); c0.ang = a;
      const folded = it.fold && it.fold.rotation.x > 1.5;
      c0.half.set(it.w / 2, folded ? it.d / 4 : it.d / 2); if (folded) c0.c.add(new Vector2(0, -it.d / 4).rotateAround(new Vector2(), a));
      c0.base = it.root.position.z; c0.top = it.root.position.z + it.h; c0.r = 0.01;
      if (it.cards) { c0.ang = a - 10 * Math.PI / 180; c0.half.set(it.w * 0.46, it.d * 0.46); c0.r = 0.06; c0.top = c0.base + it.h * 0.45; }
      c0.on = it.root.visible;
      // an opened lid lying behind its box
      if (it.lid && it.open > 0.02 && !it.cards) {
        c1.on = it.root.visible;
        const k = easeIO(it.open);
        if (it.lid.kind === 'hinge') {
          const off = new Vector2(0, it.d * k).rotateAround(new Vector2(), a);
          c1.c.set(it.root.position.x + off.x, it.root.position.y + off.y); c1.half.set(it.w / 2, it.d / 2 * k + 0.001);
          c1.base = 0.0; c1.top = it.h * (1 - k * 0.5);
        } else {
          const off = new Vector2(0, it.d * 1.04 * k).rotateAround(new Vector2(), a);
          c1.c.set(it.root.position.x + off.x, it.root.position.y + off.y); c1.half.set(it.w / 2, it.d / 2);
          c1.base = it.lid.pivot.position.z - it.lid.t / 2; c1.top = c1.base + it.lid.t;
        }
        c1.ang = a;
      } else c1.on = false;
    });
    items.forEach((it) => {
      const a = it.root.rotation.z;
      (it.cards ?? []).forEach((cd) => {
        const c = cd.caster; c.on = it.root.visible && cd.g.visible;
        if (!c.on) return;
        c.c.set(it.root.position.x, it.root.position.y).add(new Vector2(cd.g.position.x, cd.g.position.y).rotateAround(new Vector2(), a));
        c.ang = a + cd.g.rotation.z; c.half.set((cd.w / 2) * cd.g.scale.x, (cd.d / 2) * cd.g.scale.x); c.r = 0.03;
        c.base = it.root.position.z + cd.g.position.z; c.top = c.base + 0.003;
      });
    });
    shadowMeshes.forEach((s) => {
      const u = s.mat.uniforms;
      u.uC.value = new Vector2(group.position.x + s.caster.c.x, group.position.y + s.caster.c.y);
      u.uAng.value = s.caster.ang; u.uHalf.value = s.caster.half; u.uR.value = s.caster.r;
      u.uB.value = s.caster.base; u.uT.value = Math.max(s.caster.base + 0.002, s.caster.top);
      u.uAlpha.value = s.caster.on ? away : 0;
      s.mesh.visible = s.caster.on && away > 0.003;
      s.mesh.position.set(0, 0, 0.0008);
    });

    // the camera: this layer's framing, blended with the engine's flight
    if (dbg) {
      const tanH = Math.tan(((camera.fov / 2) * Math.PI) / 180); const elev = dbg.elev;
      const dist = dbg.zoom * BAG_S * (0.78 / 0.72) / (2 * tanH);
      const target = new Vector3(group.position.x + BAG.x, group.position.y + BAG.y - 0.08, 0.27 * BAG_S);
      dummy.position.set(target.x, target.y - dist * Math.cos(elev), target.z + dist * Math.sin(elev));
      dummy.up.set(0, 0, 1); dummy.lookAt(target); dummy.up.set(0, 1, 0);
      camNow.pos.copy(dummy.position); camNow.quat.copy(dummy.quaternion); camNow.valid = true; camT = 1; wantAim = false;
    }
    if (dbgItem) {
      const di = items.find((i) => i.id === dbgItem!.id)!; const tanH = Math.tan(((camera.fov / 2) * Math.PI) / 180);
      const dist = (dbgItem.zoom * 0.9) / (2 * tanH); const p = dbgItem.pitch;
      const target = new Vector3(group.position.x + di.rest.x, group.position.y + di.rest.y, 0);
      dummy.position.set(target.x, target.y - dist * Math.sin(p), dist * Math.cos(p)); dummy.up.set(0, 1, 0); dummy.lookAt(target);
      camNow.pos.copy(dummy.position); camNow.quat.copy(dummy.quaternion); camNow.valid = true; camT = 1; wantAim = false;
    }
    if (state !== 'rest' && follow > 0) {
      if (!camNow.valid) { frame(camera, OVERVIEW.x, OVERVIEW.y, OVERVIEW.w, OVERVIEW.h, OVERVIEW.pitch, camNow); camNow.valid = true; camT = 1; }
      if (wantAim) { aimCamera(camera, aimDur); wantAim = false; }
      if (camT < 1) {
        camT = Math.min(1, camT + dt / camDur);
        const k = easeIO(camT);
        camNow.pos.lerpVectors(camFrom.pos, camTo.pos, k); camNow.quat.slerpQuaternions(camFrom.quat, camTo.quat, k);
        moving = true;
      }
      camera.position.lerp(camNow.pos, follow);
      camera.quaternion.slerp(camNow.quat, follow);
      camera.updateMatrixWorld(true);
    }
    return moving;
  };

  const ray = new Raycaster();
  return {
    attach,
    update: (dt, camera) => update(dt, camera),
    dispose() { rescueDesk?.dispose(); rescueScene?.dispose(); if (ctx) ctx.scene.remove(group); disposables.forEach((d) => d.dispose()); ctx = null; },
    ready,
    itemView(id: ItemId | null, open = 0, zoom = 1, pitch = 0.3) { dbgItem = id ? { id, open, zoom, pitch } : null; ctx?.invalidate(); },
    frontView(c: number | null = 0.9, elev = 0.27, zoom = 1) { dbg = c === null ? null : { clock: c, elev, zoom }; ctx?.invalidate(); },
    arrive() {
      buildAll();
      rescueScene?.close(); rescueDesk?.close();
      dbg = null; state = 'in'; clock = 0; opened = null; camNow.valid = false; follow = 0;
      items.forEach((it) => { it.open = 0; it.openTarget = 0; });
      bag.position.z = 0; bagLid.rotation.x = 0;
      // (motion turned down: the bag is open at once, everything already lying out)
      if (opts.reduced) clock = inEnd();
      ctx?.invalidate();
    },
    pack() {
      rescueScene?.close(); rescueDesk?.close();
      return new Promise<void>((resolve) => {
        const go = () => { state = 'packing'; clock = 0; packDone = resolve; ctx?.invalidate(); };
        const was = opened;
        if (was) { items.forEach((it) => { it.openTarget = 0; }); opened = null; wantAim = true; aimDur = opts.reduced ? 0.0001 : 0.5; }
        go();
        // an open box shuts first (its lid takes 0.45 s) while the camera steps back
        if (was) clock = -0.5;
        if (opts.reduced) { clock = packEnd(); items.forEach((it) => { it.open = 0; }); camT = 1; }
      });
    },
    leave() { state = 'out'; clock = opts.reduced ? 1.1 : 0; ctx?.invalidate(); },
    open(id: ItemId | null) {
      if (state !== 'open') return;
      opened = id;
      if (id === 'rescue') { rescueScene?.open(); rescueDesk?.open(); } else { rescueScene?.close(); rescueDesk?.close(); }
      items.forEach((it) => { it.openTarget = it.id === id ? 1 : 0; if (opts.reduced) it.open = it.openTarget; });
      wantAim = true; aimDur = opts.reduced ? 0.0001 : id === 'rescue' ? 0.46 : 0.8;
      ctx?.invalidate();
    },
    get opened() { return opened; },
    get state() { return state; },
    get rescue() { return rescueScene; },
    rescueStepAt(x: number, y: number, rect: DOMRect) {
      if (!lastCamera || state !== 'open' || opened !== 'rescue' || !rescueDesk) return null;
      ray.setFromCamera(new Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1), lastCamera);
      return rescueDesk.stepAt(ray);
    },
    rescueRects(rect: DOMRect) {
      const out = {} as ReturnType<BagLayer['rescueRects']>;
      if (!lastCamera) return out;
      const L = lastCamera.aspect < NARROW_BELOW_ASPECT ? NARROW : WIDE;
      const rects: Record<string, { x0: number; x1: number; y0: number; y1: number } | undefined> = { board: L.BOARD, map: L.MAP, print: 'PRINT' in L ? L.PRINT : undefined, part: 'PART' in L ? L.PART : undefined };
      group.updateMatrixWorld(true); lastCamera.updateMatrixWorld(true);
      const v = new Vector3();
      for (const [k, r] of Object.entries(rects)) {
        if (!r) continue;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const [px, py] of [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]]) {
          v.set(px, py, 0.012); group.localToWorld(v); v.project(lastCamera);
          const sx = (v.x * .5 + .5) * rect.width; const sy = (-v.y * .5 + .5) * rect.height;
          x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
        (out as Record<string, unknown>)[k] = { x0, y0, x1, y1 };
      }
      return out;
    },
    linkAt(x: number, y: number, rect: DOMRect) {
      if (!lastCamera || state !== 'open' || opened !== 'press' || !pressParts) return null;
      ray.setFromCamera(new Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1), lastCamera);
      const hit = ray.intersectObjects([pressParts.upper, pressParts.lower], false)[0];
      if (!hit?.uv) return null;
      // (the sheet is two halves: where the point lies down the whole sheet, 0 at its top)
      const fx = hit.uv.x; const fy = hit.object === pressParts.upper ? (1 - hit.uv.y) * 0.5 : 1 - hit.uv.y * pressParts.lowerSpan;
      return pressRegions.find((r) => fx >= r.x0 && fx <= r.x1 && fy >= r.y0 && fy <= r.y1)?.href ?? null;
    },
    hit(x: number, y: number, rect: DOMRect) {
      if (!lastCamera || (state !== 'open' && state !== 'rest')) return null;
      ray.setFromCamera(new Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1), lastCamera);
      const targets: Object3D[] = []; if (state === 'open') items.forEach((it) => { if (it.root.visible) targets.push(it.root); });
      const hits = ray.intersectObjects([...targets, bag], true);
      for (const h of hits) {
        let shown = true; for (let q: Object3D | null = h.object; q; q = q.parent) if (!q.visible) shown = false;
        if (!shown) continue;
        let o: Object3D | null = h.object;
        while (o && o !== group) {
          const it = items.find((i) => i.root === o); if (it) return it.id;
          if (o === bag) return 'bag';
          o = o.parent;
        }
      }
      return null;
    },
  };
}
