/**
 * content.ts — every piece of copy, price, FPS value, date, claim, build and seller.
 *
 * Editing rules
 * - Prices are numbers in rupees (e.g. 18999) or `null`. `null` renders as "₹[__]".
 *   Budget bands (₹40–60k etc.) are positioning, not prices.
 * - FPS values are numbers or `null`. `null` renders as "[__]" and the bar shows a hatched
 *   "awaiting test data" fill. Never type an FPS figure that has no test source.
 * - Dates are ISO strings ("2026-12-31") or `null`. `null` renders as "[date]".
 * - Any claim or comparison (Intel, NVIDIA, Intel Arc, Apple) needs a `source` and `date`.
 *   Any per-rupee comparison with GeForce shows NVIDIA's India list price AND street price, both dated.
 * - Processor and graphics specs below come from the revision brief: CONFIRM AGAINST AMD.com BEFORE LAUNCH.
 * - Seller links must be exact product listings (never search pages). UTM tags are added in code.
 * - Strings containing "[__]", "[source]" or "[date]" are placeholders to replace.
 */

export const PH = '[__]';
export const PH_SOURCE = '[source]';
export const PH_DATE = '[date]';

export type PersonaId = 'new-build' | 'upgrade' | 'work-play';
export type Resolution = '1080p' | '1440p';
export type Fps = number | null;
export type Rupees = number | null;

/* ------------------------------------------------------------------ */
/* Site chrome                                                         */
/* ------------------------------------------------------------------ */

export const site = {
  wordmark: 'AMD', // placeholder: swap for the official wordmark SVG
  wordmarkSub: 'Gaming India',
  skipLink: 'Skip to content',
  nav: [
    { label: 'Processors', href: '/#products' },
    { label: 'Graphics', href: '/#graphics' },
    { label: 'Build your PC', href: '/#build' },
    { label: 'Offers', href: '/#offers' },
  ],
  whereToBuy: 'Where to buy',
  whereToBuyHref: '/#sellers',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
};

/** Slim bar pinned after the hero (all screen sizes): section dropdown + Where to buy. */
export const sectionBar = {
  jumpLabel: 'Jump to section',
  whereToBuy: 'Where to buy',
  yours: 'Your build',
  home: [
    { id: 'doors', label: 'Pick your build' },
    { id: 'products', label: 'Prices' },
    { id: 'fps', label: 'FPS in your games' },
    { id: 'build', label: 'Build your PC' },
    { id: 'sellers', label: 'Where to buy' },
    { id: 'guides', label: 'Guides' },
    { id: 'alert', label: 'Sale alert' },
  ],
};

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const hero = {
  eyebrow: 'Ryzen processors · Radeon graphics',
  headline: 'The fastest gaming processors. Now in India.',
  /** One word from the headline that gets the orange→gold accent. */
  headlineAccent: 'fastest',
  /** Footnote marker after the headline; links to the matching entry in `sources`. */
  footnoteId: 'hero-claim',
  sub: 'Pick the right chip for your games and budget, check it fits, and buy from a verified seller.',
  primaryCta: 'Start building',
  secondaryCta: 'Where to buy',
  tiltPermission: 'Tilt with your phone',
};

export const offer = {
  /** Shown in the live chip under the hero. */
  label: `Bundle offer: ${PH} with select Ryzen processors`,
  /** ISO end date. The chip hides itself after this date. `null` keeps it visible with "[date]". */
  endsAt: null as string | null,
  endsPrefix: 'Ends',
  cta: 'Redeem',
  href: 'https://example.com/amd-bundle-[__]',
};

/* ------------------------------------------------------------------ */
/* Personas                                                            */
/* ------------------------------------------------------------------ */
/*
 * The two yes/no questions decide the persona — never age.
 * Creative tone skews only (never shown on the site): A 16–22, B 20–27, C 24–32.
 */

export interface PersonaContent {
  id: PersonaId;
  route: string;
  /** Short label for the pinned-bar shortcut and chips. */
  short: string;
  door: {
    title: string;
    line: string;
    budget: string;
    preview: string[];
  };
  /** Exact trust copy for this persona (used on seller cards and persona pages). */
  trustLine: string;
  /** Default product for this persona's seller links. */
  heroProduct: ProductId;
  /** Which seller ids this persona typically buys from (first = default exit). */
  sellers: SellerId[];
}

export const personasIntro = {
  eyebrow: 'Start here',
  title: 'What are you building?',
  sub: 'Pick one. We’ll show the parts, prices and FPS that matter to you.',
  /** Need-led line under the doors (persona A's built-in-graphics build). */
  need: {
    text: 'Play games without a graphics card.',
    detail: 'The Ryzen 5 8600G has graphics built into the chip.',
    cta: 'See the Starter build',
    href: '/new-gaming-pc',
  },
  quizToggle: 'Not sure? Answer two questions',
  quiz: {
    q1: 'Do you already own a gaming PC?',
    q2: 'Will this PC also be for work or creating (editing, streaming, 3D)?',
    yes: 'Yes',
    no: 'No',
    result: 'You’re building:',
    go: 'Show me',
    reset: 'Start over',
  },
  savedLabel: 'Saved',
};

