# Duplicate Metadata Title Audit - July 12, 2026

## Summary
**Total Duplicate Titles: 56**
This audit lists all metadata titles used by 3+ routes, creating SEO conflicts.

---

## 1. Container Management (3 routes)
- `/dev-studio`
- `/ai/dev-studio`
- `/store/dev-studio`
**Fix:** Add unique identifiers like "AI Dev Studio" or "Store Dev Studio"

---

## 2. WIOA Funding (3 routes)
- `/employers`
- `/check-eligibility`
- `/grants`
**Fix:** "WIOA Funding for Employers", "Grant Opportunities"

---

## 3. Submit Application (3 routes)
- `/students`
- `/programs/barber-apprenticeship/host-shops`
- `/programs/cosmetology-apprenticeship/host-shops`
**Fix:** Route-specific titles

---

## 4. Start Training (5 routes) ⚠️ HIGH PRIORITY
- `/students`
- `/funding/dol`
- `/funding/how-it-works`
- `/funding/jri`
- `/funding`
**Fix:** Context-specific titles per section

---

## 5. Employer Partners (3 routes)
- `/about/partners`
- `/lms/resources`
- `/partnerships`
**Fix:** "Our Employer Partners", "LMS Partner Resources"

---

## 6. Security (4 routes)
- `/account`
- `/account/settings`
- `/admin/settings`
- `/lms/settings`
**Fix:** Route-specific: "Account Security", "Admin Security Settings"

---

## 7. Notifications (6 routes)
- `/account`
- `/account/settings`
- `/admin/settings`
- `/lms/settings`
- `/notifications`
- `/parent-portal`
**Fix:** "Notification Settings", "Notification Preferences"

---

## 8. Apprenticeship Programs (3 routes)
- `/accreditation/accreditation`
- `/apprenticeship-programs`
- `/store/courses/hvac-technician-course-license`
**Fix:** "Accreditation Info", "Our Apprenticeship Programs"

---

## 9. Industry Certifications (3 routes)
- `/accreditation`
- `/employers`
- `/solutions/k12`
**Fix:** Route-specific titles

---

## 10. Courses | Elevate for Humanity (4 routes)
- `/admin/courses`
- `/career-services/courses`
- `/courses`
- `/help/courses`
**Fix:** "Admin Courses", "Career Services Course Catalog"

---

## 11. Security & Data Protection (5 routes)
- `/admin/governance/contact`
- `/admin/governance/legal`
- `/admin/governance`
- `/admin/security`
- `/legal`
**Fix:** Route-specific: "Security Contact", "Legal Information"

---

## 12. Access Control (3 routes)
- `/admin/governance/governance/security`
- `/admin/security`
- `/governance/security`
**Fix:** "Governance Access Control", "Admin Access Control"

---

## 13. Data Encryption (3 routes)
- `/admin/governance/governance/security`
- `/governance/security`
- `/store/compliance/ferpa`
**Fix:** Route-specific titles

---

## 14. Terms of Service (5 routes)
- `/admin/governance/legal`
- `/equal-opportunity`
- `/legal`
- `/onboarding/legal`
- `/policies`
**Fix:** "Legal Terms", "Policy Terms"

---

## 15. Privacy Policy (6 routes)
- `/admin/governance/legal`
- `/equal-opportunity`
- `/legal`
- `/legal/privacy`
- `/onboarding/legal`
- `/policies`
**Fix:** "Privacy Statement", "Your Privacy Rights"

---

## 16. Accessibility (4 routes)
- `/admin/governance/legal`
- `/compliance/center`
- `/equal-opportunity`
- `/policies`
**Fix:** "Accessibility Statement", "Compliance Accessibility"

---

## 17. New | Elevate for Humanity (3 routes)
- `/admin/grants/applications/new`
- `/admin/jobs/new`
- `/host-shop/dashboard/apprentices/new`
**Fix:** "New Grant Application", "Post New Job"

---

## 18. Programs (3 routes)
- `/admin/home`
- `/lms/programs`
- `/site-map`
**Fix:** "Admin Programs Dashboard", "LMS Available Programs"

---

