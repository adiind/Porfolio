/**
 * Story page 04 · Lights, the left page facing ANSWER.
 *
 * The drawing plays once, in two seconds, then holds. Three rows of the same four LEDs, drawn from the
 * firmware's own patterns, shortened to fit: 0 to 0.4 s everything draws itself; 0.4 to 1.0 s "starting up"
 * runs its sweep (the lights fill one by one up the row, then empty one by one back down, as the firmware's
 * startupLEDSequence does) and ends with all four filled; 1.0 to 1.4 s "listening" fills all four and keeps
 * them; 1.4 to 1.9 s "phrase heard": the other three keep their listening state, the speech LED blinks
 * twice and ends filled. Then it holds, and the listening row's fills breathe a little. No millisecond
 * figure is printed: the firmware's durations are shortened here.
 *
 * Where the words come from.
 * - His timeline entry, data/timeline.ts: "Due to stock unavailability, I couldn't get the display version
 *   of the Maixduino board. Instead, I used its onboard LEDs and an MQTT-connected LED strip for visual
 *   feedback." So: no display, lights instead. (The page does not print that protocol's name. The owner asked on 2026-11-15 that the stock fact is not printed anywhere.)
 * - His own article, https://circuitdigest.com/microcontroller-projects/voice-controlled-smart-home-assistant :
 *   "Two light bars..."; "4x White LED". So: four white LEDs, and two light bars on the wall.
 * - His project notes, data/projects/jarvis.json, decision 4: "Provided instant, non-intrusive confirmation
 *   without noise." and "Less expressive than speech output." So the note: light, not a voice; instant and
 *   quiet; the cost, less expressive.
 * - His firmware, sprites/jarvisFirmware.ts (diy-jarvis.ino): the four LEDs in pin order (system 5, speech 4,
 *   network 3, motion 2); the startup sweep (one, two, three, four lit, then back down); listening = all
 *   four on; phrase recognised = the speech LED blinks twice while the others keep their state.
 * - The photograph is his own: the box on his wall with its LEDs on and a light bar each side.
 *
 * Wording set by the owner on 2026-11-15.
 */

import { clamp, lerp, rgba, smoothstep } from '../motion';
import { JARVIS_FIRMWARE } from '../sprites/jarvisFirmware';
import { AREA, SANS, label, tracking, type Copy, type Drawing } from '../suryaStory';
import { BLUE, type JarvisStoryPage } from './kit';

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;

const WALL = '/images/flipbook/jarvis/parts/wall.webp';

const LED_NAMES: readonly string[] = JARVIS_FIRMWARE.leds.map((led) => led.name);
const R = 46;
const LED_X = [460, 610, 760, 910];
const ROWS = [
  { title: 'starting up', y: 245 },
  { title: 'listening', y: 469 },
  { title: 'phrase heard', y: 692 },
];
const TITLE_X = 110;
const LABELS = {
  rows: ROWS.map((row) => row.title),
  names: LED_NAMES,
  bottom: 'the same four LEDs, three signals',
};

/** The firmware's startup sweep: steps 1 to 8 of the startup pattern (up one at a time, then back down). */
const STARTUP = JARVIS_FIRMWARE.patterns.find((pattern) => pattern.name === 'startup');
const SWEEP: readonly (readonly string[])[] = (STARTUP?.steps ?? []).slice(1, 9).map((step) => step.on);
const SWEEP_FROM = 0.4;
const SWEEP_STEP = 0.07;
const SWEEP_BLEND = 0.035;

/** Row 1: each LED's fill (0..1) at story time t. */
const startupFill = (t: number, led: number): number => {
  if (t < SWEEP_FROM) return 0;
  const at = (t - SWEEP_FROM) / SWEEP_STEP;
  const index = Math.floor(at);
  // past the sweep the row ends with all four filled
  const stateAt = (i: number): number => (i < 0 ? 0 : i >= SWEEP.length ? 1 : SWEEP[i].includes(LED_NAMES[led]) ? 1 : 0);
  const blend = clamp(((at - index) * SWEEP_STEP) / SWEEP_BLEND);
  return lerp(stateAt(index - 1), stateAt(index), blend);
};
/** Row 2: all four fill, a hair apart, and stay. */
const listeningFill = (t: number, led: number): number => smoothstep(1 + 0.025 * led, 1.1 + 0.025 * led, t);
/** Row 3: the speech LED blinks twice and ends filled; the other three keep the listening state. */
const SPEECH = LED_NAMES.indexOf('speech');
const BLINKS: ReadonlyArray<readonly [number, number]> = [[1.45, 1.57], [1.69, 1.81], [1.85, Infinity]];
const phraseFill = (t: number, led: number): number => {
  if (led !== SPEECH) return smoothstep(1.4, 1.48, t);
  return clamp(BLINKS.reduce((sum, [a, b]) => sum + smoothstep(a, a + 0.03, t) - (Number.isFinite(b) ? smoothstep(b, b + 0.03, t) : 0), 0));
};

