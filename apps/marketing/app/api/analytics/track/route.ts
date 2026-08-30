// PUBLIC ROUTE: privacy-minimized first-party website traffic collection.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANALYTICS_OUTAGE_BASE_MS = 30_000;
const ANALYTICS_OUTAGE_MAX_MS = 15 * 60_000;
let analyticsFailures = 0;
let suppressWritesUntil = 0;

function clean(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  const path = clean(body.path, 1000);
  if (!path || !path.startsWith('/')) {
    return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 });
  }

  // Analytics is best-effort. During a Data API incident, do not let every
  // page load add another doomed database request while operational traffic is
  // trying to recover.
  if (Date.now() < suppressWritesUntil) {
    return NextResponse.json({ ok: true, recorded: false, deferred: true, degraded: true });
  }

  try {
    const db = await requireAdminClient();
    const { error } = await db.from('page_views').insert({
      path,
      page: clean(body.page, 1000) ?? path,
      session_id: clean(body.session_id, 100),
      referrer: clean(body.referrer, 1000),
      user_agent: clean(request.headers.get('user-agent'), 1000),
      utm_source: clean(body.utm_source, 255),
      utm_medium: clean(body.utm_medium, 255),
      utm_campaign: clean(body.utm_campaign, 255),
      landing_path: clean(body.landing_path, 1000),
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    analyticsFailures = 0;
    suppressWritesUntil = 0;
  } catch {
    analyticsFailures += 1;
    suppressWritesUntil =
      Date.now() +
      Math.min(
        ANALYTICS_OUTAGE_MAX_MS,
        ANALYTICS_OUTAGE_BASE_MS * 2 ** Math.min(analyticsFailures - 1, 5),
      );
    // Analytics must never break the public experience.
    return NextResponse.json({ ok: true, recorded: false, degraded: true });
  }

  return NextResponse.json({ ok: true, recorded: true });
}
