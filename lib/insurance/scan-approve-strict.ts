import { ocrPdfFirstPages } from './ocr';
import { validateCoiText, type CoiTextValidationResult } from './validate-coi-text';

export type StrictInsuranceDecision = {
  decision: 'APPROVED' | 'REJECTED';
  method: 'PDF_TEXT' | 'OCR' | 'NONE';
  riskLevel: CoiTextValidationResult['riskLevel'];
  validation: CoiTextValidationResult;
};

const MIN_TEXT_FOR_VALIDATION = 100;
const MIN_TEXT_FOR_ANY_ANALYSIS = 50;
const MIN_OCR_CONFIDENCE = 40;

export async function scanApproveStrict(args: {
  pdfBuffer: Buffer;
  expectedBusinessName?: string;
  expectedShopAddress?: string;
  expectedCertificateHolder?: string;
  minGlPerOccurrence?: number;
  minGlAggregate?: number;
  minProLiabilityPerClaim?: number;
  workerRelationship?: 'w2_employees' | '1099_contractors_only' | 'owner_only' | 'not_sure';
}): Promise<StrictInsuranceDecision> {
  let extractedText = '';
  let method: StrictInsuranceDecision['method'] = 'PDF_TEXT';
  let ocrConfidence: number | undefined;

  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: args.pdfBuffer });
    try {
      const parsed = await parser.getText();
      extractedText = parsed.text || '';
    } finally {
      await parser.destroy();
    }
  } catch {
    extractedText = '';
  }

  if (extractedText.trim().length < MIN_TEXT_FOR_VALIDATION) {
    method = 'OCR';
    const ocrResult = await ocrPdfFirstPages(args.pdfBuffer, 2);

    if (ocrResult.text.trim().length > extractedText.trim().length) {
      extractedText = ocrResult.text;
    }
    ocrConfidence = ocrResult.confidence;
  }

  if (extractedText.trim().length < MIN_TEXT_FOR_ANY_ANALYSIS) {
    method = 'NONE';
    return {
      decision: 'REJECTED',
      method,
      riskLevel: 'HIGH_RISK',
      validation: {
        status: 'FAIL',
        riskLevel: 'HIGH_RISK',
        extractedTextChars: extractedText.length,
        missing: ['Document is not readable — upload a digital PDF (not a photo or scanned image)'],
        reasonCodes: ['MISSING:UNREADABLE_DOCUMENT'],
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
          workersCompRequired:
            args.workerRelationship === 'w2_employees' || args.workerRelationship === 'not_sure',
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

  const validation = validateCoiText({
    extractedText,
    expectedBusinessName: args.expectedBusinessName,
    expectedShopAddress: args.expectedShopAddress,
    expectedCertificateHolder: args.expectedCertificateHolder,
    minGlPerOccurrence: args.minGlPerOccurrence,
    minGlAggregate: args.minGlAggregate,
    minProLiabilityPerClaim: args.minProLiabilityPerClaim,
    minOcrConfidence: MIN_OCR_CONFIDENCE,
    ocrConfidence,
    workerRelationship: args.workerRelationship,
  });

  return {
    decision: validation.status === 'PASS' ? 'APPROVED' : 'REJECTED',
    method,
    riskLevel: validation.riskLevel,
    validation,
  };
}
