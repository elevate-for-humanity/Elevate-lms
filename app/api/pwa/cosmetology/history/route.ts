import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireCosmetologyEnrollment } from '@/lib/pwa/cosmetology-auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const enrollment = await requireCosmetologyEnrollment(supabase, user.id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in cosmetology apprenticeship' }, { status: 403 });
    }

    const { data: progressEntries, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'COSMETOLOGY')
      .order('week_ending', { ascending: false });

    if (error) {
      logger.error('Cosmetology history fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    const entries = (progressEntries ?? []).map(e => ({
      id: e.id,
      weekEnding: e.week_ending,
      hours: parseFloat(e.hours_worked ?? 0),
      status: e.status ?? 'submitted',
      notes: e.notes,
      submittedAt: e.created_at,
      approvedAt: e.approved_at,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    logger.error('Cosmetology history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/pwa/cosmetology/history', _GET);
