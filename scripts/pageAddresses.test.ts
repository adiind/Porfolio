import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { liveHostAnswer } from './pageAddresses';

const root = path.resolve(__dirname, '..');

describe('page addresses, answered as adidesign.org answers them', () => {
  const held = new Set(['home-flat/index.html', 'work/familysync-assets/story.html', 'index.html', 'work/glyph.html']);
  const has = (file: string) => held.has(file);

  // each row is what the live site answered on 2026-11-23 (curl -sI https://adidesign.org<address>)
  it.each([
    ['/home-flat/index.html', { redirect: '/home-flat/' }],
    ['/home-flat/', { serve: 'home-flat/index.html' }],
    ['/work/familysync-assets/story.html', { redirect: '/work/familysync-assets/story' }],
    ['/work/familysync-assets/story', { serve: 'work/familysync-assets/story.html' }],
  ])('%s', (address, answer) => {
    expect(liveHostAnswer(address, has)).toEqual(answer);
  });

  it('sends a folder asked for without its slash, or a page asked for with one, to its own address', () => {
    expect(liveHostAnswer('/home-flat', has)).toEqual({ redirect: '/home-flat/' });
    expect(liveHostAnswer('/work/glyph/', has)).toEqual({ redirect: '/work/glyph' });
  });

  it('leaves the home page and every address that is not a page file to the app', () => {
    expect(liveHostAnswer('/', has)).toBeNull();
    expect(liveHostAnswer('/work/zero-my-ai', has)).toBeNull();
    expect(liveHostAnswer('/images/share/home.jpg', has)).toBeNull();
    expect(liveHostAnswer('/review/draft/story.html', has)).toBeNull();
    expect(liveHostAnswer('/../secrets.html', has)).toBeNull();
  });
});

const SHIPPED = ['index.html', 'index.tsx', 'App.tsx', 'components', 'lib', 'hooks', 'context', 'data', 'public'];
const READ = /\.(tsx?|jsx?|mjs|html)$/;
const SKIP = /(\.test\.ts|\.min\.js)$|(^|\/)(vendor|node_modules)\//;
const SAME_ORIGIN_HTML = /(["'`])((?:\.{0,2}\/)?[\w@%+~./-]*[\w@%+~-]\.html)(?:[?#][^"'`]*)?\1/g;

function shippedFiles(entry: string): string[] {
  const full = path.join(root, entry);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [entry];
  return fs.readdirSync(full).flatMap((name) => shippedFiles(`${entry}/${name}`));
}

function withoutHtml(address: string): string {
  return address.endsWith('index.html') ? address.slice(0, -'index.html'.length) || './' : address.slice(0, -'.html'.length);
}

describe('no shipped file asks for a .html address', () => {
  it('asks for the address the live site serves, not the one it redirects from', () => {
    const asked: string[] = [];
    for (const file of SHIPPED.flatMap(shippedFiles).filter((name) => READ.test(name) && !SKIP.test(name))) {
      fs.readFileSync(path.join(root, file), 'utf8').split('\n').forEach((line, index) => {
        for (const [, , address] of line.matchAll(SAME_ORIGIN_HTML)) {
          asked.push(`${file}:${index + 1} asks for "${address}". The live site answers a .html address with a 307 redirect, `
            + `one more round trip before the page starts. Ask for "${withoutHtml(address)}": the dev server and vite preview `
            + 'answer it as the live site does (scripts/pageAddresses.ts).');
        }
      });
    }
    expect(asked).toEqual([]);
  });
});
