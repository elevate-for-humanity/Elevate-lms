#!/usr/bin/env bash
set -e

echo "🔧 Approving pnpm build scripts so native deps can compile..."

# Make sure pnpm is available
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm not found. Install pnpm first."
  exit 1
fi

# Check pnpm version and use appropriate command
PNPM_VERSION=$(pnpm --version)
echo "📦 Using pnpm version: $PNPM_VERSION"

# For pnpm 9+, use config set
if [[ "$PNPM_VERSION" =~ ^9\. ]] || [[ "$PNPM_VERSION" =~ ^[1-9][0-9]\. ]]; then
  echo "Setting ignore-scripts=false for pnpm 9+"
  pnpm config set ignore-scripts false
else
  # For older versions, try approve-builds without --all
  pnpm approve-builds || echo "Note: approve-builds may require manual approval"
fi

echo "✅ pnpm build scripts configured for this project."
echo "   You should now run: pnpm install && pnpm dev"
