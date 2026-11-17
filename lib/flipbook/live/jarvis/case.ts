/**
 * Story page 06 · Case, the left page facing DIY.
 *
 * The drawing plays once, in two seconds, then holds. 0 to 0.9 s the case, seen from above, draws itself as
 * lines: the lid's outline, the sensor head's rectangle at its top, and the eight petals of the flower
 * cut-out, each as measured (none made regular). 0.9 to 1.7 s his real photograph of the case fades in
 * exactly under those lines (the lines stay on top at about half strength); by 1.9 s the two size lines
 * and the flower's label are in. Then it holds, the lines breathing a little.
 *
 * Where the words come from.
 * - His timeline entry, data/timeline.ts: "I also designed and 3D-printed a custom case for the board and
 *   its peripherals", "fully working open-source code and 3D models", "Selected among the Top 10 projects
 *   in the IoT & Edge AI Project Challenge 2024". So the body and "Top 10." (the challenge, run by Circuit
 *   Digest with DigiKey, is named in his own text).
 * - His post: "You too can make your own Alfred/Jarvis!" So: the code and the 3D files are open, so anyone
 *   can build their own.
 * - The drawing and the sizes are not his words. They are measured from his photograph of the case on the
 *   cutting mat by scripts/flipbook/make-jarvis-parts.py (the mat's 10 mm grid gives the scale), which is
 *   why the sizes say "about": 57.9 by 104.1 mm, give or take 2 or 3 mm (sprites/jarvisParts.ts, case.mm).
 *   The outline, head and petals are the same measurement, in mm as photographed (they lie on the picture).
 *
 * Wording set by the owner on 2026-11-15.
 */

import { lerp, mixRgb, rgba, smoothstep } from '../motion';
import { SENSOR } from '../jarvisWire';
import { AREA, SANS, label, tracking, type Copy, type Drawing, type StoryTone } from '../suryaStory';
import { RED, type JarvisStoryPage } from './kit';

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;

const TOP = '/images/flipbook/jarvis/parts/case-top.webp';
const CASE = SENSOR.case;
const PHOTO = SENSOR.casePhoto;

/** Page units per millimetre (as photographed), and where the lid's top left corner lands. */
const S = 6.2;
const X0 = 169;
const Y0 = 129;
/** The photograph shows this much mat around the lid, in mm. */
const MARGIN = 3;
const LID = { w: CASE.lidPhotographed.w, l: CASE.lidPhotographed.l };
const WIN = { x: X0 - MARGIN * S, y: Y0 - MARGIN * S, w: LID.w * S + MARGIN * 2 * S, h: LID.l * S + MARGIN * 2 * S };

type Pt = readonly [number, number];
const at = (p: Pt): Pt => [X0 + p[0] * S, Y0 + p[1] * S];

const WIDTH_MM = Math.round(CASE.mm.w);
const LENGTH_MM = Math.round(CASE.mm.l);
const LABELS = {
  across: `about ${WIDTH_MM} mm`,
  along: `about ${LENGTH_MM} mm`,
  flower: 'flower cut-out, 8 petals',
  how: "measured from this photo, using the cutting mat's grid",
};

const HEAD: readonly Pt[] = [[CASE.head.x, CASE.head.y], [CASE.head.x + CASE.head.w, CASE.head.y], [CASE.head.x + CASE.head.w, CASE.head.y + CASE.head.l], [CASE.head.x, CASE.head.y + CASE.head.l]];

