/**
 * The Bambu book's three story pages (the studio, the workshops, the guide).
 *
 * Layout and type are the other books' story pages: a drawing area on the left (his real
 * photographs, one of them labelled), a column on the right (kicker, plain title, short
 * paragraph, more prints) and a short note at the foot. Everything lands within two seconds.
 *
 * Where the words come from (nothing here is new):
 *  - Body sentences, workshop and guide wording: the book's own page text in data/flipbooks.ts
 *    and lib/flipbook/live/bambu.ts, which come from Adi's 7 Nov 2026 workshop email.
 *  - Captions and "what a workshop covers": review/bambu-corner-v3/corner.js (his page's captions).
 *    Their [CONFIRM] parts (which workshop, how many printers, whose model) are left out.
 *  - "36 pages": HISTORY.md, 2026-11-16 (he opened the PDF and counted).
 *  - Colours: sampled from the filament photo (corner.js comment).
 *  - Photo names and what each shows: review/bambu-2026-10-15/INVENTORY.md and CONTACT-SHEET.jpg.
 */

import type { BookImages } from '../pageArt';
import { clamp, rgba, smoothstep, type Rgb } from './motion';
import { createStage, loopPage } from './stage';
import type { LiveScene } from './types';
import { SANS, SERIF, tracking, wrap } from './suryaStory';

const DIR = '/images/flipbook/bambu/';
const P = (name: string) => DIR + name;

interface Tone { paper: Rgb; ink: Rgb; mid: Rgb }
/** A label with a line to the thing it names. Tag and target are fractions of the picture. */
interface Tag { text: string; tag: readonly [number, number]; at: readonly [number, number] }
interface Print { src: string; caption: string; x: number; y: number; w: number; tilt?: number; delay: number }
interface Chip { name: string; hex: string }
interface Story {
  id: string;
  tone: Tone;
  kicker: string;
  title: string;
  body: string;
  note: { label: string; head: string; text: string };
  main: { src: string; x: number; y: number; w: number; caption: string; tags: Tag[] };
  /** Prints in the right column. */
  prints: Print[];
  /** Nine colours under the main picture (studio page). */
  chips?: { label: string; list: Chip[] };
  /** Numbered cards in the right column (guide page). */
  cards?: { label: string; list: string[] };
}

const AREA = { x: 60, y: 56, w: 1040, h: 860 };
const NOTE_TOP = 944;
const COL = { x: 1170, w: 760 };
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const seg = (t: number, start: number, len: number) => clamp((t - start) / len);

// colours sampled from the filament-wall photo, with the names on his page
const COLOURS: Chip[] = [
  ['White', '#b9b3af'], ['Magenta', '#7d2357'], ['Red', '#791a0f'], ['Amber', '#a4570a'], ['Orange', '#993804'],
  ['Yellow', '#bb9c1b'], ['Green', '#2b673f'], ['Forest', '#275145'], ['Sky', '#4a74a6'],
].map(([name, hex]) => ({ name, hex }));

