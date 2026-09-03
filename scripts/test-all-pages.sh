#!/bin/bash

# Test All Pages - Verify Styling and Functionality
# This script checks all 187 pages for common issues

echo "🧪 Testing All Pages - Elevate for Humanity"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_PAGES=0
PASSED=0
FAILED=0
WARNINGS=0

# Check if src/pages exists
if [ ! -d "src/pages" ]; then
    echo -e "${RED}❌ Error: src/pages directory not found${NC}"
    exit 1
fi

echo "📊 Counting pages..."
TOTAL_PAGES=$(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup" | wc -l)
echo -e "${GREEN}Found ${TOTAL_PAGES} pages${NC}"
echo ""

echo "🔍 Checking for common issues..."
echo ""

# Test 1: Check for missing imports
echo "1️⃣  Checking for missing Navigation/Footer imports..."
MISSING_NAV=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    if grep -q "Navigation" "$file" && ! grep -q "import.*Navigation" "$file"; then
        echo -e "${RED}   ❌ Missing Navigation import: $file${NC}"
        ((MISSING_NAV++))
    fi
done
if [ $MISSING_NAV -eq 0 ]; then
    echo -e "${GREEN}   ✅ All pages have proper Navigation imports${NC}"
    ((PASSED++))
else
    echo -e "${RED}   ❌ Found $MISSING_NAV pages with missing Navigation imports${NC}"
    ((FAILED++))
fi
echo ""

# Test 2: Check for Helmet usage
echo "2️⃣  Checking for Helmet (SEO) usage..."
MISSING_HELMET=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    if ! grep -q "Helmet" "$file"; then
        echo -e "${YELLOW}   ⚠️  Missing Helmet: $file${NC}"
        ((MISSING_HELMET++))
    fi
done
if [ $MISSING_HELMET -eq 0 ]; then
    echo -e "${GREEN}   ✅ All pages use Helmet for SEO${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}   ⚠️  Found $MISSING_HELMET pages without Helmet${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 3: Check for design system classes
echo "3️⃣  Checking for design system usage..."
NON_COMPLIANT=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    # Check if file uses old color classes instead of design system
    if grep -q "bg-gray-\|text-gray-\|border-gray-" "$file"; then
        echo -e "${YELLOW}   ⚠️  Uses gray colors (should use brown/beige): $file${NC}"
        ((NON_COMPLIANT++))
    fi
done
if [ $NON_COMPLIANT -eq 0 ]; then
    echo -e "${GREEN}   ✅ All pages use design system colors${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}   ⚠️  Found $NON_COMPLIANT pages with non-compliant colors${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 4: Check for console.log statements
echo "4️⃣  Checking for console.log statements..."
CONSOLE_LOGS=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    if grep -q "console\.log" "$file"; then
        ((CONSOLE_LOGS++))
    fi
done
if [ $CONSOLE_LOGS -eq 0 ]; then
    echo -e "${GREEN}   ✅ No console.log statements found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}   ⚠️  Found $CONSOLE_LOGS pages with console.log statements${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 5: Check for proper TypeScript types
echo "5️⃣  Checking TypeScript files for 'any' types..."
ANY_TYPES=0
for file in $(find src/pages -name "*.tsx" | grep -v ".backup"); do
    if grep -q ": any" "$file"; then
        ((ANY_TYPES++))
    fi
done
if [ $ANY_TYPES -eq 0 ]; then
    echo -e "${GREEN}   ✅ No 'any' types found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}   ⚠️  Found $ANY_TYPES pages with 'any' types${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 6: Check for accessibility attributes
echo "6️⃣  Checking for accessibility attributes..."
MISSING_ALT=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    # Check for img tags without alt
    if grep -q "<img" "$file" && ! grep -q "alt=" "$file"; then
        echo -e "${YELLOW}   ⚠️  Image without alt text: $file${NC}"
        ((MISSING_ALT++))
    fi
done
if [ $MISSING_ALT -eq 0 ]; then
    echo -e "${GREEN}   ✅ All images have alt text${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}   ⚠️  Found $MISSING_ALT pages with images missing alt text${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 7: Check for responsive classes
echo "7️⃣  Checking for responsive design classes..."
NON_RESPONSIVE=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    # Check if file has responsive classes (md:, lg:, etc.)
    if ! grep -q "md:\|lg:\|sm:" "$file"; then
        echo -e "${YELLOW}   ⚠️  No responsive classes found: $file${NC}"
        ((NON_RESPONSIVE++))
    fi
done
if [ $NON_RESPONSIVE -eq 0 ]; then
    echo -e "${GREEN}   ✅ All pages use responsive classes${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}   ⚠️  Found $NON_RESPONSIVE pages without responsive classes${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 8: Check for proper component structure
echo "8️⃣  Checking for proper component structure..."
IMPROPER_STRUCTURE=0
for file in $(find src/pages -name "*.tsx" -o -name "*.jsx" | grep -v ".backup"); do
    # Check if file exports default function
    if ! grep -q "export default function\|export default" "$file"; then
        echo -e "${RED}   ❌ Missing default export: $file${NC}"
        ((IMPROPER_STRUCTURE++))
    fi
done
if [ $IMPROPER_STRUCTURE -eq 0 ]; then
    echo -e "${GREEN}   ✅ All pages have proper exports${NC}"
    ((PASSED++))
else
    echo -e "${RED}   ❌ Found $IMPROPER_STRUCTURE pages with improper structure${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "============================================"
echo "📊 Test Summary"
echo "============================================"
echo -e "Total Pages: ${GREEN}${TOTAL_PAGES}${NC}"
echo -e "Tests Passed: ${GREEN}${PASSED}${NC}"
echo -e "Tests Failed: ${RED}${FAILED}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
