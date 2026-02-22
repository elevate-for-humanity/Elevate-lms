export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get total students
  const { count: totalStudents } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Get total enrollments
  const { count: totalEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  // Get completed enrollments
  const { count: completedEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Calculate completion rate
  const completionRate =
    totalEnrollments === 0
      ? 0
      : ((completedEnrollments || 0) / (totalEnrollments || 1)) * 100;

  // Get total hours (if you have this field)
  // Note: Adjust field name based on your schema
  const { data: hoursData } = await supabase.rpc('sum_training_hours');
  const totalHours = hoursData || 0;

  // Get enrollments by sector (if you have this field)
  // Note: This is a Content - adjust based on your schema
  const { data: bySectorData } = await db
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
  const { data: byZipData } = await db
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
