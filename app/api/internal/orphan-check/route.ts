/**
 * GET /api/internal/orphan-check
 *
 * Detects orphaned rows in pre-auth tables — rows written before user
 * authentication that were never linked to a user_id after account creation.
 *
 * Returns counts per table. Any linkable_rows > 0 is an actionable alert:
 * a real user exists but cannot see their own data.
 *
 * Secured by CRON_SECRET header. Called daily by Netlify scheduled function.
 * Can also be run manually from the Supabase SQL editor using:
 *   scripts/detect-orphaned-rows.sql
 *
 * Tables checked = PRE_AUTH_TABLES in lib/pre-auth-tables.ts.
 * Add new tables there, not here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { PRE_AUTH_TABLES } from '@/lib/pre-auth-tables';
import { logger } from '@/lib/logger';

import { hydrateProcessEnv } from '@/lib/secrets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TableOrphanResult {
  table: string;
  orphaned_rows: number;   // user_id IS NULL
  linkable_rows: number;   // user_id IS NULL AND matching profile exists
  status: 'OK' | 'REVIEW' | 'ACTION_REQUIRED';
}

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  // Require CRON_SECRET to prevent open access
  const secret = request.headers.get('x-cron-secret')
    ?? request.nextUrl.searchParams.get('secret');

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }

  const results: TableOrphanResult[] = [];
  let hasActionRequired = false;

  for (const config of PRE_AUTH_TABLES) {
    try {
      // Count rows with no user_id
      const { count: orphanedCount, error: e1 } = await db
        .from(config.table)
        .select('id', { count: 'exact', head: true })
        .is(config.userIdColumn, null);

      if (e1) {
        logger.error(`[orphan-check] count failed for ${config.table}`, e1.message);
        results.push({ table: config.table, orphaned_rows: -1, linkable_rows: -1, status: 'REVIEW' });
        continue;
      }

      const orphaned = orphanedCount ?? 0;

      if (orphaned === 0) {
        results.push({ table: config.table, orphaned_rows: 0, linkable_rows: 0, status: 'OK' });
        continue;
      }

      // Of those, how many have a matching profile (linkable)?
      const { data: orphanedRows, error: e2 } = await db
        .from(config.table)
        .select(`id, ${config.emailColumn}`)
        .is(config.userIdColumn, null)
        .not(config.emailColumn, 'is', null);

      if (e2) {
        results.push({ table: config.table, orphaned_rows: orphaned, linkable_rows: -1, status: 'REVIEW' });
        continue;
      }

      const emails = [...new Set(
        (orphanedRows ?? [])
          .map((r: Record<string, string>) => r[config.emailColumn]?.toLowerCase().trim())
          .filter(Boolean)
      )];

      let linkable = 0;
      if (emails.length > 0) {
        const { count: profileCount } = await db
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .in('email', emails);
        linkable = profileCount ?? 0;
      }

      const status: TableOrphanResult['status'] =
        linkable > 0 ? 'ACTION_REQUIRED' :
        orphaned > 0 ? 'REVIEW' : 'OK';

      if (status === 'ACTION_REQUIRED') hasActionRequired = true;

      results.push({ table: config.table, orphaned_rows: orphaned, linkable_rows: linkable, status });

    } catch (err: unknown) {
      logger.error(`[orphan-check] unexpected error for ${config.table}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      results.push({ table: config.table, orphaned_rows: -1, linkable_rows: -1, status: 'REVIEW' });
    }
  }

  if (hasActionRequired) {
    logger.error('[orphan-check] ACTION REQUIRED — linkable orphaned rows detected', { results });
  } else {
    logger.info('[orphan-check] all pre-auth tables clean', { results });
  }

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    all_clean: !hasActionRequired,
    results,
  }, {
    status: hasActionRequired ? 207 : 200,
  });
}
