import type { createClient } from '@/lib/supabase/server';
import { prepareStoredFederalReturn2026 } from '../calculation/financial-inputs';
import type { FilingStatus } from '../calculation/ty2026-base-1040';
import { taxReturnSourceDigest } from '../security/return-digest';
import { deriveInterviewTriggers } from '../paris-interview';
import { quoteSelfFile } from '../self-file-pricing';
import { refundPaymentOptions, type RefundFeeSchedule } from '../refund-payment';

export async function loadTaxCheckoutOffer(
  db: Awaited<ReturnType<typeof createClient>>,
  returnId: string,
  userId: string,
  feeSchedule: RefundFeeSchedule | null,
) {
  const { data: record, error } = await db
    .from('tax_returns')
    .select('id,filing_status,tax_year,status,return_json,updated_at')
    .eq('id', returnId)
    .eq('created_by_user_id', userId)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) throw Error('RETURN_READ_FAILED');
  if (!record) return null;
  if (Number(record.tax_year) !== 2026) throw Error('UNSUPPORTED_YEAR');
  const sources = await Promise.all([
    db.from('tax_w2_income').select('*').eq('tax_return_id', returnId),
    db
      .from('tax_1099_income')
      .select('form_type,amount,federal_withholding')
      .eq('tax_return_id', returnId),
    db.from('tax_schedule_c').select('*').eq('tax_return_id', returnId),
    db
      .from('tax_itemized_deductions')
      .select('total_itemized')
      .eq('tax_return_id', returnId)
      .maybeSingle(),
  ]);
  if (sources.some((source) => source.error)) throw Error('SOURCE_READ_FAILED');
  const [{ data: wages }, { data: income }, { data: business }, { data: itemized }] = sources;
  const w2 = wages ?? [],
    income1099 = income ?? [],
    scheduleC = business ?? [];
  const prepared = prepareStoredFederalReturn2026({
    filingStatus: record.filing_status as FilingStatus,
    extra: record.return_json?.federalInputs,
    w2,
    income1099,
    scheduleC,
    itemized: itemized ?? null,
  });
  const sourceDigest = taxReturnSourceDigest({
    filingStatus: record.filing_status,
    supportingDocuments: record.return_json?.irsSupportingDocuments ?? {},
    extra: record.return_json?.federalInputs ?? {},
    w2,
    income1099,
    scheduleC,
    itemized: itemized ?? null,
  });
  // Checkout must use the reviewed calculation, not a client-supplied refund.
  if (record.return_json?.calculation?.sourceDigest !== sourceDigest) throw Error('RECALCULATE');
  const f = prepared.financial;
  const answers = record.return_json?.interview?.answers ?? {};
  const credits = prepared.creditInputs;
  const triggers = deriveInterviewTriggers({
    ...answers,
    hasSelfEmployment: answers.hasSelfEmployment === true || prepared.needsScheduleC,
    itemizes: answers.itemizes === true || Number(f.itemizedDeductions ?? 0) > 0,
    hasEducationExpenses:
      answers.hasEducationExpenses === true ||
      Boolean(
        credits.educationCreditInputs &&
        (credits.educationCreditInputs.lifetimeLearningExpenses > 0 ||
          credits.educationCreditInputs.qualifiedAmericanOpportunityExpenses.some(
            (amount) => amount > 0,
          )),
      ),
    hasDependentCare:
      answers.hasDependentCare === true ||
      Number(credits.dependentCareInputs?.qualifiedExpenses ?? 0) > 0,
  });
  const quote = quoteSelfFile(triggers);
  const options = refundPaymentOptions({
    federalRefundCents: Math.round(prepared.calculation.refundAmount * 100),
    softwareFeeCents: Math.round(quote.total * 100),
    feeSchedule,
  });
  const quoteDigest = taxReturnSourceDigest({ sourceDigest, quote, options });
  return { record, quote, options, quoteDigest };
}
