#!/usr/bin/env bash
set -euo pipefail

### ─────────────────────────────────────────────────────────────
### Elevate for Humanity • Image Pack Generator (no placeholders)
### Output: public/logo.svg, public/logo-dark.svg,
###         public/images/{hero-training.jpg,og-cover.jpg,favicon.png,favicon.ico},
###         public/images/partners/*.webp
### Requirements: bash + ImageMagick (auto-installed if missing)
### ─────────────────────────────────────────────────────────────

# -------- Branding (tweak if needed) --------
BRAND_NAME="Elevate for Humanity"
BRAND_TAGLINE="Workforce • Training • Apprenticeships"
SITE_URL="elevateforhumanity.org"

# Palette (red / orange / blue / white)
C_RED="#E23B2F"
C_ORANGE="#F97316"
C_BLUE="#1D4ED8"
C_SKY="#0EA5E9"
C_DARK="#0B1220"
C_LIGHT="#F9FAFB"
C_MID="#334155"

# Fonts (ImageMagick built-ins; Gitpod containers usually have DejaVu)
H_FONT="DejaVu-Sans"          # Headline
B_FONT="DejaVu-Sans"          # Body

# Output paths
ROOT="public"
IMG="$ROOT/images"
PARTNERS="$IMG/partners"

mkdir -p "$ROOT" "$IMG" "$PARTNERS"

# -------- Ensure ImageMagick --------
if ! command -v convert >/dev/null 2>&1; then
  echo "• Installing ImageMagick..."
  # Gitpod/Ubuntu
  sudo apt-get update -y && sudo apt-get install -y imagemagick
fi

# -------- Helper: gradient background --------
# Args: WIDTH HEIGHT COLOR1 COLOR2 OUTPUT
mk_gradient () {
  local W="$1" H="$2" A="$3" B="$4" OUT="$5"
  convert -size "${W}x${H}" gradient:"$A"-"$B" \
    -rotate 90 \
    \( -size "${W}x${H}" radial-gradient:transparent-black -alpha on -evaluate multiply 0.25 \) \
    -compose overlay -composite \
    "$OUT"
}

# -------- Helper: subtle shapes overlay --------
# Adds geometric interest without stock photos.
# Args: BASE_OUTPUT
overlay_shapes () {
  local OUT="$1"
  convert "$OUT" \
    \( -size 600x600 xc:none -fill "$C_LIGHT" -draw "translate 100,80 circle 0,0 280,0" -alpha set -channel A -evaluate multiply 0.07 +channel \) -compose over -composite \
    \( -size 800x800 xc:none -fill "$C_ORANGE" -draw "translate 850,260 circle 0,0 360,0" -alpha set -channel A -evaluate multiply 0.06 +channel \) -compose over -composite \
    \( -size 700x500 xc:none -fill "$C_BLUE" -draw "translate 380,380 circle 0,0 260,0" -alpha set -channel A -evaluate multiply 0.07 +channel \) -compose over -composite \
    "$OUT"
}

