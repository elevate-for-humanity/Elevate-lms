export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { courseId, modules } = body;

    // Save or update course structure
    for (const module of modules) {
      // Upsert module
      const { data: moduleData, error: moduleError } = await db
        .from('modules')
        .upsert({
          id: module.id.startsWith('module-') ? undefined : module.id,
          course_id: courseId,
          title: module.title,
          description: module.description,
          order: module.order,
        })
        .select()
        .single();

      if (moduleError) throw moduleError;

      // Save lessons
      for (const lesson of module.lessons) {
        // LEGACY_SYSTEM_DISABLED — lesson writes must go through canonical course_lessons
        return NextResponse.json(
          { error: 'LEGACY_SYSTEM_DISABLED: use /api/admin/lms/courses/[courseId] for lesson authoring' },
          { status: 410 }
        );

        const { data: lessonData, error: lessonError } = await db
          .from('training_lessons')
          .upsert({
            id: lesson.id.startsWith('lesson-') ? undefined : lesson.id,
            module_id: moduleData.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
          })
          .select()
          .single();

        if (lessonError) throw lessonError;

        // Delete existing blocks for this lesson
        await db
          .from('lesson_content_blocks')
          .delete()
          .eq('lesson_id', lessonData.id);

        // Save content blocks
        if (lesson.blocks && lesson.blocks.length > 0) {
          const blocks = lesson.blocks.map(
            (block: Record<string, any>) => ({
              lesson_id: lessonData.id,
              block_type: block.type,
              block_order: block.order,
              content: block.content,
              settings: block.settings || {},
            })
          );

          const { error: blocksError } = await db
            .from('lesson_content_blocks')
            .insert(blocks);

          if (blocksError) throw blocksError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course saved successfully',
    });
  } catch (error) { 
    logger.error(
      'Error saving course:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to save course' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/courses/authoring/save', _POST);
