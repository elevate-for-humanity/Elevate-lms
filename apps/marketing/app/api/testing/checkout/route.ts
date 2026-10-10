// PUBLIC ROUTE: server-authoritative testing checkout.
import { NextRequest, NextResponse } from 'next/server';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { MINIMUM_BOOKING_NOTICE_HOURS } from '@/lib/testing/booking-validation';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import type { BillingLineInput } from '@/lib/billing/contracts';
import { validTestingReference } from '@/lib/testing/booking-calendar';

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

  let body: {
    examType?: string;
    examName?: string;
    bookingType?: 'individual' | 'organization';
    participantCount?: number;
    addOn?: boolean;
    slotId?: string | null;
    email?: string;
    name?: string;
    requestId?: string;
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
  const customerEmail = body.email?.trim().toLowerCase() || '';
  const customerName = body.name?.trim() || '';
  const requestId = body.requestId?.trim() || '';
  if (!validTestingReference(requestId)) {
    return NextResponse.json({ error: 'Refresh checkout and try again.' }, { status: 400 });
  }
  if (!customerEmail || !customerName) {
    return NextResponse.json(
      { error: 'Name and email are required for the QuickBooks invoice and receipt.' },
      { status: 400 },
    );
  }
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
    .in('exam_type', [providerKey, 'all'])
    .eq('is_cancelled', false)
    .gte('start_time', earliestStart)
    .maybeSingle();

  if (
    slotError ||
    !slot ||
    (slot.exam_type !== providerKey && slot.exam_type !== 'all') ||
    slot.booked_count + participantCount > slot.capacity
  ) {
    return NextResponse.json(
      { error: 'That appointment does not have enough remaining seats or does not meet the 24-hour notice requirement.' },
      { status: 409 },
    );
  }

  const lineItems: BillingLineInput[] = [
    {
      canonicalKey: `testing-${providerKey}-${pricing.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`,
      name: `${provider.name} — ${pricing.displayName}`,
      quantity: participantCount,
      unitAmountCents: pricing.amountCents,
    },
  ];

  if (addOnSelected && provider.addOn) {
    lineItems.push({
      canonicalKey: `testing-${providerKey}-addon`,
      name: provider.addOn.label,
      description: provider.addOn.description,
      quantity: 1,
      unitAmountCents: provider.addOn.amountCents,
    });
  }

  try {
    const idempotencyKey = `testing:${customerEmail}:${requestId}`;
    const prior = await admin.from('billing_invoices')
      .select('id,fulfillment_payload,total_cents')
      .eq('idempotency_key', idempotencyKey).maybeSingle();
    if (prior.error) throw new Error('Could not verify the existing checkout.');
    const amountCents = pricing.amountCents * participantCount +
      (addOnSelected ? provider.addOn?.amountCents || 0 : 0);
    if (prior.data && (
      prior.data.fulfillment_payload?.slot_id !== slot.id ||
      prior.data.fulfillment_payload?.exam_name !== pricing.displayName ||
      prior.data.total_cents !== amountCents
    )) {
      return NextResponse.json({ error: 'Your checkout selection changed. Refresh and try again.' }, { status: 409 });
    }
    const invoice = await createQuickBooksBillingProvider(admin).createManualInvoice({
      idempotencyKey,
      customer: {
        externalKey: `email:${customerEmail}`,
        displayName: customerName,
        email: customerEmail,
      },
      lines: lineItems,
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Testing appointment ${slot.id}`,
      fulfillment: {
        type: 'testing_booking',
        payload: {
          exam_type: providerKey,
          exam_name: pricing.displayName,
          booking_type: bookingType,
          participant_count: participantCount,
          add_on: addOnSelected,
          slot_id: slot.id,
          customer_email: customerEmail,
          customer_name: customerName,
          booking_token: requestId,
          amount_cents:
            pricing.amountCents * participantCount +
            (addOnSelected ? provider.addOn?.amountCents || 0 : 0),
        },
      },
    });
    if (!invoice.paymentUrl)
      throw new Error('QuickBooks created the invoice but online payment links are not enabled.');

    const tracked = await admin.from('billing_invoices').select('id')
      .eq('idempotency_key', idempotencyKey).single();
    if (tracked.error || !tracked.data) throw new Error('Could not retrieve the checkout reference.');

    return NextResponse.json({
      url: invoice.paymentUrl,
      invoiceId: tracked.data.id,
      bookingToken: requestId,
      examAmountCents: pricing.amountCents,
      addOnAmountCents: addOnSelected ? (provider.addOn?.amountCents ?? 0) : 0,
    });
  } catch (error) {
    logger.error(
      '[testing-checkout] QuickBooks invoice creation failed',
      error instanceof Error ? error : new Error(String(error)),
      { providerKey, examName: pricing.displayName },
    );
    return NextResponse.json({ error: 'Unable to start exam checkout.' }, { status: 500 });
  }
}
