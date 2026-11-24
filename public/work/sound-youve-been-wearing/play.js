// Play mode (?play=1): a cut-out metal rack at the right of the board holds 15 keys, three per colour (takes 1-3,
// like the bowl of keys in photo 06). Drag a key into a record. As on the real board (DPI_2.ino + the Layer Mixer
// app), a key only plays in the record of its own colour; in any other record it is rejected and that bar goes red.
// Audio: the Layer Mixer's Tone.js engine and its 15 stems (copied from ~/dpi-3d-page, which ported them).
import { Engine } from './audio.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { LAYERS, LOOP_SECONDS, layerForRecord } from './layers.js';
import { addTeammates } from './teammates.js';

const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

// Each colour is a family of shapes: take 1 is the real key from the photos, takes 2 and 3 are clear variations of it,
// so all 15 keys are different but the three of one colour look related (as in the bowl in photo 06).
const FAMILY = { darkblue: 'blob', red: 'splat', orange: 'burst', yellow: 'jag', teal: 'fuzz' };
const VARIANT = {   // per family, the two extra takes
  blob:  [{ k: 2, a: .13, k2: 5, a2: .04 }, { k: 4, a: .1, k2: 7, a2: .03 }],          // two-lobed bean, four-lobed cloud
  splat: [{ n: 6, a: .16, m: 11, b: .07 }, { n: 4, a: .2, m: 9, b: .09 }],               // six-armed, four-armed splat
  burst: [{ n: 7, len: .95, w: .3, base: .48 }, { n: 15, len: .8, w: .16, base: .56 }],   // fat 7-point star, fine 15-point burst
  jag:   [{ n: 5, len: .98, w: .34, base: .45 }, { n: 11, len: .85, w: .2, base: .55 }], // bold 5-point, busy 11-point
  fuzz:  [{ teeth: 12, depth: .14, wob: 0 }, { teeth: 34, depth: .06, wob: .06 }],       // big cog teeth, fine wavy teeth
};
function variantPoints(THREE, fam, v, Rk) {
  const pts = [], N = 260;
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2; let f;
    if (fam === 'blob') f = .86 + v.a * Math.cos(v.k * t) + v.a2 * Math.sin(v.k2 * t + .7);
    else if (fam === 'splat') f = .74 + v.a * Math.max(0, Math.cos(v.n * t + .4)) ** 1.5 + v.b * Math.sin(v.m * t + 1.3);
    else if (fam === 'fuzz') { const ph = (t * v.teeth / (Math.PI * 2)) % 1; f = .84 + v.depth * (ph < .5 ? 1 : 0) * (fam ? 1 : 0) + v.wob * Math.sin(3 * t); f = Math.min(f, .84 + v.depth); }
    else { // burst / jag: evenly spaced spikes, first one pointing up
      f = v.base;
      for (let k = 0; k < v.n; k++) { const sa = Math.PI / 2 + k / v.n * Math.PI * 2, d = Math.abs(((t - sa + Math.PI * 3) % (Math.PI * 2)) - Math.PI), q = Math.max(0, 1 - d / v.w);
        f = Math.max(f, v.base + (v.len - v.base) * (fam === 'jag' ? (q > .45 ? q : q * .6) : q)); }
    }
    pts.push(new THREE.Vector2(Math.cos(t) * Rk * f, Math.sin(t) * Rk * f));
  }
  const sh = new THREE.Shape(pts), hole = new THREE.Path(), sy = -Rk * .36, hw = 0.0055, hh = 0.0028;
  hole.absarc(-hw, sy, hh, Math.PI / 2, Math.PI * 1.5, false); hole.lineTo(hw, sy - hh); hole.absarc(hw, sy, hh, -Math.PI / 2, Math.PI / 2, false); hole.lineTo(-hw, sy + hh);
  sh.holes.push(hole);
  return { sh, slotY: sy };
}

