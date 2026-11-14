#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://www.elevateforhumanity.org}"

ready=$(curl --connect-timeout 10 --max-time 30 -sf -o /dev/null -w '%{http_code}' "${BASE}/api/ready")
health=$(curl --connect-timeout 10 --max-time 30 -sf "${BASE}/api/health")
# The current health contract exposes dependency readiness directly. The retired
# activation.ready_for_traffic field otherwise reports every healthy release as failed.
activation=$(echo "$health" | python3 -c '
import json,re,sys
d=json.load(sys.stdin)
valid=(d.get("ready") is True and d.get("healthy") is True
       and d.get("dependencies",{}).get("supabase",{}).get("ok") is True
       and re.fullmatch(r"[a-fA-F0-9]{40}",d.get("commit", "")) is not None)
print(valid)
')
links=$(curl --connect-timeout 10 --max-time 30 -sf "${BASE}/programs" | grep -c 'href="/programs/' || true)

echo "ready=$ready dependency_health=$activation program_links=$links"
test "$ready" = "200"
test "$activation" = "True"
test "${links:-0}" -gt 0
echo "OK"
