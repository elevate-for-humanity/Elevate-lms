#!/bin/bash

# Register all existing autopilots with the orchestrator

set -e

# Check if ORCHESTRATOR_URL is set
if [ -z "$ORCHESTRATOR_URL" ]; then
  echo "❌ ORCHESTRATOR_URL not set"
  echo "Usage: export ORCHESTRATOR_URL=https://efh-autopilot-orchestrator.your-subdomain.workers.dev"
  echo "       bash scripts/register-autopilots.sh"
  exit 1
fi

echo "🚀 Registering Autopilots with Orchestrator..."
echo "Orchestrator: $ORCHESTRATOR_URL"
echo ""

# Register AI Employee
echo "📧 Registering AI Employee..."
curl -X POST "$ORCHESTRATOR_URL/autopilot/registry" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ai-employee",
    "endpoint": "https://efh-agent.your-subdomain.workers.dev",
    "capabilities": [
      "email.process",
      "crm.lead.create",
      "crm.lead.update",
      "email.send",
      "payment.checkout.create",
      "lms.enrollment.create",
      "files.intake.upload",
      "task.schedule"
    ],
    "needs": {
      "kvNamespaces": ["AI_EMPLOYEE_LOGS"],
      "r2Buckets": ["efh-private"]
    }
  }'
echo ""
echo ""

# Register AI Stylist
echo "🎨 Registering AI Stylist..."
curl -X POST "$ORCHESTRATOR_URL/autopilot/registry" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ai-stylist",
    "endpoint": "https://efh-ai-stylist.your-subdomain.workers.dev",
    "capabilities": [
      "web.pages.generate",
      "web.asset.generate",
      "web.section.generate"
    ],
    "needs": {
      "r2Buckets": ["efh-assets", "efh-images"]
    }
  }'
echo ""
echo ""

# Register Page Deployer
echo "🚀 Registering Page Deployer..."
curl -X POST "$ORCHESTRATOR_URL/autopilot/registry" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "page-deployer",
    "endpoint": "https://efh-page-deployer.your-subdomain.workers.dev",
    "capabilities": [
      "web.pages.deploy",
      "web.pages.publish"
    ],
    "needs": {
      "r2Buckets": ["efh-pages"]
    }
  }'
echo ""
echo ""

# Register Payout Batch (part of AI Employee)
echo "💰 Registering Payout Batch..."
curl -X POST "$ORCHESTRATOR_URL/autopilot/registry" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payout-batch",
    "endpoint": "https://efh-agent.your-subdomain.workers.dev/connect/payout-batch",
    "capabilities": [
      "payouts.batch.run",
      "payouts.transfer.single",
      "commissions.calculate"
    ],
    "needs": {
      "r2Buckets": ["efh-payouts-logs"]
    }
  }'
echo ""
echo ""

echo "✅ All autopilots registered!"
echo ""
echo "📋 List all registered autopilots:"
echo "curl $ORCHESTRATOR_URL/autopilot/list"
echo ""
echo "🔍 Diagnose infrastructure:"
echo "curl $ORCHESTRATOR_URL/autopilot/diagnose"
echo ""
echo "🎯 Run a task:"
echo "curl -X POST $ORCHESTRATOR_URL/autopilot/plan -H 'Content-Type: application/json' -d '{\"task\":\"generate_page\",\"meta\":{\"pageType\":\"home\"}}'"
