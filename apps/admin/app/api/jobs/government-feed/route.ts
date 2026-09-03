import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';

async function proxyGovernmentFeed(req: NextRequest, method: 'GET' | 'POST') {
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

    if (method === 'POST') {
      init.body = JSON.stringify(await req.json());
    }

    const resp = await fetch(url, init);
    const contentType = resp.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await resp.json()
      : { error: await resp.text() };

    // A missing external job-feed integration should degrade the panel, not
    // crash the Admin dashboard or trigger repeated HTTP 500 console errors.
    if (!resp.ok) {
      return NextResponse.json(
        {
          jobs: [],
          count: 0,
          configured: false,
          status: 'needs_setup',
          upstreamStatus: resp.status,
          message: data?.error || data?.message || 'Government job feed is not configured.',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        jobs: [],
        count: 0,
        configured: false,
        status: 'needs_setup',
        message: error instanceof Error ? error.message : 'Government job feed is unavailable.',
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
