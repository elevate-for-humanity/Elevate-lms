/**
 * Pre-auth table registry.
 *
 * Every table listed here accepts inserts before a user account exists
 * (public forms, payment webhooks). Each entry defines exactly how to
 * reconcile orphaned rows after the user authenticates.
 *
 * CONTROL REQUIREMENT:
 * If a route inserts into a table without user_id and that row is later
 * needed by an authenticated user, the table MUST be registered here.
 * Registration is the only way reconciliation runs. There is no other path.
 *
 * To add a new table:
 *   1. Add an entry to PRE_AUTH_TABLES below.
 *   2. Verify the table has an email column (or equivalent) to match on.
 *   3. Run the orphan detection query (scripts/detect-orphaned-rows.sql)
 *      against production before shipping.
 *
 * Write paths that currently produce pre-auth rows:
 *   program_enrollments  ← app/api/enrollment/submit/route.ts
 *   applications         ← app/api/apply/route.ts, app/api/apply/simple/route.ts
 *   barber_subscriptions ← app/api/barber/webhook/route.ts, app/api/sezzle/webhook/route.ts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export interface PreAuthTableConfig {
  /** DB table name */
  table: string;
  /** Column that holds the email used at insert time */
  emailColumn: string;
  /** Column that should be set to the user's profile id after auth */
  userIdColumn: string;
}

export const PRE_AUTH_TABLES: PreAuthTableConfig[] = [
  {
    table: 'program_enrollments',
    emailColumn: 'email',
    userIdColumn: 'user_id',
  },
  {
    table: 'applications',
    emailColumn: 'email',
    userIdColumn: 'user_id',
  },
  {
    table: 'barber_subscriptions',
    emailColumn: 'customer_email',
    userIdColumn: 'user_id',
  },
];

/**
 * Reconcile all pre-auth tables for a given email address.
 *
 * Called from auth/callback and auth/confirm immediately after the user
 * authenticates. Idempotent — safe to call multiple times.
 *
 * Returns a summary of what was linked per table.
 */
export async function reconcilePreAuthRows(
  supabase: SupabaseClient,
  email: string,
): Promise<Record<string, number>> {
  if (!email) return {};

  const normalizedEmail = email.toLowerCase().trim();
  const summary: Record<string, number> = {};

  // Resolve the profile id for this email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  if (profileError || !profile?.id) {
    // No profile yet — nothing to link. Not an error.
    return {};
  }

  for (const config of PRE_AUTH_TABLES) {
    try {
      const { data, error } = await supabase
        .from(config.table)
        .update({ [config.userIdColumn]: profile.id })
        .ilike(config.emailColumn, normalizedEmail)
        .is(config.userIdColumn, null)
        .select('id');

      if (error) {
        logger.error(`[pre-auth] reconcile failed for ${config.table}`, {
          email: normalizedEmail,
          error: error.message,
        });
        summary[config.table] = 0;
        continue;
      }

      const linked = data?.length ?? 0;
      summary[config.table] = linked;

      if (linked > 0) {
        logger.info(`[pre-auth] linked ${linked} row(s) in ${config.table}`, {
          userId: profile.id,
          email: normalizedEmail,
        });
      }
    } catch (err: unknown) {
      logger.error(`[pre-auth] unexpected error reconciling ${config.table}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      summary[config.table] = 0;
    }
  }

  return summary;
}
