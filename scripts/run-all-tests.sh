#!/bin/bash
# Comprehensive test suite for Elevate for Humanity

set -e

SITE_URL="https://www.elevateforhumanity.org"
REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).md"

echo "🧪 Running Comprehensive Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create report header
cat > "$REPORT_FILE" << EOF
# Test Report - Elevate for Humanity
**Generated:** $(date)
**Site:** $SITE_URL

---

EOF

# 1. Next.js Build Test
echo "📦 1. Next.js Build Test"
echo "## 1. Next.js Build Test" >> "$REPORT_FILE"
if npm run build > /tmp/build-test.log 2>&1; then
    echo "✅ Build successful"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    echo "❌ Build failed"
    echo "❌ **Status:** FAILED" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    tail -20 /tmp/build-test.log >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi
echo ""

# 2. Performance Tests
echo "⚡ 2. Performance Tests"
echo "## 2. Performance Tests" >> "$REPORT_FILE"

# Check homepage load time
START_TIME=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" --max-time 10)
END_TIME=$(date +%s%N)
LOAD_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

echo "  Homepage HTTP Status: $HTTP_CODE"
echo "  Load Time: ${LOAD_TIME}ms"

if [ "$HTTP_CODE" = "200" ] && [ "$LOAD_TIME" -lt 3000 ]; then
    echo "✅ Performance: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "⚠️  Performance: NEEDS IMPROVEMENT"
    echo "⚠️  **Status:** NEEDS IMPROVEMENT" >> "$REPORT_FILE"
fi
echo "- HTTP Status: $HTTP_CODE" >> "$REPORT_FILE"
echo "- Load Time: ${LOAD_TIME}ms" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 3. Accessibility Tests
echo "♿ 3. Accessibility Tests"
echo "## 3. Accessibility Tests" >> "$REPORT_FILE"

# Check for basic a11y features
CONTENT=$(curl -s "$SITE_URL")

HAS_LANG=$(echo "$CONTENT" | grep -c 'lang="en"' || true)
HAS_SKIP_LINK=$(echo "$CONTENT" | grep -c 'Skip to main content' || true)
HAS_ALT_TAGS=$(echo "$CONTENT" | grep -c 'alt=' || true)

echo "  Language attribute: $HAS_LANG"
echo "  Skip link: $HAS_SKIP_LINK"
echo "  Alt tags found: $HAS_ALT_TAGS"

if [ "$HAS_LANG" -gt 0 ] && [ "$HAS_SKIP_LINK" -gt 0 ] && [ "$HAS_ALT_TAGS" -gt 0 ]; then
    echo "✅ Accessibility: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "⚠️  Accessibility: NEEDS IMPROVEMENT"
    echo "⚠️  **Status:** NEEDS IMPROVEMENT" >> "$REPORT_FILE"
fi
echo "- Language attribute: $HAS_LANG" >> "$REPORT_FILE"
echo "- Skip link: $HAS_SKIP_LINK" >> "$REPORT_FILE"
echo "- Alt tags: $HAS_ALT_TAGS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 4. SEO Tests
echo "🔍 4. SEO Tests"
echo "## 4. SEO Tests" >> "$REPORT_FILE"

HAS_TITLE=$(echo "$CONTENT" | grep -c '<title>' || true)
HAS_META_DESC=$(echo "$CONTENT" | grep -c 'name="description"' || true)
HAS_OG_TAGS=$(echo "$CONTENT" | grep -c 'property="og:' || true)
HAS_CANONICAL=$(echo "$CONTENT" | grep -c 'rel="canonical"' || true)

echo "  Title tag: $HAS_TITLE"
echo "  Meta description: $HAS_META_DESC"
echo "  Open Graph tags: $HAS_OG_TAGS"
echo "  Canonical URL: $HAS_CANONICAL"

if [ "$HAS_TITLE" -gt 0 ] && [ "$HAS_META_DESC" -gt 0 ] && [ "$HAS_OG_TAGS" -gt 0 ]; then
    echo "✅ SEO: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "⚠️  SEO: NEEDS IMPROVEMENT"
    echo "⚠️  **Status:** NEEDS IMPROVEMENT" >> "$REPORT_FILE"
fi
echo "- Title tag: $HAS_TITLE" >> "$REPORT_FILE"
echo "- Meta description: $HAS_META_DESC" >> "$REPORT_FILE"
echo "- Open Graph tags: $HAS_OG_TAGS" >> "$REPORT_FILE"
echo "- Canonical URL: $HAS_CANONICAL" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 5. Security Tests
echo "🔒 5. Security Tests"
echo "## 5. Security Tests" >> "$REPORT_FILE"

# Check security headers
HEADERS=$(curl -s -I "$SITE_URL")

HAS_CSP=$(echo "$HEADERS" | grep -ic 'content-security-policy' || true)
HAS_HSTS=$(echo "$HEADERS" | grep -ic 'strict-transport-security' || true)
HAS_X_FRAME=$(echo "$HEADERS" | grep -ic 'x-frame-options' || true)
HAS_X_CONTENT=$(echo "$HEADERS" | grep -ic 'x-content-type-options' || true)

echo "  Content-Security-Policy: $HAS_CSP"
echo "  Strict-Transport-Security: $HAS_HSTS"
echo "  X-Frame-Options: $HAS_X_FRAME"
echo "  X-Content-Type-Options: $HAS_X_CONTENT"

