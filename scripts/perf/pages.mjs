// node pages.mjs <phone|desk> <slow?> url...   — plain pages: first paint, biggest paint, bytes, blocking time
import { launch } from './launch.mjs';
const [kind, slowFlag, ...urls] = process.argv.slice(2);
const kill = setTimeout(() => { console.log('hard timeout'); process.exit(2); }, 280000);
const browser = await launch();
const vp = kind === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
for (const url of urls) {
  const context = await browser.newContext(vp); const page = await context.newPage(); const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (slowFlag === 'slow') { await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  const reqs = new Map();
  cdp.on('Network.requestWillBeSent', (e) => reqs.set(e.requestId, { url: e.request.url, type: e.type, bytes: 0 }));
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  await page.addInitScript(() => { window.__m = { long: [], cls: 0 };
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__m.long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__m.lcp = Math.round(e.startTime); window.__m.lcpWhat = (e.url || '').split('/').pop().slice(0, 40) || (e.element && e.element.tagName); })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__m.cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch {} });
  try { await page.goto(url, { waitUntil: 'load', timeout: 90000 }); } catch (e) { console.log(url, 'load timeout'); }
  await page.waitForTimeout(slowFlag === 'slow' ? 4000 : 2500);
  const m = await page.evaluate(() => { const nav = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint'); return { ...window.__m, ttfb: Math.round(nav.responseStart), fcp: Math.round(fcp?.startTime ?? -1), load: Math.round(nav.loadEventEnd), path: location.pathname, frames: [...document.querySelectorAll('iframe')].map((f) => f.src.replace(location.origin, '').slice(0, 50)) }; });
  const all = [...reqs.values()]; const kb = (t) => Math.round(all.filter((r) => !t || r.type === t).reduce((n, r) => n + r.bytes, 0) / 1024);
  console.log(JSON.stringify({ url: url.replace(/^https?:\/\/[^/]+/, ''), kind, slow: slowFlag === 'slow', landed: m.path, ttfb: m.ttfb, fcp: m.fcp, lcp: m.lcp, lcpWhat: m.lcpWhat, load: m.load, cls: +m.cls.toFixed(3), tbt: m.long.reduce((n, d) => n + Math.max(0, d - 50), 0), longMax: Math.max(0, ...m.long), req: all.length, kb: kb(), imgKb: kb('Image'), jsKb: kb('Script'), fontKb: kb('Font'), hosts: [...new Set(all.map((r) => { try { return new URL(r.url).host; } catch { return ''; } }))].filter((h) => h && !/adidesign/.test(h)), frames: m.frames, top: all.sort((a, b) => b.bytes - a.bytes).slice(0, 4).map((r) => `${Math.round(r.bytes / 1024)}k ${r.url.split('/').pop().slice(0, 34)}`) }));
  await context.close();
}
await browser.close(); clearTimeout(kill);
