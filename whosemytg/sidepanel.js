// Side panel logic: settings, site reading, the analyze flow, department kits, history, editing and exports.
// Depends on prompt.js (SYSTEM_PROMPT, buildUserPrompt), lib.js (helpers), providers.js (AI calls),
// lenses.js (department kits) and vendor/pptxgen.bundle.js (slides export).

const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// The run on screen. lastReport is the raw AI reply (plus our _locked/_edited/_rev marks).
let lastReport = null;
let lastMeta = null;
let lastSite = null; // {origin, pages, failed, links, anatomy}
let lastLenses = {}; // {media|seo|cro|design|annotate: {data, rev, model, date}}
let runId = null;
let busy = false;
const editing = new Set(); // TG order indexes in edit mode

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

const LENS_QUIPS = {
  media: ["Counting characters so Google doesn't have to.", "Trimming headlines to 30. Painful, but necessary."],
  seo: ["Thinking like someone at 2am with a search bar.", "Looking for pages that should exist but don't."],
  cro: ["Reading your page like a sceptical shopper.", "Scoring tests. Not every idea is a good idea."],
  design: ["Picking colours. Arguing with ourselves about teal.", "Sketching the landing page on a napkin."],
  annotate: ["Squinting at your screen.", "Sticking notes where they hurt."],
};

const FOOTNOTES = [
  "P.S. \"Educated guess\" means exactly that. Validate with GA4 or client data before you bet the media budget on it.",
  "P.S. Stars rate buy-intent for this brand, not how nice the people are. Everyone's lovely.",
  "P.S. Only public website text gets sent to your AI provider. Your key never leaves this browser.",
];

const ERROR_TITLES = ["Plot twist.", "Well, that didn't go to plan.", "Hmm. Small hiccup."];

// ---------- settings ----------

const settingsCache = {
  provider: "groq",
  keys: {},
  models: {},
  customBase: "",
  tgCount: 3,
  market: "Global",
  language: "English",
};

async function getSettings() {
  const s = await chrome.storage.local.get({
    provider: "groq",
    keys: null,
    models: null,
    customBase: "",
    tgCount: 3,
    market: "Global",
    language: "English",
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

// ---------- drawers ----------

let draft = null; // edits in the settings drawer before Save

function openPanel(id) {
  ["drawer", "historyDrawer"].forEach((d) => ($(d).hidden = d !== id));
  $("scrim").hidden = false;
}

function closePanels() {
  $("drawer").hidden = true;
  $("historyDrawer").hidden = true;
  $("scrim").hidden = true;
}

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
  openPanel("drawer");
  setTimeout(() => $("apiKey").focus(), 50);
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
  setTimeout(closePanels, 900);
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

async function activeTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (e) {
    return null;
  }
}

async function updateTarget() {
  const tab = await activeTab();
  const ok = tab && tab.url && /^https?:/.test(tab.url);
  $("siteName").textContent = ok ? new URL(tab.url).hostname.replace(/^www\./, "") : "Open a brand's website";
  const fav = $("favicon");
  if (ok && tab.favIconUrl && /^https?:|^data:/.test(tab.favIconUrl)) fav.src = tab.favIconUrl;
  else fav.removeAttribute("src");
}

// ---------- reading the site ----------

// Runs inside the live page (must be self-contained). Also maps the page's anatomy for the CRO and SEO kits.
function extractFromLivePage() {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const vh = window.innerHeight;
  const docH = Math.max(document.documentElement.scrollHeight, 1);
  const top = (e) => e.getBoundingClientRect().top + window.scrollY;
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
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
  const text = clean(document.body ? document.body.innerText : "");

  const seen = new Set();
  const fold = [];
  document.querySelectorAll("h1, h2, h3, p, li, a, button, span, label").forEach((e) => {
    if (fold.join(" ").length > 1200 || !visible(e) || top(e) > vh) return;
    if (e.children.length > 2 && e.tagName !== "BUTTON" && e.tagName !== "A") return;
    const t = clean(e.innerText);
    if (t.length < 2 || t.length > 220 || seen.has(t)) return;
    seen.add(t);
    fold.push(t);
  });

  const ctaRe = /btn|button|cta|primary|shop|buy|cart|book|signup|sign-up|get-started/i;
  const ctas = [];
  const ctaSeen = new Set();
  document.querySelectorAll("button, a, input[type=submit], [role=button]").forEach((e) => {
    if (ctas.length >= 20 || !visible(e)) return;
    const t = clean(e.innerText || e.value || e.getAttribute("aria-label"));
    if (t.length < 2 || t.length > 40 || ctaSeen.has(t)) return;
    const cs = getComputedStyle(e);
    const filled = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    const isCta = e.tagName !== "A" || filled || ctaRe.test(e.className + " " + (e.getAttribute("role") || ""));
    if (!isCta || e.closest("nav, footer")) return;
    ctaSeen.add(t);
    ctas.push({ text: t, aboveFold: top(e) < vh });
  });

  const forms = Array.from(document.querySelectorAll("form"))
    .filter(visible)
    .slice(0, 5)
    .map((f) => {
      const fields = Array.from(f.querySelectorAll("input, select, textarea")).filter(
        (i) => !/hidden|submit|button|image|reset/.test(i.type || "") && visible(i)
      );
      return {
        fields: fields.length,
        required: fields.filter((i) => i.required || i.getAttribute("aria-required") === "true").length,
        aboveFold: top(f) < vh,
        labels: fields.slice(0, 8).map((i) => clean(i.getAttribute("placeholder") || i.getAttribute("aria-label") || i.name || i.type)),
      };
    });

  const TRUST = [
    ["reviews / ratings", /(\d[\d,.]*\s*(reviews?|ratings?))|★|(\d(\.\d)?\s*\/\s*5)|testimonial/i],
    ["guarantee / returns", /guarantee|warranty|money[- ]back|free returns?|refund|\d+[- ]day trial/i],
    ["security / payment", /secure (checkout|payment)|ssl|encrypted|cash on delivery|\bcod\b/i],
    ["certifications / press", /certified|certification|award|as seen (in|on)|featured in|iso \d|approved/i],
    ["social proof", /trusted by|\d[\d,.]*\+?\s*(customers|clients|users|families|brands)|happy customers/i],
  ];
  const trust = [];
  TRUST.forEach(([kind, re]) => {
    const m = text.match(re);
    if (m) {
      const i = Math.max(0, m.index - 30);
      trust.push({ kind, sample: text.slice(i, m.index + m[0].length + 30) });
    }
  });

  const outline = Array.from(document.querySelectorAll("h1, h2, h3"))
    .filter(visible)
    .slice(0, 30)
    .map((h) => ({ level: Number(h.tagName[1]), text: clean(h.innerText).slice(0, 90), pos: Math.round((top(h) / docH) * 100) }))
    .filter((h) => h.text);

  return {
    url: location.href,
    title: clean(document.title),
    description: meta ? clean(meta.getAttribute("content")) : "",
    headings,
    text,
    links,
    anatomy: {
      url: location.href,
      title: clean(document.title),
      description: meta ? clean(meta.getAttribute("content")) : "",
      h1: Array.from(document.querySelectorAll("h1")).map((h) => clean(h.innerText)).filter(Boolean).slice(0, 3),
      aboveFold: fold.join(" | ").slice(0, 1200),
      ctas,
      forms,
      trust,
      outline,
    },
  };
}

// Runs inside the live page: what's visible right now, with positions as % of the viewport.
function extractViewport() {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const out = [];
  const add = (e, type) => {
    if (out.length >= 30) return;
    const r = e.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return;
    const text = clean(e.innerText || e.value || e.getAttribute("alt") || e.getAttribute("aria-label") || "").slice(0, 120);
    if (type !== "image" && type !== "form" && !text) return;
    const x = Math.max(0, r.left);
    const y = Math.max(0, r.top);
    out.push({
      id: "e" + (out.length + 1),
      type,
      text: text || (type === "image" ? "(image, no alt text)" : "(form)"),
      x: Math.round((x / W) * 100),
      y: Math.round((y / H) * 100),
      w: Math.round(((Math.min(W, r.right) - x) / W) * 100),
      h: Math.round(((Math.min(H, r.bottom) - y) / H) * 100),
    });
  };
  document.querySelectorAll("h1, h2, h3").forEach((e) => add(e, "heading"));
  document.querySelectorAll("button, a[class*=btn], a[class*=button], input[type=submit], [role=button]").forEach((e) => add(e, "cta"));
  document.querySelectorAll("form").forEach((e) => add(e, "form"));
  document.querySelectorAll("img, video, picture").forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width > 120 && r.height > 80) add(e, "image");
  });
  document.querySelectorAll("p, li").forEach((e) => {
    if (clean(e.innerText).length > 40) add(e, "text");
  });
  document.querySelectorAll("nav").forEach((e) => add(e, "nav"));
  return { w: W, h: H, url: location.href, els: out };
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

// Same-origin links (path + text) so the SEO kit knows what pages exist beyond those read.
function siteLinks(links, origin) {
  const seen = new Set();
  const out = [];
  links.forEach((l) => {
    try {
      const u = new URL(l.href);
      const path = u.pathname.replace(/\/+$/, "") || "/";
      if (u.origin !== origin || seen.has(path) || !l.text) return;
      seen.add(path);
      out.push({ path, text: l.text });
    } catch (e) {}
  });
  return out.slice(0, 80);
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
  delete current.anatomy;
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
  return { origin, pages, failed, links: siteLinks(live.links, origin), anatomy: live.anatomy };
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
  if (isError) t.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideToast() {
  $("toast").hidden = true;
}

function errorText(e) {
  return " " + (e instanceof UserError ? e.message : "Something broke: " + e.message);
}

function setBusy(on) {
  busy = on;
  $("analyze").disabled = on;
  $("again").disabled = on;
  document.querySelectorAll(".lens-tile, .tg-tool").forEach((b) => (b.disabled = on));
  $("ctaText").textContent = on ? "Snooping around..." : lastReport ? "Run it again" : "Find my TGs";
}

// ---------- rendering helpers ----------

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

function icon(name, size) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("width", size || 14);
  s.setAttribute("height", size || 14);
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#i-" + name);
  s.appendChild(u);
  return s;
}

