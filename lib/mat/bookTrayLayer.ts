/**
 * The project books on the home mat: a small stack lying flat, each book a little crooked on the one under it so the top
 * of every cover shows, tied together with a thin white string (Adi, 2026-11-28, with a picture of file folders whose titles
 * all show: "remove that wooden thing and lets tie them together with thin white string, a bit croocked so top of each book
 * is kinda visible (almost fanned out) - add text at the top of the book so its visible"). Each book's title is printed
 * across the top of its cover. The pointer resting on a book slides it a little out of the stack; a click slides it out
 * from under the string, it lifts and lands flat on the mat beside the stack, where the engine's own book takes over and
 * opens. Closed again, it goes back into its place. The picture he sent: review/designs-2026-11-27/books/ref/.
 *
 * A MatLayer like the Bot tablet and the Snapdeal bag: it shares the engine's camera, window light and opening light. The
 * stage keeps an empty click target where it lies; the layer fades with the engine's own fade for that target.
 *
 * Units: built in centimetres (a book is 22 cm wide), drawn at one table unit per book width. The mat is the xy plane,
 * z is up, and -y is toward the viewer.
 */
import {
  BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Group, LinearFilter, LinearMipmapLinearFilter, Matrix4, Mesh,
  MeshBasicMaterial, BoxGeometry, NoColorSpace, PerspectiveCamera, Texture, PlaneGeometry, Quaternion, Raycaster,
  ShaderMaterial, Shape, SphereGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';

/* ---------- sizes (cm) ---------- */
const W = 22;            // a book's width, spine to fore-edge (one table unit)
const D = 13.2;          // its height, head to tail (the engine's closed book: 0.6 of its width)
const T = 1.5;           // its thickness
const S = 1 / W;         // table units per cm
const BUL = 0.38, BT = 0.2, X0 = -W / 2 + BUL;   // how far the spine bulges, board thickness, where the bulge starts
const HOVER = 2.4;       // how far the pointer slides a book out of the stack, toward its head
const STRING_R = 0.17;   // the string's thickness (radius)
/** How much of each book's top shows above the one lying on it (less when there are many, so the string still holds all). */
const stepFor = (n: number) => Math.min(2.6, (D - 5.2) / Math.max(1, n - 1));
/** the band of the cover the title is printed on, from its top (cm) */
const TITLE_BAND = 3.0;

/* the engine's own shading, as the Bot tablet and the Snapdeal bag copy it */
const DAWN = /* glsl */ `
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}`;
const SOLID_VERTEX = /* glsl */ `
varying vec3 vN; varying vec2 vUv;
void main() {
  vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;
/** Matte, never glossy: the window lights the faces turned to it and shades the others. */
const SOLID_FRAGMENT = /* glsl */ `
uniform vec3 uColor; uniform sampler2D tMap; uniform float uUseMap;
uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn; uniform float uAlpha;
varying vec3 vN; varying vec2 vUv;
${DAWN}
void main() {
  vec3 base = uUseMap > 0.5 ? texture2D(tMap, vUv).rgb : uColor;
  vec3 n = normalize(gl_FrontFacing ? vN : -vN);
  float k = clamp(0.62 + 0.46 * dot(n, uLight), 0.4, 1.12);
  vec3 col = base * k;
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.2);
  gl_FragColor = vec4(col * dawnLight(), uAlpha);
}`;
/** The cover: the titled print, turning into the plain cover picture while the book flies (`uMix`), as the engine's book has it. */
const COVER_FRAGMENT = SOLID_FRAGMENT
  .replace('uniform vec3 uColor; uniform sampler2D tMap;', 'uniform vec3 uColor; uniform sampler2D tMap; uniform sampler2D tPlain; uniform float uMix;')
  .replace('vec3 base = uUseMap > 0.5 ? texture2D(tMap, vUv).rgb : uColor;', 'vec3 base = mix(texture2D(tMap, vUv).rgb, texture2D(tPlain, vUv).rgb, uMix);');
const SHADOW_VERTEX = /* glsl */ `
varying vec2 vP;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`;
/** A box's shadow on the mat: its footprint swept from its foot to its top along the light, soft with height. Navy. */
const SHADOW_FRAGMENT = /* glsl */ `
uniform vec2 uC; uniform float uAng; uniform vec2 uHalf; uniform float uR; uniform float uB; uniform float uT; uniform vec2 uDir;
uniform float uStrength; uniform float uAlpha; uniform float uDawn; uniform vec2 uScreen;
varying vec2 vP;
${DAWN}
float roundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x + s * p.y, -s * p.x + c * p.y); }
float caster(vec2 p) { return roundBox(rot(p - uC, uAng), uHalf, uR); }
void main() {
  float sweep = 0.0;
  for (int i = 0; i < 12; i++) {
    float t = float(i) / 11.0;
    float h = mix(uB, uT, t);
    float blur = 0.012 + h * 0.16;
    sweep = max(sweep, (1.0 - smoothstep(-blur, blur, caster(vP - uDir * h))) * mix(1.0, 0.55, t));
  }
  float d0 = caster(vP - uDir * uB);
  float contact = (1.0 - smoothstep(0.0, 0.03, d0)) * step(-0.004, d0) * step(uB, 0.01);
  float dark = 1.0 - (1.0 - sweep * 0.62) * (1.0 - contact * 0.5);
  dark *= uStrength;
  if (dark * uAlpha < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark * uAlpha);
}`;
const LIGHT = new Vector3(0.35, 0.45, 0.9).normalize();
const SHADOW_DIR = new Vector2(-0.55, -0.7);
/** how far a shadow runs for the height of the thing casting it */
const LONG = 1.1;
/** A book lying flat, cover up, head away from the viewer (book space: x spine to fore-edge, y thickness, z head to tail). */
const FLAT_Q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, -1, 0)));
const Z_AXIS = new Vector3(0, 0, 1);
const hex = (h: string) => new Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

/** A soft dark rim on the book under this one, right round this book's edges: where it rests on it. */
const RIM_VERTEX = /* glsl */ `
varying vec2 vQ;
void main() { vQ = position.xy; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const RIM_FRAGMENT = /* glsl */ `
uniform vec2 uHalf; uniform float uR; uniform float uSoft; uniform float uStrength; uniform float uAlpha; uniform float uDawn; uniform vec2 uScreen;
varying vec2 vQ;
${DAWN}
float roundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  float d = roundBox(vQ, uHalf, uR);
  if (d < 0.0) discard;
  float a = (1.0 - smoothstep(0.0, uSoft, d)) * uStrength;
  if (a * uAlpha < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), a * uAlpha);
}`;

/* ---------- shapes ---------- */

/** A hardcover's two boards and its rounded spine, as one bent shell with soft edges. Book space: x spine to fore-edge, y thickness, z head to tail. */
function shellGeometry(): BufferGeometry {
  const s = new Shape();
  s.moveTo(W / 2, T); s.lineTo(X0, T); s.bezierCurveTo(X0 - 1.33 * BUL, T, X0 - 1.33 * BUL, 0, X0, 0); s.lineTo(W / 2, 0);
  s.lineTo(W / 2, BT); const xi = X0 + BT, ki = 1.33 * (BUL - BT);
  s.lineTo(xi, BT); s.bezierCurveTo(xi - ki, BT, xi - ki, T - BT, xi, T - BT); s.lineTo(W / 2, T - BT); s.lineTo(W / 2, T);
  const bv = 0.07;
  const geo = new ExtrudeGeometry(s, { depth: D - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: 0.05, bevelSegments: 3, curveSegments: 16 });
  geo.translate(0, 0, -(D - 2 * bv) / 2);
  return geo;
}

export interface TrayBook {
  slug: string;
  /** printed across the top of the cover */
  title: string;
  /** a small line printed at the right end of the title band (Bambu: "BAMBU LAB") */
  over?: string;
  /** the cloth of the boards and the title band, the print on it, and a thin bar beside the title */
  bg: string; fg: string; accent: string;
  /** the cover picture */
  cover: string;
  /** (no longer used: the spine's crop) */
  crop?: { x: number; y: number; side: number };
}

/**
 * The stack's layout, in the stack's own space (cm, x right, y away from the viewer, z up, from the stack's middle on the
 * mat). Book 0 lies on top, nearest the viewer; each book under it lies a step further back, turned a little more
 * clockwise, so the top of its cover shows above the one on it, widest at the left where its title starts.
 */
function stackPlan(n: number) {
  const step = stepFor(n);
  const turnOf = (j: number) => ((2.6 - j * 2.4) * Math.PI) / 180;
  const nudge = [0, 0.6, -0.4, 0.5, -0.2, 0.3, -0.5, 0.2];
  const books = Array.from({ length: n }, (_, j) => {
    const a = turnOf(j);
    return {
      a, c: new Vector2(nudge[j % nudge.length], j * step - ((n - 1) * step) / 2),
      /** its bottom's height */
      z: (n - 1 - j) * (T + 0.02),
      /** toward its head */
      head: new Vector2(-Math.sin(a), Math.cos(a)),
    };
  });
  return { step, books, top: n * (T + 0.02) };
}

/** The four corners of a book lying at `c`, turned `a` (stack space, cm). */
function corners(c: Vector2, a: number, grow = 0): Vector2[] {
  const hw = W / 2 + grow, hd = D / 2 + grow, cs = Math.cos(a), sn = Math.sin(a);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => new Vector2(c.x + x * cs - y * sn, c.y + x * sn + y * cs));
}

