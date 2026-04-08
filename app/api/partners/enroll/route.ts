import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { trySendEmail } from '@/lib/email/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
  await hydrateProcessEnv();
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      organizationName,
      organizationType,
      industry,
      website,
      contactName,
      contactTitle,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      zip,
      programsInterested,
      capacityPerMonth,
      preferredSchedule,
      hasSupervision,
      experience,
      specialRequirements,
      howHeard,
      agreedToTerms,
    } = body || {};

    // Validation
    if (!organizationName || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (!programsInterested || programsInterested.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one program.' },
        { status: 400 }
      );
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: 'You must agree to the terms.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert into partner_enrollments table
    const { error } = await supabase.from('partner_enrollments').insert({
      organization_name: organizationName,
      organization_type: organizationType,
      industry,
      website,
      contact_name: contactName,
      contact_title: contactTitle,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address,
      city,
      state,
      zip,
      programs_interested: programsInterested,
      capacity_per_month: capacityPerMonth,
      preferred_schedule: preferredSchedule,
      has_supervision: hasSupervision,
      experience,
      special_requirements: specialRequirements,
      how_heard: howHeard,
      agreed_to_terms: agreedToTerms,
      status: 'pending', // Default status
    });

    if (error) {
      logger.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Unable to save enrollment.' },
        { status: 500 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@elevateforhumanity.org';

    // Confirmation to partner — fire-and-forget
    trySendEmail({
      to: contactEmail,
      subject: 'Partner Enrollment Received — Elevate for Humanity',
      html: `<p>Hi ${contactName},</p>
<p>Thank you for submitting a partner enrollment request on behalf of <strong>${organizationName}</strong>. Our team will review your application and follow up within 2 business days.</p>
<p>Questions? Call us at (317) 314-3757 or reply to this email.</p>
<p>— Elevate for Humanity Partnership Team</p>`,
    });

    // Internal notification to admin — fire-and-forget
    trySendEmail({
      to: adminEmail,
      subject: `New Partner Enrollment — ${organizationName}`,
      html: `<p>A new partner enrollment has been submitted.</p>
<ul>
  <li><strong>Organization:</strong> ${organizationName} (${organizationType})</li>
  <li><strong>Industry:</strong> ${industry}</li>
  <li><strong>Contact:</strong> ${contactName}, ${contactTitle}</li>
  <li><strong>Email:</strong> ${contactEmail}</li>
  <li><strong>Phone:</strong> ${contactPhone || '—'}</li>
  <li><strong>Programs Interested:</strong> ${(programsInterested || []).join(', ') || '—'}</li>
  <li><strong>Capacity/Month:</strong> ${capacityPerMonth || '—'}</li>
</ul>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org'}/admin/partners">Review in Admin →</a></p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error(
      'API error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/partners/enroll', _POST);