function initials(name) {
  const w = String(name).replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase();
}

function winBar(title) {
  const bar = el("div", "win-bar");
  const dots = el("span", "dots");
  dots.append(el("i"), el("i"), el("i"));
  append(bar, dots, el("span", "win-title", title));
  return bar;
}

function tagChip(tag) {
  const t = String(tag || "hypothesis").toLowerCase();
  return el("span", "tag-chip " + t, tagLabel(t));
}

function pill(text, kind) {
  return el("span", "pill-s " + (kind || ""), text);
}

function sectionTitle(title, aside) {
  const d = el("div", "section-title");
  append(d, el("h2", null, title), aside ? el("span", null, aside) : null);
  return d;
}

function copyBtn(label, getText, cls) {
  const b = el("button", cls || "copy-mini", label);
  b.type = "button";
  b.addEventListener("click", async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(typeof getText === "function" ? getText() : getText);
    const old = b.textContent;
    b.textContent = "Copied ✓";
    setTimeout(() => (b.textContent = old), 1400);
  });
  return b;
}

// Sub-tabs used inside cards and kits. tabs: [[label, () => node]]
function tabset(tabs, start) {
  const wrap = el("div");
  const bar = el("div", "tabs");
  bar.setAttribute("role", "tablist");
  const panel = el("div", "panel");
  panel.setAttribute("role", "tabpanel");
  const show = (k) => {
    wrap.dataset.tab = k;
    bar.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-selected", String(j === k)));
    panel.innerHTML = "";
    panel.style.animation = "none";
    void panel.offsetWidth; // restart the fade
    panel.style.animation = "";
    append(panel, tabs[k][1]());
  };
  tabs.forEach(([label], k) => {
    const b = el("button", null, label);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => show(k));
    bar.appendChild(b);
  });
  append(wrap, bar, panel);
  show(Math.min(start || 0, tabs.length - 1));
  return wrap;
}

function colorFor(name) {
  const r = lastReport ? normalise(lastReport) : null;
  const i = r ? r.tgs.findIndex((t) => t.name.toLowerCase() === String(name).toLowerCase()) : -1;
  return i >= 0 ? TG_COLORS[i % TG_COLORS.length] : "var(--muted)";
}

// A row of TG chips that switches the content below. items: [{tg, ...}]
function tgSwitch(items, render) {
  const wrap = el("div", "tg-switch");
  const row = el("div", "chips-row");
  const body = el("div");
  const show = (k) => {
    row.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(j === k)));
    body.innerHTML = "";
    append(body, render(items[k], k));
  };
  items.forEach((it, k) => {
    const b = el("button", "tg-chip");
    b.type = "button";
    b.style.setProperty("--c", colorFor(it.tg));
    append(b, el("i"), el("span", null, it.tg || "TG " + (k + 1)));
    b.addEventListener("click", () => show(k));
    row.appendChild(b);
  });
  append(wrap, row, body);
  if (items.length) show(0);
  else body.appendChild(el("p", "micro", "Nothing came back for this. Try re-running."));
  return wrap;
}

// ---------- editing ----------

function rawTg(order) {
  return lastReport && lastReport.tgs && lastReport.tgs[order];
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  keys.slice(0, -1).forEach((k, i) => {
    const nextIsIndex = /^\d+$/.test(keys[i + 1]);
    if (o[k] == null || typeof o[k] !== "object") {
      o[k] = nextIsIndex ? [] : typeof o[k] === "string" && k === "lead_copy" ? { line: o[k] } : {};
    }
    if (k === "reasons_to_buy" && nextIsIndex) {
      const j = Number(keys[i + 1]);
      if (typeof o[k][j] !== "object" || !o[k][j]) o[k][j] = { reason: String(o[k][j] || ""), tag: "hypothesis", pages: [] };
    }
    o = o[k];
  });
  o[keys[keys.length - 1]] = value;
}

function touch() {
  lastReport._rev = (lastReport._rev || 0) + 1;
  saveRunSoon();
}

// Makes node editable in edit mode, writing back to the raw TG at path.
function ed(node, order, path) {
  if (!node || !editing.has(order)) return node;
  node.contentEditable = "plaintext-only";
  node.classList.add("editable");
  node.spellcheck = true;
  node.addEventListener("input", () => {
    const t = rawTg(order);
    if (!t) return;
    setPath(t, path, node.textContent.trim());
    t._edited = true;
    touch();
  });
  return node;
}

function edKv(label, value, order, path) {
  if (!value && !editing.has(order)) return null;
  const d = el("div", "kv");
  d.appendChild(el("b", null, label));
  d.appendChild(ed(el("span", null, value || ""), order, path));
  return d;
}

function currentTg(order) {
  return normalise(lastReport).tgs.find((t) => t.order === order);
}

// ---------- rendering: brand, lineup, TG cards ----------

function renderBrand(r, meta) {
  const bs = r.brand_summary;
  const card = el("section", "win brand-card");
  card.appendChild(winBar("the_brand_decoded.txt"));
  const body = el("div", "win-body");
  append(body, el("span", "eyebrow", "The brand, decoded"), el("h2", null, bs.brand || new URL(meta.origin).hostname));
  if (meta.market || meta.language) {
    const m = el("div", "chips-row static");
    append(m, pill("📍 " + (meta.market || "Global")), pill("🗣 " + (meta.language || "English")));
    body.appendChild(m);
  }
  const facts = el("div", "facts");
  append(facts, kv("What they sell", bs.what_they_sell), kv("How they position it", bs.positioning), kv("Who pays vs who uses", bs.who_pays_vs_uses));
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
    const nm = el("span", "nm", (t.locked ? "🔒 " : "") + t.name);
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
  const o = t.order;
  const p = el("div");
  append(p, edKv("Their situation", t.situation, o, "situation"));
  if (t.first_question || editing.has(o)) {
    append(p, el("b", "eyebrow", "First thought in their head"), ed(el("div", "thought", t.first_question), o, "first_question"));
  }
  const ps = el("div", "ps");
  append(
    ps,
    edKv("The problem", t.problem, o, "problem"),
    t.problem && t.solution ? el("div", "arrow-down", "↓") : null,
    edKv("How this brand fixes it", t.solution, o, "solution")
  );
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
    append(d, role, ed(el("span", null, x.reason), t.order, `reasons_to_buy.${j}.reason`));
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
  if (!t.reasons_to_buy.length) return el("p", "micro", "The AI forgot this bit. Rude. Try re-rolling this TG.");
  return ol;
}

function pitchPanel(t, meta) {
  const o = t.order;
  const p = el("div");
  if (t.lead_copy.line || editing.has(o)) {
    const q = el("blockquote", "quote");
    q.appendChild(ed(el("span", null, t.lead_copy.line), o, "lead_copy.line"));
    const small = el("small");
    const tone = el("span");
    append(tone, document.createTextNode("Tone: "), ed(el("span", null, t.lead_copy.tone), o, "lead_copy.tone"));
    append(small, tone, copyBtn("Copy line", () => currentTg(o).lead_copy.line));
    q.appendChild(small);
    p.appendChild(q);
  }
  const h = t.landing_page_hero;
  if (h.headline || h.subhead || h.cta || editing.has(o)) {
    p.appendChild(el("b", "eyebrow", "Landing page hero, roughly"));
    const lp = el("div", "lp");
    const bar = el("div", "lp-bar");
    const dots = el("span", "dots");
    dots.append(el("i"), el("i"), el("i"));
    append(bar, dots, el("span", "url", new URL(meta.origin).hostname.replace(/^www\./, "") + "/for-you"));
    const body = el("div", "lp-body");
    append(
      body,
      ed(el("h4", null, h.headline), o, "landing_page_hero.headline"),
      ed(el("p", null, h.subhead), o, "landing_page_hero.subhead"),
      ed(el("span", null, h.cta), o, "landing_page_hero.cta")
    );
    append(lp, bar, body);
    p.appendChild(lp);
  }
  append(p, edKv("Ad angle", t.ad_angle, o, "ad_angle"), edKv("Offer to push", t.offer, o, "offer"));
  return p;
}

