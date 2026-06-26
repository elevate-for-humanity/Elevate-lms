/**
 * GET  /api/mentor/resources
 * POST /api/mentor/resources
 *
 * Mentor resource library — shared materials for mentees.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

const ALLOWED_ROLES = ['mentor', 'admin'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category');

  try {
    const supabase = await getAdminClient();
    let q = supabase
      .from('mentor_resources')
      .select('id, title, description, url, file_type, category, created_at, created_by')
      .order('created_at', { ascending: false });

    if (category) q = q.eq('category', category) as typeof q;

    const { data, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch resources');
    return NextResponse.json({ resources: data ?? [] });
  } catch (err) { return safeInternalError(err, 'Failed to fetch resources'); }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const { title, description, url, file_type, category } = await req.json();
    if (!title || !url) return safeError('title and url are required', 400);

    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from('mentor_resources')
      .insert({ title, description, url, file_type, category, created_by: auth.id })
      .select('id, title, url, category')
      .single();

    if (error) return safeDbError(error, 'Failed to create resource');
    return NextResponse.json(data, { status: 201 });
  } catch (err) { return safeInternalError(err, 'Failed to create resource'); }
}
