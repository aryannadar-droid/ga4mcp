# Pre-flight: two checks before any funnel diagnosis

Both take minutes. Either can overturn a page-level or media-level diagnosis, so run them first and report them first.

---

## 1. Assortment check — is the thing on the shelf?

**The question:** is what the client wants to sell actually visible, in stock, and at the price band they are targeting?

**Why it matters more than it sounds.** Demand capture is meaningless if the catalogue that meets the demand isn't merchandised. On a jewellery client, the brief was "we're losing the ₹15–25k online opportunity" and the assumed causes were ads and landing pages. The listing told a different story: **4 of 117 visible prices were in band, median price ₹59,000, and the lightweight sub-brand's page carried no prices at all.** The band was ~4% of what the site showed. No amount of media or landing-page work fixes that.

**How to run it**

```bash
node scripts/band-scan.js <listing-url> [more-urls...] --band 15000-25000
```

The script loads each listing on a mobile viewport, scrolls to trigger lazy loading, extracts every price, and reports: count in band, share of visible prices, median, and the first/last price in default sort.

**Read it against three questions**
1. What share of what she *sees* is in the target band?
2. What does the default sort open with? (A price-curious audience meeting the most expensive items is a merchandising decision, not a design flaw.)
3. Do featured collections actually contain products? Open every homepage collection tile looking for zero-result pages.

**Possible conclusions, in order of likelihood**
- The range exists but is buried → merchandising and navigation work (CRO owns this).
- The range exists but is out of stock online → catalogue and ops work.
- The range barely exists → this is a sourcing and assortment conversation, not a CRO one. Say so; it is the most valuable thing you can tell them.

---

## 2. Measurement integrity — can the numbers be trusted?

**The question:** before diagnosing behaviour from analytics, do the numbers agree with each other?

**Five checks**

| Check | How | Failure looks like |
|---|---|---|
| Conversion inflation | Compare each ad-platform conversion event against the equivalent on-site event | Ads "checkout" firing 4.6× real checkout starts — the bidding algorithm is optimising to noise |
| One definition of a sale | Count purchase events across every implementation | `purchase` 7,341 vs a legacy event 9,102 (+24%) vs an ads success event 7 |
| Legacy events | List events by volume and look for dated names | 2023-era audience events still firing millions of times a quarter |
| Coverage of the real journey | List the steps that matter, then check which fire | Online steps tracked, store-intent steps (directions, call, WhatsApp, booking) entirely untracked |
| Consent and tag load | Load the homepage, count third-party domains, look for a consent prompt | 44 third-party domains, two session-recording tools, no consent layer |

```bash
node scripts/site-evidence.js <homepage-url> --sitemap --sample 40
```
Reports third-party domains, presence of a consent prompt, and a random sample of sitemap URLs rendered to catch soft-404s (HTTP 200 with a "not found" body).

**What to do when it fails**

Do not quietly use the numbers anyway. State that the measurement layer needs repair, make instrumentation the first deliverable, and downgrade every analytics-derived claim in your output to **TO VALIDATE**. Use the contradictions themselves as the finding — "a sale has three different definitions here" is a stronger, more honest slide than a funnel chart built on sand.

**What good looks like afterwards:** one purchase definition, ad conversions reconciled to on-site events, the full journey instrumented including offline intent, legacy events retired, and a consent layer in front of every tag.
