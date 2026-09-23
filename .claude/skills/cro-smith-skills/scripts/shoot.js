// shoot.js — deck-ready mobile screenshots, with optional clicks and scroll positions.
// Usage: node shoot.js jobs.json [--out shots] [--crop 780x1600]
// jobs.json: [{ "name": "grt-pdp", "url": "https://...", "wait": 6000,
//               "clickText": ["Reject All"], "shots": [0, 850, "Price Breakup"], "full": false }]
// "shots" takes pixel offsets or a text string to scroll to. Files: <out>/<name>-<i>.png
// --crop pre-crops every capture to one size (from the top) so phone frames line up in a deck.
const fs = require('fs');
const path = require('path');
const { loadPlaywright, mobileContext, scrollToLoad, argValue } = require('./_pw');
const { chromium } = loadPlaywright();

const jobsFile = process.argv[2];
if (!jobsFile || !fs.existsSync(jobsFile)) { console.log('Usage: node shoot.js jobs.json [--out shots] [--crop 780x1600]'); process.exit(0); }
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
const out = argValue('--out', 'shots');
const crop = argValue('--crop');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await mobileContext(browser);
  await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }));
  for (const j of jobs) {
    const page = await ctx.newPage();
    try {
      await page.goto(j.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(j.wait || 6000);
      for (const t of j.clickText || []) {
        const l = page.getByText(t, { exact: false }).first();
        if (await l.count()) { await l.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(1000); }
      }
      if (j.full) { await scrollToLoad(page, 10, 900, 300); }
      const shots = j.shots || [0];
      let i = 0;
      for (const pos of shots) {
        if (typeof pos === 'number') await page.evaluate((y) => window.scrollTo(0, y), pos);
        else {
          const l = page.getByText(pos, { exact: false }).first();
          if (await l.count()) { await l.scrollIntoViewIfNeeded().catch(() => {}); await page.evaluate(() => window.scrollBy(0, -120)); }
        }
        await page.waitForTimeout(1200);
        const file = path.join(out, `${j.name}-${i++}.png`);
        await page.screenshot({ path: file, fullPage: false });
        console.log('saved', file);
      }
      if (j.full) {
        const file = path.join(out, `${j.name}-full.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log('saved', file);
      }
    } catch (e) {
      console.log(`ERROR ${j.name}: ${e.message.slice(0, 120)}`);
    }
    await page.close();
  }
  await browser.close();

  if (crop) {
    const [cw, ch] = crop.split('x').map(Number);
    console.log(`\nTo pre-crop for a deck (Python + Pillow):\n  python -c "from PIL import Image;import glob\n  [Image.open(f).convert('RGB').resize((${cw},int(Image.open(f).height*${cw}/Image.open(f).width))).crop((0,0,${cw},${ch})).save(f) for f in glob.glob('${out}/*.png') if 'full' not in f]"`);
  }
})();
