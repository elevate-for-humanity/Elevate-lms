// Interview Types for PARIS Interview Engine

export interface InterviewQuestion {
  id: string;
  question: string;
  domain: string;
  followUps: string[];
  scoringRubric: ScoringRubric;
  weight: number;
  requiredDomain: boolean;
}

export interface ScoringRubric {
  excellent: string;
  good: string;
  fair: string;
  poor: string;
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  percentage: number;
  domain: string;
  rubric: string;
}

export interface InterviewScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  domainScores: Record<string, { score: number; maxScore: number }>;
  questionScores: ScoreResult[];
  riskLevel: 'low' | 'medium' | 'high';
  eligibility: 'eligible' | 'review' | 'denied';
}

/** Dates are Date objects in memory and ISO strings when persisted. */
export type InterviewTimestamp = Date | string;

export interface ConversationMessage {
  id: string;
  role: 'paris' | 'applicant';
  content: string;
  timestamp: InterviewTimestamp;
  questionId?: string;
  score?: number;
}

export interface InterviewSession {
  sessionId: string;
  applicationRef: string;
  programSlug: string;
  currentQuestionIndex: number;
  messages: ConversationMessage[];
  responses: Record<string, string>;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  startedAt: InterviewTimestamp;
  completedAt?: InterviewTimestamp;
}

export interface FundingOption {
  type: string;
  name: string;
  coverage: number;
  requirements: string[];
  applicationUrl: string;
}

export interface EligibilityResult {
  eligible: boolean;
  status: 'eligible' | 'review' | 'denied';
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  fundingRecommendations: FundingOption[];
  nextSteps: string[];
}

export interface ProvisioningResult {
  success: boolean;
  studentId?: string;
  enrollmentId?: string;
  binderId?: string;
  onboardingPlanId?: string;
  errors: string[];
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type EligibilityStatus = 'eligible' | 'review' | 'denied';
