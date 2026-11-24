/**
 * The words that ring the yellow record on the home mat while the pointer rests on it (Adi, 2026-11-24: the hover text the
 * 3D board's own intro record shows should happen on the home page, where the record now is). White letters set once round
 * a circle, laid on the mat under the record: they fade in and turn slowly while it is hovered, and go at once on a click,
 * so the camera's dive onto the record (and the frame handed to the board's page) shows the record alone.
 */
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import type { MatLayer, MatLayerContext } from '../flipbook/matLayer';

export const RECORD_RING_TEXT = 'A PHYSICAL INTERACTION PROJECT  ·  CLICK TO PLAY  ·  ';

function ringPicture(): HTMLCanvasElement {
  const size = 1600;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;
  const m = size / 2, rad = m * 0.84;
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const width = (font: string) => { g.font = font; return [...RECORD_RING_TEXT].reduce((a, ch) => a + g.measureText(ch).width, 0); };
  const px = 120 * ((Math.PI * 2 * rad) / width('800 120px system-ui, sans-serif'));   // exactly one lap
  g.font = `800 ${px}px system-ui, sans-serif`;
  let angle = -Math.PI / 2;
  for (const ch of RECORD_RING_TEXT) {
    const da = g.measureText(ch).width / rad;
    g.save(); g.translate(m + Math.cos(angle + da / 2) * rad, m + Math.sin(angle + da / 2) * rad); g.rotate(angle + da / 2 + Math.PI / 2); g.fillText(ch, 0, 0); g.restore();
    angle += da;
  }
  return c;
}

export interface SoundRecordRing extends MatLayer {
  /** The pointer is on the record (true) or has left it (false). */
  hover(on: boolean): void;
  /** Gone at once (the record was clicked). */
  hide(): void;
}

/** `x`, `y`: the record's middle on the mat (the prop's own place); `d`: its diameter, in the mat's units. */
export function createSoundRecordRing(opts: { x: number; y: number; d: number; reduced: boolean }): SoundRecordRing {
  let ctx: MatLayerContext | null = null;
  let mesh: Mesh<PlaneGeometry, MeshBasicMaterial> | null = null;
  let want = 0, shown = 0, turn = 0;
  return {
    attach(c) {
      ctx = c;
      const tex = new CanvasTexture(ringPicture());
      tex.colorSpace = SRGBColorSpace; tex.anisotropy = c.maxAnisotropy;
      // the ring of words sits a little outside the record (as on the board's intro: the record's edge plus a margin)
      const size = (opts.d / 2 + opts.d * 0.33) * 2 / 0.92;
      mesh = new Mesh(new PlaneGeometry(size, size), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
      mesh.position.set(opts.x, opts.y, 0.0007);
      mesh.renderOrder = 1.6; mesh.frustumCulled = false; mesh.visible = false;
      c.scene.add(mesh);
    },
    update(dt) {
      if (!mesh) return false;
      shown += (want - shown) * Math.min(1, dt * 6);
      if (Math.abs(want - shown) < 0.002) shown = want;
      if (!opts.reduced) turn -= 0.15 * dt;
      mesh.visible = shown > 0.003;
      mesh.material.opacity = shown;
      mesh.scale.setScalar(0.9 + 0.1 * shown);
      mesh.rotation.z = turn;
      // keep drawing while it fades, and while it shows (it turns)
      return shown > 0.003 || want > 0;
    },
    hover(on) { want = on ? 1 : 0; ctx?.invalidate(); },
    hide() { want = 0; shown = 0; if (mesh) { mesh.visible = false; mesh.material.opacity = 0; } ctx?.invalidate(); },
    dispose() {
      if (!mesh) return;
      mesh.removeFromParent(); mesh.geometry.dispose(); mesh.material.map?.dispose(); mesh.material.dispose(); mesh = null; ctx = null;
    },
  };
}
