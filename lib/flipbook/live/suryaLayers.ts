/**
 * "Layers": the body is two layers of laser-cut wood.
 *
 * The back layer of the mandala hangs on the workshop wall. The maker hauls
 * on a rope and the front layer lifts clear of it, hangs there, then settles
 * back with a puff of dust. Every letter of the word is made the same way:
 * a dark back layer and a pale front layer that lift apart in a wave and
 * clap shut again. In the 3D book the front layer really floats above the
 * back one, so the two slide against each other as the page tilts.
 */

import type { BookImages } from '../pageArt';
import { clamp, rgba, smoothstep } from './motion';
import { LAYERS_SPRITES } from './sprites/layers';
import {
  SPRITE_PAD, STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type SheetSprite,
} from './stage';
import type { LivePage, LiveScene } from './types';

const DIR = '/images/flipbook/surya/layers';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, parts: `${DIR}/parts.webp`, people: `${DIR}/people.webp` };

const LOOP = 9.8;
const WORD_W = 1930;
const FEET = 1004;
/** Where the mandala's display window sits, and how far the front layer is hauled up. */
const HUB = { x: 1000, y: 318 };
const HAUL = 150;
const ROPE_X = 1812;

/** 0 = front layer seated, 1 = hauled all the way up. */
const haul = (t: number): number => smoothstep(1.7, 3.1, t) * (1 - smoothstep(5.1, 6.5, t));
const LANDS = 6.5;

function createLayers(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const partsSheet = images.get(SRC.parts);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !partsSheet || !peopleSheet) throw new Error('The Layers page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = LAYERS_SPRITES.letters.sprites;
  const letters = makeLetters(sprites, { scale: WORD_W / wordSpan(sprites).width, left: (STAGE_W - WORD_W) / 2, feet: FEET });
  const under = stage.keep(tintSheet(sheet, '#1c5a36'));
  const people = LAYERS_SPRITES.people.sprites;
  const back = spriteNamed(LAYERS_SPRITES.parts.sprites, 'back');
  const front = spriteNamed(LAYERS_SPRITES.parts.sprites, 'front');
  const factor = LAYERS_SPRITES.parts.scale;

  /** The middle of a part's display window, inside its sprite, as fractions of the sprite's box. */
  const windowOf = (part: SheetSprite): readonly [number, number] => {
    const [hx, hy, hw, hh] = part.holes?.[0] ?? [0, 0, 0, 0];
    const [sx, sy] = part.source ?? [0, 0];
    return [((hx + hw / 2 - sx + SPRITE_PAD) * factor) / part.rect[2], ((hy + hh / 2 - sy + SPRITE_PAD) * factor) / part.rect[3]];
  };
  const backAnchor = windowOf(back);
  const frontAnchor = windowOf(front);
  // the front layer is the smaller of the two, about three quarters as wide as the back
  const backScale = 1;
  const frontScale = (backScale * 0.74 * back.rect[2]) / front.rect[2];
  const frontTop = front.rect[3] * frontAnchor[1] * frontScale;

  return loopPage(stage, {
    loop: LOOP,
    rest: 4.1,
    enter() { hopInTurn(letters); },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (input.dt > 0 && t >= LANDS && t - input.dt < LANDS) hopInTurn(letters, 0.05, 0);
      letters.forEach((letter) => restPose(letter, clock, 0.006));
    },
    draw(t, clock) {
      const up = haul(t);
      const hanging = up * (1 - up) * 4;

      /* printed sheet: the workshop, and the back layer on the wall */
      stage.backdrop(plate, 0.72);
      drawSprite(base, partsSheet, back, k, { x: HUB.x, y: HUB.y + 8, scale: backScale, anchor: backAnchor });
      stage.tooth();

      /* floating sheet: the front layer on its rope, then the letters, each in two layers */
      const frontY = HUB.y - HAUL * up;
      const swing = Math.sin(clock * 1.7) * 0.022 * clamp(up * 1.4) + Math.sin(t * 9) * 0.01 * hanging;
      word.strokeStyle = '#efe2bd';
      word.lineWidth = 7 * k;
      word.lineCap = 'round';
      word.beginPath();
      word.moveTo(HUB.x * k, -20 * k);
      word.lineTo((HUB.x + Math.sin(swing) * 40) * k, (frontY - frontTop + 26) * k);
      word.stroke();
      drawSprite(word, partsSheet, front, k, { x: HUB.x, y: frontY, scale: frontScale, anchor: frontAnchor, angle: swing });
      letters.forEach((letter) => drawLetter(word, under, letter, k, 10, 12));
      letters.forEach((letter, i) => {
        const rise = 42 * haul(t - 0.09 * i);
        drawLetter(word, under, letter, k, 3, 4 - rise);
        drawLetter(word, sheet, letter, k, 0, -rise);
      });

      /* in front: the maker on his rope, and the dust when the layer lands */
      const pose = t < 1.2 || t >= 6.9 ? 'rest' : (t >= 2.3 && t < 5.5 ? 'pull' : 'reach');
      const strain = pose === 'pull' ? Math.sin(clock * 11) * 3 : 0;
      const fist = pose === 'reach' ? { x: -11, y: -324 } : { x: -42, y: -243 };
      const feet = { x: ROPE_X - fist.x + (pose === 'rest' ? 30 : 0) + strain, y: 1152 };
      if (pose !== 'rest') {
        fg.strokeStyle = '#efe2bd';
        fg.lineWidth = 7 * k;
        fg.lineCap = 'round';
        fg.beginPath();
        fg.moveTo(ROPE_X * k, -20 * k);
        fg.lineTo((feet.x + fist.x) * k, (feet.y + fist.y + 10) * k);
        fg.stroke();
      } else {
        // the rope hangs loose beside him
        fg.strokeStyle = '#efe2bd';
        fg.lineWidth = 7 * k;
        fg.lineCap = 'round';
        fg.beginPath();
        fg.moveTo(ROPE_X * k, -20 * k);
        fg.quadraticCurveTo((ROPE_X + Math.sin(clock * 1.3) * 14) * k, 500 * k, (ROPE_X + Math.sin(clock * 1.3 + 0.6) * 22) * k, 900 * k);
        fg.stroke();
      }
      drawSprite(fg, peopleSheet, spriteNamed(people, pose), k, { x: feet.x, y: feet.y, scale: 0.71 });
      const dust = (t - LANDS) / 0.7;
      if (dust > 0 && dust < 1) {
        [-1, 1].forEach((sideSign) => {
          for (let i = 0; i < 4; i += 1) {
            const reach = 150 + i * 46;
            fg.fillStyle = rgba([238, 226, 190], (1 - dust) * 0.7);
            fg.beginPath();
            fg.arc((HUB.x + sideSign * (210 + reach * dust)) * k, (HUB.y + 40 - i * 34 - 30 * dust) * k, (16 + 20 * dust - i * 2) * k, 0, Math.PI * 2);
            fg.fill();
          }
        });
      }
    },
  });
}

export const suryaLayers: LiveScene = { id: 'surya-layers', sources: Object.values(SRC), create: createLayers };
