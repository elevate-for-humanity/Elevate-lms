import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { getTenantContext, TenantContextError } from '@/lib/tenant';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // STEP 4D: Get tenant context - enforces tenant isolation
    const tenantContext = await getTenantContext();
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check if user is partner
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", tenantContext.userId)
      .single();

    if (profile?.role !== "partner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get enrollments for this tenant (RLS also enforces this)
    const { data: enrollments, error } = await db
      .from("enrollments")
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
