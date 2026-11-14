import { z } from 'zod';

// IRS Form W-9, Rev. March 2024. Keep certification separate from other agreements.
export const W9_CERTIFICATION = [
  'Under penalties of perjury, I certify that:',
  '1. The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me); and',
  '2. I am not subject to backup withholding because (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am no longer subject to backup withholding; and',
  '3. I am a U.S. citizen or other U.S. person (defined below); and',
  '4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.',
];
export const W9_CERTIFICATION_INSTRUCTIONS =
  'You must cross out item 2 above if you have been notified by the IRS that you are currently subject to backup withholding because you have failed to report all interest and dividends on your tax return. For real estate transactions, item 2 does not apply. For mortgage interest paid, acquisition or abandonment of secured property, cancellation of debt, contributions to an individual retirement arrangement (IRA), and, generally, payments other than interest and dividends, you are not required to sign the certification, but you must provide your correct TIN. See the instructions for Part II of IRS Form W-9.';
const text = (max = 150) => z.string().trim().min(1).max(max);
export const w9Schema = z
  .object({
    legalName: text(),
    businessName: z.string().trim().max(150),
    classification: z.enum([
      'individual',
      'c_corp',
      's_corp',
      'partnership',
      'trust',
      'llc',
      'other',
    ]),
    llcClass: z.enum(['', 'C', 'S', 'P']),
    otherClass: z.string().trim().max(100),
    foreignOwners: z.boolean(),
    exemptPayee: z
      .string()
      .trim()
      .max(5)
      .regex(/^(?:[1-9]|1[0-3])?$/),
    fatca: z
      .string()
      .trim()
      .max(5)
      .regex(/^[A-Ma-m]?$/),
    address: text(200),
    cityStateZip: text(150),
    accounts: z.string().trim().max(150),
    tinType: z.enum(['ssn', 'ein']),
    tin: z
      .string()
      .transform((s) => s.replace(/[-\s]/g, ''))
      .pipe(
        z
          .string()
          .regex(/^\d{9}$/)
          .refine((s) => !/^0+$/.test(s), 'Enter your correct nine-digit TIN.'),
      ),
    backupWithholding: z.boolean(),
    usPerson: z.literal(true),
    signature: text(150),
    certified: z.literal(true),
  })
  .superRefine((value, ctx) => {
    if (value.classification === 'llc' && !value.llcClass)
      ctx.addIssue({
        code: 'custom',
        path: ['llcClass'],
        message: 'Select the LLC federal tax classification.',
      });
    if (value.classification === 'other' && !value.otherClass)
      ctx.addIssue({
        code: 'custom',
        path: ['otherClass'],
        message: 'Describe your federal tax classification.',
      });
    if (
      value.foreignOwners &&
      !(
        value.classification === 'partnership' ||
        value.classification === 'trust' ||
        (value.classification === 'llc' && value.llcClass === 'P')
      )
    )
      ctx.addIssue({
        code: 'custom',
        path: ['foreignOwners'],
        message: 'Check IRS line 3b applicability.',
      });
  });
export type W9Values = z.infer<typeof w9Schema>;
