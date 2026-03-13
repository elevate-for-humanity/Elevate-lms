import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'staff'];

/**
 * Called immediately after signInWithPassword on the admin-login page.
 * Verifies the session cookie belongs to an admin-role user server-side.
 * Returns 200 if allowed, 403 if not. The caller signs out on 403.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, role: profile.role });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
