"""Fetch the admin CSV into a temporary path without logging credentials or report data."""
import json
import os
from urllib.request import Request, urlopen

base = os.environ["SMARTBUS_API_URL"].rstrip("/")
email = os.environ["ADMIN_EMAIL"]
password = os.environ["ADMIN_PASSWORD"]
out = os.environ.get("PASSENGER_EXPORT_PATH", "/tmp/smartbus-passenger-reports.csv")
body = json.dumps({"email": email, "password": password}).encode()
login = Request(base + "/api/auth/login", body, {"Content-Type": "application/json"})
with urlopen(login, timeout=30) as response:
    token = json.load(response)["token"]
request = Request(base + "/api/admin/passenger-reports.csv", headers={"Authorization": "Bearer " + token})
with urlopen(request, timeout=60) as response, open(out, "wb") as target:
    target.write(response.read())
print("Fetched passenger export to temporary runner storage.")
