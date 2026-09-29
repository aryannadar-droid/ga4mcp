"""One-slide impact x effort matrix for the 10 persona A/B tests (13.33 x 7.5, Sora, deck palette)."""
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE_DASH_STYLE

OUT = sys.argv[1]
NAVY, RED, GREY, LIGHT = "0F2C5C", "C8102E", "5A6472", "96A1B0"
PANEL, TINT, LINE, WHITE = "F4F6FA", "E8EEF7", "D8DFE8", "FFFFFF"
GREEN, GREEN_T, AMBER, AMBER_T, RED_T = "1E7B34", "E5F1EA", "B26B00", "FFF3DC", "FBE7EA"
FONT = "Sora"

p = Presentation()
p.slide_width, p.slide_height = Inches(13.333), Inches(7.5)
s = p.slides.add_slide(p.slide_layouts[6])
s.background.fill.solid(); s.background.fill.fore_color.rgb = RGBColor.from_string(WHITE)

def rgb(h): return RGBColor.from_string(h)

def shape(kind, x, y, w, h, fill=None, line=None, r=None):
    b = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if r is not None: b.adjustments[0] = r
    if fill: b.fill.solid(); b.fill.fore_color.rgb = rgb(fill)
    else: b.fill.background()
    if line: b.line.color.rgb = rgb(line); b.line.width = Pt(1)
    else: b.line.fill.background()
    b.shadow.inherit = False
    return b

def text(x, y, w, h, paras, size=9, color=NAVY, bold=False, align="l", anchor="t", italic=False, sp=0, rot=0):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    for i, para in enumerate(paras if isinstance(paras, list) else [paras]):
        pp = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        pp.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        if sp: pp.space_after = Pt(sp)
        for seg, o in (para if isinstance(para, list) else [(para, {})]):
            r = pp.add_run(); r.text = seg
            f = r.font; f.name = FONT; f.size = Pt(o.get("size", size)); f.bold = o.get("bold", bold)
            f.italic = o.get("italic", italic); f.color.rgb = rgb(o.get("color", color))
    if rot: tb.rotation = rot
    return tb

# ---------------------------------------------------------------- header
text(0.60, 0.32, 9.0, 0.20, "EXPERIMENTATION  ·  IMPACT × EFFORT", size=9, color=RED, bold=True)
b = shape(MSO_SHAPE.ROUNDED_RECTANGLE, 12.73 - 0.94, 0.30, 0.94, 0.22, fill=TINT, line=NAVY, r=0.5)
b.line.width = Pt(0.5)
tf = b.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
tf.vertical_anchor = MSO_ANCHOR.MIDDLE
pp = tf.paragraphs[0]; pp.alignment = PP_ALIGN.CENTER
r = pp.add_run(); r.text = "HYPOTHESIS"; r.font.name = FONT; r.font.size = Pt(6.5); r.font.bold = True; r.font.color.rgb = rgb(NAVY)
text(0.60, 0.55, 12.10, 0.60, "Ten tests, one map: start where impact is high and effort is low", size=24, color=NAVY, bold=True)
text(0.60, 1.17, 12.10, 0.30, "Two tests per persona, placed by expected lead impact and the effort to launch them — including data MREI has to supply", size=12, color=GREY)

# ---------------------------------------------------------------- plot
X0, Y0, W, H = 1.05, 1.72, 7.55, 5.05          # plot box
EMID, IMID = 5.0, 5.5                          # quadrant split (effort, impact on 0–10)
def px(e): return X0 + e / 10 * W
def py(i): return Y0 + H - i / 10 * H
xm, ym = px(EMID), py(IMID)
quads = [(X0, Y0, xm - X0, ym - Y0, GREEN_T, "QUICK WINS", "Launch first", GREEN, "l"),
         (xm, Y0, X0 + W - xm, ym - Y0, TINT, "BIG BETS", "Plan and resource", NAVY, "r"),
         (X0, ym, xm - X0, Y0 + H - ym, PANEL, "FILL-INS", "Ship when a slot frees up", GREY, "l"),
         (xm, ym, X0 + W - xm, Y0 + H - ym, RED_T, "DEPRIORITISE", "Revisit after wave 1", RED, "r")]
for x, y, w, h, fill, lab, sub, col, al in quads:
    shape(MSO_SHAPE.RECTANGLE, x, y, w, h, fill=fill)
    top = y + 0.1 if lab in ("QUICK WINS", "BIG BETS") else y + h - 0.46
    text(x + 0.14, top, w - 0.28, 0.2, lab, size=9, color=col, bold=True, align=al)
    text(x + 0.14, top + 0.2, w - 0.28, 0.2, sub, size=7.5, color=GREY, align=al)
# axes
text(X0, Y0 + H + 0.08, W, 0.2, [[("Low effort", {}), ("   EFFORT TO LAUNCH →   ", {"bold": True, "color": NAVY}), ("High effort", {})]],
     size=7.5, color=GREY, align="c")
text(X0 - 2.85, Y0 + H / 2 - 0.1, 5.05, 0.2, [[("Low", {}), ("   EXPECTED LEAD IMPACT →   ", {"bold": True, "color": NAVY}), ("High", {})]],
     size=7.5, color=GREY, align="c", rot=270)

# persona colours
PC = {"Course Researcher": RED, "Cost Checker": NAVY, "Early Explorer": AMBER,
      "Proof Seeker": GREEN, "University Shortlister": "4A6FA5"}
