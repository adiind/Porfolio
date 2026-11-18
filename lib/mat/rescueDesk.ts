/**
 * Food Rescue: the paper on the mat. Puts the sheets that rescueBoard.ts draws (the order log, the app-screen print,
 * "My part") on the mat as flat paper with a soft shadow, keeps them in step with the story clock, and answers
 * "which event is under this ray" for a click on the board.
 *
 * Everything shown is worked out from `seconds` alone (no forward-only state), so seeking backwards just works.
 */
import {
  CanvasTexture, ClampToEdgeWrapping, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry,
  Raycaster, SRGBColorSpace,
} from 'three';
import { AFTER_AT, OFFERS, journeyAt, journeySteps, offer } from './rescueJourney';
import { createPartSheet, createRescueBoard, type BoardState, type RescueSheet } from './rescueBoard';
import { NARROW, WIDE, type Rect } from './rescueLayout';

const LIE = .012;          // paper lies this far above the mat
const DEG = Math.PI / 180;
const ARRIVE = .3;         // seconds a sheet takes to drop onto the mat
const BOARD_ARRIVE = .3;
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** the biggest box of this shape that fits inside the rect, centred (a sheet is never stretched) */
function fit(r: Rect, aspect: number, turn = 0) {
  const w = r.x1 - r.x0; const h = r.y1 - r.y0;
  const c = Math.abs(Math.cos(turn)); const s = Math.abs(Math.sin(turn));
  // the turned sheet's bounding box is (W c + H s) by (W s + H c) with H = W / aspect
  const k = Math.min(w / (c + s / aspect), h / (s + c / aspect));
  return { cx: (r.x0 + r.x1) / 2, cy: (r.y0 + r.y1) / 2, w: k, h: k / aspect };
}

/** A soft rectangular paper shadow on its own small canvas, shaped like the sheet (so its blur is even on every side). */
function paperShadow(w: number, h: number, radius: number) {
  const PX = 130; const pad = .2; // pixels per table unit, margin around the paper (table units)
  const cw = Math.ceil((w + pad * 2) * PX); const ch = Math.ceil((h + pad * 2) * PX);
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const g = canvas.getContext('2d')!;
  const x = pad * PX; const y = pad * PX; const bw = w * PX; const bh = h * PX; const far = 10000;
  const layer = (blur: number, alpha: number, drop: number) => {
    g.save();
    g.shadowColor = `rgba(8,29,79,${alpha})`; g.shadowBlur = blur; g.shadowOffsetX = far; g.shadowOffsetY = drop;
    g.fillStyle = '#000'; g.beginPath(); g.roundRect(x - far, y, bw, bh, radius * PX); g.fill();
    g.restore();
  };
  layer(26, .34, 3); layer(7, .3, 1);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace; map.wrapS = map.wrapT = ClampToEdgeWrapping; map.generateMipmaps = false; map.minFilter = LinearFilter;
  return { map, w: w + pad * 2, h: h + pad * 2 };
}

export interface RescueDesk {
  open(): void;
  close(): void;
  /** call every frame with the story clock; returns true while a sheet is still arriving */
  update(seconds: number, narrow: boolean): boolean;
  /** which event's row is under this ray on the board, or null */
  stepAt(ray: Raycaster): number | null;
  dispose(): void;
}

