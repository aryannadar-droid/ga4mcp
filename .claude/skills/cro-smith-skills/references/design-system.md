# Design, UI and system thinking — both directions

Design work in CRO runs two ways: auditing the client's interface, and designing the artefact you hand them. Both are measurable, and both should use a token system rather than taste.

---

# Part A — Auditing their pages

Turn critique into measurement. `scripts/design-probe.js <url>` fills most of this automatically on a 390px mobile viewport.

## 1. The type and colour system

| Signal | Healthy | Warning |
|---|---|---|
| Distinct text sizes in use | 5–7, from a scale | 9+, or sizes that don't belong to a scale |
| Dominant body size (mobile) | 14–16px | 12px or below carrying most of the page |
| Distinct text colours | 4–6 | 10+ (no colour system, or inline styling) |
| Font families / weights loaded | One family, 3–4 weights | Multiple families, stray fonts from other locales |
| Heading structure | One h1, h2s marking real sections | 2 h1s, 80 h2s — headings used for styling, not structure |

*Measured on a live jewellery site: 12px carrying 131 elements on the product page, 11 text colours, 2× h1 and 82× h2. That is a page with no type system, and it reads as visual noise before anyone judges the copy.*

## 2. Ergonomics — the one most audits miss

- **Tap targets.** Minimum 44×44px (Apple HIG), 48dp (Material). Report the share below it. *Same site: 121 of 127 controls under 44px on the product page — 95%.* This alone can explain friction being blamed on content.
- **Thumb zone.** Primary actions in the lower third on mobile; anything critical in the top corners is a desktop habit.
- **Sticky elements.** Does the buy bar persist? Does a floating chat widget cover the price or the CTA?
- **Input ergonomics.** Correct keyboards (`inputmode`), autofill, OTP autofill, no forced login before value.

## 3. Hierarchy and rhythm

One primary action per screen, price and product facts weighted above decoration, consistent spacing steps (4/8pt grid), and a first fold that answers the intent rather than carrying a campaign banner.

## 4. Component consistency

Is a card a card everywhere? Count variants of the same component across templates — button styles, card layouts, badge treatments. Divergence is where the design system has broken down and where implementation cost hides.

## 5. The states nobody designs

Most audits review the happy path. Check the rest, because this is where trust dies:

- **Empty** — a collection with zero products (a featured collection that opens empty is a dead end from the homepage)
- **Zero-result search** — is there a fallback, or "Sorry, we couldn't find anything"?
- **Error and soft-404** — a "not found" body returning HTTP 200 is invisible to crawlers and ad platforms
- **Loading** — skeletons vs layout shift
- **Out of stock / unavailable in my area** — is there an alternative, an alert, a store option?
- **Broken media** — placeholder text like `ECOMM` rendering as the variant name

## 6. Accessibility as conversion hygiene

Contrast ≥ 4.5:1 for body text, alt text on product images, focus states, labels tied to inputs, and content in text rather than baked into JPEGs — an offer inside an image can't be read, translated, searched or zoomed.

---

# Part B — Designing your own output

Decks and documents are interfaces. Build them as code so restructures are cheap, then *render and look at every page* before shipping.

## Tokens (the ones behind the GRT deck)

```
ink     #14181F      body and headings
grey    #6B7480      secondary text
light   #A9B4C4      sources, page numbers
line    #E3E6EB      hairlines and card borders
panel   #F5F7FA      neutral cards
accent  client brand (e.g. #8B1A2B)   kickers, numbers, emphasis
tint    accent at ~8% (#F7ECEE)       highlighted cards, dividers
gold    #C2992E / #F6EFDD            metrics, "test" blocks
green   #2F7D4F / #E5F1EA            what works, competitor strengths
red     #B02A24                      failures, today's state
```

One display font at 4 weights (Sora in Schbang decks). Type scale: 28–30 divider, 17 title, 10–11 subtitle, 8–9 body, 7–7.5 supporting, 6.5 labels. Margin 0.45in, content width 9.1in on a 10×5.625in slide.

## Slide grammar

```
KICKER (8pt, accent, letterspaced)
Title — one clear sentence, no jargon
Subtitle — the context, one line
[evidence: phone pair, table, diagram]
Source line (6.5pt, light) · page number
```

Repeatable components: **current vs opportunity phone pair** (live screenshot beside the proposed state), **numbered callouts** beside a screenshot, **stat tiles** (big number + caption), **●◐○ capability matrix**, **claim chips** (MEASURED / TO VALIDATE / HYPOTHESIS), **hypothesis block** (IF WE / THEN / BECAUSE), **metric strip** (TEST / MEASURE).

## Flow diagrams

Build them in HTML/CSS with an absolutely-positioned SVG arrow layer, screenshot at 2× and place full-bleed. Far faster to edit than drawing tools, and they inherit the same tokens. Pattern: a "today" lane in red running above a "the idea" lane in green, with a phone mockup in the middle and the measurement block on the right. See `diagrams.html` in the GRT project for a working set of six.

## Guards before you ship

1. **Text-fit checker** — estimate lines from character count, font size and box width; warn when a block needs more height than it has. Catches overflow you cannot see without rendering.
2. **Render every slide to PNG and actually look at it.** Overlaps, wrapped chips and clipped tables only show up visually.
3. **Check the fallback font.** If the display font isn't installed locally, previews render in a substitute — inspect layout, not beauty, and say so when sharing previews.
4. **One source line per exhibit**, dated. If it has no source, it is a hypothesis and must be labelled as one.
