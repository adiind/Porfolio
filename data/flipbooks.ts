/**
 * Flip-book editions of three human-centred design projects.
 *
 * Every line of copy here is taken from the approved case-study pages
 * (Squad Up and FamilySync story pages, data/pgStory.ts and the P&G page).
 * Do not add facts, numbers or captions that those pages do not already carry.
 * P&G stays within what is already published: the project is under NDA.
 */

import type { BookTheme, FlipBook, FlipPage, PageTone } from '../lib/flipbook/types';
import type { JarvisPictureCopy, JarvisStoryPage } from '../lib/flipbook/live/jarvis/kit';
import { BLUE, GREEN, PLUM, RED, ROSE } from '../lib/flipbook/live/jarvis/kit';
import type { StoryTone } from '../lib/flipbook/live/suryaStory';
import { PAGES as JARVIS_STORY_PAGES } from '../lib/flipbook/live/jarvisStory';
import { COPY as ANSWER_COPY } from '../lib/flipbook/live/jarvisAnswer';
import { COPY as CONTROL_COPY } from '../lib/flipbook/live/jarvisControl';
import { COPY as DIY_COPY } from '../lib/flipbook/live/jarvisDiy';
import { COPY as HERE_COPY } from '../lib/flipbook/live/jarvisHere';
import { COPY as LISTEN_COPY } from '../lib/flipbook/live/jarvisListen';
import { COPY as PRESENT_COPY } from '../lib/flipbook/live/jarvisPresent';

const GEIST = '"FB Geist", "Geist", system-ui, sans-serif';
const BRICOLAGE = '"FB Bricolage", "Bricolage Grotesque", "FB Geist", system-ui, sans-serif';

const squadTheme: BookTheme = {
  stage: '#b3382b',
  stageLight: '#cf4e3c',
  chrome: '#fff3d6',
  chromeMuted: '#fde6da',
  paper: '#f6efe3',
  panel: '#f2b726',
  panelInk: '#2b2119',
  panelMuted: '#5c4418',
  panelAccent: '#8c2a1e',
  wordOnPanel: '#b8301f',
  wordOnArt: '#ffc531',
  card: '#f2b726',
  cardInk: '#2b2119',
  cardMuted: '#5c4418',
  cardAccent: '#a12f22',
  back: '#f6efe3',
  backInk: '#a12f22',
  spine: '#f2b726',
  spineInk: '#2b2119',
  displayFont: BRICOLAGE,
  displayWeight: 800,
  displayTracking: -0.035,
  wordCase: 'upper',
  textFont: GEIST,
};

const familyTheme: BookTheme = {
  stage: '#1f478f',
  stageLight: '#3565b8',
  chrome: '#fbf6ee',
  chromeMuted: '#b9d5ff',
  paper: '#fbf6ee',
  panel: '#0f2247',
  panelInk: '#fbf6ee',
  panelMuted: '#b9d5ff',
  panelAccent: '#e7c27a',
  wordOnPanel: '#e7c27a',
  wordOnArt: '#fdf4e2',
  card: '#fbf6ee',
  cardInk: '#0d1b33',
  cardMuted: '#3b4c68',
  cardAccent: '#285ca0',
  back: '#e7c27a',
  backInk: '#173b79',
  spine: '#fbf6ee',
  spineInk: '#173b79',
  displayFont: GEIST,
  displayWeight: 800,
  displayTracking: -0.055,
  wordCase: 'upper',
  textFont: GEIST,
};

const pgTheme: BookTheme = {
  stage: '#d3bf9f',
  stageLight: '#e6d5ba',
  chrome: '#12314f',
  chromeMuted: '#3a4d61',
  paper: '#f7eedf',
  panel: '#f7eedf',
  panelInk: '#12314f',
  panelMuted: '#42586c',
  panelAccent: '#974936',
  wordOnPanel: '#12314f',
  wordOnArt: '#12314f',
  card: '#f7eedf',
  cardInk: '#12314f',
  cardMuted: '#42586c',
  cardAccent: '#974936',
  back: '#12314f',
  backInk: '#f3e8d7',
  spine: '#12314f',
  spineInk: '#f3e8d7',
  displayFont: GEIST,
  displayWeight: 700,
  displayTracking: -0.06,
  wordCase: 'lower',
  textFont: GEIST,
};

const mcd = (name: string) => `/images/mcd/squad-up/scenes/${name}.webp`;
const fs = (name: string) => `/work/familysync-assets/assets/scenes/${name}.webp`;
const room = (name: string) => `/images/pg/rooms/${name}.webp`;
const matte = (name: string) => `/images/flipbook/mattes/${name}.webp`;

const buildsTheme: BookTheme = {
  stage: '#f4cfa0',
  stageLight: '#fbe2c2',
  chrome: '#6f2a06',
  chromeMuted: '#94481a',
  paper: '#fff0dc',
  panel: '#6b2906',
  panelInk: '#fff0dc',
  panelMuted: '#fff0dc',
  panelAccent: '#fff0dc',
  wordOnPanel: '#fff0dc',
  wordOnArt: '#fff0dc',
  card: '#fff0dc',
  cardInk: '#6b2906',
  cardMuted: '#6b2906',
  cardAccent: '#6b2906',
  back: '#6b2906',
  backInk: '#fff0dc',
  spine: '#e8721c',
  spineInk: '#fff0dc',
  displayFont: GEIST,
  displayWeight: 800,
  displayTracking: -0.05,
  wordCase: 'upper',
  textFont: GEIST,
};

/**
 * One book, one page per build, each page its own colour family. The pictures
 * were generated for this book from photos of the real objects; the lettering
 * is part of each picture. Captions quote the project files in data/projects.
 */
export const BUILDS_BOOK: FlipBook = {
  slug: 'builds',
  title: 'Builds',
  client: 'Personal',
  meta: 'Three things I designed, wired and coded',
  theme: buildsTheme,
  solo: true,
  pages: [
    {
      id: 'surya',
      kicker: 'Surya · kinetic wall timepiece',
      word: 'Awake',
      title: 'Who is awake right now?',
      body: 'A wall piece with one flower for each person in my family. It opens when they wake and closes when they sleep, wherever they are.',
      layout: 'poster',
      live: 'surya-awake',
      captionAt: 'bl',
      tone: { stage: '#160a04', stageLight: '#2a150a', chrome: '#fbe6cf', chromeMuted: '#d9b48f', mid: '#e8721c', deep: '#6b2906', pale: '#fff0dc' },
      art: { src: '/images/flipbook/builds/awake.webp', w: 1536, h: 1024, matte: matte('awake'), focus: [0.5, 0.48], alt: 'The word Awake drawn as tall carved letters in orange. A wooden mandala clock rises behind them like a sun. On the night side a small person sleeps in a hammock; on the morning side another stretches awake beside an open flower.' },
    },
    {
      id: 'jarvis',
      kicker: 'Jarvis · local voice assistant',
      word: 'Listen',
      title: 'It listens in the room, not in the cloud.',
      body: 'Walk up and it wakes, then local recognition, then a message to the lights. Top 10 in an Edge AI and IoT challenge open across India and ASEAN, hosted by Circuit Digest and DigiKey.',
      layout: 'poster',
      captionAt: 'br',
      tone: { stage: '#0e0716', stageLight: '#1e122c', chrome: '#efe3fa', chromeMuted: '#bfa9d6', mid: '#8d5cbf', deep: '#35184e', pale: '#f4e9fc' },
      art: { src: '/images/flipbook/builds/listen.webp', w: 1536, h: 1024, matte: matte('listen'), focus: [0.5, 0.51], alt: 'The word Listen drawn as chunky violet letters in a room at night. A small person speaks; a ribbon of sound runs through the letters to a small black box, and a lamp switches on.' },
      cta: { label: 'Jarvis on GitHub', href: 'https://github.com/adiind/diy-jarvis' },
    },
    {
      id: 'plotter',
      kicker: 'Plotter · speech-to-draw machine',
      word: 'Speak',
      title: 'Say it, and it draws it.',
      body: 'A DIY plotter that turns spoken words into drawings: speech to text, text to single-line strokes, strokes to G-code.',
      layout: 'poster',
      captionAt: 'tr',
      tone: { stage: '#170806', stageLight: '#2b1310', chrome: '#fde4dd', chromeMuted: '#dba99f', mid: '#d6483c', deep: '#701e18', pale: '#fde8e2' },
      art: { src: '/images/flipbook/builds/speak.webp', w: 1536, h: 1024, matte: matte('speak'), focus: [0.5, 1], alt: 'The word Speak drawn in one blue pen line across a huge cream sheet on a coral ground. A small person speaks at the left; the line ends at a small pen plotter still drawing the last letter.' },
      cta: { label: 'Open Plotter', href: '/work/plotter' },
    },
  ],
};

