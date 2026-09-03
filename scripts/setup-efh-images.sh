#!/usr/bin/env bash
set -e

echo "🔧 Setting up Elevate for Humanity homepage images..."

# Make sure target folder exists
mkdir -p public/images/efh

# NOTE:
# 1. Upload your 4 homepage images into /workspace/fix2/_incoming/
# 2. Rename them to match the LEFT side of each cp line below
# 3. Then run:  bash scripts/setup-efh-images.sh

cp _incoming/home-hero-top-gradient.jpg           public/images/efh/home-hero-top-gradient.jpg
cp _incoming/home-hero-second-programs.jpg        public/images/efh/home-hero-second-programs.jpg
cp _incoming/founder-bio-desk-side.jpg            public/images/efh/founder-bio-desk-side.jpg
cp _incoming/founder-home-fullbody.jpg            public/images/efh/founder-home-fullbody.jpg

echo "✅ Homepage images copied into public/images/efh"
echo "Note: Certificate image is separate - only used when students complete courses"
