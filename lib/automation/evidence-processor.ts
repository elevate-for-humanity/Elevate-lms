/**
 * Evidence Processor
 * 
 * Automated document processing pipeline that:
 * 1. Classifies uploaded documents
 * 2. Extracts data via OCR
 * 3. Validates against rulesets
 * 4. Auto-approves when safe OR routes to human review
 * 
 * GUARDRAILS:
 * - Minimum OCR confidence thresholds per document type
 * - Required fields must be present
 * - Out-of-state transcripts NEVER auto-approved without explicit ruleset
 * - Unknown document types route to review
 * - All decisions logged to automated_decisions table
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { extractTextFromImage, autoExtract, OCRResult } from '@/lib/ocr/tesseract-ocr';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export type DocumentType = 
  | 'transcript'
  | 'license'
  | 'id'
  | 'mou'
  | 'insurance'
  | 'w2'
  | '1099'
  | 'certification'
  | 'unknown';

export type DecisionOutcome = 
  | 'auto_approved'
  | 'routed_to_review'
  | 'auto_rejected';

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  documentType: DocumentType;
  outcome: DecisionOutcome;
  confidence: number;
  extractedData: Record<string, unknown>;
  failedRules: string[];
  decisionId?: string;
  reviewQueueId?: string;
  error?: string;
}

export interface DocumentRuleset {
  documentType: DocumentType;
  version: string;
  minConfidence: number;
  requiredFields: string[];
  validationRules: ValidationRule[];
  autoApproveThreshold: number;
  allowedStates?: string[]; // For state-specific documents
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (data: Record<string, unknown>, context: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  documentType: DocumentType;
  state?: string;
  programId?: string;
  userId?: string;
}

export interface ValidationResult {
  passed: boolean;
  reason?: string;
  severity: 'error' | 'warning';
}

// ============================================
// RULESETS
// ============================================

const RULESET_VERSION = '1.0.0';

// Minimum OCR confidence by document type
const MIN_CONFIDENCE: Record<DocumentType, number> = {
  transcript: 0.85,
  license: 0.80,
  id: 0.80,
  mou: 0.75,
  insurance: 0.80,
  w2: 0.85,
  '1099': 0.85,
  certification: 0.80,
  unknown: 1.0, // Never auto-approve unknown
};

// Required fields by document type
const REQUIRED_FIELDS: Record<DocumentType, string[]> = {
  transcript: ['school_name', 'student_name', 'hours_completed', 'completion_date'],
  license: ['license_number', 'holder_name', 'expiration_date', 'state'],
  id: ['name', 'id_number', 'expiration_date'],
  mou: ['partner_name', 'signature_date', 'effective_date'],
  insurance: ['policy_number', 'coverage_amount', 'expiration_date'],
  w2: ['employer', 'wages', 'ssn'],
  '1099': ['payer', 'amount', 'ssn'],
  certification: ['certification_name', 'holder_name', 'issue_date'],
  unknown: [],
};

// States with explicit transcript rulesets (auto-approval allowed)
const STATES_WITH_TRANSCRIPT_RULES = new Set([
  'IN', // Indiana
  'IL', // Illinois
  'OH', // Ohio
  'MI', // Michigan
  'KY', // Kentucky
]);

// ============================================
// VALIDATION RULES
// ============================================

const TRANSCRIPT_RULES: ValidationRule[] = [
  {
    id: 'transcript_hours_positive',
    name: 'Hours must be positive',
    description: 'Completed hours must be greater than 0',
    validate: (data) => ({
      passed: typeof data.hours_completed === 'number' && data.hours_completed > 0,
      reason: 'Hours completed must be a positive number',
      severity: 'error',
    }),
  },
  {
    id: 'transcript_hours_reasonable',
    name: 'Hours must be reasonable',
    description: 'Hours should not exceed 3000 (typical max for apprenticeship)',
    validate: (data) => ({
      passed: typeof data.hours_completed === 'number' && data.hours_completed <= 3000,
      reason: 'Hours exceed maximum reasonable value (3000)',
      severity: 'warning',
    }),
  },
  {
    id: 'transcript_date_not_future',
    name: 'Completion date not in future',
    description: 'Completion date cannot be in the future',
    validate: (data) => {
      if (!data.completion_date) return { passed: false, reason: 'Missing completion date', severity: 'error' };
      const date = new Date(data.completion_date as string);
      return {
        passed: date <= new Date(),
        reason: 'Completion date is in the future',
        severity: 'error',
      };
    },
  },
  {
    id: 'transcript_in_state',
    name: 'In-state transcript',
    description: 'Transcript must be from a state with explicit ruleset for auto-approval',
    validate: (data, context) => {
      const state = (data.state as string)?.toUpperCase() || context.state?.toUpperCase();
      return {
        passed: !!state && STATES_WITH_TRANSCRIPT_RULES.has(state),
        reason: `Out-of-state transcript (${state || 'unknown'}) requires manual review`,
        severity: 'error',
      };
    },
  },
];

const LICENSE_RULES: ValidationRule[] = [
  {
    id: 'license_not_expired',
    name: 'License not expired',
    description: 'License expiration date must be in the future',
    validate: (data) => {
      if (!data.expiration_date) return { passed: false, reason: 'Missing expiration date', severity: 'error' };
      const expDate = new Date(data.expiration_date as string);
      return {
        passed: expDate > new Date(),
        reason: 'License is expired',
        severity: 'error',
      };
    },
  },
  {
    id: 'license_number_format',
    name: 'Valid license number',
    description: 'License number must be present and non-empty',
    validate: (data) => ({
      passed: typeof data.license_number === 'string' && data.license_number.length >= 4,
      reason: 'Invalid or missing license number',
      severity: 'error',
    }),
  },
];

const MOU_RULES: ValidationRule[] = [
  {
    id: 'mou_signed',
    name: 'MOU is signed',
    description: 'MOU must have a signature date',
    validate: (data) => ({
      passed: !!data.signature_date,
      reason: 'MOU signature date missing',
      severity: 'error',
    }),
  },
  {
    id: 'mou_effective',
    name: 'MOU is effective',
    description: 'MOU effective date must be today or earlier',
    validate: (data) => {
      if (!data.effective_date) return { passed: false, reason: 'Missing effective date', severity: 'error' };
      const effDate = new Date(data.effective_date as string);
      return {
        passed: effDate <= new Date(),
        reason: 'MOU not yet effective',
        severity: 'error',
      };
    },
  },
];

// Map document types to their rulesets
const RULESETS: Record<DocumentType, ValidationRule[]> = {
  transcript: TRANSCRIPT_RULES,
  license: LICENSE_RULES,
  mou: MOU_RULES,
  id: [],
  insurance: [],
  w2: [],
  '1099': [],
  certification: [],
  unknown: [],
};

// ============================================
// CORE PROCESSING FUNCTIONS
// ============================================

/**
 * Process a document through the automation pipeline.
 * Called automatically when a document upload completes.
 */
