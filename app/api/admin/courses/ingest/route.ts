import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { ingestCourse } from '@/lib/ai/course-ingestion';
import { saveCourseBlueprint } from '@/lib/db/courses';
import { isOpenAIConfigured, getOpenAIClient } from '@/lib/openai-client';
import { withRuntime } from '@/lib/api/withRuntime';
import {
  SAFE_CHARS, MAX_CHARS,
  summarizeForExtraction,
  persistIngestionDraft,
  loadIngestionDraft,
  updateIngestionDraftStage,
} from '@/lib/ai/ingestion-stages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdmin() {
  const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile };
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

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'AI features are not configured. Add OPENAI_API_KEY to enable course ingestion.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    source_type, source_text, course_mode, program_id,
    certificate_enabled, preview_only, blueprint_override,
    compile_lessons,
  } = body;

  // blueprint_override: client sends back the edited blueprint for the save pass
  // In this case we skip AI entirely and go straight to persistence
  if (!preview_only && blueprint_override) {
    try {
      const result = await saveCourseBlueprint(blueprint_override, {
        program_id: program_id || null,
        created_by: auth.profile.id,
      });
      return NextResponse.json(
        {
          courseId: result.courseId,
          moduleCount: result.moduleCount,
          lessonCount: result.lessonCount,
          questionCount: result.questionCount,
          warnings: blueprint_override.warnings ?? [],
        },
        { status: 201 }
      );
    } catch (err: any) {
      return NextResponse.json({ error: 'Failed to save course draft.' }, { status: 500 });
    }
  }

  if (!source_type || !['prompt', 'syllabus', 'script', 'transcript', 'document'].includes(source_type)) {
    return NextResponse.json(
      { error: 'source_type must be one of: prompt, syllabus, script, transcript, document' },
      { status: 400 }
    );
  }

  if (!source_text || typeof source_text !== 'string' || source_text.trim().length < 20) {
    return NextResponse.json(
      { error: 'source_text is required and must be at least 20 characters' },
      { status: 400 }
    );
  }

  if (source_text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Document is too large (${Math.round(source_text.length / 1000)}k chars). Maximum is ${MAX_CHARS / 1000}k characters. Split the document and ingest in sections.` },
      { status: 400 }
    );
  }

  // For large documents (>SAFE_CHARS), run chunk summarization first.
  // If summarization itself would exceed the time budget, persist intermediate
  // state and return a resumable draft ID instead of timing out.
  const isLarge = source_text.trim().length > SAFE_CHARS;

  try {
    let textForExtraction = source_text.trim();
    const ingestionWarnings: string[] = [];

    if (isLarge) {
      const openai = getOpenAIClient();
      const { summarizedText, chunkCount, wasChunked } = await summarizeForExtraction(
        source_text.trim(),
        openai
      );
      textForExtraction = summarizedText;
      if (wasChunked) {
        ingestionWarnings.push(
          `Document was large (${Math.round(source_text.length / 1000)}k chars). ` +
          `Summarized ${chunkCount} sections before generating course structure. ` +
          `Review all modules carefully — some detail may have been condensed.`
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
      compile_lessons: !preview_only && (compile_lessons !== false),
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
      created_by: auth.profile.id,
    });

    return NextResponse.json(
      {
        courseId: result.courseId,
        moduleCount: result.moduleCount,
        lessonCount: result.lessonCount,
        questionCount: result.questionCount,
        warnings: blueprint.warnings,
        blueprint,
      },
      { status: 201 }
    );
  } catch (err: any) {
    const msg = err?.message || '';

    // On timeout or abort, persist summarized text so the admin can resume
    // without re-running the expensive summarization step
    if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('FUNCTION_INVOCATION_TIMEOUT')) {
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
            error: 'Processing timed out on a large document. Your progress was saved — click Resume to continue.',
          },
          { status: 202 }
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
        { error: 'AI returned malformed output. Try rephrasing your input or using a shorter document.' },
        { status: 422 }
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
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

    const blueprint = await ingestCourse({
      source_type: draft.source_type as any,
      source_text: draft.summarized_text || '',
      course_mode: draft.course_mode as any,
      program_id: draft.program_id,
      certificate_enabled: draft.certificate_enabled,
    });

    if (draft.warnings?.length) {
      blueprint.warnings = [...draft.warnings, ...(blueprint.warnings || [])];
    }

    await updateIngestionDraftStage(jobId, 'done');

    return NextResponse.json({ blueprint, resumed: true }, { status: 200 });
  } catch (err: any) {
    await updateIngestionDraftStage(jobId, 'failed', { warnings: [err?.message || 'Resume failed'] });
    return NextResponse.json({ error: 'Resume failed' }, { status: 500 });
  }
}

export const POST = withRuntime(withApiAudit('/api/admin/courses/ingest', _POST));
export const GET = withRuntime(withApiAudit('/api/admin/courses/ingest', _GET));
