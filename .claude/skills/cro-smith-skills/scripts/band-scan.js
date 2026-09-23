// band-scan.js — how much of what a listing shows sits in the target price band?
// Usage: node band-scan.js <listing-url> [more urls] --band 15000-25000 [--currency ₹]
// Loads each listing on mobile, scrolls to trigger lazy loading, extracts prices,
// reports coverage of the band, the median, and what the default sort opens with.
const { loadPlaywright, mobileContext, scrollToLoad, argValue, positionalUrls } = require('./_pw');
const { chromium } = loadPlaywright();

const urls = positionalUrls();
const [lo, hi] = (argValue('--band', '15000-25000')).split('-').map(Number);
const cur = argValue('--currency', '₹');
if (!urls.length) { console.log('Usage: node band-scan.js <listing-url> [more] --band 15000-25000 [--currency ₹]'); process.exit(0); }

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

(async () => {
  const browser = await chromium.launch();
  const ctx = await mobileContext(browser, { scale: 1 });
  console.log(`Target band: ${cur}${lo.toLocaleString('en-IN')}–${cur}${hi.toLocaleString('en-IN')}`);
  for (const url of urls) {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);
      const firstScreen = await page.evaluate((c) => {
        const re = new RegExp(c + '\\s?[\\d,]{3,}', 'g');
        return (document.body.innerText.match(re) || []).slice(0, 6);
      }, esc(cur));
      await scrollToLoad(page);
      const prices = await page.evaluate((c) => {
        const re = new RegExp(c + '\\s?[\\d,]{3,}', 'g');
        return (document.body.innerText.match(re) || []).map((x) => +x.replace(/[^\d]/g, ''));
      }, esc(cur));
      // de-duplicate strike-through/sale pairs loosely: keep the distinct values
      const uniq = [...new Set(prices.filter((v) => v > 500 && v < 1e8))].sort((a, b) => a - b);
      const inBand = uniq.filter((v) => v >= lo && v <= hi);
      const below = uniq.filter((v) => v < lo);
      const median = uniq.length ? uniq[Math.floor(uniq.length / 2)] : 0;
      const pct = uniq.length ? Math.round((100 * inBand.length) / uniq.length) : 0;
      console.log(`\n### ${url}`);
      console.log(`Distinct prices seen: ${uniq.length}`);
      console.log(`In band: ${inBand.length} (${pct}%) · below band: ${below.length} · above band: ${uniq.length - inBand.length - below.length}`);
      console.log(`Median: ${cur}${median.toLocaleString('en-IN')} · range ${cur}${(uniq[0] || 0).toLocaleString('en-IN')}–${cur}${(uniq[uniq.length - 1] || 0).toLocaleString('en-IN')}`);
      console.log(`First screen shows: ${firstScreen.join(' · ') || '(no prices visible on load)'}`);
      if (!uniq.length) console.log('NOTE: no prices found — the page may be a lookbook, prices may load in images, or the site blocked the headless browser.');
      else if (pct < 15) console.log(`READ: the target band is ${pct}% of what this page shows. Check assortment and stock before blaming media or landing pages.`);
    } catch (e) {
      console.log(`\n### ${url}\nERROR ${e.message.slice(0, 140)}`);
    }
    await page.close();
  }
  await browser.close();
})();
