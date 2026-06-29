import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const CANONICAL_ADMIN_HOST = 'admin.elevateforhumanity.org';

function resolveCanonicalAdminHost(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).host.toLowerCase();
    } catch { /* ignore */ }
  }
  return CANONICAL_ADMIN_HOST;
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const hostWithoutPort = host.split(':')[0];
  const { pathname } = request.nextUrl;
  const canonicalAdminHost = resolveCanonicalAdminHost();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Standard stability fix: avoid complex clones
  return NextResponse.next();
}
