/**
 * The front door: which home a visitor gets at "/", decided before any 3D code or picture is downloaded.
 *
 * (Ship layer: kept in scripts/ship/files/lib/ship/ and copied into place by scripts/ship/port-home.mjs.
 *  Imported by the entry chunk, so it must stay tiny and import nothing heavy.)
 */

/** Any /work path (valid or not), as lib/workRoutes has it. Repeated here so the entry chunk does not load the project data. */
export const isWorkPath = (pathname: string): boolean => /^\/work(\/|$)/.test(pathname);
/** Any /experience path (valid or not): the timeline stops' detail views on the old home. */
export const isExperiencePath = (pathname: string): boolean => /^\/experience(\/|$)/.test(pathname);

/**
 * The window rule of the 3D home (components/flipbook/FlipBookApp.tsx sends a window away to the old home when it is
 * narrower than 760 px or squarer than 1.15 : 1). index.html repeats this rule inline for the dark room.
 * A window that reports no size yet is not judged fit.
 */
export const fitsBySize = (w: number, h: number): boolean => w >= 760 && h > 0 && w / h >= 1.15;

/** three.js (r163 and later) draws with WebGL 2 only, so that is what is probed. The throwaway context is released. */
function hasWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * True when this browser gets the 3D home at "/": a window wide enough (see fitsBySize) and a working WebGL 2 context.
 * Everyone else (phones, narrow or tall windows, no WebGL) gets the old home, with no 3D code or mat pictures downloaded.
 *
 * The flat phone version of the new home will replace the old-home branch of this decision later.
 */
export function canTake3DHome(): boolean {
  const w = window.innerWidth || document.documentElement.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight;
  return fitsBySize(w, h) && hasWebGL2();
}

/** The old home is showing after all: take away the dark room index.html may have started (greeting and background). */
export function clearDarkRoom(): void {
  // the greeting (index.html, components/mat/hello.ts) belongs to the dark room
  document.getElementById('mat-hello')?.remove();
  document.documentElement.style.background = '';
}

/** The 3D home is showing: make sure the dark room is up (index.html normally started it already). */
export function ensureDarkRoom(): void {
  document.documentElement.style.background = '#02070f';
}

const HOME_KEY = 'home-from';
/** This tab has shown the 3D home (read by lib/ship/returnHome when a browser sends no referrer). */
export function rememberHome(kind: 'mat'): void {
  try { window.sessionStorage.setItem(HOME_KEY, kind); } catch { /* storage blocked: the referrer still tells */ }
}
export function readHomeMark(): string | null {
  try { return window.sessionStorage.getItem(HOME_KEY); } catch { return null; }
}

/**
 * On the 3D home: every link into the old home's project and experience pages carries ?from=mat, so closing that page
 * steps back to the mat. One listener, before the link's own handlers, covers the hero, the timeline, the poster close-ups
 * and the books' "Open ..." links.
 */
export function markMatLinks(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    let url: URL;
    try { url = new URL(link.href, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin || !(isWorkPath(url.pathname) || isExperiencePath(url.pathname))) return;
    if (url.searchParams.get('from') === 'mat') return;
    url.searchParams.set('from', 'mat');
    link.href = url.pathname + url.search + url.hash;
  }, true);
}
