# 2Exclusive cleaning marketplace release

## Owner decisions

- Providers choose their requested pay per cleaner-hour. Two cleaners for three hours equals six cleaner-hours.
- Standard customer cleaning price is provider payment divided by 0.75. This reserves 25% of the standard price before expenses for 2Exclusive.
- Optional Platinum membership: $19 per month, 10% off eligible cleaning, maximum $50 discount per paid membership month. Cleaning is separate. Provider payment is unchanged. No rollover.
- Pay-as-you-go has no membership fee. Membership is optional for recurring cleaning too.
- Current marketplace billing uses QuickBooks. Do not reactivate retired Stripe billing.
- The public membership component requests an invoice; it does not charge, schedule renewal, activate benefits, or assert a completed membership.
- No provider approval or agreement is created by these changes.

## Implemented in this change

- Integer-cent price calculations with validation, capped membership savings, and protected provider payment.
- Provider-rate field for the existing generic application form, with the amount retained in the saved application message.
- Optional validated rate on the structured hiring application; legacy profiles still parse.
- Provider sees the customer price, their payment and the platform share. No fabricated booking likelihood or earnings.
- Membership page renderer with fee, exclusions, cancellation, savings cap and invoice-request disclosures.
- Idempotent configuration preparation that preserves the corrected address and unrelated pages. Apply `prepareCleaningSiteConfig` only after matching renderer deployment.

## Required before claiming the whole marketplace is live

- Protected exact-commit CI, Google deployment, and public desktop/mobile verification.
- Apply the reviewed site configuration and verify rate persistence and membership invoice-request delivery.
- Connect membership invoices to verified paid periods and a server-owned savings ledger. Invoice requests are not paid members.
- Atomically reserve monthly savings when quoting or paying for a job; concurrent bookings must not exceed $50. Release reservations on cancellation. A browser calculator is not a ledger.
- Implement customer booking records with service, ZIP, requested time, scope, approved customer price, and provider payout.
- Implement an owner-reviewed provider directory. Application submission must not grant dispatch eligibility. Keep insurance evidence private.
- Send job offers individually to eligible, opted-in matching providers using a durable outbox. Keep customer contact, exact address and access codes out of broadcasts.
- Use expiring hashed capabilities, tenant scoping, POST confirmation and a database-level atomic claim so only one provider accepts. Email scanners must not claim jobs by opening links.
- Notify customer and operator of confirmed assignment; make failed delivery visible and prevent duplicate sends on ambiguous transport outcomes.
- Verify collection, provider payable, completion, cancellation and refunds through current billing paths before accepting live jobs.
- Establish real booking exposure/outcome data before showing likelihood-by-rate. Price comparisons are not booking probabilities.

## Release test cases

- Same provider pay before and after member discount; fractional-hour rounding; exact 75/25 base split.
- Multiple concurrent member jobs cannot overspend the cap. Unpaid, expired and canceled periods cannot grant benefits.
- Two providers accepting simultaneously produce one assignment. Expired, tampered, cross-tenant and revoked tokens fail.
- Only owner-approved eligible providers receive job offers, including after a provider is suspended.
- Member discount comes out of 2Exclusive's share; full agreed payout remains visible before acceptance.
- Retrying invoice requests, webhook events or dispatch attempts cannot double charge, duplicate entitlements or assign twice.
