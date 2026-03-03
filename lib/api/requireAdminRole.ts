import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * API route guard: returns 401/403 NextResponse if user is not admin.
 * Returns null if authorized (caller should proceed).
 */
export async function requireAdminRole(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const admin = createAdminClient();
  const db = admin || supabase;

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null; // Authorized
}
