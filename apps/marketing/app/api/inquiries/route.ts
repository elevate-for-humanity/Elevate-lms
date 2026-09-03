// PUBLIC ROUTE: canonical public information-request / lead intake.
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = (await req.json()) as Record<string, any>;
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Inquiry';
    const program = String(body.program || 'general-inquiry').trim() || 'general-inquiry';
    const source = String(body.source || 'inquiry_form').trim() || 'inquiry_form';
    const phone = body.phone ? String(body.phone).trim() : null;
    const message = body.message ? String(body.message).trim() : '';
    const fundingQuestion = body.fundingQuestion ? String(body.fundingQuestion).trim() : '';
    const fundingInterest = body.fundingInterest || body.fundingSource || null;

    const db = await requireAdminClient();

    // Information requests are CRM leads, not admissions applications. Reuse a
    // recent matching lead so refreshes/retries do not manufacture duplicates.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await db
      .from('leads')
      .select('id, created_at')
      .eq('email', email)
      .eq('program_interest', program)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let leadId = existingLead?.id as string | undefined;
    let existing = Boolean(existingLead?.id);
    if (!leadId) {
      const notes = [
        message ? `Message: ${message}` : '',
        fundingQuestion ? `Funding question: ${fundingQuestion}` : '',
      ]
        .filter(Boolean)
        .join('\n') || null;

      const { data: lead, error } = await db
        .from('leads')
        .insert({
          first_name: firstName,
          last_name: lastName,
          full_name: name,
          email,
          phone,
          program_interest: program,
          funding_interest: fundingInterest,
          state: body.state ? String(body.state).trim() : null,
          source,
          status: 'new',
          stage: 'inquiry',
          notes,
          eligibility_data: {
            inquiry: true,
            city: body.city || null,
            zip: body.zip || body.zipCode || null,
            contact_preference: body.contactPreference || 'email',
          },
        })
        .select('id')
        .single();
      if (error || !lead) {
        logger.error('[api/inquiries] lead insert failed', {
          code: error?.code,
          message: error?.message,
        });
        return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
      }
      leadId = lead.id;
      existing = false;
    }

    // Only send a new notification when a new lead was created. A retry should
    // return the existing inquiry without sending duplicate advisor emails.
    if (!existing && leadId) {
      const programLabel = program
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
      await Promise.allSettled([
        sendEmail({
          to: email,
          subject: `Information Request Received — ${programLabel} | ${PLATFORM_DEFAULTS.orgName}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>We received your information request</h2><p>Hello ${escapeHtml(firstName)},</p><p>We received your request for information about <strong>${escapeHtml(programLabel)}</strong>. An advisor can help you understand program, funding, and next-step options.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:18px 0"><strong>Inquiry reference:</strong> ${escapeHtml(leadId)}</div><p>This is an information request, not a submitted enrollment application. When you are ready to apply, PARIS can guide you through the application at <a href="${PLATFORM_DEFAULTS.siteUrl}/apply/student?program=${encodeURIComponent(program)}">${PLATFORM_DEFAULTS.siteUrl}/apply/student</a>.</p><p>Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
        }),
        sendEmail({
          to: 'elevate4humanityedu@gmail.com',
          subject: `New Program Inquiry — ${name} — ${programLabel}`,
          html: `<div style="font-family:Arial,sans-serif"><h2>New Information Request</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p><p><strong>Program:</strong> ${escapeHtml(programLabel)}</p>${message ? `<p><strong>Message:</strong> ${escapeHtml(message)}</p>` : ''}${fundingQuestion ? `<p><strong>Funding question:</strong> ${escapeHtml(fundingQuestion)}</p>` : ''}<p><strong>CRM lead:</strong> ${escapeHtml(leadId)}</p><p><a href="https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/crm/leads">Open CRM leads</a></p></div>`,
        }),
      ]);
    }

    return NextResponse.json({
      ok: true,
      id: leadId,
      leadId,
      existing,
      recordType: 'lead',
      program,
      message: existing
        ? 'Your recent information request is already on file.'
        : 'Your information request was received.',
    });
  } catch (error) {
    logger.error('[api/inquiries] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Unexpected error processing inquiry' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/inquiries', _POST);
