import { STORY_ILLUSTRATIONS } from '../../lib/mat/storyIllustrations';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { FLIP_BOOKS, FLIP_BOOKS_BY_SLUG } from '../../data/flipbooks';
import { createFlipBookEngine, type FlipBookEngine, type MatArrival, type StageSpec } from '../../lib/flipbook/engine';
import matStage from '../../data/matStage.json';
import HeroOverlay from '../mat/HeroOverlay';
import MatProfile from '../mat/MatProfile';
import { CAP, dropHello, helloDrawn, landHello, type HelloLanding } from '../mat/hello';

/** The home page's second screen (the timeline). Loaded after the first screen is up. */
// (the timeline drawn on the mat itself, Adi's pick 2026-11-16; components/mat/TimelineSection.tsx, the HTML one, is no longer mounted)
const TimelineMat = React.lazy(() => import('../mat/TimelineMat'));
const TimelineMatRoom = React.lazy(() => import('../mat/TimelineMat').then((module) => ({ default: module.TimelineMatRoom })));
const WorkSection = React.lazy(() => import('../mat/WorkSection'));
import type { FlipBook } from '../../lib/flipbook/types';
import { trackEvent } from '../../lib/analytics';
import FlatReview, { FlatPage, useBookImages } from './FlatReview';
import { fetchBookPages, loadBookImages, loadFlipbookFonts, type BookImages, type PageFetch } from '../../lib/flipbook/pageArt';
import { POSTER_LINKS } from '../../lib/mat/posterLinks';
import { matScroll, type Hold } from '../../lib/mat/timelineScene';
import { RESCUE_SCHEMES, RESCUE_SOURCES, RESCUE_STORY, drawRescueCard, drawRescueStoryCard, type NotchStyle, type RescueScheme } from '../../lib/mat/foodRescueCards';
import { SELF_STORY, drawSelfStoryCard } from '../../lib/mat/selfCards';
import { SNAPDEAL_STORY, drawSnapdealStoryCard } from '../../lib/mat/snapdealCards';
import { GITHUB, GITHUB_YEAR, RESUME_PAGE, RESUME_PDF } from '../../lib/mat/matPieces';
import { WORDS_BIG_BELOW, type GreetingSet } from '../../lib/mat/wordPieces';
import { resumeSheetPicture, wordProps } from '../../lib/mat/wordStage';
import { DESIGN_CARDS } from '../../lib/mat/designCards';
import { openCaseStudy, warmCaseStudies } from '../../lib/mat/caseStudyHandoff';
import { whenQuiet } from '../../lib/flipbook/quiet';
import { CLIPBOARD, CLIPBOARD_LAY, clipboardShade, drawClipboard } from '../../lib/mat/designClipboards';
import { RECORD, RECORD_LAY, SOUND_RECORD, SOUND_RECORD_PROP, drawSoundRecord } from '../../lib/mat/soundRecord';
import { createBagLayer, preloadZomatoBag, type BagLayer, type ItemId as BagItem } from '../../lib/mat/zomatoBag';
import { TEXT as BAG_TEXT } from '../../lib/mat/zomatoBagArt';
import { createHandoutsLayer, type HandoutsLayer } from '../../lib/mat/handoutsLayer';
import { createGithubRiseLayer, type GithubRiseLayer } from '../../lib/mat/githubRiseLayer';
import { JOURNEY_END, journeyAt, journeySteps } from '../../lib/mat/rescueJourney';
import LivePreview from './LivePreview';

import './flipbook.css';

const applyCase = (book: FlipBook, word: string) => (
  book.theme.wordCase === 'upper' ? word.toUpperCase() : book.theme.wordCase === 'lower' ? word.toLowerCase() : word
);

/** The home page's mat tile, as its stylesheet has it (review/home-cc-v30/hero.css): thin lines, brighter fifth lines, a cross where those meet. */
const MAT_TILE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cdefs%3E%3CradialGradient id='g'%3E%3Cstop offset='0' stop-color='%23fff' stop-opacity='.35'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cpath d='M0 12.5H120M0 36.5H120M0 84.5H120M0 108.5H120M12.5 0V120M36.5 0V120M84.5 0V120M108.5 0V120' stroke='%23fff' stroke-opacity='.13' stroke-width='1'/%3E%3Cpath d='M0 60.5H120M60.5 0V120' stroke='%23fff' stroke-opacity='.3' stroke-width='1'/%3E%3Ccircle cx='60.5' cy='60.5' r='7' fill='url(%23g)'/%3E%3Cpath d='M55 60.5H66M60.5 55V66' stroke='%23fff' stroke-opacity='.75' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E\")";

/** Where the reader came from, when they opened this book from the home page's mat. */
interface HomeLink {
  /** Where the booklet lay, when the reader has just come from the home page. Absent on a reload or a shared link. */
  arrival: MatArrival | null;
  home: string;
  /** How far down the home page the reader was. */
  scroll: number;
  /** The cover picture the home page already had loaded, so the booklet can be drawn without waiting. */
  cover: string | null;
}

/**
 * The home page hands over where the closed book lay (bx, by, bw, bt), where
 * its mat was (mx, my, mw, mh), the sunlight's clock, and its own address.
 * Only an address on this site is taken.
 */
function readHomeLink(params: URLSearchParams): HomeLink | null {
  const home = params.get('from');
  if (!home || !/^\/(?!\/)[\w\-./?=&%]*$/.test(home)) return null;
  const num = (key: string) => { const raw = params.get(key); const value = raw === null ? NaN : Number(raw); return Number.isFinite(value) ? value : null; };
  const cover = params.get('cv');
  const link: HomeLink = { home, scroll: Math.max(0, num('sy') ?? 0), cover: cover && /^\/(?!\/)[\w\-./]+\.(webp|jpe?g|png|svg)$/.test(cover) ? cover : null, arrival: null };
  const [x, y, w, turn, matX, matY, matW, matH] = ['bx', 'by', 'bw', 'bt', 'mx', 'my', 'mw', 'mh'].map(num);
  if (x === null || y === null || w === null || matX === null || matY === null || matW === null || matH === null || w < 40 || w > 4000) return link;
  return { ...link, arrival: { x, y, w, turn: Math.max(-30, Math.min(30, turn ?? 0)), matX, matY, matW, matH, sun: num('sun') ?? 40 } };
}

/** One poster of the home stage, as data/matStage.json has it: its place in pixels on a 1440 by 900 drawing of the page. */
interface StagePoster { id: string; label: string; src: string; x: number; y: number; w: number; h: number; radius: number; kind: string }

/**
 * Where things lie on the home stage. The posters keep the places they have on the flat home page
 * (data/matStage.json, measured from it by scripts/mat/capture-posters.mjs). The booklet lies in the open
 * mat to the right of the Snapdeal poster.
 */
/**
 * Where the books lie, in pixels on the 1440 by 900 drawing: loose on the open mat right of the Snapdeal poster, two to a row. They never overlap. The open book is a real 3D book and always draws under the loose
 * booklets, so a booklet lying over it would hide its title once it had been opened and put back.
 */
/** What the address asked for when the page was opened, kept because the page tidies its address once it is up. */
const ASKED = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
const STAGE_BOOK_SLOTS = [
  { x: 930, y: 652, turn: -4 }, { x: 1180, y: 660, turn: 3 },
  { x: 930, y: 806, turn: -2 }, { x: 1180, y: 806, turn: 3 },
];
const bookPlace = (index: number) => {
  const slot = STAGE_BOOK_SLOTS[index % STAGE_BOOK_SLOTS.length];
  // more books than places: the next round lies a little to the right of the first
  return { ...slot, x: slot.x + Math.floor(index / STAGE_BOOK_SLOTS.length) * 40 };
};
// The printer is not on this stage (Adi, 2026-11-16: "Keep the booklet, remove the printer": Bambu is a booklet like the
// others). Its picture stays in data/matStage.json for the flat page, which still has it.
// Zomato is his red rider's bag (lib/mat/zomatoBag.ts), lying where the Zomato card was: it takes the place of the ~10M
// card and of the Food Rescue card, which now comes out of it (Adi, 2026-11-17). Both pictures stay in data/matStage.json
// for the flat page.
const STAGE_POSTERS = (matStage.posters as StagePoster[]).filter((poster) => !['printer', 'zomato', 'rescue', 'design'].includes(poster.id));
// (The design poster is gone from the stage too: its three case studies lie on the mat as three clipboards, each opening
// its own page in one click. Adi, 2026-11-18. Its picture stays in data/matStage.json for the flat page.)
const ZOMATO_ID = 'zomato';
/** The bag's close-up, as the poster close-up knows it (its place is the old Zomato card's). */
const ZOMATO_LOOK: StagePoster = { ...(matStage.posters as StagePoster[]).find((poster) => poster.id === ZOMATO_ID)!, label: 'Zomato, Senior Product Analyst' };
/** The bag's click target: an invisible prop the engine flies to and hit-tests (the layer draws the bag). One picture for
 * the life of the page: the layer finds the engine's mesh for it by this very canvas, however often the stage is laid out. */
let bagTargetPicture: HTMLCanvasElement | null = null;
const bagTarget = () => { if (!bagTargetPicture) { bagTargetPicture = document.createElement('canvas'); bagTargetPicture.width = 8; bagTargetPicture.height = 8; } return bagTargetPicture; };
/** The bag's spot, from its click target's centre (table units): the bag sits a little lower than the target. */
const BAG_SHIFT = { x: 0, y: 74 / matStage.booklet.w };
/**
 * His presentations: a binder-clipped stack of printed decks in the empty corner between the name tag and the résumé
 * (lib/mat/handoutsLayer.ts; Adi, 2026-11-21: "just a stack of ... presentations that I've already done, and it sits at
 * the corner without taking much of visual attention"). Picked up, the clip comes off and the decks are dealt onto the
 * mat; a dealt deck that has its own website opens it in a new tab. Bottom of the stack first; the top deck shows.
 */
const HANDOUTS_ID = 'handouts';
/** Where the stack lies on the 1440 by 900 drawing; turn in degrees, clockwise as seen. */
const HANDOUTS_AT = { x: 372, y: 118, turn: 4 };
const HANDOUTS_DECKS: Array<{ slide: string; title: string; url?: string }> = [
  // (titles and lines as the presentations page has them: review/presentations-2026-11-20c/tools/prepare.py)
  { slide: 'squad', title: 'Squad Up, McDonald\'s × Northwestern, 2026' },
  { slide: 'familysync', title: 'FamilySync, JPMorgan Chase × Northwestern, 2026' },
  { slide: 'aibyadi', title: 'AI by A(d)i, AI workshop, 2026' },
  { slide: 'bambu', title: '3D Print Anything, Bambu Lab workshop at Corner Makery, 2026', url: 'https://bambu.adidesign.org/#download-guide' },
  { slide: 'sportband', title: 'Apple Watch Sport Band, a simplified life-cycle assessment', url: 'https://sport-band-lca.vercel.app/#/01' },
  { slide: 'agentjam', title: 'Agent Jam #2, workshop, Nov 19, 2026', url: 'https://agent-jam-2.vercel.app/' },
  { slide: 'acela', title: 'Acela Journey Assistant, Northwestern MPD 400, 2026', url: 'https://acela-journey.vercel.app/#1' },
];
/** The stack's close-up, as the poster close-up knows it (it has no panel: like the bag, the things on the mat are it). */
const HANDOUTS_LOOK: StagePoster = { id: HANDOUTS_ID, label: 'Presentations', src: '', x: HANDOUTS_AT.x - 53, y: HANDOUTS_AT.y - 41, w: 106, h: 82, radius: 0, kind: 'layer' };
let handoutsTargetPicture: HTMLCanvasElement | null = null;
const handoutsTarget = () => { if (!handoutsTargetPicture) { handoutsTargetPicture = document.createElement('canvas'); handoutsTargetPicture.width = 8; handoutsTargetPicture.height = 8; } return handoutsTargetPicture; };
/**
 * The GitHub card, opened where it lies (lib/mat/githubRiseLayer.ts; Adi, 2026-11-22: "a 3D GitHub thing that literally has
 * progress of this portfolio", "1, squares rise", "i guess daily is better"): the year's squares rise out of it as a day-by-day
 * print, with three flags at the home page's turning points. A click on its count opens the repository. Only when the build
 * has the year's history (GITHUB_YEAR); otherwise the card links straight to GitHub.
 */
const GITHUB_ID = 'piece:github';
/** The flags: a day of the print and the home page as it looked then (screenshots built from that day's code). */
const GITHUB_FLAGS = [
  { date: '2025-12-18', word: 'Dec', picture: '/images/mat/github/home-2025-12-30.jpg' },
  { date: '2026-04-18', word: 'Apr', picture: '/images/mat/github/home-2026-04-18.jpg' },
  { date: '2026-11-17', word: 'Nov', picture: '/images/mat/github/home-2026-11-17.jpg' },
];
/** The opened card's close-up, as the poster close-up knows it (no panel: the print on the mat is it). */
const GITHUB_LOOK: StagePoster = { id: GITHUB_ID, label: 'GitHub', src: '', x: 0, y: 0, w: 0, h: 0, radius: 0, kind: 'layer' };
/** A poster's close-up by id: the résumé, the bag, the stack and the GitHub card are not posters of the stage. */
const lookFor = (id: string): StagePoster | undefined => (id === RESUME_ID ? RESUME_LOOK : id === ZOMATO_ID ? ZOMATO_LOOK : id === HANDOUTS_ID ? HANDOUTS_LOOK : id === GITHUB_ID && GITHUB_YEAR ? GITHUB_LOOK : STAGE_POSTERS.find((item) => item.id === id));
/** What comes out of the bag, in the order it comes out (their pictures are the layer's; these are their names). */
const BAG_THINGS: Array<{ id: BagItem; label: string }> = [
  { id: 'receipt', label: 'The bill: his role and what he did' },
  { id: 'press', label: 'Press clipping: Media Coverage' },
  { id: 'photo', label: 'His photo at Zomato' },
  { id: 'home', label: 'Homepage & Search Performance' },
  { id: 'friends', label: 'Friends Recommendation' },
  { id: 'rescue', label: 'Food Rescue (Waste Reduction)' },
];

