// "The Sound You're Wearing" (Northwestern DPI, Jun 2026) as a toy-like object on Adi's blue cutting mat.
// Plain three.js. Every board material is MeshStandardMaterial so the GLB export carries the look;
// only the mat (a ported copy of the portfolio's cutting-mat shader) and LED glow sprites are scene-only.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const q = new URLSearchParams(location.search);
const VIEW = q.get('view') || 'hero';          // hero | 01 | 02 | 03 | front | glb
const FREEZE = q.has('t') ? parseFloat(q.get('t')) : null;
const KEYS = q.get('keys') !== '0';        // keys=0: the empty board, every socket open
const DEMO = q.has('demo');                // demo: keys slide in one by one and their records start turning
const PLAY = q.get('play') !== '0';   // (portfolio: on unless ?play=0)                // play: a rack of 15 keys (5 colours x 3 takes) to drag into the records, with the real stems
const LOOP = 13;
const P = await (await fetch('./params.json')).json();
const CAMS = await (await fetch('./cameras.json')).json();
const B = P.board;

/* ---------------- renderer, scene ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(q.has("dpr") ? +q.get("dpr") : 2);   // always draw at 2x: on a 1x screen this supersamples, so thin edges (coils, grid, LED dots) stay smooth
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.prepend(renderer.domElement);
const W0 = q.has('w') ? +q.get('w') : innerWidth, H0 = q.has('h') ? +q.get('h') : innerHeight;
renderer.setSize(W0, H0);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080b1a');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

// soft studio light: a big sky fill (the blue mat bounces blue up), one warm key from upper right-front
scene.add(new THREE.HemisphereLight('#ffffff', '#8aa6ee', 2.1));
const key = new THREE.DirectionalLight('#fff4e2', 2.1);
key.position.set(1.0, 2.2, -0.35);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 9; key.shadow.blurSamples = 20;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.002;
Object.assign(key.shadow.camera, { left: -0.9, right: 0.9, top: 0.9, bottom: -0.9, near: 0.5, far: 5 });
scene.add(key);
const rim = new THREE.DirectionalLight('#cfe0ff', 0.6); rim.position.set(-1.5, 1.2, -1.4); scene.add(rim);

/* ---------------- the mat (port of the portfolio's cuttingMat shader, plus a drifting window light) ---------------- */
const matU = { uTime: { value: 0 }, uCell: { value: 0.08 } };
const mat = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShaderMaterial({
  uniforms: matU,
  vertexShader: `varying vec2 vP; void main(){ vec4 w = modelMatrix*vec4(position,1.); vP = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `
  uniform float uTime; uniform float uCell; varying vec2 vP;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float nearestLine(float c){ return abs(fract(c+.5)-.5); }
  float printed(float c, float wide){ float w=max(wide, fwidth(c)*1.1); return 1.-smoothstep(w*.5-fwidth(c)*.6, w*.5+fwidth(c)*.6, nearestLine(c)); }
  void main(){
    vec2 g = vP / uCell + vec2(.5);
    float px = 1./24.;
    vec3 col = vec3(0.106, 0.384, 0.831);
    col *= 1. + (hash(floor(g*24.)) - .5)*.035;
    float thin = max(printed(g.x-.5, px), printed(g.y-.5, px));
    vec2 big = (g-2.5)/5.;
    float major = max(printed(big.x, px/5.), printed(big.y, px/5.));
    float close = smoothstep(46., 86., 1./max(fwidth(g.x),1e-5));
    float fine = max(printed((g.x-.5)*4., px*2.), printed((g.y-.5)*4., px*2.))*close;
    col = mix(col, vec3(1.), fine*.05);
    col = mix(col, vec3(1.), thin*.13);
    col = mix(col, vec3(1.), major*.3);
    vec2 c = (fract(big+.5)-.5)*5.;
    float glow = .35*(1.-smoothstep(0., 7.*px, length(c)));
    float aa = fwidth(g.x);
    float armX = (1.-smoothstep(.65*px, .65*px+aa, abs(c.y)))*(1.-smoothstep(5.5*px, 5.5*px+aa, abs(c.x)));
    float armY = (1.-smoothstep(.65*px, .65*px+aa, abs(c.x)))*(1.-smoothstep(5.5*px, 5.5*px+aa, abs(c.y)));
    col = mix(col, vec3(1.), glow);
    col = mix(col, vec3(1.), max(armX,armY)*.75);
    // window light: soft panes along a diagonal, leaf shade drifting through them, a vignette (cut down from SUN_FRAGMENT)
    vec2 dir = normalize(vec2(1., -.58));
    float a = dot(vP, dir), b = dot(vP, vec2(-dir.y, dir.x));
    float pane = smoothstep(.0, .12, abs(fract(b*.55+.2)-.5)-.06);
    float leaves = noise(vP*2.2 + vec2(uTime*.05, sin(uTime*.3)*.08)) * noise(vP*4.5 - vec2(uTime*.04, 0.));
    float sun = pane * (1. - .5*smoothstep(.2, .55, leaves));
    float vig = 1. - smoothstep(1.2, 4.5, length(vP - vec2(.2, .3)));
    float s = clamp(.5 + sun*.1 - (1.-sun)*.035 - (1.-vig)*.2, 0., 1.);
    vec3 sunC = vec3(s) + vec3(-.02, .01, .03)*sun;
    col = mix(2.*col*sunC, 1.-2.*(1.-col)*(1.-sunC), step(.5, sunC));
    // the mat has edges; the dark dotted desk shows round it
    vec2 q = abs(vP - vec2(0., .15)) - vec2(3.6, 2.4) + .08;
    float edge = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - .08;
    float ea = fwidth(edge);
    vec3 desk = vec3(.031,.043,.102);
    vec2 dt = fract(vP / (uCell*9./24.)) - .5;
    desk = mix(desk, vec3(.894,.91,.31), .3*(1.-smoothstep(.07,.11,length(dt))));
    desk *= 1. - .55*(1.-smoothstep(0., .18, edge));
    col = mix(col, vec3(1.), .22*(1.-smoothstep(0., .006, abs(edge + .004))));
    col = mix(col, desk, smoothstep(-ea, ea, edge));
    gl_FragColor = vec4(col, 1.);
  }`,
}));
mat.rotation.x = -Math.PI / 2;
mat.userData.sceneOnly = true;
scene.add(mat);
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: '#02092c', opacity: 0.55 }));
shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.position.y = 0.0005; shadowCatcher.receiveShadow = true;
shadowCatcher.userData.sceneOnly = true;
scene.add(shadowCatcher);

/* ---------------- canvas textures ---------------- */
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; return t;
}
// birch ply face: warm, gently figured, low contrast so it reads as a toy, not a photo
const plyFace = canvasTex(2048, 1024, (g, w, h) => {
  const r = rng(11);
  g.fillStyle = '#e8c899'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {           // broad soft bands of figure
    const y = r() * h, th = 20 + r() * 90;
    g.fillStyle = `rgba(${r() < .5 ? '196,150,96' : '250,226,186'},${.10 + r() * .12})`;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 64) g.lineTo(x, y + Math.sin(x / 300 + i) * 14 + Math.sin(x / 90 + i * 3) * 4);
    for (let x = w; x >= 0; x -= 64) g.lineTo(x, y + th + Math.sin(x / 280 + i) * 12);
    g.closePath(); g.fill();
  }
  for (let i = 0; i < 260; i++) {          // fine grain lines
    const y = r() * h; g.strokeStyle = `rgba(160,112,62,${.05 + r() * .09})`; g.lineWidth = .6 + r() * 1.4;
    g.beginPath(); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 210 + i) * 6 + Math.sin(x / 47 + i) * 1.5); g.stroke();
  }
  for (let i = 0; i < 7; i++) {            // a few cathedral ovals, as in the back photo
    const cx = r() * w, cy = r() * h, rx = 60 + r() * 160, ry = 10 + r() * 22;
    for (let k = 0; k < 5; k++) { g.strokeStyle = `rgba(170,120,70,${.12 - k * .02})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(cx, cy, rx + k * 14, ry + k * 5, 0, 0, Math.PI * 2); g.stroke(); }
  }
});
plyFace.wrapS = plyFace.wrapT = THREE.RepeatWrapping; plyFace.repeat.set(1, 2);
// ply edge: the stacked veneers that make plywood read as plywood
const plyEdge = canvasTex(16, 256, (g, w, h) => {
  const layers = ['#f1d6a8', '#c99b62', '#efd2a0', '#b98a55', '#f0d3a2', '#c79a61', '#eed09d', '#bd8e58', '#f1d6a8'];
  layers.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / layers.length, w, h / layers.length + 1); });
});
plyEdge.wrapS = plyEdge.wrapT = THREE.RepeatWrapping;

