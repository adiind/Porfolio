import { expect, test, type Page } from '@playwright/test';
import { loadWorkIds } from './workIds';

/**
 * The way out of every case study (/work/<id>): a Close or Back control that is on screen, takes a real click, sits on
 * nothing and under nothing, and returns the visitor to "/". It was covered, or covered something, several times
 * (10d3e29b: P&G's double-diamond map under Close; e48eefaa, 508356cc: FamilySync's tab strip under Close at 390 px).
 *
 * Some case studies are their own page inside an iframe and draw their own Back control (FamilySync, Squad Up, Zero,
 * P&G's story). The check reads the open dialog and every iframe inside it, in page coordinates, so a control in the
 * parent page is compared with the controls of the story below it.
 */

const ids = await loadWorkIds();

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

/** How far the visitor scrolls (real wheel input) before each further check. Sticky strips only meet the exit later. */
const SCROLLS = [900, 2400];

type Box = { x: number; y: number; w: number; h: number };
type Exit = { name: string; box: Box; inViewport: boolean; reach: { ok: boolean; hit: string } };
type Overlap = { exit: string; other: string; box: Box };
type Layout = { exits: Exit[]; overlaps: Overlap[] } | null;

/**
 * Runs in the page. Every visible control of the open dialog and of the iframes inside it, with its visible box in page
 * coordinates (cut to its frame and to every ancestor that clips it). Boxes are measured, never hit-tested: a control
 * fully under the exit would fail a hit test and drop out of the list, which is exactly the bug.
 */
function readLayout(): Layout {
  const CONTROLS = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab]';
  const EXIT = /^(close\b|back to portfolio\b|back$)/i;
  type B = { x: number; y: number; w: number; h: number };
  const cut = (a: B, b: B): B => {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
  };
  const nameOf = (el: Element) => (el.getAttribute('aria-label') || el.textContent || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 60);
  const describe = (el: Element) => `${el.tagName.toLowerCase()} "${nameOf(el)}"`;

  const dialog = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.checkVisibility()).at(-1);
  if (!dialog) return null;

  type Found = { el: Element; doc: Document; name: string; box: B; raw: B; exit: boolean };
  const found: Found[] = [];
  const walk = (root: ParentNode, doc: Document, origin: { x: number; y: number }, frameBox: B) => {
    const win = doc.defaultView!;
    for (const el of root.querySelectorAll(CONTROLS)) {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const r = el.getBoundingClientRect();
      const raw = { x: r.x + origin.x, y: r.y + origin.y, w: r.width, h: r.height };
      let box = cut(raw, frameBox);
      if (win.getComputedStyle(el).position !== 'fixed') {
        for (let a = el.parentElement; a && a !== doc.documentElement; a = a.parentElement) {
          const s = win.getComputedStyle(a);
          if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
            const ar = a.getBoundingClientRect();
            box = cut(box, { x: ar.x + origin.x, y: ar.y + origin.y, w: ar.width, h: ar.height });
          }
          if (s.position === 'fixed') break;
        }
      }
      if (box.w < 2 || box.h < 2) continue;
      found.push({ el, doc, name: nameOf(el), box, raw, exit: EXIT.test(nameOf(el)) });
    }
    for (const frame of root.querySelectorAll('iframe')) {
      const inner = frame.contentDocument;
      if (!inner?.documentElement || !frame.checkVisibility()) continue;
      const fr = frame.getBoundingClientRect();
      const o = { x: fr.x + origin.x + frame.clientLeft, y: fr.y + origin.y + frame.clientTop };
      walk(inner, inner, o, cut({ x: o.x, y: o.y, w: frame.clientWidth, h: frame.clientHeight }, frameBox));
    }
  };
  walk(dialog, document, { x: 0, y: 0 }, { x: 0, y: 0, w: innerWidth, h: innerHeight });

  // Controls outside the dialog count when they are drawn over it (a Back pill portaled to <body>), not when the dialog
  // covers them (the home page behind it). A control counts as drawn over the dialog when one of five points of its box
  // shows itself, or shows an exit that may sit on top of it.
  const inDialog = found.length;
  walk(document, document, { x: 0, y: 0 }, { x: 0, y: 0, w: innerWidth, h: innerHeight });
  const outside = found.splice(inDialog).filter((f) => !dialog.contains(f.el) && f.doc === document);
  const exitsOutside = outside.filter((f) => f.exit).map((f) => f.el);
  const showsThrough = (f: Found) => [[.5, .5], [.15, .15], [.85, .15], [.15, .85], [.85, .85]].some(([u, v]) => {
    const hit = document.elementFromPoint(f.box.x + f.box.w * u, f.box.y + f.box.h * v);
    return hit !== null && (f.el === hit || f.el.contains(hit) || exitsOutside.some((exit) => exit.contains(hit)));
  });
  found.push(...outside.filter(showsThrough));

  // a real pointer at the exit's centre: the top page first, then down through each iframe under it
  const reach = (target: Found) => {
    let doc: Document = document;
    let x = target.raw.x + target.raw.w / 2;
    let y = target.raw.y + target.raw.h / 2;
    for (;;) {
      const hit = doc.elementFromPoint(x, y);
      if (!hit) return { ok: false, hit: 'nothing' };
      if (hit === target.el || target.el.contains(hit)) return { ok: true, hit: describe(hit) };
      if (hit instanceof HTMLIFrameElement && hit.contentDocument && hit.contentDocument === target.doc) {
        const fr = hit.getBoundingClientRect();
        x -= fr.x + hit.clientLeft;
        y -= fr.y + hit.clientTop;
        doc = hit.contentDocument;
        continue;
      }
      return { ok: false, hit: describe(hit) };
    }
  };

  const exits = found.filter((f) => f.exit);
  const overlaps = exits.flatMap((exit) => found
    .filter((other) => other !== exit && !other.el.contains(exit.el) && !exit.el.contains(other.el))
    .map((other) => ({ other, box: cut(exit.box, other.box) }))
    .filter(({ box }) => box.w > 0.5 && box.h > 0.5)
    .map(({ other, box }) => ({ exit: exit.name, other: describe(other.el), box })));

  return {
    exits: exits.map((exit) => ({
      name: exit.name,
      box: exit.raw,
      inViewport: exit.raw.x >= 0 && exit.raw.y >= 0 && exit.raw.x + exit.raw.w <= innerWidth && exit.raw.y + exit.raw.h <= innerHeight,
      reach: reach(exit),
    })),
    overlaps,
  };
}

