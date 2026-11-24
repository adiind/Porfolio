// The tour around the board thread's scene (src/r14, synced from ~/dpi-3d-board, kept as the board thread made it).
// You tap the record on the mat (the board thread's intro) and you're playing. Under the board, words cast on the mat
// like a shadow, "Behind the scenes", lead round the back: the making-of things on the mat behind the board, each with
// a name card, and the back of the board wired up. "Back to the board" leads back. Nothing floats over the scene.
// Slow devices step the pixel ratio down, then show stills.
import { buildMaking } from './making.js';
import { tentCard, shadowWords } from './matsigns.js';

// Runs in two homes: this prototype (boot.js sets window.__TOUR) and the portfolio's copy of the board (no __TOUR: keep the
// board's own camera, intro and pixel ratio exactly as they are there, and only add the back).
const PORTFOLIO = !window.__TOUR;
const T = window.__TOUR || { beat: +new URLSearchParams(location.search).get('beat') || 1, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
const q = new URLSearchParams(location.search);
const SIMSLOW = +q.get('simslow') || 0;
const isNarrow = () => innerWidth < 760;
const easeIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const now = () => performance.now() / 1000;
const FRONT_PROPS = ['GuideCard', 'AboutPlaque', 'CourseBlock', 'Teammates', 'NameCard'];   // printed on the front only: hidden while the camera is behind
const MAKING = 4;
const FONT_URL = PORTFOLIO ? './vendor/three/fonts/helvetiker_bold.typeface.json' : './vendor/fonts/helvetiker_bold.typeface.json';

let C, THREE, camera, controls, renderer, scene, el;
let beat = 1, pending = 0, play0 = null, stills = false, introWas = false;
let tents = [], items = [], wiring = null, video = null, focusItem = null, backLight = null;
let toBack = null, toFront = null, hoverSign = null, playT0 = 0;
const cam = { a: null, b: null, t0: 0, d: 0, on: false };
const perf = window.__perf = { dpr: T.dpr, events: [], samples: [], reduced: T.reduced };

/* ---------------- setup, part 1: before the board's play scene exists (so taps on our signs run first) ---------------- */
export async function pre(ctx) {
  C = ctx; ({ THREE, camera, controls, renderer, scene } = C); el = renderer.domElement;
  el.setAttribute('aria-hidden', 'true');
  if (isNarrow() && !PORTFOLIO) {                       // phone: a play view that holds the board, the rack and the words under the board
    camera.fov = 32; camera.updateProjectionMatrix(); controls.maxDistance = 9;   // the board's orbit limit (5 m) would clamp the narrow-screen view
    const p = fit(new THREE.Vector3(0.26, 0.16, 0.12), new THREE.Vector3(0.22, 1.25, 1), 1.75, 0.7, { top: 12, bottom: 20 });
    camera.position.copy(p.pos); controls.target.copy(p.tgt); controls.update();
  }
  play0 = { pos: camera.position.clone(), tgt: controls.target.clone() };
  backLight = new THREE.DirectionalLight('#dbe6ff', 0); backLight.position.set(0.6, 1.1, -2.2); scene.add(backLight);
  // the two shadow signs: under the front of the board, and behind it on the way back
  // it runs out of the board's own shadow (which falls to the left of the board) to the right, along the front of the board
  toBack = await shadowWords(['BEHIND THE SCENES'], { size: 0.05, from: -0.04, fromX: -0.42, rest: 0.012, fat: 0.0016, sun: C.sun, renderer, fontUrl: FONT_URL }); toBack.position.set(-0.05, 0, 0.185); scene.add(toBack);
  toFront = await shadowWords(['BACK TO THE BOARD'], { size: isNarrow() ? 0.048 : 0.058, from: -0.85, rest: 0.012, fat: 0.0016, sun: C.sun, renderer, fontUrl: FONT_URL }); toFront.rotation.y = Math.PI; toFront.position.set(0, 0, isNarrow() ? -1.2 : -1.14); scene.add(toFront);
  window.addEventListener('pointerdown', onDown, { capture: true });
  window.addEventListener('pointermove', onMove, { capture: true });
  window.addEventListener('pointermove', onDragMove, { capture: true });
  window.addEventListener('pointerup', onDragEnd, { capture: true }); window.addEventListener('pointercancel', onDragEnd, { capture: true });
  controls.addEventListener('change', () => watchOrbit());
  window.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(MAKING); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || (e.key === 'Escape' && !PORTFOLIO)) go(2); });
  // Esc behind the scenes goes back to the front (the portfolio's page closes on Esc only from the front)
  window.__tourEsc = () => { if (beat !== MAKING) return false; go(2); return true; };
  addEventListener('resize', () => { if (stills) return; if (beat === MAKING) { layoutItems(); frameBeat(true); } });
  document.querySelectorAll('#a11y [data-go]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
}