function vinylTex(seed) {
  return canvasTex(1024, 1024, (g, s) => {
    const c = s / 2, R = c - 2, r = rng(seed);
    g.fillStyle = '#1c1b1e'; g.fillRect(0, 0, s, s);
    for (let rr = R * .45; rr < R * .955; rr += 1.6) { g.strokeStyle = r() < .5 ? `rgba(255,248,236,${.02 + r() * .035})` : `rgba(0,0,0,${.08 + r() * .1})`; g.lineWidth = .9; g.beginPath(); g.arc(c, c, rr, 0, Math.PI * 2); g.stroke(); }
    for (const at of [.56, .67, .79, .88]) { g.strokeStyle = '#141316'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, R * at, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = 'rgba(255,248,236,.07)'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, R * .985, 0, Math.PI * 2); g.stroke();
    for (const [r0, r1, from, span, a] of [[.6, .66, .4, 2.2, .05], [.8, .87, 3.4, 1.7, .045]]) for (let k = 0; k < 24; k++) {
      const t0 = from + span * k / 24, w = Math.sin(Math.PI * (k + .5) / 24);
      g.strokeStyle = `rgba(255,246,230,${a * w})`; g.lineWidth = (r1 - r0) * R; g.beginPath(); g.arc(c, c, R * (r0 + r1) / 2, t0, t0 + span / 24 + .01); g.stroke();
    }
    for (let i = 0; i < 60; i++) { const rr = R * (.47 + r() * .5), t = r() * Math.PI * 2; g.fillStyle = `rgba(255,246,230,${.1 + r() * .2})`; g.beginPath(); g.arc(c + Math.cos(t) * rr, c + Math.sin(t) * rr, .8 + r() * 1.4, 0, Math.PI * 2); g.fill(); }
  });
}
function labelTex(color, seed) {
  // the record's centre label: a plain circle in its key's colour (how a key is matched to its record); no print, no text
  return canvasTex(512, 512, (g, s) => {
    const c = s / 2, r = rng(seed);
    g.fillStyle = color; g.beginPath(); g.arc(c, c, c - 2, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 4000; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.05)'; g.fillRect(r() * s, r() * s, 1.3, 1.3); }
  });
}
const noteTex = canvasTex(512, 512, (g, s) => {
  g.fillStyle = P.note.color; g.fillRect(0, 0, s, s);
  g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, s, 40);
  g.fillStyle = '#1d1a18'; g.font = 'italic 600 74px "Bradley Hand", "Marker Felt", cursive'; g.textAlign = 'center';
  g.fillText('Rotate to', s / 2, 120); g.fillText('increase', s / 2 - 10, 330); g.fillText('volume', s / 2 - 10, 430);
  g.strokeStyle = '#1d1a18'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.arc(s / 2, 250, 70, -0.25 * Math.PI, -0.95 * Math.PI, true); g.stroke();
  g.beginPath(); g.moveTo(s / 2 - 85, 210); g.lineTo(s / 2 - 70, 250); g.lineTo(s / 2 - 35, 228); g.stroke();
});

