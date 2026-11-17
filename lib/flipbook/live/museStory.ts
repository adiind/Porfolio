/**
 * The Muse book's story pages: the page that faces each picture page, plus the cover and the last page.
 *
 * Layout, type and prints are Surya's (templates/story-pages.ts, KEEP blocks). The drawing on
 * each page is a moving sequence of Adi's real files: frames rendered from the real meshes,
 * Fusion screenshots, CAD renders, simulator screens and his two board photos. Nothing generated
 * stands in for the real thing here; the one AI concept image used is labelled as one.
 *
 * Where the words come from. Why, the orchestrating role, the AI-made mascot and pouch, the
 * Oct 25 pouch print, the button he mounted at the USB-C opening: Adi in chat, 2026-11-14.
 * Board numbers: ~/muse/BOARD.md. Mascot 10 cm, scaled 2.4 times, broken split (56 and 18
 * edges), push-in pins: print-v1/REPORT.md, print-v2. The five pouches and his three changes:
 * print-v4-belly-pouch HISTORY/REPORT, belly-pouch-v1/v2 README. GPIO14 talk and wake, Oct 22:
 * ~/muse/HISTORY.md. The question loop: the SDK repo's docs/e2e-loop. PR not opened: no fork.
 */

import type { BookImages } from '../pageArt';
import { clamp, rgba, smoothstep, type Rgb } from './motion';
import { createStage, loopPage, type Stage } from './stage';
import type { LivePage, LiveScene } from './types';

/* ===== the real files ===== */
const IMG = '/images/flipbook/muse/parts';
const R = (name: string) => `${IMG}/${name}.webp`;

/* ===== KEEP (Surya): fonts, and the shape of a story page's words ===== */
const SERIF = '"FB Serif", Georgia, serif';
const SANS = '"FB Geist", "Geist", system-ui, sans-serif';

export interface StoryTone { paper: Rgb; ink: Rgb; mid: Rgb }
interface Shot { src: string; focus?: readonly [number, number]; zoom?: number }
interface Copy {
  kicker: string;
  title: string[];
  body?: string;
  note?: { label: string; head?: string; text: string };
  photo?: Shot & { caption: string; whole?: boolean };
}
/** One frame of the moving drawing: a real picture and its label. */
interface Slide { src: string; label: string; fit?: 'contain' | 'cover'; pixel?: boolean; ground?: string }

