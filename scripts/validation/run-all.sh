#!/bin/bash
# STEP 7: Run all enterprise validation tests

echo "=========================================="
echo "  Enterprise Validation Suite"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

run_test() {
  local name=$1
  local script=$2
  
  echo "Running: $name"
  echo "---"
  
  if npx tsx "$script" 2>&1; then
    echo "✅ $name: PASSED"
    ((PASSED++))
  else
    echo "❌ $name: FAILED"
    ((FAILED++))
  fi
  
  echo ""
}

# Run all validation tests
run_test "Idempotency" "scripts/validation/idempotency-test.ts"
run_test "Failure Recovery" "scripts/validation/failure-recovery-test.ts"
run_test "License Enforcement" "scripts/validation/license-enforcement-test.ts"
run_test "Refund & Dispute" "scripts/validation/refund-dispute-test.ts"
run_test "Tenant Isolation" "scripts/validation/tenant-isolation-test.ts"
run_test "Traceability" "scripts/validation/traceability-test.ts"

echo "=========================================="
echo "  Results: $PASSED passed, $FAILED failed"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo "✅ All validations passed!"
  exit 0
else
  echo "❌ Some validations failed"
  exit 1
fi
