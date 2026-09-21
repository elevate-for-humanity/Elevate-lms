# Platform media duplicate audit

Generated: 2026-09-21T22:56:06.197Z

## Summary

- Routes scanned: **1536**
- Duplicate non-brand pictures inside a route-owned page/component: **0**
- Route-owned hero pictures reused across active routes: **0**
- Duplicate poster/image content in canonical hero registry: **0**
- Shared-component duplicate candidates (advisory): **4**
- Other cross-route picture reuse (advisory): **89**
- Different filenames containing identical image bytes: **23**

## Blocking: duplicate pictures inside one route

None.

## Blocking: route-owned hero pictures reused across routes

None.

## Blocking: duplicate canonical hero-registry poster/images

None.

## Advisory: duplicate pictures inside shared component trees

| App | Route | Representative asset | Binary aliases | Locations |
| --- | --- | --- | --- | --- |
| marketing | / | /images/beauty/esthetics-hero.webp | /images/beauty/esthetics-hero.webp<br>/images/beauty/program-beauty-training.webp | components/home/HomeBeautyPriority.tsx:27<br>components/home/PlatformHubHero.tsx:80 |
| marketing | /programs/esthetician-apprenticeship | /images/jozanna-george.jpg | /images/jozanna-george.jpg | components/programs/beauty/JozannaIndustryInstructor.tsx:12<br>components/programs/beauty/JozannaIndustryInstructor.tsx:21 |
| marketing | /programs | /images/pages/about-career-training.webp | /images/pages/about-career-training.webp<br>/images/pages/bookkeeping-ledger.webp | components/home/HomeProgramShowcase.tsx:36<br>components/home/HomeProgramShowcase.tsx:44 |
| marketing | /testing | /images/pages/testing-page-1.webp | /images/pages/testing-page-1.webp | apps/marketing/app/testing/page.tsx:86<br>components/testing/TestingCart.tsx:33 |

## Advisory: other picture reuse across routes

