# Image Optimization Audit Report

**Generated:** January 31, 2026

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total Images | 918 | - |
| Total Size | 138 MB | ⚠️ Large |
| Images > 1MB | 14 | ❌ Needs Optimization |
| Images > 500KB | 28 | ⚠️ Should Optimize |
| WebP Images | 13 | ❌ Low Adoption |
| Using Next/Image | 537 files | ✅ Good |
| Using raw `<img>` | 29 instances | ⚠️ Should Convert |
| Missing alt text | 746+ | ❌ Accessibility Issue |
| Empty alt text | 24 | ⚠️ Review Needed |

---

## 1. Current Image Infrastructure

### ✅ What's Working

1. **Sharp installed** - `sharp@0.34.5` for server-side optimization
2. **Next.js Image Optimization enabled**:
   ```javascript
   images: {
     unoptimized: false,
     formats: ['image/avif', 'image/webp'],
     deviceSizes: [640, 750, 828, 1080, 1200, 1920],
     imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
     qualities: [75, 85, 90],
     minimumCacheTTL: 31536000, // 1 year
   }
   ```
3. **Cloudflare R2 CDN** for videos: `pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev`
4. **Cache headers** configured for images (1 year)

### ❌ What's Missing

1. No external image CDN (Cloudinary, ImageKit, etc.)
2. No build-time image compression pipeline
3. Source images not pre-optimized before upload
4. No WebP/AVIF source images (relying on Next.js conversion)

---

## 2. Oversized Images (Needs Immediate Attention)

### Images > 1MB (14 files)

| File | Size | Recommendation |
|------|------|----------------|
| `funding/funding-dol-program-v2.jpg` | 7.1 MB | Compress to < 200KB |
| `trades/welding-hero.jpg` | 3.5 MB | Compress to < 300KB |
| `healthcare/program-cna-overview.jpg` | 2.9 MB | Compress to < 250KB |
| `trades/program-electrical-training.jpg` | 2.8 MB | Compress to < 250KB |
| `healthcare/hero-program-medical-assistant.jpg` | 2.8 MB | Compress to < 250KB |
| `trades/program-hvac-technician.jpg` | 2.7 MB | Compress to < 250KB |
| `healthcare/healthcare-professional-portrait-2.jpg` | 2.7 MB | Compress to < 200KB |
| `healthcare/hero-program-phlebotomy.jpg` | 2.2 MB | Compress to < 250KB |
| `trades/hero-program-cdl.jpg` | 2.1 MB | Compress to < 250KB |
| `healthcare/hero-healthcare-professionals.jpg` | 2.1 MB | Compress to < 250KB |
| `healthcare/healthcare-professional-portrait-1.jpg` | 1.9 MB | Compress to < 200KB |
| `business/tax-prep-certification.jpg` | 1.8 MB | Compress to < 200KB |
| `business/team-1.jpg` | 1.5 MB | Compress to < 200KB |
| `trades/program-building-construction.jpg` | 1.4 MB | Compress to < 200KB |

### Images 500KB - 1MB (14 files)

These should also be optimized but are lower priority.

---

## 3. Accessibility Issues

### Missing Alt Text (746+ instances)

Many `<Image>` components don't have alt text on the same line (may be on next line). Need manual review.

**Files with raw `<img>` tags (29 instances):**
- `app/programs/page.tsx` - 4 instances
- `app/page.tsx` - 2 instances  
- `app/preview/[previewId]/page.tsx` - 3 instances
- Various community/discussion pages - avatar images

**Empty alt text (24 instances):**
- Mostly avatar images where empty alt is acceptable
- Review to ensure decorative images are marked appropriately

---

## 4. Recommendations

### Phase 1: Immediate (This Week)

1. **Compress oversized images**
   ```bash
   # Install imagemin CLI
   npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant
   
   # Compress all JPGs in public/images
   find public/images -name "*.jpg" -size +500k -exec \
     npx @squoosh/cli --mozjpeg '{"quality":80}' -d compressed {} \;
   ```

2. **Convert to WebP source files**
   ```bash
   # Convert large images to WebP
   find public/images -name "*.jpg" -size +200k -exec \
     npx @squoosh/cli --webp '{"quality":85}' -d webp {} \;
   ```

