#!/usr/bin/env bash
set -euo pipefail
[ -d node_modules ] || (echo "📦 Installing deps…" && (pnpm i || npm i || yarn))
export API_PORT=${API_PORT:-3001}
trap 'pkill -f "node server/index.js" || true; exit 0' SIGINT SIGTERM
echo "🚀 API on :$API_PORT"
node server/index.js
