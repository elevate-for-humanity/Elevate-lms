#!/bin/bash
# Generate a licensed client repository
# Usage: ./scripts/generate-client-repo.sh "Client Name" "client-slug" "EFH-2025-CLIENT-001"

if [ $# -lt 3 ]; then
  echo "Usage: $0 <client-name> <client-slug> <license-id>"
  echo "Example: $0 'Acme Workforce Board' 'acme' 'EFH-2025-ACME-001'"
  exit 1
fi

CLIENT_NAME=$1
CLIENT_SLUG=$2
LICENSE_ID=$3
NEW_REPO="efh-${CLIENT_SLUG}-platform"
TODAY=$(date +%Y-%m-%d)

echo "🔒 Generating licensed repository for: $CLIENT_NAME"
echo "License ID: $LICENSE_ID"
echo "Repository: $NEW_REPO"
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "📁 Creating temporary directory: $TEMP_DIR"

# Clone current repo
echo "📦 Cloning base repository..."
git clone . "$TEMP_DIR"
cd "$TEMP_DIR"

# Remove .git directory
rm -rf .git

# Update license.json
echo "📝 Updating license.json..."
cat > config/license.json <<LICEOF
{
  "licenseHolder": "$CLIENT_NAME",
  "licenseId": "$LICENSE_ID",
  "licenseType": "single-org",
  "issuedAt": "$TODAY",
  "validDomains": ["localhost", "${CLIENT_SLUG}.com"],
  "status": "active",
  "notes": "Licensed to $CLIENT_NAME on $TODAY"
}
LICEOF

# Update fingerprints
echo "🔐 Updating license fingerprints..."
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" \) -exec sed -i "s/EFH-2025-MASTER-000/$LICENSE_ID/g" {} +

# Initialize new git repo
echo "🔧 Initializing new repository..."
git init
git add .
git commit -m "Initialize licensed repository for $CLIENT_NAME

License ID: $LICENSE_ID
License Type: Single Organization
Issued: $TODAY

This repository is licensed to $CLIENT_NAME and includes
unique license fingerprints for IP protection."

# Create GitHub repo (requires gh CLI)
if command -v gh &> /dev/null; then
  echo "📤 Creating GitHub repository..."
  gh repo create "elevateforhumanity/$NEW_REPO" --private --source=. --remote=origin --push
  echo "✅ Repository created: https://github.com/elevateforhumanity/$NEW_REPO"
else
  echo "⚠️ GitHub CLI not found. Repository created locally at: $TEMP_DIR"
  echo "   To push manually:"
  echo "   1. Create repo on GitHub: https://github.com/new"
  echo "   2. cd $TEMP_DIR"
  echo "   3. git remote add origin git@github.com:elevateforhumanity/$NEW_REPO.git"
  echo "   4. git push -u origin main"
fi

echo ""
echo "🎉 Licensed repository generated successfully!"
echo ""
echo "Next steps:"
echo "1. Grant client access to the repository"
echo "2. Provide them with deployment instructions"
echo "3. Update your license tracking spreadsheet"
echo ""
