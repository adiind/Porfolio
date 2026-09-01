import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const mark = readFileSync(resolve('public/images/tool-marks/codex.svg'), 'utf8');

assert.match(mark, /viewBox="0 0 24 24"/, 'Codex mark must use the current square app-icon canvas');
assert.match(mark, /data-codex-mark="current"/, 'Codex mark must identify the current Codex app glyph');
assert.doesNotMatch(mark, /M10\.931 3\.34/, 'Codex mark must not use the retired book glyph');

console.log('Current Codex app mark verified.');
