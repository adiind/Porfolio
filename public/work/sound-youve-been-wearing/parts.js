// Small geometry helpers for the making-of objects (the same recipes as the board's own: bevelled slabs, gears, cylinders).
import * as THREE from 'three';
export function slab(shape, T, bevel = 0.0025, segs = 3, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0001, T - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, curveSegments });
  g.translate(0, 0, -(T - 2 * bevel) - bevel);   // front face at z = 0, back at z = -T
  return g;
}
export function gearShape(teeth, rOut, rRoot, holeR = 0) {
  const s = new THREE.Shape(), n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, ph = i % 4, r = (ph === 1 || ph === 2) ? rOut : rRoot;
    const aa = a + (ph === 1 ? .12 : ph === 2 ? -.12 : 0) * (Math.PI * 2 / teeth);
    i ? s.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : s.moveTo(Math.cos(aa) * r, Math.sin(aa) * r);
  }
  if (holeR) { const h = new THREE.Path(); h.absarc(0, 0, holeR, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}
export const cyl = (r, len, mat, seg = 40) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.geometry.rotateX(Math.PI / 2); return m; };
