#!/usr/bin/env node
/** Upsert lms_progress for barber students missing it. */
import { createClient } from '@supabase/supabase-js';

const emails = process.argv.slice(2);
if (!emails.length) {
  console.error('Usage: fix-barber-lms-progress.mjs email [email...]');
  process.exit(1);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const now = new Date().toISOString();

for (const email of emails) {
  const { data: profile } = await db.from('profiles').select('id,full_name').eq('email', email).maybeSingle();
  if (!profile) {
    console.log(email, '— no profile');
    continue;
  }
  const { error } = await db.from('lms_progress').upsert(
    {
      user_id: profile.id,
      course_id: COURSE_ID,
      course_slug: 'barber-apprenticeship-v1',
      status: 'in_progress',
      progress_percent: 0,
      started_at: now,
      last_activity_at: now,
    },
    { onConflict: 'user_id,course_id' },
  );
  console.log(email, profile.full_name, error ? error.message : 'lms_progress ok');
}
