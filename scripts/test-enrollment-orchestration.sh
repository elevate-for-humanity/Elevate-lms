#!/bin/bash
# ============================================================================
# COMPLETE END-TO-END ORCHESTRATION TEST SCRIPT
# ============================================================================
# This script automates the entire test process:
# 1. Creates test data
# 2. Calls the approval API
# 3. Verifies the results
# ============================================================================

set -e

echo "=== AUTO-ENROLLMENT ORCHESTRATION TEST ==="
echo ""

# Configuration
SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
DATABASE_URL="${DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

# Check for required tools
if ! command -v psql &> /dev/null; then
  echo "❌ ERROR: psql not found. Please install PostgreSQL client."
  exit 1
fi

if ! command -v curl &> /dev/null; then
  echo "❌ ERROR: curl not found. Please install curl."
  exit 1
fi

echo "Step 1: Creating test data..."
echo ""

# Run the SQL script to create test data
psql "$DATABASE_URL" -f scripts/test-enrollment-orchestration.sql 2>&1 | grep -E "NOTICE|ERROR|enrollment_id|user_id|program_id" || true

echo ""
echo "Step 2: Getting test enrollment ID..."
echo ""

# Get the enrollment ID
ENROLLMENT_ID=$(psql "$DATABASE_URL" -t -c "
  SELECT id 
  FROM enrollments 
  WHERE status = 'pending' 
  ORDER BY created_at DESC 
  LIMIT 1;
" | xargs)

if [ -z "$ENROLLMENT_ID" ]; then
  echo "❌ ERROR: No pending enrollment found"
  exit 1
fi

echo "✅ Found pending enrollment: $ENROLLMENT_ID"
echo ""

# Check for JWT token
if [ -z "$ADMIN_JWT_TOKEN" ]; then
  echo "⚠️  WARNING: ADMIN_JWT_TOKEN environment variable not set"
  echo ""
  echo "To complete the test, you need to:"
  echo "1. Get a JWT token for an admin or program_holder user"
  echo "2. Run this command:"
  echo ""
  echo "export ADMIN_JWT_TOKEN='your-jwt-token-here'"
  echo "$0"
  echo ""
  echo "Or run the curl command manually:"
  echo ""
  echo "curl -X POST $SITE_URL/api/enroll/approve \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
  echo "  -d '{\"enrollment_id\": \"$ENROLLMENT_ID\"}'"
  echo ""
  exit 0
fi

echo "Step 3: Calling approval API..."
echo ""

# Call the approval endpoint
RESPONSE=$(curl -s -X POST "$SITE_URL/api/enroll/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -d "{\"enrollment_id\": \"$ENROLLMENT_ID\"}")

echo "API Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ API call successful"
else
  echo "❌ API call failed"
  exit 1
fi

echo ""
echo "Step 4: Verifying results..."
echo ""

# Verify enrollment status
echo "4a. Checking enrollment status..."
psql "$DATABASE_URL" -c "
  SELECT 
    e.id as enrollment_id,
    e.status,
    CASE WHEN e.status = 'active' THEN '✅ PASS' ELSE '❌ FAIL' END as result
  FROM enrollments e
  WHERE e.id = '$ENROLLMENT_ID';
"

# Verify profile status
echo ""
echo "4b. Checking profile enrollment_status..."
psql "$DATABASE_URL" -c "
  SELECT 
    p.id as user_id,
    p.enrollment_status,
    CASE WHEN p.enrollment_status = 'active' THEN '✅ PASS' ELSE '❌ FAIL' END as result
  FROM profiles p
  WHERE p.id = (SELECT user_id FROM enrollments WHERE id = '$ENROLLMENT_ID');
"

# Verify steps generated
echo ""
echo "4c. Checking enrollment steps..."
psql "$DATABASE_URL" -c "
  SELECT 
    COUNT(*) as steps_generated,
    CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as result
  FROM enrollment_steps
  WHERE enrollment_id = '$ENROLLMENT_ID';
"

# Show step details
echo ""
echo "4d. Step details..."
psql "$DATABASE_URL" -c "
  SELECT 
    es.sequence_order,
    plp.provider_name,
    es.status,
    CASE 
      WHEN es.sequence_order = 1 AND es.status = 'in_progress' THEN '✅ First step started'
      WHEN es.status = 'pending' THEN '✅ Pending'
      ELSE '⚠️  ' || es.status
    END as validation
  FROM enrollment_steps es
  JOIN partner_lms_providers plp ON plp.id = es.provider_id
  WHERE es.enrollment_id = '$ENROLLMENT_ID'
  ORDER BY es.sequence_order;
"

# Check audit log
echo ""
echo "4e. Checking audit log..."
psql "$DATABASE_URL" -c "
  SELECT 
    al.action,
    al.metadata->>'steps_generated' as steps_generated,
    al.created_at,
    CASE WHEN al.action = 'enrollment_approved' THEN '✅ PASS' ELSE '❌ FAIL' END as result
  FROM audit_logs al
  WHERE al.entity = 'enrollment'
    AND al.entity_id = '$ENROLLMENT_ID'
  ORDER BY al.created_at DESC
  LIMIT 1;
"

echo ""
echo "=== TEST COMPLETE ==="
echo ""
echo "Summary:"
echo "  - Enrollment ID: $ENROLLMENT_ID"
echo "  - All verification queries executed"
echo "  - Check results above for ✅ PASS or ❌ FAIL"
echo ""
