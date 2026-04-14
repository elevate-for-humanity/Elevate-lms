import { NextRequest, NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/admin/guards";
import { createClient } from "@/lib/supabase/server";
import { scanApproveStrict } from "@/lib/insurance/scan-approve-strict";

export const runtime = "nodejs";

// 10 MB max — COI PDFs are typically 1-3 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/admin/validate-coi
 *
 * Accepts multipart form with:
 *   file: PDF file (required)
 *   expectedBusinessName: string (optional)
 *   expectedShopAddress: string (optional)
 *   expectedCertificateHolder: string (optional — checked against ACORD holder section)
 *   workerRelationship: "w2_employees" | "1099_contractors_only" | "owner_only" | "not_sure" (optional)
 *   applicationId: UUID (optional — if provided, persists result to DB and auto-reads worker_relationship)
 *
 * Returns the strict APPROVED/REJECTED decision with full validation details.
 */
export async function POST(req: NextRequest) {
  const gate = await apiRequireAdmin(req);
  if (gate.error) return gate.error;

  const supabase = await createClient();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const expectedBusinessName =
    (form.get("expectedBusinessName") as string) || undefined;
  const expectedShopAddress =
    (form.get("expectedShopAddress") as string) || undefined;
  const expectedCertificateHolder =
    (form.get("expectedCertificateHolder") as string) || undefined;
  const workerRelationshipRaw = form.get("workerRelationship") as string | null;
  const applicationId =
    (form.get("applicationId") as string) || undefined;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "COI must be a PDF file" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  // Resolve worker relationship: explicit form value > DB lookup from application
  const validRelationships = ["w2_employees", "1099_contractors_only", "owner_only", "not_sure"] as const;
  type WorkerRel = typeof validRelationships[number];

  let workerRelationship: WorkerRel | undefined;
  if (workerRelationshipRaw && validRelationships.includes(workerRelationshipRaw as WorkerRel)) {
    workerRelationship = workerRelationshipRaw as WorkerRel;
  } else if (applicationId && supabase) {
    const { data: app } = await supabase
      .from("barbershop_partner_applications")
      .select("worker_relationship")
      .eq("id", applicationId)
      .maybeSingle();
    if (app?.worker_relationship && validRelationships.includes(app.worker_relationship)) {
      workerRelationship = app.worker_relationship as WorkerRel;
    }
  }

  const result = await scanApproveStrict({
    pdfBuffer,
    expectedBusinessName,
    expectedShopAddress,
    expectedCertificateHolder,
    workerRelationship,
  });

  // Persist to partner application if applicationId provided
  if (applicationId && supabase) {
    await supabase
      .from("barbershop_partner_applications")
      .update({
        insurance_status: result.decision === "APPROVED" ? "approved" : "rejected",
        insurance_validation_json: result,
        insurance_reason_codes: result.validation.reasonCodes,
        insurance_reviewed_at: new Date().toISOString(),
        insurance_review_method: result.method,
      })
      .eq("id", applicationId);
  }

  return NextResponse.json({ result }, { status: 200 });
}
