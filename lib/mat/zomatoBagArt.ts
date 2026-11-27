/**
 * The Zomato rider's bag on /mat (./zomatoBag.ts): the pictures the bag and its food are made of, drawn on canvases from Adi's own
 * Zomato entry (data/timeline.ts, the zomato item) and his real screens. Every word here is his, only shortened by
 * cutting words. Materials (fabric weave, stitches, corrugated card, kraft, foil, thermal paper, newsprint) are drawn,
 * not photographed: no generated images.
 */

import { RESCUE_STORY } from './foodRescueCards';

export const TEXT = {
  role: 'Senior Product Analyst',
  team: 'Homepage & Search',
  when: 'Oct 2024 – Jul 2025',
  summary: 'Analytics for the highest-leverage surface in India’s largest food delivery app.',
  // his five bullets, shortened only by cutting words
  lines: [
    'Homepage & Search team, the surface through which ~80% of all orders were placed.',
    'Worked with product, engineering and design on UI layout, listing size, module ordering and ranking logic.',
    'Analytics covered ~10 million daily active users, using clickstream data.',
    'Evaluated ML-based ranking output; helped identify gaps between algorithm predictions and real user behavior.',
    'Shifted decision-making toward real-time experiment reads, enabling PM + Design to make changes the same day.',
  ],
  projects: {
    home: {
      title: 'Homepage & Search Performance', role: 'Senior Product Analyst',
      lines: [
        'Maintained and analyzed how homepage and search changes impacted discovery, listing selection and ranking accuracy.',
        'Deployed multiple version changes of homepage and search algorithms and UI.',
        'Identified high-impact modules and reduced UI noise that created empty scroll.',
      ],
      foot: "The team's surface: ~10M daily users, ~80% of all orders.",
    },
    friends: {
      title: 'Friends Recommendation', role: 'Lead Analyst',
      lines: [
        'Led analytics for Friends Recommendation: social validation of restaurant and food choices.',
        'Led to greater discovery and better recommendations, and gave us much more signal on how users connect.',
        'Helped us create our own social graph, starting with a billion-plus nodes.',
      ],
      foot: '',
    },
    rescue: {
      title: 'Food Rescue (Waste Reduction)', role: 'Lead Product Analyst',
      lines: ['Reduced food wastage pan-India by ~50%.'],
      foot: '',
    },
  },
  // Friends: the two articles the bag always had. Food Rescue: the three headlines from his case study's "Media Coverage"
  // slide (data/timeline.ts), and the two links that sat on the old Food Rescue card. A headline with no address is
  // printed plain: the Times of India and NDTV pages could not be reached to confirm their addresses.
  press: {
    heading: 'Media Coverage',
    sections: [
      {
        project: 'Friends Recommendation',
        articles: [
          { title: 'Zomato Launches Recommendations From Friends Feature', source: 'ImpactOnNet', href: 'https://www.impactonnet.com/more-from-impact/zomato-launches-recommendations-from-friends-feature-9479.html' },
          { title: 'Loved by Friends Feature: Zomato Private Food Choices Public Data', source: 'MediaNama', href: 'https://www.medianama.com/2025/10/223-loved-by-friends-feature-zomato-private-food-choices-public-data/' },
        ],
        more: [],
      },
      {
        project: 'Food Rescue',
        articles: [
          { title: 'Zomato has a new plan to stop food wastage, and how this \u2018Flash Sale\u2019 is good news for users.', source: 'Times of India', href: '' },
          { title: 'Zomato Launches \u2018Rescue\u2019 Service To Combat Food Wastage. How Does It Work?', source: 'NDTV', href: '' },
          { title: 'Zomato introduces Food Rescue initiative to reduce food wastage', source: 'Verdict Foodservice', href: 'https://www.verdictfoodservice.com/news/zomatos-introduces-food-rescue/' },
        ],
        more: [
          { label: 'Zomato blog', href: 'https://www.zomato.com/blog/food-rescue/' },
          { label: 'Green Queen', href: 'https://www.greenqueen.com.hk/zomato-food-rescue-waste-climate-conscious-delivery-india/' },
        ],
      },
    ],
  },
};
export type ProjectId = keyof typeof TEXT.projects;

const make = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return { c, g: c.getContext('2d')! }; };
const rand = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

/** Wrap words to a width; returns the lines. */
function wrap(g: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(' '); const out: string[] = []; let line = '';
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > width && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line);
  return out;
}

/** The wordmark (white on clear) in any colour. */
export function tintedMark(mark: HTMLImageElement, color: string, height: number): HTMLCanvasElement {
  const w = Math.round((mark.width / mark.height) * height);
  const { c, g } = make(w, height);
  g.drawImage(mark, 0, 0, w, height);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, w, height);
  return c;
}

/* ---------- the bag ---------- */

