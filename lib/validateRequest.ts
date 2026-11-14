// lib/validateRequest.ts - Request validation utilities
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function validateRequest<T>(
  req: Request,
  schema: z.Schema<T>,
): Promise<{ data: T | null; error: Response | null }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    /* Error handled silently */
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
            {
              error: 'Validation failed',
              details: error.issues,
            },
          { status: 400 },
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}

// Common validation schemas
export const applicationSchema = z.object({
  full_name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  program_interest: z.string().max(200).trim().optional(),
  referral_source: z.string().max(100).trim().optional(),
});
