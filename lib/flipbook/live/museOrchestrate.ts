/** Muse book, picture page: ORCHESTRATE. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { ORCHESTRATE_SPRITES } from './sprites/orchestrate';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 2. ORCHESTRATE =============================== */
/* The maker conducts. On every beat a letter drops into its place; small agent robots bob to the
   beat; when the word is whole the robots cheer and the maker opens his arms. */
const ORCH_SRC = srcOf('orchestrate');
function createOrchestrate(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, ORCH_SRC, 'Orchestrate');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(ORCHESTRATE_SPRITES.letters.sprites, 1700, 900);
  const back = side(stage, s.letters, '#0f5148');
  const people = ORCHESTRATE_SPRITES.people.sprites;
  const PLAY = 2;
  const BEAT = 0.11;
  const at = (i: number) => 0.1 + i * BEAT;
  const DONE = 1.5;
  const drops: Spring[] = letters.map(() => ({ x: 1, v: 0 }));
  return loopPage(stage, {
    loop: PLAY,
    rest: PLAY,
    once: true,
    enter() { drops.forEach((d) => { d.x = 1; d.v = 0; }); },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (crossed(t, input.dt, DONE)) hopInTurn(letters, 0.04, 0);
      letters.forEach((letter, i) => {
        const goal = t >= at(i) ? 0 : 1;
        if (input.dt > 0) springTo(drops[i], goal, 20, 0.5, input.dt);
        else { drops[i].x = goal; drops[i].v = 0; }
        if (crossed(t, input.dt, at(i) + 0.08)) letter.hop.v -= 160;
        restPose(letter, clock, 0.006);
        letter.lift += Math.max(-0.015, drops[i].x) * 760;
      });
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.9);
      stage.tooth();
      letters.forEach((letter, i) => {
        if (drops[i].x > 0.98) return;
        drawLetter(word, back, letter, k, 6, 7);
        drawLetter(word, s.letters, letter, k);
      });
      const beat = Math.floor((t - 0.1) / BEAT);
      const pose = t >= DONE ? 'maker-wide' : Math.floor(t / 0.33) % 2 === 0 ? 'maker-up' : 'maker-down';
      drawSprite(fg, s.people, spriteNamed(people, pose), k, { x: 160, y: 1182, scale: 1.45 });
      [600, 1040, 1480, 1880].forEach((x, j) => {
        const cheer = t >= DONE;
        const bp = cheer ? 'bot-cheer' : 'bot-a';
        drawSprite(fg, s.people, spriteNamed(people, bp), k, { x, y: 1170 - (cheer ? bob(clock, 2.4, 10, j * 0.9) : bob(t, 3, 8, j * 0.9)), scale: 1.45 });
      });
    },
  });
}
export const museOrchestrate: LiveScene = { id: 'muse-orchestrate', sources: Object.values(ORCH_SRC), create: createOrchestrate };
