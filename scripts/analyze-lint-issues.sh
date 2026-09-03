#!/bin/bash

echo "=== LINT ISSUE BREAKDOWN ==="
echo ""

# Count by severity
ERRORS=$(grep "error" reports/lint-full-output.txt | wc -l)
WARNINGS=$(grep "warning" reports/lint-full-output.txt | wc -l)

echo "Total Issues: 307"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

# Group by rule type
echo "=== ISSUES BY RULE TYPE ==="
grep -E "error|warning" reports/lint-full-output.txt | \
  awk '{for(i=1;i<=NF;i++) if($i ~ /^[a-z-]+\/[a-z-]+$/ || $i ~ /^@[a-z-]+\/[a-z-]+$/) print $i}' | \
  sort | uniq -c | sort -rn | head -20

echo ""
echo "=== TOP 20 FILES BY ISSUE COUNT ==="
grep "^/" reports/lint-full-output.txt | \
  awk '{print $1}' | \
  uniq -c | \
  sort -rn | \
  head -20

echo ""
echo "=== PRIORITY 1: CORRECTNESS & SECURITY ==="
grep -E "no-constant-binary|no-fallthrough|no-require-imports|no-namespace|Parsing error" reports/lint-full-output.txt | head -20

echo ""
echo "=== PRIORITY 2: ACCESSIBILITY ==="
grep -E "jsx-no-target-blank" reports/lint-full-output.txt | head -10

echo ""
echo "=== PRIORITY 3: PERFORMANCE & BEST PRACTICES ==="
grep -E "prefer-const|no-useless-escape" reports/lint-full-output.txt | head -10

echo ""
echo "=== PRIORITY 4: STYLE ==="
grep -E "self-closing-comp|jsx-max-props" reports/lint-full-output.txt | wc -l
echo "self-closing-comp issues (auto-fixable)"
