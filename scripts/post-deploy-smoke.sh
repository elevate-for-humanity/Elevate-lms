#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://www.elevateforhumanity.org}"

ready=$(curl -sf -o /dev/null -w '%{http_code}' "${BASE}/api/ready" || echo 000)
health=$(curl -sf "${BASE}/api/health" || echo '{}')
health_code=$(curl -sf -o /dev/null -w '%{http_code}' "${BASE}/api/health" || echo 000)
activation=$(echo "$health" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('activation',{}).get('ready_for_traffic', False))" 2>/dev/null || echo False)
links=$(curl -sf "${BASE}/programs" | grep -c 'href="/programs/' || true)

echo "ready=$ready health=$health_code activation=$activation program_links=$links"
test "$ready" = "200"
test "$health_code" = "200"
test "$activation" = "True"
test "${links:-0}" -gt 0
echo "OK"
