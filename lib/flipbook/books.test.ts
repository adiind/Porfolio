import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLIP_BOOKS, FLIP_BOOKS_BY_SLUG, OTHER_BOOKS } from '../../data/flipbooks';
import { LIVE_SCENES, liveSceneFor } from './live';
import { PROJECTS_BY_ID } from '../../data/projects';
import { pgMetrics } from '../../data/pgStory';

const publicFile = (src: string) => new URL(`../../public${src}`, import.meta.url);

const ALL_BOOKS = [...FLIP_BOOKS, ...OTHER_BOOKS];

const textOf = (book: (typeof FLIP_BOOKS)[number]): string => JSON.stringify(
  book.pages.map((page) => [page.kicker, page.word, page.title, page.body, page.stats, page.steps, page.note, page.art.alt, page.cta?.label]),
);

describe('flip books', () => {
  it('gives every book its own address', () => {
    // the books that lie on the home page's mat, in the order they lie there
    expect(FLIP_BOOKS.map((book) => book.slug)).toEqual(['surya', 'jarvis', 'muse', 'bambu']);
    expect(OTHER_BOOKS.map((book) => book.slug)).toEqual(['builds', 'squad-up', 'familysync', 'pg']);
    expect(FLIP_BOOKS_BY_SLUG.size).toBe(ALL_BOOKS.length);
  });

  it('points every link at a real case study', () => {
    for (const book of ALL_BOOKS) {
      const links = book.pages.filter((page) => page.cta).map((page) => page.cta!.href);
      // Surya and Muse have no page of their own (Adi, 2026-11-17): no "Open" button anywhere in their books
      if (book.slug === 'surya' || book.slug === 'muse') {
        expect(links).toEqual([]);
        expect(book.projectId).toBeUndefined();
        continue;
      }
      // Jarvis's button goes to its GitHub (Adi, 2026-11-17)
      if (book.slug === 'jarvis') {
        expect(links).toEqual(['https://github.com/adiind/diy-jarvis']);
        expect(book.link?.href).toBe('https://github.com/adiind/diy-jarvis');
        continue;
      }
      expect(links.length).toBeGreaterThan(0);
      if (book.slug === 'bambu') {
        expect(links).toEqual(Array(2).fill('https://drive.google.com/file/d/145pRL8-cY6QNTtiyWkvXoO8g3F3i8G_Z/view?usp=drive_web'));
        continue;
      }
      for (const href of links) {
        if (href === 'https://github.com/adiind/diy-jarvis') continue; // (Jarvis has no page: its GitHub)
        const id = href.replace('/work/', '');
        expect(href.startsWith('/work/')).toBe(true);
        expect(PROJECTS_BY_ID.has(id), href).toBe(true);
      }
      if (book.projectId) {
        expect(PROJECTS_BY_ID.has(book.projectId)).toBe(true);
        expect(links).toEqual([`/work/${book.projectId}`]);
      } else {
        // a book of projects: every page opens its own project, but Surya's (it has no page of its own)
        expect(links.length).toBe(book.pages.filter((page) => !/^Surya\b/.test(page.kicker ?? '')).length);
      }
    }
  });

  it('gives every poster page a full colour family', () => {
    for (const book of ALL_BOOKS) for (const page of book.pages) {
      if (page.layout !== 'poster') continue;
      expect(page.tone, page.id).toBeDefined();
      for (const value of Object.values(page.tone!)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('only uses pictures and cut-outs that exist', () => {
    for (const book of ALL_BOOKS) for (const page of book.pages) {
      expect(existsSync(publicFile(page.art.src)), page.art.src).toBe(true);
      if (page.art.matte) expect(existsSync(publicFile(page.art.matte)), page.art.matte).toBe(true);
      if (page.wordImage) expect(existsSync(publicFile(page.wordImage.src)), page.wordImage.src).toBe(true);
    }
  });

  it('only names live scenes that exist, and their pictures are on disk', () => {
    const live = ALL_BOOKS.flatMap((book) => book.pages.filter((page) => page.live));
    expect(live.length).toBeGreaterThan(0);
    for (const page of live) {
      const scene = liveSceneFor(page);
      expect(scene, page.live).not.toBeNull();
      for (const src of scene!.sources) expect(existsSync(publicFile(src)), src).toBe(true);
    }
    // every page of the Surya book is alive: a cover, then a story page facing each picture page
    const book = FLIP_BOOKS_BY_SLUG.get('surya')!;
    expect(book.pages.map((page) => page.live)).toEqual([
      'surya-cover',
      'surya-story-why', 'surya-awake',
      'surya-story-form', 'surya-roots',
      'surya-story-body', 'surya-layers',
      'surya-story-light', 'surya-glow',
      'surya-story-flowers', 'surya-bloom',
      'surya-story-brain', 'surya-whole',
      'surya-story-house', 'surya-home',
      'surya-story-learned', 'surya-end',
    ]);
    // the Muse book: a cover, then a story page facing each of the seven idea-words, then the last page
    expect(FLIP_BOOKS_BY_SLUG.get('muse')!.pages.map((page) => page.live)).toEqual([
      'muse-cover',
      'muse-story-why', 'muse-tangible',
      'muse-story-how', 'muse-orchestrate',
      'muse-story-model', 'muse-imagine',
      'muse-story-specs', 'muse-fit',
      'muse-story-pouch', 'muse-real',
      'muse-story-build', 'muse-snap',
      'muse-story-button', 'muse-button',
      'muse-end',
    ]);
    expect(Object.keys(LIVE_SCENES).sort()).toEqual([...new Set(live.map((page) => page.live!))].sort());
  });

  it('binds the Surya book as spreads: a story page on the left of every picture page', () => {
    const book = FLIP_BOOKS_BY_SLUG.get('surya')!;
    expect(book.spread).toBe(true);
    expect(book.pages.length % 2).toBe(1);
    expect(book.pages.map((page) => page.word)).toEqual([
      'Surya', 'Why', 'Awake', 'Form', 'Roots', 'Body', 'Layers', 'Light', 'Glow', 'Flowers', 'Bloom', 'Brain', 'Whole', 'House', 'Home', 'Learned', 'Home wall',
    ]);
    book.pages.forEach((page, index) => {
      // left-hand pages (and the cover) carry their own words; picture pages are captioned by the page shell
      if (index % 2 === 1) expect(page.selfCaptioned, page.id).toBe(true);
      else if (index > 0) expect(page.selfCaptioned, page.id).toBeFalsy();
    });
    // it lies on the home page's own mat, so opening it from the home page stays on one surface
    expect(book.surface).toBe('mat');
    expect(book.table).toBeUndefined();
  });

  it('shows the real Surya: Adi\'s photographs and files, nothing generated standing in for the piece', () => {
    const book = FLIP_BOOKS_BY_SLUG.get('surya')!;
    const sources = book.pages.flatMap((page) => liveSceneFor(page)?.sources ?? []);
    // the generated look-alikes of the piece live in project-worlds: none of them is used here
    for (const src of sources) expect(src).not.toMatch(/project-worlds|hero-alpha|cutout/);
    const parts = sources.filter((src) => src.includes('/surya/parts/'));
    expect([...new Set(parts)].map((src) => src.split('/').pop()).sort()).toEqual([
      'button.webp', 'display.webp', 'engrave.webp', 'flowers.webp', 'held.webp', 'product.webp', 'radar.webp', 'sandblaster.webp', 'stack.webp', 'walkup.webp', 'wall.webp', 'window.webp',
    ]);
  });

  it('keeps the Surya book to what is known about the piece', () => {
    const book = FLIP_BOOKS_BY_SLUG.get('surya')!;
    const text = textOf(book);
    const project = PROJECTS_BY_ID.get('surya')!;
    // the numbers are the firmware's: a 32 by 8 matrix, 68 lights on the rim, and their sum
    expect(text).toContain('32 by 8');
    expect(text).toContain('68 more lights');
    expect(text).toContain('324 lights');
    expect(32 * 8 + 68).toBe(324);
    // the three choices are the ones in his project notes, in plain words
    expect(project.decisions?.map((item) => item.decision)).toEqual([
      'Micro DC Motors vs Servo Motors', 'Physical Motion vs Screen-Based Display', 'Laser-Cut Wood Layers vs 3D-Printed Structure',
    ]);
    expect(text).toContain('small DC motors, not servos');
    expect(text).toContain('movement, not a screen');
    expect(text).toContain('wood layers, not a 3D-printed body');
    // the last lesson: his own long sentence stays in his notes but is cut from the book (2026-11-17, read for AI-sounding text);
    // the book keeps the plain facts from the same notes
    const lesson = 'low, ambient motion can communicate availability and care more clearly than explicit information';
    expect(project.reflection?.text).toContain(lesson);
    expect(text).not.toContain(lesson);
    expect(text).toContain('slow, steady motion felt calm and alive');
    // the house: what his own write-up of the presence system says, and no more
    expect(text).toContain('Home Assistant');
    expect(text).toContain('77 inches for 3 seconds');
    // never said: who the three people are or where they live, what the wood is, how big the piece is
    expect(text).not.toMatch(/delhi|seattle|chicago|mumbai|mother|father|sister|brother|plywood|birch|\bmm\b|\binch(es)? (wide|tall|across)/i);
    expect(text).not.toMatch(/wi-?fi|bluetooth|alexa|password/i);
    expect(book.pages.find((page) => page.id === 'home')!.title).toBe('It now connects to my house.');
  });

  it('gives every page a word, a caption and a picture description', () => {
    for (const book of ALL_BOOKS) {
      expect(book.pages.length).toBeGreaterThanOrEqual(3);
      for (const page of book.pages) {
        expect(page.word.trim().length).toBeGreaterThan(1);
        expect(page.kicker.trim().length).toBeGreaterThan(3);
        expect(page.title.trim().length).toBeGreaterThan(8);
        expect(page.art.alt.trim().length).toBeGreaterThan(12);
      }
      expect(new Set(book.pages.map((page) => page.id)).size).toBe(book.pages.length);
    }
  });

  it('keeps the P&G book inside the approved confidentiality boundary', () => {
    const book = FLIP_BOOKS_BY_SLUG.get('pg')!;
    const text = textOf(book);
    expect(text).not.toMatch(/pantene|sahara|no-rinse|spigot|adjustable-dose/i);
    // the only number cleared for public use is the count of in-home visits
    const stats = book.pages.flatMap((page) => page.stats ?? []);
    expect(stats).toEqual(pgMetrics);
    expect(text).toContain('Under NDA');
    // the room pictures are illustrations, and every P&G page says so
    for (const page of book.pages) expect(page.note).toBe('Illustrated context · not field documentation');
    for (const page of book.pages) expect(page.art.src.startsWith('/images/pg/rooms/')).toBe(true);
  });

  it('stays in plain words', () => {
    for (const book of ALL_BOOKS) {
      expect(textOf(book)).not.toMatch(/leverage|delve|tapestry|robust|seamless|innovative|journey of discovery|empowered|reimagining|testament to/i);
    }
  });
});

describe('the Jarvis book', () => {
  const book = FLIP_BOOKS_BY_SLUG.get('jarvis')!;
  const PLAIN = /leverage|delve|tapestry|robust|seamless|innovative|journey of discovery|empowered|reimagining|testament to/i;

  it('opens at /book/jarvis, while /book still opens Surya', () => {
    expect(book).toBeDefined();
    expect(book.link?.href).toBe('https://github.com/adiind/diy-jarvis');
    // the shell opens FLIP_BOOKS[0] for /book and for an unknown address
    expect(FLIP_BOOKS[0].slug).toBe('surya');
    // and it lies on the home page's mat beside Surya, on the same surface
    expect(FLIP_BOOKS.map((item) => item.slug)).toContain('jarvis');
    expect(book.surface).toBe('mat');
  });

  it('binds its pages like Surya\'s: a cover, then a story page facing a picture page', () => {
    expect(book.pages.map((page) => page.id)).toEqual([
      'cover', 'sensor', 'present', 'voice', 'listen', 'why', 'here', 'lights', 'answer', 'messages', 'control', 'case', 'diy', 'end',
    ]);
    expect(book.pages.map((page) => page.live)).toEqual([
      'jarvis-cover', 'jarvis-sensor', 'jarvis-present', 'jarvis-voice', 'jarvis-listen', 'jarvis-why', 'jarvis-here',
      'jarvis-lights', 'jarvis-answer', 'jarvis-messages', 'jarvis-control', 'jarvis-case', 'jarvis-diy', 'jarvis-end',
    ]);
    expect(book.spread).toBe(true);
    expect(book.solo).toBe(true);
    // a cover, six spreads and a last page that stands alone on the left (the book builds one more leaf for it)
    expect(book.pages.length % 2).toBe(0);
    expect(book.pages.find((page) => page.id === 'sensor')!.word).toBe('Sensor');
    // the cover and every story page carry their own words; every picture page is captioned by the shell
    expect(book.pages.map((page) => Boolean(page.selfCaptioned))).toEqual(book.pages.map((_, index) => index === 0 || index % 2 === 1));
    const surya = FLIP_BOOKS_BY_SLUG.get('surya')!;
    expect([book.surface, book.table, book.board]).toEqual([surya.surface, surya.table, surya.board]);
  });

  it('registers every scene it names, and every picture and still it names is on disk', () => {
    for (const page of book.pages) {
      expect(LIVE_SCENES[page.live!], page.live).toBeDefined();
      expect(existsSync(publicFile(page.art.src)), page.art.src).toBe(true);
      for (const src of liveSceneFor(page)!.sources) expect(existsSync(publicFile(src)), src).toBe(true);
    }
  });

  it('shows the real Jarvis: his photographs, never the generated look-alikes', () => {
    const paths = book.pages.flatMap((page) => [page.art.src, ...(liveSceneFor(page)?.sources ?? [])]);
    for (const src of paths) {
      expect(src).not.toMatch(/project-worlds/);
      // the printed parts photo is kept for a later page; Surya's own pictures never load here
      expect(src).not.toMatch(/prints\.webp|\/surya\//);
    }
    // the first spread uses these three; later pages may add other photographs from the same folder (each must exist, checked above)
    const parts = paths.filter((src) => src.includes('/jarvis/parts/')).map((src) => src.split('/').pop());
    expect(parts).toEqual(expect.arrayContaining(['case.webp', 'sensor-back.webp', 'sensor.webp']));
  });

  it('says what the article and the firmware say: a PIR sensor, a 6 s timeout, never a wake word', async () => {
    const { JARVIS_STORY_TEXT } = await import('./live/jarvisStory');
    const story = JARVIS_STORY_TEXT.join(' ');
    const text = textOf(book);
    expect(story).toContain('6 s');
    expect(story).toContain('listens until 6 s after it last saw someone');
    expect(text).toContain('6 s');
    expect(text).toContain('PIR sensor');
    for (const words of [story, text]) {
      expect(words).not.toMatch(/wake[- ]?word/i);
      expect(words).not.toMatch(/wi-?fi|password|broker|mqtt/i);
    }
    // the choice and its cost are his project notes' second decision, in plain words
    const decision = PROJECTS_BY_ID.get('jarvis')!.decisions![1];
    expect(decision.tradeoff).toBe('Added a two-step interaction.');
    expect(story).toContain('two steps, not one');
  });

  it('draws the same man on the story page as on the picture page it faces', () => {
    const sources = (id: string) => liveSceneFor(book.pages.find((page) => page.id === id)!)!.sources;
    const sheet = '/images/flipbook/jarvis/present/people.webp';
    expect(sources('sensor')).toContain(sheet);
    expect(sources('present')).toContain(sheet);
  });

  it('stays in plain words, on the page as well as in the data', async () => {
    const { JARVIS_STORY_TEXT } = await import('./live/jarvisStory');
    expect(textOf(book)).not.toMatch(PLAIN);
    expect(JARVIS_STORY_TEXT.join(' ')).not.toMatch(PLAIN);
  });
});
