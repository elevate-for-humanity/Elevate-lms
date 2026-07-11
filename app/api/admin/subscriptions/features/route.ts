import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = await getAdminClient();
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: features, error } = await supabaseAdmin.from("subscription_features").select("*").order("name");
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ features: features || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const supabaseAdmin = await getAdminClient();
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { code, name, description } = body;
  if (!code || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { data: feature, error } = await supabaseAdmin
    .from("subscription_features").insert({ code, name, description }).select().single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ feature }, { status: 201 });
}
