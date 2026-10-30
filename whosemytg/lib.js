// Pure helpers: page picking, JSON parsing, report building. No browser APIs needed.

const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|docx?|xlsx?|pptx?)$/i;
const SKIP_PATH = /(login|signin|sign-in|signup|sign-up|register|cart|checkout|account|wishlist|privacy|terms|policy|policies|cookie|refund|shipping|returns|careers|jobs|sitemap|wp-admin|wp-login)/i;
const GOOD = [
  [/about|our-story|story|who-we-are|mission|philosophy|why-/i, 4],
  [/product|shop|collection|categor|store|catalog|range/i, 3],
  [/service|solution|offering|course|program|plan|pricing|membership/i, 3],
  [/benefit|how-it-works|features|faq|science|ingredients|results/i, 2],
  [/blog|stories|reviews|testimonial/i, 1],
];

function trimPath(p) {
  return p.replace(/\/+$/, "") || "/";
}

// links: [{href, text, inNav}]. Returns up to `max` same-origin URLs worth reading.
function pickPages(links, currentUrl, max = 6) {
  const cur = new URL(currentUrl);
  const curKey = cur.origin + trimPath(cur.pathname);
  const seen = new Set();
  const scored = [];

  for (const l of links) {
    let u;
    try {
      u = new URL(l.href, cur);
    } catch (e) {
      continue;
    }
    if (u.origin !== cur.origin) continue;
    const path = trimPath(u.pathname);
    if (path === "/") continue;
    if (SKIP_EXT.test(path) || SKIP_PATH.test(path)) continue;
    const key = u.origin + path;
    if (key === curKey || seen.has(key)) continue;
    seen.add(key);

    const hay = path + " " + (l.text || "");
    let score = 0;
    for (const [re, w] of GOOD) if (re.test(hay)) score += w;
    if (l.inNav) score += 2;
    const depth = path.split("/").filter(Boolean).length;
    score -= Math.max(0, depth - 2) * 1.5;
    if (score <= 0) continue;
    scored.push({ url: key, score, seg: path.split("/").filter(Boolean)[0] || "" });
  }

  scored.sort((a, b) => b.score - a.score);
  const perSeg = {};
  const out = [];
  for (const s of scored) {
    perSeg[s.seg] = (perSeg[s.seg] || 0) + 1;
    if (perSeg[s.seg] > 2) continue;
    out.push(s.url);
    if (out.length >= max) break;
  }
  return out;
}

function parseModelJson(text) {
  let t = String(text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(t);
  } catch (e) {}
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch (e) {}
  }
  throw new Error("The AI answered in something that isn't valid JSON. Hit the button again; it usually behaves the second time.");
}

function str(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join("; ");
  if (typeof v === "object") return Object.values(v).map(str).filter(Boolean).join(" ");
  return String(v);
}

function arr(v) {
  return Array.isArray(v) ? v : v ? [v] : [];
}

const ROLES = ["The headliner", "Supporting act", "Supporting act", "Supporting act", "Bench warmer"];
const ROLE_HINTS = ["Lead ad and hero message", "Feeds other creatives", "Feeds other creatives", "Feeds other creatives", "Reserve"];

function reasonRole(i) {
  return ROLES[i] || "Supporting act";
}

const TAG_LABELS = { site: "Straight from the site", hypothesis: "Educated guess", client: "Client said so" };

function tagLabel(tag) {
  return TAG_LABELS[String(tag).toLowerCase()] || tag;
}

// 0-5 in half steps, or null when the AI didn't rate it.
function toStars(v) {
  if (v && typeof v === "object") v = v.stars != null ? v.stars : v.score;
  const n = parseFloat(v);
  if (!isFinite(n)) return null;
  return Math.min(5, Math.max(0, Math.round(n * 2) / 2));
}

function heatLabel(stars) {
  if (stars == null) return "Unrated";
  if (stars >= 4.5) return "Hot. Sell here first.";
  if (stars >= 3.5) return "Warm. Very persuadable.";
  if (stars >= 2.5) return "Lukewarm. Needs a nudge.";
  if (stars >= 1.5) return "Cool. Long game.";
  return "Ice cold. Nice to have.";
}

