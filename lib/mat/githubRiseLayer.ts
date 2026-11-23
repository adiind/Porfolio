/**
 * The GitHub card on the mat, opened (Adi, 2026-11-22: "a 3D GitHub thing that literally has progress of this portfolio";
 * he picked "1, squares rise", then "i guess daily is better"). The prototype and its proofs are in
 * review/github-rise-2026-11-22.
 *
 * At rest nothing changes: the card is the engine's own prop. Picked, this layer takes its place (same size, same spot)
 * and the card's print makes room: the count eases up, the six tools' marks go in under it, and the year's squares take
 * the rest of the card, coming in from its far end. Every day since the first commit is a square printed on the card; each
 * day with commits stands up as a printed PLA bar in the card's own four greens, as tall as that day's commits. Three
 * toothpick flags plant into the print at December, April and November, each a small card with the home page as it looked
 * then (real screenshots, each built from that day's code). A click on the count opens the repository on GitHub.
 *
 * Sizes are the card's: 340 by 40 page pixels on the 1440 by 900 drawing, 58 by 6.8 cm on the mat. One bar a day on its
 * own square (about 5 by 4 mm), 3 mm tall and taller with the day's commits (48 mm for the busiest day); pins 2.4 mm
 * wood, 96 mm; flags 68 by 56 mm card. The play takes 1.9 s.
 *
 * Units: table units. The mat is the xy plane, z is up.
 */
import {
  BoxGeometry, BufferGeometry, CanvasTexture, ClampToEdgeWrapping, CylinderGeometry, ExtrudeGeometry, Group, InstancedBufferAttribute,
  InstancedMesh, LinearFilter, LinearMipmapLinearFilter, Matrix4, Mesh, NoColorSpace, PerspectiveCamera, PlaneGeometry, Raycaster, ShaderMaterial,
  Shape, Vector2, Vector3,
} from 'three';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';

export const GITHUB_RISE_END = 1.9;
const END = GITHUB_RISE_END;
const CLOSE_SPEED = 3;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const between = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const flow = (k: number) => { k = clamp01(k); return k * k * (3 - 2 * k); };
const glide = (k: number) => 1 - (1 - clamp01(k)) ** 3;

const CARD = { w: 340, h: 40 };
const DRAW = 8;
const PAPER = '#fbf8f0', PAPER_EDGE = '#e3d9c0', NAVY = '#18204f';
const LEVEL_COLOURS = ['rgba(24,32,79,.13)', '#7bd88f', '#40c463', '#30a14e', '#216e39'];
const SANS = "'FB Geist', Geist, system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";
const GITHUB_PATH = 'M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z';
const MM = 1 / 380;
/** The card as printed for the open state: the grid takes the card from here to the card grid's own right edge. */
const GRID = { x0: 150, x1: 324, y0: 5.5, y1: 34.5, cols: 50, rows: 7 };
const PROP_Z = 0.004, HOVER_Z = 0.45 * 0.035;
const CARD_T = 1.0 * MM;

/* ---------- shading ---------- */
const DAWN = /* glsl */ `
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}`;
const SUN = /* glsl */ `
vec3 sunOver(vec3 col, float amount) {
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  return mix(col, lit, amount);
}`;
const VERTEX = /* glsl */ `
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying vec3 vL;
void main() {
  vN = normalize(mat3(modelMatrix) * normal); vUv = uv; vL = position;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const CARD_FRAGMENT = /* glsl */ `
