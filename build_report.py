#!/usr/bin/env python3
"""Manor Lanes / WNY Social - courts WiFi + camera install report (UDB-Switch architecture)."""
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
    import math
    pdf.set_draw_color(*color)
    pdf.set_line_width(w)
    if dashed:
        pdf.set_dash_pattern(dash=1.5, gap=1.2)
    pdf.line(x1, y1, x2, y2)
    if dashed:
        pdf.set_dash_pattern()
    ang = math.atan2(y2 - y1, x2 - x1)
    L = 2.6
    for da in (math.radians(160), math.radians(-160)):
        pdf.line(x2, y2, x2 + L * math.cos(ang + da), y2 + L * math.sin(ang + da))


def box(pdf, x, y, w, h, label, fill=LGREY, border=GREY, tcolor=BLACK, fs=8, bold=True):
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*border)
    pdf.set_line_width(0.3)
    pdf.rect(x, y, w, h, style="DF")
    if label:
        pdf.set_xy(x, y + h / 2 - 2.4)
        pdf.set_font("Helvetica", "B" if bold else "", fs)
        pdf.set_text_color(*tcolor)
        pdf.cell(w, 4.8, label, align="C")


def pole(pdf, x, y, label):
    pdf.set_fill_color(*NAVY)
    pdf.set_draw_color(*NAVY)
    pdf.ellipse(x - 1.6, y - 1.6, 3.2, 3.2, style="DF")
    if label:
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

