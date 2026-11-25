import { expect, test, type Page } from '@playwright/test';

/**
 * Case studies and timeline pages in a real browser, against the Vite dev server: StrictMode's double effect only exists
 * in dev, and it caused three of the ordering bugs this file guards (a933b6f7: a dialog closed the instant it opened;
 * feb77f50: a child closing shut its parent; cb8a6e0d: Forward stacked a duplicate entry, a deep link had no
 * Back destination).
 *
 * Each of these pages is its own page (lib/ship/BranchPage.tsx): there is no old home underneath, and the mat is the only
 * home. Everything asserted is what a visitor can observe: which dialogs are on screen, the address, and history.length.
 * No class names, no internal state.
 */

const dialog = (page: Page) => page.getByRole('dialog');

/** Home: "/", or the flat home a WebGL-less browser is forwarded to (same as in case-study-exit.spec.ts). */
const atHome = (url: URL) => url.pathname === '/' || url.pathname.startsWith('/home-flat');

test('a case study opened by its address stays open and owns its address', async ({ page }) => {
  await page.goto('/work/glyph', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/work/glyph');
  await expect(dialog(page).first()).toBeVisible();
  // (it does not close itself a moment later: the bug StrictMode's second mount once caused)
  await page.waitForTimeout(600);
  await expect(dialog(page).first()).toBeVisible();
  await expect(page).toHaveURL('/work/glyph');
});

test('nothing of the old home is on the page', async ({ page }) => {
  await page.goto('/work/glyph', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page).first()).toBeVisible();
  await expect(page.getByText('I make AI tangible')).toHaveCount(0);
  await expect(page.locator('[data-project-id]')).toHaveCount(0);
});

test('a direct visit then Back lands on the home, not off the site', async ({ page }) => {
  await page.goto('/work/zero-my-ai', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/work/zero-my-ai');
  await expect(dialog(page).first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(atHome);
  await expect(dialog(page)).toHaveCount(0);
});

test('Escape on a world project lands on the home', async ({ page }) => {
  await page.goto('/work/surya', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(atHome);
});

test('a timeline page opened by its address shows, and Back lands on the home', async ({ page }) => {
  await page.goto('/experience/zomato', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/experience/zomato');
  await expect(dialog(page)).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(atHome);
});

test('a case study on top of a timeline page: Escape closes only the case study', async ({ page }) => {
  await page.goto('/experience/zomato', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page)).toHaveCount(1);
  await page.getByText('View Case Study').first().click();
  await expect(dialog(page)).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(1);
  await expect(page).toHaveURL('/experience/zomato');
  // and the page itself still leaves in one step
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(atHome);
});

test('the addresses that went with the old home lead to the home', async ({ page }) => {
  for (const address of ['/classic', '/classic#work', '/#writings', '/no-such-page']) {
    await page.goto(address, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(atHome);
    await expect(page.getByText('I make AI tangible')).toHaveCount(0);
  }
});

test('five rounds of a child dialog leave history.length where it started', async ({ page }) => {
  await page.goto('/experience/ms-edi', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page)).toHaveCount(1);
  // a warm-up round: closing leaves the child's entry as a forward entry, and every later push prunes it, so a leak
  // would still grow the length every round while a clean close keeps it flat
  const open = () => page.getByRole('button', { name: 'Open project NUvention: Medical' }).click();
  await open();
  await expect(dialog(page)).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(1);
  const before = await page.evaluate(() => history.length);
  for (let round = 0; round < 5; round += 1) {
    await open();
    await expect(dialog(page)).toHaveCount(2);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(1);
  }
  expect(await page.evaluate(() => history.length)).toBe(before);
  await expect(page).toHaveURL('/experience/ms-edi');
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
