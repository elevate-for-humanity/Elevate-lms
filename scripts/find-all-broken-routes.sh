#!/bin/bash
# Find all broken routes - comprehensive scan

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Scanning all routes for errors..."
echo ""

# All known routes to test
ROUTES=(
  # Main pages
  "/"
  "/about"
  "/contact"
  "/apply"
  "/login"
  "/register"
  "/dashboard"
  "/privacy"
  "/terms"
  "/faq"
  "/blog"
  "/careers"
  "/donate"
  
  # Programs
  "/programs"
  "/programs/healthcare"
  "/programs/skilled-trades"
  "/programs/beauty"
  "/programs/technology"
  "/programs/business"
  "/programs/cdl-transportation"
  "/programs/apprenticeships"
  "/programs/federal-funded"
  "/programs/micro-programs"
  "/programs/hvac-technician"
  "/programs/cna-certification"
  "/programs/barber-apprenticeship"
  "/programs/cdl-training"
  "/programs/medical-assistant"
  "/programs/phlebotomy-technician"
  "/programs/home-health-aide"
  "/programs/cna"
  "/programs/jri"
  
  # Store
  "/store"
  "/store/cart"
  "/store/licenses"
  "/store/subscriptions"
  "/store/success"
  "/store/compliance"
  "/store/integrations"
  "/store/deployment"
  "/store/demo"
  
  # License
  "/license"
  "/license/features"
  "/license/pricing"
  "/license/integrations"
  "/license/demo"
  
  # Demo
  "/demo"
  "/demo/learner"
  "/demo/admin"
  "/demo/employer"
  "/schedule"
  
  # Admin
  "/admin"
  "/admin/dashboard"
  "/admin/students"
  "/admin/programs"
  "/admin/reports"
  "/admin/enrollments"
  "/admin/courses"
  "/admin/settings"
  "/admin/analytics"
  "/admin/users"
  
  # Partner pages
  "/partners"
  "/employers"
  "/government"
  "/funding-impact"
  "/fundingimpact"
  "/workone-partner-packet"
  
  # Student/Learner
  "/student/dashboard"
  "/lms"
  "/lms/dashboard"
  "/learner"
  "/learner/dashboard"
  
  # Staff
  "/staff-portal"
  "/staff-portal/dashboard"
  
  # Instructor
  "/instructor"
  "/instructor/dashboard"
  
  # Employer
  "/employer"
  "/employer/dashboard"
  
  # Other
  "/onboarding"
  "/verify"
  "/certificates"
  "/achievements"
)

FAILED=()

for route in "${ROUTES[@]}"; do
  status=$(curl -sL -o /dev/null -w "%{http_code}" "$BASE_URL$route" 2>/dev/null)
  if [ "$status" != "200" ]; then
    echo "❌ $route ($status)"
    FAILED+=("$route:$status")
  fi
done

echo ""
echo "=============================================="
echo "FAILED ROUTES (${#FAILED[@]} total):"
echo "=============================================="
for item in "${FAILED[@]}"; do
  echo "  $item"
done
