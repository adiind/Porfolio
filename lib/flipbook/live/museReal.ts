/** Muse book, picture page: REAL. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { REAL_SPRITES } from './sprites/real';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 5. REAL =============================== */
/* The letters start as flat, pale cut-outs. The maker stitches round each one; as its stitch
   closes, the letter puffs up into soft padded leather. */
const REAL_SRC = srcOf('real');
function createReal(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, REAL_SRC, 'Real');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(REAL_SPRITES.letters.sprites, 1440, 930);
  const back = side(stage, s.letters, '#4a2410');
  const flat = side(stage, s.letters, '#e9d3b2');
  const people = REAL_SPRITES.people.sprites;
  const SEW = 0.35;
  const at = (i: number) => 0.1 + i * SEW;
  const pop: Spring = { x: 0, v: 0 };
  let lastPose = '';
  const puffs: Spring[] = letters.map(() => ({ x: 0, v: 0 }));
  const END = 1.6;
  return loopPage(stage, {
    loop: 2,
    rest: 2,
    once: true,
    enter() { puffs.forEach((p) => { p.x = 0; p.v = 0; }); pop.x = 0; pop.v = 0; lastPose = ''; },
    step(t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter, i) => {
        const goal = t >= at(i) + SEW ? 1 : 0;
        if (input.dt > 0) springTo(puffs[i], goal, 9, 0.35, input.dt); else puffs[i].x = goal;
        if (crossed(t, input.dt, at(i) + SEW)) letter.hop.v += 330;
        restPose(letter, clock, 0.006);
        const p = clamp(puffs[i].x, 0, 1.3);
        letter.scaleX *= 0.94 + 0.06 * p;
        letter.scaleY *= 0.9 + 0.1 * p;
        // held puffed leather breathes a little
        const breath = 0.006 * Math.sin(clock * 1.7 + letter.phase) * p;
        letter.scaleX *= 1 + breath; letter.scaleY *= 1 - breath;
      });
      if (input.dt > 0) springTo(pop, 0, 17, 0.38, input.dt); else pop.x = 0;
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.85);
      stage.tooth();
      letters.forEach((letter, i) => {
        const p = clamp(puffs[i].x);
        if (p < 0.99) drawLetter(word, flat, letter, k);
        if (p > 0.01) {
          word.save();
          word.globalAlpha = p;
          drawLetter(word, back, letter, k, 7 * p, 8 * p);
          drawLetter(word, s.letters, letter, k);
          word.restore();
        }
      });
      // the thread runs from the needle to the letter being stitched
      const sewing = letters.findIndex((_, i) => t >= at(i) && t < at(i) + SEW);
      const sewPose = sewing >= 0 ? (Math.sin(t * 12) > 0 ? 'sew-up' : 'sew-pull') : t >= END ? 'proud' : 'sew-up';
      if (lastPose && sewPose !== lastPose && (sewPose === 'proud' || lastPose === 'proud')) pop.v += 2.2;
      lastPose = sewPose;
      const mx = 1840;
      drawSprite(fg, s.people, spriteNamed(people, sewPose), k, { x: mx, y: 1184, scale: 1.35, flip: true, squash: pop.x });
      if (sewing >= 0) {
        const letter = letters[sewing];
        const a = (t - at(sewing)) / SEW;
        const ang = a * Math.PI * 2;
        const rx = letter.w * letter.scale * 0.42;
        const ry = letter.h * letter.scale * 0.42;
        const px = letter.px + rx * Math.sin(ang);
        const py = letter.py - letter.h * letter.scale / 2 - ry * Math.cos(ang);
        fg.strokeStyle = rgba([250, 236, 210], 0.95);
        fg.lineWidth = 5 * k;
        fg.beginPath();
        fg.moveTo((mx - 70) * k, 820 * k);
        fg.quadraticCurveTo(((mx + px) / 2) * k, (Math.max(py, 820) + 180 + 30 * Math.sin(clock * 3)) * k, px * k, py * k);
        fg.stroke();
        fg.fillStyle = rgba([250, 236, 210]);
        fg.beginPath(); fg.arc(px * k, py * k, 9 * k, 0, Math.PI * 2); fg.fill();
      }
    },
  });
}
export const museReal: LiveScene = { id: 'muse-real', sources: Object.values(REAL_SRC), create: createReal };
