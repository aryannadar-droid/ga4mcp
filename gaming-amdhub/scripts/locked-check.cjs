/*
 * Locked-feature regression check (see FEATURES_LOCKED.md). Needs Playwright with Chromium.
 * Run against a preview build: npm run build && npm run preview, then npm run check:locked
 * Exits non-zero if any locked feature is missing or broken, or any page logs an error.
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const fails = [];
let passes = 0;
const ok = (cond, msg) => {
  if (cond) passes++;
  else {
    fails.push(msg);
    console.log('FAIL ' + msg);
  }
};

(async () => {
  const b = await chromium.launch();
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const events = [];
    await ctx.exposeBinding('__dl', (_, e) => events.push(e));
    await ctx.addInitScript(() => {
      const arr = [];
      const push = arr.push.bind(arr);
      arr.push = (...a) => {
        a.forEach((e) => window.__dl(e));
        return push(...a);
      };
      Object.defineProperty(window, 'dataLayer', { get: () => arr, set: () => {} });
    });
    const p = await ctx.newPage();
    ctx.on('page', (np) => np !== p && np.close());
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    const t = (m) => `${tag}: ${m}`;
    const count = (sel) => p.$$eval(sel, (els) => els.length);
    const visible = (sel) => p.locator(sel).first().isVisible().catch(() => false);

    /* ---------- homepage ---------- */
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    ok(await visible('header [data-buy="where-to-buy"]'), t('header Where to buy visible on load'));
    ok((await p.textContent('#hero-title'))?.includes('The fastest gaming processors'), t('locked hero headline'));
    ok(await visible('text=Start building'), t('hero Start building'));
    ok(await visible('#offers'), t('offer chip'));
    await p.click('button:has-text("View in 3D")');
    ok(await p.waitForSelector('dialog[open]', { timeout: 8000 }).then(() => true).catch(() => false), t('View in 3D opens the chip viewer'));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    ok((await count('#doors a[href="/new-gaming-pc"], #doors a[href="/upgrade"], #doors a[href="/work-and-play"]')) >= 3, t('persona doors link to the three persona pages'));
    ok(await p.locator('#doors >> text=Play games without a graphics card.').count() === 1, t('need-led line under doors'));
    await p.click('#doors >> text=Not sure? Answer two questions');
    ok(await visible('#persona-quiz'), t('two-question quiz opens'));
    ok((await count('#products li')) === 4, t('product strip has 4 cards'));
    ok((await count('#products button:has-text("View sellers")')) === 4, t('View sellers on each card'));
    ok((await count('#fps [role=tab]')) === 4, t('FPS tabs, one per product card'));
    ok((await count('#fps [role=slider]')) === 1, t('ray-tracing slider'));
    ok((await count('#build [role=tab]')) === 3, t('build journey tabs'));
    ok((await count('#build li button:has-text("Configure now")')) === 3, t('build journey part rows'));
    ok((await count('#sellers li')) === 4, t('four named sellers'));
    ok((await count('#guides a')) === 5, t('five guide cards'));
    ok((await count('#alert form')) === 1, t('footer sale-alert form'));
    // pinned section bar after the hero
    for (let i = 0; i < 8; i++) {
      await p.mouse.wheel(0, 600);
      await p.waitForTimeout(150);
    }
    await p.waitForTimeout(600);
    ok(await visible('nav[aria-label="Page sections"] [data-buy="where-to-buy"]'), t('pinned section bar after the hero'));
    // View sellers selects the product in Sellers
    await p.click('#products button:has-text("View sellers") >> nth=1');
    await p.waitForTimeout(1200);
    ok((await p.inputValue('#sellers select')) === 'r7-5700x3d', t('View sellers picks the product in Sellers'));
    const sellerHrefs = await p.$$eval('#sellers a[target=_blank]', (as) => as.map((a) => a.href));
    ok(sellerHrefs.length === 4 && sellerHrefs.every((h) => h.includes('utm_source=amdhub') && !/search|\/s\?/.test(h)), t('seller links exact + UTM'));
    // Start building (builder_start) → doors; door click → persona page
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.click('text=Start building');
    await p.waitForTimeout(1200);
    await p.click('#doors a[href="/upgrade"]');
    await p.waitForTimeout(600);
    ok(p.url().endsWith('/upgrade'), t('door routes to /upgrade'));

    /* ---------- persona pages ---------- */
    await p.goto(BASE + '/new-gaming-pc', { waitUntil: 'networkidle' });
    ok((await count('#step-1 [role=group] button')) >= 7, t('A: budget + game chips'));
    ok((await count('#step-2 article')) === 3, t('A: three build cards'));
    ok((await count('#step-2 button:has-text("Customise in the builder")')) === 3, t('A: customise links'));
    await p.goto(BASE + '/upgrade', { waitUntil: 'networkidle' });
    await p.click('button:has-text("AMD AM4")');
    await p.click('text=Check fit');
    ok(await visible('text=Upgrading the graphics card instead?'), t('B: AM4 → B1 path with switch'));
    ok(await p.locator('[aria-live] p.font-display').count() > 0, t('B: fit result'));
    await p.goto(BASE + '/work-and-play', { waitUntil: 'networkidle' });
    await p.click('button:has-text("Editing")');
    await p.click('text=Speed up the work');
    await p.click('text=Show my build');
    await p.waitForTimeout(600);
    ok((await p.textContent('#step-2'))?.includes('Professional'), t('C: matched build'));
    ok((await count('#step-3 ul li')) === 3, t('C: three compare cards'));

    /* ---------- configurator ---------- */
    await p.goto(BASE + '/build-your-pc', { waitUntil: 'networkidle' });
    ok((await count('#cfg-cpu li')) === 4, t('configurator: four processors'));
    ok((await count('#cfg-gpu li')) === 5, t('configurator: five graphics options'));
    await p.click('#cfg-cpu button:has-text("Ryzen 5 8600G")');
    await p.click('#cfg-gpu button:has-text("Built-in graphics")');
    await p.click('#cfg-cpu button:has-text("Ryzen 5 7500F")');
    ok((await p.textContent('#cfg-gpu'))?.includes('This processor needs a graphics card'), t('configurator: incompatibility notice'));
    await p.click(tag === 'phone' ? '.fixed.bottom-0 button[data-buy]' : '#cfg-buy button[data-buy]');
    ok(await p.waitForSelector('dialog[open]', { timeout: 4000 }).then(() => true).catch(() => false), t('configurator: buy sheet opens'));

    /* ---------- events ---------- */
    const names = new Set(events.map((e) => e.event));
    for (const ev of ['first_buy_visible', 'scroll_depth', 'persona_select', 'compat_check', 'build_configure', 'store_search', 'view_3d', 'builder_start'])
      ok(names.has(ev), t(`event ${ev} fired`));
    const pc = events.find((e) => e.event === 'persona_select' && e.method === 'door');
    ok(!!pc && pc.persona === 'upgrade' && pc.section === 'persona_doors', t('persona_select keeps its locked params'));

    ok(errs.length === 0, t(`no console errors${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`));
    await ctx.close();
  }
  await b.close();
  console.log(`\n${passes} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
