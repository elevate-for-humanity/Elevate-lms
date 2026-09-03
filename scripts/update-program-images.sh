#!/bin/bash

# Update program-data.ts with categorized image paths
sed -i 's|heroImage: "/media/programs/pharmacy-technician|heroImage: "/images/technology/hero-program-pharmacy-tech|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/dental-assistant-video-thumbnail.jpg"|heroImage: "/images/healthcare/video-thumbnail-dental-assistant.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/cna-hd.jpg"|heroImage: "/images/healthcare/program-cna-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/healthcare-professional-1-hd.jpg"|heroImage: "/images/healthcare/healthcare-professional-portrait-1.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/healthcare-professional-2-hd.jpg"|heroImage: "/images/healthcare/healthcare-professional-portrait-2.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/hvac-hd.jpg"|heroImage: "/images/trades/program-hvac-technician.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/building-tech-hd.jpg"|heroImage: "/images/trades/program-building-technology.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/welding-hd.jpg"|heroImage: "/images/trades/program-welding-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/electrical-hd.jpg"|heroImage: "/images/trades/program-electrical-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/plumbing-hd.jpg"|heroImage: "/images/trades/program-plumbing-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/cdl-hd.jpg"|heroImage: "/images/trades/program-cdl-commercial-driving.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/barber-hd.jpg"|heroImage: "/images/beauty/program-barber-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/beauty-hd.jpg"|heroImage: "/images/beauty/program-beauty-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/culinary-hd.jpg"|heroImage: "/images/culinary/program-culinary-overview.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/culinary-arts-hd.jpg"|heroImage: "/images/culinary/program-culinary-arts-training.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/tax-prep-hd.jpg"|heroImage: "/images/business/program-tax-preparation.jpg"|g' lib/program-data.ts
sed -i 's|heroImage: "/media/programs/it-hd.jpg"|heroImage: "/images/technology/program-it-support-training.jpg"|g' lib/program-data.ts

echo "✅ Program image paths updated successfully!"
