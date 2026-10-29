/**
 * content.ts — every piece of copy, price, FPS value, date, claim and seller.
 *
 * Editing rules
 * - Prices are numbers in rupees (e.g. 18999) or `null`. `null` renders as "₹[__]".
 * - FPS values are numbers or `null`. `null` renders as "[__]" and the bar shows a hatched
 *   "awaiting test data" fill. Never type an FPS figure that has no test source.
 * - Dates are ISO strings ("2026-12-31") or `null`. `null` renders as "[date]".
 * - Any claim or comparison (incl. Intel, NVIDIA, Apple) needs a `source` and `date`.
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

export interface PersonaContent {
  id: PersonaId;
  route: string;
  /** Short label for the mobile bar shortcut and chips. */
  short: string;
  door: {
    title: string;
    line: string;
    budget: string;
    preview: string[];
  };
  /** Exact trust copy for this persona (used on seller cards and persona pages). */
  trustLine: string;
  heroProducts: string[];
  /** Which seller ids this persona typically buys from (first = default exit). */
  sellers: SellerId[];
}

export const personasIntro = {
  eyebrow: 'Start here',
  title: 'What are you building?',
  sub: 'Pick one. We’ll show the parts, prices and FPS that matter to you.',
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
      line: 'Three tested builds with the FPS you’ll get in your games.',
      budget: 'Typical budget ₹40k–1L',
      preview: ['Budget chips + game picker', 'Three priced builds with FPS', 'Why AMD here, in three lines'],
    },
    trustLine: 'Genuine AMD part · full warranty',
    heroProducts: ['Ryzen 5 8600G', 'Ryzen 5 7500F + Radeon RX 9060 XT'],
    sellers: ['amazon', 'flipkart'],
  },
  upgrade: {
    id: 'upgrade',
    route: '/upgrade',
    short: 'Upgrade one part',
    door: {
      title: 'Upgrade one part',
      line: 'Check it fits your board and PSU, then see the FPS jump.',
      budget: 'Typical budget ₹15–80k',
      preview: ['Fit checker: board + PSU', 'Before / after FPS', 'Price and stock at partners'],
    },
    trustLine: 'In stock at a verified partner · sealed box',
    heroProducts: ['Ryzen 7 5700X3D', 'Radeon RX 9070'],
    sellers: ['specialist'],
  },
  'work-play': {
    id: 'work-play',
    route: '/work-and-play',
    short: 'Work and play PC',
    door: {
      title: 'A PC for work, creating and gaming',
      line: 'Creator and Professional builds, compared honestly.',
      budget: 'Typical budget ₹1.1L+',
      preview: ['Creator + Professional builds', 'Ryzen vs NVIDIA vs Mac, dated', 'Spec sheet download'],
    },
    trustLine: 'Authorised builder · GST invoice · support',
    heroProducts: ['Ryzen 9 9900X', 'Ryzen 9 9950X3D', 'Radeon RX 9070 XT'],
    sellers: ['builder'],
  },
};

export const personaOrder: PersonaId[] = ['new-build', 'upgrade', 'work-play'];

/* ------------------------------------------------------------------ */
/* "From ₹" product strip                                              */
/* ------------------------------------------------------------------ */

