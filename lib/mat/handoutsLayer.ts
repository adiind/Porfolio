/**
 * PROTOTYPE. The presentations on the mat, as one quiet thing in a corner: a stack of printed decks held at the top by a
 * black binder clip. A MatLayer for the flip-book engine: it shares the engine's camera, window light, opening light and loop.
 *
 * Real sizes (one table unit = 38 cm): each deck is US letter, landscape (27.9 by 21.6 cm), about 20 sheets (2 mm);
 * seven decks make a 1.4 cm stack. The slides are printed the way a 16:9 slide prints on letter paper: full width, white
 * bands above and below. The clip is a 41 mm binder clip (it holds up to 19 mm): black satin steel, two wire handles,
 * one folded forward onto the paper, one folded back onto the mat. The decks fan a little about the clip, so a sliver
 * of each one's edge shows.
 *
 * Each page is drawn base first (paper), then the print (the slide, multiplied into the paper so it sits in it), then
 * light and shade over both.
 *
 * Opened (a click, the camera comes down at a slant): the clip's handles fold up, the clip lifts off the edge in a low
 * arc and is set down beside the stack, its handles falling flat; then the decks are dealt off the top one after another,
 * each lifted and carried through the air in an arc (tipping a little as it goes) and set down flat on the mat below the
 * stack, a beat behind the one before, overlapping in time. The bottom deck stays where it is. Under 2 seconds. Every
 * shadow lifts off the mat with its thing. Nothing fades, nothing bounces, nothing passes through anything.
 *
 * Units: the engine's table units. The mat is the xy plane, z is up.
 */
import {
  BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, ClampToEdgeWrapping, ExtrudeGeometry, Float32BufferAttribute, Group, LinearFilter,
  LinearMipmapLinearFilter, Mesh, NoColorSpace, PlaneGeometry, Raycaster, ShaderMaterial, Shape, TubeGeometry, Vector2, Vector3,
} from 'three';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';
import { PerspectiveCamera } from 'three';
import { END, CLOSE_SPEED, between, flow, glide } from './handoutsStory';

const CM = 1 / 38;
export const SHEET = { w: 27.94 * CM, h: 21.59 * CM } as const;
const DECK_T = 0.2 * CM;
const CLIP = { w: 4.1 * CM, lip: 1.0 * CM, back: 1.9 * CM, x: -4.2 * CM } as const;