/* ---------------- materials ---------------- */
const M = {
  ply: new THREE.MeshStandardMaterial({ map: plyFace, roughness: .82, metalness: 0 }),
  plyEdge: new THREE.MeshStandardMaterial({ map: plyEdge, roughness: .85 }),
  pla: new THREE.MeshStandardMaterial({ color: '#2f7fe6', roughness: .48 }),       // the 3D-printed blue
  vinylSide: new THREE.MeshStandardMaterial({ color: '#141316', roughness: .35 }),
  screw: new THREE.MeshStandardMaterial({ color: '#c9ccd2', roughness: .3, metalness: .8 }),
  bar: new THREE.MeshStandardMaterial({ color: '#f6f3ec', roughness: .3, transparent: true, opacity: .93, emissive: '#ffffff', emissiveIntensity: .06 }),
  pcb: new THREE.MeshStandardMaterial({ color: '#c3181f', roughness: .55 }),
  chip: new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: .5 }),
  note: new THREE.MeshStandardMaterial({ map: noteTex, roughness: .9 }),
  bore: new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, '#050506'); gr.addColorStop(.7, '#0b0b0d'); gr.addColorStop(.9, '#2a2a30'); gr.addColorStop(1, '#3a3a42'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }), roughness: .9 }),
  burnt: new THREE.MeshStandardMaterial({ color: '#4a2716', roughness: .9 }),
  ring: new THREE.MeshStandardMaterial({ color: '#d4d6dc', roughness: .25, metalness: .9 }),
  coil: new THREE.MeshStandardMaterial({ color: '#141416', roughness: .3 }),
  shaftBlack: new THREE.MeshStandardMaterial({ color: '#1d1d20', roughness: .55 }),
};

