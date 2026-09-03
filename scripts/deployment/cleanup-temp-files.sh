#!/bin/bash

# Cleanup Temporary Deployment Files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  🧹 CLEANUP TEMPORARY FILES${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Temporary files to clean up
TEMP_FILES=(
    "/tmp/verify-output.txt"
    "/tmp/rls-output.txt"
    "/tmp/functions-output.txt"
    "/tmp/deploy-migrations-api.sh"
    "audit-output.log"
)

# Old deployment bundles (keep only the latest)
OLD_BUNDLES=$(ls -t deployment-bundle-*.tar.gz 2>/dev/null | tail -n +2)

echo -e "${YELLOW}Cleaning up temporary files...${NC}"
echo ""

CLEANED=0

for file in "${TEMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo -e "${GREEN}✅ Removed: $file${NC}"
        CLEANED=$((CLEANED + 1))
    fi
done

# Clean up old bundles
if [ -n "$OLD_BUNDLES" ]; then
    echo ""
    echo -e "${YELLOW}Cleaning up old deployment bundles...${NC}"
    for bundle in $OLD_BUNDLES; do
        echo -e "${YELLOW}  Removing: $bundle${NC}"
        rm -f "$bundle"
        CLEANED=$((CLEANED + 1))
    done
fi

# Clean up extracted bundle directories
EXTRACTED_DIRS=$(find /tmp -maxdepth 1 -type d -name "tmp.*" 2>/dev/null)
if [ -n "$EXTRACTED_DIRS" ]; then
    echo ""
    echo -e "${YELLOW}Cleaning up extracted bundle directories...${NC}"
    for dir in $EXTRACTED_DIRS; do
        rm -rf "$dir"
        echo -e "${GREEN}✅ Removed: $dir${NC}"
        CLEANED=$((CLEANED + 1))
    done
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CLEANUP SUMMARY${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Files cleaned: $CLEANED"
echo ""

if [ $CLEANED -gt 0 ]; then
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
else
    echo -e "${YELLOW}No temporary files to clean${NC}"
fi

echo ""
echo "Kept files:"
echo "  - Latest deployment bundle"
echo "  - Deployment-ready files"
echo "  - Verification scripts"
echo "  - Documentation"
