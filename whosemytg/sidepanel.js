// Side panel logic: settings drawer, site reading, the analyze flow and rendering.
// Depends on prompt.js (SYSTEM_PROMPT, buildUserPrompt), lib.js (helpers) and providers.js (AI calls).

const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

let lastReport = null;
let lastMeta = null;

// ---------- copy ----------

const TAGLINES = [
  "Who's actually going to buy this?",
  "Persona research, minus the 40-slide deck.",
  "Because \"everyone aged 18-45\" is not a TG.",
  "Finding your buyers before your coffee cools.",
  "Your brand's customers, decoded.",
];

const TG_HINTS = {
  2: "Tight and focused. Love that for you.",
  3: "The sweet spot. Goldilocks approves.",
  4: "Ambitious. We respect it.",
  5: "Full squad. Overlap police on high alert.",
};

const QUIPS = [
  "Reading the About page so you don't have to.",
  "Asking the homepage some personal questions.",
  "Separating window-shoppers from wallet-openers.",
  "Merging personas who'd wear the same outfit.",
  "Running the \"could one human be both?\" test.",
  "Handing out stars. Not everyone gets five.",
  "Politely ignoring the cookie banner.",
  "Labelling guesses as guesses. We're honest like that.",
  "Checking nobody sneaks into two TGs.",
  "Writing ad angles that aren't \"Introducing...\"",
];

const FOOTNOTES = [
  "P.S. \"Educated guess\" means exactly that. Validate with GA4 or client data before you bet the media budget on it.",
  "P.S. Stars rate buy-intent for this brand, not how nice the people are. Everyone's lovely.",
  "P.S. Only public website text gets sent to your AI provider. Your key never leaves this browser.",
];

const ERROR_TITLES = ["Plot twist.", "Well, that didn't go to plan.", "Hmm. Small hiccup."];

// ---------- settings ----------

const settingsCache = { provider: "groq", keys: {}, models: {}, customBase: "", tgCount: 3 };

async function getSettings() {
  const s = await chrome.storage.local.get({
    provider: "groq",
    keys: null,
    models: null,
    customBase: "",
    tgCount: 3,
    // v0.2 keys, migrated below
    apiKey: "",
    model: "",
    groqKey: "",
    groqModel: "",
  });
  if (!s.keys) {
    s.keys = { groq: s.groqKey || "", gemini: s.apiKey || "" };
    s.models = { groq: s.groqModel || "", gemini: s.model || "" };
    await chrome.storage.local.set({ keys: s.keys, models: s.models });
    await chrome.storage.local.remove(["apiKey", "model", "groqKey", "groqModel"]);
  }
  s.models = s.models || {};
  if (!PROVIDERS[s.provider]) s.provider = "groq";
  Object.assign(settingsCache, s);
  return settingsCache;
}

function modelFor(id, s) {
  return (s.models && s.models[id]) || PROVIDERS[id].model;
}

function isReady(id, s) {
  const p = PROVIDERS[id];
  if (id === "custom") return !!(s.customBase && modelFor(id, s));
  return p.keyOptional || !!(s.keys && s.keys[id]);
}

function renderPill() {
  const s = settingsCache;
  const pill = $("providerPill");
  if (!isReady(s.provider, s)) {
    pill.textContent = "Add an AI key";
    pill.classList.add("empty");
  } else {
    pill.textContent = PROVIDERS[s.provider].label.split(" ").pop();
    pill.title = `${PROVIDERS[s.provider].label} · ${modelFor(s.provider, s)}. Click to change.`;
    pill.classList.remove("empty");
  }
}

// ---------- settings drawer ----------

let draft = null; // edits in the drawer before Save

function renderProviders() {
  const box = $("providers");
  box.innerHTML = "";
  PROVIDER_ORDER.forEach((id) => {
    const p = PROVIDERS[id];
    const b = el("button", "prov");
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(id === draft.provider));
    b.dataset.id = id;
    b.appendChild(el("b", null, p.label));
    b.appendChild(el("small", null, p.blurb));
    if (p.free) b.appendChild(el("span", "free", "Free tier"));
    if (draft.keys[id] || (id === "custom" && draft.customBase)) b.appendChild(el("span", "has-key"));
    b.addEventListener("click", () => {
      stashDraftInputs();
      draft.provider = id;
      renderProviders();
      fillDrawerInputs();
    });
    box.appendChild(b);
  });
}

