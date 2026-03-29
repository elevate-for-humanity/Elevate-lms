/**
 * scripts/preview-lesson-content.ts
 * Prints rendered script_text for sample HVAC lessons to stdout.
 * Usage: pnpm tsx scripts/preview-lesson-content.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await db
    .from('curriculum_lessons')
    .select('lesson_slug, lesson_title, step_type, lesson_order, script_text')
    .eq('program_id', '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7')
    .order('lesson_order');

  if (error) { console.error(error.message); process.exit(1); }

  for (const l of data!) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`LESSON ${l.lesson_order}: ${l.lesson_title} [${l.step_type}]`);
    console.log(`${'─'.repeat(80)}`);
    console.log(l.script_text ?? '(empty)');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
