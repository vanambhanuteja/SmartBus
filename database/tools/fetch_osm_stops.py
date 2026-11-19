"""Optional: download real bus stops around Mysuru from OpenStreetMap (Overpass API).
Needs internet access. Output: osm_stops.csv for you to review and merge into seed/stops.csv."""
import csv, json, urllib.parse, urllib.request

QUERY = '[out:json][timeout:60];node["highway"="bus_stop"](12.22,76.55,12.38,76.72);out body;'
url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(QUERY)
data = json.load(urllib.request.urlopen(url, timeout=90))
with open("osm_stops.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["osm_id", "name", "latitude", "longitude"])
    for e in data["elements"]:
        w.writerow([e["id"], e.get("tags", {}).get("name", ""), e["lat"], e["lon"]])
print(f"Saved {len(data['elements'])} stops to osm_stops.csv - review before use (data (c) OpenStreetMap contributors, ODbL)")
