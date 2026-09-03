# Production Readiness Audit Rubric

## Scoring: Each category is PASS/FAIL with required evidence

---

## Category 1: Security Headers

**Required Evidence:** HTTP response headers from production/preview URL

| Check                     | Requirement            | Status | Evidence |
| ------------------------- | ---------------------- | ------ | -------- |
| Content-Security-Policy   | Present and configured |        |          |
| Strict-Transport-Security | max-age >= 31536000    |        |          |
| X-Frame-Options           | DENY or SAMEORIGIN     |        |          |
| X-Content-Type-Options    | nosniff                |        |          |
| Referrer-Policy           | Present                |        |          |
| Permissions-Policy        | Present                |        |          |

**Category Result:** [ ] PASS [ ] FAIL

---

## Category 2: Accessibility (WCAG 2.1 AA)

**Required Evidence:** Test logs, screenshots, manual verification

| Check                   | Requirement                              | Status | Evidence |
| ----------------------- | ---------------------------------------- | ------ | -------- |
| Automated axe-core scan | 0 critical/serious violations            |        |          |
| Keyboard navigation     | All interactive elements reachable       |        |          |
| Focus indicators        | Visible on all focusable elements        |        |          |
| Skip link               | Present and functional                   |        |          |
| Form error handling     | Errors announced, associated with fields |        |          |
| Color contrast          | 4.5:1 minimum for text                   |        |          |
| Heading hierarchy       | Logical order (h1 → h2 → h3)             |        |          |
| Alt text                | All images have descriptive alt          |        |          |
| ARIA labels             | Buttons/links have accessible names      |        |          |

**Category Result:** [ ] PASS [ ] FAIL

---

## Category 3: Performance

**Required Evidence:** Lighthouse report, Core Web Vitals

| Check                        | Requirement          | Status | Evidence |
| ---------------------------- | -------------------- | ------ | -------- |
| Lighthouse Performance       | >= 80                |        |          |
| Largest Contentful Paint     | < 2.5s               |        |          |
| First Input Delay            | < 100ms              |        |          |
| Cumulative Layout Shift      | < 0.1                |        |          |
| Time to Interactive          | < 3.8s               |        |          |
| No render-blocking resources | Or properly deferred |        |          |

**Category Result:** [ ] PASS [ ] FAIL

---

## Category 4: Compliance Content

**Required Evidence:** Page URLs with required content present

| Check                         | Requirement                 | Status | Evidence |
| ----------------------------- | --------------------------- | ------ | -------- |
| Privacy Policy                | Complete, accessible        |        |          |
| Terms of Service              | Complete, accessible        |        |          |
| Accessibility Statement       | Present with contact info   |        |          |
| Equal Opportunity Statement   | Present (required for WIOA) |        |          |
| Grievance/Complaint Procedure | Documented                  |        |          |
| Refund Policy                 | Clear and accessible        |        |          |
| ADA Accommodation Process     | Documented                  |        |          |
| Data Retention Policy         | Documented                  |        |          |
| WIOA Eligibility Criteria     | Accurate and complete       |        |          |

**Category Result:** [ ] PASS [ ] FAIL

---

## Category 5: Critical User Flows (E2E)

**Required Evidence:** Playwright test results with screenshots

| Flow               | Steps Tested              | Status | Evidence |
| ------------------ | ------------------------- | ------ | -------- |
| Inquiry submission | Form → API → Success      |        |          |
| Contact form       | Form → API → Success      |        |          |
| Program browsing   | List → Detail → CTA       |        |          |
| Eligibility check  | Quiz → Result             |        |          |
| Apply flow         | Start → Form → Submission |        |          |
| LMS login          | Auth → Dashboard          |        |          |
| Admin login        | Auth → Dashboard          |        |          |

**Category Result:** [ ] PASS [ ] FAIL

---

## Category 6: Security - Dependencies & Auth

**Required Evidence:** npm audit output, auth boundary tests

| Check                   | Requirement                        | Status | Evidence |
| ----------------------- | ---------------------------------- | ------ | -------- |
| npm audit               | 0 critical, 0 high vulnerabilities |        |          |
| Protected routes        | Return 401/403 without auth        |        |          |
| Rate limiting           | Present on form endpoints          |        |          |
| CSRF protection         | Tokens or SameSite cookies         |        |          |
| Sensitive data exposure | No secrets in client bundle        |        |          |

**Category Result:** [ ] PASS [ ] FAIL

---

## Overall Score

| Category                | Result |
| ----------------------- | ------ |
| 1. Security Headers     |        |
| 2. Accessibility        |        |
| 3. Performance          |        |
| 4. Compliance Content   |        |
| 5. Critical Flows       |        |
| 6. Security - Deps/Auth |        |

**Total: X/6 categories passing**

**Production Ready:** [ ] YES [ ] NO (requires all 6 PASS)
