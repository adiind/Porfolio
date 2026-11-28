/**
 * Snapdeal on the phone home page: the words. The phone gets the flat page, not the 3D mat, so the courier bag cannot
 * be torn open there; what comes out of it (the invoice, the shirt's tag, the stock box's label) is laid out as one
 * scroll instead (public/home-flat/self-cards.js). The bag prints every word of the Snapdeal timeline entry (Adi,
 * 2026-11-23: "Every single word"), read from data/timeline.ts by lib/mat/snapdeal/pageWords.ts; this is the same PAGE.
 * The phone sets the words as real text in the papers' look, because the bag's pictures shrunk to a phone's width put
 * their smallest type at 6 to 9 px.
 *
 * `node scripts/phone/make-snapdeal.mjs` writes these words and the shirt's picture to public/home-flat/. A unit test
 * (snapdealPhone.test.ts) fails when the words here and the written file differ: run the script again.
 */
import { PAGE } from './snapdeal/pageWords';

export function snapdealPhoneWords() {
  return JSON.parse(JSON.stringify({ company: PAGE.company, ...PAGE })) as typeof PAGE & { company: string };
}
