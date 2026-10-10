type Account = {
  enabled?: boolean;
  connection_status?: string | null;
  organization_id?: string | null;
  expires_at?: string | null;
  granted_scopes?: string[] | null;
};

/** Match the existing provider handlers; never unlock an unimplemented destination. */
export function publishingReadinessError(
  platform: string,
  account: Account | null,
  now = Date.now(),
): string | null {
  const scopes =
    platform === 'facebook'
      ? ['pages_manage_posts']
      : platform === 'instagram'
        ? ['instagram_basic', 'instagram_content_publish']
        : null;
  if (!scopes) return 'This platform does not have an enabled publishing handler yet.';
  if (
    !account?.enabled ||
    account.connection_status !== 'verified_read_only' ||
    !account.organization_id
  ) {
    return 'Connect and verify the publishing account first.';
  }
  if (
    account.expires_at &&
    (!Number.isFinite(Date.parse(account.expires_at)) || Date.parse(account.expires_at) <= now)
  ) {
    return 'Reconnect the expired publishing account.';
  }
  if (scopes.some((scope) => !account.granted_scopes?.includes(scope))) {
    return 'Reconnect the account and grant its required publishing permissions.';
  }
  return null;
}
