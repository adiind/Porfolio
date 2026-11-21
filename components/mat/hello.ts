/* "Hi, I'm Adi." is the first thing on the 3D home page: index.html draws it in the dark room under the swinging bulb,
   before any script has loaded (#mat-hello), in the very typeface the mat's cut letters are cut from (FB Bricolage 800,
   lib/mat/wordPieces.ts GREETING). When the room lights up it is carried, in one move, onto the cut letters' place on the
   mat; once the light is full, the cut letters (held back until then: StageProp.held) are shown in that same spot and the
   greeting goes the frame after, so there is never a frame with neither. With motion turned down it is a cross-fade. */

/** True when index.html drew the greeting (the 3D home's first load). */
export const helloDrawn = (): boolean => !!document.getElementById('mat-hello');

/** Where the cut letters lie on screen, and how to show them. */
export interface HelloLanding {
  /**
   * Screen points (CSS pixels) of the cut letters' text box as it lies on the mat now: its baseline's start and end (bl,
   * br) and the points at cap height straight above them (tl, tr). The mat is seen at a slant, so these four make a
   * slightly leaning, slightly narrowing shape; the greeting is drawn through the same perspective to land on it exactly.
   */
  at(): Quad | null;
  /** The cut letters' text width and size in their own picture (page pixels), to scale the greeting to. */
  textW: number;
  size: number;
  /** The colours the cut letters are drawn in, as lit (the greeting turns to them on its way down). */
  colours: { first: string; second: string };
  /** Resolves when the room's light is full (the cut letters are drawn at their true colour from then on). */
  lit: Promise<void>;
  /** How far the room's light has come up, 0 to 1 (the engine's dawn): "Adi." turns black by it. */
  dawn?(): number;
  /** Show the cut letters (they were held back). */
  show(): void;
}

interface Point { x: number; y: number }
export interface Quad { tl: Point; tr: Point; bl: Point; br: Point }

/** Cap height of the cut letters' typeface, as a share of its size (the same share on both sides, so it cancels out). */
export const CAP = 0.7;

/**
 * The perspective that carries four points onto four others (a plane seen at a slant): the 3 by 3 matrix, row by row,
 * its last entry 1. Solved as eight equations in eight unknowns.
 */
function perspective(from: Point[], to: Point[]): number[] | null {
  const a: number[][] = [];
  from.forEach((p, i) => {
    const q = to[i];
    a.push([p.x, p.y, 1, 0, 0, 0, -p.x * q.x, -p.y * q.x, q.x]);
    a.push([0, 0, 0, p.x, p.y, 1, -p.x * q.y, -p.y * q.y, q.y]);
  });
  for (let c = 0; c < 8; c += 1) {
    let pivot = c;
    for (let r = c + 1; r < 8; r += 1) if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
    if (Math.abs(a[pivot][c]) < 1e-12) return null;
    [a[c], a[pivot]] = [a[pivot], a[c]];
    for (let r = 0; r < 8; r += 1) {
      if (r === c) continue;
      const f = a[r][c] / a[c][c];
      for (let k = c; k < 9; k += 1) a[r][k] -= f * a[c][k];
    }
  }
  return [...a.map((row, i) => row[8] / row[i]), 1];
}

let landed = false;

/**
 * "Adi." turns black once the light on the mat under it is this full (the shaders' dawnLight, 0 to 1): about where black
 * on the brightening mat reads as well as cream did (measured: both near 3.8 to 1 there). It turns in one frame: any
 * fade from cream to black passes through the mat's own brightness, and for that moment the word is not there.
 */
const INK_LIGHT = 0.9;

const remember = () => { try { sessionStorage.setItem('mat-greeted', '1'); } catch { /* private mode: it greets again next time */ } };

