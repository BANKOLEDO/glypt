#!/usr/bin/env bash
# Glypt dev bootstrap - boots api + web side by side.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "glypt dev"
echo "  api -> http://localhost:4000"
echo "  web -> http://localhost:5173"
echo

API_PORT=4000 pnpm --filter @glypt/api dev &
API_PID=$!
pnpm --filter @glypt/web dev &
WEB_PID=$!

trap 'kill $API_PID $WEB_PID 2>/dev/null || true' EXIT INT TERM
wait
