#!/usr/bin/env bash
set -euo pipefail

echo "🖼  Auto-wiring images into your components..."

# Detect repo root (works in Gitpod)
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

APP_DIRS=(
  "$ROOT_DIR/app"
  "$ROOT_DIR/components"
)

# Map of placeholder → real image path (under /public)
# Organized folder structure: /public/images/[category]/[filename]
declare -A IMAGE_MAP

# ====== HOMEPAGE ======
IMAGE_MAP["/images/PLACEHOLDER_HOME_HERO.jpg"]="/images/home-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_WHO_ADULTS.jpg"]="/images/who-adults.jpg"
IMAGE_MAP["/images/PLACEHOLDER_WHO_FAMILIES.jpg"]="/images/who-families.jpg"
IMAGE_MAP["/images/PLACEHOLDER_WHO_REENTRY.jpg"]="/images/who-reentry.jpg"

IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_HEALTHCARE.jpg"]="/images/program-healthcare.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_TRADES.jpg"]="/images/program-trades.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_BEAUTY.jpg"]="/images/program-beauty.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CDL.jpg"]="/images/program-cdl.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_BUSINESS.jpg"]="/images/program-business.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_REENTRY.jpg"]="/images/program-reentry.jpg"

IMAGE_MAP["/images/PLACEHOLDER_SUCCESS_1.jpg"]="/images/success-1.jpg"
IMAGE_MAP["/images/PLACEHOLDER_SUCCESS_2.jpg"]="/images/success-2.jpg"
IMAGE_MAP["/images/PLACEHOLDER_SUCCESS_3.jpg"]="/images/success-3.jpg"

# ====== FUNDING PAGE ======
IMAGE_MAP["/images/PLACEHOLDER_FUNDING_MAIN.jpg"]="/images/funding-main.jpg"
IMAGE_MAP["/images/PLACEHOLDER_FUNDING_WIOA.jpg"]="/images/funding-wioa.jpg"
IMAGE_MAP["/images/PLACEHOLDER_FUNDING_WRG.jpg"]="/images/funding-wrg.jpg"
IMAGE_MAP["/images/PLACEHOLDER_FUNDING_JRI.jpg"]="/images/funding-jri.jpg"
IMAGE_MAP["/images/PLACEHOLDER_FUNDING_APPRENTICESHIP.jpg"]="/images/funding-apprenticeship.jpg"

# ====== STUDENT & STAFF ======
IMAGE_MAP["/images/PLACEHOLDER_STUDENT_PORTAL.jpg"]="/images/student-portal.jpg"
IMAGE_MAP["/images/PLACEHOLDER_STAFF_PORTAL.jpg"]="/images/staff-portal.jpg"

# ====== ABOUT & CONTACT ======
IMAGE_MAP["/images/PLACEHOLDER_ABOUT_HERO.jpg"]="/images/about-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_CONTACT_HERO.jpg"]="/images/contact-hero.jpg"

# ====== LMS PAGES ======
IMAGE_MAP["/images/PLACEHOLDER_LMS_HERO.jpg"]="/images/lms-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_LMS_DASHBOARD.jpg"]="/images/lms-dashboard.jpg"
IMAGE_MAP["/images/PLACEHOLDER_LMS_COURSE_THUMB_HEALTHCARE.jpg"]="/images/lms-course-thumb-healthcare.jpg"
IMAGE_MAP["/images/PLACEHOLDER_LMS_COURSE_THUMB_CNA.jpg"]="/images/lms-course-thumb-cna.jpg"
IMAGE_MAP["/images/PLACEHOLDER_LMS_COURSE_THUMB_HVAC.jpg"]="/images/lms-course-thumb-hvac.jpg"
IMAGE_MAP["/images/PLACEHOLDER_LMS_COURSE_PLAYER.jpg"]="/images/lms-course-player.jpg"

# ====== LMS SUPPORT & CERTIFICATES ======
IMAGE_MAP["/images/PLACEHOLDER_LMS_SUPPORT.jpg"]="/images/lms-support.jpg"
IMAGE_MAP["/images/PLACEHOLDER_LMS_CERTIFICATES.jpg"]="/images/lms-certificates.jpg"

# ====== PROGRAM PAGES ======
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_MA_HERO.jpg"]="/images/program-ma-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_MA_CLASS.jpg"]="/images/program-ma-class.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_HVAC_HERO.jpg"]="/images/program-hvac-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_HVAC_CLASS.jpg"]="/images/program-hvac-class.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_BARBER_HERO.jpg"]="/images/program-barber-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_BARBER_CLASS.jpg"]="/images/program-barber-class.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CNA_HERO.jpg"]="/images/program-cna-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CNA_CLASS.jpg"]="/images/program-cna-class.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CDL_HERO.jpg"]="/images/program-cdl-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CDL_CLASS.jpg"]="/images/program-cdl-class.jpg"

# ====== PROGRAM LIST / DETAIL PAGES ======
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_MA101.jpg"]="/images/program-ma101.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CNA.jpg"]="/images/program-cna.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_HVAC.jpg"]="/images/program-hvac.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_CDL_DETAIL.jpg"]="/images/program-cdl-detail.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_BARBER.jpg"]="/images/program-barber.jpg"
IMAGE_MAP["/images/PLACEHOLDER_PROGRAM_REENTRY_DETAIL.jpg"]="/images/program-reentry-detail.jpg"

IMAGE_MAP["/images/PLACEHOLDER_MA101_HERO.jpg"]="/images/ma101-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_CNA_HERO.jpg"]="/images/cna-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_HVAC_HERO.jpg"]="/images/hvac-hero.jpg"
IMAGE_MAP["/images/PLACEHOLDER_CDL_HERO.jpg"]="/images/cdl-hero.jpg"

# ====== MAIN LOOP ======
for PLACEHOLDER in "${!IMAGE_MAP[@]}"; do
  REAL_PATH="${IMAGE_MAP[$PLACEHOLDER]}"

  # Check that the real image exists under /public
  if [ ! -f "$ROOT_DIR/public$REAL_PATH" ]; then
    echo "⚠️  Skipping $PLACEHOLDER → $REAL_PATH (file not found under public$REAL_PATH)"
    continue
  fi

  echo "✅ Mapping $PLACEHOLDER → $REAL_PATH"

  for DIR in "${APP_DIRS[@]}"; do
    if [ -d "$DIR" ]; then
      # Replace in all TSX/JSX/MDX files
      grep -rl "$PLACEHOLDER" "$DIR" --include="*.tsx" --include="*.jsx" --include="*.mdx" 2>/dev/null | while read -r FILE; do
        echo "   • Updating $FILE"
        # use | as delimiter so paths with / work fine
        sed -i "s|$PLACEHOLDER|$REAL_PATH|g" "$FILE"
      done
    fi
  done
done

echo "✨ Image auto-wiring complete."