# id, persona, short name, effort, impact  (0–10)
T = [("CR-1", "Course Researcher", "Fee summary at decision height", 4.3, 9.2),
     ("CR-2", "Course Researcher", "Brochure + WhatsApp, no gate", 1.6, 6.6),
     ("CC-1", "Cost Checker", "Fee finder card", 7.2, 8.5),
     ("CC-2", "Cost Checker", "Call + callback under the fee", 3.0, 7.3),
     ("EE-1", "Early Explorer", "Programme card in article", 3.0, 5.0),
     ("EE-2", "Early Explorer", "“Help me choose” quiz", 6.8, 4.2),
     ("PS-1", "Proof Seeker", "Award → programme links", 1.5, 3.8),
     ("PS-2", "Proof Seeker", "Dated CSE placement proof", 7.6, 6.9),
     ("US-1", "University Shortlister", "Compare MRIIRS & MRU", 6.5, 6.0),
     ("US-2", "University Shortlister", "Talk-to-someone routes", 5.2, 6.9)]
D = 0.46
for tid, per, name, e, i in T:
    cx, cy = px(e), py(i)
    c = shape(MSO_SHAPE.OVAL, cx - D / 2, cy - D / 2, D, D, fill=PC[per], line=WHITE)
    c.line.width = Pt(1.5)
    text(cx - D / 2, cy - D / 2, D, D, tid, size=7.5, color=WHITE, bold=True, align="c", anchor="m")
    text(cx - 0.62, cy + D / 2 + 0.02, 1.24, 0.3, name, size=6.5, color=NAVY, align="c")

# legend
lx = X0
for per, col in PC.items():
    shape(MSO_SHAPE.OVAL, lx, 7.10, 0.13, 0.13, fill=col)
    w = 0.25 + 0.062 * len(per)
    text(lx + 0.19, 7.07, w, 0.2, per, size=7, color=GREY, anchor="m")
    lx += w + 0.3

# ---------------------------------------------------------------- right panel
RX, RW = 8.95, 3.78
shape(MSO_SHAPE.ROUNDED_RECTANGLE, RX, 1.72, RW, 2.02, fill=NAVY, r=0.04)
text(RX + 0.22, 1.86, RW - 0.44, 0.2, "WHAT THE MAP SAYS", size=8, color="FF8095", bold=True)
text(RX + 0.22, 2.12, RW - 0.44, 1.55,
     [[("Quick wins: ", {"bold": True, "color": WHITE}), ("CR-1, CC-2, CR-2 — the fee and the brochure moments, on the two highest-traffic prospect pages.", {})],
      [("Big bets: ", {"bold": True, "color": WHITE}), ("CC-1, PS-2, US-1, US-2 — high value, but new components, ops or MREI data.", {})],
      [("Fill-ins: ", {"bold": True, "color": WHITE}), ("EE-1, PS-1 — cheap; EE-1 waits for the blog traffic check.", {})],
      [("Deprioritise: ", {"bold": True, "color": WHITE}), ("EE-2 until EE-1 shows blog readers move.", {})]],
     size=8.5, color="D8DFE8", sp=4)
shape(MSO_SHAPE.ROUNDED_RECTANGLE, RX, 3.90, RW, 1.40, fill=PANEL, r=0.04)
text(RX + 0.22, 4.03, RW - 0.44, 0.2, "HOW WE SCORED", size=8, color=RED, bold=True)
text(RX + 0.22, 4.29, RW - 0.44, 1.3,
     [[("Impact  ", {"bold": True}), ("sessions at that page × how close the intent is to a lead × strength of evidence (e.g. 84.3% round-trip, 82 calls vs 31 submits).", {})],
      [("Effort  ", {"bold": True}), ("build size (content → new component) + data MREI must supply + ops such as callbacks and visit slots.", {})]],
     size=8, color=NAVY, sp=4)
shape(MSO_SHAPE.ROUNDED_RECTANGLE, RX, 5.46, RW, 1.31, fill=AMBER_T, r=0.06)
text(RX + 0.22, 5.56, RW - 0.44, 1.15,
     [[("LAUNCH ORDER  ", {"bold": True, "color": AMBER}),
       ("Wave 1: CR-1 · CC-1 · PS-1 · US-1 · EE-1 (after the blog check). Wave 2: CR-2 · CC-2 · US-2 · EE-2 · PS-2 (after MREI data).", {})],
      [("CC-1 is a big bet but goes first: CC-2’s call block sits under its fee card.", {"color": GREY})]],
     size=8, color=NAVY, sp=4)
text(8.95, 7.07, 3.78, 0.3, "Relative scores, not forecasts. Re-score once Phase 0 gives a lead baseline. Sources: MREI CRO deck; MRIIRS pitch v4.",
     size=6.5, color=LIGHT)

s.notes_slide.notes_text_frame.text = (
    "Impact x effort map for the ten persona tests. Scores are relative judgements on a 0–10 scale, labelled HYPOTHESIS. "
    "Impact = sessions at that journey point x intent value x evidence strength. Effort = build size + data MREI must supply + operational set-up. "
    "Scores (effort, impact): CR-1 4.3/9.2 · CR-2 1.6/6.6 · CC-1 7.2/8.5 · CC-2 3.0/7.3 · EE-1 3.0/5.0 · EE-2 6.8/4.2 · "
    "PS-1 1.5/3.8 · PS-2 7.6/6.9 · US-1 6.5/6.0 · US-2 5.2/6.9. Re-score after Phase 0 gives a lead baseline.")
p.save(OUT)
print("ok")
