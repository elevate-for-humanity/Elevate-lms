
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get total students
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Get total enrollments
  const { count: totalEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  // Get completed enrollments
  const { count: completedEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Calculate completion rate
  const completionRate =
    totalEnrollments === 0
      ? 0
      : ((completedEnrollments || 0) / (totalEnrollments || 1)) * 100;

  // Sum training hours via RPC — returns null if function not yet deployed
  const { data: hoursData } = await supabase.rpc('sum_training_hours');
  const totalHours = hoursData || 0;

  // Sector breakdown — program_enrollments.sector column (nullable)
  const { data: bySectorData } = await supabase
    .from('program_enrollments')
    .select('sector')
    .not('sector', 'is', null);

  // Group by sector manually
  const sectorCounts: Record<string, number> = {};
  (bySectorData || []).forEach((row: Record<string, any>) => {
    const sector = row.sector || 'Unspecified';
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
  });

  const bySector = Object.entries(sectorCounts).map(([sector, count]: any) => ({
    sector,
    _count: { _all: count },
  }));

  // Get enrollments by ZIP code (if you have this field)
  const { data: byZipData } = await supabase
    .from('program_enrollments')
    .select('zip_code')
    .not('zip_code', 'is', null);

  // Group by ZIP manually
  const zipCounts: Record<string, number> = {};
  (byZipData || []).forEach((row: Record<string, any>) => {
    const zip = row.zip_code || 'Unknown';
    zipCounts[zip] = (zipCounts[zip] || 0) + 1;
  });

  const byZip = Object.entries(zipCounts)
    .map(([zipCode, count]) => ({
      zipCode,
      _count: { _all: count },
    }))
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10);

  return NextResponse.json({
    totalStudents: totalStudents || 0,
    totalEnrollments: totalEnrollments || 0,
    completedEnrollments: completedEnrollments || 0,
    completionRate,
    totalHours,
    bySector,
    byZip,
  });
}
export const GET = withApiAudit('/api/impact/summary', _GET);
