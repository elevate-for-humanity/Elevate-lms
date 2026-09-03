#!/bin/bash
# Ultimate Self-Healing Autopilot
# Loops until EVERYTHING is 100% perfect
# Tests: styling, functions, SEO, sitemaps, analytics, images, routes, etc.

set -e

echo "🤖 ULTIMATE SELF-HEALING AUTOPILOT"
echo "===================================="
echo ""
echo "This autopilot will loop until EVERYTHING is 100% perfect:"
echo "  ✅ Repository structure"
echo "  ✅ CSS & styling"
echo "  ✅ Build & deployment"
echo "  ✅ Images & assets"
echo "  ✅ SEO & meta tags"
echo "  ✅ Sitemaps & robots.txt"
echo "  ✅ Routes & navigation"
echo "  ✅ DNS & SSL"
echo "  ✅ Performance"
echo "  ✅ Security"
echo "  ✅ Analytics"
echo ""
echo "Press Ctrl+C to stop"
echo ""

REPO_ROOT="/workspaces/fix2"
MAX_ITERATIONS=10
ITERATION=0

cd "$REPO_ROOT"

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ITERATION $ITERATION / $MAX_ITERATIONS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Step 1: Run complete setup
    echo "Running complete setup..."
    bash scripts/autopilot-complete-setup.sh > /tmp/setup-$ITERATION.log 2>&1
    
    # Step 2: Run verification
    echo "Running verification..."
    bash scripts/autopilot-verify-all.sh > /tmp/verify-$ITERATION.log 2>&1 || true
    
    # Check results
    FAILED=$(grep "Failed:" /tmp/verify-$ITERATION.log | grep -o "[0-9]*" | tail -1)
    
    if [ "$FAILED" = "0" ]; then
        echo ""
        echo "✅ ALL TESTS PASSED!"
        echo ""
        echo "System is 100% perfect!"
        echo ""
        cat /tmp/verify-$ITERATION.log | tail -30
        exit 0
    else
        echo ""
        echo "⚠️  $FAILED tests failed"
        echo ""
        echo "Attempting auto-fix..."
        
        # Auto-fix: Rebuild if build issues
        if grep -q "Build" /tmp/verify-$ITERATION.log; then
            echo "  - Rebuilding..."
            pnpm build > /dev/null 2>&1
        fi
        
        # Auto-fix: Commit if uncommitted changes
        if [ -n "$(git status --porcelain)" ]; then
            echo "  - Committing changes..."
            git add -A
            git commit -m "Autopilot: Auto-fix iteration $ITERATION" > /dev/null 2>&1 || true
            git push > /dev/null 2>&1 || true
        fi
        
        echo ""
        echo "Waiting 30 seconds before next iteration..."
        sleep 30
    fi
done

echo ""
echo "❌ Max iterations reached"
echo ""
echo "Manual intervention may be required"
echo "Check logs in /tmp/verify-*.log"
echo ""
