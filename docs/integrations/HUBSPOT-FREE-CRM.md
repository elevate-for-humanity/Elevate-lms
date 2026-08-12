# HubSpot Free CRM Integration

## Purpose

HubSpot is a secondary CRM for recruitment and relationship management. Supabase remains the authoritative system of record for applications, enrollments, academic records, apprenticeship hours, documents, credentials, and learner progress.

## Billing guardrail

This integration is intentionally limited to HubSpot CRM functionality supported on the Free tier. It does not call HubSpot workflows, campaigns, marketing email, subscriptions, invoices, quotes, products, paid automation, or other paid-only services.

Adding these environment variables does not purchase or upgrade a HubSpot plan. Do not enable a HubSpot paid subscription as part of this integration.

## Production environment variables

Set secrets in the deployment platform secret store. Never commit real credentials.

```text
HUBSPOT_SYNC_ENABLED=false
HUBSPOT_PRIVATE_APP_TOKEN=
```

`HUBSPOT_SYNC_ENABLED` must remain `false` until a private app/access token with the minimum required CRM scope is installed in the runtime environment and a test sync succeeds.

Minimum intended scope:

```text
crm.objects.contacts.write
```

Read scopes may be added only if a repository feature actually needs them.

## Current implementation

- `lib/integrations/hubspot/free-crm.ts`
  - Uses native `fetch`; no HubSpot SDK dependency.
  - Upserts a contact by email.
  - Uses only standard contact fields.
  - Treats HubSpot failures as non-fatal.
  - Hard-limits the adapter to contacts.
- `GET /api/admin/integrations/hubspot/status`
  - Admin-only.
  - Reports enabled/configured state without exposing credentials.
  - Reports `paidFeaturesEnabled: false`.

## Intended application sync

After a successful Supabase application insert, sync only these CRM fields:

- email
- first name
- last name
- phone
- city
- state
- ZIP
- lifecycle stage = lead

Do not place SSN, date of birth, income/eligibility documentation, uploaded documents, credentials, academic progress, OJT/RTI hours, financial-aid records, or other sensitive/regulated program records in this basic CRM sync.

## Deduplication

HubSpot contact identity uses normalized email. Supabase remains responsible for application-level deduplication by email/program/phone and its internal application ID/reference number.

## Activation checklist

1. Create or use a HubSpot private app with only the required CRM contact write scope.
2. Store its token as `HUBSPOT_PRIVATE_APP_TOKEN` in the deployment secret store.
3. Keep `HUBSPOT_SYNC_ENABLED=false` for the first deployment.
4. Verify `/api/admin/integrations/hubspot/status` returns `configured: true` and `paidFeaturesEnabled: false`.
5. Run one controlled contact sync and verify no duplicate was created.
6. Set `HUBSPOT_SYNC_ENABLED=true` only after the controlled test passes.
7. Do not add paid HubSpot objects or automation without a separate cost review.
