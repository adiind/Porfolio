import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PAGE } from './snapdeal/pageWords';
import { snapdealPhoneWords } from './snapdealPhone';

describe('Snapdeal on the phone home page', () => {
  const written = JSON.parse(readFileSync('public/home-flat/snapdeal-scroll.json', 'utf8')) as { words: unknown; pictures: Record<string, { src: string; w: number; h: number }> };

  it('prints the same words as the 3D courier bag (run `node scripts/phone/make-snapdeal.mjs` after changing them)', () => {
    expect(written.words).toEqual(snapdealPhoneWords());
  });

  it('carries every word of the Snapdeal entry, the descriptions included', () => {
    const strings: string[] = [];
    const walk = (v: unknown) => { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(PAGE);
    const text = JSON.stringify(written.words);
    for (const s of strings) expect(text, s).toContain(JSON.stringify(s).slice(1, -1));
  });

  it('has the pictures it shows', () => {
    for (const name of ['tee', 'mark', 'word']) {
      const picture = written.pictures[name];
      expect(picture, name).toBeTruthy();
      expect(readFileSync(`public${picture.src}`).length, picture.src).toBeGreaterThan(2000);
    }
  });
});
