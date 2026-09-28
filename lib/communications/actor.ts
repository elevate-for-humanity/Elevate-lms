import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { normalizeRoles } from '@/lib/rbac/role-matrix';

const COMMUNICATION_ROLES = new Set([
  'super_admin','admin','org_admin','staff','program_holder','programholder',
  'site_coordinator','host_shop','hostshop','partner','employer','instructor','case_manager','counselor','advisor'
]);

export async function requireCommunicationActor() {
  const db = await requireAdminClient();

  // Cross-domain Admin previews use a short-lived signed handoff and may not
  // carry the LMS Supabase session. Resolve that verified subject first, then
  // fall back to the authenticated actor for ordinary holder sessions.
  const handoffPreview = await resolvePortalPreviewSubject(db, null);
  const auth = await createClient();
  const {
    data: { user: authenticatedUser },
    error,
  } = await auth.auth.getUser();
  if ((error || !authenticatedUser) && !handoffPreview.previewing) {
    throw new Error('COMMUNICATIONS_UNAUTHENTICATED');
  }

  const preview = handoffPreview.previewing
    ? handoffPreview
    : await resolvePortalPreviewSubject(db, authenticatedUser?.id);
  const effectiveUserId = preview.previewing ? preview.userId : authenticatedUser!.id;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    db.from('profiles').select('id,email,full_name,role').eq('id', effectiveUserId).maybeSingle(),
    db.from('user_roles').select('roles(name)').eq('user_id', effectiveUserId),
  ]);
  const roles = normalizeRoles([
    profile?.role,
    ...(roleRows ?? []).map((row: any) => row?.roles?.name),
  ]).filter(Boolean);
  if (!roles.some((role) => COMMUNICATION_ROLES.has(role))) {
    throw new Error('COMMUNICATIONS_FORBIDDEN');
  }

  const { data: extension } = await db
    .from('communication_extensions')
    .select('*,communication_workspaces!inner(id,phone_system_id)')
    .eq('profile_id', effectiveUserId)
    .eq('enabled', true)
    .maybeSingle();
  const systemId = extension?.communication_workspaces?.phone_system_id;
  const { data: system } = systemId
    ? await db.from('phone_systems').select('*').eq('id', systemId).maybeSingle()
    : { data: null };

  return {
    user: { id: effectiveUserId, email: profile?.email || authenticatedUser?.email },
    authenticatedUser,
    previewing: preview.previewing,
    profile,
    roles,
    db,
    extension,
    system,
  };
}