uniform sampler2D tMap; uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn; uniform float uCut; uniform float uOpacity; uniform float uWipe;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying vec3 vL;
${DAWN}
${SUN}
void main() {
  vec4 tex = texture2D(tMap, vUv);
  if (tex.a < uCut) discard;
  vec3 n = normalize(vN);
  vec3 col = tex.rgb * clamp(0.78 + 0.27 * dot(n, uLight), 0.55, 1.06);
  // (the opened print comes in from the card's far end, as its grid grows along it: no two prints ever show at once)
  float wipe = smoothstep(1.0 - uWipe, 1.0 - uWipe + 0.025, vUv.x);
  gl_FragColor = vec4(sunOver(col, 0.2) * dawnLight(), uOpacity * wipe * (uCut > 0.0 ? 1.0 : tex.a));
}`;
/** The card's cut edge: plain cream card. */
const EDGE_FRAGMENT = /* glsl */ `
uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying vec3 vL;
${DAWN}
${SUN}
void main() {
  vec3 n = normalize(vN);
  vec3 col = vec3(0.93, 0.905, 0.85) * clamp(0.7 + 0.35 * dot(n, uLight), 0.45, 1.05);
  gl_FragColor = vec4(sunOver(col, 0.2) * dawnLight(), 1.0);
}`;
/**
 * Printed PLA bars: matte with a broad soft sheen toward the window, the print's fine layer lines on the sides, the top's
 * edges rounded over (they catch the light), and each bar's foot in the shade of its neighbours.
 */
const BAR_VERTEX = /* glsl */ `
attribute vec3 aColor; attribute float aH;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vP; varying float vH;
void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vN = normalize(mat3(m) * normal); vC = aColor; vP = position; vH = aH;
  vec4 w = m * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BAR_FRAGMENT = /* glsl */ `
uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vP; varying float vH;
${DAWN}
${SUN}
void main() {
  vec3 n = normalize(vN);
  float k = clamp(0.7 + 0.42 * dot(n, uLight), 0.5, 1.16);
  vec3 col = vC * k;
  vec3 V = normalize(cameraPosition - vW);
  float nh = max(dot(n, normalize(uLight + V)), 0.0);
  col += pow(nh, 9.0) * 0.08 * vec3(1.0, 1.0, 0.96);
  bool top = n.z > 0.9;
  // the top's rounded-over edges: a bright rim where the edge turns toward the window, a soft darker one away from it
  float edge = min(0.5 - abs(vP.x), 0.5 - abs(vP.y));
  float rim = 1.0 - smoothstep(0.0, 0.16, edge);
  if (top) col *= 1.0 + rim * (0.16 * clamp(dot(normalize(vec2(vP.x, vP.y) + 1e-4), normalize(uLight.xy)), -0.6, 1.0));
  // layer lines round the sides (0.2 mm), and the sides' upper edge softened
  float side = top ? 0.0 : 1.0;
  float band = 0.5 + 0.5 * sin(vP.z * vH / ${(0.2 * MM).toFixed(8)} * 6.2831853);
  col *= 1.0 - side * 0.07 * smoothstep(0.3, 0.95, band);
  // the foot, in the shade of its neighbours and of the card it stands on
  float up = vP.z * vH;
  col *= mix(0.78, 1.0, smoothstep(0.0, ${(4 * MM).toFixed(8)}, up)) ;
  gl_FragColor = vec4(sunOver(col, 0.15) * dawnLight(), 1.0);
}`;
const WOOD_FRAGMENT = /* glsl */ `
uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying vec3 vL;
${DAWN}
${SUN}
void main() {
  vec3 n = normalize(vN);
  float grain = 0.5 + 0.5 * sin(vL.z * 2400.0 + sin(vL.z * 300.0) * 2.0);
  vec3 base = mix(vec3(0.78, 0.62, 0.42), vec3(0.86, 0.72, 0.52), grain);
  vec3 col = base * clamp(0.66 + 0.4 * dot(n, uLight), 0.4, 1.1);
  gl_FragColor = vec4(sunOver(col, 0.18) * dawnLight(), 1.0);
}`;
const FLAG_FRAGMENT = /* glsl */ `
uniform sampler2D tMap; uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn;
varying vec3 vN; varying vec2 vUv; varying vec3 vW; varying vec3 vL;
${DAWN}
${SUN}
void main() {
  vec3 n = normalize(vN);
  vec3 base = texture2D(tMap, vUv).rgb;
  if (!gl_FrontFacing) { n = -n; base = vec3(0.95, 0.93, 0.88); }
  vec3 col = base * clamp(0.8 + 0.26 * dot(n, uLight), 0.6, 1.06);
  gl_FragColor = vec4(sunOver(col, 0.2) * dawnLight(), 1.0);
}`;
const SHADOW_VERTEX = /* glsl */ `
varying vec2 vL;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vL = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`;
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
  float d0 = caster(vL);
  float contact = (1.0 - smoothstep(0.0, 0.006 + uT * 0.06, d0)) * step(-0.002, d0) * clamp(1.0 - uB / 0.03, 0.0, 1.0);
  float dark = 1.0 - (1.0 - sweep * 0.55) * (1.0 - contact * 0.45);
  dark *= uStrength * clamp(1.0 - uB * 1.6, 0.2, 1.0);
  if (dark < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark);
}`;
const LIGHT = new Vector3(0.35, 0.45, 0.9).normalize();
const SHADOW_DIR = new Vector2(-0.55, -0.7);

/* ---------- data and drawing ---------- */
export interface GithubRiseData {
  /** Commits per day, seven days to a column, ending today (as the card's own grid counts them). */
  days: number[];
  /** How many days of `days` come before the first commit. */
  first: number;
  commits: number;
  flags: Array<{ day: number; word: string; picture: HTMLImageElement }>;
  href: string;
}
const levelOf = (n: number, max: number) => (n <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((n / max) * 4))));
/** Where a day's square is on the card, in page pixels. */
const cellOf = (j: number) => {
  const col = Math.floor(j / 7), row = j % 7;
  const px = (GRID.x1 - GRID.x0) / GRID.cols, py = (GRID.y1 - GRID.y0) / GRID.rows;
  const sx = px * 0.88, sy = py * 0.86;
  return { x: GRID.x0 + col * px + (px - sx) / 2, y: GRID.y0 + row * py + (py - sy) / 2, size: sx, depth: sy };
};

/**
 * The card as the stage draws it (lib/mat/matPieces.ts drawGithubSticker, its very steps), with its count and its tools'
 * marks left out when asked (they are then drawn on their own, so they can move as the print makes room) and, for the
 * opened card, the whole year's squares in place of the 12 weeks'.
 */
function drawCard(opts: { count: boolean; marks: boolean; year: GithubRiseData | null; commits: number; marksImage: HTMLImageElement | null; levels: string }): HTMLCanvasElement {
  const { w, h } = CARD;
  const c = document.createElement('canvas'); c.width = w * DRAW; c.height = h * DRAW;
  const g = c.getContext('2d')!; g.scale(DRAW, DRAW);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.clip();
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h);
  const light = g.createLinearGradient(w, 0, 0, h);
  light.addColorStop(0, 'rgba(255,255,255,.35)'); light.addColorStop(1, 'rgba(120,100,60,.06)');
  g.fillStyle = light; g.fillRect(0, 0, w, h);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < w * h * 0.06; i += 1) { g.fillStyle = rnd() < 0.5 ? 'rgba(120,100,60,.05)' : 'rgba(255,255,255,.18)'; g.fillRect(rnd() * w, rnd() * h, 0.5, 0.5); }
  const rim = g.createLinearGradient(w - 26, 0, w, 0);
  rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(255,255,255,.75)');
  g.fillStyle = rim; g.fillRect(w - 26, 0, 26, h);
  g.restore();
  g.strokeStyle = PAPER_EDGE; g.lineWidth = 1; g.beginPath(); g.roundRect(0.5, 0.5, w - 1, h - 1, h / 2 - 0.5); g.stroke();
  const ink = inkPlaces(g, opts.commits);
  if (opts.count) drawCount(g, opts.commits, 0);
  const rule = (x: number) => { g.fillStyle = 'rgba(24,32,79,.16)'; g.fillRect(Math.round(x), h / 2 - 8, 1, 16); };
  rule(ink.rule1);
  if (opts.marks && opts.marksImage) for (let i = 0; i < 6; i++) g.drawImage(opts.marksImage, i * 64, 0, 64, 64, ink.marksX + i * 20, h / 2 - 8, 16, 16);
  if (!opts.year) {
    rule(ink.rule2);
    const cell = 3.05; const gap = 0.8;
    const gx = w - 16 - 12 * (cell + gap); const gy = h / 2 - (7 * (cell + gap) - gap) / 2;
    opts.levels.split('').forEach((level, i) => {
      g.fillStyle = LEVEL_COLOURS[Number(level)];
      g.beginPath(); g.roundRect(gx + Math.floor(i / 7) * (cell + gap), gy + (i % 7) * (cell + gap), cell, cell, 0.8); g.fill();
    });
  } else {
    const max = Math.max(1, ...opts.year.days);
    opts.year.days.forEach((n, j) => {
      if (j < opts.year!.first) return;
      const cell = cellOf(j);
      g.fillStyle = LEVEL_COLOURS[levelOf(n, max)];
      g.beginPath(); g.roundRect(cell.x, cell.y, cell.size, cell.depth, 0.6); g.fill();
    });
  }
  return c;
}
/** Where the card's ink sits (as drawGithubSticker measures it). */
function inkPlaces(g: CanvasRenderingContext2D, commits: number) {
  g.font = `800 16px ${DISPLAY}`; const cw = g.measureText(String(commits)).width;
  g.font = `500 13px ${SANS}`; const textEnd = 39 + cw + 4 + g.measureText('commits').width;
  return { rule1: textEnd + 11, marksX: textEnd + 23, rule2: textEnd + 23 + 6 * 20 - 4 + 11 };
}
/** The octocat and the count, `up` page pixels above where the card has them. */
function drawCount(g: CanvasRenderingContext2D, commits: number, up: number) {
  const h = CARD.h;
  g.save(); g.translate(13, h / 2 - 9 - up); g.scale(18 / 24, 18 / 24); g.fillStyle = NAVY; g.fill(new Path2D(GITHUB_PATH)); g.restore();
  g.font = `800 16px ${DISPLAY}`; g.fillStyle = NAVY; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText(String(commits), 39, h / 2 + 5.6 - up);
  const cw = g.measureText(String(commits)).width;
  g.font = `500 13px ${SANS}`; g.fillText('commits', 39 + cw + 4, h / 2 + 5 - up);
}
/** One piece of the card's ink on its own (transparent around it), the card's size: drawn by `draw`. */
function drawInk(draw: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = CARD.w * DRAW; c.height = CARD.h * DRAW;
  const g = c.getContext('2d')!; g.scale(DRAW, DRAW); draw(g); return c;
}

/** The bars' shadows on the card, drawn as the window throws them (soft, swept from each foot away from the light). */
function drawBarShadows(bars: Array<{ x: number; y: number; size: number; depth: number; h: number }>, unitsPerPx: number, turn: number): HTMLCanvasElement {
  const { w, h } = CARD; const S = DRAW;
  const c = document.createElement('canvas'); c.width = w * S; c.height = h * S;
  const g = c.getContext('2d')!; g.scale(S, S);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.clip();
  const c0 = Math.cos(-turn), s0 = Math.sin(-turn);
  const dir = { x: SHADOW_DIR.x * c0 - SHADOW_DIR.y * s0, y: SHADOW_DIR.x * s0 + SHADOW_DIR.y * c0 };
  g.filter = 'blur(1.1px)'; g.fillStyle = 'rgba(10,20,60,0.32)';
  bars.forEach((bar) => {
    const lift = bar.h / unitsPerPx; // page pixels
    const ox = dir.x * lift, oy = -dir.y * lift;
    const pts = [[bar.x, bar.y], [bar.x + bar.size, bar.y], [bar.x + bar.size, bar.y + bar.depth], [bar.x, bar.y + bar.depth]];
    const all = [...pts, ...pts.map(([a, b]) => [a + ox, b + oy])].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: number[][] = []; for (const p of all) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    const upper: number[][] = []; for (const p of all.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    g.beginPath(); hull.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill();
  });
  g.restore();
  return c;
}

/** A flag: cream card, the home page's picture printed into it, a big month word in navy under it; then light and shade. */
function drawFlag(picture: HTMLImageElement, word: string, seed: number): HTMLCanvasElement {
  const W = 660, H = 540;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '120,110,95' : '255,255,250'},${0.03 + rnd() * 0.03})`; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1); }
  const px = 34, pw = W - 68, ph = pw / 1.6;
  g.save(); g.globalCompositeOperation = 'multiply'; g.filter = 'saturate(0.92) contrast(0.96)';
  g.drawImage(picture, 0, 0, picture.naturalWidth, picture.naturalWidth / 1.6, px, px, pw, ph); g.restore();
  g.fillStyle = NAVY; g.textAlign = 'center'; g.font = `800 92px ${DISPLAY}`; g.fillText(word, W / 2, px + ph + 104);
  const shade = g.createLinearGradient(0, 0, W, H);
  shade.addColorStop(0, 'rgba(255,255,255,0.06)'); shade.addColorStop(1, 'rgba(50,40,30,0.08)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);
  return c;
}