## 19. Partners (3 routes)
- `/admin/home`
- `/platform`
- `/site-map`
**Fix:** Route-specific

---

## 20. Enrollment Report (3 routes)
- `/admin/jri/reports`
- `/admin/reports/samples`
- `/compliance/workforce-partnership-packet`
**Fix:** "JRI Enrollment Data", "Sample Reports"

---

## 21. Email (3 routes)
- `/admin/settings`
- `/contact/contact`
- `/email`
**Fix:** "Email Settings", "Contact Us"

---

## 22. Staff Portal (3 routes)
- `/admin/staff-portal`
- `/portals`
- `/staff`
**Fix:** "Staff Portal Home", "Available Portals"

---

## 23. Student Support (3 routes)
- `/admin/staff-portal/skills`
- `/lms/resources`
- `/staff/skills`
**Fix:** Route-specific

---

## 24. Staff Training (3 routes)
- `/admin/staff-portal/training`
- `/staff/training`
- `/store/licenses/school-license`
**Fix:** Route-specific

---

## 25. Barber Apprenticeship (5 routes)
- `/admin/student-hours`
- `/apprenticeships`
- `/funding/jri`
- `/store/demo/admin`
- `/workone-partner-packet`
**Fix:** Route-specific context

---

## 26. Analytics Dashboard (3 routes)
- `/ai/credential-engine`
- `/platform/training-providers`
- `/store/add-ons/community-hub`
**Fix:** "Credential Analytics", "Training Provider Metrics"

---

## 27. Workforce Boards (5 routes)
- `/ai/paris`
- `/platform`
- `/store/add-ons/analytics-pro`
- `/store/courses/hvac-technician-course-license`
- `/store`
**Fix:** "PARiS Workforce Intelligence", "Platform Overview"

---

## 28. Training Providers (6 routes)
- `/ai/paris`
- `/partner-operating-model`
- `/platform`
- `/store/add-ons/analytics-pro`
- `/store/add-ons/community-hub`
- `/store`
**Fix:** Route-specific

---

## 29. Application Received (3 routes)
- `/apply/confirmation`
- `/apply/program-holder/confirmation`
- `/apply/success`
**Fix:** Route-specific confirmation

---

## 30. Application Submitted (3 routes)
- `/apply/employer/success`
- `/apply/staff/success`
- `/apply/success`
**Fix:** "Employer Application Submitted", "Staff Application Submitted"

---

## 31. Check your email (4 routes) ⚠️
- `/apply/success` (4x)
**Fix:** This is likely the same component reused - add route context

---

## 32. Compliance Reporting (3 routes)
- `/apprenticeship-sponsor`
- `/platform/managed`
- `/platform/providers`
**Fix:** Route-specific

---

## 33. Articles by ${author} | Elevate For Humanity (6 routes)
- `/blog/author/[author]` (3x)
- `/blog/blog/author/[author]` (3x)
**Fix:** Remove blog/blog duplication or add unique identifiers

---

## 34. ${category} | Blog | Elevate For Humanity (6 routes)
- `/blog/blog/category/[category]` (3x)
- `/blog/category/[category]` (3x)
**Fix:** Consolidate duplicate /blog/blog routes

---

## 35. Blog (3 routes)
- `/blog/blog` (3x)
**Fix:** Delete duplicate /blog/blog directory

---

## 36. Apply | Elevate for Humanity (6 routes)
- `/booth-rental/apply`
- `/partners/apply`
- `/partners/barber-host-shop/apply`
- `/partners/cosmetology-host-shop/apply`
- `/partners/esthetician-apprenticeship/apply`
- `/partners/nail-technician-apprenticeship/apply`
**Fix:** "Apply for Booth Rental", "Partner Application"

---

## 37. ${state.careerTraining.headline} (3 routes)
- `/career-training/career-training/[state]` (3x)
**Fix:** Use dynamic state name in title

---

## 38. Verify Certificate (3 routes)
- `/certificates/verify/[certificateId]`
- `/verify/verify/[certificateId]`
- `/verify/verify`
**Fix:** Consolidate verify routes, use unique paths

---

## 39. Workforce Ready Grant (3 routes)
- `/check-eligibility`
- `/grants`
- `/onboarding/learner/funding`
**Fix:** Route-specific context

