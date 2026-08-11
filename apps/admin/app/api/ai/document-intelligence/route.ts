import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { analyzeWorkforceDocument } from '@/lib/ai/document-intelligence';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv().catch((error) => {
    logger.warn('[document-intelligence] secret hydration failed; using runtime environment', {
      error: String(error),
    });
  });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Multipart form data is required.' }, { status: 400 });

  const file = form.get('file');
  const instructions = typeof form.get('instructions') === 'string'
    ? String(form.get('instructions')).trim()
    : '';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A document file is required.' }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Document must be between 1 byte and 15 MB.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported document type.' }, { status: 415 });
  }

  const startedAt = Date.now();
  try {
    const result = await analyzeWorkforceDocument({
      fileName: file.name,
      mimeType: file.type,
      bytes: Buffer.from(await file.arrayBuffer()),
      instructions,
    });

    const db: any = await requireAdminClient();
    await db.from('ai_gateway_logs').insert({
      request_id: crypto.randomUUID(),
      agent_type: 'ZORA',
      intent: 'COMPLIANCE',
      message: `Document intelligence: ${file.name}`,
      context: {
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        instructions: instructions.slice(0, 500),
      },
      response: {
        model: result.model,
        citation_count: result.citations.length,
        structured: Boolean(result.structured),
      },
      latency_ms: Date.now() - startedAt,
      status: 'success',
      actor_id: auth.id,
    });

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      analysis: result.structured ?? result.text,
      citations: result.citations,
      model: result.model,
      usage: result.usage,
      requiresHumanReview: true,
    });
  } catch (error) {
    logger.error('[document-intelligence] analysis failed', error instanceof Error ? error : undefined, {
      fileName: file.name,
      actorId: auth.id,
    });
    return NextResponse.json(
      { error: 'Document analysis could not be completed.' },
      { status: 502 },
    );
  }
}
