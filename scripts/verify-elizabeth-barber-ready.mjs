#!/usr/bin/env node
/**
 * Verify barber apprentice portal prerequisites for a student email.
 *   pnpm tsx --env-file=.env.local scripts/verify-elizabeth-barber-ready.mjs [email]
 */
import { createClient } from '@supabase/supabase-js';

const EMAIL = process.argv[2] || 'elizabethpowell6262@gmail.com';
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) process.exit(1);

const db = createClient(url, key);

const { data: profile } = await db.from('profiles').select('id,role,email,full_name').eq('email', EMAIL).maybeSingle();
if (!profile) {
  console.log(JSON.stringify({ ok: false, blockers: ['no profile for email'], email: EMAIL }, null, 2));
  process.exit(1);
}

const userId = profile.id;

const { data: apRes } = await db
  .from('apprentices')
  .select('id,shop_id,status')
  .eq('user_id', userId)
  .maybeSingle();

const shopId = apRes?.shop_id ?? null;

const [lessonsRes, courseRes, peRes, sitesRes, shopRes, progressRes, lmsRes, firstLesson] =
  await Promise.all([
    db.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', COURSE_ID),
    db.from('courses').select('id,title,status').eq('id', COURSE_ID).maybeSingle(),
    db
      .from('program_enrollments')
      .select('enrollment_state,orientation_completed_at,course_id,access_granted_at')
      .eq('user_id', userId)
      .eq('program_slug', 'barber-apprenticeship')
      .maybeSingle(),
    shopId
      ? db
          .from('apprentice_sites')
          .select('id,name,is_active,latitude,longitude,radius_meters')
          .eq('shop_id', shopId)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
    shopId ? db.from('shops').select('id,name').eq('id', shopId).maybeSingle() : Promise.resolve({ data: null }),
    db
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .eq('completed', true),
    db
      .from('lms_progress')
      .select('status,progress_percent')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .maybeSingle(),
    db
      .from('course_lessons')
      .select('id,title,order_index')
      .eq('course_id', COURSE_ID)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

const workbookHref = firstLesson.data
  ? `/lms/courses/${COURSE_ID}/lessons/${firstLesson.data.id}?activity=reading`
  : `/lms/courses/${COURSE_ID}`;

const blockers = [];
if (!peRes.data) blockers.push('missing program_enrollments');
if (!apRes) blockers.push('missing apprentices row');
if (!apRes?.shop_id) blockers.push('apprentice has no shop_id');
if ((sitesRes.data?.length ?? 0) === 0) blockers.push('no active apprentice_sites for shop');
if ((lessonsRes.count ?? 0) === 0) blockers.push('barber course has no lessons');
if (courseRes.data?.status !== 'published') blockers.push(`course status=${courseRes.data?.status}`);
if (!lmsRes.data) blockers.push('missing lms_progress');

console.log(
  JSON.stringify(
    {
      ok: blockers.length === 0,
      blockers,
      profile,
      course: courseRes.data,
      publishedLessons: lessonsRes.count,
      workbookHref,
      firstLesson: firstLesson.data?.title,
      enrollment: peRes.data,
      apprentice: apRes,
      shop: shopRes.data,
      clockInSites: sitesRes.data,
      lmsProgress: lmsRes.data,
      completedLessons: progressRes.count,
    },
    null,
    2,
  ),
);

process.exit(blockers.length === 0 ? 0 : 1);
