/**
 * Patch lessons 8-10 to 8q standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-lessons-8-10.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Lesson 8: Structure of the Hair and Scalp ────────────────────────────────
  'barber-lesson-8': [
    {
      id: 'm2-l8-q6',
      type: 'multiple_choice',
      question: 'Which layer of the hair shaft contains the pigment (melanin) that gives hair its color?',
      options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle'],
      correctAnswer: 1,
      explanation: 'The cortex is the middle layer of the hair shaft and contains melanin granules that determine hair color. The cuticle is the outer protective scale layer; the medulla is the innermost core (absent in fine hair).',
    },
    {
      id: 'm2-l8-q7',
      type: 'multiple_choice',
      question: 'The sebaceous gland attached to each hair follicle produces:',
      options: ['Sweat', 'Sebum (natural oil)', 'Keratin', 'Melanin'],
      correctAnswer: 1,
      explanation: 'Sebaceous glands produce sebum, the natural oil that lubricates the hair shaft and scalp. Overproduction contributes to oily scalp conditions; underproduction leads to dryness.',
    },
    {
      id: 'm2-l8-q8',
      type: 'multiple_choice',
      question: 'Hair is primarily composed of which protein?',
      options: ['Collagen', 'Elastin', 'Keratin', 'Melanin'],
      correctAnswer: 2,
      explanation: 'Hair is made of keratin, a fibrous structural protein. Understanding keratin\'s properties — its response to heat, chemicals, and moisture — is foundational to all barbering services.',
    },
  ],

  // ── Lesson 9: The Hair Growth Cycle ─────────────────────────────────────────
  'barber-lesson-9': [
    {
      id: 'm2-l9-q6',
      type: 'multiple_choice',
      question: 'During which phase of the hair growth cycle is the hair follicle completely at rest and the hair most likely to shed?',
      options: ['Anagen', 'Catagen', 'Telogen', 'Exogen'],
      correctAnswer: 2,
      explanation: 'The telogen phase is the resting phase. The hair is no longer growing and is held loosely in the follicle. Normal daily shedding (50-100 hairs) occurs primarily from follicles in telogen.',
    },
    {
      id: 'm2-l9-q7',
      type: 'multiple_choice',
      question: 'Approximately what percentage of scalp hairs are in the anagen (active growth) phase at any given time?',
      options: ['10-15%', '30-40%', '85-90%', '100%'],
      correctAnswer: 2,
      explanation: 'At any given time, approximately 85-90% of scalp hairs are in the anagen phase, which lasts 2-7 years. This is why most haircuts affect actively growing hair.',
    },
    {
      id: 'm2-l9-q8',
      type: 'multiple_choice',
      question: 'A client notices increased hair shedding 3 months after a high fever. What is the most likely explanation?',
      options: [
        'The fever permanently damaged the follicles',
        'Telogen effluvium — stress pushed follicles into telogen early, causing delayed shedding',
        'The client has alopecia areata',
        'Normal seasonal shedding unrelated to the fever',
      ],
      correctAnswer: 1,
      explanation: 'Telogen effluvium is diffuse shedding triggered by physical stress (illness, fever, surgery). The stress pushes follicles into telogen simultaneously; shedding appears 2-3 months later when those hairs release. It is usually temporary.',
    },
  ],

  // ── Lesson 10: Hair Texture, Density & Porosity ──────────────────────────────
  'barber-lesson-10': [
    {
      id: 'm2-l10-q6',
      type: 'multiple_choice',
      question: 'A client has high-porosity hair. Which product characteristic is most important to address this?',
      options: [
        'Lightweight, water-based formulas that absorb quickly',
        'Protein-rich, sealing formulas that fill gaps in the cuticle and reduce moisture loss',
        'Clarifying shampoos to remove buildup',
        'High-pH products to open the cuticle further',
      ],
      correctAnswer: 1,
      explanation: 'High-porosity hair has gaps or lifted cuticle scales that absorb moisture quickly but lose it just as fast. Protein treatments fill structural gaps and sealing products (oils, butters) lock moisture in.',
    },
    {
      id: 'm2-l10-q7',
      type: 'multiple_choice',
      question: 'Which hair texture requires the most tension control during clipper work to avoid uneven results?',
      options: ['Fine, straight hair', 'Coarse, tightly coiled hair', 'Medium, wavy hair', 'All textures require equal tension'],
      correctAnswer: 1,
      explanation: 'Coarse, tightly coiled hair has significant shrinkage and curl pattern variation. Without proper tension and sectioning, the clipper cuts unevenly as the hair springs back to different lengths in different areas.',
    },
    {
      id: 'm2-l10-q8',
      type: 'multiple_choice',
      question: 'Hair density refers to:',
      options: [
        'The diameter of each individual hair strand',
        'The number of hair strands per square inch of scalp',
        'How quickly hair absorbs water',
        'The strength of the hair shaft',
      ],
      correctAnswer: 1,
      explanation: 'Density is the number of hairs per square inch. It affects how much bulk a haircut will have and how products distribute. Texture (strand diameter) and density are separate characteristics that together determine the hair\'s overall behavior.',
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
