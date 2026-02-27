import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  const status = request.nextUrl.searchParams.get('status');

  const { data: partnerUser } = await db
    .from('partner_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const query = db
    .from('training_hours')
    .select('*, profiles(full_name, email)')
    .eq('organization_id', partnerUser.organization_id);

  if (status) {
    query.eq('status', status);
  }

  const { data: hours, error } = await query
    .order('date', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 });
  }

  return NextResponse.json(hours || []);
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

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
    .from('training_hours')
    .insert({
      organization_id: partnerUser.organization_id,
      apprentice_id: body.apprentice_id,
      date: body.date,
      hours: body.hours,
      description: body.description,
      activity_type: body.activity_type || 'training',
      status: 'pending',
      submitted_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to log hours' }, { status: 500 });
  }

  return NextResponse.json(data);
}
export const GET = withApiAudit('/api/partner/hours', _GET);
export const POST = withApiAudit('/api/partner/hours', _POST);
