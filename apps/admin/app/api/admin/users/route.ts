/**
 * Admin Users API
 * Server-only endpoint using the canonical Supabase admin client.
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';
import { normalizeRole } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handleGet: AuthHandler = async (req) => {
  const supabase = await requireAdminClient();
  const url = new URL(req.url);
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;
  const offset = (page - 1) * limit;

  const {
    data: users,
    error,
    count,
  } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json({
    users,
    total: count ?? 0,
    page,
    limit,
    service: 'admin',
  });
};

const handlePost: AuthHandler = async (req) => {
  const supabase = await requireAdminClient();
  const body = await req.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : {};
  const role = metadata.role === undefined ? 'student' : normalizeRole(metadata.role);
  if (!role) return NextResponse.json({ error: 'Invalid account role' }, { status: 400 });
  const tenantId = metadata.tenant_id;
  if (
    tenantId !== undefined &&
    (typeof tenantId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId))
  ) {
    return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
  }

  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, ...(tenantId ? { tenant_id: tenantId } : {}) },
    user_metadata: metadata,
  });

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ user: user.user }, { status: 201 });
};

export const GET = withAuth(handleGet, { roles: ['admin'] });
export const POST = withAuth(handlePost, { roles: ['admin'] });
