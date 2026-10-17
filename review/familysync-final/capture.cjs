// Screenshot harness for the FamilySync final pass.
// node review/familysync-final/capture.cjs before|after   → FamilySync sections
// node review/familysync-final/capture.cjs bench          → P&G + Squad Up, evenly spaced viewports
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const phase = process.argv[2] || 'before';
const BASE = 'http://127.0.0.1:3000';
const EXE = '/Users/adi/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const SECTIONS = [
  ['01-hero', '.hero'], ['02-context', '#context'], ['03-research', '#research'],
  ['04-synthesis', '#synthesis'], ['05-tension', '.tension'], ['06-exploration', '#exploration'],
  ['07-mypart', '#sub-agent'], ['08-testing', '#approval'], ['09-outcome', '#outcome'],
  ['10-journey', '.journey'], ['11-answers', '.answers'], ['12-end', '.credits'],
];

const settle = (f) => f.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => { i.loading = 'eager'; return i.decode().catch(() => {}); }));
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});

const scrollTo = (f, y) => f.evaluate((y) => {
  if (window.fsLenis) window.fsLenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo({ top: y, behavior: 'instant' });
}, y);

async function storyFrame(p) {
  await p.goto(`${BASE}/work/familysync-jpmorgan`);
  for (let i = 0; i < 40; i++) {
    const f = p.frames().find((fr) => fr.url().includes('story.html'));
    if (f) { await f.waitForLoadState('load'); return f; }
    await p.waitForTimeout(150);
  }
  throw new Error('story frame not found');
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const report = {};
  try {
    if (phase === 'bench') {
      for (const [name, route] of [['pg', '/work/pg-haircare'], ['squad', '/work/mcdonalds-interaction-design']]) {
        for (const width of [1440, 390]) {
          const p = await b.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
          await p.goto(BASE + route); await p.waitForTimeout(2500);
          const dir = path.join(__dirname, 'bench', `${name}-${width}`); fs.mkdirSync(dir, { recursive: true });
          const f = p.frames().find((fr) => fr.url().includes('story.html')) || p.mainFrame();
          const target = await f.evaluate(() => {
            const els = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 200 && /(auto|scroll)/.test(getComputedStyle(e).overflowY));
            const el = els.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
            const h = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - innerHeight;
            return { h, scroller: !!el };
          });
          for (let i = 0; i < 10; i++) {
            const y = Math.round(target.h * i / 9);
            await f.evaluate(({ y, scroller }) => {
              if (scroller) { const els = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 200 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); els.sort((a, b) => b.scrollHeight - a.scrollHeight)[0].scrollTop = y; }
              else window.scrollTo({ top: y, behavior: 'instant' });
              window.dispatchEvent(new Event('scroll'));
            }, { y, scroller: target.scroller });
            await p.waitForTimeout(900);
            await p.screenshot({ path: path.join(dir, `${String(i).padStart(2, '0')}.png`) });
          }
          await p.close();
        }
      }
      return;
    }

    const modes = phase === 'before' ? [[1440, false], [390, false], [1440, true], [390, true]] : [[1440, false], [390, false], [1440, true], [390, true]];
    for (const [width, reduced] of modes) {
      const key = `${width}${reduced ? '-reduced' : ''}`;
      const p = await b.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const f = await storyFrame(p);
      await p.waitForTimeout(1200);
      await settle(f);
      const dir = path.join(__dirname, phase, key); fs.mkdirSync(dir, { recursive: true });
      const checks = [];
      for (const [name, sel] of SECTIONS) {
        const y = await f.evaluate((sel) => {
          const e = document.querySelector(sel); if (!e) return null;
          return e.getBoundingClientRect().top + scrollY - (innerWidth < 1024 ? 96 : 40);
        }, sel);
        if (y === null) { checks.push({ name, missing: true }); continue; }
        // walk there in steps so scroll-driven timelines run like a real visit
        const cur = await f.evaluate(() => scrollY);
        const steps = reduced ? 1 : 6;
        for (let s = 1; s <= steps; s++) { await scrollTo(f, cur + (y - cur) * s / steps); await p.waitForTimeout(reduced ? 50 : 160); }
        await p.waitForTimeout(reduced ? 300 : 1300);
        await p.screenshot({ path: path.join(dir, `${name}.png`) });
        checks.push({ name, overflow: await f.evaluate(() => document.documentElement.scrollWidth - innerWidth) });
      }
      // My part: mid-run frame and the recipe ask at the end of the pinned climax
      for (const [name, at] of [['07b-mypart-mid', 0.45], ['07c-mypart-ask', 0.9]]) {
        await f.evaluate((at) => {
          const e = document.querySelector('#sub-agent');
          const y = document.documentElement.classList.contains('still')
            ? document.querySelector('.c-recipe').getBoundingClientRect().top + scrollY - 110
            : e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * at;
          window.fsLenis ? fsLenis.scrollTo(y, { immediate: true, force: true }) : scrollTo({ top: y, behavior: 'instant' });
        }, at);
        await p.waitForTimeout(1300);
        await p.screenshot({ path: path.join(dir, `${name}.png`) });
      }
      report[key] = {
        errors, checks,
        broken: await f.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src)),
        filters: await f.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const v = getComputedStyle(e).filter; return v && v !== 'none'; }).length),
        lenis: await f.evaluate(() => !!window.fsLenis),
        scrollTriggers: await f.evaluate(() => (window.ScrollTrigger ? ScrollTrigger.getAll().length : 0)),
      };
      await p.close();
    }
    fs.writeFileSync(path.join(__dirname, `${phase}-qa.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 1));
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
