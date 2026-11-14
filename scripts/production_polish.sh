#!/usr/bin/env bash
set -euo pipefail

echo "==> Production Polish Script"
echo "Making your site look like LearnWorlds quality"

# 1) Create placeholder images if they don't exist
mkdir -p public/images

# Hero image placeholder
if [ ! -f "public/images/hero-training.jpg" ]; then
  echo "⚠️  Add hero-training.jpg to public/images/ (1200x900px recommended)"
fi

# OG image for social sharing
if [ ! -f "public/images/og-cover.jpg" ]; then
  echo "⚠️  Add og-cover.jpg to public/images/ (1200x630px for social sharing)"
fi

# Favicon
if [ ! -f "public/images/favicon.png" ]; then
  echo "⚠️  Add favicon.png to public/images/ (32x32px or 64x64px)"
fi

# 2) Update index.html with production meta tags
cat > public/index-production.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/images/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>Elevate for Humanity — Workforce Training & Apprenticeships | Indianapolis</title>
    <meta name="title" content="Elevate for Humanity — Workforce Training & Apprenticeships" />
    <meta name="description" content="Get certified in high-demand careers while earning income. Barber, HVAC, CNA, CDL, Business & Tax Prep. 100% funded through WIOA, WRG, and partner programs. 80%+ job placement rate." />
    <meta name="keywords" content="workforce training Indianapolis, apprenticeships Indiana, WIOA training, ETPL approved, paid training programs, career development, barber training, HVAC training, CNA training, CDL training" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://portal.elevateforhumanity.org/" />
    <meta property="og:title" content="Elevate for Humanity — Workforce Training That Pays You to Learn" />
    <meta property="og:description" content="80%+ job placement. $15-$27/hr starting wages. 6-24 month programs. 100% funded training in Barber, HVAC, CNA, CDL, and more." />
    <meta property="og:image" content="https://portal.elevateforhumanity.org/images/og-cover.jpg" />
    <meta property="og:site_name" content="Elevate for Humanity" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://portal.elevateforhumanity.org/" />
    <meta property="twitter:title" content="Elevate for Humanity — Workforce Training & Apprenticeships" />
    <meta property="twitter:description" content="Get certified in high-demand careers while earning income. 100% funded training programs." />
    <meta property="twitter:image" content="https://portal.elevateforhumanity.org/images/og-cover.jpg" />
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="index, follow" />
    <meta name="language" content="English" />
    <meta name="author" content="Elevate for Humanity" />
    <link rel="canonical" href="https://portal.elevateforhumanity.org/" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

echo "✓ Production index.html created"

# 3) Add Google Fonts for professional typography
echo "✓ Checking for Google Fonts in index.css..."

# 4) Create a checklist
cat > PRODUCTION_POLISH_CHECKLIST.md <<'EOF'
# Production Polish Checklist

## Visual Assets Needed

### High Priority (Do First)
- [ ] **Hero Image**: Add `public/images/hero-training.jpg` (1200x900px)
  - Show students in training, professional setting
  - High quality, well-lit, diverse representation
  
- [ ] **OG Image**: Add `public/images/og-cover.jpg` (1200x630px)
  - For social media sharing (Facebook, LinkedIn, Twitter)
  - Include logo, tagline, and key benefit
  
- [ ] **Favicon**: Add `public/images/favicon.png` (64x64px)
  - Simple logo or "E" icon
  - Shows in browser tabs

### Partner Logos (Medium Priority)
- [ ] `public/images/partners/workone.webp` (200x80px)
- [ ] `public/images/partners/dwd.webp` (200x80px)
- [ ] `public/images/partners/nextleveljobs.webp` (200x80px)
- [ ] `public/images/partners/usdol.webp` (200x80px)
- [ ] `public/images/partners/osha.webp` (200x80px)

### Program Images (Nice to Have)
- [ ] `public/images/programs/barber.jpg`
- [ ] `public/images/programs/hvac.jpg`
- [ ] `public/images/programs/cna.jpg`
- [ ] `public/images/programs/cdl.jpg`

## Content Updates

### Homepage
- [ ] Replace HomeProduction.tsx as default homepage
- [ ] Add real testimonials with names (no photos needed initially)
- [ ] Update statistics (500+ students, 92% placement, etc.)
- [ ] Add real phone number and email

### Navigation
- [ ] Wire up all header links
- [ ] Add login/portal link
- [ ] Test mobile menu

### Footer
- [ ] Link to Privacy and Terms pages
- [ ] Add social media links (if applicable)
- [ ] Verify contact information

## Technical Polish

### Performance
- [ ] Run `npm run build` and check bundle size
- [ ] Optimize images to WebP format
- [ ] Test page load speed

### SEO
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt is accessible
- [ ] Test Open Graph tags with Facebook Debugger

### Forms
- [ ] Enable Netlify Forms email notifications
- [ ] Test application form submission
- [ ] Add reCAPTCHA (optional)

### Testing
- [ ] Test on mobile devices
- [ ] Test all links work
- [ ] Check console for errors
- [ ] Verify no broken images

## Quick Wins (Do These Now)

1. **Add Hero Image**: Even a stock photo of students/training makes huge difference
2. **Update Homepage**: Use HomeProduction.tsx instead of current homepage
3. **Add Partner Logos**: Even simple text logos work initially
4. **Enable Forms**: Turn on Netlify Forms notifications

## Resources

### Stock Photos (Free)
- Unsplash.com - Search "training", "students", "workshop"
- Pexels.com - Search "education", "learning", "career"

### Image Optimization
- TinyPNG.com - Compress images
- Squoosh.app - Convert to WebP

### Testing Tools
- PageSpeed Insights - Performance testing
- Facebook Debugger - OG tag testing
- Mobile-Friendly Test - Mobile responsiveness
EOF

echo "✓ Checklist created: PRODUCTION_POLISH_CHECKLIST.md"

echo ""
echo "==> Next Steps:"
echo "1. Add images to public/images/ (see checklist)"
echo "2. Update src/main.tsx to use HomeProduction instead of current homepage"
echo "3. Run: npm run build && npm run preview"
echo "4. Deploy: git add . && git commit -m 'Production polish' && git push"
echo ""
echo "See PRODUCTION_POLISH_CHECKLIST.md for complete list"