/* ---------- the engine's own shading (copied: it is private to lib/mat/zomatoBag.ts) ---------- */
const DAWN = /* glsl */ `
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}`;
const VERTEX = /* glsl */ `
varying vec3 vN; varying vec2 vUv; varying vec3 vW;
void main() {
  vN = normalize(mat3(modelMatrix) * normal); vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/** Paper: matte. Lit side a touch brighter, far side a touch deeper, the window's light over it. */
const PAPER_FRAGMENT = /* glsl */ `
uniform sampler2D tMap; uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn;
varying vec3 vN; varying vec2 vUv; varying vec3 vW;
${DAWN}
void main() {
  vec3 base = texture2D(tMap, vUv).rgb;
  vec3 n = normalize(vN);
  float k = clamp(0.74 + 0.3 * dot(n, uLight), 0.5, 1.06);
  vec3 col = base * k;
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.2);
  gl_FragColor = vec4(col * dawnLight(), 1.0);
}`;
/** Satin steel and wire: a broad soft sheen on faces turned to the window, never a mirror. */
const METAL_FRAGMENT = /* glsl */ `
uniform vec3 uColor; uniform float uShine; uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn;
varying vec3 vN; varying vec2 vUv; varying vec3 vW;
${DAWN}
void main() {
  vec3 n = normalize(vN);
  float k = clamp(0.62 + 0.46 * dot(n, uLight), 0.32, 1.12);
  vec3 col = uColor * k;
  vec3 V = normalize(cameraPosition - vW);
  vec3 H = normalize(uLight + V);
  float nh = max(dot(n, H), 0.0);
  col += uShine * (pow(nh, 14.0) * 0.16 + pow(nh, 60.0) * 0.12) * vec3(0.95, 0.97, 1.0);
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.15);
  gl_FragColor = vec4(col * dawnLight(), 1.0);
}`;
const SHADOW_VERTEX = /* glsl */ `
varying vec2 vL;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vL = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`;
/** One thing's shadow on the mat (the courier bag's, copied): its footprint swept along the light, soft with height. */
const SHADOW_FRAGMENT = /* glsl */ `
uniform vec2 uC; uniform float uAng; uniform vec2 uHalf; uniform float uR; uniform float uB; uniform float uT; uniform vec2 uDir;
uniform float uStrength; uniform float uDawn; uniform vec2 uScreen;
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
  float contact = (1.0 - smoothstep(0.0, 0.006 + uT * 0.06, d0)) * step(-0.002, d0) * clamp(uT / 0.02, 0.0, 1.0) * clamp(1.0 - uB / 0.03, 0.0, 1.0);
  float dark = 1.0 - (1.0 - sweep * 0.6) * (1.0 - halo * 0.3) * (1.0 - contact * 0.55);
  dark *= uStrength * clamp(1.0 - uB * 1.2, 0.25, 1.0);
  if (dark < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark);
}`;
const LIGHT = new Vector3(0.35, 0.45, 0.9).normalize();
const SHADOW_DIR = new Vector2(-0.55, -0.7);

/* ---------- drawing ---------- */

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const PAPER = '#f3f0e8';

/**
 * A deck that has its own website says so where a printed deck would: "Open" and an arrow, printed in the white band
 * under the slide, at its right. Ink, so it is drawn with the slide (before the light and shade go over both).
 */
function printOpen(g: CanvasRenderingContext2D, W: number, H: number, sw: number, sh: number) {
  const right = W - (W - sw) / 2, base = (H + sh) / 2 + (H - sh) / 4 + 24;
  const size = 66;
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgba(24,24,30,0.9)'; g.strokeStyle = 'rgba(24,24,30,0.9)';
  g.font = `700 ${size}px "FB Geist", "Geist", system-ui, sans-serif`; g.textBaseline = 'alphabetic'; g.textAlign = 'right';
  // the arrow, drawn (not a font's glyph): up and to the right, the way a link out points
  const a = size * 0.62, ax = right - a, ay = base - size * 0.08;
  g.lineWidth = size * 0.12; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + a, ay - a); g.stroke();
  g.beginPath(); g.moveTo(ax + a * 0.3, ay - a); g.lineTo(ax + a, ay - a); g.lineTo(ax + a, ay - a * 0.3); g.stroke();
  g.fillText('Open', ax - size * 0.3, base);
  g.restore();
}

/** One deck's top page: paper, then the slide printed into it, then light and shade over both. */
function drawPage(slide: HTMLImageElement, seed: number, link: boolean): HTMLCanvasElement {
  const W = 1294, H = 1000;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const rnd = seeded(seed);
  // 1. paper: warm white with a faint fibre
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '120,110,95' : '255,255,250'},${0.025 + rnd() * 0.03})`;
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1);
  }
  // 2. print: a 16:9 slide on letter paper, full width less the printer's margin, multiplied into the paper
  const sw = W * (10.5 / 11), sh = sw * (9 / 16);
  g.save(); g.globalCompositeOperation = 'multiply'; g.filter = 'saturate(0.86) contrast(0.94)';
  g.drawImage(slide, (W - sw) / 2, (H - sh) / 2, sw, sh); g.restore();
  if (link) printOpen(g, W, H, sw, sh);
  // 3. light and shade over everything: the sheet is never quite flat
  const sheen = g.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0, 'rgba(255,255,255,0.07)'); sheen.addColorStop(0.55, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(40,30,20,0.06)');
  g.fillStyle = sheen; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const x = rnd() * W, y = rnd() * H, r = 160 + rnd() * 320;
    const bump = g.createRadialGradient(x, y, 0, x, y, r);
    bump.addColorStop(0, rnd() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(60,45,30,0.03)'); bump.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = bump; g.fillRect(0, 0, W, H);
  }
  // the edge of a sheet catches a little grime from hands
  const rim = g.createLinearGradient(0, 0, 0, 18);
  rim.addColorStop(0, 'rgba(90,80,65,0.12)'); rim.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rim; g.fillRect(0, 0, W, 18);
  return c;
}