function fillDrawerInputs() {
  const id = draft.provider;
  const p = PROVIDERS[id];
  $("apiKey").value = draft.keys[id] || "";
  $("apiKey").placeholder = p.keyOptional ? "Optional for local servers" : `Paste your ${p.label} key`;
  $("keyLabel").textContent = `${p.label} key`;
  $("keyLink").hidden = !p.keyUrl;
  $("keyLink").href = p.keyUrl || "#";
  $("model").value = draft.models[id] || p.model;
  $("model").placeholder = p.model || "model-name";
  $("customBox").hidden = id !== "custom";
  $("customBase").value = draft.customBase || "";
  $("modelList").innerHTML = "";
  setSettingsMsg("");
}

function stashDraftInputs() {
  const id = draft.provider;
  draft.keys[id] = $("apiKey").value.trim();
  const m = $("model").value.trim();
  draft.models[id] = m && m !== PROVIDERS[id].model ? m : "";
  if (id === "custom") draft.customBase = $("customBase").value.trim().replace(/\/+$/, "");
}

function setSettingsMsg(text, kind) {
  const m = $("settingsMsg");
  m.textContent = text || "";
  m.className = "micro msg" + (kind ? " " + kind : "");
}

function openDrawer() {
  const s = settingsCache;
  draft = {
    provider: s.provider,
    keys: { ...s.keys },
    models: { ...s.models },
    customBase: s.customBase || "",
  };
  renderProviders();
  fillDrawerInputs();
  $("drawer").hidden = false;
  $("scrim").hidden = false;
  setTimeout(() => $("apiKey").focus(), 50);
}

function closeDrawer() {
  $("drawer").hidden = true;
  $("scrim").hidden = true;
}

function originPattern(url) {
  return new URL(url).origin + "/*";
}

async function saveSettings() {
  stashDraftInputs();
  if (draft.provider === "custom") {
    if (!/^https?:\/\//.test(draft.customBase)) {
      setSettingsMsg("The custom base URL needs to start with http:// or https://", "err");
      return;
    }
    const origins = [originPattern(draft.customBase)];
    if (!(await chrome.permissions.contains({ origins }))) {
      const ok = await chrome.permissions.request({ origins });
      if (!ok) {
        setSettingsMsg("Chrome needs your OK to talk to that URL. Hit Save again and choose Allow.", "err");
        return;
      }
    }
  }
  await chrome.storage.local.set({
    provider: draft.provider,
    keys: draft.keys,
    models: draft.models,
    customBase: draft.customBase,
  });
  Object.assign(settingsCache, draft);
  renderPill();
  renderProviders();
  if (!isReady(draft.provider, draft)) {
    setSettingsMsg("Saved, but this provider still needs a key before it can do anything.", "err");
    return;
  }
  setSettingsMsg(`Saved. ${PROVIDERS[draft.provider].label} is now doing the thinking.`, "ok");
  setTimeout(closeDrawer, 900);
}

async function loadModels() {
  stashDraftInputs();
  const id = draft.provider;
  const key = draft.keys[id];
  if (!key && !PROVIDERS[id].keyOptional) {
    setSettingsMsg("Paste a key first. We can't window-shop without one.", "err");
    return;
  }
  if (id === "custom" && !draft.customBase) {
    setSettingsMsg("Add the base URL first.", "err");
    return;
  }
  setSettingsMsg("Knocking on the door...");
  try {
    const names = await listModels(id, key, draft);
    const list = $("modelList");
    list.innerHTML = "";
    names.forEach((n) => {
      const o = document.createElement("option");
      o.value = n;
      list.appendChild(o);
    });
    setSettingsMsg(`Key works. ${names.length} models on the menu. Click the Model box to pick one, then Save.`, "ok");
  } catch (e) {
    setSettingsMsg("Couldn't load models: " + e.message, "err");
  }
}

// ---------- the tab we're looking at ----------

async function updateTarget() {
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) {}
  const ok = tab && tab.url && /^https?:/.test(tab.url);
  $("siteName").textContent = ok ? new URL(tab.url).hostname.replace(/^www\./, "") : "Open a brand's website";
  const fav = $("favicon");
  if (ok && tab.favIconUrl && /^https?:|^data:/.test(tab.favIconUrl)) fav.src = tab.favIconUrl;
  else fav.removeAttribute("src");
}

// ---------- reading the site ----------

