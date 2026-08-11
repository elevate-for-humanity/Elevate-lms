import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';

export const POST = withAuth(async (request: NextRequest) => {
  const form = await request.formData();
  const response = await fetch(`${UNIFIED_APP}/api/admin/courses/generate/parse`, {
    method: 'POST',
    headers: { cookie: request.headers.get('cookie') || '' },
    credentials: 'include',
    body: form,
    cache: 'no-store',
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
}, { roles: API_ADMIN_ROLES });
