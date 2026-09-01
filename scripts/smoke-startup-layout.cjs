#!/usr/bin/env node

const assert = require('node:assert/strict');

function loadPlaywright() {
  const candidates = [
    'playwright',
    '/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ];

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      if (error?.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }

  throw new Error(`Playwright was not found. Tried: ${candidates.join(', ')}`);
}

const { chromium } = loadPlaywright();
const baseUrl = process.argv[2]?.replace(/\/$/, '') || 'http://127.0.0.1:4173';
const viewports = [
  { label: 'desktop', width: 1440, height: 900, compact: false, expectedWheelMode: 'fallback' },
  { label: 'tablet', width: 919, height: 785, compact: true, expectedWheelMode: 'fallback' },
  { label: 'mobile', width: 390, height: 844, compact: true, expectedWheelMode: 'fallback' },
];

function overlaps(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      const primaryCta = await page.getByRole('button', { name: 'View selected work' }).boundingBox();
      const heroAvatars = await page.locator('img[alt="Adi Agarwal"]').all();
      const heroAvatar = heroAvatars.length > 1 ? await heroAvatars[1].boundingBox() : null;
      const wheelMode = await page.locator('[data-project-wheel]').getAttribute('data-project-wheel-mode');

      assert.ok(primaryCta, `${viewport.label}: primary CTA must render`);
      if (viewport.compact) {
        assert.equal(heroAvatar, null, `${viewport.label}: decorative avatar must stay out of the compact startup layout`);
      }
      assert.equal(wheelMode, viewport.expectedWheelMode, `${viewport.label}: startup wheel mode must match the viewport`);
      if (heroAvatar) {
        assert.equal(overlaps(heroAvatar, primaryCta), false, `${viewport.label}: avatar must not overlap the primary CTA`);
      }

      await page.close();
    }

    const webglPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await webglPage.goto(`${baseUrl}?projectWheelWebgl`, { waitUntil: 'domcontentloaded' });
    await webglPage.waitForTimeout(1200);
    assert.equal(
      await webglPage.locator('[data-project-wheel]').getAttribute('data-project-wheel-mode'),
      'webgl',
      'explicit projectWheelWebgl mode must retain the renderer for focused refinement',
    );
    await webglPage.close();
  } finally {
    await browser.close();
  }

  console.log(`Startup layout smoke passed against ${baseUrl}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
