/**
 * "Whole": every part of Surya, apart, then together, then real.
 *
 * A blueprint page. The parts hang in a row along the piece's depth: the back
 * layer, the lights, motors and board, the engraved front layer, the frosted
 * sheet, the flowers. One by one they close up into the finished stack, the
 * drawing turns to face the reader, and the photograph of the real piece
 * takes its place. Then it opens again.
 *
 * In the 3D book the three groups sit on three sheets, so they also slide
 * against each other as the page tilts.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, type Rgb } from './motion';
import { createStage, loopPage, tintSheet } from './stage';
import { messageLit } from './suryaStory';
import type { LivePage, LiveScene } from './types';
import {
  BUTTONS, LASER, drawBoard, drawDrum, drawEngraving, drawFlowerFace, drawLayer, drawMatrix, drawProduct, drawRim,
  drawSheet, plotOnPlate, type View,
} from './wire';

const PARTS = '/images/flipbook/surya/parts';
const SRC = { product: `${PARTS}/product.webp`, engrave: `${PARTS}/engrave.webp` };
const SANS = '"FB Geist", "Geist", system-ui, sans-serif';

const LOOP = 15;
const DEEP: Rgb = [14, 38, 138];
const LINE: Rgb = [236, 243, 255];
const GLOW: Rgb = [140, 200, 255];

/** Each group: how far out it hangs when apart, where it sits when together, and when it closes up. */
const GROUPS = {
  back: { apart: -250, together: -16, at: 1.0 },
  inside: { apart: -125, together: -8, at: 2.3 },
  sheet: { apart: 120, together: 3, at: 3.6 },
  flowers: { apart: 240, together: 9, at: 4.9 },
} as const;
const TURN_FROM = 6.4;
const PHOTO_FROM = 8.7;
const OPEN_AGAIN = 13.6;

