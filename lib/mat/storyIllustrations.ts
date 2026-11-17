/** Generated conceptual illustrations, arranged in reading order in each 2 × 2 sheet. */
export const STORY_ILLUSTRATIONS = {
  self: '/images/mat/story-art/self.webp',
  udaan: '/images/mat/story-art/udaan.webp',
  schmooze: '/images/mat/story-art/schmooze.webp',
  snapdeal: '/images/mat/story-art/snapdeal.webp',
} as const;

export function drawStoryIllustration(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, index: number, x: number, y: number, w: number, h: number) {
  const sw = sheet.naturalWidth / 2, sh = sheet.naturalHeight / 2;
  const cropH = Math.min(sh, sw * h / w), cropW = Math.min(sw, sh * w / h);
  const sx = (index % 2) * sw + (sw - cropW) / 2;
  const sy = Math.floor(index / 2) * sh + (sh - cropH) / 2;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 34); ctx.clip();
  ctx.drawImage(sheet, sx, sy, cropW, cropH, x, y, w, h);
  ctx.restore();
  ctx.save(); ctx.textAlign = 'right'; ctx.font = "600 18px system-ui, sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.beginPath(); ctx.roundRect(x + w - 148, y + h - 32, 136, 23, 8); ctx.fill();
  ctx.fillStyle = '#2f4037'; ctx.fillText('AI illustration', x + w - 20, y + h - 15); ctx.restore();
}
