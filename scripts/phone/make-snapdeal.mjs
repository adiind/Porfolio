// Writes Snapdeal's phone scroll: the picture of the courier bag's shirt and the words file the phone home page reads.
//
//   npx vite --port 4901 --strictPort --host 127.0.0.1      (in another terminal)
//   node scripts/phone/make-snapdeal.mjs [http://127.0.0.1:4901]
//
// The shirt is drawn by the 3D bag's own code in scripts/phone/snapdeal-prints.ts (never a screenshot of the 3D home).
// Run it again whenever the bag's words or papers change (lib/mat/snapdealPhone.test.ts says when).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:4901';
const out = path.resolve('public/home-flat');
const dir = path.join(out, 'assets/snapdeal');
mkdirSync(dir, { recursive: true });
const save = (name, dataUrl) => writeFileSync(path.join(dir, name), Buffer.from(dataUrl.split(',')[1], 'base64'));

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, executablePath: process.env.PW_CHROME || undefined, args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage();
  await page.goto(`${base}/scripts/phone/snapdeal-prints.html`);
  await page.waitForFunction(() => !!document.documentElement.dataset.ready, null, { timeout: 60000 });
  if (await page.evaluate(() => document.documentElement.dataset.ready) !== 'true') throw new Error('The shirt could not be drawn');
  const { prints, words } = await page.evaluate(() => window.__prints);
  const pictures = {};
  for (const [name, p] of Object.entries(prints)) { save(`${name}.webp`, p.data); pictures[name] = { src: `/home-flat/assets/snapdeal/${name}.webp`, w: p.w, h: p.h }; }
  // the bag's own logo files, reused as they are: their sizes, so the phone page keeps their room
  const reused = { mark: '/images/mat/snapdeal/snapdeal-mark.webp', word: '/images/mat/snapdeal/snapdeal-wordmark.webp' };
  for (const [name, src] of Object.entries(reused)) pictures[name] = { src, ...(await page.evaluate(async (u) => { const img = new Image(); img.src = u; await img.decode(); return { w: img.naturalWidth, h: img.naturalHeight }; }, src)) };
  writeFileSync(path.join(out, 'snapdeal-scroll.json'), `${JSON.stringify({ note: 'Written by scripts/phone/make-snapdeal.mjs from lib/mat/snapdealPhone.ts. Do not edit by hand.', words, pictures }, null, 1)}\n`);
  console.log('wrote', Object.keys(pictures).join(', '), 'and snapdeal-scroll.json');
} finally {
  await browser.close();
}
