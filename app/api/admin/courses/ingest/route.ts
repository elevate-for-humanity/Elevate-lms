import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { ingestCourse } from '@/lib/ai/course-ingestion';
import { saveCourseBlueprint } from '@/lib/db/courses';
import { isOpenAIConfigured } from '@/lib/openai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// AI calls can take up to 60s on large documents
export const maxDuration = 60;

async function requireAdmin() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return { error: 'Database unavailable', status: 500 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await db
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

  if (source_text.length > 80000) {
    return NextResponse.json(
      { error: 'source_text exceeds 80,000 character limit. Split the document and ingest in sections.' },
      { status: 400 }
    );
  }

  try {
    // Run the AI pipeline
    const blueprint = await ingestCourse({
      source_type,
      source_text: source_text.trim(),
      course_mode: course_mode || 'standalone',
      program_id: program_id || null,
      certificate_enabled: certificate_enabled ?? true,
    });

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
    // Surface AI-specific errors clearly
    const msg = err?.message || '';
    if (msg.includes('OpenAI') || msg.includes('API key')) {
      return NextResponse.json({ error: 'AI service error: ' + msg }, { status: 502 });
    }
    if (msg.includes('JSON')) {
      return NextResponse.json(
        { error: 'AI returned malformed output. Try rephrasing your input or using a shorter document.' },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/admin/courses/ingest', _POST);
