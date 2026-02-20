
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

export async function POST(req: Request) {
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
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'noreply@elevateforhumanity.org',
      to: process.env.NOTIFY_EMAIL_TO || 'elevate4humanityedu@gmail.com',
      subject: `New License Request: ${payload.full_name} (${payload.desired_tier})`,
      text:
        `New License Request\n\n` +
        `Name: ${payload.full_name}\n` +
        `Org: ${payload.organization || '-'}\n` +
        `Email: ${payload.email}\n` +
        `Phone: ${payload.phone || '-'}\n` +
        `Tier: ${payload.desired_tier}\n\n` +
        `Launch Goal:\n${payload.launch_goal}\n\n` +
        `Agreement Ack: ${payload.agreement_ack}\n`,
    });

    // SMS alert via AT&T gateway
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'noreply@elevateforhumanity.org',
      to: process.env.ADMIN_SMS_GATEWAY || '',
      subject: 'License',
      text: `${payload.full_name}\n${payload.organization || ''}\n${payload.desired_tier}`,
    });

    // Send auto-reply to submitter
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'noreply@elevateforhumanity.org',
      to: payload.email,
      subject: 'We received your licensing request | Elevate for Humanity',
      text:
        `Thank you for your licensing request.\n\n` +
        `We review access requests internally. If approved, you will receive onboarding and terms.\n\n` +
        `— Elevate for Humanity\n`,
    });
  } catch (emailError) {
      logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
    }

  return NextResponse.redirect(new URL('/licensing?submitted=true', req.url), {
    status: 303,
  });
}
