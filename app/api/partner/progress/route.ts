import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const program = request.nextUrl.searchParams.get('program');
  const db = createAdminClient();

  // Get partner org
  const { data: partnerUser } = await db
    .from('partner_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const orgId = partnerUser.organization_id;

  // Get completions for this org/program
  const query = db
    .from('partner_completions')
    .select('*')
    .eq('organization_id', orgId);

  if (program) {
    query.eq('program_type', program);
  }

  const { data: completions, error } = await query
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }

  // Get enrollment summary
  const { data: summary } = await db
    .from('partner_enrollment_summary')
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
    .single();

  return NextResponse.json({
    completions: completions || [],
    summary: summary || null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  const body = await request.json();

  const { data: partnerUser } = await db
    .from('partner_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const { data, error } = await db
    .from('partner_completions')
    .insert({
      organization_id: partnerUser.organization_id,
      apprentice_id: body.apprentice_id,
      program_type: body.program_type,
      milestone: body.milestone,
      completed_at: new Date().toISOString(),
      recorded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to record progress' }, { status: 500 });
  }

  return NextResponse.json(data);
}
