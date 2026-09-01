import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(root, 'index.html');

const fail = (message) => {
  throw new Error(message);
};

await access(htmlPath).catch(() => fail('index.html is missing'));
const html = await readFile(htmlPath, 'utf8');

const artifacts = [...html.matchAll(/<article\b[^>]*class="[^"]*artifact-card[^"]*"[^>]*>/g)];
if (artifacts.length < 20) fail(`expected at least 20 artifacts, found ${artifacts.length}`);

for (const project of ['care', 'mcdonalds']) {
  if (!html.includes(`data-project="${project}"`)) fail(`missing ${project} artifacts`);
}

for (const category of ['research', 'journey', 'ideation', 'interface']) {
  if (!html.includes(`data-category="${category}"`)) fail(`missing ${category} category`);
}

for (const required of [
  'id="project-filter"',
  'id="category-filter"',
  'id="select-visible"',
  'id="clear-selection"',
  'id="copy-selection"',
  'id="selection-count"',
  'id="selection-output"',
  'localStorage',
  'navigator.clipboard',
  'aria-live="polite"',
]) {
  if (!html.includes(required)) fail(`missing required behavior marker: ${required}`);
}

const figmaLinks = [...html.matchAll(/href="(https:\/\/www\.figma\.com\/(?:board|slides|design)\/[^"#]+(?:\?[^"#]*)?(?:#[^"]*)?)"/g)];
if (figmaLinks.length < artifacts.length) {
  fail(`expected at least one Figma link per artifact; found ${figmaLinks.length} links for ${artifacts.length} artifacts`);
}

const imagePaths = [...new Set([...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((match) => match[1]))];
if (imagePaths.length < 20) fail(`expected at least 20 distinct images, found ${imagePaths.length}`);

for (const relativePath of imagePaths) {
  if (/^(?:https?:|data:)/.test(relativePath)) fail(`image must be local: ${relativePath}`);
  const absolutePath = path.join(root, relativePath);
  const imageStat = await stat(absolutePath).catch(() => fail(`missing image: ${relativePath}`));
  if (imageStat.size < 1_000) fail(`image is unexpectedly small: ${relativePath}`);
}

console.log(`Verified ${artifacts.length} artifacts, ${imagePaths.length} local images, and ${figmaLinks.length} Figma links.`);
