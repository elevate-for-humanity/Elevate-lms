import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, db: null, error: 'Unauthorized' as const };

  const db = await getAdminClient();
  if (!db) return { user: null, db: null, error: 'Service unavailable' as const };

  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !ADMIN_ROLES.includes(profile.role ?? '')) {
    return { user: null, db: null, error: 'Forbidden' as const };
  }
  return { user, db, error: null };
}

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const { user, db, error: authError } = await requireAdmin();
  if (authError || !user || !db) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json();
  const { control_id, evidence, implemented } = body;

  if (!control_id) {
    return NextResponse.json({ error: 'control_id is required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('soc_controls')
    .upsert({ control_id, implemented: implemented ?? true, evidence })
    .select()
    .single();

  if (error) {
    logger.error('[soc/mark] upsert failed', error);
    return NextResponse.json({ error: 'Failed to update control' }, { status: 500 });
  }

  await auditLog({
    actor_user_id: user.id,
    actor_role: 'admin',
    action: 'UPDATE',
    entity: 'soc_controls',
    entity_id: control_id,
    after: data,
    req,
    metadata: { control_type: 'SOC-2' },
  });

  return NextResponse.json({ success: true, data });
}

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { user, db, error: authError } = await requireAdmin();
  if (authError || !user || !db) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  const { data, error } = await db
    .from('soc_controls')
    .select('*')
    .order('control_id');

  if (error) {
    logger.error('[soc/mark] select failed', error);
    return NextResponse.json({ error: 'Failed to fetch controls' }, { status: 500 });
  }

  const implemented = (data ?? []).filter((c) => c.implemented).length;
  const total = (data ?? []).length;

  return NextResponse.json({
    controls: data ?? [],
    summary: {
      total,
      implemented,
      percentage: total > 0 ? Math.round((implemented / total) * 100) : 0,
    },
  });
}
