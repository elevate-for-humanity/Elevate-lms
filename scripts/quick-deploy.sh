#!/usr/bin/env bash
set -euo pipefail

# EFH Quick Deploy - One-liner to set secrets and deploy all workers
# Usage: bash scripts/quick-deploy.sh

echo "🚀 EFH Quick Deploy - Secrets + Deployment"
echo "==========================================="
echo ""

# Load .env if present
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
  echo "✅ Loaded .env file"
else
  echo "❌ No .env file found"
  echo "   Copy .env.bootstrap.example to .env and fill in your values"
  exit 1
fi

# Check required variables
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN not set in .env}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID not set in .env}"

# Export for wrangler
export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID

# Set defaults for optional variables
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
CF_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
SERVICE_TOKEN="${SERVICE_TOKEN:-efh_internal_$(date +%s)}"
SITE_TITLE="${SITE_TITLE:-Elevate For Humanity}"

echo ""
echo "📋 Configuration:"
echo "  Account ID: $CF_ACCOUNT_ID"
echo "  API Token: ${CF_API_TOKEN:0:20}..."
echo "  Supabase URL: ${SUPABASE_URL:-not set}"
echo "  Site Title: $SITE_TITLE"
echo ""

# ─────────────────────────────────────────────
# 1) Set secrets for all workers
# ─────────────────────────────────────────────
echo "🔑 Step 1: Setting secrets for all workers"
echo "───────────────────────────────────────────"

for W in efh-autopilot-orchestrator efh-autopilot-analyzer efh-stylist; do
  echo ""
  echo "Setting secrets for $W..."
  
  # Required secrets
  printf "%s" "$CF_API_TOKEN" | wrangler secret put CF_API_TOKEN --name "$W" 2>/dev/null || echo "  ⚠️  Failed to set CF_API_TOKEN"
  printf "%s" "$CF_ACCOUNT_ID" | wrangler secret put CF_ACCOUNT_ID --name "$W" 2>/dev/null || echo "  ⚠️  Failed to set CF_ACCOUNT_ID"
  
  # Optional Supabase secrets
  if [[ -n "$SUPABASE_URL" ]]; then
    printf "%s" "$SUPABASE_URL" | wrangler secret put SUPABASE_URL --name "$W" 2>/dev/null || echo "  ⚠️  Failed to set SUPABASE_URL"
  fi
  
  if [[ -n "$SUPABASE_SERVICE_KEY" ]]; then
    printf "%s" "$SUPABASE_SERVICE_KEY" | wrangler secret put SUPABASE_SERVICE_KEY --name "$W" 2>/dev/null || echo "  ⚠️  Failed to set SUPABASE_SERVICE_KEY"
  fi
  
  if [[ -n "$SUPABASE_DB_PASSWORD" ]]; then
    printf "%s" "$SUPABASE_DB_PASSWORD" | wrangler secret put SUPABASE_DB_PASSWORD --name "$W" 2>/dev/null || echo "  ⚠️  Failed to set SUPABASE_DB_PASSWORD"
  fi
  
  # Service token for inter-worker auth
  printf "%s" "$SERVICE_TOKEN" | wrangler secret put SERVICE_TOKEN --name "$W" 2>/dev/null || echo "  ⚠️  Failed to set SERVICE_TOKEN"
  
  echo "  ✅ Secrets set for $W"
done

# Stylist-specific branding
echo ""
echo "Setting stylist-specific secrets..."
printf "%s" "$SITE_TITLE" | wrangler secret put SITE_TITLE --name efh-stylist 2>/dev/null || echo "  ⚠️  Failed to set SITE_TITLE"
echo "  ✅ Stylist branding set"

# ─────────────────────────────────────────────
# 2) Verify KV namespaces and R2 buckets
# ─────────────────────────────────────────────
echo ""
echo "📦 Step 2: Verifying infrastructure"
echo "────────────────────────────────────"

# Check KV namespaces
echo "Checking KV namespaces..."
wrangler kv:namespace list > /tmp/kv_list.txt 2>/dev/null || echo "" > /tmp/kv_list.txt

