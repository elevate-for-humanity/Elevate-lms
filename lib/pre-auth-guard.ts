/**
 * Pre-auth insert guard.
 *
 * USAGE IN HELPER FUNCTIONS
 *
 *   Any function that inserts into a pre-auth table MUST:
 *     1. Use insertWithPreAuthCheck() instead of .from().insert() directly
 *     2. Carry a @preAuthWrite annotation immediately above the function
 *
 *   // @preAuthWrite table=applications mode=reconcile
 *   export async function createApplication(supabase, data) {
 *     return insertWithPreAuthCheck(supabase, 'applications', data);
 *   }
 *
 * WHY BOTH ARE REQUIRED
 *   - The wrapper enforces at runtime — throws before touching the DB if the
 *     table is not registered. Catches bypasses that CI missed.
 *   - The annotation is read by the CI scanner to trace helper-mediated writes
 *     back to their table and validate registry coverage at build time.
 *   - Together they give layered enforcement: CI catches it first, runtime
 *     catches anything CI missed.
 *
 * DO NOT USE in authenticated-only routes — use .from().insert() directly
 * there. This wrapper implies pre-auth semantics. Using it in authenticated
 * paths is misleading and adds unnecessary overhead.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { ALL_REGISTERED_TABLES, PRE_AUTH_TABLES } from '@/lib/pre-auth-tables';
import { logger } from '@/lib/logger';

// ── Runtime assertion ─────────────────────────────────────────────────────────

/**
 * Assert that a table is registered in PRE_AUTH_TABLES.
 * Throws synchronously before any DB operation if not registered.
 */
export function assertPreAuthTable(table: string) {
  const entry = PRE_AUTH_TABLES.find(t => t.table === table);

  if (!entry) {
    const msg =
      `PRE_AUTH VIOLATION: Table "${table}" is not registered in PRE_AUTH_TABLES. ` +
      `Add it to lib/pre-auth-tables.ts before inserting.`;
    logger.error(msg);
    throw new Error(msg);
  }

  return entry;
}

// ── Wrapper functions ─────────────────────────────────────────────────────────

/**
 * Insert into a pre-auth table with registry validation.
 *
 * Throws PRE_AUTH VIOLATION synchronously if the table is not registered.
 * Returns the Supabase query builder so callers can chain .select(), .single(), etc.
 *
 * Use this in any function that may be called from a public (unauthenticated) route.
 * Annotate the calling function with: // @preAuthWrite table=<table> mode=<mode>
 */
export function insertWithPreAuthCheck<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  payload: T | T[],
) {
  assertPreAuthTable(table);
  return supabase.from(table).insert(payload as any);
}

/**
 * Upsert into a pre-auth table with registry validation.
 * Same contract as insertWithPreAuthCheck — returns the query builder.
 */
export function upsertWithPreAuthCheck<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  payload: T | T[],
  options?: { onConflict?: string; ignoreDuplicates?: boolean },
) {
  assertPreAuthTable(table);
  return supabase.from(table).upsert(payload as any, options);
}