/** Carry the greeting onto the cut letters and hand over to them. Resolves once the cut letters are showing. */
export function landHello(to: HelloLanding | null, reducedMotion: boolean): Promise<void> {
  const hello = document.getElementById('mat-hello');
  const words = hello?.querySelector('span') as HTMLElement | null;
  if (!hello || !words) { to?.show(); return Promise.resolve(); }
  // with motion turned down (or nothing to land on): the cut letters come up as the greeting fades, in the same 0.3 s
  const fade = () => {
    to?.show();
    hello.style.transition = 'opacity .3s ease-out';
    hello.style.opacity = '0';
    window.setTimeout(() => hello.remove(), 320);
    landed = true;
    remember();
    return Promise.resolve();
  };
  const spot = to?.at();
  if (!to || !spot || reducedMotion) return to && reducedMotion ? to.lit.then(fade) : fade();
  hello.classList.add('is-on');
  const fs = parseFloat(getComputedStyle(words).fontSize);
  // the greeting's own measures at rest: its text width, and its baseline (a zero-size mark set on the baseline)
  words.style.animation = 'none';
  const mark = document.createElement('i');
  mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  words.appendChild(mark);
  // (measured to the fraction of a pixel: offsetTop and offsetWidth are rounded, and half a pixel shows at the hand-over)
  const from = words.getBoundingClientRect();
  const baseline = mark.getBoundingClientRect().top - from.top;
  mark.remove();
  const textW = from.width;
  const held = hello.getBoundingClientRect();
  const inset = { left: from.left - held.left, top: from.top - held.top };
  if (!(fs > 0) || !(textW > 0) || !(from.width > 0)) return fade();
  // The cut letters on screen: the baseline's direction and length, and the cap height straight above its start. They are
  // asked for every frame: the wide view still sways a little as the book settles, and the greeting must follow it exactly.
  // (where the greeting rests untransformed, read from layout each frame: the page can gain a scrollbar as the room lights,
  // which narrows the window and moves the centred greeting under its transform)
  const rest0 = () => {
    const now = hello.getBoundingClientRect();
    // (centred: when the window narrows, the greeting moves by half of what it lost)
    return { left: now.left + inset.left + (now.width - held.width) / 2, top: now.top + inset.top };
  };
  // The greeting's own text box (its pixels, from its top left corner): cap height above the baseline, start to end.
  const box = [{ x: 0, y: baseline - fs * CAP }, { x: textW, y: baseline - fs * CAP }, { x: 0, y: baseline }, { x: textW, y: baseline }];
  /** The perspective that lays the greeting's box on the cut letters' box, written for transform-origin 0 0 at its rest. */
  const place = (at: Quad) => {
    const h = perspective(box, [at.tl, at.tr, at.bl, at.br]);
    if (!h) return null;
    const { left: rx, top: ry } = rest0();
    // (moved by its resting place: the transform works from there)
    return [h[0] - h[6] * rx, h[1] - h[7] * rx, h[2] - rx, h[3] - h[6] * ry, h[4] - h[7] * ry, h[5] - ry, h[6], h[7]];
  };
  // their cut edge and the three shadows every block on the mat has (as PROP_ALPHA_SHADOW_FRAGMENT draws them), in the
  // greeting's own pixels: one page pixel of the cut letters is fs / size of the greeting's
  const k = fs / to.size;
  const ink = 'rgba(2,10,44,';
  const shadow = [
    `${(-0.9 * k).toFixed(2)}px ${(1.1 * k).toFixed(2)}px 0 #e3d9c0`,
    `${(-1.5 * k).toFixed(2)}px ${(2 * k).toFixed(2)}px ${(2 * k).toFixed(2)}px ${ink}.42)`,
    `${(-8 * k).toFixed(2)}px ${(10 * k).toFixed(2)}px ${(12 * k).toFixed(2)}px ${ink}.36)`,
    `${(-30 * k).toFixed(2)}px ${(38 * k).toFixed(2)}px ${(40 * k).toFixed(2)}px ${ink}.45)`,
  ].join(', ');
  // (its colours turn as the light reaches it, not before: "Adi." turning black in the dark would vanish for a moment)
  words.style.transition = 'color .5s ease .55s, text-shadow .5s ease .55s';
  const em = words.querySelector('em') as HTMLElement | null;
  // "Adi." stays light like "Hi, I'm" while the room around it is dim, and turns black only once the light has reached the
  // mat where it is (black reads there then); it is black by the time the cut letters take over
  if (em) em.style.transition = 'color .5s ease .55s';
  let black = false;
  const toBlack = () => {
    if (!em || black) return;
    black = true;
    em.style.transition = 'none';
    em.style.color = to.colours.second;
    em.style.textShadow = shadow.replace('#e3d9c0', '#000');
  };
  /** The light on the mat at a point of the window, as the shaders' dawnLight() spreads it from the bulb (0 dark, 1 full). */
  const lightAt = (x: number, y: number) => {
    const w = window.innerWidth; const h = window.innerHeight;
    const dx = (x / w - 0.5) * (w / h); const dy = (1 - y / h) - 0.74;
    const k = Math.min(1, Math.max(0, (to.dawn?.() ?? 1) * 2.1 - Math.hypot(dx, dy)));
    return k * k * (3 - 2 * k);
  };
  // (the curve the headline used: cubic-bezier(.16,.84,.24,1), solved for its y at time x)
  const ease = (x: number) => {
    let lo = 0; let hi = 1; let t = x;
    for (let i = 0; i < 24; i += 1) { t = (lo + hi) / 2; const bx = 3 * (1 - t) ** 2 * t * 0.16 + 3 * (1 - t) * t * t * 0.24 + t ** 3; if (bx < x) lo = t; else hi = t; }
    return 3 * (1 - t) ** 2 * t * 0.84 + 3 * (1 - t) * t * t + t ** 3;
  };
  const GLIDE = 650;
  return new Promise((resolve) => {
    let start = 0;
    let done = false;
    const NONE = [1, 0, 0, 0, 1, 0, 0, 0];
    let last = place(spot) ?? NONE;
    const step = (now: number) => {
      if (done || !hello.isConnected) return;
      if (!start) start = now;
      const at = to.at();
      if (at) last = place(at) ?? last;
      const e = ease(Math.min(1, (now - start) / GLIDE));
      const [a, b, c, d, f, g, p, q] = last.map((v, i) => NONE[i] + (v - NONE[i]) * e);
      // (the 3 by 3 perspective as a CSS matrix3d, column by column)
      words.style.transform = `matrix3d(${[a, d, 0, p, b, f, 0, q, 0, 0, 1, 0, c, g, 0, 1].map((v) => +v.toPrecision(9)).join(',')})`;
      if (em && !black && to.dawn) {
        const r = em.getBoundingClientRect();
        if (lightAt(r.left + r.width / 2, r.top + r.height / 2) >= INK_LIGHT) toBlack();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame((now) => {
      words.style.color = to.colours.first;
      words.style.textShadow = shadow;
      // (light, with "Hi, I'm"; with no dawn to keep time with, black on the old timing)
      if (em) {
        em.style.color = to.colours.first;
        if (!to.dawn) window.setTimeout(toBlack, 550);
      }
      step(now);
    });
    // it has come to rest on the cut letters (and keeps to them); once the light is full, they show and it goes the frame after
    const rest = new Promise<void>((ok) => window.setTimeout(ok, GLIDE + 20));
    void Promise.all([rest, to.lit]).then(() => {
      // (never cream on the hand-over: a starved window can reach full light before the turn was seen)
      toBlack();
      to.show();
      landed = true;
      remember();
      resolve();
      requestAnimationFrame(() => requestAnimationFrame(() => { done = true; hello.remove(); }));
    });
  });
}

/** The opening's safety net: if the greeting is still up (it never got its move), let it go, gently. */
export function dropHello(): void {
  const hello = document.getElementById('mat-hello');
  if (!hello || landed) return;
  hello.style.transition = 'opacity .3s ease-out';
  hello.style.opacity = '0';
  window.setTimeout(() => hello.remove(), 320);
}
