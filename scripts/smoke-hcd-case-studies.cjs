#!/usr/bin/env node

const assert = require('node:assert/strict');
const path = require('node:path');

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
const baseUrl = process.argv[2]?.replace(/\/$/, '');

if (!baseUrl) {
  console.error('Usage: node scripts/smoke-hcd-case-studies.cjs <base-url>');
  process.exit(2);
}

const chapterKeys = ['frame', 'tension', 'opportunity', 'journey', 'decisions', 'interaction', 'outcome'];
const projects = [
  {
    path: '/work/familysync-jpmorgan',
    title: 'FamilySync',
    evidenceCount: 9,
    boundaryCopy: 'not a shipped JPMorgan Chase product',
    story: require(path.join(__dirname, '..', 'data', 'hcd', 'familysync-story.json')),
  },
  {
    path: '/work/mcdonalds-interaction-design',
    title: 'Squad Up',
    evidenceCount: 18,
    boundaryCopy: 'McDonald’s did not sponsor, approve, or participate in the project',
    story: require(path.join(__dirname, '..', 'data', 'hcd', 'mcdonalds-story.json')),
  },
];
const viewports = [
  { label: 'desktop', width: 1440, height: 1000 },
  { label: 'mobile', width: 390, height: 844 },
];

function retainedEvidence(story) {
  return [story.hero, ...story.chapters.flatMap((chapter) => chapter.evidence)];
}

