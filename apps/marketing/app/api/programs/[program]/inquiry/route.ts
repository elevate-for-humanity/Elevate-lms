// PUBLIC ROUTE: public program inquiry form
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { notifyApplicationSubmission } from '@/lib/applications/submission-notifications';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request: NextRequest, { params }: { params: { program: string } }) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const { program: slug } = params;

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

  const db = await requireAdminClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: application, error } = await db
    .from('applications')
    .insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      city: 'Not provided',
      program_interest: slug,
      status: 'submitted',
      application_type: 'inquiry',
      source: body.source || 'program-request-info',
      notes:
        [
          message ? `Message: ${message}` : '',
          fundingQuestion ? `Funding question: ${fundingQuestion}` : '',
        ]
          .filter(Boolean)
          .join('\n') || null,
      eligibility_data: { inquiry_slug: slug },
    })
    .select('id')
    .maybeSingle();

  if (error || !application?.id) return safeDbError(error, 'Failed to save inquiry');

  logger.info('Program inquiry submitted', { slug, applicationId: application.id });

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const programLabel = slug.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  const notifications = await notifyApplicationSubmission({
    db,
    applicationId: application.id,
    applicationType: 'program_inquiry',
    applicantName: fullName,
    applicantEmail: normalizedEmail,
    applicantSubject: `Information Request Received — ${programLabel} | Elevate for Humanity`,
    applicantHtml: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>We received your information request</h2><p>Hello ${escapeHtml(firstName)},</p><p>We received your request for information about <strong>${escapeHtml(programLabel)}</strong>.</p><p><strong>Reference:</strong> ${escapeHtml(application.id)}</p><p>This is an information request, not a completed enrollment application. No seat or funding has been reserved yet.</p><h3>What happens next</h3><ol><li>An advisor reviews your question and funding selection.</li><li>We contact you with the correct funding/self-pay path and required documents.</li><li>When you are ready to enroll, complete the full application at <a href="${PLATFORM_DEFAULTS.siteUrl}/apply?program=${encodeURIComponent(slug)}">${PLATFORM_DEFAULTS.siteUrl}/apply</a>.</li></ol><p>Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
    staffSubject: `Program Information Request — ${fullName} — ${programLabel}`,
    staffHtml: `<h2>Program Information Request</h2><p><strong>Program:</strong> ${escapeHtml(programLabel)}</p><p><strong>Name:</strong> ${escapeHtml(fullName)}</p><p><strong>Email:</strong> ${escapeHtml(normalizedEmail)}</p>${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}${message ? `<p><strong>Message:</strong> ${escapeHtml(message)}</p>` : ''}${fundingQuestion ? `<p><strong>Funding question:</strong> ${escapeHtml(fundingQuestion)}</p>` : ''}<p><strong>Reference:</strong> ${escapeHtml(application.id)}</p><p>This is a lead/information request. Follow up and direct the person to the full enrollment application when ready.</p>`,
    metadata: { program_slug: slug, source: body.source || 'program-request-info' },
  });

  return NextResponse.json({ success: true, id: application.id, notificationStatus: notifications });
}
