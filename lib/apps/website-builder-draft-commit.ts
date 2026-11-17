import { logger } from '@/lib/logger';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// This helper is server-only: callers must enforce canonical access and ownership.
export async function commitWebsiteDraft(admin: SupabaseClient<any>, args: {
  p_actor_id: string; p_website_id: string | null; p_expected_updated_at: string | null;
  p_site_name: string; p_template_id: string; p_site_config: unknown;
  p_plan: string; p_operation: 'initial_site_generation' | 'import'; p_charge_trial: boolean;
}) {
  const requestId = randomUUID();
  const params = { ...args, p_request_id: requestId };
  let result = await admin.rpc('commit_website_builder_draft', params);
  if (result.error && !result.error.code) result = await admin.rpc('commit_website_builder_draft', params);
  if (result.error) {
    // Log only bounded diagnostic identifiers. PostgreSQL messages/details may
    // contain customer values, so never serialize the raw error or RPC args.
    const code = /^[A-Z0-9]{5,12}$/.test(result.error.code || '') ? result.error.code : 'UNKNOWN';
    logger.error('[website-builder] Draft commit failed', { requestId, operation: args.p_operation, code });
  }
  return { ...result, requestId };
}
