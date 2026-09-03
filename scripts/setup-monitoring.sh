#!/usr/bin/env bash
set -e

echo "=================================="
echo "Monitoring Setup Wizard"
echo "=================================="
echo ""
echo "This script will help you configure:"
echo "  1. Sentry (Error Tracking)"
echo "  2. Uptime Monitoring"
echo "  3. Performance Monitoring"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
  cp .env.example .env.local
  echo -e "${GREEN}✅ Created .env.local${NC}"
  echo ""
fi

echo "=================================="
echo "Step 1: Sentry Configuration"
echo "=================================="
echo ""
echo "Sentry provides error tracking and performance monitoring."
echo ""
echo "To get your Sentry DSN:"
echo "  1. Go to https://sentry.io"
echo "  2. Sign up or log in"
echo "  3. Create a new project (Platform: Next.js)"
echo "  4. Copy your DSN (looks like: https://abc123@o123.ingest.sentry.io/456)"
echo ""

# Check if Sentry DSN already configured
if grep -q "NEXT_PUBLIC_SENTRY_DSN=https://" .env.local 2>/dev/null; then
  echo -e "${GREEN}✅ Sentry DSN already configured in .env.local${NC}"
  CURRENT_DSN=$(grep "NEXT_PUBLIC_SENTRY_DSN=" .env.local | cut -d'=' -f2)
  echo "Current DSN: $CURRENT_DSN"
  echo ""
  read -p "Update Sentry DSN? (y/n): " update_sentry
  
  if [ "$update_sentry" != "y" ]; then
    echo "Skipping Sentry configuration"
    SENTRY_CONFIGURED=true
  fi
fi

