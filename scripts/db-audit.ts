import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('/workspaces/Elevate-lms/.env.local', 'utf8');
const getEnv = (key: string) => {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')!;
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key);

const CODE_TABLES = [
  'profiles','programs','courses','course_modules','course_lessons','curriculum_lessons',
  'training_courses','training_lessons','training_enrollments','program_enrollments',
  'applications','certificates','payments','lms_lessons','modules','lesson_progress',
  'checkpoint_scores','step_submissions','completion_rules','program_completion_certificates',
  'exam_funding_authorizations','shop_products','orders','order_items',
  'mentorships','mentor_sessions','onboarding_progress','orientation_completions',
  'student_interventions','at_risk_students','program_outcomes','program_credentials',
  'program_phases','program_modules','program_lessons','program_ctas','program_tracks',
  'program_media','credentials','exam_bookings','testing_slots','announcements',
  'notifications','user_achievements','badges','leaderboard','quiz_attempts',
  'quiz_questions','quizzes','assignments','assignment_submissions','cohorts',
  'cohort_enrollments','cohort_sessions','grants','grant_applications','wioa_applications',
  'wioa_participants','jri_participants','apprenticeship_programs','apprentice_placements',
  'apprentice_documents','apprentice_skills','apprentice_progress','barber_payments',
  'barber_subscriptions','barbershop_partner_applications','shop_profiles','shops',
  'tax_clients','tax_returns','tax_filings','franchise_offices','franchise_clients',
  'refund_advance_applications','cash_advances','licenses','license_purchases',
  'tenants','tenant_billing','store_products','purchases','promo_codes',
  'email_campaigns','email_logs','crm_contacts','crm_leads','crm_deals',
  'job_postings','job_applications','employer_profiles','employers',
  'partner_profiles','partners','program_holders','program_holder_documents',
  'mou_signatures','mous','documents','document_signatures','ferpa_documents',
  'audit_logs','webhook_events_processed','stripe_webhook_events',
  'user_lesson_attempts','video_generation_jobs','generated_images','tts_audio_files'
];

async function run() {
  const missing: string[] = [];
  const exists: string[] = [];
  const errors: {table: string, msg: string}[] = [];

  for (const table of CODE_TABLES) {
    const { error } = await db.from(table as any).select('id').limit(1);
    if (!error) {
      exists.push(table);
    } else if (error.code === '42P01' || error.message.includes('does not exist')) {
      missing.push(table);
    } else {
      errors.push({ table, msg: error.message });
    }
  }

  console.log(`\nEXISTS (${exists.length}):`);
  exists.forEach(t => console.log(`  OK  ${t}`));
  console.log(`\nMISSING (${missing.length}):`);
  missing.forEach(t => console.log(`  !!  ${t}`));
  console.log(`\nERRORS (${errors.length}):`);
  errors.forEach(e => console.log(`  ??  ${e.table}: ${e.msg}`));
}

run().catch(console.error);
