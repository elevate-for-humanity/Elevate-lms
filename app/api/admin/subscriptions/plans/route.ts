import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = await getAdminClient();
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: plans, error } = await supabaseAdmin.from("subscription_plans").select("*").order("sort_order");
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ plans: plans || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = await getAdminClient();
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { name, slug, monthly_price } = body;
  if (!name || !slug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { data: plan, error } = await supabaseAdmin
    .from("subscription_plans").insert({ name, slug, monthly_price }).select().single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ plan }, { status: 201 });
}
