#!/usr/bin/env node
/**
 * Makes everything the link previews need that is not made by the build:
 *   - scripts/share/routes.generated.json  (every address with its title, description and picture; read by scripts/share/sharePages.ts)
 *   - public/images/share/<name>.jpg       (1200x630, cut from each page's real local picture; home.jpg comes from capture-home.mjs)
 *   - public/sitemap.xml                   (the same address list)
 *
 * Run from anywhere:  node scripts/share/make-share-images.mjs
 * Needs sharp and esbuild. They are not dependencies of this repo; they are loaded from the main checkout (override with SHARE_TOOLS).
 * Words are copied from the data files, never written here. A page with no usable local picture shares home.jpg.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tools = createRequire(process.env.SHARE_TOOLS || '/Users/adi/Portfolio/Porfolio/');
const sharp = tools('sharp');
const esbuild = tools('esbuild');

const SITE = 'https://adidesign.org';
const OUT = path.join(root, 'public/images/share');
const W = 1200, H = 630, MAX_BYTES = 300 * 1024, MIN_SOURCE_WIDTH = 600;

// Local pictures that are real files but must not be a share picture, and why. (Reported in the review sheet as "fallback".)
const NOT_USABLE = {
  '/images/portfolio_hero.png': 'a screenshot of the old dark site',
  '/images/portfolio_projects.png': 'a screenshot of the old dark site',
  '/images/udaan_id.jpg': 'a photo of an employee ID card',
  '/images/snapdeal_id.jpg': 'a photo of an employee ID card with an ID number',
  '/images/zero_hero_banner.png': 'an empty "No live session yet." screen',
  '/images/schmooze_team.jpg': 'a group photo of colleagues',
  '/images/helios.jpg': 'a tall poster: a wide cut loses the lamp or its name',
};
// Where to aim the crop when the picture is taller or wider than 1.9:1 (sharp positions; default is "attention").
const CROP = { glyph: 'top', helios: 'centre', solopump: 'centre', 'experience-ms-edi': 'centre' };

// 1. The data the site runs on, bundled out of TypeScript.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'share-collect-'));
const bundle = path.join(tmp, 'collect.mjs');
await esbuild.build({
  entryPoints: [path.join(root, 'scripts/share/collect.entry.ts')], bundle: true, platform: 'node', format: 'esm', outfile: bundle,
  logLevel: 'warning', absWorkingDir: root, define: { 'import.meta.env.DEV': 'false' },
  loader: { '.webp': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
});
const data = await import(pathToFileURL(bundle).href);
fs.rmSync(tmp, { recursive: true, force: true });

// 2. The home page's own words (index.html), so /mat and /classic repeat them.
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grab = (re, what) => { const m = re.exec(indexHtml); if (!m) throw new Error(`index.html: no ${what}`); return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'); };
const HOME_TITLE = grab(/<title>([^<]*)<\/title>/, 'title');
const HOME_DESC = grab(/<meta name="description" content="([^"]*)"/, 'description');
const HOME_ALT = grab(/<meta property="og:image:alt" content="([^"]*)"/, 'og:image:alt');

const SUFFIX = ' · Adi Agarwal';
/** Cut to about 160 characters at a sentence or clause end; shorter text is untouched. */
const trim = (text) => {
  if (text.length <= 160) return text;
  const head = text.slice(0, 161);
  for (const re of [/[.!?](?=\s)/g, /[;:](?=\s)/g, /,(?=\s)/g]) {
    let cut = -1, m;
    while ((m = re.exec(head))) cut = m.index;
    if (cut > 60) return head.slice(0, cut).replace(/[,;:]+$/, '') + (/[.!?]/.test(head[cut]) ? head[cut] : '.');
  }
  throw new Error(`cannot trim at a clause end: ${text}`);
};

const localFile = (url) => (url && url.startsWith('/') ? path.join(root, 'public', url) : null);

const pages = [];
const home = { path: '/', canonical: '/', kind: 'home', title: HOME_TITLE, description: HOME_DESC, imageKey: null, imageAlt: HOME_ALT };
pages.push(home);
// /mat and /classic are the home page under another address: they name / as their own and stay out of the sitemap.
pages.push({ ...home, path: '/mat', canonical: '/', kind: 'home', noSitemap: true });
pages.push({ ...home, path: '/classic', canonical: '/', kind: 'home', noSitemap: true });

