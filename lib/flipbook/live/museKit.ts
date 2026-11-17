/**
 * Shared helpers for the Muse book's seven picture pages (museTangible.ts ... museButton.ts).
 * The Muse book's seven picture pages: one giant idea-word each, acted out as a small play.
 *
 * The words are Adi's (2026-11-14): TANGIBLE ("AI needs a physical presence"), ORCHESTRATE
 * ("I was the one orchestrating agents"), IMAGINE (his input becomes a model), FIT (his specs,
 * the cutout for the board), REAL (the soft pouch), SNAP (print and assemble), BUTT ON (the
 * button he mounted at the bottom, a pun he chose). Every page follows the Surya rules: the
 * letters take part, small people act in two or three poses, nothing rests completely, the page
 * reacts when it lands, and each story names a rest frame for stills and reduced motion.
 * Drawn pieces come from scripts/flipbook/make-live-sprites.py with BOOK=muse.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Rgb, type Spring } from './motion';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

export type Sheets = { plate: HTMLImageElement; letters: HTMLImageElement; people: HTMLImageElement; parts?: HTMLImageElement };
export const dirOf = (page: string) => `/images/flipbook/muse/${page}`;
export const srcOf = (page: string, parts = false) => {
  const d = dirOf(page);
  return { plate: `${d}/plate.webp`, letters: `${d}/letters.webp`, people: `${d}/people.webp`, ...(parts ? { parts: `${d}/parts.webp` } : {}) };
};
export function sheets(images: BookImages, src: Record<string, string>, name: string): Sheets {
  const got = Object.fromEntries(Object.entries(src).map(([key, value]) => [key, images.get(value)]));
  if (Object.values(got).some((img) => !img)) throw new Error(`The ${name} page is missing a picture.`);
  return got as unknown as Sheets;
}
/** Stand the word across the page, `width` scene units wide, feet at `feet`. */
export const lay = (sprites: readonly SheetSprite[], width: number, feet: number): Letter[] =>
  makeLetters(sprites, { scale: width / wordSpan(sprites).width, left: (STAGE_W - width) / 2, feet });
/** The letter's thickness: a darker copy drawn a few units behind it. */
export const side = (stage: Stage, sheet: HTMLImageElement, colour: string): HTMLCanvasElement => stage.keep(tintSheet(sheet, colour));
/** Whether a beat at `at` happened during this frame. */
export const crossed = (t: number, dt: number, at: number): boolean => dt > 0 && t >= at && t - dt < at;
export const bob = (clock: number, speed: number, size: number, phase = 0): number => Math.abs(Math.sin(clock * speed + phase)) * size;