export const personas: Record<PersonaId, PersonaContent> = {
  'new-build': {
    id: 'new-build',
    route: '/new-gaming-pc',
    short: 'New gaming PC',
    door: {
      title: 'A new gaming PC',
      line: 'Three builds by budget, with the FPS you’ll get in your games.',
      budget: 'Typical budget ₹40k–1L',
      preview: ['Budget chips + game picker', 'Three builds, in plain words', 'Why AMD here, in three lines'],
    },
    trustLine: 'Genuine AMD part · full warranty',
    heroProduct: 'r5-8600g',
    sellers: ['amazon', 'flipkart'],
  },
  upgrade: {
    id: 'upgrade',
    route: '/upgrade',
    short: 'Upgrade one part',
    door: {
      title: 'Upgrade one part',
      line: 'Tell us what’s in your PC now. We’ll check the part fits.',
      budget: 'Typical budget ₹15–80k',
      preview: ['AM4, AM5 or Intel: your upgrade path', 'Before / after FPS', 'Price and stock at partners'],
    },
    trustLine: 'In stock at a verified partner · sealed box',
    heroProduct: 'r7-5700x3d',
    sellers: ['specialist', 'amazon', 'flipkart'],
  },
  'work-play': {
    id: 'work-play',
    route: '/work-and-play',
    short: 'Work and play PC',
    door: {
      title: 'A PC for work, creating and gaming',
      line: 'Two questions, one matched build, compared honestly.',
      budget: 'Typical budget ₹1.1L+',
      preview: ['Your work + your goal → your build', 'Ryzen vs NVIDIA, Mac for reference', 'Spec sheet download'],
    },
    trustLine: 'Authorised builder · GST invoice · support',
    heroProduct: 'r9-9900x',
    sellers: ['builder'],
  },
};

export const personaOrder: PersonaId[] = ['new-build', 'upgrade', 'work-play'];

/* ------------------------------------------------------------------ */
/* Product catalogue + plain-words key                                 */
/* ------------------------------------------------------------------ */

export type ProductId =
  | 'r5-8600g'
  | 'r5-7500f'
  | 'r7-5700x3d'
  | 'r9-9900x'
  | 'r9-9950x3d'
  | 'rx-9060xt-8'
  | 'rx-9060xt-16'
  | 'rx-9070'
  | 'rx-9070xt';

/** Specs from the revision brief — confirm against AMD.com before launch. */
export const catalog: Record<ProductId, { name: string; specs: string }> = {
  'r5-8600g': { name: 'Ryzen 5 8600G', specs: '6 cores, 12 threads, up to 5.0 GHz' },
  'r5-7500f': { name: 'Ryzen 5 7500F', specs: '6 cores, 12 threads, up to 5.0 GHz' },
  'r7-5700x3d': { name: 'Ryzen 7 5700X3D', specs: '8 cores, 16 threads, up to 4.1 GHz, 96 MB L3 (3D V-Cache)' },
  'r9-9900x': { name: 'Ryzen 9 9900X', specs: '12 cores, 24 threads, up to 5.6 GHz' },
  'r9-9950x3d': { name: 'Ryzen 9 9950X3D', specs: '16 cores, 32 threads, up to 5.7 GHz, 128 MB L3 (3D V-Cache)' },
  'rx-9060xt-8': { name: 'Radeon RX 9060 XT 8 GB', specs: '8 GB video memory' },
  'rx-9060xt-16': { name: 'Radeon RX 9060 XT 16 GB', specs: '16 GB video memory' },
  'rx-9070': { name: 'Radeon RX 9070', specs: '16 GB video memory' },
  'rx-9070xt': { name: 'Radeon RX 9070 XT', specs: '16 GB video memory' },
};

export const plainKey = {
  title: 'In plain words',
  items: [
    { term: 'cores', meaning: 'jobs at once' },
    { term: 'GHz', meaning: 'speed of each job' },
    { term: '3D V-Cache', meaning: 'extra memory on the chip for smoother games' },
    { term: 'graphics card', meaning: 'draws the game' },
    { term: 'GB of video memory', meaning: 'room for game detail' },
  ],
};

/* ------------------------------------------------------------------ */
/* Builds — every build card shows the same four lines                 */
/* ------------------------------------------------------------------ */

export type BuildId = 'a1' | 'a2' | 'a3' | 'b1' | 'b2' | 'c-pro' | 'c-creator';

export interface Build {
  id: BuildId;
  name: string;
  /** Budget band (positioning, not a price). */
  band: string;
  cpu: ProductId | null;
  gpu: ProductId | null;
  /** Shown instead of a part this build keeps (B paths). */
  cpuText?: string;
  gpuText?: string;
  /** Line 2: what the parts do, in plain words. */
  plain: string;
  /** Line 3. */
  goodFor: string;
  /** Line 4: what changes vs the build before. `null` = first build. */
  changes: string | null;
  /** Exact price — placeholder until verified. */
  price: Rupees;
  fps: FpsTable;
}

export const buildCardLabels = {
  specs: 'Specs',
  plain: 'In plain words',
  goodFor: 'Good for',
  changes: 'What changes vs the build before',
  firstBuild: 'Where it starts',
  price: 'Exact price',
};

