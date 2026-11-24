import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

export type HostAnswer = { serve: string } | { redirect: string } | null;

/**
 * How adidesign.org's host (Cloudflare static assets, html_handling "auto-trailing-slash") answers a page address,
 * given which files it holds. `null`: not a page of its own, so the caller's usual handling applies.
 */
export function liveHostAnswer(pathname: string, has: (file: string) => boolean): HostAnswer {
  const file = pathname.replace(/^\/+/, '');
  if (file === '' || file.split('/').includes('..')) return null;

  if (file === 'index.html' || file.endsWith('/index.html')) {
    return has(file) ? { redirect: `/${file.slice(0, -'index.html'.length)}` } : null;
  }
  if (file.endsWith('.html')) return has(file) ? { redirect: `/${file.slice(0, -'.html'.length)}` } : null;

  if (file.endsWith('/')) {
    if (has(`${file}index.html`)) return { serve: `${file}index.html` };
    const page = `${file.slice(0, -1)}.html`;
    return has(page) ? { redirect: `/${file.slice(0, -1)}` } : null;
  }
  if (has(`${file}.html`)) return { serve: `${file}.html` };
  return has(`${file}/index.html`) ? { redirect: `/${file}/` } : null;
}

function answerLikeLiveHost(folder: string): Connect.NextHandleFunction {
  const has = (file: string) => fs.statSync(path.join(folder, file), { throwIfNoEntry: false })?.isFile() ?? false;
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname); } catch { return next(); }
    const answer = liveHostAnswer(pathname, has);
    if (!answer) return next();
    if ('redirect' in answer) {
      res.statusCode = 307;
      res.setHeader('Location', answer.redirect + url.search);
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(path.join(folder, answer.serve)).pipe(res);
  };
}

export function liveHostPageAddresses(): Plugin {
  return {
    name: 'live-host-page-addresses',
    configureServer(server) {
      if (server.config.publicDir) server.middlewares.use(answerLikeLiveHost(server.config.publicDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(answerLikeLiveHost(path.resolve(server.config.root, server.config.build.outDir)));
    },
  };
}
