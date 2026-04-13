// PUBLIC ROUTE: public license request form


import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const formData = await req.formData();

  const payload = {
    full_name: String(formData.get('full_name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    organization: String(formData.get('organization') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    desired_tier: String(formData.get('desired_tier') || '').trim(),
    launch_goal: String(formData.get('launch_goal') || '').trim(),
    agreement_ack: String(formData.get('agreement_ack') || '').trim(),
  };

  if (
    !payload.full_name ||
    !payload.email ||
    !payload.desired_tier ||
    !payload.launch_goal ||
    payload.agreement_ack !== 'Yes'
  ) {
    return NextResponse.json(
      { error: 'Incomplete or invalid submission.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Insert into database
  const { error: dbError } = await supabase
    .from('license_requests')
    .insert(payload);

  if (dbError) {
    // Error: $1
  }

  // Send notification email
  try {
    await sendEmail({
      to: process.env.NOTIFY_EMAIL_TO || 'elevate4humanityedu@gmail.com',
      subject: `New License Request: ${payload.full_name} (${payload.desired_tier})`,
      html:
        `<p>New License Request</p>` +
        `<p><strong>Name:</strong> ${payload.full_name}<br>` +
        `<strong>Org:</strong> ${payload.organization || '-'}<br>` +
        `<strong>Email:</strong> ${payload.email}<br>` +
        `<strong>Phone:</strong> ${payload.phone || '-'}<br>` +
        `<strong>Tier:</strong> ${payload.desired_tier}</p>` +
        `<p><strong>Launch Goal:</strong><br>${payload.launch_goal}</p>` +
        `<p><strong>Agreement Ack:</strong> ${payload.agreement_ack}</p>`,
    });

    // SMS alert via AT&T email-to-SMS gateway (only if configured)
    if (process.env.ADMIN_SMS_GATEWAY) {
      await sendEmail({
        to: process.env.ADMIN_SMS_GATEWAY,
        subject: 'License',
        html: `${payload.full_name}\n${payload.organization || ''}\n${payload.desired_tier}`,
      }).catch((err) => logger.warn('[license-request] SMS alert failed:', err));
    }

    // Auto-reply to submitter
    await sendEmail({
      to: payload.email,
      subject: 'We received your licensing request | Elevate for Humanity',
      html:
        `<p>Thank you for your licensing request.</p>` +
        `<p>We review access requests internally. If approved, you will receive onboarding and terms.</p>` +
        `<p>— Elevate for Humanity</p>`,
    });
  } catch (emailError) {
    logger.error('[license-request] Email failed:', emailError instanceof Error ? emailError : undefined);
  }

  return NextResponse.redirect(new URL('/licensing?submitted=true', req.url), {
    status: 303,
  });
}
export const POST = withApiAudit('/api/license-request', _POST);
