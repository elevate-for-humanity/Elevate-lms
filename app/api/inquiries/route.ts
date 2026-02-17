import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  rateLimitNew as rateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from '@/lib/rateLimit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Public endpoint — anonymous inquiry submissions
export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    // Rate limiting
    const identifier = getClientIdentifier(req.headers);
    const rateLimitResult = await rateLimit(
      `inquiries:${identifier}`,
      RATE_LIMITS.APPLICATION_FORM
    );

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please call 317-314-3757 for immediate assistance.' },
        { status: 503 }
      );
    }

    // Parse name into first and last
    const nameParts = body.name.trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Inquiry';

    const programId = body.program || 'general-inquiry';

    // Check for existing application (prevent duplicates)
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status, created_at')
      .eq('email', body.email.toLowerCase())
      .eq('program_interest', programId)
      .not('status', 'in', '("rejected","withdrawn")')
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: 'You have already submitted an application for this program.',
          message: `Your application (ID: ${existing.id.slice(0, 8)}) is currently ${existing.status}. An advisor will contact you soon.`,
          existingId: existing.id,
          status: existing.status,
          submittedAt: existing.created_at,
        },
        { status: 409 } // Conflict
      );
    }

    // Store as a simple application using actual table columns
    const insertData = {
      first_name: firstName,
      last_name: lastName,
      email: body.email.toLowerCase(),
      phone: body.phone || null,
      city: body.city || 'Not provided',
      zip: body.zip || '00000',
      program_interest: programId, // Store program name/slug here
      status: 'pending',
      source: 'inquiry_form',
      contact_preference: body.contactPreference || 'email',
    };

    const { data, error } = await supabase
      .from('applications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('Supabase insert error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to save inquiry',
          debug: 'Internal server error',
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    // Send email notifications
    try {
      // Confirmation to applicant
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/api/email/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: body.email,
            subject: 'Inquiry Received - Elevate for Humanity',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ea580c;">Thank you for your inquiry!</h2>
              <p>Hi ${firstName},</p>
              <p>We've received your inquiry and an advisor will contact you within 1-2 business days.</p>
              ${body.program ? `<p>You expressed interest in: <strong>${body.program}</strong></p>` : ''}

              <div style="background: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Application ID:</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a;">${data.id}</p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="https://www.elevateforhumanity.org/apply/track?id=${data.id}&email=${encodeURIComponent(body.email)}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Application Status</a>
              </div>

              <p>Questions? Call us at <a href="tel:3173143757" style="color: #ea580c; font-weight: bold;">317-314-3757</a></p>
              <p>Best regards,<br><strong>Elevate for Humanity Team</strong></p>
            </div>
          `,
          }),
        }
      );

      // Notification to staff
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/api/email/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'elevate4humanityedu@gmail.com',
            subject: `New Inquiry: ${body.name}${body.program ? ` - ${body.program}` : ''}`,
            html: `
            <h2>New Inquiry Received</h2>
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Phone:</strong> ${body.phone || 'Not provided'}</p>
            ${body.program ? `<p><strong>Program Interest:</strong> ${body.program}</p>` : ''}
            ${body.message ? `<p><strong>Message:</strong><br>${body.message}</p>` : ''}
            <p><a href="https://www.elevateforhumanity.org/admin/applications">View in Admin Portal</a></p>
          `,
          }),
        }
      );
    } catch (emailError) {
        logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
      }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        email: data.email,
        program: data.program_id,
      },
      { status: 200 }
    );
  } catch (error) { 
    return NextResponse.json(
      { error: 'Unexpected error processing inquiry' },
      { status: 500 }
    );
  }
}
