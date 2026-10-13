# Visual layout audit — active platform

Generated: 2026-10-12T04:55:20.153Z

This report scans the deployed monorepo app trees, not the legacy root `app/` tree.

## Coverage

| Service | TSX/JSX files scanned |
|---|---:|
| marketing | 1015 |
| lms | 457 |
| admin | 722 |
| shared | 1333 |

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Oversized heroes | 0 | 7 | 0 | 0 | 7 |
| Image load cost | 0 | 1 | 8 | 0 | 9 |
| Layout / text | 0 | 208 | 3 | 0 | 211 |

**Canonical Marketing hero:** `h-[38vh] min-h-[260px] max-h-[520px]` or a canonical hero renderer.

**Active Marketing pages with hero intent but no canonical hero marker:** 144

## Marketing pages requiring canonicalization

- `apps/marketing/app/(marketing)/paris-ai/page.tsx`
- `apps/marketing/app/(marketing)/students/page.tsx`
- `apps/marketing/app/about/partners/page.tsx`
- `apps/marketing/app/academic-calendar/page.tsx`
- `apps/marketing/app/academic-integrity/page.tsx`
- `apps/marketing/app/ai/job-match/page.tsx`
- `apps/marketing/app/ai/page.tsx`
- `apps/marketing/app/ai/paris/page.tsx`
- `apps/marketing/app/alumni/page.tsx`
- `apps/marketing/app/apply/employer/page.tsx`
- `apps/marketing/app/apply/staff/page.tsx`
- `apps/marketing/app/banking/direct-deposit/page.tsx`
- `apps/marketing/app/blog/[slug]/page.tsx`
- `apps/marketing/app/booking/page.tsx`
- `apps/marketing/app/booth-rental/page.tsx`
- `apps/marketing/app/business-network/page.tsx`
- `apps/marketing/app/calendar/page.tsx`
- `apps/marketing/app/career-counseling/page.tsx`
- `apps/marketing/app/career-services/page.tsx`
- `apps/marketing/app/certificates/page.tsx`
- `apps/marketing/app/certificates/verify/[certificateId]/page.tsx`
- `apps/marketing/app/community-services/page.tsx`
- `apps/marketing/app/compliance/competency-verification/barber/page.tsx`
- `apps/marketing/app/compliance/competency-verification/page.tsx`
- `apps/marketing/app/compliance/credential-partners/page.tsx`
- `apps/marketing/app/consumer-education/page.tsx`
- `apps/marketing/app/contracts/page.tsx`
- `apps/marketing/app/cookies/page.tsx`
- `apps/marketing/app/create-course/page.tsx`
- `apps/marketing/app/demos/page.tsx`
- `apps/marketing/app/directory/page.tsx`
- `apps/marketing/app/disaster-recovery/page.tsx`
- `apps/marketing/app/dmca/page.tsx`
- `apps/marketing/app/docs/page.tsx`
- `apps/marketing/app/educatorhub/page.tsx`
- `apps/marketing/app/email/page.tsx`
- `apps/marketing/app/employment-support/page.tsx`
- `apps/marketing/app/enroll/page.tsx`
- `apps/marketing/app/events/page.tsx`
- `apps/marketing/app/founder/page.tsx`
- `apps/marketing/app/fssa/page.tsx`
- `apps/marketing/app/funding/dol/page.tsx`
- `apps/marketing/app/funding/how-it-works/page.tsx`
- `apps/marketing/app/grievance/page.tsx`
- `apps/marketing/app/handbook/page.tsx`
- `apps/marketing/app/healthcare-training-indianapolis/page.tsx`
- `apps/marketing/app/help/account/page.tsx`
- `apps/marketing/app/help/page.tsx`
- `apps/marketing/app/help/technical/page.tsx`
- `apps/marketing/app/help/tutorials/page.tsx`
- `apps/marketing/app/implementation/page.tsx`
- `apps/marketing/app/inquiry/page.tsx`
- `apps/marketing/app/instructor-credentials/page.tsx`
- `apps/marketing/app/jri/page.tsx`
- `apps/marketing/app/legal-entity-structure/page.tsx`
- `apps/marketing/app/license/page.tsx`
- `apps/marketing/app/licenses/page.tsx`
- `apps/marketing/app/licensing/page.tsx`
- `apps/marketing/app/microclasses/page.tsx`
- `apps/marketing/app/mobile/page.tsx`
- `apps/marketing/app/mobile-app/page.tsx`
- `apps/marketing/app/news/page.tsx`
- `apps/marketing/app/offline/page.tsx`
- `apps/marketing/app/ojt-and-funding/page.tsx`
- `apps/marketing/app/onboarding/employer/hiring-needs/page.tsx`
- `apps/marketing/app/onboarding/learner/agreements/page.tsx`
- `apps/marketing/app/onboarding/learner/handbook/page.tsx`
- `apps/marketing/app/onboarding/learner/page.tsx`
- `apps/marketing/app/onboarding/page.tsx`
- `apps/marketing/app/online-apps/page.tsx`
- `apps/marketing/app/partner-directory/page.tsx`
- `apps/marketing/app/partner-operating-model/page.tsx`
- `apps/marketing/app/partnerships/page.tsx`
- `apps/marketing/app/philanthropy/page.tsx`
- `apps/marketing/app/platform/employer-portal/page.tsx`
- `apps/marketing/app/platform/enterprise/page.tsx`
- `apps/marketing/app/platform/partner-portal/page.tsx`
- `apps/marketing/app/platform/partners/page.tsx`
- `apps/marketing/app/platform/pricing/page.tsx`
- `apps/marketing/app/platform/sponsors/page.tsx`
- `apps/marketing/app/platform/standards/page.tsx`
- `apps/marketing/app/platform/student-portal/handbook/page.tsx`
- `apps/marketing/app/platform/student-portal/page.tsx`
- `apps/marketing/app/platform/workforce-analytics/page.tsx`
- `apps/marketing/app/preview/barber-videos/page.tsx`
- `apps/marketing/app/pricing/page.tsx`
- `apps/marketing/app/programs/[program]/training/page.tsx`
- `apps/marketing/app/programs/cosmetology-apprenticeship/orientation/page.tsx`
- `apps/marketing/app/programs/healthcare/page.tsx`
- `apps/marketing/app/resources/page.tsx`
- `apps/marketing/app/roi/page.tsx`
- `apps/marketing/app/schedule-consultation/page.tsx`
- `apps/marketing/app/security/page.tsx`
- `apps/marketing/app/services/page.tsx`
- `apps/marketing/app/share/page.tsx`
- `apps/marketing/app/sites/[subdomain]/[[...slug]]/page.tsx`
- `apps/marketing/app/skilled-trades-training-indiana/page.tsx`
- `apps/marketing/app/staff/attendance/export/page.tsx`
- `apps/marketing/app/store/add-ons/analytics-pro/checkout/page.tsx`
- `apps/marketing/app/store/add-ons/analytics-pro/page.tsx`
- `apps/marketing/app/store/add-ons/compliance-automation/checkout/page.tsx`
- `apps/marketing/app/store/add-ons/compliance-automation/page.tsx`
- `apps/marketing/app/store/add-ons/grant-contract-suite/page.tsx`
- `apps/marketing/app/store/ai-studio/page.tsx`
- `apps/marketing/app/store/checkout/cancel/page.tsx`
- `apps/marketing/app/store/compliance/ferpa/page.tsx`
- `apps/marketing/app/store/compliance/grant-reporting/page.tsx`
- `apps/marketing/app/store/compliance/page.tsx`
- `apps/marketing/app/store/compliance/wcag/page.tsx`
- `apps/marketing/app/store/demo/student/page.tsx`
- `apps/marketing/app/store/digital/page.tsx`
- `apps/marketing/app/store/guides/capital-readiness/enterprise/page.tsx`
- `apps/marketing/app/store/guides/capital-readiness/page.tsx`
- `apps/marketing/app/store/guides/capital-readiness/slides/page.tsx`
- `apps/marketing/app/store/guides/licensing/page.tsx`
- `apps/marketing/app/store/guides/page.tsx`
- `apps/marketing/app/store/licenses/enterprise-license/page.tsx`
- `apps/marketing/app/store/licenses/pro-license/page.tsx`
- `apps/marketing/app/store/licenses/school-license/page.tsx`
- `apps/marketing/app/store/licenses/source-use/page.tsx`
- `apps/marketing/app/store/licenses/starter-license/page.tsx`
- `apps/marketing/app/store/licenses/success/page.tsx`
- `apps/marketing/app/store/practice-tests/page.tsx`
- `apps/marketing/app/store/sam-gov-assistant/page.tsx`
- `apps/marketing/app/store/success/page.tsx`
- `apps/marketing/app/success-stories/page.tsx`
- `apps/marketing/app/support/page.tsx`
- `apps/marketing/app/tax-software/page.tsx`
- `apps/marketing/app/tenant-site/[[...slug]]/page.tsx`
- `apps/marketing/app/testimonials/page.tsx`
- `apps/marketing/app/testing/[provider]/page.tsx`
- `apps/marketing/app/testing/for-employers/page.tsx`
- `apps/marketing/app/testing/policies/page.tsx`
- `apps/marketing/app/transparency/page.tsx`
- `apps/marketing/app/tutoring/page.tsx`
- `apps/marketing/app/verification-approvals/page.tsx`
- `apps/marketing/app/verify/[certificateId]/page.tsx`
- `apps/marketing/app/videos/page.tsx`
- `apps/marketing/app/volunteer/page.tsx`
- `apps/marketing/app/webinars/page.tsx`
- `apps/marketing/app/white-label/page.tsx`
- `apps/marketing/app/wioa-eligibility/page.tsx`
- `apps/marketing/app/workforce-partners/page.tsx`
- `apps/marketing/app/writing-center/page.tsx`

