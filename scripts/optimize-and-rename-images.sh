#!/bin/bash

echo "🖼️  Image Optimization & Categorization Script"
echo "=============================================="
echo ""

# Check if sharp-cli is installed
if ! command -v sharp &> /dev/null; then
    echo "📦 Installing sharp-cli for image optimization..."
    npm install -g sharp-cli
fi

# Create backup directory
BACKUP_DIR="public/media-backup-$(date +%Y%m%d-%H%M%S)"
echo "💾 Creating backup at: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r public/media/* "$BACKUP_DIR/"

# Create organized directory structure
echo "📁 Creating organized directory structure..."
mkdir -p public/images/{healthcare,trades,technology,business,culinary,beauty,transportation,heroes,general,testimonials,funding,employers}

# Counter for progress
TOTAL_IMAGES=$(find public/media -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | wc -l)
CURRENT=0

echo "📊 Found $TOTAL_IMAGES images to process"
echo ""

# Function to optimize and move image
optimize_and_move() {
    local src="$1"
    local dest_category="$2"
    local new_name="$3"
    
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL_IMAGES] Processing: $(basename "$src")"
    
    # Get file extension
    local ext="${src##*.}"
    local dest_file="public/images/$dest_category/$new_name.webp"
    
    # Create category directory if it doesn't exist
    mkdir -p "public/images/$dest_category"
    
    # Convert to WebP with optimization
    if [ -f "$src" ]; then
        sharp -i "$src" -o "$dest_file" --webp '{"quality":85,"effort":6}' 2>/dev/null || {
            echo "  ⚠️  Sharp failed, using cp instead"
            cp "$src" "public/images/$dest_category/$new_name.$ext"
        }
        echo "  ✅ Saved to: images/$dest_category/$new_name.webp"
    fi
}

# Process Healthcare Images
echo ""
echo "🏥 Processing Healthcare Images..."
echo "-----------------------------------"

optimize_and_move "public/media/hero-slide-healthcare.jpg" "healthcare" "hero-healthcare-professionals"
optimize_and_move "public/media/programs/healthcare-hd.jpg" "healthcare" "program-healthcare-overview"
optimize_and_move "public/media/programs/cna-hd.jpg" "healthcare" "program-cna-training"
optimize_and_move "public/media/programs/medical-hd.jpg" "healthcare" "program-medical-assistant"
optimize_and_move "public/media/programs/cpr-training-hd.jpg" "healthcare" "program-cpr-certification"
optimize_and_move "public/media/programs/cpr-group-training-hd.jpg" "healthcare" "cpr-group-training-session"
optimize_and_move "public/media/programs/cpr-individual-practice-hd.jpg" "healthcare" "cpr-individual-practice"
optimize_and_move "public/media/programs/cpr-certification-group-hd.jpg" "healthcare" "cpr-certification-group"
optimize_and_move "public/media/programs/healthcare-professional-1-hd.jpg" "healthcare" "healthcare-professional-portrait-1"
optimize_and_move "public/media/programs/healthcare-professional-2-hd.jpg" "healthcare" "healthcare-professional-portrait-2"
optimize_and_move "public/media/programs/healthcare-programs-infographic-hd.jpg" "healthcare" "healthcare-programs-infographic"
optimize_and_move "public/media/programs/healthcare-programs-bulletin-hd.jpg" "healthcare" "healthcare-programs-bulletin"
optimize_and_move "public/media/programs/healthcare-programs-cards-hd.jpg" "healthcare" "healthcare-programs-cards"
optimize_and_move "public/media/programs/healthcare-programs-grid-hd.jpg" "healthcare" "healthcare-programs-grid"
optimize_and_move "public/media/programs/medical-esthetics-training-hd.jpg" "healthcare" "program-medical-esthetics"
optimize_and_move "public/media/programs/cna-training-video-thumbnail.jpg" "healthcare" "video-thumbnail-cna-training"
optimize_and_move "public/media/programs/medical-assistant-video-thumbnail.jpg" "healthcare" "video-thumbnail-medical-assistant"
optimize_and_move "public/media/programs/phlebotomy-technician-video-thumbnail.jpg" "healthcare" "video-thumbnail-phlebotomy"
optimize_and_move "public/media/programs/dental-assistant-video-thumbnail.jpg" "healthcare" "video-thumbnail-dental-assistant"
optimize_and_move "public/media/program-cna.jpg" "healthcare" "program-cna-overview"

