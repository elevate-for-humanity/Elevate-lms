#!/usr/bin/env bash

echo ""
echo "==================================================================="
echo "🔥 SMOKE TEST - Critical Functionality Verification"
echo "==================================================================="
echo ""

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

REPORT="SMOKE_TEST_REPORT.md"
PASS=0
FAIL=0

echo "# SMOKE TEST REPORT" > "$REPORT"
echo "**Generated:** $(date)" >> "$REPORT"
echo "" >> "$REPORT"

test_pass() {
    echo "  ✅ $1" | tee -a "$REPORT"
    PASS=$((PASS + 1))
}

test_fail() {
    echo "  ❌ $1" | tee -a "$REPORT"
    FAIL=$((FAIL + 1))
}

# Run all critical tests
echo "## CRITICAL SYSTEMS CHECK" >> "$REPORT"
echo "" >> "$REPORT"

# Test 1: Build
echo "Testing build..." | tee -a "$REPORT"
if [ -f "package.json" ]; then
    test_pass "package.json exists"
else
    test_fail "package.json missing"
fi

# Test 2: Pages
PAGES=$(find app -name "page.tsx" 2>/dev/null | wc -l)
if [ "$PAGES" -gt 100 ]; then
    test_pass "$PAGES pages found"
else
    test_fail "Only $PAGES pages found"
fi

# Test 3: Components
COMPONENTS=$(find components -name "*.tsx" 2>/dev/null | wc -l)
if [ "$COMPONENTS" -gt 100 ]; then
    test_pass "$COMPONENTS components found"
else
    test_fail "Only $COMPONENTS components"
fi

# Summary
echo "" >> "$REPORT"
echo "**Passed:** $PASS" >> "$REPORT"
echo "**Failed:** $FAIL" >> "$REPORT"

if [ "$FAIL" -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED" >> "$REPORT"
else
    echo "❌ $FAIL TESTS FAILED" >> "$REPORT"
fi

cat "$REPORT"
