import { NextResponse } from 'next/server';


import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getAdminClient();
  const url = new URL(req.url);
  const requestedUserId = url.searchParams.get('user_id');

  // Only admins/staff can query other users' checklists
  let targetUserId = user.id;
  if (requestedUserId && requestedUserId !== user.id) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const adminRoles = ['admin', 'super_admin', 'staff'];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    targetUserId = requestedUserId;
  }

  const { data, error } = await adminClient
    .from('workone_checklist')
    .select('id,user_id,step_key,step_label,status,notes,due_date,completed_at,updated_at')
    .eq('user_id', targetUserId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

export const GET = withApiAudit('/api/workone/list', _GET);
