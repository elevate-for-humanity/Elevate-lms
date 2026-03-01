import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

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
    .from('hour_entries')
    .select('*')
    .order('work_date', { ascending: false })
    .limit(100);

  if (status) {
    query.eq('status', status);
  }

  const { data: hours, error } = await query;

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

  const { data, error } = await auditedMutation({
    table: 'hour_entries',
    operation: 'insert',
    rowData: {
      user_id: body.apprentice_id,
      source_type: body.activity_type === 'ojt' ? 'ojl' : 'rti',
      work_date: body.date,
      hours_claimed: body.hours,
      notes: body.description || null,
      entered_by_email: user.email || '',
      status: 'pending',
    },
    audit: {
      action: 'api:post:/api/partner/hours',
      actorId: user.id,
      targetType: 'hour_entries',
      metadata: {
        organization_id: partnerUser.organization_id,
        apprentice_id: body.apprentice_id,
        hours: body.hours,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to log hours' }, { status: 500 });
  }

  return NextResponse.json(data);
}
export const GET = withApiAudit('/api/partner/hours', _GET, { critical: true });
export const POST = withApiAudit('/api/partner/hours', _POST, { critical: true });
