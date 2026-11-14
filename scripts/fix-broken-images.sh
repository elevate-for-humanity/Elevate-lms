#!/bin/bash
# Fix all broken image references with existing images

echo "🔧 Fixing broken image references..."
echo ""

# Fix artlist references (deleted) - replace with real program images
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-1.jpg|/images/programs/efh-cna-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-2.jpg|/images/programs/barber-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-3.jpg|/images/programs/hvac-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-4.jpg|/images/programs/cdl-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-5.jpg|/images/programs/building-maintenance-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-6.jpg|/images/efh/hero/hero-barber.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-7.jpg|/images/efh/hero/hero-health.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/artlist/hero-training-8.jpg|/images/efh/hero/hero-support.jpg|g' {} \;

# Fix gallery references (deleted)
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/gallery/image1.jpg|/images/programs/efh-cna-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/gallery/image2.jpg|/images/programs/barber-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/gallery/image11.jpg|/images/programs/hvac-hero.jpg|g' {} \;

# Fix media-backup references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/media-backup-20251128-043832/hero-elevate-learners.jpg|/images/efh/hero/hero-health.jpg|g' {} \;

# Fix team-new references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/team-new/team-01.jpg|/images/team/founder/elizabeth-greene-founder-hero-01.jpg|g' {} \;

# Fix programs-new references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/programs-new/program-01.jpg|/images/programs/efh-cna-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/programs-new/program-02.jpg|/images/programs/barber-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/programs-new/program-03.jpg|/images/programs/hvac-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/programs-new/program-04.jpg|/images/programs/cdl-hero.jpg|g' {} \;

# Fix testimonial references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/testimonials/testimonial-01.jpg|/images/programs/efh-cna-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/testimonials/testimonial-02.jpg|/images/programs/barber-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/testimonials/testimonial-03.jpg|/images/programs/hvac-hero.jpg|g' {} \;

# Fix healthcare/trades/business references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/healthcare/medical-assistant-hero.jpg|/images/programs/efh-cna-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/trades/hvac-hero.jpg|/images/programs/hvac-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/business/it-support-hero.jpg|/images/programs/efh-building-tech-hero.jpg|g' {} \;

# Fix efh-barber references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/efh-barber-card.jpg|/images/programs/efh-barber-card.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/images/efh-barber-hero.jpg|/images/programs/efh-barber-hero.jpg|g' {} \;

# Fix media/programs references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/media/programs/medical-assistant-hd.jpg|/images/programs/efh-cna-hero.jpg|g' {} \;
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/media/programs/business-hd.jpg|/images/programs/efh-business-startup-marketing-hero.jpg|g' {} \;

# Fix hero references
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's|/hero/efh-hero.jpg|/images/efh/hero/hero-health.jpg|g' {} \;

echo "✅ Fixed all broken image references"
echo ""
echo "Images now point to:"
echo "  - Real program photos in /images/programs/"
echo "  - Hero images in /images/efh/hero/"
echo "  - Founder photo in /images/team/founder/"
