# FEATURES_LOCKED

Snapshot of the build at commit `18a9ed3` (13 Nov 2026), taken before the NEW_HOME_V2 layer.
Everything below is **read-only**: no renames, restyles, reordering, refactors or deletions, and
no changes to props, data or event names. New work is added beside it (see `CHANGES.md`).

## Routes

| Route | Page | File |
| --- | --- | --- |
| `/` | Homepage | `src/pages/Home.tsx` |
| `/new-gaming-pc` | Persona A: new gaming PC | `src/pages/NewGamingPc.tsx` |
| `/upgrade` | Persona B: upgrade one part | `src/pages/Upgrade.tsx` |
| `/work-and-play` | Persona C: work and play | `src/pages/WorkAndPlay.tsx` |
| `/build-your-pc` | Configurator | `src/pages/BuildYourPc.tsx` |
| `/guides/*`, anything else | Coming-soon stub | `src/pages/NotFound.tsx` |

## Site chrome (every page)

1. **Skip link** ("Skip to content").
2. **Sticky header** (`components/Header.tsx`):
   - wordmark placeholder; nav: Processors, Graphics, Build your PC (→ `/build-your-pc`), Offers;
   - **orange "Where to buy" button**, always visible, in the first phone screen;
   - shrinks and blurs after 80px; mobile menu; slides away when the pinned bar shows.
3. **Pinned section bar** (`components/SectionBar.tsx`):
   - appears after the hero sentinel, on every screen size;
   - section dropdown with scrollspy, saved-persona shortcut, orange "Where to buy";
   - on `/build-your-pc` its Where to buy opens the buy sheet.
4. **Footer** (`components/Footer.tsx`): mocked sale-alert form, sources list, links and legal line. The alert is hidden on `/upgrade` and `/work-and-play`.
5. **Lenis** smooth scroll (off under reduced motion), **history router** (memory router in the single-file build), and hash scrolling.

## Homepage sections, in order (`src/pages/Home.tsx`)

1. **Hero** (`sections/Hero.tsx`, `sections/HeroChip.tsx`):
   - "The fastest gaming processors. Now in India." with a CSS word reveal and the orange→gold "fastest";
   - footnote ¹, offer chip (`components/OfferChip.tsx`, hides after `offer.endsAt`; currently `null`, so not expired);
   - *Start building* (orange) and *Where to buy*;
   - 3D CSS chip with mouse / gyro tilt;
   - **View in 3D** modal (`three/ChipViewerDialog.tsx`: flip to contacts, auto-rotate, keyboard).
2. **Bar sentinel** `#bar-sentinel`, which triggers the pinned section bar.
3. **Persona doors** (`sections/PersonaDoors.tsx`, `#doors`): three cards with hover preview, the need-led line ("Play games without a graphics card."), and the two-question quiz.
4. **"From ₹" product strip** (`sections/ProductStrip.tsx`, `#products`, `#graphics`): one big stat per card, count-up price, X3D gold shimmer, *View sellers* (selects the product in Sellers), and the plain-words key.
5. **FPS in your games** (`sections/FpsSection.tsx`, `sections/FpsScene.tsx`, `#fps`):
   - ray-tracing Off / On drag slider (`components/RtCompare.tsx`);
   - one tab per product card, 1080p / 1440p toggle and game chips;
   - pinned GSAP bars with a source line.
6. **Build-your-PC journey** (`sections/BuildTeaser.tsx`, `#build`):
   - "Snap. Check. Play."; 3D stage (`components/BuildStage.tsx`) with the Snap it in / Fit your case / See it run tabs;
   - three part rows with *Configure now*.
7. **Verified sellers** (`sections/Sellers.tsx`, `#sellers`): product picker, four named sellers with trust lines, exact listings with UTM (`utm_campaign` = persona, or `general`).
8. **Guides** (`sections/Guides.tsx`, `#guides`): three persona-format cards plus two extras.

## Persona pages (six-block spine, `pages/PersonaSpine.tsx`)