function createErrorCollector(page) {
  const errors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    errors.push(`request: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown failure'})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`response: ${response.status()} ${response.url()}`);
  });

  return errors;
}

async function openDeepLink(page, project) {
  await page.goto(`${baseUrl}${project.path}`, { waitUntil: 'networkidle' });
  const projectDialog = page.locator(`[role="dialog"][aria-labelledby="hcd-${project.story.projectId}-title"]`);
  await projectDialog.waitFor({ state: 'visible' });
  return projectDialog;
}

async function assertEvidence(page, projectDialog, project) {
  const expectedEvidence = retainedEvidence(project.story);
  assert.equal(expectedEvidence.length, project.evidenceCount, `${project.title}: manifest evidence count`);

  const expectedIds = expectedEvidence.map((evidence) => evidence.id);
  assert.equal(new Set(expectedIds).size, expectedIds.length, `${project.title}: manifest evidence IDs must be unique`);

  const renderedIds = await projectDialog.locator('[data-evidence-id]').evaluateAll((figures) =>
    figures.map((figure) => figure.getAttribute('data-evidence-id')),
  );
  assert.equal(renderedIds.length, project.evidenceCount, `${project.title}: rendered evidence count`);
  assert.equal(new Set(renderedIds).size, renderedIds.length, `${project.title}: rendered evidence IDs must be unique`);
  assert.deepEqual([...renderedIds].sort(), [...expectedIds].sort(), `${project.title}: rendered evidence set`);

  for (const evidence of expectedEvidence) {
    assert.ok(evidence.alt.trim().length >= 20, `${evidence.id}: alt text must be specific`);
    assert.ok(evidence.caption.trim().length >= 20, `${evidence.id}: caption must be specific`);

    const figure = projectDialog.locator(`[data-evidence-id="${evidence.id}"]`);
    await assert.doesNotReject(
      () => figure.waitFor({ state: 'attached' }),
      `${evidence.id}: figure should render`,
    );
    assert.equal(await figure.count(), 1, `${evidence.id}: must render exactly once`);
    await figure.scrollIntoViewIfNeeded();

    const image = figure.locator('img');
    assert.equal(await image.getAttribute('alt'), evidence.alt, `${evidence.id}: exact alt text`);
    await image.evaluate((element) => {
      if (element.complete && element.naturalWidth > 0) return;
      return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error(`Timed out loading ${element.currentSrc || element.src}`)), 10_000);
        element.addEventListener('load', () => {
          window.clearTimeout(timeout);
          resolve();
        }, { once: true });
        element.addEventListener('error', () => {
          window.clearTimeout(timeout);
          reject(new Error(`Failed to load ${element.currentSrc || element.src}`));
        }, { once: true });
      });
    });
    assert.ok(await image.evaluate((element) => element.complete && element.naturalWidth > 0), `${evidence.id}: image loaded`);

    const caption = figure.locator('figcaption');
    await assert.doesNotReject(() => caption.getByText(evidence.caption, { exact: true }).waitFor());
    await assert.doesNotReject(() => caption.getByText(evidence.sourceLabel, { exact: true }).waitFor());
    const sourceLink = caption.getByRole('link', { name: /View source in Figma/i });
    assert.equal(await sourceLink.getAttribute('href'), evidence.sourceUrl, `${evidence.id}: exact Figma source`);
    assert.equal(await sourceLink.getAttribute('target'), '_blank', `${evidence.id}: source opens a new tab`);
    assert.match(await sourceLink.getAttribute('rel') ?? '', /noreferrer/, `${evidence.id}: safe source rel`);
  }
}

async function assertLightbox(page, projectDialog, project, viewport) {
  const evidence = retainedEvidence(project.story)[0];
  const trigger = projectDialog.locator(`[data-evidence-trigger="${evidence.id}"]`);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const lightbox = page.getByRole('dialog', { name: `Full evidence: ${evidence.alt}`, exact: true });
  await lightbox.waitFor({ state: 'visible' });
  const fullImage = lightbox.locator('img');
  assert.equal(new URL(await fullImage.getAttribute('src'), baseUrl).pathname, evidence.fullSrc, `${evidence.id}: full asset source`);
  assert.ok(await fullImage.evaluate((element) => element.complete && element.naturalWidth > 0), `${evidence.id}: full asset loaded`);

  const closeButton = lightbox.getByRole('button', { name: /Close evidence|Close/i });
  assert.equal(await closeButton.evaluate((element) => element === document.activeElement), true, `${evidence.id}: lightbox close receives focus`);

  const fullSizeButton = lightbox.locator('button[aria-pressed]');
  assert.equal(await fullSizeButton.getAttribute('aria-label'), 'View evidence at full size', `${evidence.id}: full-size control label`);
  if (viewport.label === 'desktop') {
    const pointerTarget = await fullSizeButton.evaluate((button) => {
      const bounds = button.getBoundingClientRect();
      const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      return {
        ownsCenter: target === button || (target !== null && button.contains(target)),
        targetTag: target?.tagName ?? 'null',
        targetLabel: target?.getAttribute('aria-label') ?? target?.textContent?.trim().slice(0, 80) ?? '',
      };
    });
    assert.equal(
      pointerTarget.ownsCenter,
      true,
      `${evidence.id}: full-size button must own its center pointer target; received ${pointerTarget.targetTag} ${JSON.stringify(pointerTarget.targetLabel)}`,
    );
    await fullSizeButton.click();
  } else {
    await fullSizeButton.focus();
    await page.keyboard.press('Enter');
  }
  assert.equal(await fullSizeButton.getAttribute('aria-pressed'), 'true', `${evidence.id}: full-size state`);

  const panRegion = lightbox.getByRole('region', { name: /full size; scroll in any direction to inspect/i });
  assert.equal(await panRegion.getAttribute('tabindex'), '0', `${evidence.id}: pan region is keyboard focusable`);
  const panState = await panRegion.evaluate((element) => {
    const style = getComputedStyle(element);
    element.scrollLeft = Math.min(80, element.scrollWidth - element.clientWidth);
    element.scrollTop = Math.min(80, element.scrollHeight - element.clientHeight);
    return {
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      hasHorizontalRange: element.scrollWidth > element.clientWidth,
      hasVerticalRange: element.scrollHeight > element.clientHeight,
      movedX: element.scrollLeft > 0,
      movedY: element.scrollTop > 0,
    };
  });
  assert.equal(panState.overflowX, 'auto', `${evidence.id}: horizontal overflow is inspectable`);
  assert.equal(panState.overflowY, 'auto', `${evidence.id}: vertical overflow is inspectable`);
  assert.ok(panState.hasHorizontalRange && panState.movedX, `${evidence.id}: full-size evidence pans horizontally`);
  assert.ok(panState.hasVerticalRange && panState.movedY, `${evidence.id}: full-size evidence pans vertically`);

  await panRegion.focus();
  await page.keyboard.press('Escape');
  await lightbox.waitFor({ state: 'detached' });
  await page.waitForFunction(
    (evidenceId) => document.activeElement?.getAttribute('data-evidence-trigger') === evidenceId,
    evidence.id,
  );
  assert.equal(
    await trigger.evaluate((element) => element === document.activeElement),
    true,
    `${evidence.id}: Escape returns focus to evidence trigger`,
  );
}

async function verifyProject(browser, project, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = createErrorCollector(page);

  try {
    let projectDialog = await openDeepLink(page, project);
    await projectDialog.getByRole('heading', { name: project.title, exact: true }).waitFor();
    await projectDialog.getByText(project.boundaryCopy, { exact: false }).first().waitFor();
    await projectDialog.getByText(project.story.status, { exact: true }).waitFor();

    const renderedChapters = await projectDialog.locator('[data-hcd-chapter]').evaluateAll((sections) =>
      sections.map((section) => section.getAttribute('data-hcd-chapter')),
    );
    assert.deepEqual(renderedChapters, chapterKeys, `${project.title}: seven ordered chapters`);

    await assertEvidence(page, projectDialog, project);
    await assertLightbox(page, projectDialog, project, viewport);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assert.ok(
      overflow.scrollWidth <= overflow.clientWidth + 1,
      `${project.title}: horizontal overflow ${overflow.scrollWidth}px > ${overflow.clientWidth}px`,
    );

    await page.keyboard.press('Escape');
    await projectDialog.waitFor({ state: 'detached' });
    assert.equal(new URL(page.url()).pathname, '/', `${project.title}: project Escape restores the root URL`);

    projectDialog = await openDeepLink(page, project);
    await page.goBack();
    await projectDialog.waitFor({ state: 'detached' });
    assert.equal(new URL(page.url()).pathname, '/', `${project.title}: browser Back closes the project`);

    await page.waitForLoadState('networkidle');
    assert.deepEqual(errors, [], `${project.title} ${viewport.label}: browser errors\n${errors.join('\n')}`);
    console.log(`PASS ${project.title} ${viewport.width}x${viewport.height}: ${project.evidenceCount} evidence, 7 chapters, ${viewport.label === 'desktop' ? 'pointer' : 'keyboard'} full-size activation, two-axis pan, Escape/focus return, page Escape, Back, no overflow/errors`);
  } finally {
    await page.close();
  }
}

async function verifyDefaultRenderer(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = createErrorCollector(page);

  try {
    await page.goto(`${baseUrl}/work/portfolio-website`, { waitUntil: 'networkidle' });
    const dialog = page.getByRole('dialog', { name: /Portfolio/i });
    await dialog.waitFor({ state: 'visible' });
    await dialog.getByRole('heading', { name: 'The Story', exact: true }).waitFor();
    assert.equal(await page.locator('[data-hcd-chapter]').count(), 0, 'default project must not use the HCD shell');
    assert.deepEqual(errors, [], `default renderer browser errors\n${errors.join('\n')}`);
    console.log('PASS default renderer: /work/portfolio-website renders The Story');
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      for (const project of projects) {
        await verifyProject(browser, project, viewport);
      }
    }
    await verifyDefaultRenderer(browser);
    console.log('HCD case study browser smoke passed with zero errors.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