/**
 * The home page's words lie on the mat as things (lib/mat/wordStage.ts, Adi's direction A, 2026-11-16): the name label,
 * the menu tabs, the greeting's cut letters, the Self strip, the facts card, the GitHub sticker, the "See my work" tag,
 * LinkedIn, Timeline, and the résumé sheet beside the photo. The résumé is flown to like a poster, to be read; the rest do
 * what their links do (HeroOverlay keeps them as real text, `data-piece` naming the piece), without a fly-in.
 */
const RESUME_ID = 'resume';
/** A word piece that is a link: its id begins so. (word:resume flies to the résumé instead.) */
const isWordLink = (id: string) => id.startsWith('word:') || id.startsWith('piece:');
/**
 * The greeting's cut letters as the lit mat draws them (the canvas's cream and black under the window light, read off the
 * lit stage at 1440 by 900): the loading greeting turns to these on its way down, so the hand-over shows no change.
 */
const HELLO_CREAM = '#f3efe6';
const HELLO_BLACK = '#121522';
/** The home stage, with where the greeting's cut letters sit in their picture (for the loading greeting's landing). */
type HomeStage = StageSpec & { greeting?: GreetingSet };
/** The résumé's close-up, as the poster close-up shows it. */
const RESUME_LOOK: StagePoster = { id: RESUME_ID, label: 'Résumé', src: RESUME_PAGE, x: 0, y: 0, w: 0, h: 0, radius: 0, kind: 'sheet' };
/** At its close-up the résumé is read on the left; its words and Download PDF stand in this column at the right. */
const sheetAside = (windowWidth: number) => Math.round(Math.min(340, Math.max(220, windowWidth * 0.22)));
const SHEET_ASIDE_RIGHT = 40;
/** The résumé is read at its close-up with its body text at least about 11 CSS pixels: the sheet at least this tall. */
// (tall enough that its body type is about 15 px on a laptop: it does not fit the window then, and the reader moves down
// it with the wheel, a finger or the arrow keys. It was 960, which put the type at 11 px. Adi, 2026-11-17.)
const RESUME_READ_PX = 1280;

/** Pictures asked for, by address: each is loaded once, and picking up another book hands back the very same picture. */
const pictures = new Map<string, Promise<HTMLImageElement>>();
const loadPicture = (src: string) => {
  const known = pictures.get(src);
  if (known) return known;
  const asked = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    // decoded before it is handed over, so the first draw does not stop to unpack it (a failed decode is no failure:
    // the picture has loaded and will be unpacked when it is first drawn)
    image.onload = () => { if (image.decode) image.decode().then(() => resolve(image), () => resolve(image)); else resolve(image); };
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
  pictures.set(src, asked);
  // (a failure is not kept: the next ask tries again)
  asked.catch(() => { if (pictures.get(src) === asked) pictures.delete(src); });
  return asked;
};

/**
 * Pictures drawn for the stage, kept: picking up another book lays the stage out again round it, and every card, booklet
 * and sticker is the same picture as before. Handed back as the very same canvas, they are neither drawn again nor sent
 * to the GPU again (the engine keeps a texture per picture). Keyed by what each is drawn from.
 */
const drawn = new Map<string, { from: unknown[]; image: HTMLCanvasElement }>();
function drawnOnce(key: string, from: unknown[], draw: () => HTMLCanvasElement): HTMLCanvasElement {
  const had = drawn.get(key);
  if (had && had.from.length === from.length && had.from.every((item, i) => item === from[i])) return had.image;
  const image = draw();
  drawn.set(key, { from, image });
  return image;
}

/** A closed book as it lies on the mat: its cover on its boards, the outer corners round and the spine edge square. */
function bookletPicture(cover: HTMLImageElement, board: string): HTMLCanvasElement {
  const w = 1100;                    // the cover's width in canvas pixels
  const edge = w * 0.017;            // the boards show this far round the cover
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w + edge * 2);
  canvas.height = Math.round(w * 0.6 + edge * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = board;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, [0, w * 0.053, w * 0.053, 0]);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(edge, edge, w, w * 0.6, [0, w * 0.036, w * 0.036, 0]);
  ctx.clip();
  ctx.drawImage(cover, edge, edge, w, w * 0.6);
  ctx.restore();
  return canvas;
}

/** The stage as seen from one book: that book is the live one at the middle of the table's map, the others lie as closed booklets. */
/** Asked for once, when the résumé is about to be read (the pointer rests on it or its tab, or it is opened). */
let resumeAsked: Promise<HTMLImageElement> | null = null;
const fullResume = () => (resumeAsked ??= loadPicture(RESUME_PAGE));

async function loadStage(active: FlipBook, windowWidth = 1440, holdGreeting = false): Promise<HomeStage> {
  const px = matStage.booklet.w;   // a closed book is one table unit wide
  const place = (slug: string) => bookPlace(Math.max(0, FLIP_BOOKS.findIndex((item) => item.slug === slug)));
  const here = place(active.slug);
  const at = (x: number, y: number) => ({ x: (x - here.x) / px, y: -(y - here.y) / px });
  // Everything the stage needs is asked for in one go: the posters, the Food Rescue card's pictures and typefaces, and
  // the covers of the books lying closed. (One after another, each waited for the one before.) The typefaces are the
  // 'first' ones, the cards' own (Geist and Bricolage): the rest are only drawn inside the books and come later.
  const others = FLIP_BOOKS.filter((item) => item.slug !== active.slug);
  // the Zomato bag's pictures start coming now, beside the stage's (not waited for: the bag is built when they are in)
  void preloadZomatoBag().catch(() => undefined);
  const hasRescue = STAGE_POSTERS.some((poster) => poster.id === 'rescue');
  const [posterPictures, rescuePictures, coverPictures, selfLogo, toolMarks, resumePage, selfArt, snapdealArt, clipPictures] = await Promise.all([
    Promise.all(STAGE_POSTERS.map((poster) => loadPicture(poster.src))),
    hasRescue ? Promise.all([loadPicture(RESCUE_SOURCES.bag), loadPicture(RESCUE_SOURCES.logo), loadPicture(RESCUE_SOURCES.offer)]) : Promise.resolve(null),
    Promise.all(others.map((item) => loadPicture(item.pages[0].art.src))),
    loadPicture('/images/self-logo.svg'),
    loadPicture('/images/mat/tool-marks.webp'),
    // The résumé sheet is about 120 px wide in the wide view: it lies with a small copy of the page (17 KB), and the full
    // page (RESUME_PAGE, 215 KB) is swapped in when it is about to be read (fullResume). (Written out, not a constant: the
    // ship kit's first-frame preloads read loadStage's literal pictures.)
    loadPicture('/images/mat/resume-p1-small.webp'),
    loadPicture(STORY_ILLUSTRATIONS.self),
    loadPicture(STORY_ILLUSTRATIONS.snapdeal),
    // the three clipboards' pictures and P&G's mark: they lie on the mat from the first light, so they come with the stage
    // (the same pictures as lib/mat/designCards.ts DESIGN_PICTURES and DESIGN_PG_MARK, written out for the ship kit)
    Promise.all([loadPicture('/images/familysync_jpmorgan_chase.webp'), loadPicture('/images/mcdonalds_order.webp'), loadPicture('/images/pg/rooms/room-hero.webp'), loadPicture('/images/pg/pg-logo-official.svg')]),
    loadFlipbookFonts('first'),
  ]);
  const posters = STAGE_POSTERS.map((poster, index) => {
    const image = posterPictures[index];
    const left = poster.x;
    return {
      id: poster.id, image, ...at(left + poster.w / 2, poster.y + poster.h / 2),
      w: poster.w / px, h: poster.h / px, radius: poster.radius / px, cutout: poster.kind === 'cutout', standing: poster.kind === 'cutout',
    };
  });
  // The Food Rescue card is drawn, not captured: the Zomato logo sits in a notch at its top (Adi chose the pill bumped into
  // one corner, 2026-11-16; the other two shapes are still there: ?notch=tab or scoop), and when it is picked up it drops and deals out a row of four more cards.
  const rescue = posters.find((poster) => poster.id === 'rescue');
  const story: StageSpec['props'] = [];
  if (rescue && rescuePictures) {
    const [bag, logo, offer] = rescuePictures;
    const art = { bag, logo, offer };
    const asked = ASKED.get('notch');
    const notch: NotchStyle = asked === 'tab' || asked === 'bite' || asked === 'scoop' ? asked : 'bite';
    Object.assign(rescue, { image: drawnOnce('rescue', [bag, logo, offer, notch], () => drawRescueCard(art, notch)), cutout: true, standing: false });
    // the papers of the four story cards (?cards=pages, mix, bag or red)
    const wanted = ASKED.get('cards') ?? '';
    const papers = RESCUE_SCHEMES[(wanted in RESCUE_SCHEMES ? wanted : 'pages') as RescueScheme];
    // the open row: the card itself at the left end, the four story cards to its right, centred in the view
    const gap = rescue.w * 0.13;
    const middle = at(matStage.ref.w / 2, matStage.ref.h / 2);
    const left = middle.x - (rescue.w * 5 + gap * 4) / 2 + rescue.w / 2;
    Object.assign(rescue, { open: { x: left, y: middle.y } });
    RESCUE_STORY.forEach((card, i) => {
      story.push({
        id: `rescue:${card.id}`, image: drawnOnce(`rescue:${i}`, [bag, logo, offer, papers[i]], () => drawRescueStoryCard(art, i, papers[i])), x: rescue.x, y: rescue.y, w: rescue.w, h: rescue.h,
        radius: rescue.radius, dealtFrom: 'rescue', open: { x: left + (i + 1) * (rescue.w + gap), y: middle.y },
      });
    });
  }
  // Self uses the same deal and camera framing as Food Rescue, with four short story cards.
  const self = posters.find((poster) => poster.id === 'self');
  if (self) {
    const gap = self.w * 0.13;
    const middle = at(matStage.ref.w / 2, matStage.ref.h / 2);
    const left = middle.x - (self.w * 5 + gap * 4) / 2 + self.w / 2;
    Object.assign(self, { open: { x: left, y: middle.y } });
    SELF_STORY.forEach((card, i) => story.push({
      id: `self:${card.id}`, image: drawnOnce(`self:${i}`, [selfLogo, selfArt], () => drawSelfStoryCard(i, selfLogo, selfArt)), x: self.x, y: self.y,
      w: self.w, h: self.h, radius: self.radius, dealtFrom: 'self',
      open: { x: left + (i + 1) * (self.w + gap), y: middle.y },
    }));
  }
  const snapdeal = posters.find((poster) => poster.id === 'snapdeal');
  if (snapdeal) {
    const gap = snapdeal.w * 0.13;
    const middle = at(matStage.ref.w / 2, matStage.ref.h / 2);
    const left = middle.x - (snapdeal.w * 5 + gap * 4) / 2 + snapdeal.w / 2;
    Object.assign(snapdeal, { open: { x: left, y: middle.y } });
    SNAPDEAL_STORY.forEach((card, i) => story.push({
      id: `snapdeal:${card.id}`, image: drawnOnce(`snapdeal:${i}`, [snapdealArt], () => drawSnapdealStoryCard(i, snapdealArt)), x: snapdeal.x, y: snapdeal.y,
      w: snapdeal.w, h: snapdeal.h, radius: snapdeal.radius, dealtFrom: 'snapdeal',
      open: { x: left + (i + 1) * (snapdeal.w + gap), y: middle.y },
    }));
  }
  // Adi's three human-centered design case studies (FamilySync with JPMorgan Chase, Squad Up for McDonald's, P&G hair care
  // packaging) lie on the mat as three clipboards, side by side and a little over one another, where the design poster
  // was. A click on one opens its case study: there is no close-up and nothing is dealt (lib/mat/designClipboards.ts).
  const clipboards: StageSpec['props'] = DESIGN_CARDS.map((card, i) => {
    const lay = CLIPBOARD_LAY[i];
    const shade = clipboardShade(i);
    return {
      id: `design:${card.id}`, image: drawnOnce(`clipboard:${i}`, [clipPictures[i], clipPictures[3], shade?.from, shade?.top, shade?.bottom], () => drawClipboard(i, clipPictures[i], clipPictures[3], shade)),
      ...at(lay.x, lay.y), w: CLIPBOARD.w / px, h: CLIPBOARD.h / px, radius: 0, cutout: true, alphaShadow: true, turn: lay.turn,
    };
  });
  // A yellow record lies on the mat above the clipboards: the way in to the interactive 3D board (lib/mat/soundRecord.ts).
  const soundRecord: StageSpec['props'][number] = {
    id: SOUND_RECORD_PROP, image: drawnOnce('record:sound', [], () => drawSoundRecord()),
    ...at(RECORD_LAY.x, RECORD_LAY.y), w: RECORD.d / px, h: RECORD.d / px, radius: 0, cutout: true, alphaShadow: true, turn: RECORD_LAY.turn,
  };
  const booklets = others.map((item, index) => {
    const spot = place(item.slug);
    const board = item.board ?? '#2b160d';
    const picture = drawnOnce(`book:${item.slug}`, [coverPictures[index], board], () => bookletPicture(coverPictures[index], board));
    return { id: `book:${item.slug}`, image: picture, ...at(spot.x, spot.y), w: 1.034, h: 0.634, radius: 0, cutout: true, turn: spot.turn };
  });
  // the words, laid on the mat (their typefaces are the 'first' ones, loaded above): drawn once, here, for this window's width
  const photo = STAGE_POSTERS.find((poster) => poster.id === 'photo') ?? { x: 91, y: 192, w: 187, h: 198 };
  const words = wordProps({
    px, at, selfLogo, toolMarks, resumePage, photo, windowWidth, holdGreeting,
    resume: { w: matStage.pieces.resume.w, turn: matStage.pieces.resume.turn },
    read: { minPx: RESUME_READ_PX, aside: sheetAside(windowWidth) + SHEET_ASIDE_RIGHT + 24 },
  });
  // (the GitHub card, when it can be opened, is a cut-out with its shadow from its own picture, so that its layer can hide
  // it, shadow and all, by giving it an empty picture while it holds the card: lib/mat/githubRiseLayer.ts)
  const pieces = GITHUB_YEAR ? words.props.map((prop) => (prop.id === GITHUB_ID ? { ...prop, cutout: true, alphaShadow: true } : prop)) : words.props;
  // the rider's bag lies where the Zomato card was; this invisible, bag-sized prop is what a click on it lands on
  const bagSlot = { x: ZOMATO_LOOK.x + ZOMATO_LOOK.w / 2, y: ZOMATO_LOOK.y + ZOMATO_LOOK.h / 2 + 34 };
  const bag = { id: ZOMATO_ID, image: bagTarget(), ...at(bagSlot.x, bagSlot.y - 50), w: 0.8, h: 1.2, radius: 0.05 };
  // the presentations stack (its layer draws it): an unseen prop the size of the stack and its clip, for clicks and the
  // fly-down (a cut-out, its shadow from its empty picture: otherwise the engine lays a card's dark slab under it)
  const handouts = { id: HANDOUTS_ID, image: handoutsTarget(), ...at(HANDOUTS_AT.x, HANDOUTS_AT.y), w: 0.74, h: 0.6, radius: 0.01, turn: HANDOUTS_AT.turn, cutout: true, alphaShadow: true };
  return {
    greeting: words.greeting,
    props: [...posters, ...clipboards, soundRecord, bag, handouts, ...story, ...booklets, ...pieces],
    frame: { ...at(matStage.ref.w / 2, matStage.ref.h / 2), w: matStage.ref.w / px, h: matStage.ref.h / px },
    turn: here.turn,
    unit: 1 / px,
  };
}

