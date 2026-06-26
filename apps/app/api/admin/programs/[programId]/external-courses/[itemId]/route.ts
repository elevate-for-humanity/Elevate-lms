/**
 * /api/admin/programs/[programId]/external-courses/[itemId]
 *
 * PATCH  — update an external partner training item
 * DELETE — soft-delete (is_active = false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;



const PatchSchema = z.object({
  partner_name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  external_url: z.string().url('Must be a valid URL').optional(),
  description: z.string().optional(),
  duration_display: z.string().optional(),
  credential_type: z.string().optional(),
  credential_name: z.string().optional(),
  enrollment_instructions: z.string().optional(),
  opens_in_new_tab: z.boolean().optional(),
  is_required: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  manual_completion_enabled: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId, itemId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return NextResponse.json({ error: issues }, { status: 422 });
  }

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_external_courses')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('program_id', programId)
    .select()
    .single();

  if (error) {
    logger.error('PATCH external course error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> },
) {
  const { programId, itemId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { error } = await db
    .from('program_external_courses')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('program_id', programId);

  if (error) {
    logger.error('DELETE external course error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
