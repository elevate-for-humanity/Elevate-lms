import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { toErrorMessage } from '@/lib/safe';
import { getTenantContext, TenantContextError } from '@/lib/tenant';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // STEP 4D: Get tenant context - enforces tenant isolation
    const tenantContext = await getTenantContext();
    const supabase = await createClient();

    // Check if user is partner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", tenantContext.userId)
      .single();

    if (profile?.role !== "partner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get enrollments for this tenant (RLS also enforces this)
    const { data: enrollments, error } = await supabase
      .from("program_enrollments")
      .select(`
        id,
        user_id,
        course_id,
        status,
        profiles!enrollments_user_id_fkey(full_name, email),
        courses(title)
      `)
      .eq("tenant_id", tenantContext.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ enrollments });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: error.statusCode });
    }
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/partner/enrollments', _GET);
