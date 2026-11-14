#!/bin/bash
# Comprehensive deployment validation

set -e

echo "=== DEPLOYMENT VALIDATION SUITE ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

# Test 1: Build
echo "1. Testing build..."
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Build PASSED${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ Build FAILED${NC}"
  ((FAIL++))
fi

# Test 2: Lint
echo "2. Testing lint..."
LINT_OUTPUT=$(npm run lint 2>&1)
ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -oP '\d+(?= errors)' || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ Lint PASSED (0 errors)${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ Lint FAILED ($ERROR_COUNT errors)${NC}"
  ((FAIL++))
fi

# Test 3: TypeCheck (informational)
echo "3. Testing TypeCheck (informational)..."
TS_ERROR_COUNT=$(npm run type-check 2>&1 | grep -c "error TS" || echo "0")
if [ "$TS_ERROR_COUNT" -le 210 ]; then
  echo -e "${YELLOW}⚠️  TypeCheck: $TS_ERROR_COUNT errors (baseline ~206, acceptable)${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ TypeCheck: $TS_ERROR_COUNT errors (baseline exceeded)${NC}"
  ((FAIL++))
fi

# Test 4: Critical routes exist
echo "4. Testing critical routes..."
ROUTES_MISSING=0
for route in \
  "app/page.tsx" \
  "app/programs/page.tsx" \
  "app/apply/full/page.tsx" \
  "app/lms/(app)/dashboard/page.tsx" \
  "app/program-holder/dashboard/page.tsx" \
  "app/employer/dashboard/page.tsx" \
  "app/admin/dashboard/page.tsx"; do
  if [ ! -f "$route" ]; then
    echo -e "${RED}  ❌ Missing: $route${NC}"
    ((ROUTES_MISSING++))
  fi
done

if [ "$ROUTES_MISSING" -eq 0 ]; then
  echo -e "${GREEN}✅ All critical routes exist${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ $ROUTES_MISSING critical routes missing${NC}"
  ((FAIL++))
fi

# Test 5: Documentation exists
echo "5. Testing documentation..."
DOCS_MISSING=0
for doc in \
  "docs/typecheck-status.md" \
  "docs/flow-verification.md" \
  "CONTRIBUTING.md" \
  "reports/FINAL-EXECUTION-SUMMARY.md"; do
  if [ ! -f "$doc" ]; then
    echo -e "${RED}  ❌ Missing: $doc${NC}"
    ((DOCS_MISSING++))
  fi
done

if [ "$DOCS_MISSING" -eq 0 ]; then
  echo -e "${GREEN}✅ All documentation exists${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ $DOCS_MISSING documentation files missing${NC}"
  ((FAIL++))
fi

# Test 6: No critical placeholders
echo "6. Testing for critical placeholders..."
if node scripts/final-validation.mjs > /dev/null 2>&1; then
  echo -e "${GREEN}✅ No critical placeholders found${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ Critical placeholders detected${NC}"
  ((FAIL++))
fi

# Summary
echo ""
echo "=== VALIDATION SUMMARY ==="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}✅ ALL VALIDATIONS PASSED - DEPLOYMENT APPROVED${NC}"
  exit 0
else
  echo -e "${RED}❌ VALIDATION FAILED - FIX ISSUES BEFORE DEPLOYMENT${NC}"
  exit 1
fi
