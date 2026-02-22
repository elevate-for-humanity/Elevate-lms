import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
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

  const { type, title, body, createdForOrg } = await request.json();

  if (!type || !title || !body) {
    return NextResponse.json(
      { error: "type, title, and body are required" },
      { status: 400 }
    );
  }

  const { data: doc, error } = await db
    .from("signature_documents")
    .insert({
      type,
      title,
      body,
      created_for_org: createdForOrg || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Log document creation
  await db.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "signature_document_created",
    resource_type: "signature_document",
    resource_id: doc.id,
    metadata: { type, title, createdForOrg },
  });

  return NextResponse.json({
    document: doc,
    signUrl: `/sign/${doc.id}`,
  });
}
