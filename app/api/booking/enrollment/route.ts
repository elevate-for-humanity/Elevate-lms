// PUBLIC ROUTE: public enrollment booking form
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireDbWrite, success, failure } from '@/lib/api/safe-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { firstName, lastName, email, phone, program, notes, date, time, type } = body;

    if (!firstName || !lastName || !email || !phone || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // DB write is required — no fallthrough on failure
    const booking = await requireDbWrite(
      supabase.from('appointments').insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        program_interest: program || null,
        notes: notes || null,
        appointment_date: date,
        appointment_time: time,
        appointment_type: type || 'enrollment_consultation',
        status: 'scheduled',
        source: 'website',
      }).select().single(),
      'Failed to create booking'
    );

    // Email is secondary — only runs after DB success
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Enrollment Consultation Confirmed - ${program || 'Elevate for Humanity'}`,
          template: 'enrollment-confirmation',
          data: { name: `${firstName} ${lastName}`, email, phone, program, date, time },
        }),
      });
    } catch (emailError) {
      logger.warn('Confirmation email failed (booking saved):', emailError);
    }

    return success({ id: booking.id });
  } catch (err: unknown) {
    const message = 'Failed to process booking';
    logger.error('Booking enrollment error:', err);
    return failure(message);
  }
}
export const POST = withApiAudit('/api/booking/enrollment', _POST);
