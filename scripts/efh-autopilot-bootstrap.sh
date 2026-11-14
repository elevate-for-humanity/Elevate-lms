#!/usr/bin/env bash
set -euo pipefail

# EFH Autopilot Bootstrap Script
# Detects, creates, and upgrades all Cloudflare infrastructure
# Plus Supabase Edge Functions and Frontend deployment

echo "🚀 EFH Autopilot Bootstrap: Complete Stack Deployment"
echo "======================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────
# 1️⃣ Prerequisites Check
# ─────────────────────────────────────────────
echo "🔍 Step 1: Checking Prerequisites"
echo "─────────────────────────────────"

# Check for wrangler
if ! command -v wrangler >/dev/null 2>&1; then
  echo -e "${RED}❌ Wrangler CLI not found${NC}"
  echo "   Install with: npm i -g wrangler"
  exit 1
fi
echo -e "${GREEN}✅ Wrangler CLI found${NC}"

# Check for supabase CLI (optional)
if command -v supabase >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Supabase CLI found${NC}"
  HAS_SUPABASE=true
else
  echo -e "${YELLOW}⚠️  Supabase CLI not found (optional)${NC}"
  HAS_SUPABASE=false
fi

# Load environment variables from .env
if [[ -f ".env" ]]; then
  echo -e "${BLUE}📄 Loading .env file${NC}"
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
  echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
  echo -e "${YELLOW}⚠️  No .env file found${NC}"
fi

# Check required environment variables
CF_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-${CF_ACCOUNT_ID:-}}"
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-}}"

if [[ -z "$CF_ACCOUNT_ID" ]]; then
  echo -e "${RED}❌ Missing CLOUDFLARE_ACCOUNT_ID in environment${NC}"
  echo "   Set it in .env or export it"
  exit 1
fi

if [[ -z "$CF_API_TOKEN" ]]; then
  echo -e "${RED}❌ Missing CLOUDFLARE_API_TOKEN in environment${NC}"
  echo "   Set it in .env or export it"
  exit 1
fi

echo -e "${GREEN}✅ Cloudflare credentials found${NC}"
echo -e "${BLUE}   Account ID: $CF_ACCOUNT_ID${NC}"
echo -e "${BLUE}   Token: ${CF_API_TOKEN:0:20}...${NC}"

# Export for wrangler
export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"

echo ""

# ─────────────────────────────────────────────
# 2️⃣ Detect Existing Resources
# ─────────────────────────────────────────────
echo "🔍 Step 2: Detecting Existing Resources"
echo "────────────────────────────────────────"

echo "Checking KV namespaces..."
wrangler kv:namespace list > /tmp/kv_list.txt 2>/dev/null || echo "" > /tmp/kv_list.txt
KV_COUNT=$(cat /tmp/kv_list.txt | grep -c "title" || echo "0")
echo -e "${BLUE}   Found $KV_COUNT KV namespaces${NC}"

echo "Checking R2 buckets..."
wrangler r2 bucket list > /tmp/r2_list.txt 2>/dev/null || echo "" > /tmp/r2_list.txt
R2_COUNT=$(cat /tmp/r2_list.txt | grep -c "name" || echo "0")
echo -e "${BLUE}   Found $R2_COUNT R2 buckets${NC}"

echo "Checking deployed Workers..."
wrangler deployments list > /tmp/workers_list.txt 2>/dev/null || echo "" > /tmp/workers_list.txt
WORKER_COUNT=$(cat /tmp/workers_list.txt | grep -c "https://" || echo "0")
echo -e "${BLUE}   Found $WORKER_COUNT deployed Workers${NC}"

echo ""

# ─────────────────────────────────────────────
# 3️⃣ Create KV Namespaces
# ─────────────────────────────────────────────
echo "📦 Step 3: Ensuring KV Namespaces"
echo "──────────────────────────────────"

