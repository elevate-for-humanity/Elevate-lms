# Apprentice dashboard follow-up audit — 2 November 2026

Source baseline: 90def45cf97d7e9141197e017629283b033b97d1. Live primary database inspected read-only.

## Verified repairs

- Barber billing selected `next_payment_date`, absent from the live `barber_subscriptions` schema. Remove that field from the barber query; retain the canonical billing schedule date. Query errors now propagate rather than masquerading as a missing tuition account. Authorization and schedule query errors also propagate.
- Home, records and Documents used different document completion rules. A shared checklist now counts required learner uploads plus the electronic apprenticeship agreement, excludes employer-only paperwork, preserves immutable accepted evidence when newer pending duplicates exist, and discloses missing checklist configuration.
- The upload API no longer offers or accepts electronic agreements or employer-only requirements as learner uploads.

## Evidence and scope

102 statically identifiable database SELECT expressions were compared against the live catalog across 71 apprentice route, API and shared apprenticeship source files. One actual missing column was identified; the RTI `submitted_at:created_at` expression is an intentional PostgREST alias. Dynamic query construction, joined relations, runtime credentials and browser behavior are outside this static check.

13 active apprenticeship enrollments have profiles. One lacks a direct course ID but already has a published canonical program-course mapping used by the existing runtime fallback; no database rewrite is required. Correction after identity and shop-document reconciliation: Corienne Meid and Paola Petit are partner/owner accounts with legacy program enrollments. They are not established as apprentices by those enrollments, and missing apprentice placements are not shop-document failures. Both canonical partner records have documents_verified, mou_signed and onboarding_completed true; all six partner document types have accepted evidence with file links. The remaining apprentice-role account with no placement is Edgar Hernandez; the explicitly named Test Barber Student is a separate test record. No authoritative new placement assignment was available, and none was fabricated. No duplicate active apprentice identities or duplicate active placements were found.

The system_errors table had no apprentice-matching errors in the seven-day query. This is not proof of error-free runtime behavior. Security advisors were read; service-only tables with RLS and no client policy were not opened to clients merely to remove advisor notices.

## Validation

108 tests pass in 31 focused test files, including billing schema/error behavior, checklist consistency, preview boundaries, hours, transfer evidence, published lesson progress, timeclock, workbook and navigation regressions. Changed production source ESLint and git diff whitespace checks pass. Full LMS TypeScript and deployment acceptance are tracked separately; neither a unit-test pass nor an anonymous login redirect establishes authenticated production acceptance.

No learner hours, approvals, payments, enrollment statuses or production credentials were changed by this audit. Authenticated per-account browser acceptance, actual GPS attendance and provider payment completion remain unverified.
