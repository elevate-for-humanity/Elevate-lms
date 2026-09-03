#!/usr/bin/env bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  Elevate for Humanity - Complete Setup"
echo "=========================================="
echo ""
echo "This script will guide you through:"
echo "  1. Sentry DSN configuration"
echo "  2. Environment variables check"
echo "  3. Image optimization"
echo "  4. Build verification"
echo ""
echo -e "${YELLOW}Time required: ~30 minutes${NC}"
echo ""
read -p "Press Enter to continue..."

# ==========================================
# STEP 1: Sentry DSN Configuration
# ==========================================
echo ""
echo "=========================================="
echo "  Step 1: Sentry DSN Configuration"
echo "=========================================="
echo ""

if [ -f .env.local ] && grep -q "NEXT_PUBLIC_SENTRY_DSN=https://" .env.local 2>/dev/null; then
  CURRENT_DSN=$(grep "NEXT_PUBLIC_SENTRY_DSN=" .env.local | cut -d'=' -f2)
  echo -e "${GREEN}✅ Sentry DSN already configured${NC}"
  echo "Current DSN: ${CURRENT_DSN:0:30}..."
  echo ""
  read -p "Update Sentry DSN? (y/n): " update_sentry
  
  if [ "$update_sentry" != "y" ]; then
    SENTRY_CONFIGURED=true
  fi
fi