/* ---------------- setup, part 2: after it ---------------- */
export async function post(ctx, play) {
  const { board, spinners, P } = C;
  const I = window.__introCtl;
  // the intro's opening view, pulled back on a phone so the whole record and its ring fit
  if (I && I.active() && isNarrow() && !PORTFOLIO) { const st = I.get().start; st.pos.sub(st.tgt).multiplyScalar(2.3).add(st.tgt); camera.position.copy(st.pos); controls.update(); }
  if (I && I.active() && !PORTFOLIO) { I.get().play0.pos.copy(play0.pos); I.get().play0.tgt.copy(play0.tgt); }

  // the making-of things (sketchbook, team render, keys bowl, the wired back, expo tablet)
  video = document.createElement('video');
  Object.assign(video, { src: 'media/video/expo.mp4', muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
  // the rack keys carry a back-reference in userData that clone() can't copy: clone with it lifted off
  const cleanClone = (o) => { const saved = []; o.traverse((m) => { saved.push([m, m.userData]); m.userData = {}; }); const c = o.clone(true); saved.forEach(([m, u]) => (m.userData = u)); c.visible = true; c.traverse((m) => (m.visible = true)); return c; };
  const pk = (window.__play ? [0, 1].flatMap((t) => window.__play.keys.filter((k) => k.take === t)) : []).map((k) => ({ key: cleanClone(k.key), band: cleanClone(k.band) }));
  const units = spinners.map((sp) => ({ home: { x: sp.r.x, y: sp.r.y } }));
  const MK = buildMaking({ keys: pk, video, B: P.board, units, board, M: C.M, canvasTex: C.canvasTex });
  items = MK.items; wiring = MK.wiring;
  for (const it of items) if (it.group) { it.group.visible = false; scene.add(it.group); }
  tents = items.map((it) => { const g = tentCard(it.n, it.title, C.M); g.visible = false; g.userData.item = it; scene.add(g); return g; });
  layoutItems();

  const want = T.beat >= 3 ? MAKING : T.beat;
  if ((T.reduced || want > 1) && I && I.active()) I.skip();
  beat = I && I.active() ? 1 : 2; introWas = !!(I && I.active());
  if (want === MAKING) pending = MAKING;
  if (beat === 2) playT0 = now();
  syncA11y(); sampleStart();
  if (!q.has('nowarm')) { warmUp(); setTimeout(warmUp, 2500); }   // again once the photos and the video's first frame have loaded
  window.__app = { go, info: () => ({ beat, focus: focusItem && focusItem.id, dpr: renderer.getPixelRatio(), intro: !!(I && I.active()) }),
    focus: (id) => focus(items.find((i) => i.id === id) || null), hit: (what, i) => screenOf(what, i), video,
    hideSigns: (h) => { toBack.userData.hidden = toFront.userData.hidden = h; }, signs: { toBack, toFront } };
}

/* ---------------- moving between the front (playing) and the back (making) ---------------- */
export function go(n) {
  n = n >= 3 ? MAKING : n;
  if (stills) { beat = Math.max(2, n); showStill(); syncA11y(); return; }
  const I = window.__introCtl;
  if (n === 1) return;
  if (I && I.active()) { I.skip(); pending = n; return; }            // finish the intro first, then go on
  if (n === beat && !(n === MAKING && focusItem)) return;
  beat = n; focusItem = null;
  controls.enabled = false;
  const making = n === MAKING;
  for (const it of items) if (it.group) it.group.visible = making;
  for (const t of tents) t.visible = making;
  wiring.visible = making;
  for (const nm of FRONT_PROPS) { const o = C.board.getObjectByName(nm); if (o) o.visible = !making; }
  if (making && !T.reduced && !q.has('novideo')) video.play().catch(() => {}); else video.pause();
  if (n === 2) { camera.clearViewOffset(); tweenTo(play0.pos, play0.tgt, 1.6); playT0 = now(); }
  else frameBeat(false);
  syncA11y(); sampleStart();
}
function focus(it) { focusItem = it; frameBeat(false); }

/* ---------------- warm-up: build every shader and upload every texture up front, so nothing stalls on first sight ---------------- */
function warmUp() {
  if (stills) return;
  const hidden = [], show = (o) => { if (o && !o.visible) { o.visible = true; hidden.push(o); } };
  show(C.board); for (const it of items) show(it.group); tents.forEach(show); show(wiring); show(toBack); show(toFront);
  for (const nm of FRONT_PROPS) show(C.board.getObjectByName(nm));
  const roots = [C.board, ...items.map((i) => i.group).filter(Boolean), ...tents, toBack, toFront];
  for (const r of roots) r.traverse((o) => { const ms = o.material ? [].concat(o.material) : []; for (const m of ms) for (const k of ['map', 'bumpMap', 'emissiveMap', 'alphaMap']) if (m[k] && m[k].image) { try { renderer.initTexture(m[k]); } catch (e) {} } });
  const culled = []; for (const r of roots) r.traverse((o) => { if (o.frustumCulled) { o.frustumCulled = false; culled.push(o); } });
  const rt = new THREE.WebGLRenderTarget(32, 32), prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(prev); rt.dispose();
  for (const o of culled) o.frustumCulled = true;
  for (const o of hidden) o.visible = false;
}

/* ---------------- camera ---------------- */
function tweenTo(pos, tgt, d) {
  cam.a = { pos: camera.position.clone(), tgt: controls.target.clone() }; cam.b = { pos: pos.clone(), tgt: tgt.clone() };
  cam.t0 = now(); cam.d = T.reduced ? 0 : d; cam.on = true;
}
// camera pose that shows a w x h box round tgt from direction dir, inside the screen minus top/bottom pads (px)
function fit(tgt, dir, w, h, pad = {}) {
  const W = innerWidth, H = innerHeight, top = pad.top || 0, bot = pad.bottom || 0, ah = H - top - bot, tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max((h * H / ah) / 2 / tv, w / 2 / (tv * (W / H))) * 1.05;
  const d = dir.clone().normalize(), up = new THREE.Vector3(0, 1, 0).sub(d.clone().multiplyScalar(d.y)).normalize();
  const t = tgt.clone().addScaledVector(up, (top - bot) / H * dist * tv);
  return { pos: t.clone().addScaledVector(d, dist), tgt: t };
}
function spec() {
  const v = (x, y, z) => new THREE.Vector3(x, y, z), n = isNarrow();
  if (focusItem) { const L = focusItem.look, at = focusItem.id === 'board' ? [0, 0, -0.05] : [focusItem.x, 0, focusItem.z];
    return { tgt: v(at[0], L.y * 0.7, at[2] - (focusItem.id === 'board' ? 0.08 : 0.07)), dir: v(-L.dir[0], L.dir[1] + (n ? 0.7 : 0), -L.dir[2]), w: L.w * 1.3, h: L.h * 1.35 }; }   // phone: look down more, so nearer things don't hide the card
  return n ? { tgt: v(0, 0.1, -0.72), dir: v(0, 1.2, -1), w: 0.82, h: 1.36 } : { tgt: v(0, 0.12, -0.62), dir: v(0, 0.5, -1), w: 1.62, h: 1.2 };
}
function frameBeat(instant) {
  camera.clearViewOffset(); camera.updateProjectionMatrix();
  const s = spec(), p = fit(s.tgt, s.dir, s.w, s.h, { top: 14, bottom: 20 });
  tweenTo(p.pos, p.tgt, instant ? 0 : 1.6);
}
function layoutItems() {
  // on the mat behind the board, facing the camera that looks back at it from behind; a name card in front of each.
  // "Back to the board" lies in front of them, nearest the camera.
  const n = isNarrow();
  const spots = n ? { sketch: [0.2, -0.9], render: [-0.21, -0.92], keys: [0.21, -0.5], expo: [-0.21, -0.46] }
    : { sketch: [0.66, -0.62], render: [0.24, -0.72], keys: [-0.22, -0.72], expo: [-0.68, -0.6] };
  for (const it of items) {
    if (!it.group) { it.x = 0; it.z = -0.05; continue; }
    const [x, z] = spots[it.id]; it.x = x; it.z = z;
    it.group.position.set(x, 0, z); it.group.rotation.y = Math.PI + (n ? 0 : -x * 0.25);
    if (!it.base) it.base = it.group.scale.x; it.group.scale.setScalar(it.base * (n ? 0.82 : 1));
  }
  for (const t of tents) {
    const it = t.userData.item, isB = it.id === 'board';
    t.position.set(isB ? (n ? 0 : 0.5) : it.x, 0, isB ? (n ? -0.13 : -0.34) : it.z - (it.id === 'sketch' ? 0.2 : it.id === 'keys' ? 0.27 : it.id === 'expo' ? 0.22 : 0.21) * (n ? 0.85 : 1));
    t.rotation.y = Math.PI + (n || isB ? 0 : -it.x * 0.25); t.scale.setScalar(n ? 1.15 : 1);
  }
}

/* ---------------- input ---------------- */
const ndcOf = (e) => new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
function hitList(e, objs) { const r = new THREE.Raycaster(); r.params.Line.threshold = 0.001; r.setFromCamera(ndcOf(e), camera); return r.intersectObjects(objs, true); }
function signAt(e) {
  if (beat === 2 && toBack.visible && hitList(e, [toBack.userData.hit]).length) return toBack;
  if (beat === MAKING && toFront.visible && !focusItem && hitList(e, [toFront.userData.hit]).length) return toFront;
  return null;
}
function onMove(e) {
  if (stills) return;
  hoverSign = signAt(e);
  const over = hoverSign || (beat === MAKING && pickItem(e));
  if (over) { el.style.cursor = 'pointer'; e.stopPropagation(); }
  else if (beat === MAKING) el.style.cursor = '';
}
function onDown(e) {
  if (stills || e.target !== el) return;
  const s = signAt(e);
  if (s) { e.stopPropagation(); e.preventDefault(); go(s === toBack ? MAKING : 2); return; }
  if (beat !== MAKING) return;
  // behind the scenes: a press is either a tap (look at a thing / step back out) or a drag that turns the room;
  // turn it far enough and you're back at the front of the board
  e.stopPropagation(); e.preventDefault();
  turnDrag = { x0: e.clientX, y0: e.clientY, id: e.pointerId, moved: false, a: 0, ev: e, pos: camera.position.clone(), tgt: controls.target.clone() };
  cam.on = false;
}
let turnDrag = null;
const azimuth = (pos, tgt) => Math.atan2(pos.x - tgt.x, pos.z - tgt.z);
function onDragMove(e) {
  const d = turnDrag; if (!d || e.pointerId !== d.id) return;
  const dx = e.clientX - d.x0;
  if (!d.moved && Math.hypot(dx, e.clientY - d.y0) > 6) d.moved = true;
  if (!d.moved) return;
  e.stopPropagation();
  d.a = -dx / innerWidth * Math.PI * 1.3;                     // drag across the whole screen: a bit more than half a turn
  const off = d.pos.clone().sub(d.tgt).applyAxisAngle(new THREE.Vector3(0, 1, 0), d.a);
  camera.position.copy(d.tgt).add(off); controls.target.copy(d.tgt);
  if (Math.abs(d.a) > 1.1) { turnDrag = null; go(2); }         // turned far enough round: carry on to the front
}
function onDragEnd(e) {
  const d = turnDrag; if (!d || e.pointerId !== d.id) return;
  turnDrag = null; e.stopPropagation();
  if (!d.moved) { const it = pickItem(d.ev); if (it && it !== focusItem) focus(it); else if (focusItem) focus(null); return; }
  tweenTo(d.pos, d.tgt, 0.6);                                   // not far enough: settle back
}
// at the front, turning the room with the orbit controls far enough round carries on behind the scenes
function watchOrbit() {
  if (beat !== 2 || cam.on || !controls.enabled || !play0) return;
  let da = azimuth(camera.position, controls.target) - azimuth(play0.pos, play0.tgt);
  da = Math.atan2(Math.sin(da), Math.cos(da));
  if (Math.abs(da) > 1.15) go(MAKING);
}
function pickItem(e) {
  const objs = [...items.filter((i) => i.group).map((i) => i.group), ...tents, C.board];
  const h = hitList(e, objs)[0]; if (!h) return null;
  let o = h.object;
  while (o) { const it = items.find((i) => i.group === o) || (tents.includes(o) ? o.userData.item : null); if (it) return it; if (o === C.board) return items.find((i) => i.id === 'board'); o = o.parent; }
  return null;
}
function screenOf(what, i) {   // test hook: where to tap
  let p;
  if (what === 'behind') p = toBack.getWorldPosition(new THREE.Vector3());
  else if (what === 'front') p = toFront.getWorldPosition(new THREE.Vector3());
  else if (what === 'item') { const it = items.find((x) => x.id === i); p = it.group ? it.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, it.look.y, 0)) : new THREE.Vector3(0, 0.25, -0.05); }
  p.project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight };
}