for NS in REGISTRY LOGS SUMMARIES AI_EMPLOYEE_LOGS; do
  if grep -q "\"title\": \"$NS\"" /tmp/kv_list.txt 2>/dev/null; then
    echo "  ✅ KV namespace '$NS' exists"
  else
    echo "  ⚠️  KV namespace '$NS' not found - creating..."
    wrangler kv:namespace create "$NS" 2>/dev/null || echo "  ❌ Failed to create $NS"
  fi
done

# Check R2 buckets
echo "Checking R2 buckets..."
wrangler r2 bucket list > /tmp/r2_list.txt 2>/dev/null || echo "" > /tmp/r2_list.txt

for BUCKET in efh-assets efh-images efh-pages efh-private; do
  if grep -q "$BUCKET" /tmp/r2_list.txt 2>/dev/null; then
    echo "  ✅ R2 bucket '$BUCKET' exists"
  else
    echo "  ⚠️  R2 bucket '$BUCKET' not found - creating..."
    wrangler r2 bucket create "$BUCKET" 2>/dev/null || echo "  ❌ Failed to create $BUCKET"
  fi
done

# ─────────────────────────────────────────────
# 3) Deploy workers
# ─────────────────────────────────────────────
echo ""
echo "🚀 Step 3: Deploying workers"
echo "────────────────────────────"

deploy_worker() {
  local DIR="$1"
  local NAME="$2"
  
  if [[ ! -d "$DIR" ]]; then
    echo "  ⚠️  Directory not found: $DIR"
    return 1
  fi
  
  echo ""
  echo "Deploying $NAME..."
  (cd "$DIR" && wrangler deploy 2>&1) || {
    echo "  ❌ Failed to deploy $NAME"
    return 1
  }
  echo "  ✅ Deployed $NAME"
}

deploy_worker "workers/orchestrator" "Orchestrator"
deploy_worker "workers/analyzer" "Analyzer"
deploy_worker "workers/stylist" "Stylist"

# ─────────────────────────────────────────────
# 4) Smoke tests
# ─────────────────────────────────────────────
echo ""
echo "🧪 Step 4: Running smoke tests"
echo "───────────────────────────────"

test_endpoint() {
  local URL="$1"
  local NAME="$2"
  
  echo -n "Testing $NAME... "
  
  local STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
  
  if [[ "$STATUS" == "200" ]]; then
    echo "✅ OK ($STATUS)"
    return 0
  elif [[ "$STATUS" == "000" ]]; then
    echo "❌ Failed to connect"
    return 1
  else
    echo "⚠️  HTTP $STATUS"
    return 1
  fi
}

echo ""
test_endpoint "https://efh-autopilot-orchestrator.workers.dev/health" "Orchestrator health"
test_endpoint "https://efh-autopilot-orchestrator.workers.dev/autopilot/diagnose" "Orchestrator diagnose"
test_endpoint "https://efh-autopilot-analyzer.workers.dev/health" "Analyzer health"
test_endpoint "https://efh-autopilot-analyzer.workers.dev/logs/stats?days=1" "Analyzer stats"
test_endpoint "https://efh-stylist.workers.dev/health" "Stylist health"
test_endpoint "https://efh-stylist.workers.dev/site/home" "Stylist page"

# ─────────────────────────────────────────────
# 5) Summary
# ─────────────────────────────────────────────
echo ""
echo "✅ Quick Deploy Complete!"
echo "═════════════════════════"
echo ""
echo "🌐 Worker URLs:"
echo "  Orchestrator: https://efh-autopilot-orchestrator.workers.dev"
echo "  Analyzer:     https://efh-autopilot-analyzer.workers.dev"
echo "  Stylist:      https://efh-stylist.workers.dev"
echo ""
echo "🔗 Next steps:"
echo "  1. Update admin UI with worker URLs:"
echo "     Edit src/pages/AutopilotAdmin.tsx"
echo ""
echo "  2. Register autopilots:"
echo "     bash scripts/register-autopilots.sh"
echo ""
echo "  3. Access admin dashboard:"
echo "     Navigate to /autopilot-admin"
echo ""
echo "  4. Test with curl:"
echo "     curl https://efh-autopilot-orchestrator.workers.dev/autopilot/diagnose | jq ."
echo ""
echo "📚 Documentation:"
echo "  - README_DEPLOYMENT.md"
echo "  - ORCHESTRATOR_GUIDE.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
echo ""
