/**
 * The last page of the Jarvis book: where it lives.
 *
 * Where the words come from.
 * - "On my wall, lights on.": the caption of his photograph parts/wall.webp, the box on his wall with its
 *   four white lights on between two orange light bars.
 * - The sentence is his own, read from data/projects/jarvis.json (reflection.text), never retyped.
 * - "Code and 3D files: github.com/adiind/diy-jarvis": his firmware repository, named in the book's notes.
 * - "Top 10 · IoT & Edge AI Project Challenge 2024": as on the cover (his timeline entry).
 *
 * The 2-second rule: the print settles in (slides up a little, its shadow grows) from 0.1 to 1.1 s and the
 * text fades in line by line from 0.8 to 1.9 s. Then only the warm light round the photograph breathes, and
 * it is driven by the clock alone, so the 2.0 s and 4.0 s frames differ only by that.
 */

import jarvisData from '../../../../data/projects/jarvis.json';
import { rgba, smoothstep, type Rgb } from '../motion';
import { createStage, loopPage } from '../stage';
import { SANS, SERIF, tracking, wrap } from '../suryaStory';
import type { LiveScene } from '../types';

const WALL = '/images/flipbook/jarvis/parts/wall.webp';
const GROUND: Rgb = [20, 13, 8];
const AMBER: Rgb = [224, 132, 20];

const COPY = {
  kicker: 'WHERE IT LIVES',
  sentence: (jarvisData as { reflection: { text: string } }).reflection.text,
  caption: 'On my wall, lights on.',
  code: 'Code and 3D files: github.com/adiind/diy-jarvis',
  award: 'Top 10 · IoT & Edge AI Project Challenge 2024',
};

/** Every word this page prints, for the book's tests. */
export const END_TEXT: string[] = [COPY.kicker, COPY.sentence, COPY.caption, COPY.code, COPY.award];

/** The print, in page units (one pixel of the photograph is 1.64 units: under 1.6 times at a 1600 wide page). */
const PRINT = { x: 110, y: 170, w: 1230, h: 820 };
const COLUMN = { x: 1410, w: 520 };

export const jarvisEnd: LiveScene = {
  id: 'jarvis-end',
  sources: [WALL],
  create(images, width, height) {
    const stage = createStage(width, height);
    const { k, base } = stage;
    const wall = images.get(WALL);
    return loopPage(stage, {
      loop: 2,
      rest: 2,
      once: true,
      step() { /* nothing to advance */ },
      draw(t, clock) {
        base.fillStyle = rgba(GROUND);
        base.fillRect(0, 0, width, height);
        // a warm light round the photograph, breathing faintly once the page has settled
        const settle = smoothstep(0.1, 1.1, t);
        const breath = smoothstep(2, 3, clock) * 0.03 * Math.sin((clock - 2) * 1.3);
        const cx = (PRINT.x + PRINT.w / 2) * k;
        const cy = (PRINT.y + PRINT.h / 2) * k;
        const glow = base.createRadialGradient(cx, cy, 200 * k, cx, cy, 980 * k);
        glow.addColorStop(0, rgba(AMBER, 0.2 + breath));
        glow.addColorStop(1, rgba(AMBER, 0));
        base.fillStyle = glow;
        base.fillRect(0, 0, width, height);
        stage.tooth(0.07);

        // the print: slides up a little, its shadow grows
        const rise = (1 - settle) * 26;
        const x = PRINT.x * k;
        const y = (PRINT.y + rise) * k;
        base.save();
        base.shadowColor = 'rgba(0, 0, 0, 0.62)';
        base.shadowBlur = (8 + 38 * settle) * k;
        base.shadowOffsetY = (3 + 15 * settle) * k;
        base.fillStyle = '#f3e6d0';
        base.fillRect(x - 14 * k, y - 14 * k, (PRINT.w + 28) * k, (PRINT.h + 28) * k);
        base.restore();
        if (wall) base.drawImage(wall, x, y, PRINT.w * k, PRINT.h * k);

        base.textAlign = 'left';
        base.textBaseline = 'alphabetic';
        const line = (text: string, px: number, py: number, start: number): void => {
          const a = smoothstep(start, start + 0.45, t);
          if (a <= 0.01) return;
          base.globalAlpha = a;
          base.fillText(text, px * k, (py + (1 - a) * 10) * k);
          base.globalAlpha = 1;
        };
        // caption under the print
        base.font = `450 ${34 * k}px ${SANS}`;
        tracking(base, 0);
        base.fillStyle = rgba([205, 181, 149]);
        line(COPY.caption, PRINT.x, PRINT.y + PRINT.h + 76, 0.8);

        // the right column
        base.font = `650 ${26 * k}px ${SANS}`;
        tracking(base, 26 * k * 0.16);
        base.fillStyle = rgba([240, 162, 72]);
        line(COPY.kicker, COLUMN.x, 330, 0.8);

        base.font = `600 ${50 * k}px ${SERIF}`;
        tracking(base, 0);
        base.fillStyle = '#fff1db';
        const sentence = wrap(base, COPY.sentence, COLUMN.w * k);
        const sentenceLines = sentence.length;
        sentence.forEach((text, i) => line(text, COLUMN.x, 408 + i * 64, 1.0 + i * 0.09));

        base.font = `450 ${26 * k}px ${SANS}`;
        const small = (text: string, top: number, start: number, color: string): number => {
          base.fillStyle = color;
          const lines = wrap(base, text, COLUMN.w * k);
          lines.forEach((part, i) => line(part, COLUMN.x, top + i * 38, start));
          return top + lines.length * 38;
        };
        const next = small(COPY.code, 408 + sentenceLines * 64 + 30, 1.45, rgba([255, 232, 204], 0.85));
        small(COPY.award, next + 14, 1.55, rgba([240, 170, 92], 0.95));
      },
    });
  },
};
