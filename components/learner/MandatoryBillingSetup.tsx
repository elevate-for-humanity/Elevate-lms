import Link from 'next/link';
import { AlertCircle, BadgeCheck, CreditCard } from 'lucide-react';
import { AffirmInvoiceButton } from '@/components/payments/AffirmInvoiceButton';
import type { LearnerBillingRequirement } from '@/lib/billing/learner-billing-requirement';

export function MandatoryBillingSetup({
  requirement,
  readOnly = false,
}: {
  requirement: LearnerBillingRequirement;
  readOnly?: boolean;
}) {
  if (!requirement.required) return null;

  const complete = requirement.status === 'active';
  const heading = complete ? 'Billing setup complete' : 'Mandatory billing to-do';
  const copy = {
    configuration_required:
      'Your self-pay enrollment requires a recurring-payment release. Elevate must finish your payment terms before the release can be issued; this task stays open until the release is approved.',
    release_required:
      requirement.authorizationStatus === 'rejected'
        ? `Replace the recurring-payment release before automatic payments can be enabled.${requirement.rejectionReason ? ` Correction needed: ${requirement.rejectionReason}` : ''}`
        : 'Upload the signed recurring-payment release. After staff approval, approve the PayPal billing agreement once. QuickBooks will record confirmed payments.',
    release_submitted:
      'Your recurring-payment release was submitted and is awaiting staff approval. This required task remains open until approval is complete.',
    paypal_approval_required:
      'Your recurring-payment release is approved. Complete the PayPal billing agreement to activate automatic payments; QuickBooks will record each confirmed payment.',
    active:
      'Your recurring-payment release and PayPal automatic-payment agreement are active. QuickBooks records confirmed payments.',
    not_required: '',
  }[requirement.status];

  return (
    <section
      role={complete ? undefined : 'alert'}
      className={`rounded-2xl border-2 p-5 shadow-sm ${complete ? 'border-emerald-300 bg-emerald-50' : 'border-red-400 bg-red-50'}`}
    >
      <div className="flex gap-3">
        {complete ? (
          <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
        ) : (
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-black uppercase tracking-widest ${complete ? 'text-emerald-800' : 'text-red-800'}`}
          >
            {requirement.programName || 'Self-pay program'}
          </p>
          <h2
            className={`mt-1 text-xl font-black ${complete ? 'text-emerald-950' : 'text-red-950'}`}
          >
            {heading}
          </h2>
          <p
            className={`mt-2 text-sm font-semibold leading-6 ${complete ? 'text-emerald-900' : 'text-red-900'}`}
          >
            {copy}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!complete && requirement.status === 'configuration_required' ? (
              <Link
                href="/lms/support?topic=billing-setup"
                className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-black text-white"
              >
                Contact billing setup
              </Link>
            ) : null}
            {!complete &&
            ['release_required', 'release_submitted'].includes(requirement.status) ? (
              <Link
                href="/lms/documents#billing-authorization"
                className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-black text-white"
              >
                Open recurring-payment release
              </Link>
            ) : null}
            {requirement.status === 'paypal_approval_required' && requirement.paypalApprovalUrl ? (
              <a
                href={requirement.paypalApprovalUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#0070ba] px-4 py-2.5 text-sm font-black text-white"
              >
                Approve automatic payments in PayPal
              </a>
            ) : null}
            {requirement.status === 'paypal_approval_required' &&
            !requirement.paypalApprovalUrl ? (
              <Link
                href="/lms/documents#billing-authorization"
                className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-black text-white"
              >
                Finish PayPal setup
              </Link>
            ) : null}
            {requirement.affirmInvoice ? (
              <AffirmInvoiceButton
                billingInvoiceId={requirement.affirmInvoice.id}
                disabled={readOnly}
              />
            ) : (
              <Link
                href="/billing"
                className={`inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-black ${complete ? 'border-emerald-300 text-emerald-950' : 'border-red-300 text-red-950'}`}
              >
                <CreditCard className="h-4 w-4" /> View invoices &amp; Affirm options
              </Link>
            )}
          </div>
          <p className={`mt-3 text-xs ${complete ? 'text-emerald-800' : 'text-red-800'}`}>
            Affirm appears on eligible open QuickBooks invoices. Approval, APR, and terms are set by
            Affirm.
          </p>
        </div>
      </div>
    </section>
  );
}
