import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const { id } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { signerName, signerEmail, role } = await request.json();

  if (!signerName || !signerEmail) {
    return NextResponse.json(
      { error: "signerName and signerEmail are required" },
      { status: 400 }
    );
  }

  // Verify document exists
  const { data: doc } = await db
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
  const { data: signature, error } = await db
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
  await db.from("audit_logs").insert({
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
