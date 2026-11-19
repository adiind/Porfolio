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

/**
 * The story pages two case studies show in a frame (Squad Up, FamilySync). Without ".html": the live site answers
 * story.html with a redirect to this address, one more trip before the frame can start.
 */
export const CASE_STORY_PAGES = ['/work/squad-up-assets/story', '/work/familysync-assets/story'];

type ShipCode = { old?: { js: string[]; css: string[] } };
let warmed = false;

/**
 * Download what a case study needs while the home page sits idle, so a click on a clipboard finds it already here
 * (Adi, 2026-11-19: "like a 6 second splash page between home page and squad up"). After the click a case study
 * used to fetch its code, then its story page, then that page's styles and scripts, each waiting for the one before;
 * on a slow line that chain is what held the splash up.
 *
 * It only downloads (fetch, body read to the end, into the browser's cache): nothing is run on the home page. The old
 * home's code addresses come from index.html (window.__shipCode, written in by the build); the story pages are read for
 * their stylesheets, scripts and first pictures. Two at a time, low priority, never on a data saver or a 2G line.
 */
export function warmCaseStudies(): void {
  if (warmed) return;
  warmed = true;
  const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (net?.saveData || /2g$/.test(net?.effectiveType ?? '')) return;

  const queue: string[] = [];
  const seen = new Set<string>();
  const add = (url: string) => {
    const at = new URL(url, window.location.href);
    if (at.origin !== window.location.origin || seen.has(at.href)) return;
    seen.add(at.href);
    queue.push(at.href);
  };
  const code = (window as Window & { __shipCode?: ShipCode }).__shipCode?.old;
  code?.js.forEach(add);
  code?.css.forEach(add);

  let running = 0;
  const pull = () => {
    while (running < 2 && queue.length) {
      const url = queue.shift() as string;
      running++;
      const page = CASE_STORY_PAGES.some((path) => url.endsWith(path));
      fetch(url, { credentials: 'same-origin', priority: 'low' } as RequestInit)
        .then(async (response) => { if (page && response.ok) readStoryPage(await response.text(), url); else await response.arrayBuffer(); })
        .catch(() => { /* only a head start: the case study asks for it again anyway */ })
        .finally(() => { running--; pull(); });
    }
  };
  const readStoryPage = (html: string, base: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const at = (value: string | null) => { if (value) add(new URL(value, base).href); };
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => at(el.getAttribute('href')));
    doc.querySelectorAll('script[src]').forEach((el) => at(el.getAttribute('src')));
    [...doc.querySelectorAll('img[src]')].slice(0, 4).forEach((el) => at(el.getAttribute('src')));
  };
  CASE_STORY_PAGES.forEach(add);
  pull();
}

/** The address a case study's frame loads: the story page itself (the dev server only knows it with ".html"). */
export function storyPageSrc(path: string): string {
  return import.meta.env.DEV ? `${path}.html` : path;
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