export const builds: Record<BuildId, Build> = {
  a1: {
    id: 'a1',
    name: 'Starter',
    band: '₹40–60k',
    cpu: 'r5-8600g',
    gpu: null,
    gpuText: 'Radeon 760M, built into the chip',
    plain: 'Does the gaming and the everyday work on one chip, so you don’t need a graphics card yet.',
    goodFor: 'Esports games, study and streaming video. Add a graphics card later.',
    changes: null,
    price: null,
    fps: emptyFps(),
  },
  a2: {
    id: 'a2',
    name: 'Smooth 1080p',
    band: '₹60–80k',
    cpu: 'r5-7500f',
    gpu: 'rx-9060xt-8',
    plain: 'A separate graphics card does the drawing, so the processor is free to run the game.',
    goodFor: 'Most new games at 1080p.',
    changes: 'Adds a graphics card.',
    price: null,
    fps: emptyFps(),
  },
  a3: {
    id: 'a3',
    name: 'Ready for more',
    band: '₹80k–1L',
    cpu: 'r5-7500f',
    gpu: 'rx-9060xt-16',
    plain: 'Same processor, with more room on the graphics card for game detail.',
    goodFor: 'Higher detail settings and newer, heavier games.',
    changes: 'Double the video memory.',
    price: null,
    fps: emptyFps(),
  },
  b1: {
    id: 'b1',
    name: 'AM4 processor drop-in',
    band: 'One part',
    cpu: 'r7-5700x3d',
    gpu: null,
    gpuText: 'Keeps your current graphics card',
    plain: 'Extra memory on the chip keeps game data close, so frames come out more evenly.',
    goodFor: 'Getting more from an AM4 PC without a new board or memory.',
    changes: 'Only the processor changes.',
    price: null,
    fps: emptyFps(),
  },
  b2: {
    id: 'b2',
    name: 'Graphics card swap',
    band: 'One part',
    cpu: null,
    cpuText: 'Keeps your current processor',
    gpu: 'rx-9070',
    plain: 'A faster graphics card draws each frame quicker, with more room for game detail.',
    goodFor: 'Higher settings and resolutions in the games you already play.',
    changes: 'Only the graphics card changes.',
    price: null,
    fps: emptyFps(),
  },
  'c-pro': {
    id: 'c-pro',
    name: 'Professional',
    band: '₹1.1L+',
    cpu: 'r9-9900x',
    gpu: 'rx-9070xt',
    plain: 'Twelve jobs at once keeps big projects moving while the graphics card handles games and previews.',
    goodFor: 'Speeding up editing, design, code and AI work you already do.',
    changes: 'Double the cores.',
    price: null,
    fps: emptyFps(),
  },
  'c-creator': {
    id: 'c-creator',
    name: 'Creator',
    band: '₹1.1L+',
    cpu: 'r9-9950x3d',
    gpu: 'rx-9070xt',
    plain: 'Sixteen jobs at once for renders and AI, plus extra on-chip memory for smoother games.',
    goodFor: 'Starting a side hustle in content or AI, and gaming after hours.',
    changes: 'More cores + gaming cache.',
    price: null,
    fps: emptyFps(),
  },
};

/* ------------------------------------------------------------------ */
/* "From ₹" product strip                                              */
/* ------------------------------------------------------------------ */

export interface Product {
  id: ProductId;
  family: 'cpu' | 'gpu';
  name: string;
  /** One big, legible stat. No spec tables on the homepage. */
  stat: string;
  fromPrice: Rupees;
  badge?: string;
  image: string;
}

export const productsIntro = {
  eyebrow: 'Prices in India',
  title: 'From ₹, at verified sellers',
  sub: 'Lowest verified price we’ve seen. Prices change, so check the seller.',
  fromLabel: 'From',
  cta: 'View sellers',
  priceNote: `Prices checked ${PH_DATE}. ${PH_SOURCE}`,
};

export const products: Product[] = [
  { id: 'r5-8600g', family: 'cpu', name: 'Ryzen 5 8600G', stat: '6 cores · graphics built in', fromPrice: null, image: '/placeholders/cpu-ryzen-5.svg' },
  { id: 'r7-5700x3d', family: 'cpu', name: 'Ryzen 7 5700X3D', stat: '8 cores · 3D V-Cache', fromPrice: null, badge: 'X3D', image: '/placeholders/cpu-ryzen-7-x3d.svg' },
  { id: 'rx-9060xt-8', family: 'gpu', name: 'Radeon RX 9060 XT', stat: '8 or 16 GB video memory', fromPrice: null, image: '/placeholders/gpu-rx-9060-xt.svg' },
  { id: 'rx-9070xt', family: 'gpu', name: 'Radeon RX 9070 XT', stat: '16 GB video memory', fromPrice: null, image: '/placeholders/gpu-rx-9070-xt.svg' },
];

/* ------------------------------------------------------------------ */
/* FPS scene                                                           */
/* ------------------------------------------------------------------ */

export const games = [
  { id: 'valorant', name: 'Valorant' },
  { id: 'cs2', name: 'CS2' },
  { id: 'gtav', name: 'GTA V' },
  { id: 'aaa', name: `AAA title ${PH}` },
] as const;
export type GameId = (typeof games)[number]['id'];

type FpsTable = Record<GameId, Record<Resolution, Fps>>;
function emptyFps(): FpsTable {
  return {
    valorant: { '1080p': null, '1440p': null },
    cs2: { '1080p': null, '1440p': null },
    gtav: { '1080p': null, '1440p': null },
    aaa: { '1080p': null, '1440p': null },
  };
}