- **A, `/new-gaming-pc`:** budget chips + game picker; builds A1–A3 as four-line `BuildCard`s with FPS and *Customise in the builder*; plain-words key; Why AMD; exit to Amazon; save / share.
- **B, `/upgrade`:** "What's in your PC now?" AM4 / AM5 / Intel routes to:
  - B1: BIOS + cooler checks;
  - B2: card, PSU and space checks;
  - B3: Intel reassurance plus the B2 checks.

  Then before / after FPS, price and stock list, save fit result, stock alert.
- **C, `/work-and-play`:** work + goal questions pick the matched build (Professional / Creator); phone compare cards (two at a time, See specs, Mac as reference, NVIDIA list + street price); spec-sheet download; alert; share.

## Configurator (`/build-your-pc`)

- **Build view:** sticky live 3D build (`BuildStage` + `three/BuildViewport3D.tsx`) and the See it in action toggle.
- **Steps:** start-from presets; Select case (presets or My case, `components/CaseFitControls.tsx`) with fit check; processor, graphics and extras cards (Add / Selected / Needed / greyed out).
- **Buying:** live total; buy sheet (exact listings per part or an authorised builder); phone bottom total bar.
- **Save and share:** save; share link (`lib/buildConfig.ts` encode / decode).

## 3D

- **Modules:** `three/stage.ts` (render on demand, pauses off-screen, 64px environment map), `three/pcModel.ts`, `three/parts.ts`, `three/chipModel.ts`.
- **Loading:** three.js lazy-loaded; software-only WebGL shows the flat drawing plus a *Show in 3D* button (`lib/webgl.ts`); `?3d=1` forces 3D.

## Shared components and libraries

- **Components:** `BuildCard`, `PlainKey`, `GoldBadge`, `SectionHeading`, `SellerLink`, `WhereToBuy`, `AlertForm`, `Icons`, `Wordmark`.
- **Libraries:** `analytics`, `persona`, `sellers` (exact listings + UTM), `bar`, `buildConfig`, `caseFit`, `format`, `motion`, `router`, `scroll`, `scrollTracking`, `share`, `storage`, `store`, `webgl`.
- **Hooks:** `useCountUp`, `useInView`, `useReducedMotion`, `useShimmerOnce`.
- **Styles:** `styles/tokens.css` (orange / black / gold tokens) and `index.css` (theme, grain, focus rings, reduced-motion rules, fill-mode-backwards reveals).
- **Content:** every exported object in `src/content.ts` (copy, catalog, builds, listings, configurator, caseFit and the rest).

## Tracking events (`lib/analytics.ts`, `window.dataLayer`)

| Event | Locked parameters |
| --- | --- |
| `persona_select` | section, persona, method (door / quiz / need_line / questions), C: work_type, build_goal, build |
| `game_check` | section, product, game, resolution |
| `build_save` | section, product, build / type / platform / path / result |
| `build_share` | section, product, build, method |
| `compat_check` | section, platform, path, product, result, bios / cooler / psu_w / space_mm; case_* on configurator |
| `compare_view` | section, product, build, compared |
| `alert_signup` | section, product, channel |
| `store_search` | section, product, build |
| `partner_click` | seller_name, product, persona, link_url, section, utm_campaign, path / build |
| `bundle_redeem_click` | section, product, link_url |
| `builder_start` | section, build / step |
| `view_3d` | section, product |
| `scroll_depth` | section, page, percent (10 / 25 / 50 / 75 / 90) |
| `first_buy_visible` | section, page, scroll_percent |
| `build_configure` | section, part, product, action |

Every push also carries `persona` (saved persona or `none`).

## Scripts and builds

- `npm run dev` / `build` / `preview` / `typecheck`.
- `npm run build:single` produces the single-file HTML (inlines `/placeholders/*.svg|pdf`).
- `npm run check:acceptance` (`scripts/acceptance.cjs`) checks:
  - Where to buy is visible on load and stays visible;
  - the pinned bar shows after the hero;
  - no seller link is a search page and every one has UTM tags;
  - text is visible with animations off;
  - "From ₹" cards sit in the first half of the page;
  - FPS game names are ≥ 14px;
  - the RT slider responds to the keyboard.
- `public/_redirects` provides the SPA fallback.
