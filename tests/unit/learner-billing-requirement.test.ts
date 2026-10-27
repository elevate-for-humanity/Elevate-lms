import { describe, expect, it } from 'vitest';
import { resolveLearnerBillingRequirement } from '@/lib/billing/learner-billing-requirement';

const baseEnrollment = {
  id: 'enrollment-1',
  status: 'active',
  enrollment_state: 'active',
  funding_source: 'self_pay',
  program_slug: 'medical-assistant',
  total_program_fee: 5_000,
  balance_remaining: 4_000,
  amount_paid: 1_000,
  amount_paid_cents: 100_000,
  programs: { title: 'Medical Assistant' },
};

describe('learner recurring-payment requirement', () => {
  it('keeps an active self-pay enrollment open when billing terms are not configured', () => {
    const result = resolveLearnerBillingRequirement({
      role: 'student',
      enrollments: [baseEnrollment],
    });
    expect(result.required).toBe(true);
    expect(result.status).toBe('configuration_required');
  });

  it('requires a release for apprentices even before funding is normalized', () => {
    const result = resolveLearnerBillingRequirement({
      role: 'apprentice',
      enrollments: [
        { ...baseEnrollment, funding_source: 'pending', program_slug: 'barber-apprenticeship' },
      ],
    });
    expect(result.status).toBe('configuration_required');
  });

  it('does not require automatic payments for waived or paid-in-full learners', () => {
    const waived = resolveLearnerBillingRequirement({
      role: 'apprentice',
      enrollments: [{ ...baseEnrollment, funding_source: 'waived' }],
    });
    const paid = resolveLearnerBillingRequirement({
      role: 'student',
      enrollments: [{ ...baseEnrollment, balance_remaining: 0, amount_paid: 5_000 }],
    });
    expect(waived.status).toBe('not_required');
    expect(paid.status).toBe('not_required');
  });

  it('tracks the release and PayPal steps independently', () => {
    const requested = resolveLearnerBillingRequirement({
      role: 'student',
      enrollments: [baseEnrollment],
      authorization: { id: 'auth-1', status: 'requested' },
    });
    const approved = resolveLearnerBillingRequirement({
      role: 'student',
      enrollments: [baseEnrollment],
      authorization: { id: 'auth-1', status: 'approved' },
      schedule: { status: 'paused', provider_status: 'approval_pending' },
    });
    const active = resolveLearnerBillingRequirement({
      role: 'student',
      enrollments: [baseEnrollment],
      authorization: { id: 'auth-1', status: 'approved' },
      schedule: {
        status: 'active',
        provider_status: 'active',
        provider_subscription_id: 'paypal-subscription',
      },
    });
    expect(requested.status).toBe('release_required');
    expect(approved.status).toBe('paypal_approval_required');
    expect(active.status).toBe('active');
  });

  it('offers Affirm only for an eligible open invoice', () => {
    const result = resolveLearnerBillingRequirement({
      role: 'student',
      enrollments: [baseEnrollment],
      invoices: [
        {
          id: 'invoice-small',
          invoiceNumber: null,
          amountCents: 4_999,
          status: 'open',
          dueDate: null,
          paymentUrl: null,
        },
        {
          id: 'invoice-eligible',
          invoiceNumber: '1001',
          amountCents: 10_000,
          status: 'past_due',
          dueDate: '2026-09-30',
          paymentUrl: 'https://example.test/invoice',
        },
      ],
    });
    expect(result.affirmInvoice?.id).toBe('invoice-eligible');
  });
});
