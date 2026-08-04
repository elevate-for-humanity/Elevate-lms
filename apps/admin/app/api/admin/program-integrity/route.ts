import { NextRequest, NextResponse } from 'next/server';
const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';
export async function GET(req: NextRequest) {
  const url = `${UNIFIED_APP}/api/admin/program-integrity?${req.nextUrl.searchParams.toString()}`;
  const resp = await fetch(url, { 
    headers: { cookie: req.headers.get('cookie') || '' },
    credentials: 'include',
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
