/**
 * From a clipboard on the home page's mat to its case study (Adi, 2026-11-18: the click "is very jarring ... make it
 * splashy"). It used to cut straight from the mat to black, then white, then the case study fading in.
 *
 * Now a splash in the project's own colour (designCards band) grows out of the clipboard and covers the window, with the
 * project's name on it; the case study is loaded under it. index.html draws the very same splash first thing on the
 * case study's page (read from sessionStorage, CASE_SPLASH_KEY), so the screen never goes black or white in between,
 * and lifts it away once the case study has drawn itself.
 *
 * Shared with index.html's head script: the key, the shape of what is stored, the colours and the type.
 */

export const CASE_SPLASH_KEY = 'case-splash';
/** How long the splash takes to cover the window before the case study is asked for. */
export const SPLASH_GROW_MS = 560;
/** The type on the splash, the same on both pages (the case study has none of the home page's fonts). */
export const SPLASH_FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

export interface CaseSplash { c: string; t: string; p: string; href: string; at: number }

let leaving = false;

/**
 * Open a case study with the splash. `from`: where the clipboard lies on screen (CSS pixels), the splash grows out of
 * it; null grows it from the middle. With reduced motion it simply goes.
 */
export function openCaseStudy(
  card: { href: string; title: string; partner: string; band: string },
  from: { x: number; y: number } | null,
  reduced: boolean,
): void {
  if (leaving) return;
  const go = () => window.location.assign(card.href);
  if (reduced || !/^#[0-9a-f]{6}$/i.test(card.band)) { go(); return; }
  leaving = true;
  const splash: CaseSplash = { c: card.band, t: card.title, p: card.partner, href: card.href, at: Date.now() };
  try { window.sessionStorage.setItem(CASE_SPLASH_KEY, JSON.stringify(splash)); } catch { /* the case study simply arrives without it */ }

  const w = window.innerWidth; const h = window.innerHeight;
  const x = from ? Math.min(w, Math.max(0, from.x)) : w / 2;
  const y = from ? Math.min(h, Math.max(0, from.y)) : h / 2;
  const reach = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 4;

  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483000', 'display:grid', 'place-items:center', 'pointer-events:auto',
    `background:${card.band}`, `clip-path:circle(0px at ${x}px ${y}px)`,
    `transition:clip-path ${SPLASH_GROW_MS}ms cubic-bezier(.7,0,.25,1)`,
  ].join(';');
  el.appendChild(splashWords(card.title, card.partner, true));
  document.body.appendChild(el);

  // Back from the case study can bring this page back as it was left (the browser keeps it): take the splash away then.
  const back = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    window.removeEventListener('pageshow', back);
    el.remove();
    leaving = false;
  };
  window.addEventListener('pageshow', back);

  void el.offsetWidth;
  el.style.clipPath = `circle(${reach}px at ${x}px ${y}px)`;
  const words = el.firstElementChild as HTMLElement;
  words.style.opacity = '1';
  words.style.transform = 'none';
  window.setTimeout(go, SPLASH_GROW_MS + 40);
}

/** The project's name and who it was with, white on its colour (index.html draws the same). */
function splashWords(title: string, partner: string, rising: boolean): HTMLElement {
  const box = document.createElement('div');
  box.style.cssText = [
    'text-align:center', 'color:#fff', `font-family:${SPLASH_FONT}`, 'padding:0 24px',
    rising ? 'opacity:0' : '', rising ? 'transform:translateY(14px)' : '',
    rising ? 'transition:opacity .32s ease .2s, transform .42s cubic-bezier(.2,.7,.2,1) .2s' : '',
  ].filter(Boolean).join(';');
  const name = document.createElement('div');
  name.textContent = title;
  name.style.cssText = 'font-weight:700;font-size:clamp(34px,5.4vw,78px);line-height:1.05;letter-spacing:-.02em';
  const with_ = document.createElement('div');
  with_.textContent = partner;
  with_.style.cssText = 'margin-top:12px;font-weight:600;font-size:clamp(14px,1.4vw,19px);letter-spacing:.06em;text-transform:uppercase;opacity:.86';
  box.append(name, with_);
  return box;
}