export const fpsScene = {
  eyebrow: 'FPS in your games',
  title: 'See the frames before you buy',
  sub: 'One tab per card. Pick a resolution and scroll to run the test.',
  tabsLabel: 'Choose a product',
  resolutionLabel: 'Resolution',
  gameLabel: 'Highlight a game',
  resolutions: ['1080p', '1440p'] as Resolution[],
  fpsUnit: 'FPS',
  /** Shown under the bars. Fill both before launch. */
  source: { name: PH, date: null as string | null },
  sourcePrefix: 'Test source:',
  settingsNote: `Settings: ${PH} preset, ${PH} test system. Your results may vary.`,
  illustrativeNote: 'Hatched bars are illustrative until test numbers are added.',
  /** One tab per product card in the "From ₹" strip (same ids). */
  parts: [
    { id: 'r5-8600g' as ProductId, name: 'Ryzen 5 8600G', fps: emptyFps() },
    { id: 'r7-5700x3d' as ProductId, name: 'Ryzen 7 5700X3D', fps: emptyFps() },
    { id: 'rx-9060xt-8' as ProductId, name: 'Radeon RX 9060 XT', fps: emptyFps() },
    { id: 'rx-9070xt' as ProductId, name: 'Radeon RX 9070 XT', fps: emptyFps() },
  ],
};

/** Ray-tracing Off / On drag-to-compare, near the top of the FPS section. */
export const rtCompare = {
  title: 'Ray tracing, off and on',
  sub: 'Drag the handle, or focus it and use the arrow keys.',
  off: 'Ray tracing Off',
  on: 'Ray tracing On',
  /** Placeholder pair: replace with matching in-game captures. */
  imgOff: '/placeholders/rt-off.svg',
  imgOn: '/placeholders/rt-on.svg',
  altOff: 'Placeholder scene with ray tracing off: flat lighting, no reflections',
  altOn: 'Placeholder scene with ray tracing on: reflections and glow in the puddles',
  handleLabel: 'Compare ray tracing off and on',
  caption: `Placeholder images. Replace with captures from ${PH}, ${PH} settings, on ${PH}. ${PH_SOURCE}, ${PH_DATE}`,
};

/* ------------------------------------------------------------------ */
/* Build-your-PC teaser                                                */
/* ------------------------------------------------------------------ */