function finePanel(t) {
  const p = el("div");
  if (t.not_this_tg_if || editing.has(t.order)) {
    const w = el("div", "wrong-door");
    append(w, el("b", "eyebrow", "Wrong door if…"), ed(el("span", null, t.not_this_tg_if.replace(/^not this tg if[:,]?\s*/i, "")), t.order, "not_this_tg_if"));
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

function toolBtn(name, label, onClick, pressed) {
  const b = el("button", "tg-tool");
  b.type = "button";
  b.title = label;
  b.setAttribute("aria-label", label);
  if (pressed != null) b.setAttribute("aria-pressed", String(pressed));
  b.appendChild(icon(name, 14));
  b.disabled = busy;
  b.addEventListener("click", onClick);
  return b;
}

function renderTg(t, i, meta, tabStart) {
  const o = t.order;
  const isEditing = editing.has(o);
  const card = el("section", "win tg" + (t.hot ? " hot" : "") + (t.locked ? " locked" : "") + (isEditing ? " editing" : ""));
  card.id = "tg-" + i;
  card.dataset.order = o;
  card.style.setProperty("--c", TG_COLORS[i % TG_COLORS.length]);
  const bar = winBar(`tg_${i + 1}.persona`);
  const tools = el("span", "tg-tools");
  append(
    tools,
    toolBtn(isEditing ? "check" : "pencil", isEditing ? "Done editing" : "Edit this TG", () => toggleEdit(o)),
    toolBtn(t.locked ? "lock" : "unlock", t.locked ? "Unlock (Run again may replace it)" : "Lock (Run again keeps it)", () => toggleLock(o), t.locked),
    toolBtn("dice", "Re-roll just this TG", () => rerollTg(o))
  );
  append(bar, tools);
  card.appendChild(bar);

  const body = el("div", "win-body");
  const head = el("div", "tg-head");
  const txt = el("div");
  const badges = el("div", "badges");
  append(
    badges,
    t.hot ? el("span", "hot-badge", "🔥 Hottest TG") : null,
    t.locked ? el("span", "mini-badge", "🔒 Locked") : null,
    t.edited ? el("span", "mini-badge", "✎ Edited") : null,
    tagChip(t.evidence)
  );
  append(txt, badges, ed(el("h3", null, t.name), o, "name"), t.tldr || isEditing ? ed(el("p", "tldr", t.tldr), o, "tldr") : null);
  append(head, el("span", "avatar big", initials(t.name)), txt);
  body.appendChild(head);

  const rating = el("div", "rating-box");
  const line = el("div", "rating-line");
  if (isEditing) {
    const inp = el("input", "stars-input");
    inp.type = "number";
    inp.min = 0;
    inp.max = 5;
    inp.step = 0.5;
    inp.value = t.stars == null ? "" : t.stars;
    inp.addEventListener("input", () => {
      const raw = rawTg(o);
      const why = raw.buy_score && typeof raw.buy_score === "object" ? raw.buy_score.why : "";
      raw.buy_score = { stars: toStars(inp.value), why };
      raw._edited = true;
      touch();
    });
    append(line, inp, el("span", "heat", "stars (0–5, halves allowed). Order updates when you hit Done."));
  } else {
    append(
      line,
      html("span", "rating-big", starsHtml(t.stars)),
      el("span", "score", t.stars == null ? "" : t.stars.toFixed(1)),
      el("span", "heat", heatLabel(t.stars))
    );
  }
  append(rating, el("span", "eyebrow", "Buy-o-meter"), line, t.stars_why || isEditing ? ed(el("p", null, t.stars_why), o, "buy_score.why") : null);
  body.appendChild(rating);

  if (t.split_question || isEditing) {
    const b = el("div", "bouncer");
    append(b, el("span", "eyebrow", "The bouncer question"), ed(el("span", null, t.split_question), o, "split_question"));
    body.appendChild(b);
  }

  // Panels re-read the TG on every tab switch so edits made in one tab show in the others.
  const tabs = tabset(
    [
      ["Who", () => whoPanel(currentTg(o))],
      ["Why buy", () => whyPanel(currentTg(o), meta)],
      ["Pitch", () => pitchPanel(currentTg(o), meta)],
      ["Fine print", () => finePanel(currentTg(o))],
    ],
    tabStart
  );
  body.appendChild(tabs);
  card.appendChild(body);
  return card;
}

function rerenderCard(order) {
  const r = normalise(lastReport);
  const i = r.tgs.findIndex((t) => t.order === order);
  const old = document.querySelector(`.tg[data-order="${order}"]`);
  if (i < 0 || !old) return;
  const tab = Number(old.querySelector("[data-tab]") ? old.querySelector("[data-tab]").dataset.tab : 0);
  old.replaceWith(renderTg(r.tgs[i], i, lastMeta, tab));
}

function toggleEdit(order) {
  if (editing.has(order)) {
    editing.delete(order);
    renderReport(lastReport, lastMeta); // re-sort in case the stars changed
    const r = normalise(lastReport);
    const i = r.tgs.findIndex((t) => t.order === order);
    if (i >= 0) $("tg-" + i).scrollIntoView({ block: "nearest" });
  } else {
    editing.add(order);
    rerenderCard(order);
  }
}

function toggleLock(order) {
  const t = rawTg(order);
  t._locked = !t._locked;
  saveRunSoon();
  rerenderCard(order);
  $("lineupSlot").replaceChildren(renderLineup(normalise(lastReport)));
}

// ---------- rendering: sources, receipts ----------

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

// ---------- department kits ----------

function renderToolkit() {
  const wrap = el("div");
  const grid = el("div", "lens-grid");
  const tile = (id, title, blurb, onClick) => {
    const b = el("button", "lens-tile");
    b.type = "button";
    b.id = "tile-" + id;
    b.disabled = busy;
    const done = lastLenses[id] && lastLenses[id].data;
    const status = el("span", "lens-status", done ? (lastLenses[id].rev !== (lastReport._rev || 0) ? "TGs changed · re-run" : "Done ✓ · re-run") : "Run it →");
    append(b, el("b", null, title), el("small", null, blurb), status);
    if (done) b.classList.add("done");
    b.addEventListener("click", onClick);
    return b;
  };
  LENS_ORDER.forEach((id) => grid.appendChild(tile(id, LENSES[id].label, LENSES[id].blurb, () => runLens(id))));
  wrap.appendChild(grid);
  const shot = tile("annotate", "📸 Annotate my screen", "Scroll to the bit you care about, then hit this. Notes get pinned on it.", runAnnotate);
  shot.classList.add("wide");
  wrap.appendChild(shot);
  return wrap;
}

function lensCard(id, title, body) {
  const L = lastLenses[id];
  const card = el("section", "win lens-card");
  card.id = "lens-" + id;
  const bar = winBar(LENSES[id].file);
  bar.appendChild(el("span", "win-meta", L.model || ""));
  card.appendChild(bar);
  const b = el("div", "win-body");
  b.appendChild(el("span", "eyebrow", title));
  if (L.rev !== (lastReport._rev || 0)) b.appendChild(el("div", "note", "The TGs changed after this ran. Re-run the kit for fresh results."));
  append(b, body);
  card.appendChild(b);
  return card;
}

function limItem(x) {
  const row = el("div", "lim-row" + (x.over ? " over" : ""));
  const text = el("span", "lim-text", x.text);
  const count = el("span", "lim-count", `${x.len}/${x.limit}`);
  count.title = x.over ? `Over by ${x.over} characters` : "Within the limit";
  append(row, text, count, copyBtn("Copy", x.text, "copy-icon"));
  return row;
}

function limGroup(title, items, note) {
  const g = el("div", "lim-group");
  const h = el("div", "lim-head");
  const over = items.filter((x) => x.over).length;
  append(h, el("b", null, title), note ? el("small", null, note) : null, over ? pill(`${over} over limit`, "bad") : pill("All fit", "good"), copyBtn("Copy all", items.map((x) => x.text).join("\n")));
  g.appendChild(h);
  items.forEach((x) => g.appendChild(limItem(x)));
  return g;
}

function renderMedia(d) {
  return tgSwitch(d.tgs, (t) => {
    const box = el("div");
    if (t.angle_note) box.appendChild(el("p", "tldr", t.angle_note));
    append(
      box,
      limGroup("Google headlines", t.google_headlines, "max 30"),
      limGroup("Google descriptions", t.google_descriptions, "max 90"),
      limGroup("Meta primary text", t.meta_primary, "125 before \"See more\""),
      limGroup("Meta headlines", t.meta_headlines, "max 40"),
      limGroup("YouTube 5-second hooks", t.youtube_hooks, "say it in 5s")
    );
    return box;
  });
}

const INTENT_KIND = { informational: "info", commercial: "warm", transactional: "good", navigational: "plain" };
const STATUS_KIND = { covered: "good", partial: "warm", missing: "bad", answered: "good", unanswered: "bad", pass: "good", warn: "warm", fail: "bad", good: "good", weak: "warm" };

function renderSeo(d) {
  return tabset([
    [
      "Phrases",
      () => {
        const box = el("div");
        box.appendChild(el("p", "micro", "What they'd type, grouped by intent (top of funnel first). No volumes here: check them in your keyword tool."));
        box.appendChild(
          tgSwitch(d.search_phrases, (s) => {
            const ul = el("ul", "phrases");
            s.phrases.forEach((p) => {
              const li = el("li");
              append(li, pill(p.intent, INTENT_KIND[p.intent] || "plain"), el("span", null, p.q));
              ul.appendChild(li);
            });
            const b = el("div");
            append(b, ul, copyBtn("Copy phrases", s.phrases.map((p) => p.q).join("\n"), "btn small-btn"));
            return b;
          })
        );
        return box;
      },
    ],
    [
      "Gaps",
      () => {
        const ul = el("div", "gap-list");
        d.content_gaps.forEach((g) => {
          const row = el("div", "gap");
          row.style.setProperty("--c", colorFor(g.tg));
          const head = el("div", "gap-head");
          append(head, el("b", null, g.tg), pill(g.status, STATUS_KIND[g.status] || "plain"));
          row.appendChild(head);
          if (g.best_page) {
            const a = el("a", "small-link", "Closest page: " + g.best_page);
            a.href = /^https?:/.test(g.best_page) ? g.best_page : lastMeta.origin + "/" + g.best_page.replace(/^\//, "");
            a.target = "_blank";
            row.appendChild(a);
          }
          if (g.gap) row.appendChild(el("p", null, g.gap));
          if (g.suggested_page.title) {
            const s = el("div", "suggest");
            append(s, el("b", null, "Build: " + g.suggested_page.title), el("code", null, "/" + g.suggested_page.slug.replace(/^\//, "")), el("small", null, g.suggested_page.angle));
            row.appendChild(s);
          }
          ul.appendChild(row);
        });
        return ul;
      },
    ],
    [
      "On-page",
      () => {
        const box = el("div");
        box.appendChild(el("p", "micro", `Checked against ${d.on_page.target_tg || "the hottest TG"}'s language, on the page you had open.`));
        [
          ["Title tag", d.on_page.title],
          ["Meta description", d.on_page.meta_description],
          ["H1", d.on_page.h1],
        ].forEach(([k, o]) => {
          const row = el("div", "onpage");
          const head = el("div", "gap-head");
          append(head, el("b", null, k), pill(o.verdict, STATUS_KIND[o.verdict] || "plain"));
          append(row, head, el("div", "was", o.current || "(missing)"));
          if (o.why) row.appendChild(el("p", "micro", o.why));
          if (o.suggestion.text) {
            const s = el("div", "now" + (o.suggestion.over ? " over" : ""));
            append(s, el("span", null, o.suggestion.text));
            if (o.suggestion.limit < 999) s.appendChild(el("span", "lim-count", `${o.suggestion.len}/${o.suggestion.limit}`));
            s.appendChild(copyBtn("Copy", o.suggestion.text, "copy-icon"));
            row.appendChild(s);
          }
          box.appendChild(row);
        });
        return box;
      },
    ],
    [
      "FAQ",
      () => {
        const box = el("div");
        box.appendChild(
          tgSwitch(d.faqs, (f) => {
            const list = el("div", "faq");
            f.items.forEach((x) => {
              const q = el("details");
              const s = el("summary", null, x.q);
              append(q, s, el("p", null, x.a), tagChip(x.source));
              list.appendChild(q);
            });
            return list;
          })
        );
        const schema = el("details", "schema");
        append(schema, el("summary", null, "FAQ schema (JSON-LD) for all TGs"), el("pre", null, faqSchemaTag(d)));
        box.appendChild(schema);
        const hyp = d.faqs.reduce((a, f) => a + f.items.filter((x) => x.source !== "site").length, 0);
        if (hyp) box.appendChild(el("p", "micro warn", `${hyp} answer${hyp > 1 ? "s are" : " is"} an educated guess. Get the client to confirm before this goes live.`));
        box.appendChild(copyBtn("Copy schema", faqSchemaTag(d), "btn small-btn"));
        return box;
      },
    ],
  ]);
}

function scoreKind(n) {
  return n >= 70 ? "good" : n >= 45 ? "warm" : "bad";
}

function renderCro(d) {
  return tabset([
    [
      "Match",
      () => {
        const box = el("div", "match");
        box.appendChild(el("p", "micro", "How well the page you had open speaks to each TG. 100 = clearly written for them."));
        d.message_match.forEach((m) => {
          const row = el("div", "match-row");
          row.style.setProperty("--c", colorFor(m.tg));
          const head = el("div", "gap-head");
          append(head, el("b", null, m.tg), el("span", "big-score " + scoreKind(m.score), m.score));
          const bar = el("div", "score-bar");
          const fill = el("i", scoreKind(m.score));
          fill.style.width = m.score + "%";
          bar.appendChild(fill);
          append(row, head, bar, m.verdict ? el("p", null, m.verdict) : null, kv("Works", m.what_works), kv("Misses", m.what_misses));
          box.appendChild(row);
        });
        return box;
      },
    ],
    [
      "Objections",
      () => {
        const box = el("div", "gap-list");
        d.objections.forEach((o) => {
          const row = el("div", "gap");
          row.style.setProperty("--c", colorFor(o.tg));
          const head = el("div", "gap-head");
          append(head, el("small", "muted", o.tg), pill(o.status, STATUS_KIND[o.status] || "plain"));
          append(row, head, el("b", "objection", `"${o.objection.replace(/^"|"$/g, "")}"`));
          if (o.where) row.appendChild(el("p", "micro", "Answered at: " + o.where));
          if (o.fix) row.appendChild(kv("Fix", o.fix));
          box.appendChild(row);
        });
        return box;
      },
    ],
    [
      "Tests",
      () => {
        const box = el("div", "tests");
        box.appendChild(el("p", "micro", "Sorted by ICE: the average of impact, confidence and ease (1–10 each)."));
        d.hypotheses.forEach((h, i) => {
          const row = el("div", "test");
          const head = el("div", "gap-head");
          const tg = el("span", "tg-chip static");
          tg.style.setProperty("--c", colorFor(h.tg));
          append(tg, el("i"), el("span", null, h.tg || "All"));
          append(head, el("span", "rank-n", "#" + (i + 1)), tg, el("span", "ice", "ICE " + h.ice));
          const p = el("p");
          append(p, el("b", null, h.change + " "), document.createTextNode(`${h.expected} ${h.because}`));
          const bars = el("div", "ice-bars");
          [
            ["Impact", h.impact],
            ["Confidence", h.confidence],
            ["Ease", h.ease],
          ].forEach(([k, v]) => {
            const b = el("span");
            const fill = el("i");
            fill.style.width = v * 10 + "%";
            append(b, el("small", null, `${k} ${v}`), fill);
            bars.appendChild(b);
          });
          append(row, head, p, bars, h.metric ? el("small", "muted", "Primary metric: " + h.metric) : null);
          box.appendChild(row);
        });
        box.appendChild(
          copyBtn(
            "Copy as test backlog",
            d.hypotheses.map((h, i) => `${i + 1}\t${h.tg}\t${h.change}\t${h.expected}\t${h.because}\t${h.impact}\t${h.confidence}\t${h.ease}\t${h.ice}\t${h.metric}`).join("\n"),
            "btn small-btn"
          )
        );
        return box;
      },
    ],
    [
      "Audit",
      () => {
        const box = el("div", "gap-list");
        d.heuristics.forEach((h) => {
          const row = el("div", "gap audit-row " + (STATUS_KIND[h.verdict] || ""));
          const head = el("div", "gap-head");
          append(head, el("b", null, HEURISTIC_LABELS[h.check] || h.check), pill(h.verdict, STATUS_KIND[h.verdict] || "plain"));
          append(row, head, h.evidence ? el("p", null, h.evidence) : null, kv("Fix", h.fix));
          box.appendChild(row);
        });
        const a = lastSite && lastSite.anatomy;
        if (a) {
          box.appendChild(
            el(
              "p",
              "micro",
              `What we measured: ${a.ctas.length} CTAs (${a.ctas.filter((c) => c.aboveFold).length} above the fold), ${a.forms.length} form${a.forms.length === 1 ? "" : "s"}${
                a.forms.length ? " (" + a.forms.map((f) => f.fields + " fields").join(", ") + ")" : ""
              }, ${a.trust.length} kinds of trust signal.`
            )
          );
        }
        return box;
      },
    ],
  ]);
}

function renderDesign(d) {
  const all = d.directions.map((x) => ({ ...x, outline: (d.lp_outline.find((o) => o.tg === x.tg) || {}).sections || [] }));
  d.lp_outline.forEach((o) => {
    if (!all.find((x) => x.tg === o.tg)) all.push({ tg: o.tg, palette: [], imagery_do: [], imagery_dont: [], outline: o.sections });
  });
  return tgSwitch(all, (x) => {
    const box = el("div");
    if (x.tone) box.appendChild(el("p", "tldr", x.tone));
    if (x.palette.length) {
      const pal = el("div", "palette");
      x.palette.forEach((p) => {
        const sw = el("button", "swatch");
        sw.type = "button";
        sw.title = `${p.why || ""} Click to copy ${p.hex}`;
        const chip = el("i");
        chip.style.background = p.hex;
        append(sw, chip, el("b", null, p.hex), el("small", null, p.role));
        sw.addEventListener("click", async () => {
          await navigator.clipboard.writeText(p.hex);
          sw.querySelector("b").textContent = "Copied";
          setTimeout(() => (sw.querySelector("b").textContent = p.hex), 1200);
        });
        pal.appendChild(sw);
      });
      box.appendChild(pal);
    }
    if (x.imagery_do.length || x.imagery_dont.length) {
      const dd = el("div", "dodont");
      const col = (title, items, cls) => {
        const c = el("div", cls);
        c.appendChild(el("b", null, title));
        const ul = el("ul");
        items.forEach((i) => ul.appendChild(el("li", null, i)));
        c.appendChild(ul);
        return c;
      };
      append(dd, col("Imagery: do", x.imagery_do, "do"), col("Imagery: don't", x.imagery_dont, "dont"));
      box.appendChild(dd);
    }
    if (x.type_feel) box.appendChild(kv("Type feel", x.type_feel));
    if (x.outline.length) {
      box.appendChild(el("b", "eyebrow", "Landing page outline"));
      const wf = el("ol", "wireframe");
      x.outline.forEach((s) => {
        const li = el("li");
        append(li, el("b", null, s.name), el("span", null, s.goal), el("small", null, s.content), s.proof ? el("small", "proof", "Proof: " + s.proof) : null);
        wf.appendChild(li);
      });
      box.appendChild(wf);
    }
    return box;
  });
}

function renderAnnotate(d) {
  const box = el("div");
  if (d.summary) box.appendChild(el("p", "tldr", d.summary));
  if (d.img) {
    const shot = el("div", "shot");
    const img = el("img");
    img.src = d.img;
    img.alt = "Screenshot of " + (d.url || "the page");
    shot.appendChild(img);
    d.notes.forEach((n, i) => {
      if (n.x == null) return;
      const pin = el("span", "pin " + n.kind, String(i + 1));
      pin.style.left = n.x + "%";
      pin.style.top = n.y + "%";
      pin.style.setProperty("--c", colorFor(n.tg));
      pin.id = "pin-" + i;
      shot.appendChild(pin);
    });
    box.appendChild(shot);
    const legend = el("div", "chips-row static");
    append(legend, pill("fix it", "bad"), pill("keep it", "good"), pill("add here", "info"));
    box.appendChild(legend);
  } else {
    box.appendChild(el("p", "micro", "Screenshot not available. Notes below still point at what was on screen."));
  }
  const ol = el("ol", "notes");
  d.notes.forEach((n, i) => {
    const li = el("li", n.kind);
    li.addEventListener("mouseenter", () => $("pin-" + i) && $("pin-" + i).classList.add("hl"));
    li.addEventListener("mouseleave", () => $("pin-" + i) && $("pin-" + i).classList.remove("hl"));
    const head = el("div", "gap-head start");
    const tg = el("span", "tg-chip static");
    tg.style.setProperty("--c", colorFor(n.tg));
    append(tg, el("i"), el("span", null, n.tg));
    append(head, el("span", "rank-n", String(i + 1)), pill(n.kind, n.kind === "keep" ? "good" : n.kind === "add" ? "info" : "bad"), tg);
    append(li, head, el("p", null, n.note), n.target ? el("small", "muted", `On: "${n.target.slice(0, 80)}"`) : null);
    ol.appendChild(li);
  });
  box.appendChild(ol);
  return box;
}

const LENS_RENDER = {
  media: ["Platform-ready ad copy", renderMedia],
  seo: ["Search phrases, gaps, on-page and FAQ", renderSeo],
  cro: ["Message match, objections, tests and audit", renderCro],
  design: ["Visual direction and landing page outline", renderDesign],
  annotate: ["Notes pinned on your screen", renderAnnotate],
};

function renderLensOutputs() {
  const out = $("lensOut");
  if (!out) return;
  out.innerHTML = "";
  [...LENS_ORDER, "annotate"].forEach((id) => {
    if (!lastLenses[id] || !lastLenses[id].data) return;
    const [title, fn] = LENS_RENDER[id];
    out.appendChild(lensCard(id, title, fn(lastLenses[id].data)));
  });
}

function refreshToolkit() {
  const slot = $("toolkitSlot");
  if (slot) slot.replaceChildren(renderToolkit());
  renderLensOutputs();
}

function lensRunning(id, on, note) {
  const t = $("tile-" + id);
  if (!t) return;
  t.classList.toggle("running", on);
  const s = t.querySelector(".lens-status");
  if (on) s.textContent = note || pick(LENS_QUIPS[id] || ["Working..."]);
}

async function lensCall(id, user) {
  const s = await getSettings();
  const pid = s.provider;
  if (!isReady(pid, s)) {
    openDrawer();
    throw new UserError(`No key, no magic. Add your ${PROVIDERS[pid].label} key in Settings.`);
  }
  const reply = await callProvider({
    id: pid,
    settings: s,
    apiKey: (s.keys && s.keys[pid]) || "",
    model: modelFor(pid, s),
    system: LENSES[id].system,
    user,
  });
  let raw;
  try {
    raw = parseModelJson(reply.text);
  } catch (e) {
    if (reply.finish === "MAX_TOKENS") throw new UserError("The AI ran out of room on this one. Lock fewer TGs or switch to a roomier provider.");
    throw new UserError(e.message);
  }
  return { data: normaliseLens(id, raw), model: `${PROVIDERS[pid].label} · ${reply.model}` };
}

async function runLens(id) {
  if (busy || !lastReport) return;
  setBusy(true);
  hideToast();
  lensRunning(id, true);
  const t0 = Date.now();
  try {
    const s = await getSettings();
    const user = buildLensUser(id, {
      report: lastReport,
      site: lastSite,
      market: lastMeta.market,
      language: lastMeta.language,
      budget: PROVIDERS[s.provider].budget,
    });
    const out = await lensCall(id, user);
    lastLenses[id] = { ...out, rev: lastReport._rev || 0, date: new Date().toISOString() };
    saveRunSoon();
    setBusy(false);
    refreshToolkit();
    $("lens-" + id).scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`${LENSES[id].label} is ready.`, ` Took ${Math.round((Date.now() - t0) / 1000)}s.`);
  } catch (e) {
    showToast(pick(ERROR_TITLES), errorText(e), true);
  } finally {
    if (busy) setBusy(false);
    lensRunning(id, false);
    refreshToolkit();
  }
}

async function captureScreen(tab) {
  try {
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 62 });
  } catch (e) {
    const origins = ["<all_urls>"];
    if (!(await chrome.permissions.contains({ origins }))) {
      const ok = await chrome.permissions.request({ origins });
      if (ok) return chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 62 });
    }
    return null;
  }
}

async function runAnnotate() {
  if (busy || !lastReport) return;
  setBusy(true);
  hideToast();
  lensRunning("annotate", true);
  try {
    const tab = await activeTab();
    if (!tab || !tab.url || new URL(tab.url).origin !== lastMeta.origin) {
      throw new UserError(`Switch to a ${new URL(lastMeta.origin).hostname} tab first. We annotate what's on your screen.`);
    }
    const img = await captureScreen(tab); // first, while the click still counts as a user gesture
    const [{ result: vp }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractViewport });
    if (!vp.els.length) throw new UserError("Nothing readable on screen. Scroll to some content and try again.");
    const s = await getSettings();
    const user = buildLensUser("annotate", {
      report: lastReport,
      site: lastSite,
      market: lastMeta.market,
      language: lastMeta.language,
      budget: PROVIDERS[s.provider].budget,
      viewport: vp,
    });
    const out = await lensCall("annotate", user);
    out.data.notes.forEach((n) => {
      const e = vp.els.find((x) => x.id === n.el);
      if (e) {
        n.x = Math.min(97, Math.max(3, e.x + Math.min(e.w, 40) / 2));
        n.y = Math.min(96, Math.max(4, e.y + Math.min(e.h, 20) / 2));
        n.target = e.text;
      }
    });
    out.data.img = img;
    out.data.url = vp.url;
    out.data.aspect = vp.h / vp.w;
    lastLenses.annotate = { ...out, rev: lastReport._rev || 0, date: new Date().toISOString() };
    saveRunSoon();
    setBusy(false);
    refreshToolkit();
    $("lens-annotate").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Screen annotated.", img ? "" : " Chrome didn't allow a screenshot, so you get the notes without the picture.");
  } catch (e) {
    showToast(pick(ERROR_TITLES), errorText(e), true);
  } finally {
    if (busy) setBusy(false);
    lensRunning("annotate", false);
    refreshToolkit();
  }
}

