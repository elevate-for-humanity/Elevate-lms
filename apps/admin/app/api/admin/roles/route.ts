/**
 * Admin Roles API
 * Server-only endpoint using service-role key
 * Requires admin authentication
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';

// Lazy initialization - create client inside request handlers, not at module scope
// This prevents build failures when env vars are not set during next build
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const handleGet: AuthHandler = async () => {
  const supabase = getSupabaseAdmin();
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json({ roles, service: 'admin' });
};

const handlePost: AuthHandler = async (req) => {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const { data: role, error } = await supabase
    .from('roles')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ role }, { status: 201 });
};

const handlePut: AuthHandler = async (req) => {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { id, ...updates } = body;

  const { data: role, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ role });
};

// Wrap handlers with admin authentication
export const GET = withAuth(handleGet, { roles: ['admin', 'super_admin'] });
export const POST = withAuth(handlePost, { roles: ['admin', 'super_admin'] });
export const PUT = withAuth(handlePut, { roles: ['admin', 'super_admin'] });
