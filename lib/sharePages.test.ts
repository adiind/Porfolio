import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from '../scripts/share/routes.generated.json';
import { renderSharePage, type SharePage } from '../scripts/share/sharePages';
import { PROJECTS } from '../data/projects';
import { TIMELINE_DATA } from '../data/timeline';
import { SHIP_BOOKS } from './ship/books';
import { SLUG_ALIASES } from './workRoutes';

const pages = routes.pages as SharePage[];

const HEAD = `<title>Home</title>
<meta name="description" content="Home words" />
<link rel="canonical" href="https://adidesign.org/" />
<meta property="og:title" content="Home" />
<meta property="og:description" content="Home words" />
<meta property="og:url" content="https://adidesign.org/" />
<meta property="og:image" content="https://adidesign.org/images/share/home.jpg" />
<meta property="og:image:alt" content="Home" />
<meta name="twitter:title" content="Home" />
<meta name="twitter:description" content="Home words" />
<meta name="twitter:image" content="https://adidesign.org/images/share/home.jpg" />`;

describe('link preview pages', () => {
  it('lists every address the site answers for (re-run scripts/share/make-share-images.mjs when this fails)', () => {
    const known = new Set(pages.map((page) => page.path));
    const live = [
      ...PROJECTS.map((project) => `/work/${project.id}`),
      ...Object.keys(SLUG_ALIASES).map((slug) => `/work/${slug}`),
      ...TIMELINE_DATA.map((item) => `/experience/${item.id}`),
      ...SHIP_BOOKS.map((slug) => `/book/${slug}`),
    ];
    expect(live.filter((address) => !known.has(address))).toEqual([]);
  });

  it('can rewrite the real index.html for every address, and every picture exists', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    for (const page of pages) {
      expect(() => renderSharePage(html, page), page.path).not.toThrow();
      expect(fs.existsSync(path.resolve(__dirname, '../public/images/share', page.image)), page.image).toBe(true);
    }
  });

  it("gives a page its own title, address and picture, escaped", () => {
    const out = renderSharePage(HEAD, {
      path: '/work/x', canonical: '/work/x', title: 'P&G "x" · Adi Agarwal', description: 'A <b> & c', image: 'x.jpg', imageAlt: 'x',
    });
    expect(out).toContain('<title>P&amp;G &quot;x&quot; · Adi Agarwal</title>');
    expect(out).toContain('<link rel="canonical" href="https://adidesign.org/work/x" />');
    expect(out).toContain('<meta property="og:image" content="https://adidesign.org/images/share/x.jpg" />');
    expect(out).toContain('<meta name="description" content="A &lt;b&gt; &amp; c" />');
    expect(out).not.toContain('Home words');
  });
});
