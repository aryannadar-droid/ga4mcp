# Funnel Economics & Metric Leverage

A page never converts in isolation — it sits inside a funnel that multiplies. The job of CRO is not "make this page better," it's **find the lever where a unit of effort buys the most revenue.** This reference gives you the math and the reasoning patterns to do that.

---

## 1. Decompose Revenue Before You Recommend Anything

Every business reduces to a chain of multiplied rates. Write it out for the specific funnel before judging any single step.

**D2C / e-commerce:**
```
Revenue = Sessions × ATC-rate × Checkout-rate × Purchase-rate × AOV
```

**SaaS / lead-gen:**
```
Revenue = Visitors × Signup-rate × Activation-rate × Paid-conversion-rate × ARPU × (1 / churn)
```

Because the terms **multiply**, a 1% relative lift on *any* term lifts revenue by ~1% — but the **cost, headroom, and risk** of getting that 1% differ wildly per term. That asymmetry is where the value is, and it's invisible if you only look at one page.

---

## 2. Metric Leverage: Smaller % Can Beat Bigger %

The headline lesson. **The metric that's easiest to move is rarely the one that creates the most value.** Compare the *value created*, not the *size of the percentage*.

### Worked example — D2C

Baseline: 100,000 sessions/mo · ATC 8% · checkout completion 60% · AOV $50.
→ Orders = 100,000 × 0.08 × 0.60 = 4,800 · Revenue = **$240,000/mo**

| Lever | Change | New value | New revenue | Δ Revenue |
|-------|--------|-----------|-------------|-----------|
| **A. ATC rate +1pt** (8% → 9%, a +12.5% relative lift) | big visible win | 5,400 orders | $270,000 | **+$30,000** |
| **B. AOV +0.5%** ($50.00 → $50.25) *plus* ATC +0.5pt | tiny AOV nudge | 5,100 orders × $50.25 | $256,275 | +$16,275 |
| **C. AOV +8%** ($50 → $54) alone | one bundle/threshold change | 4,800 × $54 | $259,200 | **+$19,200** |

Two things this surfaces that a single-metric view hides:

1. **A +1pt ATC win looks huge but a modest AOV move competes with it** — and AOV changes (free-shipping threshold, bundle, post-ATC upsell) are often *cheaper and lower-risk* than re-architecting the product page to lift ATC. Always price the effort, not just the lift.
2. **AOV compounds with everything downstream.** A +$4 AOV applies to *every* order you already win, today and on every future winner. An ATC lift only pays out where the rest of the funnel also holds. Late-funnel/value-per-unit levers have a wider blast radius.

> **Rule of thumb:** rank levers by `Δrevenue ÷ effort`, not by `Δrate`. A 0.5% move on a high-leverage or compounding term can outvalue a 1%+ move on a narrow one. State this math explicitly in every recommendation.

---

## 3. Find the Constraint (Where to Look First)

Two complementary lenses — use both:

- **Biggest drop-off (the leak):** the step losing the most users relative to benchmark. Fixing a step that's already at benchmark is low-headroom; fixing one far below benchmark is high-headroom.
- **Highest leverage (the multiplier):** the term where a realistic % move produces the most downstream revenue (Section 2). The leak and the lever are often *different steps* — recommend against the one that wins on `value ÷ effort`, and say why you passed on the other.

**Headroom check before promising a lift:** a step at 2% has room to triple; a step at 70% has maybe +10% left. Never project a lift that exceeds plausible headroom for that step.

---

## 4. Sensitivity: Which Term Actually Pays

Quick way to rank levers without a spreadsheet: ask "what realistic absolute move is achievable on each term, and what's the resulting Δrevenue?" Tabulate it.

| Term | Current | Realistic move | Effort | Δ Revenue/mo | Notes |
|------|---------|----------------|--------|--------------|-------|
| ATC rate | 8% | +1.0pt | High (page rebuild) | +$30k | high effort, capped headroom |
| Checkout completion | 60% | +5pt | Med (reduce form friction) | +$20k | known leak vs ~75% benchmark |
| AOV | $50 | +$4 | Low (threshold + 1 upsell) | +$19k | compounds across all orders |

The winner here isn't the biggest *percentage* — it's the best **Δrevenue per unit of effort**, and you can only see it once all terms are on one table.

---

## 5. Data ↔ Story Consistency

Every recommendation must be coherent on three axes at once. If they disagree, you've found a deeper problem — surface it instead of papering over it with a tactic.

1. **Data** — what the numbers say (the leak, the leverage, the headroom).
2. **Story** — the qualitative *why* (research, heatmaps, objections, the user's actual journey and intent at that step).
3. **The fix** — the mechanism by which the change moves the metric.

Example of inconsistency worth flagging: data says checkout is the leak, but session recordings show users reaching checkout *confused about price* — the real cause is upstream (the product/pricing page set a wrong expectation), so optimizing the checkout form treats the symptom. **A tactic that doesn't trace from data *and* story is a guess.** Don't ship guesses as recommendations; ship them as test ideas with the uncertainty named.

---

## 6. The Reasoning Template (use per recommendation)

```
Lever: [which funnel term this moves]
Constraint logic: [is this the leak, the high-leverage multiplier, or both? why this over the alternative?]
Mechanism: [why the change moves the metric — tie to data AND story]
Headroom: [current value → plausible ceiling for this step]
Projected value: [absolute move → Δrevenue, with the multiplication shown]
Effort / risk: [build cost, guardrail risk]
Value ÷ effort rank: [how it compares to the other recommendations]
Confidence: [high/med/low + the evidence basis]
```

This is what turns "the headline is weak" into "the hero is the leak (45% bounce vs 30% benchmark = ~150 lost sessions/day), the leverage is real because it gates the whole funnel, and a clarity rewrite plausibly recovers 5pt of bounce = +X orders = +$Y/mo — high confidence per the 5-second-test failures in recordings."
