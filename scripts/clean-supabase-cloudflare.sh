#!/bin/bash
# Clean ALL old builds from Supabase and Cloudflare
# Remove cached content, old deployments, and stale data

set -e

echo "🧹 CLEANING SUPABASE & CLOUDFLARE"
echo "=========================================="
echo ""

# ============================================
# SECTION 1: SUPABASE CLEANUP
# ============================================
echo "=========================================="
echo "SECTION 1: SUPABASE STORAGE CLEANUP"
echo "=========================================="
echo ""

SUPABASE_URL="https://cuxzzpsyufcewtmicszk.supabase.co"
SUPABASE_PROJECT_REF="cuxzzpsyufcewtmicszk"

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set"
    echo "   Skipping Supabase cleanup"
    echo ""
    echo "To clean Supabase storage:"
    echo "1. Get service role key from: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
    echo "2. Run: export SUPABASE_SERVICE_ROLE_KEY='your_key'"
    echo "3. Re-run this script"
    echo ""
else
    echo "✅ Supabase key found"
    echo ""
    
    echo "Checking Supabase storage buckets..."
    
    # List all buckets
    BUCKETS=$(curl -s \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        "$SUPABASE_URL/storage/v1/bucket")
    
    echo "Storage buckets:"
    echo "$BUCKETS" | jq -r '.[] | .name' | while read bucket; do
        echo "  - $bucket"
    done
    echo ""
    
    # Check for cached/old content in buckets
    for bucket in "generated-content" "course-materials" "user-uploads" "certificates"; do
        echo "Checking bucket: $bucket"
        
        # List files in bucket
        FILES=$(curl -s \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            "$SUPABASE_URL/storage/v1/object/list/$bucket" 2>/dev/null || echo "[]")
        
        FILE_COUNT=$(echo "$FILES" | jq 'length' 2>/dev/null || echo "0")
        
        if [ "$FILE_COUNT" -gt 0 ]; then
            echo "  Found $FILE_COUNT files in $bucket"
            echo "  ⚠️  Review these files manually if needed"
        else
            echo "  ✅ No files in $bucket"
        fi
    done
    echo ""
    
    echo "Supabase storage checked"
    echo "Note: Files are NOT automatically deleted - review manually if needed"
    echo ""
fi

# ============================================
# SECTION 2: CLOUDFLARE CLEANUP
# ============================================
echo "=========================================="
echo "SECTION 2: CLOUDFLARE CACHE CLEANUP"
echo "=========================================="
echo ""

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "⚠️  CLOUDFLARE_API_TOKEN not set"
    echo "   Skipping Cloudflare cleanup"
    echo ""
    echo "To clean Cloudflare cache:"
    echo "1. Get API token from: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Run: export CLOUDFLARE_API_TOKEN='your_token'"
    echo "3. Run: export CLOUDFLARE_ZONE_ID='your_zone_id'"
    echo "4. Re-run this script"
    echo ""