/* ---------------- geometry helpers ---------------- */
const archY = (x) => B.sideH + (B.centerH - B.sideH) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / (B.W / 2), B.archPower)), 1 / B.archPower);
function panelShape() {
  const s = new THREE.Shape(), hw = B.W / 2;
  s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, B.sideH);
  for (let i = 1; i <= 96; i++) { const x = hw - (i / 96) * B.W; s.lineTo(x, archY(x)); }
  s.lineTo(-hw, 0);
  return s;
}
function slab(shape, T, bevel = 0.0025) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: T - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -(T - 2 * bevel) - bevel);   // front face at z = 0, back at z = -T
  return g;
}
function gearShape(teeth, rOut, rRoot, holeR = 0) {
  const s = new THREE.Shape(), n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, ph = i % 4, r = (ph === 1 || ph === 2) ? rOut : rRoot;
    const aa = a + (ph === 1 ? .12 : ph === 2 ? -.12 : 0) * (Math.PI * 2 / teeth);
    i ? s.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : s.moveTo(Math.cos(aa) * r, Math.sin(aa) * r);
  }
  if (holeR) { const h = new THREE.Path(); h.absarc(0, 0, holeR, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}
const cyl = (r, len, mat, seg = 48) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.geometry.rotateX(Math.PI / 2); return m; };
const shadowAll = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

/* ---------------- the board ---------------- */
const board = new THREE.Group(); board.name = 'SoundYoureWearing_Board';
const panel = new THREE.Mesh(slab(panelShape(), B.T, 0.0045), [M.ply, M.plyEdge]);
panel.name = 'PlywoodPanel';
// ExtrudeGeometry side UVs run along the outline (u) and through the thickness (v): scale v so one ply stack spans T
{ const uv = panel.geometry.attributes.uv, pos = panel.geometry.attributes.position;
  for (const grp of panel.geometry.groups) if (grp.materialIndex === 1) for (let i = grp.start; i < grp.start + grp.count; i++) {
    const vi = panel.geometry.index ? panel.geometry.index.getX(i) : i; uv.setY(vi, (pos.getZ(vi) + B.T) / B.T);
  } }
board.add(panel);

// feet: one ply gusset at each end, the panel standing in it (triangle in front, a shorter brace behind)
{ const F = P.feet;
  for (const side of [-1, 1]) {
    const s = new THREE.Shape();
    s.moveTo(F.frontDepth, 0); s.lineTo(0, F.frontH); s.lineTo(-B.T, F.frontH); s.lineTo(-B.T, F.backH);
    s.lineTo(-B.T - F.backDepth, F.backH * .86); s.lineTo(-B.T - F.backDepth, 0); s.lineTo(F.frontDepth, 0);
    const g = slab(s, B.T, 0.0025); g.rotateY(-Math.PI / 2);
    const foot = new THREE.Mesh(g, [M.ply, M.plyEdge]); foot.name = side < 0 ? 'FootLeft' : 'FootRight';
    foot.position.x = side * (B.W / 2 - F.inset) - B.T / 2;
    board.add(foot);
  } }

