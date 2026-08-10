import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';

async function proxyGovernmentFeed(req: NextRequest, method: 'GET' | 'POST') {
  const user = await apiRequireAdmin(req);
  if (user.error) return user.error;

  const url = `${UNIFIED_APP}/api/jobs/government-feed`;

  try {
    const init: RequestInit = {
      method,
      headers: {
        cookie: req.headers.get('cookie') || '',
        accept: 'application/json',
        ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    };

    if (method === 'POST') init.body = JSON.stringify(await req.json());

    const resp = await fetch(url, init);
    const contentType = resp.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await resp.json()
      : { error: 'Government job feed returned a non-JSON response.' };

    // A missing external integration should degrade the Admin panel without
    // exposing upstream exception text or generating a dashboard-wide 500.
    if (!resp.ok) {
      return NextResponse.json(
        {
          jobs: [],
          count: 0,
          configured: false,
          status: 'needs_setup',
          upstreamStatus: resp.status,
          message: 'Government job feed is not configured or temporarily unavailable.',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        jobs: [],
        count: 0,
        configured: false,
        status: 'needs_setup',
        message: 'Government job feed is temporarily unavailable.',
      },
      { status: 200 },
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyGovernmentFeed(req, 'GET');
}

export async function POST(req: NextRequest) {
  return proxyGovernmentFeed(req, 'POST');
}