/**
 * The home stage's live book, cover first. Before the light comes on the room waits only for what its first frame
 * draws: the closed cover's own pictures (page 0, and the table it lies on) and the stage's typefaces. The rest of the
 * book comes once the room is lit or the book is picked up (BookStage: "the inside of the live book"). A book picked up
 * once the room is lit waits for every typeface: its cover may draw with one the first frame did not need (Jarvis's
 * title is in the serif), and with motion turned down a cover is drawn once and held.
 */
function useCoverFirst(book: FlipBook, staged: boolean, lit: React.MutableRefObject<boolean>): { images: BookImages | null; error: string | null } {
  const [state, setState] = useState<{ slug: string; images: BookImages | null; error: string | null }>({ slug: book.slug, images: null, error: null });
  useEffect(() => {
    if (!staged) return undefined;
    let live = true;
    setState({ slug: book.slug, images: null, error: null });
    Promise.all([loadFlipbookFonts(lit.current ? 'all' : 'first'), loadBookImages(book, [0])])
      .then(([, images]) => { if (live) setState({ slug: book.slug, images, error: null }); })
      .catch((error: unknown) => { if (live) setState({ slug: book.slug, images: null, error: error instanceof Error ? error.message : 'The book could not be loaded.' }); });
    return () => { live = false; };
  }, [book, lit, staged]);
  return state.slug === book.slug ? { images: state.images, error: state.error } : { images: null, error: null };
}

/** Books whose opening spread has been asked for ahead of a click (each is asked for once). */
const openingSpreads = new Set<string>();
/**
 * A closed booklet is likely to be picked up (the pointer rests on it, or it has keyboard focus): fetch its opening
 * spread now (pages 0 to 2). The rest of it follows when it is picked up (BookStage: "the inside of the live book").
 * (Adi, 2026-11-20: ~17 MB downloaded in the first 6 s after the room lit, so a resting pointer no longer pulls whole books.)
 */
function fetchOpeningSpread(slug: string): void {
  const item = FLIP_BOOKS_BY_SLUG.get(slug);
  if (!item || openingSpreads.has(slug)) return;
  openingSpreads.add(slug);
  fetchBookPages(item, [0, 1, 2].filter((index) => index < item.pages.length), () => undefined, () => undefined, 4);
}

/** The flat home page: what phones and browsers without 3D get in place of the stage. (Lives under review/ for now.) */
/** Keys that scroll the page. */
const SCROLL_KEYS = new Set(['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar']);

