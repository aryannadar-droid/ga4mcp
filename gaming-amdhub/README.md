# gaming.amdhub.in: homepage prototype

AMD India's gaming hub for Ryzen processors and Radeon graphics. It is a prototype homepage with three persona pages. The goal is to send ready buyers to verified sellers. Visitors who aren't ready get one low-commitment step.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

### Single-file HTML

```bash
npm run build:single   # → dist-single/index.html
```

This build packs everything into one HTML file: JS, CSS, placeholder images, the spec-sheet PDF and the favicon. It opens straight from disk (`file://`) or can go on any static host, which makes it handy for review by email or Slack. The file is about 1.2 MB (about 344 KB gzipped), most of it three.js for the 3D views.

Differences from the normal build:
- Pages switch in memory, so the address bar stays on the file and the browser Back button doesn't move between pages. Use the "All builds" link instead.
- GSAP, Lenis and three.js are bundled in instead of lazy-loaded.
- Google Fonts still need a network connection; offline, the page falls back to system fonts.

Stack: Vite 7, React 19, TypeScript, Tailwind CSS 4, Framer Motion 12 (`LazyMotion` + `m`), GSAP 3 + ScrollTrigger (section 5 only, lazy-loaded), three.js (the two 3D views, lazy-loaded), and Lenis (lazy-loaded, off when the user prefers reduced motion). The router is a small history router of about 60 lines, so there is no router dependency.

Deep links such as `/upgrade` need a SPA fallback on the host. `public/_redirects` covers Netlify; on other hosts, rewrite `/*` to `/index.html`.

---

## Where things live

| Path | What |
| --- | --- |
| `src/content.ts` | **All** copy, prices, FPS values, dates, claims, sellers and links |
| `src/styles/tokens.css` | Brand colour tokens (`--black`, `--orange`, `--gold`, …) and motion tokens. Swap the hex codes here |
| `src/index.css` | Tailwind theme aliases (`bg-ink`, `text-accent`, `text-gold-soft`, …), grain, focus rings, reduced-motion rules |
| `src/sections/` | Homepage sections 2–8 |
| `src/pages/` | `Home`, `PersonaSpine` (shared six-block layout), `NewGamingPc`, `Upgrade`, `WorkAndPlay`, `NotFound` |
| `src/lib/analytics.ts` | `track()` → `window.dataLayer` (logs every push to the console in dev) |
| `src/lib/persona.ts` | Saved persona (localStorage, wrapped in try/catch) + the two-question classifier |
| `public/placeholders/` | Placeholder product SVGs and `spec-sheet.pdf` |
| `docs/screenshots/` | 390px and 1440px screenshots |

## Page sections (homepage)

1. **Sticky header.** Wordmark placeholder; Processors, Graphics, Build your PC, Offers. "Where to buy" is always visible. After 80px of scroll the bar moves up 8px, the logo scales to 0.92, and a blurred background fades in. All three changes use transform and opacity only.
2. **Hero.** Headline with a staggered word reveal (pure CSS, so LCP never waits on JS), an orange→gold accent word, a footnote linked to *Sources and notes*, and a live offer chip that hides itself after `offer.endsAt`. The CTAs are *Start building* and *Where to buy*. The visual is a layered 3D CSS chip: it sways for 2 cycles and its heat glow pulses 3 times, then both rest. It tilts with the mouse on fine pointers, or with the gyroscope on phones (iOS asks for permission through a button). It is paused off-screen. **View in 3D** opens a modal WebGL viewer of the chip:
   - drag to rotate, scroll or pinch to zoom, or use arrow keys and + / −
   - *Show contacts* flips the chip to the gold pad grid; *Auto-rotate* toggles (stops when you touch it; off under reduced motion)
   - native `<dialog>`, so focus is trapped and Esc closes it; page scroll and Lenis pause behind it
   - three.js downloads only on hover, focus or click of the button
3. **Persona doors.** Three cards: they lift, an orange edge glow fades in, and a preview slides up on hover or focus. On touch screens the preview is always visible. A click saves the persona and routes to its page. A "Not sure?" link opens the two yes/no questions.
4. **"From ₹" strip.** Four products. The price counts up when the card enters the viewport, but only once a real number is set. The X3D badge plays its gold shimmer once. On mobile the row is a horizontal snap-scroller.
5. **FPS in your games.** Lazy chunk, with GSAP loaded inside it. The section pins (ScrollTrigger, `start: 'bottom bottom'`, so the bars stay on screen on phones too). Scroll progress goes to a CSS variable, and the bars derive `scaleX` from it, so scrolling doesn't re-render React. It has part chips, a 1080p/1440p toggle, game chips (Valorant, CS2, GTA V, AAA title) and a visible "Test source: [__], [date]" line. If FPS is `null`, the bar is a hatched "illustrative" fill and the label reads `[__]`.
6. **Build your PC: 3D case.** A WebGL tower case with a glass side panel. Board, CPU, tower cooler, RAM, graphics card and PSU snap in one at a time while the running total (orange→gold gradient) and estimated FPS update. *Build yours* → `/new-gaming-pc`.
   - **Case size:** *Recommended size* offers four presets (Mini-ITX, Micro-ATX, Mid-tower marked Recommended, Full tower). *My case* has height, width and depth sliders plus number boxes in mm. The case reshapes live, re-frames the camera, and shows measuring lines with mm labels.
   - **Motherboard size:** ATX, Micro-ATX or Mini-ITX (standard form-factor sizes).
   - **Fit check:** motherboard, graphics-card length and cooler height, each with the mm of room to spare or overrun. Parts that don't fit glow red in 3D where they collide with the case.
   - **Controls:** drag to rotate (on touch screens, tap *Rotate in 3D* first so the page still scrolls; pinch zooms after that), + / − / reset buttons, arrow keys, and a glass-panel toggle.
   - **Performance:** renders only on change and pauses off-screen. Under reduced motion parts appear in place with no damping. Without WebGL it falls back to the flat SVG build.
   - **Loading:** three.js (~152 KB gzip) loads when the section is about a screen away.
