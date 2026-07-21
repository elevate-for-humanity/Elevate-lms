/**
 * Admin Roles API
 * Server-only endpoint using service-role key
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy initialization - create client inside request handlers, not at module scope
// This prevents build failures when env vars are not set during next build
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json({ roles, service: 'admin' });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  const body = await request.json();

  const { data: role, error } = await supabase
    .from('roles')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }

  return NextResponse.json({ role }, { status: 201 });
}

export async function PUT(request: Request) {
  const supabase = getSupabaseAdmin();
  const body = await request.json();
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
}
