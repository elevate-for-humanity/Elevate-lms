# Visual layout audit (heroes, images, text gaps)

Generated: 2026-06-03T23:57:47.564Z

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Oversized heroes | 0 | 47 | 0 | 0 | 47 |
| Image load cost | 0 | 9 | 416 | 40 | 465 |
| Layout / text | 0 | 112 | 4 | 0 | 116 |

**Canonical hero (design standard):** `h-[38vh] min-h-[220px] max-h-[420px]` or `HeroPicture` / `HeroVideo` from `components/marketing/`.

**Marketing pages with hero markup but not canonical components:** 331

### Critical findings

_None_

## Oversized hero / banner patterns

### `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` (2)
- L1648 **max-h-600-plus**: max-height >560px (exceeds design standard) — `max-h-[640px]`
- L1268 **clamp-max-600-plus**: clamp() max >560px — `clamp(320px,44vw,640px)`

### `components/ModerationDashboard.tsx` (2)
- L319 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`
- L324 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `components/admin/dashboard/LizzyContainerWrapper.tsx` (2)
- L12 **min-h-420-plus**: min-height ≥420px on hero-like container — `min-h-[420px]`
- L68 **min-h-420-plus**: min-height ≥420px on hero-like container — `min-h-[420px]`

### `app/apprentice/not-found.tsx` (1)
- L5 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/apps/website-builder/WebsiteBuilderApp.tsx` (1)
- L199 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `app/employer/not-found.tsx` (1)
- L5 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/funding/not-found.tsx` (1)
- L6 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/lms/not-found.tsx` (1)
- L5 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/loading.tsx` (1)
- L6 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/login/not-found.tsx` (1)
- L5 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/mentor/not-found.tsx` (1)
- L5 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/program-holder/not-found.tsx` (1)
- L6 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/programs/loading.tsx` (1)
- L3 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/programs/not-found.tsx` (1)
- L6 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `app/store/add-ons/analytics-pro/page.tsx` (1)
- L98 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[50vh]`

### `app/store/add-ons/compliance-automation/page.tsx` (1)
- L99 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[50vh]`

### `app/store/not-found.tsx` (1)
- L5 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[60vh]`

### `components/ContextualHelp.tsx` (1)
- L206 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[80vh]`

### `components/DataExportDialog.tsx` (1)
- L323 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `components/ElevateChatWidget.tsx` (1)
- L121 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[85vh]`

### `components/EligibilityModal.tsx` (1)
- L22 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `components/FeedbackWidget.tsx` (1)
- L99 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `components/NotificationBell.tsx` (1)
- L105 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[80vh]`

### `components/OnboardingFlow.tsx` (1)
- L49 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `components/ProgramPageTemplate.tsx` (1)
- L63 **min-h-420-plus**: min-height ≥420px on hero-like container — `min-h-[600px]`

### `components/SurveyModal.tsx` (1)
- L228 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `components/TutorialSystem.tsx` (1)
- L105 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[90vh]`

### `components/admin/AdminNav.tsx` (1)
- L149 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[75vh]`

### `components/blocks/AccordionSection.tsx` (1)
- L48 **max-h-600-plus**: max-height >560px (exceeds design standard) — `max-h-[600px]`

### `components/chat/AILiveChat.tsx` (1)
- L233 **vh-50-plus**: Hero/viewport height ≥50vh (often oversized) — `h-[70vh]`


## Image performance (LCP / video)

### `app/government/page.tsx` (10)
- L141 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L180 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L278 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L300 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L320 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L342 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L438 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L460 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- _+2 more_

### `app/programs/hvac-technician/course/HvacCourseHome.tsx` (8)
- L172 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L297 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L444 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L487 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L172 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
            src={MODULE_PHOTO[index] || MODULE_PHOTO[0]}
  `
- L297 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-hero.webp"
          alt=`
- L444 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="/images/pages/comp-home-highlight-succ`
- L487 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                    src={MODULE_PHOTO[i]}
                 `

### `components/ProgramCTA.tsx` (8)
- L35 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L53 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L69 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L101 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L118 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L192 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L219 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L246 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/programs/barber-apprenticeship/host-shops/page.tsx` (7)
- L36 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L53 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L105 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L117 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L53 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/barber-training.webp"
  `
- L105 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="/images/pages/barber-gallery-2.webp"
 `
