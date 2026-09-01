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
      assert.equal(
        await page.locator('[data-portfolio-footer]').count(),
        0,
        `${viewport.label}: the public footer must not interrupt the portfolio scroll`,
      );
      if (viewport.compact) {
        assert.equal(heroAvatar, null, `${viewport.label}: decorative avatar must stay out of the compact startup layout`);
      }
      assert.equal(wheelMode, viewport.expectedWheelMode, `${viewport.label}: startup wheel mode must match the viewport`);
      if (heroAvatar) {
        assert.equal(overlaps(heroAvatar, primaryCta), false, `${viewport.label}: avatar must not overlap the primary CTA`);
      }

      if (viewport.label === 'desktop') {
        const heroMat = page.locator('#profile [data-cutting-mat-surface]');
        const activeProjectCard = page.locator('[data-project-wheel-card="active"]');
        const projectSummary = page.locator('[data-project-wheel-summary]');
        const githubEvidence = page.locator('[data-github-evidence]');
        const sectionNavigation = page.getByRole('navigation', { name: 'Sections' });
        const visibleProjectCards = page.locator('[data-project-wheel-card][data-visible="true"]');
        const [activeCardBox, projectSummaryBox, githubEvidenceBox, sectionNavigationBox] = await Promise.all([
          activeProjectCard.boundingBox(),
          projectSummary.boundingBox(),
          githubEvidence.boundingBox(),
          sectionNavigation.boundingBox(),
        ]);

        assert.equal(await visibleProjectCards.count(), 3, 'desktop: the carousel must show one project and two restrained neighbors');
        assert.ok(activeCardBox, 'desktop: the active project card must render');
        assert.ok(projectSummaryBox, 'desktop: the integrated project summary must render');
        assert.ok(githubEvidenceBox, 'desktop: GitHub evidence must render');
        assert.ok(sectionNavigationBox, 'desktop: section navigation must render');
        assert.equal(overlaps(activeCardBox, primaryCta), false, 'desktop: project card must not overlap the primary CTA');
        assert.equal(overlaps(activeCardBox, heroAvatar), false, 'desktop: project card must not overlap the avatar');
        assert.equal(overlaps(activeCardBox, githubEvidenceBox), false, 'desktop: project card must not overlap GitHub evidence');
        assert.equal(overlaps(projectSummaryBox, githubEvidenceBox), false, 'desktop: project summary must not overlap GitHub evidence');
        assert.equal(overlaps(activeCardBox, sectionNavigationBox), false, 'desktop: project card must not overlap section navigation');
        assert.equal(overlaps(projectSummaryBox, sectionNavigationBox), false, 'desktop: project summary must not overlap section navigation');

        const matTransformBeforeClick = await heroMat.evaluate((element) => getComputedStyle(element).transform);
        const focusedProjectBeforeClick = await page.locator('[data-project-wheel] h2').textContent();
        await page.locator('[data-project-wheel-fallback] button').nth(1).click();
        await page.waitForTimeout(500);
        const focusedProjectAfterClick = await page.locator('[data-project-wheel] h2').textContent();
        assert.notEqual(focusedProjectAfterClick, focusedProjectBeforeClick, 'desktop: clicking a neighboring card must advance the connected carousel');
        await page.getByRole('button', { name: 'View selected work' }).click();
        await page.waitForTimeout(300);
        const matTransformAfterClick = await heroMat.evaluate((element) => getComputedStyle(element).transform);
        assert.equal(matTransformAfterClick, matTransformBeforeClick, 'desktop: clicking must not restart or move the full cutting-mat surface');
      }

      await page.close();
    }

    const fallbackPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await fallbackPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await fallbackPage.waitForTimeout(500);
    assert.equal(
      await fallbackPage.locator('[data-project-wheel]').getAttribute('data-project-wheel-mode'),
      'fallback',
      'public startup must remain readable while the experimental renderer is repaired',
    );
    await fallbackPage.close();

    const reducedMotionPage = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    await reducedMotionPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await reducedMotionPage.waitForTimeout(500);
    assert.equal(
      await reducedMotionPage.locator('[data-project-wheel]').getAttribute('data-project-wheel-mode'),
      'fallback',
      'reduced-motion users must receive the stable non-WebGL carousel',
    );
    await reducedMotionPage.close();
  } finally {
    await browser.close();
  }

  console.log(`Startup layout smoke passed against ${baseUrl}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
