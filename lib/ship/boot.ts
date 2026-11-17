/**
 * The address as the visitor arrived with it, captured before anything rewrites it.
 *
 * index.tsx imports this module first, so it runs before index.tsx resets a deep link
 * (/work/<id>, /experience/<id>) to "/". The old home is loaded lazily, after that reset,
 * so lib/workRoutes reads the deep link from here, not from window.location.
 *
 * (Ship layer: kept in scripts/ship/files/lib/ship/ and copied into place by scripts/ship/port-home.mjs.)
 */
const hasWindow = typeof window !== 'undefined';

export const BOOT = {
  pathname: hasWindow ? window.location.pathname : '/',
  search: hasWindow ? window.location.search : '',
  /** The page this one was opened from (full address for a page on this site). */
  referrer: typeof document !== 'undefined' ? document.referrer : '',
  /** 1 means there is no earlier page in this tab to step back to (a new tab, a new window). */
  historyLength: hasWindow ? window.history.length : 1,
  /** Links on the 3D home carry ?from=mat into the old home's project and experience pages. */
  fromMat: hasWindow ? new URLSearchParams(window.location.search).get('from') === 'mat' : false,
};
