// GET /api/admin/program-outcomes
// Returns per-program outcome metrics used by ProgramOutcomesTracker.
// Requires admin role.

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = auth.supabase;

  // Fetch active programs
  const { data: programs, error } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  if (error) {
    return NextResponse.json({ error: 'Failed to load programs' }, { status: 500 });
  }

  if (!programs?.length) {
    return NextResponse.json({ data: [] });
  }

  // For each program compute completion rate from program_enrollments
  const outcomes = await Promise.all(
    programs.map(async (prog) => {
      const [totalRes, completedRes] = await Promise.all([
        supabase
          .from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', prog.id),
        supabase
          .from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', prog.id)
          .eq('status', 'completed'),
      ]);

      const total = totalRes.count ?? 0;
      const completed = completedRes.count ?? 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: prog.id,
        program: prog.title,
        completionRate,
        // Employment rate and salary require outcome survey data not yet collected
        employmentRate: 0,
        avgSalary: 0,
        studentSatisfaction: 0,
      };
    })
  );

  return NextResponse.json({ data: outcomes });
}
