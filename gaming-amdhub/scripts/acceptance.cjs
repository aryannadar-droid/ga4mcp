/* Acceptance checks from the phone-first revision. Needs Playwright with Chromium (npx playwright install chromium). */
const { chromium } = require('playwright');
// Run against a preview build: npm run build && npm run preview, then npm run check:acceptance
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const fails = [];
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails.push(msg); };

const buyInView = (p) => p.evaluate(() => [...document.querySelectorAll('[data-buy="where-to-buy"]')].some((el) => {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight) return false;
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const top = document.elementFromPoint(x, y);
  return top && (el === top || el.contains(top));
}));

(async () => {
  const b = await chromium.launch();

  // 1. Where to buy visible on load and after the hero, all the way down (390 × 844)
  for (const route of ['/', '/new-gaming-pc', '/upgrade', '/work-and-play']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(BASE + route, { waitUntil: 'networkidle' });
    ok(await buyInView(p), `${route}: Where to buy visible on load at 390x844`);
    const sh = await p.evaluate(() => document.documentElement.scrollHeight);
    const misses = [];
    for (let y = 400; y < sh - 844; y += 700) {
      await p.mouse.wheel(0, 700); await p.waitForTimeout(450);
      if (!(await buyInView(p))) misses.push(await p.evaluate(() => Math.round(scrollY)));
    }
    ok(misses.length === 0, `${route}: Where to buy stays visible while scrolling${misses.length ? ' (missing at y=' + misses.join(',') + ')' : ''}`);
    ok(await p.evaluate(() => !!document.querySelector('nav[aria-label="Page sections"] [data-buy="where-to-buy"]')), `${route}: pinned bar (section dropdown + Where to buy) is showing after the hero`);
    if (route === '/') {
      await p.goto(BASE + '/', { waitUntil: 'networkidle' });
      await p.click('text=Start building'); await p.waitForTimeout(1500);
      ok(await p.evaluate(() => !!document.querySelector('nav[aria-label="Page sections"]')) && (await buyInView(p)), `/: bar shows after an anchor jump past the hero`);
    }
    await p.close();
  }

  // 2. Seller links: exact listings, UTM tagged, never search pages
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const links = new Set();
  const grab = async () => (await p.$$eval('a[target=_blank]', (as) => as.map((a) => a.href))).forEach((h) => links.add(h));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await grab();
  for (const opt of await p.$$eval('#sellers select option', (os) => os.map((o) => o.value))) { await p.selectOption('#sellers select', opt); await grab(); }
  await p.goto(BASE + '/new-gaming-pc', { waitUntil: 'networkidle' });
  for (const t of ['₹40–60k', '₹60–80k', '₹80k–1L']) { await p.click(`text=${t}`); await grab(); }
  await p.goto(BASE + '/upgrade', { waitUntil: 'networkidle' }); await grab();
  for (const pl of ['AMD AM4', 'AMD AM5', 'Intel']) { await p.click(`button:has-text("${pl}")`); await grab(); }
  await p.goto(BASE + '/work-and-play', { waitUntil: 'networkidle' }); await grab();
  const sellerLinks = [...links].filter((h) => /amazon|flipkart|specialist|builder/.test(h));
  const searchy = sellerLinks.filter((h) => /\/s\?|search|[?&]q=|[?&]k=/.test(h));
  const noUtm = sellerLinks.filter((h) => !/utm_source=amdhub&utm_medium=referral&utm_campaign=/.test(h));
  ok(sellerLinks.length >= 12, `found ${sellerLinks.length} seller links`);
  ok(searchy.length === 0, `no seller link is a search page ${searchy.join(' ')}`);
  ok(noUtm.length === 0, `every seller link has UTM params ${noUtm.slice(0, 3).join(' ')}`);
  await p.close();

  // 3. Content visible with scroll animations never running (IntersectionObserver stubbed out)
  for (const [route, w] of [['/', 390], ['/', 1440], ['/new-gaming-pc', 390], ['/upgrade', 390], ['/work-and-play', 390]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.addInitScript(() => { window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }; });
    const q = await ctx.newPage();
    await q.goto(BASE + route, { waitUntil: 'networkidle' });
    await q.waitForTimeout(800);
    const hidden = await q.evaluate(() => {
      const bad = [];
      const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode; if (!t.textContent.trim()) continue;
        let el = t.parentElement, op = 1, skip = false;
        while (el) { const cs = getComputedStyle(el); if (cs.display === 'none' || el.hidden || el.closest('.sr-only')) { skip = true; break; } op *= +cs.opacity; el = el.parentElement; }
        // hover-reveal read-time labels are intentionally hidden until hover on mouse devices
        if (!skip && op < 0.4 && !t.parentElement.closest('[class*="group-hover:opacity-100"]')) bad.push(t.textContent.trim().slice(0, 40));
      }
      return bad;
    });
    ok(hidden.length === 0, `${route}@${w}: all text visible without scroll animations${hidden.length ? ' — hidden: ' + hidden.slice(0, 5).join(' | ') : ''}`);
    await ctx.close();
  }

  // 4. Prices up high: every "From ₹" in the first half of the page (390)
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  const pos = await m.evaluate(() => {
    const H = document.documentElement.scrollHeight;
    return [...document.querySelectorAll('#products li')].map((li) => Math.round(((li.getBoundingClientRect().top + scrollY) / H) * 100));
  });
  ok(pos.length === 4 && pos.every((v) => v < 50), `product cards with From ₹ at ${pos.join('%, ')}% of the page (< 50%)`);
  // 5. FPS game names legible on a phone
  const fs = await m.$$eval('#fps-panel li span.font-semibold:first-child', (els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  ok(fs.length === 4 && fs.every((v) => v >= 14), `FPS game names ${fs.join('/')}px (≥ 14px)`);
  // 6. RT slider keyboard
  await m.focus('[role=slider]');
  const before = await m.getAttribute('[role=slider]', 'aria-valuenow');
  await m.keyboard.press('ArrowRight'); await m.keyboard.press('ArrowRight');
  const after = await m.getAttribute('[role=slider]', 'aria-valuenow');
  ok(+after === +before + 10, `RT slider arrow keys move it (${before} → ${after})`);
  await b.close();
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
})();
