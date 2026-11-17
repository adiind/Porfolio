/**
 * Story page 01 · Sensor, the left page facing PRESENT.
 *
 * The drawing plays once, in two seconds, then holds: the real sensor head draws itself (by 0.6 s); a man
 * walks in (the PRESENT page's man, as a flat ink silhouette, 0.3 to 1.2 s); he comes into range at about
 * 0.9 s, so the rings turn solid, the four LEDs fill one after another (0.06 s apart) and a bar marked
 * "listening" fills; labels are in by 1.6 s; all settled by 2.0 s. Then it holds: he stands looking up, the
 * rings keep pulsing faintly, the bar stays full. Nothing leaves or drains. Every state is a function of
 * story time; the still is the settled moment (2.0 s). It plays again when the page is entered again.
 *
 * Where the words come from.
 * - His own article, https://circuitdigest.com/microcontroller-projects/voice-controlled-smart-home-assistant :
 *   "PIR Motion Sensor: HC-SR501"; "When motion is detected, it sets a flag in the system to start
 *   listening for voice commands."; "4x White LED". So: a PIR sensor behind the white dome, four
 *   white LEDs, and it listens once it sees someone.
 * - His timeline entry, data/timeline.ts: "simply approach Jarvis, and it activates." So: walk up, it wakes.
 * - His project notes, data/projects/jarvis.json, decision 2: "Prevented false triggers and reduced
 *   processing load" / "Added a two-step interaction." So the note: fewer false triggers; the cost, two steps.
 * - His firmware, adiind/diy-jarvis, diy-jarvis.ino: MOTION_TIMEOUT = 6000, and all four LEDs are on
 *   while it listens. So the "6 s" on the bar, and the four LEDs filling while it listens.
 * - The project notes call the first step a "wake word"; his article and his firmware show a PIR
 *   sensor doing it, and this page follows the article and the firmware (his own rule: when his
 *   sources disagree, his article and his code win over the data file).
 * - The bar is not drawn in real time and does not pretend to be: it fills in well under a second of the
 *   page's story. The "6 s" beside it is the fact.
 * - Captions say only what each photograph shows: his front photo of the head, his photo of its back.
 *
 * Wording set by the owner on 2026-11-15.
 */

import { clamp, lerp, rgba, smoothstep } from '../motion';
import { MAN_SHEET, drawMan, walkPose } from '../jarvisProps';
import { SENSOR, drawSensorHead, sensorPoint, sensorView } from '../jarvisWire';
import { tintSheet, type Stage } from '../stage';
import { AREA, SANS, label, tracking, type Copy, type Drawing, type Kit } from '../suryaStory';
import { AMBER, PHOTO, arrive, drawWholePrints, firstWhen, type JarvisStoryPage, type WholePrint } from './kit';

/** The sensor head: its plate's top left corner and width, in page units (65% of the drawing area's width). */
const HEAD = { x: 400, y: 112, w: 680 };
const UNIT = HEAD.w / SENSOR.plate.w;
const DOME = { x: HEAD.x + SENSOR.dome.x * UNIT, y: HEAD.y + SENSOR.dome.y * UNIT, r: SENSOR.dome.r * UNIT };
const FLOOR = 770;
const BAR = { x: 290, y: 828, w: 700, h: 22 };
/** The man, head to feet, in page units; and how far he walks per pose, so his feet do not slide. */
const MAN_H = 190;
const STEP = 40;
/** Someone this far across the drawing is near enough to be seen (he reaches it at about 0.9 s). */
const RANGE_X = AREA.x + AREA.w * 0.45;
/** He comes in from the left edge and stops under the dome, looking up. */
const WALK = { from: 0.3, stop: 1.2, x0: AREA.x - 80, x1: Math.round(DOME.x) };
/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;

const walkerX = (t: number): number => lerp(WALK.x0, WALK.x1, arrive(clamp((t - WALK.from) / (WALK.stop - WALK.from))));
/** He comes into range at about 0.9 s. */
export const T_SEEN = firstWhen((t) => walkerX(t) >= RANGE_X, WALK.from, WALK.stop);