| Representative asset | Binary aliases | Routes |
| --- | --- | --- |
| /images/programs/irs-enrolled-agent-ea.webp | /images/programs/irs-enrolled-agent-ea.webp | marketing:/programs/[program]<br>marketing:/programs/cdl-training<br>marketing:/programs/cna<br>marketing:/programs/cosmetology-apprenticeship<br>marketing:/programs/cpr-first-aid<br>marketing:/programs/electrical<br>marketing:/programs/esthetician-apprenticeship<br>marketing:/programs/hvac-technician<br>marketing:/programs/medical-assistant<br>marketing:/programs/nail-technician-apprenticeship<br>marketing:/programs/peer-recovery-specialist<br>marketing:/programs/plumbing<br>marketing:/programs/qma |
| /images/beauty/esthetician.webp | /images/beauty/esthetician.webp<br>/images/beauty/esthetics-hero.webp<br>/images/beauty/program-beauty-training.webp | lms:/apprentice/billing<br>marketing:/<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/healthcare |
| /images/pages/about-career-training.webp | /images/pages/about-career-training.webp<br>/images/pages/admin-compliance-exports-detail.webp<br>/images/pages/bookkeeping-ledger.webp<br>/images/pages/programs-catalog-hero.webp | marketing:/calendar<br>marketing:/call-now<br>marketing:/email<br>marketing:/onboarding<br>marketing:/programs<br>marketing:/programs/barber-apprenticeship/orientation<br>marketing:/store/compliance/grant-reporting<br>marketing:/transparency<br>marketing:/workforce-partners<br>marketing:/writing-center |
| /images/pages/admin-analytics-hero.webp | /images/pages/admin-analytics-hero.webp<br>/images/pages/admin-email-campaigns-new-detail.webp<br>/images/pages/banking-page-1.webp<br>/images/pages/certificates-page-1.webp<br>/images/pages/compliance-page-1.webp<br>/images/pages/program-holder-page-1.webp<br>/images/pages/store-recommendations.webp | admin:/email-marketing/campaigns/new<br>lms:/host-shop/dashboard<br>marketing:/banking<br>marketing:/blog/[slug]<br>marketing:/certificates<br>marketing:/certificates/verify/[certificateId]<br>marketing:/services<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag<br>marketing:/wioa-eligibility |
| /images/pages/admin-applications-hero.webp | /images/pages/admin-applications-hero.webp<br>/images/pages/culinary.webp | admin:/applications/review/[id]<br>lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/plumbing-pipes.webp | /images/pages/plumbing-pipes.webp<br>/images/pages/plumbing.jpg | lms:/apprentice/billing<br>marketing:/platform/workforce-analytics<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/about-hero.webp | /images/pages/about-hero.webp<br>/images/pages/business-meeting.webp<br>/images/pages/staff-page-13.jpg<br>/images/pages/team-collaboration.webp | admin:/staff-portal/settings<br>lms:/lms/dashboard<br>lms:/parent-portal<br>marketing:/<br>marketing:/about/partners<br>marketing:/call-now<br>marketing:/career-services<br>marketing:/programs |
| /images/pages/admin-email-analytics-detail.webp | /images/pages/admin-email-analytics-detail.webp<br>/images/pages/admin-ferpa-training-hero.webp<br>/images/pages/admin-videos-upload-hero.webp<br>/images/pages/admin-wioa-hero.webp<br>/images/pages/calendar-page-1.webp | admin:/email-marketing/analytics<br>admin:/videos/upload<br>lms:/host-shop/dashboard<br>marketing:/calendar<br>marketing:/call-now<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/ferpa<br>marketing:/tutoring |
| /images/pages/barber-hero.webp | /images/pages/barber-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/cosmetology-hero.webp | /images/pages/cosmetology-hero.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/electrical.webp | /images/pages/electrical.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/nail-technician.webp | /images/pages/nail-technician.webp | lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| /images/pages/career-services-page-1.webp | /images/pages/career-services-page-1.webp | marketing:/career-services<br>marketing:/employment-support<br>marketing:/how-it-works<br>marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements<br>marketing:/services<br>marketing:/student-support |
| /images/pages/training-classroom.webp | /images/pages/training-classroom.webp | lms:/apprentice<br>lms:/apprentice/policies/payments<br>lms:/host-shop/dashboard<br>lms:/lms/dashboard<br>lms:/lms/quizzes<br>lms:/parent-portal<br>marketing:/call-now |
| /images/pages/academic-integrity-hero.webp | /images/pages/academic-integrity-hero.webp<br>/images/pages/admin-analytics-learning-hero.webp<br>/images/pages/admin-compliance-agreements-hero.webp<br>/images/pages/admin-signatures-hero.webp<br>/images/pages/compliance-page-2.webp | admin:/signatures<br>lms:/host-shop/dashboard<br>lms:/parent-portal<br>marketing:/compliance/competency-verification<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag |
| /images/pages/admin-compliance-deletions-detail.webp | /images/pages/admin-compliance-deletions-detail.webp<br>/images/pages/admin-email-marketing-d2.webp<br>/images/pages/admin/staff-portal-page-1.webp<br>/images/pages/events-page-1.webp | admin:/compliance/deletions<br>admin:/email-marketing<br>admin:/staff-portal<br>marketing:/calendar<br>marketing:/staff<br>marketing:/store/compliance/grant-reporting |
| /images/pages/admin-external-progress-detail.webp | /images/pages/admin-external-progress-detail.webp<br>/images/pages/bookkeeping.webp<br>/images/pages/social-media-1.webp<br>/images/pages/verify-page-1.webp | admin:/blog/management/[slug]<br>admin:/external-progress<br>marketing:/<br>marketing:/blog/[slug]<br>marketing:/tutoring<br>marketing:/verify/[certificateId] |
| /images/pages/about-supportive-services.webp | /images/pages/about-supportive-services.webp | lms:/parent-portal<br>marketing:/email<br>marketing:/employment-support<br>marketing:/platform/partner-portal<br>marketing:/wioa-eligibility |
| /images/pages/admin-compliance-audit-hero.jpg | /images/pages/admin-compliance-audit-hero.jpg<br>/images/pages/admin-compliance-audit-hero.webp<br>/images/pages/admin-email-marketing-d1.jpg<br>/images/pages/contact-hero.jpg | admin:/email-marketing<br>lms:/lms/dashboard<br>marketing:/call-now<br>marketing:/store/compliance/ferpa<br>marketing:/store/compliance/wcag |
| /images/pages/admin-email-automation-new-d2.webp | /images/pages/admin-email-automation-new-d2.webp<br>/images/pages/competency-test-hero.webp<br>/images/pages/enrollment-agreement-page-1.webp<br>/images/pages/government-4.webp | admin:/email-marketing/automation/new<br>lms:/apprentice<br>lms:/host-shop/dashboard<br>marketing:/agencies<br>marketing:/onboarding/learner/agreements |
| /images/pages/career-services-page-10.webp | /images/pages/career-services-page-10.webp<br>/images/pages/workone-packet-2.webp | lms:/host-shop/dashboard<br>marketing:/career-services/contact<br>marketing:/onboarding/learner<br>marketing:/services<br>marketing:/writing-center |
| /images/pages/about-career-pathways.webp | /images/pages/about-career-pathways.webp<br>/images/pages/career-coaching.webp | marketing:/career-services<br>marketing:/store/licenses/school-license<br>marketing:/transparency<br>marketing:/writing-center |
| /images/pages/about-funding-nav.webp | /images/pages/about-funding-nav.webp | marketing:/about<br>marketing:/onboarding/learner/agreements<br>marketing:/transparency<br>marketing:/writing-center |
| /images/pages/admin-email-automation-new-d1.webp | /images/pages/admin-email-automation-new-d1.webp<br>/images/pages/comp-universal-hero.webp<br>/images/pages/government-3.webp | admin:/email-marketing/automation/new<br>lms:/parent-portal<br>marketing:/agencies<br>marketing:/store/digital |
| /images/pages/admin-employers-hero.webp | /images/pages/admin-employers-hero.webp<br>/images/pages/for-employers-page-1.webp | lms:/host-shop/dashboard<br>marketing:/<br>marketing:/employers<br>marketing:/ojt-and-funding |
| /images/pages/adult-learner.webp | /images/pages/adult-learner.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements<br>marketing:/store/compliance/ferpa<br>marketing:/tutoring |
| /images/pages/apprenticeship-structure.webp | /images/pages/apprenticeship-structure.webp | lms:/apprentice<br>lms:/parent-portal<br>marketing:/<br>marketing:/compliance/apprenticeship-structure |
| /images/pages/hvac-technician.webp | /images/pages/hvac-technician.webp | marketing:/employment-support<br>marketing:/programs/hvac-technician/curriculum<br>marketing:/store/courses/hvac-technician-course-license<br>marketing:/tutoring |
| /images/heroes/hero-homepage.webp | /images/heroes/hero-homepage.webp | marketing:/career-training/[state]<br>marketing:/certificates/verify/[certificateId]<br>marketing:/community-services/[state] |
| /images/jozanna-george.jpg | /images/jozanna-george.jpg<br>/images/testimonials/student-david.jpg | marketing:/about/team/jozanna-george<br>marketing:/programs/esthetician-apprenticeship<br>marketing:/testimonials |
| /images/pages/admin-audit-logs-hero.webp | /images/pages/admin-audit-logs-hero.webp<br>/images/pages/government-2.webp<br>/images/pages/project-management.webp | admin:/blog/management/[slug]<br>marketing:/agencies<br>marketing:/founder |
| /images/pages/admin-videos-hero.webp | /images/pages/admin-videos-hero.webp<br>/images/pages/homepage-why-elevate.webp<br>/images/pages/programs-hero-vibrant.webp | admin:/videos<br>lms:/host-shop/dashboard<br>marketing:/services |
| /images/pages/career-counseling-page-1.webp | /images/pages/career-counseling-page-1.webp | marketing:/career-counseling<br>marketing:/how-it-works<br>marketing:/student-support |
| /images/pages/career-counseling.jpg | /images/pages/career-counseling.jpg | lms:/lms/dashboard<br>marketing:/call-now<br>marketing:/tutoring |
| /images/pages/career-services-page-2.jpg | /images/pages/career-services-page-2.jpg | marketing:/employment-support<br>marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements |
| /images/pages/community-page-1.webp | /images/pages/community-page-1.webp | marketing:/alumni<br>marketing:/community-services<br>marketing:/philanthropy |
| /images/pages/community-page-2.webp | /images/pages/community-page-2.webp | marketing:/alumni<br>marketing:/community-services<br>marketing:/philanthropy |
| /images/pages/comp-home-highlight-success.webp | /images/pages/comp-home-highlight-success.webp | lms:/apprentice<br>lms:/host-shop/dashboard<br>lms:/lms/dashboard |
| /images/pages/funding-hero.webp | /images/pages/funding-hero.webp<br>/images/pages/funding-page-1.webp | marketing:/<br>marketing:/banking<br>marketing:/store/compliance/grant-reporting |
| /images/pages/healthcare-grad.jpg | /images/pages/healthcare-grad.jpg | marketing:/how-it-works<br>marketing:/services<br>marketing:/transparency |
| /images/pages/lms-page-1.webp | /images/pages/lms-page-1.webp | lms:/lms<br>lms:/lms/learning-paths<br>marketing:/tutoring |
| /images/pages/platform-page-1.webp | /images/pages/platform-page-1.webp | marketing:/platform/[slug]<br>marketing:/platform/sponsors<br>marketing:/store |
| /images/pages/testing-page-1.webp | /images/pages/testing-page-1.webp | marketing:/store/testing<br>marketing:/testing<br>marketing:/testing/[provider] |
| /images/pages/workforce-training.webp | /images/pages/workforce-training.webp | marketing:/<br>marketing:/call-now<br>marketing:/store/compliance/grant-reporting |
| /images/pexels/cosmetology.webp | /images/pexels/cosmetology.webp | marketing:/<br>marketing:/apprenticeships<br>marketing:/barber-and-beauty-apprenticeships |
| /images/alina-smith.jpg | /images/alina-smith.jpg<br>/images/testimonials/testimonial-medical-assistant.jpg | marketing:/implementation<br>marketing:/testimonials |
| /images/barber-hero-new.webp | /images/barber-hero-new.webp | lms:/lms/courses/[courseId]<br>marketing:/compliance/competency-verification/barber |
| /images/barber-professional.webp | /images/barber-professional.webp | marketing:/roi<br>marketing:/testimonials |
| /images/business/office-admin.webp | /images/business/office-admin.webp | marketing:/programs/financial-literacy<br>marketing:/writing-center |
| /images/business/professional-2.jpg | /images/business/professional-2.jpg | marketing:/docs<br>marketing:/writing-center |
| /images/carlina-wilkes.jpg | /images/carlina-wilkes.jpg | marketing:/about/team/carlina-wilkes<br>marketing:/programs/financial-literacy |
| /images/hvac-hero.webp | /images/hvac-hero.webp | marketing:/<br>marketing:/programs |
| /images/pages/admin-activity-hero.webp | /images/pages/admin-activity-hero.webp | admin:/studio/settings<br>marketing:/store |
| /images/pages/admin-licensing-hero.webp | /images/pages/admin-licensing-hero.webp | marketing:/store/guides<br>marketing:/store/licenses |
| /images/pages/apply-employer-hero.jpg | /images/pages/apply-employer-hero.jpg<br>/images/pages/apprenticeships-page-1.webp | marketing:/about<br>marketing:/platform/employer-portal |
| /images/pages/barber-apprentice-learning.webp | /images/pages/barber-apprentice-learning.webp<br>/images/pages/barber-gallery-1.webp | lms:/host-shop/dashboard<br>marketing:/programs/barber-apprenticeship/apply |
| /images/pages/barber-fade.webp | /images/pages/barber-fade.webp | marketing:/programs/barber-apprenticeship<br>marketing:/programs/barber-apprenticeship/apply |
| /images/pages/barber-shop-interior.webp | /images/pages/barber-shop-interior.webp | marketing:/booth-rental/apply<br>marketing:/programs/barber-apprenticeship/apply |
| /images/pages/career-services-page-7.webp | /images/pages/career-services-page-7.webp | lms:/lms/progress<br>marketing:/services |
| /images/pages/cdl-loading-dock.webp | /images/pages/cdl-loading-dock.webp | marketing:/<br>marketing:/programs |
| /images/pages/cna-nursing-real.webp | /images/pages/cna-nursing-real.webp | marketing:/about<br>marketing:/programs |
| /images/pages/comp-home-pathways-support.webp | /images/pages/comp-home-pathways-support.webp | marketing:/services<br>marketing:/transparency |
| /images/pages/comp-state-career-hero.webp | /images/pages/comp-state-career-hero.webp | marketing:/career-training/[state]<br>marketing:/community-services/[state] |
| /images/pages/employer-page-1.webp | /images/pages/employer-page-1.webp | lms:/employer/hours<br>marketing:/platform/employer-portal |
| /images/pages/government-1.webp | /images/pages/government-1.webp | marketing:/agencies<br>marketing:/for-agencies |
| /images/pages/hp-wioa-real.webp | /images/pages/hp-wioa-real.webp | marketing:/scholarships<br>marketing:/wioa-eligibility |
| /images/pages/learner-page-1.webp | /images/pages/learner-page-1.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/agreements |
| /images/pages/mobile-app-page-1.webp | /images/pages/mobile-app-page-1.webp | marketing:/mobile<br>marketing:/mobile-app |
| /images/pages/office-admin-desk.jpg | /images/pages/office-admin-desk.jpg | lms:/lms/dashboard<br>marketing:/wioa-eligibility |
| /images/pages/onboarding-page-1.webp | /images/pages/onboarding-page-1.webp | marketing:/onboarding/learner<br>marketing:/onboarding/learner/handbook |
| /images/pages/onboarding-page-2.webp | /images/pages/onboarding-page-2.webp | marketing:/onboarding<br>marketing:/onboarding/learner |
| /images/pages/orientation-page-1.webp | /images/pages/orientation-page-1.webp | lms:/enrollment/orientation<br>lms:/orientation/competency-test |
| /images/pages/orientation-page-2.webp | /images/pages/orientation-page-2.webp | lms:/orientation/competency-test<br>lms:/orientation/schedule |
| /images/pages/pathways-page-6.webp | /images/pages/pathways-page-6.webp | marketing:/banking<br>marketing:/career-services/resume-building |
| /images/pages/platform-page-4.webp | /images/pages/platform-page-4.webp | lms:/parent-portal<br>marketing:/store/digital |
| /images/pages/store-checkout-cancel-hero.webp | /images/pages/store-checkout-cancel-hero.webp | marketing:/store/checkout/cancel<br>marketing:/store/licenses/source-use |
| /images/pages/store-page-1.webp | /images/pages/store-page-1.webp | lms:/host-shop/dashboard<br>marketing:/store/compliance/grant-reporting |
| /images/pages/student-portal-page-1.webp | /images/pages/student-portal-page-1.webp | marketing:/platform/student-portal<br>marketing:/student-support |
| /images/pages/student-portal-page-3.webp | /images/pages/student-portal-page-3.webp | marketing:/platform/student-portal<br>marketing:/student-support |
| /images/pages/student-portal-page-7.webp | /images/pages/student-portal-page-7.webp | marketing:/platform/student-portal<br>marketing:/platform/student-portal/handbook |
| /images/pages/student-support-hero.webp | /images/pages/student-support-hero.webp | marketing:/security<br>marketing:/student-support |
| /images/pages/student-support-page-1.webp | /images/pages/student-support-page-1.webp | marketing:/employment-support<br>marketing:/student-support |
| /images/pages/success-stories-hero.webp | /images/pages/success-stories-hero.webp | marketing:/mobile<br>marketing:/success-stories |
| /images/pages/tech-classroom.webp | /images/pages/tech-classroom.webp | marketing:/store/compliance/wcag<br>marketing:/testing |
| /images/pages/wioa-meeting.webp | /images/pages/wioa-meeting.webp | marketing:/store/compliance/wioa<br>marketing:/wioa-eligibility |
| /images/pages/writing-center-page-1.jpg | /images/pages/writing-center-page-1.jpg | marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/pages/writing-center.jpg | /images/pages/writing-center.jpg | marketing:/wioa-eligibility<br>marketing:/writing-center |
| /images/pexels/nail-tech.webp | /images/pexels/nail-tech.webp | marketing:/<br>marketing:/apprenticeships |
| /images/programs/financial-literacy-flyer.jpg | /images/programs/financial-literacy-flyer.jpg | marketing:/about/team/carlina-wilkes<br>marketing:/programs/financial-literacy |

