import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const { id } = await params;
  const supabase = await createClient();

  // Auth required — must be logged in to sign
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { signerName, signerEmail, role } = await request.json();

  // Enforce that the signer email matches the authenticated user
  if (signerEmail && signerEmail.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Signer email must match your account email' }, { status: 403 });
  }

  if (!signerName || !signerEmail) {
    return NextResponse.json(
      { error: "signerName and signerEmail are required" },
      { status: 400 }
    );
  }

  // Verify document exists
  const { data: doc } = await supabase
    .from("signature_documents")
    .select("id, title, type")
    .eq("id", id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get IP address from headers
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    null;

  // Create signature
  const { data: signature, error } = await supabase
    .from("signatures")
    .insert({
      document_id: doc.id,
      signer_name: signerName,
      signer_email: signerEmail,
      role: role || null,
      ip_address: ip,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Log the signature
  await supabase.from("audit_logs").insert({
    actor_id: null,
    actor_email: signerEmail,
    action: "document_signed",
    resource_type: "signature",
    resource_id: signature.id,
    metadata: {
      documentId: doc.id,
      title: doc.title,
      type: doc.type,
      signerName,
      signerEmail,
    },
  });

  return NextResponse.json({ signature });
}
export const POST = withApiAudit('/api/signature/documents/[id]/sign', _POST);
