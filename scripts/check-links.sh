#!/usr/bin/env bash
set -e

# Link Checker Script for Elevate for Humanity
# Checks all internal and external links on the site

URL="${1:-http://localhost:3000}"
MAX_DEPTH="${2:-3}"

echo "🔍 Checking links on: $URL"
echo "📊 Max depth: $MAX_DEPTH"
echo ""

# Check if linkinator is installed
if ! command -v linkinator &> /dev/null; then
    echo "📦 Installing linkinator..."
    npm install -g linkinator
fi

# Run linkinator
echo "🚀 Starting link check..."
echo ""

linkinator "$URL" \
  --recurse \
  --skip "mailto:,tel:,data:,javascript:,#" \
  --skip "linkedin.com,facebook.com,twitter.com,instagram.com,youtube.com" \
  --max-depth "$MAX_DEPTH" \
  --timeout 10000 \
  --retry \
  --retry-errors \
  --retry-errors-count 2 \
  --format json > /tmp/link-check-results.json

# Parse results
TOTAL=$(jq '.links | length' /tmp/link-check-results.json)
PASSED=$(jq '[.links[] | select(.state == "OK")] | length' /tmp/link-check-results.json)
BROKEN=$(jq '[.links[] | select(.state == "BROKEN")] | length' /tmp/link-check-results.json)
SKIPPED=$(jq '[.links[] | select(.state == "SKIPPED")] | length' /tmp/link-check-results.json)

echo ""
echo "📊 Results:"
echo "  Total links: $TOTAL"
echo "  ✅ Passed: $PASSED"
echo "  ❌ Broken: $BROKEN"
echo "  ⏭️  Skipped: $SKIPPED"
echo ""

# Show broken links if any
if [ "$BROKEN" -gt 0 ]; then
    echo "❌ Broken Links:"
    jq -r '.links[] | select(.state == "BROKEN") | "  \(.url) (Status: \(.status // "N/A"))"' /tmp/link-check-results.json
    echo ""
    exit 1
else
    echo "✅ All links are working!"
    exit 0
fi