/** A deck's cut edge: twenty sheets, each a slightly different white, with a dark hairline between some. */
function drawEdge(seed: number): HTMLCanvasElement {
  const W = 512, H = 40;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const rnd = seeded(seed);
  const n = 20, step = H / n;
  for (let i = 0; i < n; i++) {
    const v = 226 + Math.floor(rnd() * 22);
    g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(0, i * step, W, step + 0.5);
    if (rnd() < 0.55) { g.fillStyle = `rgba(70,60,50,${0.18 + rnd() * 0.2})`; g.fillRect(0, i * step, W, 0.6); }
  }
  // a sheet or two sits proud along part of the edge
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,250,0.5)'; g.fillRect(rnd() * W, Math.floor(rnd() * n) * step, 30 + rnd() * 120, 0.8); }
  return c;
}

/* ---------- shapes ---------- */

/** The top deck's top: a fine grid, the free corner (far from the clip) lifted a hair, as a page curls. */
function curledTop(): BufferGeometry {
  const geo = new PlaneGeometry(SHEET.w, SHEET.h, 40, 32);
  const p = geo.attributes.position as Float32BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / SHEET.w + 0.5, v = p.getY(i) / SHEET.h + 0.5;
    const corner = Math.max(0, u - 0.62) / 0.38 * Math.max(0, 0.42 - v) / 0.42;
    const edge = Math.max(0, 0.12 - v) / 0.12;
    p.setZ(i, 0.09 * CM * corner * corner + 0.035 * CM * edge * edge);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * The clip's body, seen end on: the top jaw lies on the paper (lip over the edge by 1 cm), the steel rises a little to
 * the spine 1.9 cm beyond the edge, and comes down to the mat; the lower jaw is under the stack. Drawn in (d, z): d is
 * how far beyond the paper's edge, z height above the mat.
 */
function clipBody(stack: number): BufferGeometry {
  const s = new Shape();
  const top0 = stack + 0.05 * CM, top1 = stack * 0.5 + 1.0 * CM;
  s.moveTo(-CLIP.lip, top0);
  s.lineTo(CLIP.back * 0.35, top0 + (top1 - top0) * 0.55);
  s.lineTo(CLIP.back, top1);
  s.lineTo(CLIP.back, 0.04 * CM);
  s.lineTo(0, 0.02 * CM);
  s.lineTo(0, stack);
  s.lineTo(-CLIP.lip, stack + 0.012 * CM);
  const geo = new ExtrudeGeometry(s, { depth: CLIP.w, bevelEnabled: true, bevelThickness: 0.12 * CM, bevelSize: 0.1 * CM, bevelSegments: 5, curveSegments: 4 });
  // (the shape is drawn in x = d, y = z and pushed out along z: turn it so d runs along +y, height along +z, width along x)
  geo.translate(0, 0, -CLIP.w / 2);
  geo.rotateY(Math.PI / 2);   // shape's z (width) -> x
  geo.rotateX(Math.PI / 2);   // shape's y (height) -> z, shape's x (d) -> y
  geo.computeVertexNormals();
  return geo;
}

/** One wire handle, 1.2 mm wire: a U from its two slots (at the origin) out along +y to `reach`, flat in z = 0. Turned about x to lie or stand. */
function handle(reach: number): BufferGeometry {
  const half = 1.55 * CM, r = 0.07 * CM;
  const pts: Vector3[] = [];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // along the U: down one leg, round the end, back up the other
    let x: number, d: number;
    if (t < 0.38) { x = -half; d = t / 0.38; }
    else if (t > 0.62) { x = half; d = (1 - t) / 0.38; }
    else { const a = ((t - 0.38) / 0.24) * Math.PI; x = -half * Math.cos(a); d = 1 + 0.08 * Math.sin(a); }
    pts.push(new Vector3(x, d * reach, 0));
  }
  return new TubeGeometry(new CatmullRomCurve3(pts), 80, r, 8, false);
}

/* ---------- where things go ---------- */

/**
 * Where each deck is set down, as offsets from the stack's middle on the mat (table units, x right, y up the screen) and
 * a small turn (radians). Below the stack and to the left, where the mat is cleared when the camera comes down (the
 * Zomato bag, to the right, is never under them). Two loose rows; the bottom deck stays put.
 * Index: the order decks are taken off, top first.
 */
