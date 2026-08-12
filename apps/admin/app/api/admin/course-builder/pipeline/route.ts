/**
 * POST /api/admin/course-builder/pipeline
 *
 * Canonical flexible Course Factory endpoint.
 * Streams blueprint → lessons → assessments → validation → persistence → video progress via SSE.
 */
import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { runCoursePipeline } from '@/lib/course-factory/orchestrator';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: {
    title: string;
    topic: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    programId: string;
    programSlug?: string;
    moduleCount?: number;
    lessonsPerModule?: number;
    includeVideos?: boolean;
    dryRun?: boolean;
    complianceProfileKey?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!body.title || !body.topic || !body.programId) {
    return new Response(
      JSON.stringify({ error: 'title, topic, and programId are required' }),
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const db = await requireAdminClient();
        const result = await runCoursePipeline({
          title: body.title,
          topic: body.topic,
          difficulty: body.difficulty ?? 'intermediate',
          programId: body.programId,
          programSlug: body.programSlug,
          moduleCount: body.moduleCount,
          lessonsPerModule: body.lessonsPerModule,
          includeVideos: body.includeVideos ?? false,
          dryRun: body.dryRun ?? false,
          complianceProfileKey: body.complianceProfileKey,
          db,
          onProgress: (stage, message) => write({ stage, message }),
        });
        write({ stage: 'complete', result });
      } catch (error) {
        logger.error('[course-builder/pipeline] Pipeline error', error);
        write({
          stage: 'error',
          message: error instanceof Error ? error.message : 'Pipeline failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
