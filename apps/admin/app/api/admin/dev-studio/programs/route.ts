/**
 * GET /api/admin/dev-studio/programs
 * Canonical Admin-owned Dev Studio programs endpoint.
 */
import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const authResult = await apiRequireAdmin();
    if (authResult.error) return authResult.error;

    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();
    const { data: programs, error } = await db
      .from('programs')
      .select('id,title,code,slug,description,status,is_active,category,created_at,total_hours,tuition')
      .order('title', { ascending: true });

    if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });

    const programIds = programs?.map((p) => p.id) ?? [];
    const enrollmentCounts: Record<string, number> = {};
    if (programIds.length > 0) {
      const { data: enrollments } = await db
        .from('program_enrollments')
        .select('program_id')
        .in('program_id', programIds)
        .eq('status', 'active');
      for (const e of enrollments ?? []) {
        if (e.program_id) enrollmentCounts[e.program_id] = (enrollmentCounts[e.program_id] || 0) + 1;
      }
    }

    const mapped = (programs ?? []).map((p) => ({
      id: p.id,
      title: p.title ?? p.code ?? 'Untitled',
      slug: p.slug ?? p.code ?? p.id,
      code: p.code,
      description: p.description,
      status: p.status,
      is_active: p.is_active,
      category: p.category,
      total_hours: p.total_hours,
      tuition: p.tuition,
      enrolled_count: enrollmentCounts[p.id] ?? 0,
    }));

    return NextResponse.json({ data: mapped }, { status: 200 });
  } catch (err) {
    console.error('Dev studio programs error:', err);
    return NextResponse.json({ error: 'Failed to load programs' }, { status: 500 });
  }
}
