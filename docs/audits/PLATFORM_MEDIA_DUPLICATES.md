# Platform media duplicate audit

Generated: 2026-08-12T16:51:10.776Z

## Summary

- Routes scanned: **1497**
- Duplicate non-brand media inside a route-owned page/component: **0**
- Route-owned hero images reused across active routes: **9**
- Duplicate poster/image entries in canonical hero registry: **0**
- Shared-component duplicate candidates (advisory): **3**
- Other cross-route image reuse (advisory): **108**

## Blocking: duplicates inside one route

None.

## Blocking: route-owned hero images reused across routes

| Asset | Routes |
| --- | --- |
| /images/pages/admin-analytics-hero.webp | marketing:/online-apps<br>marketing:/store/add-ons/analytics-pro |
| /images/pages/admin-compliance-agreements-hero.webp | marketing:/compliance/competency-verification/barber<br>marketing:/store/compliance/wcag |
| /images/pages/admin-compliance-audit-hero.jpg | marketing:/store/compliance<br>marketing:/store/compliance/wcag |
| /images/pages/admin-dev-studio-detail.webp | admin:/studio/workflows/[id]<br>admin:/studio/workflows/new |
| /images/pages/admin-employers-hero.webp | lms:/host-shop/dashboard/board<br>marketing:/partners/host-shops |
| /images/pages/admin-licensing-hero.webp | marketing:/store/guides<br>marketing:/store/licenses |
| /images/pages/store-checkout-cancel-hero.webp | marketing:/store/checkout/cancel<br>marketing:/store/licenses/source-use |
| /images/pages/store-guides-hero.webp | marketing:/store/guides<br>marketing:/store/guides/licensing |
| /images/pages/store-licensing-hero.jpg | marketing:/store<br>marketing:/store/guides/licensing |

## Blocking: duplicate canonical hero-registry poster/images

None.

## Advisory: duplicate assets inside shared component trees

| App | Route | Asset | Locations |
| --- | --- | --- | --- |
| marketing | /barber-and-beauty-apprenticeships | /images/beauty/barber-hero.webp | components/beauty/ApprenticeshipHub.tsx:31<br>components/beauty/ApprenticeshipHub.tsx:373 |
| marketing | /barber-and-beauty-apprenticeships | /images/beauty/cosmetology-hero.webp | components/beauty/ApprenticeshipHub.tsx:51<br>components/beauty/ApprenticeshipHub.tsx:117 |
| admin | /dashboard | /images/pages/business-meeting.webp | components/admin/dashboard/DashboardShell.tsx:181<br>components/admin/dashboard/DashboardShell.tsx:502 |

## Advisory: other image reuse across routes