- L117 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="/images/pages/barber-gallery-3.webp"
 `

### `app/programs/cosmetology-apprenticeship/host-shops/page.tsx` (7)
- L37 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L55 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L110 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L122 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L55 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="/images/pages/cosmetology-apprenticesh`
- L110 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology.webp"
      `
- L122 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="/images/pages/barber-styling-hair.webp`

### `app/programs/esthetician-apprenticeship/host-shops/page.tsx` (7)
- L35 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L57 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L89 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L99 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L57 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-hero.webp"
 `
- L89 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-hero.webp"
 `
- L99 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-hero.webp"
 `

### `app/programs/nail-technician-apprenticeship/host-shops/page.tsx` (7)
- L35 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L57 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L86 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L93 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L57 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw" src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/nail-technician.webp"
                al`
- L86 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw" src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/nail-technician.webp"
                al`
- L93 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw" src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/nail-technician.webp"
                al`

### `app/workone-partner-packet/page.tsx` (6)
- L171 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L245 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L268 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L291 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L314 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L407 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/calendar/page.tsx` (5)
- L80 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L101 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L141 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L172 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L264 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `components/marketing/PartnerLogos.tsx` (5)
- L17 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L26 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L35 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L44 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L53 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/career-services/courses/my-courses/page.tsx` (4)
- L113 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L156 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L113 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                      src={purchase.course?.image_url || '/`
- L156 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                      src={course.image_url || '/images/pag`

### `app/funding/jri/page.tsx` (4)
- L46 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L233 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L46 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
            src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/jri-hero.webp"
            a`
- L233 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
                    src={program.image}
                   `

### `app/onboarding/page.tsx` (4)
- L51 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L79 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L120 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L160 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/store/compliance/wioa/page.tsx` (4)
- L148 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L202 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L235 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L321 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/store/demo/employer/page.tsx` (4)
- L196 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L288 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L196 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw" src={candidate.image} alt={candidate.name} fill`
- L288 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw" src={candidate.image} alt={candidate.name} fill`

### `app/store/licenses/page.tsx` (4)
- L54 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L418 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L54 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
          src="/images/pages/store-licensing-enterprise-her`
- L418 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/business/team-4.webp"
          alt=`

### `app/store/licenses/school-license/page.tsx` (4)
- L27 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L286 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L27 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw"
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-hero.webp"
          alt`
- L286 **fill-no-sizes**: next/image fill without sizes (may over-fetch) — `<Image sizes="100vw" src={item.img} alt={item.title} fill`

### `app/success/page.tsx` (4)
- L40 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L64 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L89 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L113 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/tutoring/TutoringClient.tsx` (4)
- L89 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L110 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L137 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L160 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`

### `app/wioa-eligibility/page.tsx` (4)
- L36 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L103 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L158 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`
- L255 **sizes-100vw**: sizes=100vw loads full viewport width image (heavy LCP) — `sizes="100vw"`


## Layout & text standard violations

### `app/lms/(app)/courses/[courseId]/page.tsx` (5)
- L268 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `heroImage}
            alt={course.title}
            fill
            className`
- L532 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `heroImage}
          alt={course.title}
          fill
          className="obje`
- L275 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-90`
- L540 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-90`
- L633 **invisible-white-on-white**: Possible white text on white background — `bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5`}
            `

### `app/help/page.tsx` (3)
- L44 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero-training-1.webp"
            alt="Student receiving personalized help and s`
- L206 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero-training-2.webp"
                alt="Student using help resources on lapto`
- L213 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 to-transparent" />
    `

### `app/program-holder/dashboard/page.tsx` (3)
- L200 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden">
  `
- L205 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-`
- L253 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-brand-blue-950/50" />
                <div className="absolu`

### `components/programs/VisualProgramTemplate.tsx` (3)
- L205 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 to-transparent" />
    `
- L398 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 to-transparent" />
    `
- L467 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-slate-900/70" />
          <div className="absolute inset-0 `

