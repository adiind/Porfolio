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
  CanvasTexture, ClampToEdgeWrapping, CylinderGeometry, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, NoColorSpace,
  PlaneGeometry, ShaderMaterial, Vector2, Vector3, type BufferGeometry, type PerspectiveCamera,
} from 'three';
import { PROP_FRAGMENT, PROP_SHADOW_FRAGMENT, PROP_VERTEX } from '../flipbook/shaders';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';
import { drawFace, drawTape, faceCanvas, thumbRects, type MatStop, type Pictures } from './timelineCards';
import {
  ROLL, TAPE, cardPose, cardSize, introDue, introEnd, layoutCards, openingOrder, planFlights, pushedTops, rollRadius,
  rollTop, rollY, stepAt, stepOpen, yOf, type Flight, type Hold, type PlacedCard,
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
/** The window's light comes from the top right (shadows fall down and to the left). */
const LIGHT = new Vector3(0.35, 0.45, 0.9).normalize();

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

/** The HTML lying over the cards: one link per card, one per print on Tinker Verse, and words placed on the mat. */
export interface TimelineOverlay {
  cards: Map<string, HTMLElement>;
  thumbs: HTMLElement[];
  /** elements with data-mx / data-my (mat pixels) are placed there, scaled by --k */
  words: HTMLElement[];
  root: HTMLElement;
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
  state(): { intro: number; introEnd: number; open: number[]; current: number };
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
    // the cards: drawn and uploaded one at a time in quiet moments, so building them never holds a frame
    const queue = [...cards];
    const next = () => {
      if (!ctx) return;
      const placed = queue.shift();
      if (!placed) {
        c.scene.add(tapeShadow!, tape!, rollShadow!, group);
        meshes.forEach((m) => c.scene.add(m.shadow, m.mesh));
        visible = true;
        c.invalidate();
        resolveReady();
        return;
      }
      const { stop } = placed;
      const restCanvas = faceCanvas(stop); drawFace(restCanvas, stop, 0, pictures);
      const rest = texture(restCanvas, c.maxAnisotropy);
      let openTex: CanvasTexture | null = null;
      if (!stop.fill) { const oc = faceCanvas(stop); drawFace(oc, stop, 1, pictures); openTex = texture(oc, c.maxAnisotropy); }
      c.renderer.initTexture(rest);
      if (openTex) c.renderer.initTexture(openTex);
      const mat = new ShaderMaterial({
        vertexShader: PROP_VERTEX, fragmentShader: CARD_FRAGMENT, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          tMap: { value: rest }, tOpen: { value: openTex ?? rest }, tSun: { value: c.sunTexture }, uScreen: { value: c.screenSize },
          uSize: { value: new Vector2(1, 1) }, uRadius: { value: 14 * u }, uCutout: { value: 0 }, uAlpha: { value: 0 }, uDawn: c.dawn,
          uCrop: { value: new Vector2(1, 1) }, uAnchor: { value: placed.lane === 0 ? 1 : 0 }, uOpen: { value: 0 },
        },
      });
      disposables.push(mat);
      const shade = shadowMaterial(c.dawn, c.screenSize);
      const mesh = new Mesh(unitPlane, mat); mesh.frustumCulled = false;
      const shadow = new Mesh(unitPlane, shade); shadow.frustumCulled = false;
      meshes.push({ placed, flight: plan.get(placed)!, step: steps.indexOf(placed), rest, open: openTex, mesh, mat, shadow, shade });
      idle(next);
    };
    idle(next);
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
    current = done ? stepAt(scrollY, hold) : -1;
    if (stepOpen(open, current, dt, reduced)) moving = true;
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
      m.mesh.visible = m.shadow.visible = pose.alpha > 0.003;
      // flat cards in lane order; one still coming out from under the card above it lies under every card already down;
      // one hopping lies over the mat and the tape
      const order = pose.under ? 5.6 + i * 0.001 : pose.flying ? 8 + i * 0.001 : 6 + i * 0.01;
      m.mesh.renderOrder = order; m.shadow.renderOrder = 5;
      if (pose.flying) moving = true;
    });
    // the links over the cards, and the words on the mat
    if (overlay) {
      camera.updateMatrixWorld();
      meshes.forEach((m) => {
        const el = overlay!.cards.get(m.placed.stop.id);
        if (!el) return;
        const s = sizes.get(m.placed)!; const c = middle(m.placed);
        placeBox(el, camera, view, c.x - s.w / 2, c.y - s.h / 2, s.w, s.h, 0.004);
        if (m.placed.stop.fill) {
          thumbRects(m.placed.stop).forEach((r, j) => {
            const t = overlay!.thumbs[j];
            if (t) placeBox(t, camera, view, c.x - s.w / 2 + r.x, c.y - s.h / 2 + r.y, r.w, r.h + 20, 0.004);
          });
        }
      });
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
    state: () => ({ intro: introT, introEnd: endT, open: [...open], current }),
    dispose() {
      window.removeEventListener('scroll', onScroll);
      if (ctx) {
        const scene = ctx.scene;
        meshes.forEach((m) => scene.remove(m.mesh, m.shadow));
        if (tape) scene.remove(tape); if (tapeShadow) scene.remove(tapeShadow); if (rollShadow) scene.remove(rollShadow);
        if (roll) { scene.remove(roll.group); [roll.side, roll.endA, roll.endB, roll.core].forEach((m) => m.geometry.dispose()); }
      }
      disposables.forEach((d) => d.dispose());
      ctx = null;
    },
  };
}

/** Run soon, in a quiet moment (or after a frame where there are none). */
function idle(fn: () => void) {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 120 });
  else window.setTimeout(fn, 16);
}

