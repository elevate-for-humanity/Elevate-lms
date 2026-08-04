import { NextRequest, NextResponse } from 'next/server';
const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';
export async function GET(req: NextRequest) {
  const url = `${UNIFIED_APP}/api/admin/programs?${req.nextUrl.searchParams.toString()}`;
  const resp = await fetch(url, { 
    headers: { cookie: req.headers.get('cookie') || '' },
    credentials: 'include',
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
export async function POST(req: NextRequest) {
  const url = `${UNIFIED_APP}/api/admin/programs`;
  const body = await req.json();
  const resp = await fetch(url, { 
    method: 'POST',
    headers: { cookie: req.headers.get('cookie') || '', 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
