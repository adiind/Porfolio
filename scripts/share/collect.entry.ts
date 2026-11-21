// Entry for scripts/share/make-share-images.mjs (bundled by esbuild there, not part of the app).
// It only re-exports the data the address list is made from, so the list comes from the same code the site runs on.
export { PROJECTS } from '../../data/projects';
export { TIMELINE_DATA } from '../../data/timeline';
export { SHIP_BOOKS } from '../../lib/ship/books';
export { FLIP_BOOKS } from '../../data/flipbooks';
export { SLUG_ALIASES } from '../../lib/workRoutes';
