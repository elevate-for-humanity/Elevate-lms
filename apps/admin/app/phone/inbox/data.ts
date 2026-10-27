import type { AuthResult } from '@/lib/auth/require-role';

export async function resolvePhoneInboxScope(db: any, auth: AuthResult) {
  const platformAdmin = auth.effectiveRoles.some(role => ['admin', 'super_admin'].includes(role));
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  const oversight = platformAdmin || Boolean(tenantId && auth.effectiveRoles.includes('org_admin'));
  let query = db.from('phone_systems').select('id').limit(1);
  query = tenantId ? query.eq('tenant_id', tenantId) : query.is('tenant_id', null);
  const result = await query.maybeSingle();
  if (result.error) throw result.error;
  let system = result.data;
  if (!system && platformAdmin && tenantId) {
    const fallback = await db.from('phone_systems').select('id').is('tenant_id', null).limit(1).maybeSingle();
    if (fallback.error) throw fallback.error;
    system = fallback.data;
  }
  return { systemId: system?.id as string | undefined, profileId: oversight ? undefined : auth.user.id, oversight };
}

export async function loadPhoneInbox(db: any, scope: { systemId?: string; profileId?: string }, page = 1) {
  if (!scope.systemId) return { calls: [], callbacks: [], voicemails: [], texts: [], hasMore: false };
  const offset = (page - 1) * 50;
  const extension = 'extension:communication_extensions!extension_id(extension,display_name)';
  let callbacks = db.from('phone_callback_tasks')
    .select(`*,${extension},call:phone_calls!inner(phone_system_id,from_number,started_at)`)
    .eq('call.phone_system_id', scope.systemId);
  let voicemails = db.from('voicemails')
    .select(`*,${extension},call:phone_calls(started_at,callbacks:phone_callback_tasks(id,source,status,updated_at))`)
    .eq('phone_system_id', scope.systemId);
  let calls = db.from('phone_calls')
    .select('*,extension:communication_extensions!assigned_extension_id(extension,display_name),legs:phone_call_legs(status,answered_at,hangup_cause),callbacks:phone_callback_tasks(id,status,updated_at,source),voicemails:voicemails(id)')
    .eq('phone_system_id', scope.systemId);
  if (scope.profileId) {
    calls = calls.eq('assigned_profile_id', scope.profileId);
    callbacks = callbacks.eq('assigned_profile_id', scope.profileId);
    voicemails = voicemails.eq('assigned_profile_id', scope.profileId);
  }
  const results = await Promise.all([calls, callbacks, voicemails].map(query =>
    query.order('created_at', { ascending: false }).order('id').range(offset, offset + 50),
  ));
  for (const result of results) if (result.error) throw result.error;
  const { data: workspace, error: workspaceError } = await db.from('communication_workspaces')
    .select('id').eq('phone_system_id', scope.systemId).maybeSingle();
  if (workspaceError) throw workspaceError;
  let texts: any[] = [];
  if (workspace && !scope.profileId) {
    const result = await db.from('communication_messages').select('*').eq('workspace_id', workspace.id)
      .eq('channel', 'sms').order('created_at', { ascending: false }).order('id').range(offset, offset + 50);
    if (result.error) throw result.error;
    texts = result.data ?? [];
  }
  return {
    calls: (results[0].data ?? []).slice(0, 50), callbacks: (results[1].data ?? []).slice(0, 50),
    voicemails: (results[2].data ?? []).slice(0, 50), texts: texts.slice(0, 50),
    hasMore: texts.length > 50 || results.some(result => (result.data?.length ?? 0) > 50),
  };
}

export function holderCallOutcome(call: any) {
  if ((call.legs ?? []).some((leg: any) => leg.answered_at)) return 'Answered by staff';
  if (!call.assigned_profile_id) return 'General call';
  if (call.ended_at) return 'No holder answer recorded';
  return 'Call in progress';
}
