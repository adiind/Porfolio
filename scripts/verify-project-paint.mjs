import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('App.tsx');
const header = app.slice(app.indexOf('<header'), app.indexOf('</header>'));
const nav = read('components/VerticalNavbar.tsx');

// Regression contract for the Chrome paint dropout reproduced on 2026-09-23.
// This guards the repair, but cannot prove compositor output. Also inspect real
// Chrome: Selected Work -> scroll down/up with pointer over cards -> open Jarvis
// -> scroll to Key Decisions -> Escape -> scroll the grid in both directions.
// The mat, every loaded image, and opaque dialog background must stay painted.
for (const [name, source] of [
  ['fixed header', header],
  ['section navigation', nav],
  ['project cards', read('components/ProjectCard.tsx')],
  ['project section', read('components/ProjectsSection.tsx')],
]) {
  assert.doesNotMatch(source, /backdrop-blur|backdropFilter|backdrop-filter/, `${name} must not restore backdrop filtering`);
}
assert.match(header, /bg-\[#050d0c\]/, 'header must retain its opaque backing');
assert.equal((nav.match(/blur="none"/g) || []).length, 2, 'desktop and mobile navigation must opt out of shared blur');
assert.equal((nav.match(/backgroundColor: '#050d0c'/g) || []).length, 2, 'both navigation surfaces must retain opaque backing');
console.log('Project paint source contract passed. Real Chrome scroll inspection is still required.');
