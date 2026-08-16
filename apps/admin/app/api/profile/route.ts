/**
 * GET /api/profile
 * Admin profile endpoint - can view any profile
 * Requires admin authentication
 */
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';

const handleGet: AuthHandler = async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const supabase = await requireAdminClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json({ profile, service: 'admin' });
};

// Wrap handler with admin authentication
export const GET = withAuth(handleGet, { roles: ['admin', 'super_admin', 'staff', 'case_manager'] });
