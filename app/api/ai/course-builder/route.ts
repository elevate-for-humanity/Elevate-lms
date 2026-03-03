import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { createClient } from '@/lib/supabase/server';
import { isOpenAIConfigured } from '@/lib/openai-client';
import { buildCourse } from '@/lib/autopilot/ai-course-builder';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'AI features not configured. Please set OPENAI_API_KEY.' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminCheck = await requireAdminRole();
  if (adminCheck) return adminCheck;

  const { title, topic, objectives = [], level } = await req.json();

  if (!title && !topic) {
    return NextResponse.json({ error: 'title or topic is required' }, { status: 400 });
  }

  const courseTitle = title || topic;
  const courseObjectives = objectives.length > 0
    ? objectives
    : [
        `Understand core concepts of ${courseTitle}`,
        `Apply ${courseTitle} skills in workforce settings`,
        `Demonstrate competency through assessments`,
        level ? `Achieve ${level}-level proficiency` : 'Meet industry certification standards',
      ].filter(Boolean);

  // 1. Create task record
  const { data: task } = await supabase.from('ai_generation_tasks').insert({
    task_type: 'course',
    status: 'running',
    input_config: { title: courseTitle, objectives: courseObjectives, level },
    created_by: user.id,
  }).select('id').single();

  try {
    // 2. Generate course
    const courseStructure = await buildCourse({
      title: courseTitle,
      objectives: courseObjectives,
    });

    const modulesCount = courseStructure.modules?.length || 0;
    const lessonsCount = courseStructure.modules?.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length || 0), 0
    ) || 0;

    // 3. Persist to course_generation_logs
    const { data: logEntry } = await supabase.from('course_generation_logs').insert({
      course_title: courseTitle,
      prompt: `Title: ${courseTitle}, Objectives: ${courseObjectives.join(', ')}`,
      generated_structure: courseStructure,
      modules_count: modulesCount,
      lessons_count: lessonsCount,
      created_by: user.id,
    }).select('id').single();

    // 4. Complete task
    if (task?.id) {
      await supabase.from('ai_generation_tasks').update({
        status: 'completed',
        output_result: { logId: logEntry?.id, modulesCount, lessonsCount },
        completed_at: new Date().toISOString(),
      }).eq('id', task.id);
    }

    return NextResponse.json({
      success: true,
      taskId: task?.id,
      logId: logEntry?.id,
      course: courseStructure,
    });
  } catch (error) {
    // Update task as failed
    if (task?.id) {
      await supabase.from('ai_generation_tasks').update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Generation failed',
        completed_at: new Date().toISOString(),
      }).eq('id', task.id);
    }
    logger.error('AI course builder error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate course' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/ai/course-builder', _POST);
