import { publicProgramHolderReviewDisabled } from '@/lib/program-holders/public-review-disabled';

/** Public Marketing review mutation is closed; authenticated Admin owns rejection. */
export async function POST() {
  return publicProgramHolderReviewDisabled('rejection');
}