// ---------- the whole report ----------

function renderReport(report, meta) {
  const r = normalise(report);
  const out = $("output");
  out.innerHTML = "";
  out.classList.add("cards-enter");
  out.appendChild(renderBrand(r, meta));
  out.appendChild(sectionTitle("The lineup", "ranked by buy-intent"));
  const slot = el("div");
  slot.id = "lineupSlot";
  slot.appendChild(renderLineup(r));
  out.appendChild(slot);
  out.appendChild(sectionTitle("Meet your TGs", `${r.tgs.length} personas, zero overlap`));
  r.tgs.forEach((t, i) => out.appendChild(renderTg(t, i, meta)));
  out.appendChild(sectionTitle("The toolkit", "one click per department"));
  const kit = el("div");
  kit.id = "toolkitSlot";
  out.appendChild(kit);
  const lensOut = el("div");
  lensOut.id = "lensOut";
  out.appendChild(lensOut);
  refreshToolkit();
  out.appendChild(renderReceipts(r));
  out.appendChild(sectionTitle("Sources", "what the AI actually read"));
  out.appendChild(renderSources(r, meta));
  $("dock").hidden = false;
  $("footnote").textContent = pick(FOOTNOTES);
  return r;
}

// ---------- main flow ----------

function remapCites(tg, oldMeta, newPages) {
  if (!oldMeta || !tg.reasons_to_buy) return tg;
  const urls = newPages.map((p) => p.url);
  tg.reasons_to_buy = tg.reasons_to_buy.map((x) => {
    if (!x || typeof x !== "object" || !x.pages) return x;
    const pages = pageNums(x.pages)
      .map((n) => {
        const old = oldMeta.pages[n - 1];
        const i = old ? urls.indexOf(pageInfo(old).url) : -1;
        return i >= 0 ? i + 1 : null;
      })
      .filter(Boolean);
    return { ...x, pages };
  });
  return tg;
}

