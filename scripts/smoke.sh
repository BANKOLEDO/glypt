#!/usr/bin/env bash
# Glypt API smoke test - run while the api is up (default :4000).
set -euo pipefail
API="${1:-http://localhost:4000}"

pass=0; fail=0
check() { # name, expected_status, actual_status
  if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ok  $1 ($3)"; else fail=$((fail+1)); echo "FAIL  $1 (want $2 got $3)"; fi
}

s=$(curl -s -o /dev/null -w '%{http_code}' "$API/api/health"); check health 200 "$s"
s=$(curl -s -o /dev/null -w '%{http_code}' "$API/api/search?q=rocket&limit=3"); check search 200 "$s"
s=$(curl -s -o /dev/null -w '%{http_code}' "$API/api/icon?prefix=lucide&name=rocket"); check icon-svg 200 "$s"
s=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/atlas" -H 'content-type: application/json' -d '{"icons":["lucide:home","ph:star"]}'); check atlas-build 200 "$s"
s=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/export" -H 'content-type: application/json' -d '{"icons":["ph:star"],"formats":["svg"]}'); check export-zip 200 "$s"
s=$(curl -s -o /dev/null -w '%{http_code}' "$API/api/icon?prefix=lucide&name=does-not-exist-xyz"); check bad-icon-404-or-fallback "200|404" "$s"

echo
echo "passed=$pass failed=$fail"
[ "$fail" = 0 ]
