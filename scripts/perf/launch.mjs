// Shared launcher: the newest full Chrome for Testing in the Playwright cache, with the real GPU (Metal) switched on.
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
export const exe = readdirSync(cache).filter((n) => /^chromium-\d+$/.test(n)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
  .map((b) => path.join(cache, b, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')).find(existsSync);
export const launch = (extra = {}) => chromium.launch({ executablePath: exe, args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'], ...extra });
