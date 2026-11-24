// node flows.mjs <base> <flow> [w h dpr cpu]   flows: idle | scroll | click:<x>,<y>:<name>
import { launch } from './launch.mjs';
import { mkdirSync } from 'node:fs';
const [base, flow, w = '1440', h = '900', dpr = '2', cpu = '1'] = process.argv.slice(2);
const kill = setTimeout(() => { console.log(JSON.stringify({ flow, error: 'hard timeout' })); process.exit(2); }, 110000);
const browser = await launch();
const context = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable'); await cdp.send('Performance.enable');
if (+cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu });
const reqs = new Map();
cdp.on('Network.requestWillBeSent', (e) => reqs.set(e.requestId, { url: e.request.url, type: e.type, wall: e.wallTime * 1000, bytes: 0 }));
cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
await page.addInitScript(() => {
  window.__long = []; window.__frames = []; window.__events = [];
  new MutationObserver(() => { if (!window.__litAt && document.querySelector('.fb-root[data-lit="true"]')) window.__litAt = [Date.now(), performance.now()]; }).observe(document, { subtree: true, attributes: true, childList: true });
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__events.push({ n: e.name, start: Math.round(e.startTime), delay: Math.round(e.processingStart - e.startTime), proc: Math.round(e.processingEnd - e.processingStart), dur: Math.round(e.duration) }))).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {}
  let last = 0; const tick = (t) => { if (last) window.__frames.push([Math.round(t), +(t - last).toFixed(1)]); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
});
const framesStat = (frames) => { const d = frames.map((f) => f[1]).sort((a, b) => a - b); const q = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))]; return { n: d.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: d[d.length - 1], over33: d.filter((x) => x > 33.4).length, over50: d.filter((x) => x > 50).length, over100: d.filter((x) => x > 100).length, frozenMs: Math.round(d.filter((x) => x > 50).reduce((n, x) => n + x, 0)) }; };
await page.goto(base + '/', { waitUntil: 'commit' });
await page.waitForSelector('.fb-root[data-lit="true"]', { timeout: 40000 });
const [litWall, litPerf] = await page.evaluate(() => window.__litAt);
const out = { flow, vp: `${w}x${h}@${dpr}`, cpu: +cpu, lit: Math.round(litPerf) };
if (flow === 'idle') {
  await page.waitForTimeout(12000);
  const after = [...reqs.values()].filter((r) => r.wall > litWall);
  out.after12s = { files: after.length, kb: Math.round(after.reduce((n, r) => n + r.bytes, 0) / 1024), top: after.sort((a, b) => b.bytes - a.bytes).slice(0, 14).map((r) => `${Math.round(r.bytes / 1024)}k +${((r.wall - litWall) / 1000).toFixed(1)}s ${r.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 70)}`) };
  const long = (await page.evaluate(() => window.__long)).filter(([at]) => at > litPerf);
  out.longAfterLit = { n: long.length, total: long.reduce((n, [, d]) => n + d, 0), list: long.map(([at, d]) => `${d}@+${at - Math.round(litPerf)}`) };
  // idle cost: 4 s with nobody touching anything
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const f0 = await page.evaluate(() => window.__frames.length);
  await page.waitForTimeout(4000);
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const fr = await page.evaluate((n) => window.__frames.slice(n), f0);
  out.idle4s = { mainThreadBusyPct: Math.round(((m1.TaskDuration - m0.TaskDuration) / 4) * 100), scriptPct: Math.round(((m1.ScriptDuration - m0.ScriptDuration) / 4) * 100), layoutCount: m1.LayoutCount - m0.LayoutCount, styleRecalcs: m1.RecalcStyleCount - m0.RecalcStyleCount, frames: framesStat(fr), heapMB: Math.round(m1.JSHeapUsedSize / 1048576), nodes: m1.Nodes };
  out.iframes = await page.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => `${f.src.replace(location.origin, '').slice(0, 80)} ${f.getBoundingClientRect().width}x${f.getBoundingClientRect().height} vis=${getComputedStyle(f).visibility}/${getComputedStyle(f).opacity}/${getComputedStyle(f).display}`));
} else if (flow === 'scroll') {
  if (process.env.SETTLE) await page.waitForTimeout(Number(process.env.SETTLE));
  const f0 = await page.evaluate(() => window.__frames.length);
  await page.mouse.move(+w / 2, +h / 2);
  const t0 = Date.now(); let steps = 0;
  while (Date.now() - t0 < 5000) { await page.mouse.wheel(0, 90); steps++; await page.waitForTimeout(12); }
  const res = await page.evaluate((n) => ({ frames: window.__frames.slice(n), y: Math.round(scrollY), maxY: document.documentElement.scrollHeight - innerHeight, long: window.__long, cards: document.querySelectorAll('.tm-card').length }), f0);
  out.scroll = { steps, reachedY: res.y, maxY: res.maxY, timelineCards: res.cards, frames: framesStat(res.frames), longDuring: res.long.filter(([at]) => at > litPerf).map(([at, d]) => `${d}@+${at - Math.round(litPerf)}`) };
  await page.screenshot({ path: `scroll-end-${w}-cpu${cpu}.png` });
  // back up fast
  const f1 = await page.evaluate(() => window.__frames.length);
  const t1 = Date.now(); while (Date.now() - t1 < 2500) { await page.mouse.wheel(0, -160); await page.waitForTimeout(12); }
  out.scrollUp = framesStat(await page.evaluate((n) => window.__frames.slice(n), f1));
} else if (flow.startsWith('click:')) {
  const [, xy, name] = flow.split(':'); const [x, y] = xy.split(',').map(Number);
  mkdirSync(`clicks/${name}`, { recursive: true });
  await page.waitForTimeout(Number(process.env.SETTLE || 400));
  await page.mouse.move(x, y); await page.waitForTimeout(120);
  const url0 = page.url(); const f0 = await page.evaluate(() => window.__frames.length);
  const t0 = Date.now(); const perf0 = await page.evaluate(() => performance.now());
  await page.screenshot({ path: `clicks/${name}/0000.jpg`, type: 'jpeg', quality: 60 });
  const tc = Date.now(); await page.mouse.click(x, y);
  let navAt = null; const marks = [150, 400, 800, 1300, 2000, 3000];
  for (const m of marks) { const wait = m - (Date.now() - tc); if (wait > 0) await page.waitForTimeout(wait); if (!navAt && page.url() !== url0) navAt = Date.now() - tc; try { await page.screenshot({ path: `clicks/${name}/${String(m).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 60 }); } catch {} }
  out.click = { name, x, y, urlAfter: page.url().replace(base, ''), urlChangedByMs: navAt };
  try { const r = await page.evaluate(([n, p0]) => ({ frames: window.__frames.slice(n), events: window.__events.filter((e) => e.start >= p0 - 5), long: window.__long.filter(([at]) => at >= p0).map(([at, d]) => `${d}@+${Math.round(at - p0)}`), paints: performance.getEntriesByType('paint').map((p) => `${p.name}:${Math.round(p.startTime)}`), nav: Math.round(performance.getEntriesByType('navigation')[0]?.responseStart || 0) }), [f0, perf0]); out.click.events = r.events.filter((e) => /pointerdown|pointerup|click|mousedown/.test(e.n)); out.click.long = r.long; out.click.samePage = page.url() === url0; out.click.framesAfter = (page.url() === url0) ? null : undefined; out.click.paints = r.paints; if (page.url() === url0) { const d = r.frames.map((f) => f[1]); out.click.frames = { n: d.length, max: Math.max(...d), over50: d.filter((v) => v > 50).length, first10: d.slice(0, 10) }; } } catch (e) { out.click.evalError = String(e).slice(0, 100); }
}
console.log(JSON.stringify(out));
await browser.close(); clearTimeout(kill);
