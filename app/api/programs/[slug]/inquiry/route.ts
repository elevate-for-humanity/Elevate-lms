import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const { slug } = params;

  let body: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message?: string;
    fundingQuestion?: string;
    source?: string;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { firstName, lastName, email, message, phone, fundingQuestion } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return safeError('First name, last name, and email are required', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return safeError('Invalid email address', 400);
  }

  const db = await getAdminClient();

  // Insert into applications with program context pre-filled
  const { data: application, error } = await db
    .from('applications')
    .insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      program_interest: slug,
      status: 'inquiry',
      source: body.source || 'program-request-info',
      notes: [
        message ? `Message: ${message}` : '',
        fundingQuestion ? `Funding question: ${fundingQuestion}` : '',
      ].filter(Boolean).join('\n') || null,
      eligibility_data: { inquiry_slug: slug },
    })
    .select('id')
    .single();

  if (error) return safeDbError(error, 'Failed to save inquiry');

  logger.info('Program inquiry submitted', { slug, applicationId: application.id });

  // Notify internal team
  try {
    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      subject: `Program Inquiry — ${slug}`,
      html: `
        <p><strong>Program:</strong> ${slug}</p>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        ${fundingQuestion ? `<p><strong>Funding question:</strong> ${fundingQuestion}</p>` : ''}
        <p><a href="https://www.elevateforhumanity.org/admin/applications/${application.id}">View in Admin</a></p>
      `,
    });
  } catch (emailErr) {
    logger.error('Failed to send inquiry notification email', emailErr);
    // Non-fatal — inquiry is saved
  }

  return NextResponse.json({ success: true, id: application.id });
}
