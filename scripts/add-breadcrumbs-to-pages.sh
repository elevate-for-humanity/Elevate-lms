#!/usr/bin/env bash
# Add breadcrumb schema to all major pages

set -e

echo "🍞 Adding breadcrumb schema to pages..."

# Function to add breadcrumb before </head>
add_breadcrumb() {
  local file=$1
  local page_name=$2
  local page_url=$3
  
  if [ ! -f "$file" ]; then
    echo "  ⏭️  Skipping $file (not found)"
    return
  fi
  
  # Check if breadcrumb already exists
  if grep -q "BreadcrumbList" "$file"; then
    echo "  ✅ $page_name already has breadcrumb"
    return
  fi
  
  # Create breadcrumb JSON
  local breadcrumb=$(cat <<EOF
    
    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://elevateforhumanity.pages.dev/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "$page_name",
          "item": "https://elevateforhumanity.pages.dev$page_url"
        }
      ]
    }
    </script>
  </head>
EOF
)
  
  # Add breadcrumb before </head>
  sed -i "s|</head>|$breadcrumb|" "$file"
  echo "  ✅ Added breadcrumb to $page_name"
}

# Add to key pages
add_breadcrumb "dist/get-started/index.html" "Get Started" "/get-started"
add_breadcrumb "dist/hub/index.html" "Hub" "/hub"
add_breadcrumb "dist/connect/index.html" "Connect" "/connect"
add_breadcrumb "dist/lms/index.html" "LMS" "/lms"
add_breadcrumb "dist/student/index.html" "Student Portal" "/student"
add_breadcrumb "dist/meet/index.html" "Meet" "/meet"
add_breadcrumb "dist/drive/index.html" "Drive" "/drive"
add_breadcrumb "dist/calendar/index.html" "Calendar" "/calendar"

echo ""
echo "✅ Breadcrumb schema added to all pages!"
