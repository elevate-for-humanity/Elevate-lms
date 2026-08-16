/**
 * Storage Signed URL API - Admin
 * Requires admin authentication
 */
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';
const handleGet: AuthHandler = async (req) => {
  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket');
  const path = url.searchParams.get('path');
  const expiresIn = parseInt(url.searchParams.get('expiresIn') ?? '3600');
  if (!bucket || !path) return NextResponse.json({ error: 'bucket and path required' }, { status: 400 });
  try {
    const supabase = await requireAdminClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    return NextResponse.json({ signedUrl: data.signedUrl, service: 'admin' });
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
};

// Wrap handler with admin authentication
export const GET = withAuth(handleGet, { roles: ['admin', 'super_admin', 'instructor', 'staff'] });
