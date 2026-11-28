/**
 * The project books on the home mat, standing by their spines in a birch-ply tray (Adi, 2026-11-27: "imagine if there were
 * 6 to 8 books ... maybe there's a spine that we make for all of them"; he approved the tray with "Yeass push"). Thin
 * hardcovers with rounded spines in a curved tray tipped back on a solid birch wedge, so the spines face up at the
 * camera. The tray is as long as the list of books. The pointer resting on a spine slides that book half out; a click
 * takes it out, it arcs down and lands flat on the mat in front of the tray, where the engine's own book takes over and
 * opens. Closed again, the book goes back into its slot. Prototype: review/designs-2026-11-27/books/shelf.html.
 *
 * A MatLayer like the Bot tablet and the Snapdeal bag: it shares the engine's camera, window light and opening light. The
 * stage keeps an empty click target where it stands; the layer fades with the engine's own fade for that target.
 *
 * Units: built in centimetres (a book is 22 cm wide, as in the prototype), drawn at one table unit per book width. The mat
 * is the xy plane, z is up, and -y is toward the viewer.
 */
import {
  Box3, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Group, LinearFilter, LinearMipmapLinearFilter,
  Matrix4, Mesh, MeshBasicMaterial, BoxGeometry, NoColorSpace, PerspectiveCamera, Texture, PlaneGeometry, Quaternion, Raycaster,
  ShaderMaterial, Shape, Vector2, Vector3, DoubleSide,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';

/* ---------- sizes (cm) ---------- */
const W = 22;            // a book's width, spine to fore-edge (one table unit)
const D = 13.2;          // its height, head to tail (the engine's closed book: 0.6 of its width)
const T = 1.5;           // its thickness
const GAP = 0.22;        // between books in the tray
const PULL = D / 2;      // how far the pointer slides a book out
const TILT = (62 * Math.PI) / 180;   // the tray tipped back, so the spines face the camera looking down at the mat
const S = 1 / W;         // table units per cm
const BUL = 0.38, BT = 0.2, X0 = -W / 2 + BUL;   // how far the spine bulges, board thickness, where the bulge starts
const ZI = W / 2 + 0.75, ZO = ZI + 0.8;          // the tray's inner and outer walls, front and back

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
/** A book standing in its slot: spine toward the viewer, head up, cover to the right. */
const STAND_Q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(0, 0, -1), new Vector3(1, 0, 0), new Vector3(0, -1, 0)));
const hex = (h: string) => new Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

/* ---------- shapes ---------- */

