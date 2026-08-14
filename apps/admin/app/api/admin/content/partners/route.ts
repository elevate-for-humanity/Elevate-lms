/**
 * /api/admin/content/partners
 *
 * GET  — list all training partners ordered by display_order
 * POST — create or update a training partner (upsert by id)
 * DELETE ?id=uuid — set status='inactive'
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
    .from('training_partners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return safeInternalError(error, 'Failed to load training partners');
  return NextResponse.json({ partners: data });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return safeError('Invalid JSON', 400); }

  if (!body.name || !body.category || !body.training_role) {
    return safeError('name, category, and training_role are required', 400);
  }

  const db = createAdminClient();
  const slug = body.slug ?? (body.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data, error } = await db
    .from('training_partners')
    .upsert({
      ...(body.id ? { id: body.id } : {}),
      name: body.name,
      slug,
      category: body.category,
      training_role: body.training_role,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? 'IN',
      zip: body.zip ?? null,
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      logo_url: body.logo_url ?? null,
      website_url: body.website_url ?? null,
      rapids_employer_id: body.rapids_employer_id ?? null,
      mou_on_file: body.mou_on_file ?? false,
      status: body.status ?? 'active',
      programs_list: body.programs_list ?? [],
      notes: body.notes ?? null,
      display_order: body.display_order ?? 0,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) return safeInternalError(error, 'Failed to save training partner');
  return NextResponse.json({ partner: data });
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
    .from('training_partners')
    .update({ status: 'inactive' })
    .eq('id', id);

  if (error) return safeInternalError(error, 'Failed to deactivate partner');
  return NextResponse.json({ ok: true });
}
