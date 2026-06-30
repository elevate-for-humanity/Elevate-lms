// PUBLIC ROUTE: general waitlist form
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withRuntime } from '@/lib/api/withRuntime';

/** CDL is open enrollment — legacy waitlist requests go to apply */
const CDL_APPLY_SLUGS = new Set(['cdl-training', 'cdl']);

// Programs that have a waitlist — all others are rejected
const WAITLIST_PROGRAMS = new Set([
  'barber-apprenticeship',
  'fssa',
  'cosmetology-apprenticeship',
  'welding',
  'electrical',
  'plumbing',
]);
const PROGRAM_NAMES: Record<string, string> = {
  'barber-apprenticeship': 'Barber Apprenticeship',
  'fssa': ' — Workforce Training',
  'cosmetology-apprenticeship': 'Cosmetology Apprenticeship',
  'welding': 'Welding Technology',
  'electrical': 'Electrical Technician',
  'plumbing': 'Plumbing Technician',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, programSlug, cohortId, fundingInterest, notes } =
      body;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    if (!firstName || !lastName || !email || !programSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!WAITLIST_PROGRAMS.has(programSlug)) {
      return NextResponse.json(
        { error: 'This program does not currently have a waitlist.' },
        { status: 400 },
      );
    }

    const supabase = await requireAdminClient();
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
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You are already on the waitlist for this program.' },
        { status: 409 },
      );
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
        name: fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        program: programSlug,
        program_slug: programSlug,
        funding_interest: fundingInterest || null,
        notes: notes || null,
        position,
        status: 'waiting',
      })
      .select('id, position')
      .maybeSingle();

    if (error) throw error;

    // Email confirmation disabled — do not send until explicitly re-enabled

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
  const limited = await applyRateLimit(request, 'pageLoad');
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const programSlug = searchParams.get('program');

  if (!programSlug) {
    return NextResponse.json({ error: 'program parameter required' }, { status: 400 });
  }

  const supabase = await requireAdminClient();
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
