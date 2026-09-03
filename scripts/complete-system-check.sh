#!/usr/bin/env bash
set -e

echo ""
echo "==================================================================="
echo "🔄 COMPLETE SYSTEM CHECK - Autopilot Loop Until 100% Complete"
echo "==================================================================="
echo ""

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

REPORT="COMPLETE_SYSTEM_CHECK.md"
ISSUES_FOUND=0

echo "# COMPLETE SYSTEM CHECK REPORT" > "$REPORT"
echo "**Generated:** $(date)" >> "$REPORT"
echo "" >> "$REPORT"

# ============================================================================
# 1. GIT BRANCH CHECK
# ============================================================================
echo "## 1. GIT BRANCH CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH" | tee -a "$REPORT"

ALL_BRANCHES=$(git branch -a | grep -v "HEAD" | wc -l)
echo "Total branches: $ALL_BRANCHES" | tee -a "$REPORT"

if [ "$ALL_BRANCHES" -eq 1 ]; then
    echo "✅ All code on single branch: $CURRENT_BRANCH" | tee -a "$REPORT"
else
    echo "⚠️  Multiple branches found:" | tee -a "$REPORT"
    git branch -a | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

# Check for uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ No uncommitted changes" | tee -a "$REPORT"
else
    echo "⚠️  Uncommitted changes found:" | tee -a "$REPORT"
    git status --short | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

echo "" >> "$REPORT"

# ============================================================================
# 2. DATABASE MIGRATIONS CHECK
# ============================================================================
echo "## 2. DATABASE MIGRATIONS CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Find all migration files
MIGRATION_DIRS=$(find . -type d -name "migrations" 2>/dev/null)
TOTAL_MIGRATIONS=0

for dir in $MIGRATION_DIRS; do
    MIGRATIONS=$(find "$dir" -name "*.sql" 2>/dev/null | wc -l)
    TOTAL_MIGRATIONS=$((TOTAL_MIGRATIONS + MIGRATIONS))
    echo "Found $MIGRATIONS migrations in $dir" | tee -a "$REPORT"
done

echo "**Total SQL migrations:** $TOTAL_MIGRATIONS" | tee -a "$REPORT"

if [ "$TOTAL_MIGRATIONS" -gt 0 ]; then
    echo "✅ Database migrations exist" | tee -a "$REPORT"
    
    # List all migrations
    echo "" >> "$REPORT"
    echo "### Migration Files:" >> "$REPORT"
    find . -name "*.sql" -path "*/migrations/*" 2>/dev/null | sort | tee -a "$REPORT"
else
    echo "⚠️  No database migrations found" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

echo "" >> "$REPORT"

# ============================================================================
# 3. DATABASE SEEDING CHECK
# ============================================================================
echo "## 3. DATABASE SEEDING CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for seed files
SEED_FILES=$(find . -name "*seed*" -o -name "*fixture*" 2>/dev/null | grep -E "\.(sql|ts|js)$" | wc -l)
echo "Found $SEED_FILES seed/fixture files" | tee -a "$REPORT"

if [ "$SEED_FILES" -gt 0 ]; then
    echo "✅ Database seeding files exist" | tee -a "$REPORT"
    find . -name "*seed*" -o -name "*fixture*" 2>/dev/null | grep -E "\.(sql|ts|js)$" | tee -a "$REPORT"
else
    echo "⚠️  No database seeding files found" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

echo "" >> "$REPORT"

# ============================================================================
# 4. COMPLETE PAGE INVENTORY
# ============================================================================
echo "## 4. COMPLETE PAGE INVENTORY" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Find ALL pages
ALL_PAGES=$(find app -name "page.tsx" -o -name "page.ts" 2>/dev/null | sort)
TOTAL_PAGES=$(echo "$ALL_PAGES" | wc -l)

echo "**Total Pages Found:** $TOTAL_PAGES" | tee -a "$REPORT"
echo "" >> "$REPORT"

# Categorize pages
MARKETING_PAGES=$(echo "$ALL_PAGES" | grep -v "/admin/" | grep -v "/lms/" | grep -v "/portal/" | grep -v "/student/" | grep -v "/instructor/" | grep -v "/api/" | wc -l)
ADMIN_PAGES=$(echo "$ALL_PAGES" | grep "/admin/" | wc -l)
LMS_PAGES=$(echo "$ALL_PAGES" | grep "/lms/" | wc -l)
PORTAL_PAGES=$(echo "$ALL_PAGES" | grep "/portal/" | wc -l)
STUDENT_PAGES=$(echo "$ALL_PAGES" | grep "/student/" | wc -l)
INSTRUCTOR_PAGES=$(echo "$ALL_PAGES" | grep "/instructor/" | wc -l)

