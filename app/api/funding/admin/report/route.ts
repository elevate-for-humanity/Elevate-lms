export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check role
  const { data: profile } = await db
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['admin', 'partner', 'instructor'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get query parameters
  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || 'WRG').toUpperCase();
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  // Get program
  const { data: program } = await db
    .from('funding_programs')
    .select('id')
    .eq('code', code)
    .single();

  if (!program) {
    return new Response('Program not found', { status: 404 });
  }

  // Get report data
  const { data: rows } = await supabase.rpc('report_for_program', {
    pid: program.id,
  });

  // Calculate totals
  const totals = {
    learners: rows?.length || 0,
    avgProgress:
      rows && rows.length
        ? rows.reduce(
            (a: number, b: { percent?: number }) => a + (b.percent || 0),
            0
          ) / rows.length
        : 0,
    minutes:
      rows?.reduce(
        (a: number, b: { minutes?: number }) => a + (b.minutes || 0),
        0
      ) || 0,
    completed:
      rows?.filter(
        (r: Record<string, any>) =>
          (r.status || '').toLowerCase() === 'completed'
      ).length || 0,
  };

  // Return CSV format if requested
  if (format === 'csv') {
    const header =
      'learner,email,course,start_date,minutes,percent,status,certificate_id\n';
    const lines = (rows || [])
      .map((r: Record<string, any>) =>
        [
          r.learner,
          r.email,
          r.course,
          r.start_date,
          r.minutes,
          r.percent,
          r.status,
          r.certificate_id || '',
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const csv = header + lines;
    const date = new Date().toISOString().split('T')[0];

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${code}_report_${date}.csv"`,
      },
    });
  }

  // Return JSON format
  return Response.json({ rows: rows || [], totals });
}
