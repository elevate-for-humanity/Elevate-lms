import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { testingAppointmentLabel, testingCalendarUrl, validTestingReference } from '@/lib/testing/booking-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const invoiceId = request.nextUrl.searchParams.get('invoice_id')?.trim() || '';
  const token = request.nextUrl.searchParams.get('booking_token')?.trim() || '';
  const reply = (data: object, status = 200) => NextResponse.json(data, {
    status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
  if (!validTestingReference(invoiceId) || !validTestingReference(token))
    return reply({ found: false, error: 'Use your private booking confirmation link.' }, 400);
  const admin = await getAdminClient();
  if (!admin) return reply({ found: false, error: 'Verification is temporarily unavailable.' }, 503);
  const invoice = await admin.from('billing_invoices')
    .select('id,status,fulfillment_type,fulfillment_payload').eq('id', invoiceId).maybeSingle();
  if (invoice.error) return reply({ found: false }, 503);
  const saved = invoice.data?.fulfillment_payload?.booking_token;
  if (invoice.data?.fulfillment_type !== 'testing_booking' || typeof saved !== 'string' ||
      saved.length !== token.length || !timingSafeEqual(Buffer.from(saved), Buffer.from(token)))
    return reply({ found: false }, 404);
  if (invoice.data.status !== 'paid') return reply({ found: false, paymentPending: true }, 202);
  const booking = await admin.from('exam_bookings')
    .select('exam_type,exam_name,confirmation_code,slot_id,status')
    .eq('provider_invoice_id', invoiceId).eq('payment_status', 'paid').maybeSingle();
  if (booking.error) return reply({ found: false }, 503);
  if (!booking.data || booking.data.status !== 'confirmed')
    return reply({ found: false, paid: true, schedulingPending: true }, 202);
  const slot = await admin.from('testing_slots').select('start_time,end_time,location,is_cancelled')
    .eq('id', booking.data.slot_id).maybeSingle();
  if (slot.error) return reply({ found: false }, 503);
  if (!slot.data || slot.data.is_cancelled)
    return reply({ found: false, paid: true, schedulingPending: true }, 202);
  return reply({
    found: true, examName: booking.data.exam_name, confirmationCode: booking.data.confirmation_code,
    appointment: testingAppointmentLabel(slot.data.start_time),
    googleCalendarUrl: testingCalendarUrl({
      examName: booking.data.exam_name, confirmationCode: booking.data.confirmation_code,
      start: slot.data.start_time, end: slot.data.end_time,
      location: slot.data.location || TESTING_CENTER.address,
    }),
  });
}
