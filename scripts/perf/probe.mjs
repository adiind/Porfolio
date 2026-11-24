// Speed kit (2026-11-24). Load timing of the 3D home: first paint, greeting, canvas, light starts ("dawn"), room lit, bytes, long tasks.
// Run several alternating before/after runs (ab.sh) and read medians: one run on a busy Mac can point the wrong way.
// node probe.mjs <url> <w> <h> <dpr> <cold|warm> [slow] [touch]
// Prints one JSON line: first paint, greeting, lit, bytes, long tasks, biggest requests before lit.
import { launch } from './launch.mjs';
const [url, w = '1440', h = '900', dpr = '2', mode = 'cold', ...flags] = process.argv.slice(2);
const slow = flags.includes('slow'), touch = flags.includes('touch'), cpu = Number((flags.find(f => f.startsWith('cpu')) || 'cpu1').slice(3));
const kill = setTimeout(() => { console.log(JSON.stringify({ url, error: 'hard timeout' })); process.exit(2); }, 150000);
const browser = await launch();
const context = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: touch, isMobile: false });
const init = () => {
  window.__long = []; window.__marks = {};
  const watch = new MutationObserver(() => {
    const m = window.__marks, now = performance.now();
    if (!m.lit && document.querySelector('.fb-root[data-lit="true"]')) m.lit = now;
    if (!m.hello && document.querySelector('#mat-hello.is-shown')) m.hello = now;
    if (!m.canvas && document.querySelector('canvas')) m.canvas = now;
    const bulb = document.getElementById('mat-bulb'); if (bulb) m.sawBulb = true;
    // the light starts: the page says so (data-mat-light, from 2026-11-24); older builds are read from the bulb they had
    if (!m.dawn && m.canvas && (document.documentElement.getAttribute('data-mat-light') === 'on' || (bulb && bulb.classList.contains('is-on')) || (m.sawBulb && !bulb))) m.dawn = now;
    if (!m.root && document.querySelector('#root > *')) m.root = now;
  });
  watch.observe(document, { subtree: true, attributes: true, childList: true });
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__marks.lcp = e.startTime; window.__marks.lcpEl = (e.element && (e.element.id || e.element.tagName)) || e.url; })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
};
async function visit(cacheOff) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: cacheOff });
  const net = flags.find((f) => f.startsWith('net:')); if (net) { const [, ms, mbps] = net.split(':'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: +ms, downloadThroughput: (+mbps * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 }); }
  if (slow) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const reqs = new Map();
  cdp.on('Network.requestWillBeSent', (e) => reqs.set(e.requestId, { url: e.request.url, type: e.type, t0: e.timestamp, bytes: 0, t1: 0, cached: false, prio: e.request.initialPriority }));
  cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.cached = !!e.response.fromDiskCache || !!e.response.fromPrefetchCache; r.cc = e.response.headers['cache-control'] || e.response.headers['Cache-Control']; r.enc = e.response.headers['content-encoding']; r.status = e.response.status; } });
  cdp.on('Network.requestServedFromCache', (e) => { const r = reqs.get(e.requestId); if (r) r.cached = true; });
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.t1 = e.timestamp; } });
  await page.addInitScript(init);
  let navStart = 0;
  cdp.on('Network.requestWillBeSent', (e) => { if (!navStart && e.type === 'Document') navStart = e.timestamp; });
  await page.goto(url, { waitUntil: 'commit' });
  let lit = true;
  try { await page.waitForSelector('.fb-root[data-lit="true"]', { timeout: slow ? 120000 : 40000 }); } catch { lit = false; }
  await page.waitForTimeout(300);
  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0], paint = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, p.startTime]));
    return { marks: window.__marks, long: window.__long, ttfb: nav?.responseStart, dcl: nav?.domContentLoadedEventEnd, load: nav?.loadEventEnd, fp: paint['first-paint'], fcp: paint['first-contentful-paint'], path: location.pathname };
  });
  const litAt = data.marks.lit ?? 1e9;
  const all = [...reqs.values()].map((r) => ({ ...r, start: Math.round((r.t0 - navStart) * 1000), end: r.t1 ? Math.round((r.t1 - navStart) * 1000) : null }));
  const before = all.filter((r) => r.start <= litAt);
  const sum = (list) => list.reduce((n, r) => n + (r.cached ? 0 : r.bytes), 0);
  const kind = (r) => r.type === 'Script' ? 'js' : r.type === 'Image' ? 'img' : r.type === 'Font' ? 'font' : r.type === 'Stylesheet' ? 'css' : r.type === 'Document' ? 'html' : 'other';
  const byKind = {}; for (const r of before) { const k = kind(r); byKind[k] = byKind[k] || { n: 0, kb: 0 }; byKind[k].n++; byKind[k].kb += Math.round((r.cached ? 0 : r.bytes) / 1024); }
  const longBefore = data.long.filter(([at]) => at <= litAt);
  const out = {
    url, vp: `${w}x${h}@${dpr}`, mode: cacheOff ? 'cold' : 'warm', slow, cpu, landed: data.path, lit,
    ttfb: Math.round(data.ttfb), fp: Math.round(data.fp), fcp: Math.round(data.fcp), hello: Math.round(data.marks.hello ?? -1), root: Math.round(data.marks.root ?? -1), canvas: Math.round(data.marks.canvas ?? -1), dawn: Math.round(data.marks.dawn ?? -1),
    litMs: Math.round(data.marks.lit ?? -1), lcp: Math.round(data.marks.lcp ?? -1), lcpEl: data.marks.lcpEl, dcl: Math.round(data.dcl), load: Math.round(data.load),
    reqBefore: before.length, kbBefore: Math.round(sum(before) / 1024), byKind,
    longN: longBefore.length, tbt: longBefore.reduce((n, [, d]) => n + Math.max(0, d - 50), 0), longTop: longBefore.map(([at, d]) => `${d}@${at}`).sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 8),
    hosts: [...new Set(before.map((r) => { try { return new URL(r.url).host; } catch { return ''; } }))].filter(Boolean),
  };
  if (flags.includes('detail')) out.waterfall = before.sort((a, b) => a.start - b.start).map((r) => `${String(r.start).padStart(5)}→${String(r.end ?? '?').padStart(5)} ${String(Math.round(r.bytes / 1024)).padStart(5)}k ${r.cached ? 'C' : ' '} ${kind(r).padEnd(5)} ${(r.prio || '').padEnd(8)} ${r.enc || '-'} | ${r.cc || '-'} | ${r.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 110)}`);
  await page.close();
  return out;
}
const first = await visit(true);
if (mode === 'cold') console.log(JSON.stringify(first));
else { // warm: a first visit with the cache on fills it, the second is measured
  await visit(false); console.log(JSON.stringify(await visit(false)));
}
await browser.close(); clearTimeout(kill);
