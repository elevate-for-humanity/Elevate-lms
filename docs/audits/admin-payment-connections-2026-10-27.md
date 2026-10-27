# Admin payment connections — October 27, 2026

## Verified production data

The primary Elevate project has three active subscription plans: Solo ($29 monthly/$290 annual), Business ($59/$590), Professional ($99/$990). The admin subscription-history query incorrectly embedded `tenants`; its actual foreign key is `organization_id -> organizations`. Query errors were hidden as empty history. Corrected the relationship, surfaced lookup failures, and added the actual active plan catalog.

Five current apprentice tuition schedules are paused. Four have no provider configuration and one awaits payer approval. A sixth schedule is canceled. No current schedule has verified active automatic collection. Three recurring-release rows are requested. Two rows are labeled approved but have no document path or reviewer ID; their labels alone are not proof of a signed release. No approval, signature, bank verification, payment, tuition amount, or recurring mandate was fabricated or activated by this audit. Jordan's existing $75/week schedule has no stored installment cap; its agreed balance and end condition require review before enabling automatic collection.

Three payroll profiles have no linked QuickBooks employee ID and no enabled direct deposit. Two February payroll-run rows have zero totals and no employee count; they are not evidence of processed payroll. The admin Run Payroll action incorrectly called the marketplace creator payout endpoint. Replaced it with the real QuickBooks connection/employee verification workspace, explicit Intuit payroll handoff, actual recorded dates, and a working authenticated CSV export. QuickBooks Online Accounting authorization is not evidence that the separate Intuit payroll service/API has been activated. Actual company payroll enrollment, employee setup, tax/direct-deposit setup and approved pay runs remain external provider steps.

QuickBooks OAuth company/token settings exist. Explicit payout bank/clearing and contractor expense account mappings were not found in app_settings. The integration's actual-account selector must be completed before recording contractor payouts. Thirteen external holders were separately verified as contractors in the correct company; W-9/bank completion remains individual. No funds were sent.

## Logic repaired

- Recognize WIOA ITA, WIOA_ITA and WRG State funding aliases as non-student-pay funding, including apprentices; paid-in-full learners retain their exemption.
- Creating an existing schedule now returns a conflict rather than resetting an active provider agreement, billing amount or consent state through an upsert.
- Provider setup/resume verifies signed-release evidence, reviewer, customer, amount and cadence rather than trusting an approved label alone.
- Pause/resume/cancel now act on the actual PayPal subscription and verify its state before committing local status. Missing consent and provider failures cannot report success. Ended agreements cannot resume. A failed local save after resume attempts to suspend collection again.
- Lifecycle synchronization checks current provider state to avoid stale events reporting a canceled or suspended subscription as active.
- QuickBooks invoice/payment writes use its documented requestid query parameter, preserving a stable ID on retries. A missing provider payment ID cannot mark the local invoice paid.
- Billing actions and export require actual billing administrators; forms recover from network failures and do not reference an invalid React event after awaiting a response. PayPal requests have bounded timeouts.

## Remaining acceptance

Provider account mapping, missing signed releases/review evidence, payer approval and actual Intuit Payroll activation must be completed before calling these accounts payment-ready. Self-pay enrollment labels alone do not prove an unpaid obligation or permission to debit; broader non-apprentice coverage needs verified individual tuition terms. Existing local approval labels were preserved for review, not silently rewritten. The prior profile-authority migration remains a separate unresolved deployment/security gate.

Automated test and production-build results are recorded in the integration PR after the final combined tree is validated. Merging source is separate from Google deployment and real provider acceptance.
