/**
 * "Awake": the Surya page, alive.
 *
 * Surya is a wall piece with one flower for each person in the family; a
 * flower opens when its person wakes and closes when they sleep. The page
 * acts that out. A band of morning travels across the sheet. Where it falls,
 * the giant letters stand up and brighten, the small person living on those
 * letters wakes, and their flower on the wooden mandala opens. Where it has
 * passed, everything goes back to sleep. The reader's pointer carries the
 * morning with it.
 *
 * All positions are in scene units: the page is 2000 wide and 1200 tall
 * whatever size it is drawn at. The sprites and their measurements come from
 * scripts/flipbook/make-awake-sprites.py.
 */

import type { BookImages } from '../pageArt';
import { AWAKE_SPRITES } from './awakeSprites';
import { clamp, hash, lerp, mixRgb, rgba, smoothstep, springTo, type Rgb, type Spring } from './motion';
import type { LiveCanvases, LiveInput, LivePage, LiveScene } from './types';

const DIR = '/images/flipbook/builds/awake';
const SRC = {
  plate: `${DIR}/plate.webp`,
  mandala: `${DIR}/mandala.webp`,
  hill: `${DIR}/hill.webp`,
  letters: `${DIR}/letters.webp`,
  people: `${DIR}/people.webp`,
};

const W = 2000;
const H = 1200;

/* ---------- the morning ---------- */

/** Half-width of the band of daylight, and how soft its edges are, as fractions of the page width. */
const DAY_HALF = 0.3;
const DAY_SOFT = 0.1;
/** The band leans: it reaches the foot of the page a little before the head. */
const SLANT = 0.12;
/** The band's centre travels from START to END (right to left), then begins again. */
const DAY_START = 1.3;
const DAY_END = -0.34;
const DAY_SPEED = 0.135;
/** Where the band rests when nothing may move, and where it stands when the page is first opened. */
const DAY_REST = 0.72;
const DAY_ENTER = 1.02;

const dayPosition = (x: number, y: number): number => x / W + (y / H - 0.5) * SLANT;
const litFrom = (p: number, centre: number): number => 1 - smoothstep(DAY_HALF - DAY_SOFT, DAY_HALF + DAY_SOFT, Math.abs(p - centre));

const NIGHT_MULTIPLY: Rgb = [148, 80, 112];
const DAWN_GLOW: Rgb = [255, 208, 140];
const LETTER_NIGHT: Rgb = [132, 50, 30];
const FRONT_NIGHT: Rgb = [66, 16, 18];
const CREAM: Rgb = [255, 240, 214];

/* ---------- letters ---------- */

/** The letter sheet is drawn at this scale; its left edge and its feet land here. */
const SHEET_SCALE = 0.9247;
const SHEET_LEFT = 15;
const SHEET_FEET = 663;
const WORD_LEFT = -4;
const FEET_Y = 1092;
const sheetX = (x: number): number => WORD_LEFT + (x - SHEET_LEFT) * SHEET_SCALE;
const sheetY = (y: number): number => FEET_Y + (y - SHEET_FEET) * SHEET_SCALE;
/** Sprites are cut with this many pixels of spare room around them. */
const PAD = 3;

interface Letter {
  rect: readonly [number, number, number, number];
  /** Where the letter stands: the middle of its feet. */
  px: number;
  py: number;
  /** Size on the sheet, in sheet pixels. */
  w: number;
  h: number;
  /** Sheet position of its top-left corner. */
  sx: number;
  sy: number;
  awake: Spring;
  lean: Spring;
  hop: Spring;
  wasLit: boolean;
  phase: number;
  dir: number;
  /** This frame's pose. */
  angle: number;
  scaleX: number;
  scaleY: number;
  lift: number;
}

/* ---------- people ---------- */

type Pose = 0 | 1 | 2; // asleep, waking (a yawn), awake

interface PersonSprite { rect: readonly [number, number, number, number]; ropes?: readonly (readonly [number, number])[] }

interface Person {
  sprites: PersonSprite[];
  pose: Pose;
  awake: boolean;
  timer: number;
  /** A little squash each time the pose changes. */
  pop: Spring;
  /** 1 while fast asleep: drives the z's. */
  sleepy: Spring;
  swing: Spring;
  swingAmp: Spring;
  swingPhase: number;
  /** Scene position used to decide whether the morning has reached them, and where their z's rise from. */
  x: number;
  y: number;
  headX: number;
  headY: number;
  flower: Spring;
  flowerGoal: number;
  ping: number;
}

/** People are drawn at half size on their sheet; these bring each to the same scale on the page. */
const HAMMOCK_SCALE = 0.99;
const SWING_SCALE = 0.56;
const SITTER_SCALE = 0.96;
/** The swing's ropes are drawn long; this much of their top is left out so the seat hangs under the A's crossbar. */
const SWING_CROP = 121;

/* ---------- mandala ---------- */

