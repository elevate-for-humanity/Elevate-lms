#!/bin/bash

# Download HeyGen videos when ready
# Run this script periodically to check and download completed videos

API_KEY="sk_V2_hgu_kije3e2gKQj_bvlFVjZVa0v82ie1s0d4ftFtkJwaIl1j"
OUTPUT_DIR="public/videos"

declare -A VIDEOS=(
  ["homepage"]="df6e62a07f37413a907f6ef99831ecf3"
  ["programs"]="20c1dd8bf8ef411da4b70b7be9b948f1"
  ["cdl"]="ff8b0774f0a1446a8c085e2cd002ed98"
  ["healthcare"]="af17c60ac9944a74ab64dc82333d5832"
  ["technology"]="825ea869be0d467fbc3a2b7e43329d76"
  ["hvac"]="61edb001f61246159b8c8182a0180515"
  ["tax"]="e86a9e23cb79458bb095af2fa2992dab"
  ["employers"]="63cd9728df8247a285640fd251a7d94d"
)

echo "=== Checking and Downloading HeyGen Videos ==="
echo "Output directory: $OUTPUT_DIR"
echo ""

completed=0
total=${#VIDEOS[@]}

for name in "${!VIDEOS[@]}"; do
  video_id="${VIDEOS[$name]}"
  output_file="$OUTPUT_DIR/hero-${name}-avatar.mp4"
  
  # Skip if already downloaded
  if [ -f "$output_file" ]; then
    echo "✓ $name: Already downloaded"
    ((completed++))
    continue
  fi
  
  response=$(curl -s "https://api.heygen.com/v1/video_status.get?video_id=$video_id" \
    -H "X-Api-Key: $API_KEY")
  
  status=$(echo "$response" | jq -r '.data.status')
  video_url=$(echo "$response" | jq -r '.data.video_url')
  
  if [ "$status" = "completed" ] && [ "$video_url" != "null" ]; then
    echo "⬇ $name: Downloading..."
    curl -s -o "$output_file" "$video_url"
    if [ -f "$output_file" ]; then
      size=$(ls -lh "$output_file" | awk '{print $5}')
      echo "  ✓ Downloaded ($size)"
      ((completed++))
    else
      echo "  ✗ Download failed"
    fi
  elif [ "$status" = "failed" ]; then
    error=$(echo "$response" | jq -r '.data.error.message')
    echo "✗ $name: Failed - $error"
  else
    echo "⏳ $name: $status"
  fi
done

echo ""
echo "=== Summary: $completed/$total videos downloaded ==="
