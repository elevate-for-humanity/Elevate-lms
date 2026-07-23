/**
 * Admin Users API
 * Server-only endpoint using service-role key
 * Requires admin authentication
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';

// Lazy initialization - create client inside request handlers, not at module scope
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const handleGet: AuthHandler = async (req) => {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '20');
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
    service: 'admin'
  });
};

const handlePost: AuthHandler = async (req) => {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const { data: user, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: body.metadata ?? {},
  });

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ user: user.user }, { status: 201 });
};

// Wrap handlers with admin authentication
export const GET = withAuth(handleGet, { roles: ['admin', 'super_admin'] });
export const POST = withAuth(handlePost, { roles: ['admin', 'super_admin'] });
