/**
 * Food Rescue: who gets which part of the mat. This is the contract between the three pieces:
 *   rescueScene.ts  the map (shop, houses, roads, rider, wave, numbered pins, paper tags). Stays inside MAP.
 *   rescueDesk.ts   the paper: the order-log board, the real app-screen print, the "My part" sheet. Stays inside its rects.
 *   bagLayer.ts     the camera, which frames FRAME.
 *
 * Units are table units in the bag group's own space (the same space rescueScene.ts already builds in: +x right, +y away
 * from the viewer, z up off the mat). A rect is { x0, x1, y0, y1 }.
 *
 * Screen scale to design against: at 1440x900 one table unit is about 229 px (wide). At 390x844 it is about 96 px (narrow).
 */
export interface Rect { x0: number; x1: number; y0: number; y1: number }
export const NARROW_BELOW_ASPECT = .75;

export const WIDE = {
  /** what the camera shows: centre, width, height, and how far it tips back (radians) */
  FRAME: { cx: 4.25, cy: -.3, w: 6.3, h: 4.05, pitch: .3 },
  /** the map */
  MAP: { x0: 1.35, x1: 5.05, y0: -.88, y1: 1.45 } as Rect,
  /** the strip of mat under the map: the real app-screen print (left) and the "My part" sheet (right) */
  PRINT: { x0: 1.4, x1: 2.7, y0: -2.12, y1: -1.07 } as Rect,
  PART: { x0: 2.85, x1: 5.05, y0: -2.12, y1: -1.07 } as Rect,
  /** the order-log board: a paper sheet, 1100 x 2000 px, lying on the mat */
  BOARD: { x0: 5.25, x1: 7.15, y0: -1.97, y1: 1.485 } as Rect,
} as const;

export const NARROW = {
  FRAME: { cx: 3.2, cy: -2.2, w: 4.2, h: 8.5, pitch: .27 },
  /** the map, after the scene's own 1.4x stretch in y for tall screens */
  MAP: { x0: 1.4, x1: 5.0, y0: -1.3, y1: 1.5 } as Rect,
  /** the board: 1170 x 1440 px, under the map. On a phone it also carries the result and "My part" at the end. */
  BOARD: { x0: 1.35, x1: 5.05, y0: -6.05, y1: -1.5 } as Rect,
} as const;

/** Board picture sizes in px (rescueBoard.ts draws these; rescueDesk.ts puts them on the sheets). */
export const BOARD_PX = { wide: { w: 1100, h: 2000 }, narrow: { w: 1170, h: 1440 }, part: { w: 1500, h: 543 } } as const;
