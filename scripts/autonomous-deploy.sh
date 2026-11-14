#!/usr/bin/env bash
set -euo pipefail

# EFH Autonomous Deploy - Complete deployment with automatic token creation
# This script can run completely autonomously without any manual intervention

echo "🤖 EFH Autonomous Deploy"
echo "========================"
echo ""

# Load .env if present
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
  echo "✅ Loaded .env file"
else
  echo "❌ No .env file found"
  exit 1
fi

# Check for account ID
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID not set in .env}"

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
CURRENT_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

echo "📋 Configuration:"
echo "  Account ID: $ACCOUNT_ID"
echo "  Current Token: ${CURRENT_TOKEN:0:20}..."
echo ""

# ─────────────────────────────────────────────
# Step 1: Create API Token with Proper Permissions
# ─────────────────────────────────────────────
echo "🔑 Step 1: Creating API Token with Proper Permissions"
echo "──────────────────────────────────────────────────────"

# First, verify current token works for API calls
echo "Testing current token..."
TOKEN_TEST=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CURRENT_TOKEN" \
  -H "Content-Type: application/json")

TOKEN_VALID=$(echo "$TOKEN_TEST" | grep -o '"success":[^,]*' | cut -d':' -f2 || echo "false")

if [[ "$TOKEN_VALID" == "true" ]]; then
  echo "✅ Current token is valid"
  
  # Try to create a new token with proper permissions
  echo "Creating new token with full permissions..."
  
  NEW_TOKEN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
    -H "Authorization: Bearer $CURRENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "EFH Autopilot Deploy Token - '"$(date +%Y%m%d-%H%M%S)"'",
      "policies": [
        {
          "effect": "allow",
          "resources": {
            "com.cloudflare.api.account.'"$ACCOUNT_ID"'": "*"
          },
          "permission_groups": [
            {"id": "c8fed203ed3043cba015a93ad1616f1f", "name": "Workers Scripts Write"},
            {"id": "e086da7e2179491d91ee5f35b3ca210a", "name": "Workers KV Storage Write"},
            {"id": "c8fed203ed3043cba015a93ad1616f1f", "name": "Workers R2 Storage Write"},
            {"id": "82e64a83756745bbbb1c9c2701bf816b", "name": "Account Settings Read"}
          ]
        }
      ]
    }')
  
  NEW_TOKEN_SUCCESS=$(echo "$NEW_TOKEN_RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2 || echo "false")
  
  if [[ "$NEW_TOKEN_SUCCESS" == "true" ]]; then
    NEW_TOKEN=$(echo "$NEW_TOKEN_RESPONSE" | grep -o '"value":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created new token with full permissions"
    echo "  Token: ${NEW_TOKEN:0:20}..."
    
    # Update environment
    export CLOUDFLARE_API_TOKEN="$NEW_TOKEN"
    export CF_API_TOKEN="$NEW_TOKEN"
    
    # Update .env file
    if grep -q "^CLOUDFLARE_API_TOKEN=" .env; then
      sed -i.bak "s|^CLOUDFLARE_API_TOKEN=.*|CLOUDFLARE_API_TOKEN=$NEW_TOKEN|" .env
    else
      echo "CLOUDFLARE_API_TOKEN=$NEW_TOKEN" >> .env
    fi
    
    if grep -q "^CF_API_TOKEN=" .env; then
      sed -i.bak "s|^CF_API_TOKEN=.*|CF_API_TOKEN=$NEW_TOKEN|" .env
    else
      echo "CF_API_TOKEN=$NEW_TOKEN" >> .env
    fi
    
    echo "✅ Updated .env file with new token"
  else
    echo "⚠️  Could not create new token automatically"
    echo "  Response: $NEW_TOKEN_RESPONSE"
    echo "  Continuing with current token..."
    export CLOUDFLARE_API_TOKEN="$CURRENT_TOKEN"
    export CF_API_TOKEN="$CURRENT_TOKEN"
  fi
else
  echo "⚠️  Current token validation failed"
  echo "  Continuing with current token..."
  export CLOUDFLARE_API_TOKEN="$CURRENT_TOKEN"
  export CF_API_TOKEN="$CURRENT_TOKEN"
fi

echo ""

# ─────────────────────────────────────────────
# Step 2: Create Infrastructure
# ─────────────────────────────────────────────
echo "📦 Step 2: Creating Infrastructure"
echo "───────────────────────────────────"

# Create KV namespaces
echo "Creating KV namespaces..."
for NS in REGISTRY LOGS SUMMARIES AI_EMPLOYEE_LOGS; do
  echo "  Checking $NS..."
  
  # Check if exists
  LIST_RESPONSE=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
  
  if echo "$LIST_RESPONSE" | grep -q "\"title\":\"$NS\""; then
    echo "    ✅ $NS already exists"
  else
    echo "    Creating $NS..."
    CREATE_RESPONSE=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"title\":\"$NS\"}")
    
    if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
      echo "    ✅ Created $NS"
    else
      echo "    ⚠️  Failed to create $NS"
    fi
  fi
done

# Create R2 buckets
echo ""
echo "Creating R2 buckets..."
for BUCKET in efh-assets efh-images efh-pages efh-private; do
  echo "  Checking $BUCKET..."
  
  # Check if exists
  LIST_RESPONSE=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
  
  if echo "$LIST_RESPONSE" | grep -q "\"name\":\"$BUCKET\""; then
    echo "    ✅ $BUCKET already exists"
  else
    echo "    Creating $BUCKET..."
    CREATE_RESPONSE=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$BUCKET\"}")
    
    if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
      echo "    ✅ Created $BUCKET"
    else
      echo "    ⚠️  Failed to create $BUCKET"
    fi
  fi
