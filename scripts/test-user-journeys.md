# Core User Journey Testing Checklist

## Test Environment

- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Journey 1: Apply for Program

### Steps:

1. [ ] Visit homepage (/)
2. [ ] Click "Apply Now" button
3. [ ] Verify /apply page loads
4. [ ] Fill out application form:
   - [ ] Personal information
   - [ ] Contact details
   - [ ] Program selection
   - [ ] Employment status
   - [ ] Education background
5. [ ] Submit application
6. [ ] Verify success message
7. [ ] Check email confirmation sent

### Expected Results:

- ✅ All form fields visible and functional
- ✅ Validation works (required fields, email format, phone format)
- ✅ Submit button enabled after form completion
- ✅ Success page shows after submission
- ✅ Email confirmation received within 5 minutes

### Mobile-Specific Checks:

- [ ] Form fields are tappable (min 44x44px)
- [ ] Text is readable (no light gray on white)
- [ ] Keyboard doesn't obscure fields
- [ ] Submit button visible without scrolling

---

## Journey 2: Login Flow

### Steps:

1. [ ] Visit /login
2. [ ] Enter email and password
3. [ ] Click "Sign In"
4. [ ] Verify redirect to appropriate dashboard
5. [ ] Test "Forgot Password" link
6. [ ] Test magic link login
7. [ ] Test logout

### Expected Results:

- ✅ Login form loads without infinite spinner
- ✅ Credentials validated
- ✅ Redirect to correct dashboard based on role:
  - Student → /student/dashboard
  - Instructor → /instructor/dashboard
  - Admin → /admin
  - Employer → /employer/dashboard
- ✅ Session persists on page refresh
- ✅ Logout clears session

### Mobile-Specific Checks:

- [ ] Password field has show/hide toggle
- [ ] Keyboard type is "email" for email field
- [ ] No layout shift when keyboard appears
- [ ] Remember me checkbox is tappable

---

## Journey 3: Browse Programs

### Steps:

1. [ ] Visit /programs
2. [ ] Verify all program cards load
3. [ ] Click on a program (e.g., Healthcare)
4. [ ] Verify program detail page loads
5. [ ] Check video hero plays
6. [ ] Scroll through program details
7. [ ] Click "Apply Now" CTA
8. [ ] Verify redirect to /apply with program pre-selected

### Expected Results:

- ✅ All program cards visible with images
- ✅ Text is readable (proper contrast)
- ✅ Program detail pages load
- ✅ Video hero plays without poster image
- ✅ All sections render correctly
- ✅ CTAs are functional

### Mobile-Specific Checks:

- [ ] Program cards stack vertically
- [ ] Images load and scale properly
- [ ] Video controls are accessible
- [ ] Text doesn't overflow containers
- [ ] CTAs are thumb-friendly

---

## Journey 4: Download Resources

### Steps:

1. [ ] Visit /downloads
2. [ ] Verify all download categories visible
3. [ ] Click on a handbook (e.g., Student Handbook)
4. [ ] Verify PDF opens/downloads
5. [ ] Test form downloads
6. [ ] Test guide downloads

### Expected Results:

- ✅ Download page loads
- ✅ All categories visible
- ✅ PDFs open in new tab or download
- ✅ File names are descriptive
- ✅ No broken links

### Mobile-Specific Checks:

- [ ] Download buttons are tappable
- [ ] PDFs render on mobile browsers
- [ ] Download progress visible
- [ ] Files save to device

---

## Journey 5: LMS Access (Unauthenticated)

### Steps:

1. [ ] Visit /lms (not logged in)
2. [ ] Verify public landing page loads
3. [ ] Check "Access LMS" button
4. [ ] Verify redirect to /dashboards or /login
5. [ ] No infinite loading spinner

### Expected Results:

- ✅ Public LMS landing page visible
- ✅ Marketing content loads
- ✅ CTAs redirect appropriately
- ✅ No authentication errors shown to public

### Mobile-Specific Checks:

- [ ] Hero section readable
- [ ] Stats cards visible
- [ ] CTAs accessible
- [ ] No layout breaks

---

## Journey 6: Dashboard Access (Authenticated)

### Steps:

1. [ ] Login as student
2. [ ] Visit /dashboards
3. [ ] Click "Student Dashboard"
4. [ ] Verify dashboard loads with real data
5. [ ] Check course cards
6. [ ] Test navigation

### Expected Results:

- ✅ Dashboard loads without infinite spinner
- ✅ Real data displayed (not mock data)
- ✅ Navigation works
- ✅ All widgets functional

### Mobile-Specific Checks:

- [ ] Dashboard cards stack properly
- [ ] Stats are readable
- [ ] Navigation menu accessible
- [ ] No horizontal scroll

---

## Journey 7: Contact Form

### Steps:

1. [ ] Visit /contact
2. [ ] Fill out contact form
3. [ ] Submit
4. [ ] Verify success message

### Expected Results:

- ✅ Form loads
- ✅ All fields functional
- ✅ Validation works
- ✅ Submission successful
- ✅ Confirmation shown

---

## Critical Issues to Watch For

### Desktop:

- [ ] No infinite loading spinners
- [ ] All images load
- [ ] No 404 errors
- [ ] Forms submit successfully
- [ ] Authentication works
- [ ] Redirects work correctly

### Mobile:

- [ ] Text is readable (no light gray on white)
- [ ] Buttons are tappable (min 44x44px)
- [ ] No layout overflow
- [ ] No overlapping elements
- [ ] Navigation menu works
- [ ] Forms are usable
- [ ] Videos play

---

## Test Results

### Desktop Chrome:

- [ ] All journeys passed
- [ ] Issues found: **\*\***\_\_\_**\*\***

### Desktop Firefox:

- [ ] All journeys passed
- [ ] Issues found: **\*\***\_\_\_**\*\***

### Mobile Safari:

- [ ] All journeys passed
- [ ] Issues found: **\*\***\_\_\_**\*\***

### Mobile Chrome:

- [ ] All journeys passed
- [ ] Issues found: **\*\***\_\_\_**\*\***

---

## Sign-off

- [ ] All critical journeys tested
- [ ] All blockers resolved
- [ ] Mobile experience verified
- [ ] Ready for production

**Tested by:** **\*\***\_\_\_**\*\***
**Date:** **\*\***\_\_\_**\*\***
**Approved by:** **\*\***\_\_\_**\*\***
