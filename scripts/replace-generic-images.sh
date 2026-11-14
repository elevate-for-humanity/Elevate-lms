#!/bin/bash
# Replace all generic Unsplash images with real images from repository

echo "🔍 Finding all Unsplash image references..."

# Map of context to real images
declare -A IMAGE_MAP=(
  # Hero/Training images
  ["photo-1523240795612"]="/images/artlist/hero-training-1.jpg"
  ["photo-1524178232363"]="/images/artlist/hero-training-2.jpg"
  ["photo-1427504494785"]="/images/artlist/hero-training-3.jpg"
  ["photo-1499750310107"]="/images/artlist/hero-training-4.jpg"
  ["photo-1522202176988"]="/images/artlist/hero-training-5.jpg"
  ["photo-1517245386807"]="/images/artlist/hero-training-6.jpg"
  ["photo-1503676260728"]="/images/artlist/hero-training-7.jpg"
  ["photo-1522071820081"]="/images/artlist/hero-training-8.jpg"
  
  # Healthcare/CNA images
  ["photo-1576091160399"]="/images/efh/programs/cna.jpg"
  ["photo-1584515933487"]="/images/efh/programs/cna.jpg"
  ["photo-1559839734-2b71ea197ec2"]="/images/efh/programs/cna.jpg"
  
  # Barber/Beauty images
  ["photo-1503951914875"]="/images/efh/programs/barber.jpg"
  ["photo-1622287162716"]="/images/efh/programs/barber.jpg"
  ["photo-1585747860715"]="/images/efh/programs/beauty.jpg"
  
  # Trades/HVAC images
  ["photo-1581578731548"]="/images/trades/program-hvac-technician.jpg"
  ["photo-1621905251918"]="/images/trades/program-hvac-technician.jpg"
  ["photo-1504328345606"]="/images/trades/program-building-construction.jpg"
  
  # Office/Business images
  ["photo-1497366216548"]="/images/efh/sections/classroom.jpg"
  ["photo-1497366811353"]="/images/efh/sections/classroom.jpg"
  ["photo-1454165804606"]="/images/efh/sections/classroom.jpg"
)

# Replace images in all TSX files
for pattern in "${!IMAGE_MAP[@]}"; do
  replacement="${IMAGE_MAP[$pattern]}"
  echo "Replacing $pattern with $replacement"
  
  find app -name "*.tsx" -type f -exec sed -i "s|https://images.unsplash.com/[^\"]*$pattern[^\"]*|$replacement|g" {} \;
done

echo "✅ Image replacement complete!"
echo "📊 Remaining Unsplash images:"
grep -r "unsplash.com" app --include="*.tsx" | wc -l
