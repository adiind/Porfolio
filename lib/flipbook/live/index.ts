import { BAMBU_SCENES } from './bambu';
/** The live pages a book can ask for by name (FlipPage.live). */

import type { FlipPage } from '../types';
import { jarvisAnswer } from './jarvisAnswer';
import { jarvisControl } from './jarvisControl';
import { jarvisDiy } from './jarvisDiy';
import { jarvisEnd } from './jarvis/end';
import { jarvisHere } from './jarvisHere';
import { jarvisListen } from './jarvisListen';
import { jarvisPresent } from './jarvisPresent';
import { JARVIS_STORIES, jarvisCover } from './jarvisStory';
import { suryaAwake } from './suryaAwake';
import { suryaBloom } from './suryaBloom';
import { suryaGlow } from './suryaGlow';
import { suryaHome } from './suryaHome';
import { suryaLayers } from './suryaLayers';
import { suryaRoots } from './suryaRoots';
import { SURYA_STORIES, suryaCover, suryaEnd } from './suryaStory';
import { suryaWhole } from './suryaWhole';
import type { LiveScene } from './types';
import { MUSE_STORIES, museCover, museEnd } from './museStory';
import { MUSE_WORDS } from './museWords';

export const LIVE_SCENES: Record<string, LiveScene> = {
  [suryaAwake.id]: suryaAwake,
  [suryaRoots.id]: suryaRoots,
  [suryaLayers.id]: suryaLayers,
  [suryaGlow.id]: suryaGlow,
  [suryaBloom.id]: suryaBloom,
  [suryaHome.id]: suryaHome,
  [suryaWhole.id]: suryaWhole,
  [suryaCover.id]: suryaCover,
  [suryaEnd.id]: suryaEnd,
  ...Object.fromEntries(SURYA_STORIES.map((scene) => [scene.id, scene])),
  // the Jarvis book
  [jarvisCover.id]: jarvisCover,
  [jarvisPresent.id]: jarvisPresent,
  [jarvisListen.id]: jarvisListen,
  [jarvisHere.id]: jarvisHere,
  [jarvisAnswer.id]: jarvisAnswer,
  [jarvisControl.id]: jarvisControl,
  [jarvisDiy.id]: jarvisDiy,
  [jarvisEnd.id]: jarvisEnd,
  ...Object.fromEntries(JARVIS_STORIES.map((scene) => [scene.id, scene])),
  ...Object.fromEntries(BAMBU_SCENES.map((scene) => [scene.id, scene])),
  // the Muse book
  ...Object.fromEntries([...MUSE_WORDS, ...MUSE_STORIES, museCover, museEnd].map((scene) => [scene.id, scene])),
};

export const liveSceneFor = (page: FlipPage): LiveScene | null => (page.live ? LIVE_SCENES[page.live] ?? null : null);

export type { LiveCanvases, LiveInput, LivePage, LiveScene } from './types';
