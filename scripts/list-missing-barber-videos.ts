#!/usr/bin/env tsx
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

config({ path: path.resolve(process.cwd(), '.env.local') });

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const OUT_DIR = path.join(process.cwd(), 'public/videos/barber-lessons');

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const local = new Set(
    fs.existsSync(OUT_DIR)
      ? fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.mp4')).map((f) => f.replace(/\.mp4$/, ''))
      : [],
  );
  const { data, error } = await sb
    .from('course_lessons')
    .select('slug, video_url')
    .eq('course_id', COURSE_ID)
    .eq('status', 'published')
    .order('order_index');
  if (error) throw error;
  const rows = data ?? [];
  const missingLocal = rows.filter((r) => r.slug && !local.has(r.slug));
  const missingUrl = rows.filter((r) => !r.video_url);
  console.log(`Published lessons: ${rows.length}`);
  console.log(`Local MP4s: ${local.size}`);
  console.log(`\nMissing local file (${missingLocal.length}):`);
  missingLocal.forEach((r) => console.log(`  - ${r.slug}`));
  console.log(`\nMissing video_url in DB (${missingUrl.length}):`);
  missingUrl.forEach((r) => console.log(`  - ${r.slug}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
