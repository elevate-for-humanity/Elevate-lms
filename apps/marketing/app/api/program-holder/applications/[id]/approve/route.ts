import { publicProgramHolderReviewDisabled } from '@/lib/program-holders/public-review-disabled';

/** Public Marketing review mutation is closed; authenticated Admin owns approval. */
export async function POST() {
  return publicProgramHolderReviewDisabled('approval');
}
