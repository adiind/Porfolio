import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { zomatoPhoneWords } from './zomatoPhone';

describe('Zomato on the phone home page', () => {
  const written = JSON.parse(readFileSync('public/home-flat/zomato-scroll.json', 'utf8')) as { words: unknown; pictures: Record<string, { src: string; w: number; h: number }> };

  it('prints the same words as the 3D bag (run `node scripts/phone/make-zomato.mjs` after changing them)', () => {
    expect(written.words).toEqual(JSON.parse(JSON.stringify(zomatoPhoneWords())));
  });

  it('has a picture file for each of the bag\'s papers', () => {
    for (const name of ['bag', 'bill', 'home', 'friends', 'press']) {
      const picture = written.pictures[name];
      expect(picture, name).toBeTruthy();
      expect(readFileSync(`public${picture.src}`).length, picture.src).toBeGreaterThan(2000);
      expect(picture.w).toBeGreaterThan(300);
    }
  });
});
