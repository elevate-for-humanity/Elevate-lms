# 2Exclusive cleaning marketplace release

## Owner-selected terms

Provider pay is selected per cleaner-hour. Two cleaners working three hours is six cleaner-hours. Standard customer price is provider payment / 0.75; 2Exclusive retains 25% before expenses. Optional membership is $19 per paid month, with 10% off eligible cleaning and a $50 monthly cap. Cleaning is billed separately. Discounts reduce the platform share and never reduce agreed provider pay. Renewal uses monthly QuickBooks invoices, not automatic card debit. Existing paid benefits remain until expiry after cancellation.

## Implementation

- Customer booking, server-owned quote snapshots, invoice checkout, paid fulfillment and cancellation/refund-review states.
- Membership invoice checkout, verified paid-period activation, cancellation of renewal schedules, and payment-period reporting. Invoice creation cannot activate benefits.
- Postgres row locks serialize discount reservations and job acceptance. Quotes reserve remaining savings; expired/unpaid cancellations release them; paid jobs consume them. Provider locks prevent overlapping assignments.
- Private directory imports source applications without editing them. Entries are pending by default. Only an authenticated site owner can record an eligibility decision with evidence and email consent. This release does not approve any real company.
- Verified-email providers can set their own hourly rate and see their assignments. Eligibility, scope and customer price remain server-controlled.
- Individual job-offer emails use a durable outbox. Customer contact and access instructions are withheld until assignment. GET cannot claim a job. POST requires confirmation, matching origin and an expiring, hashed capability scoped to this website and provider.
- Ambiguous or interrupted email delivery is held for review instead of automatically resent. An owner-reviewed replacement rotates the offer capability and revokes the old link.
- Completion creates a reconciled provider-payable record, not a claim that funds were transferred. Payouts and refunds remain separate financial operations requiring actual payment records.
- The existing paid-invoice fulfillment worker processes cleaning notifications. Its response separately reports notification failures. No separate unverified scheduler or paid lead subscription is created.

## Verification completed in the working branch

Synthetic database transactions apply the migration, exercise the ledger and capability functions, and roll back all schema/data changes. They verify unpaid rejection, payment replay idempotency, cap sharing/release, unchanged provider pay, cancellation, invalid/cross-tenant/expired/revoked capabilities, replacement-link revocation, a second provider's rejected claim, overlap rejection, accounting reconciliation and denied anonymous table/RPC grants. These tests are sequential functional database tests, not a parallel production stress test.

Focused UI, API and regression tests cover intake preservation, quote-price tampering, verified-email requirements, same-origin acceptance, private-data filtering, isolated outbox sending and no automatic resend after an uncertain transport result. Existing paid application and store billing tests remain included.

## Production release gates — not yet certified

1. Required exact-commit CI, all affected production builds, protected merge and Google rollout must pass. The preceding local Admin build/typecheck was terminated with SIGKILL; this is not a verified OOM diagnosis.
2. Apply the versioned migration through the approved release path, then confirm RLS, privileges and database functions. No synthetic test records may persist.
3. Verify actual QuickBooks authorization, online invoice links, webhook signature verification, payment callback, renewal schedule and worker execution. Credential entries alone are not evidence of a working connection.
4. Review real provider rates, coverage, consent and applicable qualification evidence. At least one eligible provider is required before online purchases can begin. Owner authorization for a specific company remains separate from deploying this code.
5. Apply `prepareCleaningSiteConfig(current, true)` only after the matching source is deployed and the previous gates pass. Preserve the current website revision and Market Street Suite 560 address. Default preparation keeps online commerce disabled.
6. Verify authenticated desktop/mobile customer and provider flows, one real approved end-to-end transaction, actual email receipt, acceptance, ledger entries and the correct live commit. Do not claim marketplace launch from unit tests or a source-only PR.

## External lead sources

Yelp permits free claimed business listings to receive their own messages and quote requests. Thumbtack and Angi/HomeAdvisor charge for leads under their plans; free registration is not free access to all customer requests. Yelp's Leads API is an authorized partner/OAuth integration, not a public feed of other businesses' inquiries. No supported dedicated connector for those services was returned by the connected plugin directory search.

Public procurement sources suitable for research: SAM.gov Contract Opportunities, Indiana IDOA Current Business Opportunities, and Indianapolis/OpenGov bid opportunities. Record the source, deadline and scope. An opportunity is a lead until reviewed and won; do not dispatch an unawarded bid to providers as a confirmed job. No unsolicited outreach or paid lead purchases are authorized by this release.
