import { absoluteRoleDestination } from '@/lib/auth/absolute-role-destination';
import {
  ROLE_ROUTE_CONFIG,
  getRoleDestinationUrl,
  resolveRoleRoute,
} from '@/lib/auth/role-destinations';

function firstPathSegment(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment ? `/${segment}` : '/';
}

const STORE_ORIGIN = 'https://store.elevateforhumanity.org';

const ROLE_OWNED_PREFIXES = new Set(
  Object.values(ROLE_ROUTE_CONFIG).map((config) => firstPathSegment(config.path)),
);

/**
 * Returns a post-login URL that cannot move a user into another role's portal.
 *
 * `validateRedirect()` protects against open redirects. This adds the missing
 * authorization layer: a local redirect must remain on the same deployed host
 * as the user's canonical role destination, and role-owned top-level prefixes
 * must match the user's own portal prefix.
 */
export function resolveRoleCompatiblePostLoginUrl(
  requestedPath: string | null | undefined,
  role: string | null | undefined,
  effectiveRoles?: string[],
): string {
  const canonicalUrl = getRoleDestinationUrl(role, effectiveRoles);
  if (!requestedPath) return canonicalUrl;

  // Legacy field-based learner portals are not active application routes.
  // Never route a successful login into a known dead /portal/* destination.
  if (requestedPath === '/portal' || requestedPath.startsWith('/portal/')) {
    return canonicalUrl;
  }

  try {
    const requestedUrl = new URL(absoluteRoleDestination(requestedPath));
    const canonical = new URL(canonicalUrl);

    // The Store is a trusted shared buyer surface, not a role-owned portal.
    // A validated sign-in may return any role to a Store route without granting
    // access to a different role's dashboard.
    if (
      requestedUrl.origin === STORE_ORIGIN &&
      (requestedUrl.pathname === '/store' || requestedUrl.pathname.startsWith('/store/'))
    ) {
      return requestedUrl.toString();
    }

    if (requestedUrl.origin !== canonical.origin) return canonicalUrl;

    const requestedPrefix = firstPathSegment(requestedUrl.pathname);
    const canonicalConfig = resolveRoleRoute(role, effectiveRoles);
    const canonicalPrefix = firstPathSegment(canonicalConfig.path);

    if (
      ROLE_OWNED_PREFIXES.has(requestedPrefix) &&
      requestedPrefix !== canonicalPrefix
    ) {
      return canonicalUrl;
    }

    return requestedUrl.toString();
  } catch {
    return canonicalUrl;
  }
}
