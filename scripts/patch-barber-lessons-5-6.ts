/**
 * Patch lessons 5-6 to 8q standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-lessons-5-6.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Lesson 5: Workplace Safety ───────────────────────────────────────────────
  'barber-lesson-5': [
    {
      id: 'mod1-l5-q5',
      type: 'multiple_choice',
      question: 'Which federal agency sets and enforces workplace safety standards for barbershops?',
      options: ['EPA', 'OSHA', 'FDA', 'CDC'],
      correctAnswer: 1,
      explanation: 'OSHA (Occupational Safety and Health Administration) sets and enforces workplace safety standards, including those applicable to barbershops — ventilation, chemical handling, and sharps disposal.',
    },
    {
      id: 'mod1-l5-q6',
      type: 'multiple_choice',
      question: 'A barber notices a frayed electrical cord on a clipper. What is the correct action?',
      options: [
        'Wrap the cord with electrical tape and continue using it',
        'Tag the clipper out of service and report it to the shop owner immediately',
        'Use the clipper only for short services until it can be replaced',
        'Unplug it between clients but continue using it',
      ],
      correctAnswer: 1,
      explanation: 'Frayed cords are an electrical hazard. The correct action is to immediately remove the tool from service and report it. Using a damaged tool — even briefly — violates OSHA electrical safety standards and creates liability.',
    },
    {
      id: 'mod1-l5-q7',
      type: 'multiple_choice',
      question: 'Sharps (used razor blades) must be disposed of in:',
      options: [
        'A sealed plastic bag in the regular trash',
        'A puncture-resistant sharps container',
        'The sink drain after rinsing',
        'A paper bag labeled "sharps"',
      ],
      correctAnswer: 1,
      explanation: 'Used razor blades are regulated sharps. They must be placed in a puncture-resistant, leak-proof sharps container — never loose in trash or down a drain. This protects staff, clients, and waste handlers from needlestick injuries.',
    },
    {
      id: 'mod1-l5-q8',
      type: 'multiple_choice',
      question: 'Which of the following is a common ergonomic hazard for barbers?',
      options: [
        'Standing on an anti-fatigue mat',
        'Prolonged standing with improper posture and repetitive arm elevation',
        'Using lightweight scissors',
        'Adjusting the chair height for each client',
      ],
      correctAnswer: 1,
      explanation: 'Barbers are at high risk for musculoskeletal disorders from prolonged standing, repetitive overhead arm movements, and static postures. Anti-fatigue mats, proper chair height, and scheduled breaks reduce this risk.',
    },
  ],

  // ── Lesson 6: Client Consultation ───────────────────────────────────────────
  'barber-lesson-6': [
    {
      id: 'mod1-l6-q6',
      type: 'multiple_choice',
      question: 'During a consultation, a client mentions they are on blood thinners. How does this affect your service plan?',
      options: [
        'No adjustment needed — blood thinners do not affect barbering services',
        'Avoid straight razor shaving — any nick will bleed significantly and clot slowly',
        'Refuse all services until the client stops medication',
        'Use only electric clippers and avoid all scissors',
      ],
      correctAnswer: 1,
      explanation: 'Blood thinners (anticoagulants) impair clotting. A minor nick from a straight razor can cause prolonged bleeding. The barber should avoid straight razor services and use extra care with any tool that contacts skin.',
    },
    {
      id: 'mod1-l6-q7',
      type: 'multiple_choice',
      question: 'What is the primary purpose of a client intake card?',
      options: [
        'To record the client\'s payment method',
        'To document health history, allergies, and service preferences for safe, personalized service',
        'To track how many times the client has visited',
        'To collect marketing contact information',
      ],
      correctAnswer: 1,
      explanation: 'An intake card documents health conditions, allergies, and contraindications that affect service safety. It also records preferences so each visit is consistent. It is a professional and legal protection tool.',
    },
    {
      id: 'mod1-l6-q8',
      type: 'multiple_choice',
      question: 'A new client asks for "a little off the top." What is the best next step?',
      options: [
        'Begin cutting — the instruction is clear enough',
        'Ask clarifying questions: show reference photos, confirm length in inches, and discuss texture and style goals',
        'Cut conservatively and ask for feedback after',
        'Refer the client to a more experienced barber',
      ],
      correctAnswer: 1,
      explanation: '"A little off the top" is subjective. A professional consultation uses reference photos and specific measurements to align expectations before any cutting begins. This prevents dissatisfaction and re-dos.',
    },
  ],
};

async function patchLesson(slug: string, extra: object[]) {
  console.log(`\nPatching ${slug}...`);
  const { data, error } = await db
    .from('course_lessons')
    .select('id, quiz_questions')
    .eq('course_id', COURSE_ID)
    .eq('slug', slug)
    .single();
  if (error || !data) { console.error(`  ✗ Not found: ${slug}`, error?.message); return; }
  const existing: any[] = Array.isArray(data.quiz_questions) ? data.quiz_questions : [];
  const existingIds = new Set(existing.map((q: any) => q.id));
  const toAdd = extra.filter((q: any) => !existingIds.has(q.id));
  if (toAdd.length === 0) { console.log(`  ✓ Already at standard (${existing.length}q)`); return; }
  const merged = [...existing, ...toAdd];
  const { error: err } = await db.from('course_lessons').update({ quiz_questions: merged, updated_at: new Date().toISOString() }).eq('id', data.id);
  if (err) { console.error(`  ✗ Update failed:`, err.message); } else { console.log(`  ✓ ${existing.length} → ${merged.length} questions`); }
}

for (const [slug, qs] of Object.entries(EXTRA)) await patchLesson(slug, qs);
console.log('\nDone.');