### Critical findings

_None_

## Oversized hero / banner patterns

### `components/home/PlatformHubHero.tsx` (2)
- L28 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[440px]`
- L28 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[480px]`

### `apps/marketing/app/barber-and-beauty-apprenticeships/page.tsx` (1)
- L78 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[420px]`

### `apps/marketing/app/programs/barber-apprenticeship/page.tsx` (1)
- L231 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[420px]`

### `apps/marketing/app/programs/healthcare/page.tsx` (1)
- L83 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[430px]`

### `apps/marketing/app/testing/page.tsx` (1)
- L85 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[430px]`

### `components/programs/beauty/FeaturedHostPartners.tsx` (1)
- L63 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[420px]`


## Image performance

### `apps/marketing/app/store/licenses/school-license/page.tsx` (2)
- L17 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAA`
- L278 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image sizes="100vw" src={item.img} alt={item.title} fill`

### `apps/marketing/app/enroll/page.tsx` (1)
- L42 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAA`

### `apps/marketing/app/licenses/page.tsx` (1)
- L19 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image sizes="100vw"
          src="/images/pages/employer-hero.webp"
          alt="Platform Licens`

### `components/BeautyAboutSection.tsx` (1)
- L121 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image sizes="100vw"
                  src="/images/pages/barber-shop-interior.webp"
               `

### `components/BeautyBanner.tsx` (1)
- L140 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image sizes="100vw"
          src={slide.image}
          alt={slide.title}
          fill`

