# HERO COMPONENT SIDE-BY-SIDE AUDIT

## ACTIVE HEROES (Used in Pages)

| # | Hero Component | File Path | Used On Page | Count |
|---|---------------|-----------|--------------|-------|
| 1 | `HeroVideo` | `components/marketing/HeroVideo.tsx` | 12 pages | 12 |
| 2 | `ModernLandingHero` | `components/landing/ModernLandingHero.tsx` | 3 pages | 3 |
| 3 | `HeroPicture` | `components/marketing/HeroPicture.tsx` | 3 pages | 3 |
| 4 | `LmsHeroBanner` | `components/lms/LmsHeroBanner.tsx` | 2 pages | 2 |
| 5 | `HomeHeroVideo` | `components/ui/HomeHeroVideo.tsx` | 1 page | 1 |
| 6 | `PageVideoHero` | `components/ui/PageVideoHero.tsx` | 1 page | 1 |
| 7 | `CanonicalHero` | `components/hero/CanonicalHero.tsx` | 1 page | 1 |
| 8 | `HeroMediaFrame` | `components/hero/HeroMediaFrame.tsx` | 1 page | 1 |

---

## DETAILED PAGE → HERO MAPPING

### components/marketing/HeroVideo.tsx (12 pages)
```
app/apprenticeship-sponsor/page.tsx
app/compliance/workforce-partnership-packet/page.tsx
app/employer/page.tsx
app/hire-graduates/hire-graduates/page.tsx
app/programs/[program]/eligibility/page.tsx
app/programs/barber-apprenticeship/eligibility/page.tsx
app/programs/cosmetology-apprenticeship/eligibility/page.tsx
app/programs/electrical/ElectricalProgramPageClient.tsx
app/programs/esthetician-apprenticeship/eligibility/page.tsx
app/programs/medical-assistant/MedicalAssistantProgramPageClient.tsx
app/store/page.tsx
```

### components/landing/ModernLandingHero.tsx (3 pages)
```
app/careers/careers/page.tsx
app/platform/sponsors/page.tsx
app/success-stories/success-stories/page.tsx
```

### components/marketing/HeroPicture.tsx (3 pages)
```
app/programs/[program]/page.tsx
app/programs/barber-apprenticeship/BarberApprenticeshipClient.tsx
```

### components/lms/LmsHeroBanner.tsx (2 pages)
```
app/lms/(app)/progress/page.tsx
app/lms/(app)/quizzes/page.tsx
```

### components/ui/HomeHeroVideo.tsx (1 page)
```
app/page.tsx (homepage)
```

### components/ui/PageVideoHero.tsx (1 page)
```
app/funding/job-ready-indy/page.tsx
```

### components/hero/CanonicalHero.tsx (1 page)
```
app/programs/APPRENTICESHIP_TEMPLATE.tsx
```

### components/hero/HeroMediaFrame.tsx (1 page)
```
app/programs/APPRENTICESHIP_TEMPLATE.tsx
```

---

## DEAD HEROES (Not imported anywhere in app/)

### components/ (root) - 14 files
```
components/HeroAvatarGuide.tsx          ❌ DEAD
components/HeroBanner.tsx               ❌ DEAD
components/HeroSlideshow.tsx            ❌ DEAD
components/HeroVideoWithVoiceover.tsx   ❌ DEAD
components/HeroWithVoiceover.tsx        ❌ DEAD
components/HomeHeroWithVoiceover.tsx    ❌ DEAD
components/ImageHero.tsx                ❌ DEAD
components/ProgramHero.tsx              ❌ DEAD
components/ProgramHeroBanner.tsx        ❌ DEAD
components/RotatingHeroBanner.tsx       ❌ DEAD
components/ServiceHero.tsx              ❌ DEAD
components/SideHeroBanner.tsx           ❌ DEAD
components/ThreeBlockHero.tsx           ❌ DEAD
components/VideoHeroBanner.tsx         ❌ DEAD
```

### components/hero/ - 3 files
```
components/hero.tsx                     ❌ DEAD
components/hero/Hero.tsx               ❌ DEAD
components/hero/HeroBanner.tsx          ❌ DEAD (but HeroBanner.tsx also in root)
components/hero/HeroMedia.tsx           ❌ DEAD
```

