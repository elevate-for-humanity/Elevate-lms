import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all progress entries for this user
    const { data: progressEntries, error } = await db
      .from('progress_entries')
      .select('*')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'BARBER')
      .order('week_ending', { ascending: false });

    if (error) {
      logger.error('Error fetching history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    const entries = (progressEntries || []).map(entry => ({
      id: entry.id,
      weekEnding: entry.week_ending,
      hours: parseFloat(entry.hours_worked || 0),
      status: entry.status || 'submitted',
      notes: entry.notes,
      submittedAt: entry.created_at,
      approvedAt: entry.approved_at,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    logger.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/pwa/barber/history', _GET);