export const buildTeaser = {
  eyebrow: 'Build your PC',
  title: 'See your build inside the case',
  sub: 'Watch the parts snap in, spin it around, then match the case to yours. We’ll tell you if everything fits.',
  totalLabel: 'Running total',
  fpsLabel: 'Est. FPS',
  fpsGame: 'Valorant · 1080p',
  cta: 'Build yours',
  ctaHref: '/new-gaming-pc',
  /** Snap-in order in the 3D case. Ids map to 3D models: board, cpu, cooler, ram, gpu, psu. */
  parts: [
    { id: 'board', label: `AM5 board ${PH}`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'cpu', label: 'Ryzen 5 7500F', min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'cooler', label: `CPU cooler ${PH}`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'ram', label: `${PH} GB DDR5`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'gpu', label: 'Radeon RX 9060 XT', min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'psu', label: `${PH} W PSU`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
  ],
};

/* ------------------------------------------------------------------ */
/* 3D: chip viewer (hero) and case fit (build section)                 */
/* ------------------------------------------------------------------ */

export const chip3d = {
  open: 'View in 3D',
  title: 'Ryzen processor in 3D',
  hint: 'Drag to rotate · scroll or pinch to zoom',
  hintKeys: 'Arrow keys rotate · + / − zoom',
  reset: 'Reset view',
  flip: 'Show contacts',
  flipBack: 'Show top',
  autoRotate: 'Auto-rotate',
  close: 'Close 3D viewer',
  loading: 'Loading 3D…',
  noWebgl: 'Your browser can’t show 3D here. Try another browser or device.',
  /** Text engraved on the heat spreader. */
  engraving: { brand: 'AMD', line: 'RYZEN', model: `${PH}` },
  note: 'Illustrative model.',
};

export type BoardSize = 'atx' | 'matx' | 'itx';

export const caseFit = {
  viewerLabel: '3D view of your build inside a PC case',
  hint: 'Drag to rotate',
  interact: 'Rotate in 3D',
  interactDone: 'Done',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  reset: 'Reset view',
  glass: 'Glass panel',
  loading: 'Loading 3D…',
  caseTitle: 'Your case',
  modes: { recommended: 'Recommended size', mine: 'My case' },
  /**
   * Typical case sizes (mm) — illustrative. Replace with the recommended case spec for this build.
   * The largest board each size takes is worked out from `clearance` below.
   */
  presets: [
    { id: 'itx', label: 'Mini-ITX', h: 340, w: 185, d: 370 },
    { id: 'matx', label: 'Micro-ATX', h: 400, w: 205, d: 410 },
    { id: 'mid', label: 'Mid-tower', h: 470, w: 220, d: 450 },
    { id: 'full', label: 'Full tower', h: 560, w: 240, d: 540 },
  ],
  recommendedId: 'mid',
  recommendedTag: 'Recommended',
  dims: {
    h: { label: 'Height', min: 250, max: 700 },
    w: { label: 'Width', min: 150, max: 320 },
    d: { label: 'Depth', min: 250, max: 650 },
  },
  unit: 'mm',
  litres: 'L',
  boardLabel: 'Motherboard size',
  boards: [
    /* Standard form-factor dimensions (mm): height × width as mounted in a tower. */
    { id: 'atx' as BoardSize, label: 'ATX', h: 305, w: 244 },
    { id: 'matx' as BoardSize, label: 'Micro-ATX', h: 244, w: 244 },
    { id: 'itx' as BoardSize, label: 'Mini-ITX', h: 170, w: 170 },
  ],
  defaultBoard: 'atx' as BoardSize,
  /** Typical part sizes for this build (mm). Replace with the exact models’ specs. */
  partSizes: { gpuLengthMm: 280, coolerHeightMm: 155 },
  partSizesNote: `Part sizes are typical for this build. Check your exact models. ${PH_SOURCE}`,
  /**
   * Clearance rules (mm) used by the fit check. A part fits when its size ≤ case size − clearance.
   * gpuFront: front fans + radiator space; coolerSide: board tray + standoffs + side panel;
   * boardVertical: PSU shroud + top edge; boardDepth: front fans + cable space.
   */
  clearance: { gpuFront: 60, coolerSide: 50, boardVertical: 125, boardDepth: 150 },
  checkTitle: 'Fit check',
  results: {
    board: { ok: 'Motherboard fits', no: 'Motherboard too big for this case' },
    gpu: { ok: 'Graphics card fits', no: 'Graphics card too long' },
    cooler: { ok: 'CPU cooler fits', no: 'CPU cooler too tall' },
    room: 'room to spare',
    over: 'over',
    allGood: 'Everything fits',
    issues: 'Needs a bigger case, or smaller parts',
  },
};

/* ------------------------------------------------------------------ */
/* Sellers — curated, 3–4 named, exact listings only                   */
/* ------------------------------------------------------------------ */

export type SellerId = 'amazon' | 'flipkart' | 'specialist' | 'builder';

export interface Seller {
  id: SellerId;
  name: string;
  kind: string;
  /** Persona whose exact trust line this card shows. */
  persona: PersonaId;
  cta: string;
}

export const sellersIntro = {
  eyebrow: 'Verified sellers',
  title: 'Buy from a seller we’ve checked',
  sub: 'Four sellers, each linking straight to the product page.',
  productLabel: 'Show sellers for',
  verified: 'Verified',
  forYou: 'Best match for you',
  newTab: '(opens in a new tab)',
};

export const sellers: Seller[] = [
  { id: 'amazon', name: 'Amazon', kind: 'Marketplace', persona: 'new-build', cta: 'View on Amazon' },
  { id: 'flipkart', name: 'Flipkart', kind: 'Marketplace', persona: 'new-build', cta: 'View on Flipkart' },
  { id: 'specialist', name: `Specialist e-tailer ${PH}`, kind: 'PC parts store', persona: 'upgrade', cta: 'Check stock' },
  { id: 'builder', name: `Authorised builder ${PH}`, kind: 'Custom PC builder', persona: 'work-play', cta: 'Get a quote' },
];

/**
 * Exact product-listing URLs per product per seller. NEVER a search-results page.
 * Placeholders mark the ID to fill (ASIN, Flipkart item id, partner slug).
 * utm_source / utm_medium / utm_campaign are appended in code.
 */
export const listings: Record<ProductId, Record<SellerId, string>> = {
  'r5-8600g': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-r5-8600g',
    flipkart: 'https://www.flipkart.com/amd-ryzen-5-8600g/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/amd-ryzen-5-8600g',
    builder: 'https://authorised-builder.example/configure/amd-ryzen-5-8600g',
  },
  'r5-7500f': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-r5-7500f',
    flipkart: 'https://www.flipkart.com/amd-ryzen-5-7500f/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/amd-ryzen-5-7500f',
    builder: 'https://authorised-builder.example/configure/amd-ryzen-5-7500f',
  },
  'r7-5700x3d': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-r7-5700x3d',
    flipkart: 'https://www.flipkart.com/amd-ryzen-7-5700x3d/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/amd-ryzen-7-5700x3d',
    builder: 'https://authorised-builder.example/configure/amd-ryzen-7-5700x3d',
  },
  'r9-9900x': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-r9-9900x',
    flipkart: 'https://www.flipkart.com/amd-ryzen-9-9900x/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/amd-ryzen-9-9900x',
    builder: 'https://authorised-builder.example/configure/professional-ryzen-9-9900x',
  },
  'r9-9950x3d': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-r9-9950x3d',
    flipkart: 'https://www.flipkart.com/amd-ryzen-9-9950x3d/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/amd-ryzen-9-9950x3d',
    builder: 'https://authorised-builder.example/configure/creator-ryzen-9-9950x3d',
  },
  'rx-9060xt-8': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-rx-9060xt-8gb',
    flipkart: 'https://www.flipkart.com/amd-radeon-rx-9060-xt-8gb/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/radeon-rx-9060-xt-8gb',
    builder: 'https://authorised-builder.example/configure/radeon-rx-9060-xt-8gb',
  },
  'rx-9060xt-16': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-rx-9060xt-16gb',
    flipkart: 'https://www.flipkart.com/amd-radeon-rx-9060-xt-16gb/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/radeon-rx-9060-xt-16gb',
    builder: 'https://authorised-builder.example/configure/radeon-rx-9060-xt-16gb',
  },
  'rx-9070': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-rx-9070',
    flipkart: 'https://www.flipkart.com/amd-radeon-rx-9070/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/radeon-rx-9070',
    builder: 'https://authorised-builder.example/configure/radeon-rx-9070',
  },
  'rx-9070xt': {
    amazon: 'https://www.amazon.in/dp/ASIN-TBD-rx-9070xt',
    flipkart: 'https://www.flipkart.com/amd-radeon-rx-9070-xt/p/ITM-TBD',
    specialist: 'https://specialist-etailer.example/products/radeon-rx-9070-xt',
    builder: 'https://authorised-builder.example/configure/radeon-rx-9070-xt',
  },
};