// Runs inside the live page (must be self-contained).
function extractFromLivePage() {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const meta = document.querySelector('meta[name="description"], meta[property="og:description"]');
  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => clean(h.innerText))
    .filter(Boolean)
    .slice(0, 40);
  const links = Array.from(document.querySelectorAll("a[href]"))
    .slice(0, 400)
    .map((a) => ({
      href: a.href,
      text: clean(a.innerText).slice(0, 80),
      inNav: !!a.closest("nav, header"),
    }));
  return {
    url: location.href,
    title: clean(document.title),
    description: meta ? clean(meta.getAttribute("content")) : "",
    headings,
    text: clean(document.body ? document.body.innerText : ""),
    links,
  };
}

function textFromHtml(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const meta = doc.querySelector('meta[name="description"], meta[property="og:description"]');
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3"))
    .map((h) => clean(h.textContent))
    .filter(Boolean)
    .slice(0, 30);
  doc.querySelectorAll("script, style, noscript, svg, iframe, nav, footer, form").forEach((n) => n.remove());
  const root = doc.querySelector("main") || doc.body;
  return {
    url,
    title: clean(doc.title),
    description: meta ? clean(meta.getAttribute("content")) : "",
    headings,
    text: clean(root ? root.textContent : ""),
  };
}

async function fetchPage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { credentials: "omit", signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) throw new Error("not HTML");
    return textFromHtml(await res.text(), url);
  } finally {
    clearTimeout(timer);
  }
}

async function readSite(tab, onNote, budget) {
  const origin = new URL(tab.url).origin;

  onNote("Reading the page you have open");
  const [{ result: live }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractFromLivePage,
  });
  const pages = [];
  const failed = [];
  const current = { ...live, text: live.text.slice(0, budget.home), via: "tab", total: live.text.length };
  delete current.links;
  pages.push(current);

  // Make sure we also have the homepage if the open tab is an inner page.
  const livePath = new URL(live.url).pathname.replace(/\/+$/, "") || "/";
  let candidates = pickPages(live.links, live.url, budget.extra);
  if (livePath !== "/") candidates = [origin + "/", ...candidates].slice(0, budget.extra);

  onNote(`Snooping through ${candidates.length} more pages`);
  const results = await Promise.allSettled(candidates.map(fetchPage));
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failed.push({ url: candidates[i], reason: r.reason && r.reason.name === "AbortError" ? "timed out" : (r.reason && r.reason.message) || "failed" });
    } else if (r.value.text.length <= 200) {
      failed.push({ url: candidates[i], reason: "almost no readable text" });
    } else {
      pages.push({ ...r.value, text: r.value.text.slice(0, budget.page), via: "fetched", total: r.value.text.length });
    }
  });
  return { origin, pages, failed };
}

// ---------- progress + toasts ----------

const progress = { t0: 0, step: "", timer: null, quipTimer: null };

function setStep(step) {
  progress.step = step;
  const order = ["read", "think", "lock"];
  const at = order.indexOf(step);
  document.querySelectorAll(".steps li").forEach((li) => {
    const i = order.indexOf(li.dataset.step);
    li.classList.toggle("done", i < at);
    li.classList.toggle("active", i === at);
  });
  tickProgress();
}

function tickProgress() {
  const s = (Date.now() - progress.t0) / 1000;
  $("timer").textContent = Math.round(s) + "s";
  let pct = 5;
  if (progress.step === "read") pct = Math.min(18, 5 + s * 3);
  if (progress.step === "think") pct = 20 + 70 * (1 - Math.exp(-progress.thinkS() / 25));
  if (progress.step === "lock") pct = 100;
  $("barFill").style.width = pct.toFixed(1) + "%";
}

function startProgress() {
  progress.t0 = Date.now();
  progress.thinkStart = 0;
  progress.thinkS = () => (progress.thinkStart ? (Date.now() - progress.thinkStart) / 1000 : 0);
  $("progress").hidden = false;
  $("readNote").textContent = "Reading the page you have open";
  $("thinkNote").textContent = "Drafting, merging, overlap-checking";
  const q = $("quip");
  q.textContent = pick(QUIPS);
  progress.timer = setInterval(tickProgress, 500);
  progress.quipTimer = setInterval(() => {
    q.style.opacity = 0;
    setTimeout(() => {
      let next = pick(QUIPS);
      while (next === q.textContent) next = pick(QUIPS);
      q.textContent = next;
      q.style.opacity = 1;
    }, 250);
  }, 3800);
  setStep("read");
}

function stopProgress() {
  clearInterval(progress.timer);
  clearInterval(progress.quipTimer);
  $("progress").hidden = true;
}

