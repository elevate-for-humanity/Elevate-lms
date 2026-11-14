#!/bin/bash
echo "♿ Accessibility Quick Check..."

# Check for common issues
echo "Checking for images without alt text..."
missing_alt=$(grep -r "<img" app components --include="*.tsx" --include="*.jsx" | grep -v "alt=" | wc -l)
echo "Images without alt: $missing_alt"

echo ""
echo "Checking for proper heading hierarchy..."
h1_count=$(grep -r "<h1" app --include="*.tsx" | wc -l)
echo "H1 tags found: $h1_count"

echo ""
echo "✅ Basic accessibility check complete"
echo ""
echo "For full audit, install axe DevTools:"
echo "npm install -D @axe-core/playwright"
echo ""
echo "Key requirements for WCAG 2.1 AA:"
echo "- All images have alt text"
echo "- Proper heading hierarchy (h1 → h2 → h3)"
echo "- Color contrast ratio ≥ 4.5:1"
echo "- Keyboard navigation works"
echo "- ARIA labels on interactive elements"
