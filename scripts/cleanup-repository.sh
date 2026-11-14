#!/bin/bash
# Clean up ALL old scripts and files from repository
# Keep only essential scripts

set -e

echo "🧹 REPOSITORY CLEANUP"
echo "=========================================="
echo ""

# Count current files
TOTAL_SCRIPTS=$(find scripts -type f | wc -l)
echo "Current scripts: $TOTAL_SCRIPTS"
echo ""

echo "Deleting old/unused scripts..."
echo ""

# Delete old domain/URL fixing scripts
echo "1. Deleting domain/URL scripts..."
rm -f scripts/fix-domain-urls.js
rm -f scripts/update-canonical-urls.js
rm -f scripts/fix-broken-links.mjs
rm -f scripts/postbuild.mjs
rm -f scripts/postbuild-sitemaps.mjs
rm -f scripts/generate-sitemaps.mjs
rm -f scripts/generate-complete-sitemap.mjs
rm -f scripts/generate-sitemap.cjs
rm -f scripts/generate-sitemap.js
rm -f scripts/generate-sitemap-dynamic.js
rm -f scripts/generate-sitemap-complete.mjs
rm -f scripts/generate-program-sitemap.mjs
rm -f scripts/sitemap.js
rm -f scripts/sitemap-chunk.js
rm -f scripts/split-sitemap.mjs
echo "✅ Deleted domain/URL/sitemap scripts"

# Delete old autopilot scripts
echo "2. Deleting old autopilot scripts..."
rm -f scripts/autopilot-fix-all.mjs
rm -f scripts/autopilot-fix-lms.mjs
rm -f scripts/autopilot-seo-optimize.mjs
rm -f scripts/autopilot-cleanup.js
rm -f scripts/autopilot-autonomous-setup.sh
rm -f scripts/autopilot-complete-setup.sh
rm -f scripts/autopilot-full-setup.sh
rm -f scripts/stabilization-autopilot.sh
rm -f scripts/security-compliance-autopilot.mjs
rm -f scripts/routes-autopilot.mjs
echo "✅ Deleted old autopilot scripts"

# Delete development/testing scripts
echo "3. Deleting development/testing scripts..."
rm -rf scripts/development/
rm -rf scripts/maintenance/
rm -rf scripts/testing/
echo "✅ Deleted development/testing directories"

# Delete old setup scripts
echo "4. Deleting old setup scripts..."
rm -f scripts/setup-*.sh
rm -f scripts/autopilot-setup-*.sh
rm -f scripts/grant-*.sh
echo "✅ Deleted setup scripts"

# Delete verification scripts (keep only essential ones)
echo "5. Cleaning verification scripts..."
rm -f scripts/verify-sitemap-submission.mjs
rm -f scripts/verify-sitemaps.sh
rm -f scripts/verify-sitemaps.mjs
rm -f scripts/verify-routing-autopilot.sh
# Keep: verify-build.sh, verify-netlify-config.sh
echo "✅ Cleaned verification scripts"

# Delete old build scripts
echo "6. Deleting old build scripts..."
rm -f scripts/autopilot-build-web.sh
rm -f scripts/autopilot-verify-build.sh
echo "✅ Deleted old build scripts"

# Delete backup/archive directories
echo "7. Deleting backup/archive directories..."
rm -rf .backup/
rm -rf archive/
rm -rf docs/archive/
echo "✅ Deleted backup/archive directories"

# Delete old documentation with wrong URLs
echo "8. Cleaning old documentation..."
rm -f SSL_CERTIFICATE_FIX.md
rm -f QUICK_FIX.md
rm -f PRODUCTION_DEPLOYMENT_EXPLAINED.md
rm -f COMPLETE_AUTOPILOT_ANALYSIS.md
rm -f AUTOPILOT_DEPLOYMENT_STATUS.md
rm -f DEPLOYMENT_SUMMARY.md
rm -f NETLIFY_CLEANUP_COMPLETE.md
rm -f OPEN_LMS_INFRASTRUCTURE.md
echo "✅ Deleted old documentation"

# Delete old config files
echo "9. Cleaning old config files..."
rm -f .autopilot-*
rm -f .all-issues-fixed
echo "✅ Deleted old config files"

# Delete old tools
echo "10. Cleaning old tools..."
rm -rf tools/
echo "✅ Deleted tools directory"

# Delete gh-pages and frontend directories (if not needed)
echo "11. Cleaning unused directories..."
rm -rf gh-pages-deploy/
rm -rf frontend/
echo "✅ Deleted unused directories"

# Delete old integration files
echo "12. Cleaning integration files..."
rm -f .integration-config.js
echo "✅ Cleaned integration files"

# Delete support bundle
echo "13. Deleting support bundle..."
rm -rf support-bundle/
echo "✅ Deleted support bundle"

echo ""
echo "=========================================="
echo "KEEPING ESSENTIAL SCRIPTS:"
echo "=========================================="
echo ""

# List what we're keeping
echo "Essential scripts kept:"
find scripts -type f -name "*.sh" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" | sort | while read file; do
    echo "  ✅ $file"
done

echo ""

# Count remaining
REMAINING=$(find scripts -type f | wc -l)
DELETED=$((TOTAL_SCRIPTS - REMAINING))

echo "=========================================="
echo "CLEANUP SUMMARY"
echo "=========================================="
echo ""
echo "Before: $TOTAL_SCRIPTS scripts"
echo "After: $REMAINING scripts"
echo "Deleted: $DELETED scripts"
echo ""
echo "✅ Repository cleaned"