/**
 * Runs in the page. A spot on the case study's own text, away from every control, where a visitor might click while
 * reading (so keyboard focus moves into the story's iframe when there is one).
 */
function findReadingSpot(): { x: number; y: number; what: string } | null {
  const CONTROLS = 'a[href],button,input,select,textarea,summary,label,[role=button],[role=link],[role=tab]';
  const dialog = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.checkVisibility()).at(-1);
  if (!dialog) return null;
  const roots: { root: ParentNode; doc: Document; x: number; y: number }[] = [{ root: dialog, doc: document, x: 0, y: 0 }];
  for (const frame of dialog.querySelectorAll('iframe')) {
    if (!frame.contentDocument?.body) continue;
    const fr = frame.getBoundingClientRect();
    roots.unshift({ root: frame.contentDocument.body, doc: frame.contentDocument, x: fr.x + frame.clientLeft, y: fr.y + frame.clientTop });
  }
  for (const { root, doc, x, y } of roots) {
    for (const el of root.querySelectorAll('p, h1, h2, h3')) {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) || el.closest(CONTROLS) || el.querySelector(CONTROLS)) continue;
      const r = el.getBoundingClientRect();
      const cx = r.x + Math.min(r.width / 2, 40);
      const cy = r.y + r.height / 2;
      if (cx + x < 0 || cy + y < 0 || cx + x > innerWidth || cy + y > innerHeight) continue;
      const hit = doc.elementFromPoint(cx, cy);
      if (hit && (hit === el || el.contains(hit)) && !hit.closest(CONTROLS)) return { x: cx + x, y: cy + y, what: `${el.tagName} ${el.textContent?.trim().slice(0, 40)}` };
    }
  }
  return null;
}

/**
 * Open the case study by its address, as a visitor with a link does, and wait until its exit is on screen and every
 * story iframe has run its scripts (a story's own Escape listener sits in scripts at the end of its page, which run after
 * its text is already on screen).
 */
