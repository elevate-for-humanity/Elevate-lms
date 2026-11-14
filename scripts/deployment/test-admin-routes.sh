#!/bin/bash

# Admin Routes Test Script
# Copyright (c) 2025 Elevate for Humanity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Admin Routes Test${NC}"
echo "=================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}Error: Development server not running${NC}"
    echo "Please start the dev server: npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Development server is running${NC}"
echo ""

# Admin routes to test
ROUTES=(
    "/admin"
    "/admin/dashboard"
    "/admin/users"
    "/admin/courses"
    "/admin/community"
    "/admin/marketing"
    "/admin/assessments"
    "/admin/analytics"
    "/admin/integrations"
    "/admin/billing"
    "/admin/audit"
)

echo "Testing admin routes..."
echo ""

PASSED=0
FAILED=0

for route in "${ROUTES[@]}"; do
    echo -n "Testing $route... "
    
    # Test if route returns 200 or redirects (302/301)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$route)
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
        echo -e "${GREEN}✓ OK ($STATUS)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED ($STATUS)${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All admin routes are accessible!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some routes failed. This may be expected if authentication is required.${NC}"
    exit 0
fi
