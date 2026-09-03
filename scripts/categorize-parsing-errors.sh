#!/bin/bash

echo "=== PARSING ERROR CATEGORIZATION ==="
echo ""

ACTIVE_APP=0
ACTIVE_COMPONENTS=0
SCRIPTS=0
SUPABASE_FUNCTIONS=0
TESTS=0

# Check if files are imported/used in active app code
echo "ACTIVE PRODUCTION CODE (must fix):"
for file in components/AchievementsBadges.tsx \
            components/PeerReviewSystem.tsx \
            components/VoiceInput.tsx \
            components/admin/CopilotDeployment.tsx \
            components/admin/LearningBarrierAnalyzer.tsx \
            components/course/AutomaticCourseBuilder.tsx \
            components/gamification/AchievementBadges.tsx \
            components/gamification/Leaderboard.tsx \
            components/layout/CompliantHeader.tsx \
            components/mobile/MobileAchievementCard.tsx \
            components/performance/PerformanceMonitor.tsx \
            components/video/ProfessionalVideoPlayer.tsx; do
  # Check if imported anywhere in app/
  if grep -r "from.*$file\|import.*$(basename $file .tsx)" app/ 2>/dev/null | grep -q .; then
    echo "  ✓ $file (IMPORTED - MUST FIX)"
    ((ACTIVE_COMPONENTS++))
  else
    echo "  ○ $file (not imported - can exclude)"
  fi
done

echo ""
echo "NON-PRODUCTION CODE (can exclude from lint):"
echo "  Scripts: $(ls scripts/*.js scripts/*.ts scripts/utilities/*.js 2>/dev/null | wc -l) files"
echo "  Supabase Functions: $(ls supabase/functions/*/index.ts 2>/dev/null | wc -l) files"
echo "  Tests: $(ls tests/*.js 2>/dev/null | wc -l) files"

echo ""
echo "SUMMARY:"
echo "  Active components with parsing errors: $ACTIVE_COMPONENTS"
echo "  Scripts/utilities (exclude): ~60 files"
echo "  Supabase functions (exclude): 2 files"
echo "  Tests (exclude): 3 files"
