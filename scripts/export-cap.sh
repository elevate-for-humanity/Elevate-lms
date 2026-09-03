#!/bin/bash
set -euo pipefail

# Export Cap Script - Only deploy priority pages
# Usage: ./scripts/export-cap.sh [LIMIT] [OUTPUT_DIR]

LIMIT=${1:-100}  # Default to 100 pages
OUT=${2:-"dist"} # Default output directory
MANIFEST="export-manifest.txt"

echo "🚀 Starting capped export (limit: $LIMIT pages)"

# Clean output directory
rm -rf "$OUT"
mkdir -p "$OUT"

# Create priority manifest if it doesn't exist
if [ ! -f "$MANIFEST" ]; then
    echo "📝 Creating priority manifest..."
    cat > "$MANIFEST" << 'EOF'
/
/programs/
/programs/cybersecurity/
/programs/cloud-computing/
/programs/healthcare-cna/
/programs/electrical-trades/
/programs/construction/
/programs/beauty-wellness/
/about/
/employers/
/contact/
/blog/
/privacy/
/terms/
/accessibility/
/faq/
/sitemap.html
EOF
fi

# Process manifest and cap at limit
echo "📋 Processing manifest (first $LIMIT entries)..."
head -n "$LIMIT" "$MANIFEST" > /tmp/export-list.txt

# Copy essential files first
echo "📁 Copying essential files..."
cp -r assets/ "$OUT/" 2>/dev/null || echo "⚠️  No assets directory found"
cp robots.txt "$OUT/" 2>/dev/null || echo "⚠️  No robots.txt found"
cp sitemap_index.xml "$OUT/" 2>/dev/null || echo "⚠️  No sitemap_index.xml found"
cp -r sitemaps/ "$OUT/" 2>/dev/null || echo "⚠️  No sitemaps directory found"

# Copy pages from manifest
echo "📄 Copying pages..."
COPIED=0
while IFS= read -r page_path; do
    # Skip empty lines and comments
    [[ -z "$page_path" || "$page_path" =~ ^# ]] && continue
    
    # Determine source file
    if [[ "$page_path" == "/" ]]; then
        src_file="index.html"
        dst_dir="$OUT"
        dst_file="$dst_dir/index.html"
    else
        # Remove leading/trailing slashes
        clean_path="${page_path#/}"
        clean_path="${clean_path%/}"
        
        src_file="${clean_path}/index.html"
        dst_dir="$OUT/$clean_path"
        dst_file="$dst_dir/index.html"
    fi
    
    # Copy if source exists
    if [ -f "$src_file" ]; then
        mkdir -p "$dst_dir"
        cp "$src_file" "$dst_file"
        echo "✅ $page_path"
        ((COPIED++))
    else
        echo "❌ $page_path (source not found: $src_file)"
    fi
done < /tmp/export-list.txt

# Generate deployment info
cat > "$OUT/deployment-info.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "pages_exported": $COPIED,
    "export_limit": $LIMIT,
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

echo ""
echo "🎉 Export complete!"
echo "📊 Pages exported: $COPIED"
echo "📁 Output directory: $OUT"
echo "💾 Total size: $(du -sh "$OUT" | cut -f1)"

# List what was exported
echo ""
echo "📋 Exported pages:"
find "$OUT" -name "index.html" | sed "s|^$OUT||" | sed 's|/index.html$|/|' | sed 's|^$|/|' | sort

# Cleanup
rm -f /tmp/export-list.txt

echo ""
echo "🚀 Ready for deployment!"
echo "   Deploy command: rsync -av $OUT/ your-server:/var/www/html/"
echo "   Or upload $OUT/ contents to your hosting provider"