// First: capture the address the visitor arrived with, before anything below rewrites it.
import { BOOT } from './lib/ship/boot';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeOpenPanel } from './lib/openpanel';
import { canTake3DHome, clearDarkRoom, ensureDarkRoom, isExperiencePath, isWorkPath, markMatLinks, rememberHome } from './lib/ship/frontDoor';
import { SHIP_BOOKS } from './lib/ship/books';

// Every route's root is loaded lazily, so each route downloads only its own code:
// the 3D home never fetches the old home (App), and the old home never fetches the 3D code or the mat pictures.

const path = BOOT.pathname;
const isStudioRoute = /^\/studio\/?$/.test(path);
// Flip-book editions of selected projects live at /book and /book/<slug>.
const bookRoute = /^\/book(?:\/([a-z0-9-]+))?\/?$/i.exec(path);
const bookSlug = bookRoute?.[1]?.toLowerCase() ?? null;
// Only the books that lie on the mat are published (lib/ship/books.ts); development keeps every book reachable.
const hiddenBook = Boolean(bookRoute && bookSlug && !import.meta.env.DEV && !SHIP_BOOKS.includes(bookSlug));
// "/" and "/mat": the 3D home, but only for a browser that can take it (decided here, before any 3D code loads).
// "/#writings" is the old home's only address for its writings, so it keeps the old home.
const isHomeRoute = /^\/(mat\/?)?$/i.test(path);
const show3DHome = isHomeRoute && window.location.hash !== '#writings' && canTake3DHome();
// "/classic": always the old home, on any device.
const isClassicRoute = /^\/classic\/?$/i.test(path);
// /work/<id> (a Selected Work case study) and /experience/<id> (a timeline stop) open over the old home.
const isDeepLink = !isStudioRoute && (isWorkPath(path) || isExperiencePath(path));

if (hiddenBook) {
  window.location.replace('/');
} else {
  // Deep link: the old home opens the detail named by the address (lib/workRoutes reads it from lib/ship/boot).
  // Reset the address bar to the site root so the detail overlay owns the /work/<id> or /experience/<id> history entry
  // it pushes via useDialogA11y: browser Back then closes the detail without leaving the site. Unknown ids land on "/".
  if (isDeepLink) {
    window.history.replaceState(null, '', '/');
  }
  // Initialize only after deep-link normalization so the first automatic screen
  // view reflects the route visible to the visitor, not the temporary boot path.
  void initializeOpenPanel();

  if (show3DHome) {
    ensureDarkRoom();
    rememberHome('mat');
    window.addEventListener('pageshow', () => rememberHome('mat'));
    markMatLinks();
  } else if (isHomeRoute) {
    // index.html may have started the dark room on a window that looked wide enough, but this browser cannot take the 3D
    // home (no WebGL 2): it gets the flat home (public/home-flat), as phones do; "/#writings" keeps the old home
    clearDarkRoom();
    if (window.location.hash !== '#writings') window.location.replace('/home-flat/' + window.location.hash);
  }
  if (isClassicRoute) rememberHome('classic');
}

/**
 * A route root loaded lazily, but asked for now, before the first render (index.html asked for its code earlier still). Once
 * the module is in, React.lazy is handed it through a then() that answers at once, so React draws the route itself straight
 * away, not a Suspense fallback first: whatever replaces a fallback, React holds back until 300 ms after the fallback went up.
 * (Until then, and if the module failed, it is a plain React.lazy: fallback, retry, ErrorBoundary.)
 */
function lazyRoot<P extends object>(load: () => Promise<React.ComponentType<P>>) {
  type Loaded = { default: React.ComponentType<P> };
  let loaded: Loaded | null = null;
  const ready = load().then((component) => { loaded = { default: component }; }, () => undefined);
  const Component = React.lazy<React.ComponentType<P>>(() => {
    const now = loaded;
    return now ? ({ then: (resolve: (module: Loaded) => void) => resolve(now) } as unknown as Promise<Loaded>) : load().then((component) => ({ default: component }));
  });
  return { Component, ready };
}

// The old home: every route that is not the 3D home, a book or the studio.
const toFlatHome = isHomeRoute && !show3DHome && window.location.hash !== '#writings';
const OldHome = !show3DHome && !toFlatHome && !bookRoute && !isStudioRoute ? lazyRoot(() => import('./lib/ship/OldHome').then((module) => module.default)) : null;
const StudioApp = import.meta.env.DEV
  ? React.lazy(() => Promise.all([import('framer-motion'), import('./components/StudioApp')]).then(([motion, studio]) => ({
    default: () => <motion.MotionConfig reducedMotion="user"><studio.default /></motion.MotionConfig>,
  })))
  : null;
// The home page as a 3D place: the mat, the posters and the books on it.
const MatHome = show3DHome
  ? lazyRoot(() => import('./components/flipbook/FlipBookApp').then((module) => module.MatHome))
  : null;
const FlipBookApp = bookRoute && !hiddenBook
  ? lazyRoot(() => import('./components/flipbook/FlipBookApp').then((module) => module.default))
  : null;

if (isStudioRoute) {
  document.title = 'Portfolio Studio · Internal';
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  robots?.setAttribute('content', 'noindex, nofollow, noarchive');
}

// The old home's own background while its code arrives (as body has it in index.html), so the wait never flashes another colour.
const oldHomeWait = <div style={{ minHeight: '100vh', background: '#050505' }} aria-label="Loading" />;

const RouteRoot: React.FC = () => {
  if (MatHome) {
    // the room starts dark, so the wait is dark too
    return <React.Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#02070f' }} aria-label="Loading" />}><MatHome.Component /></React.Suspense>;
  }
  if (bookRoute && FlipBookApp) {
    return (
      // (arriving from the home page's mat, index.html has already drawn the mat and the booklet: leave them showing)
      <React.Suspense fallback={document.getElementById('book-held') ? null : <div className="min-h-screen bg-[#050505]" aria-label="Loading the book" />}>
        <FlipBookApp.Component initialSlug={bookSlug} />
      </React.Suspense>
    );
  }
  if (OldHome) return <React.Suspense fallback={oldHomeWait}><OldHome.Component /></React.Suspense>;

  if (!StudioApp) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="max-w-md border border-white/15 bg-white/[0.03] p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">404 · Internal route</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Portfolio Studio is unavailable.</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">This owner-only workspace runs in the local development environment and is not part of the public portfolio.</p>
        </div>
      </main>
    );
  }

  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#050505]" aria-label="Loading Portfolio Studio" />}>
      <StudioApp />
    </React.Suspense>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// (a hidden book is on its way to "/": draw nothing meanwhile)
if (!hiddenBook) {
  const root = ReactDOM.createRoot(rootElement);
  const draw = () => root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <RouteRoot />
      </ErrorBoundary>
    </React.StrictMode>
  );
  // (first the route's code, then the first render: see lazyRoot)
  const ready = (MatHome ?? FlipBookApp ?? OldHome)?.ready;
  if (ready) void ready.then(draw); else draw();
}
