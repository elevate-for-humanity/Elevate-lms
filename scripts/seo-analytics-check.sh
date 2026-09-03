#!/bin/bash

echo "📊 SEO, ANALYTICS & MARKETING CHECK"
echo "===================================="
echo ""

# 1. Check for Google Analytics
echo "1️⃣ Checking Google Analytics..."
GA=$(grep -r "GA_MEASUREMENT_ID\|gtag\|google-analytics" /workspaces/fix2 --include="*.tsx" --include="*.ts" | wc -l)
if [ $GA -gt 0 ]; then
  echo "   ✅ Google Analytics found: $GA references"
else
  echo "   ⚠️  Google Analytics not found"
fi

# 2. Check for Facebook Pixel
echo ""
echo "2️⃣ Checking Facebook Pixel..."
FB_PIXEL=$(grep -r "FB_PIXEL_ID\|fbq\|facebook.*pixel" /workspaces/fix2 --include="*.tsx" | wc -l)
if [ $FB_PIXEL -gt 0 ]; then
  echo "   ✅ Facebook Pixel found: $FB_PIXEL references"
else
  echo "   ⚠️  Facebook Pixel not found"
fi

# 3. Check meta tags
echo ""
echo "3️⃣ Checking meta tags..."
echo "   Checking for:"

# OpenGraph tags
OG_TAGS=$(grep -r "openGraph\|og:" /workspaces/fix2/app --include="*.tsx" | wc -l)
echo "   - OpenGraph tags: $OG_TAGS"

# Twitter cards
TWITTER=$(grep -r "twitter:" /workspaces/fix2/app --include="*.tsx" | wc -l)
echo "   - Twitter cards: $TWITTER"

# Canonical URLs
CANONICAL=$(grep -r "canonical" /workspaces/fix2/app --include="*.tsx" | wc -l)
echo "   - Canonical URLs: $CANONICAL"

# 4. Check Schema.org markup
echo ""
echo "4️⃣ Checking Schema.org structured data..."
SCHEMA=$(grep -r "@type\|schema.org" /workspaces/fix2/app --include="*.tsx" | wc -l)
echo "   Schema.org markup: $SCHEMA references"

# 5. Check sitemap
echo ""
echo "5️⃣ Checking sitemap..."
if [ -f "/workspaces/fix2/app/sitemap.ts" ]; then
  echo "   ✅ sitemap.ts exists"
  # Count URLs
  URLS=$(grep -c "url:" /workspaces/fix2/app/sitemap.ts)
  echo "   URLs in sitemap: $URLS"
else
  echo "   ❌ sitemap.ts not found"
fi

# 6. Check robots.txt
echo ""
echo "6️⃣ Checking robots.txt..."
if [ -f "/workspaces/fix2/app/robots.ts" ]; then
  echo "   ✅ robots.ts exists"
  # Check what's allowed/disallowed
  DISALLOW=$(grep -c "disallow:" /workspaces/fix2/app/robots.ts)
  echo "   Disallow rules: $DISALLOW"
else
  echo "   ❌ robots.ts not found"
fi

# 7. Check for marketing integrations
echo ""
echo "7️⃣ Checking marketing integrations..."

# Mailchimp
MAILCHIMP=$(grep -r "mailchimp" /workspaces/fix2 --include="*.tsx" --include="*.ts" -i | wc -l)
echo "   - Mailchimp: $MAILCHIMP references"

# HubSpot
HUBSPOT=$(grep -r "hubspot" /workspaces/fix2 --include="*.tsx" --include="*.ts" -i | wc -l)
echo "   - HubSpot: $HUBSPOT references"

# Stripe
STRIPE=$(grep -r "STRIPE" /workspaces/fix2 --include="*.tsx" --include="*.ts" | wc -l)
echo "   - Stripe: $STRIPE references"

# 8. Check for conversion tracking
echo ""
echo "8️⃣ Checking conversion tracking..."
CONVERSIONS=$(grep -r "conversion\|track.*event\|gtag.*event" /workspaces/fix2/app --include="*.tsx" -i | wc -l)
echo "   Conversion tracking: $CONVERSIONS events"

# 9. Check metadata on key pages
echo ""
echo "9️⃣ Checking metadata on key pages..."
KEY_PAGES=("/" "/programs" "/apply" "/about" "/contact")
for page in "${KEY_PAGES[@]}"; do
  if [ "$page" = "/" ]; then
    FILE="/workspaces/fix2/app/page.tsx"
  else
    FILE="/workspaces/fix2/app${page}/page.tsx"
  fi
  
  if [ -f "$FILE" ]; then
    HAS_META=$(grep -c "metadata\|Metadata" "$FILE")
    if [ $HAS_META -gt 0 ]; then
      echo "   ✅ $page has metadata"
    else
      echo "   ⚠️  $page missing metadata"
    fi
  else
    echo "   ⚠️  $page not found"
  fi
done

# 10. Check for performance monitoring
echo ""
echo "🔟 Checking performance monitoring..."
PERF=$(grep -r "web-vitals\|performance" /workspaces/fix2 --include="*.tsx" --include="*.ts" | wc -l)
echo "   Performance monitoring: $PERF references"

echo ""
echo "===================================="
echo "📊 SEO & ANALYTICS SUMMARY"
echo ""
echo "Analytics:"
echo "  - Google Analytics: $GA ✅"
echo "  - Facebook Pixel: $FB_PIXEL ✅"
echo ""
echo "SEO:"
echo "  - Meta tags: $OG_TAGS OpenGraph, $TWITTER Twitter"
echo "  - Schema.org: $SCHEMA"
echo "  - Sitemap: $URLS URLs"
echo "  - Robots.txt: $DISALLOW rules"
echo ""
echo "Marketing:"
echo "  - Mailchimp: $MAILCHIMP"
echo "  - HubSpot: $HUBSPOT"
echo "  - Stripe: $STRIPE"
echo ""
echo "Tracking:"
echo "  - Conversions: $CONVERSIONS events"
echo "  - Performance: $PERF"
echo ""
