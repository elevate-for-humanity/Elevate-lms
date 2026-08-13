import { publicProgramHolderReviewDisabled } from '@/lib/program-holders/public-review-disabled';

// AUTH_EXEMPT: fail-closed tombstone; this route performs no approval mutation.
/** Public Marketing review mutation is closed; authenticated Admin owns approval. */
export async function POST() {
  return publicProgramHolderReviewDisabled('approval');
}
