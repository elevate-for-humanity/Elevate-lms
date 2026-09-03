#!/bin/bash

echo "🔒 SECURITY & COPYRIGHT ENFORCEMENT CHECK"
echo "=========================================="
echo ""

# 1. Check robots.txt
echo "1️⃣ Checking robots.txt for scraping protection..."
if [ -f "/workspaces/fix2/app/robots.ts" ]; then
  echo "   ✅ robots.ts found"
  
  # Check for AI bot blocking
  AI_BOTS=$(grep -c "GPTBot\|ChatGPT\|Claude\|anthropic" /workspaces/fix2/app/robots.ts)
  echo "   AI bots blocked: $AI_BOTS"
  
  # Check for scraper blocking
  SCRAPERS=$(grep -c "Scrapy\|python-requests\|curl\|wget" /workspaces/fix2/app/robots.ts)
  echo "   Scrapers blocked: $SCRAPERS"
else
  echo "   ❌ robots.ts not found!"
fi

# 2. Check for copyright notices
echo ""
echo "2️⃣ Checking copyright notices..."
COPYRIGHT=$(grep -r "© 2024\|Copyright" /workspaces/fix2/components/site/SiteFooter.tsx | wc -l)
if [ $COPYRIGHT -gt 0 ]; then
  echo "   ✅ Copyright notice in footer"
else
  echo "   ⚠️  No copyright notice found"
fi

# 3. Check security headers
echo ""
echo "3️⃣ Checking security headers..."
if [ -f "/workspaces/fix2/next.config.js" ]; then
  SECURITY_HEADERS=$(grep -c "X-Frame-Options\|X-Content-Type-Options\|Content-Security-Policy" /workspaces/fix2/next.config.js)
  echo "   Security headers configured: $SECURITY_HEADERS"
else
  echo "   ⚠️  next.config.js not found"
fi

# 4. Check for rate limiting
echo ""
echo "4️⃣ Checking rate limiting..."
RATE_LIMIT=$(find /workspaces/fix2/lib -name "*rate*" -o -name "*limit*" | wc -l)
echo "   Rate limit files: $RATE_LIMIT"

# 5. Check sitemap for proper indexing
echo ""
echo "5️⃣ Checking sitemap configuration..."
if [ -f "/workspaces/fix2/app/sitemap.ts" ]; then
  echo "   ✅ sitemap.ts found"
  SITEMAP_URLS=$(grep -c "url:" /workspaces/fix2/app/sitemap.ts)
  echo "   URLs in sitemap: $SITEMAP_URLS"
else
  echo "   ⚠️  sitemap.ts not found"
fi

# 6. Check metadata for SEO
echo ""
echo "6️⃣ Checking metadata configuration..."
METADATA=$(grep -r "export const metadata" /workspaces/fix2/app --include="*.tsx" | wc -l)
echo "   Pages with metadata: $METADATA"

# 7. Check for Grant Siren integration
echo ""
echo "7️⃣ Checking Grant Siren integration..."
GRANT_SIREN=$(find /workspaces/fix2/app -name "*grant*" -o -name "*siren*" | wc -l)
echo "   Grant/Siren related files: $GRANT_SIREN"

# 8. List all apps/portals
echo ""
echo "8️⃣ Listing all apps/portals..."
echo "   Main Apps:"
echo "   - Student Portal (/student)"
echo "   - Admin Portal (/admin)"
echo "   - Staff Portal (/staff-portal)"
echo "   - Partner Portal (/partner)"
echo "   - Employer Portal (/employer)"
echo "   - Instructor Portal (/instructor)"
echo "   - LMS (/lms)"
echo "   - Store (/store)"
echo "   - Shop (/shop)"

# Count actual portals
PORTALS=$(find /workspaces/fix2/app -maxdepth 1 -type d -name "*portal*" -o -name "student" -o -name "admin" -o -name "lms" | wc -l)
echo "   Total portal directories: $PORTALS"

echo ""
echo "=========================================="
echo "✅ SECURITY CHECK COMPLETE"
echo ""
