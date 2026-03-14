/**
 * /api/admin/programs/[programId]/external-courses/[itemId]
 *
 * PATCH  — update an external partner training item
 * DELETE — soft-delete (is_active = false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  partner_name:             z.string().min(1).optional(),
  title:                    z.string().min(1).optional(),
  external_url:             z.string().url('Must be a valid URL').optional(),
  description:              z.string().optional(),
  duration_display:         z.string().optional(),
  credential_type:          z.string().optional(),
  credential_name:          z.string().optional(),
  enrollment_instructions:  z.string().optional(),
  opens_in_new_tab:         z.boolean().optional(),
  is_required:              z.boolean().optional(),
  sort_order:               z.number().int().min(0).optional(),
  manual_completion_enabled: z.boolean().optional(),
  is_active:                z.boolean().optional(),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'staff'].includes(profile.role)) return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> }
) {
  const { programId, itemId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return NextResponse.json({ error: issues }, { status: 422 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from('program_external_courses')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('program_id', programId)
    .select()
    .single();

  if (error) {
    logger.error('PATCH external course error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> }
) {
  const { programId, itemId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { error } = await db
    .from('program_external_courses')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('program_id', programId);

  if (error) {
    logger.error('DELETE external course error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
