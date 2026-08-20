import { NextRequest, NextResponse } from 'next/server';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { generateBlueprintFromAI } from '@/lib/course-factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function internalCaller(request: NextRequest): boolean {
  const configured = process.env.INTERNAL_API_KEY;
  const supplied = request.headers.get('x-internal-key');
  return Boolean(configured && supplied && supplied === configured);
}

/**
 * Compatibility adapter for Admin AI.
 *
 * This endpoint does not persist course records and does not implement a second
 * course builder. It delegates draft structure generation to Course Factory's
 * canonical AI blueprint generator. Persistence must cross courseFactory().
 */
export async function POST(request: NextRequest) {
  if (!internalCaller(request)) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const topic =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : title;
  const audience =
    typeof body.audience === 'string' && body.audience.trim()
      ? body.audience.trim()
      : 'adult workforce learners';
  const moduleCount = Number.isFinite(Number(body.modules)) ? Number(body.modules) : 5;
  const lessonsPerModule = Number.isFinite(Number(body.lessons_per_module))
    ? Number(body.lessons_per_module)
    : 3;

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (moduleCount < 1 || moduleCount > 40) {
    return NextResponse.json({ error: 'modules must be between 1 and 40' }, { status: 400 });
  }
  if (lessonsPerModule < 1 || lessonsPerModule > 20) {
    return NextResponse.json({ error: 'lessons_per_module must be between 1 and 20' }, { status: 400 });
  }

  const blueprint = await generateBlueprintFromAI({
    title,
    topic,
    audience,
    moduleCount,
    lessonsPerModule,
  });

  let lessonNumber = 0;
  const modules = blueprint.modules.map((courseModule, moduleIndex) => ({
    title: courseModule.title,
    description: courseModule.description,
    sort_order: moduleIndex + 1,
    lessons: courseModule.lessons.map((lesson) => {
      lessonNumber += 1;
      return {
        lesson_number: lessonNumber,
        title: lesson.title,
        description: '',
        content: '',
        duration_minutes: 30,
        step_type: lesson.stepType || 'lesson',
        slug: lesson.slug,
        quiz_questions: [],
      };
    }),
  }));

  return NextResponse.json({
    course: {
      title: blueprint.title,
      subtitle: topic,
      description: blueprint.description,
      audience,
      category: 'workforce',
      passing_score: 80,
      completion_rule: 'all_lessons',
      modules,
      generation_authority: 'course-factory',
      persistence_authority: 'courseFactory()',
      draft_only: true,
    },
  });
}