function showToast(title, body, isError) {
  const t = $("toast");
  t.innerHTML = "";
  t.appendChild(el("b", null, title));
  if (body) t.appendChild(el("span", null, body));
  t.className = "toast" + (isError ? " error" : "");
  t.hidden = false;
}

function hideToast() {
  $("toast").hidden = true;
}

// ---------- rendering ----------

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function html(tag, cls, markup) {
  const n = el(tag, cls);
  n.innerHTML = markup; // only ever called with starsHtml() output, which has no user text
  return n;
}

function kv(label, value) {
  if (!value) return null;
  const d = el("div", "kv");
  d.appendChild(el("b", null, label));
  d.appendChild(el("span", null, value));
  return d;
}

function append(parent, ...kids) {
  kids.forEach((k) => k && parent.appendChild(k));
  return parent;
}

function initials(name) {
  const w = String(name).replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase();
}

function winBar(title) {
  const bar = el("div", "win-bar");
  const dots = el("span", "dots");
  dots.append(el("i"), el("i"), el("i"));
  append(bar, dots, el("span", null, title));
  return bar;
}

function tagChip(tag) {
  const t = String(tag || "hypothesis").toLowerCase();
  return el("span", "tag-chip " + t, tagLabel(t));
}

function sectionTitle(title, aside) {
  const d = el("div", "section-title");
  append(d, el("h2", null, title), aside ? el("span", null, aside) : null);
  return d;
}

function renderBrand(r, meta) {
  const bs = r.brand_summary;
  const card = el("section", "win brand-card");
  card.appendChild(winBar("the_brand_decoded.txt"));
  const body = el("div", "win-body");
  append(body, el("span", "eyebrow", "The brand, decoded"), el("h2", null, bs.brand || new URL(meta.origin).hostname));
  const facts = el("div", "facts");
  append(facts, kv("What they sell", bs.what_they_sell), kv("How they position it", bs.positioning));
  if (bs.who_pays_vs_uses) {
    const pu = kv("Who pays vs who uses", bs.who_pays_vs_uses);
    pu.classList.add("fact");
    facts.appendChild(pu);
  }
  facts.querySelectorAll(".kv").forEach((k) => k.classList.add("fact"));
  body.appendChild(facts);
  if (bs.content_quality_note) body.appendChild(el("div", "note", "Heads-up: " + bs.content_quality_note));
  card.appendChild(body);
  return card;
}

function renderLineup(r) {
  const card = el("section", "win");
  card.appendChild(winBar("leaderboard.exe"));
  const ol = el("ol", "lineup");
  r.tgs.forEach((t, i) => {
    const li = el("li", t.hot ? "hot" : "");
    li.style.setProperty("--c", TG_COLORS[i % TG_COLORS.length]);
    const b = el("button");
    b.type = "button";
    const nm = el("span", "nm", t.name);
    nm.appendChild(el("small", null, t.hot ? "🔥 " + heatLabel(t.stars) : heatLabel(t.stars)));
    const right = el("span", "right");
    right.appendChild(html("span", null, starsHtml(t.stars)));
    const meter = el("span", "meter");
    const fill = el("i");
    fill.style.width = ((t.stars || 0) / 5) * 100 + "%";
    meter.appendChild(fill);
    append(right, el("span", "score", t.stars == null ? "–" : t.stars.toFixed(1) + " / 5"), meter);
    append(b, el("span", "avatar", String(i + 1)), nm, right);
    b.addEventListener("click", () => $("tg-" + i).scrollIntoView({ behavior: "smooth", block: "start" }));
    li.appendChild(b);
    ol.appendChild(li);
  });
  card.appendChild(ol);
  return card;
}

function whoPanel(t) {
  const p = el("div");
  append(p, kv("Their situation", t.situation));
  if (t.first_question) {
    append(p, el("b", "eyebrow", "First thought in their head"), el("div", "thought", `"${t.first_question.replace(/^"|"$/g, "")}"`));
  }
  const ps = el("div", "ps");
  append(ps, kv("The problem", t.problem), t.problem && t.solution ? el("div", "arrow-down", "↓") : null, kv("How this brand fixes it", t.solution));
  p.appendChild(ps);
  return p;
}