/** Strokes the first `p` (0..1) of a closed polygon's perimeter. */
function strokePartial(ctx: CanvasRenderingContext2D, k: number, pts: readonly Pt[], p: number): void {
  if (p <= 0) return;
  const ring = [...pts, pts[0]].map((pt) => at(pt));
  const lengths = ring.slice(1).map((pt, i) => Math.hypot(pt[0] - ring[i][0], pt[1] - ring[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let left = total * Math.min(1, p);
  ctx.beginPath();
  ctx.moveTo(ring[0][0] * k, ring[0][1] * k);
  for (let i = 0; i < lengths.length && left > 0; i += 1) {
    const f = Math.min(1, left / lengths[i]);
    ctx.lineTo(lerp(ring[i][0], ring[i + 1][0], f) * k, lerp(ring[i][1], ring[i + 1][1], f) * k);
    left -= lengths[i];
  }
  if (p >= 1) ctx.closePath();
  ctx.stroke();
}

/** A measuring line from a to b with a small tick across each end; it grows out from its middle. */
function dimension(ctx: CanvasRenderingContext2D, k: number, tone: StoryTone, a: Pt, b: Pt, grow: number): void {
  if (grow <= 0.01) return;
  const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const from: Pt = [lerp(mid[0], a[0], grow), lerp(mid[1], a[1], grow)];
  const to: Pt = [lerp(mid[0], b[0], grow), lerp(mid[1], b[1], grow)];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  const tick = 13;
  ctx.save();
  ctx.strokeStyle = rgba(tone.ink);
  ctx.lineWidth = 2.4 * k;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(from[0] * k, from[1] * k); ctx.lineTo(to[0] * k, to[1] * k); ctx.stroke();
  [from, to].forEach((end) => {
    ctx.beginPath(); ctx.moveTo((end[0] - nx * tick) * k, (end[1] - ny * tick) * k); ctx.lineTo((end[0] + nx * tick) * k, (end[1] + ny * tick) * k); ctx.stroke();
  });
  ctx.restore();
}

const drawCase: Drawing = (kit, ctx, t, clock) => {
  const { k, tone, images } = kit;
  const photo = images.get(TOP);
  const seen = smoothstep(0.9, 1.7, t);
  const sizes = smoothstep(1.5, 1.9, t);
  const breath = 0.045 * Math.sin(clock * 1.7) * smoothstep(1.7, 2.3, clock);

  /* the real photograph, straightened, under the lines: pixel (px, py) is mm ((px - origin) / pxPerMm) */
  if (photo && seen > 0.01) {
    ctx.save();
    ctx.globalAlpha *= seen;
    ctx.shadowColor = 'rgba(60, 20, 12, 0.3)';
    ctx.shadowBlur = 14 * k;
    ctx.shadowOffsetY = 6 * k;
    ctx.fillStyle = rgba([40, 40, 40]);
    ctx.beginPath(); ctx.roundRect(WIN.x * k, WIN.y * k, WIN.w * k, WIN.h * k, 10 * k); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= seen;
    ctx.beginPath(); ctx.roundRect(WIN.x * k, WIN.y * k, WIN.w * k, WIN.h * k, 10 * k); ctx.clip();
    const unit = S / PHOTO.pxPerMm;
    ctx.drawImage(photo, (X0 - PHOTO.origin[0] * unit) * k, (Y0 - PHOTO.origin[1] * unit) * k, PHOTO.width * unit * k, PHOTO.height * unit * k);
    ctx.restore();
  }

  /* the lines: strong while alone on the paper, about half over the photograph, breathing afterwards */
  const lineColour = mixRgb(tone.mid, [255, 118, 96], seen);
  ctx.save();
  ctx.globalAlpha *= lerp(1, 0.5, seen) + breath;
  ctx.strokeStyle = rgba(lineColour);
  ctx.lineWidth = 3.4 * k;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  strokePartial(ctx, k, CASE.outline, smoothstep(0, 0.5, t));
  strokePartial(ctx, k, HEAD, smoothstep(0.3, 0.65, t));
  CASE.flower.petals.forEach((petal, i) => {
    strokePartial(ctx, k, petal.outline, smoothstep(0.4 + 0.035 * i, 0.65 + 0.035 * i, t));
  });
  ctx.restore();

  /* size lines: across the short side above the picture, along the long side to its left */
  const topY = WIN.y - 22;
  const leftX = WIN.x - 30;
  const lid0 = at([0, 0]);
  const lid1 = at([LID.w, LID.l]);
  ctx.save();
  ctx.globalAlpha *= sizes;
  dimension(ctx, k, tone, [lid0[0], topY], [lid1[0], topY], sizes);
  dimension(ctx, k, tone, [leftX, lid0[1]], [leftX, lid1[1]], sizes);
  ctx.font = `600 ${30 * k}px ${SANS}`;
  tracking(ctx, 30 * k * 0.04);
  ctx.fillStyle = rgba(tone.ink);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(LABELS.across, ((lid0[0] + lid1[0]) / 2) * k, (topY - 27) * k);
  ctx.save();
  ctx.translate((leftX - 34) * k, ((lid0[1] + lid1[1]) / 2) * k);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(LABELS.along, 0, 0);
  ctx.restore();
  ctx.restore();

  /* the flower's label: the leader ends on the tip of its right-hand petal */
  const tip = at(CASE.flower.petals[0].outer as unknown as Pt);
  label(ctx, k, tone, LABELS.flower, tip[0], tip[1], 640, tip[1] - 50, sizes);

  ctx.save();
  ctx.globalAlpha *= sizes;
  ctx.font = `500 ${26 * k}px ${SANS}`;
  tracking(ctx, 0);
  ctx.fillStyle = rgba(tone.ink, 0.78);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(LABELS.how, (AREA.x + AREA.w / 2 - 120) * k, (WIN.y + WIN.h + 26) * k);
  ctx.restore();
};

const COPY: Copy = {
  kicker: '06 · OPEN SOURCE',
  title: ['Open', 'source.'],
  body: 'The code and the 3D files for the case are open. Anyone can build their own.',
  note: {
    label: 'THE RESULT',
    head: 'Top 10.',
    text: 'IoT & Edge AI Project Challenge 2024, run by Circuit Digest with DigiKey.',
  },
};

export const CASE_PAGE: JarvisStoryPage = {
  id: 'jarvis-case',
  tone: RED,
  copy: COPY,
  drawing: drawCase,
  loop: SETTLE,
  rest: SETTLE,
  sources: [TOP],
  words: Object.values(LABELS),
  alt: `A line drawing of the 3D-printed case seen from above, long side upright. In under a second it draws itself: the lid's outline, the sensor head's rectangle at the top and the eight petals of the flower cut-out, each as measured. Then his real photograph of the case, on the cutting mat, fades in exactly under the lines, which stay on top at about half strength. Size lines appear: about ${WIDTH_MM} mm across and about ${LENGTH_MM} mm along, and a label pointing to the flower cut-out. Under it: measured from this photo, using the cutting mat's grid.`,
};
