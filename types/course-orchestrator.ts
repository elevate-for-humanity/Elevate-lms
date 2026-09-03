// types/course-orchestrator.ts

export type CourseTag =
  | 'WRG'
  | 'JRI'
  | 'ETPL'
  | 'Apprenticeship'
  | 'WorkOne'
  | 'EmployIndy'
  | 'CNA'
  | 'HVAC'
  | 'Barber'
  | 'CDL'
  | string;

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'dropped';

export type BlockStatus = 'not_started' | 'in_progress' | 'pending_verification' | 'completed';

export type CourseBlockType =
  | 'partner_course'
  | 'free_online'
  | 'live_session'
  | 'quiz'
  | 'admin_task';

/**
 * Base shape for any block in the orchestrated course.
 */
export interface BaseCourseBlock {
  id: string;
  type: CourseBlockType;
  displayTitle: string;
  description?: string;
  required: boolean;
  expectedHours?: number; // for reporting
}

/**
 * Partner course block – Milady, Choice Medical, Certiport, etc.
 */
export interface PartnerCourseBlock extends BaseCourseBlock {
  type: 'partner_course';
  partnerId: string; // e.g. "milady", "choice_medical"
  partnerCourseId: string; // their internal ID
  launchUrl: string; // deep link / LTI link
  completionProofType?: 'certificate_upload' | 'manual_mark' | 'webhook';
  attachedQuizId?: string; // optional Elevate quiz to verify learning
}

/**
 * Free online resource block – YouTube, open course, etc.
 */
export interface FreeOnlineBlock extends BaseCourseBlock {
  type: 'free_online';
  sourceType: 'youtube' | 'web' | 'mooc' | 'pdf' | string;
  launchUrl: string;
  attachedQuizId?: string;
}

/**
 * Live session block – Elevate or program holder live teaching.
 */
export interface LiveSessionBlock extends BaseCourseBlock {
  type: 'live_session';
  meetingLink: string;
  scheduleType: 'one_time' | 'recurring';
  startDateTime?: string; // ISO
  endDateTime?: string; // ISO
  recurringRule?: string; // e.g. "RRULE:FREQ=WEEKLY;BYDAY=MO"
  recordingUrl?: string;
}

/**
 * Quiz block – internal Elevate quiz.
 */
export interface QuizBlock extends BaseCourseBlock {
  type: 'quiz';
  quizId: string; // reference to quiz in question bank
  passingScore: number; // percentage 0–100
}

/**
 * Admin task block – compliance, uploads, forms.
 */
export interface AdminTaskBlock extends BaseCourseBlock {
  type: 'admin_task';
  taskKind: 'document_upload' | 'form_completion' | 'acknowledgement' | string;
  requiredDocumentType?: string; // e.g. "ID", "WIOA_INTAKE", etc.
}

/**
 * Discriminated union of all block types.
 */
export type CourseBlock =
  | PartnerCourseBlock
  | FreeOnlineBlock
  | LiveSessionBlock
  | QuizBlock
  | AdminTaskBlock;

/**
 * Rules for overall course completion.
 */
export interface CompletionRules {
  requireAllRequiredBlocks: boolean;
  minimumQuizAverage?: number; // e.g. 75
  minimumLiveSessionsAttended?: number;
}

/**
 * Email automation configuration for a course.
 */
export interface EmailAutomationConfig {
  onEnrollTemplateId?: string;
  onCompletionTemplateId?: string;
  onInactiveTemplateId?: string;
  onInactiveDays?: number; // after how many days to send nudges
  beforeLiveSessionTemplateId?: string;
  beforeLiveSessionHours?: number; // e.g. 24
}

/**
 * Top-level config representing one orchestrated Elevate course.
 */
export interface CourseConfig {
  id: string;
  title: string;
  description: string;
  totalHours?: number;
  tags: CourseTag[];
  blocks: CourseBlock[];
  completionRules: CompletionRules;
  emailAutomation: EmailAutomationConfig;
  // optional: metadata about who created / owns this program
  ownerOrgId?: string;
  ownerUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tracks one student's journey through a CourseConfig.
 */
export interface StudentCourseBlockProgress {
  blockId: string;
  status: BlockStatus;
  score?: number; // for quiz blocks
  evidenceUrl?: string; // upload proving completion
  lastUpdatedAt?: string;
}

export interface StudentCourseProgress {
  id: string;
  studentId: string;
  courseId: string;
  status: CourseStatus;
  blocks: StudentCourseBlockProgress[];
  createdAt: string;
  updatedAt: string;
}
