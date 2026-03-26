import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: items, error } = await supabase
    .from("compliance_items")
    .select(`
      *,
      compliance_evidence(*)
    `)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ items });
}

async function _PATCH(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("compliance_items")
    .update({
      status,
      updated_at: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Log the compliance update
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "compliance_item_updated",
    resource_type: "compliance_item",
    resource_id: id,
    metadata: { status },
  });

  return NextResponse.json({ ok: true });
}
export const GET = withApiAudit('/api/compliance/items', _GET, { critical: true });
export const PATCH = withApiAudit('/api/compliance/items', _PATCH, { critical: true });
