#!/bin/bash

# Script to remove unused dependencies
# Run this after verifying the app still works

echo "=== Removing Unused Dependencies ==="
echo ""

# Unused production dependencies (confirmed by depcheck)
UNUSED_DEPS=(
  "@ffmpeg-installer/ffmpeg"
  "@next-auth/prisma-adapter"
  "@octokit/app"
  "@scalar/api-reference"
  "@sentry/react"
  "@sentry/tracing"
  "@supabase/auth-helpers-nextjs"
  "@supabase/auth-js"
  "axios"
  "express-useragent"
  "import-in-the-middle"
  "isomorphic-dompurify"
  "isomorphic-git"
  "next-auth"
  "parse-multipart-data"
  "passport"
  "require-in-the-middle"
  "undici"
  "videojs-contrib-quality-levels"
  "videojs-hls-quality-selector"
)

# Unused dev dependencies
UNUSED_DEV_DEPS=(
  "@iarna/toml"
  "@netlify/functions"
  "@netlify/plugin-nextjs"
  "@testing-library/user-event"
  "@vitest/coverage-v8"
  "baseline-browser-mapping"
  "jest"
  "js-yaml"
  "netlify-plugin-cache"
  "netlify-plugin-submit-sitemap"
  "rimraf"
  "sort-package-json"
  "stylelint-config-standard"
  "stylelint-config-tailwindcss"
  "terser"
  "wrangler"
)

echo "Removing ${#UNUSED_DEPS[@]} unused production dependencies..."
for dep in "${UNUSED_DEPS[@]}"; do
  echo "  - $dep"
done

echo ""
echo "Removing ${#UNUSED_DEV_DEPS[@]} unused dev dependencies..."
for dep in "${UNUSED_DEV_DEPS[@]}"; do
  echo "  - $dep"
done

echo ""
echo "Run the following command to remove them:"
echo ""
echo "npm uninstall ${UNUSED_DEPS[@]} ${UNUSED_DEV_DEPS[@]}"
echo ""
echo "Or with pnpm:"
echo ""
echo "pnpm remove ${UNUSED_DEPS[@]} ${UNUSED_DEV_DEPS[@]}"
