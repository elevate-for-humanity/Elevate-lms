import 'server-only';

import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { normalizeRoles, type UserRole } from '@/lib/rbac/role-matrix';
import { hasCaseManagerOversight } from '@/lib/case-manager/participant-scope';

export type CaseManagerApiAuth = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
  effectiveRoles: UserRole[];
  oversight: boolean;
  error: NextResponse | null;
};

export async function requireCaseManagerApiAccess(): Promise<CaseManagerApiAuth> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      supabase,
      user: null,
      effectiveRoles: [],
      oversight: false,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);
  if (profileError || rolesError) {
    return {
      supabase,
      user: null,
      effectiveRoles: [],
      oversight: false,
      error: NextResponse.json({ error: 'Unable to verify portal access' }, { status: 500 }),
    };
  }

  const effectiveRoles = normalizeRoles([
    profile?.role,
    ...(roleRows ?? []).map((row: any) => row.roles?.name),
  ]);
  if (!effectiveRoles.some((role) => ['case_manager', 'admin', 'super_admin', 'staff'].includes(role))) {
    return {
      supabase,
      user: null,
      effectiveRoles,
      oversight: false,
      error: NextResponse.json({ error: 'Case manager access required' }, { status: 403 }),
    };
  }

  return {
    supabase,
    user,
    effectiveRoles,
    oversight: hasCaseManagerOversight(effectiveRoles),
    error: null,
  };
}

export function caseManagerActorRole(roles: readonly string[]) {
  return roles.find((role) => ['admin', 'super_admin', 'staff', 'case_manager'].includes(role)) || 'case_manager';
}
