/**
 * /api/admin/content/team
 *
 * GET  — list all team members ordered by display_order
 * POST — create or update a team member (upsert by id)
 * DELETE ?id=uuid — soft-delete (set is_active=false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = createAdminClient();
  const { data, error } = await db
    .from('team_members')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return safeInternalError(error, 'Failed to load team members');
  return NextResponse.json({ members: data });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return safeError('Invalid JSON', 400); }

  if (!body.name || !body.title) return safeError('name and title are required', 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from('team_members')
    .upsert({
      ...(body.id ? { id: body.id } : {}),
      name: body.name,
      title: body.title,
      org_role: body.org_role ?? null,
      bio: body.bio ?? null,
      headshot_url: body.headshot_url ?? null,
      email: body.email ?? null,
      linkedin_url: body.linkedin_url ?? null,
      display_order: body.display_order ?? 0,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) return safeInternalError(error, 'Failed to save team member');
  return NextResponse.json({ member: data });
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return safeError('id is required', 400);

  const db = createAdminClient();
  const { error } = await db
    .from('team_members')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return safeInternalError(error, 'Failed to deactivate team member');
  return NextResponse.json({ ok: true });
}
