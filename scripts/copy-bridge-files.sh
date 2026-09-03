#!/bin/bash
# Copy bridge files to dist after build
# NOTE: Durable.co injection files have been removed

echo "📦 Copying bridge files to dist..."

# Ensure dist exists
mkdir -p dist

# Copy remaining bridge files from bridge/public/ to dist/
if [ -d "bridge/public" ]; then
  echo "📦 Copying files from bridge/public/ to dist/..."
  cp bridge/public/* dist/ 2>/dev/null || echo "ℹ️  No files in bridge/public/"
  echo "✅ Bridge files copied from bridge/public/"
else
  echo "ℹ️  bridge/public/ directory not found"
fi

echo "✅ Bridge files copy complete"
