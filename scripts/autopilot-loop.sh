#!/bin/bash
# Autopilot Loop - Continuous monitoring and automation
# Part of the EFH Autopilot System

set -e

DRY_RUN=${DRY_RUN:-0}
INTERVAL=${INTERVAL:-300}  # 5 minutes default

echo "🤖 Starting EFH Autopilot System..."
echo "   Dry Run: $DRY_RUN"
echo "   Interval: ${INTERVAL}s"
echo ""

while true; do
  echo "⏰ $(date '+%Y-%m-%d %H:%M:%S') - Running autopilot cycle..."
  
  if [ "$DRY_RUN" = "1" ]; then
    echo "   [DRY RUN] Would execute autopilot tasks"
    node scripts/utilities/autopilot.js --dry-run || echo "   ⚠️  Autopilot script not found or failed"
  else
    echo "   Executing autopilot tasks..."
    node scripts/utilities/autopilot-execute.js || echo "   ⚠️  Autopilot execution failed"
  fi
  
  echo "   ✅ Cycle complete. Waiting ${INTERVAL}s..."
  echo ""
  sleep "$INTERVAL"
done
