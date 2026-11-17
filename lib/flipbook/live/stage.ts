/**
 * Shared kit for live pages: the three layer canvases, giant letters that
 * stand, sway, hop and lean, small people who change pose, and the soft
 * shadows the 3D book needs. A scene owns its story; this file owns the
 * plumbing every scene would otherwise repeat.
 *
 * Scene units: the page is 2000 wide and 1200 tall whatever size it is drawn at.
 */

import { clamp, hash, springTo, type Spring } from './motion';
import type { LiveCanvases, LiveInput } from './types';

export const STAGE_W = 2000;
export const STAGE_H = 1200;
/** Sprites are cut with this many pixels of spare room around them. */
export const SPRITE_PAD = 3;

export type Box = readonly [number, number, number, number];
export interface SheetSprite {
  readonly name: string;
  readonly rect: readonly number[];
  /** Box on the raw drawn sheet, before packing and scaling. */
  readonly source?: readonly number[];
  /** Openings enclosed by the piece (an O's middle, a window), biggest first, on the raw sheet. */
  readonly holes?: readonly (readonly number[])[];
}

export const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
};

export const context = (canvas: HTMLCanvasElement, opaque = false): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d', opaque ? { alpha: false } : undefined);
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
};

/** A copy of a sprite sheet in one flat colour (same shapes): for thickness edges, glows and masks. */
export const tintSheet = (sheet: CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }, colour: string): HTMLCanvasElement => {
  const w = sheet.naturalWidth ?? sheet.width ?? 1;
  const h = sheet.naturalHeight ?? sheet.height ?? 1;
  const out = makeCanvas(w, h);
  const c = context(out);
  c.drawImage(sheet, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = colour;
  c.fillRect(0, 0, w, h);
  return out;
};

export interface Stage {
  /** Canvas pixels per scene unit. */
  readonly k: number;
  readonly width: number;
  readonly height: number;
  readonly canvases: LiveCanvases;
  readonly base: CanvasRenderingContext2D;
  readonly word: CanvasRenderingContext2D;
  readonly fg: CanvasRenderingContext2D;
  /** Clear the two transparent layers and reset every layer's drawing state. */
  begin(): void;
  /** Draw a backdrop picture cropped evenly to the page. `anchor` 0 keeps its top, 1 its foot. */
  backdrop(image: HTMLImageElement, anchor?: number): void;
  /** Paper tooth over the printed sheet, so shapes drawn in code sit with the drawn ones. */
  tooth(strength?: number): void;
  /** Redraw the small soft shadows of the two floating layers. Call last. */
  castShadows(): void;
  flatten(target: HTMLCanvasElement): void;
  /** Track a scratch canvas so dispose() frees it. */
  keep<T extends HTMLCanvasElement>(canvas: T): T;
  dispose(): void;
}

export function createStage(width: number, height: number): Stage {
  const k = width / STAGE_W;
  const canvases: LiveCanvases = {
    base: makeCanvas(width, height),
    word: makeCanvas(width, height),
    fg: makeCanvas(width, height),
    shadow: makeCanvas(width / 4, height / 4),
  };
  const base = context(canvases.base, true);
  const word = context(canvases.word);
  const fg = context(canvases.fg);
  const shadow = context(canvases.shadow, true);
  const blurA = makeCanvas(width / 4, height / 4);
  const blurB = makeCanvas(width / 11, height / 11);
  const blurActx = context(blurA);
  const blurBctx = context(blurB);
  const grain = makeCanvas(160, 160);
  {
    const c = context(grain);
    const data = c.createImageData(160, 160);
    for (let i = 0; i < data.data.length; i += 4) {
      const value = 104 + hash(i * 0.25 + 3) * 112;
      data.data[i] = value; data.data[i + 1] = value; data.data[i + 2] = value; data.data[i + 3] = 255;
    }
    c.putImageData(data, 0, 0);
  }
  const grainPattern = base.createPattern(grain, 'repeat');
  const kept: HTMLCanvasElement[] = [canvases.base, canvases.word, canvases.fg, canvases.shadow, blurA, blurB, grain];

  const reset = (ctx: CanvasRenderingContext2D): void => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  return {
    k, width, height, canvases, base, word, fg,
    begin() {
      reset(base); reset(word); reset(fg);
      word.clearRect(0, 0, width, height);
      fg.clearRect(0, 0, width, height);
    },
    backdrop(image, anchor = 0.6) {
      const cropH = image.naturalWidth * (STAGE_H / STAGE_W);
      const sy = Math.max(0, (image.naturalHeight - cropH) * anchor);
      base.drawImage(image, 0, sy, image.naturalWidth, Math.min(cropH, image.naturalHeight), 0, 0, width, height);
    },
    tooth(strength = 0.07) {
      if (!grainPattern) return;
      base.globalAlpha = strength;
      base.globalCompositeOperation = 'overlay';
      base.fillStyle = grainPattern;
      base.fillRect(0, 0, width, height);
      base.globalAlpha = 1;
      base.globalCompositeOperation = 'source-over';
    },
    castShadows() {
      const w = canvases.shadow.width;
      const h = canvases.shadow.height;
      shadow.globalCompositeOperation = 'source-over';
      shadow.fillStyle = '#000';
      shadow.fillRect(0, 0, w, h);
      const cast = (source: HTMLCanvasElement, colour: string): void => {
        blurBctx.globalCompositeOperation = 'source-over';
        blurBctx.clearRect(0, 0, blurB.width, blurB.height);
        blurBctx.drawImage(source, 0, 0, blurB.width, blurB.height);
        blurActx.globalCompositeOperation = 'source-over';
        blurActx.clearRect(0, 0, w, h);
        blurActx.drawImage(blurB, 0, 0, w, h);
        blurActx.globalCompositeOperation = 'source-in';
        blurActx.fillStyle = colour;
        blurActx.fillRect(0, 0, w, h);
        shadow.globalCompositeOperation = 'lighter';
        shadow.drawImage(blurA, 0, 0);
      };
      cast(canvases.fg, '#f00');
      cast(canvases.word, '#0f0');
    },
    flatten(target) {
      if (target.width !== width) target.width = width;
      if (target.height !== height) target.height = height;
      const ctx = context(target, true);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(canvases.base, 0, 0);
      const cast = (source: HTMLCanvasElement, alpha: number, offset: number): void => {
        blurBctx.globalCompositeOperation = 'source-over';
        blurBctx.clearRect(0, 0, blurB.width, blurB.height);
        blurBctx.drawImage(source, 0, 0, blurB.width, blurB.height);
        blurBctx.globalCompositeOperation = 'source-in';
        blurBctx.fillStyle = '#000';
        blurBctx.fillRect(0, 0, blurB.width, blurB.height);
        ctx.globalAlpha = alpha;
        ctx.drawImage(blurB, offset * k, offset * 1.4 * k, width, height);
        ctx.globalAlpha = 1;
      };
      cast(canvases.word, 0.2, 9);
      ctx.drawImage(canvases.word, 0, 0);
      cast(canvases.fg, 0.24, 11);
      ctx.drawImage(canvases.fg, 0, 0);
    },
    keep(canvas) { kept.push(canvas); return canvas; },
    dispose() { kept.forEach((canvas) => { canvas.width = 1; canvas.height = 1; }); },
  };
}

/* ---------- giant letters ---------- */

export interface WordLayout {
  /** Scale from letter-sheet pixels to scene units. */
  scale: number;
  /** Scene x where the sheet's leftmost letter edge lands, and scene y of the letters' feet. */
  left: number;
  feet: number;
}

export interface Letter {
  readonly rect: Box;
  /** Where it stands: the middle of its feet, in scene units. */
  readonly px: number;
  readonly py: number;
  /** Size and position on the letter sheet, in sheet pixels. */
  readonly w: number;
  readonly h: number;
  readonly sx: number;
  readonly sy: number;
  readonly scale: number;
  readonly index: number;
  readonly phase: number;
  /** A general "how lively" value the scene drives (0 = at rest, 1 = up). Springs, so it may overshoot. */
  energy: Spring;
  lean: Spring;
  hop: Spring;
  hopIn: number;
  /** This frame's pose. */
  angle: number;
  scaleX: number;
  scaleY: number;
  lift: number;
  shiftX: number;
}

/** Stand a sheet of letters in a row, keeping the spacing they were drawn with. */
export function makeLetters(sprites: readonly SheetSprite[], layout: WordLayout): Letter[] {
  const sources = sprites.map((sprite) => sprite.source ?? [0, 0, sprite.rect[2], sprite.rect[3]]);
  const sheetLeft = Math.min(...sources.map((s) => s[0]));
  const sheetFeet = Math.max(...sources.map((s) => s[1] + s[3]));
  return sprites.map((sprite, index) => {
    const [sx, sy, w, h] = sources[index];
    return {
      rect: sprite.rect as unknown as Box,
      px: layout.left + (sx + w / 2 - sheetLeft) * layout.scale,
      py: layout.feet + (sy + h - sheetFeet) * layout.scale,
      w, h, sx, sy,
      scale: layout.scale,
      index,
      phase: hash(index + 1) * Math.PI * 2,
      energy: { x: 0, v: 0 },
      lean: { x: 0, v: 0 },
      hop: { x: 0, v: 0 },
      hopIn: -1,
      angle: 0, scaleX: 1, scaleY: 1, lift: 0, shiftX: 0,
    };
  });
}

/** Width of a word laid out by makeLetters, in sheet pixels (for choosing a scale that fills the page). */
export const wordSpan = (sprites: readonly SheetSprite[]): { width: number; height: number } => {
  const sources = sprites.map((sprite) => sprite.source ?? [0, 0, sprite.rect[2], sprite.rect[3]]);
  const left = Math.min(...sources.map((s) => s[0]));
  const right = Math.max(...sources.map((s) => s[0] + s[2]));
  const top = Math.min(...sources.map((s) => s[1]));
  const feet = Math.max(...sources.map((s) => s[1] + s[3]));
  return { width: right - left, height: feet - top };
};

/** Shared physics: the lean a turning page gives, hops that were asked for, and settling. */
export function stepLetters(letters: Letter[], input: LiveInput): number {
  const turnLean = clamp(-input.turnVel * 0.035, -0.11, 0.11);
  letters.forEach((letter) => {
    springTo(letter.lean, turnLean, 11, 0.32, input.dt);
    if (letter.hopIn >= 0) {
      letter.hopIn -= input.dt;
      if (letter.hopIn < 0) letter.hop.v += 430;
    }
    springTo(letter.hop, 0, 13, 0.42, input.dt);
  });
  return turnLean;
}

/** The letters hop one after another, as when a page lands. */
export const hopInTurn = (letters: Letter[], gap = 0.07, delay = 0.1): void => {
  letters.forEach((letter, i) => { letter.hopIn = delay + i * gap; });
};

/** A plain pose: upright, swaying a little, with any hop and lean on top. Scenes add to it. */
export function restPose(letter: Letter, clock: number, sway = 0.009): void {
  letter.angle = sway * Math.sin(clock * 0.9 + letter.phase) + letter.lean.x;
  letter.scaleX = 1;
  letter.scaleY = 1;
  letter.lift = Math.max(0, letter.hop.x);
  letter.shiftX = 0;
  // squash and stretch with the hop
  const stretch = clamp(letter.hop.v / 4200, -0.035, 0.05);
  letter.scaleY += stretch;
  letter.scaleX -= stretch * 0.5;
}

export function drawLetter(ctx: CanvasRenderingContext2D, sheet: CanvasImageSource, letter: Letter, k: number, dx = 0, dy = 0): void {
  const [rx, ry, rw, rh] = letter.rect;
  ctx.save();
  ctx.translate((letter.px + letter.shiftX + dx) * k, (letter.py - letter.lift + dy) * k);
  ctx.rotate(letter.angle);
  ctx.scale(letter.scaleX * letter.scale * k, letter.scaleY * letter.scale * k);
  ctx.drawImage(sheet, rx, ry, rw, rh, -rw / 2, -rh + SPRITE_PAD, rw, rh);
  ctx.restore();
}

/** A point given in letter-sheet pixels, carried along by its letter's present pose. Returns scene units. */
export function onLetter(letter: Letter, sheetPx: number, sheetPy: number): { x: number; y: number } {
  const lx = (sheetPx - (letter.sx + letter.w / 2)) * letter.scale * letter.scaleX;
  const ly = (sheetPy - (letter.sy + letter.h)) * letter.scale * letter.scaleY;
  const cos = Math.cos(letter.angle);
  const sin = Math.sin(letter.angle);
  return { x: letter.px + letter.shiftX + lx * cos - ly * sin, y: letter.py - letter.lift + lx * sin + ly * cos };
}

/* ---------- sprites ---------- */

export interface DrawSprite {
  /** Scene position of the sprite's anchor. */
  x: number;
  y: number;
  /** Scene units per sheet pixel. */
  scale: number;
  /** Anchor inside the sprite as fractions of its box: [0.5, 1] is the middle of its foot. */
  anchor?: readonly [number, number];
  angle?: number;
  flip?: boolean;
  squash?: number;
  alpha?: number;
}

export function drawSprite(ctx: CanvasRenderingContext2D, sheet: CanvasImageSource, sprite: SheetSprite, k: number, at: DrawSprite): void {
  const [rx, ry, rw, rh] = sprite.rect;
  const [ax, ay] = at.anchor ?? [0.5, 1];
  const squash = at.squash ?? 0;
  ctx.save();
  if (at.alpha !== undefined) ctx.globalAlpha *= at.alpha;
  ctx.translate(at.x * k, at.y * k);
  if (at.angle) ctx.rotate(at.angle);
  ctx.scale((at.flip ? -1 : 1) * at.scale * k * (1 - squash * 0.35), at.scale * k * (1 + squash * 0.45));
  ctx.drawImage(sheet, rx, ry, rw, rh, -rw * ax, -rh * ay, rw, rh);
  ctx.restore();
}

export const spriteNamed = <T extends SheetSprite>(sprites: readonly T[], name: string): T => {
  const found = sprites.find((sprite) => sprite.name === name);
  if (!found) throw new Error(`Sprite ${name} is missing from its sheet.`);
  return found;
};

/* ---------- a story that repeats ---------- */

export interface LoopStory {
  /** Length of the story in seconds; it repeats, unless `once` is set. */
  loop: number;
  /** Play the story once and hold its last moment (`loop`) until the page is entered again. */
  once?: boolean;
  /** The moment shown when nothing may move, and in still pictures. */
  rest: number;
  /** Advance to story time `t`. `clock` keeps counting and never wraps (for sway and flicker). */
  step(t: number, clock: number, input: import('./types').LiveInput): void;
  /** Paint the three layers for story time `t`. The layers have just been cleared. */
  draw(t: number, clock: number): void;
  /** The page has just landed on top. */
  enter?(): void;
}

/** Wraps a repeating story as a live page: time, holding still, review scrubbing and the shadows. */
export function loopPage(stage: Stage, story: LoopStory): import('./types').LivePage {
  let clock = 0;
  let held: number | null = null;
  const paint = (t: number): void => {
    stage.begin();
    story.draw(t, clock);
    stage.castShadows();
  };
  return {
    canvases: stage.canvases,
    frame(input) {
      if (input.reduced) {
        const t = held !== null ? held * story.loop : story.rest;
        story.step(t, clock, { ...input, dt: 0 });
        paint(t);
        return false;
      }
      clock += input.dt;
      const t = held !== null ? held * story.loop : story.once ? Math.min(clock, story.loop) : clock % story.loop;
      story.step(t, clock, input);
      paint(t);
      return true;
    },
    enter() {
      if (held === null) clock = 0;
      story.enter?.();
    },
    scrub(position) { held = position; },
    flatten(target) { stage.flatten(target); },
    dispose() { stage.dispose(); },
  };
}

/**
 * Draw in a letter's own space: inside `draw`, coordinates are letter-sheet
 * pixels (the same numbers as the sprite's `source` and `holes`), and
 * whatever is drawn stands, leans and hops with the letter.
 */
export function withLetter(ctx: CanvasRenderingContext2D, letter: Letter, k: number, draw: () => void): void {
  ctx.save();
  ctx.translate((letter.px + letter.shiftX) * k, (letter.py - letter.lift) * k);
  ctx.rotate(letter.angle);
  ctx.scale(letter.scaleX * letter.scale * k, letter.scaleY * letter.scale * k);
  ctx.translate(-(letter.sx + letter.w / 2), -(letter.sy + letter.h));
  draw();
  ctx.restore();
}