function aiCall(s, user, onNote) {
  const id = s.provider;
  return callProvider({
    id,
    settings: s,
    apiKey: (s.keys && s.keys[id]) || "",
    model: modelFor(id, s),
    system: SYSTEM_PROMPT,
    user,
    onProgress: (n) => onNote && onNote(`Writing it up · ${n.toLocaleString()} characters`),
    onAttempt: (m) => onNote && onNote(`${PROVIDERS[id].label} · ${m}`),
  });
}

async function analyze() {
  if (busy) return;
  setBusy(true);
  hideToast();
  let progressOn = false;
  try {
    const tab = await activeTab();
    if (!tab) throw new UserError("Couldn't find the active tab. Click on the brand's website, then try again.");
    if (!tab.url) throw new UserError("Chrome didn't share this tab's address. Reload the extension at chrome://extensions, then try again.");
    if (!/^https?:/.test(tab.url)) {
      throw new UserError("This tab is a browser page, not a brand. Open the brand's website here, then hit the button.");
    }

    const s = await getSettings();
    const id = s.provider;
    const p = PROVIDERS[id];
    if (!isReady(id, s)) {
      openDrawer();
      throw new UserError(`No key, no magic. Add your ${p.label} key in Settings (it's free for some providers).`);
    }

    // Locked TGs carry over when re-running the same brand.
    const origin = new URL(tab.url).origin;
    const keep = lastReport && lastMeta && lastMeta.origin === origin ? (lastReport.tgs || []).filter((t) => t && t._locked) : [];
    const tgCount = Number(s.tgCount) || 3;
    const fresh = tgCount - keep.length;
    if (keep.length && fresh <= 0) {
      throw new UserError(`You've locked ${keep.length} TGs and asked for ${tgCount}. Unlock one, or pick a bigger number.`);
    }

    // Ask once per site (and once for a custom endpoint) for permission. Needs this click.
    const origins = [originPattern(tab.url)];
    if (id === "custom") origins.push(originPattern(s.customBase));
    if (!(await chrome.permissions.contains({ origins }))) {
      const granted = await chrome.permissions.request({ origins });
      if (!granted) throw new UserError("Chrome needs your OK to read this site. Hit the button again and choose Allow.");
    }

    $("output").innerHTML = "";
    $("dock").hidden = true;
    $("footnote").textContent = "";
    startProgress();
    progressOn = true;

    const site = await readSite(tab, (n) => ($("readNote").textContent = n), p.budget);
    if (!site.pages.length || site.pages[0].text.length < 200) {
      throw new UserError("This page is basically a blank stare. Open the brand's homepage and try again.");
    }
    $("readNote").textContent = `Read ${site.pages.length} page${site.pages.length > 1 ? "s" : ""}`;

    setStep("think");
    progress.thinkStart = Date.now();
    $("thinkNote").textContent = `${p.label} · ${modelFor(id, s)}` + (keep.length ? ` · keeping ${keep.length} locked` : "");

    const lockedNorm = keep.length ? normalise({ tgs: keep }).tgs : [];
    const makeUser = (scale) =>
      buildUserPrompt({
        origin: site.origin,
        pages: site.pages.map((pg) => ({ ...pg, text: pg.text.slice(0, Math.floor(pg.text.length * scale)) })),
        tgCount: fresh,
        extraContext: $("extra").value,
        market: s.market,
        language: s.language,
        lockedTgs: lockedNorm,
      });
    const note = (n) => ($("thinkNote").textContent = n);
    let reply;
    let trimmed = false;
    try {
      reply = await aiCall(s, makeUser(1), note);
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === "toolarge")) throw e;
      note("Too much text for this key. Trimming and retrying");
      trimmed = true;
      reply = await aiCall(s, makeUser(0.5), note); // one retry with half the page text
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
    if (keep.length) {
      const prevMeta = lastMeta;
      report.tgs = [...keep.map((t) => remapCites(JSON.parse(JSON.stringify(t)), prevMeta, site.pages)), ...(report.tgs || []).slice(0, fresh)];
    }
    report._rev = 0;
    lastReport = report;
    lastSite = site;
    lastLenses = {};
    editing.clear();
    lastMeta = {
      origin: site.origin,
      date: new Date().toISOString().slice(0, 10),
      at: new Date().toISOString(),
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
      market: s.market,
      language: s.language,
      tgCount,
    };
    runId = "r" + Date.now().toString(36);
    const secs = Math.round((Date.now() - progress.t0) / 1000);
    stopProgress();
    progressOn = false;
    setBusy(false);
    const r = renderReport(report, lastMeta);
    await saveRun();
    const hot = r.tgs.find((t) => t.hot);
    showToast(
      "Locked and loaded.",
      ` Read ${site.pages.length} pages with ${reply.model} in ${secs}s.` + (hot ? ` Hottest TG: ${hot.name}.` : "") + (keep.length ? ` Kept ${keep.length} locked.` : "")
    );
  } catch (e) {
    showToast(pick(ERROR_TITLES), errorText(e), true);
  } finally {
    if (progressOn) stopProgress();
    if (busy) setBusy(false);
  }
}

