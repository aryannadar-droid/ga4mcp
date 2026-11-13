/**
 * NEW_HOME_V2 content: every string, stat and sample record for the new homepage layer.
 * The locked src/content.ts is only read from here (product names, builds, listings), never edited.
 *
 * Voice: second person, confident, one idea per screen. Any jargon gets a plain-words line.
 */
import type { BuildId, PersonaId, ProductId, SellerId } from '../content';

/* ------------------------------------------------------------------ */
/* 1 · Hero                                                            */
/* ------------------------------------------------------------------ */

export const heroV2 = {
  eyebrow: 'Ryzen + Radeon · made for how India games',
  /** The word in `accent` is drawn in orange. */
  headline: 'You already play on AMD.',
  accent: 'AMD',
  sub: 'The same AMD chips inside PlayStation 5, Xbox Series X|S and Steam Deck power India’s fastest gaming PCs. Tell us what you play; we’ll show you what it takes.',
  primary: 'Will my game run?',
  secondary: '60-second story',
  tags: [
    { title: '3D V-Cache', line: 'extra memory on the chip' },
    { title: 'AM5 socket', line: 'upgrade, don’t replace' },
    { title: 'Plays on', line: 'PC · Console · Handheld' },
  ],
  chipLabel: 'RYZEN',
};

/* ------------------------------------------------------------------ */
/* 2 · Presence band                                                   */
/* ------------------------------------------------------------------ */

export interface Stat {
  id: string;
  /** Number that counts up. */
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with a comma (3,000). */
  grouped?: boolean;
  label: string;
  source: string;
}

export const presence = {
  title: 'AMD is everywhere you play.',
  sub: 'Most players just don’t know it.',
  /** Figures and sources as supplied in the brief. Verify against the cited source before launch. */
  stats: [
    { id: 'ps5', value: 97.9, decimals: 1, suffix: 'M', label: 'PlayStation 5 consoles shipped, each running on an AMD chip', source: 'Sony, to 30 Sep 2026' },
    { id: 'steam', value: 45, suffix: '%', label: 'of Steam’s Windows gamers use a Ryzen processor', source: 'Steam Hardware Survey, May 2026' },
    { id: 'blr', value: 3000, grouped: true, label: 'engineers planned at AMD’s largest global design centre, in Bengaluru', source: 'AMD, 2023' },
    { id: 'india', value: 4, prefix: '1 in ', label: 'AMD employees worldwide work in India', source: 'AMD, 2023' },
  ] as Stat[],
};

/* ------------------------------------------------------------------ */
/* 3 · Doors                                                           */
/* ------------------------------------------------------------------ */

export const doorsV2 = {
  title: 'What are you building?',
  doors: [
    { id: 'new-build' as PersonaId, letter: 'A', title: 'New gaming PC', line: 'My first proper gaming PC' },
    { id: 'upgrade' as PersonaId, letter: 'B', title: 'Upgrade one part', line: 'More frames from the PC I have' },
    { id: 'work-play' as PersonaId, letter: 'C', title: 'Work + play', line: 'One PC to create, work and game' },
  ],
};

/* ------------------------------------------------------------------ */
/* 4 · Will my game run?                                               */
/* ------------------------------------------------------------------ */

export type Screen = '1080p' | '1440p' | '4k';
export type BudgetBand = '40-60' | '60-100' | '100+';
/** How hard a game works the PC: 0 light (esports) · 1 medium · 2 heavy. */
type Weight = 0 | 1 | 2;

export const gameCheck = {
  title: 'Will my game run?',
  sub: 'Pick your games, your screen and your budget. We’ll match a Ryzen + Radeon pair.',
  gamesLabel: 'Your games',
  more: '+ more',
  less: 'Fewer games',
  games: [
    { id: 'valorant', name: 'Valorant', weight: 0 as Weight },
    { id: 'cs2', name: 'CS2', weight: 0 as Weight },
    { id: 'gtav', name: 'GTA V', weight: 1 as Weight },
    { id: 'fortnite', name: 'Fortnite', weight: 1 as Weight },
    { id: 'apex', name: 'Apex Legends', weight: 1 as Weight },
  ],
  moreGames: [
    { id: 'minecraft', name: 'Minecraft', weight: 0 as Weight },
    { id: 'forza5', name: 'Forza Horizon 5', weight: 1 as Weight },
    { id: 'warzone', name: 'Call of Duty: Warzone', weight: 2 as Weight },
    { id: 'cyberpunk', name: 'Cyberpunk 2077', weight: 2 as Weight },
  ],
  screenLabel: 'Your screen',
  screens: [
    { id: '1080p' as Screen, label: '1080p' },
    { id: '1440p' as Screen, label: '1440p' },
    { id: '4k' as Screen, label: '4K' },
  ],
  budgetLabel: 'Your budget',
  budgets: [
    { id: '40-60' as BudgetBand, label: '₹40–60k' },
    { id: '60-100' as BudgetBand, label: '₹60k–1L' },
    { id: '100+' as BudgetBand, label: '₹1L+' },
  ],
  submit: 'Check my games',
  update: 'Check again',
  pickGame: 'Pick at least one game.',
  resultTitle: 'Your match',
  stretch: 'A step above your budget for this screen',
  /** Budget × screen → build (ids from the locked builds catalogue). Edit to change the matching. */
  recommend: {
    '40-60': { '1080p': { build: 'a1' }, '1440p': { build: 'a2', stretch: true }, '4k': { build: 'a2', stretch: true } },
    '60-100': { '1080p': { build: 'a2' }, '1440p': { build: 'a3' }, '4k': { build: 'a3' } },
    '100+': { '1080p': { build: 'c-creator' }, '1440p': { build: 'c-creator' }, '4k': { build: 'c-creator' } },
  } as Record<BudgetBand, Record<Screen, { build: BuildId; stretch?: boolean }>>,
  /** Rough capability tier per build, for the illustrative plain-words bars only. */
  tier: { a1: 1, a2: 2, a3: 3, b1: 2, b2: 3, 'c-pro': 3, 'c-creator': 4 } as Record<BuildId, number>,
  screenLoad: { '1080p': 0, '1440p': 1, '4k': 2 } as Record<Screen, number>,
  levels: [
    { min: 3, label: 'Very smooth', fill: 1 },
    { min: 2, label: 'Smooth', fill: 0.75 },
    { min: 1, label: 'Playable', fill: 0.5 },
    { min: -9, label: 'Lower settings', fill: 0.3 },
  ],
  illustrative: 'Illustrative; live version shows AMD-tested figures.',
  /** Builds whose processor has 8+ cores get the streaming line. */
  streamingBuilds: ['c-pro', 'c-creator', 'b1'] as BuildId[],
  streamingYes: 'Comfortable for streaming while you play',
  streamingMaybe: 'Streaming while you play works at lighter settings; an 8-core Ryzen makes it comfortable',
  builtInGpu: 'Radeon 760M (built in)',
  fullBuild: 'See the full build →',
  save: 'Save',
  saved: 'Saved on this device',
  whatsapp: 'Share on WhatsApp',
  shareText: 'My AMD gaming PC match',
};

