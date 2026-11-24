/**
 * Snapdeal on the mat, as the red courier bag its parcels came in (built from the photo Adi sent on 2026-11-20). A
 * MatLayer for the flip-book engine: it shares the engine's camera, window light, opening light and loop.
 *
 * The front is a fine grid of points pushed up into a low pillow with real folds in it, so the window lights one side of
 * each fold and shades the other. Its picture (mailerArt.ts) is the film's colour, fine creases, print, sealing strip
 * and shipping label. It is made in two pieces that meet along a jagged line down the right side: the body, and the
 * sealed end that tears off. Opened (mailerStory.ts keeps the time), the tear runs down that line, the torn end rolls
 * up as it goes and comes to rest under the bag, the mouth opens, and the invoice, a T-shirt, a box of earphones and a
 * shoebox slide out onto the mat one behind the other while the camera draws back to take them all in. Every
 * shadow is painted the engine's way, down and to the left. Nothing fades: solid things move as solid things.
 *
 * Units: the engine's table units (one closed book = 1 unit). The mat is the xy plane, z is up.
 */
import { BoxGeometry, BufferGeometry, CapsuleGeometry, CircleGeometry, SphereGeometry, CanvasTexture, ClampToEdgeWrapping, DoubleSide, Float32BufferAttribute, FrontSide, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, NoColorSpace, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three';
import { Object3D, Quaternion, Raycaster } from 'three';
import type { MatLayer, MatLayerContext } from '../../flipbook/matLayer';
import { INVOICE, MAILER, STRIP, TEAR_U, drawInside, drawInvoice, drawMailerFront, seeded } from './mailerArt';
import { CLOSE_SPEED, END, between, flow, stateAt } from './mailerStory';
import { PHONES, SHOEBOX, TAG, TAG_PX, TEE, drawCard, drawCardFace, drawFoam, drawKraft, drawKraftFace, drawPhonesTop, drawSeal, drawShoeLid, drawTag, drawTeePhoto, drawTissue, greyLookup } from './parcelArt';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* ---------- the engine's own shading, copied (it is private to lib/mat/zomatoBag.ts) ---------- */

const DAWN = /* glsl */ `
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}`;
/**
 * The film's points. Two things can move them: the strip (uPeel 1) rolls up from the top down to the rip point as the
 * tear runs, the newest turn on the outside; the body (uPeel 0) lifts and draws back its lip along the tear once the
 * strip is off, which opens the mouth.
 */
const FILM_VERTEX = /* glsl */ `
attribute float aEdge;
uniform float uRip; uniform float uTorn; uniform float uPeel; uniform float uLean; uniform float uGape; uniform float uHalfH;
uniform float uRin; uniform float uRgrow; uniform float uSag;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying float vEdge; varying float vTorn;
void main() {
  vec3 p = position; vec3 n = normal; vUv = uv; vEdge = aEdge;
  float s = position.y - uRip;
  vTorn = step(0.0, s);
  if (uPeel > 0.5) {
    if (s > 0.0) {
      float S = max(uTorn, 0.0001);
      float rOut = uRin + uRgrow * S;
      float rm = 0.5 * (rOut + uRin);
      float a = s / rm;
      float r = mix(rOut, uRin, clamp(s / S, 0.0, 1.0));
      float ca = cos(a), sa = sin(a);
      p.y = uRip + r * sa;
      p.z = position.z + rOut - r * ca;
      n = vec3(n.x, n.y * ca - n.z * sa, n.y * sa + n.z * ca);
      p.x += uLean * smoothstep(0.0, rm * 3.0, s);
    }
  } else {
    float along = 1.0 - pow(min(1.0, abs(position.y) / uHalfH), 2.0);
    // as the parcel empties, the film settles down onto the mat
    p.z = mix(p.z, 0.004 + (p.z - 0.004) * 0.38, uSag);
    float lip = exp(-aEdge / 0.07) * uGape * along;
    p.z += lip * 0.03; p.x -= lip * 0.04;
  }
  vN = normalize(mat3(modelMatrix) * n);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/** A plain flat sheet (the invoice, the bag's inside): nothing torn, nothing moved here. */
const SHEET_VERTEX = /* glsl */ `
uniform float uBend;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying float vEdge; varying float vTorn;
void main() {
  vN = normalize(mat3(modelMatrix) * normal); vUv = uv; vEdge = 1.0; vTorn = 0.0;
  // a sheet carried through the air: held by its middle, its ends trail up (uBend 0 flat, 1 fully curved)
  vec2 c = uv - 0.5;
  vec3 p = position; p.z += uBend * 0.09 * (c.x * c.x * 2.6 + c.y * c.y * 1.2);
  vec3 n = normalize(normal + vec3(-uBend * 0.47 * c.x, -uBend * 0.22 * c.y, 0.0));
  vN = normalize(mat3(modelMatrix) * n);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/**
 * The shirt, laid out flat in its geometry and folded by this shader as a shop folds one: the two sides (sleeves and a
 * strip of body) turn in over the chest about the lines x = +-uXF, then the hem turns up over everything about y = uYF.
 * uSide and uHem run 1 (folded) to 0 (open); each layer is lifted just clear of the ones it lies on. Normals turn with the
 * cloth, so the light runs over each panel as it swings.
 */
const SHIRT_VERTEX = /* glsl */ `
uniform float uSide; uniform float uHem; uniform float uXF; uniform float uYF;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying float vEdge; varying float vTorn;
const float PI = 3.14159265;
void main() {
  vUv = uv; vEdge = 1.0; vTorn = 0.0;
  vec3 p = position; vec3 n = normal;
  float ax = abs(position.x);
  if (ax > uXF) {
    float s = sign(position.x); float d = ax - uXF; float th = uSide * PI; float c = cos(th), sn = sin(th);
    float lz = p.z;
    p.x = s * (uXF + d * c - lz * sn);
    p.z = d * sn + lz * c + 0.02 * (1.0 - c) * 0.5;
    float nl = s * n.x; float nr = nl * c - n.z * sn; float nz = nl * sn + n.z * c;
    n = vec3(s * nr, n.y, nz);
  }
  if (position.y < uYF) {
    float d = uYF - position.y; float th = uHem * PI; float c = cos(th), sn = sin(th);
    float lz = p.z;
    p.y = uYF - (d * c - lz * sn);
    p.z = d * sn + lz * c + 0.072 * (1.0 - c) * 0.5;
    float nl = -n.y; float nr = nl * c - n.z * sn; float nz = nl * sn + n.z * c;
    n = vec3(n.x, -nr, nz);
  }
  vN = normalize(mat3(modelMatrix) * n);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/**
 * Plastic film lit by the window. Each fold's lit side is brighter and its far side deeper (as the Zomato bag's faces
 * are). The shine is a soft band on the slopes turned to the window, never a mirror: no reflections of a room.
 * White print and the paper label keep their white whichever way the film leans. Seen from behind (the rolled strip)
 * the film is plain red. Along a torn edge the plastic has stretched and gone pale.
 */
const FILM_FRAGMENT = /* glsl */ `
uniform sampler2D tMap; uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn; uniform float uSheen;
uniform vec3 uBack;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying float vEdge; varying float vTorn;
${DAWN}
void main() {
  vec4 t = texture2D(tMap, vUv);
  if (t.a < 0.5) discard;
  vec3 n = normalize(vN);
  vec3 base = t.rgb;
  if (!gl_FrontFacing) { n = -n; base = uBack; }
  float pale = vTorn * (1.0 - smoothstep(0.0, 0.013, vEdge));
  base = mix(base, vec3(0.98, 0.85, 0.85), pale * 0.72);
  float k = clamp(0.66 + 0.42 * dot(n, uLight), 0.42, 1.12);
  float ink = smoothstep(0.74, 0.9, min(base.r, min(base.g, base.b)));
  k = mix(k, 1.0, ink * 0.8);
  vec3 col = base * k;
  vec3 V = normalize(cameraPosition - vW);
  vec3 H = normalize(uLight + V);
  float nh = max(dot(n, H), 0.0);
  float sheen = max(0.0, pow(nh, 34.0) - 0.4) * 0.6 + pow(nh, 240.0) * 0.1;
  col += uSheen * sheen * (1.0 - ink) * vec3(1.0, 0.84, 0.82);
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.2 * (1.0 - ink));
  gl_FragColor = vec4(col * dawnLight(), 1.0);
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

/* ---------- the film's shape ---------- */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (ix: number, iy: number) => { const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
/** Soft random bumps, -1 to 1, the same every time. */
function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y); const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

interface Fold { x: number; y: number; dx: number; dy: number; wide: number; long: number; amp: number }
/** The big folds in the film: where each lies, which way it runs, how wide, how long, how high (or deep). */
export function mailerFolds(): Fold[] {
  const rnd = seeded(771);
  const folds: Fold[] = [];
  for (let i = 0; i < 13; i++) {
    const family = rnd();
    const ang = (family < 0.45 ? 0.62 : family < 0.85 ? -0.5 : rnd() * Math.PI) + (rnd() - 0.5) * 0.5;
    folds.push({
      // (most lie toward an edge: the middle of the real bag is smooth)
      x: (rnd() < 0.5 ? -1 : 1) * (0.2 + rnd() * 0.26) * MAILER.w, y: (rnd() - 0.5) * MAILER.h * 0.9, dx: Math.cos(ang), dy: Math.sin(ang),
      wide: 0.02 + rnd() * 0.03, long: 0.14 + rnd() * 0.26, amp: (rnd() < 0.6 ? 1 : -1) * (0.008 + rnd() * 0.011),
    });
  }
  // film pulled tight over what is inside creases from each corner toward the middle
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    for (let k = 0; k < 2; k++) {
      const ang = Math.atan2(-sy * MAILER.h, -sx * MAILER.w) + (k ? 0.34 : -0.3) + (rnd() - 0.5) * 0.2;
      const far = 0.2 + rnd() * 0.08;
      folds.push({
        x: sx * MAILER.w * 0.5 + Math.cos(ang) * far, y: sy * MAILER.h * 0.5 + Math.sin(ang) * far, dx: Math.cos(ang), dy: Math.sin(ang),
        wide: 0.016 + rnd() * 0.012, long: 0.13 + rnd() * 0.06, amp: (k ? 1 : -1) * (0.01 + rnd() * 0.006),
      });
    }
  }
  return folds;
}

/** How high the film stands above the mat at a point of the bag (x, y from its middle, table units). */
export function mailerHeight(x: number, y: number, folds: Fold[]): number {
  const u = x / MAILER.w + 0.5, v = y / MAILER.h + 0.5;
  const edge = Math.min(u * MAILER.w, (1 - u) * MAILER.w, v * MAILER.h, (1 - v) * MAILER.h);
  // a low pillow: sealed flat at the edges, lifted by what is inside
  let z = 0.003 + 0.024 * smooth(0, 0.085, edge);
  // what is inside is a flat stack: its edge presses up through the film
  const stack = Math.min((u - 0.1) * MAILER.w, (0.8 - u) * MAILER.w, (v - 0.09) * MAILER.h, (0.9 - v) * MAILER.h);
  z += 0.011 * smooth(0, 0.022, stack);
  let loose = 0;
  for (const f of folds) {
    const rx = x - f.x, ry = y - f.y;
    const across = (rx * -f.dy + ry * f.dx) / f.wide, along = (rx * f.dx + ry * f.dy) / f.long;
    loose += f.amp * Math.exp(-across * across) * Math.exp(-along * along);
  }
  loose += 0.0032 * noise(x * 7.3 + 11, y * 7.3 + 5) + 0.0016 * noise(x * 19 + 3, y * 19 + 8);
  z += loose * smooth(0, 0.05, edge);
  // the flap side is two layers pressed flat
  z *= 1 - 0.5 * smooth(STRIP.from - 0.035, STRIP.from + 0.01, u);
  return Math.max(0.002, z);
}

/* ---------- the two pieces of the front, meeting along the tear ---------- */

const ROWS = 98;
/** The tear's line down the bag: where it crosses each row of points (x from the bag's middle). Jagged, the same every time. */
export function tearLine(): number[] {
  const rnd = seeded(5150);
  const line: number[] = [];
  for (let j = 0; j <= ROWS; j++) {
    const tooth = j === 0 || j === ROWS ? 0 : (j % 2 ? 1 : -1) * 0.0028 + (rnd() - 0.5) * 0.004;
    line.push(MAILER.w * (TEAR_U - 0.5) + tooth);
  }
  return line;
}

/** One piece of the front: the body (left of the tear) or the strip (right of it). Both take their points from the same shape. */
function piece(which: 'body' | 'strip', folds: Fold[], tear: number[]): BufferGeometry {
  const cols = which === 'body' ? 66 : 14;
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], edge: number[] = [], index: number[] = [];
  const e = 0.004;
  for (let j = 0; j <= ROWS; j++) {
    const y = MAILER.h / 2 - (j * MAILER.h) / ROWS;
    for (let i = 0; i <= cols; i++) {
      const f = i / cols;
      const x = which === 'body' ? -MAILER.w / 2 + (tear[j] + MAILER.w / 2) * f : tear[j] + (MAILER.w / 2 - tear[j]) * f;
      const z = mailerHeight(x, y, folds);
      // the cut edges of the film are never ruler-straight: they wander a little
      const rim = Math.min(MAILER.w / 2 - Math.abs(x), MAILER.h / 2 - Math.abs(y));
      const loose = (1 - smooth(0, 0.06, rim)) * 0.0045;
      pos.push(x + loose * noise(y * 6.1 + 2, x * 2.3), y + loose * noise(x * 6.1 + 9, y * 2.3), z);
      // the slope of the film here, from its own shape (so the two pieces shade as one across the tear)
      const nx = -(mailerHeight(x + e, y, folds) - mailerHeight(x - e, y, folds)) / (2 * e);
      const ny = -(mailerHeight(x, y + e, folds) - mailerHeight(x, y - e, folds)) / (2 * e);
      const len = Math.hypot(nx, ny, 1);
      nor.push(nx / len, ny / len, 1 / len);
      uv.push(x / MAILER.w + 0.5, y / MAILER.h + 0.5);
      edge.push(Math.abs(x - tear[j]));
    }
  }
  const row = cols + 1;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < cols; i++) {
    const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
    index.push(a, c, b, b, c, d);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2)); geo.setAttribute('aEdge', new Float32BufferAttribute(edge, 1));
  geo.setIndex(index);
  return geo;
}

