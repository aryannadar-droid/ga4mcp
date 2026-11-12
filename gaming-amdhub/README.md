# gaming.amdhub.in: homepage prototype

AMD India's gaming hub for Ryzen processors and Radeon graphics. It is a prototype homepage with three persona pages. The goal is to send ready buyers to verified sellers. Visitors who aren't ready get one low-commitment step.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
npm run check:acceptance   # phone-first acceptance checks against the preview (needs Playwright)
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
| `src/content.ts` | **All** copy, prices, FPS values, dates, claims, builds, specs, sellers and exact listing URLs |
| `src/styles/tokens.css` | Brand colour tokens (`--black`, `--orange`, `--gold`, …) and motion tokens. Swap the hex codes here |
| `src/index.css` | Tailwind theme aliases (`bg-ink`, `text-accent`, `text-gold-soft`, …), grain, focus rings, reduced-motion rules |
| `src/sections/` | Homepage sections 2–8 |
| `src/pages/` | `Home`, `PersonaSpine` (shared six-block layout), `NewGamingPc`, `Upgrade`, `WorkAndPlay`, `NotFound` |
| `src/lib/analytics.ts` | `track()` → `window.dataLayer` (logs every push to the console in dev) |
| `src/lib/persona.ts` | Saved persona (localStorage, wrapped in try/catch) + the two-question classifier |
| `src/lib/sellers.ts` | Exact listing per seller + product, UTM tagging (`utm_source=amdhub&utm_medium=referral&utm_campaign=[persona]`) |
| `src/lib/scrollTracking.ts` | `scroll_depth` and `first_buy_visible` |
| `src/components/SectionBar.tsx` | The pinned buy bar shown after the hero |
| `src/components/BuildCard.tsx` | The four-line build card used on every page |
| `src/pages/BuildYourPc.tsx` | The configurator (`/build-your-pc`) |
| `src/components/BuildStage.tsx` | The 3D build stage shared by the homepage journey and the configurator (lazy three.js, toolbar, flat fallback) |
| `src/lib/buildConfig.ts` | Configurator state: presets, compatibility rules, live total, share links |
| `scripts/acceptance.cjs` | Acceptance checks (see *Quality bar*) |
| `public/placeholders/` | Placeholder product SVGs, the ray-tracing Off / On pair (`rt-off.svg`, `rt-on.svg`) and `spec-sheet.pdf` |
| `docs/screenshots/` | 390px and 1440px screenshots |

## Page sections (homepage)

1. **Sticky header.** Wordmark placeholder; Processors, Graphics, Build your PC, Offers. "Where to buy" is always visible, so it shows in the first phone screen. After 80px of scroll the bar moves up 8px, the logo scales to 0.92, and a blurred background fades in (transform and opacity only).
   **Pinned buy bar (after the hero, every screen size, NVIDIA pattern).** Once the hero has scrolled away, the header slides up and a slim bar takes over all the way down the page:
   - left: a section dropdown that follows your scroll position;
   - middle: the saved-persona shortcut (a pill on wider screens, the first dropdown option on phones);
   - right: *Where to buy*.
   It replaces the old bottom bar on phones. Persona pages get the same bar, listing their own blocks.
2. **Hero.** Headline with a staggered word reveal (pure CSS, so LCP never waits on JS), an orange→gold accent word, a footnote linked to *Sources and notes*, and a live offer chip that hides itself after `offer.endsAt`. The CTAs are *Start building* and *Where to buy*. The visual is a layered 3D CSS chip: it sways for 2 cycles and its heat glow pulses 3 times, then both rest. It tilts with the mouse on fine pointers, or with the gyroscope on phones (iOS asks for permission through a button). It is paused off-screen. **View in 3D** opens a modal WebGL viewer of the chip:
   - drag to rotate, scroll or pinch to zoom, or use arrow keys and + / −
   - *Show contacts* flips the chip to the gold pad grid; *Auto-rotate* toggles (stops when you touch it; off under reduced motion)
   - native `<dialog>`, so focus is trapped and Esc closes it; page scroll and Lenis pause behind it
   - three.js downloads only on hover, focus or click of the button
