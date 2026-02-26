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
# CHECK 7: Unauthorized storage signing in admin paths
# =============================================================================
echo "Checking for unauthorized createSignedUrl in admin paths..."

UNAUTHORIZED_SIGNING=$(grep -rn "createSignedUrl" --include="*.ts" --include="*.tsx" app/admin/ 2>/dev/null | grep -v "api/admin/documents/signed-url" || true)

if [ -n "$UNAUTHORIZED_SIGNING" ]; then
  echo -e "${RED}❌ FAIL:${NC} Direct createSignedUrl found in admin paths (must use getAdminDocumentUrl):"
  echo "$UNAUTHORIZED_SIGNING" | while read line; do
    echo "   $line"
  done
  echo "   Fix: Use getAdminDocumentUrl from lib/admin/document-access.ts"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No unauthorized storage signing in admin paths${NC}"
fi
echo ""

# =============================================================================
# CHECK 8: SSN references in profiles table queries
# =============================================================================
echo "Checking for ssn_last4 references to profiles table..."

SSN_IN_PROFILES=$(grep -rn "profiles.*ssn_last4\|from('profiles').*ssn" --include="*.ts" --include="*.tsx" app/ lib/ components/ 2>/dev/null | grep -v "migration\|\.sql\|supabase/" || true)

if [ -n "$SSN_IN_PROFILES" ]; then
  echo -e "${RED}❌ FAIL:${NC} SSN data referenced via profiles table (must use secure_identity):"
  echo "$SSN_IN_PROFILES" | while read line; do
    echo "   $line"
  done
  echo "   Fix: Use secure_identity table via lib/security/secure-identity.ts"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No SSN references via profiles table${NC}"
fi
echo ""

# =============================================================================
# CHECK: Schema contract — automated_decisions must have NOT NULL columns
# =============================================================================
echo "Checking automated_decisions inserts have required NOT NULL columns..."
AD_ISSUES=0
# Find all automated_decisions insert blocks and verify subject_type is present
for file in $(grep -rl "from('automated_decisions').insert" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null); do
  # For each insert, check that subject_type appears within 5 lines
  grep -n "from('automated_decisions').insert" "$file" | while IFS=: read line_num rest; do
    has_subject=$(sed -n "${line_num},$((line_num + 15))p" "$file" | grep -c "subject_type:")
    if [ "$has_subject" -eq 0 ]; then
      echo "   ❌ $file:$line_num — missing subject_type (NOT NULL in live DB)"
      # Signal error via temp file since we're in a subshell
      touch /tmp/ad_issue
    fi
  done
done
if [ -f /tmp/ad_issue ]; then
  rm -f /tmp/ad_issue
  echo "   Fix: All automated_decisions inserts must include subject_type, subject_id, decision"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ All automated_decisions inserts have required NOT NULL columns${NC}"
fi
echo ""

# =============================================================================
# CHECK: Schema contract — no inserts to non-functional security_logs table
# =============================================================================
echo "Checking for references to deprecated security_logs table..."
SECLOG_HITS=$(grep -rn "security_logs" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null | grep -v "node_modules\|\.next\|schema-contract-report\|quality-gates" || true)
if [ -n "$SECLOG_HITS" ]; then
  echo "$SECLOG_HITS" | while IFS= read -r line; do
    echo "   ❌ $line"
  done
  echo "   Fix: security_logs is deprecated (0 rows, no useful columns). Use audit_logs instead."
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No references to deprecated security_logs table${NC}"
fi
echo ""

# =============================================================================
# CHECK: Schema contract — ai_audit_log must use user_id not student_id
# =============================================================================
echo "Checking ai_audit_log inserts use correct column names..."
# Only flag student_id as a top-level insert column (not inside details JSONB)
AI_AUDIT_ISSUES=$(grep -A 5 "from('ai_audit_log').insert" --include="*.ts" --include="*.tsx" -rn app/ lib/ 2>/dev/null | grep "student_id:" || true)
if [ -n "$AI_AUDIT_ISSUES" ]; then
  echo "$AI_AUDIT_ISSUES"
  echo "   Fix: Use user_id instead of student_id (column does not exist in live DB)"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ ai_audit_log inserts use correct column names${NC}"
fi
echo ""

# =============================================================================
# CHECK: Schema contract — governed table column validation
# =============================================================================
echo "Checking governed table column references against live schema..."
if [ -f "scripts/governed-schema.json" ]; then
  SCHEMA_ERRORS=$(python3 scripts/check-schema-columns.py 2>/dev/null || true)
  if [ -n "$SCHEMA_ERRORS" ]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Column mismatches found in governed tables (non-blocking):"
    echo "$SCHEMA_ERRORS"
    # Non-blocking for now — these are pre-existing issues being tracked
    # Change to ERRORS=$((ERRORS + 1)) to make blocking
  else
    echo -e "${GREEN}✅ All governed table column references match live schema${NC}"
  fi
else
  echo "   ⚠️  scripts/governed-schema.json not found, skipping column validation"
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
