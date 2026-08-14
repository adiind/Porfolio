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

const sectionKeys = ['situation', 'learning', 'idea', 'mechanics', 'reflection'];
const forbiddenPublicText = /\b(evidence|boundary|provenance|verification)\b|view source|figma/i;

const projects = [
  {
    path: '/work/familysync-jpmorgan',
    title: 'FamilySync',
    visualCount: 9,
    postItCount: 3,
    closingContext: 'Student team project created at Northwestern EDI with JPMorgan Chase as project partner; not a shipped product.',
    sectionTitles: ['Care coordination is work', 'The family is the system', 'Three principles shaped the idea', 'Designing the handoff', 'What I took forward'],
    story: require(path.join(__dirname, '..', 'data', 'hcd', 'familysync-story.json')),
  },
  {
    path: '/work/mcdonalds-interaction-design',
    title: 'Squad Up',
    visualCount: 18,
    postItCount: 3,
    closingContext: 'Student team project created at Northwestern EDI using McDonald’s ordering as the design context; not affiliated with or shipped by McDonald’s.',
    sectionTitles: ['The order starts before checkout', 'One person becomes the coordinator', 'One order, individual agency', 'From invite to pickup', 'What I took forward'],
    story: require(path.join(__dirname, '..', 'data', 'hcd', 'mcdonalds-story.json')),
  },
];

const viewports = [
  { label: 'desktop', width: 1440, height: 1000 },
  { label: 'mobile', width: 390, height: 844 },
];

function retainedVisuals(story) {
  return [story.hero, ...story.sections.flatMap((section) => section.groups.flatMap((group) => group.visuals))];
}

function retainedNotes(story) {
  return story.sections.flatMap((section) => section.notes ?? []);
}

function assertNoPublicSourceMetadata(value, location = 'story') {
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    assert.notEqual(key, 'sourceLabel', `${location}: sourceLabel must not exist in the public story`);
    assert.notEqual(key, 'sourceUrl', `${location}: sourceUrl must not exist in the public story`);
    assertNoPublicSourceMetadata(child, `${location}.${key}`);
  }
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

async function waitForLoadedImage(image, visualId) {
  await image.evaluate((element) => {
    if (element.complete && element.naturalWidth > 0 && element.naturalHeight > 0) return;
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
  assert.ok(
    await image.evaluate((element) => element.complete && element.naturalWidth > 0 && element.naturalHeight > 0),
    `${visualId}: image loaded`,
  );
}

async function activateWithPointer(page, control, label) {
  const pointerTarget = await control.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const target = document.elementFromPoint(x, y);
    return {
      x,
      y,
      ownsCenter: target === element || (target !== null && element.contains(target)),
      targetTag: target?.tagName ?? 'null',
      targetLabel: target?.getAttribute('aria-label') ?? target?.textContent?.trim().slice(0, 80) ?? '',
    };
  });
  assert.equal(
    pointerTarget.ownsCenter,
    true,
    `${label}: control must own its center pointer target; received ${pointerTarget.targetTag} ${JSON.stringify(pointerTarget.targetLabel)}`,
  );
  await page.mouse.click(pointerTarget.x, pointerTarget.y);
}

async function activateWithKeyboard(page, control) {
  await control.focus();
  assert.equal(await control.evaluate((element) => element === document.activeElement), true, 'keyboard target receives focus');
  await page.keyboard.press('Enter');
}

