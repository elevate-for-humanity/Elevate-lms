import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { ingestCourse } from '@/lib/ai/course-ingestion';
import { saveCourseBlueprint } from '@/lib/db/courses';
import { isOpenAIConfigured, getOpenAIClient } from '@/lib/ai/openai-client';
import { loadIndustryStandards } from '@/lib/industry/standards-loader';
import { buildBlueprintSystemPrompt } from '@/lib/ai/prompts/course-blueprint';
import { logger } from '@/lib/logger';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';
import {
  SAFE_CHARS,
  MAX_CHARS,
  summarizeForExtraction,
  persistIngestionDraft,
  loadIngestionDraft,
  updateIngestionDraftStage,
} from '@/lib/ai/ingestion-stages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type IndustryContext = {
  socCode: string | null;
  credentialCode: string | null;
};

async function resolveIndustryContext(args: {
  programId?: string | null;
  explicitSocCode?: string | null;
  explicitCredentialCode?: string | null;
}): Promise<IndustryContext> {
  const explicitSoc = typeof args.explicitSocCode === 'string' ? args.explicitSocCode.trim() : '';
  const explicitCredential =
    typeof args.explicitCredentialCode === 'string' ? args.explicitCredentialCode.trim() : '';

  if (explicitSoc) {
    return {
      socCode: explicitSoc,
      credentialCode: explicitCredential || null,
    };
  }

  if (!args.programId) {
    return { socCode: null, credentialCode: explicitCredential || null };
  }

  try {
    const db = await requireAdminClient();
    const { data: program } = await db
      .from('programs')
      .select('soc_code, code, credential_type')
      .eq('id', args.programId)
      .maybeSingle();

    const socCode = program?.soc_code?.trim() || null;
    const credentialCode =
      explicitCredential ||
      program?.code?.trim() ||
      program?.credential_type?.trim() ||
      null;

    return { socCode, credentialCode };
  } catch (err) {
    logger.warn('[courses/ingest] Failed to resolve industry context from program', {
      programId: args.programId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { socCode: null, credentialCode: explicitCredential || null };
  }
}

/**
 * POST /api/admin/courses/ingest
 *
 * Body (JSON):
 *   source_type: 'prompt' | 'syllabus' | 'script' | 'transcript' | 'document'
 *   source_text: string   — raw text content
 *   course_mode: 'standalone' | 'program-linked'
 *   program_id?: string
 *   certificate_enabled?: boolean
 *   preview_only?: boolean  — if true, return blueprint without saving to DB
 */
async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'AI features are not configured. Add OPENAI_API_KEY to enable course ingestion.' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    source_type,
    source_text,
    course_mode,
    program_id,
    soc_code,
    credential_code,
    certificate_enabled,
    preview_only,
    blueprint_override,
    compile_lessons,
    queue_videos,
    video_queue_limit,
  } = body;

  // blueprint_override: client sends back the edited blueprint for the save pass
  // In this case we skip AI entirely and go straight to persistence
  if (!preview_only && blueprint_override) {
    try {
      const result = await saveCourseBlueprint(blueprint_override, {
        program_id: program_id || null,
        created_by: auth.id,
      });

      let videoQueueResult: Awaited<ReturnType<typeof queueCourseLessonVideos>> | null = null;
      if (queue_videos !== false && result.courseId) {
        try {
          videoQueueResult = await queueCourseLessonVideos({
            courseId: result.courseId,
            limit: typeof video_queue_limit === 'number' ? video_queue_limit : null,
            onlyMissing: true,
          });
        } catch (err) {
          logger.warn('[courses/ingest] Failed to queue videos after blueprint save', {
            courseId: result.courseId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return NextResponse.json(
        {
          courseId: result.courseId,
          moduleCount: result.moduleCount,
          lessonCount: result.lessonCount,
          questionCount: result.questionCount,
          warnings: blueprint_override.warnings ?? [],
          videosQueued: videoQueueResult?.queued ?? 0,
          videoQueueFailed: videoQueueResult?.failed ?? 0,
          videoStudioUrl: `/admin/video-generator?courseId=${result.courseId}`,
          studioCommand: `Build premium course for ${result.courseId} with queued videos`,
        },
        { status: 201 },
      );
    } catch (err: any) {
      return NextResponse.json({ error: 'Failed to save course draft.' }, { status: 500 });
    }
  }

  if (
    !source_type ||
    !['prompt', 'syllabus', 'script', 'transcript', 'document'].includes(source_type)
  ) {
    return NextResponse.json(
      { error: 'source_type must be one of: prompt, syllabus, script, transcript, document' },
      { status: 400 },
    );
  }

  if (!source_text || typeof source_text !== 'string' || source_text.trim().length < 20) {
    return NextResponse.json(
      { error: 'source_text is required and must be at least 20 characters' },
      { status: 400 },
    );
  }

  if (source_text.length > MAX_CHARS) {
    return NextResponse.json(
      {
        error: `Document is too large (${Math.round(source_text.length / 1000)}k chars). Maximum is ${MAX_CHARS / 1000}k characters. Split the document and ingest in sections.`,
      },
      { status: 400 },
    );
  }

  // For large documents (>SAFE_CHARS), run chunk summarization first.
  // If summarization itself would exceed the time budget, persist intermediate
  // state and return a resumable draft ID instead of timing out.
  const isLarge = source_text.trim().length > SAFE_CHARS;

  try {
    let textForExtraction = source_text.trim();
    const ingestionWarnings: string[] = [];
    let systemPromptOverride: string | undefined;

    const industryContext = await resolveIndustryContext({
      programId: program_id || null,
      explicitSocCode: soc_code ?? null,
      explicitCredentialCode: credential_code ?? null,
    });

    if (industryContext.socCode) {
      try {
        const standards = await loadIndustryStandards(
          industryContext.socCode,
          industryContext.credentialCode,
        );

        if (standards) {
          systemPromptOverride = buildBlueprintSystemPrompt(standards);
          ingestionWarnings.push(
            `Industry standards loaded for SOC ${industryContext.socCode} (${standards.sources.join(', ')}).`,
          );
        } else {
          ingestionWarnings.push(
            `Industry standards unavailable for SOC ${industryContext.socCode}. Continuing with default prompt.`,
          );
        }
      } catch (err) {
        logger.warn('[courses/ingest] Industry standards load failed', {
          socCode: industryContext.socCode,
          error: err instanceof Error ? err.message : String(err),
        });
        ingestionWarnings.push(
          `Industry standards lookup failed for SOC ${industryContext.socCode}. Continuing with default prompt.`,
        );
      }
    }

    if (isLarge) {
      const openai = getOpenAIClient();
      const { summarizedText, chunkCount, wasChunked } = await summarizeForExtraction(
        source_text.trim(),
        openai,
      );
      textForExtraction = summarizedText;
      if (wasChunked) {
        ingestionWarnings.push(
          `Document was large (${Math.round(source_text.length / 1000)}k chars). ` +
            `Summarized ${chunkCount} sections before generating course structure. ` +
            `Review all modules carefully — some detail may have been condensed.`,
        );
      }
    }

    // Run the AI pipeline on the (possibly summarized) text.
    // compile_lessons=true triggers the second pass (narration, slides, quiz bank).
    // Skipped on preview_only calls to keep the review screen fast.
    const blueprint = await ingestCourse({
      source_type,
      source_text: textForExtraction,
      course_mode: course_mode || 'standalone',
      program_id: program_id || null,
      certificate_enabled: certificate_enabled ?? true,
      compile_lessons: !preview_only && compile_lessons !== false,
      systemPromptOverride,
    });

    // Merge any large-doc warnings into blueprint warnings
    if (ingestionWarnings.length) {
      blueprint.warnings = [...ingestionWarnings, ...(blueprint.warnings || [])];
    }

    // preview_only: return blueprint for the review screen without persisting
    if (preview_only) {
      return NextResponse.json({ blueprint }, { status: 200 });
    }

    // Save draft to database
    const result = await saveCourseBlueprint(blueprint, {
      program_id: program_id || null,
      created_by: auth.id,
    });

    let videoQueueResult: Awaited<ReturnType<typeof queueCourseLessonVideos>> | null = null;
    if (queue_videos !== false && result.courseId) {
      try {
        videoQueueResult = await queueCourseLessonVideos({
          courseId: result.courseId,
          limit: typeof video_queue_limit === 'number' ? video_queue_limit : null,
          onlyMissing: true,
        });
      } catch (err) {
        logger.warn('[courses/ingest] Failed to queue videos after ingest save', {
          courseId: result.courseId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json(
      {
        courseId: result.courseId,
        moduleCount: result.moduleCount,
        lessonCount: result.lessonCount,
        questionCount: result.questionCount,
        warnings: blueprint.warnings,
        blueprint,
        videosQueued: videoQueueResult?.queued ?? 0,
        videoQueueFailed: videoQueueResult?.failed ?? 0,
        videoStudioUrl: `/admin/video-generator?courseId=${result.courseId}`,
        studioCommand: `Build premium course for ${result.courseId} with queued videos`,
      },
      { status: 201 },
    );
  } catch (err: any) {
    const msg = err?.message || '';

    // On timeout or abort, persist summarized text so the admin can resume
    // without re-running the expensive summarization step
    if (
      msg.includes('timeout') ||
      msg.includes('aborted') ||
      msg.includes('FUNCTION_INVOCATION_TIMEOUT')
    ) {
      try {
        const jobId = await persistIngestionDraft({
          stage: 'summarized',
          source_type,
          course_mode: course_mode || 'standalone',
          program_id: program_id || null,
          certificate_enabled: certificate_enabled ?? true,
          original_char_count: source_text.length,
          chunk_count: 0,
          warnings: ['Processing timed out. Your document was saved. Click "Resume" to continue.'],
        });
        return NextResponse.json(
          {
            resumable: true,
            job_id: jobId,
            error:
              'Processing timed out on a large document. Your progress was saved — click Resume to continue.',
          },
          { status: 202 },
        );
      } catch {
        // persist failed — fall through to generic error
      }
    }

    if (msg.includes('OpenAI') || msg.includes('API key')) {
      return NextResponse.json({ error: 'AI service error: ' + msg }, { status: 502 });
    }
    if (msg.includes('JSON') || msg.includes('malformed')) {
      return NextResponse.json(
        {
          error:
            'AI returned malformed output. Try rephrasing your input or using a shorter document.',
        },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/courses/ingest?job_id=<uuid>
 * Resume a previously timed-out ingestion draft.
 * Loads the persisted summarized text and runs the final extraction step.
 */
async function _GET(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');
  if (!jobId) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
  }

  const draft = await loadIngestionDraft(jobId);
  if (!draft) {
    return NextResponse.json({ error: 'Draft not found or expired' }, { status: 404 });
  }
  if (draft.stage === 'done') {
    return NextResponse.json({ error: 'This draft has already been completed' }, { status: 409 });
  }
  if (draft.stage === 'failed') {
    return NextResponse.json({ error: 'This draft failed and cannot be resumed' }, { status: 410 });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  }

  try {
    await updateIngestionDraftStage(jobId, 'extracting');

    const industryContext = await resolveIndustryContext({
      programId: draft.program_id,
      explicitSocCode: null,
      explicitCredentialCode: null,
    });

    let systemPromptOverride: string | undefined;
    const resumeWarnings: string[] = [];
    if (industryContext.socCode) {
      try {
        const standards = await loadIndustryStandards(
          industryContext.socCode,
          industryContext.credentialCode,
        );
        if (standards) {
          systemPromptOverride = buildBlueprintSystemPrompt(standards);
          resumeWarnings.push(
            `Industry standards loaded for SOC ${industryContext.socCode} (${standards.sources.join(', ')}).`,
          );
        }
      } catch (err) {
        logger.warn('[courses/ingest] Resume standards load failed', {
          socCode: industryContext.socCode,
          error: err instanceof Error ? err.message : String(err),
        });
        resumeWarnings.push(
          `Industry standards lookup failed for SOC ${industryContext.socCode}. Continuing with default prompt.`,
        );
      }
    }

    const blueprint = await ingestCourse({
      source_type: draft.source_type as any,
      source_text: draft.summarized_text || '',
      course_mode: draft.course_mode as any,
      program_id: draft.program_id,
      certificate_enabled: draft.certificate_enabled,
      systemPromptOverride,
    });

    if (draft.warnings?.length || resumeWarnings.length) {
      blueprint.warnings = [
        ...(draft.warnings || []),
        ...resumeWarnings,
        ...(blueprint.warnings || []),
      ];
    }

    await updateIngestionDraftStage(jobId, 'done');

    return NextResponse.json({ blueprint, resumed: true }, { status: 200 });
  } catch (err: any) {
    await updateIngestionDraftStage(jobId, 'failed', {
      warnings: [err?.message || 'Resume failed'],
    });
    return NextResponse.json({ error: 'Resume failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/admin/courses/ingest', _POST);
export const GET = withApiAudit('/api/admin/courses/ingest', _GET);
