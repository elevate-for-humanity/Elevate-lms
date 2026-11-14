#!/bin/bash

echo "🔍 Checking Student Portal Routes"
echo "=================================="
echo ""

echo "📁 Main Portal Structure:"
ls -1 app/portal/student/ | grep -v "page.tsx" | grep -v "layout.tsx" | head -20

echo ""
echo "🔗 Expected Routes:"
echo "  /portal/student - Landing page"
echo "  /portal/student/dashboard - Main dashboard"
echo "  /portal/student/courses - Course list"
echo "  /portal/student/assignments - Assignments"
echo "  /portal/student/grades - Grades"
echo "  /portal/student/certificates - Certificates"
echo "  /portal/student/study-groups - Study Groups"
echo "  /portal/student/career-counseling - Career Counseling"
echo "  /portal/student/apprenticeship-hours - Apprenticeship Hours"
echo "  /portal/student/payments - Payments"
echo "  /portal/student/portfolio - Portfolio"
echo "  /portal/student/peer-review - Peer Review"
echo "  /portal/student/competencies - Competencies"
echo "  /portal/student/accessibility - Accessibility"

echo ""
echo "✅ Checking if all routes have page.tsx:"
for dir in dashboard courses assignments grades certificates study-groups career-counseling apprenticeship-hours payments portfolio peer-review competencies accessibility; do
  if [ -f "app/portal/student/$dir/page.tsx" ]; then
    echo "  ✓ $dir"
  else
    echo "  ✗ $dir - MISSING"
  fi
done

echo ""
echo "🔍 Checking for duplicate routes:"
find app/portal/student -name "page.tsx" | grep -E "(dashboard|courses|assignments|grades)" | sort

