#!/usr/bin/env node

const DEFAULT_URL = 'http://localhost:3000';
const APP_URL = process.argv[2] || process.env.PORTFOLIO_URL || DEFAULT_URL;

async function loadPlaywright() {
    try {
        return await import('playwright');
    } catch (error) {
        console.error('Playwright is required for this smoke check. Run it with `npx playwright install chromium` after adding Playwright in your local tooling, or execute via an environment that already provides Playwright.');
        process.exitCode = 1;
        return null;
    }
}

async function waitForVisible(locator, label, timeout = 5000) {
    try {
        await locator.waitFor({ state: 'visible', timeout });
    } catch (error) {
        throw new Error(`${label} was not visible within ${timeout}ms`);
    }
}

async function main() {
    const playwright = await loadPlaywright();
    if (!playwright) return;

    const browser = await playwright.chromium.launch({ headless: process.env.HEADLESS !== 'false' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    try {
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        const desktopNav = page.getByLabel(/^Navigate to /).first();
        await page.mouse.wheel(0, 900);
        await waitForVisible(desktopNav, 'desktop nav');

        await page.getByText('TinkerVerse', { exact: true }).last().click();

        const tinkerDialog = page.getByRole('dialog', { name: 'TinkerVerse' });
        await waitForVisible(tinkerDialog, 'TinkerVerse dialog');
        await waitForVisible(page.getByRole('button', { name: 'Close TinkerVerse modal' }), 'TinkerVerse close button');

        if (await desktopNav.isVisible()) {
            throw new Error('desktop nav stayed visible while TinkerVerse dialog was open');
        }

        await page.getByRole('button', { name: 'Close TinkerVerse modal' }).click();
        await tinkerDialog.waitFor({ state: 'hidden', timeout: 5000 });
        await waitForVisible(desktopNav, 'desktop nav after closing TinkerVerse');

        console.log(`Modal smoke passed against ${APP_URL}`);
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