// records: each spins on a printed hub that runs through the panel to a blue housing on the back
const spinners = [], leds = [];
const recById = {};
P.records.forEach((r, i) => {
  const R = r.d / 2, th = 0.0045, z = P.recordZ;
  const unit = new THREE.Group(); unit.name = `Record_${r.id}`; unit.position.set(r.x, r.y, 0);
  board.add(unit);
  // hub cylinder through the board
  const hub = cyl(0.021, z + B.T + 0.05, M.pla); hub.name = 'HubCylinder'; hub.position.z = (z - B.T - 0.05) / 2; unit.add(hub);
  // big gear on the hub (mostly hidden behind the record) and the small encoder gear that peeks out on the left
  const big = new THREE.Mesh(slab(gearShape(28, 0.072, 0.066, 0.02), 0.006, 0.0012), M.pla); big.position.z = 0.016; big.name = 'HubGear'; unit.add(big);
  const small = new THREE.Mesh(slab(gearShape(11, 0.03, 0.024, 0.004), 0.006, 0.0012), M.pla); small.name = 'EncoderGear';
  const ga = Math.PI * 1.03; small.position.set(Math.cos(ga) * 0.098, Math.sin(ga) * 0.098, 0.016); unit.add(small);
  const encShaft = cyl(0.005, 0.016 + B.T + 0.02, M.chip, 16); encShaft.position.set(small.position.x, small.position.y, (0.016 - B.T - 0.02) / 2 + 0.004); 
  // the record itself (spins), with its label, four screws and the hub face
  const spin = new THREE.Group(); spin.position.z = z; unit.add(spin);
  const vinylTop = new THREE.MeshStandardMaterial({ map: vinylTex(31 + i), roughness: .32, metalness: .05 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, th, 128), [M.vinylSide, vinylTop, M.vinylSide]);
  disc.geometry.rotateX(Math.PI / 2); disc.name = 'Vinyl'; spin.add(disc);
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, sc = cyl(0.0042, 0.003, M.screw, 16); sc.position.set(Math.cos(a) * R * .62, Math.sin(a) * R * .62, th / 2 + .001); spin.add(sc); }
  // the socket: an open hole in the middle of the record where a key's shaft drops in (blue hub rim, dark bore)
  const label = new THREE.Mesh(new THREE.RingGeometry(0.0172, R * .54, 96, 1), new THREE.MeshStandardMaterial({ map: labelTex(r.key.color, 5 + i), roughness: .72 }));
  label.position.z = th / 2 + 0.0003; label.name = 'Label'; spin.add(label);
  const bore = new THREE.Mesh(new THREE.CircleGeometry(0.0175, 48), M.bore); bore.position.z = th / 2 + 0.0004; bore.name = 'Socket'; spin.add(bore);
  const rimG = new THREE.TorusGeometry(0.0205, 0.0032, 12, 48); const rimM = new THREE.Mesh(rimG, M.pla); rimM.position.z = th / 2 + 0.0008; rimM.scale.z = .5; rimM.name = 'SocketRim'; spin.add(rimM);
  spinners.push({ g: spin, unit, r, i, th, speed: (i % 2 ? -1 : 1) * (0.22 + i * 0.04), phase: i * 1.3 });
  // back housing: square plate, round cup, and the red RFID reader board on its end
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.1, 0.007, 3, 0.004), M.pla); plate.position.z = -B.T - 0.0035; plate.name = 'BackHousingPlate'; unit.add(plate);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const sc = cyl(0.0035, 0.003, M.chip, 12); sc.position.set(sx * .041, sy * .041, -B.T - .0075); unit.add(sc); }
  const cup = cyl(0.042, 0.048, M.pla, 64); cup.position.set(-0.01, -0.01, -B.T - 0.007 - 0.024); cup.name = 'BackHousingCup'; unit.add(cup);
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.04, 0.0025, 2, 0.001), M.pcb); pcb.position.set(-0.004, -0.02, -B.T - 0.056); pcb.rotation.z = 0.3; pcb.name = 'RFIDReader'; unit.add(pcb);
  const ic = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.002), M.chip); ic.position.set(-0.004, -0.02, -B.T - 0.0582); ic.rotation.z = 0.3; unit.add(ic);
  recById[r.id] = r;
});