function whyPanel(t, meta) {
  const ol = el("ol", "reasons");
  t.reasons_to_buy.forEach((x, j) => {
    const li = el("li");
    const d = el("div");
    const role = el("div", "role");
    append(role, el("span", null, reasonRole(j)), tagChip(x.tag));
    append(d, role, el("span", null, x.reason));
    x.pages.forEach((n) => {
      const real = n <= ((meta && meta.pages) || []).length;
      const c = el("button", "cite" + (real ? "" : " bad"), "p" + n);
      c.type = "button";
      c.title = real ? "Jump to source page " + n : "The AI cited a page that doesn't exist. Treat this claim as unverified.";
      c.addEventListener("click", () => {
        const row = $("src-" + n);
        if (!row) return;
        $("sources").open = true;
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.remove("ping");
        void row.offsetWidth;
        row.classList.add("ping");
      });
      d.appendChild(c);
    });
    li.appendChild(d);
    ol.appendChild(li);
  });
  if (!t.reasons_to_buy.length) return el("p", "micro", "The AI forgot this bit. Rude. Try running it again.");
  return ol;
}

function pitchPanel(t, meta) {
  const p = el("div");
  if (t.lead_copy.line) {
    const q = el("blockquote", "quote", t.lead_copy.line);
    const small = el("small", null, t.lead_copy.tone ? "Tone: " + t.lead_copy.tone : "Lead line");
    const c = el("button", "copy-mini", "Copy line");
    c.type = "button";
    c.addEventListener("click", async () => {
      await navigator.clipboard.writeText(t.lead_copy.line);
      c.textContent = "Copied ✓";
      setTimeout(() => (c.textContent = "Copy line"), 1400);
    });
    small.appendChild(c);
    q.appendChild(small);
    p.appendChild(q);
  }
  const h = t.landing_page_hero;
  if (h.headline || h.subhead || h.cta) {
    p.appendChild(el("b", "eyebrow", "Landing page hero, roughly"));
    const lp = el("div", "lp");
    const bar = el("div", "lp-bar");
    const dots = el("span", "dots");
    dots.append(el("i"), el("i"), el("i"));
    append(bar, dots, el("span", "url", new URL(meta.origin).hostname.replace(/^www\./, "") + "/for-you"));
    const body = el("div", "lp-body");
    append(body, h.headline ? el("h4", null, h.headline) : null, h.subhead ? el("p", null, h.subhead) : null, h.cta ? el("span", null, h.cta) : null);
    append(lp, bar, body);
    p.appendChild(lp);
  }
  append(p, kv("Ad angle", t.ad_angle), kv("Offer to push", t.offer));
  return p;
}

function finePanel(t) {
  const p = el("div");
  if (t.not_this_tg_if) {
    const w = el("div", "wrong-door");
    append(w, el("b", "eyebrow", "Wrong door if…"), el("span", null, t.not_this_tg_if.replace(/^not this tg if[:,]?\s*/i, "")));
    p.appendChild(w);
  }
  if (t.flags_for_signoff.length) {
    const f = el("div", "flags");
    f.appendChild(el("b", null, "Run past the client first"));
    const ul = el("ul");
    t.flags_for_signoff.forEach((x) => ul.appendChild(el("li", null, x)));
    f.appendChild(ul);
    p.appendChild(f);
  } else {
    p.appendChild(el("p", "micro", "No risky claims spotted. Legal can finish their coffee."));
  }
  const ev = el("p", "micro");
  ev.append("Overall evidence: ", tagChip(t.evidence));
  p.appendChild(ev);
  return p;
}

