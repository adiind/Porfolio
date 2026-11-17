/**
 * "Glow": a matrix display behind frosted acrylic.
 *
 * The word is an LED matrix: hard points of light in the dark workshop. Two
 * people carry a sheet of frosted acrylic across it, and wherever the sheet
 * is, the points melt into one soft glow. In the 3D book the sheet floats in
 * front of the lights, as the real acrylic does.
 */

import type { BookImages } from '../pageArt';
import { clamp, rgba } from './motion';
import { GLOW_SPRITES } from './sprites/glow';
import {
  STAGE_W, context, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeCanvas, makeLetters, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan,
} from './stage';
import type { LivePage, LiveScene } from './types';

const DIR = '/images/flipbook/surya/glow';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

const LOOP = 10.5;
const WORD_W = 1900;
const FEET = 1004;
/** The frosted sheet: its size, and the path of its middle across the page. */
const PANE = { w: 760, top: 318, bottom: 1052 };
const paneX = (t: number): number => -520 + (3040 * t) / LOOP;

function createGlow(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Glow page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = GLOW_SPRITES.letters.sprites;
  const letters = makeLetters(sprites, { scale: WORD_W / wordSpan(sprites).width, left: (STAGE_W - WORD_W) / 2, feet: FEET });
  const people = GLOW_SPRITES.people.sprites;
  const sw = sheet.naturalWidth;
  const sh = sheet.naturalHeight;

  // the letters as an unlit panel, as points of light, and as the haze around those points
  const panel = stage.keep(tintSheet(sheet, '#081a48'));
  const dots = stage.keep(makeCanvas(sw, sh));
  {
    const c = context(dots);
    const pitch = 21;
    c.fillStyle = '#e4f6ff';
    for (let y = pitch / 2; y < sh; y += pitch) {
      for (let x = pitch / 2; x < sw; x += pitch) {
        c.beginPath(); c.arc(x, y, 6.6, 0, Math.PI * 2); c.fill();
      }
    }
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(sheet, 0, 0);
  }
  const blurred = (source: CanvasImageSource, colour: string, shrink: number): HTMLCanvasElement => {
    const small = makeCanvas(sw / shrink, sh / shrink);
    context(small).drawImage(source, 0, 0, small.width, small.height);
    const out = stage.keep(makeCanvas(sw, sh));
    const c = context(out);
    c.drawImage(small, 0, 0, sw, sh);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = colour;
    c.fillRect(0, 0, sw, sh);
    small.width = 1; small.height = 1;
    return out;
  };
  const haze = blurred(dots, '#2f9dff', 7);
  // behind the frosted sheet: one even glow
  const bloom = blurred(sheet, '#5ab4ff', 14);
  const lit = stage.keep(tintSheet(sheet, '#d9f1ff'));

  const drawPane = (x: number, clock: number): void => {
    const left = x - PANE.w / 2;
    const ctx = fg;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left * k, PANE.top * k, PANE.w * k, (PANE.bottom - PANE.top) * k);
    ctx.clip();
    // through the sheet the workshop is misted over
    ctx.fillStyle = rgba([36, 70, 150], 0.5);
    ctx.fillRect(left * k, PANE.top * k, PANE.w * k, (PANE.bottom - PANE.top) * k);
    // ... and the letters are one soft light instead of points
    ctx.globalAlpha = 0.9;
    letters.forEach((letter) => drawLetter(ctx, bloom, letter, k, 0, 0));
    letters.forEach((letter) => drawLetter(ctx, bloom, letter, k, 0, 0));
    ctx.globalAlpha = 0.96 + 0.04 * Math.sin(clock * 2.2);
    letters.forEach((letter) => drawLetter(ctx, lit, letter, k, 0, 0));
    ctx.globalAlpha = 1;
    // sheen across the sheet
    const sheen = ctx.createLinearGradient(left * k, PANE.top * k, (left + PANE.w) * k, PANE.bottom * k);
    sheen.addColorStop(0, rgba([255, 255, 255], 0.16));
    sheen.addColorStop(0.3, rgba([255, 255, 255], 0.02));
    sheen.addColorStop(0.55, rgba([255, 255, 255], 0.1));
    sheen.addColorStop(1, rgba([255, 255, 255], 0));
    ctx.fillStyle = sheen;
    ctx.fillRect(left * k, PANE.top * k, PANE.w * k, (PANE.bottom - PANE.top) * k);
    ctx.restore();
    ctx.strokeStyle = rgba([214, 236, 255], 0.9);
    ctx.lineWidth = 7 * k;
    ctx.strokeRect(left * k, PANE.top * k, PANE.w * k, (PANE.bottom - PANE.top) * k);
  };

  return loopPage(stage, {
    loop: LOOP,
    rest: 5.25,
    enter() { hopInTurn(letters); },
    step(_t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter) => restPose(letter, clock, 0.004));
    },
    draw(t, clock) {
      const x = paneX(t);

      /* printed sheet: the dark workshop, with the display's light spilling onto it */
      stage.backdrop(plate, 0.78);
      const spill = base.createRadialGradient(1000 * k, 760 * k, 0, 1000 * k, 760 * k, 1100 * k);
      spill.addColorStop(0, rgba([60, 140, 255], 0.3 + 0.03 * Math.sin(clock * 3.1)));
      spill.addColorStop(1, rgba([60, 140, 255], 0));
      base.globalCompositeOperation = 'screen';
      base.fillStyle = spill;
      base.fillRect(0, 0, width, height);
      base.globalCompositeOperation = 'source-over';
      stage.tooth(0.05);

      /* floating sheet: the word as a matrix of lights */
      letters.forEach((letter) => drawLetter(word, panel, letter, k, 7, 8));
      letters.forEach((letter) => drawLetter(word, panel, letter, k));
      word.globalCompositeOperation = 'lighter';
      letters.forEach((letter) => drawLetter(word, haze, letter, k));
      word.globalCompositeOperation = 'source-over';
      letters.forEach((letter) => drawLetter(word, dots, letter, k));
      // a ripple runs through the lights, as it does on a display being refreshed
      word.globalCompositeOperation = 'source-atop';
      const sweep = ((clock * 0.42) % 1.6) - 0.3;
      const ripple = word.createLinearGradient((sweep - 0.16) * width, 0, (sweep + 0.16) * width, height * 0.3);
      ripple.addColorStop(0, rgba([8, 26, 72], 0));
      ripple.addColorStop(0.5, rgba([8, 26, 72], 0.5));
      ripple.addColorStop(1, rgba([8, 26, 72], 0));
      word.fillStyle = ripple;
      word.fillRect(0, 0, width, height);
      word.globalCompositeOperation = 'source-over';

      /* in front: the frosted sheet and the two who carry it */
      drawPane(x, clock);
      const stride = Math.floor(clock * 3.6) % 2;
      const bob = Math.abs(Math.sin(clock * 3.6 * Math.PI)) * 6;
      drawSprite(fg, peopleSheet, spriteNamed(people, stride ? 'girl-b' : 'girl-a'), k, { x: x - PANE.w / 2 - 58, y: 1172 - bob, scale: 0.78 });
      drawSprite(fg, peopleSheet, spriteNamed(people, stride ? 'maker-a' : 'maker-b'), k, { x: x + PANE.w / 2 + 62, y: 1172 - bob, scale: 0.78, flip: true });
      void clamp;
    },
  });
}

export const suryaGlow: LiveScene = { id: 'surya-glow', sources: Object.values(SRC), create: createGlow };
