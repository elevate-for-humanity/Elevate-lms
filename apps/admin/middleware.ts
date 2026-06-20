import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { buildLoginUrl, buildReturnPath } from '@/lib/auth/validate-redirect';

const CANONICAL_ADMIN_HOST = 'admin.elevateforhumanity.org';

/** Canonical admin hostname for redirects. */
function resolveCanonicalAdminHost(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).host.toLowerCase();
    } catch {
      /* fall through */
    }
  }
  return CANONICAL_ADMIN_HOST;
}

// Paths that never require auth
const PUBLIC_PATHS = [
  '/login',
  '/unauthorized',
  '/api/health',
  '/api/ping',
  // Password reset flow - Supabase redirects here with a code before a session exists
  '/auth/confirm',
  '/auth/reset-password',
];

// Derive cookie name from the Supabase URL env var so it survives project migration.
// Format: sb-<project-ref>-auth-token  e.g. sb-cuxzzpsyufcewtmicszk-auth-token
function getSessionCookieName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const match = url.match(/https?:\/\/([^.]+)\./);
  if (match?.[1]) return `sb-${match[1]}-auth-token`;
  // Fallback: hardcoded ref - update if project is migrated
  return 'sb-cuxzzpsyufcewtmicszk-auth-token';
}
const SESSION_COOKIE = getSessionCookieName();

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  const canonicalAdminHost = resolveCanonicalAdminHost();
  const isLocalHost =
    host === 'localhost' || host === '127.0.0.1' || host === '::1';

  // Always allow health checks, public auth paths, Next.js internals, and static files
  // before canonical-host redirects so platform health probes can receive 200s.
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Misrouted www/apex -> canonical admin host.
  if (
    host &&
    host !== canonicalAdminHost &&
    !(process.env.NODE_ENV === 'development' && isLocalHost)
  ) {
    const adminBase = (
      process.env.NEXT_PUBLIC_ADMIN_URL || `https://${CANONICAL_ADMIN_HOST}`
    ).replace(/\/+$/, '');
    return NextResponse.redirect(`${adminBase}${pathname}${search}`, { status: 301 });
  }

  // Only gate protected namespaces.
  const isProtected =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/staff') ||
    pathname.startsWith('/api/devstudio') ||
    pathname.startsWith('/api/platform');

  if (!isProtected) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // Edge middleware: env-only IP allowlist (no DB - avoids Supabase in middleware bundle).
  // IP whitelist bypasses session requirement (Northflank platform handles auth).
  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked; // Block non-whitelisted IPs

  // For whitelisted IPs (e.g., Northflank), allow access without session cookie
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
