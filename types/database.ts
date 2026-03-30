// =====================================================
// ELEVATE FOR HUMANITY - DATABASE TYPES
// Hand-written domain interfaces (business logic layer).
// For full table row types generated from live schema, see:
//   types/database.generated.ts  (run: pnpm gen:types to refresh)
// =====================================================

export type UserRole =
  | 'student'
  | 'admin'
  | 'super_admin'
  | 'staff'
  | 'employer'
  | 'workforce_board'
  | 'partner'
  | 'sponsor'
  | 'mentor'
  | 'org_admin'
  | 'program_holder'
  | 'delegate'
  | 'creator'
  | 'instructor';
export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'withdrawn'
  | 'suspended';
export type FundingType =
  | 'wrg'
  | 'wioa'
  | 'jri'
  | 'employindy'
  | 'self_pay'
  | 'employer_sponsored';
export type ProgramHolderStatus = 'pending' | 'approved' | 'inactive';
export type MouStatus =
  | 'not_sent'
  | 'pending'
  | 'sent'
  | 'signed_by_holder'
  | 'fully_executed';
export type CertificateStatus = 'pending' | 'issued' | 'revoked';
export type AttendanceType =
  | 'login'
  | 'lesson_complete'
  | 'quiz_attempt'
  | 'live_session';

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  funding_type?: FundingType;
  case_manager_name?: string;
  case_manager_email?: string;
  case_manager_phone?: string;
  eligibility_verified: boolean;
  eligibility_verified_at?: string;
  eligibility_verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramHolder {
  id: string;
  owner_id?: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  training_focus?: string;
  status: ProgramHolderStatus;
  payout_share: number;
  mou_status: MouStatus;
  mou_holder_signature_url?: string;
  mou_holder_signed_at?: string;
  mou_admin_signature_url?: string;
  mou_admin_signed_at?: string;
  mou_admin_signed_by?: string;
  mou_final_pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Delegate {
  id: string;
  organization?: string;
  territory?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  slug: string;
  name: string;
  description?: string;
  short_description?: string;
  cover_image_url?: string;
  duration_weeks?: number;
  total_hours?: number;
  funding_types: FundingType[];
  price_self_pay?: number;
  is_active: boolean;
  program_holder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  program_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_published: boolean;
  requires_completion: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonResource {
  id: string;
  lesson_id: string;
  title: string;
  resource_type: string;
  url: string;
  file_size?: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  program_id: string;
  funding_type: FundingType;
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  withdrawn_at?: string;
  withdrawal_reason?: string;
  delegate_id?: string;
  program_holder_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  started_at?: string;
  completed_at?: string;
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  student_id: string;
  enrollment_id?: string;
  attendance_type: AttendanceType;
  logged_at: string;
  duration_minutes?: number;
  lesson_id?: string;
  notes?: string;
  created_at: string;
}

export interface ContactHours {
  id: string;
  enrollment_id: string;
  week_start_date: string;
  total_hours: number;
  login_count: number;
  lessons_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  lesson_id?: string;
  module_id?: string;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  correct_answer: string;
  options?: any;
  points: number;
  order_index: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  enrollment_id: string;
  quiz_id: string;
  attempt_number: number;
  score?: number;
  passed?: boolean;
  started_at: string;
  completed_at?: string;
  answers?: any;
  created_at: string;
}

export interface Grade {
  id: string;
  enrollment_id: string;
  quiz_id?: string;
  grade_type: string;
  score: number;
  max_score: number;
  percentage: number;
  graded_by?: string;
  graded_at?: string;
  feedback?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  enrollment_id: string;
  student_id: string;
  program_id: string;
  certificate_number: string;
  issued_at: string;
  issued_by?: string;
  status: CertificateStatus;
  pdf_url?: string;
  verification_code: string;
  total_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject?: string;
  body: string;
  read_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read_at?: string;
  created_at: string;
}

// =====================================================
// HELPER TYPES FOR JOINS
// =====================================================

export interface EnrollmentWithDetails extends Enrollment {
  student?: Student & { profile?: Profile };
  program?: Program;
  delegate?: Delegate & { profile?: Profile };
  program_holder?: ProgramHolder;
}

export interface CertificateWithDetails extends Certificate {
  student?: Student & { profile?: Profile };
  program?: Program;
}

export interface AttendanceWithDetails extends AttendanceLog {
  student?: Student & { profile?: Profile };
  enrollment?: Enrollment;
  lesson?: Lesson;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface EnrollmentRequest {
  program_id: string;
  funding_type: FundingType;
  student_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    county?: string;
    case_manager_name?: string;
    case_manager_email?: string;
    case_manager_phone?: string;
  };
}

export interface DelegateCaseload {
  delegate_id: string;
  enrollments: EnrollmentWithDetails[];
  total_students: number;
  active_students: number;
  completed_students: number;
  total_hours: number;
}

export interface ProgramHolderStats {
  program_holder_id: string;
  total_students: number;
  active_enrollments: number;
  completed_enrollments: number;
  total_revenue: number;
  payout_amount: number;
}

export interface AdminDashboardStats {
  total_students: number;
  active_enrollments: number;
  total_programs: number;
  certificates_issued: number;
  funding_breakdown: {
    wrg: number;
    wioa: number;
    jri: number;
    employindy: number;
    self_pay: number;
    employer_sponsored: number;
  };
}