# Process Trades Images
echo ""
echo "🔧 Processing Trades Images..."
echo "-----------------------------------"

optimize_and_move "public/media/programs/welding-hd.jpg" "trades" "program-welding-training"
optimize_and_move "public/media/programs/hvac-hd.jpg" "trades" "program-hvac-technician"
optimize_and_move "public/media/programs/plumbing-hd.jpg" "trades" "program-plumbing-training"
optimize_and_move "public/media/programs/electrical-hd.jpg" "trades" "program-electrical-training"
optimize_and_move "public/media/programs/cdl-hd.jpg" "trades" "program-cdl-commercial-driving"
optimize_and_move "public/media/programs/building-hd.jpg" "trades" "program-building-construction"
optimize_and_move "public/media/programs/building-tech-hd.jpg" "trades" "program-building-technology"
optimize_and_move "public/media/program-hvac.jpg" "trades" "program-hvac-overview"
optimize_and_move "public/media/program-cdl.jpg" "trades" "program-cdl-overview"

# Process Technology Images
echo ""
echo "💻 Processing Technology Images..."
echo "-----------------------------------"

optimize_and_move "public/media/programs/it-hd.jpg" "technology" "program-it-support-training"

# Process Business Images
echo ""
echo "💼 Processing Business Images..."
echo "-----------------------------------"

optimize_and_move "public/media/programs/tax-prep-hd.jpg" "business" "program-tax-preparation"
optimize_and_move "public/media/programs/tax-prep-certification-hd.jpg" "business" "tax-prep-certification"
optimize_and_move "public/media/programs/tax-prep-certification-optimized.jpg" "business" "tax-prep-certification-optimized"

# Process Culinary Images
echo ""
echo "🍳 Processing Culinary Images..."
echo "-----------------------------------"

optimize_and_move "public/media/programs/culinary-arts-hd.jpg" "culinary" "program-culinary-arts-training"
optimize_and_move "public/media/programs/culinary-hd.jpg" "culinary" "program-culinary-overview"

# Process Beauty Images
echo ""
echo "💇 Processing Beauty Images..."
echo "-----------------------------------"

optimize_and_move "public/media/programs/beauty-hd.jpg" "beauty" "program-beauty-training"
optimize_and_move "public/media/programs/barber-hd.jpg" "beauty" "program-barber-training"
optimize_and_move "public/media/hero-slide-barber.jpg" "beauty" "hero-barber-training"
optimize_and_move "public/media/program-barber.jpg" "beauty" "program-barber-overview"
optimize_and_move "public/media/barber-highlight.png" "beauty" "barber-program-highlight"

# Process Hero Images
echo ""
echo "🎯 Processing Hero Images..."
echo "-----------------------------------"

optimize_and_move "public/media/state-funding-hero.jpg" "heroes" "hero-state-funding"
optimize_and_move "public/media/hero-elevate-learners.jpg" "heroes" "hero-elevate-learners"
optimize_and_move "public/media/hero-banner-new.png" "heroes" "hero-banner-main"
optimize_and_move "public/media/hero-slide-employers.jpg" "heroes" "hero-employer-partnerships"
optimize_and_move "public/media/hero-banner-latest.png" "heroes" "hero-banner-latest"
optimize_and_move "public/media/hero-banner-latest-optimized.jpg" "heroes" "hero-banner-latest-optimized"
optimize_and_move "public/media/hero-banner-elevate.png" "heroes" "hero-banner-elevate"
optimize_and_move "public/media/homepage-hero.jpg" "heroes" "hero-homepage"
optimize_and_move "public/media/students-hero.jpg" "heroes" "hero-students"
optimize_and_move "public/media/employers-hero.jpg" "heroes" "hero-employers"
optimize_and_move "public/media/federal-funding-hero.jpg" "heroes" "hero-federal-funding"