for (const p of data.PROJECTS) {
  pages.push({ path: `/work/${p.id}`, canonical: `/work/${p.id}`, kind: 'project', title: p.hero.title + SUFFIX, description: trim(p.hero.oneLiner), imageKey: p.id, imageSrc: p.heroImage, imageAlt: p.hero.title });
}
for (const [slug, id] of Object.entries(data.SLUG_ALIASES)) {
  const p = data.PROJECTS.find((x) => x.id === id);
  pages.push({ path: `/work/${slug}`, canonical: `/work/${id}`, kind: 'alias', title: p.hero.title + SUFFIX, description: trim(p.hero.oneLiner), imageKey: p.id, imageSrc: p.heroImage, imageAlt: p.hero.title, noSitemap: true });
}
for (const t of data.TIMELINE_DATA) {
  pages.push({ path: `/experience/${t.id}`, canonical: `/experience/${t.id}`, kind: 'experience', title: `${t.title}, ${t.company}${SUFFIX}`, description: trim(t.summary), imageKey: `experience-${t.id}`, imageSrc: t.imageUrl, imageAlt: `${t.title}, ${t.company}` });
}
for (const slug of data.SHIP_BOOKS) {
  const b = data.FLIP_BOOKS.find((x) => x.slug === slug);
  if (!b) throw new Error(`SHIP_BOOKS lists ${slug} but data/flipbooks.ts has no such book`);
  pages.push({ path: `/book/${slug}`, canonical: `/book/${slug}`, kind: 'book', title: b.title + SUFFIX, description: trim(b.meta), imageKey: null, imageAlt: HOME_ALT });
}

// 3. One picture per page: the real local one, cut to 1200x630, or home.jpg.
fs.mkdirSync(OUT, { recursive: true });
const made = new Map(); // imageKey -> file name
for (const page of pages) {
  page.fallback = true; page.source = null; page.why = '';
  page.image = 'home.jpg';
  if (page.imageKey && page.imageSrc) {
    const file = localFile(page.imageSrc);
    if (!file) page.why = 'its picture is a remote address';
    else if (NOT_USABLE[page.imageSrc]) page.why = `its picture is ${NOT_USABLE[page.imageSrc]}`;
    else if (!fs.existsSync(file)) page.why = 'its picture file is missing';
    else {
      const meta = await sharp(file).metadata();
      if (meta.width < MIN_SOURCE_WIDTH) page.why = `its picture is only ${meta.width} px wide`;
      else {
        const name = `${page.imageKey}.jpg`;
        if (!made.has(page.imageKey)) {
          let quality = 84, buffer;
          do {
            buffer = await sharp(file).rotate().resize(W, H, { fit: 'cover', position: CROP[page.imageKey] || sharp.strategy.attention }).jpeg({ quality, mozjpeg: true }).toBuffer();
            quality -= 4;
          } while (buffer.length > MAX_BYTES && quality > 40);
          if (buffer.length > MAX_BYTES) throw new Error(`${name} is ${buffer.length} bytes`);
          fs.writeFileSync(path.join(OUT, name), buffer);
          made.set(page.imageKey, name);
        }
        page.image = name; page.fallback = false; page.source = page.imageSrc;
      }
    }
  } else if (page.kind === 'experience') page.why = 'its only image is a company logo, or it has none';
  else if (page.kind === 'book') page.why = 'books have no picture of their own in the data';
  if (page.kind === 'home') page.fallback = false; // the home pages use home.jpg because it is theirs
  if (page.fallback) page.imageAlt = HOME_ALT;
}
if (!fs.existsSync(path.join(OUT, 'home.jpg'))) console.warn('NOTE: public/images/share/home.jpg is missing; run scripts/share/capture-home.mjs');

const out = pages.map(({ path: p, canonical, kind, title, description, image, imageAlt, fallback, source, why, noSitemap }) => ({ path: p, canonical, kind, title, description, image, imageAlt, fallback, source, why, ...(noSitemap ? { noSitemap } : {}) }));
fs.writeFileSync(path.join(root, 'scripts/share/routes.generated.json'), JSON.stringify({ note: 'Written by scripts/share/make-share-images.mjs. Do not edit by hand.', pages: out }, null, 2) + '\n');

// 4. The sitemap: the same addresses, home first (the alias /work/zero is not listed: it names /work/zero-my-ai as its address).
const urls = out.filter((p) => !p.noSitemap).map((p) => `  <url>\n    <loc>${SITE}${p.path === '/' ? '/' : p.path}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${p.path === '/' ? '1.0' : '0.8'}</priority>\n  </url>`);
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

for (const p of out) console.log(`${p.path.padEnd(42)} ${p.image.padEnd(32)} ${p.fallback ? 'fallback: ' + p.why : ''}`);
console.log(`\n${out.length} addresses, ${made.size} own pictures`);
