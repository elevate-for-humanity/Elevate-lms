import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";
import { safeError, safeDbError } from "@/lib/api/safe-error";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: features, error } = await db.from("subscription_features").select("*").order("name");
  if (error) return safeDbError(error, "Failed to fetch features");
  return NextResponse.json({ features: features || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { code, name, description } = body;
  if (!code || !name) return safeError("Missing required fields: code, name", 400);
  const { data: feature, error } = await db
    .from("subscription_features").insert({ code, name, description }).select().single();
  if (error) return safeDbError(error, "Failed to create feature");
  return NextResponse.json({ feature }, { status: 201 });
}
