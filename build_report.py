#!/usr/bin/env python3
"""Generate the Manor Lanes / WNY Social courts WiFi + camera install report PDF."""
from fpdf import FPDF

NAVY = (16, 42, 67)
BLUE = (0, 111, 255)
ORANGE = (235, 140, 0)
GREEN = (40, 130, 70)
GREY = (90, 90, 90)
LGREY = (235, 237, 240)
RED = (180, 40, 40)
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)


class Report(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_y(8)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*GREY)
        self.cell(0, 5, "Manor Lanes / WNY Social - Courts WiFi + Camera Installation Report", align="L")
        self.cell(0, 5, "150 Grand Island Blvd", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BLUE)
        self.set_line_width(0.4)
        self.line(10, 15, 206, 15)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GREY)
        self.cell(0, 5, "Prepared for Brian Russo (installer) - Confidential site document", align="L")
        self.cell(0, 5, f"Page {self.page_no()}", align="R")

    def h1(self, txt):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*NAVY)
        self.ln(2)
        self.cell(0, 8, txt, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*ORANGE)
        self.set_line_width(0.6)
        x = self.get_x(); y = self.get_y()
        self.line(x, y, x + 60, y)
        self.ln(3)

    def h2(self, txt):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*BLUE)
        self.ln(1)
        self.cell(0, 6, txt, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*BLACK)

    def body(self, txt):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*BLACK)
        self.multi_cell(0, 5, txt, new_x="LMARGIN", new_y="NEXT")

    def bullet(self, txt, indent=4):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*BLACK)
        x = self.get_x()
        self.set_x(x + indent)
        self.cell(4, 5, "-")
        self.multi_cell(0, 5, txt, new_x="LMARGIN", new_y="NEXT")


def arrow(pdf, x1, y1, x2, y2, color, dashed=False, w=0.5):
    pdf.set_draw_color(*color)
    pdf.set_line_width(w)
    if dashed:
        pdf.set_dash_pattern(dash=1.5, gap=1.2)
    pdf.line(x1, y1, x2, y2)
    if dashed:
        pdf.set_dash_pattern()
    # arrowhead
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    L = 2.6
    for da in (math.radians(160), math.radians(-160)):
        pdf.line(x2, y2, x2 + L * math.cos(ang + da), y2 + L * math.sin(ang + da))


def box(pdf, x, y, w, h, label, fill=LGREY, border=GREY, tcolor=BLACK, fs=8, bold=True):
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*border)
    pdf.set_line_width(0.3)
    pdf.rect(x, y, w, h, style="DF")
    pdf.set_xy(x, y + h / 2 - 2.4)
    pdf.set_font("Helvetica", "B" if bold else "", fs)
    pdf.set_text_color(*tcolor)
    pdf.cell(w, 4.8, label, align="C")


def pole(pdf, x, y, label):
    pdf.set_fill_color(*NAVY)
    pdf.set_draw_color(*NAVY)
    pdf.ellipse(x - 1.6, y - 1.6, 3.2, 3.2, style="DF")
    pdf.set_font("Helvetica", "B", 7)
    pdf.set_text_color(*NAVY)
    pdf.set_xy(x - 18, y + 2)
    pdf.cell(36, 3.5, label, align="C")


def callout(pdf, x, y, w, lines, title, tcolor=NAVY):
    h = 4.2 + len(lines) * 3.6 + 2
    pdf.set_fill_color(*WHITE)
    pdf.set_draw_color(*tcolor)
    pdf.set_line_width(0.3)
    pdf.rect(x, y, w, h, style="DF")
    pdf.set_xy(x + 1.5, y + 1.2)
    pdf.set_font("Helvetica", "B", 7.2)
    pdf.set_text_color(*tcolor)
    pdf.cell(w - 3, 3.4, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 6.8)
    pdf.set_text_color(*BLACK)
    for ln in lines:
        pdf.set_x(x + 1.5)
        pdf.cell(w - 3, 3.5, ln, new_x="LMARGIN", new_y="NEXT")
    return h


pdf = Report(orientation="P", unit="mm", format="Letter")
pdf.set_auto_page_break(auto=True, margin=16)
pdf.set_margins(10, 16, 10)

