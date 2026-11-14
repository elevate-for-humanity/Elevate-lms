import { createPublicClient } from '@/lib/supabase/public';

/** Static reads use the same real configuration and error semantics as public reads. */
export const createStaticClient = createPublicClient;