# Process Employer Images
echo ""
echo "🤝 Processing Employer Partnership Images..."
echo "-----------------------------------"

optimize_and_move "public/media/employers/employer-partnership-office-hd.jpg" "employers" "partnership-office-meeting"
optimize_and_move "public/media/employers/employer-partnership-handshake-optimized.jpg" "employers" "partnership-handshake"
optimize_and_move "public/media/employers/employer-partnership-meeting-hd.jpg" "employers" "partnership-meeting"
optimize_and_move "public/media/employers/employer-partnership-hiring-hd.jpg" "employers" "partnership-hiring-event"

# Process Testimonial Images
echo ""
echo "💬 Processing Testimonial Images..."
echo "-----------------------------------"

optimize_and_move "public/media/testimonials/testimonial-medical-assistant-original.png" "testimonials" "testimonial-medical-assistant"
optimize_and_move "public/media/testimonials/testimonial-success-2-original.png" "testimonials" "testimonial-success-story-2"
optimize_and_move "public/media/testimonials/testimonial-success-3-original.png" "testimonials" "testimonial-success-story-3"
optimize_and_move "public/media/testimonials/testimonial-success-4-original.png" "testimonials" "testimonial-success-story-4"
optimize_and_move "public/media/testimonials/testimonial-success-5-original.png" "testimonials" "testimonial-success-story-5"
optimize_and_move "public/media/testimonials/student-testimonial-graduate-hd.jpg" "testimonials" "student-graduate-testimonial"

# Process Funding Images
echo ""
echo "💰 Processing Funding Images..."
echo "-----------------------------------"

optimize_and_move "public/media/funding/funding-jri-hd.jpg" "funding" "funding-jri-program"
optimize_and_move "public/media/funding/funding-jri-v2-hd.jpg" "funding" "funding-jri-program-v2"
optimize_and_move "public/media/funding/funding-dol-hd.jpg" "funding" "funding-dol-program"
optimize_and_move "public/media/funding/funding-dol-v2-hd.jpg" "funding" "funding-dol-program-v2"
optimize_and_move "public/media/funding/infographics/funding-wrg-process.png" "funding" "infographic-wrg-process"
optimize_and_move "public/media/funding/infographics/funding-wioa-process.png" "funding" "infographic-wioa-process"

# Process General Images
echo ""
echo "📋 Processing General Images..."
echo "-----------------------------------"

optimize_and_move "public/media/workforce-development-hd.jpg" "general" "workforce-development-overview"
optimize_and_move "public/media/support-services.jpg" "general" "support-services-overview"
optimize_and_move "public/media/about-what-we-do.jpg" "general" "about-what-we-do"
optimize_and_move "public/media/efh-about.jpg" "general" "efh-about-us"
optimize_and_move "public/media/emergency-health-safety-hd.jpg" "general" "emergency-health-safety"
optimize_and_move "public/media/team-collaboration.png" "general" "team-collaboration"
optimize_and_move "public/media/workforce-development.png" "general" "workforce-development-icon"
optimize_and_move "public/media/construction-training.png" "general" "construction-training-icon"
optimize_and_move "public/media/ems-ambulatory.png" "general" "ems-ambulatory-icon"
optimize_and_move "public/media/elevate-watermark.png" "general" "elevate-watermark"

# Process Hero subdirectory images
echo ""
echo "🎬 Processing Hero Subdirectory Images..."
echo "-----------------------------------"

