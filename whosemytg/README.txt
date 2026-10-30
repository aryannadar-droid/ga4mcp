WHOSEMYTG v0.6.1 - how to load it in Chrome

1. Unzip this folder somewhere permanent (Chrome reads from it every time, so don't delete it).
2. In Chrome, open chrome://extensions
3. Turn on "Developer mode" (top right).
4. Click "Load unpacked" and choose the unzipped whosemytg folder.
   Updating from v0.2? Remove the old one first. Your saved Groq / Gemini keys carry over
   only if you load the new folder over the old one (same folder path).
5. Click the puzzle-piece icon in the toolbar and pin "WhoseMyTG".

First-time setup (once per person): bring your own AI key
6. Click the WhoseMyTG icon. Settings opens. Pick ANY provider and paste your own key:
   - Groq (free):         https://console.groq.com/keys
   - Google Gemini (free): https://aistudio.google.com/apikey
   - Mistral (free tier): https://console.mistral.ai/api-keys
   - OpenAI:              https://platform.openai.com/api-keys
   - Anthropic Claude:    https://console.anthropic.com/settings/keys
   - OpenRouter:          https://openrouter.ai/keys  (one key, hundreds of models)
   - DeepSeek:            https://platform.deepseek.com/api_keys
   - xAI Grok:            https://console.x.ai
   - Custom: any OpenAI-compatible endpoint (Together, Fireworks, LM Studio, Ollama...).
     Enter its base URL, e.g. https://api.together.xyz/v1 or http://localhost:11434/v1
   You can save keys for several providers; a green dot shows which ones have a key.
   The selected one does the work.
7. Optional: click "Load my models" and pick a model if the default ever stops working.

Using it:
8. Open the brand's homepage in the tab.
9. Pick how many TGs (2-5), the market and the copy language, then click "Find my TGs". Chrome asks once per site to allow reading it: click Allow.
10. Wait 20-60 seconds. Results come in three views (switch at the top): TGs, Toolkit, Sources.
    Tap a TG row to open it; kit results open full-panel with a back button. The panel stays light on purpose:
    the full detail is in Export. You get:
    - The lineup: every TG ranked by a 0-5 star buy-intent score (half stars allowed).
      The top one is flagged "Hottest TG": the persona the brand sells to even if the others don't bite.
    - A card per TG with tabs: Who / Why buy / Pitch (lead line + a mock landing-page hero) / Fine print.
    - The receipts: candidates considered, merges and the overlap check.
    - Sources & citation checklist: every page the AI read (open tab or fetched, characters used),
      which claims cite it, and pages it tried but couldn't read. Reasons show p1/p2 chips that
      jump to their source; a struck-through red chip means the AI cited a page that doesn't exist.
      Tick each page once you've checked it against the live site.
11. Work the cards. Each TG card has three buttons in its title bar:
    - Edit: click any text to change it, set the stars, hit the tick when done.
    - Lock: "Run it again" keeps locked TGs and only finds new ones around them.
    - Re-roll: swaps just this TG for a fresh one that doesn't overlap the rest.
12. The toolkit: one click per department. Each is a separate, smaller AI request built on your TGs.
    - Media kit: Google headlines (30) and descriptions (90), Meta primary text (125) and headlines (40),
      YouTube 5-second hooks. Character counts on every line; anything over the limit turns red.
    - SEO kit: search phrases per TG grouped by intent, content gaps (TGs with no page written for them),
      an on-page check of the title / meta description / H1 against the hottest TG, and FAQ schema (JSON-LD).
    - CRO kit: message-match score (0-100) for the open page vs each TG, objection map, test hypotheses
      scored by ICE (impact, confidence, ease), and a heuristic audit (value prop above the fold, CTA clarity,
      trust signals, form/checkout friction).
    - Design kit: visual direction per TG (tone, imagery do's and don'ts, colour palette) and a
      section-by-section landing page outline.
    - Annotate my screen: scroll the brand's page to the part you care about, click it, and get numbered notes
      pinned on a screenshot. Chrome may ask once for permission to take the screenshot.
13. Export (bottom bar): Slides (.pptx, opens in PowerPoint, Keynote, or Google Slides via File > Import slides),
    Google Docs (copies it formatted; paste into a new Doc), Report (.html, print to PDF), or plain text.
14. History (clock icon): every run is saved with its kits and edits, the last 8 per brand, in this browser only.
    Open an old run, or tick two and compare them.

Good to know:
- Keys are stored only in this browser (chrome.storage.local). They are sent only to the provider you picked.
- Only public website content is sent to the AI. Do not paste confidential client data into the gossip box:
  some free tiers may use submitted content to train their models.
- Every reason is tagged "Straight from the site", "Educated guess" or "Client said so". Validate guesses with GA4 or client data.
- Star ratings, message-match scores and ICE scores are the AI's judgement from the site, not measured data.
- Search phrases have no volumes: check them in your keyword tool before planning around them.
- Groq's free tier reads less of each site (per-minute token cap). Use Gemini or a paid key for big sites.
- Sites that load their content with JavaScript can come back thin. The extension reads the page you have open as rendered, plus a few other pages fetched directly.
