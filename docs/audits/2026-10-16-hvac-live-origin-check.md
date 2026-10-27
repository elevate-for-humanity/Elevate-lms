# Live HVAC clock-in audit

The merged HVAC release deployed successfully on Google. The live GET /api/attendance/online returns the expected 401 authentication response instead of 404. The runtime dependency and readiness checks verified the merged commit and Supabase connectivity.

A live POST with Origin https://app.elevateforhumanity.org returned 403 Invalid request origin before authentication. The route compared the public browser origin to request.nextUrl.origin, which can identify the internal Cloud Run address.

The correction compares the Origin header to LMS_HOST from the canonical portal registry. Same-origin local development is allowed outside production. Forwarding headers cannot establish trust. Authentication, enrollment ownership, server time and staff review remain enforced.

Regression: a simulated internal request URL with a canonical public Origin reproduces 403 before the fix, then reaches the expected 401 authentication boundary after the fix. Foreign origins still return 403, null request bodies return 400, and client-supplied user IDs are ignored. LMS typecheck and focused ESLint pass. The live database foreign keys for enrollment-to-course and session-to-attendance are present. The PostgreSQL attendance regression suite passes.

No student hours were fabricated or added during the audit. A genuine authenticated learner clock-in/out remains unverified until the corrected application is deployed.
