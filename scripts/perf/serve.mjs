// node serve.mjs <dir> <port> — a stand-in for the live host: gzip for text, long cache for /assets/, ETag + 304 for the rest,
// index.html for page addresses. Bound to 127.0.0.1 only.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const [dir, port] = process.argv.slice(2); const root = path.resolve(dir);
const types = { html: 'text/html; charset=utf-8', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', ttf: 'font/ttf', woff2: 'font/woff2', glb: 'model/gltf-binary', mp3: 'audio/mpeg', mp4: 'video/mp4', pdf: 'application/pdf', webmanifest: 'application/manifest+json', txt: 'text/plain', xml: 'text/xml', wasm: 'application/wasm' };
const zipped = new Map();
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch {}
  if (!fs.existsSync(file)) { if (path.extname(p)) { res.writeHead(404).end('not found'); return; } file = path.join(root, 'index.html'); }
  const st = fs.statSync(file); const ext = path.extname(file).slice(1).toLowerCase(); const etag = `"${st.size}-${Math.round(st.mtimeMs)}"`;
  const head = { 'Content-Type': types[ext] || 'application/octet-stream', ETag: etag, 'Cache-Control': p.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, head).end(); return; }
  const text = /^(html|js|mjs|css|json|svg|ttf|txt|xml|webmanifest|glb)$/.test(ext);
  if (text && /gzip/.test(req.headers['accept-encoding'] || '')) {
    let z = zipped.get(file + etag); if (!z) { z = zlib.gzipSync(fs.readFileSync(file), { level: 6 }); zipped.set(file + etag, z); }
    res.writeHead(200, { ...head, 'Content-Encoding': 'gzip', 'Content-Length': z.length }).end(z); return;
  }
  res.writeHead(200, { ...head, 'Content-Length': st.size }); fs.createReadStream(file).pipe(res);
}).listen(+port, '127.0.0.1', () => console.log('serving', root, 'on', port));