function renderTg(t, i, meta) {
  const card = el("section", "win tg" + (t.hot ? " hot" : ""));
  card.id = "tg-" + i;
  card.style.setProperty("--c", TG_COLORS[i % TG_COLORS.length]);
  const bar = winBar(`tg_${i + 1}.persona`);
  bar.appendChild(tagChip(t.evidence));
  card.appendChild(bar);

  const body = el("div", "win-body");
  const head = el("div", "tg-head");
  const txt = el("div");
  append(txt, t.hot ? el("span", "hot-badge", "🔥 Hottest TG") : null, el("h3", null, t.name), t.tldr ? el("p", "tldr", t.tldr) : null);
  append(head, el("span", "avatar big", initials(t.name)), txt);
  body.appendChild(head);

  const rating = el("div", "rating-box");
  const line = el("div", "rating-line");
  append(
    line,
    html("span", "rating-big", starsHtml(t.stars)),
    el("span", "score", t.stars == null ? "" : t.stars.toFixed(1)),
    el("span", "heat", heatLabel(t.stars))
  );
  append(rating, el("span", "eyebrow", "Buy-o-meter"), line, t.stars_why ? el("p", null, t.stars_why) : null);
  body.appendChild(rating);

  if (t.split_question) {
    const b = el("div", "bouncer");
    append(b, el("span", "eyebrow", "The bouncer question"), el("span", null, t.split_question));
    body.appendChild(b);
  }

  const tabs = [
    ["Who", () => whoPanel(t)],
    ["Why buy", () => whyPanel(t, meta)],
    ["Pitch", () => pitchPanel(t, meta)],
    ["Fine print", () => finePanel(t)],
  ];
  const tabBar = el("div", "tabs");
  tabBar.setAttribute("role", "tablist");
  const panel = el("div", "panel");
  panel.setAttribute("role", "tabpanel");
  const show = (k) => {
    tabBar.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-selected", String(j === k)));
    panel.innerHTML = "";
    panel.style.animation = "none";
    void panel.offsetWidth; // restart the fade
    panel.style.animation = "";
    panel.appendChild(tabs[k][1]());
  };
  tabs.forEach(([label], k) => {
    const b = el("button", null, label);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => show(k));
    tabBar.appendChild(b);
  });
  append(body, tabBar, panel);
  show(0);
  card.appendChild(body);
  return card;
}

function renderReceipts(r) {
  const card = el("section", "win");
  card.appendChild(winBar("receipts.log"));
  const d = el("details", "win-body receipts");
  const sum = el("summary");
  append(sum, el("span", "eyebrow", "The receipts"), el("b", null, "How these TGs were locked ▾"));
  d.appendChild(sum);
  if (r.audit.candidates_considered.length) {
    d.appendChild(el("b", "eyebrow", "Suspects considered"));
    const chips = el("div", "chips");
    r.audit.candidates_considered.forEach((c) => chips.appendChild(el("span", null, c)));
    d.appendChild(chips);
  }
  if (r.audit.merges.length) {
    d.appendChild(el("b", "eyebrow", "Merged, because they'd need the same ad"));
    r.audit.merges.forEach((m) => {
      const row = el("div", "merge");
      append(row, el("b", null, m.merged), el("span", null, "→"), el("b", null, m.into), m.reason ? el("small", null, m.reason) : null);
      d.appendChild(row);
    });
  }
  append(d, kv("Overlap check", r.audit.overlap_check));
  if (r.flags_for_signoff.length) {
    const f = el("div", "flags");
    f.appendChild(el("b", null, "Brand-wide claims to run past the client"));
    const ul = el("ul");
    r.flags_for_signoff.forEach((x) => ul.appendChild(el("li", null, x)));
    f.appendChild(ul);
    d.appendChild(f);
  }
  card.appendChild(d);
  return card;
}

function renderSources(r, meta) {
  const src = buildSources(r, meta);
  const card = el("section", "win");
  card.appendChild(winBar("sources.bib"));
  const d = el("details", "win-body sources");
  d.id = "sources";
  d.open = true;
  const sum = el("summary");
  const done = el("span", "src-count");
  append(sum, el("span", "eyebrow", "Citation checklist"), el("b", null, `${src.rows.length} pages read · ${src.cited}/${src.claims} reasons cited`), done);
  d.appendChild(sum);
  d.appendChild(el("p", "micro", "Tick a page once you've checked the claims citing it against the live site. Unticked means unverified."));
  if (src.siteUncited) {
    d.appendChild(el("div", "note", `${src.siteUncited} reason${src.siteUncited > 1 ? "s are" : " is"} tagged "Straight from the site" but cite no page. Check those by hand.`));
  }
  const ul = el("ul", "src-list");
  const tick = () => {
    const n = ul.querySelectorAll("input:checked").length;
    done.textContent = n ? `${n}/${src.rows.length} verified` : "";
    done.classList.toggle("all", n === src.rows.length);
  };
  src.rows.forEach((row) => {
    const li = el("li");
    li.id = "src-" + row.n;
    const box = el("input");
    box.type = "checkbox";
    box.setAttribute("aria-label", "Verified page " + row.n);
    box.addEventListener("change", () => {
      li.classList.toggle("checked", box.checked);
      tick();
    });
    const body = el("div");
    const top = el("div", "src-top");
    const a = el("a", null, row.title || row.url);
    a.href = row.url;
    a.target = "_blank";
    a.rel = "noopener";
    append(top, el("span", "src-n", "p" + row.n), a);
    append(body, top, el("small", "src-url", row.url), sourceDetail(row) ? el("small", null, sourceDetail(row)) : null);
    if (row.citedBy.length) {
      const cites = el("div", "src-cites");
      row.citedBy.forEach((c) => cites.appendChild(el("span", null, c)));
      body.appendChild(cites);
    } else {
      body.appendChild(el("small", "src-none", "Read, but not cited by any claim"));
    }
    append(li, box, body);
    ul.appendChild(li);
  });
  d.appendChild(ul);
  if (src.failed.length) {
    d.appendChild(el("b", "eyebrow", "Tried, but couldn't read"));
    const f = el("ul", "src-failed");
    src.failed.forEach((x) => f.appendChild(el("li", null, `${x.url} (${x.reason})`)));
    d.appendChild(f);
  }
  if (src.unknown.length) d.appendChild(el("p", "micro", `The AI also cited page ${src.unknown.join(", ")}, which doesn't exist. Ignore those.`));
  if (src.trimmed) d.appendChild(el("p", "micro", "Page text was cut in half to fit this provider's limit."));
  if (meta.model) d.appendChild(el("p", "micro", `Model: ${meta.model} · ${meta.date}`));
  card.appendChild(d);
  return card;
}

