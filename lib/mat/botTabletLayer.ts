/**
 * Bot on the home mat, built as a real thing standing on it: a thin dark tablet with a cream screen and two eyes, leaning
 * back against a birch-ply wedge behind a low front lip. A MatLayer for the flip-book engine, like the Snapdeal bag
 * (lib/mat/snapdeal/mailerLayer.ts): it shares the engine's camera, window light and opening light.
 *
 * Adi, 2026-11-27, after a first 3D build and then a flat cut-out of the picture: "keep it 3D, but look at how the wood
 * looks and the tablet's stand, use that better". So the stand's shape is measured off his pick (design 17) and its wood
 * IS that picture's wood: the lip's front, the wedge's cut end and the tablet's face are flattened patches of it
 * (public/images/mat/bot/, cut by the method in botTabletArt.ts), each laid on the face it came from, and the ply's
 * stripes are its stripes. Those patches carry the picture's own light, so the wood is not shaded a second time: only the
 * window light and the opening's light are laid over it.
 *
 * The mat's camera looks almost straight down, and from there an upright tablet is only its top edge. So the whole thing is
 * posed for that camera (PITCH, TILT, ROLL, TURN) to be seen as in the picture: from the front left, 42 degrees up.
 *
 * The stage keeps an empty click target where it stands (BOT_TABLET in botTablet.ts); the layer fades with the engine's own
 * fade for that target, so it goes when another close-up sinks the mat.
 *
 * Units: the engine's table units. The mat is the xy plane, z is up, and -y is toward the viewer.
 */
import { BufferGeometry, CanvasTexture, ExtrudeGeometry, Float32BufferAttribute, Group, LinearFilter, LinearMipmapLinearFilter, Matrix4, Mesh, NoColorSpace, PlaneGeometry, RepeatWrapping, ShaderMaterial, Shape, ShapeGeometry, ShapeUtils, Texture, Vector2, Vector3 } from 'three';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';
import { BOT_PICTURES, END_BOX, PLY_MEAN, drawPly } from './botTabletArt';

/* the engine's own shading, as the Snapdeal bag copies it */
const DAWN = /* glsl */ `
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}`;

const SOLID_VERTEX = /* glsl */ `
attribute float aShade;
varying vec3 vLN; varying vec2 vUv; varying float vShade;
void main() {
  vUv = uv; vLN = normal; vShade = aShade;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;
/**
 * Matte, never glossy. uMode 0 is a flat colour under a soft light from the upper right front (the tablet's body);
 * 1 is a patch of the picture, which has its light in it already and is only dimmed by `aShade` where a face is in shade
 * (uFine: the ply's layers, which fade to their one colour when they are too fine to draw).
 */
const SOLID_FRAGMENT = /* glsl */ `
uniform vec3 uColor; uniform sampler2D tMap; uniform float uMode; uniform float uFine;
uniform vec3 uLight; uniform sampler2D tSun; uniform vec2 uScreen; uniform float uDawn; uniform float uAlpha;
varying vec3 vLN; varying vec2 vUv; varying float vShade;
${DAWN}
void main() {
  vec3 col;
  if (uMode > 0.5) {
    col = texture2D(tMap, vUv).rgb;
    // the ply's layers, where they are finer than the screen can draw, are their one tan (not a moire)
    if (uFine > 0.5) col = mix(col, uColor, smoothstep(0.12, 0.25, fwidth(vUv.y)));
    col *= vShade;
  }
  else col = uColor * clamp(0.8 + 0.3 * dot(normalize(vLN), uLight), 0.5, 1.1);
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.16);
  gl_FragColor = vec4(col * dawnLight(), uAlpha);
}`;

const SHADOW_VERTEX = /* glsl */ `
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
/**
 * One part's shadow, painted on the plane the stand's foot is on (so it stays joined to the foot): its footprint swept
 * from its foot to its top along the light, softer and fainter with height, and shifted with height by `uLean` (the tablet
 * leans back, so its upper edge is further back than its foot). Navy, not grey: the mat's own blue in shade.
 */
