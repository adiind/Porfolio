// Draws the courier bag's folded shirt with the bag's own code (lib/mat/snapdeal/parcelArt.ts) and hands it to
// scripts/phone/make-snapdeal.mjs as a picture, with the words the phone page prints (lib/mat/snapdealPhone.ts).
import { loadFlipbookFonts } from '../../lib/flipbook/pageArt';
import { drawTeePhoto } from '../../lib/mat/snapdeal/parcelArt';
import { snapdealPhoneWords } from '../../lib/mat/snapdealPhone';

const picture = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
function webp(source: HTMLCanvasElement, max: number, quality = 0.88) {
  const k = Math.min(1, max / source.width);
  const c = document.createElement('canvas'); c.width = Math.round(source.width * k); c.height = Math.round(source.height * k);
  const g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(source, 0, 0, c.width, c.height);
  return { w: c.width, h: c.height, data: c.toDataURL('image/webp', quality) };
}

async function main() {
  await loadFlipbookFonts();
  const dir = '/images/mat/snapdeal/';
  const [mark, word, cut, shade] = await Promise.all(['snapdeal-mark', 'snapdeal-wordmark', 'tee-cut', 'tee-shade-crop'].map((n) => picture(`${dir}${n}.webp`)));
  const prints = { tee: webp(drawTeePhoto(cut, shade, mark, word), 720) };
  (window as unknown as { __prints?: unknown }).__prints = { prints, words: snapdealPhoneWords() };
  document.documentElement.dataset.ready = 'true';
}
main().catch((error) => { console.error(error); document.documentElement.dataset.ready = 'error'; });