/* ---------------- the keys: painted ply shape + printed shaft + split ring + coil wristband ---------------- */
function keyOutline(kind, Rk, seed) {
  const r = rng(seed), pts = [], N = 220;
  let spikes = [];
  if (kind === 'burst' || kind === 'jag') {
    const n = kind === 'burst' ? 11 : 8;
    for (let k = 0; k < n; k++) spikes.push({ a: (k + (r() - .5) * .35) / n * Math.PI * 2, len: kind === 'burst' ? .72 + r() * .28 : .78 + r() * .22, w: kind === 'burst' ? .16 + r() * .08 : .22 + r() * .14 });
  }
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2; let f;
    if (kind === 'blob') f = .9 + .06 * Math.sin(3 * t + 1) + .04 * Math.sin(5 * t + .3);
    else if (kind === 'splat') f = .78 + .13 * Math.sin(5 * t + .5) + .07 * Math.sin(8 * t + 2) + .05 * Math.sin(13 * t + 1);
    else if (kind === 'fuzz') f = .86 + .09 * Math.abs(((t * 22 / (Math.PI * 2)) % 1) - .5) * 2 + .03 * Math.sin(3 * t);
    else if (kind === 'star') f = .5 + .5 * Math.pow(Math.abs(((t * 5 / (Math.PI * 2) + .75) % 1) * 2 - 1), 1.4) + .02 * Math.sin(11 * t + seed);
    else if (kind === 'cross') f = .66 + .3 * Math.pow(Math.abs(Math.cos(2 * t)), .7) + .03 * Math.sin(7 * t + seed);
    else {
      f = kind === 'burst' ? .5 : .52;
      for (const sp of spikes) { let d = Math.abs(((t - sp.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); const k = Math.max(0, 1 - d / sp.w); f = Math.max(f, (kind === 'burst' ? .5 : .52) + (sp.len - .5) * k * (kind === 'jag' ? (k > .5 ? 1 : .55 + .9 * k) : 1)); }
      f += .03 * Math.sin(17 * t + seed);
    }
    pts.push(new THREE.Vector2(Math.cos(t) * Rk * f, Math.sin(t) * Rk * f));
  }
  const sh = new THREE.Shape(pts);
  // the slot near the bottom that the split ring runs through
  const hole = new THREE.Path(), sy = -Rk * .42, hw = 0.0055, hh = 0.0028;
  hole.absarc(-hw, sy, hh, Math.PI / 2, Math.PI * 1.5, false); hole.lineTo(hw, sy - hh); hole.absarc(hw, sy, hh, -Math.PI / 2, Math.PI / 2, false); hole.lineTo(-hw, sy + hh);
  sh.holes.push(hole);
  return { sh, slotY: sy };
}
function paintTex(color, seed) {
  return canvasTex(256, 256, (g, s) => {
    const r = rng(seed), c = new THREE.Color(color);
    g.fillStyle = color; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 46; i++) {           // brush strokes: the paint on the real keys is streaky, lighter and darker
      const y = r() * s, light = r() < .5, a = .04 + r() * .07;
      g.strokeStyle = light ? `rgba(255,240,180,${a})` : `rgba(90,20,0,${a * .8})`; g.lineWidth = 3 + r() * 9;
      g.beginPath(); g.moveTo(-10, y); g.bezierCurveTo(s * .3, y + (r() - .5) * 20, s * .7, y + (r() - .5) * 20, s + 10, y + (r() - .5) * 10); g.stroke();
    }
  });
}
class CoilCurve extends THREE.Curve {
  constructor(top, len, wid, out, turns, rc) { super(); Object.assign(this, { top, len, wid, out, turns, rc }); }
  base(u) { const a = u * Math.PI * 2; return new THREE.Vector3(Math.sin(a) * this.wid, this.top - this.len / 2 + Math.cos(a) * this.len / 2, this.out * (1 - Math.cos(a)) / 2); }
  getPoint(u, v = new THREE.Vector3()) {
    const p = this.base(u), e = 1e-3, tan = this.base(Math.min(1, u + e)).sub(this.base(Math.max(0, u - e))).normalize();
    const n = new THREE.Vector3(0, 0, 1).cross(tan).normalize(); if (n.lengthSq() < .5) n.set(1, 0, 0); const b = tan.clone().cross(n);
    const a = u * this.turns * Math.PI * 2;
    return v.copy(p).addScaledVector(n, Math.cos(a) * this.rc).addScaledVector(b, Math.sin(a) * this.rc);
  }
}
const keys = [];
if (!PLAY) spinners.forEach((sp) => {
  const k = sp.r.key, Rk = k.size / 2, id = sp.r.id;
  const key = new THREE.Group(); key.name = `Key_${id}`;
  const { sh, slotY } = keyOutline(k.shape, Rk, 7 + sp.i * 13);
  const paint = new THREE.MeshStandardMaterial({ map: paintTex(k.color, 3 + sp.i), roughness: .62, emissive: k.color, emissiveIntensity: .12 });
  paint.map.wrapS = paint.map.wrapT = THREE.RepeatWrapping; paint.map.repeat.set(1 / k.size, 1 / k.size); paint.map.offset.set(.5, .5);
  const face = new THREE.Mesh(slab(sh, 0.005, 0.0007), [paint, M.burnt]); face.name = 'KeyShape'; key.add(face);
  const shaftM = k.shaft === 'blue' ? M.pla : M.shaftBlack;
  const flange = cyl(0.025, 0.004, shaftM, 40); flange.position.z = -0.007; flange.name = 'KeyFlange'; key.add(flange);
  const shaft = cyl(0.0165, 0.095, shaftM, 40); shaft.position.z = -0.009 - 0.0475; shaft.name = 'KeyShaft'; key.add(shaft);
  board.add(key);
  // the split ring and wristband hang from the slot; they keep hanging down while the key turns
  const band = new THREE.Group(); band.name = `Key_${id}_Wristband`;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.0011, 10, 40), M.ring); ring.rotation.y = Math.PI / 2; ring.position.set(0, -0.006, -0.0025); band.add(ring);
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new CoilCurve(-0.013, 0.085 + sp.i * 0.004, 0.012, 0.016, 52, 0.005), 1400, 0.0016, 6, false), M.coil);
  coil.position.z = 0.002; coil.name = 'Coil'; band.add(coil);
  board.add(band);
  keys.push({ key, band, sp, slotY, out: 0 });
});

