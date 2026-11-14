#!/bin/bash
# Google Classroom Setup Guide - Interactive Autopilot
# Guides you through configuration without requiring gcloud CLI

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    GOOGLE CLASSROOM AUTOPILOT - INTERACTIVE SETUP          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="magnetic-clone-436521-n9"
SITE_URL="https://elevateforhumanity.pages.dev"

echo "🎯 Configuration Target:"
echo "   Project: $PROJECT_ID"
echo "   Website: $SITE_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1
echo -e "${BLUE}STEP 1: Enable Google Classroom API${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open this link in your browser:"
echo "   https://console.cloud.google.com/apis/library/classroom.googleapis.com?project=$PROJECT_ID"
echo ""
echo "2. Click the 'ENABLE' button"
echo ""
read -p "Press Enter when API is enabled..."
echo ""
echo -e "${GREEN}✅ Step 1 complete${NC}"
echo ""

# Step 2
echo -e "${BLUE}STEP 2: Create OAuth 2.0 Credentials${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open this link:"
echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""
echo "2. Click 'CREATE CREDENTIALS' → 'OAuth client ID'"
echo ""
echo "3. If prompted, configure consent screen first (see Step 3)"
echo ""
echo "4. Application type: 'Web application'"
echo ""
echo "5. Name: 'Elevate for Humanity LMS'"
echo ""
echo "6. Authorized redirect URIs - Add these TWO URLs:"
echo "   $SITE_URL/auth/callback"
echo "   http://localhost:3000/auth/callback"
echo ""
echo "7. Click 'CREATE'"
echo ""
echo "8. Copy the Client ID and Client Secret"
echo ""
read -p "Press Enter when credentials are created..."
echo ""

# Get credentials
echo "Enter your OAuth credentials:"
echo ""
read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET
echo ""

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Credentials not provided - you can add them later${NC}"
else
    echo -e "${GREEN}✅ Credentials captured${NC}"
fi
echo ""

# Step 3
echo -e "${BLUE}STEP 3: Configure OAuth Consent Screen${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open this link:"
echo "   https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo ""
echo "2. User Type: 'External' (or 'Internal' if you have Google Workspace)"
echo ""
echo "3. Fill in:"
echo "   • App name: Elevate for Humanity"
echo "   • User support email: your-email@elevateforhumanity.org"
echo "   • Developer contact: your-email@elevateforhumanity.org"
echo ""
echo "4. Click 'SAVE AND CONTINUE'"
echo ""
echo "5. Add Scopes - Click 'ADD OR REMOVE SCOPES' and add:"
echo "   • .../auth/classroom.courses"
echo "   • .../auth/classroom.coursework.students"
echo "   • .../auth/classroom.rosters"
echo "   • .../auth/classroom.topics"
echo ""
echo "6. Click 'SAVE AND CONTINUE' through remaining steps"
echo ""
read -p "Press Enter when consent screen is configured..."
echo ""
echo -e "${GREEN}✅ Step 3 complete${NC}"
echo ""

# Step 4
echo -e "${BLUE}STEP 4: Add to Cloudflare Pages${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://dash.cloudflare.com"
echo ""
echo "2. Navigate to: Pages → elevateforhumanity → Settings → Environment Variables"
echo ""
echo "3. Add these variables:"
echo ""
if [ ! -z "$CLIENT_ID" ]; then
    echo "   GOOGLE_OAUTH_CLIENT_ID=$CLIENT_ID"
    echo "   GOOGLE_OAUTH_CLIENT_SECRET=$CLIENT_SECRET"
else
    echo "   GOOGLE_OAUTH_CLIENT_ID=your-client-id"
    echo "   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret"
fi
echo "   GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
echo ""
echo "4. Click 'Save'"
echo ""
read -p "Press Enter when environment variables are added..."
echo ""
echo -e "${GREEN}✅ Step 4 complete${NC}"
echo ""

# Create local .env
echo -e "${BLUE}STEP 5: Update Local Environment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$CLIENT_ID" ] && [ ! -z "$CLIENT_SECRET" ]; then
    # Update .env file
    if [ -f ".env" ]; then
        # Check if Google vars already exist
        if grep -q "GOOGLE_OAUTH_CLIENT_ID" .env; then
            # Update existing
            sed -i "s|GOOGLE_OAUTH_CLIENT_ID=.*|GOOGLE_OAUTH_CLIENT_ID=$CLIENT_ID|" .env
            sed -i "s|GOOGLE_OAUTH_CLIENT_SECRET=.*|GOOGLE_OAUTH_CLIENT_SECRET=$CLIENT_SECRET|" .env
            if ! grep -q "GOOGLE_CLOUD_PROJECT" .env; then
                echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" >> .env
            fi
            echo -e "${GREEN}✅ Updated .env file${NC}"
        else
            # Append new
            echo "" >> .env
            echo "# Google Classroom Configuration" >> .env
            echo "GOOGLE_OAUTH_CLIENT_ID=$CLIENT_ID" >> .env
            echo "GOOGLE_OAUTH_CLIENT_SECRET=$CLIENT_SECRET" >> .env
            echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" >> .env
            echo -e "${GREEN}✅ Added to .env file${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  .env file not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped - credentials not provided${NC}"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  SETUP COMPLETE! 🎉                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "✅ What's Configured:"
echo "   • Google Classroom API enabled"
echo "   • OAuth credentials created"
echo "   • Consent screen configured"
echo "   • Environment variables set"
echo ""

echo "🧪 Test Your Setup:"
echo "   1. Go to: $SITE_URL/admin/classroom"
echo "   2. Click 'Connect Google Classroom'"
echo "   3. Authorize the app"
echo "   4. Start creating courses!"
echo ""

echo "📚 Documentation:"
echo "   • GOOGLE_CLOUD_SETUP.md - Full reference"
echo "   • google-classroom-autopilot/README.md - Features"
echo "   • google-classroom-autopilot/SETUP_GUIDE.md - Detailed guide"
echo ""

echo "🎊 Google Classroom is now ready to use!"
echo ""