/** A resting frame of each live page, shown if the page cannot be drawn live. */
const surya = (page: string) => `/images/flipbook/surya/${page}/still.webp`;

/**
 * Surya told as a book: one idea to a page, each page its own colour family
 * and each one alive (lib/flipbook/live). The pictures were generated for
 * this book. The captions use Adi's own words about the piece and the
 * project file in data/projects/surya.json; nothing else is claimed.
 */
/**
 * Surya told as a book. Picture pages play one idea each and are alive
 * (lib/flipbook/live); between them sit story pages that show the making:
 * a real photograph, a few words, and a line drawing of the real part taken
 * from Adi's laser file and printed parts. On a wide screen the book opens
 * as spreads, story page on the left, picture page on the right; on a narrow
 * one the same pages follow each other.
 *
 * Words: Adi's own about the piece, data/projects/surya.json, his firmware
 * (lights, motors, buttons, Home Assistant) and his write-up of the presence
 * feature (radar, print progress, calendar). Nothing else is claimed.
 */
export const SURYA_BOOK: FlipBook = {
  slug: 'surya',
  title: 'Surya',
  client: 'Personal',
  meta: 'A wall piece that shows when my family is awake',
  theme: buildsTheme,
  solo: true,
  spread: true,
  // the book lies on the home page's cutting mat; its boards are the brown of its cover
  surface: 'mat',
  board: '#3a1d10',
  pages: [
    {
      id: 'cover',
      kicker: 'Surya · a flip book',
      word: 'Surya',
      title: 'A wall piece that shows when my family is awake.',
      body: 'Turn the page.',
      layout: 'poster',
      live: 'surya-cover',
      selfCaptioned: true,
      tone: { stage: '#160a04', stageLight: '#2a150a', chrome: '#fbe6cf', chromeMuted: '#d9b48f', mid: '#e8721c', deep: '#6b2906', pale: '#fff0dc' },
      art: { src: surya('cover'), w: 1600, h: 960, alt: 'Cover: a photograph of Surya, an engraved wooden mandala with a lit display reading ETA 18M and three printed flowers, beside its name.' },
    },
    {
      id: 'why',
      kicker: '01 · Why',
      word: 'Why',
      title: 'I kept missing their calls.',
      body: 'I moved to the US and never knew if my family was awake. A screen can show their time. It cannot show them. The choice: movement, not a screen. It shows someone is there without asking for attention. The cost: more mechanics, slower changes.',
      layout: 'poster',
      live: 'surya-story-why',
      selfCaptioned: true,
      tone: { stage: '#160a04', stageLight: '#2a150a', chrome: '#fbe6cf', chromeMuted: '#d9b48f', mid: '#e8721c', deep: '#6b2906', pale: '#fff0dc' },
      art: { src: surya('why'), w: 1600, h: 960, alt: 'A photograph of Surya with a ring drawn around each of its three flowers: one flower for one person.' },
    },
    {
      id: 'awake',
      kicker: 'Surya · the idea',
      word: 'Awake',
      title: 'Who is awake right now?',
      body: 'I moved to the US and kept missing calls with my family, because I never knew if they were awake. Surya has one flower for each of them. It opens when they wake and closes when they sleep.',
      layout: 'poster',
      live: 'surya-awake',
      tone: { stage: '#160a04', stageLight: '#2a150a', chrome: '#fbe6cf', chromeMuted: '#d9b48f', mid: '#e8721c', deep: '#6b2906', pale: '#fff0dc' },
      art: { src: surya('awake'), w: 1600, h: 960, alt: 'The word Awake as tall carved letters. Morning light moves across them. Small people sleeping on the letters wake as it reaches them, and their flowers open on a wooden mandala behind.' },
    },
    {
      id: 'form',
      kicker: '02 · Form',
      word: 'Form',
      title: 'A mandala, cut by laser.',
      body: 'The mandala comes from my heritage in India. This was my first try at laser cutting and sandblasting. The drawing is the real laser file: one cut line, one window for the display, three holes for the flowers, and the engraving.',
      layout: 'poster',
      live: 'surya-story-form',
      selfCaptioned: true,
      tone: { stage: '#1a060c', stageLight: '#2e0f18', chrome: '#fde3e6', chromeMuted: '#dba6b0', mid: '#d8375e', deep: '#6a1230', pale: '#ffeef0' },
      art: { src: surya('form'), w: 1600, h: 960, alt: 'A line drawing of the mandala from the laser file. Its outline draws itself, then the engraving is laid in from the top down. Beside it, two photographs: the front layer held up in the workshop, and the sandblaster.' },
    },
    {
      id: 'roots',
      kicker: 'Surya · where the shape comes from',
      word: 'Roots',
      title: 'The mandala comes from home.',
      body: 'The mandala comes from my heritage in India. Surya’s body is one, drawn from the sun.',
      layout: 'poster',
      live: 'surya-roots',
      tone: { stage: '#1a060c', stageLight: '#2e0f18', chrome: '#fde3e6', chromeMuted: '#dba6b0', mid: '#d8375e', deep: '#6a1230', pale: '#ffeef0' },
      art: { src: surya('roots'), w: 1600, h: 960, alt: 'The word Roots in a rose-coloured courtyard. A woman draws a rangoli on the floor while a child watches; the same mandala fills the two letters O.' },
    },
    {
      id: 'body',
      kicker: '03 · Body',
      word: 'Body',
      title: 'Two layers of wood.',
      body: 'A back layer and an engraved front layer. Stacked, they give the piece depth, and light fills the gap between them. The choice: wood layers, not a 3D-printed body. Wood gave it warmth, scale and depth. The cost: little room to change anything once it is cut.',
      layout: 'poster',
      live: 'surya-story-body',
      selfCaptioned: true,
      tone: { stage: '#06140c', stageLight: '#0f2618', chrome: '#e6f5e6', chromeMuted: '#a9cfae', mid: '#2f8f4e', deep: '#14492a', pale: '#eefaec' },
      art: { src: surya('body'), w: 1600, h: 960, alt: 'A line drawing of the two wood layers seen from the side, pulled apart to show the row of lights between them, then pushed back together.' },
    },
    {
      id: 'layers',
      kicker: 'Surya · the body',
      word: 'Layers',
      title: 'Two layers of wood, cut by laser.',
      body: 'The body is two layers of laser-cut wood. Stacked, they give the mandala its depth and its warmth.',
      layout: 'poster',
      live: 'surya-layers',
      tone: { stage: '#06140c', stageLight: '#0f2618', chrome: '#e6f5e6', chromeMuted: '#a9cfae', mid: '#2f8f4e', deep: '#14492a', pale: '#eefaec' },
      art: { src: surya('layers'), w: 1600, h: 960, alt: 'The word Layers in a green workshop. The maker pulls a rope and the front layer of a wooden mandala lifts off the back layer, then settles onto it again.' },
    },
    {
      id: 'light',
      kicker: '04 · Light',
      word: 'Light',
      title: '256 lights behind frosted acrylic.',
      body: 'A 32 by 8 grid of lights sits in the window. A frosted sheet in front turns their hard points into a soft glow. 68 more lights run around the rim, between the two layers of wood.',
      layout: 'poster',
      live: 'surya-story-light',
      selfCaptioned: true,
      tone: { stage: '#04081a', stageLight: '#0c1532', chrome: '#e2efff', chromeMuted: '#9fb8e6', mid: '#2f7df0', deep: '#0d2a6e', pale: '#eaf4ff' },
      art: { src: surya('light'), w: 1600, h: 960, alt: 'A line drawing of the 32 by 8 grid of lights spelling ETA 18M, and the frosted sheet sliding in front of it. Beside it, two photographs: the lit display close up, and the frosted sheet set in its window.' },
    },
    {
      id: 'glow',
      kicker: 'Surya · the display',
      word: 'Glow',
      title: 'A matrix display behind frosted acrylic.',
      body: 'Frosted acrylic sits over the LED matrix display. It softens the points of light.',
      layout: 'poster',
      live: 'surya-glow',
      tone: { stage: '#04081a', stageLight: '#0c1532', chrome: '#e2efff', chromeMuted: '#9fb8e6', mid: '#2f7df0', deep: '#0d2a6e', pale: '#eaf4ff' },
      art: { src: surya('glow'), w: 1600, h: 960, alt: 'The word Glow made of points of light in a dark blue workshop. Two people carry a frosted sheet across it; behind the sheet the points become a soft glow.' },
    },
    {
      id: 'flowers',
      kicker: '05 · Flowers',
      word: 'Flowers',
      title: 'Three printed flowers that open.',
      body: 'One for each person in my family. A flower opens when they wake and closes when they sleep. The choice: small DC motors, not servos. Smoother motion. The cost: a motor cannot tell where it is, so each flower needs hard stops and tuning.',
      layout: 'poster',
      live: 'surya-story-flowers',
      selfCaptioned: true,
      tone: { stage: '#1a0605', stageLight: '#30100d', chrome: '#fde4de', chromeMuted: '#dfa79d', mid: '#dc3a2c', deep: '#6f1711', pale: '#ffece7' },
      art: { src: surya('flowers'), w: 1600, h: 960, alt: 'A line drawing of one printed flower made from its real parts: four petals, four links and a screw. It opens, closes and comes apart. Beside it, a photograph of the three flowers on the piece.' },
    },
    {
      id: 'bloom',
      kicker: 'Surya · the flowers',
      word: 'Bloom',
      title: 'The flowers are 3D printed.',
      body: 'Each flower is printed, then opened and closed by a small motor. One flower for each person.',
      layout: 'poster',
      live: 'surya-bloom',
      tone: { stage: '#1a0605', stageLight: '#30100d', chrome: '#fde4de', chromeMuted: '#dfa79d', mid: '#dc3a2c', deep: '#6f1711', pale: '#ffece7' },
      art: { src: surya('bloom'), w: 1600, h: 960, alt: 'The word Bloom being printed layer by layer in a red workshop. When it is finished the two letters O open into flowers.' },
    },
    {
      id: 'brain',
      kicker: '06 · Brain',
      word: 'Brain',
      title: 'One small board runs it all.',
      body: 'An ESP32 keeps three clocks, drives three motors and 324 lights, and reads three buttons. Press one to see that person’s time. The hard night: one loose ground pin. The petals jerked, the code froze, a motor went too far. I traced every wire until I found it.',
      layout: 'poster',
      live: 'surya-story-brain',
      selfCaptioned: true,
      tone: { stage: '#050a22', stageLight: '#0c1640', chrome: '#e6eeff', chromeMuted: '#a8b8e8', mid: '#2f5fe6', deep: '#10286e', pale: '#ecf1ff' },
      art: { src: surya('brain'), w: 1600, h: 960, alt: 'A line drawing of the controller board wired to three motors, three buttons, the grid of lights and the lights around the rim. One wire sits loose and everything twitches; then it is pushed home and the signals run smoothly.' },
    },
    {
      id: 'whole',
      kicker: 'Surya · all of it',
      word: 'Whole',
      title: 'Every part, then the whole.',
      body: 'Back layer, lights, motors and board, front layer, frosted acrylic, flowers. Then the real piece.',
      layout: 'poster',
      live: 'surya-whole',
      tone: { stage: '#050a22', stageLight: '#0c1640', chrome: '#e6eeff', chromeMuted: '#a8b8e8', mid: '#2f5fe6', deep: '#10286e', pale: '#ecf1ff' },
      art: { src: surya('whole'), w: 1600, h: 960, alt: 'A blueprint drawing of Surya with its parts hanging apart in a row. They close up one by one, the drawing turns to face the reader, and the photograph of the real piece takes its place.' },
    },
    {
      id: 'house',
      kicker: '07 · House',
      word: 'House',
      title: 'Now it knows when I walk up.',
      body: 'A radar sees me come close. Home Assistant picks what matters, and Surya shows it: how far a 3D print is, or what is next on my calendar. I do not press anything to ask. The room notices me and answers. It triggers when I have been closer than 77 inches for 3 seconds.',
      layout: 'poster',
      live: 'surya-story-house',
      selfCaptioned: true,
      tone: { stage: '#120818', stageLight: '#22122e', chrome: '#f0e3fa', chromeMuted: '#c2a8d8', mid: '#8e55c4', deep: '#3a1a55', pale: '#f6ecfd' },
      art: { src: surya('house'), w: 1600, h: 960, alt: 'A line drawing: a person walks up, a radar under the piece notices, the house computer sends a message and the display lights up. Beside it, a short film shot at home: the clock on the display gives way to 69%, a 3D print’s progress, and a photograph of the radar sensor.' },
    },
    {
      id: 'home',
      kicker: 'Surya · today',
      word: 'Home',
      title: 'It now connects to my house.',
      body: 'Surya talks to my Home Assistant. The house can put a message on its display, and its buttons report back.',
      layout: 'poster',
      live: 'surya-home',
      tone: { stage: '#120818', stageLight: '#22122e', chrome: '#f0e3fa', chromeMuted: '#c2a8d8', mid: '#8e55c4', deep: '#3a1a55', pale: '#f6ecfd' },
      art: { src: surya('home'), w: 1600, h: 960, alt: 'The word Home as four little houses at dusk. The mandala glows in the round window of the O; signals run from it to the other letters and their windows light up as the maker walks home.' },
    },
    {
      id: 'learned',
      kicker: '08 · Learned',
      word: 'Learned',
      title: 'What worked. What was hard.',
      body: 'Worked: slow, steady motion felt calm and alive. One flower per person needed no explaining. Hard: getting three motors to move in step took far more tries than I expected.',
      layout: 'poster',
      live: 'surya-story-learned',
      selfCaptioned: true,
      tone: { stage: '#14100c', stageLight: '#261e16', chrome: '#f7ecdc', chromeMuted: '#cdb89c', mid: '#c46028', deep: '#3a2a1c', pale: '#faf4ea' },
      art: { src: surya('learned'), w: 1600, h: 960, alt: 'A photograph of Surya on the wall, with one sentence about what it taught, and a short list of what worked and what was hard.' },
    },
    {
      id: 'end',
      kicker: 'Surya · today',
      word: 'Home wall',
      title: 'It hangs on my wall.',
      body: 'In step with my family’s days, across three time zones.',
      layout: 'poster',
      live: 'surya-end',
      tone: { stage: '#14100c', stageLight: '#261e16', chrome: '#f7ecdc', chromeMuted: '#cdb89c', mid: '#c46028', deep: '#3a2a1c', pale: '#faf4ea' },
      art: { src: surya('end'), w: 1600, h: 960, alt: 'A photograph of Surya hanging on a wall, lit.' },
    },
  ],
};

