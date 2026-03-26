import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { count: programCount } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: courseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: enrollmentCount } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'completed']);

    const { data: categories } = await supabase
      .from('programs')
      .select('category')
      .eq('status', 'active');

    const uniqueCategories = [...new Set(categories?.map(c => c.category).filter(Boolean))];

    return NextResponse.json({
      totalPrograms: programCount || 0,
      totalCourses: courseCount || 0,
      totalEnrollments: enrollmentCount || 0,
      categories: uniqueCategories,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/catalog/summary', _GET);
