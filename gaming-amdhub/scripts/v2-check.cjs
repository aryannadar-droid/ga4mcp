/*
 * NEW_HOME_V2 checks (desktop 1440 × 900 and phone 390 × 844). Needs Playwright with Chromium.
 * Run against a preview build: npm run build && npm run preview, then npm run check:v2
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const fails = [];
let passes = 0;
const ok = (c, m) => (c ? passes++ : (fails.push(m), console.log('FAIL ' + m)));

(async () => {
  const b = await chromium.launch();
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, permissions: ['clipboard-read', 'clipboard-write'] });
    const ev = [];
    await ctx.exposeBinding('__dl', (_, e) => ev.push(e));
    await ctx.addInitScript(() => {
      const arr = [];
      const push = arr.push.bind(arr);
      arr.push = (...a) => (a.forEach((e) => window.__dl(e)), push(...a));
      Object.defineProperty(window, 'dataLayer', { get: () => arr, set: () => {} });
    });
    const p = await ctx.newPage();
    ctx.on('page', (np) => np !== p && np.close());
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    const t = (m) => `${tag}: ${m}`;
    const find = (name) => ev.filter((e) => e.event === name);

    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    // first screen: new hero leads, no prices / Buy Now / product boxes inside it
    const heroTop = await p.evaluate(() => {
      const h = document.querySelector('#v2-hero-title');
      return h ? Math.round(h.getBoundingClientRect().top) : -1;
    });
    ok(heroTop > 0 && heroTop < h, t('new hero headline in the first screen'));
    ok((await p.textContent('#v2-hero-title')).trim() === 'You already play on AMD.', t('hero headline copy'));
    ok(await p.$eval('#v2-hero-title span span', (s) => getComputedStyle(s).color === 'rgb(255, 106, 19)'), t('"AMD" drawn in orange'));
    const hero = '[aria-labelledby="v2-hero-title"]';
    const heroText = await p.$eval(hero, (s) => s.innerText);
    ok(!/₹|buy now/i.test(heroText) && !(await p.$(hero + ' img')), t('no prices, Buy Now or product boxes in the new hero'));
    ok((await p.$$(hero + ' li')).length === 3, t('three floating tags'));

    // merged sections: no repeats of the old design, and each merged section keeps the old features
    ok((await p.$$('#hero-title')).length === 0 && (await p.$$('h1')).length === 1, t('one hero only (old hero merged)'));
    ok((await p.$$eval('h2', (hs) => hs.filter((h) => /What are you building\?/.test(h.textContent)).length)) === 1, t('one "What are you building?" (old doors merged)'));
    ok((await p.$$('#sellers')).length === 1 && (await p.$$('#doors')).length === 1, t('one #sellers and one #doors anchor'));
    ok((await p.$$(hero + ' #offers')).length === 1 && (await p.$$(hero + ' a[href="#src-hero-claim"]')).length === 1, t('merged hero: offer chip + claim footnote'));
    ok((await p.$$(hero + ' button:has-text("View in 3D")')).length === 1, t('merged hero: View in 3D'));
    ok((await p.locator('#doors >> text=Play games without a graphics card.').count()) === 1 && (await p.$$('#doors button:has-text("Not sure? Answer two questions")')).length === 1, t('merged doors: need-led line + quiz'));
    ok((await p.$$('#sellers select option')).length === 9, t('merged sellers: product picker'));

    // presence band: final numbers, sources, presence_view at 50%
    await p.locator('#v2-presence').scrollIntoViewIfNeeded();
    await p.waitForTimeout(1800);
    const stats = await p.$$eval('#v2-presence li p:first-child', (els) => els.map((e) => e.getAttribute('data-final') + '=' + e.querySelector('[aria-hidden]').textContent));
    ok(stats.length === 4 && /97\.9M=97\.9M/.test(stats[0]) && /45%=45%/.test(stats[1]) && /3,000=3,000/.test(stats[2]) && /1 in 4=1 in 4/.test(stats[3]), t('stat tiles count up to 97.9M, 45%, 3,000, 1 in 4 ' + stats.join(' ')));
    ok((await p.$$eval('#v2-presence li', (els) => els.filter((e) => /Source:/.test(e.innerText)).length)) === 4, t('each stat has a source line'));
    ok(find('presence_view').length === 1 && find('presence_view')[0].page === '/', t('presence_view once with page'));

    // doors → persona pages
    const doorHrefs = await p.$$eval('#doors li > a', (as) => as.map((a) => a.getAttribute('href')));
    ok(doorHrefs.join() === '/new-gaming-pc,/upgrade,/work-and-play', t('three doors link to the existing persona pages'));

    // game check
    await p.locator('#v2-game-check').scrollIntoViewIfNeeded();
    const chipH = await p.$eval('#v2-game-check .v2-chip', (c) => c.getBoundingClientRect().height);
    ok(chipH >= 44, t(`game chips are thumb-sized (${chipH}px)`));
    await p.click('#v2-game-check button:has-text("+ more")');
    await p.click('#v2-game-check button:has-text("Cyberpunk 2077")');
    await p.click('#v2-game-check [role=radio]:has-text("1440p")');
    await p.click('#v2-game-check [role=radio]:has-text("₹1L+")');
    await p.click('#v2-game-check button:has-text("Check my games")');
    await p.waitForTimeout(800);
    const out = await p.textContent('#v2-game-check [aria-live]');
    ok(/Ryzen 9 9950X3D/.test(out) && /Radeon RX 9070 XT/.test(out), t('budget ₹1L+ at 1440p recommends 9950X3D + RX 9070 XT'));
    ok(/Very smooth|Smooth|Playable/.test(out) && /Illustrative; live version shows AMD-tested figures/.test(out), t('plain-words bars labelled illustrative'));
    ok(/Comfortable for streaming while you play/.test(out), t('streaming line'));
    const gc = find('game_check').pop();
    ok(gc && gc.game === 'valorant,cyberpunk' && gc.screen === '1440p' && gc.budget_band === '100+', t('game_check {game, screen, budget_band}'));
    await p.click('#v2-game-check button:has-text("Save")');
    const bs = find('build_save').pop();
    ok(bs && bs.build_id === 'c-creator' && bs.channel === 'device', t('build_save {build_id, channel}'));
    await p.click('#v2-game-check button:has-text("Share on WhatsApp")');
    const sh = find('build_share').pop();
    ok(sh && sh.build_id === 'c-creator' && sh.channel === 'whatsapp', t('build_share {build_id, channel: whatsapp}'));

    // explainers: modal + progress events
    await p.locator('[aria-labelledby="v2-explainers-title"]').scrollIntoViewIfNeeded();
    ok((await p.$$('[aria-labelledby="v2-explainers-title"] li')).length === 3, t('three explainer cards'));
    await p.click('[aria-labelledby="v2-explainers-title"] li:first-child button');
    await p.waitForSelector('dialog[open] video');
    await p.waitForTimeout(1200);
    await p.$eval('dialog[open] video', (v) => { v.currentTime = v.duration * 0.55; });
    await p.waitForTimeout(700);
    const marks = find('explainer_play').filter((e) => e.video_id === 'x3d').map((e) => e.percent_watched);
    ok(marks.includes(0) && marks.includes(50), t(`explainer_play {video_id, percent_watched} (${marks.join(',')})`));
    await p.keyboard.press('Escape');
    // hero story video
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(400);
    await p.click('button:has-text("60-second story")');
    ok(await p.waitForSelector('dialog[open] video', { timeout: 4000 }).then(() => true).catch(() => false), t('60-second story opens a video modal'));
    await p.keyboard.press('Escape');

    // creators row (only horizontal scroller in the layer)
    ok((await p.$$('[aria-labelledby="v2-creators-title"] article')).length >= 4, t('creator build cards'));
    await p.locator('[aria-labelledby="v2-creators-title"]').scrollIntoViewIfNeeded();
    await p.click('[aria-labelledby="v2-creators-title"] article >> nth=0 >> button:has-text("Copy build")');
    const cp = find('build_share').pop();
    ok(cp && cp.channel === 'copy' && cp.build_id === 'sample-1', t('Copy build → build_share {channel: copy}'));

    // find a seller: exact pages + utm_campaign=home (no persona yet)
    const links = await p.$$eval('#sellers a', (as) => as.map((a) => a.href));
    ok(links.length === 4 && links.every((l) => !/search|\/s\?/.test(l) && l.includes('utm_source=amdhub&utm_medium=referral&utm_campaign=home')), t('seller links: exact pages, utm_campaign=home'));
    await p.locator('#sellers').scrollIntoViewIfNeeded();
    await p.click('#sellers a >> nth=0');
    const pcl = find('partner_click').pop();
    ok(pcl && pcl.partner_name === 'Amazon' && pcl.partner_type === 'marketplace' && pcl.persona_id === 'home' && !!pcl.product, t('partner_click {partner_name, partner_type, product, persona_id}'));

    // door click → persona_select {persona_id} → persona page; then campaign follows the persona
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.click('[aria-labelledby="v2-doors-title"] a[href="/upgrade"]');
    await p.waitForTimeout(500);
    const ps = find('persona_select').pop();
    ok(ps && ps.persona_id === 'upgrade' && p.url().endsWith('/upgrade'), t('persona_select {persona_id} and route to persona page'));
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    const l2 = await p.$eval('#sellers a', (a) => a.href);
    ok(l2.includes('utm_campaign=upgrade'), t('utm_campaign = persona id once a persona is saved'));

    // phone bar
    if (tag === 'phone') {
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(500);
      ok(!(await p.isVisible('[data-v2-bar]')), t('phone bar hidden while the hero button is on screen'));
      await p.evaluate(() => window.scrollTo(0, document.querySelector('#v2-presence').offsetTop));
      await p.waitForTimeout(700);
      ok(await p.isVisible('[data-v2-bar] button:has-text("Will my game run?")'), t('phone bar shows after the hero'));
      const sizes = await p.$$eval('[data-v2-bar] button', (bs) => bs.map((b) => [getComputedStyle(b).backgroundColor, Math.round(b.getBoundingClientRect().height)]));
      ok(sizes[0][0] === 'rgb(255, 106, 19)' && sizes[1][0] === 'rgba(0, 0, 0, 0)' && sizes.every((s) => s[1] >= 44), t('bar: orange check + outline seller, thumb-sized'));
      await p.evaluate(() => window.scrollTo(0, document.querySelector('#v2-game-check').offsetTop));
      await p.waitForTimeout(700);
      ok(!(await p.isVisible('[data-v2-bar]')), t('phone bar steps aside inside the game check'));
      // no horizontal overflow; only the creator row scrolls sideways in the new layer
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      ok(sw <= 390, t(`no horizontal page scroll (${sw})`));
      const scrollers = await p.$$eval('[data-layer="home-v2"] *', (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 2 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowX)).map((e) => e.closest('section')?.getAttribute('aria-labelledby')));
      ok(scrollers.every((s) => s === 'v2-creators-title'), t(`only the creator row scrolls sideways (${scrollers.join(',')})`));
    }
    ok(errs.length === 0, t(`no console errors${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`));
    await ctx.close();
  }
  await b.close();
  console.log(`\n${passes} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