export function createRescueDesk(
  parent: Group,
  art: { offer: HTMLImageElement | null },
  ctx: { maxAnisotropy: number; invalidate(): void },
  reduced: boolean,
): RescueDesk {
  const root = new Group(); root.visible = false; parent.add(root);
  const disposables: { dispose(): void }[] = [];
  const planeGeometry = new PlaneGeometry(1, 1); disposables.push(planeGeometry);

  interface Piece {
    sheet: RescueSheet | null; texture: CanvasTexture; material: MeshBasicMaterial; mesh: Mesh;
    shadow: Mesh; shadowMaterial: MeshBasicMaterial;
    cx: number; cy: number; w: number; h: number; turn: number; drift: number;
    wide: boolean; narrowToo: boolean;
  }
  const pieces: Piece[] = [];

  const paperTexture = (canvas: HTMLCanvasElement) => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace; t.generateMipmaps = true; t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter;
    t.anisotropy = ctx.maxAnisotropy; t.wrapS = t.wrapT = ClampToEdgeWrapping;
    disposables.push(t); return t;
  };

  const addPiece = (canvas: HTMLCanvasElement, sheet: RescueSheet | null, rect: Rect, turnDeg: number, radiusUnits: number, wide: boolean, narrowToo: boolean) => {
    const turn = turnDeg * DEG;
    const f = fit(rect, canvas.width / canvas.height, turn);
    const texture = paperTexture(canvas);
    const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }); disposables.push(material);
    const mesh = new Mesh(planeGeometry, material); mesh.renderOrder = 2;
    mesh.scale.set(f.w, f.h, 1); mesh.rotation.z = turn; mesh.position.set(f.cx, f.cy, LIE);
    const sh = paperShadow(f.w, f.h, radiusUnits);
    disposables.push(sh.map);
    const shadowMaterial = new MeshBasicMaterial({ map: sh.map, transparent: true, depthWrite: false }); disposables.push(shadowMaterial);
    const shadow = new Mesh(planeGeometry, shadowMaterial); shadow.renderOrder = 1;
    shadow.scale.set(sh.w, sh.h, 1); shadow.rotation.z = turn;
    root.add(shadow, mesh);
    const piece: Piece = { sheet, texture, material, mesh, shadow, shadowMaterial, cx: f.cx, cy: f.cy, w: f.w, h: f.h, turn, drift: 0, wide, narrowToo };
    pieces.push(piece); return piece;
  };

  // ---- the board (one per kind) ----
  const boardArt = { offer: art.offer };
  const wideSheet = createRescueBoard('wide', boardArt);
  const narrowSheet = createRescueBoard('narrow', boardArt);
  const wideBoard = addPiece(wideSheet.canvas, wideSheet, WIDE.BOARD, 0, .075, true, false);
  const narrowBoard = addPiece(narrowSheet.canvas, narrowSheet, NARROW.BOARD, 0, .075, false, true);

  // ---- the app-screen print: the real offer screen, whole, with a white border and its caption on the border ----
  const printCanvas = document.createElement('canvas');
  const drawPrint = () => {
    const image = art.offer;
    const ratio = image && image.naturalWidth ? image.naturalWidth / image.naturalHeight : 1100 / 867;
    const pw = 1100; const ph = Math.round(pw / ratio);
    const side = 46; const top = 46; const band = 118;
    printCanvas.width = pw + side * 2; printCanvas.height = top + ph + band;
    const g = printCanvas.getContext('2d')!;
    g.clearRect(0, 0, printCanvas.width, printCanvas.height);
    g.fillStyle = '#fffdfa'; g.beginPath(); g.roundRect(0, 0, printCanvas.width, printCanvas.height, 14); g.fill();
    if (image) g.drawImage(image, side, top, pw, ph);
    g.strokeStyle = 'rgba(35,26,26,.14)'; g.lineWidth = 2; g.strokeRect(side, top, pw, ph);
    g.fillStyle = '#4a3f3f'; g.textBaseline = 'middle'; g.textAlign = 'center';
    let size = 64; g.font = `500 ${size}px 'FB Geist', sans-serif`;
    while (g.measureText(offer.caption).width > printCanvas.width - side * 2 && size > 30) { size -= 2; g.font = `500 ${size}px 'FB Geist', sans-serif`; }
    g.fillText(offer.caption, printCanvas.width / 2, top + ph + band / 2 + 2);
  };
  drawPrint();
  const print = addPiece(printCanvas, null, WIDE.PRINT, -3, .014, true, false);

  // ---- "My part" ----
  const partSheet = createPartSheet();
  const part = addPiece(partSheet.canvas, partSheet, WIDE.PART, 1.5, .02, true, false);

  // the caption font may arrive after the first paint
  const repaintPrint = () => { drawPrint(); print.texture.needsUpdate = true; ctx.invalidate(); };
  if (typeof document !== 'undefined' && document.fonts) void document.fonts.load(`500 40px 'FB Geist'`).then(repaintPrint, () => undefined);
  if (art.offer && !art.offer.complete) art.offer.addEventListener('load', repaintPrint, { once: true });

  /** place one piece for its arrival progress p (0 not there, 1 settled) */
  const arrive = (piece: Piece, p: number, kind: 'board' | 'sheet') => {
    const e = easeOut(p);
    const visible = e > .001;
    piece.mesh.visible = visible; piece.shadow.visible = visible;
    if (!visible) return;
    const lift = 1 - e;
    const grow = 1 + (kind === 'board' ? .03 : .05) * lift;
    piece.mesh.scale.set(piece.w * grow, piece.h * grow, 1);
    piece.mesh.position.set(piece.cx, piece.cy, LIE + .09 * lift);
    piece.material.opacity = e;
    // a higher sheet throws its shadow a little further and fainter
    piece.shadow.position.set(piece.cx - .02 - .05 * lift, piece.cy - .03 - .06 * lift, LIE - .007);
    piece.shadowMaterial.opacity = e * (1 - .35 * lift);
  };

  const state: BoardState = { step: 0, sinceStep: 0, done: false, sinceDone: 0 };
  let narrowNow = false; let first = true;

  const apply = (seconds: number, narrow: boolean) => {
    const wideShown = !narrow;
    wideBoard.mesh.visible = wideShown; wideBoard.shadow.visible = wideShown;
    narrowBoard.mesh.visible = !wideShown; narrowBoard.shadow.visible = !wideShown;
    const step = journeyAt(seconds);
    state.step = step; state.sinceStep = Math.max(0, seconds - journeySteps[step].at);
    state.done = seconds >= AFTER_AT; state.sinceDone = Math.max(0, seconds - AFTER_AT);
    const board = narrow ? narrowBoard : wideBoard;
    if (board.sheet!.draw(state)) board.texture.needsUpdate = true;
    const boardP = reduced ? 1 : (seconds + .0001) / BOARD_ARRIVE;
    arrive(board, boardP, 'board');
    // the sheet that is not in use stays hidden
    (narrow ? wideBoard : narrowBoard).mesh.visible = false; (narrow ? wideBoard : narrowBoard).shadow.visible = false;
    for (const sheet of [print, part]) {
      if (narrow) { sheet.mesh.visible = false; sheet.shadow.visible = false; continue; }
      const at = sheet === print ? OFFERS : AFTER_AT;
      if (sheet.sheet && sheet.sheet.draw(state)) sheet.texture.needsUpdate = true;
      arrive(sheet, reduced ? (seconds >= at ? 1 : 0) : (seconds - at) / ARRIVE, 'sheet');
    }
    const settled = reduced || (seconds >= BOARD_ARRIVE && (seconds < OFFERS || seconds >= OFFERS + ARRIVE) && (seconds < AFTER_AT || seconds >= AFTER_AT + ARRIVE));
    return !settled;
  };

  return {
    open() { root.visible = true; first = true; ctx.invalidate(); },
    close() { root.visible = false; },
    update(seconds, narrow) {
      if (!root.visible) return false;
      if (first || narrow !== narrowNow) { first = false; narrowNow = narrow; }
      return apply(seconds, narrow);
    },
    stepAt(ray) {
      if (!root.visible) return null;
      const board = narrowNow ? narrowBoard : wideBoard;
      if (!board.mesh.visible) return null;
      const hit = ray.intersectObject(board.mesh, false)[0];
      if (!hit?.uv) return null;
      return board.sheet!.rowAt(hit.uv.x, 1 - hit.uv.y);
    },
    dispose() {
      root.removeFromParent();
      disposables.splice(0).forEach((d) => d.dispose());
      pieces.length = 0;
    },
  };
}