function createWhole(images: BookImages, width: number, height: number): LivePage {
  const product = images.get(SRC.product);
  const engraveImage = images.get(SRC.engrave);
  if (!product || !engraveImage) throw new Error('The Whole page is missing a picture.');
  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const engraving = stage.keep(tintSheet(engraveImage, rgba(LINE)));

  return loopPage(stage, {
    loop: LOOP,
    rest: 11.4,
    step() { /* a pure function of time */ },
    draw(t, clock) {
      const again = 1 - smoothstep(OPEN_AGAIN, OPEN_AGAIN + 1.1, t);
      const closed = (at: number): number => smoothstep(at, at + 1.25, t) * again;
      const z = (group: keyof typeof GROUPS): number => lerp(GROUPS[group].apart, GROUPS[group].together, closed(GROUPS[group].at));
      const facing = smoothstep(TURN_FROM, TURN_FROM + 2, t) * again;
      const real = smoothstep(PHOTO_FROM, PHOTO_FROM + 1.4, t) * (1 - smoothstep(OPEN_AGAIN - 0.5, OPEN_AGAIN + 0.2, t));
      const view: View = {
        turn: lerp(0.84, 0, facing),
        tip: lerp(0.2, 0, facing),
        scale: (lerp(720, 900, facing) / 428) * k,
        x: lerp(740, 1100, facing) * k,
        y: lerp(500, 520, facing) * k,
      };
      const lines = 1 - real * 0.82;

      /* the printed sheet: blueprint ground, and the parts nearest the wall */
      const ground = base.createLinearGradient(0, 0, width, height);
      ground.addColorStop(0, rgba([24, 58, 178]));
      ground.addColorStop(1, rgba([10, 30, 116]));
      base.fillStyle = ground;
      base.fillRect(0, 0, width, height);
      base.strokeStyle = rgba(LINE, 0.07);
      base.lineWidth = 1.5 * k;
      base.beginPath();
      for (let gx = 100; gx < 2000; gx += 100) { base.moveTo(gx * k, 0); base.lineTo(gx * k, height); }
      for (let gy = 100; gy < 1200; gy += 100) { base.moveTo(0, gy * k); base.lineTo(width, gy * k); }
      base.stroke();
      base.globalAlpha = lines;
      drawLayer(base, view, z('back'), 'back', { fill: DEEP, line: LINE, width: 3 * k, thick: 5 });
      const lit = closed(GROUPS.inside.at);
      drawRim(base, view, z('inside'), LINE, GLOW, (i) => lit * (0.5 + 0.5 * Math.sin(clock * 2.6 - i * 0.3)));
      LASER.holes.forEach(([hx, hy]) => drawDrum(base, view, hx - LASER.centre[0], hy - LASER.centre[1], z('inside') - 26, z('inside'), 14, LINE, DEEP, 2.4 * k));
      drawBoard(base, view, 0, 96, z('inside'), LINE, DEEP, 2.4 * k);
      drawMatrix(base, view, z('inside'), LINE, GLOW, 2.4 * k, (col, row) => messageLit(col, row) * lit);
      base.globalAlpha = 1;
      stage.tooth(0.05);

      /* the middle sheet: the front layer with its engraving, and the frosted sheet over the window */
      word.globalAlpha = lines;
      drawLayer(word, view, 0, 'front', { fill: DEEP, line: LINE, width: 3 * k, thick: 5 });
      drawEngraving(word, view, 0, engraving, 0.8 * lines);
      drawSheet(word, view, z('sheet'), LINE, [120, 170, 255], 2.6 * k, lines, 0.3);
      word.globalAlpha = 1;

      /* in front: flowers, buttons, names, and at the end the real thing */
      const bloom = clamp(facing * 1.2);
      LASER.holes.forEach(([hx, hy]) => drawFlowerFace(fg, view, z('flowers'), hx - LASER.centre[0], hy - LASER.centre[1], 15, 0.25 + 0.75 * bloom, LINE, DEEP, 2.4 * k, lines));
      BUTTONS.forEach(([bx, by]) => drawDrum(fg, view, bx, by, z('flowers') - 6, z('flowers'), 7, LINE, DEEP, 2.2 * k, lines));

      const names: Array<[string, keyof typeof GROUPS | 'front', number, number]> = [
        ['back layer', 'back', -120, -190],
        ['324 lights, 3 motors, 1 board', 'inside', 140, -150],
        ['front layer, engraved', 'front', 60, -182],
        ['frosted acrylic', 'sheet', 90, -30],
        ['3 flowers, 3 buttons', 'flowers', 60, 100],
      ];
      // the names are printed on the sheet itself: crisp, and they throw no shadow
      names.forEach(([text, group, px, py], i) => {
        const at = group === 'front' ? 3 : GROUPS[group].at;
        const alpha = (1 - smoothstep(at + 0.9, at + 1.7, t)) * smoothstep(0.1, 0.6, t) + smoothstep(OPEN_AGAIN + 0.6, OPEN_AGAIN + 1.2, t);
        if (alpha <= 0.02) return;
        const depth = group === 'front' ? 0 : z(group);
        const from = plotOnPlate(view, px, py, depth);
        const tx = 1380 * k;
        const ty = (170 + i * 128) * k;
        // the pointer lies over the part it points at; the name itself is print
        fg.globalAlpha = clamp(alpha);
        fg.strokeStyle = rgba(GLOW, 0.9);
        fg.lineWidth = 2.2 * k;
        fg.beginPath(); fg.moveTo(from.x, from.y); fg.lineTo(tx - 16 * k, ty); fg.stroke();
        fg.fillStyle = rgba(GLOW);
        fg.beginPath(); fg.arc(from.x, from.y, 6 * k, 0, Math.PI * 2); fg.fill();
        fg.globalAlpha = 1;
        base.globalAlpha = clamp(alpha);
        base.fillStyle = rgba(LINE);
        base.font = `600 ${38 * k}px ${SANS}`;
        base.textAlign = 'left';
        base.textBaseline = 'middle';
        base.fillText(text, tx, ty);
        base.globalAlpha = 1;
      });

      drawProduct(fg, product, view.x, view.y, view.scale, real);

      base.textAlign = 'left';
      base.textBaseline = 'alphabetic';
      base.fillStyle = rgba(LINE, 0.96);
      base.font = `800 ${210 * k}px ${SANS}`;
      (base as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-210 * k * 0.05).toFixed(2)}px`;
      base.fillText('SURYA', 96 * k, 1112 * k);
      base.font = `650 ${28 * k}px ${SANS}`;
      (base as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(28 * k * 0.18).toFixed(2)}px`;
      base.fillStyle = rgba(GLOW);
      base.fillText(real > 0.5 ? 'THE REAL ONE' : facing > 0.5 ? 'TOGETHER' : 'EVERY PART, APART', 104 * k, 906 * k);
      (base as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0px';
    },
  });
}

export const suryaWhole: LiveScene = { id: 'surya-whole', sources: Object.values(SRC), create: createWhole };