const RED = '#cf2534';
/** Red nylon: a fine weave, a little uneven, as the riders' bags are. `hole`: the top's opening, cut clear (rim width in px). */
export function fabric(w: number, h: number, o: { seam?: number; hole?: number; mark?: { img: HTMLImageElement; h: number; y: number }; zip?: 'top' | 'none'; strap?: 'v' | 'none'; lining?: boolean; dark?: boolean; color?: string } = {}): HTMLCanvasElement {
  const { c, g } = make(w, h);
  if (o.lining) {
    // Puffy insulated foil: softly raised cells crossed by fine, irregular reflective creases.
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#8e969d'); grd.addColorStop(0.32, '#e9edef'); grd.addColorStop(0.62, '#aab2b9'); grd.addColorStop(1, '#f1f3f3');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const cell = Math.max(w, h) / 5;
    for (let y = -cell; y < h + cell; y += cell) for (let x = -cell; x < w + cell; x += cell) {
      const cx = x + cell * (0.5 + (rand() - 0.5) * 0.15); const cy = y + cell * (0.5 + (rand() - 0.5) * 0.15);
      const glow = g.createRadialGradient(cx - cell * 0.18, cy - cell * 0.2, 0, cx, cy, cell * 0.68);
      glow.addColorStop(0, 'rgba(255,255,255,0.78)'); glow.addColorStop(0.45, 'rgba(239,245,248,0.30)'); glow.addColorStop(1, 'rgba(65,75,84,0.24)');
      g.fillStyle = glow; g.fillRect(x, y, cell + 1, cell + 1);
    }
    for (let i = 0; i < 180; i++) {
      const x = rand() * w; const y = rand() * h; const len = 12 + rand() * 75;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + len * 0.45, y + len * 0.28); g.lineTo(x + len, y + len * (0.12 + rand() * 0.3));
      g.strokeStyle = rand() < 0.52 ? 'rgba(255,255,255,0.50)' : 'rgba(48,59,67,0.22)'; g.lineWidth = 0.6 + rand() * 1.5; g.stroke();
    }
    return c;
  }
  g.fillStyle = o.dark ? '#1c1c1e' : (o.color ?? RED); g.fillRect(0, 0, w, h);
  // weave
  for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${0.05 + rand() * 0.04})`; g.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(255,255,255,${0.025 + rand() * 0.02})`; g.fillRect(x, 0, 1, h); }
  for (let i = 0; i < (w * h) / 60; i++) { g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + rand() * 0.04})`; g.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1); }
  // soft wear toward the edges
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,0,5,0.22)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  if (o.strap === 'v') {
    // a compression strap of black webbing, with its buckle
    const sw = w * 0.16; const sx = w / 2 - sw / 2;
    g.fillStyle = '#1b1b1d'; g.fillRect(sx, 0, sw, h);
    for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(sx, y, sw, 1.5); }
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.setLineDash([6, 5]); g.lineWidth = 1.5; g.strokeRect(sx + 5, 4, sw - 10, h - 8); g.setLineDash([]);
    g.fillStyle = '#2b2c30'; g.fillRect(sx - 6, h * 0.42, sw + 12, h * 0.12); g.fillStyle = '#3d3f44'; g.fillRect(sx - 2, h * 0.44, sw + 4, h * 0.08);
  }
  if (o.mark) {
    const m = tintedMark(o.mark.img, '#ffffff', o.mark.h);
    g.globalAlpha = 0.96; g.drawImage(m, w / 2 - m.width / 2, o.mark.y - o.mark.h / 2); g.globalAlpha = 1;
  }
  if (o.seam) {
    // piping and a row of stitches just inside every edge
    const s = o.seam;
    g.strokeStyle = 'rgba(90,0,10,0.55)'; g.lineWidth = s * 0.5; g.strokeRect(s * 0.25, s * 0.25, w - s * 0.5, h - s * 0.5);
    g.strokeStyle = 'rgba(255,190,190,0.55)'; g.lineWidth = 2; g.setLineDash([7, 6]); g.strokeRect(s * 1.2, s * 1.2, w - s * 2.4, h - s * 2.4); g.setLineDash([]);
  }
  if (o.zip === 'top') {
    // the zip's teeth along the top of a side
    const zh = h * 0.18;
    g.fillStyle = '#16161a'; g.fillRect(0, h * 0.05, w, zh);
    for (let x = 0; x < w; x += 5) { g.fillStyle = '#3a3b40'; g.fillRect(x, h * 0.05 + zh * 0.32, 3, zh * 0.36); }
  }
  if (o.hole) {
    // the opening, cut clear (the rim is the fabric left round it)
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.roundRect(o.hole, o.hole, w - o.hole * 2, h - o.hole * 2, o.hole * 0.6); g.fill(); g.restore();
  }
  return c;
}

/** The handle across the lid: black webbing, stitched box-X at each end. */
export function webbing(w: number, h: number): HTMLCanvasElement {
  const { c, g } = make(w, h);
  g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 4) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x, 0, 1.5, h); }
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1.5; g.setLineDash([5, 4]);
  [h * 0.05, w - h * 1.05].forEach((x) => { g.strokeRect(x, h * 0.12, h * 0.9, h * 0.76); g.beginPath(); g.moveTo(x, h * 0.12); g.lineTo(x + h * 0.9, h * 0.88); g.moveTo(x + h * 0.9, h * 0.12); g.lineTo(x, h * 0.88); g.stroke(); });
  g.setLineDash([]);
  return c;
}

/* ---------- card and paper ---------- */

/** Kraft board, or white board, with fibres; corrugated sides show their flutes. */
export function board(w: number, h: number, o: { kind: 'kraft' | 'white' | 'flute' | 'foil'; hole?: number; label?: HTMLCanvasElement; labelAt?: [number, number]; print?: (g: CanvasRenderingContext2D) => void } = { kind: 'kraft' }): HTMLCanvasElement {
  const { c, g } = make(w, h);
  if (o.kind === 'foil') {
    const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#c9ccd0'); grd.addColorStop(0.45, '#eef0f2'); grd.addColorStop(0.55, '#b6b9be'); grd.addColorStop(1, '#dfe1e4');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // pressed ridges and crinkles
    for (let y = 0; y < h; y += 7) { g.fillStyle = `rgba(255,255,255,${0.12 + rand() * 0.1})`; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(70,74,80,0.10)'; g.fillRect(0, y + 3, w, 2); }
    for (let i = 0; i < (w * h) / 160; i++) { const k = rand() < 0.5; g.fillStyle = k ? 'rgba(255,255,255,0.22)' : 'rgba(60,64,70,0.14)'; g.save(); g.translate(rand() * w, rand() * h); g.rotate(rand() * 3); g.fillRect(0, 0, 3 + rand() * 14, 1 + rand() * 2); g.restore(); }
  } else {
    const base = o.kind === 'white' ? '#f3efe6' : '#b98d5c';
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < (w * h) / 40; i++) { const d = rand() < 0.5; g.fillStyle = d ? `rgba(70,40,10,${0.04 + rand() * 0.05})` : `rgba(255,240,210,${0.04 + rand() * 0.05})`; g.save(); g.translate(rand() * w, rand() * h); g.rotate(rand() * 3.14); g.fillRect(0, 0, 2 + rand() * 6, 0.8); g.restore(); }
    if (o.kind === 'flute') {
      for (let x = 0; x < w; x += 6) { g.fillStyle = 'rgba(80,50,20,0.16)'; g.fillRect(x, 0, 2, h); }
      g.fillStyle = 'rgba(80,50,20,0.25)'; g.fillRect(0, 0, w, h * 0.12); g.fillRect(0, h * 0.88, w, h * 0.12);
    }
  }
  o.print?.(g);
  if (o.label) { const [lx, ly] = o.labelAt ?? [w / 2 - o.label.width / 2, h / 2 - o.label.height / 2]; g.drawImage(o.label, lx, ly); }
  if (o.hole) { g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.rect(o.hole, o.hole, w - o.hole * 2, h - o.hole * 2); g.fill(); g.restore(); }
  return c;
}

/** A printed label (white, red rule, the project's name and his role on it), px per unit `u`. */
export function label(u: number, title: string, role: string, mark: HTMLImageElement, wUnits = 0.4): HTMLCanvasElement {
  const w = wUnits * u; const pad = 0.022 * u;
  const { g: m } = make(10, 10);
  // the title as big as fits: no single word may run past the label's edge
  let size = 0.042 * u;
  m.font = `800 ${size}px "FB Bricolage"`;
  const longest = Math.max(...title.split(' ').map((word) => m.measureText(word).width));
  if (longest > w - pad * 2) size *= (w - pad * 2) / longest;
  m.font = `800 ${size}px "FB Bricolage"`;
  const titleLines = wrap(m, title, w - pad * 2);
  const step = size * 1.14;
  const h = pad * 2 + 0.03 * u + titleLines.length * step + 0.04 * u;
  const { c, g } = make(w, h);
  g.fillStyle = '#fbfaf6'; g.beginPath(); g.roundRect(0, 0, w, h, 0.01 * u); g.fill();
  g.fillStyle = RED; g.fillRect(0, 0, w, 0.012 * u);
  const mk = tintedMark(mark, RED, 0.024 * u); g.drawImage(mk, pad, pad + 0.002 * u);
  g.fillStyle = '#1c1b1a'; g.font = `800 ${size}px "FB Bricolage"`; g.textBaseline = 'top';
  let y = pad + 0.038 * u; titleLines.forEach((l) => { g.fillText(l, pad, y); y += step; });
  g.fillStyle = '#5b5752'; g.font = `500 ${0.027 * u}px "FB Geist"`; g.fillText(role, pad, y + 0.004 * u);
  return c;
}

/** The inside of a lid: his lines, printed. The type steps down until every word fits (nothing is ever cut off). */
export function insidePrint(w: number, h: number, u: number, title: string, lines: string[], kind: 'white' | 'kraft' = 'white', foot = ''): HTMLCanvasElement {
  const c = board(w, h, { kind });
  const g = c.getContext('2d')!;
  const pad = 0.05 * u; const width = w - pad * 2;
  g.textBaseline = 'top';
  let k = 1.12; let needed = Infinity;
  const draw = (scale: number, paint: boolean) => {
    let y = pad;
    g.fillStyle = RED; g.font = `800 ${0.042 * u * scale}px "FB Bricolage"`;
    wrap(g, title, width).forEach((l) => { if (paint) g.fillText(l, pad, y); y += 0.047 * u * scale; });
    y += 0.018 * u * scale;
    lines.forEach((text) => {
      g.fillStyle = '#22201d'; g.font = `560 ${0.0265 * u * scale}px "FB Geist"`;
      wrap(g, '• ' + text, width).forEach((l, j) => { if (paint) g.fillText(j ? '  ' + l : l, pad, y); y += 0.036 * u * scale; });
      y += 0.016 * u * scale;
    });
    if (foot) {
      y += 0.008 * u * scale;
      if (paint) { g.fillStyle = 'rgba(207,37,52,0.6)'; g.fillRect(pad, y, width, 0.002 * u); }
      y += 0.018 * u * scale;
      g.fillStyle = '#5b5752'; g.font = `600 ${0.0235 * u * scale}px "FB Geist"`;
      wrap(g, foot, width).forEach((l) => { if (paint) g.fillText(l, pad, y); y += 0.032 * u * scale; });
    }
    return y + pad * 0.6;
  };
  for (; k > 0.4; k -= 0.04) { needed = draw(k, false); if (needed <= h) break; }
  draw(k, true);
  return c;
}

/** Round the corners of a picture (transparent outside), for a material that cuts on alpha. */
export function roundCorners(src: HTMLCanvasElement, r: number): HTMLCanvasElement {
  const { c, g } = make(src.width, src.height);
  g.beginPath(); g.roundRect(0, 0, src.width, src.height, r); g.clip(); g.drawImage(src, 0, 0);
  return c;
}

/** A liner with a real screen laid on it (the screen keeps its own proportions, centred). */
export function linerWith(w: number, h: number, shot: HTMLImageElement | HTMLCanvasElement, fill = 0.9, kind: 'white' | 'kraft' = 'white'): HTMLCanvasElement {
  const c = board(w, h, { kind });
  const g = c.getContext('2d')!;
  const s = Math.min((w * fill) / shot.width, (h * fill) / shot.height);
  const dw = shot.width * s; const dh = shot.height * s;
  g.save(); g.beginPath(); g.roundRect(w / 2 - dw / 2, h / 2 - dh / 2, dw, dh, Math.min(dw, dh) * 0.03); g.clip();
  g.imageSmoothingQuality = 'high'; g.drawImage(shot, w / 2 - dw / 2, h / 2 - dh / 2, dw, dh); g.restore();
  return c;
}

/** The bill: thermal paper, torn edges, his role and dates, the line items. Cut to its content (read the height off the canvas). */
export function receipt(wU: number, hU: number, u: number, mark: HTMLImageElement): HTMLCanvasElement {
  const w = wU * u; const h = hU * u;
  const { c: tall, g } = make(w, h);
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 300; i++) { g.fillStyle = `rgba(120,110,90,${0.02 + rand() * 0.03})`; g.fillRect(rand() * w, rand() * h, 1, 1); }
  const pad = 0.035 * u; const width = w - pad * 2; const ink = '#26231f';
  g.textBaseline = 'top';
  let y = 0.05 * u;
  const mk = tintedMark(mark, '#e23744', 0.05 * u); g.drawImage(mk, w / 2 - mk.width / 2, y); y += 0.075 * u;
  const centre = (t: string, font: string, color = ink, step = 0.04) => { g.font = font; g.fillStyle = color; g.fillText(t, w / 2 - g.measureText(t).width / 2, y); y += step * u; };
  centre(TEXT.role, `700 ${0.03 * u}px "FB Geist"`);
  centre(TEXT.team, `500 ${0.024 * u}px "FB Geist"`, '#4a4640', 0.032);
  centre(TEXT.when, `500 ${0.024 * u}px "FB Geist"`, '#4a4640', 0.04);
  const rule = () => { g.strokeStyle = 'rgba(40,36,30,0.55)'; g.setLineDash([0.008 * u, 0.006 * u]); g.lineWidth = 0.002 * u; g.beginPath(); g.moveTo(pad, y); g.lineTo(w - pad, y); g.stroke(); g.setLineDash([]); y += 0.022 * u; };
  rule();
  TEXT.lines.forEach((t, i) => {
    g.fillStyle = ink; g.font = `650 ${0.0215 * u}px "FB Geist"`; g.fillText(`${i + 1}`, pad, y);
    g.font = `450 ${0.0215 * u}px "FB Geist"`;
    wrap(g, t, width - 0.03 * u).forEach((l) => { g.fillText(l, pad + 0.03 * u, y); y += 0.029 * u; });
    y += 0.012 * u;
  });
  rule();
  // cut to what is printed, with the torn top and bottom edges
  const out = make(w, Math.ceil(y + 0.012 * u)); const og = out.g;
  og.drawImage(tall, 0, 0);
  og.save(); og.globalCompositeOperation = 'destination-out'; og.fillStyle = '#000';
  const tooth = 0.014 * u; const oh = out.c.height;
  [0, oh].forEach((edge) => { og.beginPath(); for (let x = -tooth; x < w + tooth; x += tooth) { const dy = (edge ? -1 : 1) * tooth * (0.5 + rand() * 0.5); og.moveTo(x, edge); og.lineTo(x + tooth / 2, edge + dy); og.lineTo(x + tooth, edge); } og.fill(); });
  og.restore();
  return out.c;
}

/** Where each link of the clipping lies (fractions of its width and height), so a click or hover can tell which one it is on. */
export interface ClipRegion { x0: number; x1: number; y0: number; y1: number; href: string; source: string }

/**
 * The clipping: a tall column cut from a newspaper, one block per project (Friends Recommendation, Food Rescue). Each
 * headline with an address is underlined as a link, with its source and "Read \u2197"; one without is printed plain,
 * with its source. As tall as its words need (the canvas's height says how tall, as the bill's does); it lies folded
 * in half in the bag, so a soft crease runs across its middle.
 */
export function clipping(wU: number, u: number): HTMLCanvasElement & { regions?: ClipRegion[] } {
  const w = wU * u; const pad = 0.03 * u; const colW = w - pad * 2;
  // drawn once on a canvas tall enough for anything, then cut to the height the words took
  const { c: tall, g } = make(w, 1.4 * u);
  g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, tall.height);
  for (let i = 0; i < (w * tall.height) / 120; i++) { g.fillStyle = `rgba(60,50,30,${0.03 + rand() * 0.04})`; g.fillRect(rand() * w, rand() * tall.height, 1, 1); }
  g.textBaseline = 'top';
  const marks: Array<{ x0: number; x1: number; y0: number; y1: number; href: string; source: string }> = [];
  let y = pad;
  g.fillStyle = '#6b6457'; g.font = `600 ${0.02 * u}px "FB Geist"`; g.fillText(TEXT.press.heading.toUpperCase(), pad, y); y += 0.032 * u;
  g.fillStyle = 'rgba(40,34,26,0.6)'; g.fillRect(pad, y, colW, 0.002 * u); y += 0.02 * u;
  TEXT.press.sections.forEach((section, s) => {
    if (s) { y += 0.012 * u; g.fillStyle = 'rgba(40,34,26,0.6)'; g.fillRect(pad, y, colW, 0.002 * u); y += 0.02 * u; }
    g.fillStyle = '#b3202c'; g.font = `700 ${0.0165 * u}px "FB Geist"`; g.fillText(section.project.toUpperCase(), pad, y); y += 0.031 * u;
    section.articles.forEach((a, i) => {
      const top = y;
      g.fillStyle = '#1d1a15'; g.font = `600 ${0.026 * u}px "FB Serif"`;
      wrap(g, a.title, colW).forEach((l) => {
        g.fillText(l, pad, y);
        if (a.href) { g.fillStyle = 'rgba(29,26,21,0.75)'; g.fillRect(pad, y + 0.029 * u, g.measureText(l).width, 0.002 * u); g.fillStyle = '#1d1a15'; }
        y += 0.033 * u;
      });
      g.fillStyle = '#6b6457'; g.font = `500 ${0.018 * u}px "FB Geist"`; g.fillText(a.source, pad, y + 0.003 * u);
      if (a.href) { g.fillStyle = '#b3202c'; g.font = `700 ${0.018 * u}px "FB Geist"`; g.fillText('Read \u2197', pad + g.measureText(a.source + '   ').width, y + 0.003 * u); }
      y += 0.03 * u;
      if (a.href) marks.push({ x0: 0, x1: w, y0: top - 0.006 * u, y1: y, href: a.href, source: a.source });
      if (i < section.articles.length - 1 || section.more.length) { g.fillStyle = 'rgba(40,34,26,0.25)'; g.fillRect(pad, y, colW, 0.0015 * u); y += 0.015 * u; }
    });
    // the project's own pages, after the headlines: short links on one line
    let x = pad;
    section.more.forEach((m) => {
      g.fillStyle = '#b3202c'; g.font = `700 ${0.018 * u}px "FB Geist"`;
      const label = `${m.label} \u2197`; const lw = g.measureText(label).width;
      g.fillText(label, x, y + 0.002 * u);
      marks.push({ x0: x - 0.008 * u, x1: x + lw + 0.008 * u, y0: y - 0.006 * u, y1: y + 0.03 * u, href: m.href, source: m.label });
      x += lw + 0.034 * u;
    });
    if (section.more.length) y += 0.03 * u;
  });
  const h = Math.ceil((y + pad) / 2) * 2;
  const { c, g: o } = make(w, h);
  o.drawImage(tall, 0, 0);
  // the crease where it was folded: a hair of shade above the fold, a hair of light below
  o.fillStyle = 'rgba(40,34,26,0.10)'; o.fillRect(0, h / 2 - 0.0016 * u, w, 0.0016 * u);
  o.fillStyle = 'rgba(255,255,255,0.35)'; o.fillRect(0, h / 2, w, 0.0014 * u);
  const out = c as HTMLCanvasElement & { regions?: ClipRegion[] };
  out.regions = marks.map((m) => ({ x0: m.x0 / w, x1: m.x1 / w, y0: m.y0 / h, y1: m.y1 / h, href: m.href, source: m.source }));
  return out;
}

/** His photo at Zomato as a glossy print with a white border. */
export function photoPrint(img: HTMLImageElement, wU: number, hU: number, u: number): HTMLCanvasElement {
  const w = wU * u; const h = hU * u; const b = 0.018 * u;
  const { c, g } = make(w, h);
  g.fillStyle = '#f7f6f2'; g.fillRect(0, 0, w, h);
  const iw = w - b * 2; const ih = h - b * 2;
  const s = Math.max(iw / img.width, ih / img.height);
  g.save(); g.beginPath(); g.rect(b, b, iw, ih); g.clip();
  g.drawImage(img, b + iw / 2 - (img.width * s) / 2, b + ih / 2 - (img.height * s) / 2, img.width * s, img.height * s); g.restore();
  return c;
}


/* ---------- the rider bag, as the real one is made (see reference/BAG-SPEC.md) ---------- */

/** The nylon's red as it should READ on screen (the photo's front is about #D33439 in light). */
export const RIDER_RED = '#ee363a';
/** Black piping / binding. */
export const BIND = '#2d2928';

/** Grey reflective tape: a fine bead grain, a soft sheen, stitched edges. Slight sheen, not chrome. */
function reflective(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const grd = g.createLinearGradient(0, y, 0, y + h); grd.addColorStop(0, '#cbc6c4'); grd.addColorStop(0.5, '#bcb8b6'); grd.addColorStop(1, '#adaaa7');
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  for (let i = 0; i < (w * h) / 10; i++) { g.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.07})`; g.fillRect(x + rand() * w, y + rand() * h, 1, 1); }
  for (let i = 0; i < (w * h) / 40; i++) { g.fillStyle = `rgba(40,36,36,${0.04 + rand() * 0.06})`; g.fillRect(x + rand() * w, y + rand() * h, 1, 1); }
  const sh = g.createLinearGradient(x, 0, x + w, 0);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.28, 'rgba(255,255,255,0.13)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(0.78, 'rgba(255,255,255,0.09)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(70,64,64,0.5)'; g.lineWidth = Math.max(1, h * 0.03); g.setLineDash([h * 0.16, h * 0.12]);
  [y + h * 0.1, y + h * 0.9].forEach((yy) => { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); });
  g.setLineDash([]);
}

