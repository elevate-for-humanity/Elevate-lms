/**
 * Admin Users API
 * Server-only endpoint using the canonical Supabase admin client.
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handleGet: AuthHandler = async (req) => {
  const supabase = await requireAdminClient();
  const url = new URL(req.url);
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, requestedLimit))
    : 20;
  const offset = (page - 1) * limit;

  const { data: users, error, count } = await supabase
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

  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: body.metadata ?? {},
  });

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ user: user.user }, { status: 201 });
};

export const GET = withAuth(handleGet, { roles: ['admin'] });
export const POST = withAuth(handlePost, { roles: ['admin'] });