const LAND: Array<{ x: number; y: number; turn: number }> = [
  // (this order and the clock below were checked frame by frame in a small simulation: no deck in the air ever meets
  // another, in the air or on the mat. The far left first, then the decks fill in nearer the stack.)
  { x: -1.18, y: -1.33, turn: -0.03 },
  { x: 0.81, y: -0.65, turn: -0.035 },
  { x: -0.38, y: -1.3, turn: 0.04 },
  { x: -0.79, y: -0.68, turn: 0.025 },
  { x: 0.42, y: -1.31, turn: -0.02 },
  { x: 0.02, y: -0.67, turn: 0.03 },
];
/** Each deck's flight: when it starts (after the one before), how long, how high (table units), and how far into the flight it is over its place. */
// (the first deck sets off once the rest of the mat has mostly sunk away as the camera comes down, so no deck is set
// down on the photo or the words while they still show: the engine clears them in 1.15 s; re-checked in the simulation)
const DEAL = { start: 0.45, every: 0.14, take: 0.6, lift: 0.24, over: 0.8 } as const;
/** The clip, set down to the right of the stack, turned. */
const CLIP_LAND = { x: 0.6, y: 0.08, turn: 0.55 };
/** What the camera takes in once everything is down (from the stack's middle), and how far it leans (as the Zomato bag's). */
const FRAME = { x: -0.16, y: -0.78, w: 3.15, h: 2.3, pitch: 0.5 };

/* ---------- the layer ---------- */

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image(); image.decoding = 'async';
  image.onload = () => { if (image.decode) image.decode().then(() => resolve(image), () => resolve(image)); else resolve(image); };
  image.onerror = () => reject(new Error(`could not load ${src}`)); image.src = src;
});

export interface HandoutsLayer extends MatLayer {
  ready: Promise<void>;
  /** The camera is coming down to the stack: take the clip off and deal the decks out. */
  arrive(): void;
  /** The camera is leaving: everything goes back onto the stack, quickly, and the clip goes back on. */
  leave(): void;
  /** For captures: show one moment of the opening (seconds, 0 to END) and hold it. */
  pose(t: number): void;
  /** Once the decks are down: the website of the deck under this screen point, if it has one. */
  linkAt(clientX: number, clientY: number): string | null;
}

interface Lerp3 { x: number; y: number; z: number; turn: number }

