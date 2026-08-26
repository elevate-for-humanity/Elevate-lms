// PUBLIC ROUTE: server-authoritative testing checkout.
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { MINIMUM_BOOKING_NOTICE_HOURS } from '@/lib/testing/booking-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function exactExamAmount(
  providerKey: string,
  examName: string,
): { amountCents: number; displayName: string } | null {
  const provider = CERT_PROVIDERS[providerKey];
  if (!provider || provider.status !== 'active' || provider.publicVisible === false) return null;

  const exam = provider.exams.find((entry) => {
    const name = typeof entry === 'string' ? entry : entry.name;
    return name.toLowerCase() === examName.trim().toLowerCase();
  });

  if (exam && typeof exam === 'object' && exam.amountCents && exam.amountCents > 0) {
    return { amountCents: exam.amountCents, displayName: exam.name };
  }

  if (exam && provider.fees?.length === 1 && provider.fees[0].amount > 0) {
    return {
      amountCents: Math.round(provider.fees[0].amount * 100),
      displayName: typeof exam === 'string' ? exam : exam.name,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });
  }

  let body: {
    examType?: string;
    examName?: string;
    bookingType?: 'individual' | 'organization';
    participantCount?: number;
    addOn?: boolean;
    slotId?: string | null;
    email?: string;
    name?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const providerKey = body.examType?.trim() || '';
  const provider = CERT_PROVIDERS[providerKey];
  if (!provider || provider.status !== 'active' || provider.publicVisible === false) {
    return NextResponse.json(
      { error: 'Testing provider is not available for public checkout.' },
      { status: 404 },
    );
  }

  const examName = body.examName?.trim() || '';
  const pricing = exactExamAmount(providerKey, examName);
  if (!pricing) {
    return NextResponse.json(
      { error: 'Select a specific exam with a configured retail price before checkout.' },
      { status: 422 },
    );
  }

  const bookingType = body.bookingType === 'organization' ? 'organization' : 'individual';
  const participantCount =
    bookingType === 'organization'
      ? Math.max(1, Math.min(100, Math.round(Number(body.participantCount || 1))))
      : 1;

  const addOnSelected =
    body.addOn === true && bookingType === 'individual' && Boolean(provider.addOn);

  const slotId = body.slotId?.trim() || '';
  if (!slotId) {
    return NextResponse.json(
      { error: 'Select an available appointment at least 24 hours in advance before checkout.' },
      { status: 422 },
    );
  }

  const earliestStart = new Date(
    Date.now() + MINIMUM_BOOKING_NOTICE_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const admin = await requireAdminClient();
  const { data: slot, error: slotError } = await admin
    .from('testing_slots')
    .select('id, exam_type, start_time, capacity, booked_count, is_cancelled')
    .eq('id', slotId)
    .eq('exam_type', providerKey)
    .eq('is_cancelled', false)
    .gte('start_time', earliestStart)
    .maybeSingle();

  if (slotError || !slot || slot.booked_count >= slot.capacity) {
    return NextResponse.json(
      { error: 'That appointment is unavailable or does not meet the 24-hour notice requirement.' },
      { status: 409 },
    );
  }

  const lineItems: any[] = [
    {
      quantity: participantCount,
      price_data: {
        currency: 'usd',
        unit_amount: pricing.amountCents,
        product_data: {
          name: `${provider.name} — ${pricing.displayName}`,
          metadata: { provider: providerKey, exam_name: pricing.displayName },
        },
      },
    },
  ];

  if (addOnSelected && provider.addOn) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: provider.addOn.amountCents,
        product_data: {
          name: provider.addOn.label,
          description: provider.addOn.description,
          metadata: { provider: providerKey, add_on: 'true' },
        },
      },
    });
  }

  const origin = request.nextUrl.origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/testing/book?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/testing/checkout?provider=${encodeURIComponent(providerKey)}&exam=${encodeURIComponent(pricing.displayName)}`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: body.email?.trim() || undefined,
      metadata: {
        payment_type: 'testing_fee',
        exam_type: providerKey,
        exam_name: pricing.displayName,
        booking_type: bookingType,
        participant_count: String(participantCount),
        add_on: addOnSelected ? 'true' : 'false',
        pending_booking_id: '',
        slot_id: slot.id,
      },
    });

    if (!session.url) throw new Error('Stripe did not return a Checkout URL.');

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      examAmountCents: pricing.amountCents,
      addOnAmountCents: addOnSelected ? provider.addOn?.amountCents ?? 0 : 0,
    });
  } catch (error) {
    logger.error(
      '[testing-checkout] Stripe session creation failed',
      error instanceof Error ? error : new Error(String(error)),
      { providerKey, examName: pricing.displayName },
    );
    return NextResponse.json({ error: 'Unable to start exam checkout.' }, { status: 500 });
  }
}