export interface Product {
  id: string;
  family: 'cpu' | 'gpu';
  name: string;
  stat: string;
  statLabel: string;
  fromPrice: Rupees;
  badge?: string;
  image: string;
  sellersHref: string;
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
  {
    id: 'ryzen-5',
    family: 'cpu',
    name: 'Ryzen 5 8600G',
    stat: PH,
    statLabel: 'cores / threads',
    fromPrice: null,
    image: '/placeholders/cpu-ryzen-5.svg',
    sellersHref: '/#sellers',
  },
  {
    id: 'ryzen-7-x3d',
    family: 'cpu',
    name: 'Ryzen 7 5700X3D',
    stat: `${PH} MB`,
    statLabel: 'total cache',
    fromPrice: null,
    badge: 'X3D',
    image: '/placeholders/cpu-ryzen-7-x3d.svg',
    sellersHref: '/#sellers',
  },
  {
    id: 'rx-9060-xt',
    family: 'gpu',
    name: 'Radeon RX 9060 XT',
    stat: `${PH} GB`,
    statLabel: 'graphics memory',
    fromPrice: null,
    image: '/placeholders/gpu-rx-9060-xt.svg',
    sellersHref: '/#sellers',
  },
  {
    id: 'rx-9070-xt',
    family: 'gpu',
    name: 'Radeon RX 9070 XT',
    stat: `${PH} GB`,
    statLabel: 'graphics memory',
    fromPrice: null,
    image: '/placeholders/gpu-rx-9070-xt.svg',
    sellersHref: '/#sellers',
  },
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
const emptyFps = (): FpsTable => ({
  valorant: { '1080p': null, '1440p': null },
  cs2: { '1080p': null, '1440p': null },
  gtav: { '1080p': null, '1440p': null },
  aaa: { '1080p': null, '1440p': null },
});

export const fpsScene = {
  eyebrow: 'FPS in your games',
  title: 'See the frames before you buy',
  sub: 'Pick a part and a resolution. Scroll to run the test.',
  partLabel: 'AMD part',
  resolutionLabel: 'Resolution',
  gameLabel: 'Your game',
  resolutions: ['1080p', '1440p'] as Resolution[],
  fpsUnit: 'FPS',
  awaiting: 'Awaiting test data',
  /** Shown under the bars. Fill both before launch. */
  source: { name: PH, date: null as string | null },
  sourcePrefix: 'Test source:',
  settingsNote: `Settings: ${PH} preset, ${PH} test system. Your results may vary.`,
  illustrativeNote: 'Hatched bars are illustrative until test numbers are added.',
  parts: [
    { id: 'r5-8600g', name: 'Ryzen 5 8600G', fps: emptyFps() },
    { id: 'r7-5700x3d', name: 'Ryzen 7 5700X3D', fps: emptyFps() },
    { id: 'rx-9060xt', name: 'Radeon RX 9060 XT', fps: emptyFps() },
    { id: 'rx-9070xt', name: 'Radeon RX 9070 XT', fps: emptyFps() },
  ],
};

/* ------------------------------------------------------------------ */
/* Build-your-PC teaser                                                */
/* ------------------------------------------------------------------ */

export const buildTeaser = {
  eyebrow: 'Build your PC',
  title: 'Snap a build together in a minute',
  sub: 'Pick parts, see the total and the frames you’ll get. Save it or send it to a seller.',
  totalLabel: 'Running total',
  fpsLabel: 'Est. FPS',
  fpsGame: 'Valorant · 1080p',
  cta: 'Build yours',
  ctaHref: '/new-gaming-pc',
  parts: [
    { id: 'cpu', label: 'Ryzen 5 7500F', min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'board', label: `AM5 board ${PH}`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'ram', label: `${PH} GB DDR5`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'gpu', label: 'Radeon RX 9060 XT', min: null as Rupees, max: null as Rupees, fps: null as Fps },
    { id: 'psu', label: `${PH} W PSU`, min: null as Rupees, max: null as Rupees, fps: null as Fps },
  ],
};

/* ------------------------------------------------------------------ */
/* Sellers                                                             */
/* ------------------------------------------------------------------ */

export type SellerId = 'amazon' | 'flipkart' | 'specialist' | 'builder';

export interface Seller {
  id: SellerId;
  name: string;
  kind: string;
  /** Persona whose exact trust line this card shows. */
  persona: PersonaId;
  href: string;
  cta: string;
}

export const sellersIntro = {
  eyebrow: 'Verified sellers',
  title: 'Buy from a seller we’ve checked',
  sub: 'Every link goes to a partner listing for genuine AMD parts.',
  verified: 'Verified',
  forYou: 'Best match for you',
  newTab: '(opens in a new tab)',
};

export const sellers: Seller[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    kind: 'Marketplace',
    persona: 'new-build',
    href: 'https://www.amazon.in/s?k=AMD+Ryzen',
    cta: 'Shop on Amazon',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    kind: 'Marketplace',
    persona: 'new-build',
    href: 'https://www.flipkart.com/search?q=AMD%20Ryzen',
    cta: 'Shop on Flipkart',
  },
  {
    id: 'specialist',
    name: 'Specialist e-tailer',
    kind: `PC parts store ${PH}`,
    persona: 'upgrade',
    href: 'https://example.com/specialist-etailer-[__]',
    cta: 'Check stock',
  },
  {
    id: 'builder',
    name: 'Authorised builder',
    kind: `Custom PC builder ${PH}`,
    persona: 'work-play',
    href: 'https://example.com/authorised-builder-[__]',
    cta: 'Get a quote',
  },
];

/* ------------------------------------------------------------------ */
/* Guides                                                              */
/* ------------------------------------------------------------------ */

