export type ExamProvider = 'esco_epa608' | 'mainstream_epa608' | 'certiport' | 'careersafe_osha' | 'other';
export type ExamSessionStatus = 'checked_in' | 'in_progress' | 'completed' | 'voided' | 'no_show';
export type ExamResult = 'pass' | 'fail' | 'incomplete' | 'pending';
export type IdType = 'drivers_license' | 'state_id' | 'passport' | 'military_id' | 'other';
export type DeliveryMethod = 'in_person' | 'online_proctored' | 'hybrid';

export interface ExamSession {
  id: string;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
  provider: ExamProvider;
  exam_name: string;
  exam_code: string | null;
  start_code: string | null;
  start_key: string | null;
  delivery_method: DeliveryMethod;
  id_verified: boolean;
  id_type: IdType | null;
  id_notes: string | null;
  status: ExamSessionStatus;
  result: ExamResult;
  score: number | null;
  duration_min: number;
  started_at: string | null;
  completed_at: string | null;
  proctor_id: string | null;
  proctor_name: string;
  proctor_notes: string | null;
  is_retest: boolean;
  program_slug: string | null;
  cohort_id: string | null;
  evidence_url: string | null;
  review_status: 'clear' | 'flagged' | 'under_review' | 'invalidated';
  flag_reason: string | null;
  flagged_at: string | null;
  event_count: number;
  tab_switch_count: number;
  fullscreen_exit_count: number;
  recording_url: string | null;
  quiz_attempt_id: string | null;
  created_at: string;
  updated_at: string;
}

export const PROVIDER_LABELS: Record<ExamProvider, string> = {
  esco_epa608: 'ESCO Institute (EPA 608)',
  mainstream_epa608: 'Mainstream Engineering (EPA 608)',
  certiport: 'Certiport',
  careersafe_osha: 'CareerSafe (OSHA)',
  other: 'Other',
};

export const STATUS_LABELS: Record<ExamSessionStatus, string> = {
  checked_in: 'Checked In',
  in_progress: 'In Progress',
  completed: 'Completed',
  voided: 'Voided',
  no_show: 'No Show',
};

export const RESULT_LABELS: Record<ExamResult, string> = {
  pass: 'Pass',
  fail: 'Fail',
  incomplete: 'Incomplete',
  pending: 'Pending',
};

export const EPA_EXAMS = [
  'EPA 608 — Core',
  'EPA 608 — Type I (Small Appliances)',
  'EPA 608 — Type II (High-Pressure)',
  'EPA 608 — Type III (Low-Pressure)',
  'EPA 608 — Universal',
];

export const DEFAULT_PROCTOR_NAME  = 'Elizabeth Greene';
export const ESCO_PROCTOR_ID       = '358010';   // ESCO Group
export const MAINSTREAM_PROCTOR_ID = 'SYZXYXSE'; // Mainstream Engineering
