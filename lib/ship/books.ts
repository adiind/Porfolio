/**
 * The flip books that lie on the 3D home's mat: the only ones a production build opens at /book/<slug>.
 * Any other slug (pg, squad-up, familysync, builds, ...) goes to "/" in production; development keeps them all.
 *
 * Must match FLIP_BOOKS in data/flipbooks.ts. scripts/ship/port-home.mjs stops (exit 3) when it no longer does,
 * so a book added to or taken off the mat is a decision someone makes here, not a silent publish.
 * (Kept small on purpose: data/flipbooks.ts is ~50 KB and must not be pulled into the entry chunk for this.)
 */
// (bambu joined FLIP_BOOKS in SOURCE on 2026-11-16 at about 01:06, while the ship layer was being built: it lies on the mat,
//  so the 3D home shows it whatever this list says; it is listed so its own address matches what the mat shows.)
export const SHIP_BOOKS: readonly string[] = ['surya', 'jarvis', 'muse', 'bambu'];
