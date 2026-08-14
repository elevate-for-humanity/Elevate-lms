/**
 * GET /api/admin/site-health?url=<encoded-url>
 *
 * Server-side proxy for the dashboard Site Status panel.
 * The browser cannot HEAD external URLs directly due to CORS, so this
 * route does the check server-side and returns { ok, latencyMs }.
 *
 * Admin-only. Returns boolean flags only — never leaks error details.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Short timeout — this is a liveness check, not a full page load
export const maxDuration = 10;

// Allowlist — only check known Elevate domains
const ALLOWED_HOSTS = [
  PLATFORM_DEFAULTS.canonicalDomain,
  PLATFORM_DEFAULTS.canonicalDomain,
  'admin.elevateforhumanity.org',
  'lms.elevateforhumanity.org',
];

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) return safeError('url param required', 400);

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return safeError('Invalid URL', 400);
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return safeError('URL not in allowlist', 403);
  }

  const start = Date.now();
  try {
    const res = await fetch(parsed.toString(), {
      method: 'HEAD',
      redirect: 'manual', // don't follow redirects — a redirect IS reachable
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'ElevateAdmin/1.0 (site-health-check)' },
    });
    // 2xx = healthy, 3xx = reachable (auth redirect is expected for admin), 4xx/5xx = degraded
    const ok = res.status < 500;
    const degraded = res.status >= 400 && res.status < 500;
    return NextResponse.json({
      ok,
      degraded,
      status: res.status,
      latencyMs: Date.now() - start,
    });
  } catch {
    return NextResponse.json({ ok: false, degraded: false, status: 0, latencyMs: Date.now() - start });
  }
}
