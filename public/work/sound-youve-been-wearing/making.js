// Step 4, "How it got here": five real things on the mat, built with the board scene's own materials
// (its plywood, blue PLA, screws) so they sit in the same world:
// 1 a spiral sketchbook open at the first sketch, 2 the team's gear-and-cylinder assembly on a ply turntable
// ("Team render" is printed on its base), 3 the keys in a steel bowl, 4 the back of the board wired to the ESP32,
// 5 a tablet on a ply easel playing the cropped expo clip (no faces).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { slab, gearShape, cyl } from './parts.js';

const shadow = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
const rnd = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

export function buildMaking({ keys, video, B, units, board, M, canvasTex }) {
  const loader = new THREE.TextureLoader();
  const items = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = (w, h, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat); m.position.y = y; m.userData.hit = true; return m; };
  // paper with a little tooth, page edges, and a dark book cloth
  const paperTex = canvasTex(512, 512, (g, s) => { const r = rnd(11); g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < .5 ? 'rgba(120,100,70,.05)' : 'rgba(255,255,255,.08)'; g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2); } });
  const paper = new THREE.MeshStandardMaterial({ map: paperTex, roughness: .92 });
  const edgeTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#ece6d8'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(110,95,70,${0.08 + (y % 7) * 0.012})`; g.fillRect(0, y, w, 1); } });
  const pageEdge = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: .95 });
  const clothTex = canvasTex(256, 256, (g, s) => { g.fillStyle = '#23252c'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 2) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(i, 0, 1, s); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, i, s, 1); } });
  clothTex.wrapS = clothTex.wrapT = THREE.RepeatWrapping; clothTex.repeat.set(3, 3);
  const cloth = new THREE.MeshStandardMaterial({ map: clothTex, roughness: .88 });
  // the pencil sketch scanned light: darken and add contrast so the lines read on the page
  const inked = (src, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c);   // sized up front: a texture can't change size once uploaded
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const im = new Image(); im.onload = () => { const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.filter = 'contrast(1.9) brightness(0.9) saturate(1.2)'; g.drawImage(im, 0, 0, w, h); t.needsUpdate = true; }; im.src = src; return t; };
  const steel = new THREE.MeshStandardMaterial({ color: '#d5d9df', metalness: .95, roughness: .2 });
  const brushed = new THREE.MeshStandardMaterial({ color: '#b9bdc4', metalness: .85, roughness: .38 });

  /* 1 · spiral sketchbook, open at the first sketch, with a pencil */
  {
    const g = new THREE.Group(), PW = 0.2, PD = 0.27;
    for (const sgn of [-1, 1]) {
      const cover = new THREE.Mesh(new RoundedBoxGeometry(PW + 0.008, 0.004, PD + 0.008, 2, 0.0015), cloth); cover.position.set(sgn * (PW / 2 + 0.012), 0.002, 0); g.add(cover);
      const block = new THREE.Mesh(new RoundedBoxGeometry(PW, 0.012, PD, 2, 0.001), [pageEdge, pageEdge, paper, paper, pageEdge, pageEdge]);
      block.position.set(sgn * (PW / 2 + 0.012), 0.01, 0); g.add(block);
    }
    for (let i = 0; i < 17; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0011, 8, 28), steel); ring.rotation.y = Math.PI / 2; ring.position.set(0, 0.012, -PD / 2 + 0.012 + i * (PD - 0.024) / 16); g.add(ring); }
    const tex = inked('media/prints/1-sketch.jpg', 872, 936);
    const sketch = new THREE.Mesh(new THREE.PlaneGeometry(0.185, 0.185 * 936 / 872), new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }));
    sketch.rotation.x = -Math.PI / 2; sketch.position.set(PW / 2 + 0.012, 0.0163, 0); g.add(sketch);
    // a hexagonal yellow pencil, sharpened, with its ferrule and eraser
    const pencil = new THREE.Group();
    pencil.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.15, 6), new THREE.MeshStandardMaterial({ color: '#f1b324', roughness: .45 })));
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0038, 0.018, 6), new THREE.MeshStandardMaterial({ color: '#e2c194', roughness: .8 })); wood.position.y = 0.084; pencil.add(wood);
    const lead = new THREE.Mesh(new THREE.ConeGeometry(0.0012, 0.005, 12), new THREE.MeshStandardMaterial({ color: '#2b2b2e', roughness: .4, metalness: .3 })); lead.position.y = 0.0955; pencil.add(lead);
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.0041, 0.0041, 0.011, 16), brushed); fer.position.y = -0.0805; pencil.add(fer);
    const er = new THREE.Mesh(new THREE.CylinderGeometry(0.0039, 0.0039, 0.009, 16), new THREE.MeshStandardMaterial({ color: '#e8848a', roughness: .8 })); er.position.y = -0.0905; pencil.add(er);
    pencil.rotation.set(Math.PI / 2, 0, -1.1); pencil.position.set(-0.11, 0.0205, 0.02); g.add(pencil);
    shadow(g); g.add(hitBox(0.44, 0.06, 0.3, 0.02));
    items.push({ id: 'sketch', n: 1, title: 'First sketch', group: g, look: { y: 0.02, dir: [0, 1.6, 1], w: 0.48, h: 0.34 } });
  }

  /* 2 · the team's gear-and-cylinder assembly, turning slowly on a ply turntable */
  {
    const g = new THREE.Group(), a = new THREE.Group();
    const cad = new THREE.MeshPhysicalMaterial({ color: '#c9cdd4', roughness: .32, metalness: .15, clearcoat: .6, clearcoatRoughness: .25 });
    const edge = new THREE.LineBasicMaterial({ color: '#4a4f5c', transparent: true, opacity: .35 });
    const add = (m) => { m.material = cad; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edge)); a.add(m); return m; };
    add(new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.1, 0.007, 3, 0.003), cad)).position.z = 0;
    add(cyl(0.042, 0.05, cad, 64)).position.z = -0.0285;
    add(new THREE.Mesh(slab(gearShape(28, 0.072, 0.066, 0.02), 0.006, 0.001, 2), cad)).position.z = 0.016;
    add(cyl(0.021, 0.05, cad, 48)).position.z = 0.03;
    add(cyl(0.03, 0.004, cad, 48)).position.z = 0.057;
    const small = add(new THREE.Mesh(slab(gearShape(11, 0.03, 0.024, 0.004), 0.006, 0.001, 2), cad));
    small.position.set(Math.cos(Math.PI * 1.1) * 0.098, Math.sin(Math.PI * 1.1) * 0.098, 0.016);
    a.scale.setScalar(1.3); a.position.y = 0.118;
    const spin = new THREE.Group(); spin.add(a); g.add(spin);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.135, 0.018, 64), [M.plyEdge, M.ply, M.ply]); disc.position.y = 0.009; g.add(disc);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.05, 20), brushed); post.position.y = 0.04; spin.add(post);
    // the turntable carries a printed label: TEAM RENDER
    const lab = canvasTex(1024, 192, (c, w, h) => { c.fillStyle = '#f7f4ec'; c.beginPath(); c.roundRect(0, 0, w, h, 26); c.fill();
      c.fillStyle = '#d23a2a'; c.beginPath(); c.roundRect(36, 44, 104, 104, 18); c.fill(); c.fillStyle = '#16204a'; c.font = '800 112px system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText('TEAM RENDER', 172, h / 2 + 6); });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.028), new THREE.MeshStandardMaterial({ map: lab, transparent: true, roughness: .85 }));
    label.rotation.x = -Math.PI / 2; label.position.set(0, 0.0185, 0.09); g.add(label);
    shadow(g); label.castShadow = false; g.add(hitBox(0.28, 0.26, 0.28, 0.12));
    items.push({ id: 'render', n: 2, title: 'Team render', group: g, spin, look: { y: 0.11, dir: [0.3, 0.8, 1], w: 0.42, h: 0.34 } });
  }

  /* 3 · the keys, lying in a steel bowl */
  {
    const g = new THREE.Group();
    // a wide satin-steel bowl (not mirror: mirror steel washes the paint out)
    const S = 1.3, prof = [[0, 0.002], [0.1, 0.002], [0.14, 0.022], [0.165, 0.058], [0.172, 0.066], [0.175, 0.07], [0.171, 0.072], [0.165, 0.068], [0.158, 0.06], [0.134, 0.027], [0.097, 0.008], [0, 0.008]].map(([x, y]) => new THREE.Vector2(x * S, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 128), new THREE.MeshStandardMaterial({ color: '#b9bfc7', metalness: .9, roughness: .35, side: THREE.DoubleSide })));
    // two takes of each colour, face up in one layer so every shape reads; shafts hidden under them, wristbands off
    // (two coils hang over the rim instead)
    const KS = 0.85, ring = keys.length - 2;
    keys.forEach((k, i) => {
      const c = k.key; c.scale.setScalar(KS);
      c.traverse((m) => { if (m.isMesh && m.geometry.parameters && m.geometry.parameters.height === 0.095) m.visible = false; });
      const a = i < 2 ? i * Math.PI + 0.4 : (i - 2) / ring * Math.PI * 2, r = i < 2 ? 0.045 : 0.122;
      c.position.set(Math.cos(a) * r, 0.016 + (i % 3) * 0.0025 + (i >= 2 ? 0.006 : 0), Math.sin(a) * r);
      c.rotation.set(-Math.PI / 2 + (i >= 2 ? 0.12 * Math.cos(a) : 0), i >= 2 ? 0 : 0, a * 1.7 + i);
      g.add(c);
    });
    [[0.4, 0], [2.6, 1]].forEach(([a, n]) => {
      const b = keys[n * 3 + 2] ? keys[n * 3 + 2].band : null; if (!b) return;
      b.scale.setScalar(KS); b.position.set(Math.cos(a) * 0.226, 0.074, Math.sin(a) * 0.226); b.rotation.set(0, -a + Math.PI / 2, 0); g.add(b);
    });
    shadow(g); g.add(hitBox(0.46, 0.14, 0.46, 0.05));
    items.push({ id: 'keys', n: 3, title: 'The keys', group: g, look: { y: 0.04, dir: [0, 1.4, 1], w: 0.52, h: 0.42 } });
  }

  /* 4 · the back of the board, wired: each reader and encoder runs to the ESP32 on its terminal board */
  const wiring = new THREE.Group(); wiring.name = 'Wiring';
  {
    const esp = new THREE.Group();
    const green = new THREE.MeshStandardMaterial({ color: '#1f7a50', roughness: .55 });
    const pcb = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.0018, 0.075, 2, 0.0008), green); pcb.position.y = 0.006; esp.add(pcb);
    for (const [x, z] of [[-0.055, -0.032], [0.055, -0.032], [-0.055, 0.032], [0.055, 0.032]]) { const st = cyl(0.0032, 0.006, brushed, 12); st.rotation.x = -Math.PI / 2; st.position.set(x, 0.003, z); esp.add(st); }
    // the ESP32 dev board on its headers: a silver shield can, the antenna, a micro-USB port
    const dev = new THREE.Mesh(new RoundedBoxGeometry(0.052, 0.0016, 0.028, 2, 0.0006), new THREE.MeshStandardMaterial({ color: '#1b1e24', roughness: .5 })); dev.position.set(0, 0.0145, 0); esp.add(dev);
    for (const sz of [-1, 1]) { const hdr = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.007, 0.0035), M.chip); hdr.position.set(0, 0.0105, sz * 0.0115); esp.add(hdr); }
    const can = new THREE.Mesh(new RoundedBoxGeometry(0.018, 0.0032, 0.016, 2, 0.0006), brushed); can.position.set(0.006, 0.0168, 0); esp.add(can);
    const ant = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0006, 0.016), new THREE.MeshStandardMaterial({ color: '#c9a64a', metalness: .6, roughness: .4 })); ant.position.set(0.019, 0.0157, 0); esp.add(ant);
    const usb = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.003, 0.006, 2, 0.0008), steel); usb.position.set(-0.025, 0.0168, 0); esp.add(usb);
    // two rows of green screw terminals with their screw heads; each wire ends in one
    const termM = new THREE.MeshStandardMaterial({ color: '#2fae68', roughness: .5 }), ends = [];
    for (const sz of [-1, 1]) {
      const tb = new THREE.Mesh(new RoundedBoxGeometry(0.112, 0.011, 0.01, 2, 0.0012), termM); tb.position.set(0, 0.0125, sz * 0.031); esp.add(tb);
      for (let i = 0; i < 10; i++) { const x = -0.05 + i * 0.0111, sc = cyl(0.0019, 0.001, steel, 12); sc.rotation.x = -Math.PI / 2; sc.position.set(x, 0.0185, sz * 0.031); esp.add(sc); ends.push(new THREE.Vector3(x, 0.012, sz * 0.037)); }
    }
    esp.position.set(0.3, 0, -0.2); esp.rotation.y = 0.35; wiring.add(esp);
    esp.updateMatrix();
    const cols = ['#d62f2f', '#e8c32e', '#1d8a5a', '#f2f2f2', '#2b5fd9', '#6b3fa0'];
    let w = 0;
    units.forEach((u) => {
      const from = [new THREE.Vector3(u.home.x, u.home.y, -B.T - 0.058), new THREE.Vector3(u.home.x - 0.098, u.home.y - 0.004, -B.T - 0.004)];
      from.forEach((p0) => {
        for (let s = 0; s < 2; s++) {
          const e = ends[(w * 7) % ends.length].clone().applyMatrix4(esp.matrix);
          const out = e.clone().sub(esp.position).setY(0).normalize().multiplyScalar(0.03).add(e); out.y = 0.006;
          const mid = p0.clone().lerp(e, 0.5); mid.y = 0.008 + ((w * 3) % 5) * 0.004; mid.x += ((w * 7) % 9 - 4) * 0.018;
          const c = new THREE.CatmullRomCurve3([p0, p0.clone().add(new THREE.Vector3(0, -0.045, -0.035)), mid, out, e]);
          wiring.add(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.0015, 8), new THREE.MeshStandardMaterial({ color: cols[w % cols.length], roughness: .45 })));
          w++;
        }
      });
    });
    shadow(wiring); wiring.visible = false; board.add(wiring);
  }
  items.push({ id: 'board', n: 4, title: 'Wiring the back', group: null, look: { y: 0.22, dir: [0.25, 0.55, 1], w: 1.08, h: 0.6 } });

  /* 5 · a tablet on a ply easel playing the expo clip (cropped: no faces) */
  {
    const g = new THREE.Group(), t = new THREE.Group();
    const alu = new THREE.MeshStandardMaterial({ color: '#3a3d44', metalness: .7, roughness: .32 });
    t.add(new THREE.Mesh(new RoundedBoxGeometry(0.172, 0.25, 0.008, 4, 0.0035), alu));
    const glass = new THREE.Mesh(new RoundedBoxGeometry(0.168, 0.246, 0.0016, 4, 0.0007), new THREE.MeshPhysicalMaterial({ color: '#08090b', roughness: .08, clearcoat: 1, clearcoatRoughness: .05 }));
    glass.position.z = 0.0044; t.add(glass);
    const poster = loader.load('media/video/expo-poster.jpg'); poster.colorSpace = THREE.SRGBColorSpace;
    const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace;
    const screenM = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.152, 0.152 / 0.705), screenM); screen.position.z = 0.0054; t.add(screen);
    video.addEventListener('playing', () => { screenM.map = vt; screenM.needsUpdate = true; });
    t.rotation.x = -0.24; t.position.set(0, 0.138, 0.012); g.add(t);
    // ply easel: a back leg and a ledge with a lip, like the guide card's foot
    const leg = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.17, 0.012, 3, 0.004), M.ply); leg.position.set(0, 0.08, -0.045); leg.rotation.x = 0.42; g.add(leg);
    const ledge = new THREE.Mesh(new RoundedBoxGeometry(0.19, 0.016, 0.05, 3, 0.005), M.ply); ledge.position.set(0, 0.008, 0.02); g.add(ledge);
    const lip = new THREE.Mesh(new RoundedBoxGeometry(0.19, 0.02, 0.008, 3, 0.003), M.ply); lip.position.set(0, 0.018, 0.043); g.add(lip);
    shadow(g); screen.castShadow = false; g.add(hitBox(0.22, 0.3, 0.16, 0.13));
    g.scale.setScalar(1.55);   // the expo clip is the one moving picture: shown big
    items.push({ id: 'expo', n: 5, title: 'Expo day', group: g, look: { y: 0.2, dir: [0, 0.3, 1], w: 0.5, h: 0.5 } });
  }
  return { items, wiring };
}
