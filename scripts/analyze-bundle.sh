#!/usr/bin/env bash
set -e

echo "=================================="
echo "Bundle Size Analysis"
echo "=================================="
echo ""

# Check if @next/bundle-analyzer is installed
if ! grep -q "@next/bundle-analyzer" package.json; then
  echo "Installing @next/bundle-analyzer..."
  npm install --save-dev @next/bundle-analyzer
fi

# Create bundle analyzer config
cat > next.config.bundle-analyzer.mjs << 'EOF'
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
};

export default withBundleAnalyzer(nextConfig);
EOF

echo "✅ Bundle analyzer configured"
echo ""
echo "Building with analysis..."
echo ""

# Build with analyzer
ANALYZE=true npm run build

echo ""
echo "=================================="
echo "Analysis Complete"
echo "=================================="
echo ""
echo "Open .next/analyze/client.html in your browser to see the bundle analysis"
echo ""
