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

export const reviewablePostStatuses = ['draft', 'pending_approval', 'configuration_required'];

const destinationPlatforms: Record<string, string> = {
  facebook_page: 'facebook',
  instagram_image: 'instagram',
  instagram_reel: 'instagram',
};

export function postPublishingReadinessError(
  post: {
    platform?: string | null;
    destination_type?: string | null;
    media_url?: string | null;
    thumbnail_url?: string | null;
    video_url?: string | null;
  },
  sourceApproved: boolean,
  account: (Account & { dry_run?: boolean | null }) | null,
): string | null {
  if (!sourceApproved) {
    return 'This draft has no approved source article. Build a new package from the current blog library.';
  }
  const platform = destinationPlatforms[post.destination_type ?? ''];
  if (!platform || platform !== post.platform) {
    return 'Automatic publishing is unavailable for this destination.';
  }
  if (post.destination_type === 'instagram_image' && !(post.media_url || post.thumbnail_url)) {
    return 'Add an approved image before queuing this Instagram post.';
  }
  if (post.destination_type === 'instagram_reel' && !post.video_url) {
    return 'Add a finished video before queuing this Reel.';
  }
  return (
    publishingReadinessError(platform, account) ??
    (account?.dry_run !== false ? 'Enable approved publishing for this account first.' : null)
  );
}

export function publicSocialImageUrl(value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input || input.includes('\\') || input.startsWith('//')) return null;
  try {
    const url = input.startsWith('/')
      ? new URL(input, 'https://www.elevateforhumanity.org')
      : new URL(input);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
