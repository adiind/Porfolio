/**
 * How far each piece on the home mat stands off it, for its shadow (lib/flipbook/shaders.ts PROP_SHAPED_SHADOW_FRAGMENT:
 * the shadow reaches and softens in proportion). 1 is the reach every piece had before they were told apart.
 * Thin things hug the mat, thick ones stand off it: paper and labels 0.25, a photo print or a card 0.4, the record 0.5,
 * a booklet 0.6, a clipboard 0.8.
 */
import type { StageProp } from '../flipbook/engine';

/** The three shadows of a piece of height 1: page pixels (x right, y up), how soft, how far drawn in, how dark. */
export const SHADOW_FALL = [
  { x: -1.5, y: -2, blur: 2, shrink: 0, amount: 0.5 },
  { x: -8, y: -10, blur: 12, shrink: 2, amount: 0.3 },
  { x: -30, y: -38, blur: 28, shrink: 10, amount: 0.18 },
] as const;
/** The height a piece has when none is given (a card). */
export const SHADOW_HEIGHT = 0.4;
/** The three shadows of a piece of this height, lying at rest: page pixels, x to the right and y up. */
export function shadowLayers(height: number): Array<{ x: number; y: number; blur: number; amount: number }> {
  return SHADOW_FALL.map((layer, i) => {
    const k = i === 0 ? 0.5 + 0.5 * height : height;
    return { x: layer.x * k, y: layer.y * k, blur: layer.blur * k, amount: layer.amount };
  });
}

const HEIGHTS: Array<[RegExp, number]> = [
  [/^(word:|piece:|resume$)/, 0.25],          // sheets of paper and cut labels
  [/^(photo|self|rescue)(:|$)/, 0.4],         // the photo print, the Self card and the cards dealt from it
  [/^record:/, 0.5],
  [/^book:/, 0.6],
  [/^design:/, 0.8],                          // the clipboards: a board, a clip, a sheaf of paper
  // the rider's bag stands up from the mat and is built by its own layer: left at the old reach
  [/^zomato$/, 1],
];

/** A piece's height off the mat (a card's, when nothing says otherwise; none for a piece that keeps the old shadows). */
export function shadowHeight(id: string): number | undefined {
  // (the Bot tablet keeps the old shadows untouched: its own layer is being rebuilt)
  if (id.startsWith('bot:')) return undefined;
  return HEIGHTS.find(([test]) => test.test(id))?.[1] ?? SHADOW_HEIGHT;
}

/** The piece with its height, and, for the clipboards (they lie over one another), its shadow falling on the one below. */
export function withShadowHeight<T extends StageProp>(prop: T): T {
  return { ...prop, height: prop.height ?? shadowHeight(prop.id), stacked: prop.stacked ?? /^design:/.test(prop.id) };
}
