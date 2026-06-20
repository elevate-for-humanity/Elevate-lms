import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/api-keys — generate a new API key
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const name = (body.name as string)?.trim();
  if (!name) return safeError('name is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  // Generate a secure key — only shown once, store the hash
  const rawKey = 'efh_' + randomBytes(32).toString('hex');
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  // Store the first 12 chars of the raw key in the name for display identification
  // Format: "My Key Name [efh_XXXXXXXX]"
  const displayPrefix = rawKey.slice(0, 12);
  const nameWithPrefix = `${name} [${displayPrefix}]`;

  const { data, error } = await db
    .from('api_keys')
    .insert({
      name: nameWithPrefix,
      key_hash: keyHash,
      created_by: auth.id,
      is_active: true,
    })
    .select('id, name, created_at')
    .single();

  if (error) return safeInternalError(error, 'Failed to create API key');

  // Return the raw key once — it cannot be retrieved again
  return NextResponse.json({ ...data, key: rawKey, prefix: displayPrefix });
}

// DELETE /api/admin/api-keys?id=xxx — revoke a key
export async function DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  const { error } = await db.from('api_keys').delete().eq('id', id);
  if (error) return safeInternalError(error, 'Failed to revoke API key');

  return NextResponse.json({ success: true });
}