### `components/BeautyTestimonials.tsx` (1)
- L183 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image sizes="100vw"
                        src={t.image}
                        alt={t.name}
    `

### `components/ProgramCard.tsx` (1)
- L28 **fill-no-sizes**: next/image fill without sizes may over-fetch — `<Image sizes="100vw" src={image} alt={title} fill`

### `components/video/UltraVideoPlayer.tsx` (1)
- L63 **preload-full-hero**: preloadFull downloads the entire hero video on load — `preloadFull`


## Layout, text & contrast standard violations

### `apps/lms/app/lms/(app)/dashboard/page.tsx` (4)
- L461 **hero-gradient-overlay**: Gradient overlay near hero media — `HeroImage}
              alt="Students building career skills in class"
              fill
         `
- L548 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
              alt="Elevate students learning together"
              fill
              p`
- L555 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-blue-950/30" />
         `
- L671 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
             `

### `components/admin/EnrollmentVoucherPanel.tsx` (4)
- L237 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring`
- L251 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring`
- L266 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring`
- L288 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring`

### `apps/lms/app/apprentice/page.tsx` (3)
- L476 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
            alt={`${displayProgram} apprentice training`}
            fill
            pr`
- L483 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950 via-fuchsia-950/90 to-fuchsia-900/20" />
          `
- L898 **empty-next-image-alt**: Empty Next/Image alt text — `<Image
                  src={action.image}
                  alt=""`

### `components/beauty/ApprenticeshipHub.tsx` (3)
- L177 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <section className="relative bg-gradient-to`
- L384 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
                  alt="Barber apprenticeship training"
                  width={600}
    `
- L390 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                `

### `components/home/AnimatedHomePage.tsx` (3)
- L146 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center ov`
- L289 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-10 transition-opac`
- L336 **invisible-white-on-white**: Possible white text on white background — `bg-white rounded-2xl p-8 border border-slate-200 shadow-xl hover:shadow-2xl transition-shadow">
    `

### `apps/marketing/app/apply/employer/page.tsx` (2)
- L22 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <div className="relative h-[200px] sm:h-[260px] overflow-hidden bg-slate-900">
      `
- L24 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-orange-900" />
        <div`

### `apps/marketing/app/apprenticeships/host-shop/BrowseHostShopsClient.tsx` (2)
- L83 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage(shop)}
            alt={`${shop.name} apprenticeship host shop`}
            fill
        `
- L89 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div class`