const SHADOW_FRAGMENT = /* glsl */ `
uniform vec2 uC; uniform vec2 uHalf; uniform float uR; uniform float uB; uniform float uT; uniform vec2 uDir; uniform vec2 uLean; uniform vec2 uTaper;
uniform float uStrength; uniform float uSoft; uniform float uAlpha; uniform float uDawn; uniform vec2 uScreen;
varying vec2 vP;
${DAWN}
float roundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  float sweep = 0.0;
  for (int i = 0; i < 28; i++) {
    float t = float(i) / 27.0;
    float h = mix(uB, uT, t);
    float blur = uSoft * (0.02 + 0.6 * t);
    float d = roundBox(vP - uDir * h - uC - uLean * h, uHalf - uTaper * t, uR);
    sweep = max(sweep, (1.0 - smoothstep(-blur, blur, d)) * mix(1.0, 0.55, t));
  }
  float dark = sweep * uStrength;
  if (dark * uAlpha < 0.003) discard;
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark * uAlpha);
}`;

const LIGHT = new Vector3(0.45, -0.35, 0.82).normalize();
const hex = (h: string) => new Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const DEG = Math.PI / 180;
/**
 * The pose, fitted to the picture by its three edges on the screen (the stand's length rises 23 degrees to the right, its
 * depth runs up to the left at 133 degrees, its upright edges stand upright): tipped back toward the camera, leaned and
 * rolled a little because it stands up and right of the camera's middle, and turned on its foot.
 */
const PITCH = 28 * DEG, TILT = -5 * DEG, ROLL = 7.5 * DEG, TURN = 20 * DEG;
/** the tablet's lean from upright, which is the wedge's slope (24 degrees in the picture) */
const LEAN = 24.2 * DEG;

type P2 = readonly [number, number];
function roundedRect(w: number, h: number, r: number, y0 = 0): Shape {
  const s = new Shape(), x0 = -w / 2, x1 = w / 2, y1 = y0 + h;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false); s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false); s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image(); image.decoding = 'async';
  image.onload = () => resolve(image); image.onerror = () => reject(new Error(`picture not loaded: ${src}`));
  image.src = src;
});

export interface BotTabletLayer extends MatLayer { readonly ready: Promise<void> }

/**
 * `x`, `y`: where the stand's middle is set down on the mat; `w`: the stand's length; `target`: the stage's click-target
 * picture, whose engine fade the layer follows.
 */
