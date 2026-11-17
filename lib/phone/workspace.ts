/** Resolve the same existing workspace for both the form and its save action. */
export async function findPhoneWorkspace(db: any, tenantId: string | null, platformAdmin: boolean, phoneSystemId: string) {
  let query = db.from('communication_workspaces').select('*').limit(1);
  query = tenantId ? query.eq('tenant_id', tenantId) : query.is('tenant_id', null);
  const { data: tenantWorkspace, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (tenantWorkspace) return tenantWorkspace;
  if (platformAdmin && tenantId) {
    const { data, error: platformError } = await db.from('communication_workspaces')
      .select('*').eq('phone_system_id', phoneSystemId).limit(1).maybeSingle();
    if (platformError) throw new Error(platformError.message);
    if (data) return data;
  }
  return null;
}

/** A newly created workspace belongs to the actor; an existing one retains its scope. */
export function phoneWorkspaceTenant(workspace: { tenant_id: string | null } | null, actorTenantId: string | null): string | null {
  return workspace ? workspace.tenant_id : actorTenantId;
}
