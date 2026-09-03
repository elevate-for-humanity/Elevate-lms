#!/usr/bin/env bash
set -e

# Zapier Alert Integration
# Sends alerts to Zapier webhook when tests fail

# Configuration
ZAPIER_WEBHOOK_URL="${ZAPIER_WEBHOOK_URL:-}"
ALERT_TYPE="${1:-test_failure}"
ALERT_MESSAGE="${2:-Durable Bridge test failed}"
ALERT_SEVERITY="${3:-high}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if webhook URL is configured
if [ -z "$ZAPIER_WEBHOOK_URL" ]; then
  echo -e "${YELLOW}⚠️  ZAPIER_WEBHOOK_URL not configured${NC}"
  echo "Set it in .env or as environment variable"
  echo "Example: ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx/"
  exit 0
fi

# Gather system information
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HOSTNAME=$(hostname)
REPO="elevateforhumanity/fix2"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Read status files if available
BRIDGE_STATUS=""
TEST_REPORT=""

if [ -f "logs/durable-bridge-status.json" ]; then
  BRIDGE_STATUS=$(cat logs/durable-bridge-status.json)
fi

if [ -f "logs/durable-bridge-test-report.json" ]; then
  TEST_REPORT=$(cat logs/durable-bridge-test-report.json)
fi

# Build payload
PAYLOAD=$(cat <<EOF
{
  "alert_type": "$ALERT_TYPE",
  "severity": "$ALERT_SEVERITY",
  "message": "$ALERT_MESSAGE",
  "timestamp": "$TIMESTAMP",
  "system": {
    "hostname": "$HOSTNAME",
    "repository": "$REPO",
    "branch": "$BRANCH",
    "commit": "$COMMIT"
  },
  "urls": {
    "bridge_script": "https://elevateforhumanityfix2.netlify.app/efh-bridge.js",
    "config": "https://elevateforhumanityfix2.netlify.app/api/efh-config.json",
    "github_actions": "https://github.com/$REPO/actions",
    "netlify_dashboard": "https://app.netlify.com/sites/elevateforhumanityfix2"
  },
  "bridge_status": $BRIDGE_STATUS,
  "test_report": $TEST_REPORT
}
EOF
)

# Send to Zapier
echo -e "${YELLOW}📤 Sending alert to Zapier...${NC}"

RESPONSE=$(curl -sf -X POST "$ZAPIER_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP_CODE:%{http_code}" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Alert sent successfully to Zapier${NC}"
  echo "   Type: $ALERT_TYPE"
  echo "   Severity: $ALERT_SEVERITY"
  echo "   Message: $ALERT_MESSAGE"
  
  # Log the alert
  mkdir -p logs
  echo "[$(date)] Alert sent: $ALERT_TYPE - $ALERT_MESSAGE" >> logs/zapier-alerts.log
  
  exit 0
else
  echo -e "${RED}❌ Failed to send alert to Zapier${NC}"
  echo "   HTTP Code: $HTTP_CODE"
  echo "   Response: $RESPONSE"
  exit 1
fi