export const guidesIntro = {
  eyebrow: 'Guides',
  title: 'Know before you buy',
};

export const guides = [
  {
    id: 'first-pc',
    title: 'Your first gaming PC',
    blurb: 'Every part, what it does and where to save money.',
    readTime: `${PH} min read`,
    href: '/guides/your-first-gaming-pc',
  },
  {
    id: 'x3d',
    title: 'What is X3D?',
    blurb: 'Why extra cache on the chip means more frames in games.',
    readTime: `${PH} min read`,
    href: '/guides/what-is-x3d',
  },
  {
    id: 'am5',
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
  { id: 'compare', text: `Comparison with Intel, NVIDIA and Apple systems: ${PH_SOURCE}`, date: null },
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

export const mobileBar = {
  whereToBuy: 'Where to buy',
  pick: 'Pick your build',
  yours: 'Your build',
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
};

export const newBuildPage = {
  eyebrow: 'A new gaming PC',
  title: 'Your first gaming PC, sorted',
  sub: 'Pick your budget and your main game. We’ll show three builds and the frames you’ll get.',
  budgetLabel: 'Your budget',
  budgets: [
    { id: 'b1', label: '₹40–60k' },
    { id: 'b2', label: '₹60–80k' },
    { id: 'b3', label: '₹80k–1L' },
  ],
  gameLabel: 'Your main game',
  recommended: 'Fits your budget',
  fpsAt: 'at 1080p',
  builds: [
    {
      id: 'starter',
      name: 'Starter',
      budgetId: 'b1',
      parts: ['Ryzen 5 8600G (graphics built in)', `AM5 board ${PH}`, `${PH} GB DDR5`, `${PH} GB SSD`],
      price: null as Rupees,
      fps: emptyFps(),
    },
    {
      id: 'balanced',
      name: 'Balanced',
      budgetId: 'b2',
      parts: ['Ryzen 5 7500F', 'Radeon RX 9060 XT', `AM5 board ${PH}`, `${PH} GB DDR5`],
      price: null as Rupees,
      fps: emptyFps(),
    },
    {
      id: 'max',
      name: 'Max 1080p',
      budgetId: 'b3',
      parts: ['Ryzen 5 7500F', `Radeon RX 9060 XT ${PH} GB`, `AM5 board ${PH}`, `${PH} GB DDR5`],
      price: null as Rupees,
      fps: emptyFps(),
    },
  ],
  whyTitle: 'Why AMD here?',
  why: [
    `The Ryzen 5 8600G runs ${PH} at 1080p with no graphics card. ${PH_SOURCE}`,
    `AM5 boards are supported through ${PH}, so you can upgrade the chip later. ${PH_SOURCE}`,
    `Ryzen 5 7500F + RX 9060 XT: ${PH} FPS in ${PH} at 1080p. ${PH_SOURCE}`,
  ],
  saveCta: 'Save this build',
  shareCta: 'Share build',
  alertCta: 'Get a sale alert',
};

export const upgradePage = {
  eyebrow: 'Upgrade one part',
  title: 'Will it fit? Check in 10 seconds',
  sub: 'Tell us your board and power supply. We’ll tell you if the part fits and what to do first.',
  partLabel: 'Part you want',
  boardLabel: 'Your motherboard',
  psuLabel: 'Your power supply',
  checkCta: 'Check fit',
  parts: [
    {
      id: '5700x3d',
      name: 'Ryzen 7 5700X3D',
      kind: 'cpu' as const,
      socket: 'AM4' as const,
      /** Recommended PSU wattage for a typical system with this part. `null` = check spec sheet. */
      recommendedPsuW: null as number | null,
    },
    {
      id: 'rx9070',
      name: 'Radeon RX 9070',
      kind: 'gpu' as const,
      socket: null,
      recommendedPsuW: null as number | null,
    },
  ],
  boards: [
    { id: 'a520', label: 'AM4 · A520', socket: 'AM4' as const },
    { id: 'b450', label: 'AM4 · B450 / X470', socket: 'AM4' as const },
    { id: 'b550', label: 'AM4 · B550 / X570', socket: 'AM4' as const },
    { id: 'am5', label: 'AM5 · B650 / X670 / B850', socket: 'AM5' as const },
    { id: 'intel', label: 'Intel board', socket: 'other' as const },
  ],
  psus: [
    { id: '450', label: '450 W', watts: 450 },
    { id: '550', label: '550 W', watts: 550 },
    { id: '650', label: '650 W', watts: 650 },
    { id: '750', label: '750 W+', watts: 750 },
  ],
  results: {
    fits: 'Fits',
    check: 'Fits — check one thing',
    no: 'Doesn’t fit this board',
    cpuSocketOk: 'Same AM4 socket: drop-in swap.',
    cpuSocketNo: 'This processor needs an AM4 board. Look at an AM5 build instead.',
    gpuSlotOk: 'Uses a standard PCIe x16 slot. Check case length: card is [__] mm.',
    psuUnknown: `Recommended PSU: ${PH} W. Check AMD’s spec sheet before you buy.`,
    psuOk: 'Your PSU meets the recommended wattage.',
    psuLow: 'Your PSU is below the recommended wattage. Plan a PSU upgrade.',
    biosNote: `BIOS note: update your board to BIOS ${PH} or later before you swap the chip. ${PH_SOURCE}`,
    gpuBiosNote: `Driver note: install AMD Software ${PH} or later. ${PH_SOURCE}`,
  },
  beforeAfterTitle: 'Before / after FPS',
  beforeLabel: `Now (${PH})`,
  afterLabel: 'After upgrade',
  beforeAfter: [
    { game: 'Valorant', before: null as Fps, after: null as Fps },
    { game: 'CS2', before: null as Fps, after: null as Fps },
    { game: 'GTA V', before: null as Fps, after: null as Fps },
  ],
  beforeAfterSource: { name: PH_SOURCE, date: null as string | null },
  stockTitle: 'Price and stock',
  stockCols: ['Seller', 'Price', 'Stock', ''],
  stock: [
    { seller: `Specialist e-tailer ${PH}`, price: null as Rupees, stock: `${PH}`, href: 'https://example.com/specialist-etailer-[__]' },
    { seller: `Specialist e-tailer ${PH}`, price: null as Rupees, stock: `${PH}`, href: 'https://example.com/specialist-etailer-[__]' },
    { seller: 'Amazon', price: null as Rupees, stock: `${PH}`, href: 'https://www.amazon.in/s?k=AMD+Ryzen+7+5700X3D' },
  ],
  stockCta: 'View',
  saveFitCta: 'Save my fit result',
  alertCta: 'Alert me when it’s in stock',
};

export const workPlayPage = {
  eyebrow: 'Work, creating and gaming',
  title: 'One PC for the day job and the night games',
  sub: 'Two builds for editing, 3D and streaming that still run every game. Compared honestly, with dates.',
  builds: [
    {
      id: 'creator',
      name: 'Creator',
      parts: ['Ryzen 9 9900X', 'Radeon RX 9070 XT', `${PH} GB DDR5`, `${PH} TB NVMe`],
      price: null as Rupees,
      highlights: [`${PH} export in ${PH} min ${PH_SOURCE}`, `${PH} FPS at 1440p in ${PH} ${PH_SOURCE}`],
    },
    {
      id: 'pro',
      name: 'Professional',
      parts: ['Ryzen 9 9950X3D', 'Radeon RX 9070 XT', `${PH} GB DDR5`, `${PH} TB NVMe`],
      price: null as Rupees,
      highlights: [`${PH} render in ${PH} min ${PH_SOURCE}`, `${PH} FPS at 1440p in ${PH} ${PH_SOURCE}`],
    },
  ],
  compare: {
    title: 'Ryzen vs NVIDIA vs Mac, honestly',
    sub: 'Like-for-like price brackets. Where the others win, we say so.',
    columns: ['AMD Ryzen + Radeon', 'PC with NVIDIA graphics', 'Mac'],
    rows: [
      { label: 'Price as tested', values: [`₹${PH}`, `₹${PH}`, `₹${PH}`] },
      { label: 'Gaming, 1440p avg FPS', values: [PH, PH, PH] },
      { label: '4K video export', values: [`${PH} min`, `${PH} min`, `${PH} min`] },
      { label: '3D render', values: [`${PH} min`, `${PH} min`, `${PH} min`] },
      { label: 'Upgrade later', values: [PH, PH, PH] },
      { label: 'Where it wins', values: [PH, PH, PH] },
    ],
    source: PH_SOURCE,
    date: null as string | null,
  },
  specSheet: { label: 'Download spec sheet (PDF)', href: '/placeholders/spec-sheet.pdf' },
  alertCta: 'Get a sale alert for these builds',
  shareCta: 'Share builds',
};

export const notFound = {
  title: 'This page is on its way',
  sub: 'Guides are being written. Head back to pick your build.',
  cta: 'Back to home',
};
