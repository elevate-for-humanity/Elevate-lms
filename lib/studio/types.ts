/**
 * AI Engineering Studio - Core Types
 */

export type StudioType = 'ai_development' | 'engineering' | 'verification' | 'knowledge' | 'education' | 'workforce';
export type EvidenceSource = 'ai_generated' | 'code_execution' | 'simulation' | 'document' | 'rule_validation' | 'human_review' | 'reference' | 'test_result';

export interface UnifiedTask {
  id: string;
  studioType: StudioType;
  taskType: string;
  name: string;
  description: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  evidence: EvidenceRecord[];
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EvidenceRecord {
  id: string;
  sourceType: EvidenceSource;
  sourceId?: string;
  evidenceType: string;
  content: unknown;
  confidenceScore?: number;
  validationStatus: 'pending' | 'valid' | 'invalid' | 'uncertain';
  validationMethod?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ConfidenceScore {
  overall: number;
  components: {
    modelConfidence: number;
    deterministicConfidence: number;
    evidenceConfidence: number;
    humanConfidence: number;
  };
  evidenceCount: number;
  validationCount: number;
  breakdown: Record<string, number>;
}

export interface OrchestrationStep {
  id: string;
  stepType: 'ai_generation' | 'code_execution' | 'verification' | 'review' | 'aggregation';
  config: Record<string, unknown>;
  dependsOn?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
}

export interface OrchestrationWorkflow {
  id: string;
  name: string;
  studioType: StudioType;
  steps: OrchestrationStep[];
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  evidence: EvidenceRecord[];
  createdAt: string;
  completedAt?: string;
}
