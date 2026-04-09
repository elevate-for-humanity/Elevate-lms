/**
 * scripts/unpublish-module6-stubs.ts
 *
 * Sets is_published=false and status='draft' on all Module 6 stub rows.
 * Run before real content is deployed. Safe to re-run.
 */
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUGS = [
  'barber-lesson-35',
  'barber-lesson-36',
  'barber-lesson-37',
  'barber-lesson-38',
  'barber-module-6-checkpoint',
];

async function main() {
  console.log('Unpublishing Module 6 stub rows...\n');

  for (const slug of SLUGS) {
    const { data, error } = await supabase
      .from('course_lessons')
      .update({ is_published: false, status: 'draft' })
      .eq('course_id', '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17')
      .eq('slug', slug)
      .select('id, slug, is_published, status')
      .maybeSingle();

    if (error) {
      console.error(`✗ ${slug}: ${error.message}`);
    } else if (!data) {
      console.error(`✗ ${slug}: row not found`);
    } else {
      console.log(`✓ ${slug} → is_published=${data.is_published}, status=${data.status}`);
    }
  }

  console.log('\nDone. Module 6 rows are now draft and inaccessible to students.');
}

main().catch(e => { console.error(e); process.exit(1); });
