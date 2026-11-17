// Four short cards for the Self mat poster. Product description: agentvault.io;
// role and DeleteMe direction: Adi, 16 November 2026. Diagrams are explanatory.
import selfStory from '../../public/data/self-story.json';
export const SELF_STORY = selfStory;

const W = 620, H = 1481, PAD = 62;
const INK = '#133d32', GREEN = '#008d68';
const PAPERS = ['#f9fffc', '#c8f7df', '#084c38', '#f9fffc'];
const PANELS = ['#d9f6e8', '#9deacb', '#137858', '#d9f6e8'];
const SANS = "'FB Geist', system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}

/** A conceptual diagram, never a screenshot or a claim about the interface. */
function diagram(ctx: CanvasRenderingContext2D, index: number) {
  box(ctx, PAD, 158, W - PAD * 2, 418, 34, PANELS[index]);
  ctx.save(); ctx.strokeStyle = GREEN; ctx.fillStyle = INK; ctx.lineWidth = 7;
  if (index === 0) {
    box(ctx, 130, 240, 176, 125, 20, '#fff'); box(ctx, 335, 267, 146, 182, 19, '#fff');
    ctx.strokeStyle = GREEN; ctx.beginPath(); ctx.moveTo(191, 292); ctx.lineTo(249, 292); ctx.moveTo(191, 319); ctx.lineTo(234, 319); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(257, 397); ctx.lineTo(357, 397); ctx.lineTo(342, 381); ctx.moveTo(357, 397); ctx.lineTo(342, 413); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `650 29px ${SANS}`; ctx.fillText('AGENT', 150, 410); ctx.fillText('CHECKOUT', 346, 492);
  } else if (index === 1) {
    box(ctx, 112, 265, 128, 82, 14, '#fff'); box(ctx, 380, 265, 128, 82, 14, '#fff');
    ctx.strokeStyle = GREEN; ctx.strokeRect(265, 218, 90, 174); ctx.beginPath(); ctx.arc(310, 304, 25, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(240, 306); ctx.lineTo(263, 306); ctx.moveTo(357, 306); ctx.lineTo(380, 306); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `650 27px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('STAND-IN', 176, 412); ctx.fillText('ENCLAVE', 310, 449); ctx.fillText('CHECKOUT', 444, 412); ctx.textAlign = 'left';
  } else if (index === 2) {
    const labels = ['DIRECTION', 'TESTING', 'WORKFLOWS'];
    labels.forEach((label, i) => { const y = 216 + i * 94; box(ctx, 105 + i * 24, y, 360, 66, 18, '#fff'); ctx.fillStyle = INK; ctx.font = `650 30px ${SANS}`; ctx.fillText(label, 140 + i * 24, y + 43); });
  } else {
    box(ctx, 114, 236, 170, 165, 28, '#fff'); box(ctx, 337, 236, 170, 165, 28, '#fff');
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = `700 42px ${DISPLAY}`; ctx.fillText('Self', 199, 337); ctx.font = `700 34px ${DISPLAY}`; ctx.fillText('DeleteMe', 422, 337);
    ctx.font = `500 45px ${SANS}`; ctx.fillText('×', 310, 334); ctx.textAlign = 'left';
  }
  ctx.restore();
}

export function drawSelfStoryCard(index: number, logo: HTMLImageElement): HTMLCanvasElement {
  const card = SELF_STORY[index];
  if (!card) throw new Error('Unknown Self story card');
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas is unavailable');
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 79); ctx.clip();
  ctx.fillStyle = PAPERS[index]; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(50, 0, 0, 50, 0, 850); glow.addColorStop(0, index === 2 ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.5)'); glow.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  const dark = index === 2;
  ctx.fillStyle = dark ? '#a5f4d4' : GREEN; ctx.font = `500 36px ${SANS}`; ctx.fillText(card.kicker, PAD, 108);
  diagram(ctx, index);
  ctx.fillStyle = dark ? '#ffffff' : INK; let titleSize = 96; let title: string[] = [];
  do { ctx.font = `750 ${titleSize}px ${DISPLAY}`; title = wrap(ctx, card.title, W - 2 * PAD); if (title.length <= 3) break; titleSize -= 4; } while (titleSize > 64);
  let y = 680; title.forEach((line) => { ctx.fillText(line, PAD, y); y += titleSize * 1.06; });
  y += 30; ctx.fillStyle = dark ? '#76bda2' : '#beddd0'; ctx.fillRect(PAD, y, W - 2 * PAD, 2); y += 54;
  ctx.fillStyle = dark ? '#e5fff2' : '#31584b'; ctx.font = `400 42px ${SANS}`;
  card.lines.forEach((text) => { wrap(ctx, text, W - 2 * PAD).forEach((line) => { ctx.fillText(line, PAD, y); y += 53; }); y += 19; });
  const logoW = 155; const logoH = logoW * logo.naturalHeight / logo.naturalWidth;
  if (dark) { const tint = document.createElement('canvas'); tint.width = logoW; tint.height = logoH; const t = tint.getContext('2d'); if (t) { t.drawImage(logo, 0, 0, logoW, logoH); t.globalCompositeOperation = 'source-in'; t.fillStyle = '#ffffff'; t.fillRect(0, 0, logoW, logoH); ctx.drawImage(tint, PAD, H - PAD - logoH); } }
  else ctx.drawImage(logo, PAD, H - PAD - logoH, logoW, logoH);
  ctx.fillStyle = dark ? '#a5f4d4' : GREEN; ctx.font = `500 25px ${SANS}`; ctx.textAlign = 'right'; ctx.fillText('SELF · 2026', W - PAD, H - PAD); ctx.textAlign = 'left';
  return canvas;
}
