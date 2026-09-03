#!/bin/bash

# Auto-deploy script for Elevate for Humanity
# Automatically commits and deploys changes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting auto-deploy process...${NC}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📍 Current branch: ${BRANCH}${NC}"

# Pull latest changes first
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull --rebase origin "$BRANCH" || {
    echo -e "${RED}❌ Failed to pull latest changes. Please resolve conflicts manually.${NC}"
    exit 1
}

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
    exit 0
fi

# Add all changes
echo -e "${YELLOW}📦 Adding all changes...${NC}"
git add .

# Generate commit message with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-deploy: ${TIMESTAMP}
"

# Commit changes
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Push to origin
echo -e "${YELLOW}🌐 Pushing to origin/${BRANCH}...${NC}"
git push origin "$BRANCH"

echo -e "${GREEN}✅ Auto-deploy completed successfully!${NC}"
echo -e "${GREEN}🌍 Changes will be live on Netlify in ~1-2 minutes${NC}"

# Optional: Show deployment status
echo -e "${YELLOW}📊 Recent commits:${NC}"
git log --oneline -3