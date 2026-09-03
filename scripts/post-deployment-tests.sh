#!/bin/bash

# Post-Deployment Test Suite
# Run this after deploying to production

PRODUCTION_URL="https://www.elevateforhumanity.org"
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).txt"

echo "🧪 Post-Deployment Test Suite" | tee "$RESULTS_FILE"
echo "==============================" | tee -a "$RESULTS_FILE"
echo "URL: $PRODUCTION_URL" | tee -a "$RESULTS_FILE"
echo "Time: $(date)" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

PASSED=0
FAILED=0

# Helper function to test URL
test_url() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  
  echo -n "Testing $name... " | tee -a "$RESULTS_FILE"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
  
  if [ "$response" = "$expected_code" ]; then
    echo "✅ PASS (HTTP $response)" | tee -a "$RESULTS_FILE"
    ((PASSED++))
    return 0
  else
    echo "❌ FAIL (HTTP $response, expected $expected_code)" | tee -a "$RESULTS_FILE"
    ((FAILED++))
    return 1
  fi
}

# Test 1: Critical Pages
echo "Test 1: Critical Pages" | tee -a "$RESULTS_FILE"
echo "─────────────────────" | tee -a "$RESULTS_FILE"
test_url "Homepage" "$PRODUCTION_URL"
test_url "Apply Page" "$PRODUCTION_URL/apply"
test_url "Programs Page" "$PRODUCTION_URL/programs"
test_url "Contact Page" "$PRODUCTION_URL/contact"
test_url "About Page" "$PRODUCTION_URL/about"
echo "" | tee -a "$RESULTS_FILE"

# Test 2: LMS Pages
echo "Test 2: LMS Pages" | tee -a "$RESULTS_FILE"
echo "─────────────────" | tee -a "$RESULTS_FILE"
test_url "LMS Landing" "$PRODUCTION_URL/lms"
test_url "LMS Dashboard" "$PRODUCTION_URL/lms/dashboard" 302  # Redirects to login
echo "" | tee -a "$RESULTS_FILE"

# Test 3: Legal Pages
echo "Test 3: Legal Pages" | tee -a "$RESULTS_FILE"
echo "───────────────────" | tee -a "$RESULTS_FILE"
test_url "Privacy Policy" "$PRODUCTION_URL/privacy-policy"
test_url "Terms of Service" "$PRODUCTION_URL/terms-of-service"
test_url "Accessibility" "$PRODUCTION_URL/accessibility"
echo "" | tee -a "$RESULTS_FILE"

# Test 4: API Endpoints
echo "Test 4: API Endpoints" | tee -a "$RESULTS_FILE"
echo "────────────────────" | tee -a "$RESULTS_FILE"
test_url "Health Check" "$PRODUCTION_URL/api/health"
echo "" | tee -a "$RESULTS_FILE"

# Test 5: SEO Files
echo "Test 5: SEO Files" | tee -a "$RESULTS_FILE"
echo "────────────────" | tee -a "$RESULTS_FILE"
test_url "Sitemap" "$PRODUCTION_URL/sitemap.xml"
test_url "Robots.txt" "$PRODUCTION_URL/robots.txt"
echo "" | tee -a "$RESULTS_FILE"

# Test 6: New Pages (Previously Missing)
echo "Test 6: New Pages" | tee -a "$RESULTS_FILE"
echo "────────────────" | tee -a "$RESULTS_FILE"
test_url "Trauma Recovery" "$PRODUCTION_URL/rise-foundation/trauma-recovery"
test_url "Addiction Rehab" "$PRODUCTION_URL/rise-foundation/addiction-rehabilitation"
test_url "Divorce Support" "$PRODUCTION_URL/rise-foundation/divorce-support"
test_url "Mental Wellness" "$PRODUCTION_URL/nonprofit/mental-wellness"
test_url "Healing Products" "$PRODUCTION_URL/nonprofit/healing-products"
echo "" | tee -a "$RESULTS_FILE"

