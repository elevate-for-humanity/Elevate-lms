import { getVerifiedProgramFunding } from './funding-registry';

const FUNDING_TERMS =
  /\b(?:WIOA|WRG|Workforce Ready Grant|Next Level Jobs|Job Ready Indy|JRI|FSSA|IMPACT|SNAP E&T|ETPL|funded|funding|no[- ]cost|free tuition|pay \$0)\b/i;
const GUARANTEE_TERMS =
  /(?:\b(?:free|fully funded|full tuition|100%|pay \$0|no[- ]cost|guaranteed|most students pay)\b|\$0\b|\bcovers?\s+(?:tuition|books?|exam|fees?|physical)\b)/i;
const UNSUPPORTED_SOURCE_TERMS = /\b(?:Job Ready Indy|JRI|FSSA|IMPACT|SNAP E&T)\b/i;

function sentenceParts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function sanitizePublicFundingText(
  text: string | null | undefined,
  slug: string,
  fallback = '',
): string {
  if (!text?.trim()) return fallback;
  const verified = getVerifiedProgramFunding(slug);

  const safe = sentenceParts(text).filter((sentence) => {
    if (!FUNDING_TERMS.test(sentence)) return true;
    if (!verified) return false;
    if (GUARANTEE_TERMS.test(sentence) || UNSUPPORTED_SOURCE_TERMS.test(sentence)) return false;
    if (
      !verified.wrgEligible &&
      /\b(?:WRG|Workforce Ready Grant|Next Level Jobs)\b/i.test(sentence)
    ) {
      return false;
    }
    return verified.wioaEligible || verified.wrgEligible;
  });

  return safe.join(' ').trim() || fallback;
}

export function sanitizePublicFundingList(
  values: readonly string[] | null | undefined,
  slug: string,
): string[] {
  return (values ?? []).map((value) => sanitizePublicFundingText(value, slug)).filter(Boolean);
}