/* ---------- the layer ---------- */

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image(); image.decoding = 'async';
  image.onload = () => { if (image.decode) image.decode().then(() => resolve(image), () => resolve(image)); else resolve(image); };
  image.onerror = () => reject(new Error(`could not load ${src}`)); image.src = src;
});

export interface MailerLayer extends MatLayer {
  ready: Promise<void>;
  /** The camera is coming down to the bag: tear it open. */
  arrive(): void;
  /** The camera is leaving: everything goes back, quickly, and the bag is whole again. */
  leave(): void;
  /** For captures: show one moment of the opening (seconds, 0 to END) and hold it. */
  pose(t: number): void;
  readonly open: boolean;
  /** Which readable thing (the invoice, the shirt's tag, the box) is under a point of the window, once all have landed. */
  hit(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): 'invoice' | 'tag' | 'box' | null;
  /** Come down over one thing to read it; null draws back to the whole parcel. */
  read(id: 'invoice' | 'tag' | 'box' | null): void;
  readonly reading: 'invoice' | 'tag' | 'box' | null;
  /** Debug: how strong the film's shine is. */
  setSheen(value: number): void;
}

/** The rolled strip: its innermost turn's radius, and how much wider the roll is once the whole strip is in it. */
const ROLL = { inner: 0.011, grown: 0.03 } as const;

