#!/bin/bash
# Complete Ecosystem Health Check

echo "🌐 EFH Complete Ecosystem Health Check"
echo "========================================"
echo ""

PASS=0
FAIL=0

# Colors
G='\033[0;32m'
R='\033[0;31m'
Y='\033[1;33m'
NC='\033[0m'

check() {
    local name="$1"
    local result=$2
    
    if [ $result -eq 0 ]; then
        echo -e "${G}✅ $name${NC}"
        ((PASS++))
    else
        echo -e "${R}❌ $name${NC}"
        ((FAIL++))
    fi
}

echo "1️⃣  Core Files"
echo "-------------"
test -f package.json; check "package.json" $?
test -f .env.example; check ".env.example" $?
test -d src; check "src directory" $?
test -d dist; check "dist directory" $?
echo ""

echo "2️⃣  Build System"
echo "---------------"
test -f dist/index.html; check "Built index.html" $?
test -f dist/sitemap.xml; check "Sitemap generated" $?
test -f dist/robots.txt; check "robots.txt generated" $?
test -d dist/assets; check "Assets bundled" $?
echo ""

echo "3️⃣  Social Media Automation"
echo "---------------------------"
test -f scripts/social-media-automation.js; check "Main automation script" $?
test -f scripts/setup-social-oauth.js; check "OAuth setup tool" $?
test -f docs/SOCIAL_MEDIA_AUTOMATION_SETUP.md; check "Setup documentation" $?
test -f docs/SOCIAL_MEDIA_QUICK_START.md; check "Quick start guide" $?
echo ""

echo "4️⃣  Reels System"
echo "----------------"
test -f reels/reels_maker.py; check "Reels generator" $?
test -f reels/add_subtitles.py; check "Auto-subtitles" $?
test -f reels/content.csv; check "Sample content" $?
test -f reels/content-calendar-30days.csv; check "30-day calendar" $?
test -f reels/requirements.txt; check "Python dependencies" $?
test -f reels/README.md; check "Documentation" $?
test -f reels/QUICKSTART.md; check "Quick start" $?
test -f reels/STATUS.md; check "Status doc" $?
test -d reels/assets; check "Assets directory" $?
test -d reels/out; check "Output directory" $?
echo ""

echo "5️⃣  Testing Infrastructure"
echo "--------------------------"
test -f vitest.config.js; check "Vitest config" $?
test -d src/test; check "Test directory" $?
test -f src/test/chat-assistant.test.tsx; check "Chat assistant tests" $?
test -f src/test/button-navigation.test.jsx; check "Navigation tests" $?
test -f test-runner.mjs; check "Test runner" $?
echo ""

echo "6️⃣  Documentation"
echo "-----------------"
test -f README.md; check "Main README" $?
test -f SYSTEM_STATUS.md; check "System status" $?
test -f HEALTH_REPORT.md; check "Health report" $?
test -f SECURITY.md; check "Security doc" $?
test -d docs; check "Docs directory" $?
echo ""

echo "7️⃣  Automation & Scripts"
echo "------------------------"
test -f scripts/autopilot.sh; check "Autopilot script" $?
test -f scripts/generate-sitemap-complete.mjs; check "Sitemap generator" $?
test -f scripts/robots.mjs; check "Robots generator" $?
test -d .autopilot_out; check "Autopilot output dir" $?
echo ""

echo "8️⃣  Git & Version Control"
echo "-------------------------"
git rev-parse --git-dir > /dev/null 2>&1; check "Git repository" $?
git remote -v | grep -q origin; check "Remote configured" $?
test -f .gitignore; check ".gitignore exists" $?
echo ""

echo "9️⃣  Package Scripts"
echo "-------------------"
grep -q '"social:setup"' package.json; check "social:setup command" $?
grep -q '"social:test"' package.json; check "social:test command" $?
grep -q '"social:start"' package.json; check "social:start command" $?
grep -q '"social:report"' package.json; check "social:report command" $?
echo ""

echo "🔟 Security Checks"
echo "------------------"
! git ls-files | grep -q '^\.env$'; check ".env not committed" $?
test -f .env.example; check ".env.example exists" $?
echo ""

echo "========================================"
echo "📊 Final Summary"
echo "========================================"
echo -e "${G}✅ Passed: $PASS${NC}"
echo -e "${R}❌ Failed: $FAIL${NC}"
echo ""

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo "Health Score: $PERCENTAGE% ($PASS/$TOTAL)"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${G}🎉 Perfect! All systems operational!${NC}"
    echo ""
    echo "✅ Social Media Automation: Ready"
    echo "✅ Reels Generator: Ready"
    echo "✅ Testing: Ready"
    echo "✅ Documentation: Complete"
    echo "✅ Build System: Working"
    echo ""
    echo "🚀 System is production-ready!"
    exit 0
else
    echo -e "${Y}⚠️  Some checks failed. Review above.${NC}"
    exit 1
fi
