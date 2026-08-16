/**
 * POST /api/admin/course-builder/pipeline
 *
 * Canonical Course Factory endpoint.
 * The route only handles auth/rate limiting/SSE transport. All generation,
 * validation, persistence, assessments and media orchestration belong to
 * lib/course-factory/factory.ts.
 */
import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { courseFactory } from '@/lib/course-factory';
import type { FactoryStage } from '@/lib/course-factory';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type PipelineStage =
  | 'blueprint'
  | 'lessons'
  | 'quizzes'
  | 'validate'
  | 'publish'
  | 'videos'
  | 'complete'
  | 'error';

function toPipelineStage(stage: FactoryStage): PipelineStage {
  if (stage === 'enrich') return 'lessons';
  if (stage === 'assess') return 'quizzes';
  if (stage === 'media') return 'videos';
  if (stage === 'validate') return 'validate';
  if (stage === 'publish') return 'publish';
  if (stage === 'complete') return 'complete';
  if (stage === 'error') return 'error';
  return 'blueprint';
}

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
    credential?: string;
    state?: string;
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
        const result = await courseFactory(
          {
            title: body.title,
            topic: body.topic,
            difficulty: body.difficulty ?? 'intermediate',
            programId: body.programId,
            programSlug: body.programSlug,
            moduleCount: body.moduleCount,
            lessonsPerModule: body.lessonsPerModule,
            credential: body.credential,
            state: body.state,
            contentSource: 'ai',
            mode: 'replace',
            videoMode: body.includeVideos === false ? 'off' : 'queue',
            dryRun: Boolean(body.dryRun),
          },
          (stage, message, progress) =>
            write({ stage: toPipelineStage(stage), message, progress }),
        );

        write({
          stage: 'complete',
          result: {
            success: result.ok,
            courseId: result.courseId ?? null,
            title: result.title ?? body.title,
            modulesGenerated: result.moduleCount ?? 0,
            lessonsGenerated: result.lessonCount ?? 0,
            lessonsWithQuizzes: result.assessmentsGenerated ?? 0,
            videosQueued: result.videosQueued ?? 0,
            errors: result.errors ?? [],
            dryRun: Boolean(result.dryRun),
          },
        });
      } catch (error) {
        logger.error('[course-builder/pipeline] Course Factory error', error);
        write({ stage: 'error', message: 'Course Factory failed. Review server logs for details.' });
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
