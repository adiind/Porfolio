/**
 * Readable words for robots: scripts/share/pageText.generated.json and public/llms.txt.
 *
 * The site draws its pages with JavaScript and a 3D canvas, so a robot that reads the raw HTML (LinkedIn, ChatGPT, Perplexity,
 * most AI crawlers) found a title and nothing else, and Google could not read words drawn inside the canvas. This script pulls
 * the same words the site shows out of the site's own data (projects, timeline, books) and writes them as plain text.
 * scripts/share/sharePages.ts then puts each page's words inside <div id="root"> of that page's HTML. React replaces everything
 * inside #root when the app starts, so visitors see the app exactly as before; robots get the words.
 *
 * Run: node scripts/share/make-page-text.mjs   (after changing a project, timeline stop or book)
 * lib/sharePages.test.ts fails when a share page has no words.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const esbuild = createRequire(path.join(root, 'package.json'))('esbuild');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'page-text-'));
const bundle = path.join(tmp, 'collect.mjs');
await esbuild.build({
  entryPoints: [path.join(root, 'scripts/share/collect.entry.ts')], bundle: true, platform: 'node', format: 'esm', outfile: bundle,
  logLevel: 'warning', absWorkingDir: root, define: { 'import.meta.env.DEV': 'false' },
  loader: { '.webp': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
});
const data = await import(pathToFileURL(bundle).href);
fs.rmSync(tmp, { recursive: true, force: true });

// Keys whose values are never words a person reads on the page.
const SKIP = /^(id|slug|icon|theme|themeColor|color|colors|className|image|images|heroImage|imageUrl|logoUrl|detailLogoUrl|companyUrl|src|href|url|video|poster|alt|gallery|surface|board|spread|lane|type|subtype|kind|layout|anchor|position|style|font|accent)$/i;

/** Every sentence-like string inside a value, in the order the data holds them, each once. */
const prose = (value, seen = new Set(), out = []) => {
  if (typeof value === 'string') {
    const t = value.replace(/\s+/g, ' ').trim();
    const looksLikeWords = t.length >= 25 && /\s/.test(t) && /[a-z]/i.test(t) && !/^(\/|https?:|data:|#|rgb|hsl)/i.test(t) && !/\.(png|jpe?g|webp|svg|mp4|glb|gltf)$/i.test(t);
    const key = t.toLowerCase().replace(/[.!?]+$/, '');
    if (looksLikeWords && !seen.has(key)) { seen.add(key); out.push(t); }
  } else if (Array.isArray(value)) value.forEach((v) => prose(v, seen, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (!SKIP.test(k)) prose(v, seen, out);
  }
  return out;
};

const MAX_WORDS = 1500;
const cap = (paragraphs) => {
  const kept = []; let words = 0;
  for (const p of paragraphs) { words += p.split(' ').length; if (words > MAX_WORDS) break; kept.push(p); }
  return kept;
};

const skillsOf = (x) => (Array.isArray(x.skills) ? x.skills.map((s) => (typeof s === 'string' ? s : s?.name ?? s?.label)).filter(Boolean) : []);

const pages = {};
const links = []; // for the home page and llms.txt: [path, label, one line]

for (const p of data.PROJECTS) {
  const heading = p.hero.title;
  const paragraphs = cap(prose(p));
  pages[`/work/${p.id}`] = { heading, paragraphs, skills: skillsOf(p) };
  links.push([`/work/${p.id}`, heading, p.hero.oneLiner]);
}
for (const t of data.TIMELINE_DATA) {
  const heading = `${t.title}, ${t.company}`;
  const month = (d) => { const t = d ? new Date(`${d}T00:00:00Z`) : null; return t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : (d && !/^\d/.test(d) ? d : 'now'); };
  const when = t.start ? `${month(t.start)} to ${month(t.end)}` : '';
  pages[`/experience/${t.id}`] = { heading, paragraphs: cap([when, ...prose({ headline: t.headline, summary: t.summary, bullets: t.bullets })].filter(Boolean)), skills: skillsOf(t) };
  links.push([`/experience/${t.id}`, heading, t.summary]);
}
for (const slug of data.SHIP_BOOKS) {
  const b = data.FLIP_BOOKS.find((x) => x.slug === slug);
  pages[`/book/${slug}`] = { heading: b.title, paragraphs: cap(prose({ meta: b.meta, client: b.client, pages: b.pages })), skills: [] };
  links.push([`/book/${slug}`, b.title, b.meta]);
}
for (const [slug, id] of Object.entries(data.SLUG_ALIASES)) pages[`/work/${slug}`] = pages[`/work/${id}`];

// The home page: who Adi is, then a link to every page, so a robot that lands on / can reach the rest.
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const homeDesc = (/<meta name="description" content="([^"]*)"/.exec(indexHtml) || [])[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const INTRO = [
  homeDesc,
  'Adi Agarwal (Aditya Agarwal) is a product manager who builds what he designs: AI agents, connected hardware, 3D interfaces and data products. He worked as a product and data analyst at Zomato, Udaan and Snapdeal, and is studying for an M.S. in Engineering Design Innovation at Northwestern University.',
];
pages['/'] = { heading: 'Adi Agarwal: Product Manager, AI and Analytics', paragraphs: INTRO, skills: [], links: links.map(([href, label, line]) => ({ href, label, line })) };
for (const alias of ['/mat', '/classic']) pages[alias] = pages['/'];

fs.writeFileSync(path.join(root, 'scripts/share/pageText.generated.json'), JSON.stringify({ note: 'Written by scripts/share/make-page-text.mjs. Do not edit by hand.', pages }, null, 2) + '\n');

// llms.txt: the plain-text summary AI tools look for at the site root (llmstxt.org format).
const SITE = 'https://adidesign.org';
const llms = [
  '# Adi Agarwal',
  '',
  `> ${INTRO[0]}`,
  '',
  ...INTRO.slice(1),
  '',
  'Contact: https://www.linkedin.com/in/adiind · Resume: https://adidesign.org/Adi_Agarwal_Resume_2026.pdf',
  '',
  '## Projects',
  '',
  ...links.filter(([h]) => h.startsWith('/work/')).map(([h, l, d]) => `- [${l}](${SITE}${h}): ${d}`),
  '',
  '## Experience',
  '',
  ...links.filter(([h]) => h.startsWith('/experience/')).map(([h, l, d]) => `- [${l}](${SITE}${h}): ${d}`),
  '',
  '## Project books',
  '',
  ...links.filter(([h]) => h.startsWith('/book/')).map(([h, l, d]) => `- [${l}](${SITE}${h}): ${d}`),
  '',
].join('\n');
fs.writeFileSync(path.join(root, 'public/llms.txt'), llms);

const total = Object.values(pages).reduce((n, p) => n + p.paragraphs.join(' ').split(' ').length, 0);
console.log(`page-text: ${Object.keys(pages).length} addresses, ${total} words; public/llms.txt ${llms.length} chars`);
