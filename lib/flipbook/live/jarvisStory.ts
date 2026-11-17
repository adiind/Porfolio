/**
 * Jarvis's story pages, assembled, and its cover.
 *
 * Each story page lives in its own module in lib/flipbook/live/jarvis/ (one JarvisStoryPage each, with its
 * words' sources at its top), so several pages can be made at once without touching the same file. This file
 * only lists them, in book order, and turns each into a scene with the Surya story kit (storyScene), so the
 * two books share one hand. How to add a page: lib/flipbook/live/jarvis/README.md.
 */

import { rgba, type Rgb } from './motion';
import { createStage, loopPage } from './stage';
import { ENGRAVE, SANS, SERIF, storyScene, tracking } from './suryaStory';
import type { LiveScene } from './types';
import { PHOTO, type JarvisStoryPage } from './jarvis/kit';
import { SENSOR_PAGE } from './jarvis/sensor';
import { VOICE_PAGE } from './jarvis/voice';
import { WHY_PAGE } from './jarvis/why';
import { LIGHTS_PAGE } from './jarvis/lights';
import { MESSAGES_PAGE } from './jarvis/messages';
import { CASE_PAGE } from './jarvis/case';
import { END_TEXT } from './jarvis/end';

/** The story pages, in book order. */
export const PAGES: JarvisStoryPage[] = [SENSOR_PAGE, VOICE_PAGE, WHY_PAGE, LIGHTS_PAGE, MESSAGES_PAGE, CASE_PAGE];

/**
 * Surya's storyScene always asks for Surya's engraving; a Jarvis page has no use for it, so it is left off
 * the list of pictures to load (kit.engraving is then null).
 */
const sceneOf = (page: JarvisStoryPage): LiveScene => {
  const scene = storyScene(page.id, page.tone, page.copy, page.drawing, page.loop, page.rest, page.sources, true);
  return { ...scene, sources: scene.sources.filter((src) => src !== ENGRAVE) };
};

export const JARVIS_STORIES: LiveScene[] = PAGES.map(sceneOf);

/* ---------- cover ---------- */

/*
 * Where the cover's words come from: "HOME VOICE ASSISTANT · 2024", the line, and "Top 10 · IoT & Edge AI
 * Project Challenge 2024" as given for this book. His timeline entry (data/timeline.ts) names the challenge
 * and the Top 10, which he confirmed himself on 2026-11-14 (see the portfolio-book skill's decisions.md).
 */
const COVER = {
  kicker: 'HOME VOICE ASSISTANT · 2024',
  name: 'Jarvis',
  line: ['A voice assistant I built for my home.', 'Walk up and it wakes.'],
  small: 'Top 10 · IoT & Edge AI Project Challenge 2024',
};

/** Every word drawn on the story pages and the cover, for the book's tests. */
export const JARVIS_STORY_TEXT: string[] = [
  ...PAGES.flatMap(({ copy, words }) => [
    copy.kicker, ...copy.title, copy.body ?? '', copy.note?.label ?? '', copy.note?.head ?? '', copy.note?.text ?? '',
    copy.photo?.caption ?? '', copy.photo?.second?.caption ?? '', ...words,
  ]),
  COVER.kicker, COVER.name, ...COVER.line, COVER.small,
  ...END_TEXT,
];

const GROUND: Rgb = [20, 13, 8];
/**
 * Framing of case.webp (1600 by 1586; one page unit per pixel). The case's middle is at (812, 716) in the
 * photo. The laptop beside it starts at x 1343 or more for every row the page shows, and the case's right
 * corner is at about 1308; so the page's right edge falls on x 1330 of the photo, and the photo's drift
 * (x ±2, y ±3, scale ±0.3%) keeps it between 1326 and 1334: the case whole, no laptop.
 */
const CASE_IN_PHOTO = { x: 812, y: 716 };
const CASE_ON_PAGE = { x: 2000 - (1330 - 812), y: 585 };

/**
 * The cover: his photograph of the finished case on his cutting mat, the name, and one line.
 * The device in the photo is switched off, and the page leaves it so: the life here is a warm
 * light breathing behind the name and the photograph drifting a hair, never lights on the box.
 */
export const jarvisCover: LiveScene = {
  id: 'jarvis-cover',
  sources: [PHOTO.case],
  create(images, width, height) {
    const stage = createStage(width, height);
    const { k, base } = stage;
    const photo = images.get(PHOTO.case);
    return loopPage(stage, {
      loop: 8,
      rest: 1.5,
      step() { /* nothing to advance */ },
      draw(_t, clock) {
        base.fillStyle = rgba(GROUND);
        base.fillRect(0, 0, width, height);
        const left = CASE_ON_PAGE.x - CASE_IN_PHOTO.x;
        if (photo) {
          const s = (1 + 0.003 * Math.sin(clock * 0.31)) * k;
          const cx = (CASE_ON_PAGE.x + 2 * Math.sin(clock * 0.23)) * k;
          const cy = (CASE_ON_PAGE.y + 3 * Math.sin(clock * 0.19 + 1)) * k;
          base.drawImage(photo, cx - CASE_IN_PHOTO.x * s, cy - CASE_IN_PHOTO.y * s, photo.naturalWidth * s, photo.naturalHeight * s);
        }
        // the photograph's left part sinks into the ground under the name, clear of the case (its nearest corner is near x 970)
        const fadeTo = left + 300;
        const sink = base.createLinearGradient((left - 12) * k, 0, fadeTo * k, 0);
        sink.addColorStop(0, rgba(GROUND, 1));
        sink.addColorStop(0.45, rgba(GROUND, 0.6));
        sink.addColorStop(1, rgba(GROUND, 0));
        base.fillStyle = sink;
        base.fillRect(0, 0, fadeTo * k, height);
        // a warm light behind the name, breathing
        const glow = base.createRadialGradient(430 * k, 640 * k, 0, 430 * k, 640 * k, 680 * k);
        glow.addColorStop(0, rgba([224, 132, 20], 0.15 + 0.05 * Math.sin(clock * 1.3)));
        glow.addColorStop(1, rgba([224, 132, 20], 0));
        base.fillStyle = glow;
        base.fillRect(0, 0, width, height);
        stage.tooth(0.07);

        // the words are printed on the sheet, never floated: floated text throws a doubled shadow in the 3D book
        base.textAlign = 'left';
        base.textBaseline = 'alphabetic';
        base.fillStyle = rgba([240, 162, 72]);
        base.font = `650 ${28 * k}px ${SANS}`;
        tracking(base, 28 * k * 0.16);
        base.fillText(COVER.kicker, 112 * k, 300 * k);
        base.fillStyle = '#fff1db';
        base.font = `600 ${280 * k}px ${SERIF}`;
        tracking(base, -280 * k * 0.012);
        base.fillText(COVER.name, 100 * k, 590 * k);
        base.font = `450 ${44 * k}px ${SANS}`;
        tracking(base, 0);
        base.fillStyle = rgba([255, 232, 204], 0.92);
        COVER.line.forEach((line, i) => base.fillText(line, 112 * k, (690 + i * 60) * k));
        base.font = `600 ${28 * k}px ${SANS}`;
        base.fillStyle = rgba([240, 170, 92], 0.95);
        base.fillText(COVER.small, 112 * k, 1040 * k);
      },
    });
  },
};
