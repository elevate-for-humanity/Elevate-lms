#!/bin/bash

# Create Deployment Bundle
# Packages all deployment files into a single archive
# Copyright (c) 2025 Elevate for Humanity

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Creating Deployment Bundle${NC}"
echo "=========================="
echo ""

# Create bundle directory
BUNDLE_DIR="deployment-bundle-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BUNDLE_DIR"

echo "Copying files..."

# Copy migration files
mkdir -p "$BUNDLE_DIR/migrations"
cp ../../supabase/migrations/20251103_*.sql "$BUNDLE_DIR/migrations/"

# Copy Edge Functions
mkdir -p "$BUNDLE_DIR/edge-functions"
cp -r ../../supabase/functions/email-dispatch "$BUNDLE_DIR/edge-functions/"
cp -r ../../supabase/functions/webhook-dispatch "$BUNDLE_DIR/edge-functions/"
cp -r ../../supabase/functions/ai-course-create "$BUNDLE_DIR/edge-functions/"
cp -r ../../supabase/functions/grade-ai "$BUNDLE_DIR/edge-functions/"

# Copy deployment scripts
mkdir -p "$BUNDLE_DIR/scripts"
cp deploy-edge-functions.sh "$BUNDLE_DIR/scripts/"
cp run-migrations.sh "$BUNDLE_DIR/scripts/"
cp configure-env-vars.sh "$BUNDLE_DIR/scripts/"
cp verify-rls-policies.sh "$BUNDLE_DIR/scripts/"
cp test-edge-functions.sh "$BUNDLE_DIR/scripts/"
cp test-admin-routes.sh "$BUNDLE_DIR/scripts/"

# Copy essential documentation only
cp ../../README.md "$BUNDLE_DIR/"
cp ../../docs/deployment/DEPLOYMENT_GUIDE.md "$BUNDLE_DIR/" 2>/dev/null || echo "Note: DEPLOYMENT_GUIDE.md not found"

# Copy admin pages
mkdir -p "$BUNDLE_DIR/admin-pages"
cp -r ../../src/admin/routes/*.tsx "$BUNDLE_DIR/admin-pages/" 2>/dev/null || true
cp ../../src/admin/AdminLayout.tsx "$BUNDLE_DIR/admin-pages/" 2>/dev/null || true

# Copy utilities
mkdir -p "$BUNDLE_DIR/utilities"
cp ../../src/utils/assessments.ts "$BUNDLE_DIR/utilities/" 2>/dev/null || true
cp ../../src/utils/analyticsTracking.ts "$BUNDLE_DIR/utilities/" 2>/dev/null || true

# Copy routing
mkdir -p "$BUNDLE_DIR/routing"
cp ../../src/router/AdminRoutes.tsx "$BUNDLE_DIR/routing/" 2>/dev/null || true
cp ../../src/router/AllRoutes.tsx "$BUNDLE_DIR/routing/" 2>/dev/null || true

# Don't overwrite README.md if it exists, create BUNDLE_README.md instead
cat > "$BUNDLE_DIR/BUNDLE_README.md" << 'EOF'
# Deployment Bundle

This bundle contains all files needed to deploy the admin features.

## Contents

- `migrations/` - Database migration files (5 files)
- `edge-functions/` - Supabase Edge Functions (4 functions)
- `admin-pages/` - React admin page components (12 pages)
- `utilities/` - Utility libraries (2 files)
- `routing/` - Routing configuration (2 files)
- `scripts/` - Deployment scripts (6 scripts)
- `README.md` - Main project README
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## Quick Start

1. Extract this bundle to your deployment environment
2. Run: `npx supabase login`
3. Run: `bash scripts/run-migrations.sh`
4. Run: `bash scripts/configure-env-vars.sh`
5. Run: `bash scripts/deploy-edge-functions.sh`
6. Build and deploy your frontend

## Documentation

- `README.md` - Main project documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions

## Support

For issues, check the documentation files or review logs in Supabase dashboard.

---
Generated: $(date)
Version: 2.0.0 (Reorganized Structure)
EOF

# Create archive
ARCHIVE_NAME="${BUNDLE_DIR}.tar.gz"
tar -czf "$ARCHIVE_NAME" "$BUNDLE_DIR"

# Cleanup
rm -rf "$BUNDLE_DIR"

echo ""
echo -e "${GREEN}✓ Bundle created: $ARCHIVE_NAME${NC}"
echo ""
echo "Bundle contents:"
echo "  - 5 migration files"
echo "  - 4 Edge Functions"
echo "  - 12 admin pages"
echo "  - 2 utility libraries"
echo "  - 2 routing files"
echo "  - 6 deployment scripts"
echo "  - 2 documentation files"
echo ""
echo "Total: ~40 files (production-ready)"
echo ""
echo "To extract:"
echo "  tar -xzf $ARCHIVE_NAME"
echo ""
echo "To verify bundle:"
echo "  bash ../../efh-bundle-audit.sh $ARCHIVE_NAME"
echo ""
echo "To download from Gitpod:"
echo "  1. Right-click the file in Explorer"
echo "  2. Select 'Download'"