/** The stack's footprint on the mat (table units, from the stack's middle): what the stage's click target must cover. */
export function trayFootprint(n: number, turn = 0): { w: number; h: number; dy: number } {
  const plan = stackPlan(n);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const b of plan.books) {
    for (const p of [...corners(b.c, b.a), ...corners(b.c.clone().addScaledVector(b.head, HOVER), b.a)]) {
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
  }
  // the camera looks down about 15 degrees from straight down: the stack's top is seen a little further up the mat
  y1 += plan.top * Math.tan((15 * Math.PI) / 180);
  const w0 = (x1 - x0 + 1) * S, h0 = (y1 - y0 + 1) * S, c = Math.abs(Math.cos(turn)), sn = Math.abs(Math.sin(turn));
  return { w: w0 * c + h0 * sn, h: w0 * sn + h0 * c, dy: ((y0 + y1) / 2) * S };
}

/** Andrew's monotone chain: the convex hull of points, counter-clockwise. */
function hull(pts: Vector2[]): Vector2[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Vector2, a: Vector2, b: Vector2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Vector2[] = [], up: Vector2[] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 1e-9) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/**
 * The string: pulled tight round the stack, so it runs on the convex outline of the stack's cut along it, a string's
 * thickness out. `o` is a point on its line across the mat and `t` its direction (stack space, cm). Returns its path in
 * the plane (s along the line, z up), counter-clockwise, rounded at each corner.
 */
