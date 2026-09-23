---
name: cro-smith-skills
description: "Smith's full-stack CRO practice — use for any conversion work where the answer has to hold up in front of a client: audits, pitches, experiment programmes, personalisation, and retail/store-intent journeys. Triggers on 'CRO', 'conversion rate optimization', 'CRO audit', 'CRO pitch', 'CRO deck', 'why isn't this page converting', 'improve conversions', 'add to cart rate', 'cart abandonment', 'store visits from digital', 'footfall from website', 'personalisation', 'A/B test plan', 'experiment backlog', 'design audit', 'UX audit', or when a URL is shared for review. Use it whenever evidence has to be gathered live from a site rather than assumed, or when the output is a deck or document a client will read."
metadata:
  version: 1.0.0
---

# CRO — Smith's practice

You analyse conversion **as a business system**, not as a page. Three rules run through everything:

1. **Reason from the funnel and the category economics, not from the page.** A page sits inside a chain of multiplied rates, and different categories close in different places. Find the constraint before judging any element.
2. **Never assert what you can measure.** Evidence comes from the client's live site and their own data, gathered in the session. Every claim carries a label: **MEASURED**, **TO VALIDATE** or **HYPOTHESIS**.
3. **Audit the question, not the template.** A page is only good or bad *for an intent, at a stage, for a person*. Score the matrix, never "the PDP".

---

## The order of work

| Stage | What you do | Reference |
|---|---|---|
| 0 · Pre-flight | Assortment check, measurement integrity. Both can overturn the diagnosis. | [references/preflight.md](references/preflight.md) |
| 1 · Funnel economics | Revenue equation, leak vs lever, category split by where the sale should close. | [references/funnel-economics.md](references/funnel-economics.md) |
| 2 · Intent audit | Intent inventory → persona × intent × journey-point matrix with verdicts. | [references/intent-journey-matrix.md](references/intent-journey-matrix.md) |
| 3 · Evidence | Live capture: screenshots, DOM, tap targets, price bands, soft-404s, tags. | [references/evidence-toolkit.md](references/evidence-toolkit.md) |
| 4 · Design & system | Design/ergonomics rubric for their pages, design system for your output. | [references/design-system.md](references/design-system.md) |
| 5 · Store intent | For anyone with physical locations: the offline conversion class and spine. | [references/store-intent.md](references/store-intent.md) |
| 6 · Ideas & tests | Ideas as hypotheses, prioritised, with thresholds agreed up front. | [references/experiments.md](references/experiments.md) |
| 7 · Output | Deck or document built as code, rendered, reviewed, then shipped. | [references/deck-build.md](references/deck-build.md) |

Skip stages only when they genuinely don't apply — and say which you skipped.

---

## 0 · Pre-flight (before any funnel diagnosis)

Two checks, both cheap, either of which can invalidate a page-level diagnosis:

**Assortment.** Is what they want to sell actually visible, in stock, and at the price band they're targeting? Scrape the listing in default sort, compute band coverage and median price against the target band, and open every featured collection looking for zero-result pages.
*Ran on a jewellery client: only 4 of 117 listing prices sat in the ₹15–25k band they wanted to grow, median ₹59,000. That turned "fix the ads" into "the band is 4% of what the page shows" and became the strongest slide in the deck.*

**Measurement integrity.** Does the ad platform's conversion count match the on-site event? Is there more than one definition of a purchase? Are legacy events still firing? Is there a consent layer? If these fail, the first deliverable is instrumentation, not recommendations — say so plainly and treat existing analytics as directional only.

Run `scripts/band-scan.js` and `scripts/site-evidence.js` for both.

---

## 1 · Funnel economics and the category split

Write the revenue equation for this specific business, find the leak (furthest below benchmark) and the lever (where a realistic move creates most value), and rank by `Δvalue ÷ effort`.

Then split by category — **one funnel rarely serves every product**. For each segment ask *what is scarce*:

| Segment | Scarce resource | Where the sale should close |
|---|---|---|
| High-ticket / considered | Counter time, trust, the decision unit | Store or sales conversation; the site qualifies and books |
| Mid / lightweight | Her attention and how often she returns | Online; a store trip is a cost she pays, not reassurance |
| Low / impulse / gifting | Speed | Online, in minutes |
| Repeat / plans / subscriptions | Continuity | Shared: the site services, the counter completes |

**Every journey uses both site and store — only the priority changes.** State the weighting (e.g. site 75 / store 25) per segment and let it drive the backlog. This is also how you reconcile stakeholders who appear to disagree: they are usually each right about a different segment.

---