export function createBotTabletLayer(opts: { x: number; y: number; w: number; target?: HTMLCanvasElement }): BotTabletLayer {
  let ctx: MatLayerContext | null = null;
  let group: Group | null = null;
  const parts: Array<{ dispose(): void }> = [];
  const shown = { value: 1 };
  let targetMesh: Mesh | null = null;
  const findTarget = () => {
    if (!ctx || !opts.target) return;
    targetMesh = null;
    ctx.scene.traverse((o) => {
      const m = (o as Mesh).material as ShaderMaterial | undefined;
      if (m?.uniforms?.tMap?.value?.image !== opts.target || !m.uniforms.uAlpha || !m.uniforms.uSize) return;
      // (the engine also paints the empty target a box's shadow; the thing casts its own, so that one is not drawn)
      if (m.uniforms.uSheet) m.visible = false; else targetMesh = o as Mesh;
    });
  };

  // sizes, as shares of the stand's length, measured off the picture (botTabletArt.ts has how)
  const W = opts.w;
  const lipT = W * 0.055, lipH = W * 0.22, lipR = W * 0.034;     // the front lip: a board on its edge, its corners rounded
  const Wt = W * 0.95, Ht = Wt * 0.8, T = W * 0.044;             // the tablet: width, height, thickness
  const zs = W * 0.19;                                           // the ledge the tablet stands on, just under the lip's top
  // the wedge's cut end, from its back foot over its rounded ridge and down its slope: (depth from the back, height)
  const END: P2[] = [[0.005, 0], [0.103, 0.455], [0.118, 0.51], [0.15, 0.548], [0.19, 0.578], [0.215, 0.592], [0.232, 0.59], [0.411, 0.19]];
  const slopeFoot = END[END.length - 1][0] * W;
  const lipBack = slopeFoot + (T / Math.cos(LEAN)) + W * 0.003;  // (depth from the back) the lip's back face, the tablet's foot between it and the slope
  const D = lipBack + lipT;
  const Y = (fromBack: number) => D / 2 - fromBack;              // depth from the back, as the stand's own y (front is -D/2)

  function build(c: MatLayerContext, pictures: HTMLImageElement[]) {
    const shared = { uLight: { value: LIGHT }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize }, uDawn: c.dawn, uAlpha: shown };
    const mat = (u: Record<string, { value: unknown }>) => {
      const m = new ShaderMaterial({
        vertexShader: SOLID_VERTEX, fragmentShader: SOLID_FRAGMENT, transparent: true, depthTest: true, depthWrite: true,
        uniforms: { uColor: { value: hex('#4a586c') }, tMap: { value: null }, uMode: { value: 0 }, uFine: { value: 0 }, ...shared, ...u },
      });
      parts.push(m); return m;
    };
    const picture = (image: HTMLImageElement | HTMLCanvasElement, repeat = false) => {
      const t = image instanceof HTMLCanvasElement ? new CanvasTexture(image) : new Texture(image);
      t.colorSpace = NoColorSpace; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter; t.anisotropy = c.maxAnisotropy; t.needsUpdate = true;
      if (repeat) { t.wrapS = RepeatWrapping; t.wrapT = RepeatWrapping; }
      parts.push(t); return t;
    };
    const [faceT, lipTx, endT] = pictures.map((p) => picture(p));
    const plyT = picture(drawPly(), true); plyT.anisotropy = 1;
    /** a mesh from loose triangles: each vertex is x, y, z, u, v, shade */
    const solid = (verts: number[][], m: ShaderMaterial) => {
      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(verts.flatMap((v) => v.slice(0, 3)), 3));
      geo.setAttribute('uv', new Float32BufferAttribute(verts.flatMap((v) => v.slice(3, 5)), 2));
      geo.setAttribute('aShade', new Float32BufferAttribute(verts.map((v) => v[5]), 1));
      geo.computeVertexNormals();
      return add(geo, m);
    };
    const add = (geo: BufferGeometry, m: ShaderMaterial) => {
      if (!geo.getAttribute('aShade')) geo.setAttribute('aShade', new Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count).fill(1), 1));
      parts.push(geo); const mesh = new Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 40; stand.add(mesh); return mesh;
    };
    const quad = (a: number[], b: number[], cc: number[], d: number[]) => [a, b, cc, a, cc, d];

    // the pose: `group` tips the whole thing back toward the camera, `stand` turns it on its foot
    group = new Group(); group.rotation.set(-PITCH, TILT, ROLL, 'ZYX');
    const stand = new Group(); stand.rotation.z = TURN; group.add(stand);

    // ── the wedge's two cut ends: the picture's own end, laid on its outline
    const outline: P2[] = [...END.map(([d, z]) => [d * W, z * W] as P2), [lipBack, zs], [lipBack, 0]];
    const tris = ShapeUtils.triangulateShape(outline.map(([d, z]) => new Vector2(d, z)), []);
    // (past the slope's foot the picture has the lip in it: the end's last strip repeats the wood just before it)
    const endUv = ([d, z]: P2) => [(Math.min(d / W, 0.412) - END_BOX.d0) / END_BOX.d, (z / W - END_BOX.z0) / END_BOX.z];
    const ends: number[][] = [];
    for (const side of [-1, 1]) for (const t of tris) for (const i of t) ends.push([(side * W) / 2, Y(outline[i][0]), outline[i][1], ...endUv(outline[i]), side < 0 ? 1 : 0.8]);
    const endMat = mat({ uMode: { value: 1 }, tMap: { value: endT } }); endMat.side = 2;
    solid(ends, endMat);
    // its long faces, between the ends: the ply's layers lie along them (they only show as a sliver over the ridge)
    const plyMat = mat({ uMode: { value: 1 }, uFine: { value: 1 }, uColor: { value: hex(PLY_MEAN) }, tMap: { value: plyT } }); plyMat.side = 2;
    const long: number[][] = [];
    for (let i = 0; i < outline.length - 1; i++) {
      const [d0, z0] = outline[i], [d1, z1] = outline[i + 1];
      const shade = i === END.length - 1 ? 0.35 : i < 2 ? 0.6 : 0.85;   // the ledge is in the tablet's shade, the back faces away
      long.push(...quad([-W / 2, Y(d0), z0, 0, 0, shade], [W / 2, Y(d0), z0, 0, W / lipT, shade], [W / 2, Y(d1), z1, 0, W / lipT, shade], [-W / 2, Y(d1), z1, 0, 0, shade]));
    }
    solid(long, plyMat);

    // ── the front lip: a board on its edge. Its front is the picture's front, its top and ends show its layers
    const lipShape = roundedRect(W, lipH, lipR);
    const yf = -D / 2, yb = yf + lipT;
    const cap = new ShapeGeometry(lipShape, 6);
    const cp = cap.getAttribute('position'), lipFront: number[][] = [], lipRear: number[][] = [];
    const idx = cap.getIndex();
    for (let i = 0; i < (idx ? idx.count : cp.count); i++) {
      const k = idx ? idx.getX(i) : i, x = cp.getX(k), z = cp.getY(k);
      lipFront.push([x, yf, z, x / W + 0.5, z / lipH, 1]); lipRear.push([x, yb, z, x / W + 0.5, z / lipH, 0.5]);
    }
    cap.dispose();
    const lipMat = mat({ uMode: { value: 1 }, tMap: { value: lipTx } }); lipMat.side = 2;
    solid([...lipFront, ...lipRear], lipMat);
    const rim = lipShape.getPoints(6), edge: number[][] = [];
    for (let i = 0; i < rim.length - 1; i++) {
      const p = rim[i], q = rim[i + 1];
      if (p.y < 1e-9 && q.y < 1e-9) continue;                   // (its foot is on the mat)
      // lit from above: the top is bright, the ends are in the shade the picture gives them
      const up = (q.x - p.x) / -Math.hypot(q.x - p.x, q.y - p.y), shade = 0.8 + 0.2 * Math.max(0, up);
      edge.push(...quad([p.x, yf, p.y, 0, 0, shade], [p.x, yb, p.y, 0, 1, shade], [q.x, yb, q.y, 0, 1, shade], [q.x, yf, q.y, 0, 0, shade]));
    }
    solid(edge, plyMat);

    // ── the tablet: a thin slab with rounded corners, its foot on the ledge, its back on the wedge's slope
    const bev = T * 0.3, corner = Wt * 0.05;
    const place = new Matrix4().makeTranslation(0, Y(slopeFoot) - T * Math.cos(LEAN), zs + T * Math.sin(LEAN)).multiply(new Matrix4().makeRotationX(-LEAN));
    const body = new ExtrudeGeometry(roundedRect(Wt - bev * 2, Ht - bev * 2, corner - bev, bev), { depth: T - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 });
    // (the shape is drawn across and up; the slab's thickness runs back from its face)
    body.applyMatrix4(new Matrix4().set(1, 0, 0, 0, 0, 0, -1, T - bev, 0, 1, 0, 0, 0, 0, 0, 1)); body.applyMatrix4(place);
    add(body, mat({}));
    const fw = Wt - bev * 0.7, fh = Ht - bev * 0.7;
    const face = new ShapeGeometry(roundedRect(fw, fh, corner - bev * 0.35, bev * 0.35), 8);
    const fuv = face.getAttribute('uv'), fpos = face.getAttribute('position');
    for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fpos.getX(i) / fw + 0.5, (fpos.getY(i) - bev * 0.35) / fh);
    face.applyMatrix4(new Matrix4().set(1, 0, 0, 0, 0, 0, -1, -W * 0.0012, 0, 1, 0, 0, 0, 0, 0, 1)); face.applyMatrix4(place);
    const glass = mat({ uMode: { value: 1 }, tMap: { value: faceT } });
    glass.polygonOffset = true; glass.polygonOffsetFactor = -2; glass.polygonOffsetUnits = -2;
    add(face, glass);

    // ── its shadows, on the plane of its foot, falling off its left end as in the picture: the stand's, and the tablet's
    // (whose footprint moves back as it rises). The light comes from the right, a little from the front.
    const DIR = new Vector2(-0.68, 0.18);
    const caster = (cy: number, half: Vector2, taper: Vector2, r: number, b: number, t: number, leanBack: number, strength: number) => {
      const geo = new PlaneGeometry(W * 5, W * 5); parts.push(geo);
      const m = new ShaderMaterial({
        vertexShader: SHADOW_VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          uC: { value: new Vector2(0, cy) }, uHalf: { value: half }, uTaper: { value: taper }, uR: { value: r },
          uB: { value: b }, uT: { value: t }, uDir: { value: DIR }, uLean: { value: new Vector2(0, leanBack) }, uStrength: { value: strength }, uSoft: { value: W * 0.13 },
          uAlpha: shown, uDawn: c.dawn, uScreen: { value: c.screenSize },
        },
      });
      parts.push(m);
      const mesh = new Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 1.7;
      stand.add(mesh);
    };
    // the wedge narrows to its ridge, which is toward its back
    // (its footprint is drawn in from the lit front and right, so no dark line shows along them)
    caster(D * 0.05, new Vector2(W / 2 - W * 0.012, D * 0.45), new Vector2(0, D * 0.34), W * 0.02, 0, W * 0.58, (D * 0.15) / (W * 0.58), 0.9);
    caster(Y(slopeFoot) - T / 2, new Vector2(Wt / 2, T), new Vector2(0, 0), T * 0.4, zs, zs + Ht * Math.cos(LEAN), Math.tan(LEAN), 0.7);

    // stand it on the mat: tipped back, its foot's far edge would sink under the mat, so lift it clear
    const reach = (W / 2) * Math.abs(Math.sin(TURN)) + (D / 2) * Math.abs(Math.cos(TURN));
    group.position.set(opts.x, opts.y, reach * Math.sin(PITCH) + W * 0.004);
    c.scene.add(group);
  }

  let resolve: () => void = () => undefined;
  const ready = new Promise<void>((r) => { resolve = r; });
  return {
    ready,
    attach(c) {
      ctx = c;
      // (without its pictures it is not built: the mat lights without it)
      Promise.all(BOT_PICTURES.map(loadImage)).then((pictures) => { if (ctx !== c) return; build(c, pictures); c.invalidate(); }).catch(() => undefined).then(resolve);
    },
    update() {
      if (!group) return false;
      if (opts.target && (!targetMesh || !targetMesh.parent)) findTarget();
      const now = targetMesh ? ((targetMesh.material as ShaderMaterial).uniforms.uAlpha.value as number) : 1;
      if (Math.abs(now - shown.value) > 1e-4) { shown.value = now; group.visible = now > 0.003; ctx?.invalidate(); }
      return false;
    },
    dispose() {
      group?.removeFromParent();
      for (const p of parts) p.dispose();
      parts.length = 0; group = null; ctx = null;
    },
  };
}
