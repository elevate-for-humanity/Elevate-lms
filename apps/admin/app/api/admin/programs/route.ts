import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';

const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';

export const GET = withAuth(async (req: NextRequest) => {
  const url = `${UNIFIED_APP}/api/admin/programs?${req.nextUrl.searchParams.toString()}`;
  const resp = await fetch(url, {
    headers: { cookie: req.headers.get('cookie') || '' },
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}, { roles: API_ADMIN_ROLES });

export const POST = withAuth(async (req: NextRequest) => {
  const url = `${UNIFIED_APP}/api/admin/programs`;
  const body = await req.json();
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      cookie: req.headers.get('cookie') || '',
      'content-type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}, { roles: API_ADMIN_ROLES });
