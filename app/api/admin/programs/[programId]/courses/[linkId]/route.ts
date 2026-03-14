/**
 * /api/admin/programs/[programId]/courses/[linkId]
 *
 * PATCH  — update sort_order or is_required on a program_courses row
 * DELETE — detach an internal course from this program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  is_required: z.boolean().optional(),
  order_index:  z.number().int().min(0).optional(),
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
  { params }: { params: Promise<{ programId: string; linkId: string }> }
) {
  const { programId, linkId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 422 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from('program_courses')
    .update(parsed.data)
    .eq('id', linkId)
    .eq('program_id', programId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; linkId: string }> }
) {
  const { programId, linkId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { error } = await db
    .from('program_courses')
    .delete()
    .eq('id', linkId)
    .eq('program_id', programId);

  if (error) {
    logger.error('DELETE program course link error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
