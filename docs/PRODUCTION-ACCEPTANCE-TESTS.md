# PRODUCTION ACCEPTANCE TESTS
## Elevate for Humanity Platform

**Date:** July 16, 2026  
**Status:** READY TO EXECUTE

---

## TEST EXECUTION INSTRUCTIONS

1. Execute tests in order listed below
2. Record PASS/FAIL for each test
3. Document any failures with screenshots
4. Escalate blocking issues immediately
5. Do not proceed to next phase if blocking issues remain

---

## PRE-DEPLOYMENT TESTS

### 1. Build Verification
```bash
# Test: Verify build succeeds
npm run build
# Expected: Build completes without errors
# If fails: Do not deploy
```

### 2. TypeScript Check
```bash
# Test: Verify TypeScript compiles
npx tsc --noEmit
# Expected: 0 errors (or baseline errors)
# If > baseline: Fix errors before deploying
```

### 3. ESLint Check
```bash
# Test: Verify no linting errors
npm run lint
# Expected: 0 errors
# If fails: Fix linting errors
```

---

## SMOKE TESTS (Run Immediately After Deploy)

### 4. Homepage Load
```
URL: https://www.elevateforhumanity.org/
Method: GET
Expected: 200 OK, no JavaScript errors
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 5. API Version Endpoint
```
URL: https://www.elevateforhumanity.org/api/version
Method: GET
Expected: JSON with gitSha, buildId, imageTag
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 6. Non-www Redirect
```
URL: https://elevateforhumanity.org/
Method: GET (Follow redirects: false)
Expected: 308 redirect to www.elevateforhumanity.org/
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 7. Redirect Path Preservation
```
URL: https://elevateforhumanity.org/programs/barber-apprenticeship?ref=test
Method: GET
Expected: 308 redirect to www.elevateforhumanity.org/programs/barber-apprenticeship?ref=test
Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## PUBLIC PAGE TESTS

### 8. Apply Page
```
URL: https://www.elevateforhumanity.org/apply
Method: GET
Expected: 200 OK, form visible
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 9. Apply Form Submission
```
URL: https://www.elevateforhumanity.org/apply
Method: POST (via form)
Data: {
  full_name: "Test User",
  email: "test@example.com",
  phone: "3175551234",
  dob: "1990-01-01",
  county: "Marion",
  program: "barber-apprenticeship",
  funding_needed: "yes",
  consent: true
}
Expected: 200 OK, database record created, email sent
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 10. Barber Apprenticeship Page
```
URL: https://www.elevateforhumanity.org/programs/barber-apprenticeship
Method: GET
Expected: 200 OK, no JavaScript errors, page renders
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 11. Barber Apply Page
```
URL: https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply
Method: GET
Expected: 200 OK, payment options visible
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 12. Testing Center Page
```
URL: https://www.elevateforhumanity.org/testing
Method: GET
Expected: 200 OK, providers listed
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 13. Funding Page
```
URL: https://www.elevateforhumanity.org/funding
Method: GET
Expected: 200 OK, eligibility checker visible
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 14. Store Page
```
URL: https://www.elevateforhumanity.org/store
Method: GET
Expected: 200 OK, pricing displayed
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 15. Login Page
```
URL: https://www.elevateforhumanity.org/login
Method: GET
Expected: 200 OK, login form visible
Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## WORKFLOW TESTS

### 16. Application Workflow
```
Steps:
1. Visit /apply
2. Select "Student" tab
3. Fill form with test data
4. Submit
5. Check database for record
6. Check email for confirmation

Expected: 
- Form submits successfully
- Database record created in intakes table
- Confirmation email sent
- Redirect to confirmation page

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 17. Barber Application Workflow
```
Steps:
1. Visit /programs/barber-apprenticeship
2. Click "Apply Now"
3. Select "Self-pay with payment plan"
4. Fill application
5. Submit
6. Check database

Expected:
- Page loads without error
- Form submits
- Database record created
- Redirect to success page

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 18. Host Shop Inquiry
```
Steps:
1. Visit /programs/barber-apprenticeship/host-shops
2. Click "General Inquiry"
3. Fill form
4. Submit

Expected:
- Form submits
- Database record created
- Confirmation displayed

Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## AUTHENTICATION TESTS

### 19. Student Login
```
Steps:
1. Visit /login
2. Enter test student credentials
3. Click Sign In

