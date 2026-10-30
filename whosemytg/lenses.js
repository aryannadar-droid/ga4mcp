// Department kits ("lenses"): Media, SEO, CRO, Design and the annotated screenshot.
// Each lens is one extra AI call that builds on the locked TGs. This file holds the
// instructions, the context each lens sees, clean-up/validation of the reply, and exports.
// Pure functions; in the browser it uses the globals from lib.js.

if (typeof module !== "undefined") Object.assign(globalThis, require("./lib.js"));

const LIMITS = {
  google_headline: 30,
  google_description: 90,
  meta_primary: 125,
  meta_headline: 40,
  youtube_hook: 90,
  seo_title: 60,
  seo_meta: 155,
};

const MARKETS = ["Global", "India", "United States", "United Kingdom", "UAE / GCC", "Singapore", "Australia", "Canada", "Europe (EU)", "Southeast Asia"];
const LANGUAGES = ["English", "Hinglish", "Hindi", "Arabic", "Spanish", "French", "German", "Portuguese", "Bahasa Indonesia"];

const LENS_RULES = `HARD RULES
- Never name competitor brands. Say "other brands in the market".
- Never invent statistics, prices, ratings, review counts, certifications or awards. Only use facts in the provided content.
- Health, safety, "best/only/#1" and comparative claims are not allowed in copy.
- Write for the MARKET given. Write buyer-facing copy in the COPY LANGUAGE given; everything else in English.
- Use the exact TG names given. Plain, specific language. No emojis.
- Output ONLY one JSON object, no markdown fences.`;

