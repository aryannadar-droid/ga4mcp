# Building the deck or document as code

A client-facing CRO output goes through five or six structural rewrites before it is right. Hand-built slides make that expensive, so people stop improving them. Build as code and restructuring costs minutes.

*Reference build: a 61-slide pitch that went 22 → 39 → 53 → 58 → 61 slides across five restructures in two days, with no manual re-layout.*

---

## The stack

| Purpose | Tool |
|---|---|
| Slides | `pptxgenjs` — editable PPTX the client's team can work in |
| Diagrams and mockups | HTML + CSS, screenshotted with Playwright, placed as images |
| Evidence | Playwright captures, pre-cropped to one aspect ratio |
| Preview | PowerPoint COM (Windows) or LibreOffice `--headless --convert-to png` |
| Long-form documents | Same tokens, rendered HTML → PDF via Playwright `page.pdf()` |

---

## Skeleton

```js
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';           // 10 × 5.625in
const M = 0.45, W = 9.1;               // margin, content width

// helpers worth having from the start
base(kicker, title, sub, source)       // every content slide
divider(num, title, thesis)            // section breaks
card(x, y, w, h, fill)                 // rounded container
stat(x, y, w, big, label)              // number tile
chip(x, y, 'measured'|'validate'|'hypo')
phone(file, x, y, h, label, isGood)    // framed mobile screenshot
table(rows, opts)                      // styled table
idea({ see, ideaHead, idea[], hypIf, hypThen, hypBecause, test, metric })
diagram(kicker, title, sub, pngPath, source)
```

The `idea()` helper matters most: it forces every recommendation into the same shape — what we see, the idea, the hypothesis as if/then/because, the test, the measure. If a slide can't fill that shape, the idea isn't ready.

## The text-fit guard

PPTX has no layout engine you can query, so overflow is invisible until rendered. Estimate before writing:

```js
function fits(text, pt, w, h) {
  const cpl = Math.floor((w * 72) / (pt * 0.56));      // ~0.56em average advance
  const lines = text.split('\n')
    .reduce((a, l) => a + Math.max(1, Math.ceil(l.length / cpl)), 0);
  return (lines * pt * 1.28) / 72 <= h;                 // 1.28 line height
}
```

Log every failure with the slide number and the first 40 characters. Fix by changing the layout, not by cutting the thought.

## The review loop — non-negotiable

1. Build → 2. Export every slide to PNG → 3. Assemble contact sheets (6 per sheet) → 4. **Look at all of them** → 5. Fix overlaps, wrapped chips, clipped tables → repeat.

Text-fit checks catch the arithmetic; only your eyes catch a chip that wrapped to two lines or a footnote sitting under a source line.

## Practical gotchas

- **Locked files.** If the client has the deck open, the write fails with `EBUSY`. Write to the next version number rather than waiting.
- **Fonts.** If the display font isn't installed locally, previews render in a substitute. Check layout, not beauty, and tell the reader when you share a preview.
- **Images.** Pre-crop screenshots to one ratio; read PNG dimensions from the IHDR header to fit images inside a box without distortion.
- **Speaker notes.** Add them for the slides that carry an argument — they are where the "if they ask X, say Y" lives.
- **Version numbers in filenames**, and a one-line changelog in the reply when you send it.

## Structure that has worked

Cover → goals → how to read this (claim labels + pillars) → **01** where things stand (diagnosis with data) → **02** category split and priorities → **03** who we sell to (personas, intents, markets) → **04** what we found (by pillar, with evidence) → **05** the ideas (one per slide, same shape) → **06** personalisation → **07** how we test → **08** measurement → **09** value, what we would not do, roadmap, the ask → KPIs → thank you.

Diagram slides break up the density: put a funnel-intervention map at the head of the ideas section, journey flows inside it, the experiment loop in the testing section, and the personalisation decisioning flow in its own section.
