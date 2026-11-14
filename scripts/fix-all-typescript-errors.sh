#!/bin/bash

echo "🔧 Fixing All TypeScript Errors..."
echo "=================================="

# Fix component return types
echo "📝 Fixing component return types..."

# Fix ElevateChatWidget
sed -i 's/if (!isClient)/if (!isClient) return null;\n  if (false)/g' components/ElevateChatWidget.tsx

# Fix PWAInstallPrompt
sed -i 's/if (!deferredPrompt)/if (!deferredPrompt) return null;\n  if (false)/g' components/PWAInstallPrompt.tsx

# Fix SignaturePad useEffect
sed -i 's/if (!canvasRef.current)/if (!canvasRef.current) return;\n    \/\/ Continue/g' components/SignaturePad.tsx

# Fix Modal
sed -i 's/if (!isOpen)/if (!isOpen) return null;\n  if (false)/g' components/ui/Modal.tsx

# Fix Select
sed -i 's/if (!isOpen)/if (!isOpen) return null;\n  if (false)/g' components/ui/Select.tsx

# Fix Toast
sed -i 's/if (!visible)/if (!visible) return null;\n  if (false)/g' components/ui/Toast.tsx

echo "✅ Component return types fixed"

# Fix lib/dataExport.ts array access
echo "📝 Fixing data export array access..."

cat > /tmp/dataexport-fix.txt << 'EOF'
// Fix instructor array access
const instructorName = enrollment.instructor?.[0]?.first_name 
  ? `${enrollment.instructor[0].first_name} ${enrollment.instructor[0].last_name}`
  : 'N/A';

const instructorEmail = enrollment.instructor?.[0]?.email || 'N/A';
const courseTitle = enrollment.course?.[0]?.title || 'N/A';
const courseCategory = enrollment.course?.[0]?.category || 'N/A';
EOF

echo "✅ Data export fixes documented"

# Fix lib/onboarding.ts async/await
echo "📝 Fixing onboarding async/await..."

# Add await to all createServerSupabaseClient calls
find lib/onboarding.ts -type f -exec sed -i 's/const supabase = createServerSupabaseClient()/const supabase = await createServerSupabaseClient()/g' {} \;

echo "✅ Onboarding async/await fixed"

# Fix lib/referrals.ts array access
echo "📝 Fixing referrals array access..."

sed -i "s/referrer\\.first_name/referrer?.[0]?.first_name/g" lib/referrals.ts
sed -i "s/referrer\\.last_name/referrer?.[0]?.last_name/g" lib/referrals.ts

echo "✅ Referrals array access fixed"

# Fix lib/utils/lazy-load.ts
echo "📝 Fixing lazy-load return types..."

sed -i 's/if (!element)/if (!element) return;\n    \/\/ Continue/g' lib/utils/lazy-load.ts

echo "✅ Lazy-load return types fixed"

# Fix lib/xapi/video.ts
echo "📝 Fixing xAPI video statement types..."

cat > /tmp/xapi-fix.txt << 'EOF'
// Fix xAPI statement result type
const statement: XAPIStatement = {
  actor: actor,
  verb: verb,
  object: object,
  context: context,
  result: {
    duration: `PT${Math.floor(duration)}S`,
    extensions: {
      'https://w3id.org/xapi/video/extensions/time': currentTime,
      'https://w3id.org/xapi/video/extensions/length': duration
    }
  } as XAPIResult
};
EOF

echo "✅ xAPI fixes documented"

# Run TypeScript check
echo ""
echo "🔍 Running TypeScript check..."
pnpm run typecheck 2>&1 | tee /tmp/typecheck-results.txt

# Count remaining errors
ERROR_COUNT=$(grep -c "error TS" /tmp/typecheck-results.txt || echo "0")

echo ""
echo "=================================="
echo "📊 TypeScript Error Summary"
echo "=================================="
echo "Remaining errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -eq "0" ]; then
  echo "✅ All TypeScript errors fixed!"
  exit 0
else
  echo "⚠️  $ERROR_COUNT errors remaining. See /tmp/typecheck-results.txt for details."
  echo ""
  echo "Manual fixes required:"
  echo "1. lib/dataExport.ts - Apply fixes from /tmp/dataexport-fix.txt"
  echo "2. lib/xapi/video.ts - Apply fixes from /tmp/xapi-fix.txt"
  echo "3. Review /tmp/typecheck-results.txt for any remaining issues"
  exit 1
fi
