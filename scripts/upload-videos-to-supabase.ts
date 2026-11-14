#!/usr/bin/env tsx
/**
 * Uploads all generated lesson videos to Supabase course-videos bucket.
 * Updates video_url in course_lessons to the public CDN URL.
 * Run: pnpm tsx --env-file=.env.local scripts/upload-videos-to-supabase.ts
 */
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DIRS: { dir: string; prefix: string; table: string; courseId?: string }[] = [
  {
    dir: path.join(process.cwd(), 'public/videos/barber-lessons'),
    prefix: 'barber',
    table: 'course_lessons',
    courseId: BARBER_COURSE_ID,
  },
];

async function main() {
  for (const { dir, prefix, table, courseId } of DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`Skipping ${dir} — not found`);
      continue;
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mp4'));
    console.log(`\nUploading ${files.length} videos from ${path.basename(dir)}...\n`);

    for (const file of files) {
      const slug = file.replace('.mp4', '');
      const storagePath = `${prefix}/${file}`;
      process.stdout.write(`  ${file}...`);

      const fileData = fs.readFileSync(path.join(dir, file));
      const { error: upErr } = await sb.storage
        .from('course-videos')
        .upload(storagePath, fileData, { contentType: 'video/mp4', upsert: true });

      if (upErr) {
        process.stdout.write(` ❌ ${upErr.message}\n`);
        continue;
      }

      const { data: urlData } = sb.storage.from('course-videos').getPublicUrl(storagePath);
      let updateQuery = sb.from(table).update({ video_url: urlData.publicUrl }).eq('slug', slug);
      if (courseId) {
        updateQuery = updateQuery.eq('course_id', courseId);
      }
      const { error: dbErr } = await updateQuery;

      if (dbErr) process.stdout.write(` ❌ DB: ${dbErr.message}\n`);
      else process.stdout.write(` ✅\n`);
    }
  }
  console.log('\nAll done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
