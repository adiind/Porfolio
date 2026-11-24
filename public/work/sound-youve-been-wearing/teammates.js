// Teammate coasters: the same round wooden coasters as the teachers, but smaller (70% radius), standing on a little ply base
// printed "BUILT WITH", next to the name tent card. Grey until hovered, colour on hover; click opens the link (if there is one).
// Photos come only from a person's own portfolio site; without one, initials on a key colour.
const TEAM = [
  { name: 'Ayden Harris', initials: 'AH', colour: '#5db3ad', img: null, url: 'https://www.linkedin.com/in/aydencharris', x: -0.065 },   // link: from the official Northwestern EDI profile page
  { name: 'Henry Goodman', initials: 'HG', colour: '#f5c20e', img: null, url: 'https://www.linkedin.com/in/henry-goodman-6679a6178/', x: 0.065 },   // Adi confirmed this profile (2026-11-23)
];
// where the little base stands, in board space, and which way it faces (y rotation)
const SPOT = { x: -0.60, z: 0.385, rotY: 0.32 };

export async function addTeammates(ctx) {
  const { THREE, RoundedBoxGeometry, canvasTex, board, camera, renderer, M, shadowAll, ray, ndc, setNdc, busy } = ctx;
  const el = renderer.domElement;
  const R = 0.09 * 0.7, CT = 0.009 * 0.9, LEAN = Math.PI / 2 - 0.35, BH = 0.014;
  const group = new THREE.Group(); group.name = 'Teammates'; group.userData.sceneOnly = true; board.add(group);
  group.position.set(SPOT.x, 0, SPOT.z); group.rotation.y = SPOT.rotY;
  const BW = 0.25, BD = 0.075;
  const base = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 3, 0.005), M.ply); base.position.y = BH / 2; group.add(base);
  const bt = canvasTex(1500, Math.round(1500 * BD / BW), (c, w, h) => {
    c.fillStyle = '#16204a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '800 54px system-ui, sans-serif'; c.save(); c.translate(w / 2, h * 0.80); c.fillText('B U I L T   W I T H', 0, 0); c.restore();
  });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: bt, transparent: true, roughness: .8 }));
  print.rotation.x = -Math.PI / 2; print.position.y = BH + 0.0004; group.add(print);
  shadowAll(group); print.castShadow = false;

  const load = (src) => new Promise((ok) => { if (!src) return ok(null); const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  const coasters = [];
  for (const T of TEAM) {
    const im = await load(T.img);
    const draw = (grey) => canvasTex(1024, 1024, (c, w) => {
      const m = w / 2;
      c.fillStyle = '#efe9dc'; c.beginPath(); c.arc(m, m, m - 2, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.arc(m, m, m * 0.62, 0, Math.PI * 2); c.clip();
      if (im) { c.filter = grey ? 'grayscale(1) contrast(1.05)' : 'none'; const sc = Math.max(m * 1.24 / im.width, m * 1.24 / im.height); c.drawImage(im, m - im.width * sc / 2, m - im.height * sc / 2, im.width * sc, im.height * sc); c.filter = 'none'; }
      else { c.fillStyle = grey ? '#b7b4ac' : T.colour; c.fillRect(0, 0, w, w); c.fillStyle = grey ? '#6d6b66' : '#16204a'; c.font = '800 330px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(T.initials, m, m + 14); }
      c.restore();
      const arcText = (txt, rad, top, font, col) => { c.font = font; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; const chars = [...txt]; const ws = chars.map((ch) => c.measureText(ch).width); const total = ws.reduce((a, b) => a + b, 0); let a = (top ? -Math.PI / 2 : Math.PI / 2) - (top ? 1 : -1) * total / rad / 2;
        chars.forEach((ch, i) => { const da = ws[i] / rad; const ang = a + (top ? 1 : -1) * da / 2; c.save(); c.translate(m + Math.cos(ang) * rad, m + Math.sin(ang) * rad); c.rotate(ang + (top ? Math.PI / 2 : -Math.PI / 2)); c.fillText(ch, 0, 0); c.restore(); a += (top ? 1 : -1) * da; }); };
      arcText(T.name.toUpperCase(), m * 0.79, true, '800 76px system-ui, sans-serif', '#16204a');
      arcText('TEAMMATE', m * 0.80, false, '700 50px system-ui, sans-serif', '#4a5070');
    });
    const greyT = draw(true), colourT = draw(false);
    const g = new THREE.Group(); g.name = `Teammate_${T.name.replace(' ', '')}`; g.userData.sceneOnly = true; group.add(g);
    const baseY = BH + R * Math.sin(LEAN) - 0.006;
    g.position.set(T.x, baseY, -0.008); g.rotation.set(LEAN, 0, 0);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, CT, 64), M.ply); body.position.y = CT / 2; g.add(body);
    const topM = new THREE.MeshStandardMaterial({ map: greyT, roughness: .8 });
    const top = new THREE.Mesh(new THREE.CircleGeometry(R * 0.96, 64), topM); top.rotation.x = -Math.PI / 2; top.position.y = CT + 0.0004; g.add(top);
    shadowAll(g); top.castShadow = false;
    const co = { g, top, topM, greyT, colourT, url: T.url, hov: 0, baseY }; top.userData.co = co; coasters.push(co);
  }
  let hover = null;
  const pick = (e) => { setNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(coasters.map((c) => c.top), false)[0]; return h ? h.object.userData.co : null; };
  el.addEventListener('pointerdown', (e) => { const co = pick(e); if (!co || !co.url) return; e.stopImmediatePropagation(); window.open(co.url, '_blank', 'noopener'); }, { capture: true });
  el.addEventListener('pointermove', (e) => { if (busy()) return; hover = pick(e); if (hover && hover.url) el.style.cursor = 'pointer'; });
  return {
    coasters, pick,
    frame(dt) {
      for (const co of coasters) {
        co.hov += ((hover === co ? 1 : 0) - co.hov) * Math.min(1, dt * 10);
        co.g.position.y = co.baseY + 0.014 * co.hov; co.g.rotation.x = LEAN - 0.12 * co.hov;
        const want = co.hov > 0.5 ? co.colourT : co.greyT; if (co.topM.map !== want) { co.topM.map = want; co.topM.needsUpdate = true; }
      }
    },
    hover: (i) => { hover = coasters[i] || null; },
  };
}
