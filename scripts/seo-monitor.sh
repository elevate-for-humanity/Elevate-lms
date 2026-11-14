#!/bin/bash

# SEO Monitoring Script - Continuous health checks with auto-healing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CHECK_INTERVAL=300  # 5 minutes
LOG_DIR="./logs/seo-monitor"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/monitor_${TIMESTAMP}.log"
ALERT_THRESHOLD=3  # Number of failures before auto-heal

mkdir -p "$LOG_DIR"

# Counters
FAILURE_COUNT=0
TOTAL_CHECKS=0
SUCCESSFUL_CHECKS=0

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if UniversalSEO component exists
check_component() {
    if [ -f "src/components/UniversalSEO.tsx" ]; then
        return 0
    else
        log_error "UniversalSEO.tsx missing!"
        return 1
    fi
}

# Check if SiteLayout has UniversalSEO
check_integration() {
    if grep -q "import UniversalSEO" "src/layouts/SiteLayout.tsx" && \
       grep -q "<UniversalSEO" "src/layouts/SiteLayout.tsx"; then
        return 0
    else
        log_error "UniversalSEO not properly integrated in SiteLayout!"
        return 1
    fi
}

# Check build health
check_build() {
    if npm run build &>/dev/null; then
        return 0
    else
        log_error "Build failed!"
        return 1
    fi
}

# Check SEO coverage in build
check_coverage() {
    local html_files=$(find dist -name "*.html" 2>/dev/null | wc -l)
    
    if [ "$html_files" -eq 0 ]; then
        log_error "No HTML files found in dist!"
        return 1
    fi
    
    local og_count=$(find dist -name "*.html" -exec grep -l "og:title" {} \; 2>/dev/null | wc -l)
    local coverage=$((og_count * 100 / html_files))
    
    log_info "SEO Coverage: ${coverage}% ($og_count/$html_files files)"
    
    if [ "$coverage" -ge 90 ]; then
        return 0
    else
        log_warning "SEO coverage below 90%"
        return 1
    fi
}

# Auto-heal function
auto_heal() {
    log_warning "Initiating auto-heal sequence..."
    
    # Try to restore UniversalSEO if missing
    if [ ! -f "src/components/UniversalSEO.tsx" ]; then
        log_info "Restoring UniversalSEO.tsx from git..."
        git checkout HEAD -- src/components/UniversalSEO.tsx 2>/dev/null || {
            log_error "Could not restore UniversalSEO.tsx"
            return 1
        }
    fi
    
    # Try to restore SiteLayout if integration is broken
    if ! grep -q "UniversalSEO" "src/layouts/SiteLayout.tsx"; then
        log_info "Restoring SiteLayout.tsx from git..."
        git checkout HEAD -- src/layouts/SiteLayout.tsx 2>/dev/null || {
            log_error "Could not restore SiteLayout.tsx"
            return 1
        }
    fi
    
    # Clean and rebuild
    log_info "Cleaning build artifacts..."
    rm -rf dist .vite node_modules/.vite
    
    log_info "Rebuilding..."
    if npm run build &>/dev/null; then
        log "Auto-heal successful ✅"
        FAILURE_COUNT=0
        return 0
    else
        log_error "Auto-heal failed"
        return 1
    fi
}

# Send alert (placeholder for notification system)
send_alert() {
    local message=$1
    log_error "ALERT: $message"
    
    # Could integrate with:
    # - Slack webhook
    # - Email notification
    # - PagerDuty
    # - Discord webhook
    
    # Example: curl -X POST webhook_url -d "{\"text\":\"$message\"}"
}

# Run all checks
run_checks() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local check_failed=0
    
    log_info "Running health checks (Check #$TOTAL_CHECKS)..."
    
    # Component check
    if check_component; then
        log "✅ Component check passed"
    else
        check_failed=1
    fi
    
    # Integration check
    if check_integration; then
        log "✅ Integration check passed"
    else
        check_failed=1
    fi
    
    # Build check
    if check_build; then
        log "✅ Build check passed"
    else
        check_failed=1
    fi
    
    # Coverage check
    if check_coverage; then
        log "✅ Coverage check passed"
    else
        check_failed=1
    fi
    
    if [ $check_failed -eq 1 ]; then
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        log_warning "Health check failed (Failure count: $FAILURE_COUNT)"
        
        if [ $FAILURE_COUNT -ge $ALERT_THRESHOLD ]; then
            send_alert "SEO health checks failing ($FAILURE_COUNT consecutive failures)"
            
            if auto_heal; then
                send_alert "Auto-heal successful - system recovered"
            else
                send_alert "Auto-heal failed - manual intervention required"
            fi
        fi
    else
        SUCCESSFUL_CHECKS=$((SUCCESSFUL_CHECKS + 1))
        FAILURE_COUNT=0
        log "All health checks passed ✅"
    fi
    
    # Print statistics
    local success_rate=$((SUCCESSFUL_CHECKS * 100 / TOTAL_CHECKS))
    log_info "Statistics: $SUCCESSFUL_CHECKS/$TOTAL_CHECKS successful (${success_rate}%)"
}

# Main monitoring loop
main() {
    log "========================================="
    log "SEO Monitor Starting"
    log "Check Interval: ${CHECK_INTERVAL}s"
    log "Alert Threshold: $ALERT_THRESHOLD failures"
    log "========================================="
    
    # Initial check
    run_checks
    
    # Continuous monitoring
    while true; do
        sleep $CHECK_INTERVAL
        run_checks
    done
}

# Handle interrupts gracefully
trap 'log "Monitor stopped by user"; exit 0' INT TERM

# Run main function
main "$@"
