/**
 * Patch lessons 46-49 (Exam Prep) to 8q standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-lessons-46-49.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Lesson 46: Indiana State Board Exam Overview ─────────────────────────────
  'barber-lesson-46': [
    {
      id: 'mod8-l46-q6',
      type: 'multiple_choice',
      question: 'How many hours of apprenticeship training are required to sit for the Indiana barber exam?',
      options: ['1,000 hours', '1,500 hours', '2,000 hours', '500 hours'],
      correctAnswer: 2,
      explanation: 'Indiana requires 2,000 hours of apprenticeship training under a licensed barber before a candidate is eligible to sit for the state board exam. This is one of the higher hour requirements nationally.',
    },
    {
      id: 'mod8-l46-q7',
      type: 'multiple_choice',
      question: 'The Indiana barber state board exam consists of which two components?',
      options: [
        'Written theory exam and oral interview',
        'Written theory exam and practical skills exam',
        'Practical skills exam and portfolio review',
        'Online exam and in-person demonstration',
      ],
      correctAnswer: 1,
      explanation: 'The Indiana barber exam has two parts: a written theory exam covering sanitation, anatomy, chemistry, and state laws, and a practical skills exam where candidates demonstrate haircut, shave, and sanitation procedures on a live model.',
    },
    {
      id: 'mod8-l46-q8',
      type: 'multiple_choice',
      question: 'What is the minimum passing score for the Indiana barber written exam?',
      options: ['60%', '70%', '75%', '80%'],
      correctAnswer: 1,
      explanation: 'Indiana requires a minimum score of 70% to pass the written barber exam. Candidates who fail may retake the exam after a waiting period and payment of a retake fee.',
    },
  ],

  // ── Lesson 47: Written Exam Review — Sanitation & Science ───────────────────
  'barber-lesson-47': [
    {
      id: 'mod8-l47-q6',
      type: 'multiple_choice',
      question: 'On the Indiana written exam, which sanitation term describes the process of reducing pathogens to a safe level on non-living surfaces?',
      options: ['Sterilization', 'Disinfection', 'Sanitization', 'Decontamination'],
      correctAnswer: 1,
      explanation: 'Disinfection reduces pathogens to a safe level on non-living surfaces using EPA-registered chemical agents. Sterilization eliminates all microorganisms (required for surgical instruments, not barbering tools). Sanitization reduces bacteria on skin or food-contact surfaces.',
    },
    {
      id: 'mod8-l47-q7',
      type: 'multiple_choice',
      question: 'Which of the following is a bloodborne pathogen that barbers must be trained to prevent transmitting?',
      options: ['Tinea capitis', 'Hepatitis B', 'Seborrheic dermatitis', 'Alopecia areata'],
      correctAnswer: 1,
      explanation: 'Hepatitis B is a bloodborne pathogen transmitted through blood-to-blood contact. Barbers must follow bloodborne pathogen protocols — single-use blades, proper sharps disposal, and exposure response procedures — to prevent transmission.',
    },
    {
      id: 'mod8-l47-q8',
      type: 'multiple_choice',
      question: 'The hair\'s ability to absorb moisture is called:',
      options: ['Elasticity', 'Porosity', 'Texture', 'Density'],
      correctAnswer: 1,
      explanation: 'Porosity is the hair\'s ability to absorb and retain moisture. High porosity = absorbs quickly, loses quickly. Low porosity = resists absorption. This is a key concept on the written exam and affects product and service selection.',
    },
  ],

  // ── Lesson 48: Written Exam Review — Techniques & Laws ──────────────────────
  'barber-lesson-48': [
    {
      id: 'mod8-l48-q6',
      type: 'multiple_choice',
      question: 'Under Indiana law, a barber license must be renewed every:',
      options: ['1 year', '2 years', '3 years', '5 years'],
      correctAnswer: 1,
      explanation: 'Indiana barber licenses are renewed on a 2-year cycle. Renewal requires completion of continuing education hours and payment of the renewal fee. Practicing with an expired license is a violation subject to fines and suspension.',
    },
    {
      id: 'mod8-l48-q7',
      type: 'multiple_choice',
      question: 'Which haircutting technique creates a seamless blend between two clipper guard lengths?',
      options: ['Blunt cutting', 'Fading', 'Point cutting', 'Razor cutting'],
      correctAnswer: 1,
      explanation: 'Fading creates a gradual, seamless transition between two lengths by overlapping guard sizes and using scooping or rocking clipper motions in the transition zone. It is a core technique tested on the Indiana practical exam.',
    },
    {
      id: 'mod8-l48-q8',
      type: 'multiple_choice',
      question: 'Indiana state law requires barbers to display which document in their workstation?',
      options: [
        'Their high school diploma',
        'Their current, valid barber license',
        'Their apprenticeship completion certificate',
        'Their continuing education certificates',
      ],
      correctAnswer: 1,
      explanation: 'Indiana law requires barbers to display their current, valid barber license at their workstation where it is visible to clients. Failure to display a valid license is a violation subject to disciplinary action by the Indiana Professional Licensing Agency.',
    },
  ],

  // ── Lesson 49: Practical Exam Preparation ───────────────────────────────────
  'barber-lesson-49': [
    {
      id: 'mod8-l49-q6',
      type: 'multiple_choice',
      question: 'On the Indiana practical exam, what is the first thing the examiner evaluates before any service begins?',
      options: [
        'The candidate\'s clipper technique',
        'Sanitation setup — proper tool disinfection, clean workstation, and correct draping',
        'The candidate\'s consultation with the model',
        'The candidate\'s license display',
      ],
      correctAnswer: 1,
      explanation: 'The practical exam begins with a sanitation evaluation. Examiners check that tools are properly disinfected, the workstation is clean, and the client is correctly draped with a neck strip. Failing the sanitation setup can result in point deductions before any cutting begins.',
    },
    {
      id: 'mod8-l49-q7',
      type: 'multiple_choice',
      question: 'During the practical exam haircut, a candidate makes an uneven line. What is the best response?',
      options: [
        'Stop and ask the examiner for help',
        'Continue cutting and correct the line during the blending phase',
        'Declare the error to the examiner immediately',
        'Leave it — examiners expect some imperfection',
      ],
      correctAnswer: 1,
      explanation: 'Minor errors during a practical exam should be corrected through the natural flow of the service — blending and finishing phases exist precisely to refine the cut. Stopping to ask for help or declaring errors draws unnecessary attention. Examiners evaluate the final result and technique, not individual strokes.',
    },
    {
      id: 'mod8-l49-q8',
      type: 'multiple_choice',
      question: 'What should a candidate do immediately after completing the practical exam service?',
      options: [
        'Leave the workstation as-is for the examiner to inspect',
        'Clean and disinfect all tools, remove the draping, and sanitize the workstation — demonstrating post-service sanitation',
        'Pack up tools and exit quickly',
        'Ask the examiner for feedback on the haircut',
      ],
      correctAnswer: 1,
      explanation: 'Post-service sanitation is part of the practical exam score. Candidates must clean and disinfect tools, properly dispose of single-use items, remove draping, and sanitize the workstation. This demonstrates professional standards and is evaluated by the examiner.',
    },
  ],
};

async function patchLesson(slug: string, extra: object[]) {
  console.log(`\nPatching ${slug}...`);
  const { data, error } = await db.from('course_lessons').select('id, quiz_questions').eq('course_id', COURSE_ID).eq('slug', slug).single();
  if (error || !data) { console.error(`  ✗ Not found: ${slug}`, error?.message); return; }
  const existing: any[] = Array.isArray(data.quiz_questions) ? data.quiz_questions : [];
  const existingIds = new Set(existing.map((q: any) => q.id));
  const toAdd = extra.filter((q: any) => !existingIds.has(q.id));
  if (toAdd.length === 0) { console.log(`  ✓ Already at standard (${existing.length}q)`); return; }
  const merged = [...existing, ...toAdd];
  const { error: err } = await db.from('course_lessons').update({ quiz_questions: merged, updated_at: new Date().toISOString() }).eq('id', data.id);
  if (err) { console.error(`  ✗`, err.message); } else { console.log(`  ✓ ${existing.length} → ${merged.length} questions`); }
}

for (const [slug, qs] of Object.entries(EXTRA)) await patchLesson(slug, qs);
console.log('\nDone.');
