# Platform media duplicate audit

Generated: 2026-08-15T18:34:46.756Z

## Summary

- Routes scanned: **1447**
- Duplicate non-brand pictures inside a route-owned page/component: **0**
- Route-owned hero pictures reused across active routes: **0**
- Duplicate poster/image content in canonical hero registry: **0**
- Shared-component duplicate candidates (advisory): **3**
- Other cross-route picture reuse (advisory): **91**
- Different filenames containing identical image bytes: **24**

## Blocking: duplicate pictures inside one route

None.

## Blocking: route-owned hero pictures reused across routes

None.

## Blocking: duplicate canonical hero-registry poster/images

None.

## Advisory: duplicate pictures inside shared component trees

| App | Route | Representative asset | Binary aliases | Locations |
| --- | --- | --- | --- | --- |
| marketing | /barber-and-beauty-apprenticeships | /images/beauty/barber-hero.webp | /images/beauty/barber-hero.webp | components/beauty/ApprenticeshipHub.tsx:31<br>components/beauty/ApprenticeshipHub.tsx:373 |
| marketing | /barber-and-beauty-apprenticeships | /images/beauty/cosmetology-hero.webp | /images/beauty/cosmetology-hero.webp<br>/images/beauty/esthetics-hero.webp<br>/images/beauty/nails-hero.webp | components/beauty/ApprenticeshipHub.tsx:51<br>components/beauty/ApprenticeshipHub.tsx:70<br>components/beauty/ApprenticeshipHub.tsx:89<br>components/beauty/ApprenticeshipHub.tsx:117 |
| admin | /dashboard | /images/pages/business-meeting.webp | /images/pages/business-meeting.webp | components/admin/dashboard/DashboardShell.tsx:181<br>components/admin/dashboard/DashboardShell.tsx:502 |

## Advisory: other picture reuse across routes

