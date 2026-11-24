import { expect, test, type Page } from '@playwright/test';

/**
 * Dialog history in a real browser, against the Vite dev server: StrictMode's double effect only exists in dev,
 * and it caused three of the ordering bugs this file guards (a933b6f7: a dialog closed the instant it opened;
 * feb77f50: a child closing shut its parent; cb8a6e0d: Forward stacked a duplicate entry, a deep link had no
 * Back destination).
 *
 * Everything asserted is what a visitor can observe: which dialogs are on screen, the address, and history.length.
 * No class names, no internal state.
 */

const dialog = (page: Page) => page.getByRole('dialog');

/** Home: "/", or the flat home a WebGL-less browser is forwarded to (same as in case-study-exit.spec.ts). */
const atHome = (url: URL) => url.pathname === '/' || url.pathname.startsWith('/home-flat');

/** Open a Selected Work project from the old home and wait until it owns its address. */
async function openProject(page: Page, id: string) {
  await page.goto('/classic', { waitUntil: 'domcontentloaded' });
  await page.locator(`[data-project-id="${id}"]`).click();
  await expect(page).toHaveURL(`/work/${id}`);
  await expect(dialog(page).first()).toBeVisible();
}

test('a project opened from the old home stays open and owns its address', async ({ page }) => {
  await openProject(page, 'glyph');
});

test('browser Back closes it and the address is what it was', async ({ page }) => {
  await openProject(page, 'glyph');
  await page.goBack();
  await expect(page).toHaveURL(/\/classic\/?$/);
  await expect(dialog(page)).toHaveCount(0);
});

test('Forward reopens a world project and one Back closes it', async ({ page }) => {
  await openProject(page, 'surya');
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL('/work/surya');
  await expect(dialog(page).first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/classic\/?$/);
  await expect(dialog(page)).toHaveCount(0);
});

test('a second dialog kind: the profile opens from the home and Back closes it', async ({ page }) => {
  await page.goto('/classic', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'View profile' }).first().click();
  await expect(dialog(page).first()).toBeVisible();
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/classic\/?$/);
});

test('a direct visit then Back lands on the home, not off the site', async ({ page }) => {
  await page.goto('/work/zero-my-ai', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/work/zero-my-ai');
  await expect(dialog(page).first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(atHome);
  await expect(dialog(page)).toHaveCount(0);
});

test('ten open and close rounds leave history.length where it started', async ({ page }) => {  await page.goto('/classic', { waitUntil: 'domcontentloaded' });
  // a warm-up round: closing with the entry consumed leaves it as a forward entry, and every later push prunes it,
  // so a leak would still grow the length every round while a clean close keeps it flat
  await page.locator('[data-project-id="glyph"]').click();
  await expect(dialog(page).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  const before = await page.evaluate(() => history.length);
  for (let round = 0; round < 10; round += 1) {
    await page.locator('[data-project-id="glyph"]').click();
    await expect(dialog(page).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
  }
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test('a child dialog closes and leaves its parent open', async ({ page }) => {
  await page.goto('/experience/ms-edi', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page)).toHaveCount(1);

  await page.getByRole('button', { name: 'Open project NUvention: Medical' }).click();
  await expect(dialog(page)).toHaveCount(2);
  await expect(page).toHaveURL('/experience/ms-edi');

  await page.goBack();
  await expect(dialog(page)).toHaveCount(1);
  await expect(page).toHaveURL('/experience/ms-edi');

  await page.getByRole('button', { name: 'Open project NUvention: Medical' }).click();
  await expect(dialog(page)).toHaveCount(2);
  await page.locator('[data-feature-detail]').getByRole('button', { name: 'Back' }).click();
  await expect(dialog(page)).toHaveCount(1);
  await expect(page).toHaveURL('/experience/ms-edi');

  // the child dance left no stray entry behind: one Back closes the parent onto the home
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(atHome);
});