/* ---------------- per frame ---------------- */
let lastF = now();
export function frame(t) {
  const tn = now(), dt = Math.min(0.05, tn - lastF); lastF = tn;
  if (SIMSLOW) { const e = performance.now() + SIMSLOW; while (performance.now() < e) {} }
  const I = window.__introCtl, introNow = !!(I && I.active());
  if (introWas && !introNow) { introWas = false; beat = 2; playT0 = tn; controls.enabled = true; syncA11y(); sampleStart(); }
  if (pending && !introNow) { const p = pending; pending = 0; go(p); }
  if (cam.on) {
    const k = cam.d ? easeIO((tn - cam.t0) / cam.d) : 1;
    // swing round the target (orbit-like) rather than cutting straight through the board
    controls.target.lerpVectors(cam.a.tgt, cam.b.tgt, k);
    const sa = new THREE.Spherical().setFromVector3(cam.a.pos.clone().sub(cam.a.tgt)), sb = new THREE.Spherical().setFromVector3(cam.b.pos.clone().sub(cam.b.tgt));
    let dth = sb.theta - sa.theta; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
    const sp = new THREE.Spherical(sa.radius + (sb.radius - sa.radius) * k, sa.phi + (sb.phi - sa.phi) * k, sa.theta + dth * k);
    camera.position.setFromSpherical(sp).add(controls.target);
    if (k >= 1) { cam.on = false; if (beat === 2) controls.enabled = true; }
  }
  backLight.intensity += ((beat === MAKING ? 1.3 : 0) - backLight.intensity) * Math.min(1, dt * 3);
  // the shadow words: "Behind the scenes" rises out of the board's shadow a moment after you start playing
  const tt = T.reduced ? 0 : t;
  toBack.userData.frame(tt, dt, hoverSign === toBack, beat === 2 && !cam.on && tn - playT0 > 1.2 && !toBack.userData.hidden);
  toFront.userData.frame(tt, dt, hoverSign === toFront, beat === MAKING && !focusItem && !cam.on && !toFront.userData.hidden);
  for (const it of items) if (it.spin && beat === MAKING && !T.reduced) it.spin.rotation.y += dt * 0.35;
  sample(dt);
}

