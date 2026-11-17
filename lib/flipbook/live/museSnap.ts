/** Muse book, picture page: SNAP. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { SNAP_SPRITES } from './sprites/snap';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 6. SNAP =============================== */
/* Every letter is two printed halves. One by one the halves slide together and click shut;
   the maker presses, the girl hands over the pegs, and both cheer when the word is whole. */
const SNAP_SRC = srcOf('snap');
function createSnap(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, SNAP_SRC, 'Snap');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(SNAP_SPRITES.letters.sprites, 1500, 930);
  const back = side(stage, s.letters, '#1f5a2c');
  const people = SNAP_SPRITES.people.sprites;
  const at = (i: number) => 0.2 + i * 0.25;
  const gaps: Spring[] = letters.map(() => ({ x: 1, v: 0 }));
  const END = 1.5;
  const half = (letter: Letter, sheet: CanvasImageSource, gap: number, left: boolean, dx = 0, dy = 0) => {
    word.save();
    word.translate((left ? -gap : gap) * k, 0);
    word.beginPath();
    if (left) word.rect(0, 0, (letter.px + letter.shiftX) * k, height);
    else word.rect((letter.px + letter.shiftX) * k, 0, width, height);
    word.clip();
    drawLetter(word, sheet, letter, k, dx, dy);
    word.restore();
  };
  return loopPage(stage, {
    loop: 2,
    rest: 2,
    once: true,
    enter() { gaps.forEach((g) => { g.x = 1; g.v = 0; }); },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (crossed(t, input.dt, END)) hopInTurn(letters, 0.05, 0.1);
      letters.forEach((letter, i) => {
        const goal = t >= at(i) ? 0 : 1;
        if (input.dt > 0) springTo(gaps[i], goal, goal ? 6 : 16, goal ? 1 : 0.5, input.dt); else gaps[i].x = goal;
        if (crossed(t, input.dt, at(i) + 0.08)) letter.hop.v += 260;
        restPose(letter, clock, 0.005);
      });
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.85);
      stage.tooth();
      letters.forEach((letter, i) => {
        const gap = Math.max(0, gaps[i].x) * 14;
        if (gap < 0.5) { drawLetter(word, back, letter, k, 7, 8); drawLetter(word, s.letters, letter, k); return; }
        [true, false].forEach((left) => { half(letter, back, gap, left, 7, 8); half(letter, s.letters, gap, left); });
      });
      const done = t >= END;
      drawSprite(fg, s.people, spriteNamed(people, done ? 'maker-cheer' : 'maker-press'), k, { x: 170, y: 1184 - (done ? bob(clock, 2.6, 9) : bob(t, 4, 6)), scale: 1.35 });
      drawSprite(fg, s.people, spriteNamed(people, done ? 'girl-clap' : 'girl-peg'), k, { x: 1840, y: 1184 - (done ? bob(clock, 2.6, 7, 1) : 0), scale: 1.35 });
    },
  });
}
export const museSnap: LiveScene = { id: 'muse-snap', sources: Object.values(SNAP_SRC), create: createSnap };
