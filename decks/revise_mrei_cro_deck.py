"""Revise MREI CRO deck per cro-smith-skills: fixes, claim labels, new slides, reorder."""
import copy, sys
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn

SRC, OUT = sys.argv[1], sys.argv[2]
p = Presentation(SRC)
S = list(p.slides)            # original order, 1-based via O(n)
def O(n): return S[n - 1]

NAVY, RED, GREY, LIGHT = "0F2C5C", "C8102E", "5A6472", "96A1B0"
PANEL, TINT, LINE, WHITE = "F4F6FA", "E8EEF7", "D8DFE8", "FFFFFF"
GREEN, GREEN_T, AMBER, AMBER_T, RED_T = "1E7B34", "E5F1EA", "B26B00", "FFF3DC", "FBE7EA"
FONT = "Sora"
warnings = []

# ---------------------------------------------------------------- helpers
def rgb(h): return RGBColor.from_string(h)

def fits(text, pt, w, h):
    cpl = max(1, int((w * 72) / (pt * 0.56)))
    lines = sum(max(1, -(-len(l) // cpl)) for l in text.split("\n"))
    return (lines * pt * 1.28) / 72 <= h

def box(slide, x, y, w, h, fill=None, line=None, rounded=False, radius=0.08):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE,
                                 Inches(x), Inches(y), Inches(w), Inches(h))
    if rounded:
        shp.adjustments[0] = radius
    if fill: shp.fill.solid(); shp.fill.fore_color.rgb = rgb(fill)
    else: shp.fill.background()
    if line: shp.line.color.rgb = rgb(line); shp.line.width = Pt(0.75)
    else: shp.line.fill.background()
    shp.shadow.inherit = False
    return shp

def text(slide, x, y, w, h, runs, size=10, color=NAVY, bold=False, align="l",
         anchor="t", italic=False, check=True, spacing=None):
    """runs: str or list of paragraphs; paragraph = str or list of (text, {opts})."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    paras = runs if isinstance(runs, list) else [runs]
    plain = []
    for i, para in enumerate(paras):
        pp = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        pp.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        if spacing: pp.space_after = Pt(spacing)
        segs = para if isinstance(para, list) else [(para, {})]
        line = ""
        for seg, o in segs:
            r = pp.add_run(); r.text = seg; line += seg
            f = r.font; f.name = FONT; f.size = Pt(o.get("size", size)); f.bold = o.get("bold", bold)
            f.italic = o.get("italic", italic); f.color.rgb = rgb(o.get("color", color))
        plain.append(line)
    if check and not fits("\n".join(plain), size, w, h + 0.02):
        warnings.append(f"fit? {plain[0][:40]!r} ({size}pt in {w}x{h})")
    return tb

CHIP = {"MEASURED": (GREEN, GREEN_T), "TO VALIDATE": (AMBER, AMBER_T), "HYPOTHESIS": (NAVY, TINT)}
def chip(slide, label, x, y, w=None, h=0.22, size=6.5):
    fg, bg = CHIP[label]
    w = w or (0.2 + 0.075 * len(label))
    b = box(slide, x, y, w, h, fill=bg, line=fg, rounded=True, radius=0.5)
    b.line.width = Pt(0.5)
    tf = b.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE; tf.word_wrap = False
    pp = tf.paragraphs[0]; pp.alignment = PP_ALIGN.CENTER
    r = pp.add_run(); r.text = label
    r.font.name = FONT; r.font.size = Pt(size); r.font.bold = True; r.font.color.rgb = rgb(fg)
    return w

def verdict_chip(slide, label, x, y, w, h=0.2):
    styles = {"In the fold": (GREEN, GREEN_T), "Below the fold": (AMBER, AMBER_T),
              "Needs a click": (AMBER, AMBER_T), "Not answered": (RED, RED_T),
              "Answered wrongly": (WHITE, RED)}
    fg, bg = styles[label]
    b = box(slide, x, y, w, h, fill=bg, rounded=True, radius=0.5)
    tf = b.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    pp = tf.paragraphs[0]; pp.alignment = PP_ALIGN.CENTER
    r = pp.add_run(); r.text = label.upper()
    r.font.name = FONT; r.font.size = Pt(6.5); r.font.bold = True; r.font.color.rgb = rgb(fg)

def header(slide, kicker, title, sub, source):
    text(slide, 0.60, 0.32, 10.4, 0.20, kicker, size=9, color=RED, bold=True)
    text(slide, 0.60, 0.55, 12.10, 0.60, title, size=24, color=NAVY, bold=True)
    text(slide, 0.60, 1.17, 12.10, 0.30, sub, size=12, color=GREY)
    text(slide, 0.60, 7.08, 12.10, 0.22, source, size=7.5, color=LIGHT)

def new_slide(notes=None):
    s = p.slides.add_slide(p.slide_layouts[0])
    bg = s.background.fill; bg.solid(); bg.fore_color.rgb = rgb(WHITE)
    if notes: s.notes_slide.notes_text_frame.text = notes
    return s

def set_notes(slide, txt):
    slide.notes_slide.notes_text_frame.text = txt

def add_note(slide, txt):
    tf = slide.notes_slide.notes_text_frame
    tf.text = (tf.text + "\n\n" + txt) if tf.text.strip() else txt

def replace(slide, old, new, notes=False, must=True):
    """Replace text within paragraphs, even across runs; keeps the first run's style."""
    frames = []
    if notes:
        frames = [slide.notes_slide.notes_text_frame]
    else:
        def walk(shapes):
            for sh in shapes:
                if sh.shape_type == 6: walk(sh.shapes)
                if sh.has_text_frame: frames.append(sh.text_frame)
                if getattr(sh, "has_table", False) and sh.has_table:
                    for row in sh.table.rows:
                        for c in row.cells: frames.append(c.text_frame)
        walk(slide.shapes)
    hit = 0
    for tf in frames:
        for para in tf.paragraphs:
            runs = para.runs
            full = "".join(r.text for r in runs)
            if old not in full: continue
            hit += 1
            # try single-run replacement first
            for r in runs:
                if old in r.text:
                    r.text = r.text.replace(old, new); break
            else:
                runs[0].text = full.replace(old, new)
                for r in runs[1:]: r.text = ""
    if must and not hit:
        warnings.append(f"NOT FOUND on slide: {old[:50]!r}")
    return hit

def shape_with_text(slide, exact):
    for sh in slide.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip() == exact: return sh
    warnings.append(f"no shape with text {exact!r}"); return None

def restyle(sh, color=NAVY, font=FONT, underline=False):
    for para in sh.text_frame.paragraphs:
        for r in para.runs:
            r.font.name = font; r.font.color.rgb = rgb(color); r.font.underline = underline
            rPr = r._r.find(qn("a:rPr"))
            if rPr is not None:
                for hl in rPr.findall(qn("a:hlinkClick")): rPr.remove(hl)

# ================================================================ 1. FIXES
# Slide 2: section name + claim-label legend
sh = shape_with_text(O(2), "Testing")
if sh: sh.text_frame.paragraphs[0].runs[0].text = "Experimentation"
text(O(2), 4.15, 4.31, 1.0, 0.22, "CLAIM LABELS", size=7, color=LIGHT, bold=True, anchor="m", check=False)
cx = 5.15
for lab, desc, dw in [("MEASURED", "seen in GA4 or on the site", 1.45),
                      ("TO VALIDATE", "measured, dirty definition", 1.45),
                      ("HYPOTHESIS", "our proposal, to test", 1.2)]:
    w = chip(O(2), lab, cx, 4.31)
    text(O(2), cx + w + 0.07, 4.31, dw, 0.22, desc, size=7, color=GREY, anchor="m", check=False)
    cx += w + 0.07 + dw + 0.1
add_note(O(2), "Claim labels: every content slide carries one in the top-right corner. MEASURED = observed in GA4 or on the live site. TO VALIDATE = measured, but the event behind it is not a clean definition (form_submit, file_download) or two cuts disagree. HYPOTHESIS = a proposal that a test or MREI confirmation has to prove.")

# Slide 4: flag the conflicting CSE figures instead of silently changing them
add_note(O(4), "RECONCILE BEFORE SENDING: this slide says B.Tech CSE produced 21 form starts and 5 Apply Now clicks in 90 days. The event slide shows 47 Apply Now clicks on the same page, and the appendix journey slide shows 3 + 20 = 23 form starts and 38 main-nav Apply clicks. These are probably different buttons / event definitions — name the one used here.")

# Slide 17: the 10x claim only holds on the CSE page; form_submit is not a lead
replace(O(17), "The brochure is clicked 10× more often than Apply Now.",
        "Here, brochure downloads outnumber Apply Now clicks 10 to 1.")
replace(O(17), "Leads captured (form submits)", "Form submits (not clean leads)")
replace(O(17), "Leads captured", "Form submits")
replace(O(17), "Event counts, not sessions.",
        "Event counts, not sessions. file_download fires on any file, so 3,717 is an upper bound.")
# Slide 20
replace(O(20), "Leads captured", "Form submits")
replace(O(20), "phone clicks outnumber captured leads 76 to 30", "phone clicks outnumber form submits 76 to 30", notes=True)

# Chat auto-open and image-only ranks did not reproduce on 24 Sept (per slide 51 notes)
replace(O(18), "A chat widget auto-opens directly over the lead-capture form.",
        "A chat teaser and bubble sit directly over the lead-capture form.")
replace(O(25), "The chat widget auto-opens directly over live fee values.",
        "The chat teaser and bubble sit directly over live fee values.")
replace(O(32), "but shown only as static certificate images.", "but presented mainly as certificate images.")
replace(O(32), "Rank numbers aren't machine-readable text, just pictures of PDFs.",
        "The rank and what it covers are not the headline — the certificate is.")
replace(O(64), "delay the chat pop-up so it can't cover the lead form",
        "keep the chat teaser clear of the lead form")
replace(O(68), "Stop the chat widget auto-opening over the fee table on load",
        "Move the chat teaser and bubble off the fee table")
replace(O(70), "stop the chat auto-popup on load", "keep the chat teaser off content")

# Slide 25: title styled as a hyperlink; source line floating top-right
sh = shape_with_text(O(25), "MRIIRS Fee Structure Page")
if sh: restyle(sh)
for sh in O(25).shapes:
    if sh.has_text_frame and sh.text_frame.text.startswith("Source: GA4 Landing Page Data") and sh.top < Inches(0.3):
        sh.left, sh.top, sh.width, sh.height = Inches(0.27), Inches(7.22), Inches(8.0), Inches(0.15)

# Slide 50: bounce figure and users-vs-events wording
replace(O(50), "11% move onward from credibility pages; 68% bounce", "11% move onward from credibility pages; 67% bounce")
replace(O(50), "6 of 6,964 users continue past the research round-trip",
        "6 users continue anywhere after 6,964 return moves")

# Slide 63: brochure must stay ungated (slide 17 notes, slide 62, T6)
replace(O(63), "Gated capture — profile reused later in the session",
        "Direct PDF, no gate — optional “send to WhatsApp” captures the number")

# Leftover kickers / serif titles from an earlier deck
for n, old, new in [(18, "01 — CURRENT STATE - course page", "COURSE RESEARCHER  ·  CURRENT STATE"),
                    (64, "03 — WHAT TO FIX, IN ORDER", "COURSE TEMPLATE  ·  FIXES"),
                    (87, "02 — WHO LANDS HERE", "APPENDIX  ·  PERSONA VERDICTS, FOLD 1–2")]:
    sh = shape_with_text(O(n), old)
    if sh:
        sh.text_frame.paragraphs[0].runs[0].text = new
        for r in sh.text_frame.paragraphs[0].runs[1:]: r.text = ""
        restyle(sh, RED); sh.width = Inches(8)
for n, t in [(64, "Six fixes, ranked by effort vs. what breaks today"), (87, "What each persona actually gets, in fold 1–2")]:
    sh = shape_with_text(O(n), t)
    if sh: restyle(sh, NAVY)

# Slide 82 (roadmap): phase names line up with "Phase 0" on 81 and the backlog; fix the target maths
for old, new in [("PHASE 1", "PHASE 0"), ("PHASE 2", "PHASE 1"), ("PHASE 3", "PHASE 2")]:
    sh = shape_with_text(O(82), old)
    if sh: sh.text_frame.paragraphs[0].runs[0].text = new
replace(O(82), "A 50% lift in conversion rate delivers the same lead growth as a 33% lift in traffic. Together, SEO and CRO reach 100%.",
        "SEO’s +33% traffic and CRO’s +50% conversion rate compound: 1.33 × 1.50 = 2.0, i.e. 100% more leads. The CRO half can only be read once Phase 0 sets a lead baseline.")
set_notes(O(82), "Close on measurement. The absence of lead events is the single biggest blocker to proving the 100% target either way. The target is multiplicative: 1.33 × 1.50 = 2.0. A 50% conversion lift alone is +50% leads, not the same as +33% traffic.")
set_notes(O(81), "Phase 0 is the detail behind the first column of the roadmap on the previous slide: until generate_lead exists, the macro KPI in every test that follows cannot be read.")

# Appendix copies of the older CSE journey slides: say why they differ
for n in (15, 16):
    add_note(O(n), "APPENDIX — retained from an earlier cut. Figures differ from the page-path slide in section 03 (83.0% / 99.6% / 22 of 6,097 here vs 84.3% / 99.3% / 6 of 6,964 there; 3 + 20 form starts vs 21). Likely a different date range or filter — reconcile before using externally.")

sh = shape_with_text(O(78), "No competitor does everything — but each does one thing worth grabbing")
if sh:
    for r in sh.text_frame.paragraphs[0].runs: r.font.size = Pt(21)

# ================================================================ 2. CLAIM LABELS on existing slides
LABELS = {
    "MEASURED": [4, 6, 9, 10, 13, 14, 18, 19, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 34, 35,
                 37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 50, 51, 52, 67, 78, 79, 81, 88],
    "TO VALIDATE": [5, 8, 15, 16, 17, 20],
    "HYPOTHESIS": [54, 55, 56, 57, 58, 59, 61, 62, 63, 65, 66, 69, 71, 72, 74, 75, 77, 82, 83, 84, 85],
}
POS = {25: (11.35, 0.10), 15: (0.60, 0.08), 57: (9.9, 0.60), 58: (9.9, 0.60), 59: (9.9, 0.60),
       54: (11.35, 0.12), 55: (11.35, 0.12), 56: (11.35, 0.12), 82: (11.35, 0.20), 34: (11.35, 0.45),
       24: (11.35, 0.45), 41: (11.35, 0.45), 48: (11.35, 0.45), 88: (11.35, 0.20)}
for lab, nums in LABELS.items():
    for n in nums:
        x, y = POS.get(n, (11.35, 0.30))
        w = 0.2 + 0.075 * len(lab)
        chip(O(n), lab, 12.73 - w if x == 11.35 else x, y)

# ================================================================ 3. NEW SLIDES
# N1 — the answer, up front
n1 = new_slide("Open with the answer. Three things: where the constraint is (reach to a next step, not traffic), what has to happen first (measurement — there is no lead event), and what the target means in numbers. The credit line at the bottom matters: the institution hubs already work, and the plan protects them.")
header(n1, "THE ANSWER, UP FRONT",
       "The traffic is there. The next step isn’t — and neither is the lead event.",
       "Where the constraint sits, what we would do first, and what the target means in numbers",
       "Source: GA4 — MREI Regular Website, 11 Jun – 10 Sept 2026 (sessions, paths) · GA4 event export by page type (event counts) · Live site audit, 24 Sept 2026. Value maths on “Leads = sessions × reach × capture”.")
cards = [
    ("01  WHERE THE CONSTRAINT IS", "MEASURED", "0.6%", "of sessions reach any page built to capture a lead",
     "Organic is 67.4% of sessions and they engage (68.4%). Course, fee, blog and proof templates take 43% of landings but fire 12% of form submits. Each answers its visitor’s question, then offers no next step: after 6,964 returns from the fee page, 6 users continue."),
    ("02  WHAT HAS TO HAPPEN FIRST", "TO VALIDATE", "0", "lead events configured in GA4 today",
     "form_submit exceeds form_start on course pages (209 vs 64) and file_download fires on any file. Every conversion figure here is directional until generate_lead exists. Weeks 1–2: instrumentation, plus five verified defects such as the Fee Calculator redirecting home."),
    ("03  WHAT WE WOULD DO", "HYPOTHESIS", "2×", "organic leads = 1.33 traffic × 1.50 conversion",
     "Put the next step where each question is answered: a fee summary on the course page, one fee card plus a call on the fee page, a programme link in every article. Illustratively, the CRO half needs ~590 more organic sessions a quarter to reach a capture point — under 1 in 100 of those already landing on these templates."),
]
for i, (k, lab, big, cap, body) in enumerate(cards):
    x = 0.60 + i * 4.10
    box(n1, x, 1.72, 3.90, 4.28, fill=PANEL if i < 2 else NAVY, rounded=True, radius=0.04)
    dark = i == 2
    text(n1, x + 0.25, 1.92, 3.4, 0.22, k, size=8.5, color=("FF8095" if dark else RED), bold=True)
    chip(n1, lab, x + 0.25, 2.24)
    text(n1, x + 0.25, 2.58, 3.4, 0.62, big, size=34, color=(WHITE if dark else RED), bold=True)
    text(n1, x + 0.25, 3.28, 3.4, 0.40, cap, size=10, color=(WHITE if dark else NAVY), bold=True)
    text(n1, x + 0.25, 3.78, 3.4, 2.10, body, size=10.5, color=("D8DFE8" if dark else GREY))
box(n1, 0.60, 6.18, 12.10, 0.72, fill=GREEN_T, rounded=True, radius=0.12)
text(n1, 0.85, 6.26, 11.6, 0.56,
     [[("WHAT ALREADY WORKS  ", {"bold": True, "color": GREEN, "size": 8.5}),
       ("The /mriirs and /mru hubs: 76.1% engagement, 3.33 views per session and 517 of 613 Apply-MRIIRS clicks. "
        "We protect this template and copy its pattern — self-segment in one step, route onward — onto the pages that leak.", {})]],
     size=10.5, color=NAVY, anchor="m")

# N2 — funnel economics
n2 = new_slide("Funnel economics: Leads = organic sessions × share that reaches a capture point × capture rate. Traffic is SEO's term. Capture rate cannot be ranked until Phase 0 gives it a number. Reach is both the leak (0.6%) and the lever (43% of landings meet no next step). The worked illustration is a hypothesis — its assumptions are printed on the slide.")
header(n2, "THE OPPORTUNITY  ·  FUNNEL ECONOMICS",
       "Leads = sessions × reach × capture. The leak is the middle term.",
       "Where a unit of CRO effort buys the most leads — with the assumptions on the slide, not in a footnote",
       "Source: GA4 — MREI Regular Website, 11 Jun – 8 Sept 2026 (organic sessions) · GA4 event export by page type (landing shares, event counts) · lead-event status as stated in this deck.")
terms = [("ORGANIC SESSIONS", "1,96,542", "per 90 days · SEO’s term: +33% target", "MEASURED", PANEL, NAVY),
         ("REACH A CAPTURE POINT", "0.6%", "of sessions today · the leak", "MEASURED", RED_T, RED),
         ("CAPTURE RATE", "?", "no lead event to measure it", "TO VALIDATE", PANEL, NAVY),
         ("LEADS", "—", "not measurable today", "TO VALIDATE", NAVY, WHITE)]
for i, (k, big, cap, lab, fill, col) in enumerate(terms):
    x = 0.60 + i * 3.10
    box(n2, x, 1.68, 2.70, 1.38, fill=fill, rounded=True, radius=0.06)
    text(n2, x + 0.18, 1.80, 2.4, 0.2, k, size=7.5, color=(LIGHT if fill != NAVY else "CADCFC"), bold=True)
    text(n2, x + 0.18, 2.04, 2.4, 0.5, big, size=26, color=col, bold=True)
    text(n2, x + 0.18, 2.58, 2.4, 0.2, cap, size=8, color=(GREY if fill != NAVY else "D8DFE8"))
    chip(n2, lab, x + 0.18, 2.80)
    if i < 3:
        text(n2, x + 2.72, 2.05, 0.36, 0.5, "×" if i < 2 else "=", size=22, color=LIGHT, bold=True, align="c")
cols = [("LEVER", 2.35), ("TODAY", 2.55), ("REALISTIC MOVE", 2.55), ("EFFORT", 1.35), ("RANK · WHY", 3.30)]
y0 = 3.30
x = 0.60
for c, w in cols:
    text(n2, x + 0.1, y0, w - 0.2, 0.2, c, size=7.5, color=LIGHT, bold=True); x += w
rows = [
    ("Reach a capture point", "0.6% of sessions reach a lead page; 6 continue after the CSE–fee round-trip",
     "Bring the next step onto course, fee and blog pages: 0.6% → 0.9%", "Medium · template", "1 · Leak and lever: 43% of landings meet no next step"),
    ("Capture intent already shown", "483 brochure downloads vs 47 Apply on CSE; 82 calls vs 31 submits on fee pages",
     "Record who acts: optional WhatsApp send, callback beside the fee", "Low · config", "2 · Intent is already expressed — we just don’t know who"),
    ("Capture rate on forms", "Unknown — form_submit is not a clean lead", "Set after Phase 0 gives a baseline",
     "Low–medium", "3 · Cannot be ranked until it is measured"),
    ("Organic traffic", "1,96,542 sessions / 90 days", "+33% via the SEO programme", "High · slow",
     "Out of scope here — compounds with every CRO gain"),
]
for j, r in enumerate(rows):
    y = y0 + 0.26 + j * 0.56
    box(n2, 0.60, y, 12.10, 0.50, fill=(RED_T if j == 0 else PANEL), rounded=True, radius=0.1)
    x = 0.60
    for (c, w), v in zip(cols, r):
        text(n2, x + 0.12, y + 0.05, w - 0.22, 0.42, v, size=8.5 if c != "LEVER" else 9,
             color=NAVY, bold=(c in ("LEVER",)), anchor="m")
        x += w
box(n2, 0.60, 5.88, 12.10, 1.02, fill=NAVY, rounded=True, radius=0.08)
chip(n2, "HYPOTHESIS", 0.85, 6.00)
text(n2, 0.85, 6.28, 11.6, 0.56,
     "Worked illustration: holding capture rate flat, +50% leads needs reach to rise from 0.6% to 0.9% of organic sessions — 1,179 → ~1,770 a quarter. "
     "That is ~590 more sessions, or 0.7% of the ~84,500 organic sessions that land on course, fee, blog and proof templates. "
     "Assumes the site-wide 0.6% and the export’s 43% landing share both hold for organic traffic.", size=9.5, color=WHITE)

# N3 — intent × journey matrix
n3 = new_slide("Audit the question, not the template. Each row is a persona with the question it arrives with; each column is a point in the visit. Verdicts come from the live audit (24 Sept) and the GA4 paths already in this deck. Priority = sessions × how close the intent is to a lead — the Cost Checker ranks above the Proof Seeker despite fewer sessions because it is the highest-intent visitor (73.4% engagement, 82 phone clicks). The Shortlister ranks last because it already works: protect it.")
header(n3, "THE FIVE JOURNEYS  ·  INTENT × JOURNEY MATRIX",
       "Five questions, scored where they land",
       "Does the page answer this visitor’s question at each point of the visit? The unanswered cells are the backlog",
       "Source: Live site audit, 24 Sept 2026 (390px mobile) · GA4 explorations and landing pages, 13 Jun – 10 Sept 2026 (figures as used in this deck). Priority = sessions × intent value (closeness to a lead).")
chip(n3, "MEASURED", 12.73 - (0.2 + 0.075 * 8), 0.30)
C = [("PERSONA · QUESTION", 2.55), ("SESSIONS", 0.85), ("LANDS ON", 1.15), ("1 · FIRST FOLD", 1.75),
     ("2 · THE ANSWER", 1.75), ("3 · THE NEXT STEP", 1.75), ("4 · A CAPTURE THAT FITS", 1.75), ("RANK", 0.55)]
x = 0.60
for c, w in C:
    text(n3, x + 0.08, 1.66, w - 0.1, 0.2, c, size=7, color=LIGHT, bold=True); x += w
M = [
    ("Course Researcher", "“Is this course worth it?”", "53,812", "B.Tech CSE",
     [("Below the fold", "Campaign block before any CSE content"), ("Below the fold", "Fee ~13 screens down, year 1 only"),
      ("Not answered", "6 continue after the fee round-trip"), ("Answered wrongly", "Brochure is an anonymous PDF")], "1"),
    ("Cost Checker", "“What does it cost — can I get in?”", "23,219", "Fee structure",
     [("Needs a click", "Search box; 15-column table"), ("Answered wrongly", "Search misreturns; total in column 15"),
      ("Not answered", "Calculator → homepage; eligibility 7–201"), ("Not answered", "Footer number only; 82 calls vs 31 submits")], "2"),
    ("Proof Seeker", "“Should I believe them?”", "27,579", "Awards",
     [("In the fold", "Real rankings and awards"), ("Not answered", "NBA for CSE absent from the CSE page"),
      ("Not answered", "~11% move on; 9 reach fees"), ("Answered wrongly", "Generic Apply / Enquire")], "3"),
    ("Early Explorer", "“What should I study?”", "22,813", "Blog article",
     [("In the fold", "Article answers the exam question"), ("Needs a click", "0–1 programme links per article"),
      ("Answered wrongly", "“Also Read” → more posts; home"), ("Answered wrongly", "Apply Now to an undecided reader")], "4"),
    ("University Shortlister", "“Is this university right?”", "18,752", "/mriirs, /mru",
     [("In the fold", "Find a Program + NAAC up front"), ("In the fold", "UG / PG / Doctoral hub"),
      ("In the fold", "Hub routes onward: UG 2,452"), ("Not answered", "No compare route; 673 loop home")], "5"),
]
for j, (pers, q, sess, land, cells, rank) in enumerate(M):
    y = 1.92 + j * 0.84
    box(n3, 0.60, y, 12.10, 0.78, fill=(PANEL if j % 2 == 0 else WHITE), line=LINE, rounded=True, radius=0.06)
    text(n3, 0.72, y + 0.12, 2.35, 0.24, pers, size=10, color=NAVY, bold=True)
    text(n3, 0.72, y + 0.40, 2.35, 0.30, q, size=8.5, color=GREY, italic=True)
    text(n3, 3.19, y + 0.12, 0.8, 0.24, sess, size=10, color=NAVY, bold=True)
    text(n3, 4.04, y + 0.12, 1.05, 0.5, land, size=8.5, color=NAVY)
    x = 5.15
    for lab, det in cells:
        verdict_chip(n3, lab, x + 0.06, y + 0.10, 1.55)
        text(n3, x + 0.06, y + 0.36, 1.62, 0.40, det, size=7.2, color=GREY)
        x += 1.75
    b = box(n3, 12.20, y + 0.20, 0.38, 0.38, fill=(RED if rank in "12" else (NAVY if rank in "34" else GREEN)), rounded=True, radius=0.5)
    text(n3, 12.20, y + 0.20, 0.38, 0.38, rank, size=11, color=WHITE, bold=True, align="c", anchor="m")
text(n3, 0.60, 6.18, 12.10, 0.8,
     [[("How to read it  ", {"bold": True, "color": NAVY}),
       ("Same template, different verdicts: the fee answer exists on the CSE page, but thirteen screens down it fails the Course Researcher. "
        "Rank 1–2 carry the first wave of fixes and tests; the Early Explorer waits for blog traffic to be validated; the Shortlister row is the pattern to copy — its only gap is people still comparing MRIIRS and MRU.", {})]],
     size=9, color=GREY)

# N4 — personalisation
n4 = new_slide("Personalisation, kept small: three rules, each fed by a first-party session signal, each with a 10% holdout. If a rule does not beat the default, it comes off. City or campaign signals wait until consent handling is in place. R1 is the cheapest — it is a URL parameter and overlaps with test T4.")
header(n4, "WHAT THE SITE SHOULD DO  ·  PERSONALISATION",
       "Three rules, not thirty — each ships with a holdout",
       "No login needed: signals the session already carries. A rule stays only if it beats the default",
       "Source: GA4 explorations, 13 Jun – 10 Sept 2026 (figures as used in this deck). Holdout share and metrics are proposals, to agree with MREI.")
chip(n4, "HYPOTHESIS", 12.73 - (0.2 + 0.075 * 10), 0.30)
H = [("SIGNAL", 2.55), ("INFERRED INTENT", 2.15), ("WHAT THE PAGE SHOWS", 3.35), ("HOLDOUT · MEASURE", 2.45), ("WHY WE THINK SO", 1.60)]
x = 0.60
for c, w in H:
    text(n4, x + 0.15, 1.70, w - 0.2, 0.2, c, size=7.5, color=LIGHT, bold=True); x += w
R = [("R1", "Fee page entered from a course page (referrer)", "“What does this programme cost?”",
      "Opens on that programme’s fee card — total, installments, variants — with “Back to B.Tech CSE”",
      "10% see the generic page · leads on fee page · guard: fee→home exits", "70% of MRIIRS fee entries come from CSE; 7,070 go back"),
     ("R2", "Viewed an MRIIRS and an MRU page in one session", "“Which Manav Rachna is right for me?”",
      "“Compare MRIIRS & MRU” and a counsellor option on the next page, instead of a second Apply",
      "10% holdout · leads · guard: Apply-MRIIRS clicks", "494 fee-page hops; 166 /mru → /mriirs"),
     ("R3", "Landed on a blog article mapped to a programme", "“What should I study?” — not ready to apply",
      "The matching programme card and “Talk to a course guide” replace the sticky Apply Now",
      "10% holdout · article → programme · guard: engagement", "35 of 4,195 NEET/BPT readers reach BPT")]
for j, (rid, sig, intent, show, hold, why) in enumerate(R):
    y = 1.98 + j * 1.14
    box(n4, 0.60, y, 12.10, 1.02, fill=PANEL, rounded=True, radius=0.06)
    b = box(n4, 0.78, y + 0.18, 0.42, 0.42, fill=NAVY, rounded=True, radius=0.5)
    text(n4, 0.78, y + 0.18, 0.42, 0.42, rid, size=9, color=WHITE, bold=True, align="c", anchor="m")
    text(n4, 1.32, y + 0.16, 1.75, 0.8, sig, size=10, color=NAVY, bold=True)
    vals = [intent, show, hold, why]
    x = 0.60 + 2.55
    for (c, w), v in zip(H[1:], vals):
        text(n4, x + 0.15, y + 0.16, w - 0.3, 0.9, v, size=10 if c != "WHY WE THINK SO" else 8.5,
             color=(RED if c == "INFERRED INTENT" else (GREY if c == "WHY WE THINK SO" else NAVY)),
             bold=(c == "INFERRED INTENT"), italic=(c == "INFERRED INTENT"))
        x += w
box(n4, 0.60, 5.55, 12.10, 0.90, fill=NAVY, rounded=True, radius=0.08)
text(n4, 0.85, 5.65, 11.6, 0.7,
     [[("THE LOOP  ", {"bold": True, "color": "FF8095", "size": 8.5}),
       ("signal → one session profile → rule → surface → result feeds the profile. All three need Phase 0 events to be read. "
        "R1 is a URL parameter, so it can ship with test T4. Rules using city or campaign wait until consent handling is in place.", {})]],
     size=10, color=WHITE, anchor="m")

# N5 — how the programme runs
n5 = new_slide("How the test programme runs. One live test per template so tests don't contaminate each other, six live at most. Decision rules are agreed before a test starts, not after the result. The freeze window must be agreed with MREI admissions: the dates are theirs, not ours. Never switch off media to create a control — split traffic already arriving.")
header(n5, "EXPERIMENTATION  ·  HOW THE PROGRAMME RUNS",
       "Six live at most, one per template, decided by rules agreed up front",
       "The fourteen tests are a backlog, not a launch plan — this is the order and the rules",
       "Source: A/B test backlog (T1–T14) in this deck. Thresholds, holdouts and freeze dates are proposals, to agree with MREI before the first launch.")
chip(n5, "HYPOTHESIS", 12.73 - (0.2 + 0.075 * 10), 0.30)
text(n5, 0.60, 1.68, 6.2, 0.22, "WAVE 1 — AFTER PHASE 0 SETS THE BASELINE", size=8, color=RED, bold=True)
W1 = [("Fee structure", "T1", "Fee selector → one fee card", "Highest-intent visitor; defect-level findability"),
      ("Course template", "T5", "Fee summary at decision height", "Largest persona; 84.3% leave for the fee"),
      ("Brochure page", "T7", "Programme prospectus", "2,746 downloads, 4 form submits"),
      ("Awards", "T9", "Award → programme links", "S effort; 67% bounce today"),
      ("Institution root", "T12", "Compare MRIIRS & MRU", "Adds to the benchmark, doesn’t replace it"),
      ("Homepage", "T14", "Three-way intent router", "36% of landings, persona unknown")]
for j, (tpl, tid, name, why) in enumerate(W1):
    y = 1.98 + j * 0.47
    box(n5, 0.60, y, 6.30, 0.41, fill=PANEL, rounded=True, radius=0.15)
    text(n5, 0.75, y + 0.02, 1.45, 0.37, tpl, size=8.5, color=GREY, anchor="m")
    text(n5, 2.20, y + 0.02, 0.45, 0.37, tid, size=9, color=RED, bold=True, anchor="m")
    text(n5, 2.65, y + 0.02, 2.05, 0.37, name, size=8.5, color=NAVY, bold=True, anchor="m")
    text(n5, 4.72, y + 0.02, 2.10, 0.37, why, size=7.5, color=GREY, anchor="m")
text(n5, 0.60, 4.88, 6.3, 0.22, "WAVE 2 — AS WAVE 1 DECIDES", size=8, color=RED, bold=True)
text(n5, 0.60, 5.14, 6.3, 1.75,
     [[("T2, T3 ", {"bold": True, "color": NAVY}), ("fee page, after T1 · ", {}),
       ("T4, T6 ", {"bold": True, "color": NAVY}), ("course page, after T5", {})],
      [("T8 ", {"bold": True, "color": NAVY}), ("only once MREI confirms the proof claims", {})],
      [("T10, T11 ", {"bold": True, "color": NAVY}), ("only once blog traffic and scroll tracking are validated", {})],
      [("T13 ", {"bold": True, "color": NAVY}), ("sitewide sticky — runs alone, because it touches every template", {})]],
     size=9, color=GREY, spacing=4)
box(n5, 7.20, 1.68, 5.50, 2.55, fill=NAVY, rounded=True, radius=0.05)
text(n5, 7.45, 1.84, 5.0, 0.22, "DECISION RULES — AGREED BEFORE LAUNCH", size=8, color="FF8095", bold=True)
text(n5, 7.45, 2.14, 5.0, 2.5,
     ["One primary metric, one guardrail and a minimum detectable effect per test, sized from the Phase 0 baseline.",
      "Run at least two full weeks and to the pre-set sample — no peeking.",
      "Scale if the primary metric wins at 95% confidence and the guardrail holds within −5%.",
      "Stop early only on a guardrail breach. A loss is written up as carefully as a win."],
     size=10, color=WHITE, spacing=5)
box(n5, 7.20, 4.43, 5.50, 2.10, fill=AMBER_T, rounded=True, radius=0.06)
text(n5, 7.45, 4.55, 3.2, 0.22, "THE ADMISSIONS CALENDAR", size=8, color=AMBER, bold=True)
chip(n5, "TO VALIDATE", 11.35, 4.54)
text(n5, 7.45, 4.85, 5.0, 1.6,
     ["Agree a freeze window with MREI admissions around results and counselling weeks: reversible changes only.",
      "Never pause campaigns to create a control; split the traffic already arriving.",
      "Every result feeds a pattern library: observe → hypothesise → prioritise → run → decide."],
     size=9.5, color=NAVY, spacing=4)

# N6 — what we would not do
n6 = new_slide("What we would not recommend, and why. This slide is part of the answer: it protects the parts of the site that already work and stops the programme measuring noise.")
header(n6, "BEFORE WE START  ·  WHAT WE WOULD NOT DO",
       "Six things we would deliberately not do",
       "Each one protects something that works, or stops the programme measuring noise",
       "Source: GA4 explorations, 13 Jun – 10 Sept 2026 · GA4 event export by page type · Live site audit and official MREI pages, 24 Sept 2026.")
NOT = [("Gate fees, eligibility or curriculum", "Information stays free. Only the brochure gets an optional, honest exchange — T6 keeps the direct PDF."),
       ("Redesign /mriirs or /mru", "The benchmark: 76.1% engagement and 517 of 613 Apply-MRIIRS clicks. Add to it; don’t replace it."),
       ("Start A/B tests before the lead event exists", "form_submit exceeds form_start on course pages (209 vs 64). We would be measuring noise."),
       ("Optimise the blog before checking its traffic", "32,318 blog-index landings produced 42 90%-scroll events. Validate the source and the tracking first."),
       ("Use unverified claims in any variant", "“95% placement”, “60 LPA”, the NIRF year and the NAAC grade wait for MREI to confirm them."),
       ("Add CTAs or run generic tests", "Four same-intent CTAs already sit in fold 1. No button-colour tests: every test traces to a behaviour.")]
for i, (h, b) in enumerate(NOT):
    x = 0.60 + (i % 3) * 4.10
    y = 1.75 + (i // 3) * 2.60
    box(n6, x, y, 3.90, 2.40, fill=PANEL, rounded=True, radius=0.05)
    b0 = box(n6, x + 0.25, y + 0.25, 0.42, 0.42, fill=RED, rounded=True, radius=0.5)
    text(n6, x + 0.25, y + 0.25, 0.42, 0.42, "✕", size=12, color=WHITE, bold=True, align="c", anchor="m", check=False)
    text(n6, x + 0.25, y + 0.85, 3.4, 0.62, h, size=13, color=NAVY, bold=True)
    text(n6, x + 0.25, y + 1.50, 3.4, 0.80, b, size=9.5, color=GREY)

# ================================================================ 4. ORDER
order = [O(1), n1, O(2), O(3), O(4), O(5), O(6), n2, O(7), O(8), O(9), O(10), O(11), n3, O(12), O(13), O(14)]
order += [O(k) for k in range(17, 60)] + [n4]
order += [O(k) for k in range(60, 81)] + [O(82), O(81), O(83), O(84), O(85), n5, n6, O(86), O(15), O(16), O(87), O(88)]
assert len(order) == len(set(id(s) for s in order)) == len(p.slides), (len(order), len(p.slides))
lst = p.slides._sldIdLst
by_id = {int(el.get("id")): el for el in lst}
want = [s.slide_id for s in order]
for el in list(lst): lst.remove(el)
for sid in want: lst.append(by_id[sid])

p.save(OUT)
print("\n".join(warnings) or "no warnings")
print("slides:", len(p.slides))
