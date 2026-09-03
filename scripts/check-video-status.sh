#!/bin/bash

# HeyGen Video Status Checker
# Checks status of all generated videos and downloads when ready

API_KEY="sk_V2_hgu_kije3e2gKQj_bvlFVjZVa0v82ie1s0d4ftFtkJwaIl1j"

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

echo "=== HeyGen Video Status Check ==="
echo ""

for name in "${!VIDEOS[@]}"; do
  video_id="${VIDEOS[$name]}"
  response=$(curl -s "https://api.heygen.com/v1/video_status.get?video_id=$video_id" \
    -H "X-Api-Key: $API_KEY")
  
  status=$(echo "$response" | jq -r '.data.status')
  video_url=$(echo "$response" | jq -r '.data.video_url')
  
  echo "$name: $status"
  
  if [ "$status" = "completed" ] && [ "$video_url" != "null" ]; then
    echo "  URL: $video_url"
    
    # Download video
    output_file="public/videos/hero-${name}.mp4"
    if [ ! -f "$output_file" ]; then
      echo "  Downloading to $output_file..."
      curl -s -o "$output_file" "$video_url"
      echo "  Downloaded!"
    else
      echo "  Already downloaded"
    fi
  fi
  echo ""
done

echo "=== Done ==="
