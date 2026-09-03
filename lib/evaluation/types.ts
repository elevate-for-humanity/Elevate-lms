/**
 * AI Evaluation Studio - Core Types
 * Framework for defining, executing, and scoring AI tasks with deterministic validation
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type EvaluationStatus = 'draft' | 'pending_validation' | 'pending_review' | 'approved' | 'rejected' | 'archived';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type CheckerType = 'required_fields' | 'regex_match' | 'range_check' | 'mapping_complete' | 'relationship_valid' | 'custom';
export type RubricCategory = 'completeness' | 'accuracy' | 'compliance' | 'quality' | 'safety';

export interface VersionInfo {
  version: number;
  author: string;
  authorId?: string;
  createdAt: string;
  changeNote?: string;
  previousVersion?: number;
}

// ============================================================================
// TASK DEFINITION
// ============================================================================

export interface EvaluationTaskDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  domain: 'courses' | 'paris' | 'admissions' | 'compliance' | 'grants' | 'apprenticeships' | 'marketing' | 'general';
  category: string;
  
  // Problem Statement
  objective: string;
  requiredInputs: InputSchema[];
  constraints: Constraint[];
  expectedOutputFormat: OutputFormat;
  completionCriteria: CompletionCriterion[];
  
  // Relationships
  checkerIds: string[];
  rubricId?: string;
  referenceSolutionId?: string;
  testCaseIds: string[];
  
  // Metadata
  version: VersionInfo;
  status: EvaluationStatus;
  tags: string[];
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface InputSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  required: boolean;
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    allowedValues?: string[];
    customValidator?: string; // Reference to custom validation function
  };
}

export interface Constraint {
  id: string;
  description: string;
  severity: 'error' | 'warning';
  rule: string;
}

export interface OutputFormat {
  type: 'json' | 'text' | 'markdown' | 'document' | 'structured';
  schema?: Record<string, unknown>;
  template?: string;
  requiredSections?: string[];
}

export interface CompletionCriterion {
  id: string;
  description: string;
  checkerId?: string; // Links to a checker that validates this criterion
  weight: number; // 0-100
  isRequired: boolean;
}

// ============================================================================
// CHECKERS (Deterministic Validators)
// ============================================================================

export interface EvaluationChecker {
  id: string;
  taskId: string;
  name: string;
  type: CheckerType;
  description: string;
  
  // Configuration based on type
  config: CheckerConfig;
  
  // Error handling
  errorMessage: string;
  severity: 'error' | 'warning';
  
  // Versioning
  version: VersionInfo;
  
  createdAt: string;
  updatedAt: string;
}

export type CheckerConfig = 
  | RequiredFieldsConfig
  | RegexMatchConfig
  | RangeCheckConfig
  | MappingCompleteConfig
  | RelationshipValidConfig
  | CustomCheckerConfig;

export interface RequiredFieldsConfig {
  type: 'required_fields';
  fields: { path: string; description: string }[];
}

export interface RegexMatchConfig {
  type: 'regex_match';
  field: string;
  pattern: string;
  description?: string;
}

export interface RangeCheckConfig {
  type: 'range_check';
  field: string;
  min?: number;
  max?: number;
  unit?: string;
}

export interface MappingCompleteConfig {
  type: 'mapping_complete';
  sourceField: string;
  targetField: string;
  mappingRules: { source: string; target: string; required: boolean }[];
}

export interface RelationshipValidConfig {
  type: 'relationship_valid';
  parentField: string;
  childField: string;
  relationshipType: 'one_to_one' | 'one_to_many' | 'many_to_many';
  validationQuery?: string;
}

export interface CustomCheckerConfig {
  type: 'custom';
  functionName: string;
  functionPath: string;
  parameters?: Record<string, unknown>;
}

// ============================================================================
// REFERENCE SOLUTIONS (Trusted Standards)
// ============================================================================

export interface ReferenceSolution {
  id: string;
  taskId: string;
  name: string;
  description: string;
  
  // Content
  content: ReferenceContent;
  contentType: 'json' | 'text' | 'markdown' | 'document';
  
  // Source info
  source: string; // e.g., "DOL Approved Template", "State Board Standard"
  sourceUrl?: string;
  effectiveDate?: string;
  expirationDate?: string;
  
  // Versioning
  version: VersionInfo;
  status: ApprovalStatus;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReferenceContent {
  // For structured content
  template?: Record<string, unknown>;
  schema?: Record<string, unknown>;
  
  // For document/markdown content
  document?: string;
  
  // For specific reference types
  exampleValidOutput?: unknown;
  approvedStructure?: unknown;
  requirementsList?: string[];
}

// ============================================================================
// SCORING RUBRICS
// ============================================================================

export interface ScoringRubric {
  id: string;
  taskId: string;
  name: string;
  description: string;
  
  // Categories
  categories: RubricCategory[];
  categoryWeights: Record<RubricCategory, number>; // Must sum to 100
  
  // Scoring rules per category
  categoryRules: Record<RubricCategory, CategoryRule[]>;
  
  // Overall scoring
  passThreshold: number; // 0-100
  gradeThresholds?: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsWork: number;
  };
  
  // Versioning
  version: VersionInfo;
  
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRule {
  id: string;
  category: RubricCategory;
  description: string;
  criteria: string;
  points: number;
  maxPoints: number;
  penalties?: { condition: string; deduction: number }[];
}

// ============================================================================
// TEST CASES
// ============================================================================

export interface TestCase {
  id: string;
  taskId: string;
  name: string;
  description: string;
  
  // Test data
  input: Record<string, unknown>;
  expectedOutput?: unknown;
  
  // Test configuration
  type: 'normal' | 'edge_case' | 'negative' | 'boundary';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Validation
  validators: TestValidator[];
  
  // Expected results
  shouldPass: boolean;
  expectedScores?: Record<RubricCategory, number>;
  
  // Versioning
  version: VersionInfo;
  
  createdAt: string;
  updatedAt: string;
}

export interface TestValidator {
  type: 'checker' | 'rubric' | 'custom';
  referenceId: string;
  expectedResult: unknown;
}

// ============================================================================
// EVALUATION RESULTS
// ============================================================================

export interface EvaluationResult {
  id: string;
  taskId: string;
  
  // Input/output
  input: Record<string, unknown>;
  output: unknown;
  
  // Validation results
  checkerResults: CheckerResult[];
  rubricScores?: RubricScores;
  
  // Overall assessment
  overallScore?: number;
  pass: boolean;
  status: 'passed' | 'failed' | 'needs_review';
  
  // Review info
  reviewedBy?: string;
  reviewNotes?: string;
  reviewStatus: ApprovalStatus;
  
  // Timestamps
  evaluatedAt: string;
  reviewedAt?: string;
  
  // Metadata
  evaluator: 'system' | 'human' | 'hybrid';
  executionTimeMs?: number;
}

export interface CheckerResult {
  checkerId: string;
  checkerName: string;
  passed: boolean;
  message?: string;
  details?: unknown;
  severity: 'error' | 'warning';
}

export interface RubricScores {
  rubricId: string;
  categoryScores: Record<RubricCategory, number>;
  totalScore: number;
  breakdown: {
    category: RubricCategory;
    score: number;
    maxScore: number;
    passed: boolean;
    feedback: string[];
  }[];
}

// ============================================================================
// REVIEW QUEUE
// ============================================================================

export interface ReviewQueueItem {
  id: string;
  resultId: string;
  taskId: string;
  
  // Queue status
  status: 'pending' | 'in_review' | 'completed' | 'escalated';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Assignment
  assignedTo?: string;
  assignedAt?: string;
  
  // Review decision
  decision?: 'approve' | 'reject' | 'request_changes';
  decisionNote?: string;
  decidedAt?: string;
  
  // Routing
  routedFrom: 'automated' | 'manual';
  failureReasons?: string[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VERSION HISTORY
// ============================================================================

export interface VersionHistory {
  id: string;
  entityType: 'task' | 'checker' | 'rubric' | 'reference' | 'test_case';
  entityId: string;
  
  version: number;
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  
  author: string;
  authorId: string;
  changeNote: string;
  createdAt: string;
}

// ============================================================================
// WORKFLOW STATE MACHINE
// ============================================================================

export type EvaluationWorkflowState = 
  | 'draft'
  | 'submitted'
  | 'automated_validation'
  | 'automated_passed'
  | 'automated_failed'
  | 'pending_human_review'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'published';

export interface WorkflowTransition {
  from: EvaluationWorkflowState;
  to: EvaluationWorkflowState;
  action: string;
  allowedRoles: string[];
  requiresNote: boolean;
  autoTransition?: boolean;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  { from: 'draft', to: 'submitted', action: 'submit', allowedRoles: ['admin', 'editor', 'ai_agent'], requiresNote: false },
  { from: 'submitted', to: 'automated_validation', action: 'start_validation', allowedRoles: ['system'], requiresNote: false, autoTransition: true },
  { from: 'automated_validation', to: 'automated_passed', action: 'validation_passed', allowedRoles: ['system'], requiresNote: false, autoTransition: true },
  { from: 'automated_validation', to: 'automated_failed', action: 'validation_failed', allowedRoles: ['system'], requiresNote: false, autoTransition: true },
  { from: 'automated_failed', to: 'pending_human_review', action: 'escalate', allowedRoles: ['system'], requiresNote: false, autoTransition: true },
  { from: 'automated_passed', to: 'approved', action: 'auto_approve', allowedRoles: ['system'], requiresNote: false },
  { from: 'automated_passed', to: 'pending_human_review', action: 'request_review', allowedRoles: ['system', 'admin'], requiresNote: false },
  { from: 'pending_human_review', to: 'in_review', action: 'start_review', allowedRoles: ['reviewer', 'admin'], requiresNote: false },
  { from: 'in_review', to: 'approved', action: 'approve', allowedRoles: ['reviewer', 'admin'], requiresNote: true },
  { from: 'in_review', to: 'rejected', action: 'reject', allowedRoles: ['reviewer', 'admin'], requiresNote: true },
  { from: 'in_review', to: 'changes_requested', action: 'request_changes', allowedRoles: ['reviewer', 'admin'], requiresNote: true },
  { from: 'changes_requested', to: 'draft', action: 'revise', allowedRoles: ['admin', 'editor', 'ai_agent'], requiresNote: true },
  { from: 'approved', to: 'published', action: 'publish', allowedRoles: ['admin'], requiresNote: false },
  { from: 'approved', to: 'draft', action: 'unapprove', allowedRoles: ['admin'], requiresNote: true },
];

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface EvaluationApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface BatchEvaluationRequest {
  taskId: string;
  inputs: Record<string, unknown>[];
  executeCheckers: boolean;
  executeRubric: boolean;
  autoSubmit: boolean;
}

export interface BatchEvaluationResponse {
  taskId: string;
  total: number;
  passed: number;
  failed: number;
  needsReview: number;
  results: EvaluationResult[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: EvaluationStatus[];
  domain?: string[];
  category?: string[];
  tags?: string[];
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
