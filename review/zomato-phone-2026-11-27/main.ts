// A picture of the phone answer for Zomato (prototype, not live): the bag's own papers, drawn by the same code and the
// same words as the 3D bag (lib/mat/zomatoBagArt.ts, lib/mat/rescueBoard.ts), laid out as one scroll.
import { loadFlipbookFonts } from '../../lib/flipbook/pageArt';
import { TEXT, clipping, insidePrint, receipt, roundCorners } from '../../lib/mat/zomatoBagArt';
import { createRescueBoard } from '../../lib/mat/rescueBoard';

const picture = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
const put = (id: string, ...nodes: Node[]) => document.getElementById(id)!.append(...nodes);
const shot = (src: string, alt: string) => { const wrap = document.createElement('div'); wrap.className = 'shot'; const img = document.createElement('img'); img.src = src; img.alt = alt; wrap.append(img); return wrap; };

async function main() {
  await loadFlipbookFonts();
  const [mark, offer] = await Promise.all([picture('/images/mat/zomato/wordmark.webp'), picture('/images/mat/food-rescue/offer.webp')]);
  const U = 1400;
  // the bill
  put('bill', roundCorners(receipt(0.42, 1.8, U * 1.6, mark), 14));
  // the two boxes: the lid's inside print, then the screen that lies in the box
  const H = TEXT.projects.home; const F = TEXT.projects.friends;
  put('home', insidePrint(0.566 * U, 0.4 * U, U, H.title, H.lines, 'white', H.foot), shot('/images/mat/zomato/homepage.webp', 'The Zomato home screen'));
  put('friends', insidePrint(0.586 * U, 0.4 * U, U, F.title, F.lines, 'kraft', F.foot), shot('/images/mat/zomato/friends.webp', 'Recommendations from Friends, as launched'));
  // Food Rescue: the phone-size order log, finished (all seven events, the result, "My part")
  const board = createRescueBoard('narrow', { offer });
  board.draw({ step: 6, sinceStep: 9, done: true, sinceDone: 9 });
  put('rescue', board.canvas);
  // the press clipping, each headline a real link
  const clip = clipping(0.6, U * 1.3);
  const press = document.getElementById('press')!;
  press.append(roundCorners(clip, 0.02 * U * 1.3));
  (clip.regions ?? []).forEach((r) => { const a = document.createElement('a'); a.className = 'hit'; a.href = r.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', r.source); a.style.cssText = `top:${r.y0 * 100}%;height:${(r.y1 - r.y0) * 100}%;left:${12 + r.x0 * 76}%;width:${(r.x1 - r.x0) * 76}%`; press.append(a); });
  document.documentElement.dataset.ready = 'true';
}
main().catch((error) => { console.error(error); document.documentElement.dataset.ready = 'error'; });