SECURITY_SCORE=$((HAS_CSP + HAS_HSTS + HAS_X_FRAME + HAS_X_CONTENT))

if [ "$SECURITY_SCORE" -ge 3 ]; then
    echo "✅ Security: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "⚠️  Security: NEEDS IMPROVEMENT"
    echo "⚠️  **Status:** NEEDS IMPROVEMENT" >> "$REPORT_FILE"
fi
echo "- Content-Security-Policy: $HAS_CSP" >> "$REPORT_FILE"
echo "- Strict-Transport-Security: $HAS_HSTS" >> "$REPORT_FILE"
echo "- X-Frame-Options: $HAS_X_FRAME" >> "$REPORT_FILE"
echo "- X-Content-Type-Options: $HAS_X_CONTENT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 6. API Tests
echo "🔌 6. API Tests"
echo "## 6. API Tests" >> "$REPORT_FILE"

# Test key API endpoints
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/health" --max-time 5 || echo "000")
API_PROGRAMS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/programs" --max-time 5 || echo "000")

echo "  /api/health: $API_HEALTH"
echo "  /api/programs: $API_PROGRAMS"

if [ "$API_HEALTH" = "200" ] || [ "$API_PROGRAMS" = "200" ]; then
    echo "✅ API: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "⚠️  API: Some endpoints may not be configured"
    echo "⚠️  **Status:** PARTIAL" >> "$REPORT_FILE"
fi
echo "- /api/health: $API_HEALTH" >> "$REPORT_FILE"
echo "- /api/programs: $API_PROGRAMS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 7. Mobile Responsiveness
echo "📱 7. Mobile Responsiveness Tests"
echo "## 7. Mobile Responsiveness Tests" >> "$REPORT_FILE"

# Check viewport meta tag
HAS_VIEWPORT=$(echo "$CONTENT" | grep -c 'name="viewport"' || true)
HAS_RESPONSIVE_IMAGES=$(echo "$CONTENT" | grep -c 'srcset\|sizes' || true)

echo "  Viewport meta tag: $HAS_VIEWPORT"
echo "  Responsive images: $HAS_RESPONSIVE_IMAGES"

if [ "$HAS_VIEWPORT" -gt 0 ]; then
    echo "✅ Mobile: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "❌ Mobile: FAILED"
    echo "❌ **Status:** FAILED" >> "$REPORT_FILE"
fi
echo "- Viewport meta tag: $HAS_VIEWPORT" >> "$REPORT_FILE"
echo "- Responsive images: $HAS_RESPONSIVE_IMAGES" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 8. CDN/Deployment Tests
echo "🌐 8. CDN/Deployment Tests"
echo "## 8. CDN/Deployment Tests" >> "$REPORT_FILE"

# Check for CDN headers
HAS_CDN=$(echo "$HEADERS" | grep -ic 'x-vercel\|cf-ray\|x-cache' || true)
SERVER_HEADER=$(echo "$HEADERS" | grep -i 'server:' | head -1 || echo "Not found")

echo "  CDN detected: $HAS_CDN"
echo "  Server: $SERVER_HEADER"

if [ "$HAS_CDN" -gt 0 ]; then
    echo "✅ CDN: PASSED"
    echo "✅ **Status:** PASSED" >> "$REPORT_FILE"
else
    echo "⚠️  CDN: Not detected"
    echo "⚠️  **Status:** NOT DETECTED" >> "$REPORT_FILE"
fi
echo "- CDN headers: $HAS_CDN" >> "$REPORT_FILE"
echo "- Server: $SERVER_HEADER" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo ""

# 9. Key Pages Test
echo "📄 9. Key Pages Test"
echo "## 9. Key Pages Test" >> "$REPORT_FILE"

PAGES=(
    "/"
    "/programs"
    "/apply"
    "/about"
    "/contact"
    "/programs/barber"
    "/programs/cna"
)

PASSED=0
FAILED=0

for PAGE in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$PAGE" --max-time 10)
    if [ "$STATUS" = "200" ]; then
        echo "  ✅ $PAGE: $STATUS"
        echo "- ✅ $PAGE: $STATUS" >> "$REPORT_FILE"
        PASSED=$((PASSED + 1))
    else
        echo "  ❌ $PAGE: $STATUS"
        echo "- ❌ $PAGE: $STATUS" >> "$REPORT_FILE"
        FAILED=$((FAILED + 1))
    fi
done

if [ "$FAILED" -eq 0 ]; then
    echo "✅ Key Pages: ALL PASSED ($PASSED/$((PASSED + FAILED)))"
    echo "" >> "$REPORT_FILE"
    echo "✅ **Status:** ALL PASSED ($PASSED/$((PASSED + FAILED)))" >> "$REPORT_FILE"
else
    echo "⚠️  Key Pages: $PASSED passed, $FAILED failed"
    echo "" >> "$REPORT_FILE"
    echo "⚠️  **Status:** $PASSED passed, $FAILED failed" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
echo "View full report:"
echo "  cat $REPORT_FILE"
echo ""

cat >> "$REPORT_FILE" << EOF
---

## Summary

All tests completed. Review results above for any issues that need attention.

**Priority Actions:**
1. Fix any FAILED tests immediately
2. Address NEEDS IMPROVEMENT items
3. Monitor performance metrics
4. Review security headers

**Next Steps:**
- Run \`npm run lint\` to check code quality
- Run \`npm test\` for unit tests
- Monitor production metrics
- Set up continuous monitoring

EOF

echo "✅ All tests complete!"
