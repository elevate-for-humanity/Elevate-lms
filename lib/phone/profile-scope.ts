/** Match the communications workspace scope, including legacy organization IDs. */
export function scopePhoneProfileQuery<T extends { or: (filter: string) => T; is: (column: string, value: null) => T }>(query: T, tenantId: string | null): T {
  if (!tenantId) return query.is('tenant_id', null).is('organization_id', null);
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) throw new Error('Invalid phone organization');
  return query.or(`tenant_id.eq.${tenantId},and(tenant_id.is.null,organization_id.eq.${tenantId})`);
}

/** Never silently clear an existing assignee absent from the current directory. */
export function phoneNumberProfileChoices<T extends { id: string }>(profiles: T[], currentId: string | null): (T | { id: string; full_name: string })[] {
  return !currentId || profiles.some(profile => profile.id === currentId)
    ? profiles
    : [...profiles, { id: currentId, full_name: 'Current assigned account' }];
}
