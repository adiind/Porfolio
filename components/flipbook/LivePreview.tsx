import React, { useEffect, useRef } from 'react';
import { liveSceneFor } from '../../lib/flipbook/live';
import type { LiveInput } from '../../lib/flipbook/live';
import type { FlipBook } from '../../lib/flipbook/types';
import { useBookImages } from './FlatReview';

/**
 * A book's live page pressed flat and playing, without the 3D book around it.
 * Opened with ?flat=live. For working on a scene and for review captures:
 * window.__live steps time by hand and holds the story at one position.
 */
const LivePreview: React.FC<{ book: FlipBook }> = ({ book }) => {
  const { images, error } = useBookImages(book);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!images || !canvas) return undefined;
    const wanted = new URLSearchParams(window.location.search).get('scene');
    const pageData = book.pages.find((page) => liveSceneFor(page) && (!wanted || page.live === wanted || page.id === wanted));
    const scene = pageData ? liveSceneFor(pageData) : null;
    if (!scene) return undefined;
    const page = scene.create(images, 1600, 960);
    let raf = 0;
    let last = 0;
    let frozen = false;
    let pointer: LiveInput['pointer'] = null;
    let turnVel = 0;
    const input = (dt: number): LiveInput => ({ dt, pointer, turn: 0, turnVel, onTop: true, reduced: false });
    const paint = () => page.flatten(canvas);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (frozen) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      page.frame(input(dt));
      paint();
    };
    page.enter();
    page.frame(input(0));
    paint();
    raf = requestAnimationFrame(tick);
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { u: (event.clientX - rect.left) / rect.width, v: 1 - (event.clientY - rect.top) / rect.height };
    };
    const onLeave = () => { pointer = null; };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    const api = {
      ready: true,
      /** Step the scene by an exact amount of time and draw it. */
      advance(seconds: number) {
        frozen = true;
        let left = seconds;
        while (left > 1e-6) { const h = Math.min(1 / 60, left); page.frame(input(h)); left -= h; }
        paint();
      },
      freeze(value: boolean) { frozen = value; last = 0; },
      scrub(position: number | null) { page.scrub(position); paint(); },
      enter() { page.enter(); },
      pointer(u: number | null, v = 0.5) { pointer = u === null ? null : { u, v }; },
      turn(value: number) { turnVel = value; },
      /** Show one layer on its own: 'base', 'word', 'fg' or 'shadow'. */
      layer(name: 'base' | 'word' | 'fg' | 'shadow') {
        frozen = true;
        const source = page.canvases[name];
        canvas.width = source.width; canvas.height = source.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#5a5a5a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(source, 0, 0);
      },
    };
    (window as unknown as { __live?: unknown }).__live = api;
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      delete (window as unknown as { __live?: unknown }).__live;
      page.dispose();
    };
  }, [book, images]);

  if (error) return <p style={{ padding: 24, color: '#fff' }}>{error}</p>;
  return (
    <main data-live-preview={images ? 'ready' : 'loading'} style={{ background: '#160a04', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <canvas ref={ref} style={{ width: 'min(100%, 150vh)', height: 'auto', display: 'block', borderRadius: 18 }} />
    </main>
  );
};

export default LivePreview;