// Replaces one TG with a fresh one that doesn't overlap the others. Uses the pages already read.
async function rerollTg(order) {
  if (busy || !lastReport || !lastSite) return;
  const card = document.querySelector(`.tg[data-order="${order}"]`);
  setBusy(true);
  hideToast();
  if (card) card.classList.add("rolling");
  try {
    const s = await getSettings();
    if (!isReady(s.provider, s)) {
      openDrawer();
      throw new UserError("Add an AI key in Settings first.");
    }
    const others = normalise(lastReport).tgs.filter((t) => t.order !== order);
    const old = currentTg(order);
    const user = buildUserPrompt({
      origin: lastSite.origin,
      pages: lastSite.pages,
      tgCount: 1,
      extraContext: $("extra").value + `\nReplace a TG the user rejected: "${old.name}" (${old.situation}). Make the new one meaningfully different.`,
      market: lastMeta.market,
      language: lastMeta.language,
      lockedTgs: others,
    });
    const reply = await aiCall(s, user);
    const rep = parseModelJson(reply.text);
    const fresh = (rep.tgs || [])[0];
    if (!fresh) throw new UserError("The AI came back empty-handed. Try again.");
    lastReport.tgs[order] = fresh;
    editing.delete(order);
    touch();
    renderReport(lastReport, lastMeta);
    const i = normalise(lastReport).tgs.findIndex((t) => t.order === order);
    if (i >= 0) $("tg-" + i).scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Fresh TG, hot off the press.", ` Meet ${str(fresh.name)}. Your toolkit results now point at the old lineup, so re-run any you need.`);
  } catch (e) {
    showToast(pick(ERROR_TITLES), errorText(e), true);
    if (card) card.classList.remove("rolling");
  } finally {
    if (busy) setBusy(false);
  }
}

// ---------- history ----------

const HISTORY_PER_BRAND = 8;
let saveTimer = null;

async function getHistory() {
  const { history } = await chrome.storage.local.get({ history: {} });
  return history || {};
}

function runRecord() {
  return {
    id: runId,
    host: new URL(lastMeta.origin).hostname.replace(/^www\./, ""),
    at: lastMeta.at || new Date().toISOString(),
    report: lastReport,
    meta: lastMeta,
    site: lastSite,
    lenses: lastLenses,
  };
}

async function saveRun() {
  if (!lastReport || !runId) return;
  const rec = runRecord();
  const h = await getHistory();
  const list = (h[rec.host] || []).filter((x) => x.id !== rec.id);
  list.unshift(rec);
  h[rec.host] = list.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, HISTORY_PER_BRAND);
  await chrome.storage.local.set({ history: h });
}

function saveRunSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveRun, 500);
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const compareSel = new Set();

async function openHistory() {
  compareSel.clear();
  await renderHistory();
  openPanel("historyDrawer");
}

async function renderHistory() {
  const h = await getHistory();
  const box = $("historyList");
  box.innerHTML = "";
  $("compareOut").innerHTML = "";
  const hosts = Object.keys(h).sort((a, b) => ((h[a][0] || {}).at < (h[b][0] || {}).at ? 1 : -1));
  if (!hosts.length) {
    box.appendChild(el("p", "micro", "Nothing here yet. Every run you do gets saved here automatically (in this browser only)."));
  }
  hosts.forEach((host) => {
    const g = el("div", "hist-brand");
    const head = el("div", "gap-head");
    append(head, el("b", null, host), el("small", "muted", `${h[host].length} run${h[host].length > 1 ? "s" : ""}`));
    g.appendChild(head);
    h[host].forEach((run) => {
      const r = normalise(run.report);
      const row = el("div", "hist-run" + (run.id === runId ? " current" : ""));
      const cb = el("input");
      cb.type = "checkbox";
      cb.title = "Pick two runs to compare";
      cb.checked = compareSel.has(host + "|" + run.id);
      cb.addEventListener("change", () => {
        const k = host + "|" + run.id;
        if (cb.checked) compareSel.add(k);
        else compareSel.delete(k);
        $("compareBtn").disabled = compareSel.size !== 2;
        $("compareBtn").textContent = compareSel.size === 2 ? "Compare these two" : `Pick ${2 - Math.min(2, compareSel.size)} more to compare`;
      });
      const info = el("div", "hist-info");
      const kits = Object.keys(run.lenses || {}).filter((k) => run.lenses[k] && run.lenses[k].data);
      append(
        info,
        el("b", null, fmtDate(run.at)),
        el("small", null, [run.meta.model, run.meta.market].filter(Boolean).join(" · ")),
        el("small", "hist-lineup", r.tgs.map((t) => `${t.locked ? "🔒" : ""}${t.name} ${t.stars == null ? "" : "★" + t.stars}`).join(" · ")),
        kits.length ? el("small", "muted", "Kits: " + kits.map((k) => (LENSES[k] ? LENSES[k].label : k)).join(", ")) : null
      );
      const actions = el("div", "hist-actions");
      const open = el("button", "btn small-btn", run.id === runId ? "On screen" : "Open");
      open.type = "button";
      open.disabled = run.id === runId;
      open.addEventListener("click", () => {
        loadRun(run);
        closePanels();
      });
      const del = el("button", "icon-btn tiny", "");
      del.type = "button";
      del.title = "Delete this run";
      del.appendChild(icon("x", 12));
      del.addEventListener("click", async () => {
        const hh = await getHistory();
        hh[host] = (hh[host] || []).filter((x) => x.id !== run.id);
        if (!hh[host].length) delete hh[host];
        await chrome.storage.local.set({ history: hh });
        compareSel.delete(host + "|" + run.id);
        renderHistory();
      });
      append(actions, open, del);
      append(row, cb, info, actions);
      g.appendChild(row);
    });
    box.appendChild(g);
  });
  $("compareBtn").disabled = true;
  $("compareBtn").textContent = "Pick 2 runs to compare";
}

