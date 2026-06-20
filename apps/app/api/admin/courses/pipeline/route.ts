/**
 * POST /api/admin/courses/pipeline
 *
 * Unified course generation pipeline endpoint.
 * Streams progress via SSE, runs all stages sequentially:
 *   blueprint → lessons → quizzes → publish
 *
 * Body: { title, topic, difficulty, programId, moduleCount?, lessonsPerModule?, includeVideos?, dryRun? }
 * Response: SSE stream of { stage, message } events, ending with { stage: 'complete', result }
 */

import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { runCoursePipeline } from '@/lib/course-builder/orchestrator';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — course generation is slow

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
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!body.title || !body.topic || !body.programId) {
    return new Response(JSON.stringify({ error: 'title, topic, and programId are required' }), { status: 400 });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const db = await requireAdminClient();

        // Resolve programSlug from the programs table if not supplied by the caller
        let programSlug = body.programSlug;
        if (!programSlug) {
          const { data: prog } = await db
            .from('programs')
            .select('slug')
            .eq('id', body.programId)
            .maybeSingle();
          programSlug = prog?.slug ?? undefined;
        }

        const result = await runCoursePipeline({
          title: body.title,
          topic: body.topic,
          difficulty: body.difficulty ?? 'intermediate',
          programId: body.programId,
          programSlug,
          moduleCount: body.moduleCount,
          lessonsPerModule: body.lessonsPerModule,
          includeVideos: body.includeVideos ?? false,
          dryRun: body.dryRun ?? false,
          db,
          onProgress: (stage, message) => {
            write({ stage, message });
          },
        });

        write({ stage: 'complete', result });
      } catch (err) {
        logger.error('[pipeline/route] Pipeline error', err);
        write({
          stage: 'error',
          message: err instanceof Error ? err.message : 'Pipeline failed',
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
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