const jarvis = (page: string) => `/images/flipbook/jarvis/${page}/still.webp`;
/** Jarvis's spread colours: one amber family for the story page and the picture page it faces. */
const JARVIS_AMBER = { stage: '#170d03', stageLight: '#2a1808', chrome: '#fceacd', chromeMuted: '#dbb98a', mid: '#e08414', deep: '#5c2e08', pale: '#fff1db' };

const hex = (rgb: readonly number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const toward = (from: readonly number[], to: readonly number[], by: number) => from.map((v, i) => v + (to[i] - v) * by);
/**
 * The seven colours of a page from its three (paper, ink, mid), the way the amber pair was made: pale = paper,
 * deep = ink, mid = mid; the table is a quarter of the ink and its pool of light about half of it; the controls
 * are the paper a touch dimmer, and their muted tone is the paper drawn 45% toward the mid colour.
 */
const toneOf = ({ paper, ink, mid }: StoryTone): PageTone => ({
  stage: hex(ink.map((v) => v * 0.25)),
  stageLight: hex(ink.map((v) => v * 0.47)),
  chrome: hex(paper.map((v) => v * 0.97)),
  chromeMuted: hex(toward(paper, mid, 0.45)),
  mid: hex(mid),
  deep: hex(ink),
  pale: hex(paper),
});

/** A story page's entry, with its words read from the page's own module (lib/flipbook/live/jarvis/<word>.ts). */
const storyPage = (id: string, word: string, page: JarvisStoryPage, tone: StoryTone | PageTone): FlipPage => {
  const { copy } = page;
  const note = copy.note ? `${copy.note.label}: ${[copy.note.head, copy.note.text].filter(Boolean).join(' ')}` : '';
  return {
    id,
    kicker: copy.kicker,
    word,
    title: copy.title.join(' '),
    body: [copy.body, note].filter(Boolean).join(' ') || undefined,
    layout: 'poster',
    live: page.id,
    selfCaptioned: true,
    tone: 'paper' in tone ? toneOf(tone) : tone,
    art: { src: jarvis(id), w: 1600, h: 960, alt: page.alt },
  };
};
/** A picture page's entry, with its words read from the page's own module (lib/flipbook/live/jarvis<Word>.ts). */
const picturePage = (id: string, word: string, copy: JarvisPictureCopy, tone: StoryTone | PageTone): FlipPage => ({
  id,
  kicker: copy.kicker,
  word,
  title: copy.title,
  body: copy.body || undefined,
  layout: 'poster',
  live: `jarvis-${id}`,
  tone: 'paper' in tone ? toneOf(tone) : tone,
  art: { src: jarvis(id), w: 1600, h: 960, alt: copy.alt },
});
const storyOf = (id: string) => JARVIS_STORY_PAGES.find((page) => page.id === `jarvis-${id}`)!;

/**
 * Jarvis as a flip book, bound like Surya's: a cover, then a story page facing
 * each picture page. Reachable at /book/jarvis; /book still opens Surya.
 *
 * Words: his own article on Circuit Digest, his firmware (adiind/diy-jarvis),
 * his timeline entry and data/projects/jarvis.json. Where the notes say "wake
 * word", the article and firmware say a PIR sensor wakes it: the book
 * follows the article and firmware. Sources per sentence: lib/flipbook/live/jarvisStory.ts.
 */
export const JARVIS_BOOK: FlipBook = {
  slug: 'jarvis',
  link: { label: 'Jarvis on GitHub', href: 'https://github.com/adiind/diy-jarvis' },
  plainBack: true,
  title: 'Jarvis',
  client: 'Personal',
  meta: 'A voice assistant I built for my home',
  theme: buildsTheme,
  solo: true,
  spread: true,
  // the same binding as Surya's: it lies on the home page's mat, in the same brown boards
  surface: 'mat',
  board: '#3a1d10',
  pages: [
    {
      id: 'cover',
      kicker: 'Jarvis · a flip book',
      word: 'Jarvis',
      title: 'A voice assistant I built for my home. Walk up and it wakes.',
      body: 'Top 10 · IoT & Edge AI Project Challenge 2024',
      layout: 'poster',
      live: 'jarvis-cover',
      selfCaptioned: true,
      cta: { label: 'Jarvis on GitHub', href: 'https://github.com/adiind/diy-jarvis' },
      tone: { stage: '#120c07', stageLight: '#241a10', chrome: '#f7ead8', chromeMuted: '#cdb595', mid: '#e08414', deep: '#3a2614', pale: '#fff1db' },
      art: { src: jarvis('cover'), w: 1600, h: 960, alt: 'Cover: a photograph of Jarvis, a black 3D-printed box with a white dome and four LEDs at its top end and a flower cut into its face, lying switched off on a cutting mat, beside its name. A warm light behind the name slowly brightens and dims.' },
    },
    storyPage('sensor', 'Sensor', storyOf('sensor'), JARVIS_AMBER),
    picturePage('present', 'Present', PRESENT_COPY, JARVIS_AMBER),
    storyPage('voice', 'Voice', storyOf('voice'), ROSE),
    picturePage('listen', 'Listen', LISTEN_COPY, ROSE),
    storyPage('why', 'Why', storyOf('why'), GREEN),
    picturePage('here', 'Here', HERE_COPY, GREEN),
    storyPage('lights', 'Lights', storyOf('lights'), BLUE),
    picturePage('answer', 'Answer', ANSWER_COPY, BLUE),
    storyPage('messages', 'Messages', storyOf('messages'), PLUM),
    picturePage('control', 'Control', CONTROL_COPY, PLUM),
    storyPage('case', 'Open source', storyOf('case'), RED),
    picturePage('diy', 'DIY', DIY_COPY, RED),
    {
      id: 'end',
      kicker: 'WHERE IT LIVES',
      word: 'Home wall',
      title: 'On my wall, lights on.',
      body: 'Top 10 · IoT & Edge AI Project Challenge 2024',
      layout: 'poster',
      live: 'jarvis-end',
      selfCaptioned: true,
      tone: { stage: '#120c07', stageLight: '#241a10', chrome: '#f7ead8', chromeMuted: '#cdb595', mid: '#e08414', deep: '#3a2614', pale: '#fff1db' },
      art: { src: jarvis('end'), w: 1600, h: 960, alt: 'The last page: his photograph of Jarvis on his wall with its four white lights on, between two orange light bars, printed large on a dark page, with one sentence about where it lives. The print settles in and the text fades in; then only the warm light round the photograph breathes.' },
    },
  ],
};

/** Earlier trial: three case studies retold as books. Reachable by address, not linked from the shelf. */
export const STORY_BOOKS: FlipBook[] = [
  {
    slug: 'squad-up',
    projectId: 'mcdonalds-interaction-design',
    title: 'Squad Up',
    client: 'McDonald’s',
    meta: 'McDonald’s × Northwestern EDI · Winter 2026',
    theme: squadTheme,
    pages: [
      {
        id: 'cover',
        kicker: 'McDonald’s × Northwestern EDI · Winter 2026',
        word: 'Squad Up',
        wordImage: { src: '/images/mcd/squad-up/figma/squad-up-logo-original.webp' },
        title: 'Group ordering across shared digital touchpoints',
        body: 'A sponsored course concept. It connects individual choices and payments to one visible group order.',
        art: { src: mcd('mcd-01-hero-drive-thru'), w: 2400, h: 1600, matte: matte('mcd-01-hero-drive-thru'), focus: [0.46, 0.5], alt: 'Clay miniature scene: five friends in a sage-green car at a lit McDonald’s drive-through, sharing one order.' },
        captionAt: 'foot',
        panelColor: '#a12f22',
        panelInk: '#fff3d6',
        panelMuted: '#f8dcc9',
        panelAccent: '#ffc531',
        artTop: 0.215,
        artShift: 0.125,
        wordTop: 0.035,
        wordHeight: 0.285,
      },
      {
        id: 'context',
        kicker: '01 · Context',
        word: 'Outing',
        title: 'A group visit can be one stop in a larger outing.',
        body: 'Teens go to McDonald’s when they are coming from another event or on their way to something else.',
        art: { src: mcd('mcd-02-context-between-stops'), w: 2400, h: 1600, focus: [0.62, 0.55], alt: 'Friends gather by a parked car during an outing.' },
        captionAt: 'bl',
      },
      {
        id: 'research',
        kicker: '02 · Research',
        word: 'Observe',
        title: 'Observations, interviews and a survey.',
        stats: [
          { value: '4', label: 'site observations' },
          { value: '8', label: 'qualitative interviews' },
          { value: '22', label: 'survey responses' },
        ],
        art: { src: mcd('mcd-03-research-observation'), w: 1600, h: 1600, matte: matte('mcd-03-research-observation'), alt: 'Friends consider an order at a drive-through counter.' },
        breakoutX: [0, 0.79],
      },
      {
        id: 'synthesis',
        kicker: '03 · Synthesis',
        word: 'Chase',
        title: 'One organizer gathers the order and tracks payment.',
        body: 'One person can consolidate an order but must chase payments. Separate orders clarify payment but make coordination harder.',
        art: { src: mcd('mcd-04-problem-coordinator'), w: 1600, h: 1600, matte: matte('mcd-04-problem-coordinator'), alt: 'Friends compare group-order options around a table.' },
      },
      {
        id: 'exploration',
        kicker: '04 · Exploration',
        word: 'Share',
        title: 'Individual choices within one shared order.',
        body: 'Each person builds their own bag. A member can pay for themselves, or another member can pay for them.',
        art: { src: mcd('mcd-05-idea-shared-bag'), w: 1600, h: 1600, matte: matte('mcd-05-idea-shared-bag'), alt: 'Individual orders join one shared bag.' },
      },
      {
        id: 'flow',
        kicker: '05 · The core flow',
        word: 'Flow',
        title: 'Invite → join → choose → pay → readiness → pickup.',
        steps: [
          'The host invites the squad by QR code or tap.',
          'A guest joins through the app, mobile web, or an assisted path.',
          'Each person builds a personal bag within the shared order.',
          'A member can pay for themselves or for someone else.',
          'The squad sees whose order is still being built and who is ready.',
          'The submitted order has a shared confirmation and pickup details.',
        ],
        art: { src: mcd('mcd-06-flow-invite-to-pickup'), w: 2400, h: 800, alt: 'A winding road links the group invite, order, payment, and pickup.' },
      },
      {
        id: 'testing',
        kicker: '06 · Testing',
        word: 'Test',
        title: 'Testing the flow with paper prototypes.',
        body: 'Paper prototypes, surveys and interviews. Key risk: each person adds steps before checkout.',
        art: { src: mcd('mcd-07-testing'), w: 1600, h: 1600, matte: matte('mcd-07-testing'), alt: 'A team reviews paper screens and a laptop prototype together.' },
      },
      {
        id: 'outcome',
        kicker: '07 · Outcome',
        word: 'Pickup',
        title: 'One shared order connects each person’s choice and payment.',
        body: 'Next steps: multi-bagging, group receipts, catering.',
        art: { src: mcd('mcd-08-outcome-pickup'), w: 1600, h: 1600, matte: matte('mcd-08-outcome-pickup'), alt: 'Friends collect one shared order at a drive-through.' },
        cta: { label: 'Read the full case study', href: '/work/mcdonalds-interaction-design' },
      },
    ],
  },
  {
    slug: 'familysync',
    projectId: 'familysync-jpmorgan',
    title: 'FamilySync',
    client: 'JPMorgan Chase',
    meta: 'JPMorgan Chase × Northwestern EDI · Winter 2026',
    theme: familyTheme,
    pages: [
      {
        id: 'cover',
        kicker: 'JPMorgan Chase × Northwestern EDI · Winter 2026',
        word: 'FamilySync',
        title: 'An agent that coordinates a family when a child’s day changes.',
        body: 'It does the legwork. A person approves every handoff.',
        art: { src: fs('pickup'), w: 1536, h: 1024, matte: matte('fs-pickup'), focus: [0.4, 0.55], alt: 'Illustrated school pickup: a grandmother meets Leo at the school entrance.' },
        captionAt: 'br',
        portrait: { focus: [0.3, 0.55] },
      },
      {
        id: 'context',
        kicker: '01 · Context',
        word: 'Call',
        title: 'The school calls. Stacy is in a meeting.',
        body: 'Leo is sick and someone has to get him. The request is one notification. The coordination behind it is six questions at once.',
        art: { src: fs('tension-pass3'), w: 1536, h: 1024, matte: matte('fs-tension-pass3'), focus: [0.5, 0.6], alt: 'Illustrated meeting table with a notebook and a phone waiting face down.' },
        captionAt: 'br',
      },
      {
        id: 'research',
        kicker: '02 · Research',
        word: 'Listen',
        title: 'We started with the afternoons that went wrong.',
        body: 'Interviews with caregivers about recent child-health emergencies. People want an agent that feels caring and proactive, but still keeps them in control.',
        art: { src: fs('research-pass3'), w: 1536, h: 1024, matte: matte('fs-research-pass3'), focus: [0.5, 0.5], alt: 'Illustrated kitchen table conversation between two people.' },
        captionAt: 'bl',
      },
      {
        id: 'synthesis',
        kicker: '03 · Synthesis',
        word: 'Handoff',
        title: 'Three principles. Each one is a handoff.',
        body: 'Coordination. Communication. Connection.',
        art: { src: fs('synthesis-pass3'), w: 1536, h: 1024, matte: matte('fs-synthesis-pass3'), focus: [0.35, 0.5], alt: 'Illustrated family entryway: coats, a child’s school backpack and keys by the door.' },
        captionAt: 'br',
        portrait: { focus: [0.3, 0.5] },
      },
      {
        id: 'tension',
        kicker: '03 · The tension',
        word: 'Check',
        title: 'Automation can create checking work.',
        body: 'If a parent has to verify everything the agent did, it has handed them a second job. So each handoff ends in one clear ask that a person answers.',
        art: { src: fs('work'), w: 1536, h: 1024, matte: matte('fs-work'), focus: [0.42, 0.5], alt: 'Illustrated parent at work receiving a nudge during a meeting.' },
        captionAt: 'br',
        wordAlign: 'right',
        wordTop: 0.04,
        wordHeight: 0.165,
        portrait: { focus: [0.34, 0.5] },
      },
      {
        id: 'exploration',
        kicker: '04 · Exploration',
        word: 'Narrow',
        title: 'Three directions, two concepts, one service.',
        stats: [
          { value: '3', label: 'directions' },
          { value: '2', label: 'concepts' },
          { value: '1', label: 'service' },
        ],
        art: { src: fs('exploration-pass3'), w: 1536, h: 1024, focus: [0.5, 0.55], alt: 'Illustrated design desk with sketch paper, pencils and building blocks in afternoon light.' },
        captionAt: 'bl',
      },
      {
        id: 'my-part',
        kicker: '05 · My part',
        word: 'Home',
        title: 'Leo is home. The agent keeps going.',
        body: 'Two of Stacy’s questions are still open: dinner, and what’s in the fridge. It spawns a sub-agent, finds a soup recipe and turns it into an Instacart cart. Then it stops and asks Stacy, with three ways out.',
        art: { src: fs('home'), w: 1536, h: 1024, matte: matte('fs-home'), focus: [0.6, 0.5], alt: 'Illustrated Leo arriving home with his grandmother.' },
        captionAt: 'bl',
        portrait: { focus: [0.62, 0.5], wordHeight: 0.09 },
      },
      {
        id: 'testing',
        kicker: '06 · Testing',
        word: 'Approve',
        title: 'One card carries the whole payment.',
        body: 'After testing feedback, payment became one integrated step: what it’s for, how it’s paid, and Stacy’s answer, together. FamilySync does not pay without a person.',
        art: { src: fs('kitchen'), w: 1536, h: 1024, matte: matte('fs-kitchen'), focus: [0.5, 0.5], alt: 'Illustrated family kitchen with an open fridge and a pot of soup for dinner.' },
        captionAt: 'br',
      },
      {
        id: 'outcome',
        kicker: '07 · Outcome',
        word: 'Dinner',
        title: 'One event, carried end to end.',
        body: 'From the school’s alert to dinner, in one thread. The agent did the legwork; a person answered at every handoff.',
        art: { src: fs('outcome-pass3'), w: 1536, h: 1024, matte: matte('fs-outcome-pass3'), focus: [0.4, 0.55], alt: 'Illustrated family kitchen at dinner time with soup on the stove.' },
        captionAt: 'br',
        cta: { label: 'Read the full case study', href: '/work/familysync-jpmorgan' },
      },
    ],
  },
  {
    slug: 'pg',
    projectId: 'pg-haircare',
    title: 'Rethinking the bottle',
    client: 'P&G',
    meta: 'P&G × Northwestern EDI · Fall 2025 · Under NDA',
    theme: pgTheme,
    pages: [
      {
        id: 'cover',
        kicker: 'P&G × Northwestern EDI · Fall 2025 · Under NDA',
        word: 'Rethink',
        title: 'Rethinking the bottle.',
        body: 'And the routine around it. A consumer research and packaging exploration sprint. My contribution spanned research, prototyping, and the CSV2 summary.',
        note: 'Illustrated context · not field documentation',
        art: { src: room('room-hero'), w: 709, h: 800, cutout: true, alt: 'Illustrated miniature bathroom with warm wood, plants, and navy and coral accents.' },
        layout: 'paper',
        panelSide: 'left',
      },
      {
        id: 'ihv-1',
        kicker: 'IHV 1 · In-home · Discover',
        word: 'Listen',
        title: 'Learn in context.',
        body: 'Use guides and participant-led activities to understand the routine.',
        stats: [{ value: '8', label: 'in-home visits' }],
        note: 'Illustrated context · not field documentation',
        art: { src: room('room-ihv-1'), w: 712, h: 800, cutout: true, alt: 'Illustrated miniature home setting for IHV 1; not field documentation.' },
        layout: 'paper',
        panelSide: 'right',
      },
      {
        id: 'ihv-2',
        kicker: 'IHV 2 · In-home · Define',
        word: 'Frame',
        title: 'Frame the questions.',
        body: 'Bring notes together and look for recurring themes. Turn those themes into questions for exploration.',
        note: 'Illustrated context · not field documentation',
        art: { src: room('room-ihv-2'), w: 715, h: 800, cutout: true, alt: 'Illustrated miniature home setting for IHV 2; not field documentation.' },
        layout: 'paper',
        panelSide: 'left',
      },
      {
        id: 'csv-1',
        kicker: 'CSV 1 · Central site · Develop',
        word: 'Make',
        title: 'Explore possibilities.',
        body: 'Prototypes supported conversations and the next round of exploration.',
        steps: ['Sketch', 'Make', 'Learn', 'Iterate'],
        note: 'Illustrated context · not field documentation',
        art: { src: room('room-csv-1'), w: 789, h: 800, cutout: true, alt: 'Illustrated miniature studio setting for CSV 1; not field documentation.' },
        layout: 'paper',
        panelSide: 'right',
      },
      {
        id: 'csv-2',
        kicker: 'CSV 2 · Central site · Deliver',
        word: 'Learn',
        title: 'Review and synthesize.',
        body: 'Focused activities gave each discussion a clear purpose. Design details and outcomes remain under NDA.',
        note: 'Illustrated context · not field documentation',
        art: { src: room('room-csv-2'), w: 773, h: 800, cutout: true, alt: 'Illustrated miniature studio setting for CSV 2; not field documentation.' },
        layout: 'paper',
        panelSide: 'left',
        cta: { label: 'Read the full case study', href: '/work/pg-haircare' },
      },
    ],
  },
];

const muse = (page: string) => `/images/flipbook/muse/${page}/still.webp`;

/**
 * Muse: Meta's Muse on a 2.8-inch touchscreen, in a printed body, built by orchestrating AI agents.
 * The idea-words are Adi's (2026-11-14). Story pages use his real files only; see lib/flipbook/live/museStory.ts.
 */
export const MUSE_BOOK: FlipBook = {
  slug: 'muse',
  title: 'Muse',
  client: 'Personal',
  meta: 'Meta’s Muse AI on my desk, in a body I built with AI agents',
  theme: buildsTheme,
  solo: true,
  spread: true,
  // like Surya, the book lies on the home page's cutting mat
  surface: 'mat',
  board: '#2b1d3d',
  pages: [
    {
      id: 'cover',
      kicker: 'Muse · a flip book',
      word: 'Muse',
      title: 'Meta’s Muse AI on my desk, in a body I built with AI agents.',
      body: 'Turn the page.',
      layout: 'poster',
      live: 'muse-cover',
      selfCaptioned: true,
      tone: { stage: '#140c1e', stageLight: '#2b1d3d', chrome: '#f3e9ff', chromeMuted: '#c7b2e6', mid: '#8e55c4', deep: '#3a1a55', pale: '#f6ecfd' },
      art: { src: muse('cover'), w: 1600, h: 960, alt: 'Cover: a photograph of the printed Muse, a cream figure with an orange-framed screen held in Adi’s hand, beside its name.' },
    },
    {
      id: 'why',
      kicker: '01 · Why',
      word: 'Why',
      title: 'Why I built it',
      body: 'I believe AI needs a physical presence, apart from my phone.',
      layout: 'poster',
      live: 'muse-story-why',
      selfCaptioned: true,
      tone: { stage: '#140c1e', stageLight: '#2b1d3d', chrome: '#f3e9ff', chromeMuted: '#c7b2e6', mid: '#8e55c4', deep: '#3a1a55', pale: '#f6ecfd' },
      art: { src: muse('why'), w: 1600, h: 960, alt: 'Photographs of the ES3C28P board, and Muse on its screen.' },
    },
    {
      id: 'tangible',
      kicker: 'Muse · the idea',
      word: 'Tangible',
      title: 'Muse on my desk, not only in an app',
      body: 'Muse lives in an app. I wanted it on my desk.',
      layout: 'poster',
      live: 'muse-tangible',
      tone: { stage: '#140c1e', stageLight: '#2b1d3d', chrome: '#f3e9ff', chromeMuted: '#c7b2e6', mid: '#8e55c4', deep: '#3a1a55', pale: '#f6ecfd' },
      art: { src: muse('tangible'), w: 1600, h: 960, alt: 'The word Tangible in ghostly letters that turn solid one by one as a small furry Muse walks past them; a man looks up from his phone and waves.' },
    },
    {
      id: 'how',
      kicker: '02 · How',
      word: 'How',
      title: 'How it was built',
      body: 'Four handoffs from me to AI agents.',
      layout: 'poster',
      live: 'muse-story-how',
      selfCaptioned: true,
      tone: { stage: '#06161a', stageLight: '#0f2a2c', chrome: '#e3faf5', chromeMuted: '#9fd6c8', mid: '#188c78', deep: '#0c423a', pale: '#e8f8f4' },
      art: { src: muse('how'), w: 1600, h: 960, alt: 'One picture from each of the four handoffs: the model, the cutout, the pouch, the firmware.' },
    },
    {
      id: 'orchestrate',
      kicker: 'Muse · how it was made',
      word: 'Orchestrate',
      title: 'I directed AI agents to build it',
      body: 'I set the specs and made the calls; the agents made the models, the CAD and the firmware.',
      layout: 'poster',
      live: 'muse-orchestrate',
      tone: { stage: '#06161a', stageLight: '#0f2a2c', chrome: '#e3faf5', chromeMuted: '#9fd6c8', mid: '#188c78', deep: '#0c423a', pale: '#e8f8f4' },
      art: { src: muse('orchestrate'), w: 1600, h: 960, alt: 'The word Orchestrate: a man conducts and on every beat a letter drops into place while small robots bob; at the end they cheer.' },
    },
    {
      id: 'model',
      kicker: '03 · Model',
      word: 'Model',
      title: 'The first model',
      body: 'Four AI directions and an AI-made mascot.',
      layout: 'poster',
      live: 'muse-story-model',
      selfCaptioned: true,
      tone: { stage: '#1a1204', stageLight: '#2e210a', chrome: '#fff4d8', chromeMuted: '#e3c784', mid: '#d69614', deep: '#5c3c06', pale: '#fff6de' },
      art: { src: muse('model'), w: 1600, h: 960, alt: 'The four AI concept directions, one after another, and the AI-made mascot model.' },
    },
    {
      id: 'imagine',
      kicker: 'Muse · the model',
      word: 'Imagine',
      title: 'My pictures became a 3D model',
      body: 'My pictures and a few lines of text became a 3D model.',
      layout: 'poster',
      live: 'muse-imagine',
      tone: { stage: '#1a1204', stageLight: '#2e210a', chrome: '#fff4d8', chromeMuted: '#e3c784', mid: '#d69614', deep: '#5c3c06', pale: '#fff6de' },
      art: { src: muse('imagine'), w: 1600, h: 960, alt: 'The word Imagine is sketched in pencil, then fills with colour; a man shows his sketchbook and Muse pops up and jumps.' },
    },
    {
      id: 'specs',
      kicker: '04 · Specs',
      word: 'Specs',
      title: 'Fitting the board',
      body: 'The board’s cutout, drawn from exact numbers.',
      layout: 'poster',
      live: 'muse-story-specs',
      selfCaptioned: true,
      tone: { stage: '#06101f', stageLight: '#0f1f38', chrome: '#e6f0ff', chromeMuted: '#a7bfe6', mid: '#2f7df0', deep: '#0d2a6e', pale: '#eaf4ff' },
      art: { src: muse('specs'), w: 1600, h: 960, alt: 'Frames of the real build: the mascot scaled, hollowed, split, the board drawn and cut in, posts and pins added.' },
    },
    {
      id: 'fit',
      kicker: 'Muse · the cutout',
      word: 'Fit',
      title: 'The board needed an exact home',
      body: 'The board has a home cut to its exact size.',
      layout: 'poster',
      live: 'muse-fit',
      tone: { stage: '#06101f', stageLight: '#0f1f38', chrome: '#e6f0ff', chromeMuted: '#a7bfe6', mid: '#2f7df0', deep: '#0d2a6e', pale: '#eaf4ff' },
      art: { src: muse('fit'), w: 1600, h: 960, alt: 'The word Fit: a caliper measures a small board, two people carry it and slide it into a slot in the I; it clicks and they cheer.' },
    },
    {
      id: 'pouch',
      kicker: '05 · Pouch',
      word: 'Pouch',
      title: 'The pouch',
      body: 'The soft frame around the screen.',
      layout: 'poster',
      live: 'muse-story-pouch',
      selfCaptioned: true,
      tone: { stage: '#170d05', stageLight: '#2c1a0c', chrome: '#fbeedd', chromeMuted: '#d9b48f', mid: '#be6e32', deep: '#542a0e', pale: '#fcf0e2' },
      art: { src: muse('pouch'), w: 1600, h: 960, alt: 'The five pouch versions, one after another, from the flat Fusion frame to the final snaps.' },
    },
    {
      id: 'real',
      kicker: 'Muse · the pouch',
      word: 'Real',
      title: 'A soft frame around the screen',
      body: 'Flat CAD became a padded pouch.',
      layout: 'poster',
      live: 'muse-real',
      tone: { stage: '#170d05', stageLight: '#2c1a0c', chrome: '#fbeedd', chromeMuted: '#d9b48f', mid: '#be6e32', deep: '#542a0e', pale: '#fcf0e2' },
      art: { src: muse('real'), w: 1600, h: 960, alt: 'The word Real: a man stitches round each flat pale letter and it puffs up into padded caramel leather.' },
    },
    {
      id: 'build',
      kicker: '06 · Build',
      word: 'Build',
      title: 'Printing it',
      body: 'Body shells and pouch printed and assembled.',
      layout: 'poster',
      live: 'muse-story-build',
      selfCaptioned: true,
      tone: { stage: '#07150b', stageLight: '#122a18', chrome: '#e6f8e6', chromeMuted: '#a7d6ae', mid: '#2f8f4e', deep: '#14492a', pale: '#eefaec' },
      art: { src: muse('build'), w: 1600, h: 960, alt: 'The failed first body split, then version two with its board pocket and push-in pins.' },
    },
    {
      id: 'snap',
      kicker: 'Muse · the build',
      word: 'Snap',
      title: 'Printed halves held by push-in pins',
      body: 'Push-in pins, no screws.',
      layout: 'poster',
      live: 'muse-snap',
      tone: { stage: '#07150b', stageLight: '#122a18', chrome: '#e6f8e6', chromeMuted: '#a7d6ae', mid: '#2f8f4e', deep: '#14492a', pale: '#eefaec' },
      art: { src: muse('snap'), w: 1600, h: 960, alt: 'The word Snap: each letter is two printed halves that slide together and click shut; a man and a girl cheer.' },
    },
    {
      id: 'button',
      kicker: '07 · Button',
      word: 'Button',
      title: 'The button',
      body: 'Hold to talk, press to wake.',
      layout: 'poster',
      live: 'muse-story-button',
      selfCaptioned: true,
      tone: { stage: '#1a060c', stageLight: '#2e0f18', chrome: '#fde3e6', chromeMuted: '#dba6b0', mid: '#d8375e', deep: '#6a1230', pale: '#ffeef0' },
      art: { src: muse('button'), w: 1600, h: 960, alt: 'Simulator screens: Muse asks a question, and the answer goes back.' },
    },
    {
      id: 'butt-on',
      kicker: 'Muse · the button',
      word: 'Butt on',
      title: 'Press the button and Muse talks',
      body: 'I mounted a button at the USB-C opening.',
      layout: 'poster',
      live: 'muse-button',
      tone: { stage: '#1a060c', stageLight: '#2e0f18', chrome: '#fde3e6', chromeMuted: '#dba6b0', mid: '#d8375e', deep: '#6a1230', pale: '#ffeef0' },
      art: { src: muse('butt-on'), w: 1600, h: 960, alt: 'The words Butt on: a man presses the button on Muse’s bottom, sound rings out, the letters bounce and Muse turns round and talks. Pointing at the O presses it too.' },
    },
    {
      id: 'end',
      kicker: 'Muse · today',
      word: 'On my desk',
      title: 'Where it stands',
      body: 'Hold the button to talk.',
      layout: 'poster',
      live: 'muse-end',
      selfCaptioned: true,
      tone: { stage: '#140c1e', stageLight: '#2b1d3d', chrome: '#f3e9ff', chromeMuted: '#c7b2e6', mid: '#8e55c4', deep: '#3a1a55', pale: '#f6ecfd' },
      art: { src: muse('end'), w: 1600, h: 960, alt: 'His photograph of the finished Muse: a cream 3D-printed figure with a small screen in an orange frame on its belly, held in his hand in front of a monitor. Caption: Muse, printed, in my hand. The print settles in and the text fades in.' },
    },
  ],
};

/** Bambu: a local review of the studio, the workshops and Adi's workshop guide. */
const bambuTone = { stage: '#0c2419', stageLight: '#1c4430', chrome: '#f2f7e9', chromeMuted: '#bad2bd', mid: '#4e9c6c', deep: '#1b4930', pale: '#f2f7e9' };
const bambuPhoto = '/images/flipbook/bambu/01-printer-wall.jpg';
const guide = 'https://drive.google.com/file/d/145pRL8-cY6QNTtiyWkvXoO8g3F3i8G_Z/view?usp=drive_web';
const bambuPage = (id: string, word: string, title: string, body: string, art: string, selfCaptioned = false): FlipPage => ({
  id, kicker: 'Bambu Lab · Northwestern', word, title, body, layout: 'poster', live: `bambu-${id}`,
  selfCaptioned, tone: bambuTone, art: { src: art, w: 1600, h: 960, alt: title },
  ...(['resources','share'].includes(id) ? { cta: { label: 'Open the 3D Print Guide', href: guide } } : {}),
});
export const BAMBU_BOOK: FlipBook = {
  slug: 'bambu', title: 'Making together', client: 'Northwestern', meta: 'The studio, the workshops, and a guide to take with you',
  theme: buildsTheme, solo: true, spread: true, surface: 'mat', board: '#21442f', plainBack: true,
  pages: [
    bambuPage('cover', 'Making together', 'The studio, the workshops, and a guide to take with you', 'Bambu Lab School Ambassador · Northwestern', '/images/flipbook/bambu/cover.svg', true),
    bambuPage('studio', 'Studio', 'A room for making', 'The printer lab at Northwestern.', bambuPhoto, true),
    bambuPage('make', 'Make', 'A room for making', 'A shared space for 3D printing.', '/images/flipbook/bambu/make-still.png'),
    bambuPage('workshops', 'Workshops', 'Learning together', 'Workshops with Corner Makery.', '/images/flipbook/bambu/13-adi-presenting.jpg', true),
    bambuPage('learn', 'Learn', 'Learning together', 'Preparing a model and getting started with printing.', '/images/flipbook/bambu/learn-still.png'),
    bambuPage('resources', 'The guide', 'Something to take home', 'A condensed guide to the 3D Print Anything workshop.', '/images/flipbook/bambu/17-supports-preview.jpg', true),
    bambuPage('share', 'Share', 'Take the workshop with you', 'Open my 3D Print Guide.', '/images/flipbook/bambu/share-still.png'),
  ],
};

/** Books shown on the shelf. The first one opens at /book. */
export const FLIP_BOOKS: FlipBook[] = [SURYA_BOOK, JARVIS_BOOK, MUSE_BOOK, BAMBU_BOOK];

/** Earlier trials, and books still being made (Jarvis), reachable by address only. */
export const OTHER_BOOKS: FlipBook[] = [BUILDS_BOOK, ...STORY_BOOKS];

export const FLIP_BOOKS_BY_SLUG = new Map([...FLIP_BOOKS, ...(import.meta.env.DEV ? OTHER_BOOKS : [])].map((book) => [book.slug, book] as const));
