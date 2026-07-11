import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: plans, error } = await supabaseAdmin
    .from("subscription_plans").select("*").order("sort_order");
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ plans: plans || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const { name, slug, monthly_price } = body;
  if (!name || !slug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { data: plan, error } = await supabaseAdmin
    .from("subscription_plans").insert({ name, slug, monthly_price }).select().single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ plan }, { status: 201 });
}
