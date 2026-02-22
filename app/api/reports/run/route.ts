export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/reports/run/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, tenantId } = await request.json();

  if (type === "enrollments_by_program") {
    const query = db
      .from("enrollments")
      .select("program_id, count")
      .order("count", { ascending: false });

    if (tenantId) {
      query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ rows: data });
  }

  if (type === "completions_by_month") {
    const { data, error }: any = await supabase.rpc("get_completions_by_month", {
      p_tenant_id: tenantId || null,
    });

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ rows: data });
  }

  if (type === "user_activity") {
    const { data, error }: any = await db
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        last_sign_in_at,
        enrollments:enrollments(count)
      `
      )
      .order("last_sign_in_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ rows: data });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
