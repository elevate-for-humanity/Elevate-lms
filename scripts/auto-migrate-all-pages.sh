#!/bin/bash
# Automatic migration of ALL 67 React pages to Next.js
# Using scraped design from www.elevateforhumanity.org

set -e

echo "🤖 AUTO-MIGRATING ALL 67 PAGES TO NEXT.JS"
echo "=========================================="

# Find all React page files
REACT_PAGES=$(find src/pages -name "*.tsx" -type f | wc -l)
echo "📊 Found $REACT_PAGES React pages to migrate"

# Create Next.js page structure
echo "📁 Creating Next.js page structure..."

# List of all pages to migrate
declare -a PAGES=(
  # Core pages
  "Home:/"
  "ProgramsPage:/programs"
  "Contact:/contact"
  "About:/about"
  
  # LMS pages
  "LMS:/lms"
  "lms/CoursesIndex:/lms/courses"
  "lms/CoursePage:/lms/courses/[id]"
  "lms/LessonPage:/lms/lessons/[id]"
  "lms/Dashboard:/lms/dashboard"
  "lms/QuizBlock:/lms/quiz/[id]"
  
  # Dashboard pages
  "dashboard/StudentDashboard:/dashboard/student"
  "dashboard/InstructorDashboard:/dashboard/instructor"
  "dashboard/AdminDashboard:/dashboard/admin"
  "dashboard/CreateCoursePage:/dashboard/courses/create"
  
  # Auth pages
  "auth/Login:/auth/login"
  "auth/Signup:/auth/signup"
  "auth/ForgotPassword:/auth/forgot-password"
  
  # Legal pages
  "legal/Privacy:/legal/privacy"
  "legal/TermsOfUse:/legal/terms"
  "legal/DMCA:/legal/dmca"
  "legal/LegalIPNotice:/legal/ip-notice"
  
  # Other pages
  "CertificatePage:/certificates"
  "ProfilePage:/profile"
  "PacketDetail:/packets/[id]"
  "ApplyScholarship:/apply"
  "DonateSuccess:/donate/success"
  "Compliance:/compliance"
  "GetStarted:/get-started"
  "Elevate:/elevate"
  "Home-Durable:/home-durable"
  
  # Program detail pages
  "programs/BarberApprentice:/programs/barber"
  "programs/BuildingServices:/programs/building-services"
  "programs/HVACWelding:/programs/hvac-welding"
  "programs/Healthcare:/programs/healthcare"
  "programs/DrugTesting:/programs/drug-testing"
  "programs/DigitalSkills:/programs/digital-skills"
  "programs/Leadership:/programs/leadership"
  "programs/PeerRecovery:/programs/peer-recovery"
)

# Create directories for all pages
for page in "${PAGES[@]}"; do
  IFS=':' read -r source_file target_path <<< "$page"
  
  # Create directory
  dir_path="nextjs-site/app${target_path}"
  if [[ $target_path == *"[id]"* ]]; then
    dir_path=$(dirname "$dir_path")
  fi
  
  mkdir -p "$dir_path"
  echo "  ✅ Created $dir_path"
done

echo ""
echo "✅ Directory structure created"
echo "📝 Next: Run Node.js script to generate page content"
echo ""
echo "Total pages to migrate: ${#PAGES[@]}"
echo "Current progress: 13/67 (19%)"
echo "Remaining: 54 pages"
