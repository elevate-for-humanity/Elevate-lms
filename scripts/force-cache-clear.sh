#!/bin/bash
# Force Vercel cache clear and redeploy

echo "🔄 Forcing Vercel cache clear and redeploy"
echo ""

# Update cache bust timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "Timestamp: $TIMESTAMP"

# Update layout.tsx cache bust
sed -i "s/Cache bust: .*/Cache bust: $TIMESTAMP/" app/layout.tsx

echo "✅ Updated cache bust in app/layout.tsx"

# Commit and push
git add app/layout.tsx
git commit -m "chore: force cache clear - $TIMESTAMP
"
git push origin main

echo ""
echo "✅ Cache clear triggered!"
echo "   New deployment will start in ~30 seconds"
echo "   Wait 2-3 minutes then hard refresh your browser"
echo ""
echo "🌐 After deployment:"
echo "   1. Go to www.elevateforhumanity.org"
echo "   2. Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "   3. Or open in Incognito mode"
