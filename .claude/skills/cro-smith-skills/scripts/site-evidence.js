// site-evidence.js — tag load, consent, and soft-404s from a sitemap sample.
// Usage: node site-evidence.js <homepage-url> [--sitemap] [--sample 40]
// 1. Loads the homepage on mobile, lists third-party domains and checks for a consent prompt.
// 2. With --sitemap: fetches /sitemap.xml (and child sitemaps), renders a random sample,
//    and counts pages that say "not found" while returning HTTP 200 (soft-404s).
const { loadPlaywright, mobileContext, argValue, positionalUrls } = require('./_pw');
const { chromium } = loadPlaywright();

const [home] = positionalUrls();
const doSitemap = process.argv.includes('--sitemap');
const sampleN = +argValue('--sample', 40);
if (!home) { console.log('Usage: node site-evidence.js <homepage-url> [--sitemap] [--sample 40]'); process.exit(0); }

const NOT_FOUND = /something.?s missing|page not found|couldn.?t find|not be found|does not exist|404/i;

(async () => {
  const browser = await chromium.launch();
  const ctx = await mobileContext(browser, { scale: 1 });
  const hostRoot = new URL(home).hostname.split('.').slice(-2).join('.');

  // 1) tags + consent
  const page = await ctx.newPage();
  const hosts = new Set();
  page.on('request', (r) => { try { hosts.add(new URL(r.url()).hostname); } catch (_) {} });
  await page.goto(home, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(10000);
  const third = [...hosts].filter((h) => !h.endsWith(hostRoot)).sort();
  const consent = await page.evaluate(() => {
    const t = document.body.innerText;
    return /cookie|consent|privacy preferences|accept all|reject all/i.test(t);
  });
  const known = { 'hotjar': 'session recording', 'clarity': 'session recording', 'fullstory': 'session recording', 'googletagmanager': 'tag manager', 'google-analytics': 'analytics', 'doubleclick': 'ads', 'facebook': 'ads', 'criteo': 'ads', 'taboola': 'ads', 'amazon-adsystem': 'ads', 'pinimg': 'ads', 'bing': 'ads', 'netcore': 'CRM/engagement', 'unbxd': 'search', 'boxx': 'personalisation' };
  const tagged = third.map((h) => { const k = Object.keys(known).find((x) => h.includes(x)); return k ? `${h} (${known[k]})` : h; });
  console.log(`### ${home}`);
  console.log(`Third-party domains on load: ${third.length}`);
  console.log(tagged.map((t) => '  ' + t).join('\n'));
  console.log(`Consent prompt visible: ${consent ? 'yes' : 'NO'}`);
  const recVendors = ['hotjar', 'clarity', 'fullstory', 'mouseflow', 'smartlook', 'luckyorange'].filter((v) => third.some((h) => h.includes(v)));
  const vendorCount = new Set(third.map((h) => h.split('.').slice(-2).join('.'))).size;
  console.log(`Distinct third-party vendors (by root domain): ${vendorCount}`);
  if (recVendors.length > 1) console.log(`FLAG: ${recVendors.length} session-recording tools loaded (${recVendors.join(', ')}) — consolidate to one.`);
  await page.close();

  // 2) sitemap soft-404 sample
  if (doSitemap) {
    const origin = new URL(home).origin;
    const get = async (u) => { try { return await (await ctx.request.get(u, { timeout: 30000 })).text(); } catch (_) { return ''; } };
    const locs = (x) => [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const root = await get(origin + '/sitemap.xml');
    let urls = locs(root).filter((u) => !u.endsWith('.xml'));
    for (const sm of locs(root).filter((u) => u.endsWith('.xml')).slice(0, 10)) urls = urls.concat(locs(await get(sm)).filter((u) => !u.endsWith('.xml')));
    console.log(`\nSitemap URLs found: ${urls.length}`);
    if (!urls.length) { console.log('No sitemap URLs found (or sitemap blocked).'); await browser.close(); return; }
    const sample = urls.sort(() => Math.random() - 0.5).slice(0, sampleN);
    let soft = 0, hard = 0, ok = 0;
    const ex = [];
    for (const u of sample) {
      const q = await ctx.newPage();
      try {
        const resp = await q.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await q.waitForTimeout(3000);
        const status = resp ? resp.status() : 0;
        const body = await q.evaluate(() => document.body.innerText.slice(0, 3000));
        if (status >= 400) hard++;
        else if (NOT_FOUND.test(body)) { soft++; if (ex.length < 5) ex.push(`${status} ${u}`); }
        else ok++;
      } catch (_) { hard++; }
      await q.close();
    }
    console.log(`Sampled ${sample.length}: ${ok} live · ${soft} soft-404 (HTTP 200 with a not-found body) · ${hard} hard errors`);
    if (ex.length) console.log('Examples:\n' + ex.map((e) => '  ' + e).join('\n'));
    if (soft / sample.length > 0.1) console.log(`FLAG: ${Math.round((100 * soft) / sample.length)}% of sampled sitemap URLs are soft-404s — invisible to crawlers and ad platforms.`);
  }
  await browser.close();
})();
