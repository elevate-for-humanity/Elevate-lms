/**
 * Studio AI Tool Definitions + Executors
 *
 * Tools the AI can call to operate on a course.
 * Each tool has:
 *   - An OpenAI function definition (for the chat API)
 *   - An executor function (runs the actual DB operation)
 *
 * Execution happens server-side via POST /api/admin/studio/tool-execute.
 * The AI panel receives tool_call events in the SSE stream and dispatches them.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── OpenAI tool definitions ──────────────────────────────────────────────────

export const STUDIO_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'createLesson',
      description: 'Create a new lesson in the course curriculum. Use when the user asks to add a lesson, generate a lesson, or build out a module.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Lesson title' },
          module_id: { type: 'string', description: 'UUID of the module this lesson belongs to. Use the module IDs from the course context.' },
          lesson_type: {
            type: 'string',
            enum: ['lesson', 'quiz', 'checkpoint', 'lab', 'assignment', 'exam'],
            description: 'Type of lesson. Use checkpoint for end-of-module assessments, exam for final assessments.',
          },
          content: { type: 'string', description: 'Lesson content in HTML or plain text. Include learning objectives, key concepts, and summary.' },
          learning_objectives: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of learning objectives for this lesson',
          },
          duration_minutes: { type: 'number', description: 'Estimated duration in minutes' },
          passing_score: { type: 'number', description: 'Required for quiz/checkpoint/exam types. Percentage 0-100.' },
        },
        required: ['title', 'lesson_type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generateQuiz',
      description: 'Generate quiz questions for a lesson and save them. Use when the user asks to create a quiz, add questions, or generate an assessment.',
      parameters: {
        type: 'object',
        properties: {
          lesson_id: { type: 'string', description: 'UUID of the lesson to attach questions to' },
          questions: {
            type: 'array',
            description: 'Array of quiz questions',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' }, description: '4 answer choices' },
                correct_answer: { type: 'string', description: 'The correct answer text (must match one of the options)' },
                explanation: { type: 'string', description: 'Why this answer is correct' },
              },
              required: ['question', 'options', 'correct_answer'],
            },
          },
        },
        required: ['lesson_id', 'questions'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'attachVideo',
      description: 'Attach a video URL to a lesson. Use when the user asks to add a video or link media to a lesson.',
      parameters: {
        type: 'object',
        properties: {
          lesson_id: { type: 'string', description: 'UUID of the lesson' },
          video_url: { type: 'string', description: 'URL of the video to attach' },
          video_title: { type: 'string', description: 'Title/description of the video' },
        },
        required: ['lesson_id', 'video_url'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'publishCourse',
      description: 'Publish the current course, making it available to learners. Only call this when the user explicitly asks to publish.',
      parameters: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Optional version label, e.g. "v1.0"' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateCourseTitle',
      description: 'Update the course title or description.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'New course title' },
          description: { type: 'string', description: 'New course description' },
          short_description: { type: 'string', description: 'Short summary (1-2 sentences)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'createModule',
      description: 'Create a new module in the course. Use when the user asks to add a module or section.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Module title' },
          description: { type: 'string', description: 'Module description' },
          order_index: { type: 'number', description: 'Position in the course (1-based). Omit to append at end.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'buildCourseFromBlueprint',
      description: 'Build a complete course from a known blueprint — generates all modules and lessons automatically. Use when the user asks to build, generate, or create a full course (e.g. "Build HVAC certification course", "Generate EPA 608 course").',
      parameters: {
        type: 'object',
        properties: {
          blueprint_id: {
            type: 'string',
            enum: [
              'hvac-epa608-v1',
              'bookkeeping-quickbooks-v1',
              'ccma-v1',
              'cdl-class-a-v1',
              'cna-indiana-v1',
              'crs-indiana',
              'electrical-v1',
              'entrepreneurship-v1',
              'it-help-desk-v1',
              'medical-assistant-v1',
              'peer-recovery-specialist-in-v1',
              'plumbing-v1',
              'prs-indiana',
              'welding-v1',
            ],
            description: 'The blueprint to build from. Use the exact ID string.',
          },
          mode: {
            type: 'string',
            enum: ['append', 'replace'],
            description: 'append = add missing modules/lessons only. replace = wipe and rebuild. Default: append.',
          },
        },
        required: ['blueprint_id'],
      },
    },
  },
] as const;

export type StudioToolName = typeof STUDIO_TOOLS[number]['function']['name'];

// ─── Tool result type ─────────────────────────────────────────────────────────

export interface ToolResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ─── Executors ────────────────────────────────────────────────────────────────

export async function executeStudioTool(
  toolName: StudioToolName,
  args: Record<string, unknown>,
  courseId: string,
  userId: string,
  db: SupabaseClient,
): Promise<ToolResult> {
  switch (toolName) {
    case 'createLesson':
      return executeCreateLesson(args, courseId, db);
    case 'generateQuiz':
      return executeGenerateQuiz(args, db);
    case 'attachVideo':
      return executeAttachVideo(args, db);
    case 'publishCourse':
      return executePublishCourse(args, courseId, userId, db);
    case 'updateCourseTitle':
      return executeUpdateCourseTitle(args, courseId, db);
    case 'createModule':
      return executeCreateModule(args, courseId, db);
    case 'buildCourseFromBlueprint':
      return executeBuildCourseFromBlueprint(args, courseId, db);
    default:
      return { ok: false, message: `Unknown tool: ${toolName}` };
  }
}

async function executeCreateLesson(
  args: Record<string, unknown>,
  courseId: string,
  db: SupabaseClient,
): Promise<ToolResult> {
  // Derive order_index from existing lesson count
  const { count } = await db
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const slug = String(args.title ?? 'lesson')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) + `-${(count ?? 0) + 1}`;

  const row: Record<string, unknown> = {
    course_id: courseId,
    module_id: args.module_id ?? null,
    title: args.title,
    slug,
    lesson_type: args.lesson_type ?? 'lesson',
    content: args.content ?? null,
    learning_objectives: args.learning_objectives ?? null,
    duration_minutes: args.duration_minutes ?? null,
    passing_score: args.passing_score ?? null,
    order_index: (count ?? 0) + 1,
    is_published: false,
    status: 'draft',
  };

  const { data, error } = await db
    .from('course_lessons')
    .insert(row)
    .select('id, title, lesson_type, order_index')
    .single();

  if (error) return { ok: false, message: `Failed to create lesson: ${error.message}` };

  // Trigger embedding in background (non-blocking)
  import('@/lib/embeddings/embed-lessons').then(({ embedCourseLessons }) => {
    embedCourseLessons(db, courseId, { force: false }).catch(() => {/* non-fatal */});
  }).catch(() => {/* non-fatal */});

  return {
    ok: true,
    message: `Created lesson "${data.title}" (${data.lesson_type})`,
    data: { lessonId: data.id, title: data.title, lesson_type: data.lesson_type },
  };
}

