import { siteUrls } from '@/lib/utils/site-urls';
import { absoluteRoleDestination } from '@/lib/auth/absolute-role-destination';
import {
  ROLE_ROUTE_CONFIG,
  getRoleDestinationUrl,
} from '@/lib/auth/role-destinations';

function firstPathSegment(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment ? `/${segment}` : '/';
}

const STORE_ORIGIN = 'https://store.elevateforhumanity.org';
const CLEANING_ACCOUNT_PATHS = new Set([
  '/sites/2exclusive-platinum-cleaning/provider',
  '/sites/2exclusive-platinum-cleaning/book-cleaning',
]);

/** Shared routes enforce their own verified identity, ownership and eligibility. */
export function isSharedPostLoginDestination(destination: string): boolean {
  try {
    const url = new URL(destination);
    return (
      (url.origin === new URL(siteUrls.lms).origin &&
        url.pathname === '/programs/hvac-technician/course') ||
      (url.origin === STORE_ORIGIN &&
        (url.pathname === '/store' || url.pathname.startsWith('/store/'))) ||
      (url.origin === new URL(siteUrls.site).origin &&
        (url.pathname === '/apps/website-builder' ||
          url.pathname.startsWith('/apps/website-builder/') ||
          CLEANING_ACCOUNT_PATHS.has(url.pathname)))
    );
  } catch {
    return false;
  }
}

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

    // Shared account routes are not role-owned portals. Returning a verified
    // account to one of these exact surfaces grants no operating role or
    // access to another role's dashboard.
    if (isSharedPostLoginDestination(requestedUrl.toString())) {
      return requestedUrl.toString();
    }

    const requestedPrefix = firstPathSegment(requestedUrl.pathname);
    const roles = effectiveRoles?.length ? effectiveRoles : [role];

    // Role-owned routes may only be resumed for a verified primary or
    // secondary role, on that portal's deployed host. This is essential for
    // employees who also have learner access: a requested /employer/dashboard
    // must not turn into /lms/dashboard merely because "student" is present.
    if (ROLE_OWNED_PREFIXES.has(requestedPrefix)) {
      const authorized = roles.some((value) => {
        const config = value ? ROLE_ROUTE_CONFIG[value] : undefined;
        if (!config || firstPathSegment(config.path) !== requestedPrefix) return false;
        const roleUrl = new URL(getRoleDestinationUrl(value));
        return requestedUrl.origin === roleUrl.origin;
      });
      return authorized ? requestedUrl.toString() : canonicalUrl;
    }

    // Non-portal paths remain on the selected role's own host. Never send an
    // arbitrary cross-origin URL just because its hostname is trusted.
    if (requestedUrl.origin !== canonical.origin) return canonicalUrl;
    return requestedUrl.toString();
  } catch {
    return canonicalUrl;
  }
}