const LENSES = {
  media: {
    label: "Media kit",
    blurb: "Ad copy that actually fits the box.",
    file: "media_kit.ads",
    system: `You are a senior performance-marketing copywriter. Using the brand and the locked TGs, write platform-ready ad copy for every TG.

PER TG
- google.headlines: 5 Google responsive search ad headlines, each at most ${LIMITS.google_headline} characters including spaces.
- google.descriptions: 3 descriptions, each at most ${LIMITS.google_description} characters.
- meta.primary_text: 2 Meta (Facebook/Instagram) primary texts, each at most ${LIMITS.meta_primary} characters so nothing hides behind "See more".
- meta.headlines: 2 Meta headlines, each at most ${LIMITS.meta_headline} characters.
- youtube_hooks: 3 spoken hooks for the first 5 seconds of a YouTube ad, each at most ${LIMITS.youtube_hook} characters.
- angle_note: one line on the angle these ads take for this TG.
Count characters carefully. Going over a limit is a failure; shorter is fine. Each TG gets a clearly different voice that matches its lead copy tone.

${LENS_RULES}

OUTPUT
{"tgs":[{"tg":"exact TG name","angle_note":"","google":{"headlines":[""],"descriptions":[""]},"meta":{"primary_text":[""],"headlines":[""]},"youtube_hooks":[""]}]}`,
  },
  seo: {
    label: "SEO kit",
    blurb: "Search phrases, content gaps, on-page check, FAQ schema.",
    file: "seo_kit.txt",
    system: `You are a senior SEO strategist. Using the brand, the locked TGs, the pages that were read and the site's link list, produce:

1. search_phrases: for every TG, 6 to 8 phrases this person would actually type into Google, built from their first question and situation. Tag each with intent: "informational", "commercial", "transactional" or "navigational". You have no search-volume data: do not mention volumes.
2. content_gaps: for every TG, does the site have a page written for them? status "covered", "partial" or "missing". best_page is the URL of the closest page from the pages or links given (empty if none). gap says what is missing. suggested_page gives a title, a URL slug and the angle.
3. on_page: check the OPEN PAGE's title, meta description and H1 against the HOTTEST TG's language. For each: current (copy it exactly, empty if missing), verdict "good", "weak" or "missing", why, and suggestion. Suggested title at most ${LIMITS.seo_title} characters, meta description at most ${LIMITS.seo_meta}.
4. faqs: for every TG, 2 or 3 FAQ questions phrased the way they would ask, starting from their first question, with answers of at most 60 words. Answers use only facts in the content; set source "site" when the content supports the answer, otherwise "hypothesis".

${LENS_RULES}

OUTPUT
{"search_phrases":[{"tg":"","phrases":[{"q":"","intent":"commercial"}]}],
 "content_gaps":[{"tg":"","status":"missing","best_page":"","gap":"","suggested_page":{"title":"","slug":"","angle":""}}],
 "on_page":{"target_tg":"","title":{"current":"","verdict":"weak","why":"","suggestion":""},"meta_description":{"current":"","verdict":"","why":"","suggestion":""},"h1":{"current":"","verdict":"","why":"","suggestion":""}},
 "faqs":[{"tg":"","items":[{"q":"","a":"","source":"site"}]}]}`,
  },
  cro: {
    label: "CRO kit",
    blurb: "Message match, objections, tests, heuristic audit.",
    file: "cro_kit.audit",
    system: `You are a senior CRO strategist auditing the OPEN PAGE for the locked TGs. Use the page anatomy (above-the-fold text, CTAs, forms, trust signals, heading outline) and the page text.

1. message_match: for every TG, a score from 0 to 100 for how well this page speaks to them (100 = the hero, proof and CTA are clearly written for this person). verdict (one short line), what_works, what_misses. Be differentiated; do not give everyone 70.
2. objections: for every TG, their 1 or 2 biggest objections. status "answered", "partial" or "unanswered". where: quote the heading or section where it is answered (empty if unanswered). fix: what to add and where.
3. hypotheses: 5 to 8 test ideas, each as change ("If we ..."), expected ("then ..."), because ("because ..."), for one TG (or "All"), with impact, confidence and ease each scored 1 to 10, and the primary metric.
4. heuristics: exactly 4 checks with check ids "value_prop", "cta_clarity", "trust_signals", "friction". verdict "pass", "warn" or "fail", evidence from the anatomy, and fix. value_prop judges what is visible above the fold. friction covers forms and anything between the visitor and checkout or lead submission.

${LENS_RULES}

OUTPUT
{"message_match":[{"tg":"","score":0,"verdict":"","what_works":"","what_misses":""}],
 "objections":[{"tg":"","objection":"","status":"unanswered","where":"","fix":""}],
 "hypotheses":[{"tg":"","change":"","expected":"","because":"","impact":5,"confidence":5,"ease":5,"metric":""}],
 "heuristics":[{"check":"value_prop","verdict":"warn","evidence":"","fix":""}]}`,
  },
  design: {
    label: "Design kit",
    blurb: "Visual direction and a landing page outline per TG.",
    file: "design_kit.fig",
    system: `You are a senior brand and UX designer. For every locked TG produce:

1. directions: tone (one line), imagery_do (3 items), imagery_dont (3 items), palette of 4 or 5 colours as hex codes with a role ("background", "accent", "CTA", "text"...) and a short why, and type_feel (one line on typography). Palettes should feel like the brand stretched toward this TG, not a new brand.
2. lp_outline: a landing page plan for this TG with 6 to 9 sections in order. Each section: name, goal (what it must achieve for this person), content (what goes in it) and proof (what evidence from the site backs it, or "needs client input").

${LENS_RULES}

OUTPUT
{"directions":[{"tg":"","tone":"","imagery_do":[""],"imagery_dont":[""],"palette":[{"hex":"#000000","role":"","why":""}],"type_feel":""}],
 "lp_outline":[{"tg":"","sections":[{"name":"","goal":"","content":"","proof":""}]}]}`,
  },
  annotate: {
    label: "Annotated screenshot",
    blurb: "Notes pinned on what's on your screen right now.",
    file: "screen.png",
    system: `You are a senior CRO and UX reviewer. You get the list of elements visible in the user's browser right now (id, type, text, position as % of the screen) and the locked TGs. Pin 6 to 10 notes to specific elements.

Each note: el (an element id from the list), tg (exact TG name, or "All"), kind "keep" (works, do not touch), "fix" (change it) or "add" (add something next to this element), and note (one or two sentences, specific to what the element says).
Spread notes across the screen and across TGs, starting with the hottest TG. summary: one line on how this screen serves the hottest TG.

${LENS_RULES}

OUTPUT
{"summary":"","notes":[{"el":"e1","tg":"","kind":"fix","note":""}]}`,
  },
};

