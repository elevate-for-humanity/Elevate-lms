# Testing Flow — DB Table Map

Audit date: 2026-06. All column references verified against migration files. No broken queries found.

---

## Tables

### `exam_bookings`
Migration: `20260601000005_baseline_untracked_tables.sql` + addons in `20260604000008`, `20260608000001`, `20260612000001`

| Column | Type | Added by |
|--------|------|----------|
| `id` | uuid PK | baseline |
| `exam_type` | text | baseline |
| `exam_name` | text | baseline |
| `booking_type` | text | baseline |
| `first_name` | text | baseline |
| `last_name` | text | baseline |
| `email` | text | baseline |
| `phone` | text | baseline |
| `organization` | text | baseline |
| `participant_count` | bigint | baseline |
| `preferred_date` | date | baseline |
| `preferred_time` | text | baseline |
| `alternate_date` | date | baseline |
| `notes` | text | baseline |
| `status` | text | baseline |
| `confirmed_date` | date | baseline |
| `confirmed_time` | text | baseline |
| `seat_number` | bigint | baseline |
| `confirmation_code` | text | baseline |
| `admin_notes` | text | baseline |
| `cancelled_at` | timestamptz | baseline |
| `cancelled_reason` | text | baseline |
| `created_at` | timestamptz | baseline |
| `updated_at` | timestamptz | baseline |
| `slot_id` | uuid → `testing_slots` | `20260604000009` |
| `user_id` | uuid → `auth.users` | `20260604000008` |
| `payment_status` | text | `20260604000008` |
| `payment_intent_id` | text | `20260604000008` |
| `fee_cents` | integer | `20260604000008` |
| `no_show_fee_paid` | boolean | `20260604000008` |
| `no_show_locked_at` | timestamptz | `20260604000008` |
| `attempts_used` | integer | `20260604000008` |
| `retake_fee_paid` | boolean | `20260604000008` |
| `exam_result` | text | `20260604000008` |
| `result_recorded_at` | timestamptz | `20260604000008` |
| `add_on` | boolean | `20260608000001` / `20260612000001` |
| `add_on_paid` | boolean | `20260608000001` / `20260612000001` |
| `calendly_scheduling_url` | text | `20260612000001` |

---

### `testing_slots`
Migration: `20260604000009_testing_slots_and_enforcement.sql`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `exam_type` | text |
| `start_time` | timestamptz |
| `end_time` | timestamptz |
| `capacity` | integer |
| `booked_count` | integer |
| `location` | text |
| `proctor_id` | uuid → `auth.users` |
| `notes` | text |
| `is_cancelled` | boolean |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

---

### `testing_enforcement`
Migration: `20260604000009_testing_slots_and_enforcement.sql`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `booking_id` | uuid → `exam_bookings` |
| `user_id` | uuid → `auth.users` |
| `email` | text |
| `enforcement_type` | text (`no_show` \| `retake` \| `reschedule`) |
| `fee_cents` | integer |
| `fee_paid` | boolean |
| `payment_intent_id` | text |
| `paid_at` | timestamptz |
| `locked_at` | timestamptz |
| `unlocked_at` | timestamptz |
| `created_at` | timestamptz |

---

### `testing_appointments`
Migration: `20260408000002_testing_appointments.sql`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `calendly_event_uri` | text UNIQUE |
| `calendly_invitee_uri` | text UNIQUE |
| `invitee_name` | text |
| `invitee_email` | text |
| `invitee_phone` | text |
| `exam_type` | text |
| `start_time` | timestamptz |
| `end_time` | timestamptz |
| `status` | text (`confirmed` \| `canceled` \| `completed` \| `no_show`) |
| `cancel_url` | text |
| `reschedule_url` | text |
| `stripe_payment_intent` | text |
| `notes` | text |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

---

### `testing_appointment_reminders`
Migration: `20260408000002_testing_appointments.sql`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `appointment_id` | uuid → `testing_appointments` |
| `type` | text (`24h` \| `1h`) |
| `send_at` | timestamptz |
| `sent` | boolean |
| `sent_at` | timestamptz |
| `canceled` | boolean |
| `created_at` | timestamptz |

---

### `exam_booking_leads`
Migration: `20260608000002_exam_booking_leads.sql`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `email` | text |
| `exam_type` | text |
| `first_name` | text |
| `phone` | text |
| `source` | text |
| `converted` | boolean |
| `converted_at` | timestamptz |
| `follow_up_1_sent` | boolean |
| `follow_up_2_sent` | boolean |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

Unique index on `(lower(email), exam_type)`.

---

## Page → Table Map

| Page / Route | Tables Read | Tables Written |
|---|---|---|
| `app/testing/page.tsx` | — (static config only) | — |
| `app/testing/book/page.tsx` | — (static config only) | — |
| `app/testing/book/success/page.tsx` | — (static config only) | — |
| `app/testing/[provider]/page.tsx` | — (static config only) | — |
| `app/testing/accommodations/page.tsx` | — (static config only) | — |
| `app/certification-testing/page.tsx` | — (static config only) | — |
| `app/admin/testing/page.tsx` | `exam_bookings`, `testing_slots` | — |
| `app/admin/testing/TestingAdminClient.tsx` | — (client, uses props) | `exam_bookings` (via API), `testing_slots` (via API) |
| `app/api/testing/book/route.ts` | `testing_slots` | `exam_bookings` |
| `app/api/testing/checkout/route.ts` | — (Stripe only) | — |
| `app/api/testing/webhook/route.ts` | `exam_bookings` | `exam_bookings`, `testing_enforcement` |
| `app/api/testing/booking-status/route.ts` | `exam_bookings` | — |
| `app/api/testing/bookings/[id]/route.ts` | `profiles`, `exam_bookings` | `exam_bookings` |
| `app/api/testing/slots/route.ts` | `testing_slots` | `testing_slots` |
| `app/api/testing/slots/public/route.ts` | `testing_slots` | — |
| `app/api/testing/enforcement/route.ts` | `testing_enforcement` | — |
| `app/api/testing/enforcement/checkout/route.ts` | `testing_enforcement` | — (Stripe only) |
| `app/api/testing/retake/route.ts` | `exam_bookings` | `exam_bookings`, `testing_enforcement` |
| `app/api/testing/leads/route.ts` | — | `exam_booking_leads` |
| `app/api/testing/calendly-webhook/route.ts` | `testing_appointments` | `testing_appointments`, `testing_appointment_reminders` |
| `app/api/internal/testing-reminders/route.ts` | `testing_appointment_reminders` (+ join `testing_appointments`) | `testing_appointment_reminders` |
| `app/api/cron/testing-no-show/route.ts` | `exam_bookings`, `testing_enforcement` | `exam_bookings`, `testing_enforcement` |
| `app/api/cron/testing-lead-followup/route.ts` | `exam_booking_leads` | `exam_booking_leads` |

---

## Audit Result

**No broken queries found.** Every column referenced in code exists in the migration schema. All tables have migrations. No PostgREST join issues (testing tables use `user_id → auth.users`, not profiles — no join syntax used).