const FLAT_HOME = '/home-flat/index.html';
const flatHomeForCurrentView = () => FLAT_HOME + (/^#experience-(self|zomato|udaan|schmooze|snapdeal)$/.test(window.location.hash) ? window.location.hash : '');

const BookStage: React.FC<{ book: FlipBook; onSelectBook(slug: string): void; debug: boolean; homeLink: HomeLink | null; staged?: boolean }> = ({ book, onSelectBook, debug, homeLink, staged = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  /** The second screen's own window onto the page (see "the second screen keeps step" below), and the room it takes on the page. */
  const portRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  /** Where the timeline holds the mat still while the page scrolls through its stops (its room measures it). */
  const holdRef = useRef<Hold | null>(null);
  /** How far down the page is, as the scroll handler last saw it (read here, it never makes the browser stop to lay the page out). */
  const scrolledRef = useRef(0);
  /** Where the port was last put or seen (kept, so the scroll handler never has to ask the browser), and whether its next
   * scroll event is the scroll handler's own move rather than the browser's doing. */
  const portAt = useRef({ y: 0, own: false });
  /** The thing on the mat whose hidden button has keyboard focus: a ring is drawn round it, and it lifts as under the pointer. */
  const [ring, setRing] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const ringOn = useCallback((id: string, event: React.FocusEvent<HTMLElement>) => {
    const engine = engineRef.current;
    if (!engine || !event.currentTarget.matches(':focus-visible')) return;
    engine.lift(id === 'book' ? null : id);
    setRing(engine.screenRect(id));
  }, []);
  const ringOff = useCallback(() => { engineRef.current?.lift(null); setRing(null); }, []);
  const engineRef = useRef<FlipBookEngine | null>(null);
  const [page, setPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [sheet, setSheet] = useState<{ left: number; top: number; right: number; bottom: number } | null>(null);
  // a wide window opens the book as spreads: each turn then moves two pages, a story page and the picture it faces
  const [spread, setSpread] = useState(false);
  const [leaves, setLeaves] = useState(0);
  // leaning in over the left page of a spread to read it
  const [reading, setReading] = useState(false);
  // coming from the home page: the controls stay away until the view has come down to the book, and go again on the way back
  const arrival = homeLink?.arrival ?? null;
  const [landed, setLanded] = useState(!arrival && !staged);
  // the home stage: the wide view of the mat, down at one poster, or in the book
  const [mode, setMode] = useState<'wide' | 'poster' | 'book'>('wide');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [stageSpec, setStageSpec] = useState<StageSpec | null>(null);
  const [lit, setLit] = useState(false);
  // "Hi, I'm Adi." drawn by index.html under the bulb: the headline waits for it, then it is carried onto the headline
  const [greeting, setGreeting] = useState<'none' | 'held' | 'landed'>(() => (staged && helloDrawn() ? 'held' : 'none'));
  const greetingRef = useRef(greeting);
  greetingRef.current = greeting;
  /** The room's light is full (engine onLit, or the opening's safety net): the greeting's hand-over waits for it. */
  const litGate = useMemo(() => { let open = () => {}; const shut = new Promise<void>((resolve) => { open = resolve; }); return { shut, open }; }, []);
  /** The words on the mat are drawn with larger type on a narrow window (lib/mat/wordPieces.ts WORDS_BIG_BELOW). */
  const bigWords = viewport.w < WORDS_BIG_BELOW;
  const litRef = useRef(false);
  litRef.current = lit;
  /** A booklet that was clicked and is being made the live book: open it as soon as it is. */
  const openAfter = useRef<string | null>(null);
  const [looking, setLooking] = useState<StagePoster | null>(null);
  const lookingRef = useRef<string | null>(null);
  /** At the résumé: how far down the sheet the reader is (0 its top, 1 its foot). */
  const [readAt, setReadAt] = useState(0);
  lookingRef.current = looking?.id ?? null;
  /**
   * The Zomato bag (lib/mat/zomatoBag.ts), drawn in this engine's scene: one for the life of the engine. Picked up, it
   * unpacks his Zomato work onto the mat; `busy` while it unpacks or packs (its Back waits), `open` the thing opened.
   */
  const bagRef = useRef<{ layer: BagLayer; engine: FlipBookEngine; remove(): void } | null>(null);
  const [bagUi, setBagUi] = useState<{ open: BagItem | null; busy: boolean }>({ open: null, busy: false });
  const bagUiRef = useRef(bagUi);
  bagUiRef.current = bagUi;
  /** The bag has been come down to and not yet left; each arrival or leaving counts one more. */
  const bagIn = useRef(false);
  const bagGen = useRef(0);
  const bagTimer = useRef(0);
  /** The presentations stack (lib/mat/handoutsLayer.ts), drawn in this engine's scene: one for the life of the engine. */
  const handoutsRef = useRef<{ layer: HandoutsLayer; engine: FlipBookEngine; remove(): void } | null>(null);
  /** The GitHub card's opened print (lib/mat/githubRiseLayer.ts): one for each engine and card picture. */
  const githubRef = useRef<{ layer: GithubRiseLayer; engine: FlipBookEngine; card: HTMLCanvasElement; remove(): void } | null>(null);
  const [wordsBox, setWordsBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const stageActs = useRef<{ prop(id: string | null): void; book(): void; hover(id: string | null): void }>({ prop() {}, book() {}, hover() {} });
  /** The live book has been set in the engine (its inside can be handed over as it lands), was picked up, is all drawn. */
  const [setFor, setSetFor] = useState<string | null>(null);
  const [wanted, setWanted] = useState<string | null>(null);
  const wantedRef = useRef<string | null>(null);
  const [filled, setFilled] = useState<string | null>(null);
  /** The fetch of the live book's inside, while it runs. */
  const inside = useRef<PageFetch | null>(null);
  /** The pointer resting on a booklet: after a moment its pictures are fetched (fetchOpeningSpread). */
  const intent = useRef(0);
  const onMat = book.surface === 'mat';
  // the home page's sunlight as it was at the moment of leaving (a small picture it put aside), for the first paint
  const heldSun = useMemo(() => {
    if (!arrival) return null;
    try { const data = window.sessionStorage.getItem('book-sun'); return data && data.startsWith('data:image/') ? data : null; } catch { return null; }
  }, [arrival]);
  // the home stage lights up on the closed cover; a book opened on its own page waits for all of itself, as before
  const eager = useBookImages(book, !staged);
  const cover = useCoverFirst(book, staged, litRef);
  const { images, error } = staged ? cover : eager;
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  // the timeline on the mat: it is drawn in this engine's scene, in the stage's frame, and held still by the scroll handler
  const timelineEngine = useMemo(() => ({ addLayer: (layer: Parameters<FlipBookEngine['addLayer']>[0]) => engineRef.current?.addLayer(layer) ?? (() => undefined) }), []);
  const timelinePlace = useMemo(() => (stageSpec ? { frame: stageSpec.frame, unit: stageSpec.unit } : null), [stageSpec]);
  const timelinePerUnit = wordsBox && stageSpec ? wordsBox.width / stageSpec.frame.w : null;
  const total = book.pages.length;
  const count = spread && leaves > 0 ? leaves : total;
  const pageAt = (index: number) => book.pages[Math.min(spread ? index * 2 : index, total - 1)];
  const current = pageAt(Math.min(page, count - 1));
  const facing = spread && page > 0 ? book.pages[Math.min(page * 2 - 1, total - 1)] : null;

  // one engine for the life of the stage; books are swapped inside it
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    try {
      const engine = createFlipBookEngine(canvas, {
        reducedMotion,
        debug,
        onPage: setPage,
        onLayout: (rect) => { setSheet(rect); setSpread(rect.spread); setLeaves(rect.leaves); },
        onLean: setReading,
        arrival: arrival ?? undefined,
        onProp: (id) => stageActs.current.prop(id),
        onBookPick: () => stageActs.current.book(),
        onStageLayout: (next) => setWordsBox((was) => (was && was.left === next.left && was.top === next.top && was.width === next.width && was.height === next.height ? was : next)),
        onLit: () => { setLit(true); litGate.open(); },
        onHover: (id) => stageActs.current.hover(id),
        onFilled: setFilled,
        onCta: (href) => window.location.assign(href),
        onError: () => setFallback(true),
      });
      engineRef.current = engine;
      return () => { engine.dispose(); engineRef.current = null; };
    } catch {
      setFallback(true);
      return undefined;
    }
  }, [debug, homeLink, reducedMotion]);

  // from the home page: once the book is on screen, come down to it and open the cover
  useEffect(() => {
    // (with no 3D there is nothing to come down to: show the controls at once)
    if (fallback || error) { document.getElementById('book-held')?.remove(); setLanded(true); return undefined; }
    if (!arrival || !homeLink || !ready) return undefined;
    // the positions in the address were true for one moment only: keep just the way home, so a reload or a shared link is a plain visit
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}?from=${encodeURIComponent(homeLink.home)}&sy=${Math.round(homeLink.scroll)}`); } catch { /* the address stays as it is */ }
    // the drawing made before the app loaded (index.html) has done its job: the same picture is now under the 3D scene
    document.getElementById('book-held')?.remove();
    const start = window.setTimeout(() => engineRef.current?.arrive(), reducedMotion ? 0 : 420);
    const show = window.setTimeout(() => setLanded(true), reducedMotion ? 0 : 420 + 1150);
    return () => { window.clearTimeout(start); window.clearTimeout(show); };
  }, [arrival, error, fallback, homeLink, ready, reducedMotion]);

  /** Back to the home page: the book closes, the view lifts to where the home page shows it, then the home page takes over. */
  const goHome = useCallback((event: React.MouseEvent) => {
    const engine = engineRef.current;
    // on the stage "Portfolio" is the way back up to the wide view
    if (staged) { event.preventDefault(); window.history.back(); return; }
    // (after a reload there is no place to fly back to: the link is then an ordinary link to the home page)
    if (!homeLink || !arrival || !engine || fallback) return;
    event.preventDefault();
    const url = `${homeLink.home}${homeLink.home.includes('?') ? '&' : '?'}back=${encodeURIComponent(book.slug)}&sun=${engine.sunClock.toFixed(1)}&sy=${Math.round(homeLink.scroll)}`;
    setLanded(false);
    void engine.leave();
    // on a timer, not on the animation's end: a hidden window starves frames
    window.setTimeout(() => window.location.assign(url), reducedMotion ? 0 : (engine.page > 0 ? 520 : 0) + 1000 + 140);
  }, [arrival, book.slug, fallback, homeLink, reducedMotion, staged]);

  // the home stage: its posters' pictures, then (below) the book among them
  useEffect(() => {
    if (!staged) return undefined;
    let live = true;
    // (picking up another book lays the stage out again round it)
    setStageSpec(null);
    // (the words are drawn for the window's width: crossing WORDS_BIG_BELOW lays the stage out again, with larger type)
    loadStage(book, window.innerWidth, greetingRef.current === 'held').then((spec) => { if (live) setStageSpec(spec); }).catch((error) => { console.error('Mat stage failed', error); if (live) window.location.replace(flatHomeForCurrentView()); });
    return () => { live = false; };
  }, [book, staged, bigWords]);

  // a phone, a narrow window or no 3D: the flat home page
  useEffect(() => {
    if (!staged) return undefined;
    if (fallback) { window.location.replace(flatHomeForCurrentView()); return undefined; }
    // (a window that is still hidden reports no size at all: wait until it has one before judging it)
    const judge = () => {
      const w = window.innerWidth || document.documentElement.clientWidth;
      const h = window.innerHeight || document.documentElement.clientHeight;
      if (w > 0 && h > 0 && (w < 760 || w / h < 1.15)) window.location.replace(flatHomeForCurrentView());
    };
    const soon = window.setTimeout(judge, 250);
    return () => window.clearTimeout(soon);
  }, [fallback, staged, viewport]);

  // A picture that comes after the stage is laid: the full résumé page. It is put on its
  // piece only while the camera is still (a flight in progress puts it on when it ends), so no change is seen mid-motion.
  const flying = useRef(0);
  const late = useRef<{ resume: HTMLImageElement | null; put: Set<string> }>({ resume: null, put: new Set() });
  const putLate = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !stageSpec || flying.current > 0) return;
    const { resume, put } = late.current;
    if (resume && !put.has('resume')) {
      // (one picture for each size of type: the sheet's label is drawn larger for narrow windows, wordStage)
      const big = window.innerWidth < WORDS_BIG_BELOW;
      engine.setPropImage(RESUME_ID, drawnOnce(`resume:full:${big}`, [resume, matStage.pieces.resume.w], () => resumeSheetPicture(resume, matStage.pieces.resume.w, window.innerWidth).image));
      put.add('resume');
    }
  }, [stageSpec]);
  const putLateRef = useRef(putLate);
  putLateRef.current = putLate;
  /** Fly to a poster or back up, counted, so late pictures wait for the camera to be still. */
  const fly = useCallback((id: string | null) => {
    const engine = engineRef.current;
    if (!engine) return Promise.resolve();
    flying.current += 1;
    return engine.focusOn(id).finally(() => { flying.current -= 1; putLateRef.current(); });
  }, []);
  const askResume = useCallback(() => fullResume().then((page) => { late.current.resume = page; putLateRef.current(); }, () => undefined), []);

  // The Zomato bag: added to the engine once the stage is laid (it lies on its click target), built as its pictures come in.
  useEffect(() => {
    const engine = engineRef.current;
    const target = stageSpec?.props.find((prop) => prop.id === ZOMATO_ID);
    if (!staged || fallback || !engine || !target || bagRef.current?.engine === engine) return;
    bagRef.current?.remove();
    const layer = createBagLayer({ prop: { ...target, image: target.image as HTMLCanvasElement }, shift: BAG_SHIFT, reduced: reducedMotion });
    bagRef.current = { layer, engine, remove: engine.addLayer(layer) };
    if (debug) (window as unknown as { __bag?: unknown }).__bag = { get layer() { return layer; } };
  }, [debug, fallback, reducedMotion, stageSpec, staged]);
  useEffect(() => () => { bagRef.current?.remove(); bagRef.current = null; window.clearTimeout(bagTimer.current); }, []);

  // The presentations stack: the same, on its own click target in the corner above the résumé.
  useEffect(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const target = stageSpec?.props.find((prop) => prop.id === HANDOUTS_ID);
    if (!staged || fallback || !engine || !canvas || !target || handoutsRef.current?.engine === engine) return;
    handoutsRef.current?.remove();
    // (a prop's turn is in degrees, clockwise as seen; a layer's is the scene's own, counter-clockwise)
    const layer = createHandoutsLayer({
      x: target.x, y: target.y, turn: -HANDOUTS_AT.turn, canvas, reduced: reducedMotion,
      slides: HANDOUTS_DECKS.map((deck) => `/images/mat/handouts/${deck.slide}.webp`), links: HANDOUTS_DECKS.map((deck) => deck.url),
      target: target.image as HTMLCanvasElement,
    });
    handoutsRef.current = { layer, engine, remove: engine.addLayer(layer) };
    if (debug) (window as unknown as { __handouts?: unknown }).__handouts = { get layer() { return layer; } };
  }, [debug, fallback, reducedMotion, stageSpec, staged]);
  useEffect(() => () => { handoutsRef.current?.remove(); handoutsRef.current = null; }, []);

  // The GitHub card's opened print: built once the stage is laid and its few pictures are in (the tools' marks and the
  // three flags' screenshots), on the card's own spot. It hides the stage's card while it holds it (an empty picture).
  useEffect(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const target = stageSpec?.props.find((prop) => prop.id === GITHUB_ID);
    const year = GITHUB_YEAR;
    if (!staged || fallback || !engine || !canvas || !target || !year) return undefined;
    const card = target.image as HTMLCanvasElement;
    if (githubRef.current?.engine === engine && githubRef.current.card === card) return undefined;
    let gone = false;
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image(); image.decoding = 'async';
      image.onload = () => resolve(image); image.onerror = () => reject(new Error(`could not load ${src}`)); image.src = src;
    });
    const flags = GITHUB_FLAGS.map((flag) => ({ ...flag, day: year.findIndex((day) => day.date === flag.date) })).filter((flag) => flag.day >= 0);
    void Promise.all([load('/images/mat/tool-marks.webp'), Promise.all(flags.map((flag) => load(flag.picture)))]).then(([marks, pictures]) => {
      if (gone || engineRef.current !== engine) return;
      githubRef.current?.remove();
      const empty = document.createElement('canvas'); empty.width = 8; empty.height = 8;
      const layer = createGithubRiseLayer({
        card: { image: card, x: target.x, y: target.y, w: target.w, h: target.h, turn: target.turn ?? 0 },
        data: {
          days: year.map((day) => day.count), first: year.findIndex((day) => day.count > 0), commits: GITHUB.commits,
          flags: flags.map((flag, i) => ({ day: flag.day, word: flag.word, picture: pictures[i] })), href: GITHUB.href,
        },
        marks, canvas, reduced: reducedMotion, levels: GITHUB.levels,
        swap: (mine) => engine.setPropImage(GITHUB_ID, mine ? empty : card),
      });
      githubRef.current = { layer, engine, card, remove: engine.addLayer(layer) };
      if (debug) (window as unknown as { __github?: unknown }).__github = { get layer() { return layer; } };
    }, () => undefined);
    return () => { gone = true; };
  }, [debug, fallback, reducedMotion, stageSpec, staged]);
  useEffect(() => () => { githubRef.current?.remove(); githubRef.current = null; }, []);

  // At the opened GitHub card: a click on its count opens the repository in a new tab (the engine never sees it, so it is
  // not a click "Back"); a hand over it, the plain arrow elsewhere.
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!staged || !canvas || !root) return undefined;
    const on = () => modeRef.current === 'poster' && lookingRef.current === GITHUB_ID;
    const linkAt = (event: PointerEvent) => githubRef.current?.layer.linkAt(event.clientX, event.clientY) ?? null;
    let downOn: string | null = null;
    const down = (event: PointerEvent) => { downOn = on() ? linkAt(event) : null; if (downOn) event.stopImmediatePropagation(); };
    const up = (event: PointerEvent) => {
      if (!on() || !downOn) { downOn = null; return; }
      event.stopImmediatePropagation();
      if (linkAt(event) === downOn) {
        window.open(downOn, '_blank', 'noopener');
        trackEvent('mat_piece_clicked', { piece: 'github' });
      }
      downOn = null;
    };
    const move = (event: PointerEvent) => {
      if (!on()) { if (root.dataset.githubPointer) delete root.dataset.githubPointer; return; }
      root.dataset.githubPointer = linkAt(event) ? 'true' : 'false';
    };
    canvas.addEventListener('pointerdown', down, true);
    canvas.addEventListener('pointerup', up, true);
    canvas.addEventListener('pointermove', move);
    return () => {
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointerup', up, true);
      canvas.removeEventListener('pointermove', move);
    };
  }, [staged]);

  // At the stack, once the decks are down: a click on one that has its own website opens it in a new tab (the engine never
  // sees it, so it is not a click "Back"); a hand over those, the plain arrow elsewhere, never the zoom glass.
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!staged || !canvas || !root) return undefined;
    const on = () => modeRef.current === 'poster' && lookingRef.current === HANDOUTS_ID;
    const linkAt = (event: PointerEvent) => handoutsRef.current?.layer.linkAt(event.clientX, event.clientY) ?? null;
    let downOn: string | null = null;
    const down = (event: PointerEvent) => { downOn = on() ? linkAt(event) : null; if (downOn) event.stopImmediatePropagation(); };
    const up = (event: PointerEvent) => {
      if (!on() || !downOn) { downOn = null; return; }
      event.stopImmediatePropagation();
      const link = linkAt(event);
      if (link === downOn) {
        window.open(link, '_blank', 'noopener');
        trackEvent('mat_presentation_opened', { deck: HANDOUTS_DECKS.find((deck) => deck.url === link)?.slide ?? link });
      }
      downOn = null;
    };
    const move = (event: PointerEvent) => {
      if (!on()) { if (root.dataset.stackPointer) delete root.dataset.stackPointer; return; }
      root.dataset.stackPointer = linkAt(event) ? 'true' : 'false';
    };
    canvas.addEventListener('pointerdown', down, true);
    canvas.addEventListener('pointerup', up, true);
    canvas.addEventListener('pointermove', move);
    return () => {
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointerup', up, true);
      canvas.removeEventListener('pointermove', move);
    };
  }, [staged]);

  // The three clipboards' case studies: their code and story pages downloaded once the room is lit and the page is quiet,
  // so a click lands on a case study that is already here (lib/mat/caseStudyHandoff.ts, warmCaseStudies)
  // (a few seconds after, so they never share the line with the home's own pictures)
  useEffect(() => {
    if (!staged || fallback || !lit) return undefined;
    const later = window.setTimeout(() => whenQuiet(() => warmCaseStudies(), 12000), 3000);
    return () => window.clearTimeout(later);
  }, [fallback, lit, staged]);
  /** Come down to the bag: it unpacks (Back waits until it has). */
  const bagArrive = useCallback(() => {
    const layer = bagRef.current?.layer;
    if (!layer) return;
    bagGen.current += 1;
    bagIn.current = true;
    layer.arrive();
    setBagUi({ open: null, busy: true });
    window.clearTimeout(bagTimer.current);
    bagTimer.current = window.setTimeout(() => setBagUi((was) => ({ ...was, busy: false })), reducedMotion ? 120 : 3300);
  }, [reducedMotion]);
  /** Leave the bag: let it finish unpacking if it still is, put everything back, close it; then the camera can go up. */
  const bagOut = useCallback(async () => {
    const layer = bagRef.current?.layer;
    if (!layer || !bagIn.current) return;
    bagIn.current = false;
    const gen = ++bagGen.current;
    window.clearTimeout(bagTimer.current);
    setBagUi({ open: null, busy: true });
    const wait = (ms: number) => new Promise((ok) => window.setTimeout(ok, ms));
    // (Back pressed while it unpacks: it finishes first, at most its own length; a hidden window starves frames, hence the clock)
    const since = performance.now();
    while (layer.state === 'in' && performance.now() - since < 3600) await wait(50);
    if (layer.state === 'open') await Promise.race([layer.pack(), wait(reducedMotion ? 200 : 2200)]);
    if (gen !== bagGen.current) return;
    layer.leave();
    setBagUi({ open: null, busy: false });
  }, [reducedMotion]);
  /** Open one thing from the bag (or close it, picked again). */
  const bagOpen = useCallback((id: BagItem | null) => {
    const layer = bagRef.current?.layer;
    if (!layer || !bagIn.current || bagUiRef.current.busy) return;
    layer.open(layer.opened === id ? null : id);
    setBagUi({ open: layer.opened, busy: false });
    if (layer.opened) trackEvent('mat_bag_item_opened', { item: layer.opened });
  }, []);
  /** Back, one level: out of an open thing to the bag, or out of the bag to the mat (the history step, which packs it). */
  const bagBack = useCallback(() => {
    if (bagUiRef.current.busy) return;
    if (bagRef.current?.layer.opened) bagOpen(null);
    else window.history.back();
  }, [bagOpen]);
  const bagActs = useRef({ arrive: bagArrive, out: bagOut, back: bagBack });
  bagActs.current = { arrive: bagArrive, out: bagOut, back: bagBack };

  // A click on something of the bag's is the bag's (the engine never sees it). The cursor over it: a hand over what can be
  // clicked, the plain arrow elsewhere, never the engine's zoom glass (Adi: "no zoom cursor").
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!staged || !canvas || !root) return undefined;
    const on = () => modeRef.current === 'poster' && lookingRef.current === ZOMATO_ID && bagIn.current;
    const at = (event: PointerEvent) => { const r = canvas.getBoundingClientRect(); return bagRef.current?.layer.hit(event.clientX - r.left, event.clientY - r.top, r) ?? null; };
    const linkAt = (event: PointerEvent) => { const r = canvas.getBoundingClientRect(); return bagRef.current?.layer.linkAt(event.clientX - r.left, event.clientY - r.top, r) ?? null; };
    // Food Rescue: a click on a row of its order log replays the story from that event (and is not a click "Back")
    const rowAt = (event: PointerEvent) => { if (bagUiRef.current.busy) return null; const r = canvas.getBoundingClientRect(); return bagRef.current?.layer.rescueStepAt(event.clientX - r.left, event.clientY - r.top, r) ?? null; };
    let downOn: ReturnType<typeof at> = null;
    let downRow: number | null = null;
    const down = (event: PointerEvent) => {
      if (!on()) return;
      downRow = rowAt(event);
      if (downRow !== null) { event.stopImmediatePropagation(); downOn = null; return; }
      downOn = at(event); if (downOn) event.stopImmediatePropagation();
    };
    const up = (event: PointerEvent) => {
      if (!on()) return;
      if (downRow !== null) {
        event.stopImmediatePropagation();
        if (rowAt(event) === downRow) { bagRef.current?.layer.rescue?.seek(journeySteps[downRow].at); trackEvent('mat_rescue_event_replayed', { event: journeySteps[downRow].n }); }
        downRow = null; downOn = null; return;
      }
      const link = linkAt(event);
      if (link) { event.stopImmediatePropagation(); downOn = null; window.open(link, '_blank', 'noopener'); return; }
      const under = at(event);
      if (downOn && under === downOn) { event.stopImmediatePropagation(); if (under !== 'bag') bagOpen(under); }
      else if (downOn) event.stopImmediatePropagation();
      downOn = null;
    };
    const move = (event: PointerEvent) => {
      if (!on()) { if (root.dataset.bagPointer) delete root.dataset.bagPointer; return; }
      const hand = !bagUiRef.current.busy && (rowAt(event) !== null || !!linkAt(event) || at(event) !== null);
      root.dataset.bagPointer = hand ? 'true' : 'false';
    };
    canvas.addEventListener('pointerdown', down, true);
    canvas.addEventListener('pointerup', up, true);
    canvas.addEventListener('pointermove', move);
    return () => {
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointerup', up, true);
      canvas.removeEventListener('pointermove', move);
    };
  }, [bagOpen, staged]);

  useEffect(() => {
    if (!images) return;
    if (staged && !stageSpec) return;
    setPage(0);
    const engine = engineRef.current;
    if (!engine || fallback) { setReady(true); return; }
    if (staged && stageSpec) {
      engine.setStage(stageSpec, litRef.current);
      // (laid out again, e.g. for a narrower window: the pictures that had come in go on again)
      late.current.put.clear();
      putLateRef.current();
    }
    let live = true;
    // (on the home stage only the cover is drawn now: the rest of the book as it lands)
    engine.setBook(book, images, 0, staged).then(() => {
      if (!live) return;
      setReady(true);
      if (staged) setSetFor(book.slug);
      // this book was picked from the mat as a closed booklet: now that it is the live one, open it
      if (openAfter.current === book.slug) { openAfter.current = null; stageActs.current.book(); }
    }).catch(() => { if (live) setFallback(true); });
    return () => { live = false; };
  }, [book, images, fallback, staged, stageSpec]);

  // the heading moves a little when its own typeface arrives, and when the page gains a scrollbar: measure again then
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    if (!staged) return undefined;
    let live = true;
    const again = () => { if (live) setSettled((n) => n + 1); };
    void document.fonts?.ready.then(again);
    const timers = [600, 1600, 3200, 6000].map((ms) => window.setTimeout(again, ms));
    return () => { live = false; timers.forEach((id) => window.clearTimeout(id)); };
  }, [staged]);

  // The photo and every word lie where data/matStage.json and lib/mat/wordStage.ts put them (the headline is a piece on the
  // mat now, so nothing is measured from the page's text). Only the résumé's close-up follows the window: it keeps room at
  // the right for its words, as wide as that column is at this width.
  useEffect(() => {
    const sheet = stageSpec?.props.find((prop) => prop.id === RESUME_ID);
    if (!staged || !sheet?.read) return;
    sheet.read.aside = sheetAside(viewport.w) + SHEET_ASIDE_RIGHT + 24;
  }, [staged, stageSpec, viewport]);

  // The inside of the live book, page by page from the cover on (fetchBookPages: a few at a time, at low priority). Once
  // the room is lit only the first spread (pages 1 and 2) is fetched; the rest comes the moment the book is picked up
  // (openBook sets `wanted`, this effect runs again, and pages already fetched come from the shared store in pageArt.ts).
  // (Adi, 2026-11-20: ~17 MB downloaded in the first 6 s after the room lit, 85% of it closed books' inside pages.)
  // Each page goes to the engine as it lands, and the engine draws it while nothing moves. The typefaces the pages draw
  // with come first, so none is drawn in a stand-in one.
  const insideNow = staged && setFor === book.slug && (lit || wanted === book.slug);
  const insideAll = wanted === book.slug;
  useEffect(() => {
    if (!insideNow) return undefined;
    let live = true;
    const fonts = loadFlipbookFonts();
    const got: BookImages = new Map();
    const fetch = fetchBookPages(book, book.pages.map((_, index) => index).slice(1, insideAll ? undefined : 3), (_, pictures) => {
      pictures.forEach((picture, src) => got.set(src, picture));
      void fonts.then(() => { if (live) engineRef.current?.addImages(book, got); }, () => undefined);
    }, () => undefined);
    inside.current = fetch;
    // (picked up before its inside was asked for: the first spread goes first)
    if (wantedRef.current === book.slug) fetch.hurry(engineRef.current?.spread ? [1, 2] : [1]);
    return () => { live = false; fetch.stop(); if (inside.current === fetch) inside.current = null; };
  }, [book, insideNow, insideAll]);

  // On a page turn the pages just ahead are asked for first, ahead of the rest of the book's inside.
  useEffect(() => {
    if (mode !== 'book') return;
    const first = spread ? page * 2 + 1 : page + 1;
    const ahead = [0, 1, 2, 3].map((n) => first + n).filter((n) => n >= 1 && n < book.pages.length);
    if (ahead.length) inside.current?.hurry(ahead);
  }, [mode, page, spread, book]);

  // The other books on the mat. Once the live book is all drawn and the page has been idle, each one's cover and first
  // spread (not on a connection that asks to save data); the whole of one when the pointer rests on its booklet or it has
  // keyboard focus (fetchOpeningSpread), and when it is picked up (it becomes the live book, cover first).
  useEffect(() => {
    if (!staged || filled !== book.slug) return undefined;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return undefined;
    let live = true;
    let fetch: PageFetch | null = null;
    const others = FLIP_BOOKS.filter((item) => item.slug !== book.slug);
    const next = (i: number) => { if (live && i < others.length) fetch = fetchBookPages(others[i], [0, 1, 2], () => undefined, () => next(i + 1), 2); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(() => next(0), { timeout: 4000 }) : window.setTimeout(() => next(0), 1500);
    return () => { live = false; fetch?.stop(); if (w.requestIdleCallback && w.cancelIdleCallback) w.cancelIdleCallback(id); else window.clearTimeout(id); };
  }, [book.slug, filled, staged]);

  /** Show the greeting's cut letters (held back while the loading greeting is on its way to them). */
  const showHello = useCallback(() => {
    const letters = stageSpec?.props.find((prop) => prop.id === 'word:hello');
    if (!letters || !letters.held) return;
    letters.held = false;
    engineRef.current?.resize();
  }, [stageSpec]);
  /** Where the loading greeting lands: the cut letters' baseline as they lie on screen (lib/mat/wordPieces.ts GREETING). */
  const helloLanding = useCallback((): HelloLanding | null => {
    const set = (stageSpec as HomeStage | null)?.greeting;
    const engine = engineRef.current;
    if (!set || !engine) return null;
    const v = set.baseline / set.h;
    return {
      at() {
        // (the canvas fills the window from its top left corner: its points are the window's)
        const u0 = set.left / set.w; const u1 = (set.left + set.textW) / set.w;
        const cap = (set.baseline - set.size * CAP) / set.h;
        const [tl, tr, bl, br] = [[u0, cap], [u1, cap], [u0, v], [u1, v]].map(([u, w]) => engine.screenPoint('word:hello', u, w));
        return tl && tr && bl && br ? { tl, tr, bl, br } : null;
      },
      textW: set.textW,
      size: set.size,
      // the cut letters' cream and black as the window light draws them on the mat (measured from the lit stage)
      colours: { first: HELLO_CREAM, second: HELLO_BLACK },
      lit: litGate.shut,
      dawn: () => engineRef.current?.dawnLevel ?? 1,
      show: showHello,
    };
  }, [litGate, showHello, stageSpec]);
  // (read by the opening below, which runs once: it must not run again when the stage is laid out again)
  const landingRef = useRef(helloLanding);
  landingRef.current = helloLanding;
  const showRef = useRef(showHello);
  showRef.current = showHello;

  /** The visitor scrolled before the scene was drawn (see "a scroll before the scene is drawn" below). */
  const scrolledEarly = useRef(false);
  // the opening: once the scene is drawn, in the dark, the light comes up
  useEffect(() => {
    if (!staged || !ready || fallback) return undefined;
    // The bulb (drawn by index.html before the app loaded) has been swinging in the dark. Give it at least a
    // moment on screen, then switch it on: its light spreads over the room.
    const bulb = document.getElementById('mat-bulb');
    let away = 0;
    let gone = 0;
    let started = false;
    const switchOn = () => {
      if (started) return;
      started = true;
      window.clearTimeout(start);
      // (a load fast enough that the bulb never faded in (index.html waits 0.7 s): it is not switched on, it just goes)
      const img = bulb?.querySelector('img');
      if (bulb && img && Number(getComputedStyle(img).opacity) < 0.5) { bulb.remove(); }
      bulb?.classList.add('is-on');
      engineRef.current?.dawn();
      // the greeting travels onto the cut letters on the mat while the light comes up, and hands over to them once it is full
      void landHello(landingRef.current(), reducedMotion).then(() => setGreeting((g) => (g === 'held' ? 'landed' : g)));
      // it has done its job the moment the room starts to brighten: it goes up and fades while the light is still spreading,
      // so it is never left hanging over a lit room
      away = window.setTimeout(() => bulb?.classList.add('is-away'), reducedMotion ? 0 : 120);
      gone = window.setTimeout(() => bulb?.remove(), reducedMotion ? 300 : 600);
    };
    // (the light comes up the moment the scene is drawn: the bulb only ever covers real loading time, never adds its own)
    const start = window.setTimeout(switchOn, 0);
    // A visitor who scrolls while the bulb is up wants the page now: switch on at once and bring the light up in about a
    // third of a second, so the scroll after that moves the page. (Adi, 2026-11-20: scrolling did nothing for about 3 s.)
    const hurry = () => {
      switchOn();
      engineRef.current?.hurryDawn();
      // (the bulb goes with it: left on its usual 0.33 s it would still be hanging over a room that is already lit)
      window.clearTimeout(away);
      away = window.setTimeout(() => bulb?.classList.add('is-away'), 60);
      stopListening();
    };
    const onKey = (event: KeyboardEvent) => { if (SCROLL_KEYS.has(event.key)) hurry(); };
    const stopListening = () => { window.removeEventListener('wheel', hurry); window.removeEventListener('touchmove', hurry); window.removeEventListener('keydown', onKey); };
    if (!reducedMotion) {
      // (a scroll that came before the scene was drawn counts too)
      if (scrolledEarly.current) hurry();
      else { window.addEventListener('wheel', hurry, { passive: true }); window.addEventListener('touchmove', hurry, { passive: true }); window.addEventListener('keydown', onKey); }
    }
    const sure = window.setTimeout(() => { setLit(true); litGate.open(); dropHello(); showRef.current(); setGreeting((g) => (g === 'held' ? 'landed' : g)); }, reducedMotion ? 0 : 4200);
    return () => { window.clearTimeout(start); window.clearTimeout(sure); window.clearTimeout(away); window.clearTimeout(gone); stopListening(); };
  }, [fallback, ready, reducedMotion, staged]);
  // a scroll before the scene is drawn: remembered, so the opening hurries the moment it can
  useEffect(() => {
    if (!staged || ready || fallback) return undefined;
    const early = () => { scrolledEarly.current = true; };
    const onKey = (event: KeyboardEvent) => { if (SCROLL_KEYS.has(event.key)) early(); };
    window.addEventListener('wheel', early, { passive: true }); window.addEventListener('touchmove', early, { passive: true }); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('wheel', early); window.removeEventListener('touchmove', early); window.removeEventListener('keydown', onKey); };
  }, [fallback, ready, staged]);

  // "Work" and "See my work" lead to the Selected work section. The second screen is drawn in 3D, so the browser's own
  // jump to #work (which measures where the section is drawn, not where it lies) lands at the very bottom of the page.
  // Go to where it lies instead, with its heading a little below the top.
  useEffect(() => {
    if (!staged) return undefined;
    const onClick = (event: MouseEvent) => {
      // (the Timeline link at the foot of the first screen too: left in the address, its #timeline made Back from a poster
      // jump the page down to the timeline again)
      const link = (event.target as Element | null)?.closest?.('a[href="#work"], a[href="#timeline"]');
      const target = link ? document.getElementById(link.getAttribute('href')!.slice(1)) : null;
      if (!link || !target || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      let lies = 0;
      for (let node: HTMLElement | null = target; node; node = node.offsetParent as HTMLElement | null) lies += node.offsetTop;
      window.scrollTo({ top: lies, behavior: reducedMotion ? 'auto' : 'smooth' });
      // (the address is left alone: a #work in it would make the browser jump to the page's bottom again whenever Back returns here)
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [reducedMotion, staged]);

  // The page scrolls down to a second screen. The mat is one sheet: the wide view travels down it with the scroll,
  // and the words (real text) go up with the page. Scrolling is only for the wide view.
  useEffect(() => {
    if (!staged || !stageSpec || !wordsBox) return undefined;
    const perUnit = wordsBox.width / stageSpec.frame.w;
    const onScroll = () => {
      // (never above the page's top: a tablet's browser lets the page be pulled past it and reports a scroll below
      // zero while it springs back. The whole window is already moving with that pull; the mat must not move twice.)
      const y = Math.max(0, window.scrollY);
      scrolledRef.current = y;
      // The second screen is moved here too, in the same frame as the words and the 3D view (see "the second screen keeps
      // step" below). First, while the page's layout is still clean: set after the style writes below, the port made the
      // browser work out the whole page's style again, there and then, on every scroll event.
      const port = portRef.current;
      if (port && portAt.current.y !== y) { port.scrollTop = y; portAt.current = { y, own: true }; }
      // (through the timeline's stops the mat holds still: the page scrolls on, the wide view does not)
      engineRef.current?.setScroll(matScroll(y, holdRef.current) / perUnit);
      rootRef.current?.style.setProperty('--mat-scroll', `${-y}px`);
      // The second screen lies on the mat. The 3D view looks at the middle of the window from a slant, with a 24 degree
      // lens: the same view in CSS is a perspective of (window height / 2) / tan(12 degrees), turned about the line
      // across the middle of the window. That line moves down the page as it scrolls.
      const second = secondRef.current;
      if (second) {
        second.style.setProperty('--mat-eye', `${(window.innerHeight / 2 / Math.tan((12 * Math.PI) / 180)).toFixed(1)}px`);
        second.style.setProperty('--mat-mid', `${(y - window.innerHeight / 2).toFixed(1)}px`);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lit, staged, stageSpec, wordsBox]);

  // Once the room is lit, what shows past the page's edges is the mat's blue, not the dark room. A tablet's browser lets
  // the page be pulled past its top and its end; the strip it uncovers there was black (the dark room's colour), which
  // read as the page blacking out on the way back up.
  useEffect(() => {
    if (!staged || !lit || fallback) return undefined;
    const root = document.documentElement;
    const was = root.style.background;
    root.style.background = '#1b62d4';
    return () => { root.style.background = was; };
  }, [fallback, lit, staged]);

  // The second screen keeps step with the mat. Left to the browser, it scrolled on the browser's own clock, a frame
  // ahead of the 3D view and the words (which move from the scroll handler above): while the page moved, the timeline
  // and Work shook against the mat by a whole scroll step in about one frame in six. Its tilt also grew and shrank the
  // page's height on every frame. So it lies in a window of its own (.fb-second-port), which the scroll handler moves
  // with everything else, and an empty block of its untilted height (.fb-second-room) is what the page scrolls over.
  useEffect(() => {
    const port = portRef.current;
    const second = secondRef.current;
    const room = roomRef.current;
    if (!staged || !lit || !port || !second || !room) return undefined;
    const size = () => { room.style.height = `${Math.ceil(second.offsetTop + second.offsetHeight)}px`; };
    size();
    const observer = new ResizeObserver(size);
    observer.observe(second);
    window.addEventListener('resize', size);
    // the browser scrolls the port itself to show something inside it (a stop reached with Tab, find in page, a link to
    // #timeline): the page follows, and the scroll handler then sets the port to where the page could go
    const follow = () => {
      // (the scroll handler's own move is passed over unread: asking where the port is would make the browser lay the
      // page out there and then, on every frame of a scroll)
      if (portAt.current.own) { portAt.current.own = false; return; }
      const at = port.scrollTop;
      portAt.current = { y: at, own: false };
      if (Math.abs(at - window.scrollY) <= 0.5) return;
      window.scrollTo({ left: window.scrollX, top: at, behavior: 'instant' });
      // (past the page's end the page cannot follow: the port comes back to it)
      if (Math.abs(at - window.scrollY) > 0.5) { port.scrollTop = window.scrollY; portAt.current = { y: window.scrollY, own: true }; }
    };
    // (a stop reached with Tab while the page is moving could share one scroll event with the handler's own move: look again)
    const focused = () => requestAnimationFrame(() => { portAt.current.own = false; follow(); });
    port.addEventListener('scroll', follow, { passive: true });
    port.addEventListener('focusin', focused);
    port.scrollTop = window.scrollY;
    portAt.current = { y: port.scrollTop, own: false };
    return () => { observer.disconnect(); window.removeEventListener('resize', size); port.removeEventListener('scroll', follow); port.removeEventListener('focusin', focused); };
  }, [fallback, lit, staged]);
  useEffect(() => {
    if (!staged) return undefined;
    const root = document.documentElement;
    const was = { y: root.style.overflowY, x: root.style.overflowX, b: document.body.style.overflow, h: document.body.style.height };
    document.body.style.height = 'auto';
    // the window itself scrolls; the body must not be a scroller of its own, or the timeline's pinned panel will not pin
    root.style.overflowX = 'hidden';
    root.style.overflowY = 'auto';
    document.body.style.overflow = 'visible';
    return () => { root.style.overflowY = was.y; root.style.overflowX = was.x; document.body.style.overflow = was.b; document.body.style.height = was.h; };
  }, [staged]);
  // Scrolling is only for the wide view: down at a poster or in a book the page holds still. (It is held by refusing the
  // wheel, the scroll keys and a dragging finger, not by hiding the page's overflow: that took the scroll bar away and
  // gave it back, so the 3D view was resized at the start of every fly-in and every way back, and the whole page's
  // style and layout were worked out again, mid-click.)
  useEffect(() => {
    if (!staged || mode === 'wide') return undefined;
    if (scrolledRef.current > 0) window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    // (the profile beside the photo can scroll on its own, when it is longer than the window: it never hands its
    // scrolling on to the page, flipbook.css .fb-look)
    const own = (event: Event) => {
      const target = event.target as Element | null;
      const look = target?.closest?.('.fb-look');
      return Boolean(target?.closest?.('dialog') || (look && look.scrollHeight > look.clientHeight + 1));
    };
    // At the résumé the same wheel, finger and keys move the reader down the sheet instead (engine.readBy): it is taller
    // than the window, so that its type can be read.
    const reading = () => modeRef.current === 'poster' && lookingRef.current === RESUME_ID;
    const read = (px: number) => { const now = engineRef.current?.readBy(px); if (now?.can) setReadAt(now.at); };
    let fingerY: number | null = null;
    const hold = (event: Event) => {
      if (own(event)) return;
      if (event.cancelable) event.preventDefault();
      if (!reading()) return;
      if (event instanceof WheelEvent) read(event.deltaMode === 1 ? event.deltaY * 32 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY);
      else if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent && event.touches.length === 1) {
        const y = event.touches[0].clientY;
        if (fingerY !== null) read(fingerY - y);
        fingerY = y;
      }
    };
    const finger = (event: TouchEvent) => { fingerY = event.touches.length === 1 ? event.touches[0].clientY : null; };
    const keys = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
    const holdKeys = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (!keys.has(event.key) || own(event) || (element && /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName))) return;
      // (a button pressed with Space still presses; on a link Space only scrolls)
      if (event.key === ' ' && element?.tagName === 'BUTTON') return;
      event.preventDefault();
      if (!reading()) return;
      const page = window.innerHeight * 0.8;
      if (event.key === 'Home' || event.key === 'End') { const now = engineRef.current?.readTo(event.key === 'Home' ? 0 : 1); if (now?.can) setReadAt(now.at); }
      else read(event.key === 'ArrowDown' ? 90 : event.key === 'ArrowUp' ? -90 : event.key === 'PageUp' || (event.key === ' ' && event.shiftKey) ? -page : page);
    };
    window.addEventListener('wheel', hold, { passive: false });
    window.addEventListener('touchmove', hold, { passive: false });
    window.addEventListener('touchstart', finger, { passive: true });
    window.addEventListener('touchend', finger, { passive: true });
    window.addEventListener('keydown', holdKeys);
    return () => {
      window.removeEventListener('wheel', hold);
      window.removeEventListener('touchmove', hold);
      window.removeEventListener('touchstart', finger);
      window.removeEventListener('touchend', finger);
      window.removeEventListener('keydown', holdKeys);
    };
  }, [mode, reducedMotion, staged]);

  // the stage's moves. Each one adds a step to the browser's history, so Back always lifts the camera out again.
  useEffect(() => {
    if (!staged) return undefined;
    /** Counts the books opened: a way back out cancels the controls an opening would show once it has landed. */
    let openings = 0;
    /** Open the live book where it lies (from the wide view). */
    const openBook = () => {
      const mine = ++openings;
      setMode('book');
      // its first spread's pictures jump the queue (the cover opens once it is drawn: engine.arrive)
      wantedRef.current = book.slug;
      setWanted(book.slug);
      inside.current?.hurry(engineRef.current?.spread ? [1, 2] : [1]);
      engineRef.current?.arrive();
      // (not if Back has been pressed since: the book is on its way out and its controls stay hidden)
      window.setTimeout(() => { if (mine === openings && modeRef.current === 'book') setLanded(true); }, reducedMotion ? 0 : 1150);
    };
    /** Come down to a poster's close-up (from the wide view). */
    const lookAt = (id: string, poster: StagePoster) => {
      setLooking(poster);
      setReadAt(0);
      setMode('poster');
      // (the bag drops its lid and unpacks as the camera comes down to it)
      if (id === ZOMATO_ID) bagActs.current.arrive();
      // (the stack's clip comes off and its decks are dealt out as the camera comes down)
      if (id === HANDOUTS_ID) handoutsRef.current?.layer.arrive();
      // (the GitHub card's year rises out of it as the camera comes down)
      if (id === GITHUB_ID) githubRef.current?.layer.arrive();
      void fly(id);
    };
    /**
     * Back or Forward has moved the address: the view follows the step it landed on. A poster's step (?look=) is its
     * close-up, a book's step its open book, and any other step the wide view. (Each step's history.state says which.)
     */
    const toWide = () => {
      const engine = engineRef.current;
      if (!engine) return;
      const state = window.history.state as { mat?: string; id?: string; matExperience?: boolean } | null;
      const look = state?.mat === 'poster' ? state.id ?? new URLSearchParams(window.location.search).get('look') : null;
      // A poster's "Open ..." pill is a plain link to #experience-<id>: the story opens over the close-up, which stays, at
      // /?look=<poster>#experience-<id>. The step it made is marked as the poster's and the story's, so that closing the
      // story steps Back to the close-up (ExperienceStory's close goes Back when the step is a story's), not past it.
      if (modeRef.current === 'poster' && !state && /^#experience-/.test(window.location.hash)) {
        const id = new URLSearchParams(window.location.search).get('look');
        window.history.replaceState({ mat: 'poster', id, matExperience: true }, '', window.location.href);
        return;
      }
      if (look) {
        // (the close-up it is already at: a story over it has closed)
        if (modeRef.current === 'poster') return;
        // Forward, from the wide view, to a close-up
        const poster = lookFor(look);
        if (modeRef.current === 'wide' && poster) {
          if (look === RESUME_ID) void askResume();
          lookAt(look, poster);
          return;
        }
      }
      if (state?.mat === 'book' && modeRef.current === 'book') return;
      // Forward, from the wide view, to the live book's step: it opens again
      if (state?.mat === 'book' && modeRef.current === 'wide' && new URLSearchParams(window.location.search).get('book') === book.slug) {
        openBook();
        return;
      }
      // (once up at the wide view the address is read again: Forward pressed while the camera was on its way up names a
      // close-up or a book again, and the view goes back down to it rather than leaving the address wrong)
      const up = () => { setMode('wide'); modeRef.current = 'wide'; toWide(); };
      if (modeRef.current === 'book') { openings += 1; setLanded(false); void engine.leave().then(up); }
      // (at the bag, everything goes back in and it zips shut before the camera goes up)
      // (at the stack, the decks go back and the clip goes on as the camera goes up)
      else if (modeRef.current === 'poster') { handoutsRef.current?.layer.leave(); githubRef.current?.layer.leave(); void bagActs.current.out().then(() => fly(null)).then(() => { setLooking(null); up(); }); }
      // the wide view on a step that names a close-up or a book (Forward to one that cannot be come back to as it was):
      // the address says what is on screen
      if (look || state?.mat === 'book') window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    };
    stageActs.current = {
      prop(id) {
        if (id === null) {
          // (at the bag a click off it goes back one level: out of an open thing first)
          if (modeRef.current === 'poster') { if (lookingRef.current === ZOMATO_ID) bagActs.current.back(); else window.history.back(); }
          return;
        }
        if (id.startsWith('book:')) {
          // another book: it becomes the live one where it lies, then opens
          if (modeRef.current !== 'wide') return;
          openAfter.current = id.slice(5);
          // (out of the click's own task: the whole page is drawn again for the new book, and done at once in the click
          // it held the frame the click is answered in; as a transition React does it in short slices)
          React.startTransition(() => onSelectBook(id.slice(5)));
          return;
        }
        // the words on the mat do what their links do (HeroOverlay's, by data-piece), without a fly-in: GitHub and LinkedIn
        // in a new tab, Work and "See my work" down to the work, Experience and Timeline down to the timeline, the name home.
        // The menu's Résumé flies down to the résumé sheet.
        // (the GitHub card opens where it lies once its print is built: below, as a close-up)
        if (id !== 'word:resume' && isWordLink(id) && !(id === GITHUB_ID && githubRef.current)) {
          if (modeRef.current !== 'wide') return;
          if (id === 'piece:github') window.open(GITHUB.href, '_blank', 'noopener,noreferrer');
          else document.querySelector<HTMLAnchorElement>(`a[data-piece="${id}"]`)?.click();
          trackEvent('mat_piece_clicked', { piece: id.replace(/^(word|piece):/, '') });
          return;
        }
        // one of the three clipboards: its case study, under a splash in the project's colour that grows out of the
        // clipboard (lib/mat/caseStudyHandoff.ts; index.html lifts the same splash off the case study)
        const card = DESIGN_CARDS.find((item) => id === `design:${item.id}`);
        if (card) {
          trackEvent('mat_case_study_opened', { project: card.id });
          const rect = engineRef.current?.screenRect(id);
          openCaseStudy(card, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null, reducedMotion);
          return;
        }
        // the yellow record: the interactive 3D board, under a splash in the mat's blue that grows out of the record
        if (id === SOUND_RECORD_PROP) {
          trackEvent('mat_case_study_opened', { project: SOUND_RECORD.id });
          const rect = engineRef.current?.screenRect(id);
          openCaseStudy(SOUND_RECORD, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null, reducedMotion);
          return;
        }
        if (id === 'word:resume') id = RESUME_ID;
        const poster = lookFor(id);
        if (!poster || modeRef.current !== 'wide') return;
        const go = () => {
          if (modeRef.current !== 'wide') return;
          window.history.pushState({ mat: 'poster', id }, '', `${window.location.pathname}?look=${encodeURIComponent(id)}`);
          trackEvent('mat_poster_opened', { poster: id });
          lookAt(id, poster);
        };
        if (id === RESUME_ID) void askResume();
        go();
      },
      book() {
        if (modeRef.current !== 'wide') return;
        window.history.pushState({ mat: 'book' }, '', `${window.location.pathname}?book=${encodeURIComponent(book.slug)}`);
        openBook();
      },
      hover(id) {
        // resting on the résumé: its full page is fetched, so the close-up is sharp when it arrives
        if (id === RESUME_ID || id === 'word:resume') void askResume();
        // resting on a closed booklet for a moment: its pictures are fetched ahead of a click
        window.clearTimeout(intent.current);
        const slug = id?.startsWith('book:') ? id.slice(5) : null;
        if (slug && slug !== book.slug) intent.current = window.setTimeout(() => fetchOpeningSpread(slug), 150);
      },
    };
    // a reload always starts at the wide view
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    window.addEventListener('popstate', toWide);
    return () => window.removeEventListener('popstate', toWide);
  }, [book.slug, onSelectBook, reducedMotion, staged]);

  // The tab is named after a book only while it is open: the home stage keeps the home page's name until one is picked
  // up, and gets it back on the way out. Opening a book is what flipbook_opened counts, not a visit to the home page.
  useEffect(() => {
    if (staged && mode !== 'book') return undefined;
    const was = document.title;
    document.title = `${book.title} · a flip book · Adi Agarwal`;
    trackEvent('flipbook_opened', { book: book.slug });
    return staged ? () => { document.title = was; } : undefined;
  }, [book, mode, staged]);

  useEffect(() => {
    if (ready) trackEvent('flipbook_page_viewed', { book: book.slug, page, word: current.word });
  }, [book.slug, current.word, page, ready]);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const goTo = useCallback((next: number) => {
    const clamped = Math.min(count - 1, Math.max(0, next));
    if (fallback || !engineRef.current) setPage(clamped);
    else engineRef.current.goTo(next);
  }, [count, fallback]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // on the stage the book's keys only work once you are in the book; Escape always steps back out
      if (staged && modeRef.current !== 'book') {
        // (a story open over the close-up closes itself on Escape, one step Back: not two)
        if (event.key === 'Escape' && modeRef.current === 'poster' && !document.querySelector('dialog[open]')) {
          event.preventDefault();
          if (lookingRef.current === ZOMATO_ID) bagActs.current.back(); else window.history.back();
        }
        // Food Rescue's story, open from the bag: the arrows step through its seven events, Home and End jump to its ends
        const story = modeRef.current === 'poster' && lookingRef.current === ZOMATO_ID && bagRef.current?.layer.opened === 'rescue' ? bagRef.current.layer.rescue : null;
        if (story && !bagUiRef.current.busy) {
          const here = journeyAt(story.time);
          const to = event.key === 'ArrowRight' ? (here + 1 < journeySteps.length ? journeySteps[here + 1].at : JOURNEY_END)
            : event.key === 'ArrowLeft' ? journeySteps[Math.max(0, here - 1)].at
            : event.key === 'Home' ? 0 : event.key === 'End' ? JOURNEY_END : null;
          if (to !== null) { event.preventDefault(); story.seek(to); }
        }
        return;
      }
      if (staged && event.key === 'Escape' && !engineRef.current?.leaning) { event.preventDefault(); window.history.back(); return; }
      const element = event.target as HTMLElement | null;
      if (element && /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)) return;
      const onControl = element && /^(BUTTON|A)$/.test(element.tagName);
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goTo(page + 1); }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goTo(page - 1); }
      else if (event.key === ' ' && !onControl) { event.preventDefault(); goTo(page + (event.shiftKey ? -1 : 1)); }
      else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      else if (event.key === 'End') { event.preventDefault(); goTo(count - 1); }
      else if (event.key === 'Escape' && engineRef.current?.leaning) { event.preventDefault(); engineRef.current.lean(0); }
      else if ((event.key === 'z' || event.key === 'Z') && engineRef.current?.spread) { event.preventDefault(); engineRef.current.lean(engineRef.current.leaning ? 0 : -1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, goTo, page, staged]);

  /** Down at the Zomato bag. */
  const atBag = staged && mode === 'poster' && looking?.id === ZOMATO_ID;
  const atStack = staged && mode === 'poster' && looking?.id === HANDOUTS_ID;
  const atGithub = staged && mode === 'poster' && looking?.id === GITHUB_ID;
  const portrait = viewport.w / viewport.h < 0.9;
  const flatSize = portrait ? { w: 1024, h: 1536 } : { w: 1536, h: 1024 };
  // the controls take their colours from the page on top when it has its own colour family
  // (on the mat they are the home page's own: white on the blue)
  const colours = onMat ? { stage: '#1b62d4', stageLight: '#1b62d4', chrome: '#ffffff', chromeMuted: 'rgba(255, 255, 255, 0.76)' } : current.tone ?? book.theme;
  const style = {
    '--fb-stage': colours.stage,
    '--fb-stage-light': colours.stageLight,
    '--fb-chrome': colours.chrome,
    '--fb-chrome-muted': colours.chromeMuted,
  } as React.CSSProperties;
  const link = current.cta ?? book.link ?? (book.projectId ? { label: `Open ${book.title}`, href: `/work/${book.projectId}` } : null);
  // a page that carries its own words is too small to read on a phone: there its words go under the sheet as real text too
  const tiny = Boolean(sheet && sheet.right - sheet.left < 560);
  /** The words are already on screen as real text under the sheet. */
  const captioned = Boolean(book.solo && !spread && sheet && !fallback && (!current.selfCaptioned || tiny));

  return (
    <>
    <main ref={rootRef} className="fb-root" style={style} data-solo={book.solo && !spread ? 'true' : 'false'} data-spread={spread ? 'true' : 'false'} data-reading={reading ? 'true' : 'false'} data-book={book.slug} data-ready={ready ? 'true' : 'false'} data-page={page} data-mode={fallback ? 'flat' : 'webgl'} data-surface={onMat ? 'mat' : 'table'} data-landed={landed ? 'true' : 'false'} data-stage={staged ? mode : undefined} data-lit={staged ? (lit ? 'true' : 'false') : undefined} data-inside={staged ? (filled === book.slug ? 'true' : 'false') : undefined} data-bag={atBag ? 'true' : undefined} data-stack={atStack ? 'true' : undefined} data-github={atGithub ? 'true' : undefined}>
      {/* first paint when coming from the home page: its mat and the closed book, exactly where they were, until the 3D scene takes over */}
      {homeLink && arrival && onMat && !fallback && (
        <div className="fb-held" aria-hidden="true">
          <div className="fb-held-mat" style={{ left: arrival.matX, top: arrival.matY, width: arrival.matW, height: arrival.matH, backgroundImage: MAT_TILE }}>
            {heldSun && <img className="fb-held-sun" src={heldSun} alt="" style={{ left: -arrival.matX, top: -arrival.matY }} />}
          </div>
          <div
            className="fb-held-book"
            style={{
              left: arrival.x, top: arrival.y, width: arrival.w,
              transform: 'translate(-50%, -50%)',
              '--bk-board': book.board ?? '#2b160d',
            } as React.CSSProperties}
          >
            <div className="fb-held-in" style={{ transform: `rotate(${arrival.turn}deg)` }}><img src={homeLink.cover ?? book.pages[0].art.src} alt="" /></div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="fb-canvas" aria-hidden="true" data-visible={ready && !fallback ? 'true' : 'false'} />

      {fallback && images && (
        <div className="fb-flat-stage">
          <FlatPage book={book} index={Math.min(page, count - 1)} images={images} width={flatSize.w} height={flatSize.h} className="fb-flat-canvas" />
        </div>
      )}

      {/* (coming from the home page the book is already lying on screen: nothing needs announcing to the eye) */}
      {!ready && !error && <p className={arrival || staged ? 'fb-sr' : 'fb-status'} role="status">Opening the book…</p>}
      {error && <p className="fb-status" role="alert">This book could not be opened. {link ? <a href={link.href}>{link.label} instead</a> : <a href="/">Back to the portfolio</a>}.</p>}

      {/* the home stage's words: real text, fitted to where the stage falls on screen */}
      {staged && wordsBox && !fallback && (
        // (the words are drawn on the mat; this is their real text, unseen: a link with keyboard focus rings its piece, and the
        // Résumé links open the résumé sheet up close rather than leaving for the PDF)
        <div
          className="fb-stage-words"
          style={wordsBox}
          onFocus={(event) => {
            const link = (event.target as HTMLElement).closest<HTMLElement>('[data-piece]');
            const engine = engineRef.current;
            if (!link || !engine || !link.matches(':focus-visible')) return;
            const id = link.dataset.piece === 'word:resume' ? 'word:resume' : link.dataset.piece ?? '';
            if (id === 'word:resume' || id === RESUME_ID) void askResume();
            engine.lift(id);
            setRing(engine.screenRect(id));
          }}
          onBlur={ringOff}
          onClick={(event) => {
            const link = (event.target as HTMLElement).closest<HTMLElement>('[data-piece="resume"], [data-piece="word:resume"]');
            if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            ringOff();
            stageActs.current.prop(RESUME_ID);
          }}
        ><HeroOverlay shown={mode === 'wide'} lit={lit} greeting={greeting} /></div>
      )}
      {staged && !fallback && (
        <ul className="fb-sr" aria-label="On the mat">
          {STAGE_POSTERS.map((poster) => <li key={poster.id}><button type="button" tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => ringOn(poster.id, event)} onBlur={ringOff} onClick={() => { ringOff(); stageActs.current.prop(poster.id); }}>{poster.label}</button></li>)}
          <li><button type="button" tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => ringOn(ZOMATO_ID, event)} onBlur={ringOff} onClick={() => { ringOff(); stageActs.current.prop(ZOMATO_ID); }}>Zomato, Senior Product Analyst: a delivery rider's bag. Opens it and lays out his Zomato work.</button></li>
          <li><button type="button" tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => ringOn(HANDOUTS_ID, event)} onBlur={ringOff} onClick={() => { ringOff(); stageActs.current.prop(HANDOUTS_ID); }}>Presentations: a clipped stack of his printed decks. Deals them out on the mat.</button></li>
          <li><button type="button" tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => { void askResume(); ringOn(RESUME_ID, event); }} onBlur={ringOff} onClick={() => { ringOff(); stageActs.current.prop(RESUME_ID); }}>Résumé, one page. Opens it up close, with a download.</button></li>
          {/* the three design case studies: each lies on the mat as a clipboard */}
          {DESIGN_CARDS.map((card) => (
            <li key={card.id}><a href={card.href} tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => ringOn(`design:${card.id}`, event)} onBlur={ringOff}>{card.title}, {card.partner}. {card.line} Open the case study.</a></li>
          ))}
          <li><a href={SOUND_RECORD.href} tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => ringOn(SOUND_RECORD_PROP, event)} onBlur={ringOff}>{SOUND_RECORD.title}: a yellow record. Opens an interactive 3D board where you drag keys into records and layer real music.</a></li>
          <li><button type="button" tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => ringOn('book', event)} onBlur={ringOff} onClick={() => { ringOff(); stageActs.current.book(); }}>{book.title}, a flip book. {book.meta}. Opens the book.</button></li>
          {FLIP_BOOKS.filter((item) => item.slug !== book.slug).map((item) => (
            <li key={item.slug}><button type="button" tabIndex={mode === 'wide' ? 0 : -1} onFocus={(event) => { fetchOpeningSpread(item.slug); ringOn(`book:${item.slug}`, event); }} onBlur={ringOff} onClick={() => { ringOff(); stageActs.current.prop(`book:${item.slug}`); }}>{item.title}, a flip book. {item.meta}. Opens the book.</button></li>
          ))}
        </ul>
      )}
      {/* the keyboard's focus on the mat: the hidden button above has it, the ring is drawn round the thing it stands for */}
      {staged && !fallback && ring && mode === 'wide' && <div className="fb-stage-ring" aria-hidden="true" style={{ left: ring.left - 6, top: ring.top - 6, width: ring.width + 12, height: ring.height + 12 }} />}
      {staged && !fallback && (
        // (the Timeline cue is a tab lying on the mat, word:timeline, just under this link: the link stays as its real text,
        // unseen, ringing the tab on focus; a click on either goes to the timeline)
        <a className="fb-down" href="#timeline" data-piece="word:timeline" data-shown={mode === 'wide' && lit ? 'true' : 'false'} tabIndex={mode === 'wide' ? 0 : -1} style={{ opacity: 0 }} onFocus={(event) => ringOn('word:timeline', event)} onBlur={ringOff}>
          <span>Timeline</span><ChevronRight size={15} aria-hidden="true" style={{ transform: 'rotate(90deg)' }} />
        </a>
      )}
      {staged && looking && (
        // (one Back, always here: at the bag it steps out of an open thing first, and waits while the bag unpacks or packs)
        <button type="button" className="fb-pill fb-pill--back fb-exit" data-shown={mode === 'poster' && !(atBag && bagUi.busy) ? 'true' : 'false'} tabIndex={mode === 'poster' && !(atBag && bagUi.busy) ? 0 : -1} onClick={() => (atBag ? bagBack() : window.history.back())}><ArrowLeft size={16} aria-hidden="true" /><span>{atBag && bagUi.open ? 'Back to the bag' : 'Back to the mat'}</span></button>
      )}
      {/* the bag's things are pictures on the mat: here they are as text and buttons, unseen (the bag has no panel beside it) */}
      {staged && atBag && (
        <aside className="fb-sr" aria-live="polite">
          <h2>{ZOMATO_LOOK.label}, {BAG_TEXT.team}, {BAG_TEXT.when}</h2>
          <p>{BAG_TEXT.summary}</p>
          <ul>
            {BAG_THINGS.map((thing) => (
              <li key={thing.id}><button type="button" tabIndex={mode === 'poster' && !bagUi.busy ? 0 : -1} aria-pressed={bagUi.open === thing.id} onClick={() => bagOpen(thing.id)}>{thing.label}</button></li>
            ))}
          </ul>
          <ul>{BAG_TEXT.lines.map((line) => <li key={line}>{line}</li>)}</ul>
          {(['home', 'friends', 'rescue'] as const).map((id) => (
            <section key={id}><h3>{BAG_TEXT.projects[id].title}, {BAG_TEXT.projects[id].role}</h3><p>{BAG_TEXT.projects[id].lines.join(' ')} {BAG_TEXT.projects[id].foot}</p></section>
          ))}
          <ul>{BAG_TEXT.press.articles.map((article) => <li key={article.href}><a href={article.href} target="_blank" rel="noopener noreferrer" tabIndex={mode === 'poster' && !bagUi.busy ? 0 : -1}>{article.title} ({article.source})</a></li>)}</ul>
        </aside>
      )}
      {/* the decks are pictures on the mat: here they are as text and links, unseen (the stack has no panel beside it) */}
      {staged && atStack && (
        <aside className="fb-sr" aria-live="polite">
          <h2>Presentations, a stack of printed decks</h2>
          <ul>
            {HANDOUTS_DECKS.slice().reverse().map((deck) => (
              <li key={deck.slide}>{deck.url ? <a href={deck.url} target="_blank" rel="noopener noreferrer" tabIndex={mode === 'poster' ? 0 : -1}>{deck.title}. Opens its website.</a> : deck.title}</li>
            ))}
          </ul>
        </aside>
      )}
      {/* the opened GitHub card is a picture on the mat: here is what it says, unseen */}
      {staged && atGithub && (
        <aside className="fb-sr" aria-live="polite">
          <h2>GitHub: {GITHUB.commits} commits to this portfolio</h2>
          <p>The year's commits, one bar a day, with the home page as it looked in December, April and November.</p>
          <a href={GITHUB.href} target="_blank" rel="noopener noreferrer" tabIndex={mode === 'poster' ? 0 : -1}>Open the repository on GitHub</a>
        </aside>
      )}
      {staged && looking && !atBag && !atStack && !atGithub && (
        <aside
          className="fb-look"
          data-shown={mode === 'poster' ? 'true' : 'false'}
          data-set={['rescue', 'self', 'snapdeal'].includes(looking.id) ? 'true' : 'false'}
          data-profile={looking.id === 'photo' ? 'true' : 'false'}
          data-sheet={looking.id === RESUME_ID ? 'true' : 'false'}
          // the résumé is read on the left: its words take a narrower column at the right (the engine keeps that room clear)
          style={looking.id === RESUME_ID ? { width: sheetAside(viewport.w), right: SHEET_ASIDE_RIGHT } : undefined}
          aria-live="polite"
        >
          {looking.id === 'photo' ? <MatProfile /> : <><h2>{looking.id === 'rescue' ? 'Zomato Food Rescue' : looking.label}</h2></>}
          {/* the set's cards are pictures: here is what they say */}
          {looking.id === 'rescue' && (
            <ol className="fb-sr">{RESCUE_STORY.map((card) => <li key={card.id}>{card.kicker}. {card.figure ? `${card.figure} ` : ''}{card.title}. {card.lines.join(' ')}</li>)}</ol>
          )}
          {looking.id === 'self' && (
            <ol className="fb-sr">{SELF_STORY.map((card) => <li key={card.id}>{card.kicker}. {card.title}. {card.lines.join(' ')}</li>)}</ol>
          )}
          {looking.id === 'snapdeal' && (
            <ol className="fb-sr">{SNAPDEAL_STORY.map((card) => <li key={card.id}>{card.kicker}. {card.title}. {card.lines.join(' ')}</li>)}</ol>
          )}
          {looking.id !== 'photo' && <div className="fb-look-actions">
            {(POSTER_LINKS[looking.id] ?? []).map((link) => <a key={link.href} className="fb-pill fb-pill--open" href={link.href}>{link.label} <ArrowUpRight size={16} aria-hidden="true" /></a>)}
            {looking.id === 'self' && <a className="fb-pill fb-pill--open" href="https://agentvault.io/" target="_blank" rel="noopener noreferrer">Visit Agent Vault <ArrowUpRight size={16} aria-hidden="true" /></a>}
            {looking.id === RESUME_ID && <a className="fb-pill fb-pill--open" href={RESUME_PDF} download>Download PDF <Download size={16} aria-hidden="true" /></a>}
            {/* how to read on, and how far down the page the reader is */}
            {looking.id === RESUME_ID && <p className="fb-look-read"><span>Scroll to read down the page</span><i aria-hidden="true"><b style={{ transform: `translateY(${(readAt * 200).toFixed(1)}%)` }} /></i></p>}
          </div>}
        </aside>
      )}

      <header className="fb-top" inert={!landed}>
        <a className="fb-pill fb-pill--back" href={homeLink?.home ?? '/'} onClick={goHome}><ArrowLeft size={16} aria-hidden="true" /><span>{staged || onMat ? 'Back to the mat' : 'Back'}</span></a>
        <div className="fb-heading">
          <h1>{book.title}</h1>
          <p>{book.meta}</p>
        </div>
        {link && (!book.solo || spread) ? <a className="fb-pill fb-pill--open" href={link.href}><span>{link.label}</span><ArrowUpRight size={16} aria-hidden="true" /></a> : <span />}
      </header>

      {FLIP_BOOKS.length > 1 && !staged && !onMat && <nav className="fb-shelf" aria-label="Choose a book">
        {FLIP_BOOKS.map((item) => (
          <button
            key={item.slug}
            type="button"
            className="fb-spine"
            aria-pressed={item.slug === book.slug}
            aria-label={`${item.title}, ${item.client}`}
            style={{ '--spine': item.theme.spine, '--spine-ink': item.theme.spineInk } as React.CSSProperties}
            onClick={() => onSelectBook(item.slug)}
          >
            <span className="fb-spine-title">{item.title}</span>
            <span className="fb-spine-client">{item.client}</span>
          </button>
        ))}
      </nav>}

      {/* a solo sheet is captioned like a plate in an art book: real text set under it, never over the picture */}
      {captioned && sheet && (
        <section
          key={current.id}
          className="fb-caption"
          inert={!landed}
          aria-live="polite"
          style={{ left: Math.max(16, sheet.left), top: sheet.bottom + 18, width: Math.min(viewport.w - 32, sheet.right - sheet.left) }}
        >
          <div>
            <p className="fb-caption-kicker">{current.kicker}</p>
            <h2>{current.title}</h2>
          </div>
          <div>
            {current.body && <p className="fb-caption-body">{current.body}</p>}
            {link && <a className="fb-caption-link" href={link.href}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></a>}
          </div>
        </section>
      )}

      <button type="button" className="fb-arrow fb-arrow-prev" inert={!landed} onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Previous page"><ChevronLeft size={22} aria-hidden="true" /></button>
      <button type="button" className="fb-arrow fb-arrow-next" inert={!landed} onClick={() => goTo(page + 1)} disabled={page === count - 1} aria-label="Next page"><ChevronRight size={22} aria-hidden="true" /></button>

      <footer className="fb-foot" inert={!landed}>
        {/* two pages side by side are small on a small window: one press brings the story page up close */}
        {spread && !fallback && page > 0 && (
          <button type="button" className="fb-read" aria-pressed={reading} onClick={() => engineRef.current?.lean(reading ? 0 : -1)}>
            {reading ? <ZoomOut size={15} aria-hidden="true" /> : <ZoomIn size={15} aria-hidden="true" />}
            <span>{reading ? 'Step back' : 'Read up close'}</span>
          </button>
        )}
        {/* open as spreads, the book has few enough stops to name each one: the story's steps, in order */}
        {spread && <ol className="fb-chapters" aria-label="Chapters">
          {Array.from({ length: count }, (_, index) => {
            const story = index === 0 ? null : book.pages[Math.min(index * 2 - 1, total - 1)];
            const tone = (story ?? pageAt(index)).tone;
            return (
              <li key={`${index}-${story?.id ?? 'cover'}`}>
                <button type="button" className="fb-chapter" style={tone ? { '--dot': tone.mid } as React.CSSProperties : undefined} aria-current={index === page ? 'step' : undefined} onClick={() => goTo(index)}>
                  {story && <span className="fb-chapter-n" aria-hidden="true">{String(index).padStart(2, '0')}</span>}
                  <span>{story ? story.word : 'Cover'}</span>
                </button>
              </li>
            );
          })}
        </ol>}
        {!spread && <ol className="fb-dots" aria-label="Pages">
          {Array.from({ length: count }, (_, index) => pageAt(index)).map((item, index) => (
            <li key={`${index}-${item.id}`}>
              <button type="button" className="fb-dot" style={item.tone ? { '--dot': item.tone.mid } as React.CSSProperties : undefined} aria-current={index === page ? 'page' : undefined} aria-label={`Page ${index + 1} of ${count}: ${applyCase(book, item.word)}`} onClick={() => goTo(index)}>
                <span aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>}
      </footer>

      {/* the page as text, for screen readers and anything that cannot see the canvas */}
      <section className="fb-sr" aria-live="polite" aria-atomic="true">
        {facing && <p>{facing.kicker}. {facing.title} {facing.body}</p>}
        {facing && <p>Picture: {facing.art.alt}</p>}
        <h2>{applyCase(book, current.word)}</h2>
        {!(captioned) && <p>{current.kicker}</p>}
        {!(captioned) && <p>{current.title}</p>}
        {!(captioned) && current.body && <p>{current.body}</p>}
        {current.stats && <ul>{current.stats.map((stat) => <li key={stat.label}>{stat.value} {stat.label}</li>)}</ul>}
        {current.steps && <ol>{current.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
        {current.note && <p>{current.note}</p>}
        <p>Picture: {current.art.alt}</p>
        {!(captioned) && !spread && link && <a href={link.href}>{link.label}</a>}
      </section>
    </main>
    {/* the second screen: ordinary page content that scrolls up over the same live mat */}
    {staged && !fallback && lit && (
      <div ref={portRef} className="fb-second-port">
        {/* the timeline's words and the links over its cards (the cards themselves are on the mat, in the 3D scene) */}
        <React.Suspense fallback={null}><TimelineMat engine={timelineEngine} place={timelinePlace} perUnit={timelinePerUnit} holdRef={holdRef} shown={mode === 'wide'} /></React.Suspense>
        <div ref={secondRef} className="fb-second" data-shown={mode === 'wide' ? 'true' : 'false'} inert={mode !== 'wide'}>
          <div className="fb-second-plane"><React.Suspense fallback={null}><TimelineMatRoom holdRef={holdRef} /></React.Suspense>
            {/* after the timeline, as on the old home page: experience, then the projects */}
            <React.Suspense fallback={null}><WorkSection /></React.Suspense></div>
        </div>
      </div>
    )}
    {staged && !fallback && lit && <div ref={roomRef} className="fb-second-room" aria-hidden="true" />}
    </>
  );
};

const FlipBookApp: React.FC<{ initialSlug: string | null }> = ({ initialSlug }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const flat = params.get('flat');
  const debug = params.has('debug');
  const homeLink = useMemo(() => readHomeLink(params), [params]);
  const [slug, setSlug] = useState(() => (initialSlug && FLIP_BOOKS_BY_SLUG.has(initialSlug) ? initialSlug : FLIP_BOOKS[0].slug));
  const book = FLIP_BOOKS_BY_SLUG.get(slug) ?? FLIP_BOOKS[0];

  const selectBook = useCallback((next: string) => {
    if (!FLIP_BOOKS_BY_SLUG.has(next)) return;
    setSlug(next);
    window.history.replaceState(window.history.state, '', `/book/${next}${window.location.search}`);
  }, []);

  if (flat === 'live') return <LivePreview book={book} />;
  if (flat) return <FlatReview book={book} portrait={flat === 'portrait'} />;
  return <BookStage book={book} onSelectBook={selectBook} debug={debug} homeLink={homeLink} />;
};

/** The home page as a place: the mat seen from above, the posters and the book lying on it. Served at /mat. */
export const MatHome: React.FC = () => {
  const debug = useMemo(() => new URLSearchParams(window.location.search).has('debug'), []);
  // the book that is live on the mat: the first one, until another is picked up
  const [slug, setSlug] = useState(FLIP_BOOKS[0].slug);
  const pick = useCallback((next: string) => { if (FLIP_BOOKS.some((item) => item.slug === next)) setSlug(next); }, []);
  return <BookStage book={FLIP_BOOKS_BY_SLUG.get(slug) ?? FLIP_BOOKS[0]} onSelectBook={pick} debug={debug} homeLink={null} staged />;
};

export default FlipBookApp;