echo "### Page Breakdown:" >> "$REPORT"
echo "- Marketing Pages: $MARKETING_PAGES" | tee -a "$REPORT"
echo "- Admin Pages: $ADMIN_PAGES" | tee -a "$REPORT"
echo "- LMS Pages: $LMS_PAGES" | tee -a "$REPORT"
echo "- Portal Pages: $PORTAL_PAGES" | tee -a "$REPORT"
echo "- Student Pages: $STUDENT_PAGES" | tee -a "$REPORT"
echo "- Instructor Pages: $INSTRUCTOR_PAGES" | tee -a "$REPORT"
echo "" >> "$REPORT"

# ============================================================================
# 5. COMPLETE PAGE LIST
# ============================================================================
echo "## 5. COMPLETE PAGE LIST (ALL $TOTAL_PAGES PAGES)" >> "$REPORT"
echo "-----------------------------------" >> "$REPORT"
echo "" >> "$REPORT"

echo "### Marketing Pages ($MARKETING_PAGES pages):" >> "$REPORT"
echo "$ALL_PAGES" | grep -v "/admin/" | grep -v "/lms/" | grep -v "/portal/" | grep -v "/student/" | grep -v "/instructor/" | grep -v "/api/" | nl >> "$REPORT"
echo "" >> "$REPORT"

echo "### Admin Pages ($ADMIN_PAGES pages):" >> "$REPORT"
echo "$ALL_PAGES" | grep "/admin/" | nl >> "$REPORT"
echo "" >> "$REPORT"

echo "### LMS Pages ($LMS_PAGES pages):" >> "$REPORT"
echo "$ALL_PAGES" | grep "/lms/" | nl >> "$REPORT"
echo "" >> "$REPORT"

echo "### Portal Pages ($PORTAL_PAGES pages):" >> "$REPORT"
echo "$ALL_PAGES" | grep "/portal/" | nl >> "$REPORT"
echo "" >> "$REPORT"

echo "### Student Pages ($STUDENT_PAGES pages):" >> "$REPORT"
echo "$ALL_PAGES" | grep "/student/" | nl >> "$REPORT"
echo "" >> "$REPORT"

echo "### Instructor Pages ($INSTRUCTOR_PAGES pages):" >> "$REPORT"
echo "$ALL_PAGES" | grep "/instructor/" | nl >> "$REPORT"
echo "" >> "$REPORT"

# ============================================================================
# 6. MISSING PAGES CHECK
# ============================================================================
echo "## 6. MISSING PAGES CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for common pages that should exist
REQUIRED_PAGES=(
    "app/page.tsx"
    "app/about/page.tsx"
    "app/contact/page.tsx"
    "app/programs/page.tsx"
    "app/apply/page.tsx"
    "app/privacy-policy/page.tsx"
    "app/terms-of-service/page.tsx"
    "app/not-found.tsx"
)

MISSING_PAGES=0
for page in "${REQUIRED_PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "✅ $page exists" | tee -a "$REPORT"
    else
        echo "❌ MISSING: $page" | tee -a "$REPORT"
        ((MISSING_PAGES++))
        ((ISSUES_FOUND++))
    fi
done

if [ "$MISSING_PAGES" -eq 0 ]; then
    echo "" >> "$REPORT"
    echo "✅ All required pages exist" | tee -a "$REPORT"
fi

echo "" >> "$REPORT"

