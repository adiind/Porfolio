/**
 * Story page 02 · Voice, the left page facing LISTEN.
 *
 * The drawing plays once, in two seconds, then holds. From 0 to 0.8 s the owner's six real recordings of
 * "Jarvis Lights On" draw themselves left to right as six thin traces stacked one under another (each at its
 * own length, 80 to 98 slices); 0.8 to 1.5 s they slide together onto one baseline, each stretched to the same
 * width, and lie over each other so the shared three-hump shape shows; at 1.5 s a bold line, the point-by-point
 * average of the six, draws over them. Labels are in by 1.9 s. Then it holds: the bold line's width pulses faintly.
 * The traces are the real numbers (sprites/jarvisVoice.ts, `takesUnit`: each take scaled 0..1 on its own, frame 0
 * left out because it is an outlier); nothing is smoothed or invented. Every state is a function of story time.
 *
 * Where the words come from.
 * - His own article, https://circuitdigest.com/microcontroller-projects/voice-controlled-smart-home-assistant :
 *   "Modified the original speech recognition library", "Implemented an averaging algorithm across all
 *   samples", "Added error threshold filtering". So: six recordings compared, averaged, and rejected when too far off.
 * - His project notes, data/projects/jarvis.json, decision 1: "Reduced latency, preserved privacy" and
 *   "Required careful tuning of models and thresholds." So the note: on the board, not in the cloud; the cost is tuning.
 * - His firmware library (sprites/jarvisFirmware.ts): six recordings per phrase, the six distances averaged,
 *   a match above 300 rejected, slices 10 ms apart (sprites/jarvisVoice.ts, hopMs). So "one slice every 10 ms"
 *   and "further off than 300 is rejected".
 * - Captions say only what each photograph shows: his photo of the processor chip, and of the Maixduino board.
 *
 * Wording set by the owner on 2026-11-15.
 */

import { clamp, lerp, rgba, smoothstep } from '../motion';
import { JARVIS_VOICE } from '../sprites/jarvisVoice';
import { AREA, SANS, label, tracking, type Copy, type Drawing } from '../suryaStory';
import { ROSE, drawWholePrints, type JarvisStoryPage, type WholePrint } from './kit';

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;

const PARTS = '/images/flipbook/jarvis/parts';
const PRINTS: readonly [WholePrint, WholePrint] = [
  { src: `${PARTS}/chip.webp`, caption: "The board's processor." },
  { src: `${PARTS}/board.webp`, caption: 'The Maixduino board.' },
];

const LABELS = {
  takes: ['take 1', 'take 2', 'take 3', 'take 4', 'take 5', 'take 6'],
  average: 'the average',
  six: 'my six recordings of "Jarvis Lights On"',
  slice: 'one slice every 10 ms',
  fact: 'a match further off than 300 is rejected',
};

/* ---------- the data: frame 0 left out, each take 0..1 on its own ---------- */

const TAKES: number[][] = JARVIS_VOICE.takesUnit.map((take) => take.slice(1));
const SAMPLES = 90;
const at = (take: readonly number[], f: number): number => {
  const p = clamp(f) * (take.length - 1);
  const i = Math.min(take.length - 2, Math.floor(p));
  return lerp(take[i], take[i + 1], p - i);
};
/** The point-by-point mean of the six after stretching each to the same length. */
const MEAN: number[] = Array.from({ length: SAMPLES }, (_, s) => TAKES.reduce((sum, take) => sum + at(take, s / (SAMPLES - 1)), 0) / TAKES.length);

/* ---------- where things sit, in page units ---------- */

const X0 = 190;
const WIDTH = 850;
/** Frame spacing while the traces are stacked: the longest take fills the width. */
const DX = WIDTH / (Math.max(...TAKES.map((t) => t.length)) - 1);
const ROW_Y = (i: number): number => 210 + i * 104;
const ROW_H = 78;
const BASE_Y = 700;
const BASE_H = 300;

/** Draws the first `reveal` (0..1) of a trace given as screen points. */
function trace(ctx: CanvasRenderingContext2D, pts: ReadonlyArray<readonly [number, number]>, reveal: number): void {
  if (reveal <= 0) return;
  const last = reveal * (pts.length - 1);
  const whole = Math.floor(last);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let j = 1; j <= whole && j < pts.length; j += 1) ctx.lineTo(pts[j][0], pts[j][1]);
  if (whole < pts.length - 1) {
    const a = pts[whole];
    const b = pts[whole + 1];
    const u = last - whole;
    ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u));
  }
  ctx.stroke();
}

