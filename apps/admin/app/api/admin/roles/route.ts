/**
 * Admin Roles API
 * Server-only endpoint using the canonical Supabase admin client.
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handleGet: AuthHandler = async () => {
  const supabase = await requireAdminClient();
  const { data: roles, error } = await supabase.from('roles').select('*').order('name');

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json({ roles, service: 'admin' });
};

const handlePost: AuthHandler = async (req) => {
  const supabase = await requireAdminClient();
  const body = await req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (!name || name === 'super_admin') {
    return NextResponse.json({ error: 'A valid role name is required' }, { status: 400 });
  }

  const payload = { ...body, name };
  const { data: role, error } = await supabase.from('roles').insert(payload).select().single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ role }, { status: 201 });
};

const handlePut: AuthHandler = async (req) => {
  const supabase = await requireAdminClient();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Role id is required' }, { status: 400 });
  }
  if (updates.name === 'super_admin') {
    return NextResponse.json({ error: 'super_admin is not a supported role' }, { status: 400 });
  }

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

export const GET = withAuth(handleGet, { roles: ['admin'] });
export const POST = withAuth(handlePost, { roles: ['admin'] });
export const PUT = withAuth(handlePut, { roles: ['admin'] });
