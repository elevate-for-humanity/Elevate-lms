/**
 * Zod schemas for Stripe webhook metadata contracts.
 *
 * Design rule: transport is verified by Stripe signature. Event type is
 * verified by the handler switch. Metadata contract is verified here —
 * only then does business logic run.
 *
 * All Stripe metadata values are strings (Stripe enforces this). Numeric
 * fields are stored as stringified integers and parsed here.
 *
 * Usage:
 *   const meta = BarberEnrollmentMeta.safeParse(session.metadata ?? {});
 *   if (!meta.success) {
 *     logger.warn('[webhook] Metadata contract violation', {
 *       event: event.id, errors: meta.error.flatten()
 *     });
 *     return NextResponse.json({ received: true }); // ack to Stripe, skip processing
 *   }
 *   // meta.data is now typed and safe
 */

import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

/** Stripe metadata numeric string → number */
const metaInt = (fallback = 0) =>
  z.string().optional().transform(v => (v ? parseInt(v, 10) || fallback : fallback));

const metaStr = z.string().min(1);
const metaStrOpt = z.string().optional().default('');

// ── Testing center ────────────────────────────────────────────────────────────

/**
 * Metadata set by /api/testing/checkout on checkout.session.completed.
 * Required for the testing webhook to create an exam_booking row.
 */
export const TestingSessionMeta = z.object({
  payment_type:       z.literal('testing_fee'),
  exam_type:          metaStr,
  exam_name:          metaStr,
  booking_type:       z.enum(['individual', 'organization']).default('individual'),
  participant_count:  metaInt(1),
  add_on:             z.enum(['true', 'false']).default('false'),
  pending_booking_id: metaStrOpt,
  slot_id:            metaStrOpt,
});
export type TestingSessionMeta = z.infer<typeof TestingSessionMeta>;

// ── Barber apprenticeship ─────────────────────────────────────────────────────

/**
 * Metadata set by all barber checkout routes on checkout.session.completed.
 * Required fields for enrollment processing.
 */
export const BarberEnrollmentMeta = z.object({
  program:              z.literal('barber-apprenticeship'),
  checkout_type:        z.string().min(1),
  payment_type:         z.enum(['payment_plan', 'pay_in_full', 'bnpl']),
  pricing_policy:       z.literal('fixed_tuition_v1'),
  // IDs
  application_id:       metaStrOpt,
  student_id:           metaStrOpt,
  program_id:           metaStrOpt,
  // Amounts — all derived server-side from TUITION_CENTS
  checkout_amount_cents:  metaInt(0),
  original_price_cents:   metaInt(498000),
  adjusted_price_cents:   metaInt(498000),
  weekly_payment_cents:   metaInt(0),
  weeks_remaining:        metaInt(29),
  // Transfer hours — display/ops only, cannot affect price
  transfer_hours_claimed: metaInt(0),
  remaining_hours:        metaInt(2000),
  // Customer context
  customer_name:          metaStrOpt,
  customer_phone:         metaStrOpt,
  hours_per_week:         metaInt(40),
  first_billing_date:     metaStrOpt,
});
export type BarberEnrollmentMeta = z.infer<typeof BarberEnrollmentMeta>;

/**
 * Metadata on a barber subscription object.
 * Read by invoice.paid and customer.subscription.* events.
 */
export const BarberSubscriptionMeta = z.object({
  program:              z.literal('barber-apprenticeship'),
  user_id:              metaStrOpt,
  weekly_payment_cents: metaInt(0),
  weeks_remaining:      metaInt(0),
  hours_per_week:       metaInt(40),
  transferred_hours_verified: metaInt(0),
  first_billing_date:   metaStrOpt,
});
export type BarberSubscriptionMeta = z.infer<typeof BarberSubscriptionMeta>;

/**
 * Metadata on an invoice for apprenticeship enrollment billing.
 * Read by invoice.paid and invoice.payment_failed events.
 */
export const BarberInvoiceMeta = z.object({
  kind:           z.literal('apprenticeship_enrollment'),
  application_id: metaStr,
  student_id:     metaStr,
});
export type BarberInvoiceMeta = z.infer<typeof BarberInvoiceMeta>;

// ── Main Stripe webhook (program enrollments) ─────────────────────────────────

/**
 * Metadata on async payment sessions (checkout.session.async_payment_succeeded).
 * Required for program enrollment completion.
 */
export const ProgramEnrollmentMeta = z.object({
  student_id:     metaStr,
  program_id:     metaStr,
  program_slug:   metaStr,
  funding_source: z.string().optional().default('self_pay'),
});
export type ProgramEnrollmentMeta = z.infer<typeof ProgramEnrollmentMeta>;

/**
 * Metadata on subscription objects for general LMS access.
 */
export const LmsSubscriptionMeta = z.object({
  user_id: metaStr,
});
export type LmsSubscriptionMeta = z.infer<typeof LmsSubscriptionMeta>;

// ── Shared helper ─────────────────────────────────────────────────────────────

/**
 * Parse and validate webhook metadata. Returns parsed data or logs and returns null.
 *
 * Usage:
 *   const meta = parseWebhookMeta(BarberEnrollmentMeta, session.metadata, event.id, logger);
 *   if (!meta) return NextResponse.json({ received: true }); // ack, skip
 */
export function parseWebhookMeta<T>(
  schema: z.ZodType<T>,
  raw: Record<string, string> | null | undefined,
  eventId: string,
  log: { warn: (msg: string, ctx?: object) => void }
): T | null {
  const result = schema.safeParse(raw ?? {});
  if (!result.success) {
    log.warn('[webhook] Metadata contract violation — skipping event', {
      eventId,
      errors: result.error.flatten(),
    });
    return null;
  }
  return result.data;
}
