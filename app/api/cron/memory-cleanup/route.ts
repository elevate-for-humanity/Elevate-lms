/**
 * GET /api/cron/memory-cleanup
 * Purge AI conversation memory older than 90 days and orphaned embeddings.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEMORY_TTL_DAYS = 90;
const EMBEDDING_TTL_DAYS = 180;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const memoryCutoff = new Date(Date.now() - MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const embeddingCutoff = new Date(Date.now() - EMBEDDING_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Delete stale AI conversation memory
  const { error: memErr, count: memDeleted } = await db
    .from('ai_conversation_memory')
    .delete({ count: 'exact' })
    .lt('created_at', memoryCutoff);

  if (memErr) {
    logger.error('[cron/memory-cleanup] Failed to purge conversation memory', { error: memErr.message });
  }

  // Delete orphaned knowledge embeddings (no parent document)
  const { error: embErr, count: embDeleted } = await db
    .from('knowledge_embeddings')
    .delete({ count: 'exact' })
    .lt('created_at', embeddingCutoff)
    .is('document_id', null);

  if (embErr) {
    logger.error('[cron/memory-cleanup] Failed to purge orphaned embeddings', { error: embErr.message });
  }

  const result = { memoryDeleted: memDeleted ?? 0, embeddingsDeleted: embDeleted ?? 0 };
  logger.info('[cron/memory-cleanup] purged', result);
  return NextResponse.json({ ok: true, ...result });
});
