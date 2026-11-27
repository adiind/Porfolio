// Writes Zomato's phone scroll: the pictures of the bag's papers and the words file the phone home page reads.
//
//   npx vite --port 4901 --strictPort --host 127.0.0.1      (in another terminal)
//   node scripts/phone/make-zomato.mjs [http://127.0.0.1:4901]
//
// The papers are drawn by the 3D bag's own code in scripts/phone/zomato-prints.ts; the bag's picture is taken from the
// real 3D home. Run it again whenever the bag's words or papers change (lib/mat/zomatoPhone.test.ts says when).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:4901';
const out = path.resolve('public/home-flat');
const dir = path.join(out, 'assets/zomato');
mkdirSync(dir, { recursive: true });
const save = (name, dataUrl) => writeFileSync(path.join(dir, name), Buffer.from(dataUrl.split(',')[1], 'base64'));

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, executablePath: process.env.PW_CHROME || undefined, args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'] });
try {
  // 1. the papers
  const page = await browser.newPage();
  await page.goto(`${base}/scripts/phone/zomato-prints.html`);
  await page.waitForFunction(() => !!document.documentElement.dataset.ready, null, { timeout: 60000 });
  if (await page.evaluate(() => document.documentElement.dataset.ready) !== 'true') throw new Error('The papers could not be drawn');
  const { prints, words } = await page.evaluate(() => window.__prints);
  const pictures = {};
  for (const [name, p] of Object.entries(prints)) {
    save(`${name}.webp`, p.data);
    pictures[name] = { src: `/home-flat/assets/zomato/${name}.webp`, w: p.w, h: p.h, ...(p.regions ? { regions: p.regions.map((r) => ({ x0: +r.x0.toFixed(4), x1: +r.x1.toFixed(4), y0: +r.y0.toFixed(4), y1: +r.y1.toFixed(4), href: r.href, source: r.source })) } : {}) };
  }
  // 2. the bag itself, open on the real 3D home (everything out, the camera's own overview), cut to the bag
  const mat = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await mat.goto(`${base}/?debug`);
  await mat.waitForSelector('[data-lit="true"]', { timeout: 60000 }); await mat.waitForTimeout(2500);
  await mat.evaluate(() => { [...document.querySelectorAll('button')].find((b) => /delivery rider's bag/.test(b.textContent || ''))?.click(); });
  await mat.waitForFunction(() => window.__bag?.layer.state === 'open', null, { timeout: 30000 }); await mat.waitForTimeout(2500);
  const shot = await mat.screenshot({ type: 'png', clip: { x: 262, y: 0, width: 478, height: 590 } });
  const bag = await page.evaluate(async (png) => { const img = new Image(); img.src = png; await img.decode(); const c = document.createElement('canvas'); c.width = 760; c.height = Math.round(img.height * 760 / img.width); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); return { w: c.width, h: c.height, data: c.toDataURL('image/webp', 0.86) }; }, `data:image/png;base64,${shot.toString('base64')}`);
  save('bag.webp', bag.data);
  pictures.bag = { src: '/home-flat/assets/zomato/bag.webp', w: bag.w, h: bag.h };
  // 3. pictures the scroll reuses as they are (the bag's own files): their sizes, so the phone page keeps their room
  const reused = { homeShot: '/images/mat/zomato/homepage.webp', friendsShot: '/images/mat/zomato/friends.webp', photo: '/images/mat/zomato/eternal.webp', offer: '/images/mat/food-rescue/offer.webp', paperBag: '/images/mat/food-rescue/bag.webp' };
  for (const [name, src] of Object.entries(reused)) pictures[name] = { src, ...(await page.evaluate(async (u) => { const img = new Image(); img.src = u; await img.decode(); return { w: img.naturalWidth, h: img.naturalHeight }; }, src)) };
  writeFileSync(path.join(out, 'zomato-scroll.json'), `${JSON.stringify({ note: 'Written by scripts/phone/make-zomato.mjs from lib/mat/zomatoPhone.ts. Do not edit by hand.', words, pictures }, null, 1)}\n`);
  console.log('wrote', Object.keys(pictures).join(', '), 'and zomato-scroll.json');
} finally { await browser.close(); }
