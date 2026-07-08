/**
 * Supabase auth cookies are shared across www + admin subdomains in production.
 * On localhost, omit Domain so browsers accept the session cookie.
 */
export function resolveSupabaseAuthCookieDomain(): string | undefined {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return undefined;
      }
    } catch {
      /* ignore malformed URLs */
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return undefined;
  }

  return '.elevateforhumanity.org';
}

export function withSupabaseAuthCookieDomain<T extends { domain?: string }>(
  options: T,
): T {
  const domain = resolveSupabaseAuthCookieDomain();
  if (!domain) {
    const { domain: _omit, ...rest } = options;
    return rest as T;
  }
  return { ...options, domain };
}