function loadRun(run) {
  lastReport = run.report;
  lastMeta = run.meta;
  lastSite = run.site;
  lastLenses = run.lenses || {};
  runId = run.id;
  editing.clear();
  renderReport(lastReport, lastMeta);
  setBusy(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Back from the archive.", ` ${run.host}, ${fmtDate(run.at)}.`);
}

async function compareRuns() {
  const h = await getHistory();
  const runs = [...compareSel].map((k) => {
    const [host, id] = k.split("|");
    return (h[host] || []).find((x) => x.id === id);
  });
  if (runs.some((x) => !x)) return;
  runs.sort((a, b) => (a.at < b.at ? -1 : 1));
  const out = $("compareOut");
  out.innerHTML = "";
  const card = el("div", "compare");
  const cols = el("div", "compare-cols");
  const sets = runs.map((run) => normalise(run.report).tgs);
  const names = sets.map((s) => s.map((t) => t.name.toLowerCase()));
  runs.forEach((run, k) => {
    const c = el("div", "compare-col");
    append(c, el("span", "eyebrow", k === 0 ? "Older" : "Newer"), el("b", null, run.host), el("small", "muted", fmtDate(run.at)), el("small", "muted", run.meta.model || ""));
    sets[k].forEach((t, i) => {
      const row = el("div", "compare-tg");
      const other = names[1 - k];
      const isNew = !other.includes(t.name.toLowerCase());
      append(row, el("span", "rank-n", String(i + 1)), el("span", null, (t.hot ? "🔥 " : "") + t.name), html("span", null, starsHtml(t.stars)), isNew ? pill(k === 0 ? "dropped" : "new", k === 0 ? "bad" : "good") : null);
      c.appendChild(row);
    });
    cols.appendChild(c);
  });
  card.appendChild(cols);
  const hot = sets.map((s) => (s[0] ? s[0].name : "-"));
  const kept = sets[1].filter((t) => names[0].includes(t.name.toLowerCase())).length;
  card.appendChild(
    el(
      "p",
      "micro",
      `${hot[0] === hot[1] ? `Hottest TG held steady: ${hot[1]}.` : `Hottest TG changed from ${hot[0]} to ${hot[1]}.`} ${kept} of ${sets[1].length} TGs share a name across both runs (the AI often renames the same idea, so read the situations too).`
    )
  );
  out.appendChild(card);
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- exports ----------

function fileBase() {
  const host = new URL(lastMeta.origin).hostname.replace(/^www\./, "");
  return `TG-report-${host}-${lastMeta.date}`;
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportAs(kind) {
  if (!lastReport) return;
  $("exportMenu").hidden = true;
  try {
    if (kind === "text") {
      await navigator.clipboard.writeText(toMarkdown(lastReport, lastMeta, lastLenses));
      showToast("Copied.", " Paste it anywhere: Slack, Notion, an email to the client.");
    } else if (kind === "docs") {
      const md = toMarkdown(lastReport, lastMeta, lastLenses);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([mdToHtml(md)], { type: "text/html" }),
          "text/plain": new Blob([md], { type: "text/plain" }),
        }),
      ]);
      showToast("Copied for Google Docs.", " Open a new Doc (docs.new) and paste. Headings and lists come along for the ride.");
    } else if (kind === "html") {
      download(new Blob([toHtml(lastReport, lastMeta, lastLenses)], { type: "text/html" }), fileBase() + ".html");
      showToast("Report downloaded.", " Open it and print to PDF if the client wants a PDF.");
    } else if (kind === "pptx") {
      await buildSlides();
      showToast("Slides downloaded.", " Opens in PowerPoint and Keynote. For Google Slides: File > Import slides.");
    }
  } catch (e) {
    showToast(pick(ERROR_TITLES), " Export failed: " + e.message, true);
  }
}

// ---------- slides ----------

const SL = { ink: "151515", muted: "65675E", bg: "EEEFE9", paper: "FFFFFF", orange: "F54E00", yellow: "F7A501", font: "Arial" };

function hex(c) {
  return /^#?[0-9a-f]{6}$/i.test(String(c)) ? String(c).replace("#", "").toUpperCase() : SL.ink;
}

function starRow(slide, stars, x, y, size) {
  for (let i = 1; i <= 5; i++) {
    const full = stars != null && stars >= i;
    const half = stars != null && !full && stars >= i - 0.5;
    slide.addShape("star5", {
      x: x + (i - 1) * size * 1.1,
      y,
      w: size,
      h: size,
      fill: { color: full ? SL.yellow : half ? "F9CF7A" : "D9DAD2" },
      line: { color: full || half ? SL.yellow : "D9DAD2", width: 0.5 },
    });
  }
}

function slideBase(pptx, eyebrow, title, color) {
  const s = pptx.addSlide();
  s.background = { color: SL.bg };
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.18, fill: { color: hex(color || SL.orange) }, line: { color: hex(color || SL.orange) } });
  s.addText(eyebrow.toUpperCase(), { x: 0.6, y: 0.4, w: 12, h: 0.3, fontFace: SL.font, fontSize: 11, bold: true, color: SL.muted, charSpacing: 2 });
  s.addText(title, { x: 0.6, y: 0.7, w: 12, h: 0.8, fontFace: SL.font, fontSize: 30, bold: true, color: SL.ink });
  return s;
}

function bullets(lines, opts) {
  return lines.filter(Boolean).map((t) => ({ text: t, options: { bullet: true, breakLine: true, ...(opts || {}) } }));
}

// A small grey heading inside a text box; first = no space above.
function label(text, first) {
  return { text, options: { bold: true, fontSize: 11, color: SL.muted, bullet: false, breakLine: true, paraSpaceBefore: first ? 0 : 10 } };
}