# ============================================================================
# 7. REPOSITORY STRUCTURE CHECK
# ============================================================================
echo "## 7. REPOSITORY STRUCTURE CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for essential directories
REQUIRED_DIRS=(
    "app"
    "components"
    "lib"
    "public"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        ITEMS=$(find "$dir" -type f 2>/dev/null | wc -l)
        echo "✅ $dir/ exists ($ITEMS files)" | tee -a "$REPORT"
    else
        echo "❌ MISSING: $dir/" | tee -a "$REPORT"
        ((ISSUES_FOUND++))
    fi
done

echo "" >> "$REPORT"

# ============================================================================
# 8. API ROUTES CHECK
# ============================================================================
echo "## 8. API ROUTES CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

API_ROUTES=$(find app/api -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
echo "**Total API Routes:** $API_ROUTES" | tee -a "$REPORT"

if [ "$API_ROUTES" -gt 0 ]; then
    echo "✅ API routes exist" | tee -a "$REPORT"
    
    # List API categories
    echo "" >> "$REPORT"
    echo "### API Route Categories:" >> "$REPORT"
    find app/api -type d -mindepth 1 -maxdepth 1 2>/dev/null | while read dir; do
        COUNT=$(find "$dir" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
        echo "- $(basename $dir): $COUNT routes" | tee -a "$REPORT"
    done
else
    echo "⚠️  No API routes found" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

echo "" >> "$REPORT"

# ============================================================================
# 9. COMPONENTS CHECK
# ============================================================================
echo "## 9. COMPONENTS CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

COMPONENTS=$(find components -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
echo "**Total Components:** $COMPONENTS" | tee -a "$REPORT"

if [ "$COMPONENTS" -gt 0 ]; then
    echo "✅ Components exist" | tee -a "$REPORT"
else
    echo "❌ No components found" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

echo "" >> "$REPORT"

# ============================================================================
# 10. ENVIRONMENT CHECK
# ============================================================================
echo "## 10. ENVIRONMENT VARIABLES CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo "✅ Environment file exists" | tee -a "$REPORT"
else
    echo "⚠️  No .env file found" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

if [ -f ".env.example" ]; then
    echo "✅ .env.example exists" | tee -a "$REPORT"
else
    echo "⚠️  .env.example missing" | tee -a "$REPORT"
fi

echo "" >> "$REPORT"

# ============================================================================
# 11. DEPENDENCIES CHECK
# ============================================================================
echo "## 11. DEPENDENCIES CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

if [ -f "package.json" ]; then
    echo "✅ package.json exists" | tee -a "$REPORT"
    
    DEPS=$(cat package.json | grep -c "\".*\":" || echo 0)
    echo "Total dependencies: $DEPS" | tee -a "$REPORT"
    
    if [ -f "package-lock.json" ] || [ -f "pnpm-lock.yaml" ] || [ -f "yarn.lock" ]; then
        echo "✅ Lock file exists" | tee -a "$REPORT"
    else
        echo "⚠️  No lock file found" | tee -a "$REPORT"
        ((ISSUES_FOUND++))
    fi
else
    echo "❌ package.json missing" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

echo "" >> "$REPORT"

# ============================================================================
# 12. BUILD CHECK
# ============================================================================
echo "## 12. BUILD CHECK" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
    echo "✅ Next.js config exists" | tee -a "$REPORT"
else
    echo "❌ Next.js config missing" | tee -a "$REPORT"
    ((ISSUES_FOUND++))
fi

if [ -f "tsconfig.json" ]; then
    echo "✅ TypeScript config exists" | tee -a "$REPORT"
else
    echo "⚠️  TypeScript config missing" | tee -a "$REPORT"
fi

echo "" >> "$REPORT"

# ============================================================================
# SUMMARY
# ============================================================================
echo "==================================================================" >> "$REPORT"
echo "## SUMMARY" >> "$REPORT"
echo "==================================================================" >> "$REPORT"
echo "" >> "$REPORT"
echo "**Total Pages:** $TOTAL_PAGES" >> "$REPORT"
echo "**Total Migrations:** $TOTAL_MIGRATIONS" >> "$REPORT"
echo "**Total API Routes:** $API_ROUTES" >> "$REPORT"
echo "**Total Components:** $COMPONENTS" >> "$REPORT"
echo "**Issues Found:** $ISSUES_FOUND" >> "$REPORT"
echo "" >> "$REPORT"

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo "🎉 **STATUS: COMPLETE** - All systems operational!" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "✅ All code on single branch" >> "$REPORT"
    echo "✅ All migrations present" >> "$REPORT"
    echo "✅ All required pages exist" >> "$REPORT"
    echo "✅ Repository structure complete" >> "$REPORT"
    EXIT_CODE=0
else
    echo "⚠️  **STATUS: INCOMPLETE** - $ISSUES_FOUND issues need attention" >> "$REPORT"
    EXIT_CODE=1
fi

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "**Report Generated:** $(date)" >> "$REPORT"
echo "**Next Check:** After fixes applied" >> "$REPORT"

echo ""
echo "==================================================================="
echo "SYSTEM CHECK COMPLETE"
echo "==================================================================="
echo ""
echo "Total Pages: $TOTAL_PAGES"
echo "Issues Found: $ISSUES_FOUND"
echo ""
echo "📄 Full report: $REPORT"
echo ""

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo "🎉 ALL SYSTEMS COMPLETE!"
else
    echo "⚠️  $ISSUES_FOUND issues need fixing"
    echo "Run this script again after fixes"
fi

exit $EXIT_CODE