// LED bars: frosted white diffusers with a row of LEDs; lit ones glow in the colour of the record below
const glowTex = canvasTex(64, 64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
P.bars.forEach((b, bi) => {
  const len = b.x1 - b.x0, rec = recById[b.for];
  const bar = new THREE.Mesh(new RoundedBoxGeometry(len, 0.024, 0.012, 3, 0.004), M.bar);
  bar.position.set((b.x0 + b.x1) / 2, b.y, 0.006); bar.name = `LEDBar_${b.for}`; board.add(bar);
  for (const e of [-1, 1]) { const sc = cyl(0.0035, 0.003, M.screw, 12); sc.position.set(bar.position.x + e * (len / 2 + 0.008), b.y, 0.0015); board.add(sc); }
  const n = 10;
  for (let k = 0; k < n; k++) {
    const x = b.x0 + len * (k + .5) / n;
    const m = new THREE.MeshStandardMaterial({ color: '#d9d4c8', emissive: rec.led, emissiveIntensity: 0, roughness: .4 });
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.0042, 20), m); dot.position.set(x, b.y, 0.01225); board.add(dot);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: rec.led, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    glow.scale.set(0.034, 0.034, 1); glow.position.set(x, b.y, 0.016); glow.userData.sceneOnly = true; board.add(glow);
    leds.push({ m, glow, k, n, bi, rec: P.records.findIndex((r) => r.id === b.for) });
  }
});

// the "Rotate to increase volume" sticky note from the expo
{ const n = P.note; const note = new THREE.Mesh(new THREE.BoxGeometry(n.size, n.size, 0.0008), [M.note, M.note, M.note, M.note, M.note, M.note]);
  note.position.set(n.x, n.y, 0.0006); note.rotation.z = n.rot; note.name = 'StickyNote'; board.add(note); }

shadowAll(board);
board.traverse((o) => { if (o.isSprite) o.castShadow = false; });
scene.add(board);

/* ---------------- GLB export / reload ---------------- */
async function exportGLB() {
  const hidden = []; board.traverse((o) => { if (o.userData.sceneOnly && o.visible) { o.visible = false; hidden.push(o); } });
  const ab = await new GLTFExporter().parseAsync(board, { binary: true, onlyVisible: true });
  hidden.forEach((o) => (o.visible = true));
  return ab;
}
window.exportGLB = async () => { const ab = await exportGLB(); let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
document.getElementById('dl').onclick = async () => { const ab = await exportGLB(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ab], { type: 'model/gltf-binary' })); a.download = 'sound-youre-wearing.glb'; a.click(); };
if (VIEW === 'glb') {
  board.visible = false;
  const g = await new GLTFLoader().loadAsync('./out/sound-youre-wearing.glb');
  shadowAll(g.scene); scene.add(g.scene);
}

