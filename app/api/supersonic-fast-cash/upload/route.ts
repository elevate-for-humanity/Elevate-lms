import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const ssn = formData.get('ssn') as string;
    const notes = formData.get('notes') as string;

    if (!firstName || !lastName || !email || !phone || !ssn) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store document upload request in database
    const { error: dbError } = await supabase
      .from('tax_document_uploads')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        ssn_last_4: ssn,
        notes,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      logger.error('Database error:', dbError);
    }

    // Send email notification
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Supersonic Fast Cash <noreply@supersonicfastcash.com>',
          to: 'elevate4humanityedu@gmail.com',
          subject: `New Tax Document Upload from ${firstName} ${lastName}`,
          html: `
            <h2>New Tax Document Upload</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>SSN Last 4:</strong> ${ssn}</p>
            <p><strong>Notes:</strong></p>
            <p>${notes || 'None provided'}</p>
            <hr>
            <p><em>Documents uploaded via Supersonic Fast Cash portal</em></p>
          `,
        }),
      });
    } catch (emailError) {
      logger.error('Email error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) { /* Error handled silently */ 
    logger.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
