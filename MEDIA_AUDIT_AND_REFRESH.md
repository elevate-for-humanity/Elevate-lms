# MEDIA AUDIT & REFRESH PLAN

**Generated:** 2026-07-13  
**Goal:** Replace all generic visuals with quality media matching homepage hero

---

## SCOPE

### Pages Requiring VIDEO + VOICEOVER
| Page | Route | Priority | Script Status |
|------|-------|---------|--------------|
| **PROGRAMS** |
| Barber Apprenticeship | `/programs/barber-apprenticeship` | 🔴 HIGH | ✅ Script ready |
| Cosmetology | `/programs/cosmetology-apprenticeship` | 🔴 HIGH | ✅ Script ready |
| Esthetics | `/programs/esthetics` | 🔴 HIGH | ✅ Script ready |
| Nail Technician | `/programs/nail-technician` | 🔴 HIGH | ✅ Script ready |
| CNA | `/programs/cna` | 🔴 HIGH | ✅ Script ready |
| HVAC | `/programs/hvac` | 🔴 HIGH | ✅ Script ready |
| CDL | `/programs/cdl` | 🔴 HIGH | ✅ Script ready |
| Medical Assistant | `/programs/medical-assistant` | 🟡 MED | ✅ Script ready |
| Phlebotomy | `/programs/phlebotomy` | 🟡 MED | ✅ Script ready |
| Peer Recovery | `/programs/peer-recovery` | 🟡 MED | ✅ Script ready |
| **APPRENTICESHIP** |
| Apprentice Dashboard | `/apprentice` | 🔴 HIGH | ✅ Script ready |
| Hours Log | `/apprentice/hours` | 🟡 MED | ✅ Script ready |
| Competencies | `/apprentice/competencies` | 🟡 MED | ✅ Script ready |
| State Board | `/apprentice/state-board` | 🟡 MED | ✅ Script ready |
| **HOST SHOP** |
| Host Shop Portal | `/host-shop` | 🔴 HIGH | ✅ Script ready |
| Host Shop Dashboard | `/host-shop/dashboard` | 🟡 MED | ✅ Script ready |
| **ORIENTATION** |
| Orientation Home | `/orientation` | 🔴 HIGH | ✅ Script ready |
| Barber Orientation | `/orientation/barber` | 🔴 HIGH | ✅ Script ready |
| Cosmetology Orientation | `/orientation/cosmetology` | 🟡 MED | ✅ Script ready |
| **ONBOARDING** |
| Student Onboarding | `/onboarding` | 🔴 HIGH | ✅ Script ready |
| Employer Onboarding | `/onboarding/employer` | 🟡 MED | ✅ Script ready |
| **DASHBOARDS** |
| Student Dashboard | `/student/dashboard` | 🔴 HIGH | ✅ Script ready |
| Employer Dashboard | `/employer/dashboard` | 🟡 MED | ✅ Script ready |
| **DEMOS** |
| Barber Demo | `/demo/barber` | 🔴 HIGH | ✅ Script ready |
| Cosmetology Demo | `/demo/cosmetology` | 🟡 MED | ✅ Script ready |
| Course Demo | `/demo/course` | 🟡 MED | ✅ Script ready |

### Pages Requiring HIGH-QUALITY IMAGES
| Page | Route | Type Needed |
|------|-------|-----------|
| **MARKETING** |
| About | `/about` | Team photos, facility |
| Contact | `/contact` | Office photos |
| Team | `/team` | Headshots |
| Partners | `/partners` | Logo grid |
| Testimonials | `/testimonials` | Student photos |
| Blog | `/blog/*` | Article images |
| FAQ | `/faq` | Icon illustrations |
| **STUDENT** |
| Courses | `/courses` | Course thumbnails |
| Programs Overview | `/programs` | Program cards |
| Funding | `/funding` | Success photos |
| **ADMIN** |
| Dashboard | `/admin/dashboard` | Charts/graphs |
| Reports | `/admin/reports/*` | Data visualizations |

---

## VIDEO SPECIFICATIONS

### Quality Standards
```
Format: MP4 (H.264)
Resolution: 1920x1080 (Full HD)
Frame Rate: 30fps
Duration: 30-60 seconds
Audio: AAC 128kbps
Size Target: < 10MB
```

### Video Naming Convention
```
/public/videos/
├── programs/
│   ├── barber-hero.mp4           # Main program video
│   ├── barber-voiceover.mp3     # Audio track
│   ├── cosmetology-hero.mp4
│   ├── cosmetology-voiceover.mp3
│   └── ...
├── apprenticeship/
│   ├── apprentice-dashboard.mp4
│   ├── apprentice-hours.mp4
│   └── ...
├── orientation/
│   ├── orientation-barber.mp4
│   └── ...
├── demos/
│   ├── demo-barber.mp4
│   └── ...
└── common/
    ├── loading.mp4               # Loading animation
    ├── empty-state.mp4          # Empty state animation
    └── error.mp4                # Error animation
```

---

## IMAGE SPECIFICATIONS

### Hero Banners
```
Desktop: 1920x1080px (16:9)
Mobile: 1080x1920px (9:16)
Format: WebP (preferred) or JPG
Quality: 85%
Max Size: 500KB
```

### Program Cards
```
Desktop: 600x400px (3:2)
Mobile: 400x300px
Format: WebP
Quality: 80%
Max Size: 150KB
```

### Icons (Replace with Photos)
```
NOT: Generic emoji icons
YES: Real photos of:
- Actual students
- Real classrooms
- Actual equipment
- Staff members
```

