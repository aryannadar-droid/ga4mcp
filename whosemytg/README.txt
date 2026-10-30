WHOSEMYTG v0.4.0 - how to load it in Chrome

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
9. Pick how many TGs (2-5), then click "Find my TGs". Chrome asks once per site to allow reading it: click Allow.
10. Wait 20-60 seconds. You get:
    - The lineup: every TG ranked by a 0-5 star buy-intent score (half stars allowed).
      The top one is flagged "Hottest TG": the persona the brand sells to even if the others don't bite.
    - A card per TG with tabs: Who / Why buy / Pitch (lead line + a mock landing-page hero) / Fine print.
    - The receipts: candidates considered, merges and the overlap check.
    - Sources & citation checklist: every page the AI read (open tab or fetched, characters used),
      which claims cite it, and pages it tried but couldn't read. Reasons show p1/p2 chips that
      jump to their source; a struck-through red chip means the AI cited a page that doesn't exist.
      Tick each page once you've checked it against the live site.
11. Copy as text, or download the HTML report (open it and print to PDF if needed).

Good to know:
- Keys are stored only in this browser (chrome.storage.local). They are sent only to the provider you picked.
- Only public website content is sent to the AI. Do not paste confidential client data into the gossip box:
  some free tiers may use submitted content to train their models.
- Every reason is tagged "Straight from the site", "Educated guess" or "Client said so". Validate guesses with GA4 or client data.
- Star ratings are the AI's judgement of buy-intent from the site, not measured data.
- Groq's free tier reads less of each site (per-minute token cap). Use Gemini or a paid key for big sites.
- Sites that load their content with JavaScript can come back thin. The extension reads the page you have open as rendered, plus a few other pages fetched directly.
- Settings > "How it thinks" explains the steps in plain English and shows the exact instructions sent to the AI.
- To change how TGs are locked or rated, edit prompt.js. To add a provider, add an entry to PROVIDERS in providers.js.
