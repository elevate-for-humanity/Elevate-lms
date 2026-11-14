#!/bin/bash

# Cron Jobs Verification Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  ⏰ CRON JOBS VERIFICATION${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Load environment
export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)

echo "Project: $PROJECT_REF"
echo ""

# Expected cron jobs
EXPECTED_JOBS=(
    "process-email-queue:Process pending emails:* * * * *"
    "process-webhook-queue:Process pending webhooks:* * * * *"
    "cleanup-old-logs:Clean up old log entries:0 2 * * *"
    "update-campaign-stats:Update campaign statistics:0 * * * *"
)

echo -e "${YELLOW}Expected Cron Jobs:${NC}"
echo ""

for job_info in "${EXPECTED_JOBS[@]}"; do
    IFS=':' read -r job_name job_desc job_schedule <<< "$job_info"
    echo -e "${BLUE}📅 $job_name${NC}"
    echo "   Description: $job_desc"
    echo "   Schedule: $job_schedule"
    echo ""
done

echo -e "${YELLOW}Note:${NC} Cron jobs require pg_cron extension to be enabled."
echo ""
echo "Verification steps:"
echo ""
echo "1. Check if pg_cron extension is enabled:"
echo "   Go to: https://supabase.com/dashboard/project/$PROJECT_REF/database/extensions"
echo "   Search for 'pg_cron' and enable it"
echo ""
echo "2. View scheduled jobs:"
echo "   Go to: https://supabase.com/dashboard/project/$PROJECT_REF/database/cron-jobs"
echo "   Or run SQL query:"
echo "   SELECT * FROM cron.job;"
echo ""
echo "3. Check job execution history:"
echo "   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CRON JOBS INFO${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

echo "Cron jobs are scheduled to run automatically:"
echo ""
echo "• process-email-queue: Every minute"
echo "  Processes pending emails from the queue"
echo ""
echo "• process-webhook-queue: Every minute"
echo "  Sends pending webhook notifications"
echo ""
echo "• cleanup-old-logs: Daily at 2 AM"
echo "  Removes logs older than 90 days"
echo ""
echo "• update-campaign-stats: Every hour"
echo "  Updates campaign statistics"
echo ""

echo "To manually trigger a job (via SQL):"
echo "  SELECT cron.schedule('job-name', '* * * * *', \$\$SQL COMMAND\$\$);"
echo ""

echo "To view job status:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/logs/postgres-logs"
echo ""

echo -e "${YELLOW}⚠️  Important:${NC}"
echo "Cron jobs may not work if:"
echo "1. pg_cron extension is not enabled"
echo "2. Database is on free tier (limited cron support)"
echo "3. Jobs were not created during migration"
echo ""
echo "If cron jobs are not working, you can:"
echo "1. Enable pg_cron extension in dashboard"
echo "2. Re-run the cron jobs migration"
echo "3. Use external schedulers (GitHub Actions, etc.)"
