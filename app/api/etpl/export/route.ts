import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditExport } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin or sponsor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'sponsor', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin or sponsor role required.' },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get ETPL metrics
    const { data: metrics, error } = await adminSupabase
      .from('etpl_metrics')
      .select('*')
      .order('quarter', { ascending: false });

    if (error) {
      logger.error('ETPL export error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    // Log the export
    await auditExport(
      'audit_snapshot',
      user.id,
      profile.role,
      req
    );

    logger.info('ETPL metrics exported', { userId: user.id, recordCount: metrics?.length || 0 });

    return NextResponse.json({
      metrics: metrics || [],
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('ETPL export error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