/** Black binding round the edge of a face, with a faint lit lip on its inner side. */
function binding(g: CanvasRenderingContext2D, w: number, h: number, b: { l?: number; r?: number; t?: number; b?: number }) {
  g.fillStyle = BIND;
  if (b.l) g.fillRect(0, 0, b.l, h); if (b.r) g.fillRect(w - b.r, 0, b.r, h);
  if (b.t) g.fillRect(0, 0, w, b.t); if (b.b) g.fillRect(0, h - b.b, w, b.b);
  g.fillStyle = 'rgba(255,255,255,0.07)';
  if (b.l) g.fillRect(b.l, 0, 1.5, h); if (b.r) g.fillRect(w - b.r - 1.5, 0, 1.5, h);
  if (b.t) g.fillRect(0, b.t, w, 1.5); if (b.b) g.fillRect(0, h - b.b - 1.5, w, 1.5);
}

/**
 * The front of the body. Measures are in table units; z counts from the bag's foot. `ftop` is the top edge of the flap (the
 * photo's "front" runs from there to the foot, height `F`): the wordmark, FOOD DELIVERY, the lower strip, the red line, the black band.
 */
export function riderFront(o: { u: number; W: number; H: number; ftop: number; F: number; mark: HTMLImageElement; bind: number }): HTMLCanvasElement {
  const { u, W, H, ftop, F } = o; const w = W * u; const h = H * u; const bw = o.bind * u;
  const { c, g } = make(w, h);
  g.drawImage(fabric(w, h, { color: RIDER_RED }), 0, 0);
  const Z = (p: number) => ftop - p * F; const Y = (z: number) => (H - z) * u;
  // the black band, a little inset from the red either side by its own edge
  { const y0 = Y(Z(0.845)); const y1 = Y(Z(0.93));
    g.fillStyle = '#2a2726'; g.fillRect(0, y0, w, y1 - y0);
    g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(0, y0, w, 2); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y1 - 2, w, 2);
    for (let x = 0; x < w; x += 3) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(x, y0, 1, y1 - y0); } }
  // the lower reflective strip
  { const y0 = Y(Z(0.76)); const y1 = Y(Z(0.82)); reflective(g, 0, y0, w, y1 - y0); }
  // "zomato", about 88% of the width
  { const mw = W * 0.88 * u; const mh = mw * (o.mark.height / o.mark.width);
    const m = tintedMark(o.mark, '#fff5ee', mh); const cz = Z(0.45);
    g.drawImage(m, w / 2 - mw / 2, Y(cz) - mh / 2, mw, mh); }
  // FOOD DELIVERY: heavy sans, bold caps, white, about 72% of the width
  { const text = 'FOOD DELIVERY'; const target = W * 0.72 * u;
    let size = 0.05 * u; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff5ee';
    const set = (s: number) => { g.font = `800 ${s}px "FB Geist", "FB Bricolage", sans-serif`; (g as unknown as { letterSpacing: string }).letterSpacing = `${s * 0.045}px`; };
    set(size); size *= target / g.measureText(text).width; set(size);
    const base = Y(Z(0.66)); g.fillText(text, w / 2 - g.measureText(text).width / 2, base);
    (g as unknown as { letterSpacing: string }).letterSpacing = '0px'; }
  return c;
}

