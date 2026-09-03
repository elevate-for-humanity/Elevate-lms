/**
 * POST /api/admin/programs/[programId]/publish-direct
 *
 * Admin-only direct publish. Sets published=true, is_active=true,
 * status='published', review_status='approved', published_at=now().
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: program, error: loadErr } = await db
    .from('programs')
    .select('id, title, slug, published, status')
    .eq('id', programId)
    .maybeSingle();

  if (loadErr) return safeInternalError(loadErr, 'Failed to load program');
  if (!program) return safeError('Program not found', 404);

  const missing: string[] = [];
  if (!program.title?.trim()) missing.push('Program title');
  if (!program.slug?.trim()) missing.push('Program slug');

  if (missing.length > 0) {
    return NextResponse.json({ error: 'Program is incomplete', missing }, { status: 422 });
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from('programs')
    .update({
      published: true,
      is_active: true,
      status: 'published',
      review_status: 'approved',
      published_at: now,
      updated_at: now,
    })
    .eq('id', programId);

  if (updateErr) return safeInternalError(updateErr, 'Publish failed');

  try {
    await db.from('audit_logs').insert({
      actor_id: auth.id,
      action: 'publish_direct',
      resource_type: 'program',
      resource_id: programId,
    });
  } catch {
    // Audit persistence is non-blocking for a successful publish.
  }

  revalidatePath('/programs');
  revalidatePath('/programs/catalog');
  if (program.slug) revalidatePath(`/programs/${program.slug}`);

  return NextResponse.json({ ok: true, published: true, slug: program.slug });
}
