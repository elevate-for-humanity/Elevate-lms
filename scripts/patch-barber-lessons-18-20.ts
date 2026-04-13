/**
 * Patch lessons 18-20 to 8q standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-lessons-18-20.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Lesson 18: Clipper Maintenance & Blade Care ──────────────────────────────
  'barber-lesson-18': [
    {
      id: 'm3-l18-q6',
      type: 'multiple_choice',
      question: 'After cleaning clipper blades with a brush, what is the correct next step before disinfecting?',
      options: [
        'Apply oil immediately',
        'Rinse with water to remove remaining debris',
        'Spray with EPA-registered disinfectant — pre-cleaning with a brush is sufficient',
        'Soak in barbicide for 10 minutes without any prior cleaning',
      ],
      correctAnswer: 2,
      explanation: 'Pre-cleaning with a brush removes hair and debris so the disinfectant can contact the blade surface. Once pre-cleaned, spray with EPA-registered disinfectant and allow full contact time. Water rinsing is not required between brushing and disinfecting for clipper blades.',
    },
    {
      id: 'm3-l18-q7',
      type: 'multiple_choice',
      question: 'Clipper blades that run hot during a service should be:',
      options: [
        'Continued in use — heat is normal and harmless',
        'Cooled with blade coolant spray, then checked before continuing',
        'Immediately replaced with new blades',
        'Rinsed under cold water',
      ],
      correctAnswer: 1,
      explanation: 'Hot blades can burn the client\'s scalp. Blade coolant spray quickly reduces temperature and also lubricates. After cooling, check that the blade is still cutting properly before continuing. Rinsing with water can cause rust.',
    },
    {
      id: 'm3-l18-q8',
      type: 'multiple_choice',
      question: 'How often should clipper blades be professionally sharpened?',
      options: [
        'After every client',
        'Once per week',
        'When they begin to pull, snag, or cut unevenly despite proper maintenance',
        'Never — blades should be replaced, not sharpened',
      ],
      correctAnswer: 2,
      explanation: 'Professional sharpening is needed when blades no longer cut cleanly despite proper cleaning and oiling. Frequency depends on usage volume. High-volume shops may sharpen monthly; lower-volume shops less often. Blades can be sharpened multiple times before replacement.',
    },
  ],

  // ── Lesson 19: Ergonomics & Body Mechanics ───────────────────────────────────
  'barber-lesson-19': [
    {
      id: 'm3-l19-q6',
      type: 'multiple_choice',
      question: 'Which of the following best reduces lower back strain during long barbering shifts?',
      options: [
        'Leaning forward slightly to get closer to the client\'s head',
        'Adjusting the barber chair height so the work area is at elbow level, reducing forward bending',
        'Wearing a back brace at all times',
        'Taking a 30-minute break every hour',
      ],
      correctAnswer: 1,
      explanation: 'Adjusting the chair so the client\'s head is at elbow height keeps the barber\'s spine neutral and reduces forward bending. This is the primary ergonomic adjustment. Braces and breaks help but do not address the root cause.',
    },
    {
      id: 'm3-l19-q7',
      type: 'multiple_choice',
      question: 'Repetitive strain injuries in barbers most commonly affect which body areas?',
      options: [
        'Knees and ankles',
        'Wrists, shoulders, and lower back',
        'Neck and hips only',
        'Feet and calves',
      ],
      correctAnswer: 1,
      explanation: 'Barbers are at highest risk for wrist (carpal tunnel from repetitive cutting), shoulder (rotator cuff from sustained arm elevation), and lower back (from prolonged standing and forward bending) injuries. Proper ergonomics and tool selection reduce these risks.',
    },
    {
      id: 'm3-l19-q8',
      type: 'multiple_choice',
      question: 'An anti-fatigue mat primarily helps by:',
      options: [
        'Preventing slips and falls',
        'Reducing the compressive load on joints by encouraging subtle weight shifts and cushioning the feet',
        'Keeping the floor clean',
        'Improving posture by raising the barber\'s height',
      ],
      correctAnswer: 1,
      explanation: 'Anti-fatigue mats work by encouraging micro-movements in the legs and feet, which promotes circulation and reduces static loading on joints. They also cushion impact. They do not significantly change posture or height.',
    },
  ],

  // ── Lesson 20: Draping & Client Preparation ──────────────────────────────────
  'barber-lesson-20': [
    {
      id: 'm3-l20-q6',
      type: 'multiple_choice',
      question: 'Why must a neck strip be placed between the client\'s neck and the cape?',
      options: [
        'To keep the cape clean for the next client',
        'To prevent the cape — which contacts multiple clients — from touching the client\'s skin, reducing cross-contamination risk',
        'To absorb sweat during the service',
        'It is optional — only required for chemical services',
      ],
      correctAnswer: 1,
      explanation: 'The neck strip creates a barrier between the reusable cape and the client\'s skin. Capes contact multiple clients and cannot be fully disinfected between each use. The neck strip is single-use and is required by state board rules for every service.',
    },
    {
      id: 'm3-l20-q7',
      type: 'multiple_choice',
      question: 'For a shaving service, how does draping differ from a standard haircut draping?',
      options: [
        'No difference — the same cape is used for all services',
        'A towel or shaving cape is used that allows access to the neck and face without the cape interfering with razor movement',
        'No cape is used for shaving services',
        'The client holds the cape themselves during shaving',
      ],
      correctAnswer: 1,
      explanation: 'Shaving services require access to the neck and face. A shaving cape or towel drape is positioned to protect clothing while keeping the work area fully accessible. A standard haircut cape would obstruct razor movement and product application.',
    },
    {
      id: 'm3-l20-q8',
      type: 'multiple_choice',
      question: 'Before seating a client in the barber chair, what should the barber check?',
      options: [
        'That the chair is at maximum height',
        'That the chair is clean, the headrest is adjusted, and a fresh neck strip is ready',
        'That the client has paid in advance',
        'That all tools are already laid out on the counter',
      ],
      correctAnswer: 1,
      explanation: 'Before seating a client, the barber should confirm the chair is clean (no hair from the previous client), the headrest is at an appropriate position, and a fresh neck strip is ready. This is part of the professional setup routine and demonstrates sanitation standards.',
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
