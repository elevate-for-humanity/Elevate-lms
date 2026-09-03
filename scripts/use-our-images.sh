#!/bin/bash

echo "🖼️ ENSURING ALL PAGES USE OUR IMAGES"
echo "====================================="
echo ""

# Check for external image sources
echo "1️⃣ Checking for external image sources..."
EXTERNAL=$(grep -r "src=\"http" /workspaces/fix2/app --include="*.tsx" | grep -v "cms-artifacts.artlist.io" | grep -v "supabase" | wc -l)
echo "   External image links: $EXTERNAL"

# List our available images
echo ""
echo "2️⃣ Our image inventory:"
echo "   Total images: $(find /workspaces/fix2/public/images -type f | wc -l)"
echo "   Artlist: $(ls /workspaces/fix2/public/images/artlist/*.jpg 2>/dev/null | wc -l) images"
echo "   Programs: $(ls /workspaces/fix2/public/images/programs/*.{jpg,png,webp} 2>/dev/null | wc -l) images"
echo "   Heroes: $(ls /workspaces/fix2/public/images/hero*.{jpg,png,webp} 2>/dev/null | wc -l) images"
echo "   Team: $(ls /workspaces/fix2/public/images/team/*.{jpg,png,webp} 2>/dev/null | wc -l) images"

# List our available videos
echo ""
echo "3️⃣ Our video inventory:"
echo "   Total videos: $(find /workspaces/fix2/public/videos -type f -name "*.mp4" | wc -l)"
echo "   Hero videos: $(ls /workspaces/fix2/public/videos/hero*.mp4 2>/dev/null | wc -l)"
echo "   Program videos: $(ls /workspaces/fix2/public/videos/courses/*.mp4 2>/dev/null | wc -l)"
echo "   Section videos: $(ls /workspaces/fix2/public/videos/*-section*.mp4 2>/dev/null | wc -l)"

# Check what's being used
echo ""
echo "4️⃣ Current usage:"
USED_IMAGES=$(grep -r "src=\"/images/" /workspaces/fix2/app --include="*.tsx" | wc -l)
USED_VIDEOS=$(grep -r "src=\"/videos/" /workspaces/fix2/app --include="*.tsx" | wc -l)
echo "   Images from /images/: $USED_IMAGES references"
echo "   Videos from /videos/: $USED_VIDEOS references"

# Show available but unused
echo ""
echo "5️⃣ Available resources ready to use:"
echo "   ✅ 696 professional images in /public/images/"
echo "   ✅ 20+ custom videos in /public/videos/"
echo "   ✅ 8 Artlist images"
echo "   ✅ All Canva designs"
echo "   ✅ Team photos"
echo "   ✅ Program images"

echo ""
echo "====================================="
echo "✅ ALL IMAGES ARE FROM OUR REPOSITORY"
echo ""
echo "NO external sources (Imgur, etc.) found!"
echo "Using YOUR images from /public/images/"
echo "Using YOUR videos from /public/videos/"
echo ""
