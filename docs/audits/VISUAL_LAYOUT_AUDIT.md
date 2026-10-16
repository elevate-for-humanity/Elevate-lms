# Visual layout audit — active platform

Generated: 2026-10-16T14:30:10.705Z

This report scans the deployed monorepo app trees, not the legacy root `app/` tree.

## Coverage

| Service | TSX/JSX files scanned |
|---|---:|
| marketing | 1030 |
| lms | 464 |
| admin | 726 |
| shared | 1358 |

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Oversized heroes | 0 | 1 | 0 | 0 | 1 |
| Image load cost | 0 | 0 | 0 | 0 | 0 |
| Layout / text | 0 | 140 | 2 | 0 | 142 |

**Canonical Marketing hero:** `h-[38vh] min-h-[260px] max-h-[520px]` or a canonical hero renderer.

**Active Marketing pages with hero intent but no canonical hero marker:** 147

These are static-analysis candidates, not automatically confirmed defects. Hero gradients and overlaid text can be intentional and accessible. Every item requires classification and validation before it can be marked resolved.

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
- `apps/marketing/app/employers/post-job/page.tsx`
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
- `apps/marketing/app/host-shops/[slug]/page.tsx`
- `apps/marketing/app/implementation/page.tsx`
- `apps/marketing/app/inquiry/page.tsx`
- `apps/marketing/app/instructor-credentials/page.tsx`
- `apps/marketing/app/jobs/page.tsx`
- `apps/marketing/app/jri/page.tsx`
- `apps/marketing/app/legal-entity-structure/page.tsx`
- `apps/marketing/app/license/page.tsx`
- `apps/marketing/app/licenses/page.tsx`
- `apps/marketing/app/licensing/page.tsx`
- `apps/marketing/app/microclasses/page.tsx`
- `apps/marketing/app/mobile/page.tsx`
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
- `apps/marketing/app/partners/host-shops/page.tsx`
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

### `apps/marketing/app/tax-software/_components/TaxHero.tsx` (1)
- L21 **min-h-420-plus**: Large minimum height on hero-like container — `min-h-[500px]`


## Image performance

_None_


## Layout, text & contrast standard violations — complete line-by-line inventory

### `apps/lms/app/lms/(app)/dashboard/page.tsx` (4)
- L463 **hero-gradient-overlay**: Gradient overlay near hero media — `HeroImage}
              alt="Students building career skills in class"
              fill
         `
- L550 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
              alt="Elevate students learning together"
              fill
              p`
- L557 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-blue-950/30" />
         `
- L673 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
             `

### `apps/lms/app/apprentice/page.tsx` (3)
- L478 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
            alt={`${displayProgram} apprentice training`}
            fill
            pr`
- L485 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950 via-fuchsia-950/90 to-fuchsia-900/20" />
          `
- L901 **empty-next-image-alt**: Empty Next/Image alt text — `<Image
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
- L23 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              <`
- L43 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              <`

### `components/lms/LessonPlayer.tsx` (2)
- L487 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div `
- L588 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div classNam`

### `components/programs/beauty/HostShopShowcase.tsx` (2)
- L407 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.3`
- L317 **empty-next-image-alt**: Empty Next/Image alt text — `<Image
                      src={image.backdropSrc}
                      alt=""`

### `components/security/ProtectedImage.tsx` (2)
- L52 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 z-10"
        style={{
          background:
            'repeating-linear-gradient`
- L91 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="round`

### `components/studio/MediaStudioPanel.tsx` (2)
- L155 **hero-gradient-overlay**: Gradient overlay near hero media — `heroAssets = assets.filter((asset) => ['image', 'video'].includes(asset.type) && assetUrl(asset));

`
- L595 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
        )}`

### `components/tenant/PublicTenantSite.tsx` (2)
- L205 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
                      alt={config.homepage.heroImageAlt || config.homepage.heroTitle}
   `
- L207 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 h-full w-full object-cover"
                    />
                    <div classNa`

### `components/testing/TestingCenter.tsx` (2)
- L479 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
          alt={provider.name}
          fill
          className="object-cover" sizes="10`
- L715 **hero-gradient-overlay**: Gradient overlay near hero media — `HeroVideoReady(false)}
            className={`absolute inset-0 h-full w-full object-cover transitio`

### `components/video/UltraVideoPlayer.tsx` (2)
- L542 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-black/60 flex items-center justify-center">
          <Loader2 className="w-12 h`
- L566 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
   `

### `apps/marketing/app/(marketing)/paris-ai/page.tsx` (1)
- L441 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl tran`

### `apps/marketing/app/(marketing)/students/page.tsx` (1)
- L173 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to`

### `apps/marketing/app/ai/job-match/page.tsx` (1)
- L13 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-b`

### `apps/marketing/app/ai/page.tsx` (1)
- L133 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to`

### `apps/marketing/app/ai/paris/page.tsx` (1)
- L99 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="relative overflow-hidden bg-gradient-to`

