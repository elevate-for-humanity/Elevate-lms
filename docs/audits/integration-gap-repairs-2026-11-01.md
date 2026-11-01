# Integration gap repairs — November 1, 2026

This audit distinguishes repository access, application runtime identity, saved configuration, provider authentication, durable writes, and end-to-end delivery. Passing one layer does not certify another.

| Finding traced line by line | Canonical repair | Evidence and remaining limit |
| --- | --- | --- |
| Studio repository capability checked environment strings and missed the configured GitHub App resolver | `lib/devstudio/repository-health.ts` and the existing repository health route use the canonical identity and validate the actual main reference | Tests reject HTTP 401/403/404/429/503, missing credentials and malformed refs; no credential values returned. Write/dispatch permission remains separate. |
| Resend and AI status reported healthy from saved keys and a historical provider order | `lib/admin/get-site-health.ts` performs bounded read-only Resend authentication and resolves the actual selected AI provider | Sending-only Resend keys remain unverified by the read-only probe; neither discovery nor authentication proves delivery or completed inference. QuickBooks permits refresh-token recovery when the access token is absent. |
| Webhook health swallowed database query errors and called an empty alert list healthy | `apps/admin/app/api/admin/webhook-health/route.ts` checks every summary query and awaits its error boundary | Failed queries return controlled failure, never fabricated zero counts. No activity is not healthy provider evidence. QuickBooks is included in webhook monitoring. |
| Jotform acknowledged failed writes and treated retries as non-fatal insert failures | Canonical Marketing ingestion verifies a saved duplicate without overwriting answers/processing state and requires a durable webhook receipt | Failed submission or receipt writes return retryable 503. Invalid JSON is rejected. LMS continues proxying to the canonical writer. |
| Existing optional Classroom sync ignored token persistence failures, had no central receipt, and could loop through pagination | Both existing sync entry points use `google-classroom-sync.ts`, fenced token persistence, bounded pagination and course-specific committed receipts | No Classroom account was activated. No imported courses or saved Classroom tokens were present. Classroom is optional and is not needed for Elevate's LMS or Calendar. |
| Classroom's partial unique index could not be inferred by PostgREST's `on_conflict=user_id,course_id` | Applied `20261101055459_repair_classroom_upsert_conflict_index.sql` | PostgreSQL regression reproduces the old failure and proves upsert, uniqueness, null-row preservation and idempotency. Production EXPLAIN resolves `google_classroom_sync_upsert_uidx` without inserting test data. |
| Payment-integrity views equated absence of Stripe with absence of payment and could duplicate application matches | Applied `20261101060000_repair_payment_integrity_provider_evidence.sql` | Exact enrollment-linked payment logs, captured net payments and paid invoices are recognized. Active subscriptions, unpaid invoices and fully refunded captures do not clear review. No enrollment, payment status, access, or unresolved flag was automatically changed. |
| Six historical unmatched payments were described as six proven enrollment failures | The existing paid-session view retains them and adds a review category | Five have no identified program; one has an enrollment link to review. Missing identities/programs do not authorize automatic enrollment. |
| Completed course attempts with historical storage errors could be classified as currently storage-blocked; cancelled revisions were not terminal in the monitor | `paris-monitor.mjs` classifies terminal attempts before historical errors and closes cancelled recovery intent | Monitor regressions preserve completed error evidence and prevent cancelled work from dispatching. Pauses, archived/published builds and active leases remain protected. |
| Automatic voicemail acceptance required an obsolete deployment job name | Existing speech verification workflow now requires `Deploy and verify Admin on Google` | Regression compares the actual deployment workflow job name and preserves the trusted-main/success guards. This is a synthetic non-delivering speech test, not an incoming-call or delivered-voicemail certification. |

## Validation

- Focused unit/route suites exercise rejected credentials, failed persistence, duplicate retries, malformed provider responses, pagination, and missing health evidence.
- PostgreSQL (PGlite) regressions run the real migration SQL.
- PARIS monitor/dispatcher and voicemail workflow regressions run with Node.
- All three application typechecks and full repository lint passed before the final audit refinements; release checks must run on the final commit.
- Both production migrations were applied and read back. Existing unresolved financial reviews remain visible.
- Marketing/Admin/LMS production builds and exact production SHA acceptance must be recorded independently; an in-progress build is not a deployment.

## External and runtime work still requiring evidence

- Intuit's existing authorization recovery tried the canonical and existing runtime clients; both returned `invalid_grant`. Fresh Intuit consent is required. Do not overwrite authorization with an unverified candidate.
- Google Calendar has no saved user connection. API enablement is not OAuth client configuration or user consent.
- PARIS settings, 22 extension routes, source parity, synthetic speech, DNS/TLS and SIP transport passed the latest inspected PBX audit. Actual registration, incoming calls, two-way audio, transcription and delivered voicemail remain separate acceptance tests.
- Course queue supervision is active, but historical failures, paused/archived/published attempts and current repair failures must remain distinct. Do not restart every failed row or clear error evidence to improve totals.
- Other providers still need their own authenticated handshake and committed operation evidence; registry membership is not activation.