7. **Verified sellers.** Exactly four cards: Amazon and Flipkart (persona A line), Specialist e-tailer (B) and Authorised builder (C). If a persona is saved, its seller(s) and trust line move to the front. Links open in a new tab with `rel="noopener"`. The referrer is kept on purpose so sellers can attribute the traffic.
8. **Guides.** Three cards; hover or focus reveals the read time. Guide routes show a "coming soon" stub.
9. **Footer.** Mocked sale-alert capture (email or Indian mobile, plus a consent checkbox) that validates locally and never sends data. Also the sources list and legal line.

**Mobile bottom bar** (below 768px): the saved-persona shortcut (or "Pick your build") plus *Where to buy*.

### Persona pages: the shared six-block spine

| Block | A · `/new-gaming-pc` | B · `/upgrade` | C · `/work-and-play` |
| --- | --- | --- | --- |
| 1 | Budget chips + game picker | Fit checker (part + board + PSU → result + BIOS note) | Creator + Professional builds |
| 2 | Three priced builds with FPS (the one that fits your budget is highlighted) | Before / after FPS | Ryzen vs NVIDIA vs Mac table, with source + date |
| 3 | "Why AMD here?" in three lines | Price and stock table | Spec sheet download |
| 4 | Exit → Amazon | Exit → Specialist e-tailer | Exit → Authorised builder |
| 5 | Genuine AMD part · full warranty | In stock at a verified partner · sealed box | Authorised builder · GST invoice · support |
| 6 | Save / share build | Save fit result + stock alert | Sale alert + share |

Persona assignment (`personaFromAnswers`):

- Owns a gaming PC → **B**.
- Doesn't own one and the PC is also for work → **C**.
- Otherwise → **A**.

Landing on a persona page also saves that persona.

---

## content.ts: fields to fill before launch

Placeholder conventions: a price or FPS of `null` renders as `₹[__]` or `[__]`, and a date of `null` renders as `[date]`. Strings containing `[__]`, `[source]` or `[date]` are slots to replace. **Never enter an FPS figure without a test source.**

| Object | Fields |
| --- | --- |
| `site` | `wordmark` (swap for the SVG in `components/Wordmark.tsx`), nav labels |
| `hero` | `headline`, `headlineAccent`, `sub` |
| `offer` | `label`, `endsAt` (ISO date: the chip hides after it), `href` |
| `personas[*]` | `door.*` copy, `trustLine` (approved exact copy is already in place), `heroProducts`, `sellers` |
| `products[*]` | `stat`, `fromPrice` (number → count-up), `image`, `sellersHref` |
| `productsIntro.priceNote` | Price-check date + source |
| `fpsScene.parts[*].fps[game][res]` | Every FPS value (1080p / 1440p) |
| `fpsScene.source` | `name`, `date`; `settingsNote`; the AAA title in `games` |
| `buildTeaser.parts[*]` | `label`, `min`, `max`, `fps` (all must be numbers before the total computes) |
| `sellers[*]` | `href` for each seller (Amazon and Flipkart point to search pages; the other two point to example.com), `kind` |
| `guides[*]` | `readTime`, `href` |
| `alertCapture` | Consent text and privacy-policy link |
| `sources[*]` | `text`, `date` for the hero claim, prices, FPS and the comparison |
| `footer` | Links, legal year |
| `newBuildPage` | `builds[*].parts / price / fps`, `why[*]` claims |
| `upgradePage` | `parts[*].recommendedPsuW`, `results.*` notes (BIOS version, card length), `beforeAfter`, `beforeAfterSource`, `stock[*]` |
| `chip3d` | Viewer copy; `engraving` (brand, line, model) printed on the 3D heat spreader |
| `caseFit` | `presets` (typical sizes: **replace with the recommended case spec**), `recommendedId`, slider ranges in `dims`, `boards`, `partSizes` (GPU length, cooler height: **replace with exact model specs**), `clearance` rules used by the fit check, result copy |
| `buildTeaser.parts` | Order is the 3D snap-in order; ids map to 3D models (`board`, `cpu`, `cooler`, `ram`, `gpu`, `psu`) |
| `workPlayPage` | `builds[*]`, `compare.rows[*].values`, `compare.source`, `compare.date`; replace `/public/placeholders/spec-sheet.pdf` |