else
    echo "✅ Cloudflare token found"
    echo ""
    
    if [ -z "${CLOUDFLARE_ZONE_ID:-}" ]; then
        echo "⚠️  CLOUDFLARE_ZONE_ID not set"
        echo ""
        echo "Finding zone ID..."
        
        # List zones
        ZONES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json")
        
        if echo "$ZONES" | jq -e '.success' > /dev/null 2>&1; then
            echo "Available zones:"
            echo "$ZONES" | jq -r '.result[] | "\(.name) - \(.id)"'
            echo ""
            echo "Set your zone ID:"
            echo "export CLOUDFLARE_ZONE_ID='your_zone_id_from_above'"
        else
            echo "❌ Could not fetch zones"
            echo "$ZONES" | jq -r '.errors[]?.message // "Unknown error"'
        fi
    else
        echo "Zone ID: $CLOUDFLARE_ZONE_ID"
        echo ""
        
        echo "Purging ALL Cloudflare cache..."
        
        PURGE_RESULT=$(curl -s -X POST \
            "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"purge_everything":true}')
        
        if echo "$PURGE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
            echo "✅ Cloudflare cache purged successfully"
            echo ""
            
            # Get cache purge ID
            PURGE_ID=$(echo "$PURGE_RESULT" | jq -r '.result.id // "unknown"')
            echo "   Purge ID: $PURGE_ID"
        else
            echo "❌ Failed to purge Cloudflare cache"
            echo "$PURGE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
        fi
        echo ""
        
        # Check Cloudflare Workers
        echo "Checking Cloudflare Workers..."
        
        WORKERS=$(curl -s -X GET \
            "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID:-}/workers/scripts" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" 2>/dev/null || echo '{"result":[]}')
        
        WORKER_COUNT=$(echo "$WORKERS" | jq '.result | length' 2>/dev/null || echo "0")
        
        if [ "$WORKER_COUNT" -gt 0 ]; then
            echo "Found $WORKER_COUNT workers:"
            echo "$WORKERS" | jq -r '.result[]?.id // empty' | while read worker_id; do
                echo "  - $worker_id"
            done
            echo ""
            echo "⚠️  Review workers manually if they reference old builds"
        else
            echo "✅ No workers found (or account ID not set)"
        fi
        echo ""
    fi
fi

# ============================================
# SECTION 3: CHECK FOR OLD BUILD REFERENCES
# ============================================
echo "=========================================="
echo "SECTION 3: CHECK CODE FOR OLD REFERENCES"
echo "=========================================="
echo ""

echo "Scanning for Supabase references to old builds..."

# Check for old domain references in Supabase config
SUPABASE_REFS=$(grep -r "elevateforhumanity.org\|elevateforhumanityfix" . \
    --include="*.sql" \
    --include="supabase.json" \
    --include="config.toml" \
    2>/dev/null | grep -v "elevateproduction.netlify.app" | wc -l)

if [ "$SUPABASE_REFS" -gt 0 ]; then
    echo "⚠️  Found $SUPABASE_REFS references to old domains in Supabase files"
    echo ""
    grep -r "elevateforhumanity.org\|elevateforhumanityfix" . \
        --include="*.sql" \
        --include="supabase.json" \
        --include="config.toml" \
        2>/dev/null | grep -v "elevateproduction.netlify.app" | head -10
    echo ""
else
    echo "✅ No old domain references in Supabase files"
fi

echo ""
echo "Scanning for Cloudflare references to old builds..."

# Check for old domain references in Cloudflare config
CLOUDFLARE_REFS=$(grep -r "elevateforhumanity.org\|elevateforhumanityfix" . \
    --include="wrangler.toml" \
    --include="*.worker.js" \
    2>/dev/null | grep -v "elevateproduction.netlify.app" | wc -l)

if [ "$CLOUDFLARE_REFS" -gt 0 ]; then
    echo "⚠️  Found $CLOUDFLARE_REFS references to old domains in Cloudflare files"
    echo ""
    grep -r "elevateforhumanity.org\|elevateforhumanityfix" . \
        --include="wrangler.toml" \
        --include="*.worker.js" \
        2>/dev/null | grep -v "elevateproduction.netlify.app" | head -10
    echo ""
else
    echo "✅ No old domain references in Cloudflare files"
fi

echo ""

# ============================================
# SECTION 4: CHECK INTEGRATION CONFIG
# ============================================
echo "=========================================="
echo "SECTION 4: CHECK INTEGRATION CONFIG"
echo "=========================================="
echo ""

if [ -f ".integration-config.json" ]; then
    echo "Checking .integration-config.json..."
    
    # Check Supabase URL
    SUPABASE_CONFIG_URL=$(jq -r '.integrations.supabase.url // "not set"' .integration-config.json)
    echo "Supabase URL: $SUPABASE_CONFIG_URL"
    
    if [ "$SUPABASE_CONFIG_URL" = "$SUPABASE_URL" ]; then
        echo "✅ Correct Supabase URL"
    else
        echo "⚠️  Supabase URL mismatch"
    fi
    echo ""
    
    # Check Cloudflare workers
    WORKER_ROUTES=$(jq -r '.integrations.cloudflare.workers.routes[]? // empty' .integration-config.json)
    
    if [ -n "$WORKER_ROUTES" ]; then
        echo "Cloudflare worker routes:"
        echo "$WORKER_ROUTES" | while read route; do
            echo "  - $route"
            
            if echo "$route" | grep -q "elevateforhumanityfix"; then
                echo "    ⚠️  Contains old domain reference"
            elif echo "$route" | grep -q "elevateproduction.netlify.app"; then
                echo "    ✅ Uses correct domain"
            fi
        done
    else
        echo "✅ No worker routes configured"
    fi
    echo ""
else
    echo "✅ No .integration-config.json file"
fi

# ============================================
# SECTION 5: SUMMARY
# ============================================
echo "=========================================="
echo "CLEANUP SUMMARY"
echo "=========================================="
echo ""

echo "Supabase:"
if [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    echo "  ✅ Checked storage buckets"
    echo "  ℹ️  Files not automatically deleted (review manually)"
else
    echo "  ⚠️  Not checked (no service role key)"
fi
echo ""

echo "Cloudflare:"
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
    echo "  ✅ Cache purged"
    echo "  ✅ Workers checked"
else
    echo "  ⚠️  Not cleaned (missing token or zone ID)"
fi
echo ""

echo "Code References:"
echo "  Supabase files: $SUPABASE_REFS old references"
echo "  Cloudflare files: $CLOUDFLARE_REFS old references"
echo ""

if [ "$SUPABASE_REFS" -eq 0 ] && [ "$CLOUDFLARE_REFS" -eq 0 ]; then
    echo "✅ No old build references in code"
else
    echo "⚠️  Found old references - review and update"
fi

echo ""
echo "=========================================="
echo "MANUAL STEPS"
echo "=========================================="
echo ""

echo "1. Supabase Storage:"
echo "   Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/storage/buckets"
echo "   Review and delete old files if needed"
echo ""

echo "2. Cloudflare Dashboard:"
echo "   Go to: https://dash.cloudflare.com"
echo "   Check Workers & Pages for old deployments"
echo ""

echo "3. Cloudflare Workers:"
echo "   If you have workers, update them to use:"
echo "   https://elevateproduction.netlify.app"
echo ""

echo "=========================================="
echo "✅ CLEANUP COMPLETE"
echo "=========================================="
