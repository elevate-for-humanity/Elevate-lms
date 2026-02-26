import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { count: programCount } = await db
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: courseCount } = await db
      .from('training_courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: enrollmentCount } = await db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'completed']);

    const { data: categories } = await db
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
