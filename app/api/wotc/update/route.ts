import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'];

async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, db: null, error: 'Unauthorized' as const };

  const db = createAdminClient();
  if (!db) return { user: null, db: null, error: 'Service unavailable' as const };

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role ?? '')) {
    return { user: null, db: null, error: 'Forbidden' as const };
  }

  return { user, db, error: null };
}

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const { user, db, error: authError } = await requireAdminUser();
  if (authError || !user || !db) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json();
  const { employer_id, apprentice_id, hire_date, submitted, eligible } = body;

  if (!apprentice_id) {
    return NextResponse.json({ error: 'apprentice_id is required' }, { status: 400 });
  }

  // Verify apprentice exists before upserting
  const { data: apprentice } = await db
    .from('profiles')
    .select('id')
    .eq('id', apprentice_id)
    .maybeSingle();

  if (!apprentice) {
    return NextResponse.json({ error: 'Apprentice not found' }, { status: 404 });
  }

  const { data, error } = await db
    .from('wotc_tracking')
    .upsert(
      { employer_id, apprentice_id, hire_date, submitted, eligible },
      { onConflict: 'apprentice_id' }
    )
    .select()
    .single();

  if (error) {
    logger.error('[wotc/update] upsert failed', error);
    return NextResponse.json({ error: 'Failed to update WOTC record' }, { status: 500 });
  }

  return NextResponse.json({ success: true, wotc: data });
}

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { user, db, error: authError } = await requireAdminUser();
  if (authError || !user || !db) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  const { data, error } = await db
    .from('wotc_tracking')
    .select('*')
    .order('hire_date', { ascending: false });

  if (error) {
    logger.error('[wotc/update] select failed', error);
    return NextResponse.json({ error: 'Failed to fetch WOTC records' }, { status: 500 });
  }

  const enrichedData = (data ?? []).map((record) => {
    const deadline = new Date(record.hire_date);
    deadline.setDate(deadline.getDate() + 28);
    const daysRemaining = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...record,
      deadline: deadline.toISOString().split('T')[0],
      days_remaining: daysRemaining,
      is_urgent: daysRemaining <= 5 && daysRemaining >= 0,
      is_overdue: daysRemaining < 0,
    };
  });

  return NextResponse.json({ wotc_tracking: enrichedData });
}

export const GET = withApiAudit('/api/wotc/update', _GET);
export const POST = withApiAudit('/api/wotc/update', _POST);
