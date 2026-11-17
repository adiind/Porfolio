/**
 * "Home": it now connects to my house.
 *
 * The four letters are a row of little houses at dusk. Surya glows in the
 * round window of the O. As the maker walks home, a signal runs from it to
 * each house in turn and their windows light up; when he arrives its three
 * flowers open. Then the lights go down and he walks on.
 */

import type { BookImages } from '../pageArt';
import { clamp, hash, rgba, smoothstep, springTo, type Rgb, type Spring } from './motion';
import { drawBloom } from './shapes';
import { HOME_SPRITES } from './sprites/home';
import {
  STAGE_W, context, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeCanvas, makeLetters, onLetter, restPose,
  spriteNamed, stepLetters, tintSheet, withLetter, wordSpan, type Letter,
} from './stage';
import type { LivePage, LiveScene } from './types';

const DIR = '/images/flipbook/surya/home';
const MANDALA = '/images/flipbook/builds/awake/mandala.webp';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp`, mandala: MANDALA };

const LOOP = 12.6;
const WORD_W = 1900;
const FEET = 1012;
const WARM: Rgb = [255, 214, 118];
const PLUM: Rgb = [44, 18, 66];

/** When each house (H, O, M, E) is lit, and when the signal that lights it sets off. The O lights last, when he is home. */
const LIT: ReadonlyArray<readonly [number, number]> = [[1.5, 9.8], [4.6, 10.7], [2.7, 10.1], [3.9, 10.4]];
const SIGNAL: ReadonlyArray<number | null> = [0.8, null, 2.0, 3.2];
const SIGNAL_TIME = 0.7;
const ARRIVES = 4.9;
const LEAVES = 9;

function createHome(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  const mandala = images.get(SRC.mandala);
  if (!plate || !sheet || !peopleSheet || !mandala) throw new Error('The Home page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = HOME_SPRITES.letters.sprites;
  const letters = makeLetters(sprites, { scale: WORD_W / wordSpan(sprites).width, left: (STAGE_W - WORD_W) / 2, feet: FEET });
  const side = stage.keep(tintSheet(sheet, '#8a5fa8'));
  const people = HOME_SPRITES.people.sprites;
  const ring = (() => {
    const [hx, hy, hw, hh] = sprites[1].holes[0];
    return { cx: hx + hw / 2, cy: hy + hh / 2, rx: hw / 2, ry: hh / 2 };
  })();
  /** Each house's windows (the O's big round opening is the mandala's, not a window). */
  const windows = sprites.map((sprite, i) => sprite.holes.slice(i === 1 ? 1 : 0));
  const lit: Spring[] = letters.map(() => ({ x: 0, v: 0 }));

  // the highest point of each letter (a chimney, or a roof peak): smoke rises from there
  const tops = (() => {
    const probe = makeCanvas(sheet.naturalWidth, 24);
    const c = context(probe);
    return letters.map((letter) => {
      const [rx, ry, rw] = letter.rect;
      c.clearRect(0, 0, probe.width, 24);
      c.drawImage(sheet, rx, ry, rw, 24, 0, 0, rw, 24);
      const data = c.getImageData(0, 0, rw, 24).data;
      for (let y = 0; y < 24; y += 1) {
        let sum = 0; let count = 0;
        for (let x = 0; x < rw; x += 1) if (data[(y * rw + x) * 4 + 3] > 128) { sum += x; count += 1; }
        if (count > 0) return { x: letter.sx - 3 + sum / count, y: letter.sy - 3 + y };
      }
      return { x: letter.sx + letter.w / 2, y: letter.sy };
    });
  })();

  const hub = (): { x: number; y: number } => onLetter(letters[1], ring.cx, ring.cy);
  const roofOf = (letter: Letter): { x: number; y: number } => onLetter(letter, letter.sx + letter.w / 2, letter.sy + letter.h * 0.3);

  return loopPage(stage, {
    loop: LOOP,
    rest: 7,
    enter() { lit.forEach((spring) => { spring.x = 0; spring.v = 0; }); hopInTurn(letters); },
    step(t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter, i) => {
        const on = t >= LIT[i][0] && t < LIT[i][1] ? 1 : 0;
        if (input.dt > 0) {
          if (on && t - input.dt < LIT[i][0]) letter.hop.v += 380;
          springTo(lit[i], on, 9, 1, input.dt);
        } else {
          lit[i].x = on; lit[i].v = 0;
        }
        restPose(letter, clock, 0.005);
      });
    },
    draw(t, clock) {
      /* printed sheet: the street at dusk */
      stage.backdrop(plate, 0.72);
      for (let i = 0; i < 9; i += 1) {
        const twinkle = 0.55 + 0.45 * Math.sin(clock * (1.2 + hash(i) * 1.5) + i * 2.3);
        base.fillStyle = rgba([250, 236, 255], 0.75 * twinkle);
        base.beginPath();
        base.arc((120 + hash(i + 3) * 1760) * k, (50 + hash(i + 17) * 250) * k, (3.5 + 2.5 * twinkle) * k, 0, Math.PI * 2);
        base.fill();
      }
      stage.tooth(0.06);

      /* floating sheet: Surya in the round window, the houses and their lights */
      const home = clamp(lit[1].x);
      const centre = hub();
      const r = ring.rx * letters[1].scale;
      word.save();
      word.translate(centre.x * k, centre.y * k);
      word.rotate(letters[1].angle);
      word.scale(1, ring.ry / ring.rx);
      word.fillStyle = rgba(PLUM);
      word.beginPath(); word.arc(0, 0, r * 1.04 * k, 0, Math.PI * 2); word.fill();
      const size = r * 2.08 * k;
      word.drawImage(mandala, -size / 2, -size / 2, size, size * (mandala.naturalHeight / mandala.naturalWidth));
      // the rim light, brighter once he is home
      const glow = word.createRadialGradient(0, 0, r * 0.5 * k, 0, 0, r * 1.05 * k);
      glow.addColorStop(0, rgba([255, 120, 150], 0));
      glow.addColorStop(1, rgba([255, 120, 150], 0.2 + 0.3 * home + 0.06 * Math.sin(clock * 1.8)));
      word.globalCompositeOperation = 'lighter';
      word.fillStyle = glow;
      word.beginPath(); word.arc(0, 0, r * 1.04 * k, 0, Math.PI * 2); word.fill();
      word.globalCompositeOperation = 'source-over';
      ([[-0.333, 0.42, [255, 246, 228]], [0, -0.504, [255, 206, 96]], [0.331, 0.423, [240, 96, 120]]] as const).forEach(([fx, fy, tone]) => {
        word.save();
        word.translate(fx * r * k, fy * r * k);
        drawBloom(word, r * 0.2 * k, home, tone as unknown as Rgb, [255, 246, 228], [90, 30, 60], 2.2 * k, false);
        word.restore();
      });
      word.restore();

      letters.forEach((letter, i) => {
        withLetter(word, letter, k, () => {
          windows[i].forEach(([hx, hy, hw, hh], n) => {
            word.fillStyle = rgba(PLUM, 0.86);
            word.fillRect(hx - 3, hy - 3, hw + 6, hh + 6);
            const on = clamp(lit[i].x * 1.6 - n * 0.1);
            if (on > 0) {
              word.fillStyle = rgba(WARM, on * (0.9 + 0.1 * Math.sin(clock * 3 + n * 1.7 + i)));
              word.fillRect(hx - 3, hy - 3, hw + 6, hh + 6);
            }
          });
        });
      });
      letters.forEach((letter) => drawLetter(word, side, letter, k, 7, 8));
      letters.forEach((letter) => drawLetter(word, sheet, letter, k));
      // warm light spilling out of the lit windows
      word.globalCompositeOperation = 'lighter';
      letters.forEach((letter, i) => {
        if (lit[i].x < 0.03) return;
        windows[i].forEach(([hx, hy, hw, hh], n) => {
          const on = clamp(lit[i].x * 1.6 - n * 0.1);
          if (on <= 0) return;
          const at = onLetter(letter, hx + hw / 2, hy + hh / 2);
          const reach = Math.max(hw, hh) * letter.scale * 1.5;
          const halo = word.createRadialGradient(at.x * k, at.y * k, 0, at.x * k, at.y * k, reach * k);
          halo.addColorStop(0, rgba(WARM, 0.3 * on));
          halo.addColorStop(1, rgba(WARM, 0));
          word.fillStyle = halo;
          word.fillRect((at.x - reach) * k, (at.y - reach) * k, reach * 2 * k, reach * 2 * k);
        });
      });
      word.globalCompositeOperation = 'source-atop';
      word.fillStyle = rgba([40, 14, 70], 0.16);
      word.fillRect(0, 0, width, height);
      word.globalCompositeOperation = 'source-over';

      /* in front: the signals, chimney smoke, and the maker walking home */
      letters.forEach((letter, i) => {
        const start = SIGNAL[i];
        if (start === null) return;
        const from = hub();
        const to = roofOf(letter);
        const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 250 };
        const at = (u: number): { x: number; y: number } => ({
          x: (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * mid.x + u * u * to.x,
          y: (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * mid.y + u * u * to.y,
        });
        // the line it travels, faint, and brighter once the house has answered
        fg.fillStyle = rgba([250, 232, 255], 0.2 + 0.4 * clamp(lit[i].x));
        for (let n = 1; n < 18; n += 1) {
          const p = at(n / 18);
          fg.beginPath(); fg.arc(p.x * k, p.y * k, 3.6 * k, 0, Math.PI * 2); fg.fill();
        }
        const u = (t - start) / SIGNAL_TIME;
        if (u > 0 && u < 1.15) {
          for (let n = 0; n < 7; n += 1) {
            const v = clamp(u - n * 0.04);
            if (v <= 0 || v >= 1) continue;
            const p = at(v * v * (3 - 2 * v));
            fg.fillStyle = rgba(WARM, 1 - n / 7);
            fg.beginPath(); fg.arc(p.x * k, p.y * k, (13 - n * 1.3) * k, 0, Math.PI * 2); fg.fill();
          }
        }
      });
      letters.forEach((letter, i) => {
        const amount = clamp(lit[i].x);
        if (amount < 0.05) return;
        const top = onLetter(letter, tops[i].x, tops[i].y);
        for (let n = 0; n < 4; n += 1) {
          const u = (clock * 0.32 + n / 4 + i * 0.13) % 1;
          fg.fillStyle = rgba([226, 208, 240], amount * 0.5 * Math.sin(Math.PI * u));
          fg.beginPath();
          fg.arc((top.x + Math.sin(u * 5 + n) * 16 + u * 26) * k, (top.y - 14 - u * 130) * k, (11 + u * 22) * k, 0, Math.PI * 2);
          fg.fill();
        }
      });
      const walking = t < ARRIVES || t >= LEAVES;
      const x = t < ARRIVES ? -140 + 232 * t : t < LEAVES ? 997 : 997 + 300 * (t - LEAVES);
      if (walking) {
        const stride = Math.floor(clock * 3.8) % 2;
        const bob = Math.abs(Math.sin(clock * 3.8 * Math.PI)) * 7;
        drawSprite(fg, peopleSheet, spriteNamed(people, stride ? 'walk-b' : 'walk-a'), k, { x, y: 1166 - bob, scale: 0.66 });
      } else {
        const settle = smoothstep(ARRIVES, ARRIVES + 0.3, t);
        drawSprite(fg, peopleSheet, spriteNamed(people, 'wave'), k, { x, y: 1166, scale: 0.66, angle: Math.sin(clock * 6) * 0.03 * settle });
      }
    },
  });
}

export const suryaHome: LiveScene = { id: 'surya-home', sources: Object.values(SRC), create: createHome };
