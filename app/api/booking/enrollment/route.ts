import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Try to save to database
    const { error } = await db.from('appointments').insert({
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
      source: 'website'
    });

    if (error) {
      logger.error('Database error:', error);
      // Log for manual follow-up even if DB fails
      logger.info('Enrollment booking (DB failed):', {
        name: `${firstName} ${lastName}`,
        email,
        phone,
        date,
        time,
        program
      });
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Enrollment Confirmation - ${program}`,
          template: 'enrollment-confirmation',
          data: { name, email, phone, program, date, time }
        })
      });
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking' },
      { status: 500 }
    );
  }
}
