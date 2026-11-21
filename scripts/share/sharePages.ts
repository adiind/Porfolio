/**
 * Link previews: one copy of dist/index.html per address, each with its own title, description, address and picture.
 *
 * Preview robots (LinkedIn, WhatsApp, iMessage) do not run JavaScript, so they read these tags from the raw HTML. The site is a
 * single-page app whose host answers every address with the same index.html; this plugin runs inside `vite build` (closeBundle) and
 * writes the other files next to it, so it does not matter which build command the host runs.
 *
 * Shape: /work/glyph is written as dist/work/glyph.html. The host (Cloudflare static assets, default html_handling) serves that at
 * /work/glyph with status 200 and no redirect; a dist/work/glyph/index.html would redirect to /work/glyph/. Verified with wrangler dev.
 *
 * The address list, words and picture names are in scripts/share/routes.generated.json, written by
 * scripts/share/make-share-images.mjs from the site's own data (projects, timeline, books). Everything else in each copy stays
 * byte-identical to index.html, so the app boots exactly as before. No dependencies: plain fs and string work.
 *
 * This file imports nothing from the app on purpose: the build must never break because an app module changed. Whether the list has
 * gone stale (a new project, timeline stop or book) is checked by lib/sharePages.test.ts instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export type SharePage = {
  /** The address, e.g. /work/glyph. "/" is the home page (index.html itself). */
  path: string;
  /** The address the page names as its own (an alias names the address it stands for). */
  canonical: string;
  title: string;
  description: string;
  /** File name under public/images/share/. */
  image: string;
  imageAlt: string;
};

const SITE = 'https://adidesign.org';
const IMAGE_DIR = '/images/share/';

/** HTML-escape a value that goes inside an attribute or the title element. */
export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Replace the one tag that matches `pattern`; stops the build when it is not there exactly once. */
const swap = (html: string, name: string, pattern: RegExp, replacement: string): string => {
  const hits = html.match(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`));
  if (!hits || hits.length !== 1) throw new Error(`share-pages: index.html must hold ${name} exactly once (found ${hits ? hits.length : 0})`);
  return html.replace(pattern, () => replacement);
};

const metaProperty = (property: string) => new RegExp(`<meta property="${property}" content="[^"]*"\\s*/?>`);
const metaName = (name: string) => new RegExp(`<meta name="${name}" content="[^"]*"\\s*/?>`);

/** index.html with this page's tags in place of the home page's. */
export const renderSharePage = (html: string, page: SharePage): string => {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const url = escapeHtml(SITE + page.canonical);
  const image = escapeHtml(`${SITE}${IMAGE_DIR}${page.image}`);
  const alt = escapeHtml(page.imageAlt);
  let out = html;
  out = swap(out, '<title>', /<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = swap(out, 'meta description', metaName('description'), `<meta name="description" content="${description}" />`);
  out = swap(out, 'link canonical', /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
  out = swap(out, 'og:title', metaProperty('og:title'), `<meta property="og:title" content="${title}" />`);
  out = swap(out, 'og:description', metaProperty('og:description'), `<meta property="og:description" content="${description}" />`);
  out = swap(out, 'og:url', metaProperty('og:url'), `<meta property="og:url" content="${url}" />`);
  out = swap(out, 'og:image', metaProperty('og:image'), `<meta property="og:image" content="${image}" />`);
  out = swap(out, 'og:image:alt', metaProperty('og:image:alt'), `<meta property="og:image:alt" content="${alt}" />`);
  out = swap(out, 'twitter:title', metaName('twitter:title'), `<meta name="twitter:title" content="${title}" />`);
  out = swap(out, 'twitter:description', metaName('twitter:description'), `<meta name="twitter:description" content="${description}" />`);
  out = swap(out, 'twitter:image', metaName('twitter:image'), `<meta name="twitter:image" content="${image}" />`);
  return out;
};

export function sharePreviewPages(): Plugin {
  let outDir = 'dist';
  let root = process.cwd();
  return {
    name: 'share-preview-pages',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const routesFile = path.resolve(root, 'scripts/share/routes.generated.json');
      if (!fs.existsSync(routesFile)) {
        this.warn('share-pages: scripts/share/routes.generated.json is missing; run node scripts/share/make-share-images.mjs. No per-page copies written.');
        return;
      }
      const pages = JSON.parse(fs.readFileSync(routesFile, 'utf8')).pages as SharePage[];
      // Nothing here may stop the build: this is a nicety, the site is not. Every copy is made in memory first; if any one
      // cannot be made (index.html lost a tag, a picture is missing), none is written and every address keeps the home tags,
      // exactly as before this plugin existed. lib/sharePages.test.ts checks the same things and does fail.
      try {
        const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
        const copies: Array<[string, string]> = [];
        for (const page of pages) {
          if (page.path === '/') continue; // the home page is index.html itself
          if (!/^\/[a-z0-9][a-z0-9/-]*$/.test(page.path)) throw new Error(`unsafe address ${page.path}`);
          if (!fs.existsSync(path.join(root, 'public', 'images', 'share', page.image))) {
            throw new Error(`public/images/share/${page.image} is missing (needed by ${page.path})`);
          }
          copies.push([path.join(outDir, `${page.path.slice(1)}.html`), renderSharePage(html, page)]);
        }
        for (const [file, text] of copies) {
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, text);
        }
        console.log(`share-pages: wrote ${copies.length} per-address copies of index.html`);
      } catch (error) {
        this.warn(`share-pages: no per-address copies written (${error instanceof Error ? error.message : String(error)})`);
      }
    },
  };
}
