import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fallback = readFileSync(resolve('components/project-wheel/ProjectWheelFallback.tsx'), 'utf8');

assert.match(fallback, /className="absolute left-1\/2 top-1\/2/, 'cards must keep one fixed layout origin');
assert.match(fallback, /willChange:\s*['"]transform, opacity['"]/, 'cards must use compositor-friendly layers');
assert.match(fallback, /transition:\s*['"]transform 240ms/, 'cards must animate only their transform');
assert.doesNotMatch(fallback, /transition:\s*['"][^'"]*\bleft\b|transition:\s*['"][^'"]*\btop\b|transition:\s*['"][^'"]*\bopacity\b/, 'clicks must not animate layout or every card opacity');

console.log('Carousel compositor guard passed.');
