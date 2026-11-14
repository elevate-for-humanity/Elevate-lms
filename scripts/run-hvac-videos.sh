#!/bin/bash
# Runs HVAC video generation with low CPU priority so dev server stays alive.
# Reads credentials from .env.local automatically.
#
# Usage:
#   bash scripts/run-hvac-videos.sh --skip-existing
#   bash scripts/run-hvac-videos.sh --start 0 --limit 5
#   bash scripts/run-hvac-videos.sh --dry-run
# Monitor: tail -f /tmp/hvac-video-gen.log

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG=/tmp/hvac-video-gen.log

set -a
source "$ROOT/.env.local" 2>/dev/null || true
set +a

if [[ "$*" == *"--dry-run"* ]]; then
  cd "$ROOT" && npx tsx scripts/generate-hvac-lesson-videos.ts "$@"
  exit $?
fi

echo "Starting in background (nice -n 15)"
echo "Monitor: tail -f $LOG"

nohup nice -n 15 bash -c "
  set -a; source '$ROOT/.env.local' 2>/dev/null || true; set +a
  cd '$ROOT' && npx tsx scripts/generate-hvac-lesson-videos.ts $*
" >> "$LOG" 2>&1 &
echo "PID $! — $(date)"
sleep 4 && tail -8 "$LOG"
