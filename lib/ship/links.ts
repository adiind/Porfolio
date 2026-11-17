/**
 * Where the 3D home's stops and posters lead on the live site. One table, so a new page is one line here.
 * The links are plain; markMatLinks (lib/ship/frontDoor.ts) adds ?from=mat at click time.
 *
 * (Ship layer: kept in scripts/ship/files/lib/ship/ and copied into place by scripts/ship/port-home.mjs. Used by a
 *  one-line overlay in components/mat/TimelineSection.tsx: see scripts/ship/overlays.mjs.)
 */

/** Timeline stops (ids as in data/timeline.ts and the mat's TimelineSection). Stops not listed keep what the mat gives them. */
const STOP_HREF: Record<string, string> = {
  'self-xyz': '/experience/self-xyz',
  'portfolio-website': '/work/portfolio-website',
  'ms-edi': '/experience/ms-edi',
  zomato: '/experience/zomato',
  // (Jarvis has no page of its own: Adi, 2026-11-17, "Open Jarvis page should open Jarvis's GitHub")
  'jarvis-competition': 'https://github.com/adiind/diy-jarvis',
  udaan: '/experience/udaan',
  schmooze: '/experience/schmooze',
  snapdeal: '/experience/snapdeal',
  tinkerverse: '/experience/tinkerverse',
  bits: '/experience/bits',
};

export const shipStopHref = (id: string | undefined): string | null => (id && STOP_HREF[id]) || null;

// The poster close-up links moved into the page itself on 2026-11-16 (lib/mat/posterLinks.ts, same targets).