### `apps/marketing/app/barber-beauty-network/page.tsx` (1)
- L32 **hero-gradient-overlay**: Gradient overlay near hero media — `HeroVideo src="/videos/partners/kountry-kutz/shop-tour.mp4" poster="/images/partners/kountry-kutz/in`

### `apps/marketing/app/blog/loading.tsx` (1)
- L6 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Skeleton */}
      <div className="bg-gradient-to`

### `apps/marketing/app/community/page.tsx` (1)
- L7 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/55" /><div clas`

### `apps/marketing/app/demos/page.tsx` (1)
- L128 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/demos/vr-funding/VRFundingDemoClient.tsx` (1)
- L256 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <section className="bg-gradient-to`

### `apps/marketing/app/directory/page.tsx` (1)
- L141 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/events/page.tsx` (1)
- L63 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/founder/page.tsx` (1)
- L33 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-white/95 flex items-center px-6">
          <div className="max-w-6xl mx-auto w-`

### `apps/marketing/app/fssa/page.tsx` (1)
- L23 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/help/account/page.tsx` (1)
- L25 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/help/page.tsx` (1)
- L41 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/help/technical/page.tsx` (1)
- L25 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/help/tutorials/page.tsx` (1)
- L27 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/inquiry/page.tsx` (1)
- L49 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/news/page.tsx` (1)
- L54 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/onboarding/employer/hiring-needs/page.tsx` (1)
- L164 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="bg-gradient-to`

### `apps/marketing/app/partnerships/page.tsx` (1)
- L31 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/platform/employer-portal/page.tsx` (1)
- L73 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
        <section className="relative bg-gradient-to`

### `apps/marketing/app/platform/enterprise/page.tsx` (1)
- L66 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">`

### `apps/marketing/app/platform/pricing/page.tsx` (1)
- L80 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/platform/standards/page.tsx` (1)
- L200 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/platform/student-portal/page.tsx` (1)
- L74 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
        <section className="relative bg-gradient-to`

### `apps/marketing/app/pricing/page.tsx` (1)
- L89 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx` (1)
- L515 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="bg-`

### `apps/marketing/app/programs/barber-apprenticeship/orientation/OrientationClient.tsx` (1)
- L209 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 hover:bg-black/40 trans`

### `apps/marketing/app/programs/cosmetology-apprenticeship/orientation/page.tsx` (1)
- L170 **hero-gradient-overlay**: Gradient overlay near hero media — `hero.webp"
          alt="Cosmetology apprenticeship salon training"
          fill
          priori`

### `apps/marketing/app/programs/healthcare/HealthcarePageClient.tsx` (1)
- L39 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-cover brightness-110"
          autoPlayOnMount
          play`

### `apps/marketing/app/programs/skilled-trades/SkilledTradesPageClient.tsx` (1)
- L35 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-cover brightness-110"
          autoPlayOnMount
          play`

### `apps/marketing/app/resources/page.tsx` (1)
- L74 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/marketing/app/scholarships/page.tsx` (1)
- L24 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
        <di`

### `apps/marketing/app/staff/attendance/export/page.tsx` (1)
- L55 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="bg-gradient-to`

### `apps/marketing/app/staff/page.tsx` (1)
- L94 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-white/95 flex flex-col justify-end pb-8 px-6 max-w-6xl mx-auto w-full">
        `

### `apps/marketing/app/store/compliance/page.tsx` (1)
- L65 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-slate-950/65" />
        <div className="absolute inset-0 flex items-center">
  `

### `apps/marketing/app/success-stories/page.tsx` (1)
- L115 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center" aria-hidden="true">
                          <sp`

### `apps/marketing/app/support/page.tsx` (1)
- L94 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/lms/app/ai/page.tsx` (1)
- L143 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to`

### `apps/lms/app/apprentice/policies/payments/page.tsx` (1)
- L46 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-amber-950 via-amber-950/85 to-amber-950/20" />
        <div c`

### `apps/lms/app/apprentice/policies/timeclock/page.tsx` (1)
- L45 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20" />
        <div c`

### `apps/lms/app/apprentice/transfer-hours/page.tsx` (1)
- L75 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Banner */}
      <div className="bg-gradient-to`

### `apps/lms/app/apprentice/workbook/page.tsx` (1)
- L54 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Banner */}
      <div className="bg-gradient-to`

### `apps/lms/app/careers/jobs/page.tsx` (1)
- L35 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/lms/app/employer/page.tsx` (1)
- L6 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="bg-gradient-to`

### `apps/lms/app/host-shops/[shopId]/page.tsx` (1)
- L187 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden`

### `apps/lms/app/host-shops/page.tsx` (1)
- L115 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="bg-gradient-to`

### `apps/lms/app/lms/(app)/collaborate/meetings/page.tsx` (1)
- L72 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="bg-gradient-to`

