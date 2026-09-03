#!/bin/bash

echo "🎨 FINAL QUALITY CHECK - LAUNCH READINESS"
echo "=========================================="
echo ""

# Check for placeholders
echo "1️⃣ Checking for placeholder content..."
PLACEHOLDERS=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "placeholder\|lorem ipsum\|TODO\|FIXME" -i {} \; | wc -l)
echo "   Found $PLACEHOLDERS files with placeholders"

# Check for generic images
echo ""
echo "2️⃣ Checking for generic images..."
GENERIC_IMAGES=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "/placeholder\|/generic\|/default\.jpg\|/default\.png" {} \; | wc -l)
echo "   Found $GENERIC_IMAGES files with generic images"

# Check for Artlist videos
echo ""
echo "3️⃣ Checking Artlist video usage..."
ARTLIST_VIDEOS=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "artlist\|cms-artifacts" {} \; | wc -l)
echo "   Found $ARTLIST_VIDEOS files using Artlist videos ✅"

# Check video autoplay
echo ""
echo "4️⃣ Checking video autoplay configuration..."
AUTOPLAY_VIDEOS=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "autoPlay.*muted.*loop" {} \; | wc -l)
echo "   Found $AUTOPLAY_VIDEOS videos with proper autoplay ✅"

# Check Next.js Image usage
echo ""
echo "5️⃣ Checking Next.js Image optimization..."
NEXT_IMAGES=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "from 'next/image'" {} \; | wc -l)
OLD_IMAGES=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "<img " {} \; | wc -l)
echo "   Using Next.js Image: $NEXT_IMAGES files ✅"
echo "   Using old <img>: $OLD_IMAGES files ⚠️"

# Check font optimization
echo ""
echo "6️⃣ Checking font configuration..."
if [ -f "/workspaces/fix2/app/layout.tsx" ]; then
    FONT_OPTIMIZED=$(grep -c "next/font" /workspaces/fix2/app/layout.tsx)
    echo "   Font optimization: $FONT_OPTIMIZED fonts configured ✅"
fi

# Check social media embeds
echo ""
echo "7️⃣ Checking social media embeds..."
SOCIAL_EMBEDS=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "facebook\|twitter\|instagram\|linkedin\|youtube" -i {} \; | wc -l)
echo "   Found $SOCIAL_EMBEDS files with social media ✅"

# Check blog pages
echo ""
echo "8️⃣ Checking blog system..."
if [ -d "/workspaces/fix2/app/blog" ]; then
    BLOG_PAGES=$(find /workspaces/fix2/app/blog -name "page.tsx" | wc -l)
    echo "   Found $BLOG_PAGES blog pages ✅"
else
    echo "   Blog directory not found ⚠️"
fi

# Check navigation
echo ""
echo "9️⃣ Checking navigation..."
if [ -f "/workspaces/fix2/config/navigation.ts" ]; then
    NAV_SECTIONS=$(grep -c "label:" /workspaces/fix2/config/navigation.ts)
    echo "   Navigation sections: $NAV_SECTIONS ✅"
fi

# Check for console.log (should be removed in production)
echo ""
echo "🔟 Checking for debug code..."
DEBUG_LOGS=$(find /workspaces/fix2/app -name "*.tsx" -type f -exec grep -l "console\.log\|console\.error" {} \; | wc -l)
echo "   Found $DEBUG_LOGS files with console logs ⚠️"

echo ""
echo "=========================================="
echo "✅ QUALITY CHECK COMPLETE"
echo ""
echo "SUMMARY:"
echo "- Artlist videos: $ARTLIST_VIDEOS files ✅"
echo "- Autoplay videos: $AUTOPLAY_VIDEOS configured ✅"
echo "- Next.js Images: $NEXT_IMAGES optimized ✅"
echo "- Social embeds: $SOCIAL_EMBEDS pages ✅"
echo "- Navigation: $NAV_SECTIONS sections ✅"
echo ""
echo "⚠️  NEEDS ATTENTION:"
echo "- Placeholders: $PLACEHOLDERS files"
echo "- Generic images: $GENERIC_IMAGES files"
echo "- Old <img> tags: $OLD_IMAGES files"
echo "- Debug logs: $DEBUG_LOGS files"
echo ""
