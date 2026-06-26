/**
 * scripts/migrate-barber-blueprint.ts
 * 
 * Migrates the structured barber blueprint from public/data to Supabase.
 * This ensures the Barber Course is "Fully Built Out" as the gold standard.
 * 
 * Usage: pnpm tsx scripts/migrate-barber-blueprint.ts
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BLUEPRINT_PATH = path.join(process.cwd(), 'public/data/barber-apprenticeship-blueprint.json');

async function main() {
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf-8'));
  console.log(`🚀 Migrating Blueprint: ${blueprint.credentialTitle}`);

  // 1. Ensure Course Exists
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .upsert({
      id: '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17', // Fixed ID from seed-lesson-30
      slug: blueprint.programSlug,
      title: blueprint.credentialTitle,
      description: 'Comprehensive Indiana Registered Barber Apprenticeship training.',
      is_published: true,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (courseErr) throw new Error(`Course Error: ${courseErr.message}`);
  console.log(`✅ Course synced: ${course.title}`);

  // 2. Sync Modules and Lessons
  for (const mod of blueprint.modules) {
    console.log(`   📦 Syncing Module: ${mod.title}...`);
    
    // Module record (assuming a course_modules table exists or is implied)
    // For this build, we map modules to lessons directly via metadata or grouping
    
    for (const lesson of mod.lessons) {
      const { error: lessonErr } = await supabase
        .from('course_lessons')
        .upsert({
          course_id: course.id,
          slug: lesson.slug,
          title: lesson.title,
          content: lesson.content,
          quiz_questions: lesson.quizQuestions,
          order_index: lesson.order,
          is_published: true,
          updated_at: new Date().toISOString(),
          passing_score: lesson.passingScore || 70
        }, { onConflict: 'course_id,slug' });

      if (lessonErr) {
        console.error(`      ❌ Error syncing lesson ${lesson.slug}: ${lessonErr.message}`);
      } else {
        console.log(`      ✅ Syncing lesson: ${lesson.title}`);
      }
    }
  }

  console.log('\n🏁 Migration complete! Barber course is now the Gold Standard.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
