import { drawStoryIllustration } from './storyIllustrations';
// Source: Snapdeal role and project details in data/timeline.ts; 14% attribution in data/resume-2026.json.
import snapdealStory from '../../public/data/snapdeal-story.json';
export const SNAPDEAL_STORY = snapdealStory;
const W = 620, H = 1481, PAD = 62;
const SANS = "'FB Geist', system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";
const BACK = ['#ffffff', '#c72b43', '#ffffff', '#171717'];
const PANEL = ['#f9e4e7', '#f5c9d0', '#f9e4e7', '#3b3b3b'];
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) { const next = line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > width) { out.push(line); line = word; } else line = next; }
  if (line) out.push(line); return out;
}
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x,y,w,h,20); ctx.fill(); }
export function drawSnapdealStoryCard(index: number, illustration?: HTMLImageElement): HTMLCanvasElement {
  const card = SNAPDEAL_STORY[index]; if (!card) throw new Error('Unknown Snapdeal story card');
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); if (!c) throw new Error('Canvas is unavailable');
  c.beginPath(); c.roundRect(0,0,W,H,79); c.clip(); c.fillStyle = BACK[index]; c.fillRect(0,0,W,H);
  const dark = index === 1 || index === 3;
  const glow = c.createRadialGradient(50,0,0,50,0,850); glow.addColorStop(0,dark?'rgba(255,255,255,.06)':'rgba(255,255,255,.35)'); glow.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=glow; c.fillRect(0,0,W,H);
  c.fillStyle=dark?'#ffffff':'#b5273b'; c.font=`500 36px ${SANS}`; c.fillText(card.kicker,PAD,108);
  pill(c,PAD,158,W-2*PAD,418,PANEL[index]);
  c.fillStyle='#bd243f'; c.textAlign='center';
  if (index === 1) { c.font=`750 174px ${DISPLAY}`; c.fillText('14%',W/2,390); c.font=`600 28px ${SANS}`; c.fillText('SELLER AD REVENUE',W/2,462); }
  else { const labels = index === 0 ? ['CPC','TRANSACTION','BANNERS'] : index === 2 ? ['WAREHOUSE','INVENTORY','PROCUREMENT'] : ['DATA','ANALYSIS','FINANCE']; labels.forEach((label,i)=>{ pill(c,125,205+i*100,370,70,'#ffffff'); c.fillStyle='#7f1c32'; c.font=`650 30px ${SANS}`; c.fillText(label,W/2,250+i*100); }); }
  if (illustration) drawStoryIllustration(c, illustration, index, PAD, 158, W - PAD * 2, 418);
  c.textAlign='left'; c.fillStyle=dark?'#ffffff':'#171717'; let px=96; let title: string[]=[];
  do { c.font=`750 ${px}px ${DISPLAY}`; title=wrap(c,card.title,W-PAD*2); if(title.length<=3 && title.every(line => c.measureText(line).width <= W-PAD*2)) break; px-=4; } while(px>44);
  let y=680; title.forEach(line=>{c.fillText(line,PAD,y);y+=px*1.06;}); y+=30; c.fillStyle=dark?'#ffffff80':'#dbc7c7'; c.fillRect(PAD,y,W-2*PAD,2); y+=54;
  c.fillStyle=dark?'#ffffff':'#30272a'; let bodySize = 42; let blocks: string[][] = [];
  for (; bodySize > 30; bodySize -= 2) {
    c.font=`400 ${bodySize}px ${SANS}`; blocks = card.lines.map(text => wrap(c, text, W - 2 * PAD));
    const height = blocks.reduce((sum, lines) => sum + lines.length * bodySize * 1.26 + 14, 0);
    if (y + height <= H - 165) break;
  }
  c.font=`400 ${bodySize}px ${SANS}`; blocks = card.lines.map(text => wrap(c, text, W - 2 * PAD));
  blocks.forEach(lines => { lines.forEach(line => { c.fillText(line, PAD, y); y += bodySize * 1.26; }); y += 14; });
  c.fillStyle=dark?'#ffffff':'#b5273b'; c.font=`700 38px ${DISPLAY}`; c.fillText('snapdeal',PAD,H-PAD); c.font=`500 25px ${SANS}`; c.textAlign='right'; c.fillText('2020–2022',W-PAD,H-PAD);
  return cv;
}
