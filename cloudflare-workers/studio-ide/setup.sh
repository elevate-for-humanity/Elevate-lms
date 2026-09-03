#!/bin/bash
# Setup script for Studio IDE Cloudflare Worker

set -e

echo "🚀 Setting up Elevate Studio IDE..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already)
echo "Checking Cloudflare authentication..."
wrangler whoami || wrangler login

# Create D1 database
echo "Creating D1 database..."
D1_OUTPUT=$(wrangler d1 create elevate-studio 2>&1 || true)
D1_ID=$(echo "$D1_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "")

if [ -z "$D1_ID" ]; then
    echo "D1 database may already exist. Listing databases..."
    wrangler d1 list
    echo "Please enter the D1 database ID for 'elevate-studio':"
    read D1_ID
fi

# Create R2 bucket
echo "Creating R2 bucket..."
wrangler r2 bucket create elevate-studio-files 2>&1 || echo "Bucket may already exist"

# Create KV namespace
echo "Creating KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create STUDIO_META 2>&1 || true)
KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+' || echo "")

if [ -z "$KV_ID" ]; then
    echo "KV namespace may already exist. Listing namespaces..."
    wrangler kv:namespace list
    echo "Please enter the KV namespace ID for 'STUDIO_META':"
    read KV_ID
fi

# Update wrangler.toml with actual IDs
echo "Updating wrangler.toml with resource IDs..."
sed -i "s/PLACEHOLDER_D1_ID/$D1_ID/g" wrangler.toml
sed -i "s/PLACEHOLDER_KV_ID/$KV_ID/g" wrangler.toml

# Run D1 migrations
echo "Running database migrations..."
wrangler d1 execute elevate-studio --file=./schema.sql

# Install dependencies
echo "Installing dependencies..."
npm install

# Deploy
echo "Deploying worker..."
wrangler deploy

echo ""
echo "✅ Setup complete!"
echo ""
echo "Your Studio IDE API is now available at:"
echo "  https://elevate-studio-ide.<your-subdomain>.workers.dev"
echo ""
echo "To use a custom domain (studio-api.elevateforhumanity.org):"
echo "  1. Go to Cloudflare Dashboard > Workers & Pages > elevate-studio-ide"
echo "  2. Click 'Triggers' tab"
echo "  3. Add custom domain: studio-api.elevateforhumanity.org"
echo ""
echo "Update your .env.local with:"
echo "  NEXT_PUBLIC_STUDIO_API_URL=https://studio-api.elevateforhumanity.org"
