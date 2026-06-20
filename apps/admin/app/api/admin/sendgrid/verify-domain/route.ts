// Admin-only: check SendGrid domain authentication status
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  try {
    await requireRole(['admin', 'super_admin']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: 'SENDGRID_API_KEY not configured' }, { status: 503 });
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `SendGrid API error: ${res.status}` }, { status: 502 });
    }

    const domains: any[] = await res.json();
    const match = domains.find(
      (d: any) =>
        d.domain === PLATFORM_DEFAULTS.canonicalDomain ||
        d.subdomain?.endsWith(PLATFORM_DEFAULTS.canonicalDomain),
    );

    if (!match) {
      return NextResponse.json({
        ok: false,
        message: `Domain ${PLATFORM_DEFAULTS.canonicalDomain} not found in SendGrid. Add it under Settings → Sender Authentication.`,
      });
    }

    if (match.valid) {
      return NextResponse.json({
        ok: true,
        message: `Domain ${PLATFORM_DEFAULTS.canonicalDomain} is fully verified in SendGrid.`,
        domain: match,
      });
    }

    // Check which DNS records are missing
    const missing = Object.entries(match.dns ?? {})
      .filter(([, v]: any) => v.valid === false)
      .map(([k]: any) => k);

    return NextResponse.json({
      ok: false,
      message: `Domain not yet verified. Missing DNS records: ${missing.join(', ') || 'unknown'}. Add them in your registrar and try again.`,
      domain: match,
    });
  } catch (err) {
    return safeInternalError(err, 'SendGrid domain check failed');
  }
}
