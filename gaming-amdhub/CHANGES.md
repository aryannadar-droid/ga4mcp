# CHANGES: NEW_HOME_V2 ("You already play on AMD")

A new homepage layer added **beside** the locked build (`FEATURES_LOCKED.md`). It is switched by one flag:

```ts
// src/flags.ts
export const NEW_HOME_V2 = …; // set to false, or build with VITE_NEW_HOME_V2=false
```

- **Flag off:** the homepage is exactly the locked build. The new code is dropped from the bundle (verified: no V2 strings in the output) and all 84 locked checks pass.
- **Flag on:** the new sections render around the locked ones. All 84 locked checks still pass at 1440 × 900 and 390 × 844, `check:acceptance` passes, and all 58 new-layer checks pass.

## Page order with the flag on

1. **New:** Hero "You already play on AMD."
2. **New:** Presence band (four stats that count up)
3. **New:** Three doors, linking to the existing persona pages
4. **New:** "Will my game run?" check
5. **New:** Know what you're getting (three 30-second explainers)
6. **New:** Builds from India's creators (sample data)
7. **Locked:** Hero → Persona doors → From ₹ strip → FPS → Build-your-PC journey → Sellers → Guides
8. **New:** Find a seller (quiet)
9. **New, phones only:** bottom bar with "Will my game run?" and "Find a seller"

## Files added

| File | What |
| --- | --- |
| `FEATURES_LOCKED.md` | Inventory of every locked route, section, component, script and event |
| `CHANGES.md` | This file |
| `src/flags.ts` | The `NEW_HOME_V2` flag |
| `src/v2/content.ts` | All copy, stats (with sources), game-check rules, explainers, **sample** creator builds, seller settings |
| `src/v2/lib.ts` | `trackV2` (same payload shape as the locked `track`), seller links with `utm_campaign` = persona id or `home`, build matching, plain-words levels, count-up |
| `src/v2/v2.css` | New look and feel, scoped to `.v2`: black `#07080A`, orange `#FF6A13`, gold `#D4A64A`, light gold `#F2D58A`, off-white `#F3F1EC`; thumb-sized chips |
| `src/v2/HomeV2.tsx` | `HomeV2Lead` (sections 1–6) and `HomeV2Tail` (seller list + phone bar) |
| `src/v2/HeroV2.tsx` | Hero: eyebrow, headline with orange "AMD", sub, one orange action plus an outline story button, glowing chip with three floating tags. No prices, Buy Now or product boxes |
| `src/v2/PresenceBand.tsx` | Four gold stat tiles with sources; count-up on scroll; `presence_view` at 50% visible |
| `src/v2/DoorsV2.tsx` | Three doors (stacked full-width on phones) to the existing persona pages |
| `src/v2/GameCheck.tsx` | Games, screen and budget → Ryzen + Radeon pair, plain-words bars (labelled illustrative), streaming line, See the full build / Save / Share on WhatsApp |
| `src/v2/Explainers.tsx` | Three explainer cards (play button, 0:30, one plain line) |
| `src/v2/VideoModal.tsx` | Native `<dialog>` video; `explainer_play` at 0 / 25 / 50 / 75 / 100 % |
| `src/v2/CreatorBuilds.tsx` | Horizontal creator build row (Copy build / Save); **sample data** |
| `src/v2/FindSeller.tsx` | Four named partners, one trust line each, exact product pages, UTM |
| `src/v2/PhoneActionBar.tsx` | Phone bottom bar; hidden while the hero's button or the game check is on screen (one orange per screen) |
| `public/placeholders/story-60s.webm`, `.mp4` | Placeholder 60-second story video (~45 KB each) |
| `public/placeholders/explainer-30s.webm`, `.mp4` | Placeholder 30-second explainer video (~22 KB each) |
| `scripts/locked-check.cjs` | Regression check of every locked feature at desktop and 390 × 844 (`npm run check:locked`) |
| `scripts/v2-check.cjs` | Checks for the new layer, events and phone rules (`npm run check:v2`) |
| `docs/screenshots/v2-*.png` | Screenshots of the new layer at 1440 and 390 |

## Existing files touched (minimum needed)

| File | Change | Why |
| --- | --- | --- |
| `src/pages/Home.tsx` | +4 lines: two imports and `{NEW_HOME_V2 && <HomeV2Lead />}` / `{NEW_HOME_V2 && <HomeV2Tail />}` around the locked sections; nothing renamed, reordered or removed | The only way to mount the new sections on the homepage |
| `vite.config.ts` | Single-file inliner also accepts `.webm` / `.mp4` | So the single HTML file carries the placeholder videos |
| `package.json` | Added the `check:locked` and `check:v2` scripts | To run the new regression checks |

No other locked file was changed. Event names are reused, not edited: the locked `track()` and `analytics.ts` are untouched, and new pushes go through `trackV2`.

## Tracking (new pushes, all with `layer: "home_v2"`)