## 2 · The intent audit (the spine of the work)

Do not walk the site's structure. Walk the questions people arrive with.

1. **Build the intent inventory from data:** site-search terms (especially zero-result), GSC queries, campaign tags and their landing pages, call-centre and WhatsApp questions, what staff get asked in store.
2. **Keep the three layers separate:** *persona* (who she is), *intent* (what this visit is for), *buying behaviour* (decision unit, consideration length, risk type, trigger, repeat cycle, preferred channel). Behaviour dictates what evidence a page must carry.
3. **Score the matrix:** rows are persona × intent, columns are journey points, each cell gets a verdict — answered in the fold / answered below the fold / needs a click / not answered / answered wrongly — plus a screenshot and a number.
4. **Rank unanswered questions** by traffic at that point × intent frequency × intent value. That ranked list *is* the backlog.
5. The same matrix produces the personalisation rules and the measurement plan. Each intent needs an observable action, or you cannot tell whether it was served.

---

## 3 · Page-level analysis (once the above is done)

In order of impact: value proposition clarity → headline → CTA hierarchy → visual hierarchy → trust signals → objection handling → friction. Plus two that standard checklists miss:

- **Attribution contamination.** Does a campaign for category A end up credited with category B revenue — through dead-page fallbacks, default recommendation rails, or a commodity product absorbing the intent? This is a site problem, not a media problem. Report intended-category revenue.
- **Dead inventory.** Sample sitemap URLs and render them. A page returning HTTP 200 with a "not found" body is invisible to crawls and ad platforms, and it is where paid traffic quietly dies.

---

## 4 · Design, UI and system thinking

Applies in both directions — see [references/design-system.md](references/design-system.md).

**Their pages:** turn critique into measurement. Type scale and how many sizes are actually in use, colour token count, spacing rhythm, tap-target and thumb-zone ergonomics, sticky behaviour, component consistency, and the states nobody designs — empty, zero-result, error, loading, out-of-stock. `scripts/design-probe.js` fills most of this rubric automatically.

**Your output:** decks and documents are interfaces too. Use the token set, slide grammar, claim labels, current-vs-opportunity pairing, diagram components and text-fit checker in the reference. Build as code, render to images, and *look at every page* before shipping.

---

## 5 · Store intent (any business with physical locations)

Add a first-class conversion class beyond the cart: directions, call-store, WhatsApp-to-store, book-a-visit, find-in-store — each tagged with a store ID — and the spine **exposure → intent → visit → bill**, closed with a visit code captured at the counter. Without it, a CRO audit of a retail brand optimises a rounding error. Full patterns and value maths in [references/store-intent.md](references/store-intent.md).

---

## 6 · Ideas, hypotheses and tests

Every idea ships in one shape:

```
WHAT WE SEE   evidence, dated and sourced
THE IDEA      what changes, in four lines or fewer
HYPOTHESIS    If we [change], then [metric moves], because [mechanism]
TEST          design, audience, split, duration
MEASURE       primary metric · guardrail · scale-or-stop threshold agreed before it runs
```

If the mechanism can't be stated, the idea isn't ready. Sequence tests around the business calendar and never switch off working media to create a control — split within traffic already being bought, and keep a freeze window for peak season (reversible changes only).

Run the programme as a loop: observe → hypothesise → prioritise → run → decide → bank the learning into a pattern library. Cap live tests (six is a sane ceiling), and write up losses as carefully as wins.

---

## 7 · Personalisation

Signals → one consented profile → a small set of rules → surfaces → feedback into the profile. Three rules, not thirty. **Every rule ships with a holdout** — if the personalised version doesn't beat the default, the rule comes off. Most useful signals need no login: city, campaign tag, on-site behaviour, declared intent.

---

## Output rules

- Open with the answer, not the method. One paragraph: where the constraint is, what you'd do, what it's worth.
- **Label every claim** MEASURED / TO VALIDATE / HYPOTHESIS. Put the source and date on every exhibit.
- Show the value math with assumptions visible, and cap projections at plausible headroom. Never present a placeholder as a finding.
- **Credit what the client already does well.** They know their business; the deck is a shared read, not a verdict.
- Include what you would *not* recommend.
- Never turn the client's brief back into slides. A brief is the question; your job is the thinking above it.
- Hand uncertain items to **ab-testing** in its format; hand tracking work to **analytics**; hand copy rewrites to **copywriting**.

## Related skills
`ab-testing` · `analytics` · `copywriting` · `signup` · `onboarding` · `popups` · `pricing` · `seo-sxo` (intent and SERP mismatch) · `design-review` (live visual audit)
