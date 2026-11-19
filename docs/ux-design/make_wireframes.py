"""Generates simple low-fidelity SVG wireframes. Run: python3 make_wireframes.py"""
W, H = 375, 640

def box(x, y, w, h, label="", fill="#fff", stroke="#555", r=8, size=13, bold=False):
    t = f'<text x="{x+10}" y="{y+h/2+5}" font-size="{size}" font-family="sans-serif" {"font-weight=\"bold\"" if bold else ""}>{label}</text>' if label else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>{t}'

def frame(title, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<rect width="{W}" height="{H}" fill="#f5f7fa" stroke="#999"/>'
            + box(0, 0, W, 48, "SmartBus  |  " + title, "#0b5cad", "#0b5cad", 0, 14, True).replace("<text", '<text fill="#fff"') + body + '</svg>')

screens = {
 "01-login": ("Login", box(24,80,327,40,"Email")+box(24,134,327,40,"Password")+box(24,190,327,44,"Log in","#0b5cad","#0b5cad",8,14,True).replace("<text",'<text fill="#fff"')+'<text x="24" y="262" font-size="13" font-family="sans-serif">New passenger? Create an account</text>'),
 "02-home": ("Home", '<text x="24" y="100" font-size="20" font-weight="bold" font-family="sans-serif">Know how crowded your</text><text x="24" y="126" font-size="20" font-weight="bold" font-family="sans-serif">bus is before you board</text>'+box(24,160,327,44,"Browse routes","#0b5cad","#0b5cad",8,14,True).replace("<text",'<text fill="#fff"')+box(24,216,327,44,"Check crowd forecast")+box(24,290,327,30,"● Low   ●● Moderate   ●●● High   ●●●● Overcrowded",size=11)),
 "03-routes": ("Routes", box(16,64,343,200,"[ Leaflet / OpenStreetMap map ]","#dfe9f3")+box(16,278,343,44,"SB-01  City Bus Stand - Chamundi Hill")+box(16,330,343,44,"SB-02  Central - Hebbal","#e8f1fb","#0b5cad")+box(16,382,343,44,"SB-03  Railway Station - Kuvempunagar")),
 "04-predict": ("Crowd forecast", box(16,70,343,40,"Route: SB-04")+box(16,122,165,40,"Time: 08:30")+box(194,122,165,40,"Day: Monday")+box(16,176,343,44,"Check crowd level","#0b5cad","#0b5cad",8,14,True).replace("<text",'<text fill="#fff"')+box(16,240,343,150,"")+box(30,256,200,40,"●●● High · 78%","#c2570c","#c2570c",20,14,True).replace("<text",'<text fill="#fff"')+'<text x="30" y="330" font-size="12" font-family="sans-serif">Estimated for 08:30 Monday.</text><text x="30" y="350" font-size="12" font-family="sans-serif">Based on simulated data.</text>'),
 "05-report": ("Report crowd", box(16,70,343,40,"Route: select…")+box(16,126,343,40,"○ ● Low")+box(16,172,343,40,"○ ●● Moderate")+box(16,218,343,40,"◉ ●●● High","#e8f1fb","#0b5cad")+box(16,264,343,40,"○ ●●●● Overcrowded")+box(16,316,343,40,"Note (optional)")+box(16,372,343,44,"Submit report","#0b5cad","#0b5cad",8,14,True).replace("<text",'<text fill="#fff"')),
 "06-admin": ("Admin", box(16,64,78,64,"Routes 12")+box(102,64,78,64,"Buses 24")+box(188,64,78,64,"Stops 30")+box(274,64,85,64,"Reports 288")+box(16,142,343,150,"[ Crowd distribution bar chart ]")+box(16,306,343,130,"[ Avg occupancy by hour chart ]")+box(16,450,343,36,"Dashboard | Routes | Stops | Reports | Predictions",size=11)),
}
for name, (t, b) in screens.items():
    open(f"wireframes/{name}.svg", "w").write(frame(t, b))
print("wrote", len(screens), "wireframes")