async function assertPublicStory(projectDialog, project) {
  assertNoPublicSourceMetadata(project.story, project.title);

  assert.equal(await projectDialog.locator('[data-hcd-workshop-surface]').count(), 1, `${project.title}: workshop surface`);
  assert.deepEqual(
    await projectDialog.locator('[data-hcd-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-hcd-section'))),
    sectionKeys,
    `${project.title}: five ordered story sections`,
  );

  const sectionTitles = await projectDialog.locator('[data-hcd-section] h3').allTextContents();
  assert.deepEqual(sectionTitles.map((title) => title.trim()), project.sectionTitles, `${project.title}: exact section headings`);

  const expectedNotes = retainedNotes(project.story);
  assert.equal(expectedNotes.length, project.postItCount, `${project.title}: manifest post-it count`);
  assert.equal(await projectDialog.locator('[data-hcd-post-it]').count(), project.postItCount, `${project.title}: rendered post-it count`);
  assert.deepEqual(
    (await projectDialog.locator('[data-hcd-post-it]').allTextContents()).map((text) => text.trim()),
    expectedNotes.map((note) => note.text),
    `${project.title}: exact post-it text`,
  );

  assert.equal(await projectDialog.getByText(project.closingContext, { exact: true }).count(), 1, `${project.title}: exact closing context once`);
  assert.equal(await projectDialog.locator('a[href*="figma.com"]').count(), 0, `${project.title}: no public Figma links`);
  assert.equal(await projectDialog.locator('nav').count(), 0, `${project.title}: no chapter navigation`);
  assert.doesNotMatch(await projectDialog.innerText(), forbiddenPublicText, `${project.title}: no forbidden public language`);
}

async function assertVisuals(projectDialog, project) {
  const expectedVisuals = retainedVisuals(project.story);
  assert.equal(expectedVisuals.length, project.visualCount, `${project.title}: manifest visual count`);

  const expectedIds = expectedVisuals.map((visual) => visual.id);
  assert.equal(new Set(expectedIds).size, expectedIds.length, `${project.title}: manifest visual IDs must be unique`);

  const renderedIds = await projectDialog.locator('[data-hcd-visual-id]').evaluateAll((figures) =>
    figures.map((figure) => figure.getAttribute('data-hcd-visual-id')),
  );
  assert.equal(renderedIds.length, project.visualCount, `${project.title}: rendered visual count`);
  assert.equal(new Set(renderedIds).size, renderedIds.length, `${project.title}: rendered visual IDs must be unique`);
  assert.deepEqual([...renderedIds].sort(), [...expectedIds].sort(), `${project.title}: rendered visual set`);

  for (const visual of expectedVisuals) {
    assert.ok(visual.alt.trim().length >= 20, `${visual.id}: alt text must be specific`);
    assert.ok(visual.caption.trim().length >= 20, `${visual.id}: caption must be specific`);

    const figure = projectDialog.locator(`[data-hcd-visual-id="${visual.id}"]`);
    assert.equal(await figure.count(), 1, `${visual.id}: must render exactly once`);
    await figure.scrollIntoViewIfNeeded();

    const image = figure.locator('img');
    assert.equal(await image.getAttribute('alt'), visual.alt, `${visual.id}: exact alt text`);
    await waitForLoadedImage(image, visual.id);

    const caption = figure.locator('figcaption');
    assert.equal((await caption.innerText()).trim(), visual.caption, `${visual.id}: exact caption`);
    assert.equal(await caption.locator('a').count(), 0, `${visual.id}: caption has no source action`);
  }
}