# --------------------------------------------------------------------------- COVER
pdf.add_page()
pdf.set_fill_color(*NAVY)
pdf.rect(0, 0, 216, 70, style="F")
pdf.set_xy(12, 16)
pdf.set_font("Helvetica", "B", 23)
pdf.set_text_color(*WHITE)
pdf.cell(0, 11, "Outdoor WiFi + Camera Installation", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(12)
pdf.set_font("Helvetica", "B", 13)
pdf.set_text_color(*ORANGE)
pdf.cell(0, 9, "Sand Volleyball Courts - Design & Placement Report", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(12)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(*WHITE)
pdf.cell(0, 7, "Manor Lanes / WNY Social Sports  -  150 Grand Island Blvd", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(12)
pdf.set_font("Helvetica", "I", 9)
pdf.cell(0, 6, "Rev. 3  -  UDB-Switch architecture, with distances + full device specs", new_x="LMARGIN", new_y="NEXT")

pdf.set_xy(12, 78)
pdf.set_text_color(*BLACK)
pdf.set_font("Helvetica", "", 10)
meta = [
    ("Site", "3 outdoor sand volleyball courts + 2 patios (P1, P2)"),
    ("Platform", "Ubiquiti UniFi (Network + Protect)"),
    ("Installer", "Brian Russo (owner-installer)"),
    ("Controller / NVR", "CloudKey+ (SSD) + Network Video Recorder Pro + 16 TB HDD (existing)"),
    ("Key constraints", "No trenching; no new cable across sand/drainage; cold-weather (Buffalo NY)"),
    ("Backhaul method", "UniFi UDB-Switch: WiFi-7 wireless-uplink switches at each pole (no outdoor cable)"),
    ("Access points", "3x U6 Mesh Pro - relocate 2 off building wall + add 1 new"),
    ("Net new hardware", "approx. $1,500 - $2,000 (most network gear repositioned, not repurchased)"),
]
for k, v in meta:
    pdf.set_font("Helvetica", "B", 10); pdf.set_text_color(*NAVY)
    pdf.cell(38, 7, k)
    pdf.set_font("Helvetica", "", 10); pdf.set_text_color(*BLACK)
    pdf.multi_cell(0, 7, v, new_x="LMARGIN", new_y="NEXT")

pdf.ln(2)
pdf.set_draw_color(*LGREY); pdf.set_line_width(0.4); pdf.line(12, pdf.get_y(), 204, pdf.get_y()); pdf.ln(3)
pdf.set_font("Helvetica", "B", 11); pdf.set_text_color(*BLUE)
pdf.cell(0, 6, "Design summary", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10); pdf.set_text_color(*BLACK)
pdf.multi_cell(0, 5,
    "Each court pole carries a UniFi UDB-Switch - a WiFi-7 switch with a built-in wireless uplink. "
    "It backhauls to the UniFi WiFi over the air (no cable across the sand or drainage) AND supplies "
    "local PoE to that pole's cameras and access point. A U6 Mesh Pro re-mounted on the building "
    "(off the concrete wall) is the wired uplink anchor; the center-pole UDB-Switch links to it, and "
    "the Court 3 UDB-Switch links (relay) to the center-pole AP. The three U6 Mesh Pro APs are "
    "repositioned from the failed concrete-wall mounting onto poles, where coverage radiates over the "
    "sand. Cameras: 3 fixed bullets (one per court); the AI PTZ and a G6 180 remain on the parking lot.",
    new_x="LMARGIN", new_y="NEXT")

# --------------------------------------------------------------------------- BACKGROUND
pdf.add_page()
pdf.h1("1.  Background & Existing Conditions")
pdf.h2("Problem identified")
pdf.bullet("Two U6 Mesh Pro APs were wall-mounted on the concrete back of the building.")
pdf.bullet("Heat-map survey showed strong signal (-30 to -50 dBm) only at the wall; the entire court "
           "surface measured -70 to -80 dBm (marginal-to-unusable), failing under league crowds.")
pdf.bullet("Root cause: omnidirectional APs flat on concrete radiate left/right along the wall and "
           "reflect/absorb into the concrete - signal does not project across the open sand.")
pdf.h2("Fix")
pdf.bullet("Reposition the U6 Mesh Pro APs off the wall onto field poles so coverage radiates over the sand.")
pdf.bullet("Use UDB-Switch wireless-uplink switches for backhaul - no cable across the sand/drainage; "
           "each pole gets local PoE for its cameras + AP.")

pdf.ln(2)
pdf.h2("Existing UniFi equipment to be REUSED (no purchase)")
pdf.set_font("Helvetica", "", 9.5)
with pdf.table(col_widths=(46, 14, 40), text_align=("LEFT", "CENTER", "LEFT"),
               first_row_as_headings=True, line_height=5.5) as t:
    r = t.row(); r.cell("Item"); r.cell("Qty"); r.cell("Role in this project")
    for a, b, c in [
        ("Network Video Recorder Pro + 16 TB HDD", "1", "Records all court cameras"),
        ("CloudKey+ (SSD)", "1", "UniFi Network/Protect controller"),
        ("Switch Pro Max 24 PoE / Pro XG 8 PoE", "2 / 1", "Rack; powers wired building AP"),
        ("Access Point U6 Mesh Pro", "3*", "*Relocate 2 off wall + add 1 new = 3 on poles"),
        ("AI PTZ Industrial (IP66, -40C)", "1", "STAYS on parking lot (not moved)"),
        ("Camera G6 180", "1", "STAYS on parking lot (do NOT use for courts)"),
        ("Switch Flex 2.5G PoE + 210W adapter", "1", "Not needed at poles (UDB-Switch replaces it)"),
    ]:
        row = t.row(); row.cell(a); row.cell(b); row.cell(c)

pdf.ln(2)
pdf.h2("Confirmed site facts")
pdf.bullet("Center pole: new 20 ft pole (2 lights) between Court 1 and Court 2 - POWER PRESENT.")
pdf.bullet("Court 3 pole: 20 ft light pole - POWER PRESENT.")
pdf.bullet("P2 patio post: existing Cat6 pulled to it but NO power (kept as a future AP option only).")
pdf.bullet("Rack is inside the building, ~130 ft from the center-pole location.")
pdf.bullet("Courts each ~29'6\" x 59'1\" (approx 30 x 60 ft); perimeter light poles ~20 ft.")
pdf.bullet("Backhaul is wireless: a WiFi-7 UDB-Switch uplinking to a WiFi-6 U6 Mesh Pro links at "
           "WiFi-6 rates (hundreds of Mbps) - far above the ~50-80 Mbps the cameras need.")

# --------------------------------------------------------------------------- LAYOUT DIAGRAM
pdf.add_page()
pdf.h1("2.  Site Layout & Device Placement")
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.cell(0, 5, "Schematic - relative positions per site photos/CAD; not to exact scale. "
               "Solid = wired (PoE). Dashed = wireless uplink (WiFi).", new_x="LMARGIN", new_y="NEXT")
pdf.set_text_color(*BLACK)

fx, fy, fw, fh = 10, pdf.get_y() + 2, 196, 188
pdf.set_draw_color(*LGREY); pdf.set_line_width(0.3); pdf.rect(fx, fy, fw, fh)

# BUILDING
box(pdf, fx + 6, fy + 6, fw - 12, 20, "", fill=(225, 232, 244), border=NAVY)
pdf.set_xy(fx + 8, fy + 8); pdf.set_font("Helvetica", "B", 9); pdf.set_text_color(*NAVY)
pdf.cell(0, 4, "BUILDING  -  Equipment Room / Rack", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 8); pdf.set_font("Helvetica", "", 7); pdf.set_text_color(*BLACK)
pdf.cell(0, 3.4, "CloudKey+  |  NVR Pro + 16 TB  |  Switch Pro Max 24 PoE  |  Pro XG 8 PoE", new_x="LMARGIN", new_y="NEXT")
box(pdf, fx + fw - 70, fy + 18, 62, 6.5, "U6 Mesh Pro #1 (wired anchor, off concrete)",
    fill=BLUE, border=BLUE, tcolor=WHITE, fs=6.4)

# P1 patio
box(pdf, fx + 6, fy + 30, 70, 8, "P1 PATIO (by building)", fill=(225, 244, 230), border=GREEN, tcolor=GREEN, fs=7.5)
# Parking lot
box(pdf, fx + 120, fy + 30, fw - 126, 28, "", fill=(238, 238, 238), border=GREY)
pdf.set_xy(fx + 122, fy + 32); pdf.set_font("Helvetica", "B", 7.5); pdf.set_text_color(*GREY)
pdf.cell(0, 4, "PARKING LOT", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 122); pdf.set_font("Helvetica", "", 6.6); pdf.set_text_color(*BLACK)
pdf.cell(0, 3.3, "G6 180 + AI PTZ Industrial", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 122); pdf.cell(0, 3.3, "(existing - stay, not moved)", new_x="LMARGIN", new_y="NEXT")

# Court 1
box(pdf, fx + 40, fy + 50, 70, 38, "COURT 1 (C1)", fill=(247, 238, 214), border=(180, 150, 80), tcolor=(120, 90, 20), fs=10)
# Center pole
cpx, cpy = fx + 36, fy + 94
pole(pdf, cpx, cpy, "")
# Court 2 / Court 3
box(pdf, fx + 56, fy + 104, 54, 60, "COURT 2 (C2)", fill=(247, 238, 214), border=(180, 150, 80), tcolor=(120, 90, 20), fs=10)
box(pdf, fx + 14, fy + 104, 38, 60, "COURT 3", fill=(247, 238, 214), border=(180, 150, 80), tcolor=(120, 90, 20), fs=9)
c3x, c3y = fx + 33, fy + 108
pole(pdf, c3x, c3y, "")
# P2 patio
box(pdf, fx + 120, fy + 62, fw - 126, 102, "", fill=(225, 244, 230), border=GREEN)
pdf.set_xy(fx + 122, fy + 64); pdf.set_font("Helvetica", "B", 8); pdf.set_text_color(*GREEN)
pdf.cell(0, 4, "P2 PATIO (new)", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 122); pdf.set_font("Helvetica", "", 6.4); pdf.set_text_color(*BLACK)
pdf.cell(0, 3.2, "covered by center-pole AP;", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(fx + 122); pdf.cell(0, 3.2, "existing cable = future AP option", new_x="LMARGIN", new_y="NEXT")

# wireless uplinks (dashed) + arrows
arrow(pdf, fx + fw - 40, fy + 24.5, cpx + 1, cpy - 2, ORANGE, dashed=True, w=0.6)
arrow(pdf, cpx - 1, cpy + 1, c3x + 1, c3y - 1, ORANGE, dashed=True, w=0.6)

# callouts
callout(pdf, fx + 44, fy + 92, 62,
        ["UDB-Switch (210W) - WiFi uplink",
         "U6 Mesh Pro #2 (C1/C2 coverage)",
         "G6 Bullet -> Court 1",
         "G6 Bullet -> Court 2"],
        "CENTER POLE HUB (20', power)")
callout(pdf, fx + 8, fy + 130, 42,
        ["UDB-Switch (210W) - WiFi uplink", "G6 Bullet -> court", "U6 Mesh Pro #3"],
        "COURT 3 POLE (20', power)", tcolor=NAVY)

# legend
ly = fy + fh - 8
pdf.set_draw_color(*ORANGE); pdf.set_line_width(0.6); pdf.set_dash_pattern(dash=1.5, gap=1.2)
pdf.line(fx + 6, ly, fx + 18, ly); pdf.set_dash_pattern()
pdf.set_xy(fx + 20, ly - 2); pdf.set_font("Helvetica", "", 7); pdf.set_text_color(*BLACK)
pdf.cell(42, 4, "Wireless uplink (WiFi)")
pdf.set_draw_color(*BLUE); pdf.line(fx + 74, ly, fx + 86, ly)
pdf.set_xy(fx + 88, ly - 2); pdf.cell(40, 4, "Wired (PoE)")
pdf.set_fill_color(*NAVY); pdf.ellipse(fx + 128, ly - 1.4, 3, 3, style="DF")
pdf.set_xy(fx + 133, ly - 2); pdf.cell(40, 4, "Light pole (mount point)")

pdf.set_y(fy + fh + 3)
pdf.set_font("Helvetica", "I", 8); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4, "Orientation per owner: building at top with rack; P1 patio adjacent to building; "
               "Court 1 nearer building, Court 2 further; Court 3 to the left behind Court 2; "
               "P2 (new patio) along the right.", new_x="LMARGIN", new_y="NEXT")

# --------------------------------------------------------------------------- TOPOLOGY
pdf.add_page()
pdf.h1("3.  Network Topology & Wireless Uplinks")
ty = pdf.get_y() + 2

box(pdf, 8, ty, 60, 16, "", fill=BLUE, border=BLUE)
pdf.set_xy(8, ty + 2.5); pdf.set_font("Helvetica", "B", 7.6); pdf.set_text_color(*WHITE)
pdf.multi_cell(60, 3.6, "BUILDING U6 Mesh Pro #1\n(wired to rack - uplink anchor)", align="C")
box(pdf, 78, ty, 76, 16, "", fill=(225, 232, 244), border=NAVY)
pdf.set_xy(78, ty + 2.5); pdf.set_font("Helvetica", "B", 8.5); pdf.set_text_color(*NAVY)
pdf.cell(76, 4.5, "RACK (building)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(78); pdf.set_font("Helvetica", "", 7); pdf.set_text_color(*BLACK)
pdf.cell(76, 4, "CloudKey+ - NVR Pro - Pro Max 24 PoE", align="C")
arrow(pdf, 78, ty + 8, 68, ty + 8, BLUE, w=0.6)

cy = ty + 42
box(pdf, 56, cy, 104, 30, "", fill=WHITE, border=NAVY)
pdf.set_xy(58, cy + 1.5); pdf.set_font("Helvetica", "B", 9); pdf.set_text_color(*NAVY)
pdf.cell(100, 4.5, "CENTER POLE HUB  (20 ft, power present)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(58); pdf.set_font("Helvetica", "", 7.4); pdf.set_text_color(*BLACK)
for s in ["UDB-Switch (210W adapter) - wireless uplink to building U6 #1",
          "U6 Mesh Pro #2  |  G6 Bullet (Court 1)  |  G6 Bullet (Court 2)"]:
    pdf.set_x(58); pdf.cell(100, 4, s, align="C", new_x="LMARGIN", new_y="NEXT")
arrow(pdf, 30, ty + 16, 100, cy, ORANGE, dashed=True, w=0.7)
pdf.set_xy(34, ty + 26); pdf.set_font("Helvetica", "B", 7); pdf.set_text_color(*ORANGE)
pdf.cell(40, 4, "WiFi uplink")

c3y2 = cy + 44
box(pdf, 56, c3y2, 104, 22, "", fill=WHITE, border=NAVY)
pdf.set_xy(58, c3y2 + 1.5); pdf.set_font("Helvetica", "B", 9); pdf.set_text_color(*NAVY)
pdf.cell(100, 4.5, "COURT 3 POLE  (20 ft, power present)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(58); pdf.set_font("Helvetica", "", 7.4); pdf.set_text_color(*BLACK)
pdf.set_x(58); pdf.cell(100, 4, "UDB-Switch (210W)  -  U6 Mesh Pro #3  -  G6 Bullet", align="C")
arrow(pdf, 108, cy + 30, 108, c3y2, ORANGE, dashed=True, w=0.7)
pdf.set_xy(110, cy + 33); pdf.set_font("Helvetica", "B", 7); pdf.set_text_color(*ORANGE)
pdf.cell(50, 4, "WiFi uplink (relay to center U6 #2)")

pdf.set_y(c3y2 + 28)
pdf.h2("How the wireless backhaul works")
pdf.bullet("The UDB-Switch is a WiFi-7 switch with a built-in wireless uplink: it joins the UniFi WiFi "
           "over the air and provides PoE locally - so no cable runs out to the poles.")
pdf.bullet("Center pole UDB-Switch uplinks to the building U6 Mesh Pro #1 (~130 ft, line-of-sight).")
pdf.bullet("Court 3 UDB-Switch uplinks (relay) to the center-pole U6 Mesh Pro #2 (Court 3 sits behind "
           "Court 2, so it chains through the elevated center pole).")
pdf.bullet("WiFi-7 uplink to a WiFi-6 AP runs at WiFi-6 rates - hundreds of Mbps, far above the "
           "~50-80 Mbps needed for 3x 4K cameras + AP clients.")
pdf.bullet("Each UDB-Switch is powered by a 210W adapter (up to 185W PoE) - ample for cameras + AP.")
pdf.bullet("Position the building U6 with clear line-of-sight to the center pole (mast/standoff off the "
           "concrete) so the uplink is strong.")

# --------------------------------------------------------------------------- DEVICE TABLE
pdf.add_page()
pdf.h1("4.  Device-by-Device Placement & Mounting")
pdf.set_font("Helvetica", "", 8.5)
with pdf.table(col_widths=(22, 32, 40, 22, 36),
               text_align="LEFT", first_row_as_headings=True, line_height=4.6) as t:
    hdr = t.row()
    for c in ["Location", "Device", "Placement / Aim", "Height", "Power & Data"]:
        hdr.cell(c)
    rows = [
        ("Building", "U6 Mesh Pro #1 (relocated)", "Mast/standoff OFF concrete; LoS to center pole", "Roofline", "Wired PoE from rack switch"),
        ("Center pole", "UDB-Switch (in NEMA enclosure)", "Wireless uplink to building U6 #1", "~6 ft (reach)", "AC from pole light circuit + 210W adapter"),
        ("Center pole", "G6 Bullet", "Aim down Court 1", "~18-20 ft", "PoE from UDB-Switch"),
        ("Center pole", "G6 Bullet", "Aim down Court 2", "~18-20 ft", "PoE from UDB-Switch"),
        ("Center pole", "U6 Mesh Pro #2 (relocated)", "Radiate over C1/C2; reaches P1/P2", "~15-18 ft", "PoE from UDB-Switch"),
        ("Court 3 pole", "UDB-Switch (in NEMA enclosure)", "Wireless uplink to center-pole U6 #2", "~6 ft (reach)", "AC from pole light circuit + 210W adapter"),
        ("Court 3 pole", "G6 Bullet", "Aim down length of Court 3", "~18-20 ft", "PoE from UDB-Switch"),
        ("Court 3 pole", "U6 Mesh Pro #3 (new)", "Radiate over Court 3", "~15-18 ft", "PoE from UDB-Switch"),
        ("Parking lot", "G6 180 + AI PTZ Industrial", "No change - stay on lot", "existing", "existing"),
    ]
    for r in rows:
        row = t.row()
        for c in r:
            row.cell(c)

pdf.ln(2)
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4, "Camera aiming: mount each bullet at one END of its court and aim down the 60 ft "
    "length for full coverage and best pixel density. Do not use the G6 180 for court detail. "
    "(A G6 Pro Bullet could be added later on a court for varifocal zoom / special-games detail.)",
    new_x="LMARGIN", new_y="NEXT")

# --------------------------------------------------------------------------- BOM
pdf.add_page()
pdf.h1("5.  Bill of Materials")
pdf.h2("New hardware to purchase")
pdf.set_font("Helvetica", "", 9)
with pdf.table(col_widths=(74, 14, 28, 26), text_align=("LEFT","CENTER","RIGHT","RIGHT"),
               first_row_as_headings=True, line_height=5.4) as t:
    hdr = t.row()
    for c in ["Item (UniFi SKU)", "Qty", "Unit", "Line"]:
        hdr.cell(c)
    bom = [
        ("Device Bridge Switch (UDB-Switch-US)", "2", "$299", "$598"),
        ("AC Adapter 210W (UACC-Adapter-AC-210W)", "2", "$79", "$158"),
        ("Access Point U6 Mesh Pro (new; + relocate 2 owned)", "1", "$179", "$179"),
        ("Camera G6 Bullet (UVC-G6-Bullet-B) - one per court", "3", "$199", "$597"),
        ("Outdoor NEMA enclosure sized for UDB-Switch", "2", "~$90", "~$180"),
        ("Ethernet Surge Protection Outdoor (UACC-ETH-SP-Pro)", "2-4", "$19", "$38-76"),
        ("Pole mounts / building mast + short patch cables", "1 lot", "~$120", "~$120"),
    ]
    for r in bom:
        row = t.row()
        for c in r:
            row.cell(c)
pdf.ln(1)
pdf.set_font("Helvetica", "B", 10); pdf.set_text_color(*NAVY)
pdf.cell(0, 6, "Estimated net new spend:  approx. $1,850 - $1,950 (+ bar-TV viewer, below)", new_x="LMARGIN", new_y="NEXT")

pdf.ln(1)
pdf.set_font("Helvetica", "", 9); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4.4, "Cameras: 3x G6 Bullet selected (one per court) for full coverage. A G6 Pro Bullet "
    "(varifocal) can be added later on a court for zoom detail / special-games footage. Tariff and "
    "memory surcharges from the UniFi store are extra.", new_x="LMARGIN", new_y="NEXT")

pdf.ln(2)
pdf.h2("Customer viewing - bar TV (UniFi Protect on a screen)")
pdf.set_font("Helvetica", "", 9.5); pdf.set_text_color(*BLACK)
pdf.bullet("Existing Protect Viewport is in use in the office (all-camera wall) - not available for the bar.")
pdf.bullet("In stock now: Apple TV 4K (~$129) + the official UniFi Protect tvOS app - shows a live court "
           "view on the bar TV. Use the 3rd-party Streamie app if you want a curated courts-only layout.")
pdf.bullet("Or buy a 2nd Protect Viewport when back in stock (native, full custom Live View support).")
pdf.bullet("In Protect, build a Live View with the 3 court bullets (audio muted), set as default, leave on.")

pdf.ln(2)
pdf.h2("Removed from earlier cart (not needed)")
pdf.set_font("Helvetica", "", 9.5); pdf.set_text_color(*BLACK)
pdf.bullet("U7 Outdoor APs x2 - not needed; U6 Mesh Pro is already omnidirectional and outdoor-rated.")
pdf.bullet("Switch Flex Utility x1 - that is an IP65 enclosure for a Flex SWITCH, not the larger "
           "UDB-Switch; use UDB-sized NEMA enclosures instead.")
pdf.bullet("Extra 2 cameras (cart had 5; design needs 3).")

pdf.ln(2)
pdf.h2("Reused (already owned - $0)")
pdf.set_font("Helvetica", "", 9.5)
for s in ["3x U6 Mesh Pro APs (relocate 2 off building wall, add the 1 new = 3 on poles)",
          "Network Video Recorder Pro + 16 TB HDD - recording",
          "CloudKey+ controller; rack PoE switches power the wired building AP",
          "AI PTZ Industrial + G6 180 - stay on parking lot"]:
    pdf.bullet(s)

# --------------------------------------------------------------------------- INSTALL / CONFIG
pdf.add_page()
pdf.h1("6.  Installation & Configuration")
pdf.h2("Physical install sequence")
steps = [
    "Re-mount a U6 Mesh Pro on the building OFF the concrete (short mast/standoff at the roofline) with "
    "clear line-of-sight to the center pole; wire it to a rack PoE port. This is the uplink anchor.",
    "Mount a NEMA enclosure on the center pole; install the UDB-Switch + 210W adapter; have an "
    "electrician land pole-light-circuit power to it (no trenching - power is at the pole).",
    "Mount center-pole devices: G6 Pro Bullet (main court), G6 Bullet (other court), U6 Mesh Pro #2. "
    "Patch all to the UDB-Switch PoE ports.",
    "Repeat at Court 3: NEMA enclosure + UDB-Switch + 210W adapter (pole power), G6 Bullet, U6 Mesh Pro #3.",
    "Install ETH-SP surge protectors on the wired building-AP run and any cable entering the building.",
    "Aim cameras down each court; tilt APs slightly down toward the sand.",
]
pdf.set_font("Helvetica", "", 10)
for i, s in enumerate(steps, 1):
    x = pdf.get_x(); pdf.set_x(x + 2)
    pdf.set_font("Helvetica", "B", 10); pdf.cell(6, 5, f"{i}.")
    pdf.set_font("Helvetica", "", 10); pdf.multi_cell(0, 5, s, new_x="LMARGIN", new_y="NEXT")

pdf.ln(1)
pdf.h2("UniFi configuration")
pdf.bullet("Adopt the building U6 (wired) first; build one outdoor WLAN; enable band steering.")
pdf.bullet("Adopt each UDB-Switch and set its wireless uplink to the correct AP (center -> building U6; "
           "Court 3 -> center U6). Confirm uplink RSSI better than -60 dBm and a healthy link rate.")
pdf.bullet("Adopt the pole APs (U6 #2, #3). Set fixed, non-overlapping 5 GHz channels across the 3 APs; "
           "reduce TX power from High to Medium once on poles; verify with a follow-up heat map.")
pdf.bullet("Adopt cameras in UniFi Protect; confirm recording to NVR Pro; set AI/motion zones to the "
           "courts; set the G6 Pro Bullet zoom to fill the main court.")
pdf.bullet("Confirm each UDB-Switch PoE load is within budget (185W with the 210W adapter).")

pdf.ln(1)
pdf.h2("PoE budget per pole (UDB-Switch, 185W available with 210W adapter)")
pdf.set_font("Helvetica", "", 9)
with pdf.table(col_widths=(120, 40), text_align=("LEFT","RIGHT"), first_row_as_headings=True, line_height=5.2) as t:
    hr = t.row(); hr.cell("Pole load"); hr.cell("Approx draw")
    for a, b in [("Center pole: 2x G6 Bullet + U6 Mesh Pro", "~27 W"),
                 ("Court 3: G6 Bullet + U6 Mesh Pro", "~20 W"),
                 ("Headroom on 185W budget", "very large")]:
        r = t.row(); r.cell(a); r.cell(b)

# --------------------------------------------------------------------------- DISTANCES
pdf.add_page()
pdf.h1("7.  Distances, Cabling & Power Schedule")
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.multi_cell(0, 4.5, "Court/area dimensions are from the site CAD. Link distances marked EST. are "
    "approximate - measure pole-to-pole on site (laser or wheel) and record in the right column before "
    "ordering cable. Confirm clear line-of-sight at mount height for each wireless uplink.",
    new_x="LMARGIN", new_y="NEXT"); pdf.set_text_color(*BLACK)

pdf.h2("Court & area dimensions (from CAD)")
pdf.set_font("Helvetica", "", 9)
with pdf.table(col_widths=(92, 68), first_row_as_headings=True, line_height=5.2, text_align="LEFT") as t:
    h = t.row(); h.cell("Feature"); h.cell("Dimension")
    for a, b in [("Court 1 / 2 / 3 playing surface (each)", "29'6\" x 59'1\" (~30 x 60 ft)"),
                 ("Courts 1 & 2 fenced area", "100'0\" x 90'0\""),
                 ("Court 3 fenced area", "61'0\" x 89'6\""),
                 ("Perimeter light poles", "~20 ft"),
                 ("Center pole (new, 2 lights)", "20 ft - power present")]:
        r = t.row(); r.cell(a); r.cell(b)

pdf.ln(1)
pdf.h2("Link & cable-run schedule")
pdf.set_font("Helvetica", "", 8.5)
with pdf.table(col_widths=(54, 40, 40, 26), first_row_as_headings=True, line_height=4.8, text_align="LEFT") as t:
    h = t.row()
    for c in ["Segment", "Type", "Est. distance", "Measured"]:
        h.cell(c)
    for r in [("Rack -> building U6 #1", "Wired Cat6", "In building (short)", "____"),
              ("Building U6 #1 -> center pole", "WIRELESS uplink", "~130 ft (owner)", "____"),
              ("Center pole -> Court 3 pole", "WIRELESS relay", "~100-150 ft EST", "____"),
              ("Center pole UDB -> each camera", "Wired patch", "~15-30 ft", "____"),
              ("Center pole UDB -> U6 #2", "Wired patch", "~10-20 ft", "____"),
              ("Court 3 UDB -> camera", "Wired patch", "~15-30 ft", "____"),
              ("Court 3 UDB -> U6 #3", "Wired patch", "~10-20 ft", "____")]:
        row = t.row()
        for c in r:
            row.cell(c)

pdf.ln(1)
pdf.h2("Power schedule (electrician)")
pdf.bullet("Center pole: tap existing pole light circuit (120V) -> 210W adapter (in enclosure) -> UDB-Switch.")
pdf.bullet("Court 3 pole: tap existing pole light circuit (120V) -> 210W adapter (in enclosure) -> UDB-Switch.")
pdf.bullet("Building U6 #1: no separate power - PoE from a rack switch port.")
pdf.bullet("Cold note: the 210W adapter is rated 0-40 C (32-104 F). Courts are seasonal, but if the gear "
           "stays powered through deep winter use a sealed enclosure (gear self-heat helps) and monitor.")

pdf.ln(1)
pdf.h2("Cable & accessory takeoff")
pdf.bullet("Outdoor/UV or direct-burial shielded Cat6 for the pole patch runs + the building-AP run.")
pdf.bullet("ETH-SP-Pro surge protector on the building-AP copper run (and any copper entering a structure).")
pdf.bullet("Stainless band-clamp pole mounts (3 cameras + 2 pole APs); building mast/standoff for U6 #1.")
pdf.bullet("Weatherproof glands, drip loops, UV zip ties, dielectric grease, outdoor RJ45 ends + tester.")

# --------------------------------------------------------------------------- COMMISSIONING
pdf.add_page()
pdf.h1("8.  Commissioning & Acceptance Checklist")

def check(txt):
    pdf.set_font("Helvetica", "", 9.8); pdf.set_text_color(*BLACK)
    x = pdf.get_x(); pdf.set_x(x + 3)
    pdf.set_draw_color(*GREY); pdf.set_line_width(0.3)
    yy = pdf.get_y(); pdf.rect(pdf.get_x(), yy + 0.6, 3.6, 3.6)
    pdf.set_x(pdf.get_x() + 6)
    pdf.multi_cell(0, 5, txt, new_x="LMARGIN", new_y="NEXT")

pdf.h2("Wireless backhaul (UDB-Switch uplinks)")
check("Center-pole UDB-Switch uplink online; RSSI better than -60 dBm; link rate healthy.")
check("Court 3 UDB-Switch uplink (relay) online; all Court 3 devices reachable.")
check("Pull a phone/laptop speed test through each pole - well above camera needs.")
pdf.h2("WiFi coverage (re-survey)")
check("Re-run the WiFiman heat map across all 3 courts + both patios.")
check("Court surface now reads -55 dBm or better (was -70 to -80).")
check("No dead pocket on P1/P2 (existing P2 cable can feed an added AP if needed).")
check("Roaming: a phone walks court-to-court without dropping.")
pdf.h2("Cameras (UniFi Protect)")
check("All 3 court bullets online and recording to NVR Pro.")
check("Each bullet frames its full court end-to-end.")
check("Bar TV: Apple TV (or Viewport) shows the courts Live View; audio muted; always-on.")
check("Night check: image usable under the Musco court lights.")
check("Retention check: 16 TB HDD holds target days with the added cameras (add HDD if short).")
pdf.h2("Power & weatherproofing")
check("UDB-Switch + 210W adapter sealed inside NEMA enclosures; cable glands tight; drip loops.")
check("ETH-SP surge protectors grounded on the wired building run.")
check("No PoE over-budget warnings on either UDB-Switch.")

pdf.ln(4)
pdf.set_draw_color(*LGREY); pdf.set_line_width(0.4); pdf.line(10, pdf.get_y(), 204, pdf.get_y()); pdf.ln(3)
pdf.set_font("Helvetica", "B", 10); pdf.set_text_color(*NAVY)
pdf.cell(0, 6, "Sign-off", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10); pdf.set_text_color(*BLACK)
pdf.ln(6); pdf.cell(95, 6, "Installer: ______________________________"); pdf.cell(0, 6, "Date: ________________", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6); pdf.cell(0, 6, "Notes: __________________________________________________________________", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4); pdf.cell(0, 6, "________________________________________________________________________________", new_x="LMARGIN", new_y="NEXT")

# --------------------------------------------------------------------------- SPECS APPENDIX
pdf.add_page()
pdf.h1("9.  Device Specifications (Appendix)")
pdf.set_font("Helvetica", "I", 8.5); pdf.set_text_color(*GREY)
pdf.cell(0, 5, "Key manufacturer specs for each device. Verify current values on ui.com before purchase.",
         new_x="LMARGIN", new_y="NEXT")
pdf.set_text_color(*BLACK)


def spec(title, lines):
    pdf.h2(title)
    for k, v in lines:
        pdf.set_x(14)
        pdf.set_font("Helvetica", "B", 8.8); pdf.set_text_color(*NAVY); pdf.cell(40, 4.6, k)
        pdf.set_font("Helvetica", "", 8.8); pdf.set_text_color(*BLACK)
        pdf.multi_cell(0, 4.6, v, new_x="LMARGIN", new_y="NEXT")


spec("Device Bridge Switch (UDB-Switch-US) - NEW x2", [
    ("Ports", "1x 10 GbE + 7x 2.5 GbE; PoE+ output"),
    ("PoE budget", "35W (incl. 60W adapter) / up to 185W (with 210W adapter)"),
    ("Wireless uplink", "WiFi 7, 4 streams; up to 5.8 Gbps (6 GHz) / 4.3 Gbps (5 GHz)"),
    ("Power", "54V DC; 60W adapter included, 210W optional"),
    ("Size / class", "212.9 x 113 x 32.5 mm; desktop/wall (indoor-class - enclose outdoors)"),
])
spec("Access Point U6 Mesh Pro (U6-MESH-PRO) - REUSE x2 + NEW x1", [
    ("WiFi", "WiFi 6; 5 GHz 2x2 to 2.4 Gbps, 2.4 GHz 2x2 to 573.5 Mbps; 8 dBi"),
    ("Ports / power", "2x GbE RJ45; PoE (48V adapter incl. or PoE switch); 9W max"),
    ("Environment", "IPX6 weatherproof; -30 to 60 C; 250+ clients"),
    ("Size", "343.2 x 181.2 x 60.2 mm"),
])
spec("Camera G6 Bullet (UVC-G6-Bullet-B) - NEW x3", [
    ("Imaging", "8MP 4K (3840 x 2160), 1/1.8\" sensor, 30 FPS, AI detection"),
    ("Field of view", "109.9 H / 56.7 V / 134.1 D (degrees)"),
    ("Night vision", "IR up to 30 m (98 ft); IR cut filter"),
    ("Power", "PoE 37-57V DC; 9.9W max"),
    ("Environment", "IP66; -20 to 50 C"),
])
spec("AC Adapter 210W (UACC-Adapter-AC-210W) - NEW x2", [
    ("Input / output", "100-240V AC in; 54V DC out, 3.90A, 210W"),
    ("Operating temp", "0 to 40 C (32-104 F) - cold-weather caveat"),
    ("Size", "190 x 86 x 26 mm; C14 inlet, 1.5 m DC cable"),
])
spec("Ethernet Surge Protection Outdoor (UACC-ETH-SP-Pro) - NEW x2-4", [
    ("Protection", "Passive, 20kA discharge; data to 10 Gbps; 60W PoE++ passthrough"),
    ("Environment", "IPX5; -30 to 65 C"),
    ("Size", "91 x 61 x 32.5 mm"),
])
spec("Network Video Recorder Pro (UNVR-Pro) - EXISTING", [
    ("Storage", "7x 2.5/3.5\" bays; SATA to 24TB each; up to 168TB raw; RAID"),
    ("Capacity", "Up to 24x 4K cameras (~60 days) or 70 HD"),
    ("Ports / form", "1x 10G SFP+, 1x GbE RJ45; 2U rackmount"),
])
spec("Apple TV 4K (bar viewer) - NEW x1 (alternative to Viewport)", [
    ("Use", "Runs official UniFi Protect tvOS app; HDMI to bar TV"),
    ("Network", "Ethernet (higher model) or WiFi; approx. $129"),
])

out = "/home/user/Email/Manor-Lanes-Courts-Install-Report.pdf"
pdf.output(out)
print("WROTE", out)