function stringLoop(books: ReturnType<typeof stackPlan>['books'], o: Vector2, t: Vector2): Vector2[] {
  const pts: Vector2[] = [];
  for (const b of books) {
    // where the line runs across this book: in the book's own frame, the slab between its sides
    const cs = Math.cos(-b.a), sn = Math.sin(-b.a);
    const rel = o.clone().sub(b.c);
    const p0 = new Vector2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs), d = new Vector2(t.x * cs - t.y * sn, t.x * sn + t.y * cs);
    let lo = -Infinity, hi = Infinity;
    for (const [pc, dc, h] of [[p0.x, d.x, W / 2 - 0.05], [p0.y, d.y, D / 2 - 0.05]] as const) {
      if (Math.abs(dc) < 1e-9) { if (Math.abs(pc) > h) { lo = Infinity; } continue; }
      const s1 = (-h - pc) / dc, s2 = (h - pc) / dc;
      lo = Math.max(lo, Math.min(s1, s2)); hi = Math.min(hi, Math.max(s1, s2));
    }
    if (lo >= hi) continue;
    const zb = b.z, zt = b.z + T + 0.08;
    pts.push(new Vector2(lo, zb), new Vector2(hi, zb), new Vector2(lo, zt), new Vector2(hi, zt));
  }
  const h = hull(pts);
  const out: Vector2[] = [];
  const r = STRING_R + 0.02;
  for (let i = 0; i < h.length; i += 1) {
    const prev = h[(i - 1 + h.length) % h.length], cur = h[i], next = h[(i + 1) % h.length];
    const e1 = cur.clone().sub(prev).normalize(), e2 = next.clone().sub(cur).normalize();
    // outward normals of a counter-clockwise outline point right of each edge
    const n1 = new Vector2(e1.y, -e1.x), n2 = new Vector2(e2.y, -e2.x);
    let a1 = Math.atan2(n1.y, n1.x), a2 = Math.atan2(n2.y, n2.x);
    while (a2 < a1) a2 += Math.PI * 2;
    const steps = Math.max(1, Math.ceil((a2 - a1) / 0.35));
    for (let k = 0; k <= steps; k += 1) { const a = a1 + ((a2 - a1) * k) / steps; out.push(new Vector2(cur.x + Math.cos(a) * r, Math.max(0.03, cur.y + Math.sin(a) * r))); }
  }
  return out;
}

/**
 * The cover: its picture, with the title printed across its top on the book's cloth, so it shows above the book lying on
 * it. The engine's own book is given the same cover (FlipBookApp), so nothing changes when it takes over from the copy.
 */
export function titledCover(b: TrayBook, cover: HTMLImageElement | null, cw = 1200, ch = 720): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  if (!g) return c;
  const pxPerCm = ch / (D - 0.5);
  g.fillStyle = b.bg; g.fillRect(0, 0, cw, ch);
  if (cover && cover.naturalWidth) g.drawImage(cover, 0, 0, cw, ch);
  const band = TITLE_BAND * pxPerCm;
  g.fillStyle = b.bg; g.fillRect(0, 0, cw, band);
  // (the cloth's grain, the same every time it is drawn: the copy and the engine's book carry the same cover)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 1600 * (cw / 1200) ** 2; i += 1) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(rnd() * cw, rnd() * band, 2 * cw / 1200, 2 * cw / 1200); }
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, band - 3 * cw / 1200, cw, 3 * cw / 1200);
  g.textBaseline = 'alphabetic';
  const left = 0.75 * pxPerCm;
  let right = cw - 0.7 * pxPerCm;
  g.fillStyle = b.fg;
  if (b.over) {
    g.font = `700 ${Math.round(46 * cw / 1200)}px "FB Geist", Geist, system-ui, sans-serif`;
    const o = b.over.split('').join(String.fromCharCode(8202));
    g.globalAlpha = 0.85; g.textAlign = 'right'; g.fillText(o, right, band * 0.64); g.textAlign = 'left'; g.globalAlpha = 1;
    right -= g.measureText(o).width + 0.6 * pxPerCm;
  }
  g.fillStyle = b.accent; g.fillRect(left, band * 0.2, 9 * cw / 1200, band * 0.5);
  g.fillStyle = b.fg;
  const tx = left + 0.55 * pxPerCm;
  let fs = Math.round(band * 0.66);
  do { g.font = `800 ${fs}px "FB Geist", Geist, system-ui, sans-serif`; fs -= 4; } while (g.measureText(b.title).width > right - tx && fs > 30 * cw / 1200);
  g.fillText(b.title, tx, band * 0.68);
  return c;
}


