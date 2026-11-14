#!/bin/bash
echo "📸 Analyzing and Categorizing Images..."
echo "======================================"

# Create category directories
mkdir -p public/images-organized/{healthcare,trades,technology,business,culinary,beauty,transportation,general,icons,heroes}

# Function to get image info
analyze_image() {
    local img="$1"
    local filename=$(basename "$img")
    local category=""
    
    # Categorize based on filename and path
    case "$img" in
        *healthcare*|*medical*|*cna*|*dental*|*phlebotomy*|*cpr*)
            category="healthcare"
            ;;
        *welding*|*hvac*|*plumbing*|*electrical*|*building*|*cdl*)
            category="trades"
            ;;
        *it-*|*tech*)
            category="technology"
            ;;
        *tax*|*business*|*office*)
            category="business"
            ;;
        *culinary*|*chef*)
            category="culinary"
            ;;
        *beauty*|*barber*|*esthetic*)
            category="beauty"
            ;;
        *hero*|*slide*)
            category="heroes"
            ;;
        *icon*)
            category="icons"
            ;;
        *)
            category="general"
            ;;
    esac
    
    echo "$img → $category/$filename"
}

# Analyze all images
find public/media -type f \( -name "*.jpg" -o -name "*.png" \) | while read img; do
    analyze_image "$img"
done

echo ""
echo "======================================"
echo "✅ Image Analysis Complete"
echo ""
echo "Categories found:"
echo "- Healthcare: $(find public/media -name "*healthcare*" -o -name "*medical*" -o -name "*cna*" | wc -l)"
echo "- Trades: $(find public/media -name "*welding*" -o -name "*hvac*" -o -name "*plumbing*" | wc -l)"
echo "- Technology: $(find public/media -name "*it-*" -o -name "*tech*" | wc -l)"
echo "- Business: $(find public/media -name "*tax*" -o -name "*business*" | wc -l)"
echo "- Culinary: $(find public/media -name "*culinary*" | wc -l)"
echo "- Beauty: $(find public/media -name "*beauty*" -o -name "*barber*" | wc -l)"
