import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getTenantContext, TenantContextError } from '@/lib/tenant';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { isStaffPortalApiAuth, requireStaffPortalApi } from '@/lib/api/staff-portal-guard';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireStaffPortalApi();
    if (!isStaffPortalApiAuth(auth)) return auth;

    // Tenant context — enforces tenant isolation for student list
    const tenantContext = await getTenantContext();
    const supabase = await createClient();

    // Get students in this tenant (RLS enforces tenant_id filtering)
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, last_sign_in_at')
      .eq('role', 'student')
      .eq('tenant_id', tenantContext.tenantId)
      .order('full_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ students: students || [] });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: error.statusCode });
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const GET = withApiAudit('/api/staff/my-students', _GET);
