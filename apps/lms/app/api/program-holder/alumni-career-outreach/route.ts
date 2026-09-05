// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user before outreach.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { hydrateProcessEnv } from '@/lib/secrets';

const TARGET_NAMES = ['Austin Fletcher', 'Ethan House', 'Pedro Carpintero'];

export async function POST() {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }

  await hydrateProcessEnv();
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return NextResponse.json({ error: 'SendGrid is not configured.' }, { status: 503 });

  const { data: rows, error } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,full_name,email,status,enrollment_state')
    .eq('program_holder_id', ctx.holderId)
    .in('status', ['completed', 'graduated'])
    .in('full_name', TARGET_NAMES);

  if (error) return NextResponse.json({ error: 'Graduate records could not be loaded.' }, { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const row of rows || []) {
    if (!row.email) {
      failed++;
      continue;
    }
    const first = String(row.full_name || 'Graduate').trim().split(/\s+/)[0];
    const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
      <h1 style="color:#047857">Your Elevate graduate dashboard is ready</h1>
      <p>Hi ${first},</p>
      <p>Even though you have graduated from HVAC training, Elevate for Humanity still needs you to sign in and complete the missing items in your student dashboard.</p>
      <p>Please finish your profile, agreements, orientation, required documents, and other onboarding items. Your completed-program status will remain unchanged.</p>
      <p><a href="https://app.elevateforhumanity.org/login" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Sign in to complete your dashboard</a></p>
      <p>After signing in, open <a href="https://app.elevateforhumanity.org/career">Career Services</a> to view job and career-support opportunities.</p>
      <p>If you need help signing in, reply to this email or call Elevate for Humanity at 317-314-3757.</p>
      <p>Thank you,<br>Elevate for Humanity</p>
    </div>`;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: row.email }] }],
        from: { email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: 'elevate4humanityedu@gmail.com' },
        subject: 'Graduate action required: Complete your dashboard and access Career Services',
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (response.ok) {
      sent++;
      await ctx.db
        .from('program_enrollments')
        .update({ provider_notified_at: new Date().toISOString(), next_required_action: 'COMPLETE_ALUMNI_ONBOARDING_AND_CAREER_SERVICES' })
        .eq('id', row.id)
        .eq('program_holder_id', ctx.holderId);
    } else {
      failed++;
    }
  }

  return NextResponse.json({ total: (rows || []).length, sent, failed });
}
