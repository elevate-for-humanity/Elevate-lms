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
  const { data: features, error } = await supabaseAdmin.from("subscription_features").select("*").order("name");
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ features: features || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const { code, name, description } = body;
  if (!code || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { data: feature, error } = await supabaseAdmin
    .from("subscription_features").insert({ code, name, description }).select().single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ feature }, { status: 201 });
}
