import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { getTenantContext, TenantContextError } from '@/lib/tenant';

export async function GET() {
  try {
    // STEP 4D: Get tenant context - enforces tenant isolation
    const tenantContext = await getTenantContext();
    
    const supabase = await createClient();

    // Get staff profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', tenantContext.userId)
      .single();

    if (!profile || profile.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get students in this tenant (RLS enforces tenant_id filtering)
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, last_sign_in_at')
      .eq('role', 'student')
      .eq('tenant_id', tenantContext.tenantId)
      .order('full_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }

    return NextResponse.json({ students: students || [] });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : String(error)) ||
          'Failed to fetch students',
      },
      { status: 500 }
    );
  }
}
