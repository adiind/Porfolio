/**
 * "The Sound You've Been Wearing" as a yellow record lying on the home mat (Adi, 2026-11-23): the way in to the interactive 3D
 * board at /work/sound-youve-been-wearing/ (public/work/sound-youve-been-wearing/). Drawn like the scene's own intro record:
 * black vinyl with its grooves, a yellow label, and the project's name printed round the label in navy. One click opens the
 * board as one continuous camera move (Adi, 2026-11-23: "i dont want a splash page if we can avoid it"): the home camera flies
 * straight down onto the record while it spins up (engine focusOn, StageProp.dive), the last frame is kept in sessionStorage,
 * and the board's page paints that frame first thing (its head script) and cross-fades into its own scene, whose intro
 * starts by itself with the record already turning. The clipboards keep the splash (lib/mat/caseStudyHandoff.ts).
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

/** How much of the window's height the record fills when the home camera is over it. The board's own start camera is set to match (public/work/sound-youve-been-wearing/play.js, DIVE_FRAC). */
export const RECORD_DIVE_FRAC = 0.7;
/** What the home page leaves for the board page (read and cleared by its head script): who, when, the last frame, and how the record was turning. */
export const RECORD_DIVE_KEY = 'record-dive';
export const RECORD_DIVE_FRAME_KEY = 'record-dive-frame';
/** Keep the hand-over for the board page. `frame`: the home canvas's last frame (null with reduced motion: a plain fade). */
export function storeRecordDive(frame: string | null, ang: number, w: number): void {
  try {
    window.sessionStorage.removeItem(RECORD_DIVE_FRAME_KEY);
    if (frame) window.sessionStorage.setItem(RECORD_DIVE_FRAME_KEY, frame);
    window.sessionStorage.setItem(RECORD_DIVE_KEY, JSON.stringify({ from: 'home', at: Date.now(), href: SOUND_RECORD.href, frame: !!frame, ang, w, vw: window.innerWidth, vh: window.innerHeight }));
  } catch { /* the board simply opens with its own click-to-start intro */ }
}

const NAVY = '#16204a';
/** The label's yellow as the 3D board's own record looks once lit and tone mapped (a pale, warm yellow), so the cross-fade into it does not change colour. */
const YELLOW = '#f7c957';
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
  for (let r = m * 0.58; r < m * 0.955; r += 0.45) {
    ctx.strokeStyle = random() < 0.5 ? `rgba(255,248,236,${0.02 + random() * 0.035})` : `rgba(0,0,0,${0.08 + random() * 0.1})`;
    ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(m, m, r, 0, Math.PI * 2); ctx.stroke();
  }
  for (const at of [0.66, 0.74, 0.82, 0.9]) {
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
  // (the label is 58% of the record across, as on the 3D board's own record, so the cross-fade into it is the same shot)
  const lr = m * 0.58;
  ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(m, m, lr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(22,32,74,.22)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(m, m, lr - 0.3, 0, Math.PI * 2); ctx.stroke();
  const cap = lr * 0.34;
  ctx.fillStyle = NAVY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${cap / 0.72}px system-ui, sans-serif`;
  (ctx as Spaced).letterSpacing = '0px';
  arc(ctx, "THE SOUND YOU'VE", m, m, lr * 0.73, true, 2.9);
  arc(ctx, 'BEEN WEARING', m, m, lr * 0.73, false, 2.5);
  // a play mark in the middle
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(m - lr * 0.13 * 0.75, m - lr * 0.13); ctx.lineTo(m + lr * 0.13 * 1.05, m); ctx.lineTo(m - lr * 0.13 * 0.75, m + lr * 0.13); ctx.closePath(); ctx.fill();
  return canvas;
}


/**
 * One spin clock for the home record and the 3D board's record (the board is a preloaded page in an iframe over the home, see
 * FlipBookApp's board embed): both read this same function of time every frame, so they are always at the same angle and the
 * same speed, with no hold and no restart. It starts at the click, eases up to SPIN.w over SPIN.ramp seconds, then eases out
 * over SPIN.ease seconds to rest after SPIN.turns whole turns, so the title lands upright as the board's record seats itself.
 * (It is already slowing when the board fades in over the home, so the two pictures stay close even if one of them reaches the
 * screen a frame after the other.) It does not depend on when the hand-over happens. Angles are clockwise radians on the mat.
 */
export const SPIN = { w: 22, ramp: 0.55, ease: 3.0, turns: 4 } as const;
export function soundSpin(s: number): { ang: number; w: number } {
  if (s <= 0) return { ang: 0, w: 0 };
  const { w: W, ramp: R, ease: E, turns } = SPIN;
  if (s < R) { const x = s / R; return { ang: W * R * (x ** 3 - x ** 4 / 2), w: W * (3 * x * x - 2 * x ** 3) }; }
  const a1 = 0.5 * W * R;
  const delta = Math.PI * 2 * turns - a1;
  const power = (W * E) / delta - 1;                 // speed W where the ramp ends, easing to rest at E
  const y = (s - R) / E;
  if (y >= 1) return { ang: a1 + delta, w: 0 };
  return { ang: a1 + delta * (1 - (1 - y) ** (power + 1)), w: W * (1 - y) ** power };
}
/** The board is a page of its own (public/work/sound-youve-been-wearing/), kept in an iframe at this address with ?embed=1. */
export const RECORD_EMBED_SRC = `${'/work/sound-youve-been-wearing/'}?embed=1`;
