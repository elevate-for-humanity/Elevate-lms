#!/usr/bin/env bash
set -e

echo ""
echo "==================================================================="
echo "📊 WHAT WE ACTUALLY HAVE – AUTO REPORT"
echo "==================================================================="
echo ""

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

cd "$ROOT_DIR"

# Helpers
count_files() {
  # $1 = glob
  # $2 = optional extra find args
  find . -type f -path "$1" $2 2>/dev/null | wc -l | tr -d ' '
}

count_ext() {
  # $1 = extension (e.g. tsx)
  find . -type f -name "*.${1}" 2>/dev/null | wc -l | tr -d ' '
}

# --------------------------------------------------------------------
# PAGES (Next.js App Router – app/**/page.tsx / page.ts)
# --------------------------------------------------------------------
PAGES_TOTAL=$(find app -type f \( -name "page.tsx" -o -name "page.ts" \) 2>/dev/null | wc -l | tr -d ' ')
PAGES_ADMIN=$(find app -type f -path "*/admin/**/page.tsx" -o -path "*/admin/**/page.ts" 2>/dev/null | wc -l | tr -d ' ')
PAGES_LMS=$(find app -type f -path "*/lms/**/page.tsx" -o -path "*/lms/**/page.ts" 2>/dev/null | wc -l | tr -d ' ')
PAGES_STUDENT=$(find app -type f -path "*/student/**/page.tsx" -o -path "*/student/**/page.ts" 2>/dev/null | wc -l | tr -d ' ')
PAGES_PROGRAMS=$(find app -type f -path "*/programs/**/page.tsx" -o -path "*/programs/**/page.ts" 2>/dev/null | wc -l | tr -d ' ')

# Rough marketing pages = all pages minus lms/admin/student subsets
PAGES_MARKETING=$((PAGES_TOTAL - PAGES_ADMIN - PAGES_LMS - PAGES_STUDENT))

# --------------------------------------------------------------------
# API ROUTES – app/api/**/*
# --------------------------------------------------------------------
API_TOTAL=$(find app/api -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | wc -l | tr -d ' ')
API_ADMIN=$(find app/api -type f -path "*/admin/*" 2>/dev/null | wc -l | tr -d ' ')
API_COURSE=$(find app/api -type f -path "*/courses/*" 2>/dev/null | wc -l | tr -d ' ')
API_ANALYTICS=$(find app/api -type f -path "*/analytics/*" 2>/dev/null | wc -l | tr -d ' ')
API_HR=$(find app/api -type f -path "*/hr/*" 2>/dev/null | wc -l | tr -d ' ')
API_EMAIL=$(find app/api -type f -path "*/email/*" 2>/dev/null | wc -l | tr -d ' ')
API_TAX=$(find app/api -type f -path "*/tax/*" 2>/dev/null | wc -l | tr -d ' ')
API_CASH=$(find app/api -type f -path "*/cash-advance/*" 2>/dev/null | wc -l | tr -d ' ')

# --------------------------------------------------------------------
# DATABASE / MIGRATIONS
# --------------------------------------------------------------------
MIGRATIONS_SQL=$(find . -type f \( -path "*/migrations/*.sql" -o -name "*_migration.sql" \) 2>/dev/null | wc -l | tr -d ' ')
MIGRATIONS_SUPABASE=$(find supabase -type f -path "*/migrations/*.sql" 2>/dev/null | wc -l | tr -d ' ' || echo 0)

# --------------------------------------------------------------------
# COMPONENTS
# --------------------------------------------------------------------
COMPONENTS=$(find components -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')

# --------------------------------------------------------------------
# DOCUMENTATION (markdown)
# --------------------------------------------------------------------
DOCS_MD=$(find . -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

# --------------------------------------------------------------------
# SCRIPTS (bash / sh / deployment)
# --------------------------------------------------------------------
SCRIPTS_SH=$(find scripts -type f \( -name "*.sh" -o -name "*.bash" \) 2>/dev/null | wc -l | tr -d ' ')
SCRIPTS_YML=$(find .github -type f -name "*.yml" 2>/dev/null | wc -l | tr -d ' ' || echo 0)

# --------------------------------------------------------------------
# INTEGRATION REFERENCES (rough grep counts)
# --------------------------------------------------------------------
REF_DRAKE=$(grep -ri "drake" . 2>/dev/null | wc -l | tr -d ' ')
REF_EPS=$(grep -ri "eps" . 2>/dev/null | wc -l | tr -d ' ')
REF_SUPABASE=$(grep -ri "supabase" . 2>/dev/null | wc -l | tr -d ' ')
REF_STRIPE=$(grep -ri "stripe" . 2>/dev/null | wc -l | tr -d ' ')

# --------------------------------------------------------------------
# PRINT REPORT
# --------------------------------------------------------------------
echo "## WHAT WE ACTUALLY HAVE (AUTO-GENERATED)"
echo ""

echo "### System Snapshot"
echo "- Pages (Next.js app router):       ${PAGES_TOTAL}"
echo "- API routes:                       ${API_TOTAL}"
echo "- SQL migrations (all):             ${MIGRATIONS_SQL}"
echo "- Supabase migrations:              ${MIGRATIONS_SUPABASE}"
echo "- Components:                       ${COMPONENTS}"
echo "- Documentation files (.md):        ${DOCS_MD}"
echo "- Shell/Deploy scripts:             ${SCRIPTS_SH}"
echo "- GitHub Actions / CI workflows:    ${SCRIPTS_YML}"
echo ""

echo "### Pages Breakdown"
echo "- Admin dashboard pages:            ${PAGES_ADMIN}"
echo "- LMS pages:                        ${PAGES_LMS}"
echo "- Student portal pages:             ${PAGES_STUDENT}"
echo "- Program pages:                    ${PAGES_PROGRAMS}"
echo "- Marketing / other pages:          ${PAGES_MARKETING}"
echo ""

echo "### API Breakdown"
echo "- Admin APIs:                       ${API_ADMIN}"
echo "- Course APIs:                      ${API_COURSE}"
echo "- Analytics APIs:                   ${API_ANALYTICS}"
echo "- HR/Payroll APIs:                  ${API_HR}"
echo "- Email APIs:                       ${API_EMAIL}"
echo "- Tax filing APIs:                  ${API_TAX}"
echo "- Cash advance APIs:                ${API_CASH}"
echo ""

echo "### Integration References (rough)"
echo "- Drake references:                 ${REF_DRAKE}"
echo "- EPS Financial references:         ${REF_EPS}"
echo "- Supabase references:              ${REF_SUPABASE}"
echo "- Stripe references:                ${REF_STRIPE}"
echo ""

echo "### Environment / Credentials Needed (manual)"
echo "- Supabase keys:        NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
echo "- Stripe keys:          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"
echo "- Other vendors:        Drake, EPS Financial (API keys / credentials)"
echo ""

echo "✅ Gitpod scan complete. This is what you ACTUALLY have in this repo right now."
echo "   (Update counts automatically every time Gitpod starts.)"
echo ""