# ----------------------------------------------------------------------------- COVER
pdf.add_page()
pdf.set_fill_color(*NAVY)
pdf.rect(0, 0, 216, 70, style="F")
pdf.set_xy(12, 18)
pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(*WHITE)
pdf.cell(0, 11, "Outdoor WiFi + Camera Installation", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(12)
pdf.set_font("Helvetica", "B", 14)
pdf.set_text_color(*ORANGE)
pdf.cell(0, 9, "Sand Volleyball Courts - Design & Placement Report", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(12)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(*WHITE)
pdf.cell(0, 7, "Manor Lanes / WNY Social Sports  -  150 Grand Island Blvd", new_x="LMARGIN", new_y="NEXT")

pdf.set_xy(12, 80)
pdf.set_text_color(*BLACK)
pdf.set_font("Helvetica", "", 10)
meta = [
    ("Site", "3 outdoor sand volleyball courts + 2 patios (P1, P2)"),
    ("Platform", "Ubiquiti UniFi (Network + Protect)"),
    ("Installer", "Brian Russo (owner-installer)"),
    ("Controller / NVR", "CloudKey+ (SSD) + Network Video Recorder Pro + 16 TB HDD (existing)"),
    ("Key constraints", "No trenching; no new cable across sand/drainage; cold-weather (Buffalo NY)"),
    ("Backhaul method", "PoE-powered point-to-point wireless bridges (no outdoor cable runs)"),
    ("Net new hardware", "approx. $1,400 - $1,900 (most gear repositioned, not repurchased)"),
]
for k, v in meta:
    pdf.set_font("Helvetica", "B", 10); pdf.set_text_color(*NAVY)
    pdf.cell(38, 7, k)
    pdf.set_font("Helvetica", "", 10); pdf.set_text_color(*BLACK)
    pdf.multi_cell(0, 7, v, new_x="LMARGIN", new_y="NEXT")

pdf.ln(3)
pdf.set_draw_color(*LGREY); pdf.set_line_width(0.4); pdf.line(12, pdf.get_y(), 204, pdf.get_y()); pdf.ln(3)
pdf.set_font("Helvetica", "B", 11); pdf.set_text_color(*BLUE)
pdf.cell(0, 6, "Design summary", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10); pdf.set_text_color(*BLACK)
pdf.multi_cell(0, 5,
    "A PoE-powered wireless bridge on the building beams a wired-equivalent link to a new 20 ft "
    "center pole between Courts 1 and 2 (the distribution hub). A second bridge relays from the "
    "center pole to the Court 3 pole. All cameras, an OPTIONAL action PTZ, and access points run "
    "wired-locally off small switches at each pole. The three existing U6 Mesh Pro APs are "
    "RELOCATED from the concrete building wall (the cause of the failed heat-map test) onto field "
    "poles, where their coverage radiates over the sand. No cable crosses the courts or drainage.",
    new_x="LMARGIN", new_y="NEXT")

# ----------------------------------------------------------------------------- PROBLEM / EXISTING
pdf.add_page()
pdf.h1("1.  Background & Existing Conditions")
pdf.h2("Problem identified")
pdf.bullet("Two U6 Mesh Pro APs were wall-mounted on the concrete back of the building.")
pdf.bullet("Heat-map survey showed strong signal (-30 to -50 dBm) only at the wall; the entire court "
           "surface measured -70 to -80 dBm (marginal-to-unusable), failing under league crowds.")
pdf.bullet("Root cause: omnidirectional APs flat on concrete radiate left/right along the wall and "
           "reflect/absorb into the concrete - signal does not project across the open sand.")
pdf.h2("Fix")
pdf.bullet("Relocate APs off the wall onto field poles so coverage radiates down/out over the courts.")
pdf.bullet("Use directional, aimed, PoE-powered wireless BRIDGES (not omni APs) for backhaul - the "
           "concrete-wall limitation does not apply to a point-to-point link mounted high and aimed.")

pdf.ln(2)
pdf.h2("Existing UniFi equipment to be REUSED (no purchase)")
pdf.set_font("Helvetica", "", 9.5)
with pdf.table(col_widths=(46, 14, 40), text_align=("LEFT", "CENTER", "LEFT"),
               first_row_as_headings=True, line_height=5.5) as t:
    r = t.row(); r.cell("Item"); r.cell("Qty"); r.cell("Role in this project")
    for a, b, c in [
        ("Network Video Recorder Pro + 16 TB HDD", "1", "Records all court cameras"),
        ("CloudKey+ (SSD)", "1", "UniFi Network/Protect controller"),
        ("Switch Pro Max 24 PoE / Pro XG 8 PoE", "2 / 1", "Rack PoE source for building bridge & P2 AP"),
        ("Switch Flex 2.5G PoE + 210W adapter", "1", "CENTER POLE local switch"),
        ("Access Point U6 Mesh Pro", "3", "Relocated to P2, center pole, Court 3"),
        ("AI PTZ Industrial camera (IP66, -40C)", "1", "STAYS on parking lot (not moved)"),
        ("PoE++ 60W injector (spare)", "1", "Backup power for action PTZ if fitted"),
        ("Spare G6 / G5 PTZ (if available)", "?", "Optional action cam - check fleet for a spare"),
        ("Camera G6 180", "1", "STAYS on parking lot (do NOT use for courts)"),
    ]:
        row = t.row(); row.cell(a); row.cell(b); row.cell(c)

pdf.ln(2)
pdf.h2("Confirmed site facts")
pdf.bullet("Center pole: new 20 ft pole (2 lights) between Court 1 and Court 2 - POWER PRESENT.")
pdf.bullet("Court 3 pole: 20 ft light pole - POWER PRESENT.")
pdf.bullet("P2 patio post: existing Cat6 pulled to it, but NO power (AP here is PoE-fed from rack).")
pdf.bullet("Rack is inside the building, ~130 ft from the center-pole location.")
pdf.bullet("Courts each ~29'6\" x 59'1\" (approx 30 x 60 ft); perimeter light poles ~20 ft.")

# ----------------------------------------------------------------------------- SITE LAYOUT DIAGRAM
pdf.add_page()
pdf.h1("2.  Site Layout & Device Placement")
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.cell(0, 5, "Schematic - relative positions per site photos/CAD; not to exact scale. "
               "Solid = wired (PoE). Dashed = wireless bridge.", new_x="LMARGIN", new_y="NEXT")
pdf.set_text_color(*BLACK)

# diagram frame
fx, fy, fw, fh = 10, pdf.get_y() + 2, 196, 188
pdf.set_draw_color(*LGREY); pdf.set_line_width(0.3); pdf.rect(fx, fy, fw, fh)

# BUILDING (top)
box(pdf, fx + 6, fy + 6, fw - 12, 18, "", fill=(225, 232, 244), border=NAVY)
pdf.set_xy(fx + 8, fy + 8); pdf.set_font("Helvetica", "B", 9); pdf.set_text_color(*NAVY)
pdf.cell(0, 4, "BUILDING  -  Equipment Room / Rack", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 8); pdf.set_font("Helvetica", "", 7); pdf.set_text_color(*BLACK)
pdf.cell(0, 3.4, "CloudKey+  |  NVR Pro + 16 TB  |  Switch Pro Max 24 PoE  |  Pro XG 8 PoE", new_x="LMARGIN", new_y="NEXT")
# Link A bridge on roofline
box(pdf, fx + fw - 64, fy + 26, 56, 7, "Link A Bridge (roofline mast, PoE)", fill=ORANGE, border=ORANGE, tcolor=WHITE, fs=6.6)

# P1 patio
box(pdf, fx + 6, fy + 36, 70, 8, "P1 PATIO (by building)", fill=(225, 244, 230), border=GREEN, tcolor=GREEN, fs=7.5)

# Parking lot (right)
box(pdf, fx + 120, fy + 36, fw - 126, 30, "", fill=(238, 238, 238), border=GREY)
pdf.set_xy(fx + 122, fy + 38); pdf.set_font("Helvetica", "B", 7.5); pdf.set_text_color(*GREY)
pdf.cell(0, 4, "PARKING LOT", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 122); pdf.set_font("Helvetica", "", 6.6); pdf.set_text_color(*BLACK)
pdf.cell(0, 3.3, "G6 180 (existing -", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 122); pdf.cell(0, 3.3, "stays, do not move)", new_x="LMARGIN", new_y="NEXT")

# Court 1
box(pdf, fx + 40, fy + 52, 70, 40, "COURT 1 (C1)", fill=(247, 238, 214), border=(180, 150, 80), tcolor=(120, 90, 20), fs=10)
# Center pole between C1 and C2
cpx, cpy = fx + 35, fy + 98
pole(pdf, cpx, cpy, "")
# Court 2
box(pdf, fx + 56, fy + 108, 54, 56, "COURT 2 (C2)", fill=(247, 238, 214), border=(180, 150, 80), tcolor=(120, 90, 20), fs=10)
# Court 3 (left of C2)
box(pdf, fx + 14, fy + 108, 38, 56, "COURT 3", fill=(247, 238, 214), border=(180, 150, 80), tcolor=(120, 90, 20), fs=9)
c3x, c3y = fx + 33, fy + 112
pole(pdf, c3x, c3y, "")
# P2 patio (right)
box(pdf, fx + 120, fy + 70, fw - 126, 94, "", fill=(225, 244, 230), border=GREEN)
pdf.set_xy(fx + 122, fy + 72); pdf.set_font("Helvetica", "B", 8); pdf.set_text_color(*GREEN)
pdf.cell(0, 4, "P2 PATIO (new)", new_x="LMARGIN", new_y="NEXT")

# wireless links
arrow(pdf, fx + fw - 36, fy + 33, cpx + 1, cpy - 2, ORANGE, dashed=True, w=0.6)
arrow(pdf, cpx - 1, cpy + 1, c3x + 1, c3y - 1, ORANGE, dashed=True, w=0.6)
# wired existing cable building -> P2 AP
arrow(pdf, fx + fw - 24, fy + 24, fx + 150, fy + 80, BLUE, dashed=False, w=0.6)

# callouts
callout(pdf, fx + 44, fy + 96, 60,
        ["Link A RX  +  Link B TX (relay)",
         "Switch Flex 2.5G PoE (reuse)",
         "G6 Bullet -> aim C1",
         "G6 Bullet -> aim C2",
         "Action PTZ (optional)",
         "U6 Mesh Pro #2"],
        "CENTER POLE HUB")
callout(pdf, fx + 8, fy + 132, 42,
        ["Link B RX", "Small PoE switch", "G6 Bullet -> court", "U6 Mesh Pro #3"],
        "COURT 3 POLE", tcolor=NAVY)
callout(pdf, fx + 150, fy + 86, 50,
        ["U6 Mesh Pro #1", "PoE from rack over the", "EXISTING P2 cable", "(no local power needed)"],
        "P2 ANCHOR", tcolor=BLUE)

# legend
ly = fy + fh - 10
pdf.set_draw_color(*ORANGE); pdf.set_line_width(0.6); pdf.set_dash_pattern(dash=1.5, gap=1.2)
pdf.line(fx + 6, ly, fx + 18, ly); pdf.set_dash_pattern()
pdf.set_xy(fx + 20, ly - 2); pdf.set_font("Helvetica", "", 7); pdf.set_text_color(*BLACK)
pdf.cell(40, 4, "Wireless bridge link")
pdf.set_draw_color(*BLUE); pdf.line(fx + 70, ly, fx + 82, ly)
pdf.set_xy(fx + 84, ly - 2); pdf.cell(40, 4, "Wired (PoE) over existing cable")
pdf.set_fill_color(*NAVY); pdf.ellipse(fx + 140, ly - 1.4, 3, 3, style="DF")
pdf.set_xy(fx + 145, ly - 2); pdf.cell(30, 4, "Light pole (mount point)")

pdf.set_y(fy + fh + 3)
pdf.set_font("Helvetica", "I", 8); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4, "Orientation per owner: building at top with rack; P1 patio adjacent to building; "
               "Court 1 nearer building, Court 2 further; Court 3 to the left behind Court 2; "
               "P2 (new patio) along the right with the existing pulled cable.", new_x="LMARGIN", new_y="NEXT")

# ----------------------------------------------------------------------------- TOPOLOGY
pdf.add_page()
pdf.h1("3.  Network Topology & Wireless Links")
ty = pdf.get_y() + 2
box(pdf, 70, ty, 76, 16, "", fill=(225, 232, 244), border=NAVY)
pdf.set_xy(70, ty + 2); pdf.set_font("Helvetica", "B", 8.5); pdf.set_text_color(*NAVY)
pdf.cell(76, 4, "RACK (building)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(70); pdf.set_font("Helvetica", "", 7); pdf.set_text_color(*BLACK)
pdf.cell(76, 3.5, "CloudKey+ - NVR Pro - Pro Max 24 PoE", align="C")

box(pdf, 150, ty + 1, 52, 13, "", fill=(225, 244, 230), border=GREEN, tcolor=GREEN, fs=6.8)
pdf.set_xy(150, ty + 2.5); pdf.set_font("Helvetica", "B", 6.8); pdf.set_text_color(*GREEN)
pdf.multi_cell(52, 3.4, "P2 POST: U6 Mesh Pro #1\nPoE over existing cable", align="C")
arrow(pdf, 146, ty + 8, 150, ty + 8, BLUE, w=0.6)

box(pdf, 8, ty + 1, 56, 13, "", fill=ORANGE, border=ORANGE, tcolor=WHITE, fs=6.8)
pdf.set_xy(8, ty + 2.5); pdf.set_font("Helvetica", "B", 6.8); pdf.set_text_color(*WHITE)
pdf.multi_cell(56, 3.4, "BUILDING ROOFLINE:\nLink A Bridge (PoE from rack)", align="C")
arrow(pdf, 70, ty + 8, 64, ty + 8, BLUE, w=0.6)

# down to center pole
cy = ty + 40
box(pdf, 56, cy, 104, 30, "", fill=WHITE, border=NAVY)
pdf.set_xy(58, cy + 1.5); pdf.set_font("Helvetica", "B", 9); pdf.set_text_color(*NAVY)
pdf.cell(100, 4.5, "CENTER POLE HUB  (20 ft, power present)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(58); pdf.set_font("Helvetica", "", 7.4); pdf.set_text_color(*BLACK)
for s in ["Link A RX  +  Link B TX (relay)    |    Switch Flex 2.5G PoE (reuse)",
          "G6 Bullet (C1)  -  G6 Bullet (C2)  -  Action PTZ (optional)  -  U6 Mesh Pro #2"]:
    pdf.set_x(58); pdf.cell(100, 4, s, align="C", new_x="LMARGIN", new_y="NEXT")
arrow(pdf, 36, ty + 14, 100, cy, ORANGE, dashed=True, w=0.7)
pdf.set_xy(38, ty + 24); pdf.set_font("Helvetica", "B", 7); pdf.set_text_color(*ORANGE)
pdf.cell(40, 4, "Link A (wireless)")

# down to court 3
c3y2 = cy + 44
box(pdf, 56, c3y2, 104, 22, "", fill=WHITE, border=NAVY)
pdf.set_xy(58, c3y2 + 1.5); pdf.set_font("Helvetica", "B", 9); pdf.set_text_color(*NAVY)
pdf.cell(100, 4.5, "COURT 3 POLE  (20 ft, power present)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(58); pdf.set_font("Helvetica", "", 7.4); pdf.set_text_color(*BLACK)
pdf.set_x(58); pdf.cell(100, 4, "Link B RX  -  small PoE switch  -  G6 Bullet  -  U6 Mesh Pro #3", align="C")
arrow(pdf, 108, cy + 30, 108, c3y2, ORANGE, dashed=True, w=0.7)
pdf.set_xy(110, cy + 33); pdf.set_font("Helvetica", "B", 7); pdf.set_text_color(*ORANGE)
pdf.cell(40, 4, "Link B (wireless relay)")

pdf.set_y(c3y2 + 28)
pdf.h2("Wireless bridge details")
pdf.bullet("Link A: building roofline -> center pole. Short (~130 ft), clear line-of-sight over courts.")
pdf.bullet("Link B: center pole -> Court 3 pole (relay). Court 3 sits behind Court 2 - no clean LoS "
           "from the building, so it relays through the elevated center pole.")
pdf.bullet("Hardware options: UniFi Building Bridge (UBB, 60 GHz, plug-and-play) OR 5 GHz airMAX "
           "(LiteBeam/NanoStation) for maximum winter margin. Either handles the load with ease.")
pdf.bullet("Throughput needed per link: ~50-80 Mbps (3x 4K cameras + AP clients). UBB delivers 1+ Gbps; "
           "airMAX 5 GHz delivers 300-450 Mbps. Large headroom.")
pdf.bullet("All bridge radios are POWERED OVER ETHERNET - no AC outlet needed at any bridge end.")
pdf.bullet("Mount the building bridge on a short mast ABOVE the concrete wall/parapet so the lip does "
           "not block the beam; aim at the center-pole radio.")

# ----------------------------------------------------------------------------- DEVICE PLACEMENT TABLE
pdf.add_page()
pdf.h1("4.  Device-by-Device Placement & Mounting")
pdf.set_font("Helvetica", "", 8.5)
with pdf.table(col_widths=(22, 30, 40, 26, 34),
               text_align="LEFT", first_row_as_headings=True, line_height=4.6) as t:
    hdr = t.row()
    for c in ["Location", "Device", "Placement / Aim", "Height", "Power & Data"]:
        hdr.cell(c)
    rows = [
        ("Building roofline", "Link A Bridge (UBB/airMAX)", "Short mast above parapet; aim at center pole", "Roofline", "PoE from rack switch"),
        ("P2 patio post", "U6 Mesh Pro #1", "Top of post; radiate over P2 + east side", "~12-15 ft", "PoE from rack over EXISTING cable"),
        ("Center pole", "Link A Bridge RX", "Aim back at building roofline", "~18-20 ft", "PoE from Flex 2.5G switch"),
        ("Center pole", "Link B Bridge TX", "Aim at Court 3 pole", "~18-20 ft", "PoE from Flex 2.5G switch"),
        ("Center pole", "Switch Flex 2.5G PoE (reuse)", "In NEMA enclosure on pole", "~6 ft (reach)", "AC from pole light circuit + 210W adapter"),
        ("Center pole", "G6 Bullet (Court 1)", "Aim down length of Court 1", "~18-20 ft", "PoE from Flex switch"),
        ("Center pole", "G6 Bullet (Court 2)", "Aim down length of Court 2", "~18-20 ft", "PoE from Flex switch"),
        ("Center pole", "Action PTZ (OPTIONAL, special games)", "Roaming/zoom over C1+C2; see BOM choices", "~18-20 ft", "PoE / PoE++ from Flex switch"),
        ("Center pole", "U6 Mesh Pro #2", "Radiate over C1/C2; reaches P1", "~15-18 ft", "PoE from Flex switch"),
        ("Court 3 pole", "Link B Bridge RX", "Aim at center pole", "~18-20 ft", "PoE from Court 3 switch"),
        ("Court 3 pole", "Small PoE switch", "In NEMA enclosure on pole", "~6 ft (reach)", "AC from pole light circuit"),
        ("Court 3 pole", "G6 Bullet (Court 3)", "Aim down length of Court 3", "~18-20 ft", "PoE from Court 3 switch"),
        ("Court 3 pole", "U6 Mesh Pro #3", "Radiate over Court 3", "~15-18 ft", "PoE from Court 3 switch"),
        ("Parking lot (existing)", "G6 180", "No change - keep on lot", "existing", "existing"),
        ("Parking lot (existing)", "AI PTZ Industrial", "No change - STAYS on lot (not moved)", "existing", "existing"),
    ]
    for r in rows:
        row = t.row()
        for c in r:
            row.cell(c)

pdf.ln(2)
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4, "Camera aiming: mount each bullet at one END of its court and aim down the 60 ft "
    "length for full-court coverage and best pixel density. An OPTIONAL action PTZ on the center pole "
    "provides zoom/follow for special games only (operated on demand). Do not use the G6 180 for court "
    "detail. The AI PTZ Industrial remains on the parking lot.", new_x="LMARGIN", new_y="NEXT")

# ----------------------------------------------------------------------------- BOM
pdf.add_page()
pdf.h1("5.  Bill of Materials")
pdf.h2("New hardware to purchase")
pdf.set_font("Helvetica", "", 9)
with pdf.table(col_widths=(70, 16, 28, 28), text_align=("LEFT","CENTER","RIGHT","RIGHT"),
               first_row_as_headings=True, line_height=5.4) as t:
    hdr = t.row()
    for c in ["Item", "Qty", "Unit (approx)", "Line (approx)"]:
        hdr.cell(c)
    bom = [
        ("Wireless bridge link (UBB pair, or airMAX pair)", "2", "$200-360", "$400-720"),
        ("UniFi Protect G6 Bullet (4K, IP66)", "3", "$199", "$597"),
        ("Small PoE switch - Court 3 (Flex Mini / Flex)", "1", "$30-65", "$30-65"),
        ("Outdoor NEMA enclosure (center pole + Court 3)", "2", "$79", "$158"),
        ("Ethernet surge protector (ETH-SP)", "4", "$25", "$100"),
        ("Building bridge mast + pole mounts + patch cables", "1 lot", "~$120", "~$120"),
    ]
    for r in bom:
        row = t.row()
        for c in r:
            row.cell(c)
pdf.ln(1)
pdf.set_font("Helvetica", "B", 10); pdf.set_text_color(*NAVY)
pdf.cell(0, 6, "Estimated net new spend (excl. action cam):  approx. $1,400 - $1,900", new_x="LMARGIN", new_y="NEXT")

pdf.ln(2)
pdf.h2("Action camera for special games - CHOOSE ONE (optional)")
pdf.set_font("Helvetica", "", 9.5); pdf.set_text_color(*BLACK)
pdf.bullet("Repurpose a SPARE owned PTZ (G6/G5 PTZ from existing fleet) - $0 (preferred if available).")
pdf.bullet("Buy a new UniFi G6 PTZ (4K, optical zoom; UniFi Protect native) - approx. $1,599.")
pdf.bullet("Portable streaming cam (Mevo Start / GoPro on tripod) for highlights/livestream - approx. "
           "$300-500 (not UniFi-integrated; deployed only for special games).")
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4, "Mounts on the center pole and operated on demand only; otherwise idle. The "
    "center-pole switch/PoE is provisioned for it either way.", new_x="LMARGIN", new_y="NEXT")

pdf.ln(2)
pdf.h2("Reused (already owned - $0)")
pdf.set_font("Helvetica", "", 9.5); pdf.set_text_color(*BLACK)
for s in ["3x U6 Mesh Pro APs - relocated off building wall to poles",
          "Switch Flex 2.5G PoE + 210W adapter - center-pole local switch",
          "Network Video Recorder Pro + 16 TB HDD - recording",
          "AI PTZ Industrial - stays on parking lot (not moved)",
          "Spare PoE++ 60W injector, SFP-to-RJ45 adapters, DAC cables"]:
    pdf.bullet(s)

pdf.ln(2)
pdf.h2("Consumables / verify on hand")
for s in ["Outdoor/UV-rated or direct-burial shielded Cat6 (short patch runs at each pole)",
          "Stainless pole-mount brackets / band clamps sized for 20 ft round poles",
          "Weatherproof cable glands, UV zip ties, drip loops, silicone/dielectric grease",
          "RJ45 outdoor connectors + tester"]:
    pdf.bullet(s)

# ----------------------------------------------------------------------------- INSTALL / CONFIG
pdf.add_page()
pdf.h1("6.  Installation & Configuration")
pdf.h2("Physical install sequence")
steps = [
    "Mount Link A bridge on building roofline (above parapet); run PoE patch to a rack switch port.",
    "Mount the NEMA enclosure on the center pole; install the Flex 2.5G PoE switch + 210W adapter; "
    "have an electrician land pole-light-circuit power to the enclosure (no trenching - power is at pole).",
    "Mount center-pole devices: Link A RX, Link B TX, 2x G6 Bullet, action PTZ (if fitted), U6 Mesh Pro #2. "
    "Patch all to the Flex switch.",
    "Mount Court 3 enclosure + small PoE switch; land pole power; mount Link B RX, G6 Bullet, U6 Mesh Pro #3.",
    "Relocate the U6 Mesh Pro from the building wall to the P2 post; feed via the existing pulled cable "
    "(land it on a rack PoE port).",
    "Install ETH-SP surge protectors at each outdoor cable end (bridge feeds and switch uplinks).",
    "Aim both bridge links; aim cameras down each court; tilt APs slightly down toward the sand.",
]
pdf.set_font("Helvetica", "", 10)
for i, s in enumerate(steps, 1):
    x = pdf.get_x(); pdf.set_x(x + 2)
    pdf.set_font("Helvetica", "B", 10); pdf.cell(6, 5, f"{i}.")
    pdf.set_font("Helvetica", "", 10); pdf.multi_cell(0, 5, s, new_x="LMARGIN", new_y="NEXT")

pdf.ln(1)
pdf.h2("UniFi configuration")
pdf.bullet("Adopt both bridge radios; set as transparent L2 bridge (UBB is automatic; airMAX = bridge mode).")
pdf.bullet("Adopt the relocated APs; build one outdoor WLAN; enable band steering. Set fixed, "
           "non-overlapping channels (5 GHz) across the 3 APs to avoid co-channel interference.")
pdf.bullet("Reduce AP TX power from Auto/High to Medium once placed on poles - prevents the APs from "
           "over-talking each other in the open field; verify with a follow-up heat map.")
pdf.bullet("Adopt cameras in UniFi Protect; confirm they record to the NVR Pro; set motion/AI zones "
           "to the court areas; create PTZ presets for Court 1 and Court 2.")
pdf.bullet("If an action PTZ is fitted: high-end PTZs draw PoE++ - land it on a PoE++ capable port of "
           "the Flex switch (210W budget) or inline the spare 60W PoE++ injector.")

pdf.ln(1)
pdf.h2("PoE budget - center pole Flex 2.5G PoE switch")
pdf.set_font("Helvetica", "", 9)
with pdf.table(col_widths=(120, 40), text_align=("LEFT","RIGHT"), first_row_as_headings=True, line_height=5.2) as t:
    hr = t.row(); hr.cell("Load on center-pole switch"); hr.cell("Approx draw")
    for a, b in [("2x G6 Bullet", "~14 W"), ("Action PTZ if fitted (PoE/PoE++)", "~10-45 W"),
                 ("U6 Mesh Pro #2", "~13 W"), ("Link A RX + Link B TX bridges", "~14 W"),
                 ("TOTAL (plan for headroom)", "~55-90 W")]:
        r = t.row(); r.cell(a); r.cell(b)
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4, "The 210W adapter provides ample budget; just confirm the PTZ lands on a PoE++ port.", new_x="LMARGIN", new_y="NEXT")

# ----------------------------------------------------------------------------- COMMISSIONING
pdf.add_page()
pdf.h1("7.  Commissioning & Acceptance Checklist")

def check(txt, sub=False):
    pdf.set_font("Helvetica", "", 9.8); pdf.set_text_color(*BLACK)
    x = pdf.get_x(); pdf.set_x(x + (10 if sub else 3))
    pdf.set_draw_color(*GREY); pdf.set_line_width(0.3)
    yy = pdf.get_y(); pdf.rect(pdf.get_x(), yy + 0.6, 3.6, 3.6)
    pdf.set_x(pdf.get_x() + 6)
    pdf.multi_cell(0, 5, txt, new_x="LMARGIN", new_y="NEXT")

pdf.h2("Wireless backhaul")
check("Link A connected; UniFi shows link rate and signal (target RSSI better than -60 dBm).")
check("Link B connected; Court 3 devices online through the relay.")
check("Failover sanity: unplug/replug - links auto-recover.")
pdf.h2("WiFi coverage (re-survey)")
check("Re-run the WiFiman heat map walking all 3 courts + both patios.")
check("Court surface now reads -55 dBm or better (was -70 to -80).")
check("No dead pocket on P1 by the building (add/keep an AP there if weak - wired drops exist).")
check("Roaming: a phone walks court-to-court without dropping.")
pdf.h2("Cameras (UniFi Protect)")
check("All 3 fixed court bullets (+ action PTZ if fitted) online and recording to NVR Pro.")
check("Each bullet frames its full court end-to-end; if PTZ fitted, presets for C1/C2 saved.")
check("Night check: image usable under the Musco court lights.")
check("Retention check: 16 TB HDD holds target days with the added cameras (add HDD if short).")
pdf.h2("Power & weatherproofing")
check("Enclosures sealed; cable glands tight; drip loops on all outdoor cables.")
check("ETH-SP surge protectors grounded at each outdoor run.")
check("PTZ confirmed on PoE++; no under-power warnings in UniFi.")

pdf.ln(4)
pdf.set_draw_color(*LGREY); pdf.set_line_width(0.4); pdf.line(10, pdf.get_y(), 204, pdf.get_y()); pdf.ln(3)
pdf.set_font("Helvetica", "B", 10); pdf.set_text_color(*NAVY)
pdf.cell(0, 6, "Sign-off", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10); pdf.set_text_color(*BLACK)
pdf.ln(6); pdf.cell(95, 6, "Installer: ______________________________"); pdf.cell(0, 6, "Date: ________________", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6); pdf.cell(95, 6, "Notes: __________________________________________________________________", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4); pdf.cell(0, 6, "________________________________________________________________________________", new_x="LMARGIN", new_y="NEXT")

out = "/home/user/Email/Manor-Lanes-Courts-Install-Report.pdf"
pdf.output(out)
print("WROTE", out)
