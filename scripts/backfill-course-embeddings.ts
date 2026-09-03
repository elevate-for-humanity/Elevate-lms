#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { embedCourseLessons } from '../lib/embeddings/embed-lessons';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: courses, error } = await db
    .from('courses')
    .select('id,slug,title,status,published_at')
    .or('published_at.not.is.null,status.eq.published')
    .order('created_at', { ascending: true });

  if (error) throw error;

  let embedded = 0;
  let skipped = 0;
  let errors = 0;

  for (const course of courses ?? []) {
    const result = await embedCourseLessons(db, course.id);
    embedded += result.embedded;
    skipped += result.skipped;
    errors += result.errors;
    console.log(
      `${course.slug || course.title || course.id}: embedded=${result.embedded} skipped=${result.skipped} errors=${result.errors}`,
    );
  }

  const { count, error: countError } = await db
    .from('course_embeddings')
    .select('id', { count: 'exact', head: true });
  if (countError) throw countError;

  console.log(
    JSON.stringify(
      {
        courses_scanned: courses?.length ?? 0,
        embedded,
        skipped,
        errors,
        total_course_embeddings: count ?? 0,
      },
      null,
      2,
    ),
  );

  if (errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
