import { publicProgramHolderReviewDisabled } from '@/lib/program-holders/public-review-disabled';

// AUTH_EXEMPT: fail-closed tombstone; this route performs no rejection mutation.
/** Public Marketing review mutation is closed; authenticated Admin owns rejection. */
export async function POST() {
  return publicProgramHolderReviewDisabled('rejection');
}