const STORIES: Story[] = [
  {
    id: 'studio',
    tone: { paper: [247, 244, 232], ink: [28, 58, 42], mid: [52, 115, 83] },
    kicker: '01 · The studio',
    title: 'The print lab',
    body: 'I help run the print lab at Northwestern, with printers, filament and tools ready for making.',
    note: { label: 'On the wall', head: 'A nozzle light over every machine.', text: 'Filament is sorted by colour on the shelves below.' },
    main: {
      src: P('01-printer-wall.jpg'), x: 90, y: 80, w: 960, caption: 'The printer wall.',
      // (no labels: what is in the picture is plain to see. Adi, 2026-11-18)
      tags: [],
    },
    chips: { label: 'Colours sampled from the filament photo', list: COLOURS },
    prints: [
      { src: P('05-nozzle-light.jpg'), caption: 'One of the nozzle lights, up close.', x: 1190, y: 640, w: 227, tilt: -0.02, delay: 0.35 },
      { src: P('06-filament-wall.jpg'), caption: 'Filament, sorted by colour.', x: 1488, y: 700, w: 432, tilt: 0.02, delay: 0.55 },
    ],
  },
  {
    id: 'workshops',
    tone: { paper: [250, 244, 236], ink: [74, 36, 18], mid: [173, 88, 51] },
    kicker: '02 · Teaching',
    title: 'The workshops',
    body: 'I run workshops with Corner Makery, helping people prepare a model in Bambu Studio and get started with 3D printing.',
    note: { label: 'In the room', head: 'We slice a part and print it together.', text: 'Preparing a model and getting started with printing.' },
    main: {
      src: P('13-adi-presenting.jpg'), x: 80, y: 80, w: 980, caption: 'Walking a group through Bambu Studio.',
      // (no labels: what is in the picture is plain to see. Adi, 2026-11-18)
      tags: [],
    },
    prints: [
      { src: P('11-corner-makery-room.jpg'), caption: 'The Corner Makery room.', x: 1188, y: 690, w: 350, tilt: -0.015, delay: 0.35 },
      { src: P('09-corner-makery-printers.jpg'), caption: 'Printers at Corner Makery.', x: 1578, y: 690, w: 342, tilt: 0.015, delay: 0.55 },
    ],
  },
  {
    id: 'resources',
    tone: { paper: [240, 245, 249], ink: [22, 48, 68], mid: [59, 105, 138] },
    kicker: '03 · To take home',
    title: 'The guide',
    body: 'After the 3D Print Anything workshops, I shared a condensed guide to the workshop, with my recommendations for an AI-assisted workflow.',
    note: { label: 'The guide', head: 'The 3D Print Guide is 36 pages.', text: 'Open it to take the workshop with you.' },
    main: {
      src: P('17-supports-preview.jpg'), x: 100, y: 80, w: 940,
      caption: 'Supports in the slicer. The green is what holds up the overhang.',
      // (no labels: what is in the picture is plain to see. Adi, 2026-11-18)
      tags: [],
    },
    prints: [],
    cards: { label: 'What the workshop covers', list: ['Which way it sits.', 'Where it needs support.', 'How fine the layers go.'] },
  },
];

const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

/** A white-bordered print with its caption on the white foot. Returns nothing; drawn centred on its own middle. */
function printCard(
  c: CanvasRenderingContext2D, k: number, img: HTMLImageElement, x: number, y: number, w: number, caption: string,
  opts: { tilt?: number; alpha?: number; dy?: number; capSize?: number; foot?: number; ink: Rgb },
): number {
  const h = w * img.naturalHeight / img.naturalWidth;
  const edge = 12;
  const size = opts.capSize ?? 28;
  c.save();
  c.font = `500 ${size * k}px ${SANS}`;
  const lines = wrap(c, caption, w * k);
  const foot = opts.foot ?? (18 + lines.length * (size + 8));
  const cardW = w + edge * 2, cardH = h + edge + foot;
  c.globalAlpha = opts.alpha ?? 1;
  c.translate((x - edge + cardW / 2) * k, (y - edge + cardH / 2 + (opts.dy ?? 0)) * k);
  c.rotate(opts.tilt ?? 0);
  c.translate(-cardW / 2 * k, -cardH / 2 * k);
  c.shadowColor = 'rgba(30, 24, 16, 0.28)'; c.shadowBlur = 22 * k; c.shadowOffsetY = 8 * k;
  c.fillStyle = '#ffffff'; roundRect(c, 0, 0, cardW * k, cardH * k, 10 * k); c.fill();
  c.shadowColor = 'transparent';
  c.drawImage(img, edge * k, edge * k, w * k, h * k);
  c.fillStyle = rgba(opts.ink, 0.82); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; tracking(c, 0);
  lines.forEach((line, i) => c.fillText(line, edge * k, (edge + h + 12 + size + i * (size + 8)) * k));
  c.restore();
  return cardH;
}

