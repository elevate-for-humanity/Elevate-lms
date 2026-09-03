#!/bin/bash

# Test Enrollment Approval Endpoint
# This script tests the approval endpoint with a real enrollment

ENROLLMENT_ID="6bec5482-60ae-48d1-bfbf-3145779700b3"

echo "=========================================="
echo "ENROLLMENT APPROVAL TEST"
echo "=========================================="
echo ""
echo "Enrollment ID: $ENROLLMENT_ID"
echo ""

BASE_URL="${NEXT_PUBLIC_SITE_URL:-}"
if [ -z "$BASE_URL" ]; then
  echo "ERROR: NEXT_PUBLIC_SITE_URL is not set. Run: bash .devcontainer/setup-env.sh"
  exit 1
fi
API_URL="${BASE_URL}/api/enroll/approve"
echo "API URL: $API_URL"
if true; then
fi

echo ""
echo "=========================================="
echo "STEP 1: Get Admin JWT Token"
echo "=========================================="
echo ""
echo "You need to provide an admin JWT token."
echo "Options:"
echo "  1. Login as admin at /admin-login"
echo "  2. Get token from browser DevTools > Application > Cookies > sb-access-token"
echo "  3. Or use Supabase service_role key (not recommended for production)"
echo ""
read -p "Enter your admin JWT token: " ADMIN_TOKEN
echo ""

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ No token provided. Exiting."
  exit 1
fi

echo "=========================================="
echo "STEP 2: Call Approval Endpoint"
echo "=========================================="
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"enrollment_id\":\"$ENROLLMENT_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Approval endpoint succeeded"
else
  echo "❌ Approval endpoint failed"
  echo ""
  echo "Common issues:"
  echo "  - 401: Token is invalid or expired"
  echo "  - 403: User is not admin or super_admin"
  echo "  - 404: Enrollment not found (check table name: program_enrollments)"
  echo "  - 400: Enrollment status is not pre-approval state"
  exit 1
fi

echo ""
echo "=========================================="
echo "STEP 3: Verification Queries"
echo "=========================================="
echo ""
echo "Run these in Supabase SQL Editor:"
echo ""
echo "-- 1) Check enrollment status"
echo "SELECT id, status, updated_at"
echo "FROM public.program_enrollments"
echo "WHERE id = '$ENROLLMENT_ID';"
echo ""
echo "-- 2) Check profile enrollment_status"
echo "SELECT p.id, p.enrollment_status, p.updated_at"
echo "FROM public.profiles p"
echo "WHERE p.id = 'b2ecf623-2873-4680-8034-583c5081e7e9';"
echo ""
echo "-- 3) Check enrollment steps generated"
echo "SELECT COUNT(*) AS steps_count"
echo "FROM public.enrollment_steps"
echo "WHERE enrollment_id = '$ENROLLMENT_ID';"
echo ""
echo "=========================================="
echo "Expected Results:"
echo "=========================================="
echo "1. program_enrollments.status = 'READY_TO_START'"
echo "2. profiles.enrollment_status = 'active'"
echo "3. enrollment_steps.COUNT > 0 (if blueprint exists)"
echo ""
