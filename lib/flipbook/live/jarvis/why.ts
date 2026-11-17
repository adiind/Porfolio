/**
 * Story page 03 · Why, the left page facing HERE.
 *
 * The drawing plays once, in two seconds, then holds: a house draws itself with four things inside it in a
 * row (0 to 0.6 s); a dot travels microphone, board, Raspberry Pi, lamp along thin lines, each thing's
 * outline turning green as it arrives (0.6 to 1.6 s); the lamp fills at 1.6 s; labels are in by 1.9 s. The
 * dot never leaves the house. A cloud sits outside it with nothing attached. After 2 s the cloud drifts a
 * few units and the lamp's fill breathes slightly.
 *
 * Where the words come from.
 * - data/projects/jarvis.json context: "Commercial voice assistants felt opaque, slow, and over-scoped." /
 *   "I wanted a system I could fully understand, control, and extend, one that reacted instantly..." /
 *   "The constraint was to keep it lightweight, local-first, and hackable." So the body and the note head.
 * - His article, https://circuitdigest.com/microcontroller-projects/voice-controlled-smart-home-assistant :
 *   "Home Assistant runs on a Raspberry Pi 5"; "Sends \"ON\" or \"OFF\" messages to indicate state changes."
 *   So the note: the board recognises the phrase; only a short on or off message goes to the Pi.
 * - His wiring sketch (parts/sketch.webp) names "MEMS MIC", "Maixduino" and "Home Assistant": the labels.
 * - The caption says only what the photograph is: his wiring sketch.
 *
 * Wording set by the owner on 2026-11-15.
 */

import { clamp, lerp, mixRgb, rgba, smoothstep } from '../motion';
import { AREA, SANS, tracking, type Copy, type Drawing } from '../suryaStory';
import { GREEN, type JarvisStoryPage } from './kit';

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
const SKETCH = '/images/flipbook/jarvis/parts/sketch.webp';

/* the house: eaves, apex and walls, in page units */
const WALL = { l: 170, r: 990, top: 380, floor: 880 };
const EAVE = { l: 130, r: 1030 };
const APEX = { x: 580, y: 130 };
const HOUSE: Array<[number, number]> = [
  [EAVE.l, WALL.top], [APEX.x, APEX.y], [EAVE.r, WALL.top], [WALL.r, WALL.top],
  [WALL.r, WALL.floor], [WALL.l, WALL.floor], [WALL.l, WALL.top], [EAVE.l, WALL.top],
];
const lengthOf = (pts: Array<[number, number]>): number => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const HOUSE_LEN = lengthOf(HOUSE);

/* the four things: two rows of two, the path running in a Z (microphone, board, down to the Pi, lamp) */
const ROW1 = 470;
const ROW2 = 710;
const COL1 = 360;
const COL2 = 800;
const HALF = 65;
const THING_W = 290;
const MIC = { x: COL1, y: ROW1 };
const BOARD = { x: COL2, y: ROW1, w: THING_W, h: HALF * 2 };
const PI = { x: COL1, y: ROW2, w: THING_W, h: HALF * 2 };
const LAMP = { x: COL2, y: ROW2 };
const PATH: Array<[number, number]> = [[MIC.x, MIC.y], [BOARD.x, BOARD.y], [PI.x, PI.y], [LAMP.x, LAMP.y]];
const TOTAL = lengthOf(PATH);
const TRAVEL = { from: 0.6, to: 1.6 };
/** The moment the dot reaches each thing. */
const ARRIVE = PATH.map((_, i) => lerp(TRAVEL.from, TRAVEL.to, lengthOf(PATH.slice(0, i + 1)) / TOTAL));
const pointAt = (d: number): [number, number] => {
  let left = d;
  for (let i = 1; i < PATH.length; i += 1) {
    const seg = Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]);
    if (left <= seg || i === PATH.length - 1) {
      const u = clamp(left / seg);
      return [lerp(PATH[i - 1][0], PATH[i][0], u), lerp(PATH[i - 1][1], PATH[i][1], u)];
    }
    left -= seg;
  }
  return PATH[PATH.length - 1];
};
/** The cloud: outside the house, above the roof at the right, 260 wide (the outline below is 200 wide at scale 1). */
const CLOUD = { x: 935, y: 172, scale: 1.3 };

const LABELS = {
  mic: 'microphone',
  board: 'Maixduino board',
  pi: 'Raspberry Pi 5, Home Assistant',
  lamp: 'lights',
  cloud: 'no cloud needed',
};
const BOARD_LINES = ['Maixduino', 'board'];
const PI_LINES = ['Raspberry Pi 5,', 'Home Assistant'];