## Advisory: binary-identical aliases

| Fingerprint | Aliases | Routes |
| --- | --- | --- |
| 02590f9bbfb855e9 | /images/pages/admin-analytics-hero.webp<br>/images/pages/admin-email-campaigns-new-detail.webp<br>/images/pages/banking-page-1.webp<br>/images/pages/certificates-page-1.webp<br>/images/pages/compliance-page-1.webp<br>/images/pages/program-holder-page-1.webp<br>/images/pages/store-recommendations.webp | admin:/email-marketing/campaigns/new<br>lms:/host-shop/dashboard<br>marketing:/banking<br>marketing:/blog/[slug]<br>marketing:/certificates<br>marketing:/certificates/verify/[certificateId]<br>marketing:/services<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag<br>marketing:/wioa-eligibility |
| 2b3ab849722ff28b | /images/pages/academic-integrity-hero.webp<br>/images/pages/admin-analytics-learning-hero.webp<br>/images/pages/admin-compliance-agreements-hero.webp<br>/images/pages/admin-signatures-hero.webp<br>/images/pages/compliance-page-2.webp | admin:/signatures<br>lms:/host-shop/dashboard<br>lms:/parent-portal<br>marketing:/compliance/competency-verification<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/wcag |
| 2ff1aa0333f5b6ef | /images/pages/admin-email-analytics-detail.webp<br>/images/pages/admin-ferpa-training-hero.webp<br>/images/pages/admin-videos-upload-hero.webp<br>/images/pages/admin-wioa-hero.webp<br>/images/pages/calendar-page-1.webp | admin:/email-marketing/analytics<br>admin:/videos/upload<br>lms:/host-shop/dashboard<br>marketing:/calendar<br>marketing:/call-now<br>marketing:/store/add-ons/analytics-pro<br>marketing:/store/compliance/ferpa<br>marketing:/tutoring |
| 15ef0ac04518e8f3 | /images/pages/about-career-training.webp<br>/images/pages/admin-compliance-exports-detail.webp<br>/images/pages/bookkeeping-ledger.webp<br>/images/pages/programs-catalog-hero.webp | marketing:/calendar<br>marketing:/call-now<br>marketing:/email<br>marketing:/onboarding<br>marketing:/programs<br>marketing:/programs/barber-apprenticeship/orientation<br>marketing:/store/compliance/grant-reporting<br>marketing:/transparency<br>marketing:/workforce-partners<br>marketing:/writing-center |
| 8256545e7bcb75b9 | /images/pages/about-hero.webp<br>/images/pages/business-meeting.webp<br>/images/pages/staff-page-13.jpg<br>/images/pages/team-collaboration.webp | admin:/staff-portal/settings<br>lms:/lms/dashboard<br>lms:/parent-portal<br>marketing:/<br>marketing:/about/partners<br>marketing:/call-now<br>marketing:/career-services<br>marketing:/programs |
| f1db8b11666b5f7f | /images/pages/admin-compliance-audit-hero.jpg<br>/images/pages/admin-compliance-audit-hero.webp<br>/images/pages/admin-email-marketing-d1.jpg<br>/images/pages/contact-hero.jpg | admin:/email-marketing<br>lms:/lms/dashboard<br>marketing:/call-now<br>marketing:/store/compliance/ferpa<br>marketing:/store/compliance/wcag |
| 771bb203b074c7e3 | /images/pages/admin-compliance-deletions-detail.webp<br>/images/pages/admin-email-marketing-d2.webp<br>/images/pages/admin/staff-portal-page-1.webp<br>/images/pages/events-page-1.webp | admin:/compliance/deletions<br>admin:/email-marketing<br>admin:/staff-portal<br>marketing:/calendar<br>marketing:/staff<br>marketing:/store/compliance/grant-reporting |
| 282d8e16866b1ae8 | /images/pages/admin-email-automation-new-d2.webp<br>/images/pages/competency-test-hero.webp<br>/images/pages/enrollment-agreement-page-1.webp<br>/images/pages/government-4.webp | admin:/email-marketing/automation/new<br>lms:/apprentice<br>lms:/host-shop/dashboard<br>marketing:/agencies<br>marketing:/onboarding/learner/agreements |
| 457a7fd8f5c15872 | /images/pages/admin-external-progress-detail.webp<br>/images/pages/bookkeeping.webp<br>/images/pages/social-media-1.webp<br>/images/pages/verify-page-1.webp | admin:/blog/management/[slug]<br>admin:/external-progress<br>marketing:/<br>marketing:/blog/[slug]<br>marketing:/tutoring<br>marketing:/verify/[certificateId] |
| 61e2efd358dfab3d | /images/beauty/esthetician.webp<br>/images/beauty/esthetics-hero.webp<br>/images/beauty/program-beauty-training.webp | lms:/apprentice/billing<br>marketing:/<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing<br>marketing:/programs/healthcare |
| 2d5bda80b0020553 | /images/pages/admin-audit-logs-hero.webp<br>/images/pages/government-2.webp<br>/images/pages/project-management.webp | admin:/blog/management/[slug]<br>marketing:/agencies<br>marketing:/founder |
| c333c5643ab56954 | /images/pages/admin-email-automation-new-d1.webp<br>/images/pages/comp-universal-hero.webp<br>/images/pages/government-3.webp | admin:/email-marketing/automation/new<br>lms:/parent-portal<br>marketing:/agencies<br>marketing:/store/digital |
| 8374cb9b38b802ee | /images/pages/admin-videos-hero.webp<br>/images/pages/homepage-why-elevate.webp<br>/images/pages/programs-hero-vibrant.webp | admin:/videos<br>lms:/host-shop/dashboard<br>marketing:/services |
| 1e197c5f836f7d1f | /images/alina-smith.jpg<br>/images/testimonials/testimonial-medical-assistant.jpg | marketing:/implementation<br>marketing:/testimonials |
| c4061741f7d042d0 | /images/jozanna-george.jpg<br>/images/testimonials/student-david.jpg | marketing:/about/team/jozanna-george<br>marketing:/programs/esthetician-apprenticeship<br>marketing:/testimonials |
| ea921fa9e584ab10 | /images/pages/about-career-pathways.webp<br>/images/pages/career-coaching.webp | marketing:/career-services<br>marketing:/store/licenses/school-license<br>marketing:/transparency<br>marketing:/writing-center |
| fb61600195b9686e | /images/pages/admin-applications-hero.webp<br>/images/pages/culinary.webp | admin:/applications/review/[id]<br>lms:/apprentice/billing<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |
| f805533ab491d95f | /images/pages/admin-employers-hero.webp<br>/images/pages/for-employers-page-1.webp | lms:/host-shop/dashboard<br>marketing:/<br>marketing:/employers<br>marketing:/ojt-and-funding |
| 00cbb1c0e60623e5 | /images/pages/apply-employer-hero.jpg<br>/images/pages/apprenticeships-page-1.webp | marketing:/about<br>marketing:/platform/employer-portal |
| 81e736fb75b18d81 | /images/pages/barber-apprentice-learning.webp<br>/images/pages/barber-gallery-1.webp | lms:/host-shop/dashboard<br>marketing:/programs/barber-apprenticeship/apply |
| ce7d568881c0405d | /images/pages/career-services-page-10.webp<br>/images/pages/workone-packet-2.webp | lms:/host-shop/dashboard<br>marketing:/career-services/contact<br>marketing:/onboarding/learner<br>marketing:/services<br>marketing:/writing-center |
| bbaf4d207f28e298 | /images/pages/funding-hero.webp<br>/images/pages/funding-page-1.webp | marketing:/<br>marketing:/banking<br>marketing:/store/compliance/grant-reporting |
| ef1a0374fb12e0d6 | /images/pages/plumbing-pipes.webp<br>/images/pages/plumbing.jpg | lms:/apprentice/billing<br>marketing:/platform/workforce-analytics<br>marketing:/portal/barber<br>marketing:/portal/cosmetology<br>marketing:/portal/culinary<br>marketing:/portal/electrical<br>marketing:/portal/esthetician<br>marketing:/portal/nail-technician<br>marketing:/portal/plumbing |

> Duplicate enforcement uses the actual deployed image bytes when a local asset exists. Renaming or copying the same picture cannot make it pass as unique. Shared logos, icons, badges, seals, partner/sponsor assets, credentials, avatars, headshots, placeholders, QR codes, and watermarks are excluded. Shared category videos are reported by the existing hero audit but are not treated as duplicate-image failures here. Hero classification is based on render structure, never filenames.