const LENS_ORDER = ["media", "seo", "cro", "design"];

// ---------- context sent with each lens ----------

function tgBrief(r) {
  return r.tgs
    .map(
      (t, i) =>
        `TG ${i + 1}: ${t.name}${t.hot ? " (HOTTEST)" : ""} | ${t.stars == null ? "unrated" : t.stars + "/5 stars"}\n` +
        `  Situation: ${t.situation}\n  First question: ${t.first_question}\n  Problem: ${t.problem}\n  Solution: ${t.solution}\n` +
        `  Lead copy (${t.lead_copy.tone}): ${t.lead_copy.line}\n  Offer: ${t.offer}\n  Top reasons: ${t.reasons_to_buy
          .slice(0, 3)
          .map((x) => x.reason)
          .join(" / ")}`
    )
    .join("\n");
}

function anatomyText(a) {
  if (!a) return "(no page anatomy captured)";
  const L = [];
  L.push(`URL: ${a.url}`);
  L.push(`Title: ${a.title || "(none)"}`);
  L.push(`Meta description: ${a.description || "(none)"}`);
  L.push(`H1: ${(a.h1 || []).join(" | ") || "(none)"}`);
  L.push(`Above the fold: ${a.aboveFold || "(empty)"}`);
  L.push(
    `CTAs: ${(a.ctas || []).map((c) => `"${c.text}"${c.aboveFold ? " [above fold]" : ""}`).join(", ") || "(none found)"}`
  );
  L.push(
    `Forms: ${
      (a.forms || [])
        .map((f) => `${f.fields} fields (${f.required} required)${f.aboveFold ? " above fold" : ""}: ${f.labels.join(", ")}`)
        .join(" || ") || "(none)"
    }`
  );
  L.push(`Trust signals found: ${(a.trust || []).map((t) => `${t.kind} ("${t.sample}")`).join("; ") || "(none found)"}`);
  L.push(`Heading outline: ${(a.outline || []).map((h) => `[${h.pos}%] ${"#".repeat(h.level)} ${h.text}`).join(" ; ")}`);
  return L.join("\n");
}

function buildLensUser(id, { report, site, market, language, budget, viewport }) {
  const r = normalise(report);
  const bs = r.brand_summary;
  const P = [];
  P.push(`Brand: ${bs.brand} (${site.origin})`);
  P.push(`Sells: ${bs.what_they_sell}`);
  P.push(`Positioning: ${bs.positioning}`);
  P.push(`Market: ${market || "Global"}`);
  P.push(`Copy language: ${language || "English"}`);
  P.push("");
  P.push("=== LOCKED TGs ===");
  P.push(tgBrief(r));
  P.push("");
  const pageCap = budget ? budget.page : 1800;
  if (id === "seo") {
    P.push("=== PAGES READ ===");
    site.pages.forEach((p, i) =>
      P.push(
        `Page ${i + 1}: ${p.url}\n  Title: ${p.title}\n  Meta: ${p.description}\n  Headings: ${(p.headings || [])
          .slice(0, 8)
          .join(" | ")}`
      )
    );
    P.push("");
    P.push("=== OTHER LINKS ON THE SITE (path: link text) ===");
    P.push((site.links || []).slice(0, 70).map((l) => `${l.path}: ${l.text}`).join("\n") || "(none)");
    P.push("");
    P.push("=== OPEN PAGE ===");
    P.push(anatomyText(site.anatomy));
  } else if (id === "cro") {
    P.push("=== OPEN PAGE ANATOMY ===");
    P.push(anatomyText(site.anatomy));
    P.push("");
    P.push("=== OPEN PAGE TEXT ===");
    P.push((site.pages[0] && site.pages[0].text.slice(0, budget ? budget.home : 3500)) || "");
  } else if (id === "annotate") {
    P.push("=== VISIBLE ELEMENTS (x, y, width, height as % of the screen) ===");
    (viewport && viewport.els ? viewport.els : []).forEach((e) =>
      P.push(`${e.id} [${e.type}] at ${e.x},${e.y} size ${e.w}x${e.h}: ${e.text}`)
    );
  } else {
    P.push("=== SITE TEXT (excerpts) ===");
    site.pages.slice(0, 3).forEach((p, i) => P.push(`Page ${i + 1} ${p.url}: ${p.text.slice(0, pageCap)}`));
  }
  return P.join("\n");
}

