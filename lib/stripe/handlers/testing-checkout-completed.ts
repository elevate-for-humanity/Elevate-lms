/**
 * Testing center checkout.session.completed — canonical handler branch.
 * Extracted from app/api/testing/webhook for Stripe consolidation.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripeServer } from '@/lib/stripe/get-stripe-server';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { TESTING_CENTER, TESTING_EMAIL, CALENDLY_CONFIG } from '@/lib/testing/testing-config';
import { createSchedulingLink, getEventTypes } from '@/lib/testing/calendly';
import {
  TestingEnforcementMeta,
  TestingSessionMeta,
  parseWebhookMeta,
} from '@/lib/stripe/webhook-schemas';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const FROM = TESTING_EMAIL.from;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;

export async function handleTestingCheckoutSession(
  session: Stripe.Checkout.Session,
  db: SupabaseClient,
): Promise<void> {
  const paymentType = session.metadata?.payment_type;

  if (paymentType === 'testing_fee') {
    const meta = parseWebhookMeta(TestingSessionMeta, session.metadata, session.id, logger);
    if (!meta) return;

    const paymentIntentId = (session.payment_intent as string) ?? null;
    if (paymentIntentId) {
      const { data: existing } = await db
        .from('exam_bookings')
        .select('id')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle();
      if (existing) {
        logger.info('[testing/checkout] Already processed', { paymentIntentId });
        return;
      }
    }

    const stripe = await getStripeServer();
    const fullSession = await stripe!.checkout.sessions.retrieve(session.id, {
      expand: ['customer_details'],
    });
    const customerEmail = fullSession.customer_details?.email ?? '';
    const customerName = fullSession.customer_details?.name ?? '';
    const [firstName, ...rest] = customerName.trim().split(' ');
    const lastName = rest.join(' ') || '';

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const confirmationCode = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');

    const hasAddOn = meta.add_on === 'true';
    let calendlySchedulingUrl = CALENDLY_CONFIG.testingUrl;
    try {
      const eventTypes = await getEventTypes();
      const testingEvent =
        eventTypes.find((e) => e.slug === 'testing' || e.slug === '60min') ?? eventTypes[0];
      if (testingEvent) {
        calendlySchedulingUrl = await createSchedulingLink({ eventTypeUri: testingEvent.uri });
      }
    } catch (err) {
      logger.warn('[testing/checkout] Calendly link fallback', { err });
    }

    const rawSlotId = meta.slot_id || null;
    let slotId: string | null = null;
    if (rawSlotId) {
      const { data: slotRow } = await db
        .from('testing_slots')
        .select('id')
        .eq('id', rawSlotId)
        .eq('is_cancelled', false)
        .maybeSingle();
      slotId = slotRow?.id ?? null;
    }

    const { error: insertErr } = await db.from('exam_bookings').insert({
      exam_type: meta.exam_type,
      exam_name: meta.exam_name,
      booking_type: meta.booking_type,
      first_name: firstName || 'Customer',
      last_name: lastName,
      email: customerEmail,
      participant_count: meta.participant_count,
      status: 'pending',
      payment_status: 'paid',
      payment_intent_id: paymentIntentId,
      fee_cents: session.amount_total,
      confirmation_code: confirmationCode,
      add_on: hasAddOn,
      add_on_paid: hasAddOn,
      calendly_scheduling_url: calendlySchedulingUrl,
      slot_id: slotId,
    });

    if (insertErr) {
      logger.error('[testing/checkout] Booking insert failed', new Error(insertErr.message));
      return;
    }

    if (slotId) {
      await db.rpc('increment_slot_booked_count', { slot_id: slotId }).then(undefined, () => {});
    }

    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        from: FROM,
        subject: `Exam Booking Confirmed — ${confirmationCode} | Elevate Testing Center`,
        html: `<p>Hi ${firstName || 'there'}, your exam booking is confirmed. Code: <strong>${confirmationCode}</strong></p>
<p><a href="${calendlySchedulingUrl}">Schedule your exam date →</a></p>
<p>Location: ${TESTING_CENTER.address}</p>`,
      }).catch((err) => logger.warn('[testing/checkout] Email failed', { err }));
    }
    return;
  }

  if (paymentType === 'testing_enforcement') {
    const enforcementMeta = parseWebhookMeta(
      TestingEnforcementMeta,
      session.metadata,
      session.id,
      logger,
    );
    if (!enforcementMeta) return;

    const enforcementId = enforcementMeta.enforcement_id;
    const email = enforcementMeta.email;
    if (!enforcementId) return;

    const { error: updateErr } = await db
      .from('testing_enforcement')
      .update({
        fee_paid: true,
        payment_intent_id: (session.payment_intent as string) ?? null,
        paid_at: new Date().toISOString(),
        unlocked_at: new Date().toISOString(),
      })
      .eq('id', enforcementId);

    if (updateErr) {
      logger.error(
        '[testing/checkout] Enforcement update failed',
        new Error(updateErr.message),
        { enforcementId },
      );
      return;
    }

    if (email) {
      await sendEmail({
        to: email,
        from: FROM,
        subject: 'Fee Paid — You Can Now Rebook Your Exam',
        html: `<p>Your fee was received. <a href="${SITE_URL}/testing/book">Book your exam →</a></p>`,
      }).catch((e) => logger.warn('[testing/checkout] Failed to send rebook email', { email, error: e instanceof Error ? e.message : String(e) }));
    }
  }
}