/* ---------------- performance fallback: 2 → 1.5 → 1 → stills ---------------- */
let sampling = null;
function sampleStart() { sampling = { t0: now() + 0.6, n: [], beat }; }
function sample(dt) {
  if (!sampling || q.has('nofallback') || now() < sampling.t0) return;
  sampling.n.push(dt * 1000);
  if (sampling.n.length < 45) return;
  const s = [...sampling.n].sort((a, b) => a - b), med = s[s.length >> 1];
  perf.samples.push({ beat: sampling.beat, dpr: renderer.getPixelRatio(), median: +med.toFixed(1) });
  sampling = null;
  if (med <= 40) return;                                  // under ~25 fps: step down
  const cur = renderer.getPixelRatio(), nextDpr = cur > 1.5 ? 1.5 : cur > 1 ? 1 : 0;
  if (nextDpr) { renderer.setPixelRatio(nextDpr); renderer.setSize(innerWidth, innerHeight); perf.events.push(`dpr ${cur} → ${nextDpr} (median ${med.toFixed(1)} ms)`); sampleStart(); }
  else enterStills(`median ${med.toFixed(1)} ms at dpr 1`);
}
export function enterStills(reason) {
  if (stills || !document.getElementById('still')) return;   // (the portfolio has no stills: it stays at the lowest pixel ratio) stills = true; perf.stills = reason; perf.events.push('stills: ' + reason);
  document.body.classList.add('stills');
  try { const E = window.__play.engine; Object.keys(E.L).forEach((id) => E.setPresent(id, false)); } catch (e) {}
  if (beat === 1) beat = 2;
  showStill(); syncA11y();
}
function showStill() {
  const img = document.getElementById('still'); if (!img) return;
  img.src = `stills/beat${beat}-${isNarrow() ? 'mobile' : 'desktop'}.jpg`;
  img.alt = beat === MAKING ? 'Sketchbook, team render, keys, wired back and expo tablet on the mat behind the board' : 'The board with its key rack, guide card, plaque and course block';
}
function syncA11y() {
  document.querySelectorAll('#a11y [data-go]').forEach((b) => b.setAttribute('aria-current', +b.dataset.go === beat ? 'step' : 'false'));
  document.querySelectorAll('#a11y section').forEach((s) => (s.hidden = +s.dataset.beat !== (beat === 1 ? 2 : beat)));
}