const LABELS = {
  dome: 'PIR sensor, behind the dome',
  leds: 'four white LEDs',
  bar: 'listens until 6 s after it last saw someone',
  track: 'listening',
  timeout: '6 s',
};
const PRINTS: readonly [WholePrint, WholePrint] = [
  { src: PHOTO.sensor, caption: 'The PIR sensor\'s dome, from the front.' },
  { src: PHOTO.back, caption: 'Its board, from behind.' },
];

/** The man in the page's ink: one tinted copy of the people sheet per page. */
const inked = new WeakMap<Stage, HTMLCanvasElement>();
const inkMan = ({ stage, images, tone }: Kit): HTMLCanvasElement | null => {
  const ready = inked.get(stage);
  if (ready) return ready;
  const sheet = images.get(MAN_SHEET);
  if (!sheet) return null;
  const made = stage.keep(tintSheet(sheet, rgba(tone.ink)));
  inked.set(stage, made);
  return made;
};

const drawSensor: Drawing = (kit, ctx, t, clock) => {
  const { k, tone } = kit;
  const drawn = smoothstep(0, 0.6, t);
  const shown = smoothstep(1, 1.6, t);
  const barShown = smoothstep(0.6, 0.9, t);
  const awake = smoothstep(T_SEEN, T_SEEN + 0.1, t);
  const bar = smoothstep(T_SEEN, T_SEEN + 0.6, t);

  /* sensing rings: always going out from the dome, faint; solid amber while it sees someone */
  ctx.save();
  ctx.beginPath(); ctx.rect(AREA.x * k, AREA.y * k, AREA.w * k, (FLOOR - 6 - AREA.y) * k); ctx.clip();
  ctx.lineCap = 'round';
  const ringsOn = smoothstep(0.3, 0.8, t);
  for (let n = 0; n < 2; n += 1) {
    const age = (clock / 3 + n / 2) % 1;
    const radius = lerp(DOME.r + 8, 700, 1 - (1 - age) ** 1.4);
    const strength = (1 - age) ** (awake > 0.5 ? 0.8 : 1.3) * ringsOn;
    ctx.strokeStyle = awake > 0.5 ? rgba(tone.mid, strength * lerp(0.4, 1, awake)) : rgba(tone.ink, strength * 0.24);
    ctx.lineWidth = lerp(2.2, 2.6, awake) * k;
    ctx.beginPath(); ctx.arc(DOME.x * k, DOME.y * k, radius * k, Math.PI * 0.12, Math.PI * 0.96); ctx.stroke();
  }
  ctx.restore();

  /* the head: plate, seat, dome, facet marks, four LEDs, filling one after another while it listens */
  const lit = [0, 1, 3, 2].reduce<number[]>((all, led, order) => {
    // clockwise from the top left: top left, top right, bottom right, bottom left
    all[led] = smoothstep(T_SEEN + 0.06 * order, T_SEEN + 0.06 * order + 0.1, t);
    return all;
  }, []);
  drawSensorHead(ctx, sensorView(HEAD.x * k, HEAD.y * k, HEAD.w * k), {
    line: tone.ink, width: 3 * k, fill: tone.paper, ledOn: tone.mid, lit, drawn, facetAlpha: 0.75,
  });

  /* the floor, drawn left to right, and the man walking on it */
  const floor = smoothstep(0.1, 0.6, t);
  if (floor > 0) {
    ctx.strokeStyle = rgba(tone.ink);
    ctx.lineWidth = 2.6 * k;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo((AREA.x + 40) * k, FLOOR * k); ctx.lineTo(lerp(AREA.x + 40, AREA.x + AREA.w - 40, floor) * k, FLOOR * k); ctx.stroke();
  }
  const sheet = inkMan(kit);
  if (sheet && t >= WALK.from) {
    const x = walkerX(t);
    const standing = t >= WALK.stop - 0.04;
    ctx.save();
    ctx.beginPath(); ctx.rect(AREA.x * k, AREA.y * k, AREA.w * k, AREA.h * k); ctx.clip();
    drawMan(ctx, sheet, k, standing ? 'look' : walkPose(x - WALK.x0, STEP), {
      // he looks up at the dome while he stands in range, rocking a hair
      x, y: FLOOR, height: MAN_H, alpha: 0.9, angle: standing ? Math.sin(clock * 2.4) * 0.012 : 0,
    });
    ctx.restore();
  }

  /* the listening bar: a track that fills when it sees someone, and stays full */
  if (barShown > 0.01) {
    ctx.save();
    ctx.globalAlpha = barShown;
    ctx.fillStyle = rgba(tone.paper);
    ctx.strokeStyle = rgba(tone.ink);
    ctx.lineWidth = 2.4 * k;
    ctx.beginPath(); ctx.roundRect(BAR.x * k, BAR.y * k, BAR.w * k, BAR.h * k, (BAR.h / 2) * k); ctx.fill(); ctx.stroke();
    if (bar > 0.002) {
      ctx.fillStyle = rgba(tone.mid);
      ctx.beginPath(); ctx.roundRect((BAR.x + 4) * k, (BAR.y + 4) * k, (BAR.w - 8) * bar * k, (BAR.h - 8) * k, ((BAR.h - 8) / 2) * k); ctx.fill();
    }
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${30 * k}px ${SANS}`;
    tracking(ctx, 30 * k * 0.04);
    ctx.fillStyle = rgba(tone.ink);
    ctx.textAlign = 'right';
    ctx.fillText(LABELS.track, (BAR.x - 16) * k, (BAR.y + BAR.h / 2) * k);
    ctx.font = `650 ${30 * k}px ${SANS}`;
    ctx.fillStyle = rgba(tone.mid);
    ctx.textAlign = 'left';
    ctx.fillText(LABELS.timeout, (BAR.x + BAR.w + 16) * k, (BAR.y + BAR.h / 2) * k);
    ctx.restore();
  }

  /* labels, once the head has drawn itself: the leaders end on the dome and on the bottom left LED */
  label(ctx, k, tone, LABELS.dome, DOME.x - DOME.r * 0.62, DOME.y - DOME.r * 0.62, 600, 80, shown);
  const led = sensorPoint({ x: HEAD.x, y: HEAD.y, scale: UNIT }, SENSOR.leds[2].x, SENSOR.leds[2].y);
  label(ctx, k, tone, LABELS.leds, led.x, led.y, 360, 474, shown);
  label(ctx, k, tone, LABELS.bar, 900, BAR.y + BAR.h / 2, 868, 898, shown);

  /* the right column's photographs, each whole */
  drawWholePrints(kit, COPY, PRINTS);
};

const COPY: Copy = {
  kicker: '01 · PIR SENSOR',
  title: ['Walk up.', 'It wakes.'],
  body: 'A PIR sensor sits behind the white dome and senses when someone is in the room. When it senses me, Jarvis starts listening for my voice. When I walk away, it stops.',
  note: {
    label: 'The choice',
    head: 'Presence first, then voice.',
    text: 'It only listens when someone is there, so fewer false triggers. The cost: two steps, not one.',
  },
};

export const SENSOR_PAGE: JarvisStoryPage = {
  id: 'jarvis-sensor',
  tone: AMBER,
  copy: COPY,
  drawing: drawSensor,
  loop: SETTLE,
  rest: SETTLE,
  sources: [PHOTO.sensor, PHOTO.back, MAN_SHEET],
  words: [...Object.values(LABELS), ...PRINTS.map((item) => item.caption)],
  alt: 'A line drawing of the sensor head: a plate with a white dome and four LEDs. It draws itself and a small figure walks in, all in about two seconds; as he comes in range the rings from the dome turn solid, the four LEDs fill one after another and a bar marked listening fills, labelled 6 s. Then it holds, the figure looking up and the rings still pulsing. Beside it, two photographs: the PIR sensor\'s dome from the front, and its board from behind.',
};
