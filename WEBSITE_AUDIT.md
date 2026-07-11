# Website Audit Report - Images, CSS, Gradients, Outcomes

---

## 1. GRADIENT OVERLAYS

### Status: ⚠️ NEEDS OPTIMIZATION

Found **519 gradient usages** across codebase.

#### Issues:
| Page | Issue | Recommendation |
|------|-------|----------------|
| `/partner-directory` | Dark gradient overlay on hero | Replace with real image |
| `/host-shop` | `bg-gradient-to-t from-black/80` | Add real photo |
| `/apprenticeships/ipla-exam` | Gradient overlay | Add real barber image |
| Generic pages | `bg-gradient-to-br from-brand-blue-700 to-brand-blue-900` | Use hero video/images |

#### Pages Using Generic Blue Gradient:
```
/licensing
/verify
/apps
/agencies
/docs/*
/nail-host-shop
/wioa-participant
/resources/*
/government
/schools/mesmerized-by-beauty
```

**Fix Required:** Replace generic gradients with real hero images/videos.

---

## 2. MISSING IMAGES

### Status: ⚠️ NEEDS FIX

#### Pages with Missing Hero Images:
| Page | Missing Image |
|------|---------------|
| `/verify` | `/images/pages/verify-page-1.webp` |
| `/approvals` | `/images/pages/approvals-page-1.webp` |
| `/resources/resources` | `/images/pages/resources-page-1.webp` |
| `/licensing` | Likely missing |

#### Pages with Hero Images (verify they exist):
| Page | Image Path | Status |
|------|------------|--------|
| `/partner-directory` | `partners-hero.webp` | ✅ |
| `/host-shop` | `barber-training.webp` | ✅ |
| `/host-shop/login` | `partner-page-9.webp` | ✅ |
| `/host-shop/onboarding` | `partner-page-9.jpg` | ✅ |
| `/academic-integrity` | `academic-integrity-hero.webp` | ✅ |

**Action:** Upload missing hero images to Supabase storage.

---

## 3. MISSING ALT TEXT

### Status: ❌ MUST FIX

Found **20+ Images without alt text**:

| Page | Line | Issue |
|------|------|-------|
| `/verify/verify/[certificateId]` | 154, 277 | No alt |
| `/approvals` | 28 | No alt |
| `/videos/*` | Multiple | No alt |
| `/resources/resources` | 95 | No alt |
| `/host-shop/*` | Multiple | No alt |
| `/account/*` | Multiple | No alt |

**Fix Required:** Add descriptive alt text to all images.

---

## 4. GENERIC OUTCOMES TEXT

### Status: ⚠️ NEEDS REAL DATA

#### Pages with Generic "Career Outcomes":
| Page | Issue |
|------|-------|
| `/programs/skilled-trades` | Generic heading |
| `/programs/[program]` | Generic section |
| `/programs/healthcare` | Generic heading |
| `/programs/barber-apprenticeship` | Has RAPIDS data |

#### Generic Hero Text Found:
```
"Start your career transformation today"
"Pass your state exam, earn your license, and launch your career"
"Choose the path that fits your career goals"
"Start Your Career Path Today"
"Our learning platform gives you the tools..."
```

**Fix Required:** Replace with program-specific outcomes + real data from O*NET/Adzuna.

---

## 5. CSS OPTIMIZATION

### Status: ✅ GOOD

| Check | Status |
|-------|--------|
| Tailwind usage | ✅ Consistent |
| Brand colors | ✅ `brand-*` classes |
| Dark mode | ✅ Via `dark:` prefix |
| Responsive | ✅ `sm:`, `md:`, `lg:` |

### Brand Color Palette:
```css
/* Brand Colors */
--brand-red-50 through --brand-red-900
--brand-blue-50 through --brand-blue-900  
--brand-green-50 through --brand-green-900
```

---

## 6. IMAGE OPTIMIZATION

### Status: ✅ GOOD

| Check | Status |
|-------|--------|
| WebP format | ✅ Used |
| Next/Image | ✅ Used |
| Lazy loading | ✅ Default |
| Blur placeholder | ⚠️ Some missing |

### Files Needing blurDataURL:
```
/verify/verify/[certificateId]
/approvals
/videos
```

---

## 7. HERO SECTIONS

### Status: ⚠️ MIXED

#### Pages WITH Real Hero Images:
| Page | Type |
|------|------|
| Homepage | ✅ Video |
| `/barber-apprenticeship` | ✅ Image |
| `/host-shop` | ✅ Image |
| `/partner-directory` | ✅ Image |

#### Pages WITH Generic Gradients:
| Page | Type |
|------|------|
| `/licensing` | ❌ Gradient |
| `/verify` | ❌ Gradient |
| `/approvals` | ❌ Gradient |
| `/apps` | ❌ Gradient |
| `/resources/*` | ❌ Gradient |
| `/docs/*` | ❌ Gradient |

---

## 8. CAREER OUTCOMES SECTIONS

### Status: 🟡 PARTIAL

#### Pages with O*NET Data:
| Page | Data |
|------|------|
| `/programs/barber-apprenticeship` | ✅ RAPIDS + O*NET |
| `/programs/medical-assistant` | ✅ O*NET skills |
| `/programs/[program]` | ✅ `OnetLaborData` |

#### Pages Missing Live Data:
| Page | Issue |
|------|-------|
| `/programs/skilled-trades` | Static text |
| `/programs/healthcare` | Generic headings |
| Career pathways | Need real job count |

---

## SUMMARY

### ✅ Working Well
- Tailwind CSS usage
- Brand color system
- Next/Image optimization
- Responsive design
- Dark mode support

### ⚠️ Needs Optimization
- Generic gradient heroes → Replace with images
- Missing hero images → Upload to storage
- Generic outcome text → Add real O*NET data
- Some missing alt text → Add accessibility

### ❌ Must Fix
- 20+ images missing alt text
- 10+ pages using generic gradients
- Career outcomes not using live data

---

## REQUIRED FIXES

### P0 - Critical
1. **Add alt text to all images** - 20+ images
2. **Replace generic gradients** - 10+ pages
3. **Upload missing hero images** - 5+ images

### P1 - Important
4. **Add blur placeholders** - For large images
5. **Wire O*NET to all program pages** - Career outcomes
6. **Replace generic hero text** - Program-specific

### P2 - Nice to Have
7. **Add video heroes** - For key pages
8. **Optimize image sizes** - Lazy load below fold
9. **Add real student photos** - To testimonials

---

## AUDIT CHECKLIST

### Pages to Fix
```
/licensing                    - Add hero image, fix alt
/verify                       - Add hero image, fix alt
/approvals                    - Add hero image, fix alt
/apps                         - Add hero image
/resources/page              - Add hero image, fix alt
/resources/instructor-training - Add hero image
/agencies                     - Add hero image
/wioa-participant             - Add hero image
/government                   - Add hero image
/nail-host-shop               - Add hero image
/docs/* (multiple)           - Add hero images
```

### Image Paths to Create
```
/images/pages/verify-page-1.webp
/images/pages/approvals-page-1.webp
/images/pages/resources-page-1.webp
/images/pages/licensing-hero.webp
/images/pages/apps-hero.webp
/images/pages/agencies-hero.webp
/images/pages/government-hero.webp
```