# Test 7: Response Time
echo "Test 7: Performance" | tee -a "$RESULTS_FILE"
echo "──────────────────" | tee -a "$RESULTS_FILE"
echo -n "Homepage load time... " | tee -a "$RESULTS_FILE"
load_time=$(curl -s -o /dev/null -w "%{time_total}" "$PRODUCTION_URL")
echo "${load_time}s" | tee -a "$RESULTS_FILE"

if (( $(echo "$load_time < 3.0" | bc -l) )); then
  echo "✅ PASS (< 3s)" | tee -a "$RESULTS_FILE"
  ((PASSED++))
else
  echo "⚠️  WARNING (> 3s)" | tee -a "$RESULTS_FILE"
fi
echo "" | tee -a "$RESULTS_FILE"

# Test 8: SSL Certificate
echo "Test 8: SSL Certificate" | tee -a "$RESULTS_FILE"
echo "──────────────────────" | tee -a "$RESULTS_FILE"
echo -n "SSL certificate... " | tee -a "$RESULTS_FILE"
ssl_check=$(echo | openssl s_client -servername www.elevateforhumanity.org -connect www.elevateforhumanity.org:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ -n "$ssl_check" ]; then
  echo "✅ PASS (Valid)" | tee -a "$RESULTS_FILE"
  echo "$ssl_check" | tee -a "$RESULTS_FILE"
  ((PASSED++))
else
  echo "❌ FAIL (Invalid or not found)" | tee -a "$RESULTS_FILE"
  ((FAILED++))
fi
echo "" | tee -a "$RESULTS_FILE"

# Test 9: Security Headers
echo "Test 9: Security Headers" | tee -a "$RESULTS_FILE"
echo "───────────────────────" | tee -a "$RESULTS_FILE"

check_header() {
  local header="$1"
  echo -n "Checking $header... " | tee -a "$RESULTS_FILE"
  
  if curl -s -I "$PRODUCTION_URL" | grep -i "$header" > /dev/null; then
    echo "✅ PASS" | tee -a "$RESULTS_FILE"
    ((PASSED++))
  else
    echo "❌ FAIL" | tee -a "$RESULTS_FILE"
    ((FAILED++))
  fi
}

check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "Strict-Transport-Security"
echo "" | tee -a "$RESULTS_FILE"

# Test 10: Mobile Responsiveness
echo "Test 10: Mobile Check" | tee -a "$RESULTS_FILE"
echo "────────────────────" | tee -a "$RESULTS_FILE"
echo -n "Mobile viewport meta tag... " | tee -a "$RESULTS_FILE"

if curl -s "$PRODUCTION_URL" | grep -i "viewport" > /dev/null; then
  echo "✅ PASS" | tee -a "$RESULTS_FILE"
  ((PASSED++))
else
  echo "❌ FAIL" | tee -a "$RESULTS_FILE"
  ((FAILED++))
fi
echo "" | tee -a "$RESULTS_FILE"

# Summary
echo "═══════════════════════════════════" | tee -a "$RESULTS_FILE"
echo "TEST SUMMARY" | tee -a "$RESULTS_FILE"
echo "═══════════════════════════════════" | tee -a "$RESULTS_FILE"
echo "Passed: $PASSED" | tee -a "$RESULTS_FILE"
echo "Failed: $FAILED" | tee -a "$RESULTS_FILE"
echo "Total: $((PASSED + FAILED))" | tee -a "$RESULTS_FILE"

if [ $FAILED -eq 0 ]; then
  echo "" | tee -a "$RESULTS_FILE"
  echo "✅ ALL TESTS PASSED" | tee -a "$RESULTS_FILE"
  echo "" | tee -a "$RESULTS_FILE"
  echo "Your site is working correctly!" | tee -a "$RESULTS_FILE"
  exit 0
else
  echo "" | tee -a "$RESULTS_FILE"
  echo "❌ SOME TESTS FAILED" | tee -a "$RESULTS_FILE"
  echo "" | tee -a "$RESULTS_FILE"
  echo "Review the failures above and fix them." | tee -a "$RESULTS_FILE"
  exit 1
fi
