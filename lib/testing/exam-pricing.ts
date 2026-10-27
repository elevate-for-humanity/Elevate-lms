import type { CertProvider, ExamDefinition } from './proctoring-capabilities';
import { isPublicTestingPriceVerified } from './public-pricing';

/** The catalog, provider page and checkout must display the same approved amount. */
export function getPublicExamAmountCents(
  provider: CertProvider,
  exam: string | ExamDefinition,
): number | null {
  if (!isPublicTestingPriceVerified(provider.key)) return null;
  if (
    typeof exam === 'object' &&
    Number.isSafeInteger(exam.amountCents) &&
    (exam.amountCents ?? 0) > 0
  )
    return exam.amountCents!;
  if (
    provider.fees?.length === 1 &&
    Number.isFinite(provider.fees[0].amount) &&
    provider.fees[0].amount > 0
  )
    return Math.round(provider.fees[0].amount * 100);
  return null;
}
