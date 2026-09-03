#!/bin/bash
# License Lockout Verification Script
# Run after deploying to verify lockout works correctly

BASE_URL="${1:-http://localhost:3000}"

echo "=== LICENSE LOCKOUT VERIFICATION ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Public pages should be accessible
echo "1. Testing public pages (should return 200)..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200" && echo "   ✓ Home page accessible" || echo "   ✗ Home page blocked"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/programs" | grep -q "200" && echo "   ✓ Programs page accessible" || echo "   ✗ Programs page blocked"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/license-suspended" | grep -q "200" && echo "   ✓ Suspension page accessible" || echo "   ✗ Suspension page blocked"

# Test 2: Webhook should be accessible (no auth)
echo ""
echo "2. Testing webhook endpoint (should return 400 - missing signature, not 401/403)..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/license/webhook")
if [ "$WEBHOOK_STATUS" = "400" ]; then
  echo "   ✓ Webhook accessible (returns 400 for missing signature)"
else
  echo "   ✗ Webhook returned $WEBHOOK_STATUS (expected 400)"
fi

# Test 3: Protected API without auth should return 401
echo ""
echo "3. Testing protected API without auth (should return 401 or 307)..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/users")
if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "307" ]; then
  echo "   ✓ Protected API requires auth (returns $API_STATUS)"
else
  echo "   ✗ Protected API returned $API_STATUS (expected 401 or 307)"
fi

# Test 4: Protected page without auth should redirect to login
echo ""
echo "4. Testing protected page without auth (should redirect to login)..."
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin")
if [ "$PAGE_STATUS" = "307" ] || [ "$PAGE_STATUS" = "302" ]; then
  echo "   ✓ Protected page redirects to login (returns $PAGE_STATUS)"
else
  echo "   ✗ Protected page returned $PAGE_STATUS (expected 307 or 302)"
fi

echo ""
echo "=== MANUAL TESTS REQUIRED ==="
echo ""
echo "5. Test with ACTIVE license tenant:"
echo "   - Login as tenant admin"
echo "   - Verify /admin loads successfully"
echo "   - Verify /api/admin/users returns data"
echo ""
echo "6. Test with SUSPENDED license tenant:"
echo "   - Suspend license in database: UPDATE licenses SET status='suspended' WHERE tenant_id='xxx'"
echo "   - Login as tenant admin"
echo "   - Verify redirect to /license-suspended"
echo "   - Verify /api/admin/users returns 403"
echo ""
echo "7. Test Stripe webhook simulation:"
echo "   - Use Stripe CLI: stripe trigger invoice.payment_failed"
echo "   - Verify license status changes to 'suspended'"
echo "   - Use Stripe CLI: stripe trigger invoice.payment_succeeded"
echo "   - Verify license status changes to 'active'"
echo ""
echo "=== STRIPE CLI COMMANDS ==="
echo "stripe listen --forward-to $BASE_URL/api/license/webhook"
echo "stripe trigger invoice.payment_failed"
echo "stripe trigger invoice.payment_succeeded"
echo "stripe trigger customer.subscription.deleted"
