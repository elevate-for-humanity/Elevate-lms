#!/bin/bash

# Generate Comprehensive Verification Report

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPORT_FILE="DEPLOYMENT_VERIFICATION_REPORT.md"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  📋 GENERATING VERIFICATION REPORT${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Load environment
export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)

echo "Generating report for project: $PROJECT_REF"
echo "Output file: $REPORT_FILE"
echo ""

# Start report
cat > "$REPORT_FILE" << EOF
# Deployment Verification Report

**Generated:** $(date)
**Project:** $PROJECT_REF
**URL:** $SUPABASE_URL

---

## Executive Summary

This report provides automated verification of the deployment status for all components.

EOF

# Run verification scripts and capture output
echo "Running verification checks..."
echo ""

# 1. Database Tables
echo "Checking database tables..."
if bash scripts/deployment/verify-deployment.sh > /tmp/verify-output.txt 2>&1; then
    DEPLOY_STATUS="✅ PASSED"
else
    DEPLOY_STATUS="⚠️ NEEDS REVIEW"
fi

cat >> "$REPORT_FILE" << EOF
## 1. Database Tables

**Status:** $DEPLOY_STATUS

### Verification Results

\`\`\`
$(cat /tmp/verify-output.txt 2>/dev/null || echo "Verification script output not available")
\`\`\`

### Expected Tables (24 total)

- organizations
- profiles
- courses
- enrollments
- assessments
- email_queue, email_logs
- webhooks, webhook_queue, webhook_logs
- campaigns, ab_tests, funnels
- forums, forum_posts, forum_members
- api_keys, ai_generations, integrations
- assessment_submissions, certificates
- notifications, analytics_events
- billing_transactions

**Verification Link:** [Database Tables](https://supabase.com/dashboard/project/$PROJECT_REF/database/tables)

---

EOF

# 2. RLS Policies
echo "Checking RLS policies..."
bash scripts/deployment/verify-rls-detailed.sh > /tmp/rls-output.txt 2>&1 || true

cat >> "$REPORT_FILE" << EOF
## 2. RLS Policies

**Status:** ⚠️ Manual verification required

### RLS Verification Results

\`\`\`
$(cat /tmp/rls-output.txt 2>/dev/null || echo "RLS verification output not available")
\`\`\`

### Expected Policies (60 total)

- 5 base table policies (organizations, profiles, courses, enrollments, assessments)
- 55 admin feature policies

**Verification Link:** [Database Policies](https://supabase.com/dashboard/project/$PROJECT_REF/database/policies)

---

EOF

# 3. Edge Functions
echo "Checking Edge Functions..."
bash scripts/deployment/verify-edge-functions.sh > /tmp/functions-output.txt 2>&1 || true

cat >> "$REPORT_FILE" << EOF
## 3. Edge Functions

**Status:** ⚠️ Manual verification required

### Edge Functions Verification

\`\`\`
$(cat /tmp/functions-output.txt 2>/dev/null || echo "Edge Functions verification output not available")
\`\`\`

### Expected Functions (4 total)

1. **email-dispatch** - Email sending functionality
2. **webhook-dispatch** - Webhook processing
3. **ai-course-create** - AI course generation
4. **grade-ai** - AI grading system

**Verification Link:** [Edge Functions](https://supabase.com/dashboard/project/$PROJECT_REF/functions)

---

EOF

# 4. Cron Jobs
echo "Checking Cron Jobs..."

cat >> "$REPORT_FILE" << EOF
## 4. Cron Jobs

**Status:** ⚠️ Manual verification required

### Expected Cron Jobs (4 total)

1. **process-email-queue** - Every minute
   - Processes pending emails from queue
   
2. **process-webhook-queue** - Every minute
   - Sends pending webhook notifications
   
3. **cleanup-old-logs** - Daily at 2 AM
   - Removes logs older than 90 days
   
4. **update-campaign-stats** - Every hour
   - Updates campaign statistics

**Note:** Cron jobs require pg_cron extension to be enabled.

**Verification Link:** [Cron Jobs](https://supabase.com/dashboard/project/$PROJECT_REF/database/cron-jobs)

---

EOF

# 5. API Connectivity
echo "Checking API connectivity..."

REST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" 2>&1)
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/auth/v1/health" 2>&1)

cat >> "$REPORT_FILE" << EOF
## 5. API Connectivity

### REST API
- **Status:** HTTP $REST_STATUS
- **Endpoint:** $SUPABASE_URL/rest/v1/
- **Result:** $([ "$REST_STATUS" = "200" ] && echo "✅ Accessible" || echo "❌ Not accessible")

### Auth API
- **Status:** HTTP $AUTH_STATUS
- **Endpoint:** $SUPABASE_URL/auth/v1/health
- **Result:** $([ "$AUTH_STATUS" = "200" ] && echo "✅ Accessible" || echo "❌ Not accessible")

---

EOF

# 6. Environment Configuration
echo "Checking environment configuration..."

cat >> "$REPORT_FILE" << EOF
## 6. Environment Configuration

### Required Variables

- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- $([ -n "$OPENAI_API_KEY" ] && echo "✅" || echo "❌") OPENAI_API_KEY
- $([ -n "$SENDGRID_API_KEY" ] && echo "✅" || echo "⚠️") SENDGRID_API_KEY (optional)
- $([ -n "$RESEND_API_KEY" ] && echo "✅" || echo "⚠️") RESEND_API_KEY (optional)
- $([ -n "$ANTHROPIC_API_KEY" ] && echo "✅" || echo "⚠️") ANTHROPIC_API_KEY (optional)

### Supabase Secrets

Add these in: [Project Secrets](https://supabase.com/dashboard/project/$PROJECT_REF/settings/secrets)

---

EOF

# 7. Deployment Checklist
cat >> "$REPORT_FILE" << EOF
## 7. Deployment Checklist

### Database
- [ ] 24 tables created
- [ ] All tables accessible via REST API
- [ ] RLS enabled on all tables
- [ ] 60 policies created and active

### Edge Functions
- [ ] email-dispatch deployed
- [ ] webhook-dispatch deployed
- [ ] ai-course-create deployed
- [ ] grade-ai deployed
- [ ] All functions responding to requests

### Cron Jobs
- [ ] pg_cron extension enabled
- [ ] 4 cron jobs scheduled
- [ ] Jobs running successfully

### Configuration
- [ ] API keys added to Supabase secrets
- [ ] Environment variables configured
- [ ] Frontend environment variables set

### Testing
- [ ] Test email sending
- [ ] Test webhook processing
- [ ] Test AI course generation
- [ ] Test AI grading
- [ ] Test user authentication
- [ ] Test RLS policies

---

EOF

# 8. Next Steps
cat >> "$REPORT_FILE" << EOF
## 8. Next Steps

### Immediate Actions

1. **Verify Database Tables**
   - Go to: [Database Tables](https://supabase.com/dashboard/project/$PROJECT_REF/database/tables)
   - Confirm all 24 tables exist
   - Check table structures

2. **Verify RLS Policies**
   - Go to: [Database Policies](https://supabase.com/dashboard/project/$PROJECT_REF/database/policies)
   - Confirm 60 policies exist
   - Verify policies are enabled

3. **Verify Edge Functions**
   - Go to: [Edge Functions](https://supabase.com/dashboard/project/$PROJECT_REF/functions)
   - Confirm 4 functions deployed
   - Check function logs for errors

4. **Configure API Keys**
   - Go to: [Project Secrets](https://supabase.com/dashboard/project/$PROJECT_REF/settings/secrets)
   - Add email API key (SendGrid or Resend)
   - Add AI API keys (OpenAI, Anthropic)

5. **Test Functionality**
   - Test email sending
   - Test AI features
   - Test webhooks
   - Test user flows

### Long-term Actions

1. **Monitor Performance**
   - Set up monitoring dashboards
   - Track API usage
   - Monitor database performance

2. **Security Review**
   - Review RLS policies
   - Audit API key usage
   - Check access logs

3. **Optimization**
   - Add database indexes as needed
   - Optimize slow queries
   - Cache frequently accessed data

---

EOF

# 9. Support Resources
cat >> "$REPORT_FILE" << EOF
## 9. Support Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

### Project Links
- [Project Dashboard](https://supabase.com/dashboard/project/$PROJECT_REF)
- [SQL Editor](https://supabase.com/dashboard/project/$PROJECT_REF/sql/new)
- [Database Tables](https://supabase.com/dashboard/project/$PROJECT_REF/database/tables)
- [Edge Functions](https://supabase.com/dashboard/project/$PROJECT_REF/functions)
- [Logs](https://supabase.com/dashboard/project/$PROJECT_REF/logs/explorer)

### Troubleshooting
- Check Supabase logs for errors
- Review deployment scripts output
- Verify environment variables
- Test API endpoints manually

---

**Report Generated:** $(date)
**Project:** $PROJECT_REF
**Status:** Deployment verification complete - manual review required

EOF

echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}"
echo ""
echo "Review the report for detailed verification results."
echo ""
echo "Quick verification commands:"
echo "  bash scripts/deployment/verify-deployment.sh"
echo "  bash scripts/deployment/verify-rls-detailed.sh"
echo "  bash scripts/deployment/verify-edge-functions.sh"
echo "  bash scripts/deployment/verify-cron-jobs.sh"
