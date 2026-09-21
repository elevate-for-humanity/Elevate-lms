/**
 * Canonical Retail Industry Fundamentals build.
 * Creates/repairs exactly one Elevate-authored retail course from the registered
 * blueprint. Media remains queued for the canonical Course Builder/Envato flow.
 */
import 'dotenv/config';
import { requireAdminClient } from '../../lib/supabase/admin';
import { courseBuilderController } from '../../lib/devstudio/course-builder-controller';
import { retailIndustryFundamentalsBlueprint } from '../../lib/curriculum/blueprints/retail-industry-fundamentals';

const PROGRAM_SLUG = 'retail-industry-fundamentals';
const COURSE_SLUG = 'retail-industry-fundamentals';

async function main() {
  const db = await requireAdminClient();
  const { data: program, error: programError } = await db
    .from('programs')
    .select('id,slug,title')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();

  if (programError) throw programError;
  if (!program) {
    throw new Error(
      `Program '${PROGRAM_SLUG}' is not present in the canonical programs table. Create/approve the program record before building course content.`,
    );
  }

  const { data: existing, error: courseError } = await db
    .from('courses')
    .select('id,slug,title,status')
    .eq('program_id', program.id)
    .eq('slug', COURSE_SLUG)
    .maybeSingle();
  if (courseError) throw courseError;

  const result = await courseBuilderController({
    courseId: existing?.id,
    programId: program.id,
    blueprint: retailIndustryFundamentalsBlueprint,
    mode: existing ? 'refresh' : 'create',
    contentSource: 'ai',
    videoMode: 'queue',
  });

  if (!result.ok || !result.courseId) {
    throw new Error(`Retail Course Builder failed: ${(result.errors ?? []).join(' | ') || 'unknown error'}`);
  }

  const [{ count: modules }, { count: lessons }] = await Promise.all([
    db.from('course_modules').select('id', { count: 'exact', head: true }).eq('course_id', result.courseId),
    db.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', result.courseId),
  ]);

  if (modules !== retailIndustryFundamentalsBlueprint.expectedModuleCount) {
    throw new Error(`Retail module count mismatch: ${modules}/${retailIndustryFundamentalsBlueprint.expectedModuleCount}`);
  }
  if (lessons !== retailIndustryFundamentalsBlueprint.expectedLessonCount) {
    throw new Error(`Retail lesson count mismatch: ${lessons}/${retailIndustryFundamentalsBlueprint.expectedLessonCount}`);
  }

  console.log(JSON.stringify({
    ok: true,
    courseId: result.courseId,
    slug: COURSE_SLUG,
    modules,
    lessons,
    status: 'media_queued',
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