| Representative asset | Binary aliases | Routes |
| --- | --- | --- |
| /images/beauty/cosmetology-hero.webp | /images/beauty/cosmetology-hero.webp<br>/images/beauty/esthetician.jpg<br>/images/beauty/esthetician.webp<br>/images/beauty/esthetics-hero.webp<br>/images/beauty/nails-hero.webp | lms:/apprentice/billing<br>marketing:/barber-and-beauty-apprenticeships<br>marketing:/partners/host-shops<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/esthetician-apprenticeship/apply |
| /images/pages/about-hero.webp | /images/pages/about-hero.webp<br>/images/pages/business-meeting.webp<br>/images/pages/staff-page-13.jpg<br>/images/pages/success-stories-hero.jpg<br>/images/pages/team-collaboration.webp | admin:/dashboard<br>admin:/staff-portal/settings<br>lms:/host-shop/dashboard/board<br>lms:/lms/dashboard<br>lms:/parent-portal<br>marketing:/about/partners<br>marketing:/about/team<br>marketing:/call-now<br>marketing:/career-services<br>marketing:/online-apps<br>marketing:/success-stories |
| /images/pages/admin-analytics-hero.webp | /images/pages/admin-analytics-hero.webp<br>/images/pages/admin-email-campaigns-new-detail.webp<br>/images/pages/banking-page-1.webp<br>/images/pages/certificates-page-1.webp<br>/images/pages/compliance-page-1.webp<br>/images/pages/program-holder-page-1.webp<br>/images/pages/store-recommendations.webp | admin:/email-marketing/campaigns/new<br>marketing:/banking<br>marketing:/blog/[slug]<br>marketing:/certificates<br>marketing:/certificates/verify/[certificateId]<br>marketing:/programs/esthetician-apprenticeship/apply<br>marketing:/services<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag<br>marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| /images/pages/about-career-training.webp | /images/pages/about-career-training.webp<br>/images/pages/admin-compliance-exports-detail.webp<br>/images/pages/programs-catalog-hero.webp | admin:/compliance/exports<br>marketing:/calendar<br>marketing:/call-now<br>marketing:/email<br>marketing:/onboarding<br>marketing:/programs/barber-apprenticeship/orientation<br>marketing:/store/compliance/grant-reporting<br>marketing:/transparency<br>marketing:/workforce-partners<br>marketing:/writing-center |
| /images/pages/nail-technician.webp | /images/pages/nail-technician.webp | lms:/apprentice/billing<br>marketing:/partners/host-shops<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/nail-technician-apprenticeship/apply |
| /images/pages/admin-applications-hero.webp | /images/pages/admin-applications-hero.webp<br>/images/pages/culinary.webp | admin:/applications/review/[id]<br>lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/barber-hero.webp | /images/pages/barber-hero.webp<br>/images/pages/programs-hvac-apply-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/hvac-technician/apply |
| /images/pages/plumbing-pipes.webp | /images/pages/plumbing-pipes.webp<br>/images/pages/plumbing.jpg | lms:/apprentice/billing<br>marketing:/platform/workforce-analytics<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/accessibility-hero.jpg | /images/pages/accessibility-hero.jpg<br>/images/pages/admin-compliance-audit-hero.jpg<br>/images/pages/admin-compliance-audit-hero.webp<br>/images/pages/admin-email-marketing-d1.jpg<br>/images/pages/comp-highlights-team.jpg<br>/images/pages/contact-hero.jpg | admin:/email-marketing<br>lms:/lms/dashboard<br>marketing:/accessibility<br>marketing:/call-now<br>marketing:/careers<br>marketing:/store/compliance<br>marketing:/store/compliance/ferpa<br>marketing:/store/compliance/wcag |
| /images/pages/admin-compliance-deletions-detail.webp | /images/pages/admin-compliance-deletions-detail.webp<br>/images/pages/admin-email-marketing-d2.webp<br>/images/pages/admin/staff-portal-page-1.webp<br>/images/pages/events-page-1.webp<br>/images/pages/shop-hero.webp | admin:/compliance/deletions<br>admin:/email-marketing<br>admin:/staff-portal<br>lms:/host-shop/dashboard/board<br>marketing:/<br>marketing:/calendar<br>marketing:/staff<br>marketing:/store/compliance/grant-reporting |
| /images/pages/admin-email-analytics-detail.webp | /images/pages/admin-email-analytics-detail.webp<br>/images/pages/admin-ferpa-training-hero.webp<br>/images/pages/admin-videos-upload-hero.webp<br>/images/pages/admin-wioa-hero.webp<br>/images/pages/calendar-page-1.webp<br>/images/pages/how-it-works-hero.webp | admin:/email-marketing/analytics<br>admin:/videos/upload<br>marketing:/calendar<br>marketing:/call-now<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/ferpa<br>marketing:/tutoring<br>marketing:/workforce-board |
| /images/pages/cosmetology-hero.webp | /images/pages/cosmetology-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/electrical.webp | /images/pages/electrical.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/training-classroom.webp | /images/pages/training-classroom.webp | admin:/dashboard<br>lms:/apprentice<br>lms:/host-shop/dashboard/board<br>lms:/lms/dashboard<br>lms:/lms/quizzes<br>lms:/parent-portal<br>marketing:/call-now<br>marketing:/online-apps |
| /images/pages/apprenticeship-structure.webp | /images/pages/apprenticeship-structure.webp | admin:/dashboard<br>lms:/apprentice<br>lms:/parent-portal<br>marketing:/compliance/apprenticeship-structure<br>marketing:/hire-graduates<br>marketing:/online-apps<br>marketing:/partners/host-shops |
| /images/pages/career-services-page-1.webp | /images/pages/career-services-page-1.webp | marketing:/career-services<br>marketing:/employment-support<br>marketing:/how-it-works<br>marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements<br>marketing:/services<br>marketing:/student-support |
| /images/pages/about-supportive-services.webp | /images/pages/about-supportive-services.webp | lms:/parent-portal<br>marketing:/<br>marketing:/email<br>marketing:/employment-support<br>marketing:/platform/partner-portal<br>marketing:/wioa-eligibility |
| /images/pages/hvac-technician.webp | /images/pages/hvac-technician.webp | marketing:/<br>marketing:/employment-support<br>marketing:/programs/hvac-technician/curriculum<br>marketing:/store/courses/hvac-technician-course-license<br>marketing:/tutoring<br>marketing:/workone-partner-packet |
| /images/pages/admin-analytics-learning-hero.webp | /images/pages/admin-analytics-learning-hero.webp<br>/images/pages/admin-compliance-agreements-hero.webp<br>/images/pages/admin-signatures-hero.webp<br>/images/pages/compliance-page-2.webp | admin:/signatures<br>lms:/parent-portal<br>marketing:/compliance/competency-verification<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag |
| /images/pages/admin-email-automation-new-d2.webp | /images/pages/admin-email-automation-new-d2.webp<br>/images/pages/approvals-page-1.webp<br>/images/pages/competency-test-hero.webp<br>/images/pages/enrollment-agreement-page-1.webp<br>/images/pages/government-4.webp | admin:/email-marketing/automation/new<br>lms:/apprentice<br>marketing:/agencies<br>marketing:/approvals<br>marketing:/onboarding/learner/agreements |
| /images/pages/admin-external-progress-detail.webp | /images/pages/admin-external-progress-detail.webp<br>/images/pages/social-media-1.webp<br>/images/pages/verify-page-1.webp | admin:/blog/management/[slug]<br>admin:/external-progress<br>marketing:/blog/[slug]<br>marketing:/store/compliance/wioa<br>marketing:/verify/[certificateId] |
| /images/pages/barber-gallery-1.webp | /images/pages/barber-gallery-1.webp<br>/images/pages/barber-training.webp | admin:/dashboard<br>lms:/host-shop/dashboard/board<br>marketing:/online-apps<br>marketing:/partners/host-shops<br>marketing:/workone-partner-packet |
| /images/pages/career-services-page-10.webp | /images/pages/career-services-page-10.webp<br>/images/pages/workone-packet-2.webp | marketing:/career-services/contact<br>marketing:/onboarding/learner<br>marketing:/services<br>marketing:/workone-partner-packet<br>marketing:/writing-center |
| /images/heroes/hero-homepage.webp | /images/heroes/hero-homepage.webp | marketing:/barber-and-beauty-apprenticeships<br>marketing:/career-training/[state]<br>marketing:/certificates/verify/[certificateId]<br>marketing:/community-services/[state] |
| /images/pages/about-career-pathways.webp | /images/pages/about-career-pathways.webp<br>/images/pages/career-coaching.webp | marketing:/career-services<br>marketing:/store/licenses/school-license<br>marketing:/transparency<br>marketing:/writing-center |
| /images/pages/admin-audit-logs-hero.webp | /images/pages/admin-audit-logs-hero.webp<br>/images/pages/government-2.webp<br>/images/pages/project-management.webp | admin:/blog/management/[slug]<br>marketing:/agencies<br>marketing:/founder<br>marketing:/store/guides/licensing |
| /images/pages/admin-email-automation-new-d1.webp | /images/pages/admin-email-automation-new-d1.webp<br>/images/pages/comp-universal-hero.webp<br>/images/pages/government-3.webp | admin:/email-marketing/automation/new<br>lms:/parent-portal<br>marketing:/agencies<br>marketing:/store/digital |
| /images/pages/admin-employers-hero.webp | /images/pages/admin-employers-hero.webp<br>/images/pages/for-employers-page-1.webp | lms:/host-shop/dashboard/board<br>marketing:/<br>marketing:/hire-graduates<br>marketing:/ojt-and-funding |
| /images/pages/adult-learner.webp | /images/pages/adult-learner.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements<br>marketing:/store/compliance/ferpa<br>marketing:/store/compliance/wioa |
| /images/pages/apply-employer-hero.jpg | /images/pages/apply-employer-hero.jpg<br>/images/pages/apply-employer-hero.webp<br>/images/pages/apprenticeships-page-1.webp | marketing:/<br>marketing:/about<br>marketing:/careers<br>marketing:/platform/employer-portal |
| /images/pages/career-services-page-2.jpg | /images/pages/career-services-page-2.jpg | marketing:/careers<br>marketing:/employment-support<br>marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements |
| /images/pages/comp-home-highlight-success.webp | /images/pages/comp-home-highlight-success.webp | lms:/apprentice<br>lms:/host-shop/dashboard/board<br>lms:/lms/dashboard<br>lms:/programs/hvac-technician/course |
| /images/pages/funding-hero.webp | /images/pages/funding-hero.webp<br>/images/pages/funding-page-1.webp | marketing:/<br>marketing:/banking<br>marketing:/funding/grant-programs<br>marketing:/store/compliance/grant-reporting |
| /images/pages/healthcare-grad.jpg | /images/pages/healthcare-grad.jpg | marketing:/how-it-works<br>marketing:/services<br>marketing:/success-stories<br>marketing:/transparency |
| /images/business/office-admin.webp | /images/business/office-admin.webp | marketing:/<br>marketing:/programs/financial-literacy<br>marketing:/writing-center |
| /images/funding/funding-jri-program-v2.jpg | /images/funding/funding-jri-program-v2.jpg<br>/images/pages/apply-page-4.jpg | marketing:/apply/student<br>marketing:/funding/job-ready-indy<br>marketing:/funding/jri |
| /images/pages/about-funding-nav.webp | /images/pages/about-funding-nav.webp | marketing:/onboarding/learner/agreements<br>marketing:/transparency<br>marketing:/writing-center |
| /images/pages/barber-apprenticeship-hero.jpg | /images/pages/barber-apprenticeship-hero.jpg | admin:/dashboard<br>lms:/host-shop/dashboard/board<br>marketing:/ |
| /images/pages/career-counseling.jpg | /images/pages/career-counseling.jpg | lms:/lms/dashboard<br>marketing:/call-now<br>marketing:/tutoring |
| /images/pages/comp-home-pathways-support.webp | /images/pages/comp-home-pathways-support.webp | marketing:/services<br>marketing:/store/add-ons<br>marketing:/transparency |
| /images/pages/employer-page-1.webp | /images/pages/employer-page-1.webp | lms:/employer/hours<br>marketing:/hire-graduates<br>marketing:/platform/employer-portal |
| /images/pages/lms-page-1.webp | /images/pages/lms-page-1.webp | lms:/lms<br>lms:/lms/learning-paths<br>marketing:/tutoring |
| /images/pages/platform-page-1.webp | /images/pages/platform-page-1.webp | marketing:/platform/[slug]<br>marketing:/platform/sponsors<br>marketing:/platform/student-portal/handbook |
| /images/pages/platform-page-4.webp | /images/pages/platform-page-4.webp | lms:/parent-portal<br>marketing:/platform<br>marketing:/store/digital |
| /images/pages/store-compliance-wioa-detail.webp | /images/pages/store-compliance-wioa-detail.webp | marketing:/store/compliance<br>marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| /images/pages/workforce-training.webp | /images/pages/workforce-training.webp | marketing:/call-now<br>marketing:/store/compliance/grant-reporting<br>marketing:/store/compliance/wioa |
| /images/beauty/barber-hero.webp | /images/beauty/barber-hero.webp | marketing:/barber-and-beauty-apprenticeships<br>marketing:/security |
| /images/business/professional-2.jpg | /images/business/professional-2.jpg | marketing:/docs<br>marketing:/writing-center |
| /images/heroes/lms-analytics.webp | /images/heroes/lms-analytics.webp | admin:/dashboard<br>lms:/host-shop/dashboard/board |
| /images/pages/admin-licensing-hero.webp | /images/pages/admin-licensing-hero.webp | marketing:/store/guides<br>marketing:/store/licenses |
| /images/pages/admin-videos-hero.webp | /images/pages/admin-videos-hero.webp<br>/images/pages/homepage-why-elevate.webp | admin:/videos<br>marketing:/services |
| /images/pages/barber-shop-interior.webp | /images/pages/barber-shop-interior.webp | lms:/host-shop/dashboard/board<br>marketing:/booth-rental/apply |
| /images/pages/career-counseling-page-1.webp | /images/pages/career-counseling-page-1.webp | marketing:/career-counseling<br>marketing:/how-it-works |
| /images/pages/career-services-page-3.jpg | /images/pages/career-services-page-3.jpg | marketing:/careers<br>marketing:/employment-support |
| /images/pages/career-services-page-4.webp | /images/pages/career-services-page-4.webp | marketing:/careers<br>marketing:/employment-support |
| /images/pages/community-page-1.jpg | /images/pages/community-page-1.jpg | marketing:/alumni<br>marketing:/community-services |
| /images/pages/community-page-2.jpg | /images/pages/community-page-2.jpg | marketing:/alumni<br>marketing:/community-services |
| /images/pages/comp-state-career-hero.webp | /images/pages/comp-state-career-hero.webp | marketing:/career-training/[state]<br>marketing:/community-services/[state] |
| /images/pages/cosmetology.webp | /images/pages/cosmetology.webp | marketing:/partners/host-shops<br>marketing:/programs/cosmetology-apprenticeship/apply |
| /images/pages/counselor-session.webp | /images/pages/counselor-session.webp | marketing:/about/team<br>marketing:/career-services |
| /images/pages/course-create-hero.webp | /images/pages/course-create-hero.webp | marketing:/store/courses<br>marketing:/store/practice-tests |
| /images/pages/funding-page-3.webp | /images/pages/funding-page-3.webp | marketing:/funding<br>marketing:/funding/how-it-works |
| /images/pages/government-1.webp | /images/pages/government-1.webp | marketing:/agencies<br>marketing:/for-agencies |
| /images/pages/graduation-ceremony.webp | /images/pages/graduation-ceremony.webp | marketing:/store/compliance/wioa<br>marketing:/testimonials |
| /images/pages/hp-wioa-real.webp | /images/pages/hp-wioa-real.webp | marketing:/scholarships<br>marketing:/wioa-eligibility |
| /images/pages/job-placement.webp | /images/pages/job-placement.webp | marketing:/employment-support<br>marketing:/store/compliance/wioa |
| /images/pages/learner-page-1.webp | /images/pages/learner-page-1.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements |
| /images/pages/mobile-app-page-1.webp | /images/pages/mobile-app-page-1.webp | marketing:/mobile<br>marketing:/mobile-app |
| /images/pages/office-admin-desk.jpg | /images/pages/office-admin-desk.jpg | lms:/lms/dashboard<br>marketing:/wioa-eligibility |
| /images/pages/onboarding-page-1.webp | /images/pages/onboarding-page-1.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/handbook |
| /images/pages/onboarding-page-2.webp | /images/pages/onboarding-page-2.webp | marketing:/onboarding<br>marketing:/onboarding/learner |
| /images/pages/orientation-page-1.webp | /images/pages/orientation-page-1.webp | lms:/enrollment/orientation<br>lms:/orientation/competency-test |
| /images/pages/orientation-page-2.webp | /images/pages/orientation-page-2.webp | lms:/orientation/competency-test<br>lms:/orientation/schedule |
| /images/pages/pathways-page-6.webp | /images/pages/pathways-page-6.webp | marketing:/banking<br>marketing:/career-services/resume-building |
| /images/pages/platform-page-10.webp | /images/pages/platform-page-10.webp | marketing:/platform<br>marketing:/platform/sponsors |
| /images/pages/platform-page-12.webp | /images/pages/platform-page-12.webp | marketing:/platform<br>marketing:/store/apps/website-builder |
| /images/pages/platform-page-3.webp | /images/pages/platform-page-3.webp | marketing:/platform<br>marketing:/store/guides/licensing |
| /images/pages/platform-page-5.webp | /images/pages/platform-page-5.webp | marketing:/platform<br>marketing:/store/guides/licensing |
| /images/pages/store-checkout-cancel-hero.webp | /images/pages/store-checkout-cancel-hero.webp | marketing:/store/checkout/cancel<br>marketing:/store/licenses/source-use |
| /images/pages/store-guides-hero.webp | /images/pages/store-guides-hero.webp | marketing:/store/guides<br>marketing:/store/guides/licensing |
| /images/pages/store-licensing-hero.jpg | /images/pages/store-licensing-hero.jpg | marketing:/store<br>marketing:/store/guides/licensing |
| /images/pages/student-portal-page-1.webp | /images/pages/student-portal-page-1.webp | marketing:/platform/student-portal<br>marketing:/student-support |
| /images/pages/student-portal-page-3.webp | /images/pages/student-portal-page-3.webp | marketing:/platform/student-portal<br>marketing:/student-support |
| /images/pages/student-support-page-1.webp | /images/pages/student-support-page-1.webp | marketing:/employment-support<br>marketing:/student-support |
| /images/pages/tech-classroom.webp | /images/pages/tech-classroom.webp | marketing:/store/compliance/wcag<br>marketing:/testing |
| /images/pages/training-page-1.webp | /images/pages/training-page-1.webp<br>/images/pages/training-providers-hero.webp | marketing:/enroll<br>marketing:/platform/training-providers |
| /images/pages/wioa-meeting.webp | /images/pages/wioa-meeting.webp | marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| /images/pages/workforce-board-page-1.webp | /images/pages/workforce-board-page-1.webp | marketing:/workforce-board<br>marketing:/workforce-board/employment |
| /images/pages/writing-center-page-1.jpg | /images/pages/writing-center-page-1.jpg | marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/pages/writing-center.jpg | /images/pages/writing-center.jpg | marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/team/elizabeth-greene.webp | /images/team/elizabeth-greene.webp | marketing:/about<br>marketing:/about/team |

