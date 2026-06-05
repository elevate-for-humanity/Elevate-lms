import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STAFF_PORTAL_ROLES } from '@/lib/staff-portal/access';

export type StaffPortalApiAuth = {
  userId: string;
  role: string;
};

/**
 * API routes under /api/staff/* — require authenticated staff-portal role.
 */
export async function requireStaffPortalApi(): Promise<StaffPortalApiAuth | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !(STAFF_PORTAL_ROLES as readonly string[]).includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { userId: user.id, role: profile.role };
}

export function isStaffPortalApiAuth(
  result: StaffPortalApiAuth | NextResponse,
): result is StaffPortalApiAuth {
  return 'userId' in result;
}