async function executeGenerateQuiz(
  args: Record<string, unknown>,
  db: SupabaseClient,
): Promise<ToolResult> {
  const questions = args.questions as Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }>;

  if (!questions?.length) return { ok: false, message: 'No questions provided' };

  const { error } = await db
    .from('course_lessons')
    .update({ quiz_questions: questions })
    .eq('id', args.lesson_id);

  if (error) return { ok: false, message: `Failed to save quiz: ${error.message}` };
  return {
    ok: true,
    message: `Saved ${questions.length} quiz questions to lesson`,
    data: { lessonId: args.lesson_id, questionCount: questions.length },
  };
}

async function executeAttachVideo(
  args: Record<string, unknown>,
  db: SupabaseClient,
): Promise<ToolResult> {
  const { error } = await db
    .from('course_lessons')
    .update({ video_url: args.video_url })
    .eq('id', args.lesson_id);

  if (error) return { ok: false, message: `Failed to attach video: ${error.message}` };
  return {
    ok: true,
    message: `Attached video to lesson`,
    data: { lessonId: args.lesson_id, videoUrl: args.video_url },
  };
}

async function executePublishCourse(
  args: Record<string, unknown>,
  courseId: string,
  userId: string,
  db: SupabaseClient,
): Promise<ToolResult> {
  // Delegate to the canonical publish service
  const { publishCourse } = await import('@/lib/lms/course-service');
  try {
    await publishCourse(db, courseId, userId, String(args.label ?? ''));
    return { ok: true, message: 'Course published successfully', data: { courseId } };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Publish failed' };
  }
}