| Asset | Routes |
| --- | --- |
| /images/pages/nail-technician.webp | lms:/apprentice/billing<br>marketing:/partners/host-shops<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/nail-technician-apprenticeship/apply |
| /images/pages/about-career-training.webp | lms:/parent-portal<br>lms:/parent-portal/dashboard<br>marketing:/call-now<br>marketing:/email<br>marketing:/onboarding<br>marketing:/programs/barber-apprenticeship/orientation<br>marketing:/transparency<br>marketing:/workforce-partners<br>marketing:/writing-center |
| /images/beauty/esthetician.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/apprenticeship-structure.webp | admin:/dashboard<br>lms:/apprentice<br>lms:/host-shop/dashboard/board<br>lms:/parent-portal<br>marketing:/compliance/apprenticeship-structure<br>marketing:/hire-graduates<br>marketing:/online-apps<br>marketing:/partners/host-shops |
| /images/pages/barber-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/cosmetology-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/culinary.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/electrical.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/plumbing-pipes.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/training-classroom.webp | admin:/dashboard<br>lms:/apprentice<br>lms:/host-shop/dashboard/board<br>lms:/lms/dashboard<br>lms:/lms/quizzes<br>lms:/parent-portal<br>marketing:/call-now<br>marketing:/online-apps |
| /images/pages/career-services-page-1.webp | marketing:/career-services<br>marketing:/employment-support<br>marketing:/how-it-works<br>marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements<br>marketing:/services<br>marketing:/student-support |
| /images/pages/about-supportive-services.webp | lms:/parent-portal<br>marketing:/<br>marketing:/call-now<br>marketing:/email<br>marketing:/employment-support<br>marketing:/platform/partner-portal |
| /images/pages/business-meeting.webp | admin:/dashboard<br>lms:/host-shop/dashboard/board<br>lms:/parent-portal<br>marketing:/about/partners<br>marketing:/call-now<br>marketing:/online-apps |
| /images/pages/hvac-technician.webp | marketing:/<br>marketing:/employment-support<br>marketing:/programs/hvac-technician/curriculum<br>marketing:/store/courses/hvac-technician-course-license<br>marketing:/tutoring<br>marketing:/workone-partner-packet |
| /images/heroes/hero-homepage.webp | marketing:/barber-and-beauty-apprenticeships<br>marketing:/career-training/[state]<br>marketing:/certificates/verify/[certificateId]<br>marketing:/community-services/[state] |
| /images/pages/adult-learner.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements<br>marketing:/store/compliance/ferpa<br>marketing:/store/compliance/wioa |
| /images/pages/barber-training.webp | admin:/dashboard<br>lms:/host-shop/dashboard/board<br>marketing:/online-apps<br>marketing:/partners/host-shops |
| /images/pages/career-services-page-10.webp | marketing:/career-services/contact<br>marketing:/onboarding/learner<br>marketing:/services<br>marketing:/writing-center |
| /images/pages/career-services-page-2.jpg | marketing:/careers<br>marketing:/employment-support<br>marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements |
| /images/pages/comp-home-highlight-success.webp | lms:/apprentice<br>lms:/host-shop/dashboard/board<br>lms:/lms/dashboard<br>lms:/programs/hvac-technician/course |
| /images/pages/healthcare-grad.jpg | marketing:/how-it-works<br>marketing:/services<br>marketing:/success-stories<br>marketing:/transparency |
| /images/business/office-admin.webp | marketing:/<br>marketing:/programs/financial-literacy<br>marketing:/writing-center |
| /images/pages/about-career-pathways.webp | marketing:/store/licenses/school-license<br>marketing:/transparency<br>marketing:/writing-center |
| /images/pages/about-funding-nav.webp | marketing:/onboarding/learner/agreements<br>marketing:/transparency<br>marketing:/writing-center |
| /images/pages/admin-dev-studio-detail.webp | admin:/studio/deployments<br>admin:/studio/workflows/[id]<br>admin:/studio/workflows/new |
| /images/pages/admin-email-analytics-detail.webp | admin:/email-marketing/analytics<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/practice-tests |
| /images/pages/barber-apprenticeship-hero.jpg | admin:/dashboard<br>lms:/host-shop/dashboard/board<br>marketing:/ |
| /images/pages/career-counseling-page-1.webp | marketing:/career-counseling<br>marketing:/funding/wioa<br>marketing:/how-it-works |
| /images/pages/comp-home-pathways-support.webp | marketing:/services<br>marketing:/store/add-ons<br>marketing:/transparency |
| /images/pages/employer-page-1.webp | lms:/employer/hours<br>marketing:/hire-graduates<br>marketing:/platform/employer-portal |
| /images/pages/for-employers-page-1.webp | marketing:/<br>marketing:/hire-graduates<br>marketing:/ojt-and-funding |
| /images/pages/homepage-why-elevate.webp | marketing:/services<br>marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/pages/lms-page-1.webp | lms:/lms<br>lms:/lms/learning-paths<br>marketing:/tutoring |
| /images/pages/orientation-page-1.webp | lms:/enrollment/orientation<br>lms:/orientation/competency-test<br>marketing:/student-support/schedule |
| /images/pages/orientation-page-2.webp | lms:/orientation/competency-test<br>lms:/orientation/schedule<br>marketing:/training/certifications |
| /images/pages/platform-page-1.webp | marketing:/platform/[slug]<br>marketing:/platform/sponsors<br>marketing:/platform/student-portal/handbook |
| /images/pages/store-compliance-wioa-detail.webp | marketing:/store/compliance<br>marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| /images/pages/workforce-training.webp | marketing:/call-now<br>marketing:/store/compliance/grant-reporting<br>marketing:/store/compliance/wioa |
| /images/beauty/esthetics-hero.webp | marketing:/barber-and-beauty-apprenticeships<br>marketing:/partners/host-shops |
| /images/business/professional-2.jpg | marketing:/docs<br>marketing:/writing-center |
| /images/funding/funding-jri-program-v2.jpg | marketing:/funding/job-ready-indy<br>marketing:/funding/jri |
| /images/heroes/lms-analytics.webp | admin:/dashboard<br>lms:/host-shop/dashboard/board |
| /images/leslie-wafford.webp | marketing:/about/team/leslie-wafford<br>marketing:/about/team/sharon-douglass |
| /images/pages/admin-analytics-hero.webp | marketing:/online-apps<br>marketing:/store/add-ons/analytics-pro |
| /images/pages/admin-compliance-agreements-hero.webp | marketing:/compliance/competency-verification/barber<br>marketing:/store/compliance/wcag |
| /images/pages/admin-compliance-audit-hero.jpg | marketing:/store/compliance<br>marketing:/store/compliance/wcag |
| /images/pages/admin-compliance-deletions-detail.webp | admin:/compliance/deletions<br>marketing:/store/compliance/grant-reporting |
| /images/pages/admin-compliance-exports-detail.webp | admin:/compliance/exports<br>marketing:/store/compliance/grant-reporting |
| /images/pages/admin-email-campaigns-new-detail.webp | admin:/email-marketing/campaigns/new<br>marketing:/blog/[slug] |
| /images/pages/admin-employers-hero.webp | lms:/host-shop/dashboard/board<br>marketing:/partners/host-shops |
| /images/pages/admin-grants-submissions-detail.webp | admin:/grants/submissions<br>marketing:/store/dev-studio |
| /images/pages/admin-grants-workflow-detail.webp | admin:/grants/workflow<br>marketing:/store/workflow-studio |
| /images/pages/admin-licensing-hero.webp | marketing:/store/guides<br>marketing:/store/licenses |
| /images/pages/admin/staff-portal-page-1.webp | admin:/staff-portal<br>marketing:/staff |
| /images/pages/apprenticeships-page-1.webp | marketing:/<br>marketing:/about |
| /images/pages/banking-page-1.webp | marketing:/banking<br>marketing:/banking/direct-deposit |
| /images/pages/barber-shop-interior.webp | lms:/host-shop/dashboard/board<br>marketing:/booth-rental/apply |
| /images/pages/booking-page-1.webp | marketing:/booking<br>marketing:/booking/enrollment |
| /images/pages/calendar-page-1.webp | marketing:/calendar<br>marketing:/tutoring |
| /images/pages/card-wioa.webp | lms:/parent-portal<br>marketing:/wioa-eligibility |
| /images/pages/career-counseling.jpg | lms:/lms/dashboard<br>marketing:/tutoring |
| /images/pages/career-services-page-3.jpg | marketing:/careers<br>marketing:/employment-support |
| /images/pages/career-services-page-4.webp | marketing:/careers<br>marketing:/employment-support |
| /images/pages/certificates-page-1.webp | marketing:/certificates<br>marketing:/certificates/verify/[certificateId] |
| /images/pages/community-page-1.jpg | marketing:/alumni<br>marketing:/community-services |
| /images/pages/community-page-2.jpg | marketing:/alumni<br>marketing:/community-services |
| /images/pages/comp-state-career-hero.webp | marketing:/career-training/[state]<br>marketing:/community-services/[state] |
| /images/pages/compliance-page-1.webp | marketing:/store/compliance/wcag<br>marketing:/store/compliance/wioa |
| /images/pages/cosmetology.webp | marketing:/partners/host-shops<br>marketing:/programs/cosmetology-apprenticeship/apply |
| /images/pages/counselor-session.webp | marketing:/about/team<br>marketing:/career-services |
| /images/pages/course-create-hero.webp | marketing:/store/courses<br>marketing:/store/practice-tests |
| /images/pages/ferpa-page-1.jpg | marketing:/call-now<br>marketing:/store/compliance/ferpa |
| /images/pages/funding-hero.webp | marketing:/<br>marketing:/funding/grant-programs |
| /images/pages/funding-page-1.webp | marketing:/banking<br>marketing:/store/compliance/grant-reporting |
| /images/pages/funding-page-3.webp | marketing:/funding<br>marketing:/funding/how-it-works |
| /images/pages/government-1.webp | marketing:/agencies<br>marketing:/for-agencies |
| /images/pages/graduation-ceremony.webp | marketing:/store/compliance/wioa<br>marketing:/testimonials |
| /images/pages/homepage-why-elevate.jpg | marketing:/services<br>marketing:/wioa-eligibility |
| /images/pages/hp-wioa-real.webp | marketing:/scholarships<br>marketing:/wioa-eligibility |
| /images/pages/job-placement.webp | marketing:/employment-support<br>marketing:/store/compliance/wioa |
| /images/pages/learner-page-1.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements |
| /images/pages/mobile-app-page-1.webp | marketing:/mobile<br>marketing:/mobile-app |
| /images/pages/onboarding-page-1.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/handbook |
| /images/pages/onboarding-page-2.webp | marketing:/onboarding<br>marketing:/onboarding/learner |
| /images/pages/pathways-page-6.webp | marketing:/banking<br>marketing:/career-services/resume-building |
| /images/pages/platform-page-10.webp | marketing:/platform<br>marketing:/platform/sponsors |
| /images/pages/platform-page-12.webp | marketing:/platform<br>marketing:/store/apps/website-builder |
| /images/pages/platform-page-3.webp | marketing:/platform<br>marketing:/store/guides/licensing |
| /images/pages/platform-page-4.webp | lms:/parent-portal<br>marketing:/platform |
| /images/pages/platform-page-5.webp | marketing:/platform<br>marketing:/store/guides/licensing |
| /images/pages/program-holder-page-1.webp | marketing:/program-holder/dashboard<br>marketing:/programs/esthetician-apprenticeship/apply |
| /images/pages/project-management.webp | admin:/blog/management/[slug]<br>marketing:/store/guides/licensing |
| /images/pages/shop-hero.webp | lms:/host-shop/dashboard/board<br>marketing:/ |
| /images/pages/social-media-1.webp | admin:/blog/management/[slug]<br>marketing:/blog/[slug] |
| /images/pages/store-checkout-cancel-hero.webp | marketing:/store/checkout/cancel<br>marketing:/store/licenses/source-use |
| /images/pages/store-guides-hero.webp | marketing:/store/guides<br>marketing:/store/guides/licensing |
| /images/pages/store-licensing-hero.jpg | marketing:/store<br>marketing:/store/guides/licensing |
| /images/pages/store-recommendations.webp | marketing:/services<br>marketing:/store/compliance/wioa |
| /images/pages/student-portal-page-1.webp | marketing:/platform/student-portal<br>marketing:/student-support |
| /images/pages/student-portal-page-3.webp | marketing:/platform/student-portal<br>marketing:/student-support |
| /images/pages/student-support-page-1.webp | marketing:/employment-support<br>marketing:/student-support |
| /images/pages/team-collaboration.webp | marketing:/about/team<br>marketing:/career-services |
| /images/pages/tech-classroom.webp | marketing:/store/compliance/wcag<br>marketing:/testing |
| /images/pages/wioa-meeting.webp | marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| /images/pages/workforce-board-page-1.webp | marketing:/workforce-board<br>marketing:/workforce-board/employment |
| /images/pages/writing-center-page-1.jpg | marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/pages/writing-center.jpg | marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/team/elizabeth-greene.webp | marketing:/about<br>marketing:/about/team |

> Shared logos, icons, badges, seals, partner/sponsor assets, credentials, avatars, headshots, placeholders, QR codes, and watermarks are excluded. Shared category videos are reported by the existing hero audit but are not treated as duplicate-image failures here.
