import pdf from "pdf-parse";
import { ocrPdfFirstPages } from "./ocr";
import {
  validateCoiText,
  type CoiTextValidationResult,
} from "./validate-coi-text";

export type StrictInsuranceDecision = {
  decision: "APPROVED" | "REJECTED";
  method: "PDF_TEXT" | "OCR" | "NONE";
  riskLevel: CoiTextValidationResult["riskLevel"];
  validation: CoiTextValidationResult;
};

const MIN_TEXT_FOR_VALIDATION = 100;
const MIN_TEXT_FOR_ANY_ANALYSIS = 50;

/**
 * End-to-end COI scan pipeline:
 * 1. Try pdf-parse (fast, digital PDFs)
 * 2. If insufficient text, OCR via pdftoppm + Tesseract (returns confidence)
 * 3. If OCR confidence below threshold, reject as unreadable
 * 4. Run strict validator — PASS/FAIL with risk level
 * 5. APPROVED only on PASS with zero missing items
 */
export async function scanApproveStrict(args: {
  pdfBuffer: Buffer;
  expectedBusinessName?: string;
  expectedShopAddress?: string;
  expectedCertificateHolder?: string;
  minGlPerOccurrence?: number;
  minGlAggregate?: number;
  minProLiabilityPerClaim?: number;
  /** Worker relationship type. Drives conditional WC gate. */
  workerRelationship?: "w2_employees" | "1099_contractors_only" | "owner_only" | "not_sure";
}): Promise<StrictInsuranceDecision> {
  let extractedText = "";
  let method: StrictInsuranceDecision["method"] = "PDF_TEXT";
  let ocrConfidence: number | undefined;

  // 1) Try native PDF text extraction
  try {
    const parsed = await pdf(args.pdfBuffer);
    extractedText = parsed.text || "";
  } catch {
    extractedText = "";
  }

  // 2) If not enough text, try OCR with confidence tracking
  if (extractedText.trim().length < MIN_TEXT_FOR_VALIDATION) {
    method = "OCR";
    const ocrResult = await ocrPdfFirstPages(args.pdfBuffer, 2);

    if (ocrResult.text.trim().length > extractedText.trim().length) {
      extractedText = ocrResult.text;
    }
    ocrConfidence = ocrResult.confidence;
  }

  // 3) Truly unreadable — reject with specific message
  if (extractedText.trim().length < MIN_TEXT_FOR_ANY_ANALYSIS) {
    method = "NONE";
    return {
      decision: "REJECTED",
      method,
      riskLevel: "HIGH_RISK",
      validation: {
        status: "FAIL",
        riskLevel: "HIGH_RISK",
        extractedTextChars: extractedText.length,
        missing: [
          "Document is not readable — upload a digital PDF (not a photo or scanned image)",
        ],
        reasonCodes: ["MISSING:UNREADABLE_DOCUMENT"],
        fields: {
          acordFormDetected: false,
          insurerName: null,
          policyNumberDetected: false,
          namedInsured: null,
          namedInsuredMatched: null,
          glDetected: false,
          glPerOccurrence: null,
          glAggregate: null,
          proLiabilityDetected: false,
          proLiabilityType: null,
          workersCompDetected: false,
          workersCompVerified: false,
          workersCompRequired: args.workerRelationship === "w2_employees" || args.workerRelationship === "not_sure",
          relevantBusinessClassDetected: false,
          detectedBusinessClass: null,
          effectiveDate: null,
          expirationDate: null,
          effectiveDateFuture: null,
          expired: null,
          addressMatched: null,
          certificateHolderDetected: false,
          certificateHolderMatched: null,
          additionalInsuredDetected: false,
          ocrConfidence: ocrConfidence ?? null,
          ocrConfidenceSufficient: false,
        },
      },
    };
  }

  // 4) Run strict validator with OCR confidence
  const validation = validateCoiText({
    extractedText,
    expectedBusinessName: args.expectedBusinessName,
    expectedShopAddress: args.expectedShopAddress,
    expectedCertificateHolder: args.expectedCertificateHolder,
    minGlPerOccurrence: args.minGlPerOccurrence,
    minGlAggregate: args.minGlAggregate,
    minProLiabilityPerClaim: args.minProLiabilityPerClaim,
    ocrConfidence,
    workerRelationship: args.workerRelationship,
  });

  return {
    decision: validation.status === "PASS" ? "APPROVED" : "REJECTED",
    method,
    riskLevel: validation.riskLevel,
    validation,
  };
}