### `app/partners/training-sites/page.tsx` (2)
- L199 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.webp"
          alt={`${PLATFORM_DEFAULTS.orgName} training sites and emplo`
- L206 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 t`

### `app/programs/building-services-technician/page.tsx` (2)
- L34 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.jpg"
          alt="Building Services Technician working on facility mainte`
- L42 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 t`

### `app/programs/direct-support-professional/page.tsx` (2)
- L30 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero Banner */}
      <section className="relative w-full" style={{ height: 'cla`
- L41 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 t`

### `app/programs/esthetician-apprenticeship/host-shops/page.tsx` (2)
- L30 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero */}
      <section className="relative h-[38vh] min-h-[220px] max-h-[420px]`
- L39 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/70 to-transparent" />
    `

### `app/programs/hvac-technician/course/HvacCourseHome.tsx` (2)
- L298 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.webp"
          alt="HVAC technician"
          fill
          className="o`
- L304 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
   `

### `app/programs/nail-technician-apprenticeship/host-shops/page.tsx` (2)
- L30 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero */}
      <section className="relative h-[38vh] min-h-[220px] max-h-[420px]`
- L39 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/70 to-transparent" />
    `

### `app/scholarships/page.tsx` (2)
- L189 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.webp"
          alt="Scholarships and Financial Aid"
          fill
       `
- L195 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 t`

### `app/search/page.tsx` (2)
- L284 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.webp"
                alt="Employer partnerships"
                fill
    `
- L296 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),t`

### `app/store/licenses/page.tsx` (2)
- L55 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.webp"
          alt="Workforce training platform"
          fill
          `
- L424 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-zinc-900/90" />

        <div className="relative z-10 max-w`

### `app/testing/[provider]/page.tsx` (2)
- L122 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `heroImg}
          alt={provider.name}
          fill
          className="objec`
- L130 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t ${accent} via-transparent to-transparent opaci`

### `components/HomeHeroWithVoiceover.tsx` (2)
- L177 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero-poster.webp"
        className="absolute inset-0 w-full h-full object-cover`
- L194 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto`

### `components/admin/dashboard/DashboardShell.tsx` (2)
- L455 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `hero.webp"
          alt=""
          fill
          className="object-cover"
  `
- L454 **empty-alt**: Empty image alt text — `<Image
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/admin-dashboard-hero.webp"
          alt=""`

### `components/home/Pathways.tsx` (2)
- L23 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 " />
              <div className="absolute bottom-0 left-0 rig`
- L43 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 " />
              <div className="absolute bottom-0 left-0 rig`

### `components/lms/LessonPlayer.tsx` (2)
- L487 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center pointer-events-none">`
- L588 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center bg-black/80">
       `

### `components/security/ProtectedImage.tsx` (2)
- L52 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 z-10"
        style={{
          background:
            'repea`
- L91 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <`

### `components/templates/PageHero.tsx` (2)
- L13 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero?: string;
}

export default function PageHero({ title, description, forceHe`
- L70 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center text-center px-4">
          <`

### `app/apply/ApplyAvatarGuide.tsx` (1)
- L68 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center pointer-events-none">
        `

### `app/apply/ApplyHeroVideo.tsx` (1)
- L25 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-cover"
        autoPlayOnMount
        thr`

### `app/blog/loading.tsx` (1)
- L6 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero Skeleton */}
      <div className="bg-gradient-to`

### `app/financing/page.tsx` (1)
- L89 **hero-gradient-overlay**: Gradient overlay near hero (forbidden on hero frame) — `Hero */}
      <section className="bg-gradient-to`

### `app/for-agencies/page.tsx` (1)
- L111 **hero-text-overlay**: Headline/text overlaid on hero media — `absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px`



## Recommended fix order

1. **Shared components** — `HeroVideo.tsx`, `HeroPicture.tsx`, `page-design-tokens.ts` `hero.imageWrap`, `PageVideoHero.tsx` SIZE map, `PublicLandingPage.tsx`, `HomeTopHero.tsx`
2. **Remove `preloadFull`** on marketing heroes (use `metadata` preload; home page only may opt in)
3. **Replace `sizes="100vw"`** with `(max-width: 768px) 100vw, 1200px` on heroes
4. **Page-by-page** — host-shops, government, store, pathways templates using `h-[60vh] min-h-[450px]`
5. **text-gray-* → text-slate-*** in touched files

Re-run: `node scripts/audit-visual-layout.mjs` and `node scripts/audit-image-assets.mjs`
