import { expect, test } from '@playwright/test';

/**
 * The "full page" link on an opened timeline stop (Adi, 2026-11-24: the mat is the only home, and every stop must lead
 * to its full page, /experience/<id>, until that content lives on the mat itself).
 *
 * Checked here on the flat home, which every browser can draw (the CI browser has no graphics card, so it is forwarded
 * there from "/"). The same pill on the 3D mat's picked-up stop is checked by hand with a real GPU.
 */

/** [the story's name on the home, its stop id in the timeline] */
const STORIES: [string, string][] = [
  ['self', 'self-xyz'], ['zomato', 'zomato'], ['udaan', 'udaan'], ['schmooze', 'schmooze'], ['snapdeal', 'snapdeal'],
];

for (const [story, stop] of STORIES) {
  test(`phone home: the ${story} story leads to its full page, and Back returns to the home`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/home-flat/#experience-${story}`, { waitUntil: 'domcontentloaded' });
    const link = page.getByRole('link', { name: /open the full page/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `/experience/${stop}`);
    await link.click();
    await expect(page).toHaveURL((url) => url.pathname === `/experience/${stop}`);
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 15_000 });
    // (the page stays: an unknown stop would have been sent home a moment later)
    await page.waitForTimeout(600);
    await expect(page).toHaveURL((url) => url.pathname === `/experience/${stop}`);
    await page.goBack();
    await expect(page).toHaveURL((url) => url.pathname.startsWith('/home-flat'));
  });
}

test('phone home: the stops with no story on the home link straight to their full page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home-flat/', { waitUntil: 'domcontentloaded' });
  for (const stop of ['ms-edi', 'tinkerverse', 'bits']) {
    await expect(page.locator(`a[href="/experience/${stop}"]`).first()).toBeAttached();
  }
});
