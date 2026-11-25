/**
 * A project or experience page (/work/<id>, /experience/<id>: a link on the mat, a shared link, the sitemap, the résumé)
 * is its own page (lib/ship/BranchPage.tsx). When it closes, the visitor goes back to the home:
 *  - they came from the home in this tab (the 3D mat, or its flat copy on a phone): step back one page, so the browser
 *    shows that page as it was left;
 *  - otherwise: the front door ("/"), which is the 3D mat on a capable desktop and the flat home on a phone.
 * It only ever steps back or replaces the current page, so pressing Back again and again always leaves the site.
 *
 * The dialog history itself (hooks/useDialogA11y) is untouched: this only listens for the moment the address is back
 * at "/" with no dialog entry on top, which is where every close path (close button, Escape, browser Back) ends.
 */
import { BOOT } from './boot';
import { canTake3DHome, readHomeMark } from './frontDoor';

const HOME_PATHS = new Set(['/', '/mat', '/home-flat']);

function cameFromHome(): boolean {
  // opened in a new tab or window: there is no page to step back to
  if (BOOT.historyLength < 2) return false;
  try {
    const from = BOOT.referrer ? new URL(BOOT.referrer) : null;
    if (from && from.origin === window.location.origin && HOME_PATHS.has(from.pathname.replace(/(.)\/$/, '$1'))) return true;
  } catch { /* an unreadable referrer counts as none */ }
  // (some browsers send no referrer: then the link's own mark, backed by this tab having shown the 3D home)
  return BOOT.fromMat && readHomeMark() === 'mat';
}

let fallback = 0;
let steppedBack = false;

/** Leave the old home for the right home. Returns true when it has replaced this page. */
export function landHome(): boolean {
  if (cameFromHome()) {
    steppedBack = true;
    window.history.back();
    // if the step back goes nowhere, use the front door instead
    fallback = window.setTimeout(() => { window.location.replace(canTake3DHome() ? '/' : '/home-flat/'); }, 1200);
    return false;
  }
  if (canTake3DHome()) { window.location.replace('/'); return true; }
  // a phone or a browser without WebGL 2: its home is the flat page
  window.location.replace('/home-flat/');
  return true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => window.clearTimeout(fallback));
  // Forward after stepping back can bring this page back from the browser's cache, closed and empty: show the front door
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && steppedBack && canTake3DHome()) window.location.replace('/');
  });
}

/** Call once, at boot, when the page opened on a project or experience that exists. */
export function armReturnHome(): void {
  const onPop = () => {
    if (window.location.pathname !== '/' || window.history.state?.modal) return;
    window.removeEventListener('popstate', onPop);
    // after the dialog's own popstate work, never in the same tick as its history.back()
    window.setTimeout(landHome, 0);
  };
  window.addEventListener('popstate', onPop);
}