export interface BookTrayLayer extends MatLayer {
  readonly ready: Promise<void>;
  /** The book under the pointer (or the last touch) in the stack, if any. */
  pickAt(): string | null;
  /** Take a book out: it slides out of the stack and lands flat where the engine's book lies (`land`). Resolves when it has landed. */
  takeOut(slug: string): Promise<void>;
  /** The engine's book has taken over where the book landed: stop drawing the copy. */
  release(): void;
  /** The engine's book has closed and is to go back: draw the copy where it lies and send it home. */
  putBack(slug: string): void;
  /** True while a book is out of the stack or travelling. */
  readonly busy: boolean;
}

/**
 * `x`, `y`: the stack's middle on the mat (table units); `land`: where the engine's closed book lies (its middle and turn in
 * radians, counter-clockwise); `target`: the stage's click-target picture, whose engine fade the layer follows.
 */
export function createBookTrayLayer(opts: {
  x: number; y: number; books: TrayBook[]; land: { x: number; y: number; turn: number }; target?: HTMLCanvasElement;
  /** the stack's turn on the mat, radians counter-clockwise */
  turn?: number;
  canHover(): boolean; onHover?(slug: string | null): void; reducedMotion?: boolean;
}): BookTrayLayer {
  let ctx: MatLayerContext | null = null;
  const root = new Group();
  const parts: Array<{ dispose(): void }> = [];
  const shadowMeshes: Mesh[] = [];
  const shown = { value: 1 };
  const flyShown = { value: 1 };
  let targetMesh: Mesh | null = null;
  let camera: PerspectiveCamera | null = null;
  const n = opts.books.length;
  const plan = stackPlan(n);
  const turn = opts.turn ?? 0;
  interface Slot { book: TrayBook; j: number; obj: Group; hit: Mesh; rim: Mesh | null; shadow: ShaderMaterial | null; cover: ShaderMaterial | null; p: number; out: number; plain(): void }
  const slots: Slot[] = [];
  let hover: Slot | null = null;
  const pointer = { x: 0, y: 0, in: false, moved: false };
  const ray = new Raycaster();
  const ndc = new Vector2();
  let flight: null | {
    s: Slot; dir: 1 | -1; t: number; start: number; from: { p: Vector3; q: Quaternion }; to: { p: Vector3; q: Quaternion }; done?: () => void; phase: 'slide' | 'air';
  } = null;
  let out: Slot | null = null;
  let flyShadow: ShaderMaterial | null = null;
  let flyMeshShadow: Mesh | null = null;

  const findTarget = () => {
    if (!ctx || !opts.target) return;
    targetMesh = null;
    ctx.scene.traverse((o) => {
      const m = (o as Mesh).material as ShaderMaterial | undefined;
      if (m?.uniforms?.tMap?.value?.image === opts.target && m.uniforms.uAlpha && m.uniforms.uSize) targetMesh = o as Mesh;
    });
  };

  const texture = (picture: HTMLCanvasElement | HTMLImageElement) => {
    const t = new Texture(picture);
    t.colorSpace = NoColorSpace; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter; t.anisotropy = ctx?.maxAnisotropy ?? 4;
    t.needsUpdate = true; parts.push(t); return t;
  };

  /** Where book `j` lies in the stack's space (cm) when slid `s` cm toward its head. */
  const restPose = (s: Slot, slide: number) => {
    const b = plan.books[s.j];
    const p = new Vector3(b.c.x + b.head.x * slide, b.c.y + b.head.y * slide, b.z + T / 2);
    const q = new Quaternion().setFromAxisAngle(Z_AXIS, b.a).multiply(FLAT_Q);
    return { p, q };
  };
  const place = (s: Slot, slide: number) => {
    const r = restPose(s, slide);
    s.obj.position.copy(r.p); s.obj.quaternion.copy(r.q);
    if (s.shadow) {
      const w = root.localToWorld(new Vector3(r.p.x, r.p.y, 0));
      s.shadow.uniforms.uC.value.set(w.x, w.y);
    }
  };

  function build(c: MatLayerContext) {
    const shared = { uLight: { value: LIGHT }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uDawn: c.dawn };
    const mat = (u: Record<string, { value: unknown }>, alpha = shown) => {
      const m = new ShaderMaterial({
        vertexShader: SOLID_VERTEX, fragmentShader: SOLID_FRAGMENT, transparent: true, depthTest: true, depthWrite: true,
        uniforms: { uColor: { value: hex('#f4f1ea') }, tMap: { value: null }, uUseMap: { value: 0 }, ...shared, uAlpha: alpha, ...u },
      });
      parts.push(m); return m;
    };
    root.position.set(opts.x, opts.y, 0); root.rotation.z = turn; root.scale.setScalar(S);

    const shell = shellGeometry(); parts.push(shell);
    const pagesW = W / 2 - 0.3 - (X0 + BT - 0.1);
    const pagesGeo = new RoundedBoxGeometry(pagesW, T - 2 * BT - 0.04, D - 0.6, 2, 0.05); parts.push(pagesGeo);
    const coverGeo = new PlaneGeometry(W - 1.2, D - 0.5); parts.push(coverGeo);
    const pagesMat = mat({ uColor: { value: hex('#efe5d0') } });
    const hitMat = new MeshBasicMaterial({ visible: false }); parts.push(hitMat);
    const hitGeo = new BoxGeometry(W, D, T + 0.04); parts.push(hitGeo);
    const rimGeo = new PlaneGeometry(W + 2.4, D + 2.4); parts.push(rimGeo);

    const blankPicture = document.createElement('canvas'); blankPicture.width = 1; blankPicture.height = 1;
    const blank = texture(blankPicture);
    opts.books.forEach((b, j) => {
      const boardMat = mat({ uColor: { value: hex(b.bg) } });
      const plainCover = (img: HTMLImageElement | null) => { const p = document.createElement('canvas'); p.width = 1200; p.height = 720; const g = p.getContext('2d'); if (g) { g.fillStyle = b.bg; g.fillRect(0, 0, 1200, 720); if (img) g.drawImage(img, 0, 0, 1200, 720); } return p; };
      // (a small titled cover until the picture and the fonts are in, then one full-size drawing; the plain cover the book
      // turns into while it flies is only drawn when it is first hovered or taken out: none of it is made on load)
      const coverMat = mat({ tMap: { value: texture(titledCover(b, null, 400, 240)) }, uUseMap: { value: 1 }, tPlain: { value: blank }, uMix: { value: 0 } });
      coverMat.fragmentShader = COVER_FRAGMENT;
      const obj = new Group();
      const inner = new Group(); inner.position.y = -T / 2; obj.add(inner);
      const add = (geo: BufferGeometry, m: ShaderMaterial, x = 0, y = 0, z = 0) => { const mesh = new Mesh(geo, m); mesh.position.set(x, y, z); mesh.frustumCulled = false; mesh.renderOrder = 40; inner.add(mesh); return mesh; };
      add(shell, boardMat);
      add(pagesGeo, pagesMat, X0 + BT - 0.1 + pagesW / 2, T / 2, 0);
      const cov = add(coverGeo, coverMat, 0.5, T + 0.06, 0); cov.rotation.x = -Math.PI / 2;
      // where it rests on the book under it: a soft dark rim round its edges, on that book's cover
      let rim: Mesh | null = null;
      if (j < n - 1) {
        const rm = new ShaderMaterial({
          vertexShader: RIM_VERTEX, fragmentShader: RIM_FRAGMENT, transparent: true, depthTest: true, depthWrite: false,
          uniforms: { uHalf: { value: new Vector2(W / 2, D / 2) }, uR: { value: 0.3 }, uSoft: { value: 0.9 }, uStrength: { value: 0.42 }, uAlpha: shown, uDawn: c.dawn, uScreen: { value: c.screenSize } },
        });
        parts.push(rm);
        rim = new Mesh(rimGeo, rm); rim.rotation.x = -Math.PI / 2; rim.position.y = -T / 2 - 0.004; rim.renderOrder = 39; rim.frustumCulled = false;
        obj.add(rim);
      }
      root.add(obj);
      const hit = new Mesh(hitGeo, hitMat);
      const bp = plan.books[j];
      hit.position.set(bp.c.x, bp.c.y, bp.z + T / 2); hit.rotation.z = bp.a; root.add(hit);
      const s: Slot = { book: b, j, obj, hit, rim, shadow: null, cover: coverMat, p: 0, out: 0, plain: () => undefined };
      // slid clear of the books on it and of the string, before it lifts
      const yb = stringAt.y;
      const tail = bp.c.y - D / 2;
      const above = j > 0 ? plan.books[j - 1].c.y + D / 2 + 1.4 : -Infinity;
      s.out = Math.max(above - tail, yb + 1.2 - tail, 2) / Math.max(0.5, bp.head.y);
      slots.push(s);
      place(s, 0);
      // the cover's picture, once it has come (drawn onto a canvas: an SVG cover, Bambu's, cannot go to the GPU as it is)
      const img = new Image(); img.decoding = 'async';
      const pic = () => (img.complete && img.naturalWidth ? img : null);
      let plainDrawn = false;
      const drawPlain = () => {
        if (coverMat.uniforms.tPlain.value !== blank) (coverMat.uniforms.tPlain.value as Texture).dispose();
        coverMat.uniforms.tPlain.value = texture(plainCover(pic()));
      };
      s.plain = () => { if (plainDrawn || !ctx) return; plainDrawn = true; drawPlain(); };
      const loaded = new Promise<void>((done) => { img.onload = () => done(); img.onerror = () => done(); });
      img.src = b.cover;
      void Promise.all([loaded, document.fonts?.ready]).then(() => {
        if (!ctx) return;
        (coverMat.uniforms.tMap.value as Texture).dispose();
        coverMat.uniforms.tMap.value = texture(titledCover(b, pic()));
        if (plainDrawn) drawPlain();
        ctx.invalidate();
      });
    });

    // the string, tied once round the stack, across it a little crooked, with a plain knot and two cut ends on top
    const loop = stringLoop(plan.books, stringAt, stringDir);
    const to3 = (v: Vector2) => new Vector3(stringAt.x + stringDir.x * v.x, stringAt.y + stringDir.y * v.x, v.y);
    const path = new CatmullRomCurve3(loop.map(to3), true, 'centripetal');
    const stringMat = mat({ uColor: { value: hex('#f3efe6') } });
    const stringGeo = new TubeGeometry(path, 360, STRING_R, 7, true); parts.push(stringGeo);
    const stringMesh = new Mesh(stringGeo, stringMat); stringMesh.renderOrder = 42; stringMesh.frustumCulled = false; root.add(stringMesh);
    // its shadow on the covers: the same string, a little darker and wider, just down-light of it
    const dark = new ShaderMaterial({
      vertexShader: RIM_VERTEX, fragmentShader: /* glsl */ `uniform float uAlpha; uniform float uDawn; uniform vec2 uScreen; ${DAWN}
        void main() { gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), 0.32 * uAlpha); }`,
      transparent: true, depthTest: true, depthWrite: false, uniforms: { uAlpha: shown, uDawn: c.dawn, uScreen: { value: c.screenSize } },
    });
    parts.push(dark);
    const shadowGeo = new TubeGeometry(path, 360, STRING_R * 1.25, 7, true); parts.push(shadowGeo);
    const stringShadow = new Mesh(shadowGeo, dark); stringShadow.renderOrder = 41; stringShadow.frustumCulled = false;
    stringShadow.position.set(SHADOW_DIR.x * 0.22, SHADOW_DIR.y * 0.22, -0.12); root.add(stringShadow);
    // the knot: where the string crosses the top cover, right of the middle, and its two cut ends lying on the cover
    const topZ = plan.books[0].z + T + 0.08 + STRING_R;
    const kx = 8.0;
    const k = new Vector3(stringAt.x + stringDir.x * kx, stringAt.y + stringDir.y * kx, topZ);
    const knotGeo = new SphereGeometry(1, 16, 12); parts.push(knotGeo);
    const knot = new Mesh(knotGeo, stringMat); knot.scale.set(0.55, 0.42, 0.3); knot.position.copy(k); knot.rotation.z = Math.atan2(stringDir.y, stringDir.x) + 0.5;
    knot.renderOrder = 43; knot.frustumCulled = false; root.add(knot);
    const end = (pts: Array<[number, number]>) => {
      const curve = new CatmullRomCurve3(pts.map(([x, y]) => new Vector3(k.x + x, k.y + y, topZ - 0.02)));
      const geo = new TubeGeometry(curve, 24, STRING_R * 0.95, 6, false); parts.push(geo);
      const m = new Mesh(geo, stringMat); m.renderOrder = 42; m.frustumCulled = false; root.add(m);
      const sh = new Mesh(geo, dark); sh.renderOrder = 41; sh.frustumCulled = false; sh.position.set(SHADOW_DIR.x * 0.22, SHADOW_DIR.y * 0.22, -0.12); root.add(sh);
    };
    end([[0.1, -0.1], [0.9, -0.9], [1.5, -1.9], [1.7, -2.7]]);
    end([[-0.1, -0.1], [-0.5, -1.0], [-0.4, -2.0], [-0.9, -2.6]]);

    c.scene.add(root);
    root.updateMatrixWorld(true);

    // shadows on the mat: each book's, swept from the mat to its top along the light, and the book while it is out
    const caster = (alpha: { value: number }) => {
      const geo = new PlaneGeometry(8, 8); parts.push(geo);
      const m = new ShaderMaterial({
        vertexShader: SHADOW_VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          uC: { value: new Vector2() }, uAng: { value: 0 }, uHalf: { value: new Vector2() }, uR: { value: 0.02 }, uB: { value: 0 }, uT: { value: 0.1 },
          uDir: { value: SHADOW_DIR }, uStrength: { value: 0.9 }, uAlpha: alpha, uDawn: c.dawn, uScreen: { value: c.screenSize },
        },
      });
      parts.push(m);
      const mesh = new Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 1.7; mesh.position.z = 0.0006;
      shadowMeshes.push(mesh); c.scene.add(mesh);
      return { mesh, m };
    };
    for (const s of slots) {
      const b = plan.books[s.j];
      const sh = caster(shown);
      const u = sh.m.uniforms;
      u.uAng.value = b.a + turn; u.uHalf.value.set((W / 2) * S, (D / 2) * S); u.uR.value = 0.4 * S;
      u.uB.value = 0; u.uT.value = (b.z + T) * S * LONG; u.uStrength.value = 0.78;
      const w = root.localToWorld(new Vector3(b.c.x, b.c.y, 0));
      sh.mesh.position.set(w.x, w.y, 0.0006); sh.mesh.scale.setScalar(0.25);
      s.shadow = sh.m;
      place(s, 0);
    }
    const fs = caster(flyShown);
    fs.mesh.visible = false;
    fs.m.uniforms.uHalf.value.set(0.5, 0.3);
    fs.m.uniforms.uStrength.value = 0.75;
    flyShadow = fs.m;
    flyMeshShadow = fs.mesh;
  }
  // the string's line across the stack: a little below the middle, where every book lies under it, a little crooked
  // (below the top book's title, above the bottom book's foot)
  const stringAt = new Vector2(0.4, -((n - 1) * plan.step) / 2 + D / 2 - TITLE_BAND - 0.25 - 1.15);
  const stringDir = new Vector2(Math.cos((-1 * Math.PI) / 180), Math.sin((-1 * Math.PI) / 180));

  /* ---------- pointer ---------- */
  const pick = (): Slot | null => {
    if (!camera || !ctx || !pointer.in) return null;
    const el = ctx.renderer.domElement, r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    ndc.set(((pointer.x - r.left) / r.width) * 2 - 1, -((pointer.y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(slots.filter((s) => s !== out).map((s) => s.hit), false);
    return hits.length ? slots.find((s) => s.hit === hits[0].object) ?? null : null;
  };
  const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; pointer.x = e.clientX; pointer.y = e.clientY; pointer.in = true; pointer.moved = true; ctx?.invalidate(); };
  const onDown = (e: PointerEvent) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.in = true; pointer.moved = true;
    // a finger has no hover: its tap slides the book out a little, as the pointer resting on it would
    if (e.pointerType !== 'mouse' && !flight && !out && opts.canHover()) { const s = pick(); if (s !== hover) { hover = s; s?.plain(); opts.onHover?.(s?.book.slug ?? null); } }
    ctx?.invalidate();
  };
  const onLeave = () => { pointer.in = false; pointer.moved = true; ctx?.invalidate(); };

  /* ---------- the trip out and back ---------- */
  const tmpP = new Vector3(), tmpQ = new Quaternion(), tmpS = new Vector3();
  const flatPose = () => {
    const q = FLAT_Q.clone().premultiply(new Quaternion().setFromAxisAngle(Z_AXIS, opts.land.turn));
    return { p: new Vector3(opts.land.x, opts.land.y, (T / 2) * S), q };
  };
  /** Where a book lies in the mat's own space when slid `slide` cm out of its place. */
  const worldPose = (s: Slot, slide: number) => {
    const r = restPose(s, slide);
    root.updateMatrixWorld(true);
    new Matrix4().compose(r.p, r.q, new Vector3(1, 1, 1)).premultiply(root.matrixWorld).decompose(tmpP, tmpQ, tmpS);
    return { p: tmpP.clone(), q: tmpQ.clone() };
  };
  /** Hand a book from the stack to the mat's own space, keeping where it is on screen. */
  const detach = (s: Slot) => {
    s.obj.updateMatrixWorld(true); s.obj.matrixWorld.decompose(tmpP, tmpQ, tmpS);
    ctx?.scene.add(s.obj); s.obj.position.copy(tmpP); s.obj.quaternion.copy(tmpQ); s.obj.scale.setScalar(S);
    if (s.rim) s.rim.visible = false;
    if (s.shadow) s.shadow.uniforms.uStrength.value = 0;
  };
  const attachHome = (s: Slot, slide: number) => {
    root.add(s.obj); s.obj.scale.setScalar(1); place(s, slide);
    if (s.rim) s.rim.visible = true;
    if (s.shadow) s.shadow.uniforms.uStrength.value = 0.78;
    if (s.cover) s.cover.uniforms.uMix.value = 0;
  };
  const SLIDE_S = 0.26, AIR_S = 0.5;
  const easeOut = (k: number) => 1 - (1 - k) ** 3;
  const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

  let resolveReady: () => void = () => undefined;
  const ready = new Promise<void>((r) => { resolveReady = r; });

  const layer: BookTrayLayer = {
    ready,
    get busy() { return Boolean(flight || out); },
    attach(c) {
      ctx = c; build(c);
      const el = c.renderer.domElement;
      el.addEventListener('pointermove', onMove); el.addEventListener('pointerdown', onDown); el.addEventListener('pointerleave', onLeave);
      resolveReady(); c.invalidate();
    },
    pickAt() { if (flight || out) return null; return (hover ?? pick())?.book.slug ?? null; },
    takeOut(slug) {
      const s = slots.find((each) => each.book.slug === slug);
      if (!s || !ctx) return Promise.resolve();
      s.plain();
      if (hover) { hover = null; opts.onHover?.(null); }
      return new Promise<void>((resolve) => {
        if (opts.reducedMotion) { detach(s); if (s.cover) s.cover.uniforms.uMix.value = 1; const f = flatPose(); s.obj.position.copy(f.p); s.obj.quaternion.copy(f.q); out = s; flight = null; ctx?.invalidate(); resolve(); return; }
        flight = { s, dir: 1, t: 0, start: s.p * HOVER, phase: 'slide', from: worldPose(s, s.p * HOVER), to: worldPose(s, s.out), done: resolve };
        ctx?.invalidate();
      });
    },
    release() {
      if (!out) return;
      out.obj.visible = false;
      if (flyMeshShadow) flyMeshShadow.visible = false;
      ctx?.invalidate();
    },
    putBack(slug) {
      const s = slots.find((each) => each.book.slug === slug);
      if (!s || !ctx) return;
      s.plain();
      if (s.obj.parent === root) detach(s);
      const f = flatPose(); s.obj.position.copy(f.p); s.obj.quaternion.copy(f.q); s.obj.visible = true;
      out = s;
      if (opts.reducedMotion) { attachHome(s, 0); s.p = 0; out = null; ctx.invalidate(); return; }
      flight = { s, dir: -1, t: 0, start: s.out, phase: 'air', from: f, to: worldPose(s, s.out) };
      ctx.invalidate();
    },
    update(dt, cam) {
      camera = cam;
      if (!root.parent) return false;
      if (opts.target && (!targetMesh || !targetMesh.parent)) findTarget();
      const now = targetMesh ? ((targetMesh.material as ShaderMaterial).uniforms.uAlpha.value as number) : 1;
      if (Math.abs(now - shown.value) > 1e-4) {
        shown.value = now; root.visible = now > 0.003;
        for (const m of shadowMeshes) if (m !== flyMeshShadow) m.visible = root.visible;
      }
      let moving = false;
      // the pointer: which book it rests on (only at the wide view, and not while a book is out)
      if (pointer.moved) {
        pointer.moved = false;
        const next = !flight && !out && opts.canHover() ? pick() : null;
        if (next !== hover) { hover = next; hover?.plain(); opts.onHover?.(hover?.book.slug ?? null); }
      }
      const k = 1 - Math.exp(-dt * 13);   // moves at once, settles on a long soft tail, no overshoot
      for (const s of slots) {
        if (flight?.s === s || out === s) continue;
        const want = hover === s ? 1 : 0;
        if (Math.abs(want - s.p) > 1e-3) { s.p += (want - s.p) * k; moving = true; } else s.p = want;
        place(s, s.p * HOVER);
      }
      if (flight) {
        moving = true;
        const f = flight;
        f.t += dt;
        if (f.phase === 'slide') {
          const kk = Math.min(1, f.t / SLIDE_S);
          if (f.dir === 1) {
            // out: from wherever the pointer had slid it, out from under the books on it and the string
            const sl = f.start + (f.s.out - f.start) * easeInOut(kk);
            place(f.s, sl);
            if (kk >= 1) {
              detach(f.s);
              flight = { s: f.s, dir: 1, t: 0, start: f.s.out, phase: 'air', from: { p: f.s.obj.position.clone(), q: f.s.obj.quaternion.clone() }, to: flatPose(), done: f.done };
            }
          } else {
            // back home: slid back under the string into its place
            const sl = f.s.out * (1 - easeOut(kk));
            place(f.s, sl);
            if (kk >= 1) { f.s.p = 0; place(f.s, 0); flight = null; out = null; pointer.moved = true; }
          }
        } else {
          const kk = Math.min(1, f.t / AIR_S);
          const e = f.dir === 1 ? easeOut(kk) : easeInOut(kk);
          const pos = f.from.p.clone().lerp(f.to.p, e);
          pos.z += Math.sin(Math.PI * e) * 0.3;
          f.s.obj.position.copy(pos);
          f.s.obj.quaternion.slerpQuaternions(f.from.q, f.to.q, easeInOut(kk));
          // (its title band goes as it flies: where it lands, the engine's book, whose cover has none, takes over)
          if (f.s.cover) f.s.cover.uniforms.uMix.value = f.dir === 1 ? easeInOut(kk) : 1 - easeInOut(kk);
          if (flyShadow && flyMeshShadow) {
            flyMeshShadow.visible = true;
            flyShadow.uniforms.uC.value.set(pos.x, pos.y);
            const ax = new Vector3(1, 0, 0).applyQuaternion(f.s.obj.quaternion);
            flyShadow.uniforms.uAng.value = Math.atan2(ax.y, ax.x);
            flyShadow.uniforms.uB.value = Math.max(0, pos.z - (T / 2) * S); flyShadow.uniforms.uT.value = pos.z + 0.04;
            flyMeshShadow.position.set(pos.x, pos.y, 0.0006);
          }
          if (kk >= 1) {
            if (f.dir === 1) { out = f.s; flight = null; f.done?.(); }
            else {
              attachHome(f.s, f.s.out);
              if (flyMeshShadow) flyMeshShadow.visible = false;
              flight = { s: f.s, dir: -1, t: 0, start: f.s.out, phase: 'slide', from: f.to, to: f.to };
            }
          }
        }
      }
      return moving;
    },
    dispose() {
      const el = ctx?.renderer.domElement;
      el?.removeEventListener('pointermove', onMove); el?.removeEventListener('pointerdown', onDown); el?.removeEventListener('pointerleave', onLeave);
      root.removeFromParent();
      for (const s of slots) s.obj.removeFromParent();
      for (const m of shadowMeshes) m.removeFromParent();
      for (const p of parts) p.dispose();
      parts.length = 0; shadowMeshes.length = 0; slots.length = 0; ctx = null;
    },
  };
  return layer;
}
