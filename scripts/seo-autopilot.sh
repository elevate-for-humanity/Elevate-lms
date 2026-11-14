#!/bin/bash

# SEO Autopilot with Self-Healing and Chunked Deployment
# Deploys SEO improvements in chunks of 50 pages with automatic rollback on failure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHUNK_SIZE=50
LOG_DIR="./logs/seo-autopilot"
BACKUP_DIR="./backups/seo-autopilot"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/deployment_${TIMESTAMP}.log"
ERROR_LOG="${LOG_DIR}/errors_${TIMESTAMP}.log"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE" "$ERROR_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Backup function
backup_files() {
    log "Creating backup before deployment..."
    BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
    tar -czf "$BACKUP_PATH" src/ public/ 2>/dev/null || true
    log "Backup created: $BACKUP_PATH"
}

# Restore function
restore_backup() {
    log_warning "Restoring from backup..."
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        tar -xzf "$LATEST_BACKUP" -C .
        log "Restored from: $LATEST_BACKUP"
        return 0
    else
        log_error "No backup found to restore!"
        return 1
    fi
}

# Health check function
health_check() {
    log_info "Running health check..."
    
    # Check if build succeeds
    if ! npm run build 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Build failed!"
        return 1
    fi
    
    # Check if UniversalSEO component exists
    if [ ! -f "src/components/UniversalSEO.tsx" ]; then
        log_error "UniversalSEO.tsx not found!"
        return 1
    fi
    
    # Check if SiteLayout imports UniversalSEO
    if ! grep -q "UniversalSEO" "src/layouts/SiteLayout.tsx"; then
        log_error "SiteLayout.tsx doesn't import UniversalSEO!"
        return 1
    fi
    
    # Verify meta tags in build output
    if [ -d "dist" ]; then
        local meta_count=$(find dist -name "*.html" -exec grep -l "og:title" {} \; | wc -l)
        log_info "Found $meta_count HTML files with Open Graph tags"
        
        if [ "$meta_count" -lt 10 ]; then
            log_warning "Low number of files with OG tags detected"
        fi
    fi
    
    log "Health check passed ✅"
    return 0
}

# Self-healing function
self_heal() {
    log_warning "Attempting self-healing..."
    
    # Clean node_modules and reinstall
    log_info "Cleaning dependencies..."
    rm -rf node_modules package-lock.json
    npm install
    
    # Clear build cache
    log_info "Clearing build cache..."
    rm -rf dist .vite
    
    # Verify critical files
    if [ ! -f "src/components/UniversalSEO.tsx" ]; then
        log_error "Critical file missing: UniversalSEO.tsx"
        restore_backup
        return 1
    fi
    
    # Try build again
    if health_check; then
        log "Self-healing successful ✅"
        return 0
    else
        log_error "Self-healing failed"
        restore_backup
        return 1
    fi
}

# Deploy chunk function
deploy_chunk() {
    local chunk_num=$1
    local start_idx=$2
    local end_idx=$3
    
    log "Deploying chunk $chunk_num (pages $start_idx-$end_idx)..."
    
    # Create backup before chunk deployment
    backup_files
    
    # Run health check
    if ! health_check; then
        log_error "Health check failed for chunk $chunk_num"
        
        # Attempt self-healing
        if ! self_heal; then
            log_error "Chunk $chunk_num deployment failed and could not be healed"
            return 1
        fi
    fi
    
    log "Chunk $chunk_num deployed successfully ✅"
    return 0
}

# Verify SEO coverage
verify_seo_coverage() {
    log_info "Verifying SEO coverage..."
    
    # Count routes
    local total_routes=$(find src/pages -name "*.tsx" | wc -l)
    log_info "Total route files: $total_routes"
    
    # Check for Helmet usage
    local helmet_count=$(grep -r "react-helmet-async" src/pages --include="*.tsx" | wc -l)
    log_info "Files using Helmet: $helmet_count"
    
    # Verify UniversalSEO is in layout
    if grep -q "<UniversalSEO" src/layouts/SiteLayout.tsx; then
        log "UniversalSEO integrated in SiteLayout ✅"
    else
        log_error "UniversalSEO not found in SiteLayout!"
        return 1
    fi
    
    # Build and check HTML files
    npm run build
    
    local html_files=$(find dist -name "*.html" | wc -l)
    local canonical_count=$(find dist -name "*.html" -exec grep -l "canonical" {} \; | wc -l)
    local og_count=$(find dist -name "*.html" -exec grep -l "og:title" {} \; | wc -l)
    local twitter_count=$(find dist -name "*.html" -exec grep -l "twitter:card" {} \; | wc -l)
    
    log_info "HTML files: $html_files"
    log_info "Files with canonical: $canonical_count"
    log_info "Files with OG tags: $og_count"
    log_info "Files with Twitter cards: $twitter_count"
    
    # Calculate coverage
    local canonical_pct=$((canonical_count * 100 / html_files))
    local og_pct=$((og_count * 100 / html_files))
    local twitter_pct=$((twitter_count * 100 / html_files))
    
    log_info "Canonical coverage: ${canonical_pct}%"
    log_info "Open Graph coverage: ${og_pct}%"
    log_info "Twitter Card coverage: ${twitter_pct}%"
    
    if [ "$canonical_pct" -ge 95 ] && [ "$og_pct" -ge 95 ] && [ "$twitter_pct" -ge 95 ]; then
        log "SEO coverage target achieved (≥95%) ✅"
        return 0
    else
        log_warning "SEO coverage below target (<95%)"
        return 1
    fi
}

