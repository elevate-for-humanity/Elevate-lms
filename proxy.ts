import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  const { pathname } = request.nextUrl;
  
  // Basic trace ID propagation
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Standard Next.js 15 stability fix: 
  // Simply return Next() without complex header cloning if not needed.
  return NextResponse.next();
}