async function openCaseStudy(page: Page, id: string) {
  await page.goto(`/work/${id}`, { waitUntil: 'domcontentloaded' });
  // (15 s, not the default 5: since 2026-11-24 Tailwind no longer holds the parser, so "domcontentloaded" comes about 0.6 s
  // earlier and this wait now also covers Tailwind's download and the app's own code. The control itself shows sooner than
  // before, counted from the start of the visit (1.2 s against 1.5 s on a slowed processor), but on the CI runner with four
  // browsers at once the old 5 s from this earlier starting point ran out in 8 of 48 visits.)
  await expect.poll(async () => (await page.evaluate(readLayout))?.exits.length ?? 0, {
    message: `/work/${id} shows a Close or Back control`,
    timeout: 15_000,
  }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLIFrameElement>('[role="dialog"] iframe')]
    .every((frame) => frame.contentDocument?.readyState !== 'loading')), { message: 'the story iframes have run their scripts' }).toBe(true);
}

/** The layout once nothing moves any more (scroll smoothing, reveal animations). */
async function settledLayout(page: Page): Promise<NonNullable<Layout>> {
  let last = '';
  for (let i = 0; i < 20; i += 1) {
    const layout = await page.evaluate(readLayout);
    const now = JSON.stringify(layout);
    if (now === last && layout) return layout;
    last = now;
    await page.waitForTimeout(150);
  }
  throw new Error(`the page kept moving for 3 s: ${last.slice(0, 300)}`);
}

function expectClearExit(layout: NonNullable<Layout>, where: string) {
  expect(layout.exits.length, `${where}: a Close or Back control is shown`).toBeGreaterThan(0);
  for (const exit of layout.exits) {
    expect(exit.inViewport, `${where}: "${exit.name}" lies inside the window (${JSON.stringify(exit.box)})`).toBe(true);
    expect(exit.reach.ok, `${where}: a click at the centre of "${exit.name}" reaches it, not ${exit.reach.hit}`).toBe(true);
  }
  expect(layout.overlaps, `${where}: the exit shares its box with no other control`).toEqual([]);
}

/** Home: "/", or the flat home that index.tsx sends "/" to in a browser that cannot take the 3D home (headless Chromium). */
const atHome = (url: URL) => url.pathname === '/' || url.pathname === '/home-flat/';

/**
 * Failures this test found on main when it was written (2026-11-24), left for the page owner to fix. Each case is marked
 * as expected to fail, so CI stays green while it fails and turns red once it passes: then delete its line here.
 */
const KNOWN_FAILURES: { id: string; width?: number; test: 'exit' | 'escape'; why: string }[] = [
  {
    id: 'mcdonalds-interaction-design', width: 1440, test: 'exit',
    why: 'Squad Up story: after scrolling, its "Full case study" link (top left, inside the iframe) sits under the Back pill',
  },
  {
    id: 'mcdonalds-interaction-design', test: 'escape',
    why: 'Squad Up story: once a click puts focus inside the iframe, Escape does nothing (unlock.js only listens during its intro)',
  },
];
const knownFailure = (id: string, width: number, kind: 'exit' | 'escape') =>
  KNOWN_FAILURES.find((f) => f.id === id && f.test === kind && (f.width === undefined || f.width === width))?.why;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const id of ids) {
      test(`/work/${id}: the exit is clear while scrolling and a click on it goes home`, async ({ page }) => {
        const known = knownFailure(id, viewport.width, 'exit');
        test.fail(Boolean(known), known);
        await openCaseStudy(page, id);
        expectClearExit(await settledLayout(page), 'on arrival');

        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        for (const distance of SCROLLS) {
          await page.mouse.wheel(0, distance);
          expectClearExit(await settledLayout(page), `after scrolling ${distance}px more`);
        }

        const [exit] = (await settledLayout(page)).exits;
        await page.mouse.click(exit.box.x + exit.box.w / 2, exit.box.y + exit.box.h / 2);
        await expect(page).toHaveURL(atHome);
      });

      test(`/work/${id}: Escape goes home, on arrival and after a click in the story`, async ({ page, context }) => {
        const known = knownFailure(id, viewport.width, 'escape');
        test.fail(Boolean(known), known);
        await openCaseStudy(page, id);
        await page.keyboard.press('Escape');
        await expect(page).toHaveURL(atHome);

        page = await context.newPage();
        await openCaseStudy(page, id);
        let spot: { x: number; y: number; what: string } | null = null;
        await expect.poll(async () => (spot = await page.evaluate(findReadingSpot)), { message: 'some text of the case study to click on' }).not.toBeNull();
        await page.mouse.click(spot!.x, spot!.y);
        await page.keyboard.press('Escape');
        test.info().annotations.push({ type: 'clicked before Escape', description: spot!.what });
        await expect(page).toHaveURL(atHome);
      });
    }
  });
}
