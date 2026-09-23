// Shared Playwright loader + mobile context for the cro-smith-skills scripts.
// Resolution order: PLAYWRIGHT_PATH env → a `playwright` install next to these scripts or in the current folder.
const path = require('path');

function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    'playwright',
    path.join(__dirname, 'node_modules', 'playwright'),
    path.join(process.cwd(), 'node_modules', 'playwright'),
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch (_) { /* try next */ }
  }
  console.error('Playwright not found. Set PLAYWRIGHT_PATH to a node_modules/playwright folder, or run `npm i playwright && npx playwright install chromium`.');
  process.exit(1);
}

async function mobileContext(browser, opts = {}) {
  return browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: opts.scale || 2,
    isMobile: true,
    hasTouch: true,
    locale: opts.locale || 'en-IN',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  });
}

async function scrollToLoad(page, steps = 12, px = 2000, pause = 800) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), px);
    await page.waitForTimeout(pause);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function positionalUrls() {
  const out = [];
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { if (argv[i + 1] && !argv[i + 1].startsWith('--') && !/^https?:/.test(argv[i + 1])) i++; continue; }
    if (/^https?:\/\//.test(argv[i])) out.push(argv[i]);
  }
  return out;
}

module.exports = { loadPlaywright, mobileContext, scrollToLoad, argValue, positionalUrls };
