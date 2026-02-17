#!/bin/bash
# Quality Gates - Prevents common production-breaking patterns
# Run before commit and in CI

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "🔍 Running Quality Gates..."
echo ""

# =============================================================================
# CHECK 1: useSearchParams without Suspense
# =============================================================================
echo "Checking for useSearchParams without Suspense boundary..."

# Find all page.tsx files that use useSearchParams
FILES_WITH_SEARCH_PARAMS=$(grep -rl "useSearchParams" --include="page.tsx" app/ 2>/dev/null || true)

for file in $FILES_WITH_SEARCH_PARAMS; do
  # Check if file has Suspense import AND wraps the component
  HAS_SUSPENSE_IMPORT=$(grep -c "Suspense" "$file" 2>/dev/null || echo "0")
  
  if [ "$HAS_SUSPENSE_IMPORT" -lt 2 ]; then
    echo -e "${RED}❌ FAIL:${NC} $file"
    echo "   Uses useSearchParams() but missing Suspense boundary"
    echo "   Fix: Wrap component using useSearchParams in <Suspense>"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}✅ All useSearchParams usage has Suspense boundaries${NC}"
fi
echo ""

# =============================================================================
# CHECK 2: Top-level API client instantiation
# =============================================================================
echo "Checking for top-level API client instantiation..."

# Pattern: const xyz = new OpenAI( at module level (not inside function)
OPENAI_ISSUES=$(grep -rn "^const.*= new OpenAI(" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null || true)

if [ -n "$OPENAI_ISSUES" ]; then
  echo -e "${RED}❌ FAIL:${NC} Top-level OpenAI client found:"
  echo "$OPENAI_ISSUES" | while read line; do
    echo "   $line"
  done
  echo "   Fix: Use lazy initialization inside functions"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No top-level OpenAI instantiation${NC}"
fi

# Check for top-level Stripe client
STRIPE_ISSUES=$(grep -rn "^const.*= new Stripe(" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null || true)

if [ -n "$STRIPE_ISSUES" ]; then
  echo -e "${YELLOW}⚠️  WARNING:${NC} Top-level Stripe client found (may cause build issues):"
  echo "$STRIPE_ISSUES" | while read line; do
    echo "   $line"
  done
fi
echo ""

# =============================================================================
# CHECK 3: Hardcoded placeholder values in production code
# =============================================================================
echo "Checking for placeholder values..."

PLACEHOLDER_ISSUES=$(grep -rn "Content-key\|placeholder\|CHANGEME\|TODO.*fix\|FIXME" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null | grep -v "// \|/\*\|test\|spec\|\.test\.\|\.spec\." || true)

if [ -n "$PLACEHOLDER_ISSUES" ]; then
  echo -e "${YELLOW}⚠️  WARNING:${NC} Possible placeholder values found:"
  echo "$PLACEHOLDER_ISSUES" | head -10
fi
echo ""

# =============================================================================
# CHECK 4: Missing error boundaries in critical pages
# =============================================================================
echo "Checking for error.tsx in critical routes..."

CRITICAL_ROUTES=("app/checkout" "app/apply" "app/lms" "app/store" "app/login")

for route in "${CRITICAL_ROUTES[@]}"; do
  if [ -d "$route" ] && [ ! -f "$route/error.tsx" ]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Missing error.tsx in $route"
  fi
done
echo ""

# =============================================================================
# CHECK 5: Malformed imports (e.g. two import statements merged on one line)
# =============================================================================
echo "Checking for malformed import lines..."

MALFORMED_IMPORTS=$(grep -rn "^import {.*from.*import\|^import.*};.*} from" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null || true)

if [ -n "$MALFORMED_IMPORTS" ]; then
  echo -e "${RED}❌ FAIL:${NC} Malformed import lines found (likely bad merge/codegen):"
  echo "$MALFORMED_IMPORTS" | while read line; do
    echo "   $line"
  done
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No malformed imports detected${NC}"
fi
echo ""

# =============================================================================
# CHECK 6: Console.log in production code
# =============================================================================
echo "Checking for console.log statements..."

CONSOLE_LOGS=$(grep -rn "console\.log(" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null | grep -v "// \|test\|spec\|\.test\.\|\.spec\.\|logger" | wc -l)

if [ "$CONSOLE_LOGS" -gt 20 ]; then
  echo -e "${YELLOW}⚠️  WARNING:${NC} Found $CONSOLE_LOGS console.log statements"
  echo "   Consider using the logger utility instead"
fi
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=========================================="
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}❌ Quality Gates FAILED: $ERRORS error(s)${NC}"
  echo "Fix the issues above before committing."
  exit 1
else
  echo -e "${GREEN}✅ Quality Gates PASSED${NC}"
  exit 0
fi