### components/heroes/ - 2 files
```
components/heroes/CompactHero.tsx       ❌ DEAD
components/heroes/VideoHero.tsx         ❌ DEAD
```

### components/home/ - 6 files
```
components/home/Hero.tsx                ❌ DEAD
components/home/HeroVideo.tsx           ❌ DEAD
components/home/HomeHero.tsx            ❌ DEAD
components/home/HomeSecondHero.tsx     ❌ DEAD
components/home/HomeTopHero.tsx        ❌ DEAD
components/home/VideoHeroBanner.tsx     ❌ DEAD
components/home/VideoHeroSection.tsx    ❌ DEAD
```

### components/layout/ - 2 files
```
components/layout/HeroSection.tsx       ❌ DEAD
components/layout/PageHero.tsx          ❌ DEAD
```

### components/media/ - 1 file
```
components/media/HomeHero.tsx            ❌ DEAD
```

### components/programs/ - 4 files
```
components/programs/CleanPageHero.tsx   ❌ DEAD
components/programs/CprHero.tsx        ❌ DEAD
components/programs/ProgramHero.tsx     ❌ DEAD (also in root)
components/programs/sections/HeroSection.tsx ❌ DEAD
```

### components/sections/ - 1 file
```
components/sections/HeroSection.tsx     ❌ DEAD (also in programs/)
```

### components/shared/ - 1 file
```
components/shared/QualityHero.tsx        ❌ DEAD
```

### components/templates/ - 1 file
```
components/templates/PageHero.tsx       ❌ DEAD
```

### components/ui/ - 5 files
```
components/ui/Hero.tsx                  ❌ DEAD
components/ui/HeroSection.tsx           ❌ DEAD
components/ui/VideoHero.tsx             ❌ DEAD
components/ui/VideoHeroBanner.tsx       ❌ DEAD (also in home/)
```

### components/marketing/ - 6 files
```
components/marketing/HeroCarousel.tsx   ❌ DEAD
components/marketing/HeroVideoBg.tsx    ❌ DEAD
components/marketing/ScrollHeroVideo.tsx ❌ DEAD
components/marketing/cf/hero.tsx        ❌ DEAD
```

---

## SUMMARY

| Category | Count |
|----------|-------|
| **Active Heroes** | 8 |
| **Dead Heroes** | 46 |
| **Total** | 54 |

---

## RECOMMENDATIONS

### Phase 1: Consolidate Active Heroes

1. **HeroVideo** (12 pages) → Keep as-is
2. **ModernLandingHero** (3 pages) → Keep as-is  
3. **HeroPicture** (3 pages) → Keep as-is
4. **LmsHeroBanner** (2 pages) → Consider merging with HeroVideo
5. **HomeHeroVideo** (1 page) → Consider merging with HeroVideo
6. **PageVideoHero** (1 page) → Consider merging with HeroVideo
7. **CanonicalHero** (1 page) → Keep for apprenticeship template
8. **HeroMediaFrame** (1 page) → Keep for apprenticeship template

### Phase 2: Delete Dead Heroes

**Safe to Delete** (verify no references first):
- All 46 dead heroes listed above

**Verification Command:**
```bash
grep -r "HeroAvatarGuide\|HeroBanner\|HeroSlideshow" --include="*.tsx" .
```

### Phase 3: Create Canonical Hero Types

| Type | Purpose | Files to Merge |
|------|---------|----------------|
| `VideoHero` | Video with optional voiceover | HeroVideo, HomeHeroVideo, PageVideoHero |
| `ImageHero` | Image with text overlay | HeroPicture, ModernLandingHero |
| `DataHero` | For calculators/forms | (none currently) |
| `LmsHero` | LMS-specific hero | LmsHeroBanner |

---

## CANONICAL HERO REGISTRY (After Cleanup)

```
components/heroes/
├── VideoHero.tsx      (canonical - video backgrounds)
├── ImageHero.tsx      (canonical - image with text)
├── DataHero.tsx       (canonical - calculators/forms)
├── LmsHero.tsx        (canonical - LMS pages)
└── index.ts           (export all)
```
