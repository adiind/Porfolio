#!/usr/bin/env node
/**
 * Takes the home share picture: public/images/share/home.jpg (1200x630) from the 3D home at /mat, plain, no overlay.
 *
 * Run `npm run build` first. This serves dist/ on 127.0.0.1 (any free port), opens /mat in Chromium at 1200x630 (device scale 2),
 * waits for the room to be lit (the bulb that index.html draws is switched on, drawn up and removed by components/flipbook/FlipBookApp.tsx
 * once the scene is ready, and the "Hi, I'm Adi." greeting has landed), then waits until two shots 2 s apart are the same picture.
 *
 *   node scripts/share/capture-home.mjs [--headed] [--out <file.jpg>]
 * Needs playwright and sharp (loaded from the main checkout; override with SHARE_TOOLS). Closes only the browser it opened.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tools = createRequire(process.env.SHARE_TOOLS || '/Users/adi/Portfolio/Porfolio/');
const sharp = tools('sharp');
const { chromium } = tools('playwright');
const headed = process.argv.includes('--headed');
const outArg = process.argv.indexOf('--out');
const out = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : path.join(root, 'public/images/share/home.jpg');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('dist/index.html is missing: run npm run build first');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(dist, pathname);
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html'); // the site is a single-page app
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// Chromium: the one Playwright expects if it is installed; otherwise the newest headless shell in Playwright's cache (or SHARE_CHROMIUM)
const findChromium = () => {
  if (process.env.SHARE_CHROMIUM) return process.env.SHARE_CHROMIUM;
  if (fs.existsSync(chromium.executablePath())) return undefined;
  const cache = path.join(process.env.HOME || '', 'Library/Caches/ms-playwright');
  const shells = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort((x, y) => Number(y.split('-')[1]) - Number(x.split('-')[1])) : [];
  for (const d of shells) { const f = path.join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (fs.existsSync(f)) return f; }
  return undefined;
};
const executablePath = findChromium();
const browser = await chromium.launch({ headless: !headed, ...(executablePath ? { executablePath } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  await page.goto(`${base}/mat`, { waitUntil: 'load' });
  const t0 = Date.now();
  const log = (what) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(5)} s  ${what}`);
  // 1. the bulb was drawn by index.html: it must appear first (proves the dark room started), then be switched on and removed
  await page.waitForSelector('#mat-bulb', { state: 'attached', timeout: 15000 }).then(() => log('dark room: bulb is up'), () => log('bulb never seen (a fast load removes it before it shows)'));
  await page.waitForFunction(() => !document.getElementById('mat-bulb'), null, { timeout: 90000 });
  log('lit: the bulb was switched on (is-on), drawn up (is-away) and removed');
  const state = await page.evaluate(() => ({ url: location.pathname, w: innerWidth, h: innerHeight, canvases: document.querySelectorAll('canvas').length, hello: !!document.getElementById('mat-hello') }));
  log(`state ${JSON.stringify(state)}`);
  if (!/^\/mat\/?$/.test(state.url)) throw new Error(`redirected to ${state.url}`);
  if (!state.canvases) throw new Error('no canvas: the 3D home did not draw');
  await page.waitForTimeout(3500); // the light spreads, the greeting lands on the mat, the camera settles
  // "the same picture": compared small and blurred, so the mat's fine ambient shimmer (light drifting on the cloth) does not count,
  // but anything that still moves (a card landing, the camera, the greeting) does
  const small = async (png) => sharp(png).blur(3).resize(150, 79).raw().toBuffer();
  const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
  let a = await small(await page.screenshot({ type: 'png' })), settled = false, shot;
  for (let tries = 0; tries < 8 && !settled; tries++) {
    await page.waitForTimeout(2000);
    shot = await page.screenshot({ type: 'png' });
    const b = await small(shot);
    const d = diff(a, b);
    if (process.env.SHARE_DEBUG_DIR) fs.writeFileSync(path.join(process.env.SHARE_DEBUG_DIR, `shot-${tries}.png`), await sharp(shot).resize(600, 315).png().toBuffer());
    log(`two shots 2 s apart differ by ${d.toFixed(3)} (of 255, blurred and shrunk; same picture below 0.5)`);
    settled = d < 0.5;
    a = b;
  }
  if (!settled) throw new Error('the picture never settled');
  const stats = await sharp(shot).stats();
  const mean = stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3;
  const sd = stats.channels.slice(0, 3).reduce((s, c) => s + c.stdev, 0) / 3;
  log(`brightness mean ${mean.toFixed(1)}, spread ${sd.toFixed(1)} (a black or blank frame would be near 0 / 0)`);
  if (mean < 40 || sd < 20) throw new Error('the frame looks black or blank');
  const png = await sharp(shot).resize(1200, 630, { kernel: 'lanczos3' }).png().toBuffer();
  let jpg = png;
  for (const quality of [90, 86, 82, 78, 74]) { jpg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer(); if (jpg.length < 300 * 1024) break; }
  fs.writeFileSync(out, jpg);
  log(`wrote ${out} (${jpg.length} bytes) with ${headed ? 'headed' : 'headless'} Chromium; page errors: ${problems.length ? problems.join(' | ') : 'none'}`);
} finally {
  await browser.close();
  server.close();
}