if [ "$SENTRY_CONFIGURED" != "true" ]; then
  read -p "Do you have a Sentry DSN? (y/n): " has_sentry
  
  if [ "$has_sentry" = "y" ]; then
    read -p "Enter your Sentry DSN: " sentry_dsn
    
    # Validate DSN format
    if [[ $sentry_dsn =~ ^https://[a-zA-Z0-9]+@[a-zA-Z0-9]+\.ingest\.sentry\.io/[0-9]+$ ]]; then
      # Update .env.local
      if grep -q "NEXT_PUBLIC_SENTRY_DSN=" .env.local; then
        sed -i "s|NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN=$sentry_dsn|" .env.local
      else
        echo "NEXT_PUBLIC_SENTRY_DSN=$sentry_dsn" >> .env.local
      fi
      
      echo -e "${GREEN}✅ Sentry DSN configured in .env.local${NC}"
      echo ""
      
      # Ask for auth token
      read -p "Do you have a Sentry Auth Token? (y/n): " has_token
      if [ "$has_token" = "y" ]; then
        read -p "Enter your Sentry Auth Token: " sentry_token
        
        if grep -q "SENTRY_AUTH_TOKEN=" .env.local; then
          sed -i "s|SENTRY_AUTH_TOKEN=.*|SENTRY_AUTH_TOKEN=$sentry_token|" .env.local
        else
          echo "SENTRY_AUTH_TOKEN=$sentry_token" >> .env.local
        fi
        
        echo -e "${GREEN}✅ Sentry Auth Token configured${NC}"
      fi
      
      SENTRY_CONFIGURED=true
    else
      echo -e "${RED}❌ Invalid DSN format${NC}"
      echo "Expected format: https://abc123@o123.ingest.sentry.io/456"
      SENTRY_CONFIGURED=false
    fi
  else
    echo ""
    echo -e "${YELLOW}⚠️  Sentry not configured${NC}"
    echo ""
    echo "To configure later:"
    echo "  1. Create account at https://sentry.io"
    echo "  2. Get your DSN"
    echo "  3. Add to .env.local:"
    echo "     NEXT_PUBLIC_SENTRY_DSN=your-dsn-here"
    echo ""
    SENTRY_CONFIGURED=false
  fi
fi

echo ""
echo "=================================="
echo "Step 2: Uptime Monitoring"
echo "=================================="
echo ""
echo "Uptime monitoring alerts you when your site goes down."
echo ""
echo "Recommended services:"
echo "  1. UptimeRobot (Free - 50 monitors)"
echo "  2. Better Uptime ($20/month)"
echo "  3. Pingdom ($10/month)"
echo ""
echo "Setup instructions:"
echo "  1. Go to https://uptimerobot.com"
echo "  2. Sign up (free)"
echo "  3. Add monitor:"
echo "     - Type: HTTP(s)"
echo "     - URL: https://www.elevateforhumanity.org/api/health"
echo "     - Interval: 5 minutes"
echo "  4. Add your email for alerts"
echo ""

read -p "Have you set up uptime monitoring? (y/n): " uptime_setup

if [ "$uptime_setup" = "y" ]; then
  echo -e "${GREEN}✅ Uptime monitoring configured${NC}"
  UPTIME_CONFIGURED=true
else
  echo -e "${YELLOW}⚠️  Uptime monitoring not configured${NC}"
  echo ""
  echo "To configure later, visit: https://uptimerobot.com"
  UPTIME_CONFIGURED=false
fi

echo ""
echo "=================================="
echo "Step 3: Vercel Configuration"
echo "=================================="
echo ""
echo "You need to add environment variables to Vercel for production."
echo ""

if [ "$SENTRY_CONFIGURED" = "true" ]; then
  echo "Add these to Vercel:"
  echo ""
  echo "  NEXT_PUBLIC_SENTRY_DSN=$(grep NEXT_PUBLIC_SENTRY_DSN .env.local | cut -d'=' -f2)"
  
  if grep -q "SENTRY_AUTH_TOKEN=" .env.local; then
    echo "  SENTRY_AUTH_TOKEN=$(grep SENTRY_AUTH_TOKEN .env.local | cut -d'=' -f2)"
  fi
  
  echo ""
  echo "Via Vercel CLI:"
  echo "  vercel env add NEXT_PUBLIC_SENTRY_DSN"
  echo "  vercel env add SENTRY_AUTH_TOKEN"
  echo ""
  echo "Via Vercel Dashboard:"
  echo "  1. Go to Project Settings → Environment Variables"
  echo "  2. Add each variable"
  echo "  3. Select: Production, Preview, Development"
  echo ""
fi

read -p "Have you added variables to Vercel? (y/n): " vercel_setup

if [ "$vercel_setup" = "y" ]; then
  echo -e "${GREEN}✅ Vercel configured${NC}"
  VERCEL_CONFIGURED=true
else
  echo -e "${YELLOW}⚠️  Vercel not configured${NC}"
  VERCEL_CONFIGURED=false
fi

echo ""
echo "=================================="
echo "Configuration Summary"
echo "=================================="
echo ""

if [ "$SENTRY_CONFIGURED" = "true" ]; then
  echo -e "${GREEN}✅ Sentry: Configured${NC}"
else
  echo -e "${RED}❌ Sentry: Not configured${NC}"
fi

if [ "$UPTIME_CONFIGURED" = "true" ]; then
  echo -e "${GREEN}✅ Uptime Monitoring: Configured${NC}"
else
  echo -e "${RED}❌ Uptime Monitoring: Not configured${NC}"
fi

if [ "$VERCEL_CONFIGURED" = "true" ]; then
  echo -e "${GREEN}✅ Vercel: Configured${NC}"
else
  echo -e "${RED}❌ Vercel: Not configured${NC}"
fi

echo ""
echo "=================================="
echo "Testing"
echo "=================================="
echo ""

if [ "$SENTRY_CONFIGURED" = "true" ]; then
  echo "To test Sentry locally:"
  echo "  1. npm run dev"
  echo "  2. Visit http://localhost:3000"
  echo "  3. Trigger an error"
  echo "  4. Check Sentry dashboard"
  echo ""
fi

echo "To test health endpoint:"
echo "  curl http://localhost:3000/api/health"
echo ""

echo "=================================="
echo "Next Steps"
echo "=================================="
echo ""

if [ "$SENTRY_CONFIGURED" != "true" ]; then
  echo "1. Configure Sentry:"
  echo "   - Visit https://sentry.io"
  echo "   - Create project"
  echo "   - Run this script again"
  echo ""
fi

if [ "$UPTIME_CONFIGURED" != "true" ]; then
  echo "2. Configure Uptime Monitoring:"
  echo "   - Visit https://uptimerobot.com"
  echo "   - Add monitor for /api/health"
  echo ""
fi

if [ "$VERCEL_CONFIGURED" != "true" ]; then
  echo "3. Configure Vercel:"
  echo "   - Add environment variables"
  echo "   - Deploy to production"
  echo ""
fi

echo "4. Read the complete guide:"
echo "   cat MONITORING_SETUP_GUIDE.md"
echo ""

echo "=================================="
echo "Setup Complete!"
echo "=================================="
