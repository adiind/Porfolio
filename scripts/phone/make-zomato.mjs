// Writes Zomato's phone scroll: the pictures of the bag's papers and the words file the phone home page reads.
//
//   npx vite --port 4901 --strictPort --host 127.0.0.1      (in another terminal)
//   node scripts/phone/make-zomato.mjs [http://127.0.0.1:4901]
//
// The papers are drawn by the 3D bag's own code in scripts/phone/zomato-prints.ts (never a screenshot of the 3D home).
// Run it again whenever the bag's words or papers change (lib/mat/zomatoPhone.test.ts says when).
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
  // 2. pictures the scroll reuses as they are (the bag's own files): their sizes, so the phone page keeps their room
  const reused = { homeShot: '/images/mat/zomato/homepage.webp', friendsShot: '/images/mat/zomato/friends.webp', photo: '/images/mat/zomato/eternal.webp', offer: '/images/mat/food-rescue/offer.webp', paperBag: '/images/mat/food-rescue/bag.webp' };
  for (const [name, src] of Object.entries(reused)) pictures[name] = { src, ...(await page.evaluate(async (u) => { const img = new Image(); img.src = u; await img.decode(); return { w: img.naturalWidth, h: img.naturalHeight }; }, src)) };
  writeFileSync(path.join(out, 'zomato-scroll.json'), `${JSON.stringify({ note: 'Written by scripts/phone/make-zomato.mjs from lib/mat/zomatoPhone.ts. Do not edit by hand.', words, pictures }, null, 1)}\n`);
  console.log('wrote', Object.keys(pictures).join(', '), 'and zomato-scroll.json');
} finally { await browser.close(); }