### `apps/marketing/app/connect/page.tsx` (2)
- L402 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-sm text-slate-300 hover:bg-`
- L402 **low-contrast-neutral-on-light-reversed**: Low-contrast neutral text on a light surface — `className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-sm text-slate-300 hover:bg-`

### `apps/marketing/app/demos/page.tsx` (2)
- L128 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`
- L194 **invisible-white-on-white**: Possible white text on white background — `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-sha`

### `apps/marketing/app/store/licenses/success/page.tsx` (2)
- L95 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidde`
- L97 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        <div className="absolu`

### `apps/marketing/app/videos/page.tsx` (2)
- L77 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`
- L111 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 `

### `apps/lms/app/enrollment/page.tsx` (2)
- L49 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Banner */}
      <section className="relative w-full h-[40vh] min-h-[280px] max-h-[400px] overf`
- L60 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
     `

### `apps/lms/app/lms/page.tsx` (2)
- L15 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="relative w-full h-[45vh] min-h-[320px] max-h-[500px] overflow-hid`
- L26 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
     `

### `apps/lms/app/programs/hvac-technician/course/CanonicalHvacCourseHome.tsx` (2)
- L70 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
          alt="HVAC technician working with heating and cooling equipment"
          fill`
- L77 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
        `

### `apps/admin/app/applications/review/[id]/page.tsx` (2)
- L131 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
              alt="Admissions team reviewing applications"
              fill
           `
- L137 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-brand-blue-900/45" />
      `

### `apps/admin/app/studio/agents/AgentsClient.tsx` (2)
- L71 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
  `
- L81 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/60" />
        <div className="abso`

### `apps/admin/app/studio/memory/MemoryClient.tsx` (2)
- L62 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          `
- L72 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-teal-900/80 to-cyan-900/60" />
        <div className="absolu`

### `apps/admin/app/studio/settings/SettingsClient.tsx` (2)
- L147 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
          alt="System Settings"
          fill
          className="object-cover"
       `
- L154 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-900/80 to-gray-900/60" />
        <div className="absol`

### `apps/admin/app/studio/tasks/TasksClient.tsx` (2)
- L100 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      {!embedded ? (
        <div className="relative h-[220px] w-full overflow-hid`
- L103 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950 via-violet-950 to-slate-900" />
          <div clas`

### `apps/admin/app/studio/workflows/[id]/WorkflowDetailClient.tsx` (2)
- L214 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <div className="relative h-[200px] w-full overflow-hidden">
        <Image src="/imag`
- L218 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
     `

### `apps/admin/app/studio/workflows/new/PageClient.tsx` (2)
- L348 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <Image src="/imag`
- L352 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center">
          <div className="max-w-4xl mx-auto px-6 w-full">
     `

### `apps/admin/app/videos/page.tsx` (2)
- L66 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp" alt="Video management" fill priority sizes="100vw" className="object-cover opacity-35" />`
- L67 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent" />
            `

### `components/dashboards/StateAwareDashboard.tsx` (2)
- L61 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage = portalHeroImage(dominantAction.href);

  return (
    <div className="min-h-screen bg-wh`
- L108 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
                alt="Portal work and next-step guidance"
                fill
           `

### `components/home/Pathways.tsx` (2)
- L23 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 " />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white`
- L43 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 " />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white`

### `components/lms/LessonInlineInput.tsx` (2)
- L214 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 place`
- L232 **low-contrast-neutral-on-light**: Low-contrast neutral text on a light surface — `className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 place`

### `components/lms/LessonPlayer.tsx` (2)
- L487 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div `
- L588 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div classNam`

### `components/lms/MarcusInstructor.tsx` (2)
- L170 **low-contrast-neutral-on-light-reversed**: Low-contrast neutral text on a light surface — `className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"`
- L177 **low-contrast-neutral-on-light-reversed**: Low-contrast neutral text on a light surface — `className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"`

### `components/program-holder/ProgramHolderWorkspaceView.tsx` (2)
- L1362 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: st`
- L1400 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
        alt={`${title} dashboard`}
        fill
        priority
        sizes="100vw"
  `

### `components/programs/beauty/HostShopShowcase.tsx` (2)
- L411 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.3`
- L321 **empty-next-image-alt**: Empty Next/Image alt text — `<Image
                      src={image.backdropSrc}
                      alt=""`

### `components/programs/sections/CTASection.tsx` (2)
- L31 **hero-gradient-overlay**: Gradient overlay near hero media — `HeroVideo
            src={videoSrc}
            poster={videoPoster || '/images/og-default.jpg'}
  `
- L40 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/80" />
      </div>

      {/* Cont`



## Re-run

- `node scripts/audit-visual-layout.mjs`
- `node scripts/audit-image-assets.mjs`
- `pnpm audit:public-media-nav`
- `pnpm audit:hero-banners`