/* ------------------------------------------------------------------ */
/* Guides — format matches each persona's research habit              */
/* ------------------------------------------------------------------ */

export const guidesIntro = {
  eyebrow: 'Guides',
  title: 'Know before you buy',
  moreTitle: 'More to read',
};

export interface Guide {
  id: string;
  /** Persona this guide is written for; `null` = extra card for everyone. */
  persona: PersonaId | null;
  format: string;
  title: string;
  blurb: string;
  readTime: string;
  href: string;
}

export const guides: Guide[] = [
  {
    id: 'first-pc',
    persona: 'new-build',
    format: 'Assembly walkthrough',
    title: 'Your first gaming PC',
    blurb: 'Put it together step by step, from empty case to first boot.',
    readTime: `${PH} steps · ${PH} min`,
    href: '/guides/your-first-gaming-pc',
  },
  {
    id: 'upgrades',
    persona: 'upgrade',
    format: 'Before → after FPS',
    title: 'Before → after FPS: best upgrades',
    blurb: 'The single-part upgrades that add the most frames to the PC you own.',
    readTime: `${PH} min read`,
    href: '/guides/best-upgrades-before-after-fps',
  },
  {
    id: 'desks',
    persona: 'work-play',
    format: 'Setup gallery',
    title: 'Desk setups that work and play',
    blurb: 'Desks that edit, design and code by day, and game by night.',
    readTime: `${PH} setups`,
    href: '/guides/desk-setups-work-and-play',
  },
  {
    id: 'x3d',
    persona: null,
    format: 'Explainer',
    title: 'What is X3D?',
    blurb: 'Why extra memory on the chip means smoother games.',
    readTime: `${PH} min read`,
    href: '/guides/what-is-x3d',
  },
  {
    id: 'am5',
    persona: null,
    format: 'Explainer',
    title: 'Why AM5 lasts',
    blurb: 'One board, several processor upgrades. Here’s how.',
    readTime: `${PH} min read`,
    href: '/guides/why-am5-lasts',
  },
];

/* ------------------------------------------------------------------ */
/* Sale alert + footer                                                 */
/* ------------------------------------------------------------------ */

export const alertCapture = {
  title: 'Get a sale alert for your build',
  sub: 'One message when prices drop. No spam.',
  fieldLabel: 'Phone or email',
  fieldPlaceholder: 'you@example.com or 98XXXXXXXX',
  consent: 'I agree to get sale alerts from AMD India and accept the [privacy policy].',
  submit: 'Set alert',
  success: 'Done. We’ll tell you when your build drops in price. (Demo only — nothing was sent.)',
  errorField: 'Enter a valid email or a 10-digit Indian mobile number.',
  errorConsent: 'Tick the box so we can send you alerts.',
  mockNote: 'Prototype: this form does not send data anywhere.',
};

export interface Source {
  id: string;
  text: string;
  date: string | null;
}

export const sources: Source[] = [
  { id: 'hero-claim', text: `"Fastest gaming processors" claim: ${PH_SOURCE}`, date: null },
  { id: 'prices', text: `Prices: lowest verified listing at partner sellers, ${PH_SOURCE}`, date: null },
  { id: 'fps', text: `FPS figures: ${PH_SOURCE}, test system ${PH}`, date: null },
  { id: 'compare', text: `Comparison with Intel + NVIDIA systems (Mac shown for reference): ${PH_SOURCE}`, date: null },
  { id: 'nvidia-prices', text: `NVIDIA India list prices and street prices: ${PH_SOURCE}`, date: null },
  { id: 'specs', text: `Processor and graphics specs: AMD.com, ${PH_SOURCE}`, date: null },
];

export const footer = {
  sourcesTitle: 'Sources and notes',
  links: [
    { label: 'Privacy', href: 'https://example.com/privacy-[__]' },
    { label: 'Terms', href: 'https://example.com/terms-[__]' },
    { label: 'Cookie settings', href: 'https://example.com/cookies-[__]' },
  ],
  legal: `© ${PH} Advanced Micro Devices, Inc. AMD, Ryzen, Radeon and combinations thereof are trademarks of Advanced Micro Devices, Inc. Prototype for review.`,
};

/* ------------------------------------------------------------------ */
/* Persona pages (shared six-block spine)                              */
/* ------------------------------------------------------------------ */

export const personaPageCommon = {
  back: 'All builds',
  exitPrefix: 'Buy from',
  trustTitle: 'Why buy here',
  stepTitle: 'Not ready yet?',
  shareText: 'My AMD build',
  shared: 'Link copied',
  saved: 'Saved on this device',
  sourcePrefix: 'Source:',
  /** Pinned-bar labels for the spine. */
  barSections: { exit: 'Where to buy', step: 'Save or get an alert' },
};