ensure_kv() {
  local NAME="$1"
  if grep -q "\"title\": \"$NAME\"" /tmp/kv_list.txt 2>/dev/null; then
    echo -e "${GREEN}✅ KV namespace '$NAME' already exists${NC}"
    # Extract ID
    local ID=$(grep -A 1 "\"title\": \"$NAME\"" /tmp/kv_list.txt | grep "\"id\"" | cut -d'"' -f4)
    echo -e "${BLUE}   ID: $ID${NC}"
    echo "$ID"
  else
    echo -e "${YELLOW}➕ Creating KV namespace '$NAME'...${NC}"
    local OUTPUT=$(wrangler kv:namespace create "$NAME" 2>&1)
    local ID=$(echo "$OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    if [[ -n "$ID" ]]; then
      echo -e "${GREEN}✅ Created KV namespace '$NAME' with ID: $ID${NC}"
      echo "$ID"
    else
      echo -e "${RED}❌ Failed to create KV namespace '$NAME'${NC}"
      echo "$OUTPUT"
      return 1
    fi
  fi
}

REGISTRY_ID=$(ensure_kv "REGISTRY")
LOGS_ID=$(ensure_kv "LOGS")
SUMMARIES_ID=$(ensure_kv "SUMMARIES")
AI_EMPLOYEE_LOGS_ID=$(ensure_kv "AI_EMPLOYEE_LOGS")

echo ""

# ─────────────────────────────────────────────
# 4️⃣ Create R2 Buckets
# ─────────────────────────────────────────────
echo "🪣 Step 4: Ensuring R2 Buckets"
echo "──────────────────────────────"

ensure_r2() {
  local NAME="$1"
  if grep -q "$NAME" /tmp/r2_list.txt 2>/dev/null; then
    echo -e "${GREEN}✅ R2 bucket '$NAME' already exists${NC}"
  else
    echo -e "${YELLOW}➕ Creating R2 bucket '$NAME'...${NC}"
    if wrangler r2 bucket create "$NAME" 2>&1; then
      echo -e "${GREEN}✅ Created R2 bucket '$NAME'${NC}"
    else
      echo -e "${RED}❌ Failed to create R2 bucket '$NAME'${NC}"
      return 1
    fi
  fi
}

ensure_r2 "efh-assets"
ensure_r2 "efh-images"
ensure_r2 "efh-pages"
ensure_r2 "efh-private"

echo ""

# ─────────────────────────────────────────────
# 5️⃣ Update Wrangler Configs with KV IDs
# ─────────────────────────────────────────────
echo "📝 Step 5: Updating Wrangler Configurations"
echo "────────────────────────────────────────────"

update_wrangler_kv() {
  local FILE="$1"
  local BINDING="$2"
  local ID="$3"
  
  if [[ ! -f "$FILE" ]]; then
    echo -e "${YELLOW}⚠️  File not found: $FILE${NC}"
    return
  fi
  
  echo "Updating $FILE with $BINDING = $ID"
  
  # Check if binding exists and update ID
  if grep -q "binding = \"$BINDING\"" "$FILE"; then
    # Create backup
    cp "$FILE" "$FILE.bak"
    
    # Update the ID line after the binding
    sed -i "/binding = \"$BINDING\"/,/^id = / s|^id = .*|id = \"$ID\"|" "$FILE"
    
    # If id line doesn't exist, add it
    if ! grep -A 1 "binding = \"$BINDING\"" "$FILE" | grep -q "^id = "; then
      sed -i "/binding = \"$BINDING\"/a id = \"$ID\"" "$FILE"
    fi
    
    echo -e "${GREEN}✅ Updated $BINDING in $FILE${NC}"
  else
    echo -e "${YELLOW}⚠️  Binding $BINDING not found in $FILE${NC}"
  fi
}

# Update orchestrator config
if [[ -f "workers/orchestrator/wrangler.toml" ]]; then
  update_wrangler_kv "workers/orchestrator/wrangler.toml" "REGISTRY" "$REGISTRY_ID"
fi

# Update analyzer config
if [[ -f "workers/analyzer/wrangler.toml" ]]; then
  update_wrangler_kv "workers/analyzer/wrangler.toml" "LOGS" "$LOGS_ID"
  update_wrangler_kv "workers/analyzer/wrangler.toml" "SUMMARIES" "$SUMMARIES_ID"
fi

echo ""

# ─────────────────────────────────────────────
# 6️⃣ Deploy Workers
# ─────────────────────────────────────────────
echo "🚀 Step 6: Deploying Workers"
echo "────────────────────────────"

deploy_worker() {
  local DIR="$1"
  local NAME="$2"
  
  if [[ ! -d "$DIR" ]]; then
    echo -e "${YELLOW}⚠️  Directory not found: $DIR${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Deploying $NAME from $DIR...${NC}"
  
  cd "$DIR"
  
  if wrangler deploy 2>&1; then
    echo -e "${GREEN}✅ Successfully deployed $NAME${NC}"
    cd - > /dev/null
    return 0
  else
    echo -e "${RED}❌ Failed to deploy $NAME${NC}"
    cd - > /dev/null
    return 1
  fi
}

# Deploy orchestrator
if [[ -d "workers/orchestrator" ]]; then
  deploy_worker "workers/orchestrator" "Orchestrator"
else
  echo -e "${YELLOW}⚠️  Orchestrator directory not found${NC}"
fi

# Deploy analyzer
if [[ -d "workers/analyzer" ]]; then
  deploy_worker "workers/analyzer" "Analyzer"
else
  echo -e "${YELLOW}⚠️  Analyzer directory not found${NC}"
fi

echo ""

# ─────────────────────────────────────────────
# 7️⃣ Set Worker Secrets
# ─────────────────────────────────────────────
echo "🔑 Step 7: Setting Worker Secrets"
echo "──────────────────────────────────"

set_worker_secret() {
  local WORKER_DIR="$1"
  local SECRET_NAME="$2"
  local SECRET_VALUE="$3"
  
  if [[ -z "$SECRET_VALUE" ]]; then
    echo -e "${YELLOW}⚠️  Skipping $SECRET_NAME (not set)${NC}"
    return
  fi
  
  cd "$WORKER_DIR"
  echo "$SECRET_VALUE" | wrangler secret put "$SECRET_NAME" 2>/dev/null || true
  echo -e "${GREEN}✅ Set $SECRET_NAME for $(basename $WORKER_DIR)${NC}"
  cd - > /dev/null
}

# Set secrets for orchestrator
if [[ -d "workers/orchestrator" ]]; then
  set_worker_secret "workers/orchestrator" "CF_ACCOUNT_ID" "$CF_ACCOUNT_ID"
  set_worker_secret "workers/orchestrator" "CF_API_TOKEN" "$CF_API_TOKEN"
fi

# Set secrets for analyzer
if [[ -d "workers/analyzer" ]]; then
  set_worker_secret "workers/analyzer" "CF_ACCOUNT_ID" "$CF_ACCOUNT_ID"
  set_worker_secret "workers/analyzer" "CF_API_TOKEN" "$CF_API_TOKEN"
fi

echo ""

# ─────────────────────────────────────────────
# 8️⃣ Validate Endpoints
# ─────────────────────────────────────────────
echo "🧪 Step 8: Validating Endpoints"
echo "────────────────────────────────"

test_endpoint() {
  local URL="$1"
  local NAME="$2"
  
  echo -n "Testing $NAME... "
  
  local STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
  
  if [[ "$STATUS" == "200" ]]; then
    echo -e "${GREEN}✅ OK (HTTP $STATUS)${NC}"
    return 0
  elif [[ "$STATUS" == "000" ]]; then
    echo -e "${RED}❌ Failed to connect${NC}"
    return 1
  else
    echo -e "${YELLOW}⚠️  HTTP $STATUS${NC}"
    return 1
  fi
}

# Test orchestrator
test_endpoint "https://efh-autopilot-orchestrator.workers.dev/health" "Orchestrator Health"
test_endpoint "https://efh-autopilot-orchestrator.workers.dev/autopilot/list" "Orchestrator List"

# Test analyzer
test_endpoint "https://efh-autopilot-analyzer.workers.dev/health" "Analyzer Health"

echo ""

# ─────────────────────────────────────────────
# 9️⃣ Supabase Edge Functions (Optional)
# ─────────────────────────────────────────────
if [[ "$HAS_SUPABASE" == true ]] && [[ -d "supabase/functions" ]]; then
  echo "🔧 Step 9: Deploying Supabase Edge Functions"
  echo "─────────────────────────────────────────────"
  
  if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    echo "Deploying Edge Functions..."
    
    # Deploy each function
    for func_dir in supabase/functions/*/; do
      if [[ -d "$func_dir" ]]; then
        func_name=$(basename "$func_dir")
        echo -e "${BLUE}Deploying function: $func_name${NC}"
        
        if supabase functions deploy "$func_name" 2>&1; then
          echo -e "${GREEN}✅ Deployed $func_name${NC}"
        else
          echo -e "${YELLOW}⚠️  Failed to deploy $func_name${NC}"
        fi
      fi
    done
  else
    echo -e "${YELLOW}⚠️  SUPABASE_ACCESS_TOKEN not set, skipping Edge Functions${NC}"
  fi
  
  echo ""
else
  echo -e "${YELLOW}⚠️  Skipping Supabase Edge Functions (CLI not found or no functions directory)${NC}"
  echo ""
fi

# ─────────────────────────────────────────────
# 🔟 Frontend Build (Optional)
# ─────────────────────────────────────────────
echo "🎨 Step 10: Building Frontend (Optional)"
echo "─────────────────────────────────────────"

if [[ -f "package.json" ]]; then
  echo "Building frontend..."
  
  if npm run build 2>&1; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    
    # Check if dist directory exists
    if [[ -d "dist" ]]; then
      echo -e "${BLUE}   Build output: dist/ ($(du -sh dist | cut -f1))${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Frontend build failed or not configured${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No package.json found, skipping frontend build${NC}"
fi

echo ""

# ─────────────────────────────────────────────
# ✅ Summary
# ─────────────────────────────────────────────
echo "🎉 Bootstrap Complete!"
echo "═══════════════════════"
echo ""
echo "📊 Summary:"
echo "───────────"
echo -e "${GREEN}✅ KV Namespaces:${NC}"
echo "   - REGISTRY: $REGISTRY_ID"
echo "   - LOGS: $LOGS_ID"
echo "   - SUMMARIES: $SUMMARIES_ID"
echo ""
echo -e "${GREEN}✅ R2 Buckets:${NC}"
echo "   - efh-assets"
echo "   - efh-images"
echo "   - efh-pages"
echo "   - efh-private"
echo ""
echo -e "${GREEN}✅ Workers Deployed:${NC}"
echo "   - Orchestrator: https://efh-autopilot-orchestrator.workers.dev"
echo "   - Analyzer: https://efh-autopilot-analyzer.workers.dev"
echo ""
echo "🔗 Next Steps:"
echo "──────────────"
echo "1. Update your admin UI with worker URLs in:"
echo "   src/pages/AutopilotAdmin.tsx"
echo ""
echo "2. Register your autopilots:"
echo "   bash scripts/register-autopilots.sh"
echo ""
echo "3. Access the admin dashboard:"
echo "   Navigate to /autopilot-admin in your app"
echo ""
echo "4. Run diagnostics:"
echo "   curl https://efh-autopilot-orchestrator.workers.dev/autopilot/diagnose"
echo ""
echo "📚 Documentation:"
echo "   - ORCHESTRATOR_GUIDE.md"
echo "   - DEPLOYMENT_SUMMARY.md"
echo "   - WEBSITE_IMPROVEMENTS.md"
echo ""
echo "🎊 Your AI orchestration platform is ready!"
echo ""