| Event | Params from the brief | Also sent, so existing reports keep working |
| --- | --- | --- |
| `presence_view` *(new)* | `page` | `section` |
| `explainer_play` *(new)* | `video_id`, `percent_watched` | `section` |
| `persona_select` *(reused)* | `persona_id` | `persona`, `section`, `method: door_v2` |
| `game_check` *(reused)* | `game`, `screen`, `budget_band` | `build_id`, `product`, `resolution`, `section` |
| `build_save` / `build_share` *(reused)* | `build_id`, `channel` (`device` / `whatsapp` / `copy`) | `build`, `method`, `section` |
| `partner_click` *(reused)* | `partner_name`, `partner_type`, `product`, `persona_id` | `seller_name`, `link_url`, `utm_campaign`, `section` |
| `builder_start` *(locked event, unchanged)* | — | Fired by "See the full build →" with `section: v2_game_check` |

---

## Collisions with locked features: your decision needed

For each one, the version currently live leaves the locked feature untouched.

**C1 · Hero.** The locked hero ("The fastest gaming processors…") is a locked feature, so as instructed the new hero is added **above** it. The locked hero (Start building, offer chip, View in 3D) now sits on the second screen, and the page has two `<h1>`s.
- **A (live):** keep both heroes.
- **B:** hide the locked hero when the flag is on. That edits a locked page, and its 3D chip viewer and offer chip would need a new home.

**C2 · Header "Find a seller".** The brief wants a quiet outline link in the header. The locked header has the orange "Where to buy" button, which an earlier revision required in the first phone screen and which the locked acceptance check tests. So the first screen now has two orange buttons, the header's and the hero's (not side by side, but on one screen).
- **A (live):** keep the locked header.
- **B:** with the flag on, restyle the header button as a quiet "Find a seller" outline. That changes a locked component and the earlier first-screen rule.

**C3 · Two "What are you building?" sections.** The new doors and the locked persona doors (different copy, plus the need-led line and the two-question quiz) both appear.
- **A (live):** keep both.
- **B:** hide the locked doors when the flag is on, and move the need-led line and quiz into the new doors.

**C4 · Two seller sections, two UTM fallbacks.** The locked Sellers section (product picker; `utm_campaign=general` without a persona) and the new quiet Find a seller section (`utm_campaign=home`, as briefed) both appear, so reports will show both `general` and `home`.
- **A (live):** keep both.
- **B:** hide the locked Sellers when the flag is on, or align both on one fallback value.

**C5 · Phone bottom bar vs the locked pinned top bar.** An earlier revision replaced the phone bottom bar with the pinned top bar. With both bars showing after the locked hero, a phone screen shows the top bar's orange "Where to buy" and the bottom bar's orange "Will my game run?". I've reduced the overlap (the bottom bar hides on the first screen and inside the game check), but not removed it.
- **A (live):** keep both bars.
- **B:** make the top bar's buy button an outline while the flag is on (a locked change), or drop the bottom bar.

**C6 · Reused event names, different parameters.** The brief's parameters (`persona_id`, `partner_name`, `budget_band`…) differ from the locked ones (`persona`, `seller_name`, `resolution`…).
- **A (live):** new pushes carry both sets, plus `layer: home_v2` to filter on.
- **B:** brief parameters only. Locked reports keyed on the old names would then miss the new pushes.

**C7 · "No horizontal scroll except the creator row".** The new layer complies. The locked phone layouts still use deliberate side-scrollers: the From ₹ strip, the FPS tabs, the configurator's start chips and the persona-C compare swipe.
- **A (live):** leave the locked scrollers.
- **B:** convert them to stacked or wrapped layouts (locked changes).

**C8 · "Remove any expired offer banner".** The locked offer chip already hides itself after `offer.endsAt`, and `endsAt` is `null` (not expired), so nothing was removed. It now sits in the locked hero below the fold.
- **A (live):** leave it.
- **B:** set an end date, or hide the chip while the flag is on.

## Content notes (not locked, but please check)

- **Hero sub copy:** "The same AMD chips inside PlayStation 5, Xbox Series X|S and Steam Deck…". The consoles and Steam Deck use custom AMD chips, not the same chips as Ryzen / Radeon PC parts. Suggested: "AMD chips also power PlayStation 5…". Your exact copy is live and editable in `src/v2/content.ts`.
- **Stats** (97.9M, 45%, 3,000, 1 in 4) are used as supplied with their sources; I haven't verified them.
- **Imagery:** the brief asks for real Indian setups and creators, but the original brief ruled out stock photos of people. The layer uses CSS light-and-glow art and initials until real, consenting creator photos exist. All creator builds are **sample data**.
- **Game-check bars** are illustrative plain-words levels from a simple rule (`gameCheck.tier`, `screenLoad`, game weight in `src/v2/content.ts`), clearly labelled until AMD-tested figures are wired in.
