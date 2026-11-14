#!/bin/bash
set -e

echo "🎨 Generating course cover images for all 16 programs..."

# Create directories
mkdir -p public/course-covers

# Define programs with their colors and icons
declare -A programs=(
    ["barber"]="Barber Apprenticeship|#8B4513|✂️"
    ["hvac"]="HVAC Technician|#FF6B35|🔧"
    ["cna"]="CNA Certification|#4A90E2|❤️"
    ["truck-driving"]="CDL Truck Driving|#2C3E50|🚛"
    ["medical-assistant"]="Medical Assistant|#27AE60|🏥"
    ["phlebotomy"]="Phlebotomy Technician|#E74C3C|💉"
    ["ekg"]="EKG Technician|#9B59B6|📊"
    ["patient-care"]="Patient Care Technician|#3498DB|🩺"
    ["pharmacy"]="Pharmacy Technician|#16A085|💊"
    ["clinical-ma"]="Clinical Medical Assistant|#F39C12|🔬"
    ["admin-ma"]="Administrative Medical Assistant|#E67E22|📋"
    ["tax-prep"]="Tax Preparation|#2ECC71|💰"
    ["business"]="Business Start-Up|#1ABC9C|💼"
    ["esthetician"]="Professional Esthetician|#E91E63|✨"
    ["beauty-educator"]="Beauty & Career Educator|#9C27B0|💅"
    ["reentry"]="Public Safety Reentry|#607D8B|🛡️"
)

# Generate SVG for each program
for key in "${!programs[@]}"; do
    IFS='|' read -r title color icon <<< "${programs[$key]}"
    
    cat > "public/course-covers/${key}.svg" << EOF
<svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad-${key}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.7" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="800" fill="url(#grad-${key})"/>
  
  <!-- Pattern overlay -->
  <rect width="1200" height="800" fill="url(#grad-${key})" opacity="0.1"/>
  
  <!-- Icon circle -->
  <circle cx="600" cy="300" r="120" fill="white" opacity="0.2"/>
  <circle cx="600" cy="300" r="100" fill="white" opacity="0.3"/>
  
  <!-- Icon -->
  <text x="600" y="340" font-size="80" text-anchor="middle" fill="white" filter="url(#shadow)">
    ${icon}
  </text>
  
  <!-- Title -->
  <text x="600" y="500" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white" filter="url(#shadow)">
    ${title}
  </text>
  
  <!-- Subtitle -->
  <text x="600" y="560" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" opacity="0.9">
    WIOA-Approved Training Program
  </text>
  
  <!-- Bottom bar -->
  <rect y="720" width="1200" height="80" fill="black" opacity="0.3"/>
  <text x="600" y="770" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">
    ELEVATE FOR HUMANITY
  </text>
</svg>
EOF
    
    echo "✅ Created: ${key}.svg - ${title}"
done

echo ""
echo "🎉 All 16 course covers generated!"
echo "📁 Location: public/course-covers/"
echo ""
echo "Files created:"
ls -1 public/course-covers/*.svg
