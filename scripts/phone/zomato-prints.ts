// Draws the Zomato bag's papers with the bag's own code (lib/mat/zomatoBagArt.ts) and hands them to
// scripts/phone/make-zomato.mjs as pictures, with the words the phone page prints (lib/mat/zomatoPhone.ts).
import { loadFlipbookFonts } from '../../lib/flipbook/pageArt';
import { TEXT, clipping, insidePrint, receipt, roundCorners } from '../../lib/mat/zomatoBagArt';
import { zomatoPhoneWords } from '../../lib/mat/zomatoPhone';

const picture = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
/** A canvas as a WebP, no wider than `max` pixels (twice a phone's width is plenty). */
function webp(source: HTMLCanvasElement, max: number, quality = 0.9) {
  const k = Math.min(1, max / source.width);
  const c = document.createElement('canvas'); c.width = Math.round(source.width * k); c.height = Math.round(source.height * k);
  const g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(source, 0, 0, c.width, c.height);
  return { w: c.width, h: c.height, data: c.toDataURL('image/webp', quality) };
}

async function main() {
  await loadFlipbookFonts();
  const mark = await picture('/images/mat/zomato/wordmark.webp');
  const U = 1400;
  const H = TEXT.projects.home; const F = TEXT.projects.friends;
  // the clipping, drawn a little narrower than the bag's so its type is larger on a phone; its links keep their places
  const clip = clipping(0.5, U * 1.3);
  const prints = {
    bill: webp(roundCorners(receipt(0.42, 1.8, U * 1.6, mark), 14), 760),
    // (the two lids' inside prints, on a narrower and deeper card than the boxes' lids, so the type is larger on a phone)
    home: webp(insidePrint(0.44 * U, 0.47 * U, U, H.title, H.lines, 'white', H.foot), 780),
    friends: webp(insidePrint(0.44 * U, 0.4 * U, U, F.title, F.lines, 'kraft', F.foot), 780),
    press: { ...webp(roundCorners(clip, 0.02 * U * 1.3), 780), regions: clip.regions ?? [] },
  };
  (window as unknown as { __prints?: unknown }).__prints = { prints, words: zomatoPhoneWords() };
  document.documentElement.dataset.ready = 'true';
}
main().catch((error) => { console.error(error); document.documentElement.dataset.ready = 'error'; });