export const newBuildPage = {
  eyebrow: 'A new gaming PC',
  title: 'Your first gaming PC, sorted',
  sub: 'Pick your budget and your main game. We’ll show three builds and the frames you’ll get.',
  blockTitles: ['Your budget and game', 'Three builds, in plain words', 'Why AMD here?'],
  budgetLabel: 'Your budget',
  /** Budget chip → build it highlights. */
  budgets: [
    { id: 'a1' as BuildId, label: '₹40–60k' },
    { id: 'a2' as BuildId, label: '₹60–80k' },
    { id: 'a3' as BuildId, label: '₹80k–1L' },
  ],
  buildOrder: ['a1', 'a2', 'a3'] as BuildId[],
  gameLabel: 'Your main game',
  recommended: 'Fits your budget',
  fpsAt: 'at 1080p',
  why: [
    `The Ryzen 5 8600G runs ${PH} at 1080p with no graphics card. ${PH_SOURCE}`,
    `AM5 boards are supported through ${PH}, so you can upgrade the chip later. ${PH_SOURCE}`,
    `Ryzen 5 7500F + RX 9060 XT: ${PH} FPS in ${PH} at 1080p. ${PH_SOURCE}`,
  ],
  saveCta: 'Save this build',
  shareCta: 'Share build',
};

export type Platform = 'am4' | 'am5' | 'intel';
export type UpgradePath = 'b1' | 'b2' | 'b3';

export const upgradePage = {
  eyebrow: 'Upgrade one part',
  title: 'Will it fit? Check in 10 seconds',
  sub: 'Tell us what’s in your PC now. We’ll show your upgrade path and check the part fits.',
  blockTitles: ['Fit checker', 'Before / after FPS', 'Price and stock'],
  platformQ: 'What’s in your PC now?',
  platforms: [
    { id: 'am4' as Platform, label: 'AMD AM4', hint: 'Ryzen 1000–5000 series' },
    { id: 'am5' as Platform, label: 'AMD AM5', hint: 'Ryzen 7000 series and newer' },
    { id: 'intel' as Platform, label: 'Intel', hint: 'Any Intel Core processor' },
  ],
  /** Platform → path. AM4 owners can switch to the graphics-card path with `switchToGpu`. */
  routes: { am4: 'b1', am5: 'b2', intel: 'b3' } as Record<Platform, UpgradePath>,
  switchToGpu: 'Upgrading the graphics card instead?',
  switchToCpu: 'Upgrading the processor instead?',
  paths: {
    b1: { tag: 'B1', title: 'AM4 processor drop-in', build: 'b1' as BuildId },
    b2: { tag: 'B2', title: 'Graphics card swap', build: 'b2' as BuildId },
    b3: { tag: 'B3', title: 'Add a Radeon card to your Intel PC', build: 'b2' as BuildId },
  },
  /** B1 */
  biosQ: `Is your board on BIOS ${PH} or later?`,
  biosOptions: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'unsure', label: 'Not sure' },
  ],
  biosResults: {
    yes: 'BIOS ready: drop the chip in.',
    no: `Update the BIOS first, while your current processor is still fitted. ${PH_SOURCE}`,
    unsure: `Check it: the BIOS version shows on the first screen when the PC starts, or in your board maker’s app. You need ${PH} or later.`,
  },
  coolerQ: 'Which CPU cooler do you have?',
  coolerOptions: [
    { id: 'tower', label: 'Tower air cooler' },
    { id: 'aio', label: 'Liquid cooler' },
    { id: 'box', label: 'Box cooler from an older Ryzen' },
    { id: 'none', label: 'No cooler' },
  ],
  coolerResults: {
    tower: `Same AM4 mount: your cooler carries over. Check it’s rated for ${PH} W.`,
    aio: 'Same AM4 mount: your cooler carries over.',
    box: `Check your box cooler handles ${PH} W. A tower cooler is the safer choice. ${PH_SOURCE}`,
    none: `You’ll need an AM4 cooler: check the box contents first. ${PH_SOURCE}`,
  },
  /** B2 / B3 */
  cardQ: 'Which card?',
  cards: [
    /** Recommended PSU and card length: fill from the exact partner model. `null` = unknown → "check". */
    { id: 'rx-9060xt-16' as ProductId, recommendedPsuW: null as number | null, lengthMm: null as number | null },
    { id: 'rx-9070' as ProductId, recommendedPsuW: null as number | null, lengthMm: null as number | null },
  ],
  psuQ: 'Your power supply (watts)',
  spaceQ: 'Space in your case for the card (mm)',
  spaceHint: 'Measure from the back slot to the front fans or drive cage.',
  intelReassure: 'Works with your Intel CPU. Radeon cards run in any desktop with a PCIe x16 slot and a power supply that meets the card’s needs.',
  checkCta: 'Check fit',
  results: {
    fits: 'Fits',
    check: 'Fits — check one thing',
    no: 'Doesn’t fit yet',
    psuUnknown: `Recommended power supply: ${PH} W for this card. Check the maker’s page.`,
    psuOk: 'Your power supply meets the recommended wattage.',
    psuLow: 'Your power supply is below the recommended wattage. Plan a new one.',
    lenUnknown: `Card length: ${PH} mm on the model you pick. Compare it with your space.`,
    lenOk: 'The card fits in your case with room to spare.',
    lenNo: 'The card is longer than the space in your case.',
    driver: `Install AMD Software ${PH} or later. ${PH_SOURCE}`,
  },
  beforeLabel: `Now (${PH})`,
  afterLabel: 'After upgrade',
  beforeAfter: [
    { game: 'Valorant', before: null as Fps, after: null as Fps },
    { game: 'CS2', before: null as Fps, after: null as Fps },
    { game: 'GTA V', before: null as Fps, after: null as Fps },
  ],
  beforeAfterSource: { name: PH_SOURCE, date: null as string | null },
  stockCols: ['Seller', 'Price', 'Stock', ''],
  /** Per seller: exact listing comes from `listings` for the path's product. */
  stock: [
    { seller: 'specialist' as SellerId, price: null as Rupees, stock: PH },
    { seller: 'amazon' as SellerId, price: null as Rupees, stock: PH },
    { seller: 'flipkart' as SellerId, price: null as Rupees, stock: PH },
  ],
  stockCta: 'View',
  saveFitCta: 'Save my fit result',
  saveFitFirst: 'Run the fit check first.',
  alertCta: 'Alert me when it’s in stock',
};

