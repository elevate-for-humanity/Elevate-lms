import { z } from 'zod';

/**
 * Common validation schemas for API endpoints
 * Use these to validate all user inputs
 */

// ============================================
// COMMON SCHEMAS
// ============================================

export const emailSchema = z.string().email('Invalid email address').toLowerCase();

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-()+ ]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits');

export const urlSchema = z.string().url('Invalid URL format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateSchema = z.string().datetime('Invalid date format');

export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

export const nonEmptyStringSchema = z.string().min(1, 'Field cannot be empty').trim();

// ============================================
// AUTH SCHEMAS
// ============================================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  phone: phoneSchema.optional(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ============================================
// APPLICATION SCHEMAS
// ============================================

export const applicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  phone: phoneSchema,
  program: z.string().min(1, 'Program is required'),
  funding: z.string().min(1, 'Funding selection is required'),
  message: z.string().max(1000, 'Message must be less than 1000 characters').optional(),
  pathway_slug: z.string().max(100).optional(),
  source: z.enum(['direct', 'pathway', 'partner', 'referral']).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// ============================================
// ENROLLMENT SCHEMAS
// ============================================

export const enrollmentSchema = z.object({
  courseId: uuidSchema,
  userId: uuidSchema.optional(),
  paymentMethod: z.enum(['stripe', 'affirm', 'free', 'funded']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const enrollmentApprovalSchema = z.object({
  enrollmentId: uuidSchema,
  status: z.enum(['approved', 'rejected', 'pending']),
  notes: z.string().max(500).optional(),
});

// ============================================
// COURSE SCHEMAS
// ============================================

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens')
    .optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  duration: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().optional(),
  coverImage: urlSchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  id: uuidSchema,
});

export const createLessonSchema = z.object({
  courseId: uuidSchema,
  moduleId: uuidSchema.optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  videoUrl: urlSchema.optional(),
  duration: z.number().positive().optional(),
  orderIndex: z.number().int().min(0).optional(),
  type: z.enum(['video', 'text', 'quiz', 'assignment']).default('video'),
});

// ============================================
// PROGRESS SCHEMAS
// ============================================

export const updateProgressSchema = z.object({
  lessonId: uuidSchema,
  courseId: uuidSchema,
  completed: z.boolean(),
  progress: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).optional(),
});

export const submitQuizSchema = z.object({
  quizId: uuidSchema,
  answers: z.array(
    z.object({
      questionId: uuidSchema,
      answer: z.union([z.string(), z.array(z.string())]),
    }),
  ),
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const createCheckoutSchema = z.object({
  courseId: uuidSchema,
  priceId: z.string().optional(),
  successUrl: urlSchema,
  cancelUrl: urlSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

export const affirmChargeSchema = z.object({
  checkoutToken: z.string().min(1, 'Checkout token is required'),
  courseId: uuidSchema,
  amount: z.number().positive('Amount must be positive'),
});

// ============================================
// ADMIN SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: z.enum([
    'admin',
    'staff',
    'student',
    'program_holder',
    'partner',
    'delegate',
    'workforce_board',
  ]),
  phone: phoneSchema.optional(),
});

export const updateUserSchema = z.object({
  userId: uuidSchema,
  email: emailSchema.optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  role: z
    .enum(['admin', 'staff', 'student', 'program_holder', 'partner', 'delegate', 'workforce_board'])
    .optional(),
  phone: phoneSchema.optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// ============================================
// PARTNER SCHEMAS
// ============================================

export const partnerEnrollmentSchema = z.object({
  studentEmail: emailSchema,
  courseId: uuidSchema,
  partnerId: uuidSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

export const partnerAttendanceSchema = z.object({
  enrollmentId: uuidSchema,
  date: dateSchema,
  status: z.enum(['present', 'absent', 'excused', 'late']),
  notes: z.string().max(500).optional(),
});

// ============================================
// COMPLIANCE SCHEMAS
// ============================================

export const complianceReportSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  reportType: z.enum(['wioa', 'ferpa', 'gdpr', 'custom']),
  filters: z.record(z.string(), z.any()).optional(),
});

// ============================================
// FILE UPLOAD SCHEMAS
// ============================================

export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255),
  fileType: z.string().regex(/^[a-z]+\/[a-z0-9+.-]+$/, 'Invalid MIME type'),
  fileSize: z
    .number()
    .positive()
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  category: z.enum(['document', 'image', 'video', 'other']).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates request body against schema
 * Returns parsed data or throws validation error
 */
export async function validateRequestBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation failed: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        { cause: error },
      );
    }
    throw error;
  }
}

/**
 * Validates query parameters against schema
 */
export function validateQueryParams<T>(url: URL, schema: z.ZodSchema<T>): T {
  const params = Object.fromEntries(url.searchParams.entries());
  return schema.parse(params);
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - use DOMPurify for production
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}
