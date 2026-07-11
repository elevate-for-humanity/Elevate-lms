import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";
import { safeError, safeDbError } from "@/lib/api/safe-error";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { plan_id, feature_id } = body;
  if (!plan_id || !feature_id) return safeError("Missing required fields: plan_id, feature_id", 400);
  const { error } = await db.from("plan_features").insert({ plan_id, feature_id });
  if (error) return safeDbError(error, "Failed to add feature to plan");
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { plan_id, feature_id } = body;
  if (!plan_id || !feature_id) return safeError("Missing required fields: plan_id, feature_id", 400);
  const { error } = await db.from("plan_features").delete().eq("plan_id", plan_id).eq("feature_id", feature_id);
  if (error) return safeDbError(error, "Failed to remove feature from plan");
  return NextResponse.json({ success: true });
}
