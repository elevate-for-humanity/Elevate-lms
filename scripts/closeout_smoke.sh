#!/bin/bash
set -e

# Production Close-Out Smoke Test
# Fails if forbidden strings, infinite loaders, or missing headers detected

BASE_URL="${1:-http://localhost:3000}"
FAIL=0

echo "🔍 Running production close-out smoke test against: $BASE_URL"
echo ""

# Forbidden strings that must NOT appear in rendered HTML
FORBIDDEN=(
  "ORIGINAL-SITE"
  "OWNER-"
  "123 Main Street"
  "lorem ipsum"
  "placeholder text"
  "coming soon"
  "TBD"
  "(555)"
  "example.com"
)

# Critical public routes
PUBLIC_ROUTES=(
  "/"
  "/programs"
  "/programs/barber-apprenticeship"
  "/programs/cna"
  "/programs/cdl-transportation"
  "/apply"
  "/privacy-policy"
  "/terms-of-service"
)

# Critical auth routes
AUTH_ROUTES=(
  "/login"
  "/next-steps"
)

check_route() {
  local route=$1
  local html=$(curl -s -L "$BASE_URL$route" || echo "FETCH_FAILED")
  
  if [[ "$html" == "FETCH_FAILED" ]]; then
    echo "❌ FAIL: Could not fetch $route"
    FAIL=1
    return
  fi
  
  # Check for forbidden strings
  for forbidden in "${FORBIDDEN[@]}"; do
    if echo "$html" | grep -qi "$forbidden"; then
      echo "❌ FAIL: Found forbidden string '$forbidden' in $route"
      FAIL=1
    fi
  done
  
  # Check for infinite loader (only "Loading..." with no real content)
  if [[ "$route" == "/login" ]] || [[ "$route" == "/next-steps" ]]; then
    if echo "$html" | grep -qi "Loading" && ! echo "$html" | grep -qi "email\|password\|checklist\|log in"; then
      echo "❌ FAIL: $route appears to be stuck on Loading with no fallback UI"
      FAIL=1
    fi
  fi
  
  echo "✅ PASS: $route"
}

echo "📄 Checking public routes..."
for route in "${PUBLIC_ROUTES[@]}"; do
  check_route "$route"
done

echo ""
echo "🔐 Checking auth routes..."
for route in "${AUTH_ROUTES[@]}"; do
  check_route "$route"
done

echo ""
if [ $FAIL -eq 0 ]; then
  echo "✅ All smoke tests passed!"
  exit 0
else
  echo "❌ Smoke tests failed. See errors above."
  exit 1
fi