export function createMailerLayer(opts: { /** the bag's middle on the mat and its turn in degrees (table units) */ x: number; y: number; turn: number; mark: string; word: string; reduced: boolean; /** for a still of one thing beside the bag: 'tee' shows the bag and the folded shirt only */ only?: 'tee' }): MailerLayer {
  let ctx: MatLayerContext | null = null;
  let group: Group | null = null;
  const disposables: Array<{ dispose(): void }> = [];
  const shadows: Mesh[] = [];
  let done: () => void = () => undefined;
  let failed: (error: unknown) => void = () => undefined;
  const ready = new Promise<void>((resolve, reject) => { done = resolve; failed = reject; });
  const turn = (opts.turn * Math.PI) / 180;
  const cosT = Math.cos(turn), sinT = Math.sin(turn);
  /** A point of the bag's own frame, on the mat. */
  const onMat = (x: number, y: number) => new Vector2(opts.x + x * cosT - y * sinT, opts.y + x * sinT + y * cosT);

  let clock = 0; let target = 0;
  /** What the camera takes in once the bag is open (from the bag's middle): the bag, the rolled end, and the four things out of it. */
  const FRAME = opts.only === 'tee' ? { x: 0.5, y: -0.02, w: 2.05, h: 1.3, pitch: 0.56 } : { x: 0.72, y: -0.04, w: 2.5, h: 1.35, pitch: 0.56 };
  // (a camera, not a plain object: a camera's lookAt turns its view toward the point, a plain object's turns its back)
  const eye = new PerspectiveCamera();
  // Reading one of the things (Adi, 2026-11-23: each should be clickable and readable): the camera comes down over it,
  // squares up to its sheet and fills the window with it. readK glides 0 (the whole parcel) to 1 (that one thing).
  type Readable = 'invoice' | 'tag' | 'box';
  let reading: Readable | null = null; let readId: Readable = 'invoice'; let readK = 0;
  const readTargets: Partial<Record<Readable, { node: Object3D; w: number; h: number }>> = {};
  let phonesNode: Object3D | null = null; let teeNode: Object3D | null = null;
  const raycaster = new Raycaster(); let lastCamera: PerspectiveCamera | null = null;
  const READ_PITCH = 0.2;
  const readEye = new PerspectiveCamera(); const tmpQ = new Quaternion(); const tmpP = new Vector3(); const tmpU = new Vector3();
  const aim = (camera: PerspectiveCamera) => {
    const tanH = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    // (a slow push in while the bag opens, so the camera is never quite still)
    const near = 1 - 0.05 * flow(between(clock, 0.2, END));
    const dist = near * Math.max((FRAME.h * Math.cos(FRAME.pitch) * 1.05) / (2 * tanH), (FRAME.w * 1.04) / (2 * tanH * camera.aspect));
    const at = onMat(FRAME.x + 0.03 * flow(between(clock, 0.2, END)), FRAME.y);
    eye.position.set(at.x, at.y - dist * Math.sin(FRAME.pitch), dist * Math.cos(FRAME.pitch));
    eye.up.set(0, 1, 0); eye.lookAt(at.x, at.y, 0);
    // the engine has already placed the camera for its own flight: this leans it toward the layer's framing as the bag opens
    const follow = flow(between(clock, 0.1, 1.15));
    camera.position.lerp(eye.position, follow); camera.quaternion.slerp(eye.quaternion, follow); camera.updateMatrixWorld(true);
    // reading: come down over the one thing, its sheet square to the window, and fill the window with it
    const t = readTargets[readId];
    if (t && readK > 0.001) {
      t.node.updateWorldMatrix(true, false);
      t.node.getWorldPosition(tmpP); t.node.getWorldQuaternion(tmpQ);
      tmpU.set(0, 1, 0).applyQuaternion(tmpQ); tmpU.z = 0; if (tmpU.lengthSq() < 1e-4) tmpU.set(0, 1, 0); tmpU.normalize();
      const dist = Math.max((t.h * 1.1 * Math.cos(READ_PITCH)) / (2 * tanH), (t.w * 1.1) / (2 * tanH * camera.aspect));
      readEye.position.set(tmpP.x - tmpU.x * dist * Math.sin(READ_PITCH), tmpP.y - tmpU.y * dist * Math.sin(READ_PITCH), tmpP.z + dist * Math.cos(READ_PITCH));
      readEye.up.set(tmpU.x, tmpU.y, 0); readEye.lookAt(tmpP.x, tmpP.y, tmpP.z);
      const k = flow(readK);
      camera.position.lerp(readEye.position, k); camera.quaternion.slerp(readEye.quaternion, k); camera.updateMatrixWorld(true);
    }
  };
  let pose: ((t: number) => void) | null = null;
  let sheen: { value: number } | null = null;

  function build(c: MatLayerContext, mark: HTMLImageElement, word: HTMLImageElement, teeImages: { cut: HTMLImageElement; shade: HTMLImageElement; height: HTMLImageElement; watch: HTMLImageElement }) {
    const texture = (canvas: HTMLCanvasElement) => {
      const t = new CanvasTexture(canvas);
      t.colorSpace = NoColorSpace; t.wrapS = t.wrapT = ClampToEdgeWrapping; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter;
      t.anisotropy = c.maxAnisotropy; t.generateMipmaps = true; disposables.push(t); return t;
    };
    const shared = { uLight: { value: LIGHT }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uDawn: c.dawn };
    const uRip = { value: MAILER.h as number }; const uTorn = { value: 0 }; const uGape = { value: 0 }; const uLean = { value: 0 }; const uSag = { value: 0 };
    const uSheen = { value: 0.8 }; sheen = uSheen;
    const filmMat = (peel: number, map: CanvasTexture) => {
      const m = new ShaderMaterial({
        vertexShader: FILM_VERTEX, fragmentShader: FILM_FRAGMENT, transparent: true, depthTest: true, depthWrite: true, side: peel ? DoubleSide : FrontSide,
        uniforms: { ...shared, tMap: { value: map }, uSheen, uBack: { value: new Vector3(0.8, 0.13, 0.19) }, uRip, uTorn, uGape, uLean, uSag, uPeel: { value: peel }, uHalfH: { value: MAILER.h / 2 }, uRin: { value: ROLL.inner }, uRgrow: { value: ROLL.grown / MAILER.h } },
      });
      disposables.push(m); return m;
    };
    const sheetMat = (map: CanvasTexture) => {
      const m = new ShaderMaterial({
        vertexShader: SHEET_VERTEX, fragmentShader: FILM_FRAGMENT, transparent: true, depthTest: true, depthWrite: true,
        uniforms: { ...shared, tMap: { value: map }, uSheen: { value: 0 }, uBack: { value: new Vector3(0.9, 0.9, 0.88) }, uBend: { value: 0 } },
      });
      disposables.push(m); return m;
    };
    const solid = (geo: BufferGeometry, mat: ShaderMaterial | ShaderMaterial[]) => { disposables.push(geo); const m = new Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 40; return m; };
    const caster = (half: Vector2, r: number, top: number) => {
      const reach = 3.2;
      const geo = new PlaneGeometry(reach, reach); disposables.push(geo);
      const mat = new ShaderMaterial({
        vertexShader: SHADOW_VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uC: { value: new Vector2() }, uAng: { value: turn }, uHalf: { value: half }, uR: { value: r }, uB: { value: 0 }, uT: { value: top }, uDir: { value: SHADOW_DIR }, uStrength: { value: 1 }, uAlpha: { value: 1 }, uDawn: c.dawn, uScreen: { value: c.screenSize } },
      });
      disposables.push(mat);
      const mesh = new Mesh(geo, mat); mesh.position.set(opts.x, opts.y, 0.0006); mesh.frustumCulled = false; mesh.renderOrder = 1.7;
      shadows.push(mesh); c.scene.add(mesh);
      return mat.uniforms;
    };

    const front = texture(drawMailerFront(mark, word));
    const folds = mailerFolds(); const tear = tearLine();
    const tearX = MAILER.w * (TEAR_U - 0.5);
    const stripW = MAILER.w / 2 - tearX;
    group = new Group(); group.position.set(opts.x, opts.y, 0); group.rotation.z = turn;
    group.add(solid(piece('body', folds, tear), filmMat(0, front)));
    // the strip hangs on a pivot at the foot of the tear, where its roll ends up, so the roll can be carried off and turned
    const foot = new Vector3(tearX + stripW / 2, -MAILER.h / 2, 0);
    const pivot = new Group(); pivot.position.copy(foot);
    const strip = solid(piece('strip', folds, tear), filmMat(1, front)); strip.position.copy(foot).multiplyScalar(-1);
    pivot.add(strip); group.add(pivot);
    // the bag's inside, seen through the mouth once the lip draws back
    const inside = solid(new PlaneGeometry(0.2, MAILER.h - 0.07), sheetMat(texture(drawInside())));
    inside.position.set(tearX - 0.1, 0, 0.0016); group.add(inside);
    // the invoice, lying inside until the strip is off
    const invoiceMat = sheetMat(texture(drawInvoice(mark, word)));
    const invoice = solid(new PlaneGeometry(INVOICE.w, INVOICE.h, 18, 24), invoiceMat);
    group.add(invoice);
    readTargets.invoice = { node: invoice, w: INVOICE.w, h: INVOICE.h };

    // the three things packed with the invoice. Each is a group that lies flat inside the bag and stands to its full
    // height once it is clear of the mouth (a flat courier bag cannot hold a box at its full height)
    const kraft = sheetMat(texture(drawKraft())); const card = sheetMat(texture(drawCard())); const dark = sheetMat(texture(drawCard('#16181d')));
    let tagMatRef: ShaderMaterial | null = null;
    /** Where the shirt folds (from its middle): its sides turn in at x = +-FOLD.x, its hem turns up at y = FOLD.y. Folded it is 0.32 by 0.56. */
    const FOLD = { x: 0.16, y: -0.14 };
    const tee = new Group(); teeNode = tee;
    let placeTag: (k: number) => { x: number; y: number; turn: number; out: number } = () => ({ x: 0, y: 0, turn: 0, out: 0 });
    {
      // The folded shirt: a photo of a real folded tee cut on its own outline (assets/tee-cut.webp), standing off the mat by
      // its height picture (assets/tee-height.webp: the stack rolling down to nothing at the outline, and the folds the
      // photo shows), with the team print laid into it (drawTeePhoto).
      const geo = new PlaneGeometry(TEE.w, TEE.h, 140, 182); const pos = geo.attributes.position; const uv0 = geo.attributes.uv;
      const height = greyLookup(teeImages.height);
      for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.0015 + TEE.thick * height(uv0.getX(i), uv0.getY(i)));
      geo.computeVertexNormals();
      tee.add(solid(geo, sheetMat(texture(drawTeePhoto(teeImages.cut, teeImages.shade, mark, word)))));
      // the hang tag, on a string from the neck: it travels tucked on the shirt and swings out to lie on the mat beside it
      const tagMat = sheetMat(texture(drawTag())); tagMatRef = tagMat;
      const tag = solid(new PlaneGeometry(TAG.w, TAG.h, 10, 12), tagMat);
      tee.add(tag);
      readTargets.tag = { node: tag, w: TAG.w, h: TAG.h };
      const N = 18, wide = 0.0035;
      const sg = new BufferGeometry(); const spots = new Float32BufferAttribute(new Float32Array((N + 1) * 6), 3);
      const nrm: number[] = [], uvs: number[] = [], idx: number[] = [];
      for (let i = 0; i <= N; i++) { nrm.push(0, 0, 1, 0, 0, 1); uvs.push(0.5, 0.5, 0.5, 0.5); if (i < N) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
      sg.setAttribute('position', spots); sg.setAttribute('normal', new Float32BufferAttribute(nrm, 3)); sg.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); sg.setIndex(idx);
      const stringMat = sheetMat(texture(drawCard('#e6dcc2'))); stringMat.side = DoubleSide;
      tee.add(solid(sg, stringMat));
      const TUCKED = { x: 0.08, y: 0.05, turn: 0.16 }, OUTSIDE = { x: TEE.w / 2 + 0.05 + TAG.w / 2, y: 0.02, turn: -0.1 };
      const holeUp = TAG.h / 2 - TAG.h * (TAG_PX.hole / (TAG_PX.w * TAG.h / TAG.w));
      placeTag = (k) => {
        const u = flow(between(k, 0.55, 1));
        const x = TUCKED.x + (OUTSIDE.x - TUCKED.x) * u, y = TUCKED.y + (OUTSIDE.y - TUCKED.y) * u, at = TUCKED.turn + (OUTSIDE.turn - TUCKED.turn) * u;
        // (tucked, it lies on top of the cloth: the sculpted shirt stands about 0.045 high where its sleeves and collar are)
        // (it stays up on the cloth until it is clear of the shirt's edge, then lies down on the mat)
        const z = TEE.thick + 0.02 + (0.003 - TEE.thick - 0.02) * flow(between(u, 0.86, 1));
        tag.position.set(x, y, z); tag.rotation.z = at;
        // the string: from the neck to the tag's hole, with a slack bow in it once the tag is out
        const fx = 0.04, fy = TEE.h / 2 - 0.07, fz = TEE.thick + 0.01;
        const hx = x - Math.sin(at) * holeUp, hy = y + Math.cos(at) * holeUp, hz = z + 0.002;
        const mx = (fx + hx) / 2 + 0.03 * u, my = (fy + hy) / 2 + 0.07 * u, mz = Math.max(fz, hz) + 0.012;
        for (let i = 0; i <= N; i++) {
          const t = i / N, c0 = (1 - t) * (1 - t), c1 = 2 * t * (1 - t), c2 = t * t;
          const px = c0 * fx + c1 * mx + c2 * hx, py = c0 * fy + c1 * my + c2 * hy, pz = c0 * fz + c1 * mz + c2 * hz;
          const dx = 2 * (1 - t) * (mx - fx) + 2 * t * (hx - mx), dy = 2 * (1 - t) * (my - fy) + 2 * t * (hy - my); const dl = Math.hypot(dx, dy) || 1;
          spots.setXYZ(i * 2, px - (dy / dl) * wide, py + (dx / dl) * wide, pz); spots.setXYZ(i * 2 + 1, px + (dy / dl) * wide, py - (dx / dl) * wide, pz);
        }
        spots.needsUpdate = true;
        return { x, y, turn: at, out: u };
      };
    }
    // The earbuds box: a white card box with a deep lid over a shallow base, the seam between them running all the way
    // round, every edge rounded and rubbed, the picture and the 14% printed on the lid.
    const phones = new Group(); phonesNode = phones;
    const phonesLid = new Group();
    const lidTallP = PHONES.tall * 0.62, baseTallP = PHONES.tall * 0.5;
    {
      // The stock box (first-party warehousing; the watch inside is only the stock): navy card, a deep lid over a shallow base, the seam all the way round, edges rounded and rubbed.
      const navy = '#1d2a46';
      const side = sheetMat(texture(drawCardFace(256, 96, 12, navy))); const end = sheetMat(texture(drawCardFace(256, 96, 13, navy)));
      const baseCard = sheetMat(texture(drawCardFace(256, 256, 14, navy)));
      const base = solid(new RoundedBoxGeometry(PHONES.w - 0.007, PHONES.h - 0.007, baseTallP, 3, 0.004), [side, side, end, end, baseCard, baseCard]);
      base.position.z = baseTallP / 2; phones.add(base);
      const lid = solid(new RoundedBoxGeometry(PHONES.w, PHONES.h, lidTallP, 4, 0.006), [side, side, end, end, sheetMat(texture(drawPhonesTop())), baseCard]);
      phonesLid.add(lid); readTargets.box = { node: lid, w: PHONES.w, h: PHONES.h }; phonesLid.position.z = PHONES.tall - lidTallP / 2; phones.add(phonesLid);
      // inside: a navy velvet tray, and the watch on its cushion (a photo of a generic watch, cut on its outline),
      // the cushion standing up off the tray as a soft pillow
      const tray = solid(new PlaneGeometry(PHONES.w - 0.02, PHONES.h - 0.02), sheetMat(texture(drawFoam('#15203a'))));
      tray.position.z = baseTallP + 0.0008; phones.add(tray);
      const ch = PHONES.h - 0.05, cw = ch * teeImages.watch.width / teeImages.watch.height;
      const pg = new PlaneGeometry(cw, ch, 40, 44); const pp = pg.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i) / (cw / 2), y = pp.getY(i) / (ch / 2);
        pp.setZ(i, 0.03 * Math.max(0, (1 - x ** 4) * (1 - y ** 4)) ** 0.7);
      }
      pg.computeVertexNormals();
      const cushion = solid(pg, sheetMat(texture(teeImages.watch as unknown as HTMLCanvasElement)));
      cushion.position.set(0, 0, baseTallP + 0.002); phones.add(cushion);
    }

    /** Where each thing comes to rest (from the bag's middle), its footprint, its height, and how flat it lies inside. */
    const things = [
      { g: tee, w: TEE.w, h: TEE.h, tall: TEE.thick, flat: 0.25, base: 0.0045, rest: opts.only === 'tee' ? { x: 1.0, y: 0.0, turn: 0.05 } : { x: 1.36, y: 0.12, turn: 0.04 }, r: 0.03, lift: 0.3, spin: 0.55, tip: [0.35, -0.2] },
      { g: phones, w: PHONES.w, h: PHONES.h, tall: PHONES.tall, flat: 0.16, base: 0.003, rest: { x: 0.74, y: -0.4, turn: -0.08 }, r: 0.012, lift: 0.26, spin: -0.8, tip: [-0.3, 0.45] },
    ].map((thing) => {
      group!.add(thing.g);
      // (the shirt's shadow is tucked in under its soft rolled edges, rounder and softer than a box's)
      const soft = thing.g === tee;
      const shadow = caster(soft ? new Vector2(thing.w * 0.44, thing.h * 0.45) : new Vector2(thing.w / 2, thing.h / 2), soft ? 0.09 : thing.r, thing.tall);
      if (soft) shadow.uStrength.value = 0.75;
      return { ...thing, shadow };
    });
    const tagShadow = caster(new Vector2(TAG.w / 2, TAG.h / 2), 0.008, 0.01);
    const phonesLidShadow = caster(new Vector2(PHONES.w / 2, PHONES.h / 2), 0.006, 0.05); phonesLidShadow.uAlpha.value = 0;

    // the body's shadow, and the shadow of the part of the sealed end that is still on (it shortens from the top as the tear runs)
    const bodyShadow = caster(new Vector2((MAILER.w - stripW) / 2, MAILER.h / 2), 0.03, 0.05);
    bodyShadow.uC.value.copy(onMat(-stripW / 2, 0));
    const endShadow = caster(new Vector2(stripW / 2 + 0.02, MAILER.h / 2), 0.03, 0.05);
    const rollShadow = caster(new Vector2(stripW / 2, ROLL.inner + ROLL.grown), 0.012, 0.06);
    const paperShadow = caster(new Vector2(INVOICE.w / 2, INVOICE.h / 2), 0.004, 0.012);
    c.scene.add(group);

    const IN = { x: -0.035, y: 0, turn: 0 }; const OUT = { x: 0.76, y: 0.2, turn: -0.05 };
    const REST = { x: foot.x + 0.02, y: foot.y - 0.11, turn: -0.5 };
    pose = (t) => {
      const s = stateAt(t);
      // the tear: the rip point runs from just above the top to just below the foot
      uRip.value = MAILER.h / 2 + 0.01 - s.rip * (MAILER.h + 0.02);
      uTorn.value = Math.max(0, MAILER.h / 2 - uRip.value);
      uLean.value = 0.03 * flow(s.rip * 3);
      uGape.value = s.gape;
      // the sealed end's shadow reaches only as far up as the end is still on the bag
      const left = Math.max(0, Math.min(MAILER.h, uRip.value + MAILER.h / 2));
      endShadow.uHalf.value.set(stripW / 2 + 0.02, left / 2);
      endShadow.uC.value.copy(onMat(tearX + stripW / 2 - 0.02, -MAILER.h / 2 + left / 2));
      endShadow.uAlpha.value = left > 0.02 ? 1 : left / 0.02;
      // the roll: carried from the foot of the tear to its place under the bag, in a low arc
      const rx = foot.x + (REST.x - foot.x) * s.free, ry = foot.y + (REST.y - foot.y) * s.free;
      pivot.position.set(rx, ry, Math.sin(Math.PI * s.free) * 0.025);
      pivot.rotation.z = REST.turn * s.free;
      // the roll's shadow lies under the roll itself: the roll sits at the rip point, in the pivot's own turned frame
      const ca = Math.cos(pivot.rotation.z), sa = Math.sin(pivot.rotation.z);
      const lx = uLean.value, ly = uRip.value - foot.y;
      rollShadow.uC.value.copy(onMat(rx + lx * ca - ly * sa, ry + lx * sa + ly * ca));
      rollShadow.uAng.value = turn + pivot.rotation.z;
      rollShadow.uAlpha.value = flow(s.rip * 2.5);
      rollShadow.uHalf.value.set(stripW * 0.44, (ROLL.inner + ROLL.grown * s.rip) * 0.8);
      // The things come out the way a hand takes them out of a parcel: drawn out low through the mouth (under the film,
      // never through it), lifted clear as they leave it, carried through the air in one arc, turning and tipping as
      // they go, and set down flat in their places. One continuous path each, a fast start and a long soft landing
      // (glide), each a beat behind the one before. Nothing bounces. Every shadow lifts off the mat with its thing.
      const carry = (k: number, from: { x: number; y: number }, to: { x: number; y: number; turn: number }, w: number, peak: number, spin: number, tip: number[]) => {
        // the path on the mat: out along the bag first, then round to the place (a cubic curve)
        const x0 = from.x, y0 = from.y, x1 = tearX + 0.42, y1 = from.y + (to.y - from.y) * 0.1;
        const x2 = to.x - 0.06, y2 = to.y + (to.y > 0 ? 0.12 : -0.08), x3 = to.x, y3 = to.y;
        const u = k, a0 = (1 - u) ** 3, a1 = 3 * u * (1 - u) ** 2, a2 = 3 * u * u * (1 - u), a3 = u ** 3;
        const x = a0 * x0 + a1 * x1 + a2 * x2 + a3 * x3, y = a0 * y0 + a1 * y1 + a2 * y2 + a3 * y3;
        // how far it is out of the mouth: 0 its leading edge at the tear, 1 its trailing edge clear
        const clear = (x + w / 2 - tearX) / w;
        // lifted as it clears the mouth, carried, and set down: the height falls to nothing as it arrives
        // (a thing is drawn out low and flat; it lifts only once it is clear of the mouth, so it never passes through the bag)
        const up = flow(between(clear, 0.95, 1.3)) * (1 - flow(between(k, 0.5, 1)));
        const air = Math.sin(Math.PI * clamp(k * 1.15, 0, 1));
        return { x, y, z: peak * up, clear, up, turnZ: to.turn * k + spin * air * (1 - k), tipX: tip[0] * up, tipY: tip[1] * up };
      };
      // the invoice
      {
        const m = carry(s.out, IN, OUT, INVOICE.w, 0.26, -0.45, [0.22, -0.18]);
        invoice.position.set(m.x, m.y, 0.0026 + m.z); invoice.rotation.set(m.tipX, m.tipY, m.turnZ);
        invoiceMat.uniforms.uBend.value = m.up;
        paperShadow.uC.value.copy(onMat(m.x, m.y)); paperShadow.uAng.value = turn + m.turnZ;
        paperShadow.uB.value = m.z; paperShadow.uT.value = m.z + 0.012;
        paperShadow.uAlpha.value = between(m.clear, 0.1, 0.5);
      }
      // the three things
      let gone = 0;
      things.forEach((thing, i) => {
        const k = s.items[i];
        const m = carry(k, IN, thing.rest, thing.w, thing.lift, thing.spin, thing.tip);
        // squeezed flat in a flat bag; full height once it is out of it
        const stand = thing.flat + (1 - thing.flat) * flow(between(m.clear, 1.0, 1.35));
        // (the folded shirt is 0.32 wide and sits above its middle; its middle is what travels)
        const sit = thing.base * (1 - between(m.clear, 0.9, 1.2));
        thing.g.position.set(m.x, m.y, sit + m.z); thing.g.rotation.set(m.tipX, m.tipY, m.turnZ); thing.g.scale.set(1, 1, stand);
        // the shirt's shadow follows its shape: the folded stack (0.32 by 0.56, lifted to the top) or the open shirt
        let sx = 0, sy = 0;
        thing.shadow.uT.value = m.z + thing.tall * stand;
        const ca0 = Math.cos(m.turnZ), sa0 = Math.sin(m.turnZ);
        thing.shadow.uC.value.copy(onMat(m.x + sx * ca0 - sy * sa0, m.y + sx * sa0 + sy * ca0)); thing.shadow.uAng.value = turn + m.turnZ;
        thing.shadow.uB.value = m.z; thing.shadow.uAlpha.value = between(m.clear, 0.1, 0.6);
        gone += between(m.clear, 0.3, 1.1);
        if (i === 0) {
          const tagAt = placeTag(k);
          if (tagMatRef) tagMatRef.uniforms.uBend.value = m.up * 0.8;
          const ca = Math.cos(m.turnZ), sa = Math.sin(m.turnZ);
          tagShadow.uC.value.copy(onMat(m.x + tagAt.x * ca - tagAt.y * sa, m.y + tagAt.x * sa + tagAt.y * ca)); tagShadow.uAng.value = turn + m.turnZ + tagAt.turn;
          tagShadow.uB.value = m.z; tagShadow.uT.value = m.z + 0.01;
          tagShadow.uAlpha.value = tagAt.out * between(m.clear, 0.6, 1.2);
        }
      });
      // once down, the boxes open (the shirt stays folded)
      // The watch box: its lid is lifted straight up off the base, carried aside and set down right way up beside it.
      {
        const k = s.phonesLid, up = Math.sin(Math.PI * k);
        phonesLid.position.set(0.31 * flow(between(k, 0.25, 1)), -0.04 * k, PHONES.tall - lidTallP / 2 + 0.11 * up - (PHONES.tall - lidTallP) * flow(between(k, 0.7, 1)));
        phonesLid.rotation.set(-0.35 * up, 0.12 * up, 0.12 * k);
        const ph = things[1], ca = Math.cos(ph.g.rotation.z), sa = Math.sin(ph.g.rotation.z);
        const lx = phonesLid.position.x, ly = phonesLid.position.y;
        phonesLidShadow.uC.value.copy(onMat(ph.g.position.x + lx * ca - ly * sa, ph.g.position.y + lx * sa + ly * ca));
        phonesLidShadow.uAng.value = turn + ph.g.rotation.z + 0.12 * k;
        phonesLidShadow.uB.value = phonesLid.position.z - lidTallP / 2; phonesLidShadow.uT.value = phonesLid.position.z + lidTallP / 2;
        phonesLidShadow.uAlpha.value = between(k, 0.05, 0.3);
      }
      // a still of the shirt alone: everything else is put away
      if (opts.only === 'tee') {
        invoice.visible = false; paperShadow.uAlpha.value = 0; tagMatRef && (tagMatRef.visible = false); tagShadow.uAlpha.value = 0;
        [things[1]].forEach((thing) => { thing.g.visible = false; thing.shadow.uAlpha.value = 0; });
        phonesLidShadow.uAlpha.value = 0;
        tee.children.forEach((child, n) => { if (n > 0) child.visible = false; });
      }
            // the bag settles as it empties
      uSag.value = flow(clamp((gone + between(s.out, 0.3, 0.9)) / 3, 0, 1));
    };
    pose(clock);
    c.invalidate();
  }

  return {
    ready,
    get open() { return target > 0; },
    attach(c) {
      ctx = c;
      const dir = opts.mark.slice(0, opts.mark.lastIndexOf('/') + 1);
      Promise.all([loadImage(opts.mark), loadImage(opts.word), loadImage(`${dir}tee-cut.webp`), loadImage(`${dir}tee-shade.webp`), loadImage(`${dir}tee-height.webp`), loadImage(`${dir}watch-cut.webp`)]).then(([mark, word, cut, shade, height, watch]) => { if (ctx !== c) return; build(c, mark, word, { cut, shade, height, watch }); done(); }, failed);
    },
    update(dt, camera) {
      if (!pose) return false;
      lastCamera = camera;
      const readGoal = reading ? 1 : 0; const readMoving = Math.abs(readK - readGoal) > 0.002;
      if (readMoving) readK = Math.abs(readK - readGoal) < 0.004 ? readGoal : readK + (readGoal - readK) * (1 - Math.exp(-dt * 7)); else readK = readGoal;
      const moving = clock !== target;
      if (moving) {
        clock = target > clock ? Math.min(target, clock + dt) : Math.max(target, clock - dt * CLOSE_SPEED);
        pose(clock);
      }
      if (clock > 0) aim(camera);
      return clock !== target || readMoving;
    },
    /** Which readable thing is under a point of the window (once everything has landed), or null. */
    hit(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Readable | null {
      if (!lastCamera || clock < END * 0.95 || !group) return null;
      raycaster.setFromCamera({ x: ((clientX - rect.left) / rect.width) * 2 - 1, y: -(((clientY - rect.top) / rect.height) * 2 - 1) } as Vector2, lastCamera);
      const nodes = (['invoice', 'tag', 'box'] as Readable[]).map((id) => ({ id, node: id === 'box' ? phonesNode : id === 'tag' ? teeNode : readTargets[id]?.node })).filter((x): x is { id: Readable; node: Object3D } => !!x.node);
      const hits = raycaster.intersectObjects(nodes.map((n) => n.node), true);
      if (!hits.length) return null;
      for (let o: Object3D | null = hits[0].object; o; o = o.parent) { const f = nodes.find((n) => n.node === o); if (f) return f.id; }
      return null;
    },
    /** Come down over one thing to read it, or (null) draw back to the whole parcel. */
    read(id: Readable | null) { reading = id; if (id) readId = id; ctx?.invalidate(); },
    get reading() { return reading; },
    arrive() { target = END; if (opts.reduced) { clock = END; pose?.(clock); } ctx?.invalidate(); },
    leave() { reading = null; readK = 0; target = 0; if (opts.reduced) { clock = 0; pose?.(clock); } ctx?.invalidate(); },
    pose(t) { clock = target = Math.max(0, Math.min(END, t)); pose?.(clock); ctx?.invalidate(); },
    setSheen(value) { if (sheen) { sheen.value = value; ctx?.invalidate(); } },
    dispose() {
      if (ctx && group) ctx.scene.remove(group);
      shadows.forEach((mesh) => ctx?.scene.remove(mesh)); shadows.length = 0;
      disposables.forEach((d) => d.dispose());
      disposables.length = 0; group = null; pose = null; sheen = null; ctx = null;
    },
  };
}