const COPY: Copy = {
  kicker: '03 · WHY',
  title: ['It stays', 'in the room.'],
  body: 'Commercial assistants felt slow and opaque. I wanted one I could understand and change.',
  note: {
    label: 'The constraint',
    head: 'Fast, and here.',
    text: 'The board itself recognises the phrase. Only a short on or off message goes to a Raspberry Pi in my home.',
  },
  photo: { src: SKETCH, caption: 'My wiring sketch.', whole: true },
};

const drawWhy: Drawing = ({ k, tone }, ctx, t, clock) => {
  const drawn = smoothstep(0, 0.6, t);
  const labels = smoothstep(1.5, 1.9, t);
  const lampFill = smoothstep(1.6, 1.75, t);
  const amb = clock > 2 ? smoothstep(2, 3, clock) : 0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  /** Stroke a path drawn up to `p` of its length (a dash that grows). */
  const strokeUpTo = (len: number, p: number, make: () => void): void => {
    ctx.setLineDash([len * p + 0.01, len * 3]);
    ctx.beginPath(); make(); ctx.stroke();
    ctx.setLineDash([]);
  };
  const inkOf = (i: number): string => {
    const turned = smoothstep(ARRIVE[i], ARRIVE[i] + 0.12, t);
    return rgba(mixRgb(tone.ink, tone.mid, turned));
  };

  /* the house, and the ground it stands on with one step at the door */
  ctx.strokeStyle = rgba(tone.ink);
  ctx.lineWidth = 3.4 * k;
  strokeUpTo(HOUSE_LEN * k, drawn, () => HOUSE.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k))));
  ctx.save();
  ctx.globalAlpha *= smoothstep(0.2, 0.6, t);
  ctx.beginPath();
  ctx.moveTo(100 * k, WALL.floor * k); ctx.lineTo(1060 * k, WALL.floor * k);
  ctx.moveTo(470 * k, (WALL.floor + 16) * k); ctx.lineTo(690 * k, (WALL.floor + 16) * k);
  ctx.stroke();
  ctx.restore();

  /* the cloud, outside, nothing attached; it drifts a little once the play is over */
  const cx = (CLOUD.x + Math.sin(clock * 0.7) * 14 * amb) * k;
  const cy = CLOUD.y * k;
  const cs = CLOUD.scale * k;
  ctx.save();
  ctx.globalAlpha *= smoothstep(0.1, 0.6, t);
  ctx.strokeStyle = rgba(tone.ink);
  ctx.lineWidth = 3 * k;
  ctx.fillStyle = rgba(tone.paper);
  ctx.beginPath();
  ctx.moveTo(cx - 75 * cs, cy + 35 * cs);
  ctx.arc(cx - 75 * cs, cy + 10 * cs, 25 * cs, Math.PI / 2, Math.PI * 1.5);
  ctx.arc(cx - 25 * cs, cy - 12 * cs, 38 * cs, Math.PI * 1.15, Math.PI * 1.85);
  ctx.arc(cx + 38 * cs, cy - 2 * cs, 32 * cs, Math.PI * 1.3, Math.PI * 1.9);
  ctx.arc(cx + 75 * cs, cy + 10 * cs, 25 * cs, Math.PI * 1.5, Math.PI / 2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();

  /* thin lines between the things (3 units), drawn once the things are there */
  ctx.save();
  ctx.globalAlpha *= smoothstep(0.3, 0.6, t) * 0.6;
  ctx.strokeStyle = rgba(tone.ink);
  ctx.lineWidth = 3 * k;
  const link = (ax: number, ay: number, bx: number, by: number): void => { ctx.beginPath(); ctx.moveTo(ax * k, ay * k); ctx.lineTo(bx * k, by * k); ctx.stroke(); };
  link(MIC.x + 50, MIC.y, BOARD.x - THING_W / 2, BOARD.y);
  link(BOARD.x - THING_W / 2 + 40, BOARD.y + HALF, PI.x + THING_W / 2 - 40, PI.y - HALF);
  link(PI.x + THING_W / 2, PI.y, LAMP.x - 55, LAMP.y);
  ctx.restore();

  /* microphone: a capsule on a cradle and stem, drawn at 1.35 times its small size */
  ctx.save();
  ctx.globalAlpha *= smoothstep(0.15, 0.6, t);
  ctx.translate(MIC.x * k, MIC.y * k);
  ctx.scale(1.35, 1.35);
  ctx.lineWidth = 3 * k / 1.35;
  ctx.strokeStyle = inkOf(0);
  ctx.fillStyle = rgba(tone.paper);
  ctx.beginPath(); ctx.roundRect(-15 * k, -42 * k, 30 * k, 56 * k, 15 * k); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -2 * k, 27 * k, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 25 * k); ctx.lineTo(0, 44 * k); ctx.moveTo(-18 * k, 44 * k); ctx.lineTo(18 * k, 44 * k); ctx.stroke();
  ctx.restore();

  /* board and Pi: plain rectangles */
  const box = (thing: { x: number; y: number; w: number; h: number }, i: number): void => {
    ctx.strokeStyle = inkOf(i);
    ctx.lineWidth = 3 * k;
    ctx.fillStyle = rgba(tone.paper);
    const x = (thing.x - thing.w / 2) * k;
    const y = (thing.y - thing.h / 2) * k;
    ctx.beginPath(); ctx.roundRect(x, y, thing.w * k, thing.h * k, 10 * k); ctx.fill();
    strokeUpTo(2 * (thing.w + thing.h) * k, smoothstep(0, 0.6, t), () => ctx.roundRect(x, y, thing.w * k, thing.h * k, 10 * k));
  };
  box(BOARD, 1);
  box(PI, 2);

  /* lamp: a shade on a stem and base; its fill comes on at 1.6 s and breathes a little after 2 s */
  ctx.save();
  ctx.globalAlpha *= smoothstep(0.15, 0.6, t);
  ctx.translate(LAMP.x * k, (LAMP.y - 2) * k);
  ctx.scale(1.35, 1.35);
  ctx.lineWidth = 3 * k / 1.35;
  ctx.strokeStyle = inkOf(3);
  const shade = (): void => {
    ctx.beginPath();
    ctx.moveTo(-22 * k, -46 * k); ctx.lineTo(22 * k, -46 * k);
    ctx.lineTo(40 * k, 4 * k); ctx.lineTo(-40 * k, 4 * k);
    ctx.closePath();
  };
  shade(); ctx.fillStyle = rgba(tone.paper); ctx.fill();
  if (lampFill > 0.01) {
    ctx.fillStyle = rgba(tone.mid, lampFill * (0.85 + 0.15 * Math.sin(clock * 2.2) * amb));
    ctx.fill();
  }
  shade(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 4 * k); ctx.lineTo(0, 50 * k);
  ctx.moveTo(-26 * k, 50 * k); ctx.lineTo(26 * k, 50 * k);
  ctx.stroke();
  ctx.restore();

  /* the dot, microphone to board to Pi to lamp, never leaving the house */
  if (t >= TRAVEL.from && t < TRAVEL.to + 0.15) {
    const [x, y] = pointAt(clamp((t - TRAVEL.from) / (TRAVEL.to - TRAVEL.from)) * TOTAL);
    ctx.fillStyle = rgba(tone.mid, 1 - smoothstep(TRAVEL.to, TRAVEL.to + 0.15, t));
    ctx.beginPath(); ctx.arc(x * k, y * k, 16 * k, 0, Math.PI * 2); ctx.fill();
  }

  /* labels, printed on the sheet, each under its thing */
  if (labels > 0.02) {
    ctx.save();
    ctx.globalAlpha *= labels;
    ctx.fillStyle = rgba(tone.ink);
    ctx.font = `600 ${30 * k}px ${SANS}`;
    tracking(ctx, 30 * k * 0.04);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const under = HALF + 40;
    ctx.fillText(LABELS.mic, MIC.x * k, (MIC.y + under) * k);
    BOARD_LINES.forEach((line, i) => ctx.fillText(line, BOARD.x * k, (BOARD.y + under + i * 38) * k));
    PI_LINES.forEach((line, i) => ctx.fillText(line, PI.x * k, (PI.y + under + i * 38) * k));
    ctx.fillText(LABELS.lamp, LAMP.x * k, (LAMP.y + under) * k);
    ctx.textAlign = 'right';
    ctx.fillStyle = rgba(tone.mid);
    ctx.fillText(LABELS.cloud, (CLOUD.x + 130) * k, (CLOUD.y - 100) * k);
    ctx.restore();
  }
  ctx.textAlign = 'left';
};

export const WHY_PAGE: JarvisStoryPage = {
  id: 'jarvis-why',
  tone: GREEN,
  copy: COPY,
  drawing: drawWhy,
  loop: SETTLE,
  rest: SETTLE,
  sources: [SKETCH],
  words: [...Object.values(LABELS), ...PI_LINES, COPY.photo!.caption],
  alt: 'A line drawing of a house with four things in a row inside it: a microphone, a Maixduino board, a Raspberry Pi 5 running Home Assistant, and a lamp. In about two seconds the house draws itself and a dot travels from the microphone to the board, the Pi and the lamp, each outline turning green as it arrives, and the lamp fills with green. A cloud outside the house, labelled no cloud needed, has nothing attached; it drifts slightly and the lamp glows faintly. Beside it, his wiring sketch.',
};
