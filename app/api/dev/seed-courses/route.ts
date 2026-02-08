
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { programSeeds } from '../../../../lms-data/courseSeed';
import { logger } from '@/lib/logger';


// WARNING: This is a dev/ops endpoint. In production, restrict or remove it.
export async function POST() {
  const supabase = getSupabaseServerClient();

  const results: { programCode: string; programId?: string; error?: string }[] =
    [];

  for (const seed of programSeeds) {
    try {
      // 1) Ensure program exists (by code)
      const { data: existingProgram, error: programSelectError } =
        await supabase
          .from('programs')
          .select('id')
          .eq('code', seed.code)
          .maybeSingle();

      if (programSelectError) throw programSelectError;

      let programId = existingProgram?.id as string | undefined;

      if (!programId) {
        const { data: inserted, error: programInsertError } = await supabase
          .from('programs')
          .insert({
            code: seed.code,
            name: seed.name,
            category: seed.category,
            description: seed.description ?? null,
          })
          .select('id')
          .maybeSingle();

        if (programInsertError) throw programInsertError;
        programId = inserted?.id;
      }

      if (!programId) {
        throw new Error('Unable to resolve programId for ' + seed.code);
      }

      // 2) Clear existing modules/lessons for this program
      const { data: existingModules, error: modulesSelectError } =
        await supabase
          .from('course_modules')
          .select('id')
          .eq('program_id', programId);

      if (modulesSelectError) throw modulesSelectError;

      const moduleIds = (existingModules ?? []).map((m) => m.id);

      if (moduleIds.length > 0) {
        const { error: lessonsDeleteError } = await supabase
          .from('course_lessons')
          .delete()
          .in('module_id', moduleIds);

        if (lessonsDeleteError) throw lessonsDeleteError;

        const { error: modulesDeleteError } = await supabase
          .from('course_modules')
          .delete()
          .eq('program_id', programId);

        if (modulesDeleteError) throw modulesDeleteError;
      }

      // 3) Insert modules & lessons
      for (const moduleSeed of seed.modules) {
        const { data: insertedModule, error: moduleInsertError } =
          await supabase
            .from('course_modules')
            .insert({
              program_id: programId,
              title: moduleSeed.title,
              description: moduleSeed.description ?? null,
              order_index: moduleSeed.orderIndex ?? 0,
            })
            .select('id')
            .maybeSingle();

        if (moduleInsertError) throw moduleInsertError;

        const moduleId = insertedModule?.id as string | undefined;
        if (!moduleId) {
          throw new Error('Unable to get moduleId for ' + moduleSeed.title);
        }

        const lessonRows =
          moduleSeed.lessons?.map((lesson, idx) => ({
            module_id: moduleId,
            title: lesson.title,
            content_type: lesson.contentType,
            content_url: lesson.contentUrl ?? null,
            duration_minutes: lesson.durationMinutes ?? null,
            order_index: idx + 1,
          })) ?? [];

        if (lessonRows.length > 0) {
          const { error: lessonsInsertError } = await supabase
            .from('course_lessons')
            .insert(lessonRows);

          if (lessonsInsertError) throw lessonsInsertError;
        }
      }

      results.push({ programCode: seed.code, programId });
    } catch (err: any) {
      logger.error('Seed error for program', seed.code, err?.message ?? err);
      results.push({
        programCode: seed.code,
        error: err?.message ?? 'Unknown error',
      });
    }
  }

  const successCount = results.filter((r) => !r.error).length;

  return NextResponse.json(
    {
      ok: true,
      summary: {
        processed: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
      },
      details: results,
    },
    { status: 200 }
  );
}
