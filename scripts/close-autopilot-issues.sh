#!/bin/bash
# Close all autopilot-related GitHub issues

echo "🧹 Closing all autopilot issues..."
echo ""
echo "This script will close all issues with labels: autopilot, auto-push, auto-heal-failed"
echo ""

# Check if gh CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO="elevateforhumanity/fix2"

echo "📊 Fetching autopilot issues..."

# Close all autopilot auto-push issues
echo "Closing auto-push failures..."
gh issue list --repo "$REPO" --label "auto-push" --state open --json number --jq '.[].number' | while read -r issue; do
    gh issue close "$issue" --repo "$REPO" --comment "Closing automated issue - autopilot system deprecated. All functionality now handled manually with proper oversight."
    echo "  ✅ Closed #$issue"
done

# Close all auto-heal-failed issues
echo "Closing auto-heal failures..."
gh issue list --repo "$REPO" --label "auto-heal-failed" --state open --json number --jq '.[].number' | while read -r issue; do
    gh issue close "$issue" --repo "$REPO" --comment "Closing automated issue - autopilot system deprecated. All functionality now handled manually with proper oversight."
    echo "  ✅ Closed #$issue"
done

# Close all autopilot issues
echo "Closing remaining autopilot issues..."
gh issue list --repo "$REPO" --label "autopilot" --state open --json number --jq '.[].number' | while read -r issue; do
    gh issue close "$issue" --repo "$REPO" --comment "Closing automated issue - autopilot system deprecated. All functionality now handled manually with proper oversight."
    echo "  ✅ Closed #$issue"
done

echo ""
echo "✅ All autopilot issues closed!"
echo ""
echo "📊 Remaining open issues:"
gh issue list --repo "$REPO" --state open --limit 5