find public/media/hero -type f \( -name "*.jpg" -o -name "*.png" \) | while read img; do
    filename=$(basename "$img" | sed 's/\.[^.]*$//')
    # Remove 'hero-' prefix if it exists for cleaner names
    clean_name=$(echo "$filename" | sed 's/^hero-//')
    
    # Categorize based on content
    case "$clean_name" in
        *healthcare*|*medical*|*cna*|*dental*|*phlebotomy*|*patient*)
            optimize_and_move "$img" "healthcare" "hero-$clean_name"
            ;;
        *welding*|*hvac*|*plumbing*|*electrical*|*cdl*|*carpentry*)
            optimize_and_move "$img" "trades" "hero-$clean_name"
            ;;
        *it-support*|*technology*|*cybersecurity*|*web-dev*|*data-analytics*|*pharmacy-tech*)
            optimize_and_move "$img" "technology" "hero-$clean_name"
            ;;
        *culinary*|*hospitality*)
            optimize_and_move "$img" "culinary" "hero-$clean_name"
            ;;
        *barber*|*cosmetology*)
            optimize_and_move "$img" "beauty" "hero-$clean_name"
            ;;
        *automotive*)
            optimize_and_move "$img" "transportation" "hero-$clean_name"
            ;;
        *)
            optimize_and_move "$img" "heroes" "$clean_name"
            ;;
    esac
done

# Process Selfish Inc images
echo ""
echo "🧘 Processing Selfish Inc Images..."
echo "-----------------------------------"

find public/media/selfish-inc -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | while read img; do
    filename=$(basename "$img" | sed 's/\.[^.]*$//')
    optimize_and_move "$img" "general" "selfish-inc-$filename"
done

# Process any remaining images
echo ""
echo "🔄 Processing Remaining Images..."
echo "-----------------------------------"

find public/media -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) | while read img; do
    filename=$(basename "$img" | sed 's/\.[^.]*$//')
    if [ ! -f "public/images/general/$filename.webp" ]; then
        optimize_and_move "$img" "general" "$filename"
    fi
done

# Generate summary report
echo ""
echo "=============================================="
echo "📊 OPTIMIZATION SUMMARY"
echo "=============================================="
echo ""
echo "Original images backed up to: $BACKUP_DIR"
echo ""
echo "Organized images by category:"
echo "  Healthcare:      $(find public/images/healthcare -type f 2>/dev/null | wc -l) images"
echo "  Trades:          $(find public/images/trades -type f 2>/dev/null | wc -l) images"
echo "  Technology:      $(find public/images/technology -type f 2>/dev/null | wc -l) images"
echo "  Business:        $(find public/images/business -type f 2>/dev/null | wc -l) images"
echo "  Culinary:        $(find public/images/culinary -type f 2>/dev/null | wc -l) images"
echo "  Beauty:          $(find public/images/beauty -type f 2>/dev/null | wc -l) images"
echo "  Transportation:  $(find public/images/transportation -type f 2>/dev/null | wc -l) images"
echo "  Heroes:          $(find public/images/heroes -type f 2>/dev/null | wc -l) images"
echo "  Testimonials:    $(find public/images/testimonials -type f 2>/dev/null | wc -l) images"
echo "  Employers:       $(find public/images/employers -type f 2>/dev/null | wc -l) images"
echo "  Funding:         $(find public/images/funding -type f 2>/dev/null | wc -l) images"
echo "  General:         $(find public/images/general -type f 2>/dev/null | wc -l) images"
echo ""
echo "Total optimized:   $(find public/images -type f 2>/dev/null | wc -l) images"
echo ""

# Calculate space savings
ORIGINAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
NEW_SIZE=$(du -sh public/images 2>/dev/null | cut -f1)
echo "Original size:     $ORIGINAL_SIZE"
echo "Optimized size:    $NEW_SIZE"
echo ""
echo "✅ Image optimization and categorization complete!"
echo ""
echo "Next steps:"
echo "1. Update image references in code to use new paths"
echo "2. Test all pages to ensure images load correctly"
echo "3. Remove backup directory after verification: rm -rf $BACKUP_DIR"
echo ""
