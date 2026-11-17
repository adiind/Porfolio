/**
 * Live pages: a flip-book page that is drawn again every frame instead of
 * being one still picture.
 *
 * A live page paints the same three layers a still page has (the printed
 * sheet, the giant letters floating above it, and the cut-outs above those),
 * so the 3D book can bend it, light it and slide its layers like any other.
 */

import type { BookImages } from '../pageArt';

export interface LiveInput {
  /** Seconds since the last frame. 0 redraws without letting time pass. */
  dt: number;
  /** Pointer over the sheet (u: 0 at the spine to 1 at the outer edge, v: 0 foot to 1 head), or null. */
  pointer: { u: number; v: number } | null;
  /** How far the sheet is through its turn: 0 lying open, 1 turned away. */
  turn: number;
  /** Turn speed in turns per second, positive while the sheet is leaving. */
  turnVel: number;
  /** True while this is the page being read. */
  onTop: boolean;
  /** Reduced motion: draw the resting picture and hold it. */
  reduced: boolean;
}

export interface LiveCanvases {
  /** Printed sheet, opaque. */
  base: HTMLCanvasElement;
  /** Letters, on a transparent ground. */
  word: HTMLCanvasElement;
  /** Characters and foreground, on a transparent ground. */
  fg: HTMLCanvasElement;
  /** Small soft shadows: red = foreground, green = letters. */
  shadow: HTMLCanvasElement;
}

export interface LivePage {
  readonly canvases: LiveCanvases;
  /** Advance and redraw. Returns true while the page wants more frames. */
  frame(input: LiveInput): boolean;
  /** The page has just become the one on top: start its story from the beginning. */
  enter(): void;
  /** Review captures: hold the story at one position (null lets it run again). */
  scrub(position: number | null): void;
  /** Everything pressed onto one canvas, for flat views. */
  flatten(target: HTMLCanvasElement): void;
  dispose(): void;
}

export interface LiveScene {
  id: string;
  /** Pictures the scene needs, loaded with the book's other pictures. */
  sources: string[];
  create(images: BookImages, width: number, height: number): LivePage;
}
