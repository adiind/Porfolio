import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { isWorkPath } from './lib/workRoutes';
import { initializeOpenPanel } from './lib/openpanel';

const isStudioRoute = /^\/studio\/?$/.test(window.location.pathname);

// Deep link: /work/<id> opens the matching Selected Work detail (captured in
// lib/workRoutes as INITIAL_WORK_PROJECT_ID before this runs). Reset the
// address bar to the site root so the detail overlay owns the /work/<id>
// history entry it pushes via useDialogA11y — browser Back then closes the
// detail without leaving the site. Unknown ids simply land on /.
if (!isStudioRoute && isWorkPath(window.location.pathname)) {
  window.history.replaceState(null, '', '/');
}

// Initialize only after deep-link normalization so the first automatic screen
// view reflects the route visible to the visitor, not the temporary boot path.
void initializeOpenPanel();
const StudioApp = import.meta.env.DEV
  ? React.lazy(() => import('./components/StudioApp'))
  : null;

if (isStudioRoute) {
  document.title = 'Portfolio Studio · Internal';
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  robots?.setAttribute('content', 'noindex, nofollow, noarchive');
}

const RouteRoot: React.FC = () => {
  if (!isStudioRoute) return <App />;

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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <RouteRoot />
      </MotionConfig>
    </ErrorBoundary>
  </React.StrictMode>
);