3. **Persona doors.** Three cards: they lift, an orange edge glow fades in, and a preview slides up on hover or focus. On touch screens the preview is always visible. A click saves the persona and routes to its page. Under the doors, one need-led line: "Play games without a graphics card." (persona A's built-in-graphics Starter build). A "Not sure?" link opens the two yes/no questions.
4. **"From ₹" strip.** Four products, each with **one big stat** (e.g. "8 cores · 3D V-Cache"), no spec tables, and "From ₹[__]". The strip sits at about 24% of the page on a phone. The price counts up when the card enters the viewport, but only once a real number is set. The X3D badge plays its gold shimmer once. On mobile the row is a horizontal snap-scroller. *View sellers* picks that product in the Sellers section. The plain-words key sits below the strip.
5. **FPS in your games.**
   - **Ray tracing Off / On slider** near the top of the section. Drag anywhere on the image, or focus the handle and use the arrow keys (Home, End, PageUp and PageDown work too). The image pair is a placeholder in `public/placeholders`.
   - **FPS chart, one tab per product card** (same four products as the strip), with a 1080p / 1440p toggle and game chips. Game names are 16px on phones and FPS values are large; there are no axis labels.
   - **Pinning:** the bar card pins (ScrollTrigger, `start: 'bottom bottom'`, so the bars stay on screen on phones too). Scroll progress goes to a CSS variable and the bars derive `scaleX` from it, so scrolling doesn't re-render React.
   - **Loading:** the scene renders immediately with bars at full length; only GSAP is lazy, loading about a screen away.
   - **Placeholders:** each card shows a visible "Test source: [__], [date]" line. If FPS is `null`, the bar is a hatched "illustrative" fill and the label reads `[__]`.
6. **Build your PC: the journey** (modelled on a modular-product launch page: story → 3D scene with a three-tab switch → one row per part → configurator).
   - **Statement:** "Snap. Check. Play." with one supporting line.
   - **3D scene with a three-tab switch** below it, each tab with a one-line caption:
     - *Snap it in*: the parts click into the case one by one.
     - *Fit your case*: the case tours Mini-ITX → Micro-ATX → Mid-tower while the fit check updates live; parts that don't fit glow orange.
     - *See it run*: fans spin, the case glow brightens, and an FPS chip shows `[__] FPS`.
   - **One row per part** (processor, graphics card, case and cooling), alternating sides on desktop and compact rows on phones. Each *Configure now* opens the configurator at that step.

### Configurator: `/build-your-pc`

The page you reach from *Configure now*, the *Build your PC* nav link, or *Customise in the builder* on the A and C build cards (which opens with that build's parts).

- **Live 3D build:**
  - **Desktop:** sticky on the left.
  - **Phones:** sticky at the top, about a third of the screen, so you watch it change while you scroll the options.
  - **See it in action:** a toggle that spins the fans, raises the glow and shows the FPS chip.
  - **Controls:** glass-panel toggle, zoom and reset; drag to rotate (on touch screens, tap *Rotate in 3D* first).
- **Start from a build:** chips for Starter, Smooth 1080p, Ready for more, Professional and Creator.
- **01 Select case:** four recommended sizes or *My case* (height, width and depth in mm), plus motherboard size. Like choosing a dock, this decides what fits; the fit check (board, card length, cooler height) updates live.
- **02 Select processor** and **03 Select graphics:** cards with a thumbnail, `₹[__]` price, one line and an Add / Selected pill.
  - "Built-in graphics" is only available with the Ryzen 5 8600G; other processors grey it out with the reason.
  - Picking the 7500F while on built-in graphics adds the entry graphics card and says so.
- **04 The rest of the build:** board, memory and power supply are marked *Needed*; the cooler can be added or removed. Each change snaps the part into, or lifts it out of, the 3D case. The plain-words key sits under this step.
- **Live total:** `₹[__]` and the part count. It turns into a real sum once every chosen part has a price in `content.ts`.
  - **Desktop:** on the *Where to buy this build* button.
  - **Phones:** in a bar pinned to the bottom.
- **Buy sheet:** each chosen AMD part links to its exact listing at Amazon, Flipkart and the specialist e-tailer, or the whole build goes to an authorised builder. All links are UTM-tagged with `build: custom`. On this page the pinned bar's *Where to buy* opens the same sheet, so the build isn't lost.
- **Save / Share:** the share link stores the whole build in the URL (`?cpu=…&gpu=…&case=…&b=…&dims=…&x=…`), and opening it restores the build.

### 3D on every device (both 3D views)

- three.js (~152 KB gzip) loads only when needed: the homepage scene loads about a screen before you reach it, and on the configurator it starts once the browser is idle. Until then the flat SVG build shows.
- Rendering happens only when something changes, and pauses off-screen.
- Under reduced motion, parts appear in place, the fans don't spin and there's no damping.
- **Devices without graphics hardware for WebGL** (software renderers such as SwiftShader or llvmpipe) keep the flat drawing and get a *Show in 3D* button. On such a device the scene would block the page for seconds. Add `?3d=1` to any URL to force 3D for testing.
- Without WebGL at all, the flat SVG build is the fallback.
7. **Verified sellers.** Exactly four named sellers as text (no logo wall): Amazon and Flipkart (persona A line), a specialist e-tailer (B) and an authorised builder (C).
   - A "Show sellers for" picker chooses the product. Every link goes to **that product's exact listing**, never a search page, and carries `utm_source=amdhub&utm_medium=referral&utm_campaign=[persona]`.
   - If a persona is saved, its seller(s) and trust line move to the front.
   - Links open in a new tab with `rel="noopener"`. The referrer is kept on purpose so sellers can attribute the traffic.
8. **Guides.** One per persona, in the format that persona researches in. The saved persona's guide comes first, and hover or focus reveals the read time:
   - "Your first gaming PC": assembly walkthrough (A)
   - "Before → after FPS: best upgrades" (B)
   - "Desk setups that work and play": setup gallery (C)

   "What is X3D?" and "Why AM5 lasts" sit underneath as extra cards. Guide routes show a "coming soon" stub.
9. **Footer.** Mocked sale-alert capture (email or Indian mobile, plus a consent checkbox) that validates locally and never sends data. Also the sources list and legal line.


### Persona pages: the shared six-block spine

| Block | A · `/new-gaming-pc` | B · `/upgrade` | C · `/work-and-play` |
| --- | --- | --- | --- |
| 1 | Budget chips + game picker | "What's in your PC now?" AM4 / AM5 / Intel → one upgrade path (below) with its fit questions | Two questions: "What work do you do?" + "Main goal for this build?" |
| 2 | Builds A1–A3 as four-line cards with FPS for your game (your budget's build highlighted) + plain-words key | Before / after FPS for the path's part | The matched build card (the other one is a tap away) + plain-words key |
| 3 | "Why AMD here?" in three lines | Price and stock for the path's part, exact listings | Dated Ryzen vs NVIDIA comparison (Mac for reference) + spec-sheet download |
| 4 | Exit → Amazon | Exit → Specialist e-tailer | Exit → Authorised builder |
| 5 | Genuine AMD part · full warranty | In stock at a verified partner · sealed box | Authorised builder · GST invoice · support |
| 6 | Save / share build | Save fit result + stock alert | Sale alert + share |

**Persona B paths** (`upgradePage.routes`):
- **AM4 → B1, processor drop-in** (Ryzen 7 5700X3D): BIOS-version check + cooler fit. A link switches to B2 for AM4 owners upgrading the graphics card.
- **AM5 → B2, graphics card swap** (RX 9060 XT 16 GB or RX 9070): power-supply watts + the space in the case for the card's length.
- **Intel → B3, add a Radeon card**: the B2 checks plus "Works with your Intel CPU" reassurance.

The recommended PSU and card length are `null` until filled from the exact partner model, so those lines read "check" rather than guess.

**Persona C match** (`workPlayPage.match`): "Speed up the work I already do" → **Professional** (Ryzen 9 9900X + RX 9070 XT); "Start a side hustle in AI or content creation" → **Creator** (Ryzen 9 9950X3D + RX 9070 XT). The work type adds one plain line to the card (`workNotes`). In the comparison the Mac column is labelled and styled as a reference point, never a competitor. The comparison shows two cards at a time with swipe on a phone, keeps full specs under *See specs*, and never tells anyone to switch to desktop. The NVIDIA card shows both the NVIDIA India list price ("from ₹[__]") and the street price ("₹[__]"), each dated.

### Build cards (everywhere a build appears)

Every card shows four lines: **specs · in plain words · good for · what changes vs the build before**. Pages with build cards (and the homepage strip) show the plain-words key: *cores = jobs at once · GHz = speed of each job · 3D V-Cache = extra memory on the chip for smoother games · graphics card = draws the game · GB of video memory = room for game detail*.

| Build | Band | Processor | Graphics | What changes |
| --- | --- | --- | --- | --- |
| A1 Starter | ₹40–60k | Ryzen 5 8600G | Radeon 760M, built in | – |
| A2 Smooth 1080p | ₹60–80k | Ryzen 5 7500F | RX 9060 XT 8 GB | adds a graphics card |
| A3 Ready for more | ₹80k–1L | Ryzen 5 7500F | RX 9060 XT 16 GB | double the video memory |
| B1 | one part | Ryzen 7 5700X3D | keeps current card | only the processor changes |
| B2 | one part | keeps current processor | RX 9070 16 GB (or RX 9060 XT 16 GB) | only the graphics card changes |
| C Professional | ₹1.1L+ | Ryzen 9 9900X | RX 9070 XT 16 GB | double the cores |
| C Creator | ₹1.1L+ | Ryzen 9 9950X3D | RX 9070 XT 16 GB | more cores + gaming cache |

The specs (cores, threads, GHz, cache, video memory) are in `catalog` in `content.ts`, taken from the revision brief: **confirm them against AMD.com before launch.** Bands are positioning; exact prices and all FPS stay `₹[__]` / `[__]` with `[source]` and `[date]`.

Persona assignment (`personaFromAnswers`):

- Owns a gaming PC → **B**.
- Doesn't own one and the PC is also for work → **C**.
- Otherwise → **A**.

Landing on a persona page also saves that persona. Age never decides the persona; the core age ranges (A 16–22, B 20–27, C 24–32) only steer creative tone and are never shown on the site.

---

## content.ts: fields to fill before launch

Placeholder conventions: a price or FPS of `null` renders as `₹[__]` or `[__]`, and a date of `null` renders as `[date]`. Strings containing `[__]`, `[source]` or `[date]` are slots to replace. **Never enter an FPS figure without a test source.**

| Object | Fields |
| --- | --- |
| `site` | `wordmark` (swap for the SVG in `components/Wordmark.tsx`), nav labels |
| `hero` | `headline`, `headlineAccent`, `sub` |
| `offer` | `label`, `endsAt` (ISO date: the chip hides after it), `href` |
| `personas[*]` | `door.*` copy, `trustLine` (approved exact copy is already in place), `heroProduct`, `sellers`; `personasIntro.need` (need-led line) |
| `catalog` | Specs per product: **confirm against AMD.com** |
| `builds` | Per build: `plain`, `goodFor`, `changes`, `price`, `fps` |
| `products[*]` | `stat` (one big stat), `fromPrice` (number → count-up), `image` |
| `productsIntro.priceNote` | Price-check date + source |
| `fpsScene.parts[*].fps[game][res]` | Every FPS value (1080p / 1440p) |
| `fpsScene.source` | `name`, `date`; `settingsNote`; the AAA title in `games` |
| `rtCompare` | Replace `rt-off.svg` / `rt-on.svg` with matching in-game captures; fill the caption's game, settings, source and date |
| `buildTeaser.parts[*]` | `label`, `min`, `max`, `fps` (all must be numbers before the total computes) |
| `sellers[*]` | Name the specialist e-tailer and authorised builder |
| `listings` | **Exact product-listing URL per product per seller** (ASIN, Flipkart item id, partner product page). Never a search page; UTM tags are added in code |
| `guides[*]` | `format`, `readTime`, `href` |
| `alertCapture` | Consent text and privacy-policy link |
| `sources[*]` | `text`, `date` for the hero claim, prices, FPS and the comparison |
| `footer` | Links, legal year |
| `newBuildPage` | `why[*]` claims |
| `upgradePage` | `biosQ` / `biosResults` (BIOS version), `coolerResults`, `cards[*].recommendedPsuW` and `lengthMm`, `results.*`, `beforeAfter`, `beforeAfterSource`, `stock[*]` |
| `chip3d` | Viewer copy; `engraving` (brand, line, model) printed on the 3D heat spreader |
| `buildJourney` | Statement, tab captions, FPS chip, part rows |
| `configurator` | Option labels and notes, `cpus[*].price`, `gpus[*].price`, `extras[*].price` (all `null` → `₹[__]`), `gamingIgpu`, copy |
| `caseFit` | `presets` (typical sizes: **replace with the recommended case spec**), `recommendedId`, slider ranges in `dims`, `boards`, `partSizes` (GPU length, cooler height: **replace with exact model specs**), `clearance` rules used by the fit check, result copy |
| `buildTeaser.parts` | Order is the 3D snap-in order; ids map to 3D models (`board`, `cpu`, `cooler`, `ram`, `gpu`, `psu`) |
| `workPlayPage` | `match`, `workNotes`, `compare.rows[*].values`, `compare.nvidiaPrices` (list + street, each dated), `compare.source`, `compare.date`; replace `/public/placeholders/spec-sheet.pdf` |

Real rivals are Intel (processors), NVIDIA (graphics) and Intel Arc (entry graphics); the Mac is a reference point only. Every comparison keeps its `source` and `date`, shown on the page and in *Sources and notes*. Any per-rupee comparison with GeForce must show NVIDIA's India list price and street price, both dated. Never enter a figure without a source.

---

## Event map (GA4 via `window.dataLayer`)

Every push has `event`, `persona` (the saved persona, or `none`) and `section`. Dev builds log each push as `[dataLayer] {…}`. Paste the GTM container snippet into `index.html`.

| Event | Fires when | Extra parameters |
| --- | --- | --- |
| `persona_select` | Persona door click, the need-led line, "Show me" after the quiz; C's "Show my build" | `persona`, `method` (`door` / `quiz` / `need_line` / `questions`); C adds `work_type`, `build_goal`, `build` |
| `game_check` | Game chip or resolution toggle (FPS scene); game chip on page A | `product`, `game`, `resolution` |
| `build_save` | Save build (A); save fit result (B) | `product`, `build` or `type: fit_result`, `result` |
| `build_share` | Share build (A, C), via Web Share or clipboard | `product`, `method` (`shared` / `copied`) |
| `compat_check` | Fit checker submit (B) | `platform` (`am4` / `am5` / `intel`), `path` (`b1` / `b2` / `b3`), `product`, `result` (`fits` / `check` / `no`); B1 adds `bios`, `cooler`; B2/B3 add `psu_w`, `space_mm` |
| `compare_view` | Comparison table is 40% in view (C), once per page view | `product`, `compared` |
| `alert_signup` | Valid sale-alert submit (footer, B, C), mocked | `product`, `channel` (`email` / `phone`; never the value) |
| `store_search` | Any *Where to buy* (header, hero, pinned bar); *View sellers* on product cards | `product` (product cards) |
| `partner_click` | Any outbound seller link (seller cards, persona exit button, stock list) | `seller_name`, `product`, `persona`, `link_url`, `utm_campaign`; `path` on B, `build` on A / C |
| `bundle_redeem_click` | Offer chip | `product: bundle`, `link_url` |
| `builder_start` | *Start building* (hero), *Build yours* (teaser) | — |
| `view_3d` *(added)* | *View in 3D* on the hero chip | `product: chip` |
| `build_configure` *(added)* | Any part choice in the configurator | `part`, `product`, `action` (`select` / `add` / `remove`) |
| `scroll_depth` | Scroll passes 10 / 25 / 50 / 75 / 90 % of the page (percent, not screens or pixels), once each per page view | `percent`, `page` |
| `first_buy_visible` | The first *Where to buy* button enters the viewport, once per page view | `scroll_percent` at that moment, `section` (which button), `page` |

`compat_check` also fires from the configurator's case step (`section: configurator`), 0.9 s after the visitor stops adjusting. It sends `case`, `case_h`, `case_w`, `case_d`, `board` and `result`. In the configurator, `builder_start` comes from *Configure now* and *Customise in the builder*, `store_search` from opening the buy sheet, and `build_save` / `build_share` from its save and share buttons, all with `build: custom`.

North-star KPI: `partner_click` events per 100 sessions.

---

## Motion rules, as implemented

- Only transform and opacity are animated. The easing is `cubic-bezier(0.22, 1, 0.36, 1)` and durations are 200–600ms (tokens in `tokens.css`, constants in `lib/motion.ts`).
- One "wow" per screen: the hero chip, the FPS race and the build snap-in.
- **Content never waits for an animation.** Scroll reveals move only (`translateY`); opacity stays 1. CSS reveals use `animation-fill-mode: backwards`, so the hidden state exists only while the animation is running. If animations never run, every section still shows its content.
- Nothing loops forever: the chip sways for 2 cycles, the glow pulses 3 times and the shimmer plays once. Off-screen animations pause via IntersectionObserver (`.paused-offscreen`), and the build teaser and count-ups only start once in view.
- **`prefers-reduced-motion`**:
  - Framer runs with `reducedMotion="user"`, so it drops transforms.
  - CSS animations collapse to fades.
  - Lenis, parallax, gyroscope, pinning, GSAP loading, the shimmer and count-ups are all off.
  - The FPS bars and build total show their final state at once.

## Quality bar

`npm run check:acceptance` checks the phone-first rules in a real browser, and all of them pass:

- At 390 × 844, "Where to buy" is visible on load on all four pages. It stays visible while scrolling, and the pinned bar shows after the hero, including after an anchor jump past it.
- No seller link resolves to a search page. 45 seller links were checked across every product, budget and B path, and all are exact listings with UTM tags.
- Content is visible with scroll animations disabled. The check stubs out `IntersectionObserver`, so no reveal can run, and finds no hidden text on any page at 390px or 1440px.
- "From ₹" cards sit in the first half of the page (24%), FPS game names are 16px on phones, and the RT slider moves with the arrow keys.

## Measured quality (production build, `vite preview`)

Lighthouse 12, mobile, simulated 4G:

| Page | Performance | Accessibility | Best practices | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 97–98 | 100 | 100 | 2.0 s | 130–150 ms | 0.001 |
| `/new-gaming-pc` | 98 | 100 | 100 | 2.0 s | 40 ms | 0 |
| `/upgrade` | 98 | 100 | 100 | 2.0 s | 20 ms | 0 |
| `/work-and-play` | 99 | 100 | 100 | 2.0 s | 20 ms | 0 |
| `/build-your-pc` | 99 | 100 | 100 | 1.8 s | 60 ms | 0 |

Lighthouse's Chrome has no GPU, so the configurator shows its flat drawing there (see *3D on every device*). Forcing 3D on that GPU-less machine (`?3d=1`) gives LCP 1.8 s and TBT about 4.9 s. The blocking time is software drawing of each frame, which a phone's GPU does in hardware.

- **Initial JS:** about 129 KB gzip (React + app ≈ 98 KB, motion ≈ 31 KB). The FPS scene and persona pages are now in the main bundle so content never waits on a chunk. Loaded later:
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
- `build3d-mycase-*.png`, `build3d-nofit-1440.png`: a custom case too small for the parts, with the failing parts glowing orange (earlier layout)
- `journey-snap-*.png`, `journey-fit-*.png`, `journey-run-1440.png`, `journey-rows-390.png`: the homepage Build-your-PC journey
- `configurator-*.png`: the configurator on desktop and phone, the parts list, and the buy sheet
- `phone-*.png` (390 × 844): pinned bar over the product strip, RT slider, FPS tabs, sellers, B1 and B3 paths, C matched build and comparison, A build cards