/* ---------- the layer ---------- */
export interface GithubRiseLayer extends MatLayer {
  arrive(): void;
  leave(): void;
  pose(t: number): void;
  /** Once up and still: the address under this screen point, if any (the card's octocat and count). */
  linkAt(clientX: number, clientY: number): string | null;
}

export function createGithubRiseLayer(opts: {
  card: { image: HTMLCanvasElement; x: number; y: number; w: number; h: number; turn: number };
  data: GithubRiseData; marks: HTMLImageElement | null; canvas: HTMLCanvasElement; reduced: boolean;
  /** The card's own 12-week grid (GITHUB.levels), as its picture has it. */
  levels: string;
  swap(mine: boolean): void;
}): GithubRiseLayer {
  let ctx: MatLayerContext | null = null;
  let root: Group | null = null;
  const extras: Mesh[] = [];
  const disposables: Array<{ dispose(): void }> = [];
  let clock = 0, target = 0, mine = false;
  let pose: ((t: number) => void) | null = null;
  let lastCamera: PerspectiveCamera | null = null;
  let cardMesh: Mesh | null = null;
  const turn = (-opts.card.turn * Math.PI) / 180;
  const W = opts.card.w, H = opts.card.h;
  const unit = W / CARD.w; // table units per page pixel
  /** Page pixels on the card to the card's own frame (its middle at 0, x right, y up). */
  const local = (x: number, y: number) => ({ x: (x - CARD.w / 2) * unit, y: (CARD.h / 2 - y) * unit });
  const FRAME = { x: 0.0, y: 0.075, w: W * 1.14, h: 0.36, pitch: 0.72 };
  const eye = new PerspectiveCamera();
  const aim = (camera: PerspectiveCamera) => {
    const tanH = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const dist = (1 - 0.03 * flow(between(clock, 0.3, END))) * Math.max((FRAME.h * Math.cos(FRAME.pitch) * 1.04) / (2 * tanH), (FRAME.w * 1.02) / (2 * tanH * camera.aspect));
    const cx = opts.card.x + FRAME.x * Math.cos(turn) - FRAME.y * Math.sin(turn), cy = opts.card.y + FRAME.x * Math.sin(turn) + FRAME.y * Math.cos(turn);
    eye.position.set(cx, cy - dist * Math.sin(FRAME.pitch), dist * Math.cos(FRAME.pitch));
    eye.up.set(0, 1, 0); eye.lookAt(cx, cy, 0);
    const follow = glide(between(clock, 0, 0.7));
    camera.position.lerp(eye.position, follow); camera.quaternion.slerp(eye.quaternion, follow); camera.updateMatrixWorld(true);
  };

  function build(c: MatLayerContext) {
    const texture = (canvas: HTMLCanvasElement) => {
      const t = new CanvasTexture(canvas);
      t.colorSpace = NoColorSpace; t.wrapS = t.wrapT = ClampToEdgeWrapping; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter;
      t.anisotropy = c.maxAnisotropy; t.generateMipmaps = true; disposables.push(t); return t;
    };
    const shared = { uLight: { value: LIGHT }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uDawn: c.dawn };
    const mat = (fragmentShader: string, uniforms: Record<string, { value: unknown }>, extra: Partial<ConstructorParameters<typeof ShaderMaterial>[0]> = {}, vertexShader = VERTEX) => {
      const m = new ShaderMaterial({ vertexShader, fragmentShader, transparent: true, depthTest: true, depthWrite: true, uniforms: { ...shared, ...uniforms }, ...extra });
      disposables.push(m); return m;
    };
    const solid = (geo: BufferGeometry, m: ShaderMaterial, order = 40) => { disposables.push(geo); const mesh = new Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = order; return mesh; };

    root = new Group(); root.position.set(opts.card.x, opts.card.y, PROP_Z); root.rotation.z = turn; root.visible = false;
    // the card: its cut edge (the pill, a millimetre of card) and its print on top
    const pill = new Shape(); pill.moveTo(-W / 2 + H / 2, -H / 2); pill.lineTo(W / 2 - H / 2, -H / 2); pill.absarc(W / 2 - H / 2, 0, H / 2, -Math.PI / 2, Math.PI / 2, false);
    pill.lineTo(-W / 2 + H / 2, H / 2); pill.absarc(-W / 2 + H / 2, 0, H / 2, Math.PI / 2, Math.PI * 1.5, false);
    const edge = solid(new ExtrudeGeometry(pill, { depth: CARD_T, bevelEnabled: false, curveSegments: 24 }), mat(EDGE_FRAGMENT, {}));
    edge.position.z = -CARD_T; root.add(edge);
    // (the rest picture and the opened print: the first as it was picked, the opened one coming in over it)
    // (the card as the stage drew it, without its count and marks: those are drawn on their own, over it, to move)
    const restMat = mat(CARD_FRAGMENT, { tMap: { value: texture(drawCard({ count: false, marks: false, year: null, commits: opts.data.commits, marksImage: opts.marks, levels: opts.levels })) }, uCut: { value: 0.5 }, uOpacity: { value: 1 }, uWipe: { value: 2 } });
    const rest = solid(new PlaneGeometry(W, H), restMat, 41); rest.position.z = 0.00002; root.add(rest);
    // the opened card's print: the whole year's squares, coming in from the far end
    const openMat = mat(CARD_FRAGMENT, { tMap: { value: texture(drawCard({ count: false, marks: false, year: opts.data, commits: opts.data.commits, marksImage: opts.marks, levels: opts.levels })) }, uCut: { value: 0 }, uOpacity: { value: 1 }, uWipe: { value: 0 } }, { depthWrite: false });
    const open = solid(new PlaneGeometry(W, H), openMat, 42); open.position.z = 0.00004; root.add(open);
    cardMesh = open;
    // the count and the tools' marks, the very ink of the card: the count eases up, the marks go in under it
    const probeCanvas = document.createElement('canvas').getContext('2d')!;
    const ink = inkPlaces(probeCanvas, opts.data.commits);
    const inkMat = (canvas: HTMLCanvasElement) => mat(CARD_FRAGMENT, { tMap: { value: texture(canvas) }, uCut: { value: 0 }, uOpacity: { value: 1 }, uWipe: { value: 2 } }, { depthWrite: false });
    const countMesh = solid(new PlaneGeometry(W, H), inkMat(drawInk((g) => drawCount(g, opts.data.commits, 0))), 45); countMesh.position.z = 0.00008; root.add(countMesh);
    const marksMesh = solid(new PlaneGeometry(W, H), inkMat(drawInk((g) => { if (opts.marks) for (let i = 0; i < 6; i++) g.drawImage(opts.marks, i * 64, 0, 64, 64, ink.marksX + i * 20, CARD.h / 2 - 8, 16, 16); })), 45);
    marksMesh.position.z = 0.00008; root.add(marksMesh);
    // (where the marks go: their row's left end under the count's, 12 page pixels high, a line under it)
    const MARKS_TO = { x: 39, y: CARD.h / 2 + 10, scale: 12 / 16 };
    const COUNT_UP = 5.5;

    // the bars: one for each day (Adi, after weekly: "i guess daily is better"), a printed block standing on that day's own
    // square, as tall as the day's commits, in the same green as the square under it
    const dayMax = Math.max(1, ...opts.data.days);
    const bars: Array<{ j: number; x: number; y: number; size: number; depth: number; h: number; color: string }> = [];
    opts.data.days.forEach((n, j) => {
      if (n <= 0 || j < opts.data.first) return;
      bars.push({ j, ...cellOf(j), h: (3 + 45 * (n / dayMax)) * MM, color: LEVEL_COLOURS[levelOf(n, dayMax)] });
    });
    const shadowsMat = mat(CARD_FRAGMENT, { tMap: { value: texture(drawBarShadows(bars, unit, turn)) }, uCut: { value: 0 }, uOpacity: { value: 0 }, uWipe: { value: 2 } }, { depthWrite: false });
    // (a shadow is light taken away: drawn as a dark film, multiplied over the print by its own alpha)
    shadowsMat.fragmentShader = shadowsMat.fragmentShader.replace('gl_FragColor = vec4(sunOver(col, 0.2) * dawnLight(), uOpacity * (uCut > 0.0 ? 1.0 : tex.a));', 'gl_FragColor = vec4(tex.rgb, uOpacity * tex.a);');
    const shadows = solid(new PlaneGeometry(W, H), shadowsMat, 43); shadows.position.z = 0.00006; root.add(shadows);

    const barGeo = new BoxGeometry(1, 1, 1); barGeo.translate(0, 0, 0.5); disposables.push(barGeo);
    const barMat = mat(BAR_FRAGMENT, {}, {}, BAR_VERTEX);
    const inst = new InstancedMesh(barGeo, barMat, bars.length); inst.frustumCulled = false; inst.renderOrder = 44;
    const colors = new Float32Array(bars.length * 3), heights = new Float32Array(bars.length);
    bars.forEach((bar, i) => {
      const hex = parseInt(bar.color.slice(1), 16);
      colors.set([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255], i * 3);
      heights[i] = bar.h;
    });
    barGeo.setAttribute('aColor', new InstancedBufferAttribute(colors, 3));
    barGeo.setAttribute('aH', new InstancedBufferAttribute(heights, 1));
    root.add(inst);

    // the flags: a wooden pin in the print's back row at its month, a card on its top facing the front
    const woodMat = mat(WOOD_FRAGMENT, {});
    const flagParts: Array<{ hinge: Group; order: number }> = [];
    const hingeHome: Array<{ y: number }> = [];
    opts.data.flags.forEach((flag, k) => {
      const cell = cellOf(Math.floor(flag.day / 7) * 7);
      const at = local(cell.x + cell.size / 2, cell.y + cell.depth / 2);
      const hinge = new Group(); hinge.position.set(at.x, at.y, 0); hingeHome.push({ y: at.y });
      const pinGeo = new CylinderGeometry(1.2 * MM, 1.2 * MM, 96 * MM, 10); pinGeo.rotateX(Math.PI / 2); pinGeo.translate(0, 0, 48 * MM);
      hinge.add(solid(pinGeo, woodMat));
      const card = solid(new PlaneGeometry(68 * MM, 56 * MM), mat(FLAG_FRAGMENT, { tMap: { value: texture(drawFlag(flag.picture, flag.word, 900 + k)) } }, { side: 2 }));
      card.rotation.x = Math.PI / 2; card.position.set(0, -1.4 * MM, (96 - 28) * MM);
      hinge.add(card); root!.add(hinge);
      flagParts.push({ hinge, order: k });
    });
    c.scene.add(root);

    // the card's shadow on the mat: its own shape (a pill), and as high as what stands on it
    const geo = new PlaneGeometry(2.4, 2.4); disposables.push(geo);
    const smat = new ShaderMaterial({
      vertexShader: SHADOW_VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uC: { value: new Vector2(opts.card.x, opts.card.y) }, uAng: { value: turn }, uHalf: { value: new Vector2(W / 2, H / 2) }, uR: { value: H / 2 }, uB: { value: 0 }, uT: { value: 0.003 }, uDir: { value: SHADOW_DIR }, uStrength: { value: 0.85 }, uDawn: c.dawn, uScreen: { value: c.screenSize } },
    });
    disposables.push(smat);
    const shadowMesh = new Mesh(geo, smat); shadowMesh.frustumCulled = false; shadowMesh.renderOrder = 1.7; shadowMesh.visible = false;
    shadowMesh.position.set(opts.card.x, opts.card.y, 0.0006);
    c.scene.add(shadowMesh); extras.push(shadowMesh);

    const m4 = new Matrix4();
    const cols = GRID.cols;
    // where each flag comes from: above the shot and a little behind, leaning back, so it travels down in an arc and its pin
    // goes into its block's top (never through anything on the way)
    const FLAG_FROM = { y: 0.06, z: 0.26, lean: -0.7 };
    pose = (t: number) => {
      // the card lifts a hair as it is picked and is laid down again
      const held = glide(between(t, 0, 0.18)) * (1 - glide(between(t, 0.3, 0.8)));
      root!.position.z = PROP_Z + HOVER_Z * (1 - glide(between(t, 0.25, 0.8))) + 0.006 * held;
      // its print makes room, from the far end, ahead of the blocks
      openMat.uniforms.uWipe.value = 1.05 * glide(between(t, 0.04, 0.5));
      // the count eases up and the marks go in under it, with the grid's coming (their own ink, never two at once)
      const make = glide(between(t, 0.06, 0.5));
      countMesh.position.y = COUNT_UP * unit * make;
      // (a mark row's left end, in page pixels: from where the card has it to under the count; scaled about its left middle)
      const sc = 1 + (MARKS_TO.scale - 1) * make;
      const fromX = ink.marksX, fromY = CARD.h / 2;
      const toX = MARKS_TO.x, toY = MARKS_TO.y;
      const nowX = fromX + (toX - fromX) * make, nowY = fromY + (toY - fromY) * make;
      // the decal is the whole card's size: scale it about the card's middle, then move so the row's left middle lands at (nowX, nowY)
      marksMesh.scale.set(sc, sc, 1);
      const ax = (fromX - CARD.w / 2) * sc, ay = (CARD.h / 2 - fromY) * sc;
      marksMesh.position.x = (nowX - CARD.w / 2) * unit - ax * unit;
      marksMesh.position.y = (CARD.h / 2 - nowY) * unit - ay * unit;
      // the blocks rise out of their squares: the card's own grid first (the far end), then back through the year; several at
      // once, each quick, settling on a long soft tail
      // (Adi, 2026-11-22: "need better wave like animation", then "B, swell"): once the camera is down, a swell rolls along
      // the print from its far end on a slanted front (the back row a beat behind the front); each day lifts a little past
      // its height on the crest (14 mm, whatever its own height) and settles back on a long soft tail, one smooth hump
      bars.forEach((bar, i) => {
        const col = Math.floor(bar.j / 7), row = bar.j % 7;
        const p = (cols - 1 - col + row * 0.6) / (cols - 1 + 6 * 0.6);
        const from = 0.28 + p * 0.95;
        const u = between(t, from, from + 0.6);
        const height = bar.h * glide(u) + 14 * MM * Math.sin(Math.PI * u) * (1 - u) * 1.9;
        const at = local(bar.x + bar.size / 2, bar.y + bar.depth / 2);
        m4.makeScale(bar.size * unit, bar.depth * unit, Math.max(1e-5, height)).setPosition(at.x, at.y, 0);
        inst.setMatrixAt(i, m4);
      });
      inst.instanceMatrix.needsUpdate = true;
      shadowsMat.uniforms.uOpacity.value = glide(between(t, 0.2, 1.25));
      // the flags arrive already moving, one a beat after another, and plant
      flagParts.forEach(({ hinge, order }) => {
        const k = glide(between(t, 0.7 + order * 0.13, 0.7 + order * 0.13 + 0.7));
        hinge.visible = k > 0.0005;
        hinge.position.z = FLAG_FROM.z * (1 - k) + 0.02 * Math.sin(Math.PI * k) * (1 - k);
        hinge.position.y = hingeHome[order].y + FLAG_FROM.y * (1 - k);
        hinge.rotation.x = -0.18 + FLAG_FROM.lean * (1 - k);
      });
      smat.uniforms.uT.value = 0.003 + 0.016 * glide(between(t, 0.2, 1.3));
      c.invalidate();
    };
    pose(0);
  }

  const show = (on: boolean) => {
    if (on === mine || !root) return;
    mine = on; root.visible = on; extras.forEach((m) => { m.visible = on; }); opts.swap(on); ctx?.invalidate();
  };
  const ray = new Raycaster();

  return {
    attach(c) { ctx = c; build(c); },
    update(dt, camera) {
      lastCamera = camera;
      if (!pose) return false;
      if (clock !== target) {
        clock = target > clock ? Math.min(target, clock + dt) : Math.max(target, clock - dt * CLOSE_SPEED);
        pose(clock);
        if (clock === 0 && target === 0) show(false);
      }
      if (clock > 0) aim(camera);
      return clock !== target;
    },
    arrive() { show(true); target = END; if (opts.reduced) { clock = END; pose?.(clock); } ctx?.invalidate(); },
    leave() { target = 0; if (opts.reduced) { clock = 0; pose?.(clock); show(false); } ctx?.invalidate(); },
    pose(t) { show(t > 0); clock = target = Math.max(0, Math.min(END, t)); pose?.(clock); ctx?.invalidate(); },
    linkAt(clientX, clientY) {
      if (!lastCamera || !cardMesh || clock !== END || target !== END) return null;
      const r = opts.canvas.getBoundingClientRect();
      ray.setFromCamera(new Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), lastCamera);
      const hit = ray.intersectObject(cardMesh, false)[0];
      return hit?.uv && hit.uv.x < (GRID.x0 - 10) / CARD.w ? opts.data.href : null;
    },
    dispose() {
      if (ctx && root) ctx.scene.remove(root);
      extras.forEach((m) => ctx?.scene.remove(m));
      disposables.forEach((d) => d.dispose()); disposables.length = 0; root = null; pose = null; ctx = null;
    },
  };
}
