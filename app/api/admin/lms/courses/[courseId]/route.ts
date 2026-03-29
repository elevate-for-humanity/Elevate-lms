
/**
 * PATCH /api/admin/lms/courses/[courseId]  — update a canonical course
 * DELETE /api/admin/lms/courses/[courseId] — archive a canonical course
 *
 * Writes to: courses (canonical table only).
 * DELETE sets status='archived', never hard-deletes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  return { user, profile };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const supabase = await createClient();
    const { user, profile } = await requireAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { courseId } = await params;
    const body = await request.json();

    // Whitelist updatable fields. status may be set to 'draft' to unpublish;
    // use /publish endpoint to publish (enforces health check).
    const allowed = ['title', 'short_description', 'description', 'slug', 'status'] as const;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select('id, slug, title, status')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ course: data });
  } catch (error) {
    return safeInternalError(error, 'Failed to update course');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const supabase = await createClient();
    const { user, profile } = await requireAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { courseId } = await params;

    // Archive, never hard-delete — preserves enrollment history
    const { error } = await supabase
      .from('courses')
      .update({ status: 'archived', is_active: false, updated_at: new Date().toISOString() })
      .eq('id', courseId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeInternalError(error, 'Failed to archive course');
  }
}