/* ---------------- cameras ---------------- */
const camera = new THREE.PerspectiveCamera(24, W0 / H0, 0.02, 30);
let controls = null;
if (CAMS[VIEW]) {
  const c = CAMS[VIEW]; camera.fov = c.fov; camera.aspect = W0 / H0;
  camera.position.fromArray(c.pos);
  const m3 = new THREE.Matrix3().fromArray(c.rot); const m4 = new THREE.Matrix4().setFromMatrix3(m3);
  camera.quaternion.setFromRotationMatrix(m4);
  document.getElementById('hud').style.display = 'none';
} else {
  const front = VIEW === 'front';
  if (VIEW === 'key') { camera.fov = 26; }
  camera.position.set(front ? 0 : 0.72, front ? 0.3 : 1.5, front ? 2.4 : 1.75);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.02, 0.2, 0.05);
  if (VIEW === 'key') { camera.position.set(-0.3, 0.5, 0.52); controls.target.set(0.07, 0.31, 0.1); }
  if (PLAY) { camera.fov = 30; camera.position.set(0, 1.5, 2.45); controls.target.set(0, 0.17, 0.2); } controls.enableDamping = true; controls.maxPolarAngle = Math.PI * .47;
  controls.minDistance = 0.8; controls.maxDistance = 5;
  controls.update();
  if (FREEZE !== null) document.getElementById('hud').style.display = 'none';
}
camera.updateProjectionMatrix();
addEventListener('resize', () => { if (q.has('w')) return; renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

let play = null;
if (PLAY) play = await (await import('./play.js')).setup({ THREE, RoundedBoxGeometry, canvasTex, scene, board, camera, renderer, controls, P, M, spinners, leds, keyOutline, paintTex, CoilCurve, slab, cyl, shadowAll });

/* ---------------- idle animation ---------------- */
const clock = new THREE.Clock();
const base = controls ? camera.position.clone() : null;
function frame() {
  const t = FREEZE !== null ? FREEZE : clock.getElapsedTime();
  matU.uTime.value = t;
  const ease = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); };
  const tt = DEMO ? t % LOOP : t;
  const live = [];
  if (play) play.frame(t);
  else for (const k of keys) {
    const sp = k.sp, i = sp.i;
    let slide, tp;                                   // slide: 0 far out .. 1 seated; tp: when it seated
    if (DEMO) { const ts = 0.8 + i * 1.6; slide = ease((tt - ts) / 1.1); tp = ts + 1.1; k.key.visible = tt > ts - 0.05; }
    else if (KEYS) { slide = 1; tp = -1e3; k.key.visible = true; }
    else { slide = 0; tp = 1e9; k.key.visible = false; }
    k.band.visible = k.key.visible;
    const run = Math.max(0, tt - tp);                // the record spins up over about a second once its key is in
    const ang = sp.phase + sp.speed * (run - (1 - Math.exp(-2 * run)) / 2);
    sp.g.rotation.z = ang;
    live[i] = THREE.MathUtils.clamp(run * 1.2, 0, 1);
    const away = 1 - slide, z = P.recordZ + sp.th / 2 + 0.009 + away * 0.26;
    k.key.position.set(sp.r.x, sp.r.y + away * 0.05, z);
    k.key.rotation.set(-away * 0.35, away * 0.5, ang - away * 0.8);
    const c = Math.cos(k.key.rotation.z), s2 = Math.sin(k.key.rotation.z);
    k.band.position.set(sp.r.x - s2 * k.slotY, sp.r.y + away * 0.05 + c * k.slotY, z);
    k.band.rotation.set(0, 0, away * 0.25 * Math.sin(tt * 6));
  }
  // each bar is a slow-breathing level meter, lit only while its record has a key in
  if (!play) for (const l of leds) {
    const level = (0.45 + 0.3 * Math.sin(t * 0.9 + l.bi * 1.7) + 0.12 * Math.sin(t * 2.3 + l.bi)) * (live[l.rec] ?? 0);
    const on = THREE.MathUtils.clamp(level * l.n - l.k, 0, 1);
    const pulse = 0.85 + 0.15 * Math.sin(t * 3 + l.k * .5);
    l.m.emissiveIntensity = on * 4 * pulse; l.glow.material.opacity = on * 0.9 * pulse;
  }
  if (controls) {
    if (FREEZE === null) { /* a gentle sway, as on the home mat */ }
    controls.update();
  }
  renderer.render(scene, camera);
  if (FREEZE === null) requestAnimationFrame(frame);
}
frame();
window.__ready = true;
