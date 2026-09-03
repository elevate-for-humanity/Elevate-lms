#!/usr/bin/env bash
set -euo pipefail

ASSETS_DIR="public/images/homepage"

echo "🔧 Ensuring homepage image directory exists..."
mkdir -p "$ASSETS_DIR"

echo "✅ Expected homepage image files (you must upload these from the design pack):"
cat <<EOF
1) $ASSETS_DIR/certificate-of-completion.png        # Certificate of Completion
2) $ASSETS_DIR/hero-top-homepage-gradient.png       # TOP homepage hero banner (gradient)
3) $ASSETS_DIR/hero-second-homepage-programs.png    # 2nd homepage hero banner (programs grid)
EOF

echo ""
echo "🔍 Checking for files..."

missing=0
for f in \
  certificate-of-completion.png \
  hero-top-homepage-gradient.png \
  hero-second-homepage-programs.png
do
  if [ ! -f "$ASSETS_DIR/$f" ]; then
    echo "❌ MISSING: $ASSETS_DIR/$f  -> upload the correct image from ChatGPT/design pack."
    missing=1
  else
    echo "✅ FOUND:   $ASSETS_DIR/$f"
  fi
done

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "⚠️ Some images are missing. Upload them to the paths above, commit, and re-run this script."
  exit 1
fi

echo ""
echo "🎉 All homepage images are in place."