// ---------- clean-up and validation ----------

function lim(text, limit) {
  const t = str(text).trim();
  const len = [...t].length;
  return { text: t, len, limit, over: len > limit ? len - limit : 0 };
}

const INTENT_ORDER = ["informational", "commercial", "transactional", "navigational"];

function num(v, lo, hi, dflt) {
  const n = parseFloat(v);
  return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
}

function hexOk(h) {
  const m = String(h || "").trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let x = m[1];
  if (x.length === 3) x = x.split("").map((c) => c + c).join("");
  return "#" + x.toUpperCase();
}

function normaliseLens(id, raw) {
  const d = raw || {};
  if (id === "media") {
    return {
      tgs: arr(d.tgs).map((t) => {
        t = t || {};
        const g = t.google || {};
        const m = t.meta || {};
        return {
          tg: str(t.tg),
          angle_note: str(t.angle_note),
          google_headlines: arr(g.headlines).map((x) => lim(x, LIMITS.google_headline)),
          google_descriptions: arr(g.descriptions).map((x) => lim(x, LIMITS.google_description)),
          meta_primary: arr(m.primary_text).map((x) => lim(x, LIMITS.meta_primary)),
          meta_headlines: arr(m.headlines).map((x) => lim(x, LIMITS.meta_headline)),
          youtube_hooks: arr(t.youtube_hooks).map((x) => lim(x, LIMITS.youtube_hook)),
        };
      }),
    };
  }
  if (id === "seo") {
    const op = d.on_page || {};
    const opItem = (o, limit) => {
      o = o || {};
      return {
        current: str(o.current),
        verdict: (str(o.verdict) || "weak").toLowerCase(),
        why: str(o.why),
        suggestion: limit ? lim(o.suggestion, limit) : lim(o.suggestion, 999),
      };
    };
    return {
      search_phrases: arr(d.search_phrases).map((s) => ({
        tg: str(s && s.tg),
        phrases: arr(s && s.phrases)
          .map((p) => ({ q: str(p && (p.q || p.phrase || p)), intent: str(p && p.intent).toLowerCase() || "informational" }))
          .filter((p) => p.q)
          .sort((a, b) => (INTENT_ORDER.indexOf(a.intent) + 9) % 9 - (INTENT_ORDER.indexOf(b.intent) + 9) % 9),
      })),
      content_gaps: arr(d.content_gaps).map((g) => {
        g = g || {};
        const sp = g.suggested_page || {};
        return {
          tg: str(g.tg),
          status: (str(g.status) || "missing").toLowerCase(),
          best_page: str(g.best_page),
          gap: str(g.gap),
          suggested_page: { title: str(sp.title), slug: str(sp.slug), angle: str(sp.angle) },
        };
      }),
      on_page: {
        target_tg: str(op.target_tg),
        title: opItem(op.title, LIMITS.seo_title),
        meta_description: opItem(op.meta_description, LIMITS.seo_meta),
        h1: opItem(op.h1),
      },
      faqs: arr(d.faqs).map((f) => ({
        tg: str(f && f.tg),
        items: arr(f && f.items)
          .map((x) => ({ q: str(x && x.q), a: str(x && x.a), source: str(x && x.source).toLowerCase() || "hypothesis" }))
          .filter((x) => x.q && x.a),
      })),
    };
  }
  if (id === "cro") {
    return {
      message_match: arr(d.message_match).map((m) => ({
        tg: str(m && m.tg),
        score: Math.round(num(m && m.score, 0, 100, 0)),
        verdict: str(m && m.verdict),
        what_works: str(m && m.what_works),
        what_misses: str(m && m.what_misses),
      })),
      objections: arr(d.objections).map((o) => ({
        tg: str(o && o.tg),
        objection: str(o && o.objection),
        status: (str(o && o.status) || "unanswered").toLowerCase(),
        where: str(o && o.where),
        fix: str(o && o.fix),
      })),
      hypotheses: arr(d.hypotheses)
        .map((h) => {
          h = h || {};
          const impact = num(h.impact, 1, 10, 5);
          const confidence = num(h.confidence, 1, 10, 5);
          const ease = num(h.ease, 1, 10, 5);
          return {
            tg: str(h.tg),
            change: str(h.change),
            expected: str(h.expected),
            because: str(h.because),
            impact,
            confidence,
            ease,
            ice: Math.round(((impact + confidence + ease) / 3) * 10) / 10,
            metric: str(h.metric),
          };
        })
        .sort((a, b) => b.ice - a.ice),
      heuristics: arr(d.heuristics).map((h) => ({
        check: str(h && h.check),
        verdict: (str(h && h.verdict) || "warn").toLowerCase(),
        evidence: str(h && h.evidence),
        fix: str(h && h.fix),
      })),
    };
  }
  if (id === "design") {
    return {
      directions: arr(d.directions).map((x) => {
        x = x || {};
        return {
          tg: str(x.tg),
          tone: str(x.tone),
          imagery_do: arr(x.imagery_do).map(str),
          imagery_dont: arr(x.imagery_dont).map(str),
          palette: arr(x.palette)
            .map((p) => ({ hex: hexOk(p && (p.hex || p)), role: str(p && p.role), why: str(p && p.why) }))
            .filter((p) => p.hex),
          type_feel: str(x.type_feel),
        };
      }),
      lp_outline: arr(d.lp_outline).map((o) => ({
        tg: str(o && o.tg),
        sections: arr(o && o.sections).map((s) => ({
          name: str(s && s.name),
          goal: str(s && s.goal),
          content: str(s && s.content),
          proof: str(s && s.proof),
        })),
      })),
    };
  }
  if (id === "annotate") {
    return {
      summary: str(d.summary),
      notes: arr(d.notes)
        .map((n) => ({
          el: str(n && n.el),
          tg: str(n && n.tg) || "All",
          kind: (str(n && n.kind) || "fix").toLowerCase(),
          note: str(n && n.note),
        }))
        .filter((n) => n.note),
    };
  }
  return d;
}

