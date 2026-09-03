#!/usr/bin/env bash
set -euo pipefail

SRC="assets/uploads"
DEST="public/images/efh"

declare -A MAP=(
  ["certificate-of-completion.jpg"]="certificate-of-completion.jpg"
  ["hero-homepage-top-gradient.jpg"]="hero-homepage-top-gradient.jpg"
  ["hero-homepage-mid-programs.jpg"]="hero-homepage-mid-programs.jpg"
  ["bio-sidebar-elizabeth.jpg"]="bio-sidebar-elizabeth.jpg"
  ["homepage-feature-fullbody.jpg"]="homepage-feature-fullbody.jpg"
)

echo "→ Preparing image destination at $DEST"
mkdir -p "$DEST"

missing=0
for name in "${!MAP[@]}"; do
  if [[ ! -f "$SRC/$name" ]]; then
    echo "✖ Missing: $SRC/$name"
    missing=1
  fi
done

if [[ "$missing" -eq 1 ]]; then
  echo ""
  echo "Some source images are missing. Please add them to $SRC with the exact filenames above."
  exit 1
fi

echo "→ Copying labeled images…"
for name in "${!MAP[@]}"; do
  cp -f "$SRC/$name" "$DEST/${MAP[$name]}"
  echo "   • $name → $DEST/${MAP[$name]}"
done

cat > "$DEST/manifest.json" <<'JSON'
{
  "certificate": "/images/efh/certificate-of-completion.jpg",
  "heroTop": "/images/efh/hero-homepage-top-gradient.jpg",
  "heroMid": "/images/efh/hero-homepage-mid-programs.jpg",
  "bioSidebar": "/images/efh/bio-sidebar-elizabeth.jpg",
  "homeFeatureFullBody": "/images/efh/homepage-feature-fullbody.jpg",
  "altText": {
    "certificate": "Certificate of Completion with Elevate for Humanity emblem",
    "heroTop": "Elevate for Humanity hero banner gradient",
    "heroMid": "Elevate for Humanity programs banner",
    "bioSidebar": "Elizabeth Greene at desk in red blazer",
    "homeFeatureFullBody": "Elizabeth Greene full-body professional portrait in white dress"
  }
}
JSON

echo "✔ Images installed and manifest written to $DEST/manifest.json"