/* ------------------------------------------------------------------ */
/* 5 · Know what you're getting                                        */
/* ------------------------------------------------------------------ */

/** Literal paths so the single-file build can inline them. Swap for the real videos. */
const VIDEO = {
  explainer: { webm: '/placeholders/explainer-30s.webm', mp4: '/placeholders/explainer-30s.mp4' },
  story: { webm: '/placeholders/story-60s.webm', mp4: '/placeholders/story-60s.mp4' },
};
export type VideoSrc = { webm: string; mp4: string };

export const explainers = {
  title: 'Know what you’re getting',
  sub: 'Three ideas, thirty seconds each.',
  play: 'Play',
  cards: [
    { id: 'x3d', title: '3D V-Cache', hook: 'Why an X3D chip feels smoother in games', line: 'Extra memory sits on the chip, so game data waits less and frames arrive more evenly.', duration: '0:30', src: VIDEO.explainer as VideoSrc },
    { id: 'am5', title: 'AM5', hook: 'The board you buy today takes tomorrow’s Ryzen', line: 'Keep your board and memory; swap in a newer processor later.', duration: '0:30', src: VIDEO.explainer as VideoSrc },
    { id: 'fsr4', title: 'FSR 4', hook: 'More frames in the games that support it', line: 'Smart upscaling draws fewer pixels, then sharpens the picture, so games run faster.', duration: '0:30', src: VIDEO.explainer as VideoSrc },
  ],
  story: { id: 'story', title: 'Your AMD story, in 60 seconds', src: VIDEO.story as VideoSrc },
  close: 'Close video',
  placeholderNote: 'Placeholder video.',
};

/* ------------------------------------------------------------------ */
/* 6 · Builds from India's creators                                    */
/* ------------------------------------------------------------------ */

export interface CreatorBuild {
  id: string;
  handle: string;
  useCase: string;
  city: string;
  cpu: ProductId;
  gpu: ProductId | 'none';
}

export const creatorsIntro = {
  title: 'Builds from India’s creators',
  sub: 'Real setups, ready to copy.',
  copy: 'Copy build',
  copied: 'Link copied',
  save: 'Save',
  saved: 'Saved',
  sampleTag: 'Sample',
};

/*
 * SAMPLE DATA — placeholder creators, not real people. Replace every record with a real,
 * consenting creator's build (handle, use case, city, parts) before launch.
 */
export const creatorBuilds: CreatorBuild[] = [
  { id: 'sample-1', handle: '@sample.valorant', useCase: 'Valorant streamer', city: 'Pune', cpu: 'r7-5700x3d', gpu: 'rx-9060xt-16' },
  { id: 'sample-2', handle: '@sample.editor', useCase: 'Video editor + weekend gamer', city: 'Mumbai', cpu: 'r9-9900x', gpu: 'rx-9070xt' },
  { id: 'sample-3', handle: '@sample.student', useCase: 'First PC, college gamer', city: 'Jaipur', cpu: 'r5-8600g', gpu: 'none' },
  { id: 'sample-4', handle: '@sample.3dartist', useCase: '3D artist who games', city: 'Bengaluru', cpu: 'r9-9950x3d', gpu: 'rx-9070xt' },
  { id: 'sample-5', handle: '@sample.esports', useCase: 'CS2 team practice rig', city: 'Delhi', cpu: 'r5-7500f', gpu: 'rx-9060xt-8' },
];

/* ------------------------------------------------------------------ */
/* 7 · Find a seller                                                   */
/* ------------------------------------------------------------------ */

export const findSeller = {
  title: 'Find a seller',
  sub: 'Verified partners, each linking straight to the product page.',
  forProduct: 'Links go to',
  /** Partner type sent with partner_click. */
  types: { amazon: 'marketplace', flipkart: 'marketplace', specialist: 'specialist', builder: 'builder' } as Record<SellerId, string>,
  /** Product the links open when no game check or persona has picked one. */
  defaultProduct: 'r7-5700x3d' as ProductId,
};

/* ------------------------------------------------------------------ */
/* Phone bottom bar                                                    */
/* ------------------------------------------------------------------ */

export const phoneBar = {
  check: 'Will my game run?',
  seller: 'Find a seller',
};

export const anchors = {
  check: 'v2-game-check',
  seller: 'v2-find-seller',
  presence: 'v2-presence',
};
