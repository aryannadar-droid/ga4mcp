// AI provider registry and callers. Bring your own key: every provider here is called
// straight from the browser with the user's own key, which never leaves chrome.storage.local.
// Depends on nothing; sidepanel.js uses PROVIDERS, callProvider, listModels and ApiError.

const PROVIDERS = {
  groq: {
    label: "Groq",
    blurb: "Free key, very fast. Reads less of each site.",
    free: true,
    kind: "openai",
    base: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
    fallbacks: ["llama-3.3-70b-versatile", "openai/gpt-oss-20b"],
    keyUrl: "https://console.groq.com/keys",
    // Groq's free tier caps tokens per minute (about 8,000 on its main open model), so it reads less text.
    budget: { home: 3500, page: 1800, extra: 3 },
    maxOut: 3200,
    reasoning: (m) => /^openai\/gpt-oss/.test(m),
    hideModel: /whisper|orpheus|guard|tts|safeguard|embed/i,
  },
  gemini: {
    label: "Google Gemini",
    blurb: "Free key, big appetite. Reads the most pages.",
    free: true,
    kind: "gemini",
    base: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-flash-latest",
    fallbacks: ["gemini-2.5-flash", "gemini-flash-lite-latest"],
    keyUrl: "https://aistudio.google.com/apikey",
    budget: { home: 7000, page: 3500, extra: 6 },
    maxOut: 12000,
  },
  openai: {
    label: "OpenAI",
    blurb: "Paid key. The GPT family.",
    kind: "openai",
    base: "https://api.openai.com/v1",
    model: "gpt-5-mini",
    fallbacks: ["gpt-4.1-mini"],
    keyUrl: "https://platform.openai.com/api-keys",
    budget: { home: 7000, page: 3500, extra: 6 },
    maxOut: 16000,
    reasoning: (m) => /^(gpt-5|o\d)/.test(m),
    noTemperature: (m) => /^(gpt-5|o\d)/.test(m),
    showModel: /^(gpt|o\d|chatgpt)/i,
    hideModel: /audio|realtime|tts|transcribe|image|search|embedding|instruct/i,
  },
  anthropic: {
    label: "Anthropic Claude",
    blurb: "Paid key. Careful, nuanced writer.",
    kind: "anthropic",
    base: "https://api.anthropic.com/v1",
    model: "claude-sonnet-5-5",
    fallbacks: ["claude-haiku-5-5"],
    keyUrl: "https://console.anthropic.com/settings/keys",
    budget: { home: 7000, page: 3500, extra: 6 },
    maxOut: 12000,
  },
  openrouter: {
    label: "OpenRouter",
    blurb: "One key, hundreds of models. Some are free.",
    kind: "openai",
    base: "https://openrouter.ai/api/v1",
    model: "openrouter/auto",
    fallbacks: [],
    keyUrl: "https://openrouter.ai/keys",
    budget: { home: 7000, page: 3500, extra: 6 },
    maxOut: 12000,
    tokenParam: "max_tokens",
  },
  mistral: {
    label: "Mistral",
    blurb: "Free experiment tier. Made in Europe.",
    free: true,
    kind: "openai",
    base: "https://api.mistral.ai/v1",
    model: "mistral-large-latest",
    fallbacks: ["mistral-small-latest"],
    keyUrl: "https://console.mistral.ai/api-keys",
    budget: { home: 6000, page: 3000, extra: 5 },
    maxOut: 8000,
    tokenParam: "max_tokens",
    hideModel: /embed|moderation|ocr|voxtral|codestral/i,
  },
  deepseek: {
    label: "DeepSeek",
    blurb: "Paid key, very cheap per run.",
    kind: "openai",
    base: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    fallbacks: [],
    keyUrl: "https://platform.deepseek.com/api_keys",
    budget: { home: 7000, page: 3500, extra: 6 },
    maxOut: 8000,
    tokenParam: "max_tokens",
  },
  xai: {
    label: "xAI Grok",
    blurb: "Paid key. The Grok models.",
    kind: "openai",
    base: "https://api.x.ai/v1",
    model: "grok-3-mini",
    fallbacks: [],
    keyUrl: "https://console.x.ai",
    budget: { home: 7000, page: 3500, extra: 6 },
    maxOut: 12000,
    reasoning: (m) => /mini/.test(m),
    hideModel: /image|vision|imagine/i,
  },
  custom: {
    label: "Custom",
    blurb: "Any OpenAI-compatible endpoint: Together, Fireworks, LM Studio, Ollama, your own proxy.",
    kind: "openai",
    base: "",
    model: "",
    fallbacks: [],
    keyUrl: "",
    keyOptional: true,
    budget: { home: 6000, page: 3000, extra: 5 },
    maxOut: 8000,
    tokenParam: "max_tokens",
  },
};