Comparisons that name Intel, NVIDIA or Apple must keep their `source` and `date`. The page shows them under the table and in *Sources and notes*.

---

## Event map (GA4 via `window.dataLayer`)

Every push has `event`, `persona` (the saved persona, or `none`) and `section`. Dev builds log each push as `[dataLayer] {…}`. Paste the GTM container snippet into `index.html`.

| Event | Fires when | Extra parameters |
| --- | --- | --- |
| `persona_select` | Persona door click, or "Show me" after the quiz | `persona`, `method` (`door` / `quiz`) |
| `game_check` | Game chip or resolution toggle (FPS scene); game chip on page A | `product`, `game`, `resolution` |
| `build_save` | Save build (A); save fit result (B) | `product`, `build` or `type: fit_result`, `result` |
| `build_share` | Share build (A, C), via Web Share or clipboard | `product`, `method` (`shared` / `copied`) |
| `compat_check` | Fit checker submit (B) | `product`, `board`, `psu`, `result` (`fits` / `check` / `no`) |
| `compare_view` | Comparison table is 40% in view (C), once per page view | `product`, `compared` |
| `alert_signup` | Valid sale-alert submit (footer, B, C), mocked | `product`, `channel` (`email` / `phone`; never the value) |
| `store_search` | Any *Where to buy* (header, hero, mobile bar); *View sellers* on product cards | `product` (product cards) |
| `partner_click` | Any outbound seller link (seller cards, persona exit button, stock table) | `seller_name`, `product`, `persona`, `link_url` |
| `bundle_redeem_click` | Offer chip | `product: bundle`, `link_url` |
| `builder_start` | *Start building* (hero), *Build yours* (teaser) | — |
| `view_3d` *(added)* | *View in 3D* on the hero chip | `product: chip` |

`compat_check` also fires from the 3D case section (`section: build_3d`), 0.9 s after the visitor stops adjusting. It sends `case_mode`, `case_h`, `case_w`, `case_d`, `board` and `result`.

North-star KPI: `partner_click` events per 100 sessions.

---

## Motion rules, as implemented

- Only transform and opacity are animated. The easing is `cubic-bezier(0.22, 1, 0.36, 1)` and durations are 200–600ms (tokens in `tokens.css`, constants in `lib/motion.ts`).
- One "wow" per screen: the hero chip, the FPS race and the build snap-in.
- Nothing loops forever: the chip sways for 2 cycles, the glow pulses 3 times and the shimmer plays once. Off-screen animations pause via IntersectionObserver (`.paused-offscreen`), and the build teaser and count-ups only start once in view.
- **`prefers-reduced-motion`**:
  - Framer runs with `reducedMotion="user"`, so it drops transforms and keeps opacity fades.
  - CSS animations collapse to fades.
  - Lenis, parallax, gyroscope, pinning, GSAP loading, the shimmer and count-ups are all off.
  - The FPS bars and build total show their final state at once.

## Measured quality (production build, `vite preview`)

Lighthouse 12, mobile, simulated 4G:

| Page | Performance | Accessibility | Best practices | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 96–98 | 100 | 100 | 1.8–1.9 s | 70–160 ms | 0.001 |
| `/new-gaming-pc` | 99 | 100 | 100 | 1.8 s | 10 ms | 0 |
| `/upgrade` | 98 | 100 | 100 | 2.0 s | 10 ms | 0 |
| `/work-and-play` | 99 | 100 | 100 | 1.9 s | 40 ms | 0 |

- **Initial JS:** about 120 KB gzip (React + app ≈ 89 KB, motion ≈ 31 KB). Loaded later:
  - three.js + 3D models (≈ 160 KB), only near the build section or on *View in 3D*
  - GSAP + ScrollTrigger (≈ 46 KB), only near section 5
  - Lenis (≈ 6 KB), after first paint
- **Overflow:** no horizontal overflow at 360, 390, 768, 1280, 1440 or 1920px on any page.
- **Keyboard and contrast:** fully keyboard-navigable with a skip link and an orange focus ring. Orange buttons use black text (6.8:1); gold text is ≥ 8:1 on black.

## Screenshots

`docs/screenshots/`. Full-page shots use reduced motion so every final state shows:

- `home-390.png`, `home-1440.png`
- `new-gaming-pc-*.png`, `upgrade-*.png`, `work-and-play-*.png`
- `home-hero-*.png`: hero with motion on
- `home-fps-pinned-*.png`: the FPS scene mid-race, while pinned
- `chip3d-*.png`, `chip3d-flip-*.png`: the 3D chip viewer, top and contacts
- `build3d-*.png`: the 3D case with the recommended mid-tower
- `build3d-mycase-*.png`, `build3d-redfit-1440.png`: a custom case too small for the parts, with the failing parts shown in red
