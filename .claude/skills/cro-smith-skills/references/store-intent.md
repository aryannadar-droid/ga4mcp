# Store intent — CRO for businesses that close offline

Standard CRO assumes the sale happens in a cart. For retail, automotive, clinics, banking, real estate, education and most considered purchases, the website's job is to produce a *visit, a call or an appointment*. If you audit these businesses with an e-commerce lens, you optimise a rounding error.

*Reference case: a jewellery group with 60+ showrooms and ₹41,246 Cr operating income. GA-tracked online revenue was ~0.5% of the group. Doubling online sales would not have registered. What mattered was that 4.7M sessions reached campaign and store pages that offered no way to visit, and nothing measured the attempt.*

---

## 1. The offline conversion class

Treat these as first-class conversions, each tagged with a **store ID** so they can be read by location:

| Action | Event | Why it counts |
|---|---|---|
| Get directions | `store_action{type:"directions"}` | Highest-intent signal short of walking in |
| Call the store | `store_action{type:"call"}` | Must ring *that* store, not a national line |
| WhatsApp the store | `store_action{type:"whatsapp"}` | The channel most answered in Tier 2/3 markets |
| Book a visit / appointment | `store_action{type:"booking"}` | Creates a name, a slot and a visit code |
| Find in store | `store_action{type:"find_in_store"}` | Connects a specific product to a specific location |
| Add to plan / enquiry | `store_action{type:"enquiry"}` | Servicing intent |

**Diagnostic:** if none of these events exist, the client cannot know which campaign produced a walk-in — and no media decision they make is evidence-based. That finding usually outranks every page fix.

---

## 2. The spine: exposure → intent → visit → bill

```
EXPOSURE            INTENT                 VISIT                  BILL
ad / search    →    store action      →    verified walk-in  →    matched sale
utm +               store_action{          visit_code shown       offline conversion
category_intended   type, store_id}        at the counter         (hashed, consented)
```

The site owns the second step. The counter closes the loop by capturing a visit code (WhatsApp confirmation, QR, booking reference). Matching happens inside the client's environment; only hashed, consented signals go back to ad platforms.

**Perfect attribution is not required.** Store-level trends in actions, bookings and bills against matched control markets are enough to decide what to scale.

---

## 3. The page patterns that produce store intent

**Store page (one per location).** Text-first, never a JPEG. Name, live opening hours, distance, local phone number, language spoken, this month's local offer *as text*, today's price or rate, services offered, Google reviews pulled from the Business Profile, and four one-tap actions: directions · call · WhatsApp · book.
*Anti-pattern found live: a launch page that was a single JPG, a directions link that was a Google Maps **search** still carrying `entry=gmail` from an email, and a "Call Us" that rang the national toll-free number.*

**Store locator.** Detect or ask for location — never default to head-office city. Nearest first, open-now badge, services per store, every card linking to its full store page.

**Campaign landing page.** Offer as text, chosen by region and language; nearest store detected or picked in one tap; the four actions above the fold and sticky; the product rail matching the category the creative promised.

**Product page.** "See it at your nearest [brand]" with availability, a request-to-view option, and a reason to share a pincode (delivery date *and* nearest store). Keep whatever assisted-selling tools already exist — video call, chat — but raise them next to the price.

**Booking.** Three fields: name, mobile, store + slot. Confirm on WhatsApp with a visit code. Anything longer is a form for the business's convenience, not hers.

---

## 4. Sizing the prize honestly

```
store-intent sessions × store-action rate × show-up rate × close rate × average bill
```

Present it as a sensitivity table across plausible action rates, with every assumption visible, and state which numbers are placeholders awaiting client data (show-up and close rates almost always are). Note that a measured store-action rate of ~0% today means every visit gained is *new visibility* as well as new value.

**The strategic argument that lands with owners:** a low-ticket item consumes the same counter hour as a high-ticket one. Moving low-ticket demand online protects showroom capacity for the business that genuinely needs a showroom — which answers the fear that online sales cannibalise store profitability.

---

## 5. Measurement and privacy

Store-intent work runs on first-party data, so it has to be built with tech and martech, not media:

- Consent layer in the local language before any tag fires, with purpose-by-purpose choice and a stored receipt
- Server-side tagging on a first-party domain, one profile joining web, bookings, plans and POS, resident in-country
- Only hashed, consented identifiers leaving for Customer Match / CAPI; offline conversion uploads for matched bills
- Never upload the raw customer database — the point is that the data stays inside the client's environment