export async function setup(C) {
  const { THREE, RoundedBoxGeometry, canvasTex, board, camera, renderer, controls, P, M, spinners, leds, keyOutline, paintTex, CoilCurve, slab, cyl, shadowAll } = C;
  await loadScript('./vendor/Tone.js');
  const engine = new Engine(() => ui());
  const ease = (x) => { x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); };

  /* ---------- the rack: a thin cut-out metal plate on a bent-wire stand, angled at the right of the board ---------- */
  const cols = [...spinners].sort((a, b) => a.r.x - b.r.x);           // left to right as on the board
  const rack = new THREE.Group(); rack.name = 'KeyRack'; rack.userData.sceneOnly = true; board.add(rack);
  rack.position.set(0.80, 0, 0.2); rack.rotation.y = -0.6;
  const KEYW = 0.064, PW = 0.44, PH = 0.36, PY = 0.09;                // plate 44 x 36 cm, its bottom 9 cm off the mat
  const colX = (c) => (c - 2) * 0.083;
  const rowY = (take) => PY + 0.29 - take * 0.095;                    // take 1 on top
  const steel = new THREE.MeshStandardMaterial({ color: '#c3c8cf', metalness: .85, roughness: .38 });
  const wire = new THREE.MeshStandardMaterial({ color: '#9aa1aa', metalness: .9, roughness: .3 });
  { const s = new THREE.Shape(), r = 0.012, x0 = -PW / 2, x1 = PW / 2, y0 = PY, y1 = PY + PH;
    s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
    s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
    const slot = (cx, cy, w, h) => { const p = new THREE.Path(), rr = h / 2; p.absarc(cx - w / 2 + rr, cy, rr, Math.PI / 2, Math.PI * 1.5, false); p.lineTo(cx + w / 2 - rr, cy - rr); p.absarc(cx + w / 2 - rr, cy, rr, -Math.PI / 2, Math.PI / 2, false); p.lineTo(cx - w / 2 + rr, cy + rr); s.holes.push(p); };
    for (let c = 0; c < 5; c++) for (let t = 0; t < 3; t++) { const h = new THREE.Path(); h.absarc(colX(c), rowY(t), 0.0185, 0, Math.PI * 2, true); s.holes.push(h); }
    for (let c = 0; c < 5; c++) for (const y of [rowY(0) - 0.0475, rowY(1) - 0.0475]) slot(colX(c), y, 0.05, 0.007);   // cut-outs between the rows
    for (let c = 0; c < 6; c++) slot((c - 2.5) * 0.083, PY + PH - 0.018, 0.03, 0.006);                                    // a row along the top
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -0.001);
    const plate = new THREE.Mesh(g, steel); plate.name = 'RackPlate'; rack.add(plate);
    // bent-wire stand: a frame round the plate, front legs down to the mat, two back legs leaning out behind
    const rod = (a, b) => { const v = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, v.length(), 10), wire); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); rack.add(m); };
    const o = 0.008, fz = -0.004, X0 = x0 - o, X1 = x1 + o, Y0 = y0 - o, Y1 = y1 + o, V = (x, y, z = fz) => new THREE.Vector3(x, y, z);
    rod(V(X0, Y0), V(X1, Y0)); rod(V(X0, Y1), V(X1, Y1)); rod(V(X0, 0), V(X0, Y1)); rod(V(X1, 0), V(X1, Y1));
    rod(V(X0, Y1 - 0.02), V(X0, 0, -0.17)); rod(V(X1, Y1 - 0.02), V(X1, 0, -0.17)); rod(V(X0, 0, -0.17), V(X1, 0, -0.17));
    for (const x of [X0, X1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 8), wire); f.position.set(x, 0.002, fz); rack.add(f); }
    // etched labels: the take number at each row, the layer under each column
    const PX = 2400, tex = canvasTex(PX, Math.round(PX * PH / PW), (g2, w, h) => {
      const X = (x) => (x / PW + .5) * w, Y = (y) => (1 - (y - PY) / PH) * h, u = w / PW;
      g2.clearRect(0, 0, w, h); g2.textAlign = 'center'; g2.textBaseline = 'middle';
      for (let t = 0; t < 3; t++) { g2.fillStyle = '#4b525c'; g2.font = `700 ${Math.round(0.02 * u)}px system-ui, sans-serif`; g2.fillText(String(t + 1), X(-PW / 2 + 0.018), Y(rowY(t))); }
      cols.forEach((sp, c) => {
        const name = layerForRecord(sp.r.id).name.toUpperCase();
        g2.font = `700 ${Math.round(0.0105 * u)}px system-ui, sans-serif`; const tw = g2.measureText(name).width, dotR = 0.0042 * u, cx = X(colX(c)), cy = Y(PY + 0.022);
        g2.fillStyle = sp.r.key.color; g2.beginPath(); g2.arc(cx - tw / 2 - dotR * 1.8, cy, dotR, 0, Math.PI * 2); g2.fill();
        g2.fillStyle = '#4b525c'; g2.fillText(name, cx + dotR, cy);
      });
      g2.font = `600 ${Math.round(0.009 * u)}px system-ui, sans-serif`; g2.fillStyle = '#6b727c'; g2.fillText('TAKE', X(-PW / 2 + 0.018), Y(rowY(0) + 0.03));
    });
    const etch = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: tex, transparent: true, metalness: .3, roughness: .6, depthWrite: false }));
    etch.position.set(0, PY + PH / 2, 0.0012); rack.add(etch);
  }
  shadowAll(rack);
  rack.updateMatrixWorld(true);

  /* ---------- 15 keys: three per colour, all the same shape as that colour's real key; the row says which take ---------- */
  const keys = [];
  cols.forEach((sp, c) => {
    const base = sp.r.key, layer = layerForRecord(sp.r.id);
    for (let take = 0; take < 3; take++) {
      const size = base.size, Rk = size / 2, seed = take === 0 ? 7 + sp.i * 13 : 211 + sp.i * 17 + take * 29;
      const key = new THREE.Group(); key.name = `Key_${sp.r.id}_take${take + 1}`;
      const fam = FAMILY[sp.r.id];
      const { sh, slotY } = take === 0 ? keyOutline(base.shape, Rk, seed) : variantPoints(THREE, fam, VARIANT[fam][take - 1], Rk);
      const paint = new THREE.MeshStandardMaterial({ map: paintTex(base.color, 3 + sp.i), roughness: .7 });
      paint.map.wrapS = paint.map.wrapT = THREE.RepeatWrapping; paint.map.repeat.set(1 / size, 1 / size); paint.map.offset.set(.5, .5);
      key.add(new THREE.Mesh(slab(sh, 0.005, 0.0007), [paint, M.burnt]));
      const shaftM = base.shaft === 'blue' ? M.pla : M.shaftBlack;
      const flange = cyl(0.025, 0.004, shaftM, 40); flange.position.z = -0.007; key.add(flange);
      const shaft = cyl(0.0165, 0.095, shaftM, 40); shaft.position.z = -0.009 - 0.0475; key.add(shaft);
      board.add(key);
      const band = new THREE.Group(); band.name = `${key.name}_Wristband`;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.0011, 10, 40), M.ring); ring.rotation.y = Math.PI / 2; ring.position.set(0, -0.006, -0.0025); band.add(ring);
      const coil = new THREE.Mesh(new THREE.TubeGeometry(new CoilCurve(-0.013, 0.085 + sp.i * 0.004, 0.012, 0.016, 52, 0.005), 900, 0.0016, 6, false), M.coil);
      coil.position.z = 0.002; band.add(coil); board.add(band);
      shadowAll(key); shadowAll(band);
      // rack pose: shaft pushed through its hole in the plate, painted face to the front (the wristband only shows once picked up)
      const RS = KEYW / size;
      const rackPos = rack.localToWorld(new THREE.Vector3(colX(c), rowY(take), 0.0045 + 0.009 * RS));
      const rackQuat = rack.quaternion.clone();
      const k = { key, band, slotY, shaft, colour: sp.r.id, take, layer, rackPos, rackQuat, socket: null, tw: null, drag: false, sc: RS, RS, hov: 0, len: 0.22 };
      key.traverse((o) => { o.userData.k = k; }); band.traverse((o) => { o.userData.k = k; });
      key.position.copy(rackPos); key.quaternion.copy(rackQuat); key.scale.setScalar(RS); band.scale.setScalar(RS);
      keys.push(k);
    }
  });
  for (const sp of spinners) { sp.occupant = null; sp.angle = sp.phase; sp.vel = 0; sp.label = sp.g.getObjectByName('Label'); }

  /* ---------- seating rules ---------- */
  const seatedPose = (sp, out = 0) => ({ pos: new THREE.Vector3(sp.r.x, sp.r.y, P.recordZ + sp.th / 2 + 0.009 + out), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, sp.angle)) });
  const startTween = (k, dur) => { k.tw = { t0: performance.now(), dur, pos: k.key.position.clone(), quat: k.key.quaternion.clone() }; };
  function audio(sp) {
    const layer = layerForRecord(sp.r.id), k = sp.occupant;
    if (k && k.colour === sp.r.id) { engine.setOption(layer.id, k.take); engine.setPresent(layer.id, true); }
    else engine.setPresent(layer.id, false);
    ui();
  }
  function home(k) {
    if (k.socket) { const sp = k.socket; sp.occupant = null; k.socket = null; audio(sp); }
    startTween(k, 450);
  }
  function seat(k, sp) {
    if (sp.occupant === k) return;
    if (sp.occupant) home(sp.occupant);
    if (k.socket) { const old = k.socket; old.occupant = null; k.socket = null; audio(old); }
    k.socket = sp; sp.occupant = k; startTween(k, 520);
    audio(sp);
  }

  /* ---------- pointer: drag a key, drop it on a record; tap to send it home or into its own record ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
  const el = renderer.domElement;
  let drag = null, hover = null;
  const setNdc = (e) => { const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const pickKey = (e) => { setNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(keys.map((k) => k.key), true)[0]; return h ? h.object.userData.k : null; };
  const discs = spinners.map((sp) => { const d = sp.g.getObjectByName('Vinyl'); d.userData.sp = sp; return d; });
  const pickRecord = (e) => { setNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(discs, false)[0]; return h ? h.object.userData.sp : null; };
  const screenCentre = (sp) => { const r = el.getBoundingClientRect(), c = new THREE.Vector3(sp.r.x, sp.r.y, P.recordZ).project(camera); return { x: (c.x + 1) / 2 * r.width + r.left, y: (1 - c.y) / 2 * r.height + r.top }; };
  const handAngle = (e, c) => Math.atan2(-(e.clientY - c.y), e.clientX - c.x);   // screen angle, counter-clockwise positive
  let turn = null, hoverKey = null;
  function socketUnder(e) {
    const r = el.getBoundingClientRect(); let best = null, bd = 1e9;
    for (const sp of spinners) {
      const c = new THREE.Vector3(sp.r.x, sp.r.y, P.recordZ).project(camera);
      const edge = new THREE.Vector3(sp.r.x + sp.r.d / 2, sp.r.y, P.recordZ).project(camera);
      const px = (c.x + 1) / 2 * r.width + r.left, py = (1 - c.y) / 2 * r.height + r.top;
      const rad = Math.abs(edge.x - c.x) / 2 * r.width;
      const d = Math.hypot(e.clientX - px, e.clientY - py);
      if (d < rad * 1.05 && d < bd) { bd = d; best = sp; }
    }
    return best;
  }
  el.addEventListener('pointerdown', (e) => {
    engine.unlock();
    const k = pickKey(e);
    if (!k) {
      // turning a record is its volume knob (the KY-040 encoder behind it): counter-clockwise = louder, one full turn = 0 to 100%
      const sp = pickRecord(e); if (!sp) return;
      controls.enabled = false; el.setPointerCapture(e.pointerId);
      const c = screenCentre(sp); turn = { sp, c, a: handAngle(e, c), id: e.pointerId }; sp.turning = true; el.style.cursor = 'grabbing';
      e.stopImmediatePropagation(); return;
    }
    controls.enabled = false; el.setPointerCapture(e.pointerId);
    camera.getWorldDirection(hit); plane.setFromNormalAndCoplanarPoint(hit.clone().negate(), k.key.position);
    drag = { k, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  }, { capture: true });
  el.addEventListener('pointermove', (e) => {
    if (turn && e.pointerId === turn.id) {
      const a = handAngle(e, turn.c); let d = a - turn.a; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; turn.a = a;
      const layer = layerForRecord(turn.sp.r.id), s0 = engine.L[layer.id];
      const v = Math.min(1, Math.max(0, s0.volume + d / (Math.PI * 2)));
      // the record turns with the hand, but stops at the ends of the volume range
      if (v !== s0.volume || (d > 0 && s0.volume < 1) || (d < 0 && s0.volume > 0)) turn.sp.angle += d;
      engine.setVolume(layer.id, v); ui(); return;
    }
    if (!drag) { hoverKey = pickKey(e); const cb = hoverKey ? null : cardHit(e); el.style.cursor = hoverKey || pickRecord(e) ? 'grab' : cb && cb !== 'card' ? 'pointer' : ''; return; }
    if (e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.moved) { drag.moved = true; const k = drag.k; k.drag = true; k.tw = null; if (k.socket) { const sp = k.socket; sp.occupant = null; k.socket = null; audio(sp); } }
    el.style.cursor = 'grabbing';
    setNdc(e); ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) drag.k.key.position.copy(hit);
    drag.k.key.quaternion.slerp(new THREE.Quaternion(), 0.25);           // turns to face the board while carried
    hover = socketUnder(e);
  });
  const end = (e) => {
    if (turn && e.pointerId === turn.id) { turn.sp.turning = false; turn = null; controls.enabled = true; el.style.cursor = ''; return; }
    if (!drag || e.pointerId !== drag.id) return;
    const { k, moved } = drag; drag = null; controls.enabled = true; k.drag = false; el.style.cursor = '';
    if (moved) { const sp = socketUnder(e); hover = null; sp ? seat(k, sp) : home(k); }
    else if (k.socket) home(k);
    else seat(k, spinners.find((sp) => sp.r.id === k.colour));            // tap: straight into its own record
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);

  /* ---------- the guide card (left of the board) and the name tent card (in front, as in photo 01) ---------- */
  const paper = (color = '#f7f4ec') => new THREE.MeshStandardMaterial({ color, roughness: .85 });
  const CW = 0.34, CH = 0.46, CPX = 1200, CPY = Math.round(CPX * CH / CW), cs = CPX / CW;   // canvas px per metre
  const cardCanvas = document.createElement('canvas'); cardCanvas.width = CPX; cardCanvas.height = CPY;
  const cardTex = new THREE.CanvasTexture(cardCanvas); cardTex.colorSpace = THREE.SRGBColorSpace; cardTex.anisotropy = 8;
  const guide = new THREE.Group(); guide.name = 'GuideCard'; guide.userData.sceneOnly = true; board.add(guide);
  guide.position.set(-0.80, 0, 0.2); guide.rotation.y = 0.6;
  { const foot = new THREE.Mesh(new RoundedBoxGeometry(CW + 0.04, 0.03, 0.08, 3, 0.006), M.ply); foot.position.set(0, 0.015, 0); guide.add(foot);
    const tilt = new THREE.Group(); tilt.position.set(0, 0.024, 0); tilt.rotation.x = -0.16; guide.add(tilt);
    const card = new THREE.Mesh(new THREE.BoxGeometry(CW, CH, 0.004), paper()); card.position.set(0, CH / 2, 0); tilt.add(card);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshStandardMaterial({ map: cardTex, roughness: .85 })); face.position.set(0, CH / 2, 0.0021); face.name = 'GuideFace'; tilt.add(face);
    guide.userData.face = face; }
  const BTN = { shuffle: [70, CPY - 140, 320, 100], clear: [420, CPY - 140, 250, 100] };
  function drawCard() {
    const g = cardCanvas.getContext('2d'), W = CPX;
    g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, CPY);
    const navy = '#16204a', grey = '#5a6078';
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = navy; g.font = '800 92px system-ui, sans-serif'; g.fillText('Mix and match', 70, 140);
    const step = (n, y, title, sub) => {
      g.fillStyle = navy; g.beginPath(); g.arc(102, y - 20, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = '800 42px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(String(n), 102, y - 5); g.textAlign = 'left';
      g.fillStyle = navy; g.font = '700 54px system-ui, sans-serif'; g.fillText(title, 158, y);
      if (sub) { g.fillStyle = grey; g.font = '500 42px system-ui, sans-serif'; g.fillText(sub, 158, y + 54); }
    };
    step(1, 255, 'Pick a key from the rack', 'Its colour is its part of the music:');
    // the colour key, two columns
    cols.forEach((sp, i) => { const L = layerForRecord(sp.r.id), x = 158 + (i % 2) * 450, y = 385 + Math.floor(i / 2) * 62;
      g.fillStyle = sp.r.key.color; g.beginPath(); g.arc(x + 18, y - 15, 19, 0, Math.PI * 2); g.fill();
      g.fillStyle = navy; g.font = '600 44px system-ui, sans-serif'; g.fillText(L.name, x + 52, y); });
    g.fillStyle = grey; g.font = '500 38px system-ui, sans-serif'; g.fillText('Each shape is a different take.', 158, 575);
    step(2, 680, 'Put it in its colour', 'Wrong colour: the lights go red.');
    step(3, 820, 'Turn the record = volume', 'Counter-clockwise is louder.');
    step(4, 960, 'Click a key to take it out', '');
    g.fillStyle = '#ddd5c4'; g.fillRect(70, 1010, W - 140, 3);
    g.fillStyle = grey; g.font = '700 36px system-ui, sans-serif'; g.fillText('NOW PLAYING', 70, 1072);
    const s = engine.t0 === null ? 0 : engine.offset(); g.textAlign = 'right'; g.fillText(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')} / 1:36`, W - 70, 1072); g.textAlign = 'left';
    cols.forEach((sp, i) => {
      const L = layerForRecord(sp.r.id), k = sp.occupant, y = 1135 + i * 60;
      g.fillStyle = sp.r.key.color; g.beginPath(); g.arc(90, y - 14, 17, 0, Math.PI * 2); g.fill();
      g.fillStyle = navy; g.font = '700 40px system-ui, sans-serif'; g.fillText(L.name, 124, y);
      let txt = '—', col = '#9a9fb0';
      if (k && k.colour !== sp.r.id) { txt = 'wrong key'; col = '#d0231a'; }
      else if (k) { txt = `${k.take + 1} · ${L.options[k.take].name}`; col = navy; }
      g.fillStyle = col; g.font = (k ? '600' : '500') + ' 38px system-ui, sans-serif'; g.fillText(txt, 420, y);
    });
    const btn = ([x, y, w, h], label, bg, fg) => { g.fillStyle = bg; g.beginPath(); g.roundRect(x, y, w, h, 24); g.fill(); g.fillStyle = fg; g.font = '700 44px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(label, x + w / 2, y + h / 2 + 15); g.textAlign = 'left'; };
    btn(BTN.shuffle, 'Shuffle', navy, '#fff'); btn(BTN.clear, 'Clear', '#e6dfd0', navy);
    cardTex.needsUpdate = true;
  }
  function ui() { cardDirty = true; }
  window.__card = () => ({ dirty: cardDirty, url: cardCanvas.toDataURL() });
  let cardDirty = true, lastSec = -1;
  const cardHit = (e) => { setNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObject(guide.userData.face, false)[0]; if (!h) return null;
    const px = h.uv.x * CPX, py = (1 - h.uv.y) * CPY; for (const [name, [x, y, w, hh]] of Object.entries(BTN)) if (px >= x && px <= x + w && py >= y && py <= y + hh) return name; return 'card'; };
  const shuffle = () => { for (const sp of spinners) { const mine = keys.filter((k) => k.colour === sp.r.id); seat(mine[Math.floor(Math.random() * 3)], sp); } };
  const clear = () => { for (const k of keys) if (k.socket) home(k); };
  el.addEventListener('pointerdown', (e) => {
    const b = cardHit(e); if (!b || b === 'card') return;
    e.stopImmediatePropagation(); engine.unlock(); b === 'shuffle' ? shuffle() : clear();
  }, { capture: true });

  // the name tent card from the expo (photo 01): white card folded into a tent, in front of the board on the left
  { const tent = new THREE.Group(); tent.name = 'NameCard'; tent.userData.sceneOnly = true; board.add(tent);
    tent.position.set(-0.62, 0, 0.6); tent.rotation.y = 0.32;
    const L = 0.30, Hh = 0.09, D = 0.06, sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(0, Hh); sh.lineTo(-D / 2, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(L / 2, 0, 0);
    const body = new THREE.Mesh(g, paper('#fbfaf6')); tent.add(body);
    const NX = 1800, NY = Math.round(NX * 0.0949 / L), t = canvasTex(NX, NY, (c, w, h) => {
      c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h);
      // the project name big, on two lines, as large as the card allows; the small print along the bottom
      c.fillStyle = '#2b2f3d'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      let px = 200; do { c.font = `700 ${px}px system-ui, sans-serif`; px -= 4; } while (c.measureText("The Sound You've").width > w * 0.9);
      c.fillText("The Sound You've", w / 2, h * 0.34); c.fillText('Been Wearing', w / 2, h * 0.34 + px * 1.05);
      c.font = '500 36px system-ui, sans-serif'; c.fillStyle = '#6f727c';
      c.fillText('Designing Product Interactions · Final Interaction Demo Project', w / 2, h - 88);
      c.fillText('Aditya Agarwal · Henry Goodman · Ayden Harris', w / 2, h - 38);
    });
    const a = Math.atan2(D / 2, Hh), face = new THREE.Mesh(new THREE.PlaneGeometry(L, Math.hypot(D / 2, Hh)), new THREE.MeshStandardMaterial({ map: t, roughness: .85 }));
    face.rotation.x = -a; face.position.set(0, Hh / 2, D / 4 + 0.0006); tent.add(face);
    shadowAll(tent); face.castShadow = false; }
  shadowAll(guide); guide.userData.face.castShadow = false;
  // the plaque: a flat board on the mat, slightly raised at the back, that says what the project is about
  { const plaque = new THREE.Group(); plaque.name = 'AboutPlaque'; plaque.userData.sceneOnly = true; board.add(plaque);
    plaque.position.set(-0.13, 0, 0.66); plaque.rotation.y = 0.08;
    const PW2 = 0.46, PD = 0.28, tilt = new THREE.Group(); tilt.rotation.x = -Math.PI / 2 + 0.42; tilt.position.y = 0.012; plaque.add(tilt);
    const slabM = new THREE.Mesh(new RoundedBoxGeometry(PW2, PD, 0.012, 3, 0.004), M.ply); slabM.position.set(0, PD / 2, 0); tilt.add(slabM);
    const t = canvasTex(1680, Math.round(1680 * PD / PW2), (c, w, h) => {
      c.fillStyle = '#e4cfa6'; c.fillRect(0, 0, w, h); c.fillStyle = '#f7f4ec'; c.beginPath(); c.roundRect(34, 34, w - 68, h - 68, 26); c.fill();
      c.fillStyle = '#16204a'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.font = '700 36px system-ui, sans-serif'; c.fillStyle = '#7a7f93'; c.fillText('ABOUT THIS PROJECT', 90, 125);
      c.fillStyle = '#16204a'; c.font = '800 96px system-ui, sans-serif'; c.fillText("Make music together.", 90, 230);
      c.font = '500 46px system-ui, sans-serif'; c.fillStyle = '#3b4262';
      const para = (txt, y0, lh = 58, maxW = w - 180) => { const words = txt.split(' '); let line = '', y = y0; for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (c.measureText(tst).width > maxW) { c.fillText(line, 90, y); line = wd; y += lh; } else line = tst; } c.fillText(line, 90, y); return y + lh; };
      let y = para("The Sound You've Been Wearing is an immersive co-creation activity: a few people build one piece of music together, with their hands.", 320);
      y = para('A song is split into five parts: foundation, texture, drums, keys and solo. Each part is a record on the board, and each key is a different piece of music for that part.', y + 16);
      y = para('More people means more keys in play. Invite someone over, swap a key, turn a record, and a new song comes out of the group. It works as a social game as much as an instrument.', y + 16);
      // five colour dots along the bottom, one per part
      cols.forEach((sp, i) => { c.fillStyle = sp.r.key.color; c.beginPath(); c.arc(104 + i * 50, h - 90, 17, 0, Math.PI * 2); c.fill(); });
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(PW2, PD), new THREE.MeshStandardMaterial({ map: t, roughness: .85 })); face.position.set(0, PD / 2, 0.0062); tilt.add(face);
    shadowAll(plaque); face.castShadow = false; }

  // teacher coasters, like the round portraits on the portfolio's project pages: grey until hovered, click opens their profile
  const coasters = [];
  // the course block: chunky DPI letters, the class name, and "taught by" with the two teacher coasters standing in a slot
  const course = new THREE.Group(); course.name = 'CourseBlock'; course.userData.sceneOnly = true; board.add(course);
  course.position.set(0.5, 0, 0.7); course.rotation.y = -0.22;
  { const BW = 0.72, BD = 0.17;
    const base = new THREE.Mesh(new RoundedBoxGeometry(BW, 0.022, BD, 3, 0.006), M.ply); base.position.set(0, 0.011, 0); course.add(base);
    const font = new FontLoader().parse(await (await fetch('./vendor/three/fonts/helvetiker_bold.typeface.json')).json());
    const navy = new THREE.MeshStandardMaterial({ color: '#16204a', roughness: .55 });
    const tg = new TextGeometry('DPI', { font, size: 0.085, depth: 0.03, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.002, bevelSegments: 3 });
    tg.computeBoundingBox(); const bb = tg.boundingBox; tg.translate(-(bb.max.x + bb.min.x) / 2, 0, 0);
    const letters = new THREE.Mesh(tg, navy); letters.position.set(-0.17, 0.022, -0.03); course.add(letters);
    const t = canvasTex(2640, Math.round(2640 * BD / BW), (c, w, h) => {
      const X = (x) => (x / BW + .5) * w, Z = (z) => (z / BD + .5) * h;
      c.fillStyle = '#16204a'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '800 56px system-ui, sans-serif'; c.fillText('DESIGNING PRODUCT INTERACTIONS', X(-0.17), Z(0.046));
      c.font = '600 40px system-ui, sans-serif'; c.fillStyle = '#5a6078'; c.fillText('The class this was built for', X(-0.17), Z(0.066));
      c.font = '800 40px system-ui, sans-serif'; c.fillStyle = '#5a6078'; c.fillText('TAUGHT BY', X(0.17), Z(0.04));
      cols.forEach((sp, i) => { c.fillStyle = sp.r.key.color; c.beginPath(); c.arc(X(-0.17) + (i - 2) * 44, Z(0.016), 12, 0, Math.PI * 2); c.fill(); });
    });
    const print = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .8 }));
    print.rotation.x = -Math.PI / 2; print.position.y = 0.0222; course.add(print);
    shadowAll(course); print.castShadow = false; }
  { const TEACH = [
      { name: 'Craig Sampson', role: 'Instructor · Designing Product Interactions', img: './media/people/sampson-craig.jpg', url: 'https://design.northwestern.edu/people/profiles/sampson-craig.html', pos: [0.075, -0.025], rot: 0 },
      { name: 'Nick Marchuk', role: 'Lecturer · Mechatronics Design Lab', img: './media/people/marchuk-nick.jpg', url: 'https://design.northwestern.edu/people/profiles/marchuk-nick.html', pos: [0.265, -0.025], rot: 0 },
    ];
    const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
    const R = 0.09, CT = 0.009, LEAN = Math.PI / 2 - 0.35;
    for (const T of TEACH) {
      const im = await load(T.img);
      const draw = (grey) => canvasTex(1024, 1024, (c, w) => {
        const m = w / 2;
        c.fillStyle = '#efe9dc'; c.beginPath(); c.arc(m, m, m - 2, 0, Math.PI * 2); c.fill();
        // the face in the middle
        c.save(); c.beginPath(); c.arc(m, m, m * 0.62, 0, Math.PI * 2); c.clip();
        if (im) { c.filter = grey ? 'grayscale(1) contrast(1.05)' : 'none'; const sc = Math.max(m * 1.24 / im.width, m * 1.24 / im.height); c.drawImage(im, m - im.width * sc / 2, m - im.height * sc / 2, im.width * sc, im.height * sc); c.filter = 'none'; }
        c.restore();
        // name round the top of the rim, role round the bottom
        const arcText = (txt, rad, top, font, col) => { c.font = font; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; const chars = [...txt]; const ws = chars.map((ch) => c.measureText(ch).width); const total = ws.reduce((a, b) => a + b, 0); let a = (top ? -Math.PI / 2 : Math.PI / 2) - (top ? 1 : -1) * total / rad / 2;
          chars.forEach((ch, i) => { const da = ws[i] / rad; const ang = a + (top ? 1 : -1) * da / 2; c.save(); c.translate(m + Math.cos(ang) * rad, m + Math.sin(ang) * rad); c.rotate(ang + (top ? Math.PI / 2 : -Math.PI / 2)); c.fillText(ch, 0, 0); c.restore(); a += (top ? 1 : -1) * da; }); };
        arcText(T.name.toUpperCase(), m * 0.79, true, '800 76px system-ui, sans-serif', '#16204a');
        arcText(T.role, m * 0.80, false, '700 42px system-ui, sans-serif', '#4a5070');
      });
      const greyT = draw(true), colourT = draw(false);
      const g = new THREE.Group(); g.name = `Coaster_${T.name.replace(' ', '')}`; g.userData.sceneOnly = true; course.add(g);
      // standing up in a slot in the block, leaning back a little so the face looks at you
      const baseY = 0.022 + R * Math.sin(LEAN) - 0.008;
      g.position.set(T.pos[0], baseY, T.pos[1]); g.rotation.set(LEAN, 0, 0);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, CT, 64), M.ply); body.position.y = CT / 2; g.add(body);
      const topM = new THREE.MeshStandardMaterial({ map: greyT, roughness: .8 });
      const top = new THREE.Mesh(new THREE.CircleGeometry(R * 0.96, 64), topM); top.rotation.x = -Math.PI / 2; top.position.y = CT + 0.0004; g.add(top);
      shadowAll(g); top.castShadow = false;
      const co = { g, top, topM, greyT, colourT, url: T.url, hov: 0, baseY }; top.userData.co = co; body.userData.co = co; coasters.push(co);
    } }
  const LEAN_ = Math.PI / 2 - 0.35;
  const pickCoaster = (e) => { setNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(coasters.flatMap((c) => [c.top]), false)[0]; return h ? h.object.userData.co : null; };
  let hoverCoaster = null;
  el.addEventListener('pointerdown', (e) => { const co = pickCoaster(e); if (!co) return; e.stopImmediatePropagation(); window.open(co.url, '_blank', 'noopener'); }, { capture: true });
  el.addEventListener('pointermove', (e) => { if (drag || turn) return; hoverCoaster = pickCoaster(e); if (hoverCoaster) el.style.cursor = 'pointer'; });

  const teammates = await addTeammates({ THREE, RoundedBoxGeometry, canvasTex, board, camera, renderer, M, shadowAll, ray, ndc, setNdc, busy: () => drag || turn });
  document.getElementById('hud').style.display = 'none';

  /* ---------- per frame ---------- */
  let last = performance.now();
  function frame(t) {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const sp of spinners) {
      const k = sp.occupant, right = k && k.colour === sp.r.id && !k.tw;
      sp.vel += ((right && !sp.turning ? sp.speed * 2.2 : 0) - sp.vel) * Math.min(1, dt * (sp.turning ? 20 : 2.5));
      sp.angle += sp.vel * dt; sp.g.rotation.z = sp.angle;
      // the record's label glows while a key is carried over it
      if (sp.label) { sp.label.material.emissive.set(sp.r.key.color); sp.label.material.emissiveIntensity = drag && drag.moved && hover === sp ? 0.35 + 0.15 * Math.sin(t * 8) : 0; }
    }
    const q = new THREE.Quaternion(), slot = new THREE.Vector3();
    for (const k of keys) {
      if (!k.drag) {
        let pos, quat;
        if (k.socket) { const p = seatedPose(k.socket); pos = p.pos; quat = p.quat; } else { pos = k.rackPos; quat = k.rackQuat; }
        if (k.tw) {
          const a = ease((now - k.tw.t0) / k.tw.dur);
          const lift = k.socket ? (1 - a) * 0.12 : Math.sin(a * Math.PI) * 0.08;   // slides in from the front / arcs home
          k.key.position.lerpVectors(k.tw.pos, pos, a); k.key.position.z += k.socket ? lift : 0; k.key.position.y += k.socket ? 0 : lift;
          k.key.quaternion.slerpQuaternions(k.tw.quat, quat, a);
          if (a >= 1) k.tw = null;
        } else { k.key.position.copy(pos); k.key.quaternion.copy(quat); }
      }
      // the wristband hangs from the slot; seated, it keeps hanging straight down while the key turns
      // full size when carried or in a record, 70% in the rack
      k.hov += ((hoverKey === k && !k.socket && !k.drag ? 1 : 0) - k.hov) * Math.min(1, dt * 12);
      k.sc += ((k.socket || k.drag ? 1 : k.RS * (1 + 0.1 * k.hov)) - k.sc) * Math.min(1, dt * 9);
      k.key.scale.setScalar(k.sc); k.band.scale.setScalar(k.sc);
      if (!k.socket && !k.drag && !k.tw) k.key.position.y += 0.015 * k.hov;      // a key lifts a little under the pointer
      k.band.visible = !!(k.socket || k.drag || k.tw);
      // in the rack only a short stub of the shaft sits in its hole (no row of pegs out of the back); it slides out to full
      // length when the key is picked up, and is full length in a record
      k.len += ((k.socket || k.drag || k.tw ? 1 : 0.22) - k.len) * Math.min(1, dt * 10);
      k.shaft.scale.z = k.len; k.shaft.position.z = -0.009 - 0.0475 * k.len;
      slot.set(0, k.slotY * k.sc, 0).applyQuaternion(k.key.quaternion).add(k.key.position);
      k.band.position.copy(slot);
      if ((k.socket || !k.drag) && !k.tw && !k.drag) k.band.quaternion.identity(); else k.band.quaternion.copy(k.key.quaternion);
    }
    // LED bars, as on the board: lit in the record's colour while its layer plays, red when the key is wrong
    const lvl = Math.min(1, engine.rms() * 6);
    for (const l of leds) {
      const sp = spinners[l.rec], k = sp.occupant, rec = P.records[l.rec], layer = layerForRecord(rec.id);
      let on = 0, colr = rec.led;
      if (k && k.colour !== rec.id) { colr = '#ff0a00'; on = 0.3; }        // wrong key: the whole bar solid bright red
      else if (k && engine.isPlaying(layer.id)) {
        // as in DPI_2.ino, the bar shows the layer's volume; it breathes with the music
        const vol = engine.L[layer.id].volume, lit = Math.min(1, Math.max(0, vol * l.n - l.k));
        on = lit * (0.55 + 0.3 * lvl + 0.15 * Math.sin(t * 2.3 + l.bi));
      } else if (k) on = l.k === Math.floor(l.n / 2) ? 0.5 + 0.5 * Math.sin(t * 5) : 0;   // loading
      const wrong = colr === '#ff0a00'; l.m.color.set(wrong ? '#ff2a1a' : '#d9d4c8'); l.m.emissive.set(colr); l.glow.material.color.set(colr);
      l.m.emissiveIntensity = on * 4; l.glow.material.opacity = on * 0.9;
    }
    const sec = engine.t0 === null ? 0 : Math.floor(engine.offset());
    for (const co of coasters) {
      co.hov += ((hoverCoaster === co ? 1 : 0) - co.hov) * Math.min(1, dt * 10);
      co.g.position.y = co.baseY + 0.02 * co.hov; co.g.rotation.x = LEAN_ - 0.12 * co.hov;
      const want = co.hov > 0.5 ? co.colourT : co.greyT; if (co.topM.map !== want) { co.topM.map = want; co.topM.needsUpdate = true; }
    }
    teammates.frame(dt);
    if (cardDirty || sec !== lastSec) { drawCard(); cardDirty = false; lastSec = sec; }
  }

  // test hooks
  window.__proj = (v) => { const r = el.getBoundingClientRect(); const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * r.width + r.left, y: (1 - p.y) / 2 * r.height + r.top }; };
  window.__hoverCoaster = (i) => { hoverCoaster = coasters[i] || null; };
  window.__teammates = teammates;
  window.__play = { engine, keys, spinners, shuffle: () => shuffle(), clickCard: (btn) => { const f = guide.userData.face; const [x, y, w, h] = BTN[btn]; return window.__proj(f.localToWorld(new THREE.Vector3((x + w / 2) / CPX * CW - CW / 2, CH / 2 - (y + h / 2) / CPY * CH, 0))); }, seat: (colour, take, record) => seat(keys.find((k) => k.colour === colour && k.take === take), spinners.find((sp) => sp.r.id === record)), home: (colour, take) => home(keys.find((k) => k.colour === colour && k.take === take)) };

  /* ---------- sound after a page change: a browser lets sound start only after a click, and a click on the home page does not
     carry over to this page every time. The intro plays without it; the drums start with the first click anywhere, and until then
     a small note lies on the mat ("click anywhere for sound"). ---------- */
  let hint = null;
  const audioRunning = () => !!(window.Tone && window.Tone.context && window.Tone.context.state === 'running');
  function wake() {
    engine.unlock();
    // (a key seated before the first click was only noted: start every layer that should be playing)
    for (const l of LAYERS) { const sl = engine.L[l.id]; if (sl.present && !sl.on) engine.sync(sl); }
    if (hint) hint.gone = true;
  }
  window.addEventListener('pointerdown', wake, { capture: true });
  window.addEventListener('keydown', wake, { capture: true });
  function showHint() {
    if (hint || audioRunning()) return;
    const W = 1500, H = 200;
    const tex = canvasTex(W, H, (c, w) => {
      c.clearRect(0, 0, w, H); c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '800 80px system-ui, sans-serif'; if ('letterSpacing' in c) c.letterSpacing = '6px';
      c.fillText('CLICK ANYWHERE FOR SOUND', w / 2, H / 2 + 4);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66 * H / W), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, 0.0032, 0.82); mesh.renderOrder = 5;
    C.scene.add(mesh);
    hint = { mesh, gone: false, t0: performance.now() };
  }
  function hintFrame() {
    if (!hint) return;
    if (!hint.gone && audioRunning()) hint.gone = true;      // sound came without a click (the browser let it)
    const age = (performance.now() - hint.t0) / 1000;
    const target = hint.gone ? 0 : 0.5 + 0.2 * Math.sin(age * 2.6);
    const m = hint.mesh.material; m.opacity += (target - m.opacity) * 0.12;
    if (hint.gone && m.opacity < 0.01) { C.scene.remove(hint.mesh); m.map.dispose(); m.dispose(); hint.mesh.geometry.dispose(); hint = null; }
  }

  /* ---------- intro (?intro=1): the home-mat moment. One record lies on the bare mat; click it, the camera dives in,
     the board grows up out of the mat round it, and the record flies into its socket and starts the drums ---------- */
  let intro = null;
  if (new URLSearchParams(location.search).get('intro') !== '0'   /* portfolio: on unless ?intro=0 */) {
    const { scene } = C;
    const ySp = spinners.find((sp2) => sp2.r.id === 'yellow');
    // A clean, inviting record of its own: the yellow record's vinyl, and a label with the project's name printed round it
    // and a play mark in the middle (none of the board's screws, socket or rim).
    const RR = ySp.r.d / 2, BIG = 2.0;                       // it lies on the mat 45% larger, and shrinks to size as it flies in
    const vinyl = ySp.g.getObjectByName('Vinyl');
    const lone = new THREE.Group(); lone.name = 'IntroRecord';
    const disc = new THREE.Mesh(vinyl.geometry, vinyl.material); lone.add(disc);
    const labelT = canvasTex(1600, 1600, (c, w) => {
      const m = w / 2;
      c.fillStyle = ySp.r.key.color; c.beginPath(); c.arc(m, m, m - 2, 0, Math.PI * 2); c.fill();
      // the title curved round the label like a real record: "THE SOUND YOU'VE" over the top, "BEEN WEARING" under the
      // bottom (both read upright). The letters are as tall as the yellow band allows and squeezed sideways to fit the arc.
      const H = m * 0.34, rMid = m * 0.73, px = H / 0.72;     // cap height fills the band from about 0.56 to 0.9 of the label
      c.fillStyle = '#16204a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${px}px system-ui, sans-serif`;
      const arc = (txt, top, span) => {
        const chars = [...txt], ws = chars.map((ch) => c.measureText(ch).width), tot = ws.reduce((x, y) => x + y, 0);
        const sx = Math.min(1, span * rMid / tot), dir = top ? 1 : -1;   // squeeze factor so the line fits its arc
        let ang = (top ? -Math.PI / 2 : Math.PI / 2) - dir * (tot * sx) / rMid / 2;
        chars.forEach((ch, i) => { const da = ws[i] * sx / rMid, mid = ang + dir * da / 2;
          c.save(); c.translate(m + Math.cos(mid) * rMid, m + Math.sin(mid) * rMid); c.rotate(mid + dir * Math.PI / 2); c.scale(sx, 1); c.fillText(ch, 0, top ? 0 : 0); c.restore(); ang += dir * da; });
      };
      arc("THE SOUND YOU'VE", true, 2.9);
      arc('BEEN WEARING', false, 2.5);
      // the play mark in the middle
      const ts = m * 0.13; c.beginPath(); c.moveTo(m - ts * 0.75, m - ts); c.lineTo(m + ts * 1.05, m); c.lineTo(m - ts * 0.75, m + ts); c.closePath(); c.fill();
    });
    const label = new THREE.Mesh(new THREE.CircleGeometry(RR * 0.58, 128), new THREE.MeshStandardMaterial({ map: labelT, roughness: .55 }));
    label.position.z = 0.0026; lone.add(label);
    lone.scale.setScalar(BIG);
    lone.position.set(0, 0.004, 0.5); lone.rotation.set(-Math.PI / 2, 0, 0); scene.add(lone);
    lone.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });   // never darkened by the board's shadow as it flies
    // round text that shows up round the record when you hover it, so people know what it is
    const tagT = canvasTex(1600, 1600, (c, w) => {
      const m = w / 2, rad = m * 0.84, txt = 'A PHYSICAL INTERACTION PROJECT  ·  CLICK TO PLAY  ·  ';
      c.clearRect(0, 0, w, w); c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let size = 120; c.font = `800 ${size}px system-ui, sans-serif`;
      const len = (t) => [...t].reduce((acc, ch) => acc + c.measureText(ch).width, 0);
      size *= (Math.PI * 2 * rad) / len(txt); c.font = `800 ${size}px system-ui, sans-serif`;     // exactly one lap
      let ang = -Math.PI / 2;
      for (const ch of txt) { const wd = c.measureText(ch).width, da = wd / rad; c.save(); c.translate(m + Math.cos(ang + da / 2) * rad, m + Math.sin(ang + da / 2) * rad); c.rotate(ang + da / 2 + Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); ang += da; }
    });
    const ringSize = (RR * BIG + 0.085) * 2 / 0.92;
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(ringSize, ringSize), new THREE.MeshBasicMaterial({ map: tagT, transparent: true, depthWrite: false, opacity: 0 }));
    tag.rotation.x = -Math.PI / 2; tag.position.set(0, 0.003, 0.5); scene.add(tag);
    const play0 = { pos: camera.position.clone(), tgt: controls.target.clone() };
    const start = { pos: new THREE.Vector3(0, 0.86, 0.98), tgt: new THREE.Vector3(0, 0, 0.5) };
    // Arriving from the home mat's record (index.html's head script left window.__dive): this scene opens on the shot the home
    // camera ended on, so the cross-fade from its last frame reads as the same shot. That is straight over the record
    // (9 degrees off vertical, as the home camera ends), the record centred and DIVE_FRAC of the window's height across
    // (the same number as RECORD_DIVE_FRAC in lib/mat/soundRecord.ts). The record is already turning, and the intro starts by itself.
    const dive = window.__dive || null, DIVE_FRAC = 0.7, DIVE_PITCH = 9 * Math.PI / 180;
    if (dive && dive.frame) {
      const away = (RR * BIG * 2) / (DIVE_FRAC * 2 * Math.tan(camera.fov * Math.PI / 360));
      start.pos.set(0, away * Math.cos(DIVE_PITCH), 0.5 + away * Math.sin(DIVE_PITCH));
    }
    camera.position.copy(start.pos); controls.target.copy(start.tgt); controls.enabled = false; controls.update();
    board.visible = false; ySp.g.visible = false; ySp.angle = 0;   // lands upright
    // props that arrive one after another (about 100 ms apart): the board rises first, then the rack, guide card, plaque, DPI block, name tent
    // the ripple from the record reaches each prop in turn; a prop pops up the moment the ripple's front passes under it
    const RIP0 = 0.12, RIPV = 0.75, RIPT = 0.12;                 // start radius (m), speed (m/s), start time (s)
    const ripAt = (x, z) => RIPT + Math.max(0, Math.hypot(x - 0, z - 0.5) - RIP0) / RIPV;
    const popGroups = ['KeyRack', 'GuideCard', 'AboutPlaque', 'CourseBlock', 'NameCard', 'Teammates'].map((n) => { const o = board.getObjectByName(n); if (!o) return null; const wp = new THREE.Vector3(); o.getWorldPosition(wp); return { o, at: ripAt(wp.x, wp.z) }; }).filter(Boolean);
    const boardAt = ripAt(0, 0.08);
    // the ripple itself: three thin bright rings and a soft wide one, spreading over the mat from under the record
    const ripples = [0, 0.16, 0.32].map((delay, i) => { const m2 = new THREE.Mesh(new THREE.RingGeometry(i === 0 ? 0.9 : 0.975, 1, 160), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      m2.rotation.x = -Math.PI / 2; m2.position.set(0, 0.0025, 0.5); m2.visible = false; scene.add(m2); return { m: m2, delay, strength: [0.55, 0.8, 0.45][i] }; });
    popGroups.forEach((g) => { g.o.visible = false; });
    // keys and wristbands sit on the rack, so they pop with it: scaled and moved about the rack's foot so they stay glued to it
    const rackKeys = board.children.filter((c) => /^Key_/.test(c.name)).map((o) => ({ o, p0: o.position.clone(), s0: o.scale.clone(), vis: o.visible }));
    rackKeys.forEach((k) => { k.o.visible = false; });
    const camMid = start.pos.clone().lerp(play0.pos, 0.5); camMid.y *= 0.92;
    const camCurve = new THREE.CatmullRomCurve3([start.pos.clone(), camMid, play0.pos.clone()], false, 'centripetal');
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    intro = { t0: null, hov: 0, over: false, ang: 0, big: BIG, lone, tag, ySp, spin: 0.4, play0, start, from: new THREE.Vector3(), q0: lone.quaternion.clone(), popGroups, rackKeys, camCurve, reduce, ripples, boardAt, RIP0, RIPV, RIPT, flat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), zq: new THREE.Quaternion(), c1: new THREE.Vector3(), c2: new THREE.Vector3(), p3: new THREE.Vector3(), tmp: new THREE.Vector3() };
    const pickLone = (e) => { setNdc(e); ray.setFromCamera(ndc, camera); return ray.intersectObject(lone, true).length > 0; };
    // while the intro runs, it gets every click first (window capture runs before the canvas's own handlers)
    window.addEventListener('pointerdown', (e) => {
      if (!intro) return;
      e.stopPropagation(); e.preventDefault();
      if (intro.t0 === null && pickLone(e)) { engine.unlock(); intro.t0 = performance.now(); }
    }, { capture: true });
    window.addEventListener('pointermove', (e) => { if (intro && intro.t0 === null) { intro.over = pickLone(e); el.style.cursor = intro.over ? 'pointer' : ''; } }, { capture: true });
  }
  const easeIO = (x) => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const easeBack = (x) => { x = Math.min(1, Math.max(0, x)); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function introFrame(dt) {
    const I = intro, L = I.lone;
    // idle: a slow turn. Hovered or clicked: the title turns upright and stays readable (no fast spin while it flies)
    I.spin += ((I.t0 === null ? (I.over ? 0 : 0.12) : 0) - I.spin) * Math.min(1, dt * 2);
    if (I.over || I.t0 !== null) { const tgt = Math.round(I.ang / (Math.PI * 2)) * Math.PI * 2; I.ang += (tgt - I.ang) * Math.min(1, dt * (window.__dive ? 2 : 5)); }   // title turns upright to be read
    else I.ang += I.spin * dt;
    // after the click it spins: three full turns that ease out exactly as it lands, so the title ends upright
    const spinA = I.t0 === null ? 0 : -Math.PI * 6 * (1 - Math.pow(1 - Math.min(1, (performance.now() - I.t0) / 2300), 3));
    I.spinA = spinA;
    if (!I.flying) L.rotation.set(-Math.PI / 2, 0, I.ang + spinA);
    // the round title fades in, grows a little and turns slowly while the record is hovered
    I.hov += ((I.t0 === null && I.over ? 1 : 0) - I.hov) * Math.min(1, dt * 6);
    if (I.t0 === null) { I.tag.material.opacity = I.hov; I.tag.scale.setScalar(0.9 + 0.1 * I.hov); I.tag.rotateZ(-0.15 * dt); L.position.y = 0.004 + 0.012 * I.hov; controls.update(); return; }
    const u = (performance.now() - I.t0) / 1000, DONE = 2.5;
    const cl = (x) => Math.min(1, Math.max(0, x));
    const outBack = (x, c1) => { x = cl(x); const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };   // soft overshoot, ends at 1
    const smoother = (x) => { x = cl(x); return x * x * x * (x * (x * 6 - 15) + 10); };
    const leap = (x, peak, from = -0.06) => {
      if (x <= 0) return from;
      if (x < 1) { const a = 1 - x; return from * a * a + 4 * peak * x * a; }   // a parabola-like throw from `from` up through the peak to 0
      const b = x - 1; return 0.02 * Math.exp(-b * 9) * Math.abs(Math.sin(b * 14));                                   // two small bounces
    };
    const finish = () => {
      C.scene.remove(L); C.scene.remove(I.tag); I.ripples.forEach((r) => C.scene.remove(r.m)); I.ySp.g.visible = true;
      board.visible = true; board.position.y = 0;
      I.popGroups.forEach((g) => { g.o.visible = true; g.o.scale.set(1, 1, 1); g.o.position.y = 0; });
      I.rackKeys.forEach((k) => { k.o.visible = k.vis; k.o.position.copy(k.p0); k.o.scale.copy(k.s0); });
      camera.position.copy(I.play0.pos); controls.target.copy(I.play0.tgt); controls.enabled = true; controls.update();
      intro = null;
      seat(keys.find((k) => k.colour === 'yellow' && k.take === 0), I.ySp);     // its key drops in and the drums start
      if (window.__dive) showHint();
    };
    if (I.reduce) {      // reduced motion: no move, a short fade through the colour of the mat, then straight to the end state
      if (!I.fade) { const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#2a52c9;opacity:0;pointer-events:none;z-index:50;transition:opacity .15s linear'; document.body.appendChild(f); I.fade = f; requestAnimationFrame(() => { f.style.opacity = '1'; }); }
      if (u > 0.17 && !I.faded) { I.faded = true; finish(); I.fade.style.transition = 'opacity .25s linear'; I.fade.style.opacity = '0'; setTimeout(() => I.fade.remove(), 320); }
      return;
    }
    I.tag.material.opacity = Math.max(0, I.hov - u * 3);
    // one continuous camera move: a single curve, one easing, no kink, ends at the play pose
    const k = smoother(u / 2.3);
    camera.position.copy(I.camCurve.getPoint(k)); controls.target.lerpVectors(I.start.tgt, I.play0.tgt, k);
    // the board rises from under the mat with a small settle bounce
    if (u > I.boardAt) { board.visible = true; board.position.y = leap((u - I.boardAt) / 0.8, 0.1, -0.5); }
    // the ripple rings spread and fade
    I.ripples.forEach((r) => { const t2 = u - I.RIPT - r.delay; r.m.visible = t2 > 0; if (t2 <= 0) return;
      const rad = I.RIP0 + I.RIPV * t2; r.m.scale.setScalar(rad); r.m.material.opacity = r.strength * Math.min(1, t2 * 8) * Math.max(0, 1 - rad / 1.5); });
    // the rack, guide card, plaque, DPI block and name tent pop in one after another (uniform scale, soft overshoot, a little rise)
    // each prop is thrown up by the ripple as it passes: it leaps out of the mat, tumbles a little, and lands with a bounce
    I.popGroups.forEach((g) => {
      const x = (u - g.at) / 0.7; g.o.visible = x > 0;
      if (g.rx === undefined) { g.rx = g.o.rotation.x; g.rz = g.o.rotation.z; g.spin = (g.o.name.length % 2 ? 1 : -1) * 0.35; }
      if (x <= 0) return;
      g.o.position.y = leap(x, 0.16);
      const tilt = x < 1 ? (1 - x) * (1 - x) : 0;                       // tumbles on the way up, level by the time it lands
      if (g.o.name !== 'KeyRack') { g.o.rotation.x = g.rx + g.spin * 0.5 * tilt; g.o.rotation.z = g.rz - g.spin * tilt; }
      g.o.scale.setScalar(0.7 + 0.3 * outBack(x * 1.6, 1.4));
    });
    const rg = I.popGroups.find((g) => g.o.name === 'KeyRack');
    if (rg) {
      const x = (u - rg.at) / 0.7, sc = 0.7 + 0.3 * outBack(x * 1.6, 1.4), o = rg.o.position;
      I.rackKeys.forEach((kk) => {
        kk.o.visible = x > 0 && kk.vis; if (x <= 0) return;
        kk.o.scale.copy(kk.s0).multiplyScalar(sc);
        kk.o.position.set(o.x + sc * (kk.p0.x - o.x), kk.p0.y * sc + o.y, o.z + sc * (kk.p0.z - o.z));
      });
    }
    // the record lifts off the mat (0-0.5 s), waits a beat, then flies one arc into the yellow socket (1.1-2.1 s) and clicks home
    if (u < 1.1) L.position.y = 0.004 + 0.17 * ease(u / 0.45) + 0.006 * Math.sin(u * 5) * smoother(u / 0.5);   // lifts clear of the props popping up round it
    if (u > 1.1) {
      const end = I.p3.set(I.ySp.r.x, I.ySp.r.y, P.recordZ);
      if (!I.flying) { I.flying = true; I.from.copy(L.position); I.q0.copy(L.quaternion); I.c1.copy(I.from).add(I.tmp.set(0, 0.22, 0.05)); I.c2.copy(end).add(I.tmp.set(0, 0.07, 0.28)); }
      const f = smoother((u - 1.1) / 1.0), m = 1 - f, hover = 0.03 * (1 - ease((u - 2.05) / 0.3));       // arrives just in front of the socket, then presses in
      // cubic bezier from the lifted spot over a high arc into the socket
      L.position.set(
        m * m * m * I.from.x + 3 * m * m * f * I.c1.x + 3 * m * f * f * I.c2.x + f * f * f * end.x,
        m * m * m * I.from.y + 3 * m * m * f * I.c1.y + 3 * m * f * f * I.c2.y + f * f * f * end.y,
        m * m * m * I.from.z + 3 * m * m * f * I.c1.z + 3 * m * f * f * I.c2.z + f * f * f * end.z + hover);
      L.quaternion.slerpQuaternions(I.flat, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, I.ySp.angle)), f).multiply(I.zq.setFromAxisAngle(new THREE.Vector3(0, 0, 1), I.spinA));
      const click = u > 2.05 ? 0.035 * Math.sin(cl((u - 2.05) / 0.3) * Math.PI) : 0;          // tiny squash as it seats
      L.scale.setScalar((I.big + (1 - I.big) * f) * (1 + click));
    }
    controls.update();
    if (u > DONE) finish();
  }
  // Arrived from the home mat's record: once this scene's own first frame is drawn, the cover from the home page (index.html) fades
  // out over it and the intro starts by itself, the record already turning as it was in the last frame the home page drew.
  let begun = false;
  function beginFromHome() {
    const d = window.__dive;
    if (!intro) { window.__diveFade && window.__diveFade(); return; }
    intro.ang = -(d.frame ? d.ang || 0 : 0); intro.spin = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!intro) return;
      try { engine.unlock(); } catch (e) { /* needs a click: wake() on the first one */ }
      // The cover is a still frame. While it fades (150 ms) this record holds the angle that frame has, so the two are the
      // same picture and the title never shows twice; then it carries on turning from there.
      window.__diveFade && window.__diveFade();
      setTimeout(() => { if (intro && intro.t0 === null) intro.t0 = performance.now(); }, 160);
    }));
  }
  return { frame: (t) => {
    if (intro) introFrame(Math.min(0.05, (performance.now() - (introFrame.last || performance.now())) / 1000));
    introFrame.last = performance.now(); frame(t); hintFrame();
    if (!begun && window.__dive) { begun = true; beginFromHome(); }
  } };
}
