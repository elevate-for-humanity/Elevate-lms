#!/bin/bash

# Activate Zoom Integration on Vercel
# This script adds Zoom API credentials to your Vercel project

set -e

echo "🎥 Activating Zoom Integration"
echo "======================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Project details
PROJECT_ID="prj_mqHr6z23gRSqM5In6bLXtEo9cMGI"
ORG_ID="team_wnZ7iyQz1kUNni7yIDVUnhZf"

echo "📋 Project: elevate-for-humanity/Elevate-lms (admin)"
echo "⚠️  NOTE: Vercel project fix2 is retired/archived. Vercel is not the deploy target for Elevate-lms (Northflank / Cloud Run). Confirm the target project before adding secrets."
echo "🆔 Project ID: $PROJECT_ID"
echo ""

echo "⚠️  You need to provide your Zoom credentials."
echo "   Get them from: https://marketplace.zoom.us/"
echo ""

# Prompt for credentials
read -p "Enter your ZOOM_ACCOUNT_ID: " ZOOM_ACCOUNT_ID
read -p "Enter your ZOOM_CLIENT_ID: " ZOOM_CLIENT_ID
read -sp "Enter your ZOOM_CLIENT_SECRET: " ZOOM_CLIENT_SECRET
echo ""
read -p "Enter your ZOOM_USER_ID (or press Enter for 'me'): " ZOOM_USER_ID
ZOOM_USER_ID=${ZOOM_USER_ID:-me}

echo ""
echo "🔑 Adding ZOOM_ACCOUNT_ID to Vercel..."
echo "$ZOOM_ACCOUNT_ID" | vercel env add ZOOM_ACCOUNT_ID production

echo "🔑 Adding ZOOM_CLIENT_ID to Vercel..."
echo "$ZOOM_CLIENT_ID" | vercel env add ZOOM_CLIENT_ID production

echo "🔑 Adding ZOOM_CLIENT_SECRET to Vercel..."
echo "$ZOOM_CLIENT_SECRET" | vercel env add ZOOM_CLIENT_SECRET production

echo "🔑 Adding ZOOM_USER_ID to Vercel..."
echo "$ZOOM_USER_ID" | vercel env add ZOOM_USER_ID production

echo ""
echo "✅ Zoom credentials added successfully!"
echo ""
echo "📦 Triggering redeployment..."
vercel --prod --yes

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "🎉 Zoom integration is now active!"
echo ""
echo "Test the integration:"
echo "  curl -X POST https://your-domain.com/api/meetings/create"
echo ""