Expected:
- Login succeeds
- Redirect to /lms/dashboard
- Dashboard displays student data

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 20. Admin Login
```
Steps:
1. Visit /login
2. Enter admin credentials
3. Click Sign In

Expected:
- Login succeeds
- Redirect to /admin/dashboard
- Dashboard displays admin data

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 21. Employer Login
```
Steps:
1. Visit /login
2. Enter employer credentials
3. Click Sign In

Expected:
- Login succeeds
- Redirect to employer dashboard
- Dashboard displays employer data

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 22. Password Reset Flow
```
Steps:
1. Visit /login
2. Click "Forgot password?"
3. Enter email
4. Check email for reset link
5. Click reset link
6. Set new password
7. Login with new password

Expected:
- Email sent with reset link
- Link works
- Password changed
- Can login with new password

Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## PAYMENT TESTS

### 23. Payment Calculator
```
URL: /programs/barber-apprenticeship (scroll to payment section)
Expected: Calculator visible, down payment options work
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 24. Stripe Checkout Redirect
```
Steps:
1. Select payment plan
2. Click "Continue to Payment"
3. Complete Stripe checkout

Expected:
- Redirect to Stripe Checkout
- Payment processes
- Webhook received
- Database updated
- Redirect to success page

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 25. Payment Webhook
```
Test: Trigger test webhook from Stripe CLI
Command: stripe trigger payment_intent.succeeded

Expected:
- Webhook received
- Database updated
- Enrollment created

Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## PORTAL TESTS

### 26. Student Dashboard
```
URL: /lms/dashboard (authenticated)
Expected: Dashboard loads with student data
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 27. Student Courses
```
URL: /lms/courses (authenticated)
Expected: Course list loads
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 28. Student Attendance
```
URL: /lms/attendance (authenticated)
Expected: Attendance page loads, clock in works
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 29. Admin Dashboard
```
URL: /admin/dashboard (authenticated as admin)
Expected: Admin dashboard loads with metrics
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 30. Admin Students
```
URL: /admin/students (authenticated as admin)
Expected: Student list loads with pagination
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 31. Admin Applications
```
URL: /admin/applications (authenticated as admin)
Expected: Application queue loads
Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## API TESTS

### 32. GET /api/version
```
curl https://www.elevateforhumanity.org/api/version

Expected Response:
{
  "service": "marketing",
  "environment": "production",
  "gitSha": "...",
  "buildId": "...",
  "imageTag": "...",
  "imageDigest": "..."
}

Status: [ ] PASS [ ] FAIL
Notes: 
```

### 33. POST /api/intake
```
curl -X POST https://www.elevateforhumanity.org/api/intake \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com"}'

Expected: 200 OK, record created
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 34. Testing Slots API
```
curl https://www.elevateforhumanity.org/api/testing/slots

Expected: 200 OK, slots array
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 35. Credential Verification
```
URL: /verify/[credential_id]
Method: GET
Expected: Credential details displayed
Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## REGRESSION TESTS

### 36. Navigation Works on All Pages
```
Test: Click every main nav item from homepage
Expected: All links work, no 404s
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 37. Mobile Navigation
```
Test: View site on mobile viewport
Expected: Hamburger menu works, all pages accessible
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 38. Footer Links
```
Test: Click every footer link
Expected: All links work, no 404s
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 39. Cookie Banner
```
Test: Visit site, accept cookies
Expected: Banner dismisses, preference saved
Status: [ ] PASS [ ] FAIL
Notes: 
```

### 40. Language Selector
```
Test: Click language selector, change language
Expected: Site displays in selected language
Status: [ ] PASS [ ] FAIL
Notes: 
```

---

## TEST RESULTS SUMMARY

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Pre-Deployment | 3 | 0 | 0 | 0 |
| Smoke Tests | 4 | 0 | 0 | 0 |
| Public Pages | 7 | 0 | 0 | 0 |
| Workflows | 3 | 0 | 0 | 0 |
| Authentication | 4 | 0 | 0 | 0 |
| Payments | 3 | 0 | 0 | 0 |
| Portals | 6 | 0 | 0 | 0 |
| APIs | 4 | 0 | 0 | 0 |
| Regression | 5 | 0 | 0 | 0 |
| **TOTAL** | **39** | **0** | **0** | **0** |

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |
| DevOps | | | |

---

*Document Version: 1.0*
*Last Updated: July 16, 2026*
