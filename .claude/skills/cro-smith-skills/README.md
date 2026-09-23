# CRO Smith Skills

A Claude Code skill for client-grade conversion work: audits, pitches, experiment programmes, personalisation, and retail journeys where the sale closes in a store.

It combines the core CRO method (funnel economics, value-ranked recommendations, hand-off to A/B testing) with what we learned building the GRT Jewellers pitch:

- **Pre-flight** before any diagnosis: is the product actually on the shelf, and can the analytics be trusted?
- **Category split**: every journey uses both the site and the store — only the priority changes by category
- **Intent × persona × buying behaviour × journey-point audit** instead of a page-by-page walk
- **Store intent** as a first-class conversion for any business with physical locations
- **Design and system thinking**, both for auditing pages and for building our own decks
- **Live evidence** gathered with Playwright, and every claim labelled MEASURED / TO VALIDATE / HYPOTHESIS

---

## Install (5 minutes)

**1. Copy the folder into your Claude skills directory**

- Personal (all your projects): `~/.claude/skills/cro-smith-skills/`
  - Windows: `C:\Users\<you>\.claude\skills\cro-smith-skills\`
  - Mac: `/Users/<you>/.claude/skills/cro-smith-skills/`
- Or per project: `<project>/.claude/skills/cro-smith-skills/`

The folder must contain `SKILL.md` at its top level.

**2. Install Playwright for the scripts** (only needed for live evidence gathering)

```bash
cd ~/.claude/skills/cro-smith-skills/scripts
npm install
npx playwright install chromium
```

**3. Restart Claude Code.** The skill appears as `/cro-smith-skills`, and also triggers on its own when you ask about CRO, conversion, audits, add-to-cart, store visits, personalisation or A/B test plans.

---

## Use

```
/cro-smith-skills audit https://example.com — mobile, focus on the product page and cart
/cro-smith-skills build a CRO pitch for <client> using these GA4 exports
```

Or just share a URL and ask why it isn't converting.

## The scripts (run them directly too)

| Script | What it tells you |
|---|---|
| `node scripts/design-probe.js <url>` | Type scale, colours, heading structure, % of tap targets under 44px, contrast failures, missing alt text |
| `node scripts/band-scan.js <listing-url> --band 15000-25000` | What share of the listing sits in a target price band, the median, and what the default sort opens with |
| `node scripts/site-evidence.js <homepage> --sitemap --sample 40` | Third-party tag count, consent prompt, session-recording tools, and the soft-404 rate across a sitemap sample |
| `node scripts/shoot.js jobs.json --out shots` | Deck-ready 2× mobile screenshots, with clicks and scroll positions |

All scripts audit on a 390px mobile viewport, because that's where the traffic is.

---

## What's inside

```
cro-smith-skills/
├── SKILL.md                         the playbook Claude follows
├── README.md                        this file
├── references/
│   ├── preflight.md                 assortment + measurement integrity checks
│   ├── funnel-economics.md          revenue equation, leak vs lever, value math
│   ├── intent-journey-matrix.md     persona × intent × behaviour × journey audit
│   ├── store-intent.md              offline conversions, exposure → intent → visit → bill
│   ├── design-system.md             design audit rubric + our deck design system
│   ├── evidence-toolkit.md          live-capture recipes and their caveats
│   ├── experiments.md               experiment ideas by page type
│   ├── form.md                      form optimisation
│   └── deck-build.md                building decks as code, with review loop
└── scripts/
    ├── package.json
    ├── _pw.js                       shared Playwright loader
    ├── design-probe.js
    ├── band-scan.js
    ├── site-evidence.js
    └── shoot.js
```

## Notes

- Examples in the references cite the GRT Jewellers engagement. Keep this skill internal to Schbang.
- If Playwright can't be found, set `PLAYWRIGHT_PATH` to any `node_modules/playwright` folder.
- Some sites block headless browsers. The skill is written to report exactly what was captured and claim nothing more.
