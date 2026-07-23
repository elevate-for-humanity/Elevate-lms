/**
 * Storage Signed URL API - Admin
 * Requires admin authentication
 */
import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase config required');
    supabaseClient = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseClient;
}

const handleGet: AuthHandler = async (req) => {
  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket');
  const path = url.searchParams.get('path');
  const expiresIn = parseInt(url.searchParams.get('expiresIn') ?? '3600');
  if (!bucket || !path) return NextResponse.json({ error: 'bucket and path required' }, { status: 400 });
  try {
    const { data, error } = await getSupabase().storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    return NextResponse.json({ signedUrl: data.signedUrl, service: 'admin' });
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
};

// Wrap handler with admin authentication
export const GET = withAuth(handleGet, { roles: ['admin', 'super_admin', 'instructor', 'staff'] });
