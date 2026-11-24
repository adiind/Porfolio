/**
 * "The Sound You've Been Wearing" as a yellow record lying on the home mat (Adi, 2026-11-23): the way in to the interactive 3D
 * board at /work/sound-youve-been-wearing/ (public/work/sound-youve-been-wearing/). Drawn like the scene's own intro record:
 * black vinyl with its grooves, a yellow label, and the project's name printed round the label in navy. One click opens the
 * board through the same splash the clipboards use (lib/mat/caseStudyHandoff.ts), in the mat's blue, so the screen stays blue
 * from the home mat straight into the scene's own mat.
 */

/** The record's outside size on the home page, in page pixels (the stage's 1440 by 900 frame). */
export const RECORD = { d: 128 } as const;
/** Where it lies, by its middle, in page pixels: the clear stretch of mat above the clipboards. */
export const RECORD_LAY = { x: 936, y: 150, turn: 0 } as const;

/** What the splash and the click need, as a case-study card's (caseStudyHandoff.openCaseStudy). `band`: the mat's blue. */
export const SOUND_RECORD = {
  id: 'sound-youve-been-wearing',
  href: '/work/sound-youve-been-wearing/',
  title: "The Sound You've Been Wearing",
  partner: 'Interactive 3D board',
  band: '#1b62d4',
} as const;
export const SOUND_RECORD_PROP = 'record:sound-youve-been-wearing';

const NAVY = '#16204a';
const YELLOW = '#facc15';
/** Drawn at 4 canvas pixels to the page pixel: sharp on a 2x screen, and when it lifts under the pointer. */
const S = 4;

type Spaced = CanvasRenderingContext2D & { letterSpacing?: string };

/** The same speckle every time. */
function grain(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Text set round a circle, letters upright: along the top (reads left to right) or along the bottom. */
function arc(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, radius: number, top: boolean, span: number) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const squeeze = Math.min(1, (span * radius) / total);
  const dir = top ? 1 : -1;
  let angle = (top ? -Math.PI / 2 : Math.PI / 2) - (dir * (total * squeeze)) / radius / 2;
  chars.forEach((ch, i) => {
    const da = (widths[i] * squeeze) / radius;
    const at = angle + (dir * da) / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(at) * radius, cy + Math.sin(at) * radius);
    ctx.rotate(at + (top ? Math.PI / 2 : -Math.PI / 2));
    ctx.scale(squeeze, 1);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += dir * da;
  });
}

/** The record, RECORD.d page pixels across, on a clear picture (the engine gives it a round shadow from its outline). */
export function drawSoundRecord(): HTMLCanvasElement {
  const d = RECORD.d;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(d * S); canvas.height = Math.round(d * S);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(S, S);
  const m = d / 2;
  const random = grain(2311);

  // the vinyl: near black, fine grooves, four darker bands, a sheen across it
  ctx.fillStyle = '#1c1b1e'; ctx.beginPath(); ctx.arc(m, m, m - 0.5, 0, Math.PI * 2); ctx.fill();
  for (let r = m * 0.46; r < m * 0.955; r += 0.45) {
    ctx.strokeStyle = random() < 0.5 ? `rgba(255,248,236,${0.02 + random() * 0.035})` : `rgba(0,0,0,${0.08 + random() * 0.1})`;
    ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(m, m, r, 0, Math.PI * 2); ctx.stroke();
  }
  for (const at of [0.56, 0.67, 0.79, 0.88]) {
    ctx.strokeStyle = '#141316'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(m, m, m * at, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.save();
  ctx.beginPath(); ctx.arc(m, m, m - 0.5, 0, Math.PI * 2); ctx.clip();
  for (const [start, span] of [[-0.25, 0.5], [Math.PI - 0.25, 0.5]] as const) {
    const sheen = ctx.createConicGradient(start, m, m);
    sheen.addColorStop(0, 'rgba(255,248,236,0)'); sheen.addColorStop(span / (Math.PI * 2) / 2, 'rgba(255,248,236,.13)'); sheen.addColorStop(span / (Math.PI * 2), 'rgba(255,248,236,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, d, d);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,248,236,.1)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(m, m, m - 0.9, 0, Math.PI * 2); ctx.stroke();

  // the label: yellow, the name printed round it in navy ("THE SOUND YOU'VE" over the top, "BEEN WEARING" under the bottom)
  const lr = m * 0.47;
  ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(m, m, lr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(22,32,74,.22)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(m, m, lr - 0.3, 0, Math.PI * 2); ctx.stroke();
  const cap = lr * 0.3;
  ctx.fillStyle = NAVY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${cap / 0.72}px system-ui, sans-serif`;
  (ctx as Spaced).letterSpacing = '0px';
  arc(ctx, "THE SOUND YOU'VE", m, m, lr * 0.74, true, 2.5);
  arc(ctx, 'BEEN WEARING', m, m, lr * 0.74, false, 2.5);
  // a play mark in the middle
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(m - lr * 0.14, m - lr * 0.2); ctx.lineTo(m + lr * 0.26, m); ctx.lineTo(m - lr * 0.14, m + lr * 0.2); ctx.closePath(); ctx.fill();
  return canvas;
}
