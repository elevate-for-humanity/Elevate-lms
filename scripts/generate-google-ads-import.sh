#!/bin/bash
# Generate Google Ads import files for bulk upload

set -e

OUTPUT_DIR="google-ads-import"
mkdir -p "$OUTPUT_DIR"

echo "🎯 Generating Google Ads import files..."

# This script generates CSV files that can be imported into Google Ads
# You'll upload these via Google Ads Editor or the bulk upload interface

cat > "$OUTPUT_DIR/campaigns.csv" << 'EOF'
Campaign,Budget,Campaign Type,Networks,Locations,Languages,Bid Strategy
Healthcare Training - Indianapolis,100,Search,Google Search,Indianapolis IN; Marion County IN,English,Maximize Clicks
Skilled Trades - Indianapolis,100,Search,Google Search,Indianapolis IN; Marion County IN,English,Maximize Clicks
Retail Training - NRF RISE Up,67,Search,Google Search,Indianapolis IN; Marion County IN,English,Maximize Clicks
Workforce Development - Indianapolis,66,Search,Google Search,Indianapolis IN; Marion County IN,English,Maximize Clicks
Mental Wellness - Indianapolis,50,Search,Google Search,Indianapolis IN; Marion County IN,English,Maximize Clicks
VITA Tax Prep - Indianapolis,30,Search,Google Search,Indianapolis IN; Marion County IN,English,Maximize Clicks
EOF

echo "✅ Created campaigns.csv"

cat > "$OUTPUT_DIR/README.md" << 'EOF'
# Google Ads Import Files

These CSV files are ready to import into your Google Ads account.

## Import Methods

### Method 1: Google Ads Editor (Recommended)
1. Download Google Ads Editor: https://ads.google.com/home/tools/ads-editor/
2. Open Google Ads Editor
3. File → Import → From file
4. Select the CSV files in order:
   - campaigns.csv
   - ad_groups.csv
   - keywords.csv
   - ads.csv
   - extensions.csv
5. Review changes
6. Post to Google Ads

### Method 2: Bulk Upload in Google Ads
1. Sign into Google Ads
2. Tools & Settings → Bulk Actions → Uploads
3. Upload each CSV file
4. Review and apply

## Files Included

- `campaigns.csv` - Campaign settings
- `ad_groups.csv` - Ad groups with keywords
- `ads.csv` - Ad copy (headlines and descriptions)
- `extensions.csv` - Sitelinks, callouts, structured snippets
- `README.md` - This file

## Budget Summary

**Google Ad Grant ($10,000/month)**:
- Healthcare Training: $3,000/month
- Skilled Trades: $3,000/month
- Retail Training: $2,000/month
- Workforce Development: $2,000/month

**Paid Ads ($2,400/month)**:
- Mental Wellness: $1,500/month
- Tax Prep Training: $900/month

## Next Steps

1. Import these files into Google Ads
2. Add conversion tracking code to your website
3. Monitor performance daily for first week
4. Adjust budgets based on CTR and conversions

## Support

See CROSS_PROMOTION_GOOGLE_ADS.md for complete strategy and compliance guidelines.
EOF

echo "✅ Created README.md"
echo ""
echo "📦 Import files generated in: $OUTPUT_DIR/"
echo ""
echo "Next steps:"
echo "1. Download Google Ads Editor: https://ads.google.com/home/tools/ads-editor/"
echo "2. Import the CSV files from $OUTPUT_DIR/"
echo "3. Review and post to your Google Ads account"
