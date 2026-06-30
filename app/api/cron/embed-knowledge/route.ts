/**
 * GET /api/cron/embed-knowledge
 * Find knowledge base documents without embeddings and queue them for embedding.
 * Writes a platform event per document so the embedding worker can pick them up.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 20;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();

  // Find published knowledge docs that have no embedding yet
  const { data: docs, error } = await db
    .from('knowledge_documents')
    .select('id, title, content_hash')
    .eq('status', 'published')
    .is('embedded_at', null)
    .limit(BATCH_SIZE);

  if (error) {
    logger.error('[cron/embed-knowledge] DB error', { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = docs ?? [];
  let queued = 0;

  for (const doc of rows) {
    await emitEvent('knowledge.embed_requested', {
      document_id: doc.id,
      content_hash: doc.content_hash,
    }).catch((err) =>
      logger.error('[cron/embed-knowledge] Failed to emit embed event', { docId: doc.id, error: String(err) }),
    );
    queued++;
  }

  logger.info('[cron/embed-knowledge] queued for embedding', { queued });
  return NextResponse.json({ ok: true, queued });
});
