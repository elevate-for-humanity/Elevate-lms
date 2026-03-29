import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await db
    .from('lms_lessons')
    .select('lesson_slug, video_url, content, lesson_source, step_type')
    .eq('course_id', '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0')
    .order('order_index');

  if (error) { console.error(error.message); process.exit(1); }

  const total       = data!.length;
  const has_video   = data!.filter(l => l.video_url).length;
  const has_content = data!.filter(l => l.content && l.content.length > 50).length;

  console.log(`Total lessons:  ${total}`);
  console.log(`Has video_url:  ${has_video} / ${total}`);
  console.log(`Has content:    ${has_content} / ${total}`);

  const missing = data!.filter(l => !l.video_url || !l.content || l.content.length <= 50);
  if (missing.length) {
    console.log(`\nMissing (${missing.length}):`);
    missing.forEach(l => console.log(
      `  ${(l.lesson_slug||'?').padEnd(25)} ${(l.step_type||'').padEnd(12)} video=${!!l.video_url} content=${!!(l.content&&l.content.length>50)}`
    ));
    process.exit(1);
  } else {
    console.log('\n✅ All lessons have video and content.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
