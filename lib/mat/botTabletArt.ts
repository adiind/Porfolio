/**
 * The surfaces of Bot's tablet and its birch-ply stand (lib/mat/botTabletLayer.ts). They are not drawn: they are the
 * wood and the screen of the picture Adi picked (design 17, review/designs-2026-11-27/img/17.png), cut out of it flat.
 *
 * How they were cut (2026-11-27). Each face was found in the picture by its corners and pulled square:
 *  - face.webp, the tablet's glass: corners (308,368) (857.5,203) (957.5,641) (424,863), to 1024 by 820;
 *  - lip.webp, the front of the low lip: corners (440,881) (997,650) (996,755) (443,988), to 1024 by 228;
 *  - end.webp, the wedge's cut left end with the ply's stripes down its slope: the picture is close to a view without
 *    perspective, 42 degrees above the mat and 32 degrees round from the stand's front, so the end is one slanted grid:
 *    from its back foot at (277,802), one stand-length toward the front is (346,375) pixels and one up is (-13,-483).
 *    END_BOX is the part of that grid the picture covers;
 *  - PLY, the layers on the lip's top: colours read across them, averaged along the lip. The picture has four dark
 *    layers; two are kept, so they are wide enough to tell apart at the mat's size.
 * Outside each face's outline the nearest wood is repeated, so no blue mat shows at an edge.
 */
export const BOT_PICTURES = ['/images/mat/bot/face.webp', '/images/mat/bot/lip.webp', '/images/mat/bot/end.webp'] as const;

/** What end.webp covers, in stand-lengths: depth from the wedge's back foot (d0, across d) and height (z0, across z). */
export const END_BOX = { d0: -0.02, d: 0.46, z0: -0.01, z: 0.62 } as const;

/** The ply's layers across a cut edge, from the board's back (first) to its face. */
const PLY = ['#eddbbf', '#f8e1c3', '#ebcdac', '#dcb793', '#d2a883', '#d5af8b', '#e5caae', '#f7e8d5', '#f9ecdb', '#e9d1b8', '#d6af8d', '#cda078', '#d1a47d', '#debd9e', '#f4e5d2', '#fcf4e7'];
/** Their colour when they are too fine to tell apart. */
export const PLY_MEAN = '#e5c9ac';

/** The ply's layers as a small picture: they run along x, the board's back at the top. */
export function drawPly(): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 4; c.height = PLY.length;
  const g = c.getContext('2d');
  if (!g) return c;
  PLY.forEach((colour, i) => { g.fillStyle = colour; g.fillRect(0, i, 4, 1); });
  return c;
}