# -------- LOGO (SVG: light) --------
cat > "$ROOT/logo.svg" <<'SVG'
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="220" height="64" viewBox="0 0 220 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect rx="12" width="64" height="64" fill="url(#g)"/>
  <path d="M18 40 L32 16 L46 40 L40 40 L32 26 L24 40 Z" fill="#F9FAFB" />
  <text x="76" y="40" font-family="DejaVu Sans, Segoe UI, Arial" font-size="20" font-weight="700" fill="#0B1220" letter-spacing="0.2">
    Elevate for Humanity
  </text>
</svg>
SVG

# -------- LOGO (SVG: dark mode) --------
cat > "$ROOT/logo-dark.svg" <<'SVG'
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="220" height="64" viewBox="0 0 220 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect rx="12" width="64" height="64" fill="url(#g)"/>
  <path d="M18 40 L32 16 L46 40 L40 40 L32 26 L24 40 Z" fill="#F9FAFB" />
  <text x="76" y="40" font-family="DejaVu Sans, Segoe UI, Arial" font-size="20" font-weight="700" fill="#F9FAFB" letter-spacing="0.2">
    Elevate for Humanity
  </text>
</svg>
SVG

# -------- HERO (1200x900 JPG) --------
HERO_TMP="$(mktemp /tmp/heroXXXX.png)"
mk_gradient 1200 900 "$C_DARK" "$C_BLUE" "$HERO_TMP"
overlay_shapes "$HERO_TMP"
convert "$HERO_TMP" \
  -gravity northwest -fill "$C_LIGHT" -font "$H_FONT" -pointsize 72 -annotate +64+120 "$BRAND_NAME" \
  -gravity northwest -fill "$C_LIGHT" -font "$B_FONT" -pointsize 34 -annotate +64+200 "$BRAND_TAGLINE" \
  -gravity southwest -fill "$C_LIGHT" -font "$B_FONT" -pointsize 24 -annotate +64+70 "$SITE_URL" \
  -quality 90 "$IMG/hero-training.jpg"
rm -f "$HERO_TMP"

# -------- OG COVER (1200x630 JPG) --------
OG_TMP="$(mktemp /tmp/ogXXXX.png)"
mk_gradient 1200 630 "$C_BLUE" "$C_SKY" "$OG_TMP"
overlay_shapes "$OG_TMP"
convert "$OG_TMP" \
  -gravity northwest -fill "$C_DARK" -font "$H_FONT" -pointsize 64 -annotate +56+120 "$BRAND_NAME" \
  -gravity northwest -fill "$C_DARK" -font "$B_FONT" -pointsize 30 -annotate +56+190 "Career Pathways • Apprenticeships • ETPL Programs" \
  -gravity south -fill "$C_DARK" -font "$B_FONT" -pointsize 24 -annotate +0+36 "$SITE_URL" \
  -quality 90 "$IMG/og-cover.jpg"
rm -f "$OG_TMP"

# -------- FAVICON (PNG + ICO) --------
convert -size 256x256 xc:none \
  -fill "$C_BLUE" -draw "roundrectangle 16,16 240,240 48,48" \
  -gravity center -font "$H_FONT" -pointsize 140 -fill "$C_LIGHT" -annotate +0+0 "E" \
  "$IMG/favicon.png"

# ICO (multi-size)
convert "$IMG/favicon.png" -resize 64x64 "$IMG/favicon-64.png"
convert "$IMG/favicon.png" -resize 32x32 "$IMG/favicon-32.png"
convert "$IMG/favicon.png" -resize 16x16 "$IMG/favicon-16.png"
convert "$IMG/favicon-16.png" "$IMG/favicon-32.png" "$IMG/favicon-64.png" "$IMG/favicon.ico"

# Move canonical favicon into /public root as well if you prefer root-level references
cp "$IMG/favicon.png" "$ROOT/favicon.png" || true
cp "$IMG/favicon.ico" "$ROOT/favicon.ico" || true

# -------- PARTNER LOGOS (transparent WebP, 200x80) --------
make_partner () {
  local NAME="$1"
  local FILE="$PARTNERS/$2.webp"
  convert -size 200x80 xc:none \
    -gravity center \
    -font "$B_FONT" -pointsize 30 -fill "$C_MID" \
    -annotate +0+0 "$NAME" \
    -alpha set "$FILE"
}
make_partner "WorkOne" "workone"
make_partner "Indiana DWD" "dwd"
make_partner "Next Level Jobs" "nextleveljobs"
make_partner "US DOL" "usdol"
make_partner "OSHA" "osha"

# -------- Bonus: Program tiles (optional visual pack)
# Creates a few clean section images for Programs, Apply, Contact
make_tile () {
  local TITLE="$1" OUT="$2" A="$3" B="$4"
  local TMP="$(mktemp /tmp/tileXXXX.png)"
  mk_gradient 1200 600 "$A" "$B" "$TMP"
  overlay_shapes "$TMP"
  convert "$TMP" \
    -gravity center -fill "$C_LIGHT" -font "$H_FONT" -pointsize 64 -annotate +0-10 "$TITLE" \
    -gravity center -fill "$C_LIGHT" -font "$B_FONT" -pointsize 28 -annotate +0+50 "$BRAND_TAGLINE" \
    -quality 88 "$IMG/$OUT"
  rm -f "$TMP"
}
make_tile "Programs"      "tile-programs.jpg" "$C_DARK" "$C_BLUE"
make_tile "Apply Today"   "tile-apply.jpg"    "$C_RED"  "$C_ORANGE"
make_tile "Contact Us"    "tile-contact.jpg"  "$C_BLUE" "$C_SKY"

# -------- Final echo --------
echo "✅ Image pack generated:
- $ROOT/logo.svg
- $ROOT/logo-dark.svg
- $IMG/hero-training.jpg
- $IMG/og-cover.jpg
- $IMG/favicon.png, $IMG/favicon.ico
- $PARTNERS/{workone,dwd,nextleveljobs,usdol,osha}.webp
- $IMG/tile-{programs,apply,contact}.jpg"