function renderReport(report, meta) {
  const r = normalise(report);
  const out = $("output");
  out.innerHTML = "";
  out.classList.add("cards-enter");
  out.appendChild(renderBrand(r, meta));
  out.appendChild(sectionTitle("The lineup", "ranked by buy-intent"));
  out.appendChild(renderLineup(r));
  out.appendChild(sectionTitle("Meet your TGs", `${r.tgs.length} personas, zero overlap`));
  r.tgs.forEach((t, i) => out.appendChild(renderTg(t, i, meta)));
  out.appendChild(renderReceipts(r));
  out.appendChild(sectionTitle("Sources", "what the AI actually read"));
  out.appendChild(renderSources(r, meta));
  $("dock").hidden = false;
  $("footnote").textContent = pick(FOOTNOTES);
  return r;
}

// ---------- main flow ----------

function setBusy(busy) {
  $("analyze").disabled = busy;
  $("again").disabled = busy;
  $("ctaText").textContent = busy ? "Snooping around..." : lastReport ? "Run it again" : "Find my TGs";
}

async function analyze() {
  setBusy(true);
  hideToast();
  $("output").innerHTML = "";
  $("dock").hidden = true;
  $("footnote").textContent = "";
  let progressOn = false;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new UserError("Couldn't find the active tab. Click on the brand's website, then try again.");
    if (!tab.url) throw new UserError("Chrome didn't share this tab's address. Reload the extension at chrome://extensions, then try again.");
    if (!/^https?:/.test(tab.url)) {
      throw new UserError("This tab is a browser page, not a brand. Open the brand's website here, then hit the button.");
    }

    const s = await getSettings();
    const id = s.provider;
    const p = PROVIDERS[id];
    const apiKey = (s.keys && s.keys[id]) || "";
    if (!isReady(id, s)) {
      openDrawer();
      throw new UserError(`No key, no magic. Add your ${p.label} key in Settings (it's free for some providers).`);
    }

    // Ask once per site (and once for a custom endpoint) for permission. Needs this click.
    const origins = [originPattern(tab.url)];
    if (id === "custom") origins.push(originPattern(s.customBase));
    if (!(await chrome.permissions.contains({ origins }))) {
      const granted = await chrome.permissions.request({ origins });
      if (!granted) throw new UserError("Chrome needs your OK to read this site. Hit the button again and choose Allow.");
    }

    const tgCount = Number(s.tgCount) || 3;
    startProgress();
    progressOn = true;

    const site = await readSite(tab, (n) => ($("readNote").textContent = n), p.budget);
    if (!site.pages.length || site.pages[0].text.length < 200) {
      throw new UserError("This page is basically a blank stare. Open the brand's homepage and try again.");
    }
    $("readNote").textContent = `Read ${site.pages.length} page${site.pages.length > 1 ? "s" : ""}`;

    setStep("think");
    progress.thinkStart = Date.now();
    const model = modelFor(id, s);
    $("thinkNote").textContent = `${p.label} · ${model}`;

    const makeUser = (scale) =>
      buildUserPrompt({
        origin: site.origin,
        pages: site.pages.map((pg) => ({ ...pg, text: pg.text.slice(0, Math.floor(pg.text.length * scale)) })),
        tgCount,
        extraContext: $("extra").value,
      });
    const base = {
      id,
      settings: s,
      apiKey,
      model,
      system: SYSTEM_PROMPT,
      onProgress: (n) => ($("thinkNote").textContent = `Writing it up · ${n.toLocaleString()} characters`),
      onAttempt: (m) => ($("thinkNote").textContent = `${p.label} · ${m}`),
    };
    let reply;
    let trimmed = false;
    try {
      reply = await callProvider({ ...base, user: makeUser(1) });
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === "toolarge")) throw e;
      $("thinkNote").textContent = "Too much text for this key. Trimming and retrying";
      trimmed = true;
      reply = await callProvider({ ...base, user: makeUser(0.5) }); // one retry with half the page text
    }

    setStep("lock");
    let report;
    try {
      report = parseModelJson(reply.text);
    } catch (e) {
      if (reply.finish === "MAX_TOKENS") {
        throw new UserError("The AI talked so much it got cut off. Pick fewer TGs (2) and try again.");
      }
      throw new UserError(e.message);
    }
    lastReport = report;
    lastMeta = {
      origin: site.origin,
      date: new Date().toISOString().slice(0, 10),
      pages: site.pages.map((pg) => ({
        url: pg.url,
        title: pg.title,
        via: pg.via,
        chars: trimmed ? Math.floor(pg.text.length * 0.5) : pg.text.length,
        total: pg.total,
      })),
      failed: site.failed,
      trimmed,
      model: `${p.label} · ${reply.model}`,
    };
    const secs = Math.round((Date.now() - progress.t0) / 1000);
    stopProgress();
    progressOn = false;
    const r = renderReport(report, lastMeta);
    const hot = r.tgs.find((t) => t.hot);
    showToast(
      "Locked and loaded.",
      ` Read ${site.pages.length} pages with ${reply.model} in ${secs}s.` + (hot ? ` Hottest TG: ${hot.name}.` : "")
    );
  } catch (e) {
    showToast(pick(ERROR_TITLES), " " + (e instanceof UserError ? e.message : "Something broke: " + e.message), true);
  } finally {
    if (progressOn) stopProgress();
    setBusy(false);
  }
}

