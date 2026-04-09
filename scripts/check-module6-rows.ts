import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const slugs = [
    'barber-lesson-35',
    'barber-lesson-36',
    'barber-lesson-37',
    'barber-lesson-38',
    'barber-module-6-checkpoint',
  ];

  const { data, error } = await supabase
    .from('course_lessons')
    .select('id, slug, title, lesson_type, is_published, status, module_id, content')
    .eq('course_id', '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17')
    .in('slug', slugs);

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  console.log(`\nFound ${data?.length ?? 0} of ${slugs.length} expected rows\n`);
  console.log('─'.repeat(100));

  for (const slug of slugs) {
    const row = data?.find(r => r.slug === slug);
    if (!row) {
      console.log(`✗ MISSING   ${slug}`);
    } else {
      console.log(`✓ EXISTS    ${slug}`);
      const contentLen = typeof row.content === 'string' ? row.content.length : 0;
      const contentPreview = typeof row.content === 'string' ? row.content.slice(0, 80).replace(/\n/g, ' ') : 'null';
      console.log(`            type=${row.lesson_type} | published=${row.is_published} | status=${row.status} | module_id=${row.module_id ?? 'null'}`);
      console.log(`            content: ${contentLen} chars — "${contentPreview}..."`);
    }
  }
  console.log('─'.repeat(100));
}

main().catch(e => { console.error(e); process.exit(1); });
