// Signs that are things on the mat, in the board scene's style (paper on plywood, navy ink, system-ui):
// step tiles you press, kraft hang-tags on strings, folded tent cards, and a printed credits plaque.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const NAVY = '#16204a', GREY = '#5a6078', PAPER = '#f7f4ec', FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const shadowAll = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

// A printed slab lying on the mat with its back edge raised (like the board's "About" plaque).
// Its group is yawed to face the camera; tilt() sets how far the back is raised.
export function propped(M, W, D, draw, px = 1600) {
  const g = new THREE.Group(), tilt = new THREE.Group(); g.add(tilt);
  const slabM = new THREE.Mesh(new RoundedBoxGeometry(W, D, 0.01, 3, 0.0035), M.ply); slabM.position.set(0, D / 2, 0); tilt.add(slabM);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tex(px, Math.round(px * D / W), draw), roughness: .85 }));
  face.position.set(0, D / 2, 0.0052); tilt.add(face);
  shadowAll(g); face.castShadow = false;
  g.userData = { tilt, face, W, D, setTilt(a) { tilt.rotation.x = -Math.PI / 2 + a; tilt.position.y = 0.006; } };
  g.userData.setTilt(0.5);
  return g;
}

// The four steps: plywood tiles with a paper top; the current one is navy and sits a little lower (pressed).
export function stepStrip(M, words) {
  const g = new THREE.Group(), TW = 0.112, TD = 0.052, GAP = 0.01, tiles = [];
  const draw = (i, on) => (c, w, h) => {
    c.fillStyle = '#e4cfa6'; c.fillRect(0, 0, w, h);
    c.fillStyle = on ? NAVY : PAPER; c.beginPath(); c.roundRect(14, 14, w - 28, h - 28, 30); c.fill();
    c.fillStyle = on ? PAPER : NAVY; c.beginPath(); c.arc(92, h / 2, 46, 0, Math.PI * 2); c.fill();
    c.fillStyle = on ? NAVY : PAPER; c.font = `800 56px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 92, h / 2 + 3);
    c.fillStyle = on ? PAPER : NAVY; c.font = `800 74px ${FONT}`; c.textAlign = 'left'; c.fillText(words[i], 162, h / 2 + 4);
  };
  words.forEach((wd, i) => {
    const t = new THREE.Group(); t.position.x = (i - 1.5) * (TW + GAP); g.add(t);
    const body = new THREE.Mesh(new RoundedBoxGeometry(TW, 0.012, TD, 3, 0.004), M.ply); body.position.y = 0.006; t.add(body);
    const off = tex(520, 240, draw(i, false)), on = tex(520, 240, draw(i, true));
    const top = new THREE.Mesh(new THREE.PlaneGeometry(TW, TD), new THREE.MeshStandardMaterial({ map: off, roughness: .8 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.0122; t.add(top);
    shadowAll(t); top.castShadow = false;
    tiles.push({ t, top, off, on, body, press: 0 });
  });
  g.userData = { tiles, W: 4 * TW + 3 * GAP, D: TD, set(n) { tiles.forEach((x, i) => { const want = i === n - 1 ? x.on : x.off; if (x.top.material.map !== want) { x.top.material.map = want; x.top.material.needsUpdate = true; } x.active = i === n - 1; }); },
    frame(dt) { for (const x of tiles) { x.press += ((x.active ? 1 : 0) - x.press) * Math.min(1, dt * 10); x.t.position.y = -0.005 * x.press; } } };
  return g;
}

// A kraft hang-tag with a hole and a string to whatever it names.
export function hangTag(n, title) {
  const W = 0.1, H = 0.042;
  const t = tex(800, 336, (c, w, h) => {
    c.clearRect(0, 0, w, h); const k = 56;
    c.fillStyle = '#e2cfa8'; c.beginPath(); c.moveTo(k, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(k, h); c.lineTo(0, h - k); c.lineTo(0, k); c.closePath(); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(58, h / 2, 20, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
    c.strokeStyle = 'rgba(120,90,50,.5)'; c.lineWidth = 5; c.beginPath(); c.arc(58, h / 2, 27, 0, Math.PI * 2); c.stroke();
    c.fillStyle = NAVY; c.font = `800 104px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(title, 130, h / 2 + 5);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: .9, side: THREE.DoubleSide }));
  m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#efe6d2' }));
  g.userData = { W, H, line, holeX: -W / 2 + W * 58 / 800 };
  return g;
}