async function executeUpdateCourseTitle(
  args: Record<string, unknown>,
  courseId: string,
  db: SupabaseClient,
): Promise<ToolResult> {
  const patch: Record<string, unknown> = {};
  if (args.title) patch.title = args.title;
  if (args.description) patch.description = args.description;
  if (args.short_description) patch.short_description = args.short_description;

  if (!Object.keys(patch).length) return { ok: false, message: 'No fields to update' };

  const { error } = await db.from('courses').update(patch).eq('id', courseId);
  if (error) return { ok: false, message: `Failed to update course: ${error.message}` };
  return { ok: true, message: 'Course updated', data: patch };
}

async function executeBuildCourseFromBlueprint(
  args: Record<string, unknown>,
  courseId: string,
  db: SupabaseClient,
): Promise<ToolResult> {
  const blueprintId = String(args.blueprint_id ?? 'hvac-epa608-v1');
  const mode = String(args.mode ?? 'append');

  // Load the blueprint
  const { getBlueprintById } = await import('@/lib/curriculum/blueprints/index');
  const blueprint = await getBlueprintById(blueprintId);
  if (!blueprint) return { ok: false, message: `Blueprint "${blueprintId}" not found` };

  if (mode === 'replace') {
    // Wipe existing modules and lessons for this course
    await db.from('course_lessons').delete().eq('course_id', courseId);
    await db.from('course_modules').delete().eq('course_id', courseId);
  }

  // Get existing modules to avoid duplicates in append mode
  const { data: existingModules } = await db
    .from('course_modules')
    .select('title, order_index')
    .eq('course_id', courseId);
  const existingTitles = new Set((existingModules ?? []).map((m: { title: string }) => m.title));

  let modulesCreated = 0;
  let lessonsCreated = 0;

  for (const mod of blueprint.modules ?? []) {
    if (mode === 'append' && existingTitles.has(mod.title)) continue;

    const { data: modRow, error: modErr } = await db
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: mod.title,
        slug: mod.slug,
        order_index: mod.orderIndex ?? modulesCreated + 1,
        is_published: false,
      })
      .select('id')
      .single();

    if (modErr || !modRow) continue;
    modulesCreated++;

    // Insert lessons for this module
    const lessons = (mod.lessons ?? []).map((lesson: {
      title: string;
      slug: string;
      order: number;
      passingScore?: number;
      durationMinutes?: number;
    }) => ({
      course_id: courseId,
      module_id: modRow.id,
      title: lesson.title,
      slug: lesson.slug,
      // Infer lesson_type from slug suffix (matches blueprint engine convention)
      lesson_type: lesson.slug.endsWith('-checkpoint') ? 'checkpoint'
        : lesson.slug.endsWith('-exam') ? 'exam'
        : lesson.slug.endsWith('-lab') ? 'lab'
        : lesson.slug.endsWith('-quiz') ? 'quiz'
        : 'lesson',
      order_index: lesson.order,
      passing_score: lesson.passingScore ?? null,
      duration_minutes: lesson.durationMinutes ?? null,
      is_published: false,
      status: 'draft',
    }));

    if (lessons.length) {
      const { error: lessonErr } = await db.from('course_lessons').insert(lessons);
      if (!lessonErr) lessonsCreated += lessons.length;
    }
  }

  // Trigger embedding in background (non-blocking)
  import('@/lib/embeddings/embed-lessons').then(({ embedCourseLessons }) => {
    embedCourseLessons(db, courseId, { force: true }).catch(() => {/* non-fatal */});
  }).catch(() => {/* non-fatal */});

  return {
    ok: true,
    message: `Built course from blueprint "${blueprintId}": ${modulesCreated} modules, ${lessonsCreated} lessons created`,
    data: { blueprintId, modulesCreated, lessonsCreated, mode },
  };
}

async function executeCreateModule(
  args: Record<string, unknown>,
  courseId: string,
  db: SupabaseClient,
): Promise<ToolResult> {
  const { count } = await db
    .from('course_modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const slug = String(args.title ?? 'module')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const { data, error } = await db
    .from('course_modules')
    .insert({
      course_id: courseId,
      title: args.title,
      description: args.description ?? null,
      slug,
      order_index: args.order_index ?? (count ?? 0) + 1,
      is_published: false,
    })
    .select('id, title, order_index')
    .single();

  if (error) return { ok: false, message: `Failed to create module: ${error.message}` };
  return {
    ok: true,
    message: `Created module "${data.title}"`,
    data: { moduleId: data.id, title: data.title },
  };
}