async function copyText() {
  if (!lastReport) return;
  await navigator.clipboard.writeText(toMarkdown(lastReport, lastMeta));
  flash($("copyText"), "Copied ✓");
}

function downloadHtml() {
  if (!lastReport) return;
  const blob = new Blob([toHtml(lastReport, lastMeta)], { type: "text/html" });
  const a = document.createElement("a");
  const host = new URL(lastMeta.origin).hostname.replace(/^www\./, "");
  a.href = URL.createObjectURL(blob);
  a.download = `TG-report-${host}-${lastMeta.date}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  flash($("downloadHtml"), "Saved ✓");
}

function flash(btn, text) {
  const old = btn.innerHTML;
  btn.textContent = text;
  setTimeout(() => (btn.innerHTML = old), 1400);
}

function setTgCount(n) {
  settingsCache.tgCount = n;
  document.querySelectorAll("#tgCount button").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.n) === n)));
  $("tgHint").textContent = TG_HINTS[n] || "";
}

// ---------- wiring ----------

async function init() {
  $("tagline").textContent = pick(TAGLINES);
  const s = await getSettings();
  setTgCount(Number(s.tgCount) || 3);
  renderPill();
  updateTarget();
  if (!isReady(s.provider, s)) openDrawer();
}

document.querySelectorAll("#tgCount button").forEach((b) =>
  b.addEventListener("click", () => {
    setTgCount(Number(b.dataset.n));
    chrome.storage.local.set({ tgCount: Number(b.dataset.n) });
  })
);
$("openSettings").addEventListener("click", openDrawer);
$("providerPill").addEventListener("click", openDrawer);
$("closeSettings").addEventListener("click", closeDrawer);
$("scrim").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("drawer").hidden) closeDrawer();
});
$("toggleKey").addEventListener("click", () => {
  const k = $("apiKey");
  k.type = k.type === "password" ? "text" : "password";
});
$("saveSettings").addEventListener("click", saveSettings);
$("loadModels").addEventListener("click", loadModels);
$("analyze").addEventListener("click", analyze);
$("again").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  analyze();
});
$("copyText").addEventListener("click", copyText);
$("downloadHtml").addEventListener("click", downloadHtml);
chrome.tabs.onActivated.addListener(updateTarget);
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url || info.favIconUrl || info.status === "complete") updateTarget();
});
chrome.windows.onFocusChanged.addListener(updateTarget);

init();
