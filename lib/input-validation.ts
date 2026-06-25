import { z } from 'zod';

export const emailSchema = z.string().email().max(255);
export const nameSchema = z.string().min(2).max(100).regex(/^[a-zA-Z\s'-]+$/);
export const phoneSchema = z.string().regex(/^[\d\s\-+()]+$/).max(20);
export const uuidSchema = z.string().uuid();
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const userSchemas = {
  email: emailSchema,
  name: nameSchema,
  phone: phoneSchema,
};

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return result as T;
}

export function validateAndSanitize<T extends z.ZodType>(schema: T, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) return { success: false, error: result.error };
  return { success: true, data: result.data };
}
