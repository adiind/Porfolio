/** The Muse book's seven picture pages, in order. Each lives in its own file. */

import { museTangible } from './museTangible';
import { museOrchestrate } from './museOrchestrate';
import { museImagine } from './museImagine';
import { museFit } from './museFit';
import { museReal } from './museReal';
import { museSnap } from './museSnap';
import { museButton } from './museButton';
import type { LiveScene } from './types';

export const MUSE_WORDS: LiveScene[] = [museTangible, museOrchestrate, museImagine, museFit, museReal, museSnap, museButton];
