import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeRoles } from '@/lib/rbac/role-matrix';

const COMMUNICATION_ROLES = new Set([
  'super_admin','admin','org_admin','staff','program_holder','programholder',
  'host_shop','hostshop','partner','employer','instructor','case_manager','counselor','advisor'
]);

export async function requireCommunicationActor() {
  const auth = await createClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) throw new Error('COMMUNICATIONS_UNAUTHENTICATED');

  const db = await requireAdminClient();
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    db.from('profiles').select('id,email,full_name,role').eq('id', user.id).maybeSingle(),
    db.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);
  const roles = normalizeRoles([
    profile?.role,
    ...(roleRows ?? []).map((row: any) => row?.roles?.name),
  ]).filter((role): role is string => Boolean(role));
  if (!roles.some((role) => COMMUNICATION_ROLES.has(role))) throw new Error('COMMUNICATIONS_FORBIDDEN');

  const { data: extension } = await db
    .from('communication_extensions')
    .select('*,communication_workspaces!inner(id,phone_system_id)')
    .eq('profile_id', user.id)
    .eq('enabled', true)
    .maybeSingle();
  const systemId = extension?.communication_workspaces?.phone_system_id;
  const { data: system } = systemId
    ? await db.from('phone_systems').select('*').eq('id', systemId).maybeSingle()
    : { data: null };

  return { user, profile, roles, db, extension, system };
}