/** A corner-rounded outline: each [x, y, r] corner is replaced by a curve of its own radius. */
function rounded(pts: Array<[number, number, number]>): Shape {
  const s = new Shape(), n = pts.length, P = (i: number) => pts[(i + n) % n];
  const cut = (a: [number, number], b: [number, number, number], r: number): [number, number] => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [a[0] + (dx / l) * r, a[1] + (dy / l) * r];
  };
  for (let i = 0; i < n; i += 1) {
    const [x, y, r] = P(i), a = cut([x, y], P(i - 1), r), c = cut([x, y], P(i + 1), r);
    if (i) s.lineTo(a[0], a[1]); else s.moveTo(a[0], a[1]);
    s.quadraticCurveTo(x, y, c[0], c[1]);
  }
  s.closePath();
  return s;
}
/** A point on the spine's curve, t 0 (top board) to 1 (bottom board). */
function spineAt(t: number): [number, number] {
  const u = 1 - t, k = 1.33 * BUL;
  return [u * u * u * X0 + 3 * u * u * t * (X0 - k) + 3 * u * t * t * (X0 - k) + t * t * t * X0, T * (u * u * u + 3 * u * u * t)];
}
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
/** A strip laid on the curved spine, so the spine's print wraps round it. */
function spineGeometry(): BufferGeometry {
  const N = 18, L = D - 0.5, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i += 1) {
    const t = i / N, [x, y] = spineAt(t), [x2, y2] = spineAt(Math.min(1, t + 0.01)), [x1, y1] = spineAt(Math.max(0, t - 0.01));
    let nx = y2 - y1, ny = -(x2 - x1); const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    if (nx > 0) { nx = -nx; ny = -ny; }
    for (const z of [-L / 2, L / 2]) { pos.push(x + nx * 0.06, y + ny * 0.06, z); uv.push((z + L / 2) / L, 1 - t); }
  }
  for (let i = 0; i < N; i += 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export interface TrayBook {
  slug: string;
  /** printed on the spine */
  title: string;
  /** a small line printed after the title, near the foot (Bambu: "BAMBU LAB") */
  over?: string;
  /** the spine's cloth, its print, and the thin bar at its foot */
  bg: string; fg: string; accent: string;
  /** the cover picture: printed on the cover, and a square of it on the spine */
  cover: string;
  /** where the square on the spine is cut from the cover picture: its middle and side, as fractions of the picture's height */
  crop?: { x: number; y: number; side: number };
}

/** The tray's layout: where each book's slot is, and the tray's own size, all in tray space (cm, y up, z toward the viewer). */
function trayPlan(n: number) {
  const row = n * (T + GAP) - GAP;
  const len = row + 2.6;
  return { row, len, slotX: (i: number) => -row / 2 + T / 2 + i * (T + GAP) };
}

/** Builds the tray's birch: the U channel, two rounded bookends and the wedge it rests on. Returns the tray group (tipped). */
function buildTray(n: number, solid: (geo: BufferGeometry) => Mesh): { tray: Group; block: Mesh; lift: number } {
  const { len } = trayPlan(n);
  const tray = new Group();
  const prof = rounded([[ZO, -0.8, 1.4], [-ZO, -0.8, 1.4], [-ZO, 2.2, 0.4], [-ZI, 2.2, 0.4], [-ZI, 0, 0.7], [ZI, 0, 0.7], [ZI, 2.2, 0.4], [ZO, 2.2, 0.4]]);
  const chanGeo = new ExtrudeGeometry(prof, { depth: len - 1.6, bevelEnabled: false, curveSegments: 14 });
  chanGeo.translate(0, 0, -(len - 1.6) / 2);
  const chan = solid(chanGeo); chan.rotation.y = -Math.PI / 2; tray.add(chan);
  const ends = rounded([[ZO, -0.8, 1.4], [-ZO, -0.8, 1.4], [-ZO, 3.4, 1.4], [ZO, 3.4, 1.4]]);
  for (const sx of [-1, 1]) {
    const g = new ExtrudeGeometry(ends, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 4, curveSegments: 14 });
    g.translate(0, 0, -0.25);
    const e = solid(g); e.rotation.y = -Math.PI / 2; e.position.x = sx * (len / 2 - 0.4); tray.add(e);
  }
  tray.rotation.x = -TILT;
  tray.updateMatrixWorld(true);
  const bb = new Box3(); chan.updateMatrixWorld(true); bb.expandByObject(tray);
  const lift = -bb.min.y;
  tray.position.y = lift; tray.updateMatrixWorld(true);
  // the block it rests on: a solid birch wedge filling the space under the tray, from its back edge on the mat to its
  // raised front, so the tray stands on the mat and does not float (Adi, 2026-11-27: "why is it half floating")
  const back = tray.localToWorld(new Vector3(0, -0.8, -ZO + 1.4));
  const front = tray.localToWorld(new Vector3(0, -0.8, ZO - 1.4));
  const side = rounded([[back.z - 0.3, 0, 0.3], [front.z, 0, 0.9], [front.z, front.y + 0.05, 0.9], [back.z - 0.3, back.y + 0.05, 0.3]]);
  const wedgeGeo = new ExtrudeGeometry(side, { depth: len - 1.4, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 3, curveSegments: 10 });
  wedgeGeo.translate(0, 0, -(len - 1.4) / 2);
  const block = solid(wedgeGeo); block.rotation.y = -Math.PI / 2;
  return { tray, block, lift };
}

/** The tray's footprint on the mat (table units, from the tray's middle): what the stage's click target must cover. */
export function trayFootprint(n: number, turn = 0): { w: number; h: number; dy: number } {
  const parts: BufferGeometry[] = [];
  const solid = (geo: BufferGeometry) => { parts.push(geo); return new Mesh(geo); };
  const { tray, block } = buildTray(n, solid);
  const root = new Group(); root.add(tray, block);
  // the books' top, slid out: roughly the tray's back edge raised by a book's height
  const top = tray.localToWorld(new Vector3(0, D + PULL, 0));
  root.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(root);
  for (const p of parts) p.dispose();
  // the camera looks down about 15 degrees from straight down: things that stand up are seen a little further up the mat
  const reach = Math.max(bb.max.y, top.y) * Math.tan((15 * Math.PI) / 180);
  const minZ = Math.min(bb.min.z, -top.z), maxZ = bb.max.z;
  // tray space z toward the viewer is the mat's -y
  const near = -maxZ, far = -minZ + reach;
  // (turned on the mat, it covers the box round its turned outline)
  const w0 = (bb.max.x - bb.min.x + 1) * S, h0 = (far - near + 1) * S, c = Math.abs(Math.cos(turn)), sn = Math.abs(Math.sin(turn));
  return { w: w0 * c + h0 * sn, h: w0 * sn + h0 * c, dy: ((far + near) / 2) * S };
}