// A name card for a thing on the mat: cream card with a ply edge, bold navy type (the AboutPlaque's look), propped up.
export function tentCard(n, title, M) {
  const W = 0.25, D = 0.07;
  const g = propped(M, W, D, (c, w, h) => {
    c.fillStyle = '#e4cfa6'; c.fillRect(0, 0, w, h); c.fillStyle = PAPER; c.beginPath(); c.roundRect(22, 22, w - 44, h - 44, 22); c.fill();
    c.fillStyle = NAVY; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 190; c.font = `800 ${fs}px ${FONT}`;
    while (c.measureText(title).width > w - 160 && fs > 90) { fs -= 6; c.font = `800 ${fs}px ${FONT}`; }
    c.fillText(title, w / 2, h / 2 + 10);
  }, 2400);
  g.userData.setTilt(0.85);
  return g;
}

// The credits, printed on a propped plaque.
export function creditsPlaque(M, lines) {
  const W = 0.44, D = 0.2;
  return propped(M, W, D, (c, w, h) => {
    c.fillStyle = '#e4cfa6'; c.fillRect(0, 0, w, h); c.fillStyle = PAPER; c.beginPath(); c.roundRect(26, 26, w - 52, h - 52, 22); c.fill();
    c.fillStyle = '#7a7f93'; c.font = `800 38px ${FONT}`; c.textBaseline = 'alphabetic'; c.fillText('CREDITS', 74, 104);
    const lh = (h - 170) / lines.length;
    lines.forEach(([who, what], i) => {
      const y = 158 + lh * 0.62 + i * lh;
      c.fillStyle = NAVY; c.font = `800 ${Math.round(lh * 0.56)}px ${FONT}`; c.fillText(who, 74, y);
      c.fillStyle = '#3b4262'; c.font = `700 ${Math.round(lh * 0.44)}px ${FONT}`; c.textAlign = 'right'; c.fillText(what, w - 74, y); c.textAlign = 'left';
    });
  });
}

