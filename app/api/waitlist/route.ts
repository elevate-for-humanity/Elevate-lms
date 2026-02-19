import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, programSlug, cohortId } = body;

    if (!firstName || !lastName || !email || !programSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();
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
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        program_slug: programSlug,
        cohort_id: cohortId || null,
        position,
        status: 'waiting',
      })
      .select('id, position')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      position: data.position,
      message: `You are #${data.position} on the waitlist.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programSlug = searchParams.get('program');

  if (!programSlug) {
    return NextResponse.json({ error: 'program parameter required' }, { status: 400 });
  }

  const supabase = createAdminClient();
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
