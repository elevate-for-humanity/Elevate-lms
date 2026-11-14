/**
 * GET  /api/admin/organizations
 *   Lists all organizations. Platform admin only.
 *
 * POST /api/admin/organizations
 *   Provisions a new organization.
 *   Body: { name: string; slug: string; type?: string }
 *   Returns: { ok, org: { id, name, slug } }
 *
 * This is the entry point for onboarding a new partner org.
 * After creation, add members via POST /api/admin/organizations/[orgId]/members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('organizations')
    .select('id, name, slug, type, status, created_at')
    .order('name');

  if (error) return safeInternalError(error, 'Failed to list organizations');
  return NextResponse.json({ ok: true, organizations: data ?? [] });
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase kebab-case'),
  type: z
    .enum(['training_provider', 'workforce_board', 'state_agency', 'employer', 'partner'])
    .default('training_provider'),
});

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return safeError('name, slug (kebab-case), and optional type required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Slug uniqueness check with clear error
  const { data: existing } = await db
    .from('organizations')
    .select('id')
    .eq('slug', body.slug)
    .maybeSingle();

  if (existing) return safeError(`Slug '${body.slug}' is already taken`, 409);

  const { data: org, error } = await db
    .from('organizations')
    .insert({ name: body.name, slug: body.slug, type: body.type, status: 'active' })
    .select('id, name, slug, type, status')
    .single();

  if (error) return safeInternalError(error, 'Failed to create organization');

  return NextResponse.json({ ok: true, org }, { status: 201 });
}