// Words made of shadow. Invisible 3D letters hover a few cm over the mat; the board's sun "casts" them, but through a shadow
// pass of their own: the letters are drawn as a silhouette from the sun's direction (same direction as the board's key
// light, so they fall the same way), and that silhouette is laid on the mat in the board-shadow navy at the shadow's
// darkness. That keeps the words crisp while the board's own shadow keeps its soft edge.
// They start inside the board's shadow and flow out letter by letter, then ripple slowly. userData.frame(t, dt, hover, show).
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
let FONT3D = null;
export async function shadowWords(lines, { size = 0.085, gap = 1.45, from = -0.28, fromX = 0, rest = 0.03, fat = 0, sun, renderer, fontUrl = './vendor/fonts/helvetiker_bold.typeface.json', darkness = 0.62, soft = 1.2 } = {}) {
  if (!FONT3D) FONT3D = new FontLoader().parse(await (await fetch(fontUrl)).json());
  const g = new THREE.Group(), letters = [];
  // the silhouette scene: the letters live here (not in the main scene), following g's place every frame
  const sil = new THREE.Scene(), proxy = new THREE.Group(); proxy.matrixAutoUpdate = false; sil.add(proxy);
  const white = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const sc = size / FONT3D.data.resolution;
  const H = lines.length * size * gap;
  const adv = (ch) => (FONT3D.data.glyphs[ch] ? FONT3D.data.glyphs[ch].ha : 300) * sc;
  lines.forEach((line, li) => {
    let x = -[...line].reduce((a, ch) => a + adv(ch), 0) / 2;
    const z = -H / 2 + (li + 1) * size * gap;
    for (const ch of line) {
      if (ch !== ' ') {
        const geo = new TextGeometry(ch, { font: FONT3D, size, depth: 0.002, curveSegments: 6, bevelEnabled: fat > 0, bevelThickness: 0.001, bevelSize: fat, bevelSegments: 1 });
        geo.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(geo, white); m.frustumCulled = false; proxy.add(m); letters.push({ m, x, z });
      }
      x += adv(ch);
    }
  });
  const W = Math.max(...lines.map((l) => [...l].reduce((a, ch) => a + adv(ch), 0)));
  // the sun's view of the words: an orthographic camera looking along the key light, framing the words and their way out
  const RW = W / 2 + Math.abs(fromX) + 0.12, RH = H / 2 + Math.abs(from) + 0.12;
  const rt = new THREE.WebGLRenderTarget(2048, Math.max(256, Math.round(2048 * RH / RW)), { depthBuffer: false });
  const lcam = new THREE.OrthographicCamera(-RW, RW, RH, -RH, 0.01, 6);
  const sunDir = new THREE.Vector3();
  // the mat patch that shows it: board-shadow navy, at the shadow's darkness, with a hair of softening at the edge
  const patch = new THREE.Mesh(new THREE.PlaneGeometry((RW + 0.25) * 2, (RH + 0.25) * 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { tMask: { value: rt.texture }, uVP: { value: new THREE.Matrix4() }, uColor: { value: new THREE.Color('#02092c') }, uDark: { value: darkness }, uTexel: { value: new THREE.Vector2(soft / rt.width, soft / rt.height) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D tMask; uniform mat4 uVP; uniform vec3 uColor; uniform float uDark; uniform vec2 uTexel; varying vec3 vW;
      void main(){ vec4 p = uVP * vec4(vW,1.); vec2 uv = p.xy * .5 + .5;
        if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) discard;
        float a = texture2D(tMask, uv).r * .4 + (texture2D(tMask, uv + vec2(uTexel.x,0.)).r + texture2D(tMask, uv - vec2(uTexel.x,0.)).r + texture2D(tMask, uv + vec2(0.,uTexel.y)).r + texture2D(tMask, uv - vec2(0.,uTexel.y)).r) * .15;
        if (a < .003) discard;
        gl_FragColor = vec4(uColor, a * uDark);
        #include <colorspace_fragment>
      }`,
  }));
  patch.rotation.x = -Math.PI / 2; patch.position.y = 0.0008; patch.renderOrder = 3; patch.frustumCulled = false;
  g.add(patch);
  const hit = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.15, Math.max(H * 1.5, size * 3)), new THREE.MeshBasicMaterial({ visible: false })); hit.rotation.x = -Math.PI / 2; hit.position.y = 0.002; g.add(hit);
  const N = letters.length; let p = 0, hov = 0;
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const clear = new THREE.Color(0, 0, 0), keep = new THREE.Color();
  g.userData = { hit, W, H, frame(t, dt, hover, show) {
    p = show ? Math.min(1, p + dt / 2.6) : Math.max(0, p - dt / 0.9);
    hov += ((hover ? 1 : 0) - hov) * Math.min(1, dt * 6);
    g.visible = p > 0.001;
    if (!g.visible) return;
    letters.forEach((L, i) => {
      const q = ease(p * 1.7 - (i / N) * 0.7);                       // this letter's way out of the board's shadow
      const wave = Math.sin(t * 1.5 - i * 0.42), drift = Math.sin(t * 0.7 + i * 0.25);
      const lift = rest + rest * 0.5 * wave - rest * 0.6 * hov;       // hover: the letters sink, the shadow tightens
      L.m.position.set(L.x + 0.003 * drift + (1 - q) * fromX, lift + (1 - q) * 0.2, L.z + (1 - q) * from);
      L.m.scale.set(1 + (1 - q) * (fromX ? 2.2 : 0.25), 1, 1 + (1 - q) * (fromX ? 0.3 : 2.2) + 0.05 * wave);
    });
    // place the sun's camera: along the key light's direction, over the words
    g.updateMatrixWorld(); proxy.matrix.copy(g.matrixWorld); proxy.updateMatrixWorld(true);
    sunDir.copy(sun.position).sub(sun.target.position).normalize();
    const c = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld);
    lcam.position.copy(c).addScaledVector(sunDir, 3); lcam.up.set(0, 0, -1); lcam.lookAt(c); lcam.updateMatrixWorld(); lcam.updateProjectionMatrix();
    patch.material.uniforms.uVP.value.multiplyMatrices(lcam.projectionMatrix, lcam.matrixWorldInverse);
    const prev = renderer.getRenderTarget(), pa = renderer.getClearAlpha(); renderer.getClearColor(keep);
    renderer.setRenderTarget(rt); renderer.setClearColor(clear, 1); renderer.clear(true, false, false); renderer.render(sil, lcam);
    renderer.setRenderTarget(prev); renderer.setClearColor(keep, pa);
  } };
  return g;
}