/** Draws a label tag with a line to what it names; p runs 0 to 1. */
function drawTag(c: CanvasRenderingContext2D, k: number, tone: Tone, rect: { x: number; y: number; w: number; h: number }, tag: Tag, p: number, clock: number): void {
  if (p <= 0) return;
  const size = 28;
  c.save();
  c.font = `650 ${size * k}px ${SANS}`; tracking(c, 0);
  const tw = c.measureText(tag.text).width / k + 32, th = size + 22;
  const tx = rect.x + tag.tag[0] * rect.w, ty = rect.y + tag.tag[1] * rect.h;
  const ax = rect.x + tag.at[0] * rect.w, ay = rect.y + tag.at[1] * rect.h;
  // line from the tag's nearest edge point to the target
  const sx = clamp(ax, tx + 14, tx + tw - 14), sy = ay < ty + th / 2 ? ty : ty + th;
  const e = easeOut(seg(p, 0, 0.7));
  const ex = sx + (ax - sx) * e, ey = sy + (ay - sy) * e;
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 7 * k;
  c.beginPath(); c.moveTo(sx * k, sy * k); c.lineTo(ex * k, ey * k); c.stroke();
  c.strokeStyle = rgba(tone.ink); c.lineWidth = 3 * k;
  c.beginPath(); c.moveTo(sx * k, sy * k); c.lineTo(ex * k, ey * k); c.stroke();
  const dot = smoothstep(0.55, 1, p);
  if (dot > 0) {
    const pulse = 1 + 0.12 * Math.sin(clock * 1.6);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ax * k, ay * k, 12 * k * dot * pulse, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(tone.mid); c.beginPath(); c.arc(ax * k, ay * k, 8 * k * dot * pulse, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = smoothstep(0, 0.4, p);
  c.fillStyle = rgba(tone.ink); roundRect(c, tx * k, ty * k, tw * k, th * k, 8 * k); c.fill();
  c.fillStyle = '#ffffff'; c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillText(tag.text, (tx + 16) * k, (ty + th / 2 + 1) * k);
  c.restore();
}

function storyScene(s: Story): LiveScene {
  const sources = [...new Set([s.main.src, ...s.prints.map((p) => p.src)])];
  return {
    id: `bambu-${s.id}`,
    sources,
    create(images: BookImages, width: number, height: number) {
      const stage = createStage(width, height);
      const { k, base, fg } = stage;
      return loopPage(stage, {
        loop: 2, rest: 2, once: true,
        step() { /* pure functions of time */ },
        draw(t, clock) {
          const { tone } = s;
          base.fillStyle = rgba(tone.paper); base.fillRect(0, 0, width, height);
          base.fillStyle = rgba(tone.ink, 0.13);
          for (let gx = AREA.x + 40; gx < AREA.x + AREA.w; gx += 80) for (let gy = AREA.y + 40; gy < AREA.y + AREA.h; gy += 80) {
            base.beginPath(); base.arc(gx * k, gy * k, 2.4 * k, 0, Math.PI * 2); base.fill();
          }

          // ---- the main picture, with its labels
          const main = images.get(s.main.src);
          if (main) {
            const p = easeOut(seg(t, 0.05, 0.75));
            const h = s.main.w * main.naturalHeight / main.naturalWidth;
            printCard(base, k, main, s.main.x, s.main.y, s.main.w, s.main.caption, { alpha: clamp(p * 2.5), dy: (1 - p) * 40, capSize: 30, ink: tone.ink });
            const rect = { x: s.main.x, y: s.main.y, w: s.main.w, h };
            s.main.tags.forEach((tag, i) => drawTag(base, k, tone, rect, tag, seg(t, 0.85 + i * 0.22, 0.6), clock));
          }

          // ---- colours under the main picture
          if (s.chips) {
            const y0 = 812;
            base.textAlign = 'left'; base.textBaseline = 'alphabetic';
            base.fillStyle = rgba(tone.mid, smoothstep(0.9, 1.3, t)); base.font = `680 ${26 * k}px ${SANS}`; tracking(base, 26 * k * 0.1);
            base.fillText(s.chips.label.toUpperCase(), 94 * k, (y0 + 20) * k); tracking(base, 0);
            const n = s.chips.list.length, gap = 10, cw = (950 - gap * (n - 1)) / n;
            s.chips.list.forEach((chip, i) => {
              const p = easeOut(seg(t, 1.0 + i * 0.07, 0.4));
              if (p <= 0) return;
              base.globalAlpha = clamp(p * 2);
              base.fillStyle = chip.hex;
              roundRect(base, (92 + i * (cw + gap)) * k, (y0 + 38 + (1 - p) * 16) * k, cw * k, 56 * k, 8 * k); base.fill();
              base.globalAlpha = 1;
            });
          }

          // ---- the note at the foot
          base.fillStyle = rgba(tone.ink, 0.3); base.fillRect((AREA.x + 8) * k, NOTE_TOP * k, (AREA.w - 16) * k, 2.5 * k);
          base.textAlign = 'left'; base.textBaseline = 'alphabetic';
          base.fillStyle = rgba(tone.mid); base.font = `680 ${27 * k}px ${SANS}`; tracking(base, 27 * k * 0.16);
          base.fillText(s.note.label.toUpperCase(), (AREA.x + 8) * k, (NOTE_TOP + 50) * k);
          tracking(base, -45 * k * 0.012); base.fillStyle = rgba(tone.ink); base.font = `640 ${45 * k}px ${SANS}`;
          base.fillText(s.note.head, (AREA.x + 8) * k, (NOTE_TOP + 106) * k);
          tracking(base, 0); base.fillStyle = rgba(tone.ink, 0.86); base.font = `450 ${37 * k}px ${SANS}`;
          base.fillText(s.note.text, (AREA.x + 8) * k, (NOTE_TOP + 160) * k);

          // ---- the column: kicker, title, paragraph
          base.fillStyle = rgba(tone.mid); base.font = `650 ${30 * k}px ${SANS}`; tracking(base, 30 * k * 0.16);
          base.fillText(s.kicker.toUpperCase(), COL.x * k, 150 * k);
          base.fillStyle = rgba(tone.ink); base.font = `600 ${92 * k}px ${SERIF}`; tracking(base, -92 * k * 0.012);
          const titleLines = wrap(base, s.title, COL.w * k);
          let y = 264;
          titleLines.forEach((line) => { base.fillText(line, COL.x * k, y * k); y += 98; });
          y += 4; tracking(base, 0);
          base.font = `450 ${43 * k}px ${SANS}`; base.fillStyle = rgba(tone.ink, 0.86);
          wrap(base, s.body, COL.w * k).forEach((line) => { base.fillText(line, COL.x * k, y * k); y += 60; });
          stage.tooth(0.06);

          // ---- the column's prints
          s.prints.forEach((pr) => {
            const img = images.get(pr.src);
            if (!img) return;
            const p = easeOut(seg(t, pr.delay, 0.7));
            if (p <= 0) return;
            printCard(fg, k, img, pr.x, pr.y, pr.w, pr.caption, { tilt: pr.tilt, alpha: clamp(p * 2.5), dy: (1 - p) * 50, ink: [70, 58, 52] });
          });

          // ---- the column's cards
          if (s.cards) {
            const top = Math.max(y + 22, 640);
            base.textAlign = 'left'; base.textBaseline = 'alphabetic';
            base.fillStyle = rgba(tone.mid, smoothstep(0.4, 0.8, t)); base.font = `680 ${27 * k}px ${SANS}`; tracking(base, 27 * k * 0.16);
            base.fillText(s.cards.label.toUpperCase(), COL.x * k, (top + 20) * k); tracking(base, 0);
            s.cards.list.forEach((text, i) => {
              const p = easeOut(seg(t, 0.5 + i * 0.2, 0.6));
              if (p <= 0) return;
              const cy = top + 46 + i * 108 + (1 - p) * 40;
              fg.save(); fg.globalAlpha = clamp(p * 2.5);
              fg.shadowColor = 'rgba(30, 40, 60, 0.22)'; fg.shadowBlur = 18 * k; fg.shadowOffsetY = 6 * k;
              fg.fillStyle = '#ffffff'; roundRect(fg, COL.x * k, cy * k, COL.w * k, 90 * k, 12 * k); fg.fill();
              fg.shadowColor = 'transparent';
              fg.fillStyle = rgba(tone.mid); fg.beginPath(); fg.arc((COL.x + 48) * k, (cy + 45) * k, 26 * k, 0, Math.PI * 2); fg.fill();
              fg.fillStyle = '#ffffff'; fg.font = `700 ${30 * k}px ${SANS}`; fg.textAlign = 'center'; fg.textBaseline = 'middle';
              fg.fillText(String(i + 1), (COL.x + 48) * k, (cy + 47) * k);
              fg.fillStyle = rgba(tone.ink); fg.font = `560 ${40 * k}px ${SANS}`; fg.textAlign = 'left';
              fg.fillText(text, (COL.x + 100) * k, (cy + 47) * k);
              fg.restore();
            });
          }
        },
      });
    },
  };
}

export const BAMBU_STORIES: LiveScene[] = STORIES.map(storyScene);