export function createHandoutsLayer(opts: { x: number; y: number; /** degrees, the scene's own (counter-clockwise) */ turn: number; /** slide pictures, bottom of the stack first */ slides: string[]; /** each deck's own website, if it has one (same order) */ links?: Array<string | undefined>; canvas: HTMLCanvasElement; reduced: boolean }): HandoutsLayer {
  let ctx: MatLayerContext | null = null;
  let lastCamera: PerspectiveCamera | null = null;
  const linked: Array<{ mesh: Mesh; url: string }> = [];
  const ray = new Raycaster();
  let group: Group | null = null;
  const disposables: Array<{ dispose(): void }> = [];
  const shadows: Mesh[] = [];
  let done: () => void = () => undefined;
  let failed: (error: unknown) => void = () => undefined;
  const ready = new Promise<void>((resolve, reject) => { done = resolve; failed = reject; });
  const turn = (opts.turn * Math.PI) / 180;
  const cosT = Math.cos(turn), sinT = Math.sin(turn);
  /** A point of the stack's own frame, on the mat. */
  const onMat = (x: number, y: number) => new Vector2(opts.x + x * cosT - y * sinT, opts.y + x * sinT + y * cosT);
  /** An offset on the mat (from the stack's middle), in the stack's own frame. */
  const toLocal = (x: number, y: number) => new Vector2(x * cosT + y * sinT, -x * sinT + y * cosT);

  let clock = 0; let target = 0;
  let pose: ((t: number) => void) | null = null;
  // (a camera, not a plain object: a camera's lookAt turns its view toward the point)
  const eye = new PerspectiveCamera();
  const aim = (camera: PerspectiveCamera) => {
    const tanH = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const near = 1 - 0.04 * flow(between(clock, 0.2, END));
    const dist = near * Math.max((FRAME.h * Math.cos(FRAME.pitch) * 1.05) / (2 * tanH), (FRAME.w * 1.04) / (2 * tanH * camera.aspect));
    const at = new Vector2(opts.x + FRAME.x, opts.y + FRAME.y);
    eye.position.set(at.x, at.y - dist * Math.sin(FRAME.pitch), dist * Math.cos(FRAME.pitch));
    eye.up.set(0, 1, 0); eye.lookAt(at.x, at.y, 0);
    const follow = flow(between(clock, 0.02, 0.6));
    camera.position.lerp(eye.position, follow); camera.quaternion.slerp(eye.quaternion, follow); camera.updateMatrixWorld(true);
  };

  function build(c: MatLayerContext, slides: HTMLImageElement[]) {
    const texture = (canvas: HTMLCanvasElement) => {
      const t = new CanvasTexture(canvas);
      t.colorSpace = NoColorSpace; t.wrapS = t.wrapT = ClampToEdgeWrapping; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter;
      t.anisotropy = c.maxAnisotropy; t.generateMipmaps = true; disposables.push(t); return t;
    };
    const shared = { uLight: { value: LIGHT }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uDawn: c.dawn };
    const paper = (map: CanvasTexture) => { const m = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: PAPER_FRAGMENT, transparent: true, depthTest: true, depthWrite: true, uniforms: { ...shared, tMap: { value: map } } }); disposables.push(m); return m; };
    const metal = (rgb: [number, number, number], shine: number) => { const m = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: METAL_FRAGMENT, transparent: true, depthTest: true, depthWrite: true, uniforms: { ...shared, uColor: { value: new Vector3(...rgb) }, uShine: { value: shine } } }); disposables.push(m); return m; };
    const solid = (geo: BufferGeometry, mat: ShaderMaterial | ShaderMaterial[]) => { disposables.push(geo); const m = new Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 40; return m; };
    const caster = (half: Vector2) => {
      const geo = new PlaneGeometry(1.6, 1.6); disposables.push(geo);
      const mat = new ShaderMaterial({
        vertexShader: SHADOW_VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uC: { value: new Vector2() }, uAng: { value: turn }, uHalf: { value: half }, uR: { value: 0.004 }, uB: { value: 0 }, uT: { value: 0.01 }, uDir: { value: SHADOW_DIR }, uStrength: { value: 0.95 }, uDawn: c.dawn, uScreen: { value: c.screenSize } },
      });
      disposables.push(mat);
      const mesh = new Mesh(geo, mat); mesh.position.set(opts.x, opts.y, 0.0006); mesh.frustumCulled = false; mesh.renderOrder = 1.7;
      shadows.push(mesh); c.scene.add(mesh);
      return { mesh, u: mat.uniforms };
    };
    /** Point a shadow at a thing: where it is in the stack's frame, its turn there, its foot and top above the mat. */
    const cast = (s: ReturnType<typeof caster>, lx: number, ly: number, lturn: number, foot: number, top: number, strength: number) => {
      const w = onMat(lx, ly);
      s.u.uC.value.copy(w); s.mesh.position.set(w.x, w.y, 0.0006);
      s.u.uAng.value = turn + lturn; s.u.uB.value = foot; s.u.uT.value = top; s.u.uStrength.value = strength;
    };

    group = new Group(); group.position.set(opts.x, opts.y, 0); group.rotation.z = turn;
    // the decks fan a little about the clip (top edge, left of middle)
    const pivot = new Vector2(CLIP.x, SHEET.h / 2);
    const rnd = seeded(4127);
    const n = slides.length;
    const stack = n * DECK_T;
    const decks: Array<{ g: Group; home: Lerp3; land: Lerp3 | null; lift: number; tip: Vector2; shadow: ReturnType<typeof caster> }> = [];
    slides.forEach((slide, i) => {
      const last = i === n - 1;
      const a = last ? 0 : (rnd() - 0.5) * 0.075;
      const nudge = new Vector2((rnd() - 0.5) * 0.25 * CM, (rnd() - 0.5) * 0.15 * CM);
      const deck = new Group();
      const edge = paper(texture(drawEdge(900 + i)));
      const url = opts.links?.[i];
      const top = paper(texture(drawPage(slide, 300 + i * 17, !!url)));
      // the box: its sides are cut paper, its top the printed page (the bottom is never seen)
      const box = solid(new BoxGeometry(SHEET.w, SHEET.h, DECK_T * 0.98), [edge, edge, edge, edge, top, edge]);
      box.position.z = DECK_T * 0.49;
      deck.add(box);
      if (url) linked.push({ mesh: box, url });
      if (last) { const curl = solid(curledTop(), top); curl.position.z = DECK_T + 0.0002; deck.add(curl); }
      // home: turned about the clip, then nudged
      const ca = Math.cos(a), sa = Math.sin(a);
      const home = { x: pivot.x - pivot.x * ca + pivot.y * sa + nudge.x, y: pivot.y - pivot.x * sa - pivot.y * ca + nudge.y, z: i * DECK_T, turn: a };
      // where it is set down: decks are taken off the top, so the top deck takes the first place
      const order = n - 1 - i;
      const spot = order < LAND.length ? LAND[order] : null;
      let land: Lerp3 | null = null; let lift = 0;
      if (spot) {
        const l = toLocal(spot.x, spot.y);
        land = { x: l.x, y: l.y, z: 0, turn: spot.turn - turn };
        lift = DEAL.lift;
      }
      const away = land ? new Vector2(land.x - home.x, land.y - home.y).normalize() : new Vector2(0, -1);
      // it tips a little as it is carried: its leading edge dips, as a sheet held by its far side does
      const tip = new Vector2(away.y, -away.x).multiplyScalar(0.08);
      deck.position.set(home.x, home.y, home.z); deck.rotation.z = home.turn;
      group!.add(deck);
      decks.push({ g: deck, home, land, lift, tip, shadow: caster(new Vector2(SHEET.w / 2 + 0.002, SHEET.h / 2 + 0.002)) });
    });

    // the binder clip, its jaw over the top edge; each handle on its own hinge
    const clip = new Group();
    const clipHome = { x: CLIP.x, y: SHEET.h / 2 };
    clip.add(solid(clipBody(stack), metal([0.1, 0.1, 0.11], 1.3)));
    const wire = metal([0.6, 0.6, 0.62], 1.4);
    const zTop = stack + 0.1 * CM, top1 = stack * 0.5 + 1.0 * CM;
    const front = new Group(); front.position.set(0, -0.25 * CM, zTop + 0.12 * CM);
    front.add(solid(handle(3.3 * CM), wire)); clip.add(front);
    const back = new Group(); back.position.set(0, CLIP.back - 0.12 * CM, top1 + 0.06 * CM);
    back.add(solid(handle(3.0 * CM), wire)); clip.add(back);
    // the forward handle's own soft shadow on the top page, while it lies there
    const shadeMat = new ShaderMaterial({
      vertexShader: VERTEX, transparent: true, depthTest: true, depthWrite: false, uniforms: { uA: { value: 0.22 } },
      fragmentShader: `uniform float uA; varying vec3 vN; varying vec2 vUv; varying vec3 vW; void main() { gl_FragColor = vec4(0.04, 0.05, 0.12, uA); }`,
    });
    disposables.push(shadeMat);
    const fall = solid(handle(3.3 * CM), shadeMat);
    fall.rotation.x = Math.PI; fall.scale.set(1.04, 1, 0.02);
    fall.position.set(SHADOW_DIR.x * 0.3 * CM, -0.25 * CM + SHADOW_DIR.y * 0.3 * CM, stack + 0.03 * CM); fall.renderOrder = 41;
    group.add(fall);
    group.add(clip);
    c.scene.add(group);
    const clipShadow = caster(new Vector2(CLIP.w / 2, CLIP.back * 0.5 + CLIP.lip * 0.4));
    const cl = toLocal(CLIP_LAND.x, CLIP_LAND.y);
    // the handles' hinge angles: lying (forward on the paper, back down to the mat), standing (squeezed), fallen (once the clip is on the mat)
    const FRONT_LIE = Math.PI + 0.015, BACK_LIE = -Math.asin(Math.min(0.95, (top1 + 0.06 * CM - 0.08 * CM) / (3.0 * CM)));
    const FRONT_UP = Math.PI / 2 + 0.22, BACK_UP = Math.PI / 2 - 0.22;
    const FRONT_DOWN = Math.PI + Math.asin(Math.min(0.95, (zTop + 0.12 * CM) / (3.3 * CM)));

    pose = (t: number) => {
      // the clip: handles up, lifted off in a low arc, set down beside the stack, handles falling flat
      const up = flow(between(t, 0, 0.2)), down = flow(between(t, 0.55, 0.85));
      const k = glide(between(t, 0.12, 0.68));
      const arc = Math.sin(Math.PI * k);
      const cx = clipHome.x + (cl.x - clipHome.x) * k, cy = clipHome.y + (cl.y - clipHome.y) * k;
      const cz = 0.11 * arc;
      const cturn = (CLIP_LAND.turn - turn) * k;
      clip.position.set(cx, cy, cz); clip.rotation.set(0.25 * arc, -0.15 * arc, cturn);
      front.rotation.x = down > 0 ? FRONT_UP + (FRONT_DOWN - FRONT_UP) * down : FRONT_LIE + (FRONT_UP - FRONT_LIE) * up;
      back.rotation.x = BACK_LIE + (BACK_UP - BACK_LIE) * up + (BACK_LIE - BACK_UP) * down;
      shadeMat.uniforms.uA.value = 0.22 * (1 - up);
      cast(clipShadow, cx, cy + CLIP.back * 0.5, cturn, cz, cz + top1, 0.9);

      // the decks, dealt off the top one after another
      let lowestHome = -1;
      const homeAt: boolean[] = [];
      decks.forEach((d, i) => {
        const order = n - 1 - i;
        let p: Lerp3 = d.home; let r = 0; let tipK = 0;
        if (d.land) {
          // lifted quickly, carried over its place, then set straight down on a long soft tail (so it never comes in low over its neighbours)
          const u = between(t, DEAL.start + DEAL.every * order, DEAL.start + DEAL.every * order + DEAL.take);
          r = glide(u / DEAL.over);
          const h = d.lift * glide(u / 0.3) * (1 - flow((u - 0.5) / 0.5));
          p = { x: d.home.x + (d.land.x - d.home.x) * r, y: d.home.y + (d.land.y - d.home.y) * r, z: d.home.z * (1 - r) + h, turn: d.home.turn + (d.land.turn - d.home.turn) * r };
          tipK = Math.sin(Math.PI * u);
          if (u === 0) r = 0;
        }
        d.g.position.set(p.x, p.y, p.z);
        d.g.rotation.set(d.tip.x * tipK, d.tip.y * tipK, p.turn);
        homeAt[i] = r === 0;
        if (r === 0 && lowestHome < 0) lowestHome = i;
        // a deck still on the stack casts no shadow of its own: the stack's lowest deck casts for all of them
        cast(d.shadow, p.x, p.y, p.turn, r === 0 ? 0 : p.z, r === 0 ? 0 : p.z + DECK_T, r === 0 ? 0 : 0.95);
      });
      if (lowestHome >= 0) {
        // (decks leave from the top, so the ones still home are the lowest ones, one on another)
        let topHome = lowestHome;
        while (topHome + 1 < n && homeAt[topHome + 1]) topHome++;
        const d = decks[lowestHome];
        cast(d.shadow, d.home.x, d.home.y, d.home.turn, 0, (topHome + 1) * DECK_T, 0.95);
      }
      c.invalidate();
    };
    pose(clock);
    c.invalidate();
  }

  return {
    ready,
    attach(c) {
      ctx = c;
      Promise.all(opts.slides.map(loadImage)).then((slides) => { if (ctx !== c) return; build(c, slides); done(); }, failed);
    },
    update(dt, camera) {
      lastCamera = camera;
      if (!pose) return false;
      const moving = clock !== target;
      if (moving) {
        clock = target > clock ? Math.min(target, clock + dt) : Math.max(target, clock - dt * CLOSE_SPEED);
        pose(clock);
      }
      if (clock > 0) aim(camera);
      return clock !== target;
    },
    arrive() { target = END; if (opts.reduced) { clock = END; pose?.(clock); } ctx?.invalidate(); },
    leave() { target = 0; if (opts.reduced) { clock = 0; pose?.(clock); } ctx?.invalidate(); },
    pose(t) { clock = target = Math.max(0, Math.min(END, t)); pose?.(clock); ctx?.invalidate(); },
    linkAt(clientX, clientY) {
      // only once every deck is down and still: a deck in the air is not something to click
      if (!lastCamera || target !== END || clock !== END || !linked.length) return null;
      const r = opts.canvas.getBoundingClientRect();
      ray.setFromCamera(new Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), lastCamera);
      // the nearest deck under the point (they never overlap once down, but take the nearest all the same)
      const hits = ray.intersectObjects(linked.map((l) => l.mesh), false);
      return hits.length ? linked.find((l) => l.mesh === hits[0].object)?.url ?? null : null;
    },
    dispose() {
      if (ctx && group) ctx.scene.remove(group);
      shadows.forEach((mesh) => ctx?.scene.remove(mesh)); shadows.length = 0;
      disposables.forEach((d) => d.dispose()); disposables.length = 0; group = null; pose = null; ctx = null;
    },
  };
}
