// node record.mjs <port> <waitAfterLitMs> — click the record soon after the light on an ordinary line; where does the visitor end up?
import { launch } from './launch.mjs';
const [port, wait = '800'] = process.argv.slice(2); const base = `http://127.0.0.1:${port}`;
const kill = setTimeout(() => { console.log('hard timeout'); process.exit(2); }, 80000);
const browser = await launch(); const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage(); const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (20 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
await page.goto(base + '/'); await page.waitForSelector('.fb-root[data-lit="true"]', { timeout: 40000 }); await page.waitForTimeout(+wait);
await page.mouse.move(928, 169); await page.waitForTimeout(60); const t0 = Date.now(); await page.mouse.click(928, 169);
let how = 'NOTHING HAPPENED in 15 s';
for (let i = 0; i < 150; i++) { await page.waitForTimeout(100);
  const st = await page.evaluate(() => { const f = document.querySelector('iframe[src*="sound-youve"]'); return { path: location.pathname, shown: !!f && getComputedStyle(f).opacity === '1', own: !!document.querySelector('canvas') && /^\/work\/sound/.test(location.pathname) && !document.querySelector('.fb-root') }; }).catch(() => null);
  if (!st) continue;
  if (st.shown) { how = `board shown in place, ${Date.now() - t0} ms after the click`; break; }
  if (st.own) { how = `page change to the board (the older way), ${Date.now() - t0} ms after the click`; break; } }
await page.waitForTimeout(1200); await page.screenshot({ path: `record-early-${port}-${wait}.png` });
console.log(port, 'click', wait, 'ms after light:', how, '| at', page.url().replace(base, ''), '| errors', errors.length);
await browser.close(); clearTimeout(kill);