export type WorkType = 'editing' | 'streaming' | 'design' | 'code' | 'ai' | 'other';
export type BuildGoal = 'speed' | 'side-hustle';

export const workPlayPage = {
  eyebrow: 'Work, creating and gaming',
  title: 'One PC for the day job and the night games',
  sub: 'Answer two questions. We’ll match a build and compare it honestly, with dates.',
  blockTitles: ['Two questions', 'Your matched build', 'Compared, with dates'],
  q1: 'What work do you do?',
  work: [
    { id: 'editing' as WorkType, label: 'Editing' },
    { id: 'streaming' as WorkType, label: 'Streaming' },
    { id: 'design' as WorkType, label: 'Design' },
    { id: 'code' as WorkType, label: 'Code' },
    { id: 'ai' as WorkType, label: 'AI' },
    { id: 'other' as WorkType, label: 'Other' },
  ],
  q2: 'Main goal for this build?',
  goals: [
    { id: 'speed' as BuildGoal, label: 'Speed up the work I already do' },
    { id: 'side-hustle' as BuildGoal, label: 'Start a side hustle in AI or content creation' },
  ],
  /** Which build each goal picks. */
  match: { speed: 'c-pro', 'side-hustle': 'c-creator' } as Record<BuildGoal, BuildId>,
  matchCta: 'Show my build',
  answerFirst: 'Answer both questions to see your build.',
  matchedTag: 'Matched to your answers',
  otherBuild: 'See the other build',
  /** One plain line per work type, shown on the matched card. No numbers without a source. */
  workNotes: {
    editing: 'Editing: more cores shorten exports and keep the timeline smooth.',
    streaming: 'Streaming: spare cores encode the stream while the game keeps its frames.',
    design: 'Design: big files and many apps open at once stay responsive.',
    code: 'Code: builds and test runs use every core you give them.',
    ai: 'AI: the graphics card’s 16 GB holds bigger local models.',
    other: 'Whatever the work, more cores mean less waiting.',
  } as Record<WorkType, string>,
  compare: {
    title: 'Ryzen vs NVIDIA, with a Mac for reference',
    sub: 'Like-for-like price brackets. Where the others win, we say so.',
    /** `reference` columns are shown for context, never as a competitor. */
    columns: [
      { name: 'AMD: Ryzen + Radeon', role: 'ours' as const },
      { name: 'PC with Intel + NVIDIA', role: 'rival' as const },
      { name: 'Mac', role: 'reference' as const, note: 'For reference: where many creators start.' },
    ],
    /** `key` rows show on every card; the rest sit under "See specs". */
    rows: [
      { label: 'Price as tested', key: true, values: [`₹${PH}`, `₹${PH}`, `₹${PH}`] },
      { label: 'Gaming, 1440p avg FPS', key: true, values: [PH, PH, PH] },
      { label: '4K video export', key: true, values: [`${PH} min`, `${PH} min`, `${PH} min`] },
      { label: '3D render', key: false, values: [`${PH} min`, `${PH} min`, `${PH} min`] },
      { label: 'AI: local model size', key: false, values: [PH, PH, PH] },
      { label: 'Upgrade later', key: false, values: [PH, PH, PH] },
      { label: 'Where it wins', key: false, values: [PH, PH, PH] },
    ],
    /** Any per-rupee card vs GeForce shows both, each dated. */
    nvidiaPrices: {
      list: { label: 'NVIDIA India list price', value: `from ₹${PH}`, date: null as string | null },
      street: { label: 'Street price', value: `₹${PH}`, date: null as string | null },
    },
    seeSpecs: 'See specs',
    hideSpecs: 'Hide specs',
    swipeHint: 'Swipe to see more',
    source: PH_SOURCE,
    date: null as string | null,
  },
  specSheet: { label: 'Download spec sheet (PDF)', href: '/placeholders/spec-sheet.pdf' },
  alertCta: 'Get a sale alert for this build',
  shareCta: 'Share build',
};

export const notFound = {
  title: 'This page is on its way',
  sub: 'Guides are being written. Head back to pick your build.',
  cta: 'Back to home',
};
