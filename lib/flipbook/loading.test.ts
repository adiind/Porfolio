import { describe, expect, it } from 'vitest';
import { FLIP_BOOKS } from '../../data/flipbooks';
import { insideOrder, pageSources } from './pageArt';

/**
 * The home stage lights up on the live book's closed cover and fetches the rest of the book after (FlipBookApp.tsx,
 * useCoverFirst and "the inside of the live book"). These check the order that rest is asked for in.
 */
describe('loading a book on the home stage', () => {
  const allOf = (book: (typeof FLIP_BOOKS)[number]) => new Set([...(book.table ? [book.table] : []), ...book.pages.flatMap((_, index) => pageSources(book, index))]);

  it('waits for nothing but the cover before the light comes on', () => {
    for (const book of FLIP_BOOKS) {
      const cover = pageSources(book, 0);
      // the cover's own picture and what its live scene draws with: a few files, never the inside of the book
      expect(cover.length, book.slug).toBeGreaterThan(0);
      expect(cover.length, book.slug).toBeLessThanOrEqual(3);
      expect(cover, book.slug).toContain(book.pages[0].art.src);
    }
  });

  it('asks for the pages next to the cover first, each picture once', () => {
    for (const book of FLIP_BOOKS) {
      const order = insideOrder(book);
      expect(order.map((page) => page.index), book.slug).toEqual(book.pages.map((_, index) => index).slice(1));
      const asked = order.flatMap((page) => page.sources);
      expect(new Set(asked).size, book.slug).toBe(asked.length);
      const cover = new Set(pageSources(book, 0));
      expect(asked.filter((src) => cover.has(src)), book.slug).toEqual([]);
      // with the cover, that is every picture of the book
      expect(new Set([...cover, ...(book.table ? [book.table] : []), ...asked]), book.slug).toEqual(allOf(book));
    }
  });

  it('keeps the pictures a page shares with the cover counted as that page\'s own', () => {
    const surya = FLIP_BOOKS[0];
    const shared = pageSources(surya, 1).filter((src) => pageSources(surya, 0).includes(src));
    // (Surya's first story page draws the same product photograph as the cover: it is not asked for again)
    expect(shared.length).toBeGreaterThan(0);
    expect(insideOrder(surya)[0].sources.some((src) => shared.includes(src))).toBe(false);
  });

  it('can ask for a few pages only, in page order', () => {
    const book = FLIP_BOOKS[1];
    expect(insideOrder(book, [2, 1, 0]).map((page) => page.index)).toEqual([0, 1, 2]);
    expect(insideOrder(book, [0])[0].sources).toEqual([]);
  });
});
