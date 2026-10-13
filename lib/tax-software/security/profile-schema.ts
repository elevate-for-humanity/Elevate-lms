import { z } from 'zod';
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid calendar date');
const person = z.object({
  firstName: z.string().trim().min(1).max(20),
  lastName: z.string().trim().min(1).max(30),
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/),
  birthDate: calendarDate.refine(
    (v) => v <= new Date().toISOString().slice(0, 10),
    'Birth date cannot be in the future',
  ),
});
export const taxPrivateProfileSchema = z
  .object({
    profile: person.extend({
      address: z.object({
        line1: z.string().trim().min(1).max(35),
        line2: z.string().trim().max(35).optional(),
        city: z.string().trim().min(1).max(22),
        state: z.string().regex(/^[A-Z]{2}$/),
        zip: z.string().regex(/^\d{5}(?:-?\d{4})?$/),
      }),
      occupation: z.string().trim().max(35).optional(),
      spouse: person.optional(),
    }),
    signature: z.object({
      taxpayerPin: z
        .string()
        .regex(/^\d{5}$/)
        .refine((v) => v !== '00000'),
      spousePin: z
        .string()
        .regex(/^\d{5}$/)
        .refine((v) => v !== '00000')
        .optional(),
      signatureDate: calendarDate.refine(
        (v) => v <= new Date().toISOString().slice(0, 10),
        'Signature date cannot be in the future',
      ),
      priorYearAgi: z.number().finite(),
      spousePriorYearAgi: z.number().finite().optional(),
      authorizationRecorded: z.literal(true),
    }),
    refundAllocations: z
      .array(
        z.object({
          amount: z.number().int().positive(),
          routingNumber: z.string().regex(/^\d{9}$/),
          accountNumber: z.string().regex(/^\d{1,17}$/),
          accountType: z.enum(['checking', 'savings']),
        }),
      )
      .max(3)
      .optional(),
  })
  .strict();
export type TaxPrivateProfile = z.infer<typeof taxPrivateProfileSchema>;
