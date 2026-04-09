import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

import { withRuntime } from '@/lib/api/withRuntime';

// Programs that have a waitlist — all others are rejected
const WAITLIST_PROGRAMS = new Set(['cdl-training', 'barber-apprenticeship']);
const PROGRAM_NAMES: Record<string, string> = {
  'cdl-training':          'CDL (Commercial Driver\'s License)',
  'barber-apprenticeship': 'Barber Apprenticeship',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, programSlug, cohortId, fundingInterest, notes } = body;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    if (!firstName || !lastName || !email || !programSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!WAITLIST_PROGRAMS.has(programSlug)) {
      return NextResponse.json({ error: 'This program does not currently have a waitlist.' }, { status: 400 });
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('program_slug', programSlug)
      .eq('status', 'waiting')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You are already on the waitlist for this program.' }, { status: 409 });
    }

    // Get current position
    const { count } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('program_slug', programSlug)
      .eq('status', 'waiting');

    const position = (count || 0) + 1;

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        name:             fullName,
        email:            email.toLowerCase(),
        phone:            phone || null,
        program:          programSlug,
        program_slug:     programSlug,
        funding_interest: fundingInterest || null,
        notes:            notes || null,
        position,
        status:           'waiting',
      })
      .select('id, position')
      .single();

    if (error) throw error;

    // Send confirmation email — non-fatal
    try {
      const { data: sgSecret } = await supabase
        .from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').single();
      if (sgSecret?.value) {
        const programLabel = PROGRAM_NAMES[programSlug] ?? programSlug;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgSecret.value}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: email.toLowerCase(), name: fullName }] }],
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elevate for Humanity' },
            subject: `You're on the waitlist — ${programLabel}`,
            content: [{ type: 'text/html', value: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;">
  <div style="text-align:center;padding:32px 24px 16px;">
    <img src="${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" width="160" alt="Elevate for Humanity" />
  </div>
  <div style="padding:0 32px 32px;">
    <h2 style="font-size:22px;margin:0 0 16px;">You're on the waitlist!</h2>
    <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 12px;">
      Hi ${firstName}, you are <strong>#${data.position}</strong> on the waitlist for
      <strong>${programLabel}</strong> at Elevate for Humanity.
    </p>
    <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 20px;">
      We will contact you as soon as a seat opens. In the meantime, Indiana residents
      can get a head start by visiting
      <a href="https://www.workone.in.gov" style="color:#1a56db;">WorkOne</a> or
      <a href="https://www.employindy.org" style="color:#1a56db;">EmployIndy</a>
      to explore funding — getting pre-approved now means you can enroll immediately
      when your spot is ready.
    </p>
    <p style="font-size:14px;color:#666;">
      Questions? Reply to this email or call <strong>(317) 314-3757</strong>.
    </p>
  </div>
</div>` }],
          }),
        });
      }
    } catch (emailErr) {
      logger.warn('[waitlist] Confirmation email failed', emailErr);
    }

    return NextResponse.json({
      success: true,
      position: data.position,
      message: `You are #${data.position} on the waitlist. Check your email for confirmation.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programSlug = searchParams.get('program');

  if (!programSlug) {
    return NextResponse.json({ error: 'program parameter required' }, { status: 400 });
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
  }

  // Get upcoming cohorts for this program
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name, start_date, end_date, max_capacity, current_enrollment, status, location')
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true });

  // Get waitlist count
  const { count } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('program_slug', programSlug)
    .eq('status', 'waiting');

  return NextResponse.json({
    cohorts: cohorts || [],
    waitlistCount: count || 0,
  });
}
export const GET = withRuntime(withApiAudit('/api/waitlist', _GET));
export const POST = withRuntime(withApiAudit('/api/waitlist', _POST));