const MANDALA = { x: sheetX(1132), y: 450, scale: 1 };
/** Measured on the mandala sprite, from its centre: the three flower seats and the display panel. */
const SEATS: ReadonlyArray<readonly [number, number]> = [[-132.2, 167.2], [0.3, -200.5], [131.8, 168.1]];
const SEAT_RADIUS = 44;
const PANEL = { x: -225, y: -54, w: 450, h: 108 };
const LED_COLS = 34;
const LED_ROWS = 7;

const FLOWER_TONES: ReadonlyArray<{ petal: Rgb; edge: Rgb }> = [
  { petal: [255, 241, 214], edge: [180, 82, 28] },
  { petal: [255, 201, 74], edge: [163, 56, 14] },
  { petal: [232, 84, 44], edge: [124, 31, 8] },
];

/* ---------- sky ---------- */

const MOON = { x: 268, y: 196, r: 62 };
const STARS: ReadonlyArray<readonly [number, number, number]> = [
  [96, 92, 15], [176, 318, 11], [404, 88, 13], [468, 250, 17], [352, 392, 10], [84, 470, 12], [560, 132, 9], [548, 420, 12],
  [1490, 96, 14], [1602, 232, 11], [1716, 78, 12], [1936, 150, 15], [1524, 372, 10], [1952, 418, 11], [1846, 52, 9],
];

interface Spark { fromX: number; fromY: number; toX: number; toY: number; t: number; who: number }

/** Birds keep to the daylight: offsets from the middle of the morning (page widths) and heights. */
const BIRDS: ReadonlyArray<readonly [number, number, number]> = [[0.2, 150, 1], [0.255, 205, 0.8], [0.15, 232, 0.7]];
/** Fireflies drift low among the letters on the night side. */
const FIREFLIES: ReadonlyArray<readonly [number, number]> = [
  [150, 930], [470, 880], [640, 1010], [905, 905], [1215, 985], [1395, 900], [1590, 1000], [1790, 930], [1930, 870],
];

const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
};

const context = (canvas: HTMLCanvasElement, opaque = false): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d', opaque ? { alpha: false } : undefined);
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
};

