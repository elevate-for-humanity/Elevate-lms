#!/bin/bash
# Autopilot: SEO & Analytics Setup
# Configures Google Analytics, sitemaps, meta tags, Open Graph, etc.

set -e

echo "🔍 AUTOPILOT: SEO & ANALYTICS SETUP"
echo "====================================="
echo ""

REPO_ROOT="/workspaces/fix2"
cd "$REPO_ROOT"

# Check if Google Analytics is configured
echo "Checking Google Analytics..."
if grep -r "G-" public/ src/ 2>/dev/null | grep -q "gtag\|analytics"; then
    echo "✅ Google Analytics found"
    GA_ID=$(grep -r "G-" public/ src/ 2>/dev/null | grep -o "G-[A-Z0-9]*" | head -1)
    echo "   ID: $GA_ID"
else
    echo "⚠️  Google Analytics not configured"
    echo ""
    echo "To add Google Analytics:"
    echo "1. Get your GA4 Measurement ID from https://analytics.google.com"
    echo "2. Add to index.html or create a component"
    echo ""
fi
echo ""

# Check sitemaps
echo "Checking sitemaps..."
if [ -f "public/sitemap.xml" ]; then
    echo "✅ sitemap.xml exists"
    URLS=$(grep -c "<url>" public/sitemap.xml || echo "0")
    echo "   URLs: $URLS"
else
    echo "⚠️  sitemap.xml not found"
    echo ""
    echo "Creating basic sitemap..."
    
    cat > public/sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://elevateconnectsdirectory.org/</loc>
    <lastmod>2025-11-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://elevateconnectsdirectory.org/programs</loc>
    <lastmod>2025-11-11</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://elevateconnectsdirectory.org/apply</loc>
    <lastmod>2025-11-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://elevateconnectsdirectory.org/about</loc>
    <lastmod>2025-11-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://elevateconnectsdirectory.org/contact</loc>
    <lastmod>2025-11-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
EOF
    
    echo "✅ Created sitemap.xml"
fi
echo ""

# Check robots.txt
echo "Checking robots.txt..."
if [ -f "public/robots.txt" ]; then
    echo "✅ robots.txt exists"
else
    echo "⚠️  robots.txt not found"
    echo ""
    echo "Creating robots.txt..."
    
    cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://elevateconnectsdirectory.org/sitemap.xml
EOF
    
    echo "✅ Created robots.txt"
fi
echo ""

# Check meta tags in index.html
echo "Checking meta tags..."
if [ -f "index.html" ]; then
    HTML_FILE="index.html"
elif [ -f "public/index.html" ]; then
    HTML_FILE="public/index.html"
else
    HTML_FILE=""
fi

if [ -n "$HTML_FILE" ]; then
    if grep -q 'name="description"' "$HTML_FILE"; then
        echo "✅ Meta description found"
    else
        echo "⚠️  Meta description missing"
    fi
    
    if grep -q 'property="og:' "$HTML_FILE"; then
        echo "✅ Open Graph tags found"
    else
        echo "⚠️  Open Graph tags missing"
    fi
    
    if grep -q 'name="twitter:' "$HTML_FILE"; then
        echo "✅ Twitter Card tags found"
    else
        echo "⚠️  Twitter Card tags missing"
    fi
else
    echo "⚠️  index.html not found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "SEO Files:"
echo "  - sitemap.xml: $([ -f public/sitemap.xml ] && echo '✅' || echo '❌')"
echo "  - robots.txt: $([ -f public/robots.txt ] && echo '✅' || echo '❌')"
echo ""
echo "Analytics:"
if grep -r "G-" public/ src/ 2>/dev/null | grep -q "gtag\|analytics"; then
    echo "  - Google Analytics: ✅"
else
    echo "  - Google Analytics: ❌"
fi
echo ""
echo "Meta Tags:"
if [ -n "$HTML_FILE" ]; then
    echo "  - Description: $(grep -q 'name="description"' "$HTML_FILE" && echo '✅' || echo '❌')"
    echo "  - Open Graph: $(grep -q 'property="og:' "$HTML_FILE" && echo '✅' || echo '❌')"
    echo "  - Twitter Card: $(grep -q 'name="twitter:' "$HTML_FILE" && echo '✅' || echo '❌')"
fi
echo ""

# Check if changes need to be committed
if [ -n "$(git status --porcelain)" ]; then
    echo "Changes detected. Committing..."
    git add public/sitemap.xml public/robots.txt 2>/dev/null || true
    git commit -m "Autopilot: Add/update SEO files (sitemap.xml, robots.txt)" || true
    echo "✅ Changes committed"
    echo ""
    echo "Push changes with: git push"
fi

echo "✅ SEO & Analytics check complete"
echo ""