const PROVIDER_ORDER = ["groq", "gemini", "openai", "anthropic", "openrouter", "mistral", "deepseek", "xai", "custom"];

let IDLE_MS = 60000; // give up on a streaming model if it sends nothing for this long
let REQUEST_TIMEOUT_MS = 120000;
let RETRY_DELAY_MS = 1500;
let MAX_WAIT_S = 20;

class UserError extends Error {}

class ApiError extends UserError {
  constructor(message, kind) {
    super(message);
    this.kind = kind || "fatal"; // transient | quota | notfound | stall | toolarge | fatal
  }
}

class RetryNoThinking extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clip = (m) => String(m || "").replace(/\s+/g, " ").slice(0, 200);

function providerBase(id, settings) {
  const p = PROVIDERS[id];
  if (id === "custom") return String((settings && settings.customBase) || "").trim().replace(/\/+$/, "");
  return p.base;
}

// Generic HTTP status -> ApiError mapping shared by every provider.
function mapError(label, status, m, retryAfter) {
  m = clip(m);
  if (status === 401 || (status === 400 && /api[ _-]?key|unauthori[sz]ed|invalid.*key/i.test(m))) {
    return new ApiError(`${label} didn't like that key. Double-check it in Settings.`, "fatal");
  }
  if (status === 402) return new ApiError(`${label} says this account is out of credits. ${m}`, "fatal");
  if (status === 403) return new ApiError(`${label} refused this key or model. ${m}`, "fatal");
  if (status === 404 || (status === 400 && /model.*(decommission|not.?found|does not exist|invalid)/i.test(m))) {
    return new ApiError(`${label} can't find that model. In Settings, hit "Load my models" and pick one.`, "notfound");
  }
  if (status === 413 || (status === 429 && /request too large|too many tokens|context/i.test(m))) {
    return new ApiError(
      `This site has more text than ${label}'s free per-minute limit allows. Switch to a roomier provider (Gemini works) for big sites.`,
      "toolarge"
    );
  }
  if (status === 429) {
    const w = Number(retryAfter);
    return new ApiError(
      `${label}'s rate limit kicked in${w > 0 ? " (try again in about " + Math.ceil(w) + " seconds)" : ""}.`,
      "quota"
    );
  }
  if (status === 529 || status >= 500) return new ApiError(`${label} is busy right now (HTTP ${status}).`, "transient");
  return new ApiError(`${label} error ${status}. ${m}`, "fatal");
}

// ---------- OpenAI-compatible (Groq, OpenAI, OpenRouter, Mistral, DeepSeek, xAI, custom) ----------

