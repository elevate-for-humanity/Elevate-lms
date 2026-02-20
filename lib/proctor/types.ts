export type ExamProvider = 'certiport' | 'esco_epa608' | 'careersafe_osha' | 'other';
export type ExamSessionStatus = 'checked_in' | 'in_progress' | 'completed' | 'voided' | 'no_show';
export type ExamResult = 'pass' | 'fail' | 'incomplete' | 'pending';
export type IdType = 'drivers_license' | 'state_id' | 'passport' | 'military_id' | 'other';

export interface ExamSession {
  id: string;
  tenant_id: string | null;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
  provider: ExamProvider;
  exam_name: string;
  exam_code: string | null;
  start_code: string | null;
  start_key: string | null;
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
  program_slug: string | null;
  cohort_id: string | null;
  created_at: string;
  updated_at: string;
}

export const EXAM_PROVIDERS: Record<ExamProvider, { label: string; description: string }> = {
  certiport: { label: 'Certiport', description: 'Microsoft, IC3, Adobe, and other Certiport exams' },
  esco_epa608: { label: 'EPA 608 (ESCO)', description: 'EPA Section 608 refrigerant handling certification' },
  careersafe_osha: { label: 'CareerSafe OSHA', description: 'OSHA 10 and OSHA 30 safety certifications' },
  other: { label: 'Other', description: 'Other proctored certification exams' },
};

export const EXAM_PRESETS: { provider: ExamProvider; name: string; code?: string; duration: number }[] = [
  { provider: 'esco_epa608', name: 'EPA 608 Universal', duration: 180 },
  { provider: 'esco_epa608', name: 'EPA 608 Core', duration: 180 },
  { provider: 'esco_epa608', name: 'EPA 608 Type I (Small Appliances)', duration: 180 },
  { provider: 'esco_epa608', name: 'EPA 608 Type II (High Pressure)', duration: 180 },
  { provider: 'esco_epa608', name: 'EPA 608 Type III (Low Pressure)', duration: 180 },
  { provider: 'careersafe_osha', name: 'OSHA 30-Hour Construction', duration: 180 },
  { provider: 'careersafe_osha', name: 'OSHA 10-Hour General Industry', duration: 180 },
  { provider: 'certiport', name: 'IC3 Digital Literacy', duration: 150 },
  { provider: 'certiport', name: 'Microsoft Office Specialist (MOS)', duration: 150 },
  { provider: 'certiport', name: 'Entrepreneurship and Small Business (ESB)', duration: 150 },
  { provider: 'other', name: 'CPR / BLS', duration: 60 },
  { provider: 'other', name: 'Rise Up', duration: 120 },
];

export const STATUS_CONFIG: Record<ExamSessionStatus, { label: string; color: string }> = {
  checked_in: { label: 'Checked In', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', color: 'bg-brand-blue-100 text-brand-blue-800' },
  completed: { label: 'Completed', color: 'bg-brand-green-100 text-brand-green-800' },
  voided: { label: 'Voided', color: 'bg-brand-red-100 text-brand-red-800' },
  no_show: { label: 'No Show', color: 'bg-slate-100 text-slate-600' },
};

export const RESULT_CONFIG: Record<ExamResult, { label: string; color: string }> = {
  pass: { label: 'Pass', color: 'bg-brand-green-100 text-brand-green-800' },
  fail: { label: 'Fail', color: 'bg-brand-red-100 text-brand-red-800' },
  incomplete: { label: 'Incomplete', color: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600' },
};