## Advisory: binary-identical aliases

| Fingerprint | Aliases | Routes |
| --- | --- | --- |
| 02590f9bbfb855e9 | /images/pages/admin-analytics-hero.webp<br>/images/pages/admin-email-campaigns-new-detail.webp<br>/images/pages/banking-page-1.webp<br>/images/pages/certificates-page-1.webp<br>/images/pages/compliance-page-1.webp<br>/images/pages/program-holder-page-1.webp<br>/images/pages/store-recommendations.webp | admin:/email-marketing/campaigns/new<br>marketing:/banking<br>marketing:/blog/[slug]<br>marketing:/certificates<br>marketing:/certificates/verify/[certificateId]<br>marketing:/programs/esthetician-apprenticeship/apply<br>marketing:/services<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag<br>marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| f1db8b11666b5f7f | /images/pages/accessibility-hero.jpg<br>/images/pages/admin-compliance-audit-hero.jpg<br>/images/pages/admin-compliance-audit-hero.webp<br>/images/pages/admin-email-marketing-d1.jpg<br>/images/pages/comp-highlights-team.jpg<br>/images/pages/contact-hero.jpg | admin:/email-marketing<br>lms:/lms/dashboard<br>marketing:/accessibility<br>marketing:/call-now<br>marketing:/careers<br>marketing:/store/compliance<br>marketing:/store/compliance/ferpa<br>marketing:/store/compliance/wcag |
| 2ff1aa0333f5b6ef | /images/pages/admin-email-analytics-detail.webp<br>/images/pages/admin-ferpa-training-hero.webp<br>/images/pages/admin-videos-upload-hero.webp<br>/images/pages/admin-wioa-hero.webp<br>/images/pages/calendar-page-1.webp<br>/images/pages/how-it-works-hero.webp | admin:/email-marketing/analytics<br>admin:/videos/upload<br>marketing:/calendar<br>marketing:/call-now<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/ferpa<br>marketing:/tutoring<br>marketing:/workforce-board |
| 61e2efd358dfab3d | /images/beauty/cosmetology-hero.webp<br>/images/beauty/esthetician.jpg<br>/images/beauty/esthetician.webp<br>/images/beauty/esthetics-hero.webp<br>/images/beauty/nails-hero.webp | lms:/apprentice/billing<br>marketing:/barber-and-beauty-apprenticeships<br>marketing:/partners/host-shops<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/esthetician-apprenticeship/apply |
| 8256545e7bcb75b9 | /images/pages/about-hero.webp<br>/images/pages/business-meeting.webp<br>/images/pages/staff-page-13.jpg<br>/images/pages/success-stories-hero.jpg<br>/images/pages/team-collaboration.webp | admin:/dashboard<br>admin:/staff-portal/settings<br>lms:/host-shop/dashboard/board<br>lms:/lms/dashboard<br>lms:/parent-portal<br>marketing:/about/partners<br>marketing:/about/team<br>marketing:/call-now<br>marketing:/career-services<br>marketing:/online-apps<br>marketing:/success-stories |
| 771bb203b074c7e3 | /images/pages/admin-compliance-deletions-detail.webp<br>/images/pages/admin-email-marketing-d2.webp<br>/images/pages/admin/staff-portal-page-1.webp<br>/images/pages/events-page-1.webp<br>/images/pages/shop-hero.webp | admin:/compliance/deletions<br>admin:/email-marketing<br>admin:/staff-portal<br>lms:/host-shop/dashboard/board<br>marketing:/<br>marketing:/calendar<br>marketing:/staff<br>marketing:/store/compliance/grant-reporting |
| 282d8e16866b1ae8 | /images/pages/admin-email-automation-new-d2.webp<br>/images/pages/approvals-page-1.webp<br>/images/pages/competency-test-hero.webp<br>/images/pages/enrollment-agreement-page-1.webp<br>/images/pages/government-4.webp | admin:/email-marketing/automation/new<br>lms:/apprentice<br>marketing:/agencies<br>marketing:/approvals<br>marketing:/onboarding/learner/agreements |
| 2b3ab849722ff28b | /images/pages/admin-analytics-learning-hero.webp<br>/images/pages/admin-compliance-agreements-hero.webp<br>/images/pages/admin-signatures-hero.webp<br>/images/pages/compliance-page-2.webp | admin:/signatures<br>lms:/parent-portal<br>marketing:/compliance/competency-verification<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag |
| 15ef0ac04518e8f3 | /images/pages/about-career-training.webp<br>/images/pages/admin-compliance-exports-detail.webp<br>/images/pages/programs-catalog-hero.webp | admin:/compliance/exports<br>marketing:/calendar<br>marketing:/call-now<br>marketing:/email<br>marketing:/onboarding<br>marketing:/programs/barber-apprenticeship/orientation<br>marketing:/store/compliance/grant-reporting<br>marketing:/transparency<br>marketing:/workforce-partners<br>marketing:/writing-center |
| 2d5bda80b0020553 | /images/pages/admin-audit-logs-hero.webp<br>/images/pages/government-2.webp<br>/images/pages/project-management.webp | admin:/blog/management/[slug]<br>marketing:/agencies<br>marketing:/founder<br>marketing:/store/guides/licensing |
| c333c5643ab56954 | /images/pages/admin-email-automation-new-d1.webp<br>/images/pages/comp-universal-hero.webp<br>/images/pages/government-3.webp | admin:/email-marketing/automation/new<br>lms:/parent-portal<br>marketing:/agencies<br>marketing:/store/digital |
| 457a7fd8f5c15872 | /images/pages/admin-external-progress-detail.webp<br>/images/pages/social-media-1.webp<br>/images/pages/verify-page-1.webp | admin:/blog/management/[slug]<br>admin:/external-progress<br>marketing:/blog/[slug]<br>marketing:/store/compliance/wioa<br>marketing:/verify/[certificateId] |
| 00cbb1c0e60623e5 | /images/pages/apply-employer-hero.jpg<br>/images/pages/apply-employer-hero.webp<br>/images/pages/apprenticeships-page-1.webp | marketing:/<br>marketing:/about<br>marketing:/careers<br>marketing:/platform/employer-portal |
| 99a0770a4da2231e | /images/funding/funding-jri-program-v2.jpg<br>/images/pages/apply-page-4.jpg | marketing:/apply/student<br>marketing:/funding/job-ready-indy<br>marketing:/funding/jri |
| ea921fa9e584ab10 | /images/pages/about-career-pathways.webp<br>/images/pages/career-coaching.webp | marketing:/career-services<br>marketing:/store/licenses/school-license<br>marketing:/transparency<br>marketing:/writing-center |
| fb61600195b9686e | /images/pages/admin-applications-hero.webp<br>/images/pages/culinary.webp | admin:/applications/review/[id]<br>lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| f805533ab491d95f | /images/pages/admin-employers-hero.webp<br>/images/pages/for-employers-page-1.webp | lms:/host-shop/dashboard/board<br>marketing:/<br>marketing:/hire-graduates<br>marketing:/ojt-and-funding |
| 8374cb9b38b802ee | /images/pages/admin-videos-hero.webp<br>/images/pages/homepage-why-elevate.webp | admin:/videos<br>marketing:/services |
| 81e736fb75b18d81 | /images/pages/barber-gallery-1.webp<br>/images/pages/barber-training.webp | admin:/dashboard<br>lms:/host-shop/dashboard/board<br>marketing:/online-apps<br>marketing:/partners/host-shops<br>marketing:/workone-partner-packet |
| a7f92bd0a910274b | /images/pages/barber-hero.webp<br>/images/pages/programs-hvac-apply-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/hvac-technician/apply |
| ce7d568881c0405d | /images/pages/career-services-page-10.webp<br>/images/pages/workone-packet-2.webp | marketing:/career-services/contact<br>marketing:/onboarding/learner<br>marketing:/services<br>marketing:/workone-partner-packet<br>marketing:/writing-center |
| bbaf4d207f28e298 | /images/pages/funding-hero.webp<br>/images/pages/funding-page-1.webp | marketing:/<br>marketing:/banking<br>marketing:/funding/grant-programs<br>marketing:/store/compliance/grant-reporting |
| ef1a0374fb12e0d6 | /images/pages/plumbing-pipes.webp<br>/images/pages/plumbing.jpg | lms:/apprentice/billing<br>marketing:/platform/workforce-analytics<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| dfad696bd62bd92b | /images/pages/training-page-1.webp<br>/images/pages/training-providers-hero.webp | marketing:/enroll<br>marketing:/platform/training-providers |

> Duplicate enforcement uses the actual deployed image bytes when a local asset exists. Renaming or copying the same picture cannot make it pass as unique. Shared logos, icons, badges, seals, partner/sponsor assets, credentials, avatars, headshots, placeholders, QR codes, and watermarks are excluded. Shared category videos are reported by the existing hero audit but are not treated as duplicate-image failures here. Hero classification is based on render structure, never filenames.
