# Evidence toolkit — gathering proof in minutes

Every finding worth presenting came from a live capture, not from a benchmark. These recipes run with Playwright (Chromium, headless, mobile viewport). They are fast enough to run during a conversation.

## Setup

Playwright with Chromium installed. If the project has no dependency of its own, borrow one:

```js
const { chromium } = require('<path-to>/node_modules/playwright');
```

Standard context — always audit mobile-first, because the traffic is:

```js
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: 'en-IN',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
             '(KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
});
```

---

## The recipes

| What you need | Script / method | Output you can present |
|---|---|---|
| Design system and ergonomics | `scripts/design-probe.js <url>` | Distinct type sizes and colours, dominant body size, heading counts, % of tap targets under 44px, missing alt text, horizontal scroll |
| Price-band coverage | `scripts/band-scan.js <listing-url> --band 15000-25000` | Share of visible prices in band, median, what the default sort opens with |
| Dead inventory, tags, consent | `scripts/site-evidence.js <url> --sitemap --sample 40` | Soft-404 rate from a random sitemap sample, third-party domain count, consent prompt present or not |
| Screenshots for a deck | `scripts/shoot.js jobs.json` | 2× mobile captures, with optional clicks (dismiss cookie banners), scroll positions and lazy-load triggering |
| What a control really does | `page.evaluate` over `a,button` reading `innerText` + `href` | "Visit Showroom → a Maps *search* URL still carrying `entry=gmail`" |
| What a form really asks | Read `select` options and required inputs from the DOM | 90 internal ERP branch codes exposed to customers; an 8-field booking form |
| How an offer is delivered | Read `img` src and alt on campaign pages | Offer terms locked inside a JPEG — unreadable, untranslatable, unsearchable |
| Competitive journey comparison | Same capture on 3–5 competitors, same day, same city | ●◐○ capability matrix per journey step |
| Category demand context | DataForSEO `bulk_traffic_estimation` for a competitor set | Estimated monthly organic visits — always label as directional, not audited |

---

## Practical notes

- **Scroll before you screenshot.** Lazy loading means a full-page capture without scrolling shows empty space where products should be.
- **Dismiss overlays deliberately.** Cookie banners and offer modals are themselves findings — capture them once, then dismiss and re-shoot the clean state.
- **Some sites bot-block.** Two competitor store pages returned blank or 404 in headless capture during one audit. Report exactly what you saw, claim nothing more, and note the limitation on the slide.
- **Sample, don't crawl.** Forty random sitemap URLs rendered is enough to establish a soft-404 rate and takes two minutes. A full crawl buys precision you don't need for a pitch.
- **Date every capture** and keep the raw PNGs beside the deck build so any number can be traced.
- **Pre-crop screenshots to one aspect ratio** (e.g. 780×1600 from a 390px viewport) so phone frames line up across every slide.
- **Contrast is computed against solid background colours.** Text over gradients or images can read as falsely low (a white-on-green-gradient button measured 1.1:1). Verify any low-contrast flag visually before presenting it.
- **Band scans pick up every price on the page,** including header widgets like a live gold rate. Read the "below band" count with that in mind, and the scan counts distinct values, so re-runs vary slightly with lazy loading — report the share, not the raw count.
- **Soft-404 checks need enough wait time.** A dead page may render its "not found" message a second or two after load; a short wait counts it as live and understates the problem.
- **Rendering your own HTML** works the same way — build mockups and flow diagrams as HTML, screenshot the element, place the PNG. Faster to edit than any drawing tool.

## What this toolkit does not cover yet

Core Web Vitals and Lighthouse runs, visual regression over time, authenticated journeys (checkout past login), and app-store or in-app journeys. Say so rather than implying coverage.
