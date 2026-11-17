/**
 * Story page 05 · Messages, the left page facing CONTROL.
 *
 * The drawing plays once, in two seconds, then holds. 0 to 0.5 s everything draws itself: the sensor head
 * (the box), a rectangle for the Raspberry Pi, a lamp, the two thin lines joining them, and the table
 * rows. At 0.5 s the first table row turns the page's mid colour; 0.6 to 1.4 s a small pill reading
 * "light: ON" travels from the box along the line to the Pi, pauses a beat, then on to the lamp; at 1.5 s
 * the lamp fills; labels are in by 1.9 s. After 2 s the lamp's fill breathes a little.
 *
 * Where the words come from.
 * - His own article, https://circuitdigest.com/microcontroller-projects/voice-controlled-smart-home-assistant :
 *   "Sends \"ON\" or \"OFF\" messages to indicate state changes.", "Home Assistant runs on a Raspberry Pi 5",
 *   "Home Assistant triggers an automation". So: Jarvis sends ON or OFF, a Raspberry Pi 5 runs Home
 *   Assistant, and Home Assistant does the rest (the lights).
 * - His project notes, data/projects/jarvis.json, decision 3: "Enabled scalable, decoupled integration
 *   with multiple devices." / "Introduced system-level complexity." So the note: new devices are easy to
 *   add; the cost is more parts that all have to keep running.
 * - His firmware, adiind/diy-jarvis (sprites/jarvisFirmware.ts, `phrases`, README wording of each
 *   phrase): "Jarvis Lights On" publishes ON to the light topic (id 6); "Lights Off Jarvis" publishes OFF to
 *   the same one (id 7); "Cooking Mode" toggles and publishes the cooking state (id 3); "Goodnight Jarvis"
 *   toggles and publishes the goodnight state (id 4). So the four rows: light: ON, light: OFF,
 *   cooking: toggle, goodnight: toggle; the right-hand side is read from the file, not typed.
 *   The pill reads "light: ON" because that is the message the first row sends.
 * - The photograph is his own (parts/desk.webp); the caption says only what it shows.
 */

import { clamp, lerp, mixRgb, rgba, smoothstep, type Rgb } from '../motion';
import { SENSOR, drawSensorHead, sensorView } from '../jarvisWire';
import { JARVIS_FIRMWARE } from '../sprites/jarvisFirmware';
import { AREA, SANS, tracking, wrap, print, type Copy, type Drawing } from '../suryaStory';
import { PLUM, arrive, type JarvisStoryPage } from './kit';

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
const DESK = '/images/flipbook/jarvis/parts/desk.webp';

/** What each table row says and sends, read from the firmware's phrase table (README wording). */
const sendOf = (readme: string): string => {
  const phrase = JARVIS_FIRMWARE.phrases.find((item) => item.readme === readme);
  if (!phrase) throw new Error(`The firmware has no phrase "${readme}".`);
  // the topic ends in "<name>/state"; ON and OFF phrases publish that state, the rest toggle it
  const name = phrase.topic.split('/').slice(-2)[0];
  const state = /publishes ON\b/.test(phrase.action) ? 'ON' : /publishes OFF\b/.test(phrase.action) ? 'OFF' : 'toggle';
  return `${name}: ${state}`;
};
const ROWS: ReadonlyArray<readonly [string, string]> = ['Jarvis Lights On', 'Lights Off Jarvis', 'Cooking Mode', 'Goodnight Jarvis'].map((phrase) => [phrase, sendOf(phrase)] as const);

const LABELS = {
  jarvis: 'Jarvis',
  pi: 'Raspberry Pi 5, Home Assistant',
  lamp: 'lights',
  pill: 'light: ON',
  rows: ROWS.flat(),
};
const CAPTION = 'The finished case on my cutting mat.';

/* the top half: three things in a row, joined by thin lines */
const ROW_Y = 250;
const HEAD = { cx: 175, w: 140 };
const HEAD_H = SENSOR.plate.h * (HEAD.w / SENSOR.plate.w);
const PI = { cx: 580, w: 320, h: 180 };
const LAMP = { cx: 980 };
const LABEL_Y = 410;
/** The pill's resting places along the line: leaving the box, on the Pi, on the lamp. */
const STOPS = [HEAD.cx + HEAD.w / 2 + 20, PI.cx, LAMP.cx - 70];
/* the bottom half: the table */
const TABLE = { x: AREA.x + 20, w: AREA.w - 40, top: 520, row: 88, send: 640 };
const LAMP_ON: Rgb = PLUM.mid;

