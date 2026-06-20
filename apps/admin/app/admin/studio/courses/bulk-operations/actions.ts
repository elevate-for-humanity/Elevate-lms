'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { AdminAction, BULK_ENTITY_ID, logAdminAudit } from '@/lib/admin/audit-log';

export async function bulkUpdateCourseStatus(
  ids: string[],
  status: 'published' | 'archived' | 'draft',
): Promise<{ success: boolean; error?: string }> {
  const h = await headers();
  const req = new Request('http://localhost', { headers: h });
  const auth = await apiRequireAdmin(req);
  if (auth.error) return { success: false, error: 'Unauthorized' };
  if (ids.length === 0) return { success: true };

  const db = await requireAdminClient();
  if (!db) return { success: false, error: 'DB unavailable' };

  const { error } = await db
    .from('lms_courses')
    .update({
      status,
      is_active: status === 'published',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (error) return { success: false, error: error.message };

  await logAdminAudit({
    action: AdminAction.COURSE_DEFINITIONS_SYNCED,
    actorId: auth.id,
    entityType: 'training_courses',
    entityId: BULK_ENTITY_ID,
    metadata: { operation: 'bulk_status_update', status, count: ids.length },
  });

  revalidatePath('/admin/courses');
  revalidatePath('/admin/courses/bulk-operations');
  return { success: true };
}

export async function exportCoursesCSV(
  ids: string[],
): Promise<{ csv?: string; error?: string }> {
  const h = await headers();
  const req = new Request('http://localhost', { headers: h });
  const auth = await apiRequireAdmin(req);
  if (auth.error) return { error: 'Unauthorized' };

  const db = await requireAdminClient();
  if (!db) return { error: 'DB unavailable' };

  let query = db
    .from('lms_courses')
    .select('id, title, slug, status, is_active, created_at')
    .order('created_at', { ascending: false });

  if (ids.length > 0) query = query.in('id', ids);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const headerRow = ['ID', 'Title', 'Slug', 'Status', 'Active', 'Created At'];
  const rows = (data ?? []).map((r) =>
    [r.id, r.title, r.slug, r.status, r.is_active ? 'Yes' : 'No', r.created_at]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(','),
  );

  return { csv: [headerRow.join(','), ...rows].join('\n') };
}
