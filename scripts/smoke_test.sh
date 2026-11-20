#!/usr/bin/env bash
# Integration smoke test for the running Docker Compose stack (frontend -> backend -> DB + ML service).
# Usage: docker compose up -d --build && ./scripts/smoke_test.sh
set -euo pipefail
BASE=${BASE:-http://localhost:3000}
EMAIL="smoke$RANDOM@example.com"; PASS="smoke-pass-123"
ok() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; exit 1; }

curl -fs "$BASE/" >/dev/null                                   && ok "frontend serves the SPA"            || fail "frontend"
curl -fs "$BASE/api/routes" | grep -q routeCode                && ok "frontend -> backend -> PostgreSQL (routes)" || fail "routes"
TOKEN=$(curl -fs -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')
[ -n "$TOKEN" ]                                                && ok "register returns a token"           || fail "register"
curl -fs -X POST "$BASE/api/crowd-reports" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"routeId":1,"crowdLevel":"HIGH","note":"smoke test"}' | grep -q '"source":"PASSENGER"' && ok "crowd report stored" || fail "report"
curl -fs -X POST "$BASE/api/predictions" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"routeId":1,"travelTime":"09:00","dayOfWeek":1}' | grep -q crowdLevel && ok "backend -> ML service prediction" || fail "prediction"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/dashboard" -H "Authorization: Bearer $TOKEN")
case "$CODE" in
  401|403) ok "passenger blocked from admin API" ;;
  *) fail "rbac (got $CODE)" ;;
esac
echo "All smoke checks passed"