async function runOpenAI({ id, settings, apiKey, model, system, user, reasoning }) {
  const p = PROVIDERS[id];
  const base = providerBase(id, settings);
  const dropped = new Set(); // params the endpoint rejected; we retry without them
  let tokenParam = p.tokenParam || "max_completion_tokens";

  for (let attempt = 0; attempt < 5; attempt++) {
    const body = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      [tokenParam]: p.maxOut,
    };
    if (!dropped.has("temperature") && !(p.noTemperature && p.noTemperature(model))) body.temperature = 0.4;
    if (!dropped.has("response_format")) body.response_format = { type: "json_object" };
    if (reasoning && p.reasoning && p.reasoning(model)) body.reasoning_effort = "low";

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    if (id === "openrouter") {
      headers["HTTP-Referer"] = "https://github.com/whosemytg";
      headers["X-Title"] = "WhoseMyTG";
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    let res;
    let data = {};
    try {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      try {
        data = await res.json();
      } catch (e) {}
    } catch (e) {
      throw e.name === "AbortError"
        ? new ApiError(`${p.label} went quiet for ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds.`, "stall")
        : new UserError(`Couldn't reach ${p.label}. Check your internet${id === "custom" ? " and the base URL" : ""}.`);
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) {
      const c = data.choices && data.choices[0];
      const text = (c && c.message && c.message.content) || "";
      if (!text) throw new ApiError(`${p.label} sent back an empty reply.`, "transient");
      return { text, finish: c.finish_reason === "length" ? "MAX_TOKENS" : c.finish_reason || "" };
    }

    const err = (Array.isArray(data) ? data[0] : data).error || data || {};
    const m = typeof err === "string" ? err : err.message || data.message || data.detail || "";
    const retryAfter = res.headers.get("retry-after");

    if (res.status === 400 || res.status === 422) {
      if (body.reasoning_effort && /reasoning/i.test(m)) throw new RetryNoThinking();
      if (body.temperature != null && /temperature/i.test(m)) {
        dropped.add("temperature");
        continue;
      }
      if (body.response_format && /response_format|json_object|json mode/i.test(m)) {
        dropped.add("response_format");
        continue;
      }
      if (/max_completion_tokens/i.test(m) && tokenParam !== "max_tokens") {
        tokenParam = "max_tokens";
        continue;
      }
      if (err.code === "json_validate_failed") throw new ApiError(`${p.label} returned broken JSON.`, "transient");
    }
    if (res.status === 429 && attempt === 0 && !/request too large/i.test(m)) {
      const wait = Number(retryAfter);
      if (wait > 0 && wait <= MAX_WAIT_S) {
        await sleep(wait * 1000 + 300); // short wait the API asked for, then retry once
        continue;
      }
    }
    throw mapError(p.label, res.status, m, retryAfter);
  }
  throw new ApiError(`${p.label} keeps rejecting the request. Try another model.`, "fatal");
}

// ---------- Anthropic ----------

async function runAnthropic({ id, apiKey, model, system, user }) {
  const p = PROVIDERS[id];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res;
  let data = {};
  try {
    res = await fetch(`${p.base}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: p.maxOut,
        system,
        messages: [{ role: "user", content: user + "\n\nReturn only the JSON object." }],
      }),
      signal: ctrl.signal,
    });
    try {
      data = await res.json();
    } catch (e) {}
  } catch (e) {
    throw e.name === "AbortError"
      ? new ApiError(`${p.label} went quiet for ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds.`, "stall")
      : new UserError(`Couldn't reach ${p.label}. Check your internet.`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const m = (data.error && data.error.message) || "";
    throw mapError(p.label, res.status, m, res.headers.get("retry-after"));
  }
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text) throw new ApiError(`${p.label} sent back an empty reply.`, "transient");
  return { text, finish: data.stop_reason === "max_tokens" ? "MAX_TOKENS" : data.stop_reason || "" };
}

// ---------- Gemini (streaming) ----------

function mapGeminiError(status, m) {
  m = clip(m);
  if (status === 400 && /api key/i.test(m)) return new ApiError("Gemini didn't like that key. Double-check it in Settings.", "fatal");
  return mapError("Gemini", status, m);
}

