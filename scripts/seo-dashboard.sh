#!/bin/bash

# SEO Dashboard - Real-time monitoring display

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

clear

while true; do
    clear
    
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║              SEO AUTOPILOT DASHBOARD                           ║${NC}"
    echo -e "${BOLD}${CYAN}║              Elevate for Humanity                              ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # System Status
    echo -e "${BOLD}${BLUE}📊 SYSTEM STATUS${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check component
    if [ -f "src/components/UniversalSEO.tsx" ]; then
        echo -e "UniversalSEO Component:    ${GREEN}✅ Active${NC}"
    else
        echo -e "UniversalSEO Component:    ${RED}❌ Missing${NC}"
    fi
    
    # Check integration
    if grep -q "UniversalSEO" "src/layouts/SiteLayout.tsx" 2>/dev/null; then
        echo -e "SiteLayout Integration:    ${GREEN}✅ Integrated${NC}"
    else
        echo -e "SiteLayout Integration:    ${RED}❌ Not Integrated${NC}"
    fi
    
    # Check if build exists
    if [ -d "dist" ]; then
        echo -e "Build Status:              ${GREEN}✅ Built${NC}"
    else
        echo -e "Build Status:              ${YELLOW}⚠️  No build found${NC}"
    fi
    
    echo ""
    
    # SEO Coverage
    echo -e "${BOLD}${BLUE}📈 SEO COVERAGE${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -d "dist" ]; then
        html_files=$(find dist -name "*.html" 2>/dev/null | wc -l)
        canonical_count=$(find dist -name "*.html" -exec grep -l "canonical" {} \; 2>/dev/null | wc -l)
        og_count=$(find dist -name "*.html" -exec grep -l "og:title" {} \; 2>/dev/null | wc -l)
        twitter_count=$(find dist -name "*.html" -exec grep -l "twitter:card" {} \; 2>/dev/null | wc -l)
        description_count=$(find dist -name "*.html" -exec grep -l "name=\"description\"" {} \; 2>/dev/null | wc -l)
        
        canonical_pct=$((canonical_count * 100 / html_files))
        og_pct=$((og_count * 100 / html_files))
        twitter_pct=$((twitter_count * 100 / html_files))
        description_pct=$((description_count * 100 / html_files))
        
        # Color code based on percentage
        get_color() {
            if [ $1 -ge 95 ]; then echo "$GREEN"
            elif [ $1 -ge 80 ]; then echo "$YELLOW"
            else echo "$RED"
            fi
        }
        
        printf "Total HTML Files:          %3d\n" $html_files
        printf "Canonical URLs:            $(get_color $canonical_pct)%3d (%3d%%)${NC}\n" $canonical_count $canonical_pct
        printf "Open Graph Tags:           $(get_color $og_pct)%3d (%3d%%)${NC}\n" $og_count $og_pct
        printf "Twitter Cards:             $(get_color $twitter_pct)%3d (%3d%%)${NC}\n" $twitter_count $twitter_pct
        printf "Meta Descriptions:         $(get_color $description_pct)%3d (%3d%%)${NC}\n" $description_count $description_pct
        
        echo ""
        
        # Overall score
        overall_score=$(( (canonical_pct + og_pct + twitter_pct + description_pct) / 4 ))
        echo -n "Overall SEO Score:         "
        if [ $overall_score -ge 95 ]; then
            echo -e "${GREEN}${BOLD}${overall_score}% ✅ EXCELLENT${NC}"
        elif [ $overall_score -ge 80 ]; then
            echo -e "${YELLOW}${BOLD}${overall_score}% ⚠️  GOOD${NC}"
        else
            echo -e "${RED}${BOLD}${overall_score}% ❌ NEEDS IMPROVEMENT${NC}"
        fi
    else
        echo -e "${YELLOW}No build found. Run: npm run build${NC}"
    fi
    
    echo ""
    
    # Recent Activity
    echo -e "${BOLD}${BLUE}📝 RECENT ACTIVITY${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -d "logs/seo-autopilot" ]; then
        latest_log=$(ls -t logs/seo-autopilot/deployment_*.log 2>/dev/null | head -1)
        if [ -n "$latest_log" ]; then
            echo "Last Deployment: $(basename $latest_log)"
            echo "Time: $(stat -c %y "$latest_log" 2>/dev/null | cut -d'.' -f1)"
        else
            echo "No deployment logs found"
        fi
    else
        echo "No logs directory found"
    fi
    
    if [ -d "logs/seo-monitor" ]; then
        latest_monitor=$(ls -t logs/seo-monitor/monitor_*.log 2>/dev/null | head -1)
        if [ -n "$latest_monitor" ]; then
            echo "Monitor Active: Yes"
            echo "Last Check: $(stat -c %y "$latest_monitor" 2>/dev/null | cut -d'.' -f1)"
        fi
    fi
    
    echo ""
    
    # Backups
    echo -e "${BOLD}${BLUE}💾 BACKUPS${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -d "backups/seo-autopilot" ]; then
        backup_count=$(ls backups/seo-autopilot/*.tar.gz 2>/dev/null | wc -l)
        echo "Total Backups: $backup_count"
        
        if [ $backup_count -gt 0 ]; then
            latest_backup=$(ls -t backups/seo-autopilot/*.tar.gz 2>/dev/null | head -1)
            backup_size=$(du -h "$latest_backup" 2>/dev/null | cut -f1)
            echo "Latest Backup: $(basename $latest_backup)"
            echo "Size: $backup_size"
        fi
    else
        echo "No backups found"
    fi
    
    echo ""
    
    # Quick Actions
    echo -e "${BOLD}${BLUE}⚡ QUICK ACTIONS${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "1. Run Validation:     ./scripts/validate-seo.sh"
    echo "2. Run Autopilot:      ./scripts/seo-autopilot.sh"
    echo "3. Start Monitor:      ./scripts/seo-monitor.sh &"
    echo "4. View Logs:          tail -f logs/seo-autopilot/deployment_*.log"
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Last Updated: $(date +'%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}Press Ctrl+C to exit${NC}"
    
    # Refresh every 10 seconds
    sleep 10
done