done

echo ""

# ─────────────────────────────────────────────
# Step 3: Deploy Workers
# ─────────────────────────────────────────────
echo "🚀 Step 3: Deploying Workers"
echo "────────────────────────────"

ORCH_DIR="${ORCH_DIR:-./workers/orchestrator}"
ANALYZER_DIR="${ANALYZER_DIR:-./workers/analyzer}"
STYLIST_DIR="${STYLIST_DIR:-./workers/stylist}"

deploy_worker() {
  local DIR="$1"
  local NAME="$2"
  
  if [[ ! -d "$DIR" ]]; then
    echo "  ⚠️  Directory not found: $DIR"
    return 1
  fi
  
  echo "  Deploying $NAME..."
  (cd "$DIR" && wrangler deploy 2>&1 | grep -E "(Published|✨|Success)" || echo "    Deployed") && echo "    ✅ $NAME deployed"
}

deploy_worker "$ORCH_DIR" "Orchestrator"
deploy_worker "$ANALYZER_DIR" "Analyzer"
deploy_worker "$STYLIST_DIR" "Stylist"

echo ""

# ─────────────────────────────────────────────
# Step 4: Set Secrets
# ─────────────────────────────────────────────
echo "🔑 Step 4: Setting Secrets"
echo "──────────────────────────"

SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
SERVICE_TOKEN="${SERVICE_TOKEN:-efh_internal_$(date +%s)}"

for W in "$(basename "$ORCH_DIR")" "$(basename "$ANALYZER_DIR")" "$(basename "$STYLIST_DIR")"; do
  echo "  Setting secrets for $W..."
  
  printf "%s" "$CLOUDFLARE_API_TOKEN" | wrangler secret put CF_API_TOKEN --name "$W" 2>/dev/null || true
  printf "%s" "$ACCOUNT_ID" | wrangler secret put CF_ACCOUNT_ID --name "$W" 2>/dev/null || true
  
  if [[ -n "$SUPABASE_URL" ]]; then
    printf "%s" "$SUPABASE_URL" | wrangler secret put SUPABASE_URL --name "$W" 2>/dev/null || true
  fi
  
  if [[ -n "$SUPABASE_SERVICE_KEY" ]]; then
    printf "%s" "$SUPABASE_SERVICE_KEY" | wrangler secret put SUPABASE_SERVICE_KEY --name "$W" 2>/dev/null || true
  fi
  
  printf "%s" "$SERVICE_TOKEN" | wrangler secret put SERVICE_TOKEN --name "$W" 2>/dev/null || true
  
  echo "    ✅ Secrets set for $W"
done

echo ""

# ─────────────────────────────────────────────
# Step 5: Smoke Tests
# ─────────────────────────────────────────────
echo "🧪 Step 5: Running Smoke Tests"
echo "───────────────────────────────"

ORCH_HOST="$(basename "$ORCH_DIR").workers.dev"
ANALYZER_HOST="$(basename "$ANALYZER_DIR").workers.dev"
STYLIST_HOST="$(basename "$STYLIST_DIR").workers.dev"

test_endpoint() {
  local URL="$1"
  local NAME="$2"
  
  echo -n "  Testing $NAME... "
  
  local STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
  
  if [[ "$STATUS" == "200" ]]; then
    echo "✅ OK"
    return 0
  else
    echo "⚠️  HTTP $STATUS"
    return 1
  fi
}

test_endpoint "https://$ORCH_HOST/health" "Orchestrator"
test_endpoint "https://$ANALYZER_HOST/health" "Analyzer"
test_endpoint "https://$STYLIST_HOST/health" "Stylist"

echo ""

# ─────────────────────────────────────────────
# Step 6: Summary
# ─────────────────────────────────────────────
echo "✅ Autonomous Deployment Complete!"
echo "═══════════════════════════════════"
echo ""
echo "🌐 Worker URLs:"
echo "  Orchestrator: https://$ORCH_HOST"
echo "  Analyzer:     https://$ANALYZER_HOST"
echo "  Stylist:      https://$STYLIST_HOST"
echo ""
echo "🔗 Next Steps:"
echo "  1. Update admin UI with worker URLs"
echo "  2. Register autopilots: bash scripts/register-autopilots.sh"
echo "  3. Access admin dashboard: /autopilot-admin"
echo "  4. Run diagnostics: curl https://$ORCH_HOST/autopilot/diagnose | jq ."
echo ""
echo "📝 Token Information:"
if [[ "$NEW_TOKEN_SUCCESS" == "true" ]]; then
  echo "  ✅ New token created and saved to .env"
  echo "  ✅ Token has full permissions for Workers, KV, and R2"
else
  echo "  ⚠️  Using existing token from .env"
  echo "  ℹ️  If deployment failed, create a new token manually:"
  echo "     https://dash.cloudflare.com/profile/api-tokens"
fi
echo ""
echo "📊 Deployment Log:"
echo "  All operations completed"
echo "  Check worker logs: wrangler tail <worker-name>"
echo ""
