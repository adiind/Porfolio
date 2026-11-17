import React, { useEffect, useRef, useState } from 'react';
import type { FlipBook } from '../../lib/flipbook/types';
import { composeBack, composePage, loadBookImages, loadFlipbookFonts, type BookImages } from '../../lib/flipbook/pageArt';

/** Loads a book's fonts and pictures once. Returns null until they are ready. (`enabled` false: loads nothing.) */
export function useBookImages(book: FlipBook, enabled = true): { images: BookImages | null; error: string | null } {
  const [state, setState] = useState<{ slug: string; images: BookImages | null; error: string | null }>({ slug: book.slug, images: null, error: null });
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    setState({ slug: book.slug, images: null, error: null });
    Promise.all([loadFlipbookFonts(), loadBookImages(book)])
      .then(([, images]) => { if (live) setState({ slug: book.slug, images, error: null }); })
      .catch((error: unknown) => { if (live) setState({ slug: book.slug, images: null, error: error instanceof Error ? error.message : 'The book could not be loaded.' }); });
    return () => { live = false; };
  }, [book, enabled]);
  return state.slug === book.slug ? { images: state.images, error: state.error } : { images: null, error: null };
}

/** One page pressed flat onto a 2D canvas. Used when WebGL is unavailable and for review sheets. */
export const FlatPage: React.FC<{
  book: FlipBook; index: number; images: BookImages; width: number; height: number; back?: boolean; className?: string;
}> = ({ book, index, images, width, height, back = false, className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const layers = back ? null : composePage(book, index, { width, height, images, layered: false });
    const source = layers ? layers.flat : composeBack(book, index, width, height);
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext('2d')?.drawImage(source, 0, 0);
    canvas.dataset.overflow = layers?.overflow ? 'true' : 'false';
  }, [book, index, images, width, height, back]);
  const page = book.pages[index];
  return <canvas ref={ref} className={className} role="img" aria-label={back ? `Back of the ${page.word} page` : `${page.kicker}. ${page.title}`} />;
};

/** Every page of a book laid out flat, for checking type and layout. Opened with ?flat=1 (or ?flat=portrait). */
const FlatReview: React.FC<{ book: FlipBook; portrait: boolean }> = ({ book, portrait }) => {
  const { images, error } = useBookImages(book);
  const width = portrait ? 1024 : 1536;
  const height = portrait ? 1536 : 1024;
  if (error) return <p style={{ padding: 24, color: '#fff' }}>{error}</p>;
  if (!images) return <p style={{ padding: 24, color: '#fff' }}>Loading pages…</p>;
  return (
    <main data-flat-review="ready" style={{ background: book.theme.stage, minHeight: '100vh', padding: 24, display: 'grid', gap: 24, gridTemplateColumns: portrait ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }}>
      {book.pages.map((page, index) => (
        <React.Fragment key={page.id}>
          <FlatPage book={book} index={index} images={images} width={width} height={height} className="fb-flat-page" />
        </React.Fragment>
      ))}
      {book.pages.slice(0, 2).map((page, index) => (
        <FlatPage key={`back-${page.id}`} book={book} index={index} images={images} width={width / 2} height={height / 2} back className="fb-flat-page" />
      ))}
      <style>{'.fb-flat-page{width:100%;height:auto;display:block;border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.28)}'}</style>
    </main>
  );
};

export default FlatReview;