export async function processDocument(
  documentId: string,
  fileUrl: string,
  declaredType?: DocumentType,
  context?: ValidationContext
): Promise<ProcessingResult> {
  const supabase = createAdminClient();
  const startTime = Date.now();

  try {
    // Step 1: Fetch file and run OCR
    logger.info('[EvidenceProcessor] Starting document processing', { documentId, declaredType });
    
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const ocrResult = await autoExtract(buffer);
    
    const confidence = ocrResult.confidence;
    const extractedData = ocrResult.data || {};
    const detectedType = (ocrResult.documentType as DocumentType) || declaredType || 'unknown';
    
    logger.info('[EvidenceProcessor] OCR complete', { 
      documentId, 
      detectedType, 
      confidence,
      extractedFields: Object.keys(extractedData),
    });

    // Step 2: Check confidence threshold
    const minConfidence = MIN_CONFIDENCE[detectedType];
    if (confidence < minConfidence) {
      return await routeToReview(supabase, documentId, detectedType, extractedData, confidence, [
        `OCR confidence (${(confidence * 100).toFixed(1)}%) below threshold (${(minConfidence * 100).toFixed(1)}%)`,
      ], context, startTime);
    }

    // Step 3: Check required fields
    const requiredFields = REQUIRED_FIELDS[detectedType];
    const missingFields = requiredFields.filter(field => !extractedData[field]);
    if (missingFields.length > 0) {
      return await routeToReview(supabase, documentId, detectedType, extractedData, confidence, [
        `Missing required fields: ${missingFields.join(', ')}`,
      ], context, startTime);
    }

    // Step 4: Run validation rules
    const rules = RULESETS[detectedType];
    const failedRules: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const result = rule.validate(extractedData, context || { documentType: detectedType });
      if (!result.passed) {
        if (result.severity === 'error') {
          failedRules.push(`${rule.name}: ${result.reason}`);
        } else {
          warnings.push(`${rule.name}: ${result.reason}`);
        }
      }
    }

    // Step 5: Determine outcome
    if (failedRules.length > 0) {
      return await routeToReview(supabase, documentId, detectedType, extractedData, confidence, failedRules, context, startTime);
    }

    // Step 6: Auto-approve
    return await autoApprove(supabase, documentId, detectedType, extractedData, confidence, warnings, context, startTime);

  } catch (error) {
    logger.error('[EvidenceProcessor] Processing failed', { documentId, error });
    
    // On error, route to review with error message
    return {
      success: false,
      documentId,
      documentType: declaredType || 'unknown',
      outcome: 'routed_to_review',
      confidence: 0,
      extractedData: {},
      failedRules: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auto-approve a document and record the decision.
 */
async function autoApprove(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string,
  documentType: DocumentType,
  extractedData: Record<string, unknown>,
  confidence: number,
  warnings: string[],
  context: ValidationContext | undefined,
  startTime: number
): Promise<ProcessingResult> {
  const processingTimeMs = Date.now() - startTime;

  // Update document status
  await supabase
    .from('documents')
    .update({
      status: 'approved',
      verified_at: new Date().toISOString(),
      verified_by: 'system',
      extracted_data: extractedData,
      ocr_confidence: confidence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  // Record automated decision
  const { data: decision } = await supabase
    .from('automated_decisions')
    .insert({
      entity_type: 'document',
      entity_id: documentId,
      decision_type: 'document_approval',
      outcome: 'approved',
      actor: 'system',
      ruleset_version: RULESET_VERSION,
      confidence_score: confidence,
      reason_codes: warnings.length > 0 ? warnings : ['all_rules_passed'],
      input_snapshot: {
        document_type: documentType,
        extracted_data: extractedData,
        context,
      },
      processing_time_ms: processingTimeMs,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  // Write audit log
  await supabase.from('audit_logs').insert({
    action: 'document_auto_approved',
    target_type: 'document',
    target_id: documentId,
    actor_id: null, // System
    metadata: {
      document_type: documentType,
      confidence,
      ruleset_version: RULESET_VERSION,
      warnings,
      processing_time_ms: processingTimeMs,
    },
    created_at: new Date().toISOString(),
  });

  logger.info('[EvidenceProcessor] Document auto-approved', {
    documentId,
    documentType,
    confidence,
    decisionId: decision?.id,
    processingTimeMs,
  });

  return {
    success: true,
    documentId,
    documentType,
    outcome: 'auto_approved',
    confidence,
    extractedData,
    failedRules: [],
    decisionId: decision?.id,
  };
}

/**
 * Route a document to human review.
 */
async function routeToReview(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string,
  documentType: DocumentType,
  extractedData: Record<string, unknown>,
  confidence: number,
  failedRules: string[],
  context: ValidationContext | undefined,
  startTime: number
): Promise<ProcessingResult> {
  const processingTimeMs = Date.now() - startTime;

  // Update document status
  await supabase
    .from('documents')
    .update({
      status: 'pending_review',
      extracted_data: extractedData,
      ocr_confidence: confidence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  // Create review queue item
  const { data: reviewItem } = await supabase
    .from('review_queue')
    .insert({
      entity_type: 'document',
      entity_id: documentId,
      review_type: 'document_verification',
      priority: calculatePriority(documentType, failedRules),
      status: 'pending',
      extracted_data: extractedData,
      confidence_score: confidence,
      failed_rules: failedRules,
      system_recommendation: determineRecommendation(confidence, failedRules),
      context: context || {},
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  // Record automated decision
  const { data: decision } = await supabase
    .from('automated_decisions')
    .insert({
      entity_type: 'document',
      entity_id: documentId,
      decision_type: 'document_review_routing',
      outcome: 'routed_to_review',
      actor: 'system',
      ruleset_version: RULESET_VERSION,
      confidence_score: confidence,
      reason_codes: failedRules,
      input_snapshot: {
        document_type: documentType,
        extracted_data: extractedData,
        context,
      },
      processing_time_ms: processingTimeMs,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  // Write audit log
  await supabase.from('audit_logs').insert({
    action: 'document_routed_to_review',
    target_type: 'document',
    target_id: documentId,
    actor_id: null, // System
    metadata: {
      document_type: documentType,
      confidence,
      failed_rules: failedRules,
      review_queue_id: reviewItem?.id,
      ruleset_version: RULESET_VERSION,
      processing_time_ms: processingTimeMs,
    },
    created_at: new Date().toISOString(),
  });

  logger.info('[EvidenceProcessor] Document routed to review', {
    documentId,
    documentType,
    confidence,
    failedRules,
    reviewQueueId: reviewItem?.id,
    processingTimeMs,
  });

  return {
    success: true,
    documentId,
    documentType,
    outcome: 'routed_to_review',
    confidence,
    extractedData,
    failedRules,
    decisionId: decision?.id,
    reviewQueueId: reviewItem?.id,
  };
}

/**
 * Calculate review priority based on document type and failure reasons.
 */
function calculatePriority(documentType: DocumentType, failedRules: string[]): number {
  // Base priority by document type (lower = higher priority)
  const basePriority: Record<DocumentType, number> = {
    transcript: 1,
    license: 2,
    mou: 2,
    insurance: 3,
    certification: 3,
    id: 4,
    w2: 5,
    '1099': 5,
    unknown: 10,
  };

  let priority = basePriority[documentType] || 5;

  // Increase priority for certain failure types
  if (failedRules.some(r => r.includes('expired'))) priority -= 1;
  if (failedRules.some(r => r.includes('missing'))) priority += 1;

  return Math.max(1, Math.min(10, priority));
}

/**
 * Determine system recommendation for reviewer.
 */
function determineRecommendation(confidence: number, failedRules: string[]): string {
  if (confidence >= 0.9 && failedRules.length === 1) {
    return 'likely_approve_with_override';
  }
  if (confidence < 0.5) {
    return 'likely_reject_poor_quality';
  }
  if (failedRules.some(r => r.includes('out-of-state'))) {
    return 'manual_state_verification_required';
  }
  return 'manual_review_required';
}

// ============================================
// TRANSCRIPT-SPECIFIC PROCESSING
// ============================================

/**
 * Process a transcript and optionally apply transfer hours.
 */
export async function processTranscript(
  documentId: string,
  fileUrl: string,
  enrollmentId: string,
  state?: string
): Promise<ProcessingResult & { hoursApplied?: number }> {
  const result = await processDocument(documentId, fileUrl, 'transcript', {
    documentType: 'transcript',
    state,
  });

  // If auto-approved and has hours, apply transfer hours
  if (result.outcome === 'auto_approved' && result.extractedData.hours_completed) {
    const supabase = createAdminClient();
    const hours = result.extractedData.hours_completed as number;

    // Update enrollment with transfer hours
    const { error } = await supabase
      .from('student_enrollments')
      .update({
        transfer_hours: hours,
        transfer_hours_verified: true,
        transfer_hours_verified_at: new Date().toISOString(),
        transfer_hours_source: documentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (!error) {
      // Record the transfer hours decision
      await supabase.from('automated_decisions').insert({
        entity_type: 'enrollment',
        entity_id: enrollmentId,
        decision_type: 'transfer_hours_applied',
        outcome: 'approved',
        actor: 'system',
        ruleset_version: RULESET_VERSION,
        confidence_score: result.confidence,
        reason_codes: ['transcript_verified', 'hours_extracted'],
        input_snapshot: {
          document_id: documentId,
          hours_applied: hours,
          source_school: result.extractedData.school_name,
        },
        created_at: new Date().toISOString(),
      });

      await supabase.from('audit_logs').insert({
        action: 'transfer_hours_auto_applied',
        target_type: 'enrollment',
        target_id: enrollmentId,
        metadata: {
          document_id: documentId,
          hours_applied: hours,
          source_school: result.extractedData.school_name,
          state,
        },
        created_at: new Date().toISOString(),
      });

      logger.info('[EvidenceProcessor] Transfer hours auto-applied', {
        enrollmentId,
        documentId,
        hours,
      });

      return { ...result, hoursApplied: hours };
    }
  }

  return result;
}

// ============================================
// EXPORTS
// ============================================

export {
  RULESET_VERSION,
  MIN_CONFIDENCE,
  REQUIRED_FIELDS,
  STATES_WITH_TRANSCRIPT_RULES,
};