if [ "$SENTRY_CONFIGURED" != "true" ]; then
  echo "To get your Sentry DSN:"
  echo ""
  echo "  1. Go to: https://sentry.io/signup"
  echo "  2. Create account (or login)"
  echo "  3. Create new project:"
  echo "     - Platform: Next.js"
  echo "     - Name: elevate-production"
  echo "  4. Copy the DSN (looks like: https://abc123@o123.ingest.sentry.io/456)"
  echo ""
  echo -e "${BLUE}Opening Sentry in browser...${NC}"
  
  # Try to open browser
  if command -v xdg-open &> /dev/null; then
    xdg-open "https://sentry.io/signup" 2>/dev/null || true
  elif command -v open &> /dev/null; then
    open "https://sentry.io/signup" 2>/dev/null || true
  fi
  
  echo ""
  read -p "Do you have your Sentry DSN? (y/n): " has_dsn
  
  if [ "$has_dsn" = "y" ]; then
    read -p "Enter your Sentry DSN: " sentry_dsn
    
    # Validate DSN format
    if [[ $sentry_dsn =~ ^https://[a-zA-Z0-9]+@[a-zA-Z0-9]+\.ingest\.sentry\.io/[0-9]+$ ]]; then
      # Create .env.local if it doesn't exist
      if [ ! -f .env.local ]; then
        cp .env.example .env.local 2>/dev/null || touch .env.local
      fi
      
      # Update or add DSN
      if grep -q "NEXT_PUBLIC_SENTRY_DSN=" .env.local; then
        sed -i.bak "s|NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN=$sentry_dsn|" .env.local
      else
        echo "NEXT_PUBLIC_SENTRY_DSN=$sentry_dsn" >> .env.local
      fi
      
      echo -e "${GREEN}✅ Sentry DSN saved to .env.local${NC}"
      SENTRY_CONFIGURED=true
    else
      echo -e "${RED}❌ Invalid DSN format${NC}"
      echo "Expected: https://abc123@o123.ingest.sentry.io/456"
      SENTRY_CONFIGURED=false
    fi
  else
    echo -e "${YELLOW}⚠️  Skipping Sentry configuration${NC}"
    echo "You can configure it later by running: ./scripts/setup-monitoring.sh"
    SENTRY_CONFIGURED=false
  fi
fi

# ==========================================
# STEP 2: Vercel Configuration
# ==========================================
echo ""
echo "=========================================="
echo "  Step 2: Vercel Configuration"
echo "=========================================="
echo ""

if [ "$SENTRY_CONFIGURED" = "true" ]; then
  echo "You need to add the Sentry DSN to Vercel:"
  echo ""
  echo "  Option 1: Via Vercel Dashboard"
  echo "    1. Go to: https://vercel.com"
  echo "    2. Select your project"
  echo "    3. Settings → Environment Variables"
  echo "    4. Add: NEXT_PUBLIC_SENTRY_DSN"
  echo "    5. Value: $sentry_dsn"
  echo "    6. Select: Production, Preview, Development"
  echo ""
  echo "  Option 2: Via Vercel CLI"
  echo "    vercel env add NEXT_PUBLIC_SENTRY_DSN"
  echo ""
  
  read -p "Have you added the DSN to Vercel? (y/n): " vercel_done
  
  if [ "$vercel_done" = "y" ]; then
    echo -e "${GREEN}✅ Vercel configured${NC}"
  else
    echo -e "${YELLOW}⚠️  Remember to add DSN to Vercel before deploying${NC}"
  fi
fi

# ==========================================
# STEP 3: Image Optimization
# ==========================================
echo ""
echo "=========================================="
echo "  Step 3: Image Optimization"
echo "=========================================="
echo ""

echo "Checking for large images..."
LARGE_IMAGES=$(find public -name "*.png" -o -name "*.jpg" | xargs du -h 2>/dev/null | sort -rh | head -5)

echo "Largest images:"
echo "$LARGE_IMAGES"
echo ""

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
  echo -e "${GREEN}✅ ImageMagick found${NC}"
  echo ""
  read -p "Optimize large images? (y/n): " optimize_images
  
  if [ "$optimize_images" = "y" ]; then
    echo "Optimizing images..."
    
    # Optimize logo.png
    if [ -f public/logo.png ]; then
      echo "Optimizing public/logo.png..."
      convert public/logo.png -resize 800x800\> -quality 85 public/logo-optimized.png
      mv public/logo-optimized.png public/logo.png
      echo -e "${GREEN}✅ Optimized logo.png${NC}"
    fi
    
    # Optimize logo-new.png
    if [ -f public/logo-new.png ]; then
      echo "Optimizing public/logo-new.png..."
      convert public/logo-new.png -resize 800x800\> -quality 85 public/logo-new-optimized.png
      mv public/logo-new-optimized.png public/logo-new.png
      echo -e "${GREEN}✅ Optimized logo-new.png${NC}"
    fi
    
    echo -e "${GREEN}✅ Image optimization complete${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  ImageMagick not found${NC}"
  echo "To optimize images, install ImageMagick:"
  echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
  echo "  macOS: brew install imagemagick"
  echo ""
  echo "Or optimize manually using online tools:"
  echo "  - https://tinypng.com"
  echo "  - https://squoosh.app"
fi

# ==========================================
# STEP 4: Environment Variables Check
# ==========================================
echo ""
echo "=========================================="
echo "  Step 4: Environment Variables Check"
echo "=========================================="
echo ""

if [ -f .env.local ]; then
  TOTAL_VARS=$(grep -v '^#' .env.local | grep -v '^$' | wc -l)
  echo -e "${GREEN}✅ .env.local exists${NC}"
  echo "Variables configured: $TOTAL_VARS"
  echo ""
  
  # Check critical variables
  CRITICAL_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_SECRET_KEY"
    "RESEND_API_KEY"
    "OPENAI_API_KEY"
  )
  
  echo "Checking critical variables:"
  MISSING_VARS=0
  for var in "${CRITICAL_VARS[@]}"; do
    if grep -q "^${var}=" .env.local && ! grep -q "^${var}=$" .env.local; then
      echo -e "  ${GREEN}✅${NC} $var"
    else
      echo -e "  ${RED}❌${NC} $var"
      ((MISSING_VARS++))
    fi
  done
  
  echo ""
  if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical variables configured${NC}"
  else
    echo -e "${YELLOW}⚠️  $MISSING_VARS critical variables missing${NC}"
    echo "Run: ./setup-env.sh to configure all variables"
  fi
else
  echo -e "${RED}❌ .env.local not found${NC}"
  echo "Run: ./setup-env.sh to create it"
fi

# ==========================================
# STEP 5: Build Test
# ==========================================
echo ""
echo "=========================================="
echo "  Step 5: Build Test"
echo "=========================================="
echo ""

read -p "Run a test build? (y/n): " run_build

if [ "$run_build" = "y" ]; then
  echo "Running build test..."
  echo ""
  
  if npm run build 2>&1 | tee build.log; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
    
    # Check build size
    if [ -d .next ]; then
      BUILD_SIZE=$(du -sh .next | cut -f1)
      echo "Build size: $BUILD_SIZE"
    fi
  else
    echo ""
    echo -e "${RED}❌ Build failed${NC}"
    echo "Check build.log for details"
  fi
fi

# ==========================================
# SUMMARY
# ==========================================
echo ""
echo "=========================================="
echo "  Setup Summary"
echo "=========================================="
echo ""

if [ "$SENTRY_CONFIGURED" = "true" ]; then
  echo -e "${GREEN}✅ Sentry: Configured${NC}"
else
  echo -e "${RED}❌ Sentry: Not configured${NC}"
fi

if [ -f .env.local ]; then
  echo -e "${GREEN}✅ Environment: Configured${NC}"
else
  echo -e "${RED}❌ Environment: Not configured${NC}"
fi

echo ""
echo "=========================================="
echo "  Next Steps"
echo "=========================================="
echo ""

if [ "$SENTRY_CONFIGURED" != "true" ]; then
  echo "1. Configure Sentry:"
  echo "   - Visit: https://sentry.io"
  echo "   - Get DSN"
  echo "   - Run: ./scripts/setup-monitoring.sh"
  echo ""
fi

if [ ! -f .env.local ] || [ $MISSING_VARS -gt 0 ]; then
  echo "2. Configure environment variables:"
  echo "   - Run: ./setup-env.sh"
  echo ""
fi

echo "3. Add variables to Vercel:"
echo "   - Run: vercel env add NEXT_PUBLIC_SENTRY_DSN"
echo "   - Or use Vercel Dashboard"
echo ""

echo "4. Deploy to production:"
echo "   - Run: vercel --prod"
echo ""

echo "5. Verify deployment:"
echo "   - Check: https://www.elevateforhumanity.org/api/health"
echo "   - Check: Sentry dashboard"
echo ""

echo "=========================================="
echo "  Documentation"
echo "=========================================="
echo ""
echo "For detailed guides, see:"
echo "  - SENTRY_SETUP_COMPLETE.md"
echo "  - MONITORING_QUICK_START.md"
echo "  - PRODUCTION_READY_FINAL_COMPLETE.md"
echo ""

echo -e "${GREEN}Setup complete!${NC}"
echo ""
