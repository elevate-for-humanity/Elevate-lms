#!/usr/bin/env bash
# Platform Closure Sprint — smoke checks (run after deploy)
set -euo pipefail

SITE="${SITE_URL:-http://localhost:3000}"
ADMIN="${ADMIN_URL:-http://localhost:3001}"

echo "=== Platform closure smoke ==="
echo "LMS: $SITE"
echo "Admin: $ADMIN"

check() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE$path" || echo "000")
  if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
    echo "PASS $path ($code)"
  else
    echo "FAIL $path ($code)"
    return 1
  fi
}

check_api() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SITE$path" -H "Content-Type: application/json" -d '{}' || echo "000")
  if [[ "$code" =~ ^(200|400|401|403|405|503)$ ]]; then
    echo "PASS $path responds ($code)"
  else
    echo "FAIL $path ($code)"
    return 1
  fi
}

check "/programs"
check "/credentials"
check "/transparency"
check "/contact"
check_api "/api/contact"
check_api "/api/webhooks/stripe"

echo "=== Stripe unit tests ==="
pnpm test tests/unit/stripe-webhook-signature.test.ts tests/unit/stripe-service.test.ts

echo "=== Done ==="
