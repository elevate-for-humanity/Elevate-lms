/**
 * /api/admin/programs/[programId]/courses/[linkId]
 *
 * PATCH  — update sort_order or is_required on a program_courses row
 * DELETE — detach an internal course from this program
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  is_required: z.boolean().optional(),
  order_index: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; linkId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId, linkId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 422 });
  }

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_courses')
    .update(parsed.data)
    .eq('id', linkId)
    .eq('program_id', programId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; linkId: string }> },
) {
  const { programId, linkId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { error } = await db
    .from('program_courses')
    .delete()
    .eq('id', linkId)
    .eq('program_id', programId);

  if (error) {
    logger.error('DELETE program course link error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
