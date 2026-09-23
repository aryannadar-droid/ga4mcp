// design-probe.js — measure a page's design system and mobile ergonomics.
// Usage: node design-probe.js <url> [more urls...] [--json out.json]
// Reports: distinct text sizes/colours/fonts, dominant body size, heading structure,
// tap targets under 44px, low-contrast text, missing alt text, horizontal scroll.
const fs = require('fs');
const { loadPlaywright, mobileContext, argValue, positionalUrls } = require('./_pw');
const { chromium } = loadPlaywright();

const urls = positionalUrls();
if (!urls.length) { console.log('Usage: node design-probe.js <url> [more urls] [--json out.json]'); process.exit(0); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await mobileContext(browser);
  const results = [];
  for (const url of urls) {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(6000);
      const r = await page.evaluate(() => {
        const parse = (c) => (c.match(/[\d.]+/g) || [0, 0, 0, 1]).map(Number);
        const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const b = getComputedStyle(n).backgroundColor; const p = parse(b); if (p.length < 4 || p[3] > 0.5) { if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return p; } n = n.parentElement; } return [255, 255, 255]; };
        const contrast = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };

        const textEls = [...document.querySelectorAll('body *')].filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && e.children.length === 0 && (e.textContent || '').trim();
        });
        const sizes = {}, colours = {}, weights = {}, fams = new Set();
        let lowContrast = 0;
        const lowEx = [];
        textEls.forEach((e) => {
          const s = getComputedStyle(e);
          sizes[s.fontSize] = (sizes[s.fontSize] || 0) + 1;
          colours[s.color] = (colours[s.color] || 0) + 1;
          weights[s.fontWeight] = (weights[s.fontWeight] || 0) + 1;
          fams.add(s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
          const cr = contrast(parse(s.color), bgOf(e));
          const big = parseFloat(s.fontSize) >= 18.66 || (parseFloat(s.fontSize) >= 14 && +s.fontWeight >= 700);
          if (cr < (big ? 3 : 4.5)) { lowContrast++; if (lowEx.length < 5) lowEx.push(`"${e.textContent.trim().slice(0, 24)}" ${cr.toFixed(1)}:1`); }
        });

        const taps = [...document.querySelectorAll('a,button,[role=button],input,select,textarea')].map((e) => {
          const b = e.getBoundingClientRect();
          return { t: (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 26), w: Math.round(b.width), h: Math.round(b.height) };
        }).filter((x) => x.w > 0 && x.h > 0);
        const small = taps.filter((x) => x.w < 44 || x.h < 44);

        const imgs = [...document.images];
        return {
          sizes, colourCount: Object.keys(colours).length, weights: Object.keys(weights),
          fonts: [...fams].slice(0, 8),
          headings: { h1: document.querySelectorAll('h1').length, h2: document.querySelectorAll('h2').length, h3: document.querySelectorAll('h3').length },
          taps: taps.length, smallTaps: small.length, smallEx: small.slice(0, 6),
          lowContrast, lowEx, textNodes: textEls.length,
          images: imgs.length, noAlt: imgs.filter((i) => !i.getAttribute('alt')).length,
          hScroll: document.documentElement.scrollWidth > window.innerWidth + 2,
          height: document.body.scrollHeight,
        };
      });
      const sizeList = Object.entries(r.sizes).sort((a, b) => b[1] - a[1]);
      const out = { url, ...r, dominantSize: sizeList[0] && sizeList[0][0], sizeCount: sizeList.length };
      results.push(out);

      const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
      console.log(`\n### ${url}`);
      console.log(`Type    ${sizeList.length} distinct sizes · dominant ${out.dominantSize} · top: ${sizeList.slice(0, 5).map((x) => x[0] + '×' + x[1]).join(' ')}`);
      console.log(`Colour  ${r.colourCount} distinct text colours · weights ${r.weights.join(',')} · fonts: ${r.fonts.join(', ')}`);
      console.log(`Structure  h1 ${r.headings.h1} · h2 ${r.headings.h2} · h3 ${r.headings.h3} · page height ${r.height}px · horizontal scroll: ${r.hScroll}`);
      console.log(`Ergonomics  ${r.smallTaps} of ${r.taps} tap targets under 44px (${pct(r.smallTaps, r.taps)}%) · e.g. ${r.smallEx.map((x) => `"${x.t}" ${x.w}×${x.h}`).join(' · ')}`);
      console.log(`Contrast  ${r.lowContrast} of ${r.textNodes} text nodes below WCAG AA (${pct(r.lowContrast, r.textNodes)}%) · e.g. ${r.lowEx.join(' · ')}`);
      console.log(`Images  ${r.images} · missing alt: ${r.noAlt}`);

      const flags = [];
      if (sizeList.length > 8) flags.push(`${sizeList.length} type sizes — no type scale`);
      if (parseFloat(out.dominantSize) < 14) flags.push(`body text dominated by ${out.dominantSize} on mobile`);
      if (r.colourCount > 9) flags.push(`${r.colourCount} text colours — no colour system`);
      if (r.headings.h1 !== 1) flags.push(`${r.headings.h1} h1 elements`);
      if (r.headings.h2 > 30) flags.push(`${r.headings.h2} h2s — headings used for styling`);
      if (pct(r.smallTaps, r.taps) > 50) flags.push(`${pct(r.smallTaps, r.taps)}% of tap targets under 44px`);
      if (pct(r.lowContrast, r.textNodes) > 10) flags.push(`${pct(r.lowContrast, r.textNodes)}% of text below contrast AA`);
      if (r.hScroll) flags.push('horizontal scroll on mobile');
      console.log(`FLAGS   ${flags.length ? flags.join(' | ') : 'none'}`);
    } catch (e) {
      console.log(`\n### ${url}\nERROR ${e.message.slice(0, 140)}`);
    }
    await page.close();
  }
  await browser.close();
  const jsonOut = argValue('--json');
  if (jsonOut) { fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2)); console.log(`\nwrote ${jsonOut}`); }
})();
