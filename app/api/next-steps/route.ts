
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

function computeProgress(row: any) {
  const checks = [
    !!row.program_code,
    !!row.inquiry_submitted,
    !!row.icc_account_created,
    !!row.workone_appointment_1_completed || !!row.workone_appointment_2_completed || !!row.workone_appointment_3_completed,
    !!row.told_advisor_efh,
    !!row.advisor_docs_uploaded,
    row.funding_status === 'approved' || row.funding_status === 'denied',
    !!row.efh_onboarding_call_completed,
    !!row.program_start_confirmed,
  ];
  const done = checks.filter(Boolean).length;
  return {
    done,
    total: checks.length,
    percent: Math.round((done / checks.length) * 100),
  };
}

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  const { data, error } = await adminClient
    .from('student_next_steps')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  // Create default row if missing (one-shot UX)
  if (!data) {
    const { data: created, error: createErr } = await adminClient
      .from('student_next_steps')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id ?? null,
      })
      .select('*')
      .single();

    if (createErr)
      return NextResponse.json({ error: createErr.message }, { status: 500 });

    return NextResponse.json({
      ...created,
      progress: computeProgress(created),
    });
  }

  return NextResponse.json({ ...data, progress: computeProgress(data) });
}

export async function PATCH(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const body = await req.json();

  // Server-side allowlist (prevents random fields)
  const allowed: Record<string, boolean> = {
    program_code: true,
    program_name_other: true,

    inquiry_submitted: true,
    inquiry_submitted_at: true,

    icc_account_created: true,
    icc_username: true,

    workone_appointment_scheduled: true,
    workone_appointment_date: true,
    workone_appointment_time: true,
    workone_location: true,

    workone_appointment_1_completed: true,
    workone_appointment_1_date: true,
    workone_appointment_1_time: true,
    workone_appointment_1_location: true,
    workone_appointment_1_notes: true,

    workone_appointment_2_completed: true,
    workone_appointment_2_date: true,
    workone_appointment_2_time: true,
    workone_appointment_2_location: true,
    workone_appointment_2_notes: true,

    workone_appointment_3_completed: true,
    workone_appointment_3_date: true,
    workone_appointment_3_time: true,
    workone_appointment_3_location: true,
    workone_appointment_3_notes: true,

    workone_appointment_4_completed: true,
    workone_appointment_4_date: true,
    workone_appointment_4_time: true,
    workone_appointment_4_location: true,
    workone_appointment_4_notes: true,

    told_advisor_efh: true,

    advisor_docs_uploaded: true,
    advisor_docs_note: true,

    funding_status: true,
    funding_type: true,

    efh_onboarding_call_completed: true,
    efh_onboarding_call_date: true,

    program_start_confirmed: true,
    program_start_date: true,
  };

  const update: Record<string, any> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (allowed[k]) update[k] = v;
  }

  const { data, error } = await adminClient
    .from('student_next_steps')
    .update(update)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  // Send email notification to admin
  try {
    const { data: userData } = await adminClient.auth.admin.getUserById(
      user.id
    );
    const userEmail = userData?.user?.email || 'Unknown';
    const progress = computeProgress(data);

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'elevate4humanityedu@gmail.com',
        subject: `🔔 Student Checklist Updated: ${userEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">Student Checklist Update</h2>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Student:</strong> ${userEmail}</p>
              <p style="margin: 5px 0;"><strong>Program:</strong> ${data.program_code || 'Not selected'}</p>
              <p style="margin: 5px 0;"><strong>Progress:</strong> ${progress.done}/${progress.total} steps complete (${progress.percent}%)</p>
            </div>

            <h3 style="color: #000;">Updated Fields:</h3>
            <ul style="line-height: 1.8;">
              ${Object.keys(update)
                .map((key) => {
                  const value = update[key];
                  const displayValue = typeof value === 'boolean'
                    ? (value ? '✅ Yes' : '❌ No')
                    : value || '(empty)';
                  return `<li><strong>${key.replace(/_/g, ' ')}:</strong> ${displayValue}</li>`;
                })
                .join('')}
            </ul>

            <div style="margin-top: 30px; padding: 15px; background: #000; border-radius: 8px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/next-steps"
                 style="color: #fff; text-decoration: none; font-weight: bold;">
                📋 View All Student Checklists →
              </a>
            </div>
          </div>
        `,
      }),
    });
    // SMS alert via AT&T gateway
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '3177607908@txt.att.net',
        subject: 'Checklist',
        html: `${userEmail}\n${data.program_code || 'General'}\n${progress.percent}% done`,
      }),
    });
  } catch (emailError) {
      logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
    }

  return NextResponse.json({ ...data, progress: computeProgress(data) });
}
