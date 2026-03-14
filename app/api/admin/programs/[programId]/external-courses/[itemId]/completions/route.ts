/**
 * /api/admin/programs/[programId]/external-courses/[itemId]/completions
 *
 * GET  — list all learner completions for this external item
 * POST — mark a learner as complete (admin action)
 * DELETE — remove a completion record (admin action)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'staff'].includes(profile.role)) return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> }
) {
  const { programId, itemId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from('program_external_completions')
    .select(`
      id, completed_at, notes, proof_url,
      learner:profiles!program_external_completions_user_id_fkey(id, full_name, email),
      marked_by_profile:profiles!program_external_completions_marked_by_fkey(id, full_name)
    `)
    .eq('external_course_id', itemId)
    .eq('program_id', programId)
    .order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ completions: data ?? [] });
}

const MarkCompleteSchema = z.object({
  user_id:   z.string().uuid('Must be a valid user UUID'),
  notes:     z.string().optional().default(''),
  proof_url: z.string().url().optional().or(z.literal('')),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> }
) {
  const { programId, itemId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = MarkCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 422 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from('program_external_completions')
    .upsert(
      {
        external_course_id: itemId,
        program_id:         programId,
        user_id:            parsed.data.user_id,
        marked_by:          user.id,
        notes:              parsed.data.notes || null,
        proof_url:          parsed.data.proof_url || null,
        completed_at:       new Date().toISOString(),
      },
      { onConflict: 'external_course_id,user_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    logger.error('Mark external complete error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.info('External training marked complete', { itemId, userId: parsed.data.user_id, adminId: user.id });
  return NextResponse.json({ completion: data }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; itemId: string }> }
) {
  const { itemId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db
    .from('program_external_completions')
    .delete()
    .eq('external_course_id', itemId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
