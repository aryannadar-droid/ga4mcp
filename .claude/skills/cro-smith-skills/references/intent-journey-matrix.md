# The intent × behaviour × journey audit

Most CRO audits walk the site's structure: homepage, listing, product, cart. That is the *company's* map. This one walks the questions people arrive with, and checks whether the point they land on answers them.

**The core principle:** a page is never good or bad on its own. It is good *for an intent, at a stage, for a person*.

> A jewellery product page scored strongly for a high-ticket researcher — open price breakup, live gold rate, video call, WhatsApp — and failed completely for a ₹18,000 daily-wear buyer: no weight, no purity, no delivery date, no stock. Same page, opposite verdicts. An audit that scores "the PDP" as one thing cannot see this.

---

## Step 1 — Build the intent inventory from data, not imagination

Personas invented in a workshop produce recommendations nobody can check. Derive intents from:

- **Site search terms**, especially zero-result searches — the purest statement of unmet intent on any site
- **Search Console queries** grouped by what the searcher wants, not by keyword volume
- **Campaign tags and their landing pages** — what was promised, and what she met
- **Call centre, WhatsApp and chat logs** — the questions people pay to have answered by a human
- **Store or sales staff**: "what do people ask you at the counter?"
- **Reviews and returns reasons** — intents that were served badly

Aim for 8–15 named intents. Fewer means you are describing personas; more means you are describing page features.

---

## Step 2 — Keep three layers separate

They get conflated constantly, and the audit fails when they do.

| Layer | Question it answers | Examples |
|---|---|---|
| **Persona** | Who is she? | 25–40, working, self-purchasing, Telugu-speaking, decides alone |
| **Intent** | What is *this visit* for? | Browse a category · compare two designs · check whether the price is fair · verify purity · find a store · pay a plan instalment |
| **Buying behaviour** | How does this category decide? | Decision unit (solo / family) · consideration length (minutes / months) · risk type (purity, fit, price) · trigger (a date, a salary, a festival) · repeat cycle · preferred channel |

One persona carries many intents. **Behaviour is what tells you which evidence a page must carry:**

- Family decision unit → something shareable, and a slot to visit together
- Date-triggered purchase → a calendar, a reminder, a deadline
- Purity or authenticity risk → certification next to the price, not in a tab
- Long consideration → a way to save and return; short → everything in the first fold
- Channel preference → WhatsApp over email in markets where email is dead

---

## Step 3 — Score the matrix

Rows are persona × intent. Columns are journey points (ad → landing → listing → product → cart → checkout → post-purchase, plus store points where relevant).

| Persona · intent | Journey point | Her question | What the page does today | Verdict |
|---|---|---|---|---|
| Self-purchaser · daily wear | Listing | "What can I get for ₹20k?" | Price-only cards, median ₹59k, no band filter | **Not answered** |
| Family · bridal shortlist | Product | "Can we see this together?" | No store link, no appointment | **Not answered** |
| Saver · price check | Product | "Is this price fair?" | Live rate + open breakup | **Answered in the fold** |
| Member · servicing | Plan page | "Which branch am I?" | 90 internal ERP codes in a dropdown | **Answered wrongly** |

**Verdicts:** answered in the fold · answered below the fold · needs a click · not answered · answered wrongly.
Each cell carries a dated screenshot and, where possible, a number (sessions at that point, drop-off, search volume for that question).

---

## Step 4 — Rank the unanswered questions

```
priority = sessions at that journey point × frequency of the intent × value of the intent
```

Value is commercial, not emotional: what the intent is worth if served (order value, likelihood to convert, whether it starts a relationship). The ranked list **is the CRO backlog** — each row becomes a hypothesis, and the top rows become the first tests.

---

## Step 5 — Reuse the matrix twice more

This is why it is worth building properly:

- **Personalisation rules.** Signal → inferred intent → what the surface shows. The matrix already says what each intent needs; personalisation just delivers it earlier.
- **The measurement plan.** Every intent needs an observable action, or you cannot tell whether it was served. Intents with no measurable action are exactly where instrumentation work goes.

---

## Common failure modes

- **Auditing templates, not questions.** Produces a list of best practices nobody disputes and nobody acts on.
- **Personas without intents.** Demographics don't tell you what a page must answer.
- **Intents without behaviour.** You'll fix the copy and miss that three people have to agree before anyone buys.
- **One verdict per page.** Hides the segment that is being failed — usually the one the client is trying to grow.
