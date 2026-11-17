/** Content model for the project flip books. Pages are data; the engine and compositor never hard-code a project. */

export type PageLayout = 'bleed' | 'split' | 'band' | 'paper' | 'poster';

/**
 * One colour family for a page: the reference books give every page its own
 * world, and the table and controls follow it.
 */
export interface PageTone {
  /** Table colour under this page, and the brighter pool of light on it. */
  stage: string;
  stageLight: string;
  /** Controls drawn over the table. */
  chrome: string;
  chromeMuted: string;
  /** The family's saturated middle tone (the page's dot in the page row). */
  mid: string;
  /** Darkest and palest tones of the family: caption panel and caption text. */
  deep: string;
  pale: string;
}

export interface PageArt {
  src: string;
  /** Source pixel size, used to pick the layout and to place the picture. */
  w: number;
  h: number;
  /** White image whose alpha is the subject mask (scripts/flipbook/make-mattes.sh). */
  matte?: string;
  /** True when the picture itself is a cut-out on a transparent ground. */
  cutout?: boolean;
  /** Point of interest (0..1) kept in view when the picture is cropped. */
  focus?: [number, number];
  alt: string;
}

export interface PageStat {
  value: string;
  label: string;
}

export interface FlipPage {
  id: string;
  kicker: string;
  /** The giant word. On poster pages it is lettered inside the picture itself. */
  word: string;
  /** This page's own colour family. */
  tone?: PageTone;
  /** An approved wordmark image to use in place of typeset letters (a cover logo). */
  wordImage?: { src: string };
  title: string;
  body?: string;
  stats?: PageStat[];
  steps?: string[];
  note?: string;
  art: PageArt;
  layout?: PageLayout;
  /**
   * Name of a live scene (lib/flipbook/live): the page is drawn again every
   * frame instead of being one still picture. `art` stays as the still it falls back to.
   */
  live?: string;
  /** The page carries its own words (a story page): no caption is set under it. */
  selfCaptioned?: boolean;
  /** Which side the text panel sits on for split and paper pages. Alternates when omitted. */
  panelSide?: 'left' | 'right';
  /** Corner for the caption card on full-picture pages, or a band across the foot. */
  captionAt?: 'bl' | 'br' | 'tl' | 'tr' | 'foot';
  /** Word placement overrides, as fractions of the page. */
  wordTop?: number;
  wordHeight?: number;
  wordAlign?: 'left' | 'right' | 'center';
  /** Poster pages: caption in the family's pale tone (over a soft shade) or its deep tone (on light paper). */
  captionInk?: 'pale' | 'deep';
  /** Colour of the word where it sits on flat colour, when the theme's does not suit the page. */
  wordColor?: string;
  /** How far the word may slip behind a cut-out, as a fraction of the cut-out's width. */
  wordOverlap?: number;
  /** Flat colour behind this page's text, and its text colours, when they differ from the theme. */
  panelColor?: string;
  panelInk?: string;
  panelMuted?: string;
  panelAccent?: string;
  /**
   * Leave a band of flat colour above the picture: the frame starts this far
   * down the page (fraction of its height). Subjects rise out over the edge.
   */
  artTop?: number;
  /** Part of the frame's width (0..1) across which subjects may rise above it. Default: all of it. */
  breakoutX?: [number, number];
  /** How far down the page the whole picture is pushed (fraction of its height). */
  artShift?: number;
  /** Picture height on split pages, as a fraction of the page height. */
  artScale?: number;
  /** Portrait (phone) overrides. */
  portrait?: { focus?: [number, number]; wordTop?: number; wordHeight?: number };
  cta?: { label: string; href: string };
}

export interface BookTheme {
  /** Table colour, and the brighter pool of light on it. */
  stage: string;
  stageLight: string;
  /** Text colour for the controls drawn over the table. */
  chrome: string;
  chromeMuted: string;
  /** Page stock and the text panel. */
  paper: string;
  panel: string;
  panelInk: string;
  panelMuted: string;
  panelAccent: string;
  /** Giant word: colour on the panel, and colour once it crosses onto the picture. */
  wordOnPanel: string;
  wordOnArt: string;
  /** Caption card on full-picture pages. */
  card: string;
  cardInk: string;
  cardMuted: string;
  cardAccent: string;
  /** Reverse side of a leaf. */
  back: string;
  backInk: string;
  /** Spine colour on the shelf. */
  spine: string;
  spineInk: string;
  displayFont: string;
  displayWeight: number;
  displayTracking: number;
  wordCase: 'upper' | 'lower' | 'as-is';
  textFont: string;
}

export interface FlipBook {
  slug: string;
  /** Selected Work project this book summarises. Omitted when each page is its own project. */
  projectId?: string;
  /** Where every page's "Open" pill goes when the book has no Selected Work page (Jarvis: its GitHub). */
  link?: { label: string; href: string };
  title: string;
  client: string;
  meta: string;
  theme: BookTheme;
  /** The inside of the back cover (the blank page after the last one) is a plain board: no ghosted word, no running label. */
  plainBack?: boolean;
  /** One sheet floating on its own: a turned page leaves the stage instead of stacking on the left. */
  solo?: boolean;
  /**
   * On a wide screen, open as a real book: two pages side by side, each leaf
   * carrying one page on its face and the next on its back. Pages then come
   * in pairs after the cover: a left-hand page, then the right-hand page it faces.
   */
  spread?: boolean;
  /** A photograph of the surface the book lies on (a table top), in place of a plain coloured stage. */
  table?: string;
  /**
   * 'mat': the book lies on the home page's blue cutting mat, in the same window light,
   * so opening a book from the home page stays on one surface.
   */
  surface?: 'mat';
  /** The colour of the cover boards that show around the pages when the book lies open as spreads. */
  board?: string;
  pages: FlipPage[];
}