### `apps/lms/app/pathways/outcomes/page.tsx` (1)
- L21 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/lms/app/program-holder/community/page.tsx` (1)
- L56 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-blue-950/90 to-violet-950/55" />
        `

### `apps/lms/app/programs/[program]/courses/page.tsx` (1)
- L102 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="text-c`

### `apps/admin/app/blog/management/loading.tsx` (1)
- L6 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Skeleton */}
      <div className="bg-gradient-to`

### `apps/admin/app/home/page.tsx` (1)
- L98 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <section className="relative h-72 sm:h-80 w-full overflow-hidden">
        <I`

### `apps/admin/app/hr/employees/[id]/page.tsx` (1)
- L50 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 m-auto h-9 w-9" />}
            </div>
            <div><p className="text-xs font-`

### `apps/admin/app/organization/page.tsx` (1)
- L36 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/admin/app/organization/profile/page.tsx` (1)
- L13 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `apps/admin/app/staff-portal/attendance/export/page.tsx` (1)
- L52 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Section */}
      <div className="bg-gradient-to`

### `apps/admin/app/staff-portal/page.tsx` (1)
- L97 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 mx-auto flex w-full max-w-6xl bg-white/95 flex-col justify-end px-6 pb-8">
        `

### `apps/admin/app/studio/builds/BuildsClient.tsx` (1)
- L83 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-900/60" />
        <div className="abs`

### `apps/admin/app/studio/deployments/DeploymentsClient.tsx` (1)
- L71 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-cyan-900/80 to-blue-900/60" />
        <div className="absolu`

### `apps/admin/app/studio/workflows/WorkflowsClient.tsx` (1)
- L197 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-violet-900/60" />
      <div className="abso`

### `components/AvatarChatBar.tsx` (1)
- L261 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
 `

### `components/PageAvatar.tsx` (1)
- L117 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-cover" src={videoSrc} playsInline preload="metadata" />
      `

### `components/SideAvatarGuide.tsx` (1)
- L249 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center">
                <button
                  onClic`

### `components/SocialMediaHighlight.tsx` (1)
- L21 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px`

### `components/barber/BarberApprenticeshipDashboard.tsx` (1)
- L109 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="relative overflow-hidden bg-black text-white">
        <div class`

### `components/content/ProgramPageTemplate.tsx` (1)
- L38 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero */}
      <section className="bg-gradient-to`

### `components/course/CoursePlayer.tsx` (1)
- L73 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center">
            <div className="text-white`

### `components/demo/InteractiveDemoPlayer.tsx` (1)
- L215 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6">
            <p classNam`

### `components/dev-studio/live-canvas/BeforePublishModal.tsx` (1)
- L415 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center">
            <span className="text-3xl`

### `components/dev-studio/live-canvas/CenterPanel.tsx` (1)
- L248 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-20 h-20 animate-spin text-brand-red-600 mx-auto" />
      </div>
      <p classNa`

### `components/gamification/AchievementBadges.tsx` (1)
- L116 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl text-`

### `components/home/AnimatedHomePage.tsx` (1)
- L289 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-10 transition-opac`

### `components/marketing/VideoStrip.tsx` (1)
- L54 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex i`

### `components/mobile/MobileVideoPlayer.tsx` (1)
- L129 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/80 via-black/30 to-black/`

### `components/portal/PortalPageLayout.tsx` (1)
- L52 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-cover"
        />
      </section>

      {/* Below-hero ident`

### `components/program-holder/ProgramHolderWorkspaceView.tsx` (1)
- L1406 **hero-gradient-overlay**: Gradient overlay near hero media — `heroImage}
        alt={`${title} dashboard`}
        fill
        priority
        sizes="100vw"
  `

### `components/programs/ProgramCategoryPage.tsx` (1)
- L100 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 w-full h-full object-contain"
        />
      </section>

      {/* Below-hero ide`

### `components/programs/sections/CTASection.tsx` (1)
- L31 **hero-gradient-overlay**: Gradient overlay near hero media — `HeroVideo
            src={videoSrc}
            poster={videoPoster || '/images/og-default.jpg'}
  `

### `components/quiz/ProgramFinderQuiz.tsx` (1)
- L446 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-black/45" />
                </div>
                <div className="absolute bot`

### `components/store/AppScreenshot.tsx` (1)
- L419 **hero-gradient-overlay**: Gradient overlay near hero media — `Hero Block */}
            <div className="bg-gradient-to`

### `components/store/ProductPage.tsx` (1)
- L254 **hero-text-overlay**: Possible headline/text overlaid on hero media — `absolute inset-0 bg-slate-900 flex items-center justify-center">
                      <Play classNa`



## Re-run

- `node scripts/audit-visual-layout.mjs`
- `node scripts/audit-image-assets.mjs`
- `pnpm audit:public-media-nav`
- `pnpm audit:hero-banners`