async function buildSlides() {
  if (typeof PptxGenJS === "undefined") throw new Error("slides library didn't load");
  const r = normalise(lastReport);
  const bs = r.brand_summary;
  const brand = bs.brand || new URL(lastMeta.origin).hostname;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `Who's buying ${brand}?`;
  const T = { fontFace: SL.font, color: SL.ink, valign: "top" };

  // Title
  let s = pptx.addSlide();
  s.background = { color: SL.ink };
  s.addText("TG REPORT", { x: 0.8, y: 1.6, w: 11, h: 0.4, fontFace: SL.font, fontSize: 14, bold: true, color: SL.yellow, charSpacing: 3 });
  s.addText(`Who's buying ${brand}?`, { x: 0.8, y: 2.1, w: 11.5, h: 1.6, fontFace: SL.font, fontSize: 48, bold: true, color: "FFFFFF" });
  s.addText([lastMeta.origin, lastMeta.date, lastMeta.market, lastMeta.language].filter(Boolean).join("  ·  "), {
    x: 0.8,
    y: 4.0,
    w: 11.5,
    h: 0.4,
    fontFace: SL.font,
    fontSize: 14,
    color: "C9CAC2",
  });

  // Brand read
  s = slideBase(pptx, "The brand, decoded", brand);
  s.addText(
    [
      { text: "What they sell\n", options: { bold: true, fontSize: 13, color: SL.muted } },
      { text: bs.what_they_sell + "\n\n", options: { fontSize: 18 } },
      { text: "Positioning\n", options: { bold: true, fontSize: 13, color: SL.muted } },
      { text: bs.positioning + "\n\n", options: { fontSize: 18 } },
      { text: "Who pays vs who uses\n", options: { bold: true, fontSize: 13, color: SL.muted } },
      { text: bs.who_pays_vs_uses, options: { fontSize: 18 } },
    ],
    { ...T, x: 0.6, y: 1.7, w: 12, h: 5.2 }
  );

  // Lineup
  s = slideBase(pptx, "The lineup", "Ranked by buy-intent");
  r.tgs.forEach((t, i) => {
    const y = 1.8 + i * 1.0;
    const c = hex(TG_COLORS[i % TG_COLORS.length]);
    s.addShape("ellipse", { x: 0.6, y: y + 0.1, w: 0.55, h: 0.55, fill: { color: c }, line: { color: c } });
    s.addText(String(i + 1), { x: 0.6, y: y + 0.1, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: SL.font, bold: true, color: "FFFFFF", fontSize: 16 });
    s.addText((t.hot ? "🔥 " : "") + t.name, { x: 1.4, y, w: 7, h: 0.45, fontFace: SL.font, bold: true, fontSize: 20, color: SL.ink });
    s.addText(t.tldr || heatLabel(t.stars), { x: 1.4, y: y + 0.42, w: 7, h: 0.35, fontFace: SL.font, italic: true, fontSize: 12, color: SL.muted });
    starRow(s, t.stars, 9.0, y + 0.12, 0.38);
    s.addText(t.stars == null ? "" : t.stars.toFixed(1), { x: 11.3, y: y + 0.05, w: 1, h: 0.5, fontFace: SL.font, bold: true, fontSize: 20, color: SL.ink });
  });

  // One slide per TG
  r.tgs.forEach((t, i) => {
    const c = TG_COLORS[i % TG_COLORS.length];
    s = slideBase(pptx, `TG ${i + 1}${t.hot ? " · Hottest TG" : ""} · ${tagLabel(t.evidence)}`, t.name, c);
    if (t.tldr) s.addText(t.tldr, { x: 0.6, y: 1.45, w: 8, h: 0.4, fontFace: SL.font, italic: true, fontSize: 14, color: SL.muted });
    starRow(s, t.stars, 9.2, 0.85, 0.36);
    s.addText(`${t.stars == null ? "" : t.stars.toFixed(1) + " · "}${heatLabel(t.stars)}`, { x: 9.2, y: 1.3, w: 3.6, h: 0.35, fontFace: SL.font, fontSize: 12, bold: true, color: SL.ink });
    s.addShape("roundRect", { x: 0.6, y: 2.0, w: 12.1, h: 0.75, fill: { color: "FFF3C4" }, line: { color: SL.ink, width: 1 }, rectRadius: 0.08 });
    s.addText([{ text: "The bouncer question  ", options: { bold: true, color: SL.muted, fontSize: 11 } }, { text: t.split_question, options: { bold: true, fontSize: 15 } }], {
      ...T,
      x: 0.8,
      y: 2.05,
      w: 11.8,
      h: 0.65,
      valign: "middle",
    });
    s.addText(
      [
        label("Situation", true),
        { text: t.situation + "\n\n", options: { fontSize: 13 } },
        label("First thought in their head", true),
        { text: `"${t.first_question}"\n\n`, options: { fontSize: 13, italic: true } },
        label("Why they'd buy", true),
        ...bullets(t.reasons_to_buy.slice(0, 3).map((x) => x.reason), { fontSize: 13 }),
      ],
      { ...T, x: 0.6, y: 3.0, w: 6.2, h: 4.2 }
    );
    s.addShape("rect", { x: 7.1, y: 3.0, w: 5.6, h: 3.9, fill: { color: SL.paper }, line: { color: SL.ink, width: 1 } });
    s.addText(
      [
        label("Lead line", true),
        { text: t.lead_copy.line + "\n", options: { bold: true, fontSize: 18 } },
        { text: (t.lead_copy.tone ? "Tone: " + t.lead_copy.tone : "") + "\n\n", options: { fontSize: 11, color: SL.muted } },
        label("Landing page hero", true),
        { text: t.landing_page_hero.headline + "\n", options: { bold: true, fontSize: 15 } },
        { text: t.landing_page_hero.subhead + "\n", options: { fontSize: 12 } },
        { text: t.landing_page_hero.cta ? "[ " + t.landing_page_hero.cta + " ]" : "", options: { bold: true, fontSize: 12, color: hex(c) } },
      ],
      { ...T, x: 7.3, y: 3.15, w: 5.2, h: 3.6 }
    );
  });

  const L = lastLenses;
  if (L.media && L.media.data) {
    L.media.data.tgs.forEach((t) => {
      s = slideBase(pptx, "Media kit", t.tg, colorFor(t.tg));
      s.addText(
        [
          label("Google headlines (max 30)", true),
          ...bullets(t.google_headlines.map((x) => `${x.text}  (${x.len})`), { fontSize: 12 }),
          label("Google descriptions (max 90)"),
          ...bullets(t.google_descriptions.map((x) => x.text), { fontSize: 12 }),
        ],
        { ...T, x: 0.6, y: 1.6, w: 6, h: 5.6 }
      );
      s.addText(
        [
          label("Meta primary text", true),
          ...bullets(t.meta_primary.map((x) => x.text), { fontSize: 12 }),
          label("Meta headlines"),
          ...bullets(t.meta_headlines.map((x) => x.text), { fontSize: 12 }),
          label("YouTube 5-second hooks"),
          ...bullets(t.youtube_hooks.map((x) => x.text), { fontSize: 12 }),
        ],
        { ...T, x: 6.9, y: 1.6, w: 5.9, h: 5.6 }
      );
    });
  }
  if (L.seo && L.seo.data) {
    const d = L.seo.data;
    s = slideBase(pptx, "SEO kit", "What they'd search, and where the site falls short");
    const w = 12.1 / Math.max(1, d.search_phrases.length);
    d.search_phrases.forEach((sp, k) => {
      s.addText(
        [{ text: sp.tg + "\n", options: { bold: true, fontSize: 12, color: hex(colorFor(sp.tg)) } }, ...bullets(sp.phrases.slice(0, 6).map((p) => `${p.q} (${p.intent})`), { fontSize: 11 })],
        { ...T, x: 0.6 + k * w, y: 1.6, w: w - 0.2, h: 2.9 }
      );
    });
    s.addText(
      [label("Content gaps", true), ...bullets(d.content_gaps.map((g) => `${g.tg}: ${g.status}. ${g.suggested_page.title ? "Build “" + g.suggested_page.title + "”" : g.gap}`), { fontSize: 12 })],
      { ...T, x: 0.6, y: 4.7, w: 12.1, h: 2.5 }
    );
  }
  if (L.cro && L.cro.data) {
    const d = L.cro.data;
    s = slideBase(pptx, "CRO kit", "How the page speaks to each TG");
    d.message_match.forEach((m, k) => {
      const y = 1.8 + k * 0.7;
      s.addText(m.tg, { x: 0.6, y, w: 4, h: 0.4, fontFace: SL.font, bold: true, fontSize: 13, color: SL.ink });
      s.addShape("rect", { x: 4.7, y: y + 0.08, w: 6, h: 0.28, fill: { color: "D9DAD2" }, line: { color: "D9DAD2" } });
      const col = m.score >= 70 ? "00A37A" : m.score >= 45 ? SL.yellow : "C4271C";
      s.addShape("rect", { x: 4.7, y: y + 0.08, w: Math.max(0.05, (6 * m.score) / 100), h: 0.28, fill: { color: col }, line: { color: col } });
      s.addText(String(m.score), { x: 10.9, y, w: 1, h: 0.4, fontFace: SL.font, bold: true, fontSize: 16, color: SL.ink });
    });
    s.addText(
      [label("Audit", true), ...bullets(d.heuristics.map((h) => `${HEURISTIC_LABELS[h.check] || h.check}: ${h.verdict.toUpperCase()}. ${h.fix}`), { fontSize: 12 })],
      { ...T, x: 0.6, y: 1.9 + d.message_match.length * 0.7, w: 12.1, h: 3 }
    );
    s = slideBase(pptx, "CRO kit", "Test backlog, by ICE");
    s.addTable(
      [
        ["#", "TG", "Hypothesis", "I", "C", "E", "ICE"].map((h) => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: SL.ink } } })),
        ...d.hypotheses.slice(0, 7).map((h, i) => [String(i + 1), h.tg, `${h.change} ${h.expected} ${h.because}`, String(h.impact), String(h.confidence), String(h.ease), String(h.ice)]),
      ],
      { x: 0.6, y: 1.6, w: 12.1, colW: [0.4, 2.0, 7.3, 0.55, 0.55, 0.55, 0.75], fontFace: SL.font, fontSize: 10, border: { type: "solid", color: "CFD0C8", pt: 0.5 }, fill: { color: SL.paper } }
    );
  }
  if (L.design && L.design.data) {
    L.design.data.directions.forEach((x) => {
      s = slideBase(pptx, "Design kit", x.tg, colorFor(x.tg));
      s.addText(x.tone, { x: 0.6, y: 1.45, w: 12, h: 0.4, fontFace: SL.font, italic: true, fontSize: 14, color: SL.muted });
      x.palette.forEach((p, k) => {
        s.addShape("roundRect", { x: 0.6 + k * 1.6, y: 2.0, w: 1.4, h: 1.0, fill: { color: hex(p.hex) }, line: { color: SL.ink, width: 1 }, rectRadius: 0.08 });
        s.addText(`${p.hex}\n${p.role}`, { x: 0.6 + k * 1.6, y: 3.05, w: 1.5, h: 0.6, fontFace: SL.font, fontSize: 10, color: SL.ink });
      });
      const outline = (L.design.data.lp_outline.find((o) => o.tg === x.tg) || {}).sections || [];
      s.addText(
        [
          label("Imagery: do", true),
          ...bullets(x.imagery_do, { fontSize: 12 }),
          label("Imagery: don't"),
          ...bullets(x.imagery_dont, { fontSize: 12 }),
        ],
        { ...T, x: 0.6, y: 3.8, w: 5.6, h: 3.4 }
      );
      s.addText(
        [label("Landing page outline", true), ...outline.map((sec, k) => ({ text: `${k + 1}. ${sec.name}: ${sec.goal}`, options: { fontSize: 11, breakLine: true } }))],
        { ...T, x: 6.6, y: 3.8, w: 6.1, h: 3.4 }
      );
    });
  }
  if (L.annotate && L.annotate.data) {
    const d = L.annotate.data;
    s = slideBase(pptx, "Annotated screenshot", d.summary || "Notes on the page");
    if (d.img) {
      let W = 7.6;
      let H = W * (d.aspect || 0.5625);
      if (H > 5.4) {
        W = (W * 5.4) / H;
        H = 5.4;
      }
      s.addImage({ data: d.img, x: 0.6, y: 1.7, w: W, h: H });
      d.notes.forEach((n, i) => {
        if (n.x == null) return;
        const col = n.kind === "keep" ? "00A37A" : n.kind === "add" ? "1D4AFF" : SL.orange;
        s.addShape("ellipse", { x: 0.6 + (W * n.x) / 100 - 0.16, y: 1.7 + (H * n.y) / 100 - 0.16, w: 0.32, h: 0.32, fill: { color: col }, line: { color: "FFFFFF", width: 1.5 } });
        s.addText(String(i + 1), { x: 0.6 + (W * n.x) / 100 - 0.16, y: 1.7 + (H * n.y) / 100 - 0.16, w: 0.32, h: 0.32, align: "center", valign: "middle", fontFace: SL.font, fontSize: 9, bold: true, color: "FFFFFF" });
      });
    }
    s.addText(d.notes.map((n, i) => ({ text: `${i + 1}. [${n.kind}] ${n.tg}: ${n.note}`, options: { fontSize: 10, breakLine: true } })), { ...T, x: 8.5, y: 1.7, w: 4.3, h: 5.5 });
  }

  // Sources
  const src = buildSources(r, lastMeta);
  s = slideBase(pptx, "Sources", `${src.rows.length} pages read · ${src.cited}/${src.claims} reasons cited`);
  s.addText(
    src.rows.map((row) => ({ text: `p${row.n}  ${row.title || row.url}  —  ${row.url}`, options: { fontSize: 11, breakLine: true } })),
    { ...T, x: 0.6, y: 1.7, w: 12.1, h: 5.4 }
  );

  await pptx.writeFile({ fileName: fileBase() + ".pptx" });
}

// ---------- setup controls ----------

function setTgCount(n) {
  settingsCache.tgCount = n;
  document.querySelectorAll("#tgCount button").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.n) === n)));
  $("tgHint").textContent = TG_HINTS[n] || "";
}

function fillSelect(id, values, current) {
  const sel = $(id);
  sel.innerHTML = "";
  values.forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  });
  sel.value = values.includes(current) ? current : values[0];
}

// ---------- wiring ----------

async function init() {
  $("tagline").textContent = pick(TAGLINES);
  const s = await getSettings();
  setTgCount(Number(s.tgCount) || 3);
  fillSelect("market", MARKETS, s.market);
  fillSelect("language", LANGUAGES, s.language);
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
["market", "language"].forEach((id) =>
  $(id).addEventListener("change", () => {
    settingsCache[id] = $(id).value;
    chrome.storage.local.set({ [id]: $(id).value });
  })
);
$("openSettings").addEventListener("click", openDrawer);
$("openHistory").addEventListener("click", openHistory);
$("historyDock").addEventListener("click", openHistory);
$("providerPill").addEventListener("click", openDrawer);
$("closeSettings").addEventListener("click", closePanels);
$("closeHistory").addEventListener("click", closePanels);
$("scrim").addEventListener("click", closePanels);
$("compareBtn").addEventListener("click", compareRuns);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePanels();
    $("exportMenu").hidden = true;
  }
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
$("exportBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  $("exportMenu").hidden = !$("exportMenu").hidden;
});
document.addEventListener("click", (e) => {
  if (!$("exportMenu").hidden && !$("exportMenu").contains(e.target)) $("exportMenu").hidden = true;
});
document.querySelectorAll("#exportMenu button").forEach((b) => b.addEventListener("click", () => exportAs(b.dataset.kind)));
chrome.tabs.onActivated.addListener(updateTarget);
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url || info.favIconUrl || info.status === "complete") updateTarget();
});
chrome.windows.onFocusChanged.addListener(updateTarget);

init();
