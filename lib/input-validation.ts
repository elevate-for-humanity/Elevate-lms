import { z } from 'zod';

export const emailSchema = z.string().email().max(255);
export const nameSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-zA-Z\s'-]+$/);
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/)
  .optional();
export const uuidSchema = z.string().uuid();
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

export const userSchemas = {
  createUser: z.object({
    email: emailSchema,
    name: nameSchema,
    phone: phoneSchema,
  }),

  updateProfile: z.object({
    full_name: nameSchema.optional(),
    phone: phoneSchema,
    bio: z.string().max(500).optional(),
  }),

  createEnrollment: z.object({
    course_id: uuidSchema,
    user_id: uuidSchema,
  }),

  createApplication: z.object({
    full_name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    program: z.string().min(2).max(100),
    message: z.string().min(10).max(2000).optional(),
  }),
};

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '').slice(0, 10000);
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: any): T {
  const parsed = schema.parse(data);

  if (typeof parsed === 'object' && parsed !== null) {
    return sanitizeObject(parsed as Record<string, any>) as T;
  }

  return parsed;
}
