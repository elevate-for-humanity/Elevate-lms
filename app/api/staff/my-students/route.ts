import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantContext, TenantContextError } from '@/lib/tenant';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // STEP 4D: Get tenant context - enforces tenant isolation
    const tenantContext = await getTenantContext();
    
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get staff profile
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', tenantContext.userId)
      .single();

    if (!profile || profile.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get students in this tenant (RLS enforces tenant_id filtering)
    const { data: students, error } = await db
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
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/staff/my-students', _GET);
