#!/bin/bash
# Image Upload Helper Script
# Place images in /workspaces/fix2/uploads/ with correct names
# Run this script to move them to proper locations

set -e

UPLOAD_DIR="/workspaces/fix2/uploads"
PUBLIC_DIR="/workspaces/fix2/public/images"

echo "🖼️  Elevate Image Upload Helper"
echo "================================"
echo ""

# Check if uploads directory exists
if [ ! -d "$UPLOAD_DIR" ]; then
  echo "Creating uploads directory..."
  mkdir -p "$UPLOAD_DIR"
fi

# Count files in uploads
FILE_COUNT=$(find "$UPLOAD_DIR" -type f -name "*.jpg" -o -name "*.png" | wc -l)

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "❌ No images found in $UPLOAD_DIR"
  echo ""
  echo "📋 Instructions:"
  echo "1. Place your images in: $UPLOAD_DIR"
  echo "2. Name them exactly as specified in the manifest"
  echo "3. Run this script again"
  exit 1
fi

echo "Found $FILE_COUNT image(s) to process"
echo ""

# Process each image
for img in "$UPLOAD_DIR"/*.{jpg,png,jpeg}; do
  [ -e "$img" ] || continue
  
  filename=$(basename "$img")
  
  # Facility - Lobby
  if [[ $filename == lobby-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/lobby/"
    echo "✅ Moved $filename → facility/lobby/"
  
  # Facility - Elevators
  elif [[ $filename == elevators-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/elevators/"
    echo "✅ Moved $filename → facility/elevators/"
  
  # Facility - Cafe
  elif [[ $filename == cafe-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/cafe/"
    echo "✅ Moved $filename → facility/cafe/"
  
  # Facility - Workbar
  elif [[ $filename == workbar-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/workbar/"
    echo "✅ Moved $filename → facility/workbar/"
  
  # Facility - Atrium
  elif [[ $filename == atrium-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/atrium/"
    echo "✅ Moved $filename → facility/atrium/"
  
  # Facility - Balcony
  elif [[ $filename == balcony-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/balcony/"
    echo "✅ Moved $filename → facility/balcony/"
  
  # Facility - Waiting Area
  elif [[ $filename == waiting-area-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/waiting-area/"
    echo "✅ Moved $filename → facility/waiting-area/"
  
  # Facility - Breakroom
  elif [[ $filename == breakroom-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/breakroom/"
    echo "✅ Moved $filename → facility/breakroom/"
  
  # Facility - Small Meeting Rooms
  elif [[ $filename == meeting-small-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/meeting-rooms-small/"
    echo "✅ Moved $filename → facility/meeting-rooms-small/"
  
  # Facility - Boardroom
  elif [[ $filename == meeting-boardroom-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/meeting-rooms-board/"
    echo "✅ Moved $filename → facility/meeting-rooms-board/"
  
  # Facility - Art Office
  elif [[ $filename == office-art-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/art-office/"
    echo "✅ Moved $filename → facility/art-office/"
  
  # Facility - Exterior
  elif [[ $filename == exterior-* ]]; then
    mv "$img" "$PUBLIC_DIR/facility/exterior-view/"
    echo "✅ Moved $filename → facility/exterior-view/"
  
  # Programs - Marketing
  elif [[ $filename == elevate-collage-* ]]; then
    mv "$img" "$PUBLIC_DIR/programs/marketing/"
    echo "✅ Moved $filename → programs/marketing/"
  
  # Programs - Healthcare
  elif [[ $filename == healthcare-* ]]; then
    mv "$img" "$PUBLIC_DIR/programs/healthcare/"
    echo "✅ Moved $filename → programs/healthcare/"
  
  # Team - Alina Smith
  elif [[ $filename == alina-smith-* ]]; then
    mv "$img" "$PUBLIC_DIR/team/alina-smith/"
    echo "✅ Moved $filename → team/alina-smith/"
  
  # Team - Founder
  elif [[ $filename == elizabeth-greene-* ]]; then
    mv "$img" "$PUBLIC_DIR/team/founder/"
    echo "✅ Moved $filename → team/founder/"
  
  else
    echo "⚠️  Unknown pattern: $filename (skipped)"
  fi
done

echo ""
echo "✅ Image upload complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify images are in correct folders"
echo "2. Run: git add public/images/"
echo "3. Run: git commit -m 'Add facility and team images'"
echo "4. Run: git push origin main"
