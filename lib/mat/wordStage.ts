/**
 * The home page's words as things on the stage (direction A, Adi 2026-11-16): every piece drawn by lib/mat/wordPieces.ts and
 * lib/mat/matPieces.ts, laid out by layoutWords, turned into the engine's props. FlipBookApp's loadStage adds these after
 * the posters and booklets; review/home-mat-words/real.html lays out exactly the same.
 */
import type { StageProp } from '../flipbook/engine';
import { drawGithubSticker, drawResumeSheet, drawWorkTag } from './matPieces';
import { WORDS_BIG_BELOW, drawFactsCard, drawGreetingLetters, drawNameLabel, drawSelfStrip, drawTab, layoutWords } from './wordPieces';

/** The menu on the mat, in reading order, with where each goes (HeroOverlay has the same links as text). */
export const MENU = [
  { id: 'word:work', word: 'Work', href: '#work' },
  { id: 'word:experience', word: 'Experience', href: '#timeline' },
  { id: 'word:resume', word: 'Résumé', href: 'resume' },
] as const;

/** Where each word piece leads. 'resume' flies down to the résumé sheet; the rest are links, without a fly-in. */
export const WORD_LINKS: Record<string, string> = {
  'word:name': '/',
  'piece:github': 'https://github.com/adiind/Porfolio',
  'piece:work': '#work',
  'word:linkedin': 'https://www.linkedin.com/in/adiind',
  'word:timeline': '#timeline',
  ...Object.fromEntries(MENU.map((item) => [item.id, item.href])),
};

/** Pieces that are only to be read (no hover lift, nothing happens on a click). */
export const STILL_WORDS = ['word:hello', 'word:say', 'word:facts'] as const;

export interface WordStageInput {
  /** page pixels to table units, and a page point to a table point (as loadStage's `at`) */
  px: number;
  at(x: number, y: number): { x: number; y: number };
  selfLogo: HTMLImageElement;
  resumePage: HTMLImageElement;
  /** the strip of tool marks the GitHub sticker carries (public/images/mat/tool-marks.webp) */
  toolMarks?: HTMLImageElement;
  /** the photo poster's place in page pixels (data/matStage.json), for the résumé beside it */
  photo: { x: number; y: number; w: number; h: number };
  /** the résumé sheet's paper width in page pixels and its turn (data/matStage.json pieces.resume) */
  resume: { w: number; turn: number };
  /** the window's width when the stage is laid out (narrower windows get larger type) */
  windowWidth: number;
  /** the résumé's close-up: sheet height for readable body text, and the room kept at the right */
  read: { minPx: number; aside: number };
  /** the loading greeting is on screen: the cut letters are held back until it has landed on them (StageProp.held) */
  holdGreeting: boolean;
}

/**
 * The résumé sheet's picture, from a page picture of any size: the stage starts with a small one (it is about 120 px wide on
 * screen) and swaps in the full page when the sheet is about to be read (FlipBookApp). Same shape either way.
 */
export function resumeSheetPicture(page: HTMLImageElement, paperW: number, windowWidth: number) {
  // (its tape's label must read at 11 px or more on a 1024-wide window, where the stage is drawn at 0.71)
  return drawResumeSheet(page, paperW, 'Résumé', windowWidth < WORDS_BIG_BELOW ? 17 : 13);
}

/** The pieces as drawn, and where they lie on the page: the same for every book picked up, so drawn once per size. */
function drawWords(big: boolean, selfLogo: HTMLImageElement, resumePage: HTMLImageElement, resumeW: number, windowWidth: number, toolMarks?: HTMLImageElement) {
  const name = drawNameLabel(big);
  const github = drawGithubSticker(big ? 1.15 : 1, toolMarks);
  const work = drawWorkTag(big ? 1.2 : 1);
  const linkedin = drawTab('LinkedIn', { big, mark: 'in' });
  const timeline = drawTab('Timeline', { big, mark: 'down' });
  const hello = drawGreetingLetters();
  const say = drawSelfStrip(selfLogo, big);
  const facts = drawFactsCard(big);
  const menu = MENU.map((item) => ({ id: item.id, ...drawTab(item.word, { big }) }));
  const place = layoutWords({ name, github, work, linkedin, timeline, hello, say, facts }, menu);
  // (its tape's label must read at 11 px or more on a 1024-wide window, where the stage is drawn at 0.71)
  const sheet = resumeSheetPicture(resumePage, resumeW, windowWidth);
  return { name, github, work, linkedin, timeline, hello, say, facts, menu, place, sheet };
}
/**
 * The last set drawn, and what it was drawn from. Picking up another book lays the stage out again round it: the words
 * are the very same pictures then (no drawing, and the engine finds their pictures already on the GPU).
 */
let drawnWords: { key: string; logo: HTMLImageElement; page: HTMLImageElement; marks?: HTMLImageElement; words: ReturnType<typeof drawWords> } | null = null;

/** The props, and the greeting's letter setting (where its letters sit in its picture) for the loading greeting's landing. */
export function wordProps(input: WordStageInput): { props: StageProp[]; greeting: ReturnType<typeof drawGreetingLetters>['set'] } {
  const big = input.windowWidth < WORDS_BIG_BELOW;
  const { px, at } = input;
  const key = `${big}|${input.resume.w}`;
  if (!drawnWords || drawnWords.key !== key || drawnWords.logo !== input.selfLogo || drawnWords.page !== input.resumePage || drawnWords.marks !== input.toolMarks) {
    drawnWords = { key, logo: input.selfLogo, page: input.resumePage, marks: input.toolMarks, words: drawWords(big, input.selfLogo, input.resumePage, input.resume.w, input.windowWidth, input.toolMarks) };
  }
  const { name, github, work, linkedin, timeline, hello, say, facts, menu, place, sheet } = drawnWords.words;
  const prop = (id: string, piece: { image: HTMLCanvasElement; w: number; h: number }, extra: Partial<StageProp> = {}): StageProp => {
    const spot = place[id];
    return {
      id, image: piece.image, ...at(spot.x + piece.w / 2, spot.y + piece.h / 2), w: piece.w / px, h: piece.h / px,
      radius: 6 / px, turn: spot.turn, ...extra,
    };
  };
  // the résumé lies beside the photo, tops level, a little gap between
  const sheetX = input.photo.x + input.photo.w + 34;
  const sheetY = input.photo.y + 6;
  const props: StageProp[] = [
    {
      id: 'resume', image: sheet.image, ...at(sheetX + sheet.w / 2, sheetY + sheet.h / 2), w: sheet.w / px, h: sheet.h / px,
      radius: 0, cutout: true, alphaShadow: true, turn: input.resume.turn, curl: 0.03, read: input.read,
    },
    prop('word:name', name, { radius: 5 / px }),
    prop('piece:github', github, { radius: github.h / 2 / px }),
    ...menu.map((tab) => prop(tab.id, tab)),
    prop('word:hello', hello, { radius: 0, cutout: true, alphaShadow: true, still: true, held: input.holdGreeting }),
    prop('word:say', say, { radius: 7 / px, still: true }),
    prop('word:facts', facts, { radius: 8 / px, still: true }),
    prop('piece:work', work, { radius: 0, cutout: true, alphaShadow: true }),
    prop('word:linkedin', linkedin),
    prop('word:timeline', timeline),
  ];
  return { props, greeting: hello.set };
}
