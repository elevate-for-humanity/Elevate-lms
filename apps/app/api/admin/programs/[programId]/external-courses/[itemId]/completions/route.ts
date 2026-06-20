/**
 * /api/admin/programs/[programId]/external-courses/[itemId]/completions
 *
 * GET  — list all learner completions for this external item
 * POST — mark a learner as complete (admin action)
 * DELETE — remove a completion record (admin action)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId, itemId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_external_completions')
    .select(
      `
      id, completed_at, notes, proof_url,
      learner:profiles!program_external_completions_user_id_fkey(id, full_name, email),
      marked_by_profile:profiles!program_external_completions_marked_by_fkey(id, full_name)
    `,
    )
    .eq('external_course_id', itemId)
    .eq('program_id', programId)
    .order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json({ completions: data ?? [] });
}

const MarkCompleteSchema = z.object({
  user_id: z.string().uuid('Must be a valid user UUID'),
  notes: z.string().optional().default(''),
  proof_url: z.string().url().optional().or(z.literal('')),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> },
) {
  const { programId, itemId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = MarkCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 422 });
  }

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_external_completions')
    .upsert(
      {
        external_course_id: itemId,
        program_id: programId,
        user_id: parsed.data.user_id,
        marked_by: auth.id,
        notes: parsed.data.notes || null,
        proof_url: parsed.data.proof_url || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'external_course_id,user_id', ignoreDuplicates: false },
    )
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Mark external complete error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  logger.info('External training marked complete', {
    itemId,
    userId: parsed.data.user_id,
    adminId: auth.id,
  });
  return NextResponse.json({ completion: data }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> },
) {
  const { itemId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const db = await requireAdminClient();
  const { error } = await db
    .from('program_external_completions')
    .delete()
    .eq('external_course_id', itemId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
