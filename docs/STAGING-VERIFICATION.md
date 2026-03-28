# Staging Verification Checklist

Run this before declaring the enrollment-payment pipeline production-safe.

## Environment requirements

All of the following must be set in the staging environment:

```
NEXT_PUBLIC_SITE_URL=https://staging.yourdomain.com   # required — wrong value breaks redirects
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...                          # Stripe test mode
STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=...                                     # or SENDGRID_API_KEY
```

## What is already proven (dev environment, failure injection)

| Route | Test | Result |
|---|---|---|
| `POST /api/enroll/cna?fail=true` | Injected failure | HTTP 500, `{"success":false}`, no fake ID |
| `POST /api/store/cart-checkout?fail=true` | Injected failure | HTTP 303 → `/store/cart?error=checkout-failed` |
| `POST /api/stripe/checkout?fail=true` | Injected failure | HTTP 303 → `/store?error=checkout-failed` |
| `guard-no-fake-success.mjs` | Static analysis | Pass |
| `guard-critical-routes.mjs` | Static analysis | Pass |

## What must be proven in staging

### 1. Happy path — DB write and UUID return

```bash
# Run the verification script against staging
BASE=https://staging.yourdomain.com bash scripts/verify-failure-paths.sh
```

Expected for `POST /api/enroll/cna` happy path:
- HTTP 200
- Body contains `"enrollmentId":"<real-uuid>"` (UUID format, not timestamp)
- Row exists in `program_enrollments` table with matching ID

Verify in Supabase Dashboard:
```sql
SELECT id, email, status, created_at
FROM program_enrollments
ORDER BY created_at DESC
LIMIT 5;
```

### 2. Email fires only after DB success

- Submit a test enrollment
- Confirm DB row exists first (step above)
- Check Resend/SendGrid dashboard — confirmation email should appear
- Inject failure (`?fail=true`) — confirm no email is sent

### 3. Stripe session never created on failure

- Submit `POST /api/stripe/checkout?fail=true`
- Check Stripe Dashboard → Checkout Sessions
- No new session should appear for the test period

### 4. Redirect host correctness

- Submit `POST /api/stripe/checkout?fail=true` from staging
- Confirm `Location` header points to `https://staging.yourdomain.com/store?error=checkout-failed`
- Not `http://localhost:3000/...`

### 5. User-facing error state

- Navigate to `/store/cart?error=checkout-failed` in a browser
- Confirm the inline error banner renders: "We could not start your checkout session. Please try again."
- Navigate to `/platform/[slug]?error=payment-unavailable`
- Confirm the inline error banner renders

### 6. Signout redirect

- Sign in, then POST to `/api/auth/signout`
- Confirm redirect to `/` (not raw JSON)
- Confirm session is cleared

## Acceptance standard

All 6 sections must pass before the pipeline is declared production-safe.

Failure-path integrity is proven. Happy-path persistence, email sequencing, and Stripe live behavior are the remaining gaps — all environment-bound, not code-bound.
