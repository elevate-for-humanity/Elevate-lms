#!/usr/bin/env bash
set -euo pipefail

# Auto-commit and push script for continuous deployment
# Usage: ./scripts/autopush.sh [branch] [commit_message]

BRANCH="${1:-auto/live}"
MSG="${2:-chore: auto-commit from development}"

echo "🚀 Starting auto-push to branch: $BRANCH"

# Create or switch to the auto-push branch
git checkout -B "$BRANCH" >/dev/null 2>&1 || true
echo "📝 Switched to branch: $BRANCH"

# Function to commit and push changes
commit_and_push() {
  local changes=$(git status --porcelain)
  if [ -n "$changes" ]; then
    echo "📦 Changes detected, committing..."
    git add -A
    git commit -m "$MSG - $(date '+%Y-%m-%d %H:%M:%S')" || true
    git push -u origin "$BRANCH" --force-with-lease || git push -u origin "$BRANCH"
    echo "✅ Pushed changes at $(date)"
    return 0
  else
    echo "💤 No changes detected"
    return 1
  fi
}

# If running in watch mode (no arguments or just branch specified)
if [ $# -le 1 ]; then
  echo "👀 Watching for changes... (Press Ctrl+C to stop)"
  echo "📁 Monitoring: $(pwd)"
  echo "🌿 Branch: $BRANCH"
  echo ""
  
  # Initial commit if there are changes
  commit_and_push || true
  
  # Watch for changes
  while true; do
    sleep 10   # Check every 10 seconds
    commit_and_push || true
  done
else
  # Single commit mode
  echo "📝 Single commit mode"
  if commit_and_push; then
    echo "✅ Auto-push complete"
  else
    echo "ℹ️  No changes to commit"
  fi
fi