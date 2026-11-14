#!/usr/bin/env bash
# Counts codebase metrics and prints them.
# Run: bash scripts/count-codebase.sh
# Used to keep README "Codebase" table accurate.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Metric | Count"
echo "--- | ---"
echo "Pages (app/**/page.tsx) | $(find app -name 'page.tsx' | wc -l | tr -d ' ')"
echo "API routes (app/api/**/route.ts) | $(find app/api -name 'route.ts' | wc -l | tr -d ' ')"
echo "React components (components/) | $(find components -name '*.tsx' | wc -l | tr -d ' ')"
echo "Library modules (lib/) | $(find lib -name '*.ts' -o -name '*.tsx' | wc -l | tr -d ' ')"
echo "SQL migrations | $(find supabase/migrations -name '*.sql' | wc -l | tr -d ' ')"
echo "Scripts | $(find scripts -type f \( -name '*.ts' -o -name '*.js' -o -name '*.sh' \) | wc -l | tr -d ' ')"
echo "Static images | $(find public/images -type f \( -name '*.jpg' -o -name '*.png' -o -name '*.webp' -o -name '*.svg' \) | wc -l | tr -d ' ')"
echo "Video files (.mp4) | $(find public -name '*.mp4' | wc -l | tr -d ' ')"
echo "Documentation files (docs/) | $(find docs -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
echo "Netlify serverless functions | $(find netlify/functions -name '*.ts' | wc -l | tr -d ' ')"
echo "Admin sections | $(find app/admin -name 'page.tsx' | wc -l | tr -d ' ')"
echo "LMS app sections | $(find app/lms -name 'page.tsx' | wc -l | tr -d ' ')"
echo "Program pages | $(find app/programs -name 'page.tsx' | wc -l | tr -d ' ')"
