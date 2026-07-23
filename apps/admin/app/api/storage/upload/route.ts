/**
 * Storage Upload API - Admin
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

const handlePost: AuthHandler = async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;
    if (!file || !bucket || !path) return NextResponse.json({ error: 'file, bucket, path required' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, error } = await getSupabase().storage.from(bucket).upload(`${path}/${file.name}`, buffer, { upsert: true });
    if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    return NextResponse.json({ path: data.path, service: 'admin' });
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
};

// Wrap handler with admin authentication
export const POST = withAuth(handlePost, { roles: ['admin', 'super_admin', 'instructor', 'staff'] });
