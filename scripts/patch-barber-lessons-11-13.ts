/**
 * Patch lessons 11-13 to 8q standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-lessons-11-13.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Lesson 11: Scalp Conditions & Disorders ──────────────────────────────────
  'barber-lesson-11': [
    {
      id: 'm2-l11-q6',
      type: 'multiple_choice',
      question: 'A client presents with circular patches of hair loss with smooth, non-inflamed skin. Which condition does this most likely indicate?',
      options: ['Tinea capitis', 'Alopecia areata', 'Androgenetic alopecia', 'Seborrheic dermatitis'],
      correctAnswer: 1,
      explanation: 'Alopecia areata presents as well-defined circular patches of hair loss with smooth, non-scarred skin. It is an autoimmune condition. The barber must refer the client to a physician — no barbering service should be performed on affected areas.',
    },
    {
      id: 'm2-l11-q7',
      type: 'multiple_choice',
      question: 'Tinea capitis is caused by:',
      options: ['A bacterial infection', 'A fungal infection', 'An autoimmune response', 'Excessive sebum production'],
      correctAnswer: 1,
      explanation: 'Tinea capitis (ringworm of the scalp) is a fungal infection. It is highly contagious. A barber must refuse service and refer the client to a physician. All tools that contacted the client must be disinfected immediately.',
    },
    {
      id: 'm2-l11-q8',
      type: 'multiple_choice',
      question: 'When should a barber refuse to perform a service on a client with a scalp condition?',
      options: [
        'Only if the client requests it',
        'Whenever the condition appears contagious, involves open sores, or is of unknown origin',
        'Only for conditions that affect the hair shaft',
        'Never — the barber should always attempt to serve the client',
      ],
      correctAnswer: 1,
      explanation: 'State board rules require barbers to refuse service when a condition appears contagious (fungal, bacterial, parasitic), involves open lesions, or is undiagnosed. This protects both the client and subsequent clients from cross-contamination.',
    },
  ],

  // ── Lesson 12: Client Consultation (Module 2) ────────────────────────────────
  'barber-lesson-12': [
    {
      id: 'm2-l12-q6',
      type: 'multiple_choice',
      question: 'A client\'s face shape is wider at the forehead and narrows to a pointed chin. Which face shape is this?',
      options: ['Round', 'Square', 'Heart', 'Oblong'],
      correctAnswer: 2,
      explanation: 'A heart-shaped face is widest at the forehead and temples, narrowing to a pointed chin. Haircut recommendations typically add width at the jaw and reduce volume at the top to create balance.',
    },
    {
      id: 'm2-l12-q7',
      type: 'multiple_choice',
      question: 'During a consultation, the client says they want to "keep the length." What should the barber do?',
      options: [
        'Take no length off at all',
        'Clarify what "keep the length" means to the client — confirm in inches and show reference photos',
        'Trim only the ends',
        'Proceed with a standard trim and adjust if the client objects',
      ],
      correctAnswer: 1,
      explanation: '"Keep the length" is subjective. A professional barber always clarifies with specific measurements and visual references before cutting. Assumptions lead to dissatisfied clients and lost business.',
    },
    {
      id: 'm2-l12-q8',
      type: 'multiple_choice',
      question: 'Which of the following is NOT a contraindication that should be identified during a client consultation?',
      options: [
        'Active scalp infection',
        'Blood-thinning medication',
        'The client\'s preferred music genre',
        'Known allergy to chemical products',
      ],
      correctAnswer: 2,
      explanation: 'Contraindications are health or safety factors that affect service decisions. Active infections, medications affecting bleeding, and chemical allergies are all clinically relevant. Music preference is a comfort preference, not a contraindication.',
    },
  ],

  // ── Lesson 13: Shampoo & Scalp Massage ──────────────────────────────────────
  'barber-lesson-13': [
    {
      id: 'm2-l13-q6',
      type: 'multiple_choice',
      question: 'What water temperature should be used when shampooing a client?',
      options: [
        'Cold — to close the cuticle',
        'Hot — to open the cuticle and remove buildup',
        'Comfortably warm — tested on the barber\'s wrist before applying to the client',
        'Temperature does not matter',
      ],
      correctAnswer: 2,
      explanation: 'Water should be comfortably warm — always tested on the barber\'s inner wrist before applying to the client\'s scalp. Hot water can cause burns; cold water is uncomfortable and less effective at removing product buildup.',
    },
    {
      id: 'm2-l13-q7',
      type: 'multiple_choice',
      question: 'During a scalp massage, which movement uses the fingertips in a circular motion to stimulate circulation?',
      options: ['Effleurage', 'Petrissage', 'Tapotement', 'Friction'],
      correctAnswer: 3,
      explanation: 'Friction uses the fingertips in firm circular movements directly on the scalp to stimulate blood circulation and loosen debris. Effleurage is light stroking; petrissage is kneading; tapotement is tapping.',
    },
    {
      id: 'm2-l13-q8',
      type: 'multiple_choice',
      question: 'Which shampoo type is most appropriate for a client with an oily scalp?',
      options: [
        'Moisturizing shampoo',
        'Clarifying or balancing shampoo formulated to reduce excess sebum',
        'Color-safe shampoo',
        'Baby shampoo',
      ],
      correctAnswer: 1,
      explanation: 'Clarifying or balancing shampoos are formulated to remove excess oil and product buildup without stripping the scalp entirely. Moisturizing shampoos would add unnecessary hydration to an already oily scalp.',
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