const stroke = (ctx: CanvasRenderingContext2D, k: number, tone: { ink: Rgb }, width = 3): void => {
  ctx.strokeStyle = rgba(tone.ink);
  ctx.lineWidth = width * k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const drawMessages: Drawing = (kit, ctx, t, clock) => {
  const { k, tone, images, stage } = kit;
  const drawn = smoothstep(0, 0.5, t);
  const shown = smoothstep(1.3, 1.9, t);
  const lampOn = smoothstep(1.45, 1.6, t);
  const breathe = t >= SETTLE - 0.001 ? 0.07 * Math.sin(clock * 2.2) : 0;

  /* the pill: leaves the box at 0.6 s, on the Pi at 1.0 s, pauses, reaches the lamp at 1.4 s */
  const leg1 = arrive(clamp((t - 0.6) / 0.4));
  const leg2 = arrive(clamp((t - 1.1) / 0.3));
  const pillX = t < 1.05 ? lerp(STOPS[0], STOPS[1], leg1) : lerp(STOPS[1], STOPS[2], leg2);
  const pillIn = smoothstep(0.58, 0.68, t) * (1 - smoothstep(1.4, 1.5, t));
  const onPi = smoothstep(0.95, 1.0, t) * (1 - smoothstep(1.1, 1.2, t));

  /* the box: the sensor head, small; its four lights come on as the message leaves */
  const leds = SENSOR.leds.map((_, i) => smoothstep(0.6 + i * 0.03, 0.7 + i * 0.03, t));
  const headX = HEAD.cx - HEAD.w / 2;
  const headY = ROW_Y - HEAD_H / 2;
  drawSensorHead(ctx, sensorView(headX * k, headY * k, HEAD.w * k), {
    line: tone.ink, width: 3 * k, fill: tone.paper, ledOn: tone.mid, lit: leds, drawn, facetAlpha: 0.75,
  });

  /* the Pi: a rounded rectangle with a chip and three ports, drawing itself */
  const piX = PI.cx - PI.w / 2;
  const piY = ROW_Y - PI.h / 2;
  ctx.save();
  stroke(ctx, k, tone);
  const piLen = 2 * (PI.w + PI.h);
  const piDrawn = smoothstep(0.05, 0.45, t);
  if (piDrawn > 0.01) {
    ctx.globalAlpha = clamp(piDrawn * 1.6);
    ctx.fillStyle = rgba(tone.paper);
    ctx.beginPath(); ctx.roundRect(piX * k, piY * k, PI.w * k, PI.h * k, 16 * k); ctx.fill();
    ctx.globalAlpha = 1;
    if (piDrawn < 1) ctx.setLineDash([piLen * k * piDrawn, piLen * 2 * k]);
    ctx.strokeStyle = onPi > 0.01 ? rgba(mixRgb(tone.ink, tone.mid, onPi)) : rgba(tone.ink);
    ctx.lineWidth = (3 + onPi * 2) * k;
    ctx.beginPath(); ctx.roundRect(piX * k, piY * k, PI.w * k, PI.h * k, 16 * k); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 2.4 * k;
    ctx.strokeStyle = rgba(tone.ink, 0.7 * piDrawn);
    ctx.beginPath(); ctx.roundRect((PI.cx - 60) * k, (ROW_Y - 40) * k, 80 * k, 80 * k, 8 * k); ctx.stroke();
    [-44, 0, 44].forEach((dy) => {
      ctx.beginPath(); ctx.roundRect((piX + PI.w - 52) * k, (ROW_Y + dy - 13) * k, 36 * k, 26 * k, 5 * k); ctx.stroke();
    });
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath(); ctx.moveTo((piX + 24 + i * 16) * k, (piY + 18) * k); ctx.lineTo((piX + 24 + i * 16) * k, (piY + 32) * k); ctx.stroke();
    }
  }
  ctx.restore();

  /* the lamp: shade, stem, foot; it fills once the message arrives, and then breathes */
  ctx.save();
  stroke(ctx, k, tone);
  const lampDrawn = smoothstep(0.1, 0.5, t);
  if (lampDrawn > 0.01) {
    const top = ROW_Y - 78;
    const shade = new Path2D();
    shade.moveTo((LAMP.cx - 34) * k, top * k);
    shade.lineTo((LAMP.cx + 34) * k, top * k);
    shade.lineTo((LAMP.cx + 76) * k, (top + 92) * k);
    shade.lineTo((LAMP.cx - 76) * k, (top + 92) * k);
    shade.closePath();
    ctx.globalAlpha = clamp(lampDrawn * 1.6);
    ctx.fillStyle = rgba(tone.paper);
    ctx.fill(shade);
    if (lampOn > 0.01) {
      ctx.fillStyle = rgba(LAMP_ON, clamp(lampOn * (0.9 + breathe)));
      ctx.fill(shade);
      // a few short rays under the shade
      ctx.strokeStyle = rgba(tone.mid, lampOn * (0.8 + breathe));
      ctx.lineWidth = 3 * k;
      [-0.7, -0.35, 0, 0.35, 0.7].forEach((a) => {
        const fx = LAMP.cx + a * 76;
        ctx.beginPath(); ctx.moveTo(fx * k, (top + 108) * k); ctx.lineTo((fx + a * 14) * k, (top + 132) * k); ctx.stroke();
      });
      ctx.strokeStyle = rgba(tone.ink);
      ctx.lineWidth = 3 * k;
    }
    ctx.globalAlpha = 1;
    const lampLen = 400;
    ctx.setLineDash(lampDrawn < 1 ? [lampLen * lampDrawn * k, lampLen * 2 * k] : []);
    ctx.stroke(shade);
    ctx.setLineDash([]);
    ctx.globalAlpha = lampDrawn;
    ctx.beginPath(); ctx.moveTo(LAMP.cx * k, (top + 92) * k); ctx.lineTo(LAMP.cx * k, (top + 150) * k); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(LAMP.cx * k, (top + 156) * k, 44 * k, 9 * k, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(tone.paper); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  /* the thin lines joining the three: left to right, drawing themselves */
  ctx.save();
  stroke(ctx, k, tone, 2.4);
  ctx.strokeStyle = rgba(tone.mid);
  const join = (x0: number, x1: number, a: number, b: number): void => {
    const u = smoothstep(a, b, t);
    if (u < 0.01) return;
    ctx.beginPath(); ctx.moveTo(x0 * k, ROW_Y * k); ctx.lineTo(lerp(x0, x1, u) * k, ROW_Y * k); ctx.stroke();
  };
  join(HEAD.cx + HEAD.w / 2 + 8, PI.cx - PI.w / 2 - 8, 0.2, 0.4);
  join(PI.cx + PI.w / 2 + 8, LAMP.cx - 90, 0.3, 0.5);
  ctx.restore();

  /* the table: four phrases and what each sends; the first row turns mid at 0.5 s */
  ROWS.forEach(([phrase, sent], i) => {
    const y = TABLE.top + i * TABLE.row;
    const rowIn = smoothstep(0.1 + i * 0.08, 0.3 + i * 0.08, t);
    const hot = i === 0 ? smoothstep(0.5, 0.58, t) : 0;
    ctx.save();
    ctx.globalAlpha = rowIn;
    if (hot > 0.01) {
      ctx.fillStyle = rgba(tone.mid, 0.16 * hot);
      ctx.beginPath(); ctx.roundRect((TABLE.x - 8) * k, (y + 4) * k, (TABLE.w + 16) * k, (TABLE.row - 8) * k, 12 * k); ctx.fill();
    }
    ctx.fillStyle = rgba(mixRgb(tone.ink, tone.mid, hot));
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `600 ${38 * k}px ${SANS}`;
    tracking(ctx, 0);
    ctx.fillText(phrase, (TABLE.x + 14) * k, (y + TABLE.row / 2) * k);
    ctx.font = `650 ${38 * k}px ${SANS}`;
    ctx.fillStyle = rgba(mixRgb(tone.mid, tone.ink, 1 - Math.max(hot, 0.35)));
    ctx.fillText(sent, (TABLE.send + 14) * k, (y + TABLE.row / 2) * k);
    // a short arrow between the phrase and what is sent
    ctx.strokeStyle = rgba(tone.ink, 0.35);
    ctx.lineWidth = 2.4 * k;
    ctx.beginPath();
    ctx.moveTo((TABLE.send - 70) * k, (y + TABLE.row / 2) * k); ctx.lineTo((TABLE.send - 20) * k, (y + TABLE.row / 2) * k);
    ctx.moveTo((TABLE.send - 32) * k, (y + TABLE.row / 2 - 9) * k); ctx.lineTo((TABLE.send - 20) * k, (y + TABLE.row / 2) * k); ctx.lineTo((TABLE.send - 32) * k, (y + TABLE.row / 2 + 9) * k);
    ctx.stroke();
    ctx.strokeStyle = rgba(tone.ink, 0.22);
    ctx.beginPath(); ctx.moveTo(TABLE.x * k, (y + TABLE.row) * k); ctx.lineTo((TABLE.x + TABLE.w) * k, (y + TABLE.row) * k); ctx.stroke();
    ctx.restore();
  });

  /* the labels, in by 1.9 s */
  if (shown > 0.01) {
    ctx.save();
    ctx.globalAlpha = shown;
    ctx.fillStyle = rgba(tone.ink);
    ctx.font = `600 ${30 * k}px ${SANS}`;
    tracking(ctx, 30 * k * 0.04);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS.jarvis, HEAD.cx * k, LABEL_Y * k);
    ctx.fillText(LABELS.pi, PI.cx * k, LABEL_Y * k);
    ctx.fillText(LABELS.lamp, LAMP.cx * k, LABEL_Y * k);
    ctx.restore();
  }

  /* the message itself: a small filled pill with pale text, riding the line */
  if (pillIn > 0.01) {
    const w = 150;
    const h = 44;
    ctx.save();
    ctx.globalAlpha = pillIn;
    ctx.translate(pillX * k, ROW_Y * k);
    ctx.scale(lerp(0.85, 1, pillIn), lerp(0.85, 1, pillIn));
    ctx.fillStyle = rgba(tone.mid);
    ctx.beginPath(); ctx.roundRect((-w / 2) * k, (-h / 2) * k, w * k, h * k, (h / 2) * k); ctx.fill();
    ctx.fillStyle = rgba(tone.paper);
    ctx.font = `650 ${26 * k}px ${SANS}`;
    tracking(ctx, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS.pill, 0, 2 * k);
    ctx.restore();
  }

  /* the photograph, whole, in the right column */
  const img = images.get(DESK);
  if (img) {
    const COLUMN = { x: 1170, w: 760 };
    const FOOT = 62;
    ctx.save();
    ctx.font = `450 ${43 * k}px ${SANS}`;
    const lines = wrap(ctx, COPY.body ?? '', COLUMN.w * k).length;
    ctx.restore();
    const textEnd = 264 + 98 * COPY.title.length + 4 + 60 * lines + 4;
    const h = COLUMN.w * (img.naturalHeight / img.naturalWidth);
    const top = Math.max(textEnd + 24, 1140 - FOOT - h);
    const fg = stage.fg;
    print(fg, k, img, { src: DESK }, COLUMN.x, top, COLUMN.w, h, FOOT);
    fg.save();
    fg.fillStyle = rgba([70, 58, 52]);
    fg.font = `500 ${28 * k}px ${SANS}`;
    tracking(fg, 0);
    fg.textAlign = 'left';
    fg.textBaseline = 'middle';
    fg.fillText(CAPTION, (COLUMN.x + 6) * k, (top + h + FOOT / 2 + 2) * k);
    fg.restore();
  }
};

const COPY: Copy = {
  kicker: '05 · MESSAGES',
  title: ['One short', 'message.'],
  body: 'When Jarvis hears a phrase, it sends ON or OFF to Home Assistant, which runs on a Raspberry Pi in my home. Home Assistant does the rest.',
  note: {
    label: 'THE CHOICE',
    head: 'Messages, not direct wiring.',
    text: 'New devices are easy to add. The cost: more parts that all have to keep running.',
  },
};

export const MESSAGES_PAGE: JarvisStoryPage = {
  id: 'jarvis-messages',
  tone: PLUM,
  copy: COPY,
  drawing: drawMessages,
  loop: SETTLE,
  rest: SETTLE,
  sources: [DESK],
  words: [LABELS.jarvis, LABELS.pi, LABELS.lamp, LABELS.pill, ...LABELS.rows, CAPTION],
  alt: 'A line drawing in three parts joined by thin lines: Jarvis (the small sensor head), a Raspberry Pi 5 running Home Assistant, and a lamp. Below it, a table of four phrases and what each sends: Jarvis Lights On sends light: ON, Lights Off Jarvis sends light: OFF, Cooking Mode sends cooking: toggle, Goodnight Jarvis sends goodnight: toggle. In about two seconds everything draws itself, the first row lights up, a small pill reading light: ON travels from Jarvis to the Pi and on to the lamp, and the lamp fills. Beside it, a photograph of the finished case on my cutting mat.',
};
