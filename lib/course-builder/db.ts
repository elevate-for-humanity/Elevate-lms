/**
 * lib/course-builder/db.ts
 * Service-role Supabase client for the course builder pipeline.
 */

import { requireAdminClient } from '@/lib/supabase/admin';

export async function getServiceDb() {
  return await requireAdminClient();
}