const drawLights: Drawing = ({ k, tone }, ctx, t, clock) => {
  const drawn = smoothstep(0, 0.4, t);
  const settled = smoothstep(1.6, 2, t);

  ROWS.forEach((row, r) => {
    const rowDrawn = smoothstep(0.02 * r, 0.32 + 0.04 * r, t);
    /* the row's title */
    ctx.save();
    ctx.globalAlpha = smoothstep(0.08 + 0.04 * r, 0.36, t);
    ctx.font = `600 ${30 * k}px ${SANS}`;
    tracking(ctx, 30 * k * 0.04);
    ctx.fillStyle = rgba(tone.ink);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.title, TITLE_X * k, row.y * k);
    ctx.restore();

    LED_X.forEach((x, led) => {
      const fill = r === 0 ? startupFill(t, led) : r === 1 ? listeningFill(t, led) : phraseFill(t, led);
      // the circle, drawn round from the top
      const own = clamp(rowDrawn * 1.15 - led * 0.05);
      ctx.save();
      ctx.fillStyle = rgba(tone.paper);
      ctx.globalAlpha = own;
      ctx.beginPath(); ctx.arc(x * k, row.y * k, R * k, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (fill > 0.01) {
        // the listening row breathes a little once the play is over
        const breath = r === 1 ? 0.5 + 0.5 * Math.sin(clock * 1.7 + led * 0.55) : 0;
        const radius = (R - 6) * (1 - 0.085 * breath * settled);
        const halo = ctx.createRadialGradient(x * k, row.y * k, 0, x * k, row.y * k, R * 2 * k);
        halo.addColorStop(0, rgba(tone.mid, 0.34 * fill));
        halo.addColorStop(1, rgba(tone.mid, 0));
        ctx.fillStyle = halo;
        ctx.fillRect((x - R * 2) * k, (row.y - R * 2) * k, R * 4 * k, R * 4 * k);
        ctx.fillStyle = rgba(tone.mid, (0.86 + 0.14 * (1 - breath * settled)) * fill);
        ctx.beginPath(); ctx.arc(x * k, row.y * k, radius * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = rgba(tone.ink);
      ctx.lineWidth = 3 * k;
      ctx.lineCap = 'round';
      if (own > 0.01) {
        ctx.beginPath(); ctx.arc(x * k, row.y * k, R * k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * own); ctx.stroke();
      }
    });
  });

  /* the four names, in pin order, under the top row only */
  ctx.save();
  ctx.globalAlpha = smoothstep(0.22, 0.4, t);
  ctx.font = `600 ${24 * k}px ${SANS}`;
  tracking(ctx, 24 * k * 0.04);
  ctx.fillStyle = rgba(tone.mid);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  LED_NAMES.forEach((name, led) => ctx.fillText(name, LED_X[led] * k, (ROWS[0].y + R + 34) * k));
  ctx.restore();

  /* one label, once the signals have played */
  label(ctx, k, tone, LABELS.bottom, LED_X[2], ROWS[2].y + R + 12, LED_X[2] - 70, AREA.y + AREA.h - 76, smoothstep(1.55, 1.9, t) * drawn);
};

const COPY: Copy = {
  kicker: '04 · LIGHTS',
  title: ['No screen.', 'Light gestures.'],
  body: 'Jarvis has no screen and no voice. It answers in light gestures: four white LEDs, and two light bars on the wall beside it.',
  note: {
    label: 'The choice',
    head: 'Light, not a voice.',
    text: 'Instant and quiet, no noise in the room. The cost: less expressive than speech.',
  },
  photo: { src: WALL, caption: 'On the wall, lights on.', whole: true },
};

export const LIGHTS_PAGE: JarvisStoryPage = {
  id: 'jarvis-lights',
  tone: BLUE,
  copy: COPY,
  drawing: drawLights,
  loop: SETTLE,
  rest: SETTLE,
  sources: [WALL],
  words: [...LABELS.rows, ...LABELS.names, LABELS.bottom],
  alt: 'Three rows of the same four LED circles, drawn in about two seconds. On the first row, labelled starting up, a light fills one LED after another up the row and empties back down, ending with all four filled. On the second, listening, all four fill and stay, then breathe slightly. On the third, phrase heard, the speech LED blinks twice and ends filled. The four LEDs are named under the top row: system, speech, network, motion. Beside it, a photograph of the box on the wall with its lights on, a light bar on each side.',
};
