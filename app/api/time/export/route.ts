
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

function csvEscape(v: any) {
  const s = String(v ?? '');
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function _GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'SUBMITTED';
  const funding_phase = searchParams.get('funding_phase');
  const hour_type = searchParams.get('hour_type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const userEmail = user.email;

  // Find program holders where this user is the mentor
  const { data: programHolders } = await db
    .from('program_holders')
    .select('id')
    .eq('email', userEmail);

  if (!programHolders || programHolders.length === 0) {
    return new NextResponse('No entries found', { status: 404 });
  }

  const holderIds = programHolders.map((ph) => ph.id);

  // Query consolidated hour_entries
  let q = db
    .from('hour_entries')
    .select(
      `
      id,
      user_id,
      work_date,
      hours_claimed,
      accepted_hours,
      source_type,
      category,
      status,
      notes,
      entered_by_email,
      entered_at,
      approved_by,
      approved_at
    `
    )
    .eq('status', status.toLowerCase())
    .order('work_date', { ascending: false });

  if (hour_type) {
    const mapped = hour_type === 'RTI' ? 'rti' : hour_type === 'OJT' ? 'ojt' : hour_type.toLowerCase();
    q = q.eq('source_type', mapped);
  }
  if (from) q = q.gte('work_date', from);
  if (to) q = q.lte('work_date', to);

  const { data, error } = await q;
  if (error)
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });

  const rows = data ?? [];

  // Enrich with user names
  const userIds = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];
  let profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    for (const p of profiles || []) {
      profileMap[p.id] = p.full_name || '';
    }
  }

  const header = [
    'apprentice_name',
    'user_id',
    'entry_date',
    'hours',
    'source_type',
    'category',
    'status',
    'notes',
    'approved_by',
  ];

  const lines = [
    header.join(','),
    ...rows.map((r: any) =>
      [
        profileMap[r.user_id] ?? '',
        r.user_id,
        r.work_date,
        Number(r.accepted_hours) || Number(r.hours_claimed) || 0,
        r.source_type,
        r.category ?? '',
        r.status,
        r.notes ?? '',
        r.approved_by ?? '',
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hours_export_${status}_${Date.now()}.csv"`,
    },
  });
}
export const GET = withApiAudit('/api/time/export', _GET);