---

## 40. Support Services (3 routes)
- `/community-services`
- `/funding/jri`
- `/onboarding/learner/orientation`
**Fix:** Route-specific

---

## 41. Program not found (3 routes)
- `/compliance/wioa/programs/[slug]/initial-eligibility-aggregate-performance`
- `/compliance/wioa/programs/[slug]`
- `/compliance/wioa/programs/[slug]/section-188-equal-opportunity-checklist`
**Fix:** Add slug context to titles

---

## 42. Admin Dashboard (3 routes)
- `/dashboards`
- `/demos`
- `/store/demos`
**Fix:** "Custom Dashboards", "Demo Portal"

---

## 43. Employer Portal (7 routes) ⚠️ HIGH PRIORITY
- `/demos`
- `/portals`
- `/shop`
- `/store/demo/enterprise`
- `/store/demos`
- `/store/licenses/school-license`
- `/store`
**Fix:** Route-specific: "Demo Portal", "Enterprise License Portal"

---

## 44. Equal Opportunity (3 routes)
- `/employer/compliance`
- `/legal`
- `/policies`
**Fix:** Route-specific

---

## 45. For Students (3 routes)
- `/for-students/for-students`
- `/resources`
- `/resources/resources`
**Fix:** Delete duplicate directories

---

## 46. Case Management (3 routes)
- `/funding/jri`
- `/platform/workforce-boards`
- `/store/licenses/school-license`
**Fix:** Route-specific

---

## 47. Technical Support (5 routes)
- `/help`
- `/lms/help`
- `/lms/support`
- `/student-resources`
- `/support/help`
**Fix:** "Help Center", "LMS Support Portal"

---

## 48. Skilled Trades (3 routes)
- `/jobs`
- `/pathways`
- `/workone-partner-packet`
**Fix:** Route-specific

---

## 49. Student Handbook (3 routes)
- `/legal/student-handbook`
- `/lms/resources`
- `/onboarding/legal`
**Fix:** Route-specific

---

## 50. Certificates (3 routes)
- `/lms/certificates`
- `/lms/resources`
- `/store/course-builder`
**Fix:** "Your Certificates", "Certificate Builder"

---

## 51. Career Services (3 routes)
- `/lms/resources`
- `/lms/support`
- `/student-resources`
**Fix:** Route-specific

---

## 52. Attendance Policy (3 routes)
- `/onboarding/learner/agreements`
- `/onboarding/learner/handbook`
- `/policies`
**Fix:** Route-specific

---

## 53. For Employers (3 routes)
- `/resources`
- `/resources/resources`
- `/solutions`
**Fix:** Delete duplicate /resources/resources

---

## 54. Team Collaboration (3 routes)
- `/store/apps/grants`
- `/store/apps/sam-gov`
- `/store/course-builder`
**Fix:** Route-specific

---

## 55. Success Stories - Real People, Real Results (3 routes)
- `/success-stories/success-stories` (3x)
**Fix:** Delete duplicate /success-stories/success-stories

---

## Quick Wins (Duplicates from duplicate directories)

### Duplicate Directories to Delete:
1. `/blog/blog/` → Keep `/blog/`
2. `/resources/resources/` → Keep `/resources/`
3. `/success-stories/success-stories/` → Keep `/success-stories/`
4. `/for-students/for-students/` → Keep `/for-students/`

### Duplicate Metadata to Consolidate:
1. **Blog author/category routes** - Consolidate to single blog structure
2. **Verify routes** - Consolidate /verify/verify/ to /verify/
3. **Apply success pages** - Add context to titles

---

## Priority Actions

### P0 - Critical (SEO Impact)
1. Delete duplicate directories (`/blog/blog/`, etc.)
2. Fix "Employer Portal" on 7 routes
3. Fix "Start Training" on 5 routes
4. Fix "Training Providers" on 6 routes

### P1 - High
1. Fix all "Privacy Policy" variants
2. Fix all "Terms of Service" variants
3. Fix dynamic routes (blog, careers, verify)

### P2 - Medium
1. Fix remaining policy/privacy/security titles
2. Add context to success/confirmation pages