async function streamGemini({ apiKey, model, system, user, onProgress, thinking }) {
  const url = `${PROVIDERS.gemini.base}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
  const generationConfig = {
    temperature: 0.4,
    maxOutputTokens: PROVIDERS.gemini.maxOut,
    responseMimeType: "application/json",
  };
  if (thinking) generationConfig.thinkingConfig = { thinkingBudget: 1024 };
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig,
  };

  const ctrl = new AbortController();
  let idleTimer;
  const arm = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => ctrl.abort(), IDLE_MS);
  };
  const stalled = () => new ApiError("Gemini went quiet for " + Math.round(IDLE_MS / 1000) + " seconds.", "stall");

  arm();
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(idleTimer);
    throw e.name === "AbortError" ? stalled() : new UserError("Couldn't reach Gemini. Check your internet.");
  }

  if (!res.ok) {
    clearTimeout(idleTimer);
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (Array.isArray(data)) data = data[0] || {};
    const m = (data.error && data.error.message) || "";
    if (res.status === 400 && thinking && /thinking/i.test(m)) throw new RetryNoThinking();
    throw mapGeminiError(res.status, m);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  let finish = "";
  try {
    while (true) {
      arm();
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        let obj;
        try {
          obj = JSON.parse(payload);
        } catch (e) {
          continue;
        }
        if (obj.error) throw mapGeminiError(obj.error.code || 500, obj.error.message || "");
        if (obj.promptFeedback && obj.promptFeedback.blockReason) {
          throw new UserError("Gemini blocked this request: " + obj.promptFeedback.blockReason);
        }
        const c = obj.candidates && obj.candidates[0];
        if (c) {
          ((c.content && c.content.parts) || []).forEach((part) => {
            if (part.text && !part.thought) text += part.text;
          });
          if (c.finishReason) finish = c.finishReason;
        }
        if (onProgress) onProgress(text.length);
      }
    }
  } catch (e) {
    if (e.name === "AbortError") throw stalled();
    throw e;
  } finally {
    clearTimeout(idleTimer);
  }

  if (!text) throw new ApiError("Gemini sent back an empty reply.", "transient");
  return { text, finish };
}

// ---------- one entry point with fallbacks ----------

// Tries the chosen model (with, then without, a reasoning/thinking cap), then the provider's backup models.
async function callProvider(args) {
  const { id } = args;
  const p = PROVIDERS[id];
  const run = p.kind === "gemini" ? streamGemini : p.kind === "anthropic" ? runAnthropic : runOpenAI;
  const models = [args.model, ...p.fallbacks.filter((m) => m !== args.model)];
  const tried = [];
  let lastErr = null;
  for (const model of models) {
    for (const thinking of [true, false]) {
      try {
        if (args.onAttempt) args.onAttempt(model);
        const out = await run({ ...args, model, thinking, reasoning: thinking });
        return { ...out, model };
      } catch (e) {
        if (e instanceof RetryNoThinking) continue; // same model, without the cap
        if (!(e instanceof ApiError)) throw e;
        if (e.kind === "fatal" || e.kind === "toolarge") throw e;
        if (e.kind === "notfound" && model === args.model) throw e;
        lastErr = e;
        tried.push(model);
        if (e.kind === "transient" && thinking) {
          await sleep(RETRY_DELAY_MS);
          continue; // one more go on the same model
        }
        break; // quota, stall, notfound on a backup: next model
      }
    }
  }
  throw new UserError(
    (lastErr ? lastErr.message : `${p.label} is busy.`) +
      (tried.length ? " Tried: " + [...new Set(tried)].join(", ") + "." : "") +
      " Give it a minute, or switch provider in Settings."
  );
}

// Returns model ids available to this key.
async function listModels(id, apiKey, settings) {
  const p = PROVIDERS[id];
  let names;
  if (p.kind === "gemini") {
    const res = await fetch(`${p.base}/models?pageSize=200`, { headers: { "x-goog-api-key": apiKey } });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || `HTTP ${res.status}`);
    names = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /^gemini/.test(n));
  } else if (p.kind === "anthropic") {
    const res = await fetch(`${p.base}/models?limit=100`, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || `HTTP ${res.status}`);
    names = (data.data || []).map((m) => m.id);
  } else {
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const res = await fetch(`${providerBase(id, settings)}/models`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && (data.error.message || data.error)) || `HTTP ${res.status}`);
    names = (data.data || data.models || []).map((m) => m.id || m.name).filter(Boolean);
  }
  if (p.showModel) names = names.filter((n) => p.showModel.test(n));
  if (p.hideModel) names = names.filter((n) => !p.hideModel.test(n));
  return names.sort();
}

if (typeof module !== "undefined") {
  module.exports = { PROVIDERS, PROVIDER_ORDER, callProvider, listModels, mapError, ApiError, UserError };
}