export interface BookTrayLayer extends MatLayer {
  readonly ready: Promise<void>;
  /** The book under the pointer (or the last touch) in the tray, if any. */
  pickAt(): string | null;
  /** Take a book out: it slides out and lands flat where the engine's book lies (`land`). Resolves when it has landed. */
  takeOut(slug: string): Promise<void>;
  /** The engine's book has taken over where the book landed: stop drawing the copy. */
  release(): void;
  /** The engine's book has closed and is to go back: draw the copy where it lies and send it home. */
  putBack(slug: string): void;
  /** True while a book is out of the tray or travelling. */
  readonly busy: boolean;
}

/**
 * `x`, `y`: the tray's middle on the mat (table units); `land`: where the engine's closed book lies (its middle and turn in
 * radians, counter-clockwise); `target`: the stage's click-target picture, whose engine fade the layer follows.
 */
export function createBookTrayLayer(opts: {
  x: number; y: number; books: TrayBook[]; land: { x: number; y: number; turn: number }; target?: HTMLCanvasElement;
  /** the tray's turn on the mat, radians counter-clockwise: turned so the last book's cover shows, not only the spines */
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
  const plan = trayPlan(n);
  interface Slot { book: TrayBook; slot: Group; obj: Group; hit: Mesh; p: number }
  const slots: Slot[] = [];
  let hover: Slot | null = null;
  const pointer = { x: 0, y: 0, in: false, moved: false };
  const ray = new Raycaster();
  const ndc = new Vector2();
  let flight: null | {
    s: Slot; dir: 1 | -1; t: number; start: number; from: { p: Vector3; q: Quaternion }; to: { p: Vector3; q: Quaternion }; done?: () => void; phase: 'slot' | 'air';
  } = null;
  let out: Slot | null = null;
  let flyShadow: ShaderMaterial | null = null;

  const findTarget = () => {
    if (!ctx || !opts.target) return;
    targetMesh = null;
    ctx.scene.traverse((o) => {
      const m = (o as Mesh).material as ShaderMaterial | undefined;
      if (m?.uniforms?.tMap?.value?.image === opts.target && m.uniforms.uAlpha && m.uniforms.uSize) targetMesh = o as Mesh;
    });
  };

  /** The spine's print: a square of the cover, the title, the small line, and the accent bar at the foot. */
  function drawSpine(b: TrayBook, cover: HTMLImageElement | null): HTMLCanvasElement {
    const c = document.createElement('canvas'); c.width = 1320; c.height = 200;
    const g = c.getContext('2d');
    if (!g) return c;
    g.fillStyle = b.bg; g.fillRect(0, 0, 1320, 200);
    for (let i = 0; i < 2500; i += 1) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},.04)`; g.fillRect(Math.random() * 1320, Math.random() * 200, 2, 2); }
    g.textBaseline = 'middle';
    if (cover && cover.naturalWidth) {
      const cr = b.crop ?? { x: 0.72, y: 0.5, side: 0.62 };
      const side = cover.naturalHeight * cr.side;
      const sx = Math.max(0, Math.min(cover.naturalWidth - side, cover.naturalWidth * cr.x - side / 2));
      const sy = Math.max(0, Math.min(cover.naturalHeight - side, cover.naturalHeight * cr.y - side / 2));
      g.save(); g.beginPath(); g.roundRect(34, 38, 124, 124, 16); g.clip(); g.drawImage(cover, sx, sy, side, side, 34, 38, 124, 124); g.restore();
    }
    g.fillStyle = b.fg;
    let right = 1190;
    if (b.over) {
      g.font = '700 38px "FB Geist", Geist, system-ui, sans-serif';
      const o = b.over.split('').join(String.fromCharCode(8202));
      g.globalAlpha = 0.85; g.textAlign = 'right'; g.fillText(o, right, 102); g.textAlign = 'left'; g.globalAlpha = 1;
      right -= g.measureText(o).width + 40;
    }
    let fs = 112;
    do { g.font = `800 ${fs}px "FB Geist", Geist, system-ui, sans-serif`; fs -= 4; } while (g.measureText(b.title).width > right - 196 && fs > 30);
    g.fillText(b.title, 196, 104);
    g.fillStyle = b.accent; g.fillRect(1236, 46, 8, 108);
    return c;
  }

  const texture = (picture: HTMLCanvasElement | HTMLImageElement) => {
    const t = new Texture(picture);
    t.colorSpace = NoColorSpace; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter; t.anisotropy = ctx?.maxAnisotropy ?? 4;
    t.needsUpdate = true; parts.push(t); return t;
  };

  function build(c: MatLayerContext) {
    const shared = { uLight: { value: LIGHT }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uDawn: c.dawn };
    const mat = (u: Record<string, { value: unknown }>, alpha = shown) => {
      const m = new ShaderMaterial({
        vertexShader: SOLID_VERTEX, fragmentShader: SOLID_FRAGMENT, transparent: true, depthTest: true, depthWrite: true,
        uniforms: { uColor: { value: hex('#e2c596') }, tMap: { value: null }, uUseMap: { value: 0 }, ...shared, uAlpha: alpha, ...u },
      });
      parts.push(m); return m;
    };
    const birch = mat({});
    const solidWith = (m: ShaderMaterial) => (geo: BufferGeometry) => { parts.push(geo); const mesh = new Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 40; return mesh; };

    // tray space: cm, y up, z toward the viewer; turned into the mat's (x, -z, y) and scaled to table units
    const space = new Group();
    space.rotation.x = Math.PI / 2; space.scale.setScalar(S);
    root.position.set(opts.x, opts.y, 0); root.rotation.z = opts.turn ?? 0;
    root.add(space);
    const { tray, block } = buildTray(n, solidWith(birch));
    space.add(tray, block);

    const shell = shellGeometry(); parts.push(shell);
    const spineGeo = spineGeometry(); parts.push(spineGeo);
    const pagesW = W / 2 - 0.3 - (X0 + BT - 0.1);
    const pagesGeo = new RoundedBoxGeometry(pagesW, T - 2 * BT - 0.04, D - 0.6, 2, 0.05); parts.push(pagesGeo);
    const coverGeo = new PlaneGeometry(W - 1.2, D - 0.5); parts.push(coverGeo);
    const pagesMat = mat({ uColor: { value: hex('#efe5d0') } });
    const hitMat = new MeshBasicMaterial({ visible: false }); parts.push(hitMat);
    const hitGeo = new BoxGeometry(T + GAP, D + PULL, W + 1); parts.push(hitGeo);

    opts.books.forEach((b, i) => {
      const boardMat = mat({ uColor: { value: hex(b.bg) } });
      const spineMat = mat({ tMap: { value: texture(drawSpine(b, null)) }, uUseMap: { value: 1 } }); spineMat.side = DoubleSide;
      const coverMat = mat({ uColor: { value: hex(b.bg) } });
      const obj = new Group();
      const inner = new Group(); inner.position.y = -T / 2; obj.add(inner);
      const add = (geo: BufferGeometry, m: ShaderMaterial, x = 0, y = 0, z = 0) => { const mesh = new Mesh(geo, m); mesh.position.set(x, y, z); mesh.frustumCulled = false; mesh.renderOrder = 40; inner.add(mesh); return mesh; };
      add(shell, boardMat);
      add(pagesGeo, pagesMat, X0 + BT - 0.1 + pagesW / 2, T / 2, 0);
      add(spineGeo, spineMat);
      const cov = add(coverGeo, coverMat, 0.5, T + 0.06, 0); cov.rotation.x = -Math.PI / 2;
      obj.quaternion.copy(STAND_Q);
      const slot = new Group(); slot.position.set(plan.slotX(i), D / 2, 0); slot.add(obj); tray.add(slot);
      const hit = new Mesh(hitGeo, hitMat); hit.position.set(plan.slotX(i), (D + PULL) / 2, 0); tray.add(hit);
      slots.push({ book: b, slot, obj, hit, p: 0 });
      // the cover's picture: printed on the cover and cut small for the spine, once it has come
      const img = new Image(); img.decoding = 'async';
      img.onload = () => {
        if (!ctx) return;
        (spineMat.uniforms.tMap.value as Texture).dispose();
        spineMat.uniforms.tMap.value = texture(drawSpine(b, img));
        coverMat.uniforms.tMap.value = texture(img); coverMat.uniforms.uUseMap.value = 1;
        ctx.invalidate();
      };
      img.src = b.cover;
    });
    c.scene.add(root);
    root.updateMatrixWorld(true);

    // shadows: the tray with its books, and the book while it is out
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
    // the tray's shadow follows its real outline: cut into bands front to back, each band's shadow cast from its own width
    // and height (the hit boxes are not things, so they cast none)
    const BANDS = 28;
    const pts: Vector3[] = [];
    const v = new Vector3();
    space.updateMatrixWorld(true);
    space.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh || (m.material as MeshBasicMaterial).visible === false) return;
      const pos = m.geometry.getAttribute('position');
      const step = Math.max(1, Math.floor(pos.count / 400));
      for (let i = 0; i < pos.count; i += step) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
    });
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const bandH = (y1 - y0) / BANDS;
    for (let k = 0; k < BANDS; k += 1) {
      let x0 = Infinity, x1 = -Infinity, top = 0;
      for (const p of pts) {
        if (p.y < y0 + k * bandH - 1e-4 || p.y > y0 + (k + 1) * bandH + 1e-4) continue;
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); top = Math.max(top, p.z);
      }
      if (!Number.isFinite(x0)) continue;
      const cx = (x0 + x1) / 2, cy = y0 + (k + 0.5) * bandH, reach = top * LONG;
      const band = caster(shown);
      const u = band.m.uniforms;
      u.uC.value.set(cx, cy); u.uHalf.value.set((x1 - x0) / 2, bandH / 2 + 0.004); u.uR.value = 0.006;
      u.uT.value = reach; u.uStrength.value = 0.7;
      // (each band's plane only as big as its shadow can reach, so the mat is not shaded over and over)
      band.mesh.geometry.dispose();
      band.mesh.geometry = new PlaneGeometry(x1 - x0 + reach * 1.3 + 0.3, bandH + reach * 1.6 + 0.3);
      parts.push(band.mesh.geometry);
      band.mesh.position.set(cx + SHADOW_DIR.x * reach / 2, cy + SHADOW_DIR.y * reach / 2, 0.0006);
    }
    const fs = caster(flyShown);
    fs.mesh.visible = false;
    fs.m.uniforms.uHalf.value.set(0.5, 0.3);
    fs.m.uniforms.uStrength.value = 0.75;
    flyShadow = fs.m;
    flyMeshShadow = fs.mesh;
  }
  let flyMeshShadow: Mesh | null = null;

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
    // a finger has no hover: its tap slides the book out, as the pointer resting on it would
    if (e.pointerType !== 'mouse' && !flight && !out && opts.canHover()) { const s = pick(); if (s !== hover) { hover = s; opts.onHover?.(s?.book.slug ?? null); } }
    ctx?.invalidate();
  };
  const onLeave = () => { pointer.in = false; pointer.moved = true; ctx?.invalidate(); };

  /* ---------- the trip out and back ---------- */
  const tmpP = new Vector3(), tmpQ = new Quaternion(), tmpS = new Vector3();
  const flatPose = () => {
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, -1, 0)));
    q.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), opts.land.turn));
    return { p: new Vector3(opts.land.x, opts.land.y, (T / 2) * S), q };
  };
  /** Hand a book from its slot to the mat's own space, keeping where it is on screen. */
  const detach = (s: Slot) => { s.obj.updateMatrixWorld(true); s.obj.matrixWorld.decompose(tmpP, tmpQ, tmpS); ctx?.scene.add(s.obj); s.obj.position.copy(tmpP); s.obj.quaternion.copy(tmpQ); s.obj.scale.setScalar(S); };
  const attachTo = (s: Slot) => { s.slot.add(s.obj); s.obj.position.set(0, 0, 0); s.obj.scale.setScalar(1); s.obj.quaternion.copy(STAND_Q); };
  /** Where a book stands, in the mat's space, when its slot is slid out by `p`. */
  const slotPose = (s: Slot, p: number) => {
    const prev = s.slot.position.y; s.slot.position.y = D / 2 + p * PULL; s.slot.updateMatrixWorld(true);
    const m = s.slot.matrixWorld.clone().multiply(new Matrix4().makeRotationFromQuaternion(STAND_Q));
    m.decompose(tmpP, tmpQ, tmpS);
    s.slot.position.y = prev; s.slot.updateMatrixWorld(true);
    return { p: tmpP.clone(), q: tmpQ.clone() };
  };
  const SLOT_S = 0.2, AIR_S = 0.5;
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
      if (hover) { hover = null; opts.onHover?.(null); }
      return new Promise<void>((resolve) => {
        if (opts.reducedMotion) { detach(s); const f = flatPose(); s.obj.position.copy(f.p); s.obj.quaternion.copy(f.q); out = s; flight = null; ctx?.invalidate(); resolve(); return; }
        flight = { s, dir: 1, t: 0, start: s.p, phase: 'slot', from: slotPose(s, s.p), to: slotPose(s, 1), done: resolve };
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
      if (s.obj.parent === s.slot) detach(s);
      const f = flatPose(); s.obj.position.copy(f.p); s.obj.quaternion.copy(f.q); s.obj.visible = true;
      out = s;
      if (opts.reducedMotion) { attachTo(s); s.p = 0; s.slot.position.y = D / 2; out = null; ctx.invalidate(); return; }
      flight = { s, dir: -1, t: 0, start: 1, phase: 'air', from: f, to: slotPose(s, 1) };
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
        if (next !== hover) { hover = next; opts.onHover?.(hover?.book.slug ?? null); }
      }
      const k = 1 - Math.exp(-dt * 13);   // moves at once, settles on a long soft tail, no overshoot
      for (const s of slots) {
        if (flight?.s === s || out === s) continue;
        const want = hover === s ? 1 : 0;
        if (Math.abs(want - s.p) > 1e-3) { s.p += (want - s.p) * k; moving = true; } else s.p = want;
        s.slot.position.y = D / 2 + s.p * PULL;
      }
      if (flight) {
        moving = true;
        const f = flight;
        f.t += dt;
        if (f.phase === 'slot') {
          const kk = Math.min(1, f.t / SLOT_S);
          if (f.dir === 1) {
            // out: from wherever the pointer had slid it, all the way up out of the tray
            const p = f.start + (1 - f.start) * easeInOut(kk);
            f.s.p = p; f.s.slot.position.y = D / 2 + p * PULL;
            if (kk >= 1) {
              f.s.p = 1; detach(f.s);
              flight = { s: f.s, dir: 1, t: 0, start: 1, phase: 'air', from: { p: f.s.obj.position.clone(), q: f.s.obj.quaternion.clone() }, to: flatPose(), done: f.done };
            }
          } else {
            // back home: from fully out, down into its slot
            const p = 1 - easeOut(kk);
            f.s.p = p; f.s.slot.position.y = D / 2 + p * PULL;
            if (kk >= 1) { f.s.p = 0; f.s.slot.position.y = D / 2; flight = null; out = null; pointer.moved = true; }
          }
        } else {
          const kk = Math.min(1, f.t / AIR_S);
          const e = f.dir === 1 ? easeOut(kk) : easeInOut(kk);
          const pos = f.from.p.clone().lerp(f.to.p, e);
          pos.z += Math.sin(Math.PI * e) * 0.28;
          f.s.obj.position.copy(pos);
          f.s.obj.quaternion.slerpQuaternions(f.from.q, f.to.q, easeInOut(kk));
          if (flyShadow && flyMeshShadow) {
            flyMeshShadow.visible = true;
            flyShadow.uniforms.uC.value.set(pos.x, pos.y); flyShadow.uniforms.uAng.value = opts.land.turn;
            flyShadow.uniforms.uB.value = Math.max(0, pos.z - (T / 2) * S); flyShadow.uniforms.uT.value = pos.z + 0.04;
            flyMeshShadow.position.set(pos.x, pos.y, 0.0006);
          }
          if (kk >= 1) {
            if (f.dir === 1) { out = f.s; flight = null; f.done?.(); }
            else {
              attachTo(f.s); f.s.p = 1; f.s.slot.position.y = D / 2 + PULL;
              if (flyMeshShadow) flyMeshShadow.visible = false;
              flight = { s: f.s, dir: -1, t: 0, start: 1, phase: 'slot', from: f.to, to: f.to };
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
