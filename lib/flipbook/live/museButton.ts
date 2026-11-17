/** Muse book, picture page: BUTT ON. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { BUTTON_SPRITES } from './sprites/button';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 7. BUTT ON =============================== */
/* Muse stands with its back to us: a button on its bottom. The maker reaches over and presses
   it. The O, itself a button, presses in; sound rings out; the letters bounce; Muse turns
   round and talks, then nods off until the next press. Pointing at the O presses it too. */
const BUTTON_SRC = srcOf('button');
function createButton(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, BUTTON_SRC, 'Butt on');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(BUTTON_SPRITES.letters.sprites, 1640, 820);
  letters.forEach((letter, i) => { (letter as { px: number }).px += i < 4 ? -70 : 70; });
  const back = side(stage, s.letters, '#7a1240');
  const people = BUTTON_SPRITES.people.sprites;
  const o = letters[4];
  const PRESS = 0.7;
  const bounce: Spring = { x: 0, v: 0 };
  const press: Spring = { x: 0, v: 0 };
  let rings: number[] = [];
  let pointed = -9;
  const ring = (at: number, pointer = false) => { rings.push(at); hopInTurn(letters, 0.06, 0.05); press.v -= 6; if (pointer) bounce.v += 2.4; };
  return loopPage(stage, {
    loop: 2,
    rest: 2,
    once: true,
    enter() { rings = []; pointed = -9; press.x = 0; press.v = 0; bounce.x = 0; bounce.v = 0; },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (crossed(t, input.dt, PRESS)) ring(clock);
      // the reader's pointer over the O presses it as well
      if (input.pointer && input.dt > 0 && clock - pointed > 1.6) {
        const px = input.pointer.u * STAGE_W;
        const py = (1 - input.pointer.v) * 1200;
        if (Math.abs(px - o.px) < o.w * o.scale / 2 && py > o.py - o.h * o.scale && py < o.py) { pointed = clock; ring(clock, true); }
      }
      rings = rings.filter((r) => clock - r < 1.6);
      if (input.dt > 0) { springTo(press, 0, 14, 0.35, input.dt); springTo(bounce, 0, 16, 0.4, input.dt); }
      letters.forEach((letter) => restPose(letter, clock, 0.007));
      o.scaleX *= 1 + Math.min(0, press.x) * 0.012;
      o.scaleY *= 1 + Math.min(0, press.x) * 0.02;
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.85);
      stage.tooth();
      letters.forEach((letter) => { drawLetter(word, back, letter, k, 7, 8); drawLetter(word, s.letters, letter, k); });
      // sound rings out from Muse
      const mx = 1000;
      rings.forEach((r) => {
        const age = clock - r;
        [0, 0.2, 0.4].forEach((delay) => {
          const a = age - delay;
          if (a <= 0 || a > 0.9) return;
          fg.strokeStyle = rgba([150, 20, 80], 0.55 * (1 - a / 0.9));
          fg.lineWidth = 16 * k;
          fg.beginPath(); fg.arc(mx * k, 1030 * k, (210 + a * 240) * k, Math.PI * 1.15, Math.PI * 1.85); fg.stroke();
        });
      });
      const talking = t > PRESS + 0.2;
      const asleep = false;
      const mPose = talking ? 'muse-talk' : asleep ? 'muse-sleep' : 'muse-back';
      drawSprite(fg, s.people, spriteNamed(people, mPose), k, {
        x: mx, y: 1188 - (talking ? bob(clock, 3.2, 7) : 0) - Math.max(0, bounce.x) * 40, scale: 2.1,
        squash: (talking ? 0.02 * Math.sin(clock * 5) : 0) - bounce.x * 0.05,
      });
      const reach = t < PRESS - 0.05 ? smoothstep(0, PRESS - 0.1, t) : 1 - smoothstep(PRESS + 0.3, PRESS + 1.0, t);
      drawSprite(fg, s.people, spriteNamed(people, t > PRESS - 0.1 && t < PRESS + 0.45 ? 'maker-press' : 'maker-reach'), k, { x: lerp(1720, mx + 250, reach), y: 1186, scale: 1.5 });
    },
  });
}
export const museButton: LiveScene = { id: 'muse-button', sources: Object.values(BUTTON_SRC), create: createButton };
