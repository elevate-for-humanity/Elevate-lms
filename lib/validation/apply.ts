import { z } from 'zod';

export const ApplySchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  program: z.string().min(2, 'Please select a program'),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type ApplyInput = z.infer<typeof ApplySchema>;
