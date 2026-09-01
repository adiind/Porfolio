import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const shader = read('components/project-wheel/projectWheelShader.ts');
const renderer = read('components/project-wheel/createProjectWheelRenderer.ts');
const wheel = read('components/project-wheel/ProjectWheel.tsx');
const fallback = read('components/project-wheel/ProjectWheelFallback.tsx');
const hero = read('components/Hero.tsx');
const app = read('App.tsx');
const notices = read('THIRD_PARTY_NOTICES.md');

assert.match(shader, /float\s+smin\s*\(/, 'shader must implement smooth-min goo fusion');
assert.match(shader, /float\s+sdLink\s*\(/, 'shader must implement stretching neighbor threads');
assert.match(shader, /uniform\s+vec4\s+uMouse/, 'shader must expose cursor deformation uniforms');
assert.match(shader, /uniform\s+vec4\s+uMelt/, 'shader must expose cursor melt uniforms');
assert.match(shader, /float\s+glassBend\s*\(/, 'shader must implement edge refraction');
assert.match(shader, /uBandTop|uBandBottom/, 'shader must expose refracted edge bands');

assert.match(renderer, /addEventListener\(['"]wheel['"]/, 'renderer must handle wheel or trackpad input');
assert.match(renderer, /addEventListener\(['"]pointerdown['"]/, 'renderer must handle pointer drag and touch swipe');
assert.match(renderer, /requestAnimationFrame/, 'renderer must run the WebGL animation loop');
assert.match(renderer, /forceContextLoss/, 'renderer must release its WebGL context');
assert.match(renderer, /visibilitychange/, 'renderer must pause when the document is hidden');

assert.match(wheel, /onKeyDown/, 'carousel must expose keyboard interaction');
assert.match(wheel, /import\(['"]\.\/createProjectWheelRenderer['"]\)/, 'Three.js renderer must be loaded lazily');
assert.match(wheel, /ArrowLeft|ArrowRight/, 'carousel must support arrow stepping');
assert.match(wheel, /aria-live=['"]polite['"]/, 'carousel must announce the current project');
assert.match(wheel, /Open project/, 'carousel must expose a semantic project-opening action');
assert.match(fallback, /data-project-wheel-fallback/, 'carousel must render an HTML fallback');

assert.doesNotMatch(hero, /data-discipline-option/, 'Hero must not retain discipline controls');
assert.doesNotMatch(hero, /data-discipline-arcs/, 'Hero must not retain nested discipline arcs');
assert.doesNotMatch(hero, /skillProjectMapping/, 'Hero must not retain skill-to-project filtering');
assert.match(hero, /<ProjectWheel/, 'Hero must render the project-only carousel');
assert.match(hero, /PROJECT_WHEEL_LOCAL_IMAGES/, 'remote project media must use stable local carousel fallbacks');
assert.match(hero, /projects\.map\(/, 'Hero must derive the wheel from the canonical project collection');
assert.match(app, /closest\(['"]\[data-project-wheel\]['"]\)/, 'global intro keyboard handling must yield to the carousel');

assert.match(notices, /Copyright \(c\) 2026 Yousuf Soomro/, 'third-party notice must preserve upstream copyright');
assert.match(notices, /MIT License/, 'third-party notice must preserve the MIT license');
assert.match(notices, /Project imagery.*not copied/is, 'notice must state that reference artwork was not copied');

console.log('Project wheel source verification passed.');
