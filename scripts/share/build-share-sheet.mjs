#!/usr/bin/env node
/**
 * Review sheet for the link previews: every address with its share picture (about 400 px wide), then its address, title and description
 * in plain dark text on white, and a note where the page falls back to home.jpg. Home first, 3 columns, split into several images
 * when taller than 4000 px.
 *
 *   node scripts/share/build-share-sheet.mjs <output-folder>      (writes share-sheet.png, share-sheet-2.png, ...)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tools = createRequire(process.env.SHARE_TOOLS || '/Users/adi/Portfolio/Porfolio/');
const { chromium } = tools('playwright');
const sharp = tools('sharp');
const outDir = path.resolve(process.argv[2] || '.');
fs.mkdirSync(outDir, { recursive: true });

const pages = JSON.parse(fs.readFileSync(path.join(root, 'scripts/share/routes.generated.json'), 'utf8')).pages;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PER_SHEET = 30; // all in one sheet while it stays under about 4000 px tall; otherwise lower this
const cell = (p) => `<div class="cell"><img src="${pathToFileURL(path.join(root, 'public/images/share', p.image)).href}">
  <div class="addr">${esc(p.path)}${p.canonical !== p.path ? ` <span class="note">(address of ${esc(p.canonical)})</span>` : ''}</div>
  <div class="title">${esc(p.title)}</div><div class="desc">${esc(p.description)}</div>
  ${p.fallback ? `<div class="note">fallback: home.jpg (${esc(p.why)})</div>` : ''}</div>`;
const html = (items) => `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#fff;color:#161616;font:14px/1.4 -apple-system,Helvetica,Arial,sans-serif;width:1272px}
.grid{display:grid;grid-template-columns:repeat(3,400px);gap:28px 36px}
.cell img{width:400px;height:210px;display:block;border:1px solid #ddd;object-fit:cover}
.addr{font:600 13px ui-monospace,Menlo,monospace;margin-top:8px}.title{font-weight:700;margin-top:4px}.desc{margin-top:2px}.note{color:#666;font-size:12px;margin-top:3px}
</style><div class="grid">${items.map(cell).join('')}</div>`;

const browser = await chromium.launch(await (async () => {
  const exe = chromium.executablePath();
  if (fs.existsSync(exe)) return {};
  const cache = path.join(process.env.HOME || '', 'Library/Caches/ms-playwright');
  const d = fs.readdirSync(cache).filter((x) => x.startsWith('chromium_headless_shell-')).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))[0];
  return { executablePath: path.join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') };
})());
try {
  for (let i = 0, n = 1; i < pages.length; i += PER_SHEET, n++) {
    const page = await browser.newPage({ viewport: { width: 1320, height: 800 } });
    const tmp = path.join(outDir, `.sheet-${n}.html`);
    fs.writeFileSync(tmp, html(pages.slice(i, i + PER_SHEET)));
    await page.goto(pathToFileURL(tmp).href);
    await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    const file = path.join(outDir, n === 1 ? 'share-sheet.png' : `share-sheet-${n}.png`);
    await page.screenshot({ path: file, fullPage: true });
    fs.unlinkSync(tmp);
    await page.close();
    const m = await sharp(file).metadata();
    console.log(file, `${m.width}x${m.height}`);
  }
} finally {
  await browser.close();
}