// Make sure every field exists so the renderers never crash on a sloppy AI reply.
// TGs come back sorted by buy-intent (highest first); the top one is marked hot.
function normalise(report) {
  const r = report || {};
  const bs = r.brand_summary || {};
  const audit = r.audit || {};
  const tgs = arr(r.tgs).map((t, i) => {
    t = t || {};
    const lc = t.lead_copy || {};
    const hero = t.landing_page_hero || {};
    const bscore = t.buy_score || {};
    return {
      order: i,
      name: str(t.name) || "Unnamed TG",
      tldr: str(t.tldr),
      situation: str(t.situation),
      split_question: str(t.split_question),
      first_question: str(t.first_question),
      problem: str(t.problem),
      solution: str(t.solution),
      reasons_to_buy: arr(t.reasons_to_buy).map((x) =>
        typeof x === "object" && x
          ? { reason: str(x.reason), tag: str(x.tag) || "hypothesis", pages: pageNums(x.pages) }
          : { reason: str(x), tag: "hypothesis", pages: [] }
      ),
      lead_copy: { line: str(lc.line || lc), tone: str(lc.tone) },
      offer: str(t.offer),
      ad_angle: str(t.ad_angle),
      landing_page_hero: {
        headline: str(hero.headline),
        subhead: str(hero.subhead),
        cta: str(hero.cta),
      },
      not_this_tg_if: str(t.not_this_tg_if),
      stars: toStars(t.buy_score != null ? t.buy_score : t.stars),
      stars_why: str(bscore.why),
      evidence: str(t.evidence) || "hypothesis",
      flags_for_signoff: arr(t.flags_for_signoff).map(str),
      hot: false,
    };
  });
  tgs.sort((a, b) => (b.stars == null ? -1 : b.stars) - (a.stars == null ? -1 : a.stars) || a.order - b.order);
  if (tgs.length && tgs[0].stars != null) tgs[0].hot = true;
  return {
    brand_summary: {
      brand: str(bs.brand),
      what_they_sell: str(bs.what_they_sell),
      positioning: str(bs.positioning),
      who_pays_vs_uses: str(bs.who_pays_vs_uses),
      content_quality_note: str(bs.content_quality_note),
      source_pages: pageNums(bs.source_pages),
    },
    audit: {
      candidates_considered: arr(audit.candidates_considered).map(str),
      merges: arr(audit.merges).map((m) => ({
        merged: str(m && m.merged),
        into: str(m && m.into),
        reason: str(m && m.reason),
      })),
      overlap_check: str(audit.overlap_check),
    },
    tgs,
    flags_for_signoff: arr(r.flags_for_signoff).map(str),
  };
}

// [1, "2", "Page 3"] -> [1, 2, 3]
function pageNums(v) {
  return [...new Set(arr(v).map((x) => parseInt(String(x).replace(/\D+/g, ""), 10)).filter((n) => n > 0))].sort(
    (a, b) => a - b
  );
}

// meta.pages may be URL strings (older runs) or {url, title, via, chars, total} objects.
function pageInfo(p) {
  return typeof p === "string" ? { url: p, title: "", via: "", chars: 0, total: 0 } : p;
}

const VIA_LABELS = { tab: "Read from your open tab", fetched: "Fetched directly" };

// One row per page the AI was given, with every claim that cites it.
function buildSources(r, meta) {
  const pages = ((meta && meta.pages) || []).map(pageInfo);
  const rows = pages.map((p, i) => ({ n: i + 1, ...p, citedBy: [] }));
  const unknown = new Set();
  const cite = (n, label) => {
    if (rows[n - 1]) rows[n - 1].citedBy.push(label);
    else unknown.add(n);
  };
  r.brand_summary.source_pages.forEach((n) => cite(n, "Brand read"));
  let claims = 0;
  let cited = 0;
  r.tgs.forEach((t) =>
    t.reasons_to_buy.forEach((x, j) => {
      claims++;
      if (x.pages.length) cited++;
      x.pages.forEach((n) => cite(n, `${t.name} · reason ${j + 1}`));
    })
  );
  const siteUncited = r.tgs.reduce(
    (a, t) => a + t.reasons_to_buy.filter((x) => x.tag.toLowerCase() === "site" && !x.pages.length).length,
    0
  );
  return {
    rows,
    failed: (meta && meta.failed) || [],
    claims,
    cited,
    siteUncited,
    unknown: [...unknown],
    trimmed: !!(meta && meta.trimmed),
  };
}

function sourceDetail(row) {
  const bits = [VIA_LABELS[row.via] || ""];
  if (row.chars) bits.push(row.total > row.chars ? `${row.chars.toLocaleString()} of ${row.total.toLocaleString()} characters` : `${row.chars.toLocaleString()} characters`);
  return bits.filter(Boolean).join(" · ");
}

function starText(stars) {
  if (stars == null) return "unrated";
  return "★".repeat(Math.floor(stars)) + (stars % 1 ? "½" : "") + ` (${stars}/5)`;
}

