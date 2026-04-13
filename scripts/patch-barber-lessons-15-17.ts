/**
 * Patch lessons 15-17 to 8q standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-lessons-15-17.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Lesson 15: Clippers & Trimmers — Types and Guards ───────────────────────
  'barber-lesson-15': [
    {
      id: 'l15q6',
      type: 'multiple_choice',
      question: 'A #1 clipper guard leaves approximately how much hair length?',
      options: ['1/16 inch (1.5 mm)', '1/8 inch (3 mm)', '1/4 inch (6 mm)', '1/2 inch (13 mm)'],
      correctAnswer: 1,
      explanation: 'A #1 guard leaves approximately 1/8 inch (3 mm) of hair. Guard sizes increase in 1/8-inch increments: #0 = bare blade (~1.5 mm), #1 = 3 mm, #2 = 6 mm, #3 = 10 mm, #4 = 13 mm.',
    },
    {
      id: 'l15q7',
      type: 'multiple_choice',
      question: 'What is the purpose of clipper blade oil?',
      options: [
        'To disinfect the blades between clients',
        'To lubricate the blades, reduce heat, and prevent rust',
        'To sharpen dull blades',
        'To remove hair from between the teeth',
      ],
      correctAnswer: 1,
      explanation: 'Clipper oil lubricates the moving parts of the blade, reduces friction-generated heat, and prevents rust. It should be applied before each use and after cleaning. Oil does not disinfect — that requires an EPA-registered disinfectant.',
    },
    {
      id: 'l15q8',
      type: 'multiple_choice',
      question: 'When should clipper blades be replaced rather than just cleaned and oiled?',
      options: [
        'After every 10 clients',
        'When they pull, snag, or leave uneven lines despite proper cleaning and oiling',
        'Once per month regardless of condition',
        'Only when a tooth is visibly broken',
      ],
      correctAnswer: 1,
      explanation: 'Blades should be replaced when they no longer cut cleanly — pulling, snagging, or leaving tracks — even after proper maintenance. Dull blades cause discomfort and uneven results. Visible damage (broken teeth) is an obvious indicator, but performance degradation is the primary signal.',
    },
  ],

  // ── Lesson 16: Scissors & Shears ────────────────────────────────────────────
  'barber-lesson-16': [
    {
      id: 'l16q6',
      type: 'multiple_choice',
      question: 'Thinning shears are used primarily to:',
      options: [
        'Cut blunt lines at the perimeter',
        'Remove bulk and blend weight without reducing overall length significantly',
        'Create razor-sharp edges at the hairline',
        'Cut wet hair only',
      ],
      correctAnswer: 1,
      explanation: 'Thinning shears have one serrated blade that removes a percentage of hair with each cut, reducing bulk and blending weight lines. They are used for texturizing and blending, not for perimeter cutting or edging.',
    },
    {
      id: 'l16q7',
      type: 'multiple_choice',
      question: 'What is the correct way to pass scissors to another barber or hand them to a client to examine?',
      options: [
        'Hold the blade end and extend the handle toward the other person',
        'Place them on the counter and let the other person pick them up',
        'Hold the handle end and extend the blade toward the other person',
        'Scissors should never be passed — always set them down first',
      ],
      correctAnswer: 0,
      explanation: 'When passing scissors, hold the blade end (closed) and extend the handle toward the recipient. This keeps the sharp edge away from both parties during the transfer and is the standard safety protocol.',
    },
    {
      id: 'l16q8',
      type: 'multiple_choice',
      question: 'Point cutting with scissors creates what effect?',
      options: [
        'A blunt, solid perimeter line',
        'Soft, textured ends that remove weight and add movement',
        'A razor-sharp edge at the hairline',
        'Uniform length throughout the section',
      ],
      correctAnswer: 1,
      explanation: 'Point cutting involves cutting into the ends of the hair at an angle with the scissor tips. This removes weight, softens blunt lines, and adds texture and movement — the opposite of a blunt cut.',
    },
  ],

  // ── Lesson 17: Straight Razor & Safety Razor ────────────────────────────────
  'barber-lesson-17': [
    {
      id: 'l17q6',
      type: 'multiple_choice',
      question: 'What angle should the straight razor be held at relative to the skin for most shaving strokes?',
      options: ['10-15 degrees', '30-45 degrees', '60-75 degrees', '90 degrees (perpendicular)'],
      correctAnswer: 1,
      explanation: 'A 30-45 degree angle provides the optimal balance between cutting efficiency and skin safety. Too shallow (10-15°) reduces cutting effectiveness; too steep (60°+) increases the risk of cuts and skin irritation.',
    },
    {
      id: 'l17q7',
      type: 'multiple_choice',
      question: 'A straight razor with a replaceable blade cartridge is called a:',
      options: ['Shavette', 'Kamisori', 'Barber\'s notch razor', 'Feather razor'],
      correctAnswer: 0,
      explanation: 'A shavette uses disposable blade inserts, making it the standard tool in professional barbershops where single-use blades are required by state board sanitation rules. Traditional straight razors with fixed blades cannot be used on multiple clients without sterilization equipment most shops don\'t have.',
    },
    {
      id: 'l17q8',
      type: 'multiple_choice',
      question: 'If a barber accidentally nicks a client during a straight razor shave, what is the correct immediate response?',
      options: [
        'Apply styptic powder or pencil and continue the service',
        'Stop the service, apply pressure with a clean cloth, apply styptic if bleeding is minor, document the incident, and follow bloodborne pathogen exposure protocol',
        'Apply shaving cream over the nick and continue',
        'Apologize and offer a discount — no further action needed',
      ],
      correctAnswer: 1,
      explanation: 'Any break in skin requires stopping the service, controlling bleeding, applying styptic for minor nicks, and following the shop\'s bloodborne pathogen exposure protocol. The incident must be documented. Continuing the service over an open wound violates sanitation standards.',
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
