import { z } from 'zod';

// ============ COURSES ============
export const CourseCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  program_id: z.string().uuid().optional().nullable(),
  duration_hours: z.number().int().min(0).optional().nullable(),
  is_published: z.boolean().default(false),
});

export const CourseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  program_id: z.string().uuid().optional().nullable(),
  duration_hours: z.number().int().min(0).optional().nullable(),
  is_published: z.boolean().optional(),
});

export type CourseCreate = z.infer<typeof CourseCreateSchema>;
export type CourseUpdate = z.infer<typeof CourseUpdateSchema>;

// ============ LESSONS ============
export const LessonCreateSchema = z.object({
  course_id: z.string().uuid('Valid course ID required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  order_index: z.number().int().min(0).default(0),
});

export const LessonUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  order_index: z.number().int().min(0).optional(),
});

export type LessonCreate = z.infer<typeof LessonCreateSchema>;
export type LessonUpdate = z.infer<typeof LessonUpdateSchema>;

// ============ QUIZZES ============
export const QuizCreateSchema = z.object({
  course_id: z.string().uuid('Valid course ID required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  time_limit_minutes: z.number().int().min(0).optional().nullable(),
  passing_score: z.number().int().min(0).max(100).default(70),
  max_attempts: z.number().int().min(1).default(3),
});

export const QuizUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  time_limit_minutes: z.number().int().min(0).optional().nullable(),
  passing_score: z.number().int().min(0).max(100).optional(),
  max_attempts: z.number().int().min(1).optional(),
});

export type QuizCreate = z.infer<typeof QuizCreateSchema>;
export type QuizUpdate = z.infer<typeof QuizUpdateSchema>;

// ============ QUIZ QUESTIONS ============
export const QuestionCreateSchema = z.object({
  quiz_id: z.string().uuid('Valid quiz ID required'),
  question_text: z.string().min(1, 'Question text is required'),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer']).default('multiple_choice'),
  options: z.array(z.string()).optional().nullable(),
  correct_answer: z.string().min(1, 'Correct answer is required'),
  points: z.number().int().min(1).default(1),
  order_index: z.number().int().min(0).default(0),
});

export const QuestionUpdateSchema = z.object({
  question_text: z.string().min(1).optional(),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer']).optional(),
  options: z.array(z.string()).optional().nullable(),
  correct_answer: z.string().min(1).optional(),
  points: z.number().int().min(1).optional(),
  order_index: z.number().int().min(0).optional(),
});

export type QuestionCreate = z.infer<typeof QuestionCreateSchema>;
export type QuestionUpdate = z.infer<typeof QuestionUpdateSchema>;

// ============ ENROLLMENTS ============
export const EnrollmentCreateSchema = z.object({
  user_id: z.string().uuid('Valid user ID required'),
  course_id: z.string().uuid('Valid course ID required'),
  status: z.enum(['pending', 'active', 'completed', 'withdrawn']).default('active'),
  progress: z.number().int().min(0).max(100).default(0),
  at_risk: z.boolean().default(false),
});

export const EnrollmentUpdateSchema = z.object({
  status: z.enum(['pending', 'active', 'completed', 'withdrawn']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  at_risk: z.boolean().optional(),
});

export type EnrollmentCreate = z.infer<typeof EnrollmentCreateSchema>;
export type EnrollmentUpdate = z.infer<typeof EnrollmentUpdateSchema>;

// ============ PROGRAMS ============
export const ProgramCreateSchema = z.object({
  code: z.string().min(1, 'Program code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  duration_weeks: z.number().int().min(1).optional().nullable(),
  total_hours: z.number().int().min(1).optional().nullable(),
  tuition: z.number().min(0).optional().nullable(),
  funding_eligible: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  category: z.string().optional().nullable(),
  requirements: z.array(z.string()).optional().nullable(),
});

export const ProgramUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  duration_weeks: z.number().int().min(1).optional().nullable(),
  total_hours: z.number().int().min(1).optional().nullable(),
  tuition: z.number().min(0).optional().nullable(),
  funding_eligible: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  category: z.string().optional().nullable(),
  requirements: z.array(z.string()).optional().nullable(),
});

export type ProgramCreate = z.infer<typeof ProgramCreateSchema>;
export type ProgramUpdate = z.infer<typeof ProgramUpdateSchema>;

// ============ APPLICATIONS ============
export const ApplicationCreateSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  program_id: z.string().uuid('Valid program ID required'),
  intake_id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional().nullable(),
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected', 'enrolled']).default('submitted'),
  eligibility_data: z.record(z.any()).optional().nullable(),
});

export const ApplicationUpdateSchema = z.object({
  status: z.enum(['pending', 'submitted', 'in_review', 'under_review', 'approved', 'rejected', 'enrolled', 'waitlisted']).optional(),
  reviewer_id: z.string().uuid().optional().nullable(),
  review_notes: z.string().optional().nullable(),
  reviewed_at: z.string().datetime().optional().nullable(),
  eligibility_data: z.record(z.any()).optional().nullable(),
});

export type ApplicationCreate = z.infer<typeof ApplicationCreateSchema>;
export type ApplicationUpdate = z.infer<typeof ApplicationUpdateSchema>;

// ============ INTAKES (Lead Capture) ============
export const IntakeCreateSchema = z.object({
  source: z.string().default('website'),
  program_interest: z.string().optional().nullable(),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const IntakeUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'closed']).optional(),
  notes: z.string().optional().nullable(),
  converted_to_application_id: z.string().uuid().optional().nullable(),
});

export type IntakeCreate = z.infer<typeof IntakeCreateSchema>;
export type IntakeUpdate = z.infer<typeof IntakeUpdateSchema>;