---

## REPLACEMENT PRIORITIES

### Phase 1: Critical (Before Launch)
1. All program pages (7 videos)
2. Apprentice dashboard
3. Orientation pages
4. Host shop portal

### Phase 2: Important (Week 1)
5. Student dashboard
6. All demos
7. Onboarding pages

### Phase 3: Enhancement (Week 2)
8. Replace generic icons with photos
9. Update program cards
10. Fix stretched/overlapped images

---

## GENERATION COMMANDS

### Generate Program Videos
```bash
# With Pexels API
export PEXELS_API_KEY=your_key
node scripts/generate-program-videos.mjs

# Without Pexels (use animated fallback)
node scripts/generate-program-videos.mjs --no-stock
```

### Scan Pexels for Videos
```bash
export PEXELS_API_KEY=your_key
node scripts/scan-pexels-videos.mjs
```

### Audit Existing Media
```bash
node scripts/audit-media-usage.mjs
```

---

## IMAGE SOURCES

### Use Existing
- Supabase Storage: `images/` bucket
- Pexels (free): Real photos
- Generated: Canva/Photoshop

### Replace These Patterns
```
❌ FAKE/STOCKY:
- Unsplash random photos
- Generic office stock
- Outdated team photos

✅ AUTHENTIC:
- Real student photos (with consent)
- Actual facility photos
- Current staff headshots
```

---

## CHECKLIST

### Before Starting
- [ ] Gather authentic photos (students, facility, staff)
- [ ] Get Pexels API key (free at pexels.com/api)
- [ ] Review all existing videos
- [ ] Audit all image usages

### During Generation
- [ ] Generate all program videos (7)
- [ ] Generate apprenticeship videos (4)
- [ ] Generate orientation videos (3)
- [ ] Generate demo videos (3)
- [ ] Generate dashboard videos (2)

### Quality Control
- [ ] Check all videos play correctly
- [ ] Verify audio sync
- [ ] Test on mobile devices
- [ ] Check file sizes
- [ ] Verify no stretched images

### Replace in Code
- [ ] Update heroVideo paths
- [ ] Replace generic icons
- [ ] Update program cards
- [ ] Fix any overlaps
- [ ] Test page loads

---

## VIDEO SCRIPTS

### Barber Apprenticeship (45s)
```
Welcome to Elevate for Humanity's Barber Apprenticeship.

[Scene: Real barbershop, students learning]

Imagine walking into your salon on your very first day. Your mentor welcomes you. Clients begin arriving.

Week after week your skills improve. Month after month your clientele grows.

Learn precision cutting, straight razor shaves, and beard design. Earn while you learn through our DOL-registered apprenticeship.

No tuition. No debt. Just real skills for a real career.

Your journey to becoming a licensed barber starts here.
```

### Cosmetology (45s)
```
Welcome to Elevate for Humanity's Cosmetology Apprenticeship.

[Scene: Students in cosmetology salon]

Transform your passion for beauty into a thriving career.

Work alongside professional stylists in real salons. Learn hair coloring, cutting, makeup artistry, and client consultation.

Our apprenticeship model means you earn while you learn. No expensive tuition.

Build your skills, build your confidence, build your future.
```

### CNA (45s)
```
Welcome to Elevate for Humanity's CNA Program.

[Scene: Healthcare training facility]

Start a meaningful career in healthcare.

Our certified nursing assistant training prepares you for real patient care roles.

Learn vital signs, patient care, and communication skills. Complete your certification and start working in weeks.

Funding available. Job placement support included.

Apply today and begin your healthcare journey.
```

### Apprentice Dashboard (30s)
```
Welcome to your Apprentice Portal.

Track your progress, log your hours, and manage your apprenticeship journey.

[Scene: Dashboard interface]

View your competencies. Check your schedule. Connect with your mentor.

Your path to becoming a licensed professional starts here.
```

### Orientation (45s)
```
Welcome to Elevate for Humanity Orientation.

[Scene: New students arriving]

Congratulations on taking this important step toward your new career.

During orientation, you'll:
- Meet your cohort and instructors
- Learn about your program requirements
- Set up your digital tools
- Understand your pathway to success

Let's begin your journey together.
```

---

## FILE STRUCTURE

```
/public/
├── videos/
│   ├── hero-home.mp4              # Homepage (reference quality)
│   ├── programs/
│   │   ├── barber-hero.mp4
│   │   ├── cosmetology-hero.mp4
│   │   ├── esthetics-hero.mp4
│   │   ├── nail-hero.mp4
│   │   ├── cna-hero.mp4
│   │   ├── hvac-hero.mp4
│   │   └── cdl-hero.mp4
│   ├── apprenticeship/
│   │   ├── apprentice-dashboard.mp4
│   │   └── apprentice-journey.mp4
│   ├── orientation/
│   │   ├── orientation-barber.mp4
│   │   └── orientation-general.mp4
│   └── demos/
│       ├── demo-barber.mp4
│       └── demo-general.mp4
├── images/
│   ├── programs/
│   │   ├── barber-card.webp
│   │   └── ...
│   ├── team/
│   │   └── (staff headshots)
│   └── icons/
│       └── (replace with photos)
└── icons/
    └── (remove duplicates)
```

---

## AUDIT SCRIPT OUTPUT

Running the audit will show:
- All pages with hero videos
- All pages with generic icons
- All stretched/wrong-size images
- All duplicate images
- Missing alt texts

---

**Next Step:** Run `node scripts/audit-media-usage.mjs` to get exact replacement list
