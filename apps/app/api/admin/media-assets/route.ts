/**
 * GET  /api/admin/media-assets?org_id=&type=video
 *   Lists media assets for an org, optionally filtered by type.
 *
 * POST /api/admin/media-assets
 *   Registers a media asset from an existing storage path.
 *   Does not handle file upload — upload via Supabase Storage directly,
 *   then register the resulting path here.
 *   Body: { org_id, storage_path, type, mime_type?, duration_seconds?, title?, transcript? }
 *   Returns: { ok, asset: { id, storage_path, type } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;



export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id');
  const type = searchParams.get('type');

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  let query = db
    .from('media_assets')
    .select(
      'id, org_id, storage_path, type, mime_type, duration_seconds, title, status, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(200);

  if (orgId) query = query.eq('org_id', orgId);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return safeInternalError(error, 'Failed to list media assets');

  return NextResponse.json({ ok: true, assets: data ?? [] });
}

const createSchema = z.object({
  org_id: z.string().uuid(),
  storage_path: z.string().min(1),
  type: z.enum(['video', 'audio', 'image', 'document', 'other']),
  mime_type: z.string().optional(),
  duration_seconds: z.number().int().positive().optional(),
  title: z.string().optional(),
  transcript: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return safeError('Invalid body — org_id (UUID), storage_path, and type required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('media_assets')
    .insert({ ...body, created_by: auth.id })
    .select('id, org_id, storage_path, type, title')
    .single();

  if (error) return safeInternalError(error, 'Failed to create media asset');

  return NextResponse.json({ ok: true, asset: data }, { status: 201 });
}
