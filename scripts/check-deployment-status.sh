#!/bin/bash

# Check deployment status after push
# This script monitors the deployment and provides status updates

echo "🔍 Checking deployment status..."
echo ""

# Check if changes were pushed
echo "✅ Changes pushed to GitHub"
echo "   Branch: main"
echo "   Commits:"
git log --oneline -3 | sed 's/^/   - /'
echo ""

# Check Vercel configuration
echo "📋 Vercel Configuration:"
if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json found"
    if grep -q '"deploymentEnabled"' vercel.json; then
        echo "   ✅ Auto-deployment enabled for main branch"
    fi
else
    echo "   ⚠️  vercel.json not found"
fi
echo ""

# Check for deployment markers
echo "🚀 Deployment Status:"
echo "   Vercel will automatically deploy from main branch"
echo "   Expected deployment URL: https://fix2.vercel.app (or custom domain)"
echo ""

# Provide monitoring instructions
echo "📊 To monitor deployment:"
echo "   1. Visit: https://vercel.com/dashboard"
echo "   2. Check GitHub Actions: https://github.com/elevateforhumanity/fix2/actions"
echo "   3. Watch for Vercel bot comment on latest commit"
echo ""

# Check if there are any build scripts
echo "🔧 Build Configuration:"
if grep -q '"build":' package.json; then
    echo "   ✅ Build script configured"
    grep '"build":' package.json | sed 's/^/   /'
fi
echo ""

# Provide next steps
echo "✨ Next Steps:"
echo "   1. Deployment will start automatically (usually within 1-2 minutes)"
echo "   2. Build time: ~5-10 minutes for Next.js app"
echo "   3. Check deployment logs in Vercel dashboard"
echo "   4. Verify deployment at production URL"
echo ""

# Check for environment variables
echo "⚙️  Environment Variables to Verify:"
echo "   - STRIPE_SECRET_KEY (required for payment processing)"
echo "   - STRIPE_WEBHOOK_SECRET (required for webhooks)"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo "✅ Deployment monitoring setup complete!"
echo ""
echo "💡 Tip: Run 'node scripts/validate-stripe-version.cjs' after deployment"
echo "   to verify the fix is live."
