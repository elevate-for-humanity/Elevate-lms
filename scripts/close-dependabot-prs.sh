#!/usr/bin/env bash
# Close specific Dependabot PRs with breaking changes
set -euo pipefail

COMMENT="Major version with breaking changes - will upgrade manually when ready"
BRANCHES=(
  "dependabot/npm_and_yarn/tailwindcss-4.1.14"
  "dependabot/npm_and_yarn/react-19.2.0"
  "dependabot/npm_and_yarn/sentry/react-10.19.0"
  "dependabot/npm_and_yarn/vite-7.1.10"
  "dependabot/npm_and_yarn/react-router-dom-7.9.4"
)

echo "🤖 Closing Dependabot PRs with breaking changes"
echo "================================================"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed"
  echo "   Install: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated with GitHub CLI"
  echo "   Run: gh auth login"
  exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

CLOSED=0
SKIPPED=0

for b in "${BRANCHES[@]}"; do
  echo "Checking branch: $b"
  
  PR_NUMBER=$(gh pr list --search "head:${b} is:open" --json number --jq '.[0].number' 2>/dev/null || true)
  
  if [[ -z "${PR_NUMBER:-}" || "${PR_NUMBER}" == "null" ]]; then
    echo "  ⏭️  No open PR found"
    SKIPPED=$((SKIPPED + 1))
    echo ""
    continue
  fi
  
  echo "  📝 Found PR #$PR_NUMBER"
  
  # Add comment
  echo "  💬 Adding comment..."
  gh pr comment "$PR_NUMBER" --body "$COMMENT"
  
  # Add labels (ignore errors if labels don't exist)
  echo "  🏷️  Adding labels..."
  gh pr edit "$PR_NUMBER" --add-label "blocked,manual-upgrade" 2>/dev/null || echo "     (Labels may not exist, continuing...)"
  
  # Close PR
  echo "  ❌ Closing PR..."
  gh pr close "$PR_NUMBER"
  
  echo "  ✅ Closed PR #$PR_NUMBER"
  CLOSED=$((CLOSED + 1))
  echo ""
done

echo "================================================"
echo "Summary:"
echo "  ✅ Closed: $CLOSED PRs"
echo "  ⏭️  Skipped: $SKIPPED PRs (not found or already closed)"
echo ""
echo "🎉 Done!"