3. **Fix raw `<img>` tags** - Convert to Next.js `<Image>` component

### Phase 2: Short-term (Next 2 Weeks)

1. **Add image CDN** (Recommended: Cloudflare Images or ImageKit)
   - Automatic format conversion
   - On-the-fly resizing
   - Global CDN delivery
   - Cost: ~$5-20/month for your scale

2. **Create image upload guidelines**:
   - Max source size: 2000x2000px
   - Max file size: 500KB
   - Preferred format: WebP or optimized JPEG
   - Required: Descriptive alt text

3. **Add ESLint rule for alt text**:
   ```javascript
   // .eslintrc.js
   rules: {
     'jsx-a11y/alt-text': 'error',
   }
   ```

### Phase 3: Long-term (Next Month)

1. **Implement build-time optimization**:
   ```javascript
   // next.config.mjs - add image loader
   images: {
     loader: 'custom',
     loaderFile: './lib/image-loader.ts',
   }
   ```

2. **Create responsive image sets**:
   - Hero images: 1920w, 1200w, 768w, 480w
   - Card images: 600w, 400w, 200w
   - Thumbnails: 200w, 100w

3. **Audit and replace low-quality images**:
   - Identify blurry or pixelated images
   - Source higher quality replacements
   - Ensure consistent visual style

---

## 5. Implementation Scripts

### Compress All Large Images

```bash
#!/bin/bash
# scripts/optimize-images.sh

# Install dependencies
npm install -g sharp-cli

# Compress JPGs > 500KB
find public/images -name "*.jpg" -size +500k | while read file; do
  echo "Compressing: $file"
  sharp -i "$file" -o "$file" --quality 80
done

# Compress PNGs > 500KB
find public/images -name "*.png" -size +500k | while read file; do
  echo "Compressing: $file"
  sharp -i "$file" -o "$file" --compressionLevel 9
done
```

### Generate WebP Versions

```bash
#!/bin/bash
# scripts/generate-webp.sh

find public/images -name "*.jpg" -o -name "*.png" | while read file; do
  webp_file="${file%.*}.webp"
  if [ ! -f "$webp_file" ]; then
    echo "Converting: $file -> $webp_file"
    sharp -i "$file" -o "$webp_file" --format webp --quality 85
  fi
done
```

### Fix Missing Alt Text (Audit Script)

```bash
#!/bin/bash
# scripts/audit-alt-text.sh

echo "Files with <Image> missing alt text:"
grep -rn "<Image" --include="*.tsx" app/ | grep -v "alt=" | \
  cut -d: -f1 | sort -u

echo ""
echo "Files with <img> tags (should use Next/Image):"
grep -rn "<img " --include="*.tsx" app/ | cut -d: -f1 | sort -u
```

---

## 6. CDN Recommendation

### Option 1: Cloudflare Images (Recommended)
- **Cost**: $5/month for 100K images
- **Features**: Auto-format, resize, CDN
- **Integration**: Easy with Next.js

### Option 2: ImageKit
- **Cost**: Free tier (20GB bandwidth)
- **Features**: Real-time transformations, CDN
- **Integration**: Next.js loader available

### Option 3: Netlify Image Optimization (Current)
- **Cost**: Included with Netlify hosting
- **Features**: Auto WebP/AVIF, resize
- **Limitation**: Only works with Next/Image component

---

## 7. Priority Action Items

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 High | Compress 14 images > 1MB | Page load speed | 1 hour |
| 🔴 High | Fix raw `<img>` tags | SEO, Performance | 2 hours |
| 🟡 Medium | Add alt text audit | Accessibility | 4 hours |
| 🟡 Medium | Set up image CDN | Performance | 4 hours |
| 🟢 Low | Generate WebP sources | Storage | 2 hours |
| 🟢 Low | Create upload guidelines | Process | 1 hour |

---

## 8. Expected Results

After optimization:
- **Total image size**: 138 MB → ~30 MB (78% reduction)
- **Largest image**: 7.1 MB → ~300 KB
- **Page load improvement**: 2-4 seconds faster on slow connections
- **Lighthouse score**: +10-20 points on Performance
- **Accessibility score**: +5-10 points

---

*Report generated by Ona - Elevate LMS Development Assistant*
