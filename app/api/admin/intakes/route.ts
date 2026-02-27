import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get intakes/applications
    const { data: intakes, error } = await db
      .from('applications')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        program_id,
        status,
        submitted_at,
        notes
      `)
      .order('submitted_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Intakes error:', error);
      return NextResponse.json({ intakes: [] });
    }

    return NextResponse.json({ intakes: intakes || [] });
  } catch (error) {
    logger.error('Intakes error:', error);
    return NextResponse.json({ intakes: [] });
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data: intake, error } = await db
      .from('applications')
      .insert({
        ...body,
        submitted_at: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Create intake error:', error);
      return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
    }

    const { data: { user: actor } } = await supabase.auth.getUser();
    if (actor) await logAdminAudit({ action: AdminAction.INTAKE_CREATED, actorId: actor.id, entityType: 'intakes', entityId: intake.id, metadata: { name: intake.name }, req: request });

    return NextResponse.json({ success: true, intake });
  } catch (error) {
    logger.error('Create intake error:', error);
    return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/intakes', _GET);
export const POST = withApiAudit('/api/admin/intakes', _POST);