const HEURISTIC_LABELS = {
  value_prop: "Value prop above the fold",
  cta_clarity: "CTA clarity",
  trust_signals: "Trust signals",
  friction: "Form and checkout friction",
};

function faqSchema(seo) {
  const items = [];
  seo.faqs.forEach((f) => f.items.forEach((x) => items.push(x)));
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((x) => ({
        "@type": "Question",
        name: x.q,
        acceptedAnswer: { "@type": "Answer", text: x.a },
      })),
    },
    null,
    2
  );
}

function faqSchemaTag(seo) {
  return `<script type="application/ld+json">\n${faqSchema(seo)}\n</script>`;
}

// ---------- exports ----------

function limLine(x) {
  return `${x.text} (${x.len}/${x.limit}${x.over ? `, OVER by ${x.over}` : ""})`;
}

function lensToMarkdown(id, data) {
  const d = data;
  const L = [];
  if (id === "media") {
    L.push("## Media kit: platform-ready ad copy");
    d.tgs.forEach((t) => {
      L.push(`### ${t.tg}`);
      if (t.angle_note) L.push(`_${t.angle_note}_`);
      L.push("**Google headlines (max 30):**");
      t.google_headlines.forEach((x) => L.push(`- ${limLine(x)}`));
      L.push("**Google descriptions (max 90):**");
      t.google_descriptions.forEach((x) => L.push(`- ${limLine(x)}`));
      L.push("**Meta primary text (max 125):**");
      t.meta_primary.forEach((x) => L.push(`- ${limLine(x)}`));
      L.push("**Meta headlines (max 40):**");
      t.meta_headlines.forEach((x) => L.push(`- ${limLine(x)}`));
      L.push("**YouTube 5-second hooks:**");
      t.youtube_hooks.forEach((x) => L.push(`- ${limLine(x)}`));
      L.push("");
    });
  } else if (id === "seo") {
    L.push("## SEO kit");
    L.push("### Search phrases by TG (no volume data; validate in your keyword tool)");
    d.search_phrases.forEach((s) => {
      L.push(`**${s.tg}**`);
      s.phrases.forEach((p) => L.push(`- ${p.q} [${p.intent}]`));
    });
    L.push("### Content gaps");
    d.content_gaps.forEach((g) =>
      L.push(
        `- **${g.tg}**: ${g.status}${g.best_page ? " (closest: " + g.best_page + ")" : ""}. ${g.gap}${
          g.suggested_page.title ? ` Suggested page: "${g.suggested_page.title}" /${g.suggested_page.slug.replace(/^\//, "")} - ${g.suggested_page.angle}` : ""
        }`
      )
    );
    L.push(`### On-page check (for ${d.on_page.target_tg || "the hottest TG"})`);
    [
      ["Title", d.on_page.title],
      ["Meta description", d.on_page.meta_description],
      ["H1", d.on_page.h1],
    ].forEach(([k, o]) => {
      L.push(`- **${k}** [${o.verdict}]: "${o.current || "(missing)"}". ${o.why}`);
      if (o.suggestion.text) L.push(`  - Suggested: ${o.suggestion.limit < 999 ? limLine(o.suggestion) : o.suggestion.text}`);
    });
    L.push("### FAQs");
    d.faqs.forEach((f) => {
      L.push(`**${f.tg}**`);
      f.items.forEach((x) => L.push(`- Q: ${x.q}\n  A: ${x.a} [${tagLabel(x.source)}]`));
    });
    L.push("### FAQ schema (JSON-LD)");
    L.push("```html\n" + faqSchemaTag(d) + "\n```");
  } else if (id === "cro") {
    L.push("## CRO kit");
    L.push("### Message match (open page vs each TG)");
    d.message_match.forEach((m) => L.push(`- **${m.tg}**: ${m.score}/100. ${m.verdict} Works: ${m.what_works} Misses: ${m.what_misses}`));
    L.push("### Objection map");
    d.objections.forEach((o) =>
      L.push(`- **${o.tg}**: "${o.objection}" [${o.status}]${o.where ? " Answered at: " + o.where + "." : ""} Fix: ${o.fix}`)
    );
    L.push("### Test hypotheses (sorted by ICE)");
    d.hypotheses.forEach((h, i) =>
      L.push(
        `${i + 1}. [${h.tg}] ${h.change} ${h.expected} ${h.because} (Impact ${h.impact}, Confidence ${h.confidence}, Ease ${h.ease}, ICE ${h.ice}; metric: ${h.metric})`
      )
    );
    L.push("### Heuristic audit");
    d.heuristics.forEach((h) => L.push(`- **${HEURISTIC_LABELS[h.check] || h.check}** [${h.verdict}]: ${h.evidence} Fix: ${h.fix}`));
  } else if (id === "design") {
    L.push("## Design kit");
    d.directions.forEach((x) => {
      L.push(`### ${x.tg}: visual direction`);
      L.push(`- Tone: ${x.tone}`);
      L.push(`- Imagery do: ${x.imagery_do.join("; ")}`);
      L.push(`- Imagery don't: ${x.imagery_dont.join("; ")}`);
      L.push(`- Palette: ${x.palette.map((p) => `${p.hex} ${p.role}`).join(", ")}`);
      L.push(`- Type: ${x.type_feel}`);
    });
    d.lp_outline.forEach((o) => {
      L.push(`### ${o.tg}: landing page outline`);
      o.sections.forEach((s, i) => L.push(`${i + 1}. **${s.name}**: ${s.goal} Content: ${s.content} Proof: ${s.proof}`));
    });
  } else if (id === "annotate") {
    L.push("## Annotated screenshot");
    if (d.summary) L.push(d.summary);
    d.notes.forEach((n, i) => L.push(`${i + 1}. [${n.kind}] (${n.tg}) ${n.note}${n.target ? ` - on "${n.target}"` : ""}`));
  }
  return L.join("\n");
}

function lensToHtml(id, d) {
  const e = esc;
  const chips = (items) =>
    `<ul>${items
      .map((x) => `<li>${e(x.text)} <small class="${x.over ? "over" : "ok"}">${x.len}/${x.limit}${x.over ? " · over by " + x.over : ""}</small></li>`)
      .join("")}</ul>`;
  let h = "";
  if (id === "media") {
    h += `<div class="eyebrow">Media kit · platform-ready ad copy</div>`;
    d.tgs.forEach((t) => {
      h += `<h3>${e(t.tg)}</h3>${t.angle_note ? `<p class="tldr">${e(t.angle_note)}</p>` : ""}
<p><b>Google headlines</b></p>${chips(t.google_headlines)}<p><b>Google descriptions</b></p>${chips(t.google_descriptions)}
<p><b>Meta primary text</b></p>${chips(t.meta_primary)}<p><b>Meta headlines</b></p>${chips(t.meta_headlines)}
<p><b>YouTube 5-second hooks</b></p>${chips(t.youtube_hooks)}`;
    });
  } else if (id === "seo") {
    h += `<div class="eyebrow">SEO kit</div><h3>Search phrases by TG</h3><p class="meta">No volume data. Validate in your keyword tool.</p>`;
    d.search_phrases.forEach((s) => {
      h += `<p><b>${e(s.tg)}</b></p><ul>${s.phrases.map((p) => `<li>${e(p.q)} <span class="tag">${e(p.intent)}</span></li>`).join("")}</ul>`;
    });
    h += `<h3>Content gaps</h3><ul>${d.content_gaps
      .map(
        (g) =>
          `<li><b>${e(g.tg)}</b> <span class="tag">${e(g.status)}</span> ${e(g.gap)}${g.best_page ? ` Closest: ${e(g.best_page)}.` : ""}${
            g.suggested_page.title ? ` Suggested: "${e(g.suggested_page.title)}" /${e(g.suggested_page.slug.replace(/^\//, ""))}` : ""
          }</li>`
      )
      .join("")}</ul>`;
    h += `<h3>On-page check (for ${e(d.on_page.target_tg || "the hottest TG")})</h3><ul>${[
      ["Title", d.on_page.title],
      ["Meta description", d.on_page.meta_description],
      ["H1", d.on_page.h1],
    ]
      .map(
        ([k, o]) =>
          `<li><b>${k}</b> <span class="tag">${e(o.verdict)}</span> "${e(o.current || "(missing)")}". ${e(o.why)}${
            o.suggestion.text ? `<br>Suggested: ${e(o.suggestion.text)}${o.suggestion.limit < 999 ? ` <small class="${o.suggestion.over ? "over" : "ok"}">${o.suggestion.len}/${o.suggestion.limit}</small>` : ""}` : ""
          }</li>`
      )
      .join("")}</ul>`;
    h += `<h3>FAQs</h3>`;
    d.faqs.forEach((f) => {
      h += `<p><b>${e(f.tg)}</b></p><ul>${f.items.map((x) => `<li><b>${e(x.q)}</b><br>${e(x.a)} <span class="tag">${e(tagLabel(x.source))}</span></li>`).join("")}</ul>`;
    });
    h += `<h3>FAQ schema</h3><pre>${e(faqSchemaTag(d))}</pre>`;
  } else if (id === "cro") {
    h += `<div class="eyebrow">CRO kit</div><h3>Message match</h3><ul>${d.message_match
      .map((m) => `<li><b>${e(m.tg)}: ${m.score}/100.</b> ${e(m.verdict)} Works: ${e(m.what_works)} Misses: ${e(m.what_misses)}</li>`)
      .join("")}</ul>`;
    h += `<h3>Objection map</h3><ul>${d.objections
      .map((o) => `<li><b>${e(o.tg)}</b> "${e(o.objection)}" <span class="tag">${e(o.status)}</span>${o.where ? ` At: ${e(o.where)}.` : ""} Fix: ${e(o.fix)}</li>`)
      .join("")}</ul>`;
    h += `<h3>Test hypotheses (by ICE)</h3><ol>${d.hypotheses
      .map(
        (x) =>
          `<li><span class="tag">${e(x.tg)}</span> ${e(x.change)} ${e(x.expected)} ${e(x.because)} <small>I ${x.impact} · C ${x.confidence} · E ${x.ease} · ICE ${x.ice} · ${e(x.metric)}</small></li>`
      )
      .join("")}</ol>`;
    h += `<h3>Heuristic audit</h3><ul>${d.heuristics
      .map((x) => `<li><b>${e(HEURISTIC_LABELS[x.check] || x.check)}</b> <span class="tag">${e(x.verdict)}</span> ${e(x.evidence)} Fix: ${e(x.fix)}</li>`)
      .join("")}</ul>`;
  } else if (id === "design") {
    h += `<div class="eyebrow">Design kit</div>`;
    d.directions.forEach((x) => {
      h += `<h3>${e(x.tg)}: visual direction</h3><p>${e(x.tone)}</p><p>${x.palette
        .map((p) => `<span class="sw" style="background:${p.hex}"></span> ${p.hex} ${e(p.role)}`)
        .join(" &nbsp; ")}</p><p><b>Do:</b> ${e(x.imagery_do.join("; "))}<br><b>Don't:</b> ${e(x.imagery_dont.join("; "))}<br><b>Type:</b> ${e(x.type_feel)}</p>`;
    });
    d.lp_outline.forEach((o) => {
      h += `<h3>${e(o.tg)}: landing page outline</h3><ol>${o.sections
        .map((s) => `<li><b>${e(s.name)}</b>: ${e(s.goal)}<br><small>Content: ${e(s.content)} · Proof: ${e(s.proof)}</small></li>`)
        .join("")}</ol>`;
    });
  } else if (id === "annotate") {
    h += `<div class="eyebrow">Annotated screenshot</div>`;
    if (d.img) {
      h += `<div class="shot"><img src="${d.img}" alt="Screenshot">${d.notes
        .map((n, i) => (n.x == null ? "" : `<span class="pin ${e(n.kind)}" style="left:${n.x}%;top:${n.y}%">${i + 1}</span>`))
        .join("")}</div>`;
    }
    if (d.summary) h += `<p>${e(d.summary)}</p>`;
    h += `<ol>${d.notes.map((n) => `<li><span class="tag">${e(n.kind)}</span> <b>${e(n.tg)}</b>: ${e(n.note)}</li>`).join("")}</ol>`;
  }
  return `<section class="card">${h}</section>`;
}

const LENS_REPORT_CSS = `.over{color:#c4271c;font-weight:700}.ok{color:#65675e}small{font-size:11px}
.sw{display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid #151515;vertical-align:middle}
pre{white-space:pre-wrap;background:#f4f4f0;padding:10px;border-radius:8px;font-size:12px}
h3{font-size:16px;margin:14px 0 4px}.shot{position:relative;margin:8px 0}.shot img{width:100%;border:1.5px solid #151515;border-radius:8px}
.pin{position:absolute;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:#F54E00;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;border:2px solid #fff}
.pin.keep{background:#00A37A}.pin.add{background:#1D4AFF}`;

if (typeof module !== "undefined") {
  module.exports = {
    LENSES,
    LENS_ORDER,
    LIMITS,
    MARKETS,
    LANGUAGES,
    buildLensUser,
    normaliseLens,
    lensToMarkdown,
    lensToHtml,
    faqSchema,
    faqSchemaTag,
    HEURISTIC_LABELS,
    LENS_REPORT_CSS,
  };
}