const drawVoice: Drawing = (kit, ctx, t, clock) => {
  const { k, tone } = kit;
  const slide = smoothstep(0.8, 1.5, t);
  const shown = smoothstep(1.5, 1.9, t);
  const meanReveal = smoothstep(1.5, 1.85, t);

  ctx.save();
  ctx.beginPath(); ctx.rect(AREA.x * k, AREA.y * k, AREA.w * k, AREA.h * k); ctx.clip();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  /* the shared baseline and the slice ticks, in as the traces come together */
  if (slide > 0.02) {
    ctx.strokeStyle = rgba(tone.ink, 0.35 * slide);
    ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.moveTo(X0 * k, (BASE_Y + 10) * k); ctx.lineTo((X0 + WIDTH) * k, (BASE_Y + 10) * k); ctx.stroke();
    ctx.lineWidth = 1.6 * k;
    ctx.beginPath();
    for (let s = 0; s < SAMPLES; s += 1) {
      const x = X0 + (s / (SAMPLES - 1)) * WIDTH;
      ctx.moveTo(x * k, (BASE_Y + 10) * k); ctx.lineTo(x * k, (BASE_Y + 20) * k);
    }
    ctx.stroke();
  }

  /* the six takes: stacked, drawing themselves; then sliding onto one baseline, each stretched to the same width */
  TAKES.forEach((take, i) => {
    const reveal = smoothstep(0.02 * i, 0.65 + 0.02 * i, t);
    const pts = take.map((v, j): [number, number] => {
      const stackedX = X0 + j * DX;
      const stretchedX = X0 + (j / (take.length - 1)) * WIDTH;
      const stackedY = ROW_Y(i) - v * ROW_H;
      const sharedY = BASE_Y - v * BASE_H;
      return [lerp(stackedX, stretchedX, slide) * k, lerp(stackedY, sharedY, slide) * k];
    });
    ctx.strokeStyle = rgba(tone.ink, lerp(1, 0.55, slide));
    ctx.lineWidth = 2.4 * k;
    trace(ctx, pts, reveal);
    // its own small label, at the left end of its row, until the rows come together
    const tag = (1 - slide) * smoothstep(0.02 * i, 0.2 + 0.02 * i, t);
    if (tag > 0.02) {
      ctx.save();
      ctx.globalAlpha *= tag;
      ctx.font = `600 ${24 * k}px ${SANS}`;
      tracking(ctx, 24 * k * 0.04);
      ctx.fillStyle = rgba(tone.ink);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(LABELS.takes[i], (AREA.x + 14) * k, (ROW_Y(i) - 14) * k);
      ctx.restore();
    }
  });

  /* the average: one bold line over the six, its width pulsing faintly once everything is in */
  const mean = MEAN.map((v, s): [number, number] => [(X0 + (s / (SAMPLES - 1)) * WIDTH) * k, (BASE_Y - v * BASE_H) * k]);
  const pulse = 1 + 0.12 * Math.sin(clock * 2.6) * smoothstep(1.8, 2.4, clock);
  ctx.strokeStyle = rgba(tone.paper, 0.9);
  ctx.lineWidth = 13 * pulse * k;
  trace(ctx, mean, meanReveal);
  ctx.strokeStyle = rgba(tone.mid);
  ctx.lineWidth = 8 * pulse * k;
  trace(ctx, mean, meanReveal);
  ctx.restore();

  /* labels with leaders, once everything is in */
  const hump = (f: number): number => BASE_Y - at(MEAN, f) * BASE_H;
  label(ctx, k, tone, LABELS.six, X0 + WIDTH * 0.3, hump(0.3) - 6, 490, 100, shown);
  label(ctx, k, tone, LABELS.average, X0 + WIDTH * 0.86, hump(0.86), 880, 340, shown);
  label(ctx, k, tone, LABELS.slice, X0 + WIDTH * 0.1, BASE_Y + 20, 330, 770, shown);

  /* a small boxed fact at the bottom of the drawing */
  if (shown > 0.02) {
    ctx.save();
    ctx.globalAlpha *= shown;
    ctx.font = `600 ${30 * k}px ${SANS}`;
    tracking(ctx, 30 * k * 0.02);
    const w = ctx.measureText(LABELS.fact).width / k + 48;
    const x = X0;
    const y = 830;
    ctx.fillStyle = rgba(tone.paper);
    ctx.strokeStyle = rgba(tone.mid);
    ctx.lineWidth = 2.6 * k;
    ctx.beginPath(); ctx.roundRect(x * k, y * k, w * k, 66 * k, 12 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba(tone.ink);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS.fact, (x + 24) * k, (y + 34) * k);
    ctx.restore();
  }

  /* the right column's photographs, each whole */
  drawWholePrints(kit, COPY, PRINTS);
};

const COPY: Copy = {
  kicker: '02 · VOICE',
  title: ['Trained on', 'my own voice.'],
  body: 'I trained a voice model on my own recordings, for ten exact commands and nothing else. That is why it stays fast: it runs here, on the board.',
  note: {
    label: 'THE CHOICE',
    head: 'Explicit commands, on the board.',
    text: 'Faster and private, no cloud. The cost: careful tuning of the recordings and the cut-off.',
  },
};

export const VOICE_PAGE: JarvisStoryPage = {
  id: 'jarvis-voice',
  tone: ROSE,
  copy: COPY,
  drawing: drawVoice,
  loop: SETTLE,
  rest: SETTLE,
  sources: PRINTS.map((item) => item.src),
  words: [...LABELS.takes, LABELS.average, LABELS.six, LABELS.slice, LABELS.fact, ...PRINTS.map((item) => item.caption)],
  alt: "A line drawing of six real recordings of the phrase Jarvis Lights On. In about two seconds the six traces draw themselves one under another, slide together onto one baseline, stretched to the same width, and lie over each other so a shared three-hump shape shows; then a bold line, the average of the six, draws over them. Labels name the six recordings, the 10 ms slices and the average, and a boxed fact says a match further off than 300 is rejected. Beside it, two photographs: the board's processor and the Maixduino board.",
};
