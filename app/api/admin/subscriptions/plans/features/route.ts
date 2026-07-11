import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("Supabase admin client: missing env vars");
    return null;
  }
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { plan_id, feature_id } = body;
  if (!plan_id || !feature_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { error } = await supabaseAdmin.from("plan_features").insert({ plan_id, feature_id });
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { plan_id, feature_id } = body;
  if (!plan_id || !feature_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { error } = await supabaseAdmin.from("plan_features").delete().eq("plan_id", plan_id).eq("feature_id", feature_id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}
