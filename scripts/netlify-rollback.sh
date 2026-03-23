#!/usr/bin/env bash
# Rollback the live Netlify site to a previous deploy.
#
# Usage:
#   bash scripts/netlify-rollback.sh                  # list recent ready deploys
#   bash scripts/netlify-rollback.sh <deploy-id>      # restore that deploy to production
#
# Requires NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID in env or .env.local

set -euo pipefail

SITE_ID="${NETLIFY_SITE_ID:-0a9378d2-a1d1-4062-9e9a-7be3105044df}"
TOKEN="${NETLIFY_AUTH_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  # Try loading from .env.local
  if [[ -f .env.local ]]; then
    TOKEN=$(grep '^NETLIFY_AUTH_TOKEN=' .env.local | cut -d= -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: NETLIFY_AUTH_TOKEN not set. Add it to .env.local or export it."
  exit 1
fi

DEPLOY_ID="${1:-}"

if [[ -z "$DEPLOY_ID" ]]; then
  echo "Recent ready deploys (most recent first):"
  echo ""
  curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys?per_page=20" \
    | python3 -c "
import sys,json
deploys=json.load(sys.stdin)
for d in deploys:
    if d.get('state') == 'ready':
        fns = d.get('available_functions') or []
        handler = next((f for f in fns if f.get('n') == '___netlify-server-handler'), None)
        size = f'{handler[\"s\"]/1024/1024:.1f}MB' if handler else '-'
        print(f'  {d[\"id\"]}  {d.get(\"commit_ref\",\"\")[:10]}  {d.get(\"created_at\",\"\")[:16]}  handler:{size}')
"
  echo ""
  echo "To restore: bash scripts/netlify-rollback.sh <deploy-id>"
  exit 0
fi

echo "Restoring deploy $DEPLOY_ID to production..."
RESULT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys/$DEPLOY_ID/restore")

STATE=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('state','unknown'))")
ERR=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_message','') or '')")

if [[ "$STATE" == "ready" ]]; then
  echo "✅ Rollback complete. Deploy $DEPLOY_ID is now live."
else
  echo "❌ Rollback failed. State: $STATE"
  [[ -n "$ERR" ]] && echo "Error: $ERR"
  exit 1
fi
