import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";
import { safeError, safeDbError } from "@/lib/api/safe-error";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: plans, error } = await db.from("subscription_plans").select("*").order("sort_order");
  if (error) return safeDbError(error, "Failed to fetch plans");
  return NextResponse.json({ plans: plans || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json();
  const { name, slug, monthly_price } = body;
  if (!name || !slug) return safeError("Missing required fields: name, slug", 400);
  const { data: plan, error } = await db
    .from("subscription_plans").insert({ name, slug, monthly_price }).select().single();
  if (error) return safeDbError(error, "Failed to create plan");
  return NextResponse.json({ plan }, { status: 201 });
}