function toMarkdown(report, meta) {
  const r = normalise(report);
  const L = [];
  const brand = r.brand_summary.brand || (meta && meta.origin) || "Brand";
  L.push(`# Who's buying ${brand}?`);
  if (meta) {
    L.push(`Source: ${meta.origin} | Generated ${meta.date} | Pages read: ${meta.pages.length}${meta.model ? " | Model: " + meta.model : ""}`);
  }
  L.push("");
  L.push("## The brand, decoded");
  L.push(`- Sells: ${r.brand_summary.what_they_sell}`);
  L.push(`- Positioning: ${r.brand_summary.positioning}`);
  L.push(`- Who pays vs who uses: ${r.brand_summary.who_pays_vs_uses}`);
  if (r.brand_summary.content_quality_note) L.push(`- Content note: ${r.brand_summary.content_quality_note}`);
  L.push("");
  L.push("## The lineup (by buy-intent)");
  r.tgs.forEach((t, i) => L.push(`${i + 1}. ${t.name}: ${starText(t.stars)}${t.hot ? " - hottest TG" : ""}`));
  L.push("");
  r.tgs.forEach((t, i) => {
    L.push(`## TG ${i + 1}: ${t.name}${t.hot ? " (hottest)" : ""} [${tagLabel(t.evidence)}]`);
    if (t.tldr) L.push(`_${t.tldr}_`);
    L.push(`**Buy-intent:** ${starText(t.stars)}${t.stars_why ? " - " + t.stars_why : ""}`);
    L.push(`**Situation:** ${t.situation}`);
    L.push(`**The bouncer question:** ${t.split_question}`);
    L.push(`**First thought in their head:** ${t.first_question}`);
    L.push(`**Problem:** ${t.problem}`);
    L.push(`**Solution:** ${t.solution}`);
    L.push("**Reasons to buy:**");
    t.reasons_to_buy.forEach((x, j) =>
      L.push(
        `${j + 1}. (${reasonRole(j)}: ${ROLE_HINTS[j] || "creative"}) ${x.reason} [${tagLabel(x.tag)}]${
          x.pages.length ? " " + x.pages.map((n) => `[p${n}]`).join("") : ""
        }`
      )
    );
    L.push(`**Lead copy (${t.lead_copy.tone}):** ${t.lead_copy.line}`);
    L.push(`**Offer / pack:** ${t.offer}`);
    L.push(`**Ad angle:** ${t.ad_angle}`);
    L.push(
      `**Landing page hero:** ${t.landing_page_hero.headline} | ${t.landing_page_hero.subhead} | CTA: ${t.landing_page_hero.cta}`
    );
    L.push(`**${t.not_this_tg_if}**`);
    if (t.flags_for_signoff.length) L.push(`**Run past the client first:** ${t.flags_for_signoff.join("; ")}`);
    L.push("");
  });
  L.push("## The receipts: how these TGs were locked");
  r.audit.candidates_considered.forEach((c) => L.push(`- Considered: ${c}`));
  r.audit.merges.forEach((m) => L.push(`- Merged ${m.merged} into ${m.into}: ${m.reason}`));
  L.push(`- Overlap check: ${r.audit.overlap_check}`);
  if (r.flags_for_signoff.length) {
    L.push("");
    L.push("## Run past the client first");
    r.flags_for_signoff.forEach((f) => L.push(`- ${f}`));
  }
  if (meta && meta.pages.length) {
    const src = buildSources(r, meta);
    L.push("");
    L.push("## Sources & citation checklist");
    L.push(`${src.cited} of ${src.claims} reasons cite a page. Tick each page once you've checked its claims against the live site.`);
    src.rows.forEach((row) => {
      L.push(`- [ ] [p${row.n}] ${row.title || row.url} - ${row.url}${sourceDetail(row) ? " (" + sourceDetail(row) + ")" : ""}`);
      L.push(`  - ${row.citedBy.length ? "Cited by: " + row.citedBy.join("; ") : "Read, but not cited"}`);
    });
    if (src.failed.length) {
      L.push("");
      L.push("Tried but couldn't read:");
      src.failed.forEach((f) => L.push(`- ${f.url} (${f.reason})`));
    }
    if (src.trimmed) L.push("Note: page text was cut in half to fit the provider's limit.");
  }
  return L.join("\n");
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Five CSS stars (full / half / empty) as an HTML string. Styled by .stars / .star in both CSS files.
function starsHtml(stars) {
  if (stars == null) return `<span class="stars unrated">Unrated</span>`;
  let s = "";
  for (let i = 1; i <= 5; i++) {
    const cls = stars >= i ? "full" : stars >= i - 0.5 ? "half" : "empty";
    s += `<i class="star ${cls}"></i>`;
  }
  return `<span class="stars" role="img" aria-label="${stars} out of 5 stars">${s}</span>`;
}

const TG_COLORS = ["#F54E00", "#1D4AFF", "#00A37A", "#C98500", "#B62AD9"];

function toHtml(report, meta) {
  const r = normalise(report);
  const brand = r.brand_summary.brand || (meta && meta.origin) || "Brand";
  const row = (k, v) => (v ? `<p><b>${esc(k)}</b> ${esc(v)}</p>` : "");
  const lineup = r.tgs
    .map(
      (t, i) =>
        `<li style="--c:${TG_COLORS[i % 5]}"><span class="rank">${i + 1}</span><span class="nm">${esc(t.name)}${
          t.hot ? ' <span class="hot">Hottest</span>' : ""
        }</span>${starsHtml(t.stars)}<span class="score">${t.stars == null ? "" : t.stars + "/5"}</span></li>`
    )
    .join("");
  const cards = r.tgs
    .map(
      (t, i) => `
<section class="card" style="--c:${TG_COLORS[i % 5]}">
  <div class="eyebrow">TG ${i + 1}${t.hot ? ' · <span class="hot">Hottest TG</span>' : ""} · <span class="tag">${esc(tagLabel(t.evidence))}</span></div>
  <h2>${esc(t.name)}</h2>
  ${t.tldr ? `<p class="tldr">${esc(t.tldr)}</p>` : ""}
  <p class="rating">${starsHtml(t.stars)} <b>${esc(heatLabel(t.stars))}</b> ${esc(t.stars_why)}</p>
  ${t.split_question ? `<p class="bouncer"><b>The bouncer question:</b> ${esc(t.split_question)}</p>` : ""}
  ${row("Situation:", t.situation)}
  ${row("First thought in their head:", t.first_question)}
  ${row("Problem:", t.problem)}
  ${row("Solution:", t.solution)}
  <p><b>Reasons to buy</b></p>
  <ol>${t.reasons_to_buy
    .map(
      (x, j) =>
        `<li><i>${esc(reasonRole(j))}.</i> ${esc(x.reason)} <span class="tag">${esc(tagLabel(x.tag))}</span>${x.pages
          .map((n) => ` <a class="cite" href="#src-${n}">p${n}</a>`)
          .join("")}</li>`
    )
    .join("")}</ol>
  ${t.lead_copy.line ? `<blockquote>${esc(t.lead_copy.line)}${t.lead_copy.tone ? `<small>Tone: ${esc(t.lead_copy.tone)}</small>` : ""}</blockquote>` : ""}
  ${row("Offer / pack:", t.offer)}
  ${row("Ad angle:", t.ad_angle)}
  ${row(
    "Landing page hero:",
    [t.landing_page_hero.headline, t.landing_page_hero.subhead, t.landing_page_hero.cta ? "CTA: " + t.landing_page_hero.cta : ""]
      .filter(Boolean)
      .join(" | ")
  )}
  <p class="not">${esc(t.not_this_tg_if)}</p>
  ${t.flags_for_signoff.length ? `<p class="flag"><b>Run past the client first:</b> ${esc(t.flags_for_signoff.join("; "))}</p>` : ""}
</section>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Who's buying ${esc(brand)}? | WhoseMyTG</title>
<style>
body{font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:840px;margin:0 auto;padding:32px 16px;color:#151515;background:#EEEFE9}
h1{font-size:30px;line-height:1.15;margin:0 0 6px;letter-spacing:-.02em}.meta{color:#65675e;margin:0 0 24px;font-size:13px}
.card{background:#fff;border:1.5px solid #151515;border-radius:12px;padding:18px 22px;margin:18px 0;box-shadow:4px 4px 0 #151515;page-break-inside:avoid;border-top:8px solid var(--c,#151515)}
h2{font-size:21px;margin:2px 0 4px;letter-spacing:-.01em}.eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#65675e}
.tldr{font-style:italic;color:#3a3b36;margin:0 0 8px}.tag{font-size:11px;background:#EEEFE9;border-radius:99px;padding:1px 8px;font-weight:500;color:#3a3b36;text-transform:none;letter-spacing:0}
.hot{color:#F54E00;font-weight:800}.rating{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.bouncer{background:#FFF3C4;border-radius:8px;padding:8px 12px}
blockquote{margin:10px 0;padding:10px 14px;border-left:4px solid var(--c,#151515);background:#FAFAF7;font-size:17px;font-weight:600}
blockquote small{display:block;font-size:12px;font-weight:400;color:#65675e;margin-top:4px}
p{margin:6px 0}.not{font-style:italic;color:#444}.flag{color:#8a4b00}
ul,ol{margin:6px 0 6px 20px;padding:0}
ol.lineup{list-style:none;margin:0;padding:0}ol.lineup li{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #cfd0c8}
ol.lineup .rank{width:24px;height:24px;border-radius:50%;background:var(--c);color:#fff;font-weight:700;display:grid;place-items:center;font-size:12px}
ol.lineup .nm{flex:1;font-weight:600}.score{font-variant-numeric:tabular-nums;color:#65675e;font-size:13px}
.stars{display:inline-flex;gap:2px;vertical-align:middle}.stars.unrated{font-size:12px;color:#65675e}
.star{width:15px;height:15px;display:inline-block;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);background:#d9dad2}
.star.full{background:#F7A501}.star.half{background:linear-gradient(90deg,#F7A501 50%,#d9dad2 50%)}
.cite{font-size:11px;font-weight:700;color:#1D4AFF;text-decoration:none;border:1px solid #c5cff9;border-radius:4px;padding:0 4px}
.src{list-style:none;margin:8px 0 0;padding:0}.src li{display:grid;grid-template-columns:22px 1fr;gap:8px;padding:8px 0;border-bottom:1px dashed #cfd0c8}
.src input{margin-top:4px;width:16px;height:16px}.src a{word-break:break-all}.src small{display:block;color:#65675e}
@media print{body{background:#fff}.card{box-shadow:none}}
</style></head><body>
<h1>Who's buying ${esc(brand)}?</h1>
<p class="meta">${meta ? esc(meta.origin) + " · " + esc(meta.date) + " · " + meta.pages.length + " pages read" + (meta.model ? " · " + esc(meta.model) : "") : ""} · Made with WhoseMyTG</p>
<section class="card"><div class="eyebrow">The brand, decoded</div>
${row("Sells:", r.brand_summary.what_they_sell)}
${row("Positioning:", r.brand_summary.positioning)}
${row("Who pays vs who uses:", r.brand_summary.who_pays_vs_uses)}
${row("Content note:", r.brand_summary.content_quality_note)}
</section>
<section class="card"><div class="eyebrow">The lineup, ranked by buy-intent</div><ol class="lineup">${lineup}</ol></section>
${cards}
<section class="card"><div class="eyebrow">The receipts: how these TGs were locked</div>
<ul>${r.audit.candidates_considered.map((c) => `<li>Considered: ${esc(c)}</li>`).join("")}
${r.audit.merges.map((m) => `<li>Merged ${esc(m.merged)} into ${esc(m.into)}: ${esc(m.reason)}</li>`).join("")}
<li>Overlap check: ${esc(r.audit.overlap_check)}</li></ul>
${r.flags_for_signoff.length ? `<p class="flag"><b>Run past the client first:</b></p><ul>${r.flags_for_signoff.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
</section>
${sourcesHtml(r, meta)}
<p class="meta">"Educated guess" means exactly that. Validate with GA4, CRM or interview data before you lock anything.</p>
</body></html>`;
}

function sourcesHtml(r, meta) {
  if (!meta || !meta.pages || !meta.pages.length) return "";
  const src = buildSources(r, meta);
  const rows = src.rows
    .map(
      (row) => `<li id="src-${row.n}"><input type="checkbox" aria-label="Checked page ${row.n}"><div><b>p${row.n} · ${esc(
        row.title || row.url
      )}</b> <a href="${esc(row.url)}">${esc(row.url)}</a><small>${esc(sourceDetail(row))}</small><small>${
        row.citedBy.length ? "Cited by: " + esc(row.citedBy.join("; ")) : "Read, but not cited"
      }</small></div></li>`
    )
    .join("");
  return `<section class="card"><div class="eyebrow">Sources &amp; citation checklist</div>
<p>${src.cited} of ${src.claims} reasons cite a page${src.siteUncited ? `; ${src.siteUncited} tagged "site" have no page cited` : ""}. Tick each page once you've checked its claims against the live site.</p>
<ul class="src">${rows}</ul>
${src.failed.length ? `<p><b>Tried but couldn't read:</b></p><ul>${src.failed.map((f) => `<li>${esc(f.url)} (${esc(f.reason)})</li>`).join("")}</ul>` : ""}
${src.trimmed ? "<p class=\"meta\">Page text was cut in half to fit the provider's limit.</p>" : ""}
</section>`;
}

if (typeof module !== "undefined") {
  module.exports = {
    buildSources,
    pickPages,
    parseModelJson,
    normalise,
    toMarkdown,
    toHtml,
    reasonRole,
    toStars,
    heatLabel,
    tagLabel,
    starsHtml,
  };
}