async function assertLightbox(page, projectDialog, project, viewport) {
  const visual = retainedVisuals(project.story)[0];
  const trigger = projectDialog.locator(`[data-hcd-visual-trigger="${visual.id}"]`);
  await trigger.scrollIntoViewIfNeeded();

  if (viewport.label === 'desktop') {
    await activateWithPointer(page, trigger, `${visual.id}: visual trigger`);
  } else {
    await activateWithKeyboard(page, trigger);
  }

  const lightbox = page.getByRole('dialog', { name: `Full view: ${visual.alt}`, exact: true });
  await lightbox.waitFor({ state: 'visible' });
  assert.equal(await projectDialog.isVisible(), true, `${visual.id}: project remains open behind full view`);

  const fullImage = lightbox.locator('img');
  assert.equal(new URL(await fullImage.getAttribute('src'), baseUrl).pathname, visual.fullSrc, `${visual.id}: full asset source`);
  await waitForLoadedImage(fullImage, visual.id);

  const closeButton = lightbox.getByRole('button', { name: 'Close full view', exact: true });
  assert.equal(await closeButton.evaluate((element) => element === document.activeElement), true, `${visual.id}: full-view close receives focus`);

  const fullSizeButton = lightbox.locator('button[aria-pressed]');
  assert.equal(await fullSizeButton.count(), 1, `${visual.id}: one full-size control`);
  assert.equal(await fullSizeButton.getAttribute('aria-label'), 'View image at full size', `${visual.id}: full-size control label`);
  assert.equal(await fullSizeButton.getAttribute('aria-pressed'), 'false', `${visual.id}: initial fit state`);
  if (viewport.label === 'desktop') {
    await activateWithPointer(page, fullSizeButton, `${visual.id}: full-size control`);
  } else {
    await activateWithKeyboard(page, fullSizeButton);
  }
  assert.equal(await fullSizeButton.getAttribute('aria-pressed'), 'true', `${visual.id}: full-size state`);
  assert.equal(await fullSizeButton.getAttribute('aria-label'), 'Fit image to screen', `${visual.id}: fit control label after activation`);

  const panRegion = lightbox.getByRole('region', {
    name: `${visual.alt} image — full size; scroll in any direction`,
    exact: true,
  });
  assert.equal(await panRegion.getAttribute('tabindex'), '0', `${visual.id}: pan region is keyboard focusable`);
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
  assert.equal(panState.overflowX, 'auto', `${visual.id}: horizontal overflow is inspectable`);
  assert.equal(panState.overflowY, 'auto', `${visual.id}: vertical overflow is inspectable`);
  assert.ok(panState.hasHorizontalRange && panState.movedX, `${visual.id}: full-size visual pans horizontally`);
  assert.ok(panState.hasVerticalRange && panState.movedY, `${visual.id}: full-size visual pans vertically`);

  await panRegion.focus();
  await page.keyboard.press('Escape');
  await lightbox.waitFor({ state: 'detached' });
  assert.equal(await projectDialog.isVisible(), true, `${visual.id}: Escape closes only the full view`);
  assert.equal(new URL(page.url()).pathname, project.path, `${visual.id}: full-view Escape preserves the project route`);
  await page.waitForFunction(
    (visualId) => document.activeElement?.getAttribute('data-hcd-visual-trigger') === visualId,
    visual.id,
  );
  assert.equal(
    await trigger.evaluate((element) => element === document.activeElement),
    true,
    `${visual.id}: Escape returns focus to visual trigger`,
  );
}

async function verifyProject(browser, project, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = createErrorCollector(page);

  try {
    let projectDialog = await openDeepLink(page, project);
    await projectDialog.getByRole('heading', { name: project.title, exact: true }).waitFor();

    await assertPublicStory(projectDialog, project);
    await assertVisuals(projectDialog, project);
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
    console.log(`PASS ${project.title} ${viewport.width}x${viewport.height}: ${project.visualCount} visuals, ${project.postItCount} post-its, 5 sections, ${viewport.label === 'desktop' ? 'pointer' : 'keyboard'} visual/full-size activation, two-axis pan, viewer Escape/focus return, project Escape, Back, no public Figma/nav/forbidden language, no overflow/errors`);
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
    assert.equal(await page.locator('[data-hcd-workshop-surface]').count(), 0, 'default project must not use the HCD workshop shell');
    assert.equal(await page.locator('[data-hcd-section]').count(), 0, 'default project must not use HCD story sections');
    assert.deepEqual(errors, [], `default renderer browser errors\n${errors.join('\n')}`);
    console.log('PASS default renderer: /work/portfolio-website renders The Story without HCD workshop markers');
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
    console.log('HCD workshop case study browser smoke passed with zero errors.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
