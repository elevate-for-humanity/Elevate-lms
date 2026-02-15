import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const ADMIN_SMS = '3177607908@txt.att.net';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        program: formData.get('program'),
        funding: formData.get('funding'),
      };
    }

    const { name, email, phone, program, funding } = data;

    // Save inquiry to database
    try {
      const supabase = await createClient();
      await supabase.from('inquiries').insert({
        name,
        email,
        phone,
        program_interest: program,
        funding_type: funding || null,
        status: 'new',
        source: 'website',
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      logger.error('Failed to save inquiry to database:', dbError);
      // Continue with email even if DB fails
    }

    if (!name || !email || !phone || !program) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Send confirmation email to inquirer
    await sendEmail({
      to: email,
      subject: 'Thank You for Your Interest - Elevate for Humanity',
      html: `
        <h2>Thank you for your interest, ${name}!</h2>
        <p>We received your inquiry about <strong>${program}</strong>.</p>
        <p>A member of our team will contact you within 1-2 business days to discuss your options and answer any questions.</p>
        <h3>What to Expect:</h3>
        <ul>
          <li>A call or email from our admissions team</li>
          <li>Information about program requirements</li>
          <li>Details about funding options${funding ? ` (you mentioned: ${funding})` : ''}</li>
          <li>Next steps to get started</li>
        </ul>
        <p>Can't wait? Call us now at <a href="tel:317-314-3757">317-314-3757</a></p>
        <p>Best regards,<br>Elevate for Humanity Team</p>
      `,
    });

    // Send notification email to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Inquiry: ${name} - ${program}`,
      html: `
        <h2>New Program Inquiry</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Program Interest</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${program}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Funding</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${funding || 'Not specified'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Submitted</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td></tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="mailto:${email}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Reply to ${name}</a>
          <a href="tel:${phone}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Call ${phone}</a>
        </p>
      `,
    });

    // SMS alert via AT&T gateway
    await sendEmail({
      to: ADMIN_SMS,
      subject: 'Inquiry',
      html: `${name}\n${program}\n${phone}`,
    });

    if (contentType?.includes('application/json')) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.redirect(
      new URL('/inquiry/success', req.url),
      { status: 303 }
    );
  } catch (error) {
    logger.error('Inquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please call 317-314-3757.' },
      { status: 500 }
    );
  }
}