function createAwake(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const mandala = images.get(SRC.mandala);
  const hill = images.get(SRC.hill);
  const letterSheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !mandala || !hill || !letterSheet || !peopleSheet) throw new Error('The Awake page is missing a picture.');

  const k = width / W;
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

  // the letters once more in one flat darker tone: drawn a few pixels off, it gives them an edge of thickness
  const letterSide = makeCanvas(letterSheet.naturalWidth, letterSheet.naturalHeight);
  {
    const c = context(letterSide);
    c.drawImage(letterSheet, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#c0692a';
    c.fillRect(0, 0, letterSide.width, letterSide.height);
  }

  // paper tooth for the shapes drawn in code
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

  // the moon, cut once: a disc with a bite taken out of it
  const moonSize = Math.ceil(MOON.r * 2 * k) + 4;
  const moon = makeCanvas(moonSize, moonSize);
  {
    const c = context(moon);
    const r = MOON.r * k;
    c.fillStyle = rgba([255, 224, 172]);
    c.beginPath(); c.arc(moonSize / 2, moonSize / 2, r, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(moonSize / 2 + r * 0.42, moonSize / 2 - r * 0.2, r * 0.84, 0, Math.PI * 2); c.fill();
  }

  // the ground in front, given a gentle roll (the drawn strip is almost level)
  const hillScale = W / hill.naturalWidth;
  const hillRoll = (x: number): number => 15 * Math.sin((x / W) * Math.PI * 2 * 0.85 + 0.5) + 7 * Math.sin((x / W) * Math.PI * 2 * 2.2 + 2.1);
  const hillPad = 24;
  const ground = makeCanvas(width, (hill.naturalHeight * hillScale + hillPad * 2) * k);
  {
    const c = context(ground);
    const strip = 4;
    for (let x = 0; x < width; x += strip) {
      const sx = (x / width) * hill.naturalWidth;
      const sw = (strip / width) * hill.naturalWidth;
      c.drawImage(hill, sx, 0, sw + 0.6, hill.naturalHeight, x, (hillPad + hillRoll(x / k)) * k, strip + 0.6, hill.naturalHeight * hillScale * k);
    }
  }

  /* ---------- state ---------- */

  const letters: Letter[] = AWAKE_SPRITES.letters.sprites.map((sprite, i) => {
    const [sx, sy, w, h] = sprite.source;
    return {
      rect: sprite.rect as unknown as [number, number, number, number],
      px: sheetX(sx + w / 2),
      py: sheetY(sy + h),
      w, h, sx, sy,
      awake: { x: 0, v: 0 },
      lean: { x: 0, v: 0 },
      hop: { x: 0, v: 0 },
      wasLit: false,
      phase: hash(i + 1) * Math.PI * 2,
      dir: i % 2 === 0 ? -1 : 1,
      angle: 0, scaleX: 1, scaleY: 1, lift: 0,
    };
  });
  const [A1, WW, A2, , EE] = letters;

  /** A point given in sheet pixels, carried along by its letter's present pose. Returns scene units. */
  const onLetter = (letter: Letter, sheetPx: number, sheetPy: number): { x: number; y: number } => {
    const lx = (sheetPx - (letter.sx + letter.w / 2)) * SHEET_SCALE * letter.scaleX;
    const ly = (sheetPy - (letter.sy + letter.h)) * SHEET_SCALE * letter.scaleY;
    const cos = Math.cos(letter.angle);
    const sin = Math.sin(letter.angle);
    return { x: letter.px + lx * cos - ly * sin, y: letter.py - letter.lift + lx * sin + ly * cos };
  };

  const spritesOf = (who: string): PersonSprite[] => AWAKE_SPRITES.people.sprites
    .filter((sprite) => sprite.name.startsWith(who))
    .map((sprite) => ({ rect: sprite.rect as unknown as [number, number, number, number], ropes: 'ropes' in sprite ? sprite.ropes as unknown as [number, number][] : undefined }));

  const newPerson = (who: string, x: number, y: number): Person => ({
    sprites: spritesOf(who),
    pose: 0, awake: false, timer: 0,
    pop: { x: 0, v: 0 }, sleepy: { x: 1, v: 0 }, swing: { x: 0, v: 0 }, swingAmp: { x: 0.02, v: 0 }, swingPhase: hash(x) * 6,
    x, y, headX: x, headY: y,
    flower: { x: 0, v: 0 }, flowerGoal: 0, ping: 1,
  });
  // in page order, left to right: the hammock, the swing, the sitter on the E
  const people: Person[] = [
    newPerson('p1', sheetX(380), sheetY(220)),
    newPerson('p2', sheetX(1115), sheetY(560)),
    newPerson('p3', sheetX(1950), sheetY(-80)),
  ];

  let clock = 0;
  let centre = DAY_ENTER;
  let centreVel = 0;
  let held: number | null = null;
  let turnLean = 0;
  const sparks: Spark[] = [];

  const lit = (x: number, y: number): number => litFrom(dayPosition(x, y), centre);

  const snap = (): void => {
    // everything exactly where it would come to rest for the present morning
    letters.forEach((letter) => {
      letter.awake.x = lit(letter.px, letter.py - letter.h * SHEET_SCALE * 0.5);
      letter.awake.v = 0; letter.lean.x = 0; letter.lean.v = 0; letter.hop.x = 0; letter.hop.v = 0;
      letter.wasLit = letter.awake.x > 0.5;
    });
    people.forEach((person) => {
      person.awake = lit(person.x, person.y) > 0.5;
      person.pose = person.awake ? 2 : 0;
      person.timer = 0; person.pop.x = 0; person.pop.v = 0;
      person.sleepy.x = person.awake ? 0 : 1; person.sleepy.v = 0;
      person.flowerGoal = person.awake ? 1 : 0; person.flower.x = person.flowerGoal; person.flower.v = 0;
      person.swingAmp.x = person.awake ? 0.2 : 0.02; person.swing.x = 0; person.ping = 1;
    });
    sparks.length = 0;
  };

  const poseLetters = (): void => {
    letters.forEach((letter) => {
      const a = clamp(letter.awake.x, -0.25, 1.3);
      const rested = clamp(a);
      letter.scaleY = 0.93 + 0.07 * a + (1 - rested) * 0.008 * Math.sin(clock * 1.35 + letter.phase);
      letter.scaleX = 1 + (1 - letter.scaleY) * 0.55;
      letter.angle = letter.dir * 0.062 * (1 - a) + rested * 0.011 * Math.sin(clock * 0.9 + letter.phase) + letter.lean.x;
      letter.lift = Math.max(0, letter.hop.x);
    });
  };

  const step = (input: LiveInput): void => {
    const dt = input.dt;
    clock += dt;

    // where the morning is
    if (held !== null) {
      centre = held; centreVel = 0;
    } else if (input.pointer && input.onTop && input.pointer.v > -0.05 && input.pointer.v < 1.05) {
      const goal = clamp(input.pointer.u, -0.05, 1.05) - (input.pointer.v - 0.5) * -SLANT;
      const follow: Spring = { x: centre, v: centreVel };
      springTo(follow, goal, 6.5, 1, dt);
      centre = follow.x; centreVel = follow.v;
    } else {
      centreVel = 0;
      centre -= DAY_SPEED * dt;
      if (centre < DAY_END) centre = DAY_START;
    }

    // a turning sheet throws everything on it sideways for a moment
    turnLean = clamp(-input.turnVel * 0.035, -0.11, 0.11);

    letters.forEach((letter) => {
      const light = lit(letter.px, letter.py - letter.h * SHEET_SCALE * 0.5);
      springTo(letter.awake, light, 8.5, 0.4, dt);
      springTo(letter.lean, turnLean, 11, 0.32, dt);
      const isLit = light > 0.5;
      if (isLit && !letter.wasLit) letter.hop.v += 560;
      letter.wasLit = isLit;
      springTo(letter.hop, 0, 13, 0.42, dt);
    });
    poseLetters();

    people.forEach((person, who) => {
      const light = lit(person.x, person.y);
      const shouldWake = light > (person.awake ? 0.4 : 0.6);
      if (shouldWake !== person.awake) {
        person.awake = shouldWake;
        person.pose = 1;
        person.timer = shouldWake ? 0.55 : 0.7;
        person.pop.v += 2.6;
        if (shouldWake) {
          // a spark runs from the sleeper to their flower; the flower opens when it lands
          const seat = SEATS[who];
          sparks.push({ fromX: person.headX, fromY: person.headY, toX: MANDALA.x + seat[0], toY: MANDALA.y + seat[1], t: 0, who });
        } else {
          person.flowerGoal = 0;
        }
      }
      if (person.timer > 0) {
        person.timer -= dt;
        if (person.timer <= 0) { person.pose = person.awake ? 2 : 0; person.pop.v += 2.2; }
      }
      springTo(person.pop, 0, 17, 0.38, dt);
      springTo(person.sleepy, person.pose === 0 ? 1 : 0, 5, 1, dt);
      springTo(person.flower, person.flowerGoal, 9, 0.36, dt);
      person.ping = Math.min(1, person.ping + dt / 0.7);
      // hammock and swing: a slow sway asleep, a livelier one awake, and a shove from the turning page
      const lively = who === 1 ? 0.21 : 0.075;
      springTo(person.swingAmp, person.pose === 2 ? lively : person.pose === 1 ? lively * 0.4 : 0.022, 3.2, 1, dt);
      person.swingPhase += dt * (person.pose === 2 ? 3.7 : 1.9);
      springTo(person.swing, turnLean * 2.4, 6, 0.2, dt);
    });

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.t += dt / 0.52;
      if (spark.t >= 1) {
        const person = people[spark.who];
        if (person.awake) { person.flowerGoal = 1; person.ping = 0; }
        sparks.splice(i, 1);
      }
    }
  };

  /* ---------- drawing ---------- */

  /** A gradient that follows the band of morning across the page; `stop` gives the colour for a given amount of light. */
  const dayGradient = (ctx: CanvasRenderingContext2D, stop: (light: number) => string): CanvasGradient => {
    const gx = 1 / W;
    const gy = SLANT / H;
    const g2 = gx * gx + gy * gy;
    const from = -0.3;
    const to = 1.3;
    const at = (p: number): [number, number] => [(W / 2 + (gx * (p - 0.5)) / g2) * k, (H / 2 + (gy * (p - 0.5)) / g2) * k];
    const [x0, y0] = at(from);
    const [x1, y1] = at(to);
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    const stops = 44;
    for (let i = 0; i <= stops; i += 1) {
      const p = from + ((to - from) * i) / stops;
      gradient.addColorStop(i / stops, stop(litFrom(p, centre)));
    }
    return gradient;
  };

  const star = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void => {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r * 0.14, y - r * 0.14, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.14, y + r * 0.14, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.14, y + r * 0.14, x - r, y);
    ctx.quadraticCurveTo(x - r * 0.14, y - r * 0.14, x, y - r);
    ctx.fill();
  };

  /** One mechanical flower seen from the front. Shut, its petals are short and curled like a pinwheel; open, long and straight. */
  const flower = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, open: number, petal: Rgb, edge: Rgb, dim: number): void => {
    const o = clamp(open, -0.1, 1.2);
    const length = radius * lerp(0.66, 1.26, o);
    const half = radius * lerp(0.42, 0.36, o);
    const curl = (1 - clamp(o)) * 0.8;
    const fill = mixRgb(petal, [petal[0] * 0.5, petal[1] * 0.34, petal[2] * 0.3], dim);
    const line = mixRgb(edge, [edge[0] * 0.5, edge[1] * 0.4, edge[2] * 0.4], dim);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.3 + (1 - clamp(o)) * 1.1);
    ctx.lineWidth = 2.6 * k;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = rgba(line);
    ctx.fillStyle = rgba(fill);
    const petals = 6;
    for (let i = 0; i < petals; i += 1) {
      ctx.save();
      ctx.rotate((i / petals) * Math.PI * 2);
      const tipX = Math.sin(curl) * length;
      const tipY = -Math.cos(curl) * length;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(half * 1.5, -length * 0.3, tipX + half * 1.25, tipY + length * 0.3, tipX, tipY);
      ctx.bezierCurveTo(tipX - half * 1.25, tipY + length * 0.42, -half * 1.5, -length * 0.3, 0, 0);
      ctx.fill();
      ctx.stroke();
      // a crease down the middle of the petal
      ctx.beginPath();
      ctx.moveTo(0, -length * 0.24);
      ctx.quadraticCurveTo(tipX * 0.4, tipY * 0.55, tipX * 0.82, tipY * 0.82);
      ctx.globalAlpha = 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = rgba(line);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = rgba(mixRgb(CREAM, line, dim * 0.7));
    ctx.fill();
    ctx.restore();
  };

  const drawBase = (): void => {
    const ctx = base;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // backdrop, cropped evenly to the page's shape
    const plateH = plate.naturalWidth * (H / W);
    ctx.drawImage(plate, 0, (plate.naturalHeight - plateH) * 0.62, plate.naturalWidth, plateH, 0, 0, width, height);

    const mx = MANDALA.x * k;
    const my = MANDALA.y * k;
    const sunLight = lit(MANDALA.x, MANDALA.y);

    // rays behind the mandala: they only show where it is day
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(clock * 0.05);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rgba([255, 226, 150], 0.2);
    const rays = 14;
    for (let i = 0; i < rays; i += 1) {
      const a = (i / rays) * Math.PI * 2;
      const spread = i % 2 === 0 ? 0.105 : 0.06;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - spread) * 2400 * k, Math.sin(a - spread) * 2400 * k);
      ctx.lineTo(Math.cos(a + spread) * 2400 * k, Math.sin(a + spread) * 2400 * k);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // the mandala itself
    const mw = mandala.naturalWidth * MANDALA.scale * k;
    const mh = mandala.naturalHeight * MANDALA.scale * k;
    ctx.drawImage(mandala, mx - mw / 2, my - mh / 2, mw, mh);

    // night falls everywhere the morning is not
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = dayGradient(ctx, (light) => rgba(mixRgb(NIGHT_MULTIPLY, [255, 255, 255], light)));
    ctx.fillRect(0, 0, width, height);
    // ... and the edge of the morning glows
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = dayGradient(ctx, (light) => rgba(DAWN_GLOW, 0.2 * 4 * light * (1 - light)));
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    // moon and stars, on the night side only
    const moonDark = 1 - lit(MOON.x, MOON.y);
    if (moonDark > 0.01) {
      const x = MOON.x * k;
      const y = (MOON.y + Math.sin(clock * 0.5) * 5) * k;
      const r = MOON.r * k;
      ctx.save();
      ctx.globalAlpha = moonDark;
      const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6);
      halo.addColorStop(0, rgba([255, 214, 150], 0.26));
      halo.addColorStop(1, rgba([255, 214, 150], 0));
      ctx.fillStyle = halo;
      ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
      ctx.drawImage(moon, x - moon.width / 2, y - moon.height / 2);
      ctx.restore();
    }
    STARS.forEach(([sx, sy, size], i) => {
      const dark = 1 - lit(sx, sy);
      if (dark < 0.02) return;
      const twinkle = 0.62 + 0.38 * Math.sin(clock * (1.3 + hash(i) * 1.6) + hash(i + 40) * 6.28);
      ctx.globalAlpha = dark * (0.45 + 0.55 * twinkle);
      ctx.fillStyle = rgba([255, 226, 180]);
      star(ctx, sx * k, sy * k, size * (0.8 + 0.3 * twinkle) * k);
    });
    ctx.globalAlpha = 1;

    // birds ride along with the morning
    BIRDS.forEach(([offset, height, size], i) => {
      const x = (centre + offset) * W + Math.sin(clock * 0.7 + i * 2.1) * 26;
      const y = height + Math.sin(clock * 1.15 + i * 1.7) * 16;
      const day = lit(x, y);
      if (day < 0.05 || x < -60 || x > W + 60) return;
      const flap = Math.sin(clock * 7.5 + i * 1.3);
      const span = 30 * size;
      ctx.save();
      ctx.globalAlpha = day * 0.85;
      ctx.strokeStyle = '#8f3008';
      ctx.lineWidth = 5.5 * size * k;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo((x - span) * k, (y - (6 + flap * 12) * size) * k);
      ctx.quadraticCurveTo((x - span * 0.45) * k, (y - (14 + flap * 4) * size) * k, x * k, y * k);
      ctx.quadraticCurveTo((x + span * 0.45) * k, (y - (14 + flap * 4) * size) * k, (x + span) * k, (y - (6 + flap * 12) * size) * k);
      ctx.stroke();
      ctx.restore();
    });

    // now and then a shooting star crosses the dark
    {
      const period = 7.3;
      const turn = Math.floor(clock / period);
      const t = (clock - turn * period) / 0.7;
      if (t < 1) {
        const x0 = 180 + hash(turn + 5) * 1640;
        const y0 = 70 + hash(turn + 11) * 190;
        const x = x0 - 300 * t;
        const y = y0 + 120 * t;
        const dark = 1 - lit(x, y);
        if (dark > 0.6) {
          const tail = ctx.createLinearGradient(x * k, y * k, (x + 150) * k, (y - 60) * k);
          tail.addColorStop(0, rgba([255, 240, 205], dark * Math.sin(Math.PI * t)));
          tail.addColorStop(1, rgba([255, 240, 205], 0));
          ctx.strokeStyle = tail;
          ctx.lineWidth = 4 * k;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x * k, y * k); ctx.lineTo((x + 150) * k, (y - 60) * k); ctx.stroke();
        }
      }
    }

    // the light around the mandala's rim, like the real piece
    const awakeCount = people.reduce((sum, person) => sum + clamp(person.flower.x), 0);
    const radius = 397 * MANDALA.scale * k;
    const pulse = 0.5 + 0.5 * Math.sin(clock * 1.5);
    const glow = ctx.createRadialGradient(mx, my, radius * 0.66, mx, my, radius * 1.16);
    const strength = 0.2 + 0.11 * awakeCount + 0.06 * pulse;
    glow.addColorStop(0, rgba([255, 112, 92], 0));
    glow.addColorStop(0.58, rgba([255, 112, 92], strength));
    glow.addColorStop(1, rgba([255, 112, 92], 0));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(mx - radius * 1.2, my - radius * 1.2, radius * 2.4, radius * 2.4);
    ctx.globalCompositeOperation = 'source-over';

    // display: a row of lights rolling like the day
    const pitch = (PANEL.w - 30) / LED_COLS;
    const top = MANDALA.y + PANEL.y + (PANEL.h - pitch * LED_ROWS) / 2 + pitch / 2;
    const left = MANDALA.x + PANEL.x + 15 + pitch / 2;
    for (let col = 0; col < LED_COLS; col += 1) {
      const wave = (LED_ROWS - 1) / 2 + 2.45 * Math.sin(col * 0.44 - clock * 1.6);
      for (let row = 0; row < LED_ROWS; row += 1) {
        const distance = Math.abs(row - wave);
        const on = distance < 0.62 ? 1 : distance < 1.35 ? 0.34 : 0;
        const x = (left + col * pitch) * k;
        const y = (top + row * pitch) * k;
        if (on > 0) {
          ctx.fillStyle = rgba([255, 196, 92], 0.2 * on);
          ctx.beginPath(); ctx.arc(x, y, pitch * 0.62 * k, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = rgba(mixRgb([226, 110, 40], [255, 226, 150], on));
        } else {
          ctx.fillStyle = rgba([60, 12, 4], 0.34);
        }
        ctx.beginPath(); ctx.arc(x, y, pitch * 0.3 * k, 0, Math.PI * 2); ctx.fill();
      }
    }

    // the three flowers: each belongs to one of the people on the page
    people.forEach((person, who) => {
      const seat = SEATS[who];
      const x = (MANDALA.x + seat[0]) * k;
      const y = (MANDALA.y + seat[1]) * k;
      const open = person.flower.x;
      const tone = FLOWER_TONES[who];
      // a shut flower sits in the dark with the rest of the night; an open one is lit
      const dim = (1 - clamp(open)) * (1 - lit(MANDALA.x + seat[0], MANDALA.y + seat[1])) * 0.85;
      if (person.ping < 1) {
        const p = person.ping;
        ctx.strokeStyle = rgba([255, 236, 190], (1 - p) * 0.9);
        ctx.lineWidth = (7 - 5 * p) * k;
        ctx.beginPath(); ctx.arc(x, y, SEAT_RADIUS * (0.9 + 1.5 * (1 - (1 - p) ** 3)) * k, 0, Math.PI * 2); ctx.stroke();
      }
      flower(ctx, x, y, SEAT_RADIUS * 0.98 * k, open, tone.petal, tone.edge, dim);
    });

    // tooth over everything, so the shapes drawn in code sit with the printed ones
    if (grainPattern) {
      ctx.globalAlpha = 0.07;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const drawLetter = (ctx: CanvasRenderingContext2D, sheet: CanvasImageSource, letter: Letter, dx: number, dy: number): void => {
    const [rx, ry, rw, rh] = letter.rect;
    ctx.save();
    ctx.translate((letter.px + dx) * k, (letter.py - letter.lift + dy) * k);
    ctx.rotate(letter.angle);
    ctx.scale(letter.scaleX * SHEET_SCALE * k, letter.scaleY * SHEET_SCALE * k);
    ctx.drawImage(sheet, rx, ry, rw, rh, -rw / 2, -rh + PAD, rw, rh);
    ctx.restore();
  };

  const drawWord = (): void => {
    const ctx = word;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    letters.forEach((letter) => drawLetter(ctx, letterSide, letter, 6, 7));
    letters.forEach((letter) => drawLetter(ctx, letterSheet, letter, 0, 0));
    // sleeping letters sit in the dusk
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = dayGradient(ctx, (light) => rgba(LETTER_NIGHT, 0.5 * (1 - light)));
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  const zees = (ctx: CanvasRenderingContext2D, x: number, y: number, amount: number, seed: number): void => {
    if (amount < 0.02) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i += 1) {
      const t = (clock * 0.34 + i / 3 + seed) % 1;
      const size = (30 + 38 * t) * k;
      ctx.font = `italic 600 ${size}px "FB Serif", Georgia, serif`;
      ctx.globalAlpha = amount * Math.sin(Math.PI * t) * 0.92;
      ctx.fillStyle = rgba(CREAM);
      ctx.fillText('z', (x + 30 + 52 * t + Math.sin(t * 7 + seed * 9) * 10) * k, (y - 16 - 112 * t) * k);
    }
    ctx.restore();
  };

  const drawFront = (): void => {
    const ctx = fg;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);

    // hammock: strung between the first A and the W
    {
      const person = people[0];
      const sprite = person.sprites[person.pose];
      const tips = sprite.ropes ?? [[0, 0], [sprite.rect[2], 0]];
      const left = onLetter(A1, 258, 132);
      const right = onLetter(WW, 500, 132);
      const span = tips[1][0] - tips[0][0];
      const length = Math.hypot(right.x - left.x, right.y - left.y);
      const s = (length / span);
      const sway = person.swingAmp.x * Math.sin(person.swingPhase) + person.swing.x;
      ctx.save();
      ctx.translate(left.x * k, left.y * k);
      ctx.rotate(Math.atan2(right.y - left.y, right.x - left.x));
      ctx.scale(s * k, s * k * (HAMMOCK_SCALE / s) * (1 + person.pop.x * 0.5));
      ctx.transform(1, 0, sway * 1.4, 1, 0, 0);
      ctx.drawImage(peopleSheet, sprite.rect[0], sprite.rect[1], sprite.rect[2], sprite.rect[3], -tips[0][0], -tips[0][1], sprite.rect[2], sprite.rect[3]);
      ctx.restore();
      person.x = (left.x + right.x) / 2;
      person.y = left.y + 70;
      person.headX = left.x + 60;
      person.headY = left.y + 54;
      // pegs where the ropes are tied
      ctx.fillStyle = '#8a3410';
      [left, right].forEach((point) => { ctx.beginPath(); ctx.arc(point.x * k, point.y * k, 6 * k, 0, Math.PI * 2); ctx.fill(); });
    }

    // swing: hung from the crossbar of the second A
    {
      const person = people[1];
      const sprite = person.sprites[person.pose];
      const tips = sprite.ropes ?? [[0, 0], [sprite.rect[2], 0]];
      const pivot = onLetter(A2, 1115, 446);
      const angle = person.swingAmp.x * Math.sin(person.swingPhase) + person.swing.x + A2.angle;
      const mid = (tips[0][0] + tips[1][0]) / 2;
      const visible = sprite.rect[3] - SWING_CROP;
      ctx.save();
      ctx.translate(pivot.x * k, pivot.y * k);
      ctx.rotate(angle);
      ctx.scale(SWING_SCALE * k * (1 - person.pop.x * 0.3), SWING_SCALE * k * (1 + person.pop.x * 0.4));
      ctx.drawImage(peopleSheet, sprite.rect[0], sprite.rect[1] + SWING_CROP, sprite.rect[2], visible, -mid, 0, sprite.rect[2], visible);
      ctx.restore();
      // knots on the crossbar
      ctx.fillStyle = '#8a3410';
      tips.forEach((tip) => {
        const dx = (tip[0] - mid) * SWING_SCALE;
        ctx.beginPath(); ctx.arc((pivot.x + dx * Math.cos(angle)) * k, (pivot.y + dx * Math.sin(angle)) * k, 5 * k, 0, Math.PI * 2); ctx.fill();
      });
      const reach = 150;
      person.x = pivot.x - Math.sin(angle) * reach;
      person.y = pivot.y + Math.cos(angle) * reach;
      person.headX = pivot.x - Math.sin(angle) * 92;
      person.headY = pivot.y + Math.cos(angle) * 92;
    }

    // the sitter on top of the E
    {
      const person = people[2];
      const sprite = person.sprites[person.pose];
      const seat = onLetter(EE, 1950, 60);
      const stretch = person.pose === 2 ? 0.022 * Math.sin(clock * 2.6) : person.pose === 0 ? 0.012 * Math.sin(clock * 1.2) : 0;
      ctx.save();
      ctx.translate(seat.x * k, seat.y * k);
      ctx.rotate(EE.angle + (person.pose === 2 ? 0.02 * Math.sin(clock * 1.3) : 0));
      ctx.scale(SITTER_SCALE * k * (1 - person.pop.x * 0.35), SITTER_SCALE * k * (1 + person.pop.x * 0.45 + stretch));
      ctx.drawImage(peopleSheet, sprite.rect[0], sprite.rect[1], sprite.rect[2], sprite.rect[3], -sprite.rect[2] / 2, -sprite.rect[3], sprite.rect[2], sprite.rect[3]);
      ctx.restore();
      person.x = seat.x;
      person.y = seat.y - 80;
      person.headX = seat.x - (person.pose === 0 ? 52 : 0);
      person.headY = seat.y - (person.pose === 0 ? 98 : 194);
    }

    // the ground in front, hiding the letters' feet
    const hillTop = FEET_Y - 26 - AWAKE_SPRITES.hill.ridge * hillScale - hillPad;
    ctx.drawImage(ground, 0, hillTop * k);

    // night
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = dayGradient(ctx, (light) => rgba(FRONT_NIGHT, 0.4 * (1 - light)));
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    // fireflies on the night side
    FIREFLIES.forEach(([fx, fy], i) => {
      const x = fx + Math.sin(clock * 0.6 + i * 1.9) * 42 + Math.sin(clock * 0.23 + i) * 30;
      const y = fy + Math.cos(clock * 0.5 + i * 2.3) * 30;
      const dark = 1 - lit(x, y);
      if (dark < 0.05) return;
      const blink = Math.max(0, Math.sin(clock * (1.1 + hash(i + 9) * 0.9) + i * 2.7));
      const alpha = dark * blink;
      if (alpha < 0.03) return;
      const glowR = 26 * k;
      const halo = ctx.createRadialGradient(x * k, y * k, 0, x * k, y * k, glowR);
      halo.addColorStop(0, rgba([255, 226, 140], 0.55 * alpha));
      halo.addColorStop(1, rgba([255, 226, 140], 0));
      ctx.fillStyle = halo;
      ctx.fillRect(x * k - glowR, y * k - glowR, glowR * 2, glowR * 2);
      ctx.fillStyle = rgba([255, 244, 196], alpha);
      ctx.beginPath(); ctx.arc(x * k, y * k, 4.2 * k, 0, Math.PI * 2); ctx.fill();
    });

    // z's over the sleepers
    people.forEach((person, who) => zees(ctx, person.headX, person.headY, clamp(person.sleepy.x), who * 0.37));

    // a spark from each waker to their flower
    sparks.forEach((spark) => {
      const midX = (spark.fromX + spark.toX) / 2;
      const midY = Math.min(spark.fromY, spark.toY) - 190;
      for (let i = 0; i < 9; i += 1) {
        const t = clamp(spark.t - i * 0.035);
        if (t <= 0) continue;
        const e = t * t * (3 - 2 * t);
        const x = (1 - e) * (1 - e) * spark.fromX + 2 * (1 - e) * e * midX + e * e * spark.toX;
        const y = (1 - e) * (1 - e) * spark.fromY + 2 * (1 - e) * e * midY + e * e * spark.toY;
        ctx.globalAlpha = (1 - i / 9) * 0.95;
        ctx.fillStyle = rgba([255, 240, 200]);
        if (i === 0) star(ctx, x * k, y * k, 19 * k);
        else { ctx.beginPath(); ctx.arc(x * k, y * k, (8 - i * 0.7) * k, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    });
  };

  /** Soft, low shadows of the two floating layers, redrawn small so they follow the motion. */
  const drawShadow = (): void => {
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
  };

  const draw = (): void => {
    // the front layer places the people, and the sparks start from them, so it is posed before the sheet is drawn
    drawWord();
    drawFront();
    drawBase();
    drawShadow();
  };

  /** Everyone asleep, the morning just arriving at the page's outer edge. */
  const sleep = (): void => {
    centre = DAY_ENTER;
    centreVel = 0;
    letters.forEach((letter) => { letter.awake.x = 0; letter.awake.v = 0; letter.hop.x = 0; letter.hop.v = 0; letter.wasLit = false; });
    people.forEach((person) => {
      person.awake = false; person.pose = 0; person.timer = 0;
      person.sleepy.x = 1; person.sleepy.v = 0;
      person.flowerGoal = 0; person.flower.x = 0; person.flower.v = 0; person.ping = 1;
    });
    sparks.length = 0;
  };

  return {
    canvases,
    frame(input) {
      if (input.reduced) {
        if (held === null) centre = DAY_REST;
        clock = 0;
        snap();
        poseLetters();
        draw();
        return false;
      }
      step(input);
      draw();
      return true;
    },
    enter() {
      // the page lands asleep; then the light reaches it and it wakes while the reader watches
      if (held === null) sleep();
    },
    scrub(position) {
      held = position;
      if (position !== null) { centre = position; snap(); poseLetters(); draw(); }
    },
    flatten(target) {
      if (target.width !== width) target.width = width;
      if (target.height !== height) target.height = height;
      const ctx = context(target, true);
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
    dispose() {
      [canvases.base, canvases.word, canvases.fg, canvases.shadow, blurA, blurB, letterSide, grain, moon, ground].forEach((canvas) => { canvas.width = 1; canvas.height = 1; });
    },
  };
}

export const suryaAwake: LiveScene = {
  id: 'surya-awake',
  sources: Object.values(SRC),
  create: createAwake,
};