/** A plain side or the back: red, bound on every edge. */
export function riderPlain(o: { u: number; W: number; H: number; bind: number }): HTMLCanvasElement {
  const w = o.W * o.u; const h = o.H * o.u; const bw = o.bind * o.u;
  const { c, g } = make(w, h); g.drawImage(fabric(w, h, { color: RIDER_RED }), 0, 0);
  void bw; return c;
}

/** The body's top rim: red with the opening cut clear, bound outside and round the opening. */
export function riderRim(o: { u: number; W: number; D: number; wall: number; bind: number }): HTMLCanvasElement {
  const w = o.W * o.u; const h = o.D * o.u; const bw = o.bind * o.u; const hole = o.wall * o.u;
  const { c, g } = make(w, h); g.drawImage(fabric(w, h, { color: RIDER_RED }), 0, 0);
  g.strokeStyle = BIND; g.lineWidth = bw * 1.4; g.beginPath(); g.roundRect(hole, hole, w - hole * 2, h - hole * 2, hole * 0.5); g.stroke();
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.roundRect(hole + bw * 0.4, hole + bw * 0.4, w - hole * 2 - bw * 0.8, h - hole * 2 - bw * 0.8, hole * 0.4); g.fill(); g.restore();
  return c;
}

/** The lid's top: plain red, bound all round, the zip's black tape and teeth running left side, front and right side (back is the hinge). */
export function riderLidTop(o: { u: number; W: number; D: number; bind: number; zi: number; back: number; mark?: HTMLImageElement }): HTMLCanvasElement {
  const w = o.W * o.u; const h = o.D * o.u; const bw = o.bind * o.u;
  const { c, g } = make(w, h); g.drawImage(fabric(w, h, { color: RIDER_RED }), 0, 0);
  const zi = o.zi * o.u; const tape = 0.013 * o.u; const bk = o.back * o.u;
  g.strokeStyle = '#171616'; g.lineWidth = tape; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(zi, bk); g.lineTo(zi, h - zi); g.lineTo(w - zi, h - zi); g.lineTo(w - zi, bk); g.stroke();
  g.strokeStyle = '#8d8b8b'; g.lineWidth = tape * 0.34; g.setLineDash([tape * 0.22, tape * 0.2]);
  g.beginPath(); g.moveTo(zi, bk); g.lineTo(zi, h - zi); g.lineTo(w - zi, h - zi); g.lineTo(w - zi, bk); g.stroke(); g.setLineDash([]);
  if (o.mark) { // the white wordmark, centred on the lid, about 60% of its width (the wide view's only sight of the bag's face)
    const mw = w * 0.6; const mh = mw * (o.mark.height / o.mark.width); const m = tintedMark(o.mark, '#fff5ee', mh);
    const ty = h * 0.075; // wordmark and role line, centred together
    g.drawImage(m, w / 2 - mw / 2, h / 2 - mh / 2 - ty, mw, mh);
    // his role under it, printed in the same white ink, regular weight (Adi: "senior product analyst at the bottom with non-bolded text")
    const fs = mw * 0.085; g.font = `400 ${fs}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    g.fillStyle = '#fff5ee'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText('Senior Product Analyst', w / 2, h / 2 + mh / 2 - ty + fs * 0.55);
  }
  void bw; return c;
}

/** The flap: red, bound down both sides and along its rounded lower edge, the reflective strip across it. Its top meets the lid. */
export function riderFlap(o: { u: number; W: number; H: number; bind: number; r: number; strip: [number, number] }): HTMLCanvasElement {
  const w = o.W * o.u; const h = o.H * o.u; const bw = o.bind * o.u; const r = o.r * o.u;
  const { c, g } = make(w, h);
  g.fillStyle = BIND; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.moveTo(bw, 0); g.lineTo(w - bw, 0); const rr = Math.max(1, r - bw); g.lineTo(w - bw, h - bw - rr); g.arcTo(w - bw, h - bw, w - bw - rr, h - bw, rr); g.lineTo(bw + rr, h - bw); g.arcTo(bw, h - bw, bw, h - bw - rr, rr); g.closePath(); g.clip();
  g.drawImage(fabric(w, h, { color: RIDER_RED }), 0, 0);
  reflective(g, 0, o.strip[0] * o.u, w, (o.strip[1] - o.strip[0]) * o.u);
  g.restore();
  g.fillStyle = BIND; g.fillRect(0, 0, w, bw * 0.7); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, bw * 0.7, w, 1.5);
  return c;
}

/** Black webbing, laid lengthwise (the strap is taller than it is wide): ribs, a stitched centre. */
export function riderStrap(w: number, h: number): HTMLCanvasElement {
  const { c, g } = make(w, h);
  g.fillStyle = '#242221'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, w, 1); }
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1.5; g.setLineDash([6, 5]);
  [w * 0.14, w * 0.86].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }); g.setLineDash([]);
  return c;
}


/* ---------- Food Rescue: the brown paper bag and its story ---------- */

const KRAFT = '#c79a63';
/** Kraft paper: warm fibres, a soft crease. */
export function kraftPaper(w: number, h: number, o: { crease?: boolean; crinkle?: boolean; pleat?: boolean } = {}): HTMLCanvasElement {
  const { c, g } = make(w, h);
  g.fillStyle = KRAFT; g.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 36; i++) { const d = rand() < 0.5; g.fillStyle = d ? `rgba(90,55,20,${0.05 + rand() * 0.06})` : `rgba(255,236,200,${0.05 + rand() * 0.06})`; g.save(); g.translate(rand() * w, rand() * h); g.rotate(rand() * 3.14); g.fillRect(0, 0, 2 + rand() * 7, 0.8); g.restore(); }
  if (o.crinkle) { // soft crumples: long faint light and dark creases, a few short ones
    for (let i = 0; i < 46; i++) {
      const x = rand() * w; const y = rand() * h; const len = (0.08 + rand() * 0.3) * Math.max(w, h); const ang = rand() * Math.PI;
      const dx = Math.cos(ang) * len; const dy = Math.sin(ang) * len;
      g.lineCap = 'round'; g.strokeStyle = `rgba(70,40,10,${0.07 + rand() * 0.07})`; g.lineWidth = 1.5 + rand() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
      g.strokeStyle = `rgba(255,240,205,${0.08 + rand() * 0.08})`; g.lineWidth = 1 + rand() * 2; g.beginPath(); g.moveTo(x + 2, y + 2); g.lineTo(x + dx + 2, y + dy + 2); g.stroke();
    }
  }
  if (o.pleat) { // the side gusset's fold, down its middle
    g.fillStyle = 'rgba(70,40,10,0.35)'; g.fillRect(0, h / 2 - 3, w, 6); g.fillStyle = 'rgba(255,240,205,0.35)'; g.fillRect(0, h / 2 + 3, w, 3);
  }
  if (o.crease) { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(70,40,10,0.18)'); gr.addColorStop(0.5, 'rgba(255,240,210,0.1)'); gr.addColorStop(1, 'rgba(70,40,10,0.18)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  return c;
}
/** The approved illustration (519x600), cut in two along its fold: the folded-over top with the red strips, and the body with the print. */
export function paperBagFront(img: HTMLImageElement, part: 'top' | 'body', outW: number): { c: HTMLCanvasElement; ratio: number } {
  const split = 122; // the fold's lower edge, in the picture's own pixels
  const sy = part === 'top' ? 0 : split; const sh = part === 'top' ? split : img.height - split;
  const outH = Math.round(outW * (sh / img.width));
  const { c, g } = make(outW, outH);
  g.drawImage(kraftPaper(outW, outH), 0, 0);
  g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, sy, img.width, sh, 0, 0, outW, outH);
  return { c, ratio: sh / img.width };
}

const CARD_W = 980; const CARD_H = 700;
/** The five sheets that come out of the paper bag: the heading, then the four of the story (his real words, from RESCUE_STORY). */
/** (1400 px to a table unit: a sheet's size on the mat is its canvas size over 1400.) */
export function rescueSheets(offer: HTMLImageElement, mark: HTMLImageElement): HTMLCanvasElement[] {
  const P = TEXT.projects.rescue; const pad = 56;
  const base = (bw = CARD_W, bh = CARD_H) => {
    const { c, g } = make(bw, bh);
    g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, bw, bh);
    for (let i = 0; i < (bw * bh) / 300; i++) { g.fillStyle = `rgba(120,110,90,${0.02 + rand() * 0.03})`; g.fillRect(rand() * bw, rand() * bh, 1, 1); }
    g.fillStyle = RED; g.fillRect(0, 0, bw, 18);
    g.textBaseline = 'top';
    return { c, g };
  };
  const para = (g: CanvasRenderingContext2D, lines: string[], x: number, y: number, width: number, size: number, step: number) => {
    g.fillStyle = '#22201d'; g.font = `500 ${size}px "FB Geist"`;
    lines.forEach((t) => { wrap(g, t, width).forEach((l) => { g.fillText(l, x, y); y += step; }); y += step * 0.35; });
    return y;
  };
  const out: HTMLCanvasElement[] = [];
  { // the heading
    const { c, g } = base();
    const m = tintedMark(mark, RED, 70); g.drawImage(m, pad, pad + 10);
    g.fillStyle = RED; g.font = '800 66px "FB Bricolage"'; let y = 190;
    wrap(g, P.title, CARD_W - pad * 2).forEach((l) => { g.fillText(l, pad, y); y += 76; });
    g.fillStyle = '#5b5752'; g.font = '600 40px "FB Geist"'; g.fillText(P.role, pad, y + 10); y += 96;
    g.fillStyle = '#22201d'; g.font = '800 58px "FB Bricolage"';
    wrap(g, P.lines[0], CARD_W - pad * 2).forEach((l) => { g.fillText(l, pad, y); y += 68; });
    out.push(roundCorners(c, 38));
  }
  RESCUE_STORY.forEach((st) => {
    if (st.id === 'screen') { // the real offer screen takes most of a larger sheet; the words sit beside it, smaller
      const SW = 1680; const SH = 1064; const { c, g } = base(SW, SH);
      g.fillStyle = '#6b6457'; g.font = '600 38px "FB Geist"'; g.fillText(st.kicker.toUpperCase(), pad, pad + 6);
      g.fillStyle = '#1c1b1a'; g.font = '800 66px "FB Bricolage"'; g.fillText(st.title, pad, pad + 66);
      const py = 226; const ph = SH - py - 48; const pw = ph * (offer.width / offer.height);
      g.save(); g.beginPath(); g.roundRect(pad, py, pw, ph, 22); g.clip(); g.drawImage(offer, pad, py, pw, ph); g.restore();
      g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 2; g.beginPath(); g.roundRect(pad, py, pw, ph, 22); g.stroke();
      para(g, st.lines, pad + pw + 44, py + 6, SW - pad * 2 - pw - 44, 50, 64);
      out.push(roundCorners(c, 44));
      return;
    }
    const { c, g } = base();
    g.fillStyle = '#6b6457'; g.font = '600 36px "FB Geist"'; g.fillText(st.kicker.toUpperCase(), pad, pad + 6);
    let y = pad + 70; let width = CARD_W - pad * 2;
    if (st.id === 'screen') { // the real offer screen on the right
      const pw = 480; const ph = pw * (offer.height / offer.width); const py = 150;
      width = CARD_W - pad * 2 - pw - 36;
      g.save(); g.beginPath(); g.roundRect(CARD_W - pad - pw, py, pw, ph, 18); g.clip(); g.drawImage(offer, CARD_W - pad - pw, py, pw, ph); g.restore();
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.beginPath(); g.roundRect(CARD_W - pad - pw, py, pw, ph, 18); g.stroke();
    }
    if (st.figure) { g.fillStyle = RED; g.font = '800 120px "FB Bricolage"'; g.fillText(st.figure, pad, y); y += 128; }
    g.fillStyle = '#1c1b1a'; g.font = `800 ${st.figure ? 56 : st.id === 'screen' ? 48 : 58}px "FB Bricolage"`;
    wrap(g, st.title, width).forEach((l) => { g.fillText(l, pad, y); y += st.id === 'screen' ? 56 : 66; });
    y += 14;
    para(g, st.lines, pad, y, width, 46, 58);
    out.push(roundCorners(c, 38));
  });
  return out;
}
