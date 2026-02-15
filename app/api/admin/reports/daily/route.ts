export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifySendgrid } from '@/lib/notify';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';

export const POST = withAuth(
  async (req: Request, user) => {

  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (token !== process.env.REPORT_CRON_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      { count: newEnrollments },
      { count: completions },
      { count: newUsers },
    ] = await Promise.all([
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('enrolled_at', yesterday.toISOString()),
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null)
        .gte('completed_at', yesterday.toISOString()),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString()),
    ]);

    const text = [
      'Elevate for Humanity – Daily Snapshot',
      '',
      `New users (24h): ${newUsers || 0}`,
      `New enrollments (24h): ${newEnrollments || 0}`,
      `Completions (24h): ${completions || 0}`,
    ].join('\n');

    await notifySendgrid('EFH Daily Snapshot', text);

    return NextResponse.json({ ok: true, report: text });
  } catch (error) { 
    logger.error('Daily report error:', error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }

  },
  { roles: ['admin', 'super_admin'] }
);
