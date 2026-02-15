import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { uploadComplianceEvidenceFile } from "@/lib/storage/complianceEvidence";
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
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

  const formData = await request.formData();
  const itemId = formData.get("itemId") as string | null;
  const file = formData.get("file") as File | null;

  if (!itemId || !file) {
    return NextResponse.json(
      { error: "itemId and file are required" },
      { status: 400 }
    );
  }

  // Validate item exists
  const { data: item } = await supabase
    .from("compliance_items")
    .select("id")
    .eq("id", itemId)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Upload file to Supabase storage
  const { fileUrl, fileName } = await uploadComplianceEvidenceFile(file, itemId);

  // Create evidence record
  const { data: evidence, error } = await supabase
    .from("compliance_evidence")
    .insert({
      item_id: itemId,
      file_url: fileUrl,
      file_name: fileName,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Log the upload
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "compliance_evidence_uploaded",
    resource_type: "compliance_evidence",
    resource_id: evidence.id,
    metadata: {
      itemId,
      fileName,
    },
  });

  return NextResponse.json({ evidence });
}
