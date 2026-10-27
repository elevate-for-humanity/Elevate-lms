import { z } from 'zod';

// A Refund Transfer provider and the office's fee-deposit account have different roles.
// Enrollment was selected by the owner; provider approval is not inferred from it.
export const TAX_PAYMENT_SETUP = {
  refundProvider: 'EPS Financial',
  officeDepositBank: 'Lili',
  officeLegalName: 'HOTT KAMODITTY',
  officeDba: 'Supersonic Fast Cash',
  approvalVerified: false,
} as const;

export const refundFeeScheduleSchema = z
  .object({
    version: z.string().trim().min(1).max(80),
    fees: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(100),
            amountCents: z.number().int().min(0).max(100_000),
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();
export type RefundFeeSchedule = z.infer<typeof refundFeeScheduleSchema>;

// Operator-verified merchant settlement configuration, held in the secret store.
// Never inherit the education platform's default merchant or bank account.
export const taxOfficePaymentProfileSchema = z
  .object({
    legalName: z.literal('HOTT KAMODITTY'),
    dba: z.literal('Supersonic Fast Cash'),
    depositBank: z.literal('Lili'),
    accountLast4: z.string().regex(/^\d{4}$/),
    settlementAccountReference: z.string().trim().min(1).max(150),
    verificationReference: z.string().trim().min(1).max(150),
    verifiedAt: z
      .string()
      .datetime()
      .refine((v) => new Date(v).getTime() <= Date.now()),
    quickbooksRealmId: z.string().regex(/^\d+$/),
  })
  .strict();
export function assertTaxOfficePaymentIdentity(
  profile: unknown,
  realmId: string,
  legalName: string,
  companyName: string,
) {
  const p = taxOfficePaymentProfileSchema.parse(profile);
  const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (
    p.quickbooksRealmId !== realmId ||
    normalize(legalName) !== normalize(p.legalName) ||
    ![normalize(p.legalName), normalize(p.dba)].includes(normalize(companyName))
  )
    throw Error('TAX_OFFICE_PAYMENT_ENTITY_MISMATCH');
  return p;
}

export function refundPaymentOptions(input: {
  federalRefundCents: number;
  softwareFeeCents: number;
  feeSchedule: RefundFeeSchedule | null;
}) {
  for (const amount of [input.federalRefundCents, input.softwareFeeCents]) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw Error('Invalid payment amount');
  }
  const schedule = input.feeSchedule && refundFeeScheduleSchema.parse(input.feeSchedule);
  const providerFeeCents = schedule
    ? schedule.fees.reduce((sum, fee) => sum + fee.amountCents, 0)
    : null;
  const totalFeesCents =
    providerFeeCents === null ? null : input.softwareFeeCents + providerFeeCents;
  const noFeeDue = input.softwareFeeCents === 0;
  const refundCanCoverFees =
    !noFeeDue && input.federalRefundCents > (totalFeesCents ?? input.softwareFeeCents);
  return {
    ...TAX_PAYMENT_SETUP,
    noFeeDue,
    upfrontAmountCents: input.softwareFeeCents,
    federalRefundCents: input.federalRefundCents,
    providerFeeCents,
    feeSchedule: schedule,
    totalFeesCents,
    estimatedNetRefundCents:
      totalFeesCents !== null && refundCanCoverFees
        ? input.federalRefundCents - totalFeesCents
        : null,
    canRequestRefundTransfer: refundCanCoverFees,
    // A request never authorizes disclosure, opens a bank account or proves eligibility.
    refundTransferOperational: false,
    reason: noFeeDue
      ? 'no_fee_due'
      : !refundCanCoverFees
        ? 'insufficient_refund'
        : !schedule
          ? 'provider_fee_quote_required'
          : 'provider_application_required',
  };
}
export type TaxPaymentOptions = ReturnType<typeof refundPaymentOptions>;