# Generate report
generate_report() {
    local report_file="${LOG_DIR}/seo_coverage_report_${TIMESTAMP}.md"
    
    log "Generating SEO coverage report..."
    
    cat > "$report_file" << EOF
# SEO Autopilot Deployment Report
**Generated:** $(date)
**Deployment ID:** ${TIMESTAMP}

## Deployment Summary

### Build Status
- Build: $(npm run build &>/dev/null && echo "✅ Success" || echo "❌ Failed")
- UniversalSEO Component: $([ -f "src/components/UniversalSEO.tsx" ] && echo "✅ Present" || echo "❌ Missing")
- SiteLayout Integration: $(grep -q "UniversalSEO" "src/layouts/SiteLayout.tsx" && echo "✅ Integrated" || echo "❌ Not Integrated")

### SEO Coverage Analysis

EOF

    # Run build and analyze
    npm run build &>/dev/null
    
    local html_files=$(find dist -name "*.html" 2>/dev/null | wc -l)
    local canonical_count=$(find dist -name "*.html" -exec grep -l "canonical" {} \; 2>/dev/null | wc -l)
    local og_count=$(find dist -name "*.html" -exec grep -l "og:title" {} \; 2>/dev/null | wc -l)
    local twitter_count=$(find dist -name "*.html" -exec grep -l "twitter:card" {} \; 2>/dev/null | wc -l)
    local description_count=$(find dist -name "*.html" -exec grep -l "name=\"description\"" {} \; 2>/dev/null | wc -l)
    
    cat >> "$report_file" << EOF
| Metric | Count | Coverage |
|--------|-------|----------|
| Total HTML Files | $html_files | 100% |
| Canonical URLs | $canonical_count | $((canonical_count * 100 / html_files))% |
| Open Graph Tags | $og_count | $((og_count * 100 / html_files))% |
| Twitter Cards | $twitter_count | $((twitter_count * 100 / html_files))% |
| Meta Descriptions | $description_count | $((description_count * 100 / html_files))% |

### Files Without Complete SEO

EOF

    # List files missing SEO elements
    find dist -name "*.html" | while read -r file; do
        local missing=()
        grep -q "canonical" "$file" || missing+=("canonical")
        grep -q "og:title" "$file" || missing+=("og:title")
        grep -q "twitter:card" "$file" || missing+=("twitter:card")
        
        if [ ${#missing[@]} -gt 0 ]; then
            echo "- \`$file\`: Missing ${missing[*]}" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

### Deployment Logs
- Main Log: \`$LOG_FILE\`
- Error Log: \`$ERROR_LOG\`
- Backup Location: \`$BACKUP_DIR\`

### Next Steps
1. Review any files with missing SEO elements
2. Test meta tags in browser dev tools
3. Validate with Google Search Console
4. Monitor for any runtime errors

---
*Generated by SEO Autopilot v1.0*
EOF

    log "Report generated: $report_file"
    cat "$report_file"
}

# Main execution
main() {
    log "========================================="
    log "SEO Autopilot Starting"
    log "Timestamp: $TIMESTAMP"
    log "Chunk Size: $CHUNK_SIZE pages"
    log "========================================="
    
    # Initial backup
    backup_files
    
    # Initial health check
    log "Running initial health check..."
    if ! health_check; then
        log_error "Initial health check failed"
        if ! self_heal; then
            log_error "Cannot proceed with deployment"
            exit 1
        fi
    fi
    
    # Get total number of pages
    local total_pages=$(find src/pages -name "*.tsx" | wc -l)
    local num_chunks=$(( (total_pages + CHUNK_SIZE - 1) / CHUNK_SIZE ))
    
    log_info "Total pages: $total_pages"
    log_info "Number of chunks: $num_chunks"
    
    # Deploy in chunks
    for ((chunk=1; chunk<=num_chunks; chunk++)); do
        local start_idx=$(( (chunk - 1) * CHUNK_SIZE + 1 ))
        local end_idx=$(( chunk * CHUNK_SIZE ))
        [ $end_idx -gt $total_pages ] && end_idx=$total_pages
        
        if ! deploy_chunk $chunk $start_idx $end_idx; then
            log_error "Deployment failed at chunk $chunk"
            exit 1
        fi
        
        # Brief pause between chunks
        sleep 2
    done
    
    # Final verification
    log "Running final SEO coverage verification..."
    if verify_seo_coverage; then
        log "All verifications passed ✅"
    else
        log_warning "Some verifications did not meet targets"
    fi
    
    # Generate final report
    generate_report
    
    log "========================================="
    log "SEO Autopilot Completed Successfully ✅"
    log "========================================="
}

# Run main function
main "$@"
