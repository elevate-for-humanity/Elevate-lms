import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_ORIGIN =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  'https://admin.elevateforhumanity.org';

const TARGET_PATH = '/api/surveys/workone/submit';

function buildTargetUrl(request: NextRequest): URL {
  const target = new URL(TARGET_PATH, ADMIN_ORIGIN);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target;
}

async function proxyRequest(
  request: NextRequest,
  method: 'GET' | 'POST',
): Promise<NextResponse> {
  try {
    const targetUrl = buildTargetUrl(request);

    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    const authorization = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    if (contentType) headers.set('content-type', contentType);
    if (authorization) headers.set('authorization', authorization);
    if (cookie) headers.set('cookie', cookie);
    headers.set('x-forwarded-host', request.headers.get('host') ?? 'www.elevateforhumanity.org');

    const requestInit: RequestInit = {
      method,
      headers,
      cache: 'no-store',
      redirect: 'manual',
    };
    if (method === 'POST') {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) requestInit.body = body;
    }

    const response = await fetch(targetUrl, requestInit);

    const responseHeaders = new Headers();
    const respContentType = response.headers.get('content-type');
    if (respContentType) responseHeaders.set('content-type', respContentType);
    responseHeaders.set('cache-control', 'no-store, no-cache, must-revalidate');
    responseHeaders.set('x-elevate-proxy-target', 'admin-workone-survey');

    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[workone-survey-proxy] Request failed', error);
    return NextResponse.json(
      { ok: false, error: 'The WorkOne survey service is temporarily unavailable.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return proxyRequest(request, 'POST');
}