const wrap = (ctx: CanvasRenderingContext2D, text: string, width: number): string[] => {
  const lines: string[] = [];
  let line = '';
  text.split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
};
const tracking = (ctx: CanvasRenderingContext2D, px: number): void => {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px.toFixed(2)}px`;
};
const frame = (
  ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius: number,
  focus: readonly [number, number] = [0.5, 0.5], zoom = 1,
): void => {
  const wide = img.naturalWidth; const tall = img.naturalHeight;
  const scale = Math.max(w / wide, h / tall) * zoom;
  const sw = w / scale; const sh = h / scale;
  const sx = clamp(focus[0] * wide - sw / 2, 0, wide - sw);
  const sy = clamp(focus[1] * tall - sh / 2, 0, tall - sh);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
};
const fitIn = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, pixel = false): void => {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale; const dh = img.naturalHeight * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = !pixel;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
};

const AREA = { x: 60, y: 56, w: 1040, h: 860 };
const NOTE_TOP = 944;

/** Where each print lands (centre in the drawing area, tilt, biggest side), by how many pictures the page has. */
const DEAL: Record<number, ReadonlyArray<readonly [number, number, number, number]>> = {
  2: [[285, 390, -0.05, 620], [775, 440, 0.04, 620]],
  3: [[250, 205, -0.04, 380], [770, 225, 0.05, 380], [510, 665, -0.02, 380]],
  4: [[250, 215, -0.045, 360], [770, 225, 0.04, 360], [290, 630, 0.035, 360], [770, 640, -0.03, 360]],
  5: [[178, 205, -0.05, 335], [528, 215, 0.03, 335], [878, 205, 0.05, 335], [340, 610, -0.035, 335], [700, 620, 0.03, 335]],
};
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeBack = (x: number) => { const c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };

/** The deal: within two seconds every real picture lands as an overlapping print, the first at the back and the last on top, then they hold and only breathe. */
const slideshow = (slides: Slide[]) => (stage: Stage, images: BookImages, tone: StoryTone, ctx: CanvasRenderingContext2D, t: number, clock: number): void => {
  const { k } = stage;
  const n = slides.length;
  const slots = DEAL[n] ?? DEAL[5];
  const gap = n > 1 ? 1.15 / (n - 1) : 0;
  const border = 14;
  slides.forEach((slide, i) => {
    const img = images.get(slide.src);
    if (!img) return;
    const [sx, sy, tilt, box] = slots[i];
    const p = clamp((t - (0.1 + i * gap)) / 0.6, 0, 1);
    if (p <= 0) return;
    const shape = img.naturalWidth / img.naturalHeight;
    const w = shape >= 1 ? box : box * shape;
    const h = shape >= 1 ? box / shape : box;
    const land = easeBack(p);
    const fly = 1 - land;
    const cx = AREA.x + sx - fly * 150;
    const cy = AREA.y + sy - fly * 190;
    const rot = tilt + fly * 0.22 + 0.004 * Math.sin(clock * 0.6 + i * 1.7);
    const grow = (1 + fly * 0.12) * (1 + 0.005 * Math.sin(clock * 0.5 + i));
    ctx.save();
    ctx.globalAlpha = clamp(easeOut(p) * 3, 0, 1);
    ctx.translate(cx * k, cy * k);
    ctx.rotate(rot);
    ctx.scale(grow, grow);
    ctx.shadowColor = 'rgba(30, 18, 10, 0.3)'; ctx.shadowBlur = 24 * k; ctx.shadowOffsetY = 9 * k;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect((-w / 2 - border) * k, (-h / 2 - border) * k, (w + border * 2) * k, (h + border * 2) * k, 10 * k); ctx.fill();
    ctx.shadowColor = 'transparent';
    if (slide.ground) { ctx.fillStyle = slide.ground; ctx.fillRect((-w / 2) * k, (-h / 2) * k, w * k, h * k); }
    ctx.save();
    ctx.imageSmoothingEnabled = !slide.pixel;
    ctx.drawImage(img, (-w / 2) * k, (-h / 2) * k, w * k, h * k);
    ctx.restore();
    // the label, like a typed tag stuck on the print
    const lp = smoothstep(0.55, 1, p);
    if (lp > 0.01) {
      ctx.globalAlpha = lp;
      const size = box >= 500 ? 28 : box >= 400 ? 24 : 21;
      ctx.font = `650 ${size * k}px ${SANS}`;
      tracking(ctx, size * k * 0.05);
      const tw = ctx.measureText(slide.label).width + 28 * k;
      const th = (size + 22) * k;
      const lx = (-w / 2 - border + 6) * k;
      const ly = (h / 2 - 2) * k;
      ctx.fillStyle = rgba(tone.ink);
      ctx.beginPath(); ctx.roundRect(lx, ly, tw, th, 6 * k); ctx.fill();
      ctx.fillStyle = rgba(tone.paper);
      ctx.textBaseline = 'middle';
      ctx.fillText(slide.label, lx + 14 * k, ly + th / 2 + k);
    }
    ctx.restore();
  });
};
type Drawing = ReturnType<typeof slideshow>;

const print = (ctx: CanvasRenderingContext2D, k: number, img: HTMLImageElement, shot: Shot, x: number, y: number, w: number, h: number, foot: number): void => {
  const edge = 12;
  ctx.save();
  ctx.translate(x * k, y * k);
  ctx.shadowColor = 'rgba(30, 18, 10, 0.3)'; ctx.shadowBlur = 22 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(-edge * k, -edge * k, (w + edge * 2) * k, (h + edge + foot) * k, 10 * k); ctx.fill();
  ctx.shadowColor = 'transparent';
  frame(ctx, img, 0, 0, w * k, h * k, 5 * k, shot.focus, shot.zoom);
  ctx.restore();
};

function storyScene(id: string, tone: StoryTone, copy: Copy, drawing: Drawing, slides: Slide[]): LiveScene {
  const sources = [...new Set([...slides.map((s) => s.src), ...(copy.photo ? [copy.photo.src] : [])])];
  return {
    id,
    sources,
    create(images: BookImages, width: number, height: number): LivePage {
      const stage = createStage(width, height);
      const { k, base, fg } = stage;
      const photo = copy.photo ? images.get(copy.photo.src) : undefined;
      const column = { x: 1170, w: 760 };
      return loopPage(stage, {
        loop: 2,
        once: true,
        rest: 2,
        step() { /* pure functions of time */ },
        draw(t, clock) {
          base.fillStyle = rgba(tone.paper);
          base.fillRect(0, 0, width, height);
          base.fillStyle = rgba(tone.ink, 0.13);
          for (let gx = AREA.x + 40; gx < AREA.x + AREA.w; gx += 80) {
            for (let gy = AREA.y + 40; gy < AREA.y + AREA.h; gy += 80) { base.beginPath(); base.arc(gx * k, gy * k, 2.4 * k, 0, Math.PI * 2); base.fill(); }
          }
          base.save(); drawing(stage, images, tone, base, t, clock); base.restore();
          base.setTransform(1, 0, 0, 1, 0, 0); base.globalAlpha = 1;
          if (copy.note) {
            const nx = AREA.x + 8; const nw = AREA.w - 16;
            base.fillStyle = rgba(tone.ink, 0.3);
            base.fillRect(nx * k, NOTE_TOP * k, nw * k, 2.5 * k);
            base.textAlign = 'left'; base.textBaseline = 'alphabetic';
            base.fillStyle = rgba(tone.mid);
            base.font = `680 ${27 * k}px ${SANS}`; tracking(base, 27 * k * 0.16);
            base.fillText(copy.note.label.toUpperCase(), nx * k, (NOTE_TOP + 50) * k);
            let ny = NOTE_TOP + 106; tracking(base, 0);
            if (copy.note.head) {
              base.fillStyle = rgba(tone.ink); base.font = `640 ${45 * k}px ${SANS}`; tracking(base, -45 * k * 0.012);
              base.fillText(copy.note.head, nx * k, ny * k); ny += 54; tracking(base, 0);
            }
            base.fillStyle = rgba(tone.ink, 0.86); base.font = `450 ${37 * k}px ${SANS}`;
            wrap(base, copy.note.text, nw * k).slice(0, 2).forEach((line) => { base.fillText(line, nx * k, ny * k); ny += 49; });
          }
          base.textAlign = 'left'; base.textBaseline = 'alphabetic';
          base.fillStyle = rgba(tone.mid); base.font = `650 ${30 * k}px ${SANS}`; tracking(base, 30 * k * 0.16);
          base.fillText(copy.kicker.toUpperCase(), column.x * k, 150 * k);
          base.fillStyle = rgba(tone.ink); base.font = `600 ${92 * k}px ${SERIF}`; tracking(base, -92 * k * 0.012);
          let y = 264;
          copy.title.forEach((line) => { base.fillText(line, column.x * k, y * k); y += 98; });
          y += 4; tracking(base, 0);
          if (copy.body) {
            base.font = `450 ${43 * k}px ${SANS}`; base.fillStyle = rgba(tone.ink, 0.86);
            wrap(base, copy.body, column.w * k).forEach((line) => { base.fillText(line, column.x * k, y * k); y += 60; });
          }
          stage.tooth(0.06);
          if (photo && copy.photo) {
            const foot = 62;
            const top = Math.max(y + 10, 640);
            const room = 1078 - top;
            if (room > 160) {
              const shape = photo.naturalHeight / photo.naturalWidth;
              const h = copy.photo.whole ? Math.min(room, column.w * shape) : room;
              const w = copy.photo.whole ? h / shape : column.w;
              print(fg, k, photo, copy.photo, column.x, top, w, h, foot);
              fg.fillStyle = rgba([70, 58, 52]); fg.font = `500 ${28 * k}px ${SANS}`; tracking(fg, 0);
              fg.textAlign = 'left'; fg.textBaseline = 'middle';
              fg.fillText(copy.photo.caption, (column.x + 6) * k, (top + h + foot / 2 + 2) * k);
            }
          }
        },
      });
    },
  };
}

const TONES: Record<string, StoryTone> = {
  plum: { paper: [246, 236, 253], ink: [58, 26, 85], mid: [142, 85, 196] },
  teal: { paper: [232, 248, 244], ink: [12, 66, 58], mid: [24, 140, 120] },
  yellow: { paper: [255, 246, 222], ink: [92, 60, 6], mid: [214, 150, 20] },
  blue: { paper: [234, 244, 255], ink: [13, 42, 110], mid: [47, 125, 240] },
  caramel: { paper: [252, 240, 226], ink: [84, 42, 14], mid: [190, 110, 50] },
  green: { paper: [238, 250, 236], ink: [20, 73, 42], mid: [47, 143, 78] },
  rose: { paper: [255, 238, 240], ink: [106, 18, 48], mid: [216, 55, 94] },
};

const page = (id: string, tone: StoryTone, copy: Copy, slides: Slide[]) =>
  storyScene(id, tone, copy, slideshow(slides), slides);

export const MUSE_STORIES: LiveScene[] = [
  page('muse-story-why', TONES.plum, {
    kicker: '01 · Why',
    title: ['Why I built it'],
    body: 'I believe AI needs a physical presence. I wanted to use it away from my phone. AI can get things done, and my question was how I get things done with it.',
    note: { label: 'One rule', head: 'Muse stays on its own screen.', text: 'The case never draws eyes over Muse. The whole 2.8-inch screen stays visible.' },
    photo: { src: R('photo-board-boot'), caption: 'The board I bought, Oct 17.', focus: [0.5, 0.45] },
  }, [
    { src: R('photo-board-back'), label: 'ES3C28P board, back', fit: 'cover' },
    { src: R('sdk-screen'), label: 'Muse on its 240 × 320 screen', pixel: true, ground: '#000000' },
  ]),
  page('muse-story-how', TONES.teal, {
    kicker: '02 · How',
    title: ['How it was built'],
    body: 'I set the specs and made the decisions. AI agents generated the models, wrote the CAD and the firmware, and ran the checks. I handed work to them four times.',
    note: { label: 'Checks', head: 'The first body split failed its check.', text: 'The agent stopped it before printing. The next version used push-in pins.' },
  }, [
    { src: R('mascot-source'), label: 'Model from my pictures', ground: '#3a3a3a' },
    { src: R('build-07'), label: 'Cutout from my specs', fit: 'cover' },
    { src: R('pouch4-on-body'), label: 'Pouch on the body', ground: '#1e5aa8' },
    { src: R('sim-turn1-question'), label: 'Button in the firmware', pixel: true, ground: '#000000' },
  ]),
  page('muse-story-model', TONES.yellow, {
    kicker: '03 · Model',
    title: ['The first model'],
    body: 'I started with pictures and a few lines of text. An image model drew four directions, and an AI 3D generator made the mascot body. It came out 10 cm tall and solid all the way through.',
    photo: { src: R('mascot-source'), caption: 'From the 3D generator.', whole: true },
  }, [
    { src: R('concept-hoodling'), label: 'Hoodling' },
    { src: R('concept-pebble'), label: 'Chat Pebble' },
    { src: R('concept-pixel'), label: 'Pixel Pal' },
    { src: R('concept-ribbon'), label: 'Blue Ribbon' },
  ]),
  page('muse-story-specs', TONES.blue, {
    kicker: '04 · Specs',
    title: ['Fitting the board'],
    body: 'A generated mesh can’t hold a circuit board to a fraction of a millimetre. So the agents took every number from one file, and I asked for a Fusion file for the board’s cutout.',
    note: { label: 'From LCDWiki’s drawing', head: 'Board 50 × 86 mm, holes 42 × 78 mm apart.', text: 'The mic port is at the top corner. USB-C, BOOT and RESET are on the bottom edge.' },
  }, [
    { src: R('build-02'), label: 'Scaled 2.4 times, to 24 cm', fit: 'cover' },
    { src: R('build-06'), label: 'Hollowed and split', fit: 'cover' },
    { src: R('build-07'), label: 'Board drawn to size', fit: 'cover' },
    { src: R('build-10'), label: 'Cut into the body', fit: 'cover' },
    { src: R('build-11'), label: 'Posts, pin sockets and mic hole', fit: 'cover' },
  ]),
  page('muse-story-pouch', TONES.caramel, {
    kicker: '05 · Pouch',
    title: ['The pouch'],
    body: 'I turned down a flat frame from Fusion, the bigger redesigns, and stretching the AI mesh to fit. Then I moved the pouch 6 mm deeper myself and asked for stronger snaps, a snap at the top and a key at the bottom.',
    note: { label: 'Measured', head: 'Each snap sits 0.4 mm past its catch.', text: 'Measured against the printed body. All five held in a digital pull test.' },
  }, [
    { src: R('pouch1-front'), label: 'Fusion frame, rejected', ground: '#1e5aa8' },
    { src: R('pouch2-blender'), label: 'Blender sculpt' },
    { src: R('pouch4-mesh'), label: 'Tripo mesh with clips', ground: '#1e5aa8' },
    { src: R('pouch4-on-body'), label: 'Kept the shape', ground: '#1e5aa8' },
    { src: R('pouch5-snaps'), label: 'Stronger snaps', ground: '#1e5aa8' },
  ]),
  page('muse-story-build', TONES.green, {
    kicker: '06 · Build',
    title: ['Printing it'],
    body: 'I printed the body shells and the pouch on Oct 25 and put it together. The first body split was never printed: it had 56 and 18 broken edges. The second version used four push-in pins.',
    photo: { src: R('v2-front'), caption: 'Body version 2, printed.', whole: true },
  }, [
    { src: R('v1-section'), label: 'First split, failed its check', ground: '#3a3a3a' },
    { src: R('v2-back-open'), label: 'Version 2: board pocket and pins', ground: '#3a3a3a' },
    { src: R('v2-pin'), label: 'Pin and socket test', ground: '#3a3a3a' },
  ]),
  page('muse-story-button', TONES.rose, {
    kicker: '07 · Button',
    title: ['The button'],
    body: 'I drilled a hole at the USB-C opening and mounted a push button there. The agents added it to the firmware: hold it to talk, press it to wake Muse. I checked both on the board on Oct 22.',
    note: { label: 'Next', head: 'Muse can ask a question on screen.', text: 'You answer with a tap or the button. It works in the simulator so far.' },
  }, [
    { src: R('sim-turn1-question'), label: 'Muse asks a question', pixel: true, ground: '#000000' },
    { src: R('sim-turn1-answered'), label: 'The answer goes back', pixel: true, ground: '#000000' },
  ]),
];

/* ---------- cover and last page ---------- */
const REAL_PHOTO = R('muse-real');
const REAL_CAPTION = 'Muse, printed, in my hand.';

/** The cover: his own photograph of the printed Muse, its name and one line. */
export const museCover: LiveScene = {
  id: 'muse-cover',
  sources: [REAL_PHOTO],
  create(images, width, height) {
    const stage = createStage(width, height);
    const { k, base, word, fg } = stage;
    const hero = images.get(REAL_PHOTO);
    return loopPage(stage, {
      loop: 2,
      once: true,
      rest: 2,
      step() { /* nothing to advance */ },
      draw(t, clock) {
        const e = easeOut(clamp(t / 1.1, 0, 1));
        const bg = base.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, '#2b1d3d'); bg.addColorStop(1, '#140c1e');
        base.fillStyle = bg; base.fillRect(0, 0, width, height);
        const cx = 1470 * k; const cy = 600 * k;
        const glow = base.createRadialGradient(cx, cy, 120 * k, cx, cy, 760 * k);
        glow.addColorStop(0, rgba([190, 150, 255], 0.3 + 0.08 * Math.sin(clock * 1.3)));
        glow.addColorStop(1, rgba([190, 150, 255], 0));
        base.fillStyle = glow; base.fillRect(0, 0, width, height);
        stage.tooth(0.07);
        word.globalAlpha = e; word.translate(-70 * k * (1 - e), 0);
        word.textAlign = 'left'; word.textBaseline = 'alphabetic';
        word.fillStyle = '#f6eeff'; word.font = `800 ${300 * k}px ${SANS}`; tracking(word, -300 * k * 0.05);
        word.fillText('Muse', 110 * k, 640 * k);
        word.font = `450 ${50 * k}px ${SANS}`; tracking(word, 0);
        word.fillStyle = rgba([226, 214, 255], 0.92);
        ['Meta’s Muse AI on my desk,', 'in a body I built with AI agents.'].forEach((line, i) => word.fillText(line, 118 * k, (760 + i * 66) * k));
        word.font = `650 ${28 * k}px ${SANS}`; tracking(word, 28 * k * 0.16);
        word.fillStyle = rgba([200, 170, 255], 0.95);
        word.fillText('A FLIP BOOK · TURN THE PAGE', 118 * k, 1010 * k);
        if (hero) {
          const h = 900 * k; const w = h * (hero.naturalWidth / hero.naturalHeight);
          const f = 1 - easeBack(clamp((t - 0.15) / 0.85, 0, 1));
          fg.save(); fg.globalAlpha = clamp((1 - f) * 3, 0, 1); fg.translate(cx + 160 * k * f, cy + 4 * k * Math.sin(clock * 1.1) - 140 * k * f); fg.rotate(0.02 + 0.2 * f + 0.004 * Math.sin(clock * 0.8));
          fg.fillStyle = '#ffffff'; fg.shadowColor = 'rgba(0,0,0,0.4)'; fg.shadowBlur = 30 * k;
          fg.fillRect(-w / 2 - 14 * k, -h / 2 - 14 * k, w + 28 * k, h + 28 * k);
          fg.shadowColor = 'transparent';
          fg.drawImage(hero, -w / 2, -h / 2, w, h);
          fg.restore();
        }
      },
    });
  },
};

/** The last page: where it stands, with his own photograph of the finished Muse. */
export const museEnd: LiveScene = {
  id: 'muse-end',
  sources: [REAL_PHOTO],
  create(images, width, height) {
    const stage = createStage(width, height);
    const { k, base, word, fg } = stage;
    const board = images.get(REAL_PHOTO);
    return loopPage(stage, {
      loop: 2,
      once: true,
      rest: 2,
      step() { /* nothing */ },
      draw(t, clock) {
        const e = easeOut(clamp(t / 1.1, 0, 1));
        base.fillStyle = '#f6ecfd'; base.fillRect(0, 0, width, height);
        stage.tooth(0.06);
        word.globalAlpha = e; word.translate(-60 * k * (1 - e), 0);
        word.textAlign = 'left'; word.textBaseline = 'alphabetic';
        word.fillStyle = '#3a1a55'; word.font = `600 ${110 * k}px ${SERIF}`;
        word.fillText('Where it stands', 110 * k, 300 * k);
        word.font = `450 ${44 * k}px ${SANS}`; word.fillStyle = rgba([58, 26, 85], 0.86);
        ['Hold the button to talk.', 'Press it to wake Muse.', 'Next: open the pull request to', 'Meta’s muse-gadget-sdk, and build', 'a Home Assistant connector.'].forEach((line, i) => word.fillText(line, 114 * k, (420 + i * 62) * k));
        if (board) {
          const f = 1 - easeBack(clamp((t - 0.15) / 0.85, 0, 1));
          fg.save(); fg.globalAlpha = clamp((1 - f) * 3, 0, 1); fg.translate(1520 * k + 160 * k * f, 600 * k - 140 * k * f); fg.rotate(-0.03 + 0.2 * f + 0.005 * Math.sin(clock));
          const h = 820 * k; const w = h * (board.naturalWidth / board.naturalHeight);
          fg.fillStyle = '#fff'; fg.shadowColor = 'rgba(0,0,0,0.3)'; fg.shadowBlur = 24 * k;
          fg.fillRect(-w / 2 - 14 * k, -h / 2 - 14 * k, w + 28 * k, h + 70 * k); fg.shadowColor = 'transparent';
          fg.drawImage(board, -w / 2, -h / 2, w, h);
          fg.fillStyle = '#6a5a70'; fg.font = `500 ${28 * k}px ${SANS}`; fg.textAlign = 'center';
          fg.fillText(REAL_CAPTION, 0, h / 2 + 34 * k);
          fg.restore();
        }
      },
    });
  },
};
