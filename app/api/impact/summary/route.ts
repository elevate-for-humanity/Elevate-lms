import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  try {
    // Core metrics — single RPC call, aggregation lives in SQL
    const { data: summary, error: rpcError } = await supabase.rpc('get_impact_summary');
    if (rpcError) {
      logger.error('get_impact_summary RPC error', rpcError);
      return safeError('Failed to load impact summary', 500);
    }

    const s = summary as {
      total_learners: number;
      active_enrollments: number;
      program_completions: number;
      certificates_awarded: number;
      total_programs: number;
      partners: number;
      total_hours: number;
    };

    // Sector breakdown — supplemental, non-fatal if missing column
    const { data: bySectorData } = await supabase
      .from('program_enrollments')
      .select('sector')
      .not('sector', 'is', null);

    const sectorCounts: Record<string, number> = {};
    for (const row of bySectorData ?? []) {
      const sector = (row as any).sector || 'Unspecified';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    }
    const bySector = Object.entries(sectorCounts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);

    // ZIP breakdown — supplemental, non-fatal if missing column
    const { data: byZipData } = await supabase
      .from('program_enrollments')
      .select('zip_code')
      .not('zip_code', 'is', null);

    const zipCounts: Record<string, number> = {};
    for (const row of byZipData ?? []) {
      const zip = (row as any).zip_code || 'Unknown';
      zipCounts[zip] = (zipCounts[zip] || 0) + 1;
    }
    const byZip = Object.entries(zipCounts)
      .map(([zipCode, count]) => ({ zipCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalEnrollments = s.active_enrollments + s.program_completions;
    const completionRate = totalEnrollments > 0
      ? Math.round((s.program_completions / totalEnrollments) * 100)
      : 0;

    return NextResponse.json({
      totalStudents:        s.total_learners,
      totalEnrollments,
      activeEnrollments:    s.active_enrollments,
      completedEnrollments: s.program_completions,
      completionRate,
      certificatesAwarded:  s.certificates_awarded,
      totalPrograms:        s.total_programs,
      partners:             s.partners,
      totalHours:           Math.round(s.total_hours),
      bySector,
      byZip,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load impact summary');
  }
}

export const GET = withApiAudit('/api/impact/summary', _GET);
