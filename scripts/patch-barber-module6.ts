/**
 * Patch Module 6 (lessons 35-38) — Chemical Services.
 * Writes 8 quiz questions per lesson (upsert-safe).
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-module6.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const LESSONS: Array<{ slug: string; title: string; quiz_questions: object[] }> = [
  {
    slug: 'barber-lesson-35',
    title: 'Hair Color Theory',
    quiz_questions: [
      {
        id: 'mod6-l35-q1',
        type: 'multiple_choice',
        question: 'Which complementary color is used to neutralize yellow brassiness in lightened hair?',
        options: ['Red', 'Orange', 'Violet', 'Green'],
        correctAnswer: 2,
        explanation: 'Violet is directly opposite yellow on the color wheel. Complementary colors cancel each other out, so violet toners neutralize yellow brassiness in lightened or highlighted hair.',
      },
      {
        id: 'mod6-l35-q2',
        type: 'multiple_choice',
        question: 'A client\'s hair is at level 5. Which description is most accurate?',
        options: ['Black', 'Dark brown', 'Medium brown', 'Light blonde'],
        correctAnswer: 1,
        explanation: 'Level 5 is dark brown on the 1–10 hair color level system. Level 1 is black; level 10 is the lightest blonde.',
      },
      {
        id: 'mod6-l35-q3',
        type: 'multiple_choice',
        question: 'Which type of hair color requires a developer and permanently changes the hair?',
        options: ['Temporary', 'Semi-permanent', 'Demi-permanent', 'Permanent'],
        correctAnswer: 3,
        explanation: 'Permanent color uses a developer (hydrogen peroxide) to open the cuticle, allowing the color to penetrate the cortex and permanently change the hair. It can both lighten and deposit color.',
      },
      {
        id: 'mod6-l35-q4',
        type: 'multiple_choice',
        question: 'A client wants to go from level 6 to level 9 without bleach. Which color type can achieve this?',
        options: ['Semi-permanent', 'Demi-permanent', 'Permanent with developer', 'Temporary'],
        correctAnswer: 2,
        explanation: 'Only permanent color with developer can lighten hair. Semi-permanent and demi-permanent cannot lighten significantly. Temporary color only coats the cuticle. Going from level 6 to level 9 requires permanent color with an appropriate developer volume.',
      },
      {
        id: 'mod6-l35-q5',
        type: 'multiple_choice',
        question: 'What are the three primary colors in hair color theory?',
        options: ['Red, orange, yellow', 'Red, yellow, blue', 'Blue, green, red', 'Yellow, green, violet'],
        correctAnswer: 1,
        explanation: 'The three primary colors are red, yellow, and blue. All other colors are created by mixing primaries (secondary colors) or mixing a primary with a secondary (tertiary colors).',
      },
      {
        id: 'mod6-l35-q6',
        type: 'multiple_choice',
        question: 'Semi-permanent color differs from temporary color in which key way?',
        options: [
          'Semi-permanent requires a developer; temporary does not',
          'Semi-permanent lasts 4–6 weeks and penetrates slightly into the cuticle; temporary washes out in 1–2 shampoos',
          'Semi-permanent can lighten hair; temporary cannot',
          'There is no difference — both wash out completely',
        ],
        correctAnswer: 1,
        explanation: 'Semi-permanent color penetrates slightly into the cuticle layer and lasts 4–6 weeks. Temporary color only coats the outside of the cuticle and washes out in 1–2 shampoos. Neither requires a developer and neither can lighten hair.',
      },
      {
        id: 'mod6-l35-q7',
        type: 'multiple_choice',
        question: 'A client has orange brassiness after lightening. Which complementary color neutralizes orange?',
        options: ['Violet', 'Blue', 'Green', 'Red'],
        correctAnswer: 1,
        explanation: 'Blue is directly opposite orange on the color wheel. Blue-based toners neutralize orange brassiness. Violet neutralizes yellow. Understanding complementary color relationships is essential for corrective color work.',
      },
      {
        id: 'mod6-l35-q8',
        type: 'multiple_choice',
        question: 'Which hair color level system number represents the darkest possible hair?',
        options: ['0', '1', '2', '10'],
        correctAnswer: 1,
        explanation: 'Level 1 is the darkest — black. The scale runs from 1 (black) to 10 (lightest blonde). There is no level 0 in the standard system.',
      },
    ],
  },
  {
    slug: 'barber-lesson-36',
    title: 'Chemical Safety & Patch Testing',
    quiz_questions: [
      {
        id: 'mod6-l36-q1',
        type: 'multiple_choice',
        question: 'How far in advance must a patch test be performed before a chemical service?',
        options: ['1 hour before', 'Same day, at least 30 minutes before', '24–48 hours before', '72 hours before'],
        correctAnswer: 2,
        explanation: 'A patch test must be performed 24–48 hours before any chemical service. Allergic reactions can take up to 48 hours to develop. Performing the test the same day does not allow enough time to detect a delayed reaction.',
      },
      {
        id: 'mod6-l36-q2',
        type: 'multiple_choice',
        question: 'Why are nitrile gloves required for chemical services rather than latex gloves?',
        options: [
          'Nitrile gloves are thicker and more durable',
          'Latex gloves are not adequate because chemicals can permeate latex',
          'Nitrile gloves are required by Indiana law specifically',
          'Latex gloves cause allergic reactions in all clients',
        ],
        correctAnswer: 1,
        explanation: 'Many chemical service products can permeate latex gloves, exposing the barber\'s skin to harmful chemicals. Nitrile gloves provide a chemical-resistant barrier. Additionally, some clients and barbers have latex allergies, making nitrile the safer choice.',
      },
      {
        id: 'mod6-l36-q3',
        type: 'multiple_choice',
        question: 'A patch test shows redness and swelling at 24 hours. What is the correct action?',
        options: [
          'Proceed — mild redness is normal and will resolve',
          'Wait another 24 hours and recheck before deciding',
          'Do not proceed — any reaction is a contraindication',
          'Use a lower-strength product and proceed with caution',
        ],
        correctAnswer: 2,
        explanation: 'Any reaction — redness, swelling, itching, or burning — is a contraindication. There is no threshold of "acceptable" reaction. Proceeding after a positive patch test risks a severe allergic reaction on the client\'s scalp.',
      },
      {
        id: 'mod6-l36-q4',
        type: 'multiple_choice',
        question: 'Which PPE item is required when mixing or applying chemical services?',
        options: [
          'Latex gloves only',
          'Nitrile gloves, protective apron, and eye protection',
          'Nitrile gloves and a face mask only',
          'Eye protection only — gloves are optional for experienced barbers',
        ],
        correctAnswer: 1,
        explanation: 'All three items are required: nitrile gloves (chemical-resistant barrier for hands), protective apron (protects clothing and skin from splashes), and eye protection (chemical splashes can cause serious eye injury). No PPE item is optional.',
      },
      {
        id: 'mod6-l36-q5',
        type: 'multiple_choice',
        question: 'A client had a chemical service 3 weeks ago and wants another. What is the correct response?',
        options: [
          'Proceed — 3 weeks is sufficient recovery time',
          'Decline — chemical services should be spaced at least 4 weeks apart',
          'Perform a patch test and proceed if negative',
          'Proceed only if the client\'s hair appears healthy',
        ],
        correctAnswer: 1,
        explanation: 'Chemical services should be spaced at least 4 weeks apart to allow the hair and scalp to recover. Overlapping chemical services causes cumulative damage to the hair structure and scalp. 3 weeks is insufficient — the service should be declined.',
      },
      {
        id: 'mod6-l36-q6',
        type: 'multiple_choice',
        question: 'Where is the patch test applied?',
        options: [
          'On the scalp at the crown',
          'Behind the ear or inside the elbow',
          'On the back of the hand',
          'On the forearm only',
        ],
        correctAnswer: 1,
        explanation: 'The patch test is applied behind the ear or inside the elbow — areas with thin, sensitive skin that are representative of scalp skin reactivity. The back of the hand has thicker skin and is not a reliable test site.',
      },
      {
        id: 'mod6-l36-q7',
        type: 'multiple_choice',
        question: 'Why is ventilation required during chemical services?',
        options: [
          'To prevent the product from drying too quickly',
          'Chemical fumes can cause respiratory irritation and are a health hazard',
          'Ventilation is only required for bleach services, not color',
          'To maintain the correct processing temperature',
        ],
        correctAnswer: 1,
        explanation: 'Chemical service products release fumes that can cause respiratory irritation, headaches, and in high concentrations, more serious health effects. Adequate ventilation protects both the barber and the client. This is an OSHA requirement in professional settings.',
      },
      {
        id: 'mod6-l36-q8',
        type: 'multiple_choice',
        question: 'A client has a small scalp abrasion from scratching. What is the correct action before a chemical service?',
        options: [
          'Apply petroleum jelly to the abrasion and proceed',
          'Decline the service — scalp abrasions are a contraindication for chemical services',
          'Proceed if the abrasion is small and not actively bleeding',
          'Apply antiseptic to the abrasion and wait 10 minutes before proceeding',
        ],
        correctAnswer: 1,
        explanation: 'Scalp abrasions are a contraindication for chemical services. Chemicals applied to broken skin cause severe burning, chemical burns, and potential systemic absorption. The service must be declined until the scalp has fully healed.',
      },
    ],
  },
  {
    slug: 'barber-lesson-37',
    title: 'Relaxers & Texturizers',
    quiz_questions: [
      {
        id: 'mod6-l37-q1',
        type: 'multiple_choice',
        question: 'What chemical bonds do relaxers break to straighten hair?',
        options: ['Hydrogen bonds', 'Salt bonds', 'Disulfide bonds', 'Peptide bonds'],
        correctAnswer: 2,
        explanation: 'Relaxers break the disulfide bonds in the cortex — the strongest bonds in the hair structure. These bonds give hair its curl pattern. Breaking them allows the hair to be restructured in a straighter form. The neutralizer re-forms the bonds in the new position.',
      },
      {
        id: 'mod6-l37-q2',
        type: 'multiple_choice',
        question: 'What is the critical safety rule before applying a relaxer?',
        options: [
          'Shampoo the hair thoroughly immediately before application',
          'Never apply to a scratched, irritated, or broken scalp',
          'Always perform a strand test on the day of service',
          'Apply relaxer to wet hair only',
        ],
        correctAnswer: 1,
        explanation: 'Never apply a relaxer to a scratched, irritated, or broken scalp. Relaxer chemicals on broken skin cause severe chemical burns. Clients should be instructed not to scratch their scalp for 48 hours before a relaxer service.',
      },
      {
        id: 'mod6-l37-q3',
        type: 'multiple_choice',
        question: 'What is the difference between a relaxer and a texturizer?',
        options: [
          'They use different chemicals — relaxers use lye, texturizers use no-lye',
          'A texturizer uses the same chemistry as a relaxer but with a shorter processing time, loosening curl without fully straightening',
          'Texturizers are permanent; relaxers are semi-permanent',
          'There is no difference — texturizer is just a marketing term for relaxer',
        ],
        correctAnswer: 1,
        explanation: 'A texturizer uses the same chemistry as a relaxer (sodium hydroxide or guanidine) but is processed for a shorter time. This loosens the curl pattern without fully straightening the hair. The result is a softer, more manageable curl rather than straight hair.',
      },
      {
        id: 'mod6-l37-q4',
        type: 'multiple_choice',
        question: 'Why must relaxer be applied to new growth only and not overlapped onto previously relaxed hair?',
        options: [
          'Overlapping causes the color to change',
          'Overlapping causes over-processing — the previously relaxed hair breaks because it cannot withstand additional chemical processing',
          'Overlapping is acceptable if the previously relaxed hair is healthy',
          'Overlapping causes the relaxer to stop working on the new growth',
        ],
        correctAnswer: 1,
        explanation: 'Previously relaxed hair has already had its disulfide bonds broken and re-formed. Applying relaxer again over-processes the hair, breaking bonds that have already been restructured and causing severe breakage. New growth only is a non-negotiable rule.',
      },
      {
        id: 'mod6-l37-q5',
        type: 'multiple_choice',
        question: 'What is the purpose of basing the scalp with petroleum jelly before a relaxer?',
        options: [
          'It helps the relaxer penetrate the scalp for better results',
          'It creates a protective barrier between the relaxer and the scalp skin',
          'It is required only for lye relaxers, not no-lye',
          'It prevents the relaxer from processing too quickly',
        ],
        correctAnswer: 1,
        explanation: 'Petroleum jelly creates a protective barrier on the scalp skin, reducing the risk of chemical burns from the relaxer. It does not prevent the relaxer from working on the hair shaft. Basing is required for all relaxer types.',
      },
      {
        id: 'mod6-l37-q6',
        type: 'multiple_choice',
        question: 'What happens if a relaxer is not neutralized thoroughly?',
        options: [
          'The hair reverts to its natural curl pattern',
          'The chemical process continues, causing ongoing damage and breakage',
          'The hair becomes over-conditioned and limp',
          'The relaxer oxidizes and changes color',
        ],
        correctAnswer: 1,
        explanation: 'The neutralizer stops the relaxer process by restoring the hair\'s pH and re-forming bonds in the new position. Insufficient neutralizing means the chemical process continues after the client leaves, causing progressive damage and breakage.',
      },
      {
        id: 'mod6-l37-q7',
        type: 'multiple_choice',
        question: 'Which relaxer type may leave calcium deposits requiring a chelating shampoo?',
        options: ['Lye (sodium hydroxide)', 'No-lye (guanidine)', 'Ammonium thioglycolate', 'Lithium hydroxide'],
        correctAnswer: 1,
        explanation: 'No-lye (guanidine) relaxers are gentler on the scalp but can leave calcium deposits on the hair shaft over time. These deposits make hair feel dry and brittle. A chelating shampoo removes mineral buildup and is recommended with regular no-lye relaxer use.',
      },
      {
        id: 'mod6-l37-q8',
        type: 'multiple_choice',
        question: 'A client\'s scalp shows redness and the client reports burning during relaxer processing. What is the correct action?',
        options: [
          'Reassure the client — mild tingling is normal during processing',
          'Rinse the relaxer immediately and thoroughly, then assess the scalp',
          'Apply more petroleum jelly to the affected area and continue processing',
          'Reduce the remaining processing time by half and then rinse',
        ],
        correctAnswer: 1,
        explanation: 'Burning during relaxer processing is a sign of scalp irritation or chemical burn beginning. The relaxer must be rinsed immediately and thoroughly. Continuing to process risks a serious chemical burn. The scalp must be assessed after rinsing.',
      },
    ],
  },
  {
    slug: 'barber-lesson-38',
    title: 'Scalp Treatments',
    quiz_questions: [
      {
        id: 'mod6-l38-q1',
        type: 'multiple_choice',
        question: 'Which scalp treatment type is appropriate for a dry, flaky scalp?',
        options: ['Clarifying', 'Anti-dandruff', 'Moisturizing', 'Stimulating'],
        correctAnswer: 2,
        explanation: 'A moisturizing scalp treatment restores hydration to a dry, flaky scalp. Clarifying removes buildup. Anti-dandruff targets the Malassezia yeast that causes dandruff. Stimulating increases circulation. Matching the treatment to the condition is essential.',
      },
      {
        id: 'mod6-l38-q2',
        type: 'multiple_choice',
        question: 'What active ingredient in anti-dandruff treatments reduces Malassezia yeast?',
        options: ['Menthol', 'Zinc pyrithione or selenium sulfide', 'Salicylic acid', 'Tea tree oil'],
        correctAnswer: 1,
        explanation: 'Zinc pyrithione and selenium sulfide are the active ingredients in anti-dandruff treatments that reduce the Malassezia yeast responsible for dandruff. Menthol is a stimulating ingredient. Salicylic acid helps with scaling but does not target the yeast directly.',
      },
      {
        id: 'mod6-l38-q3',
        type: 'multiple_choice',
        question: 'Why must the hair be shampooed before applying a scalp treatment?',
        options: [
          'Shampoo activates the treatment ingredients',
          'Shampooing removes debris and opens the scalp so the treatment can penetrate effectively',
          'Shampooing is optional — treatments work on dry hair',
          'Shampooing prevents the treatment from staining the hair',
        ],
        correctAnswer: 1,
        explanation: 'Shampooing removes product buildup, excess sebum, and debris that would block the treatment from reaching the scalp. It also opens the scalp slightly, allowing better penetration of the treatment ingredients.',
      },
      {
        id: 'mod6-l38-q4',
        type: 'multiple_choice',
        question: 'During scalp massage for a treatment, which technique is correct?',
        options: [
          'Use fingernails to stimulate circulation more effectively',
          'Use fingertip pressure in circular motions — never fingernails',
          'Use the palm of the hand in long strokes',
          'Use a scalp brush for maximum stimulation',
        ],
        correctAnswer: 1,
        explanation: 'Scalp massage must use fingertip pressure, never fingernails. Fingernails scratch the scalp, creating abrasions that can become infected and are contraindications for future chemical services. Circular fingertip motions stimulate circulation without damaging the scalp.',
      },
      {
        id: 'mod6-l38-q5',
        type: 'multiple_choice',
        question: 'A client presents with what appears to be severe seborrheic dermatitis. What is the correct action?',
        options: [
          'Apply an anti-dandruff treatment — this is within the barber\'s scope',
          'Refer to a physician before performing any scalp treatment',
          'Apply a clarifying treatment to remove the buildup',
          'Proceed with a moisturizing treatment to reduce flaking',
        ],
        correctAnswer: 1,
        explanation: 'Severe seborrheic dermatitis, psoriasis flares, and fungal infections are medical conditions outside the barber\'s scope of practice. The client must be referred to a physician before any scalp treatment is performed. Treating a medical condition without a referral risks worsening the condition.',
      },
      {
        id: 'mod6-l38-q6',
        type: 'multiple_choice',
        question: 'Which scalp treatment type contains menthol or peppermint to increase circulation?',
        options: ['Moisturizing', 'Clarifying', 'Anti-dandruff', 'Stimulating'],
        correctAnswer: 3,
        explanation: 'Stimulating scalp treatments contain ingredients like menthol or peppermint that create a cooling sensation and increase blood circulation to the scalp. Improved circulation supports hair follicle health.',
      },
      {
        id: 'mod6-l38-q7',
        type: 'multiple_choice',
        question: 'After applying a scalp treatment, what is the final step before the client leaves?',
        options: [
          'Apply a leave-in conditioner over the treatment',
          'Rinse thoroughly — no product residue should remain on the scalp',
          'Blow-dry the scalp to seal in the treatment',
          'Apply a light oil to lock in the treatment',
        ],
        correctAnswer: 1,
        explanation: 'Scalp treatments must be rinsed thoroughly after the processing time. Product residue left on the scalp can cause irritation, clog follicles, or interfere with subsequent services. Follow manufacturer instructions for rinse timing.',
      },
      {
        id: 'mod6-l38-q8',
        type: 'multiple_choice',
        question: 'A client has product buildup and excess sebum on the scalp. Which treatment type is most appropriate?',
        options: ['Moisturizing', 'Clarifying', 'Stimulating', 'Anti-dandruff'],
        correctAnswer: 1,
        explanation: 'A clarifying scalp treatment is designed to remove product buildup and excess sebum. Moisturizing adds hydration. Stimulating increases circulation. Anti-dandruff targets yeast. Matching the treatment to the specific scalp condition produces the best result.',
      },
    ],
  },
];

async function patchLesson(lesson: typeof LESSONS[0]) {
  console.log(`\nPatching ${lesson.slug}...`);

  const { data, error } = await db
    .from('course_lessons')
    .select('id, quiz_questions')
    .eq('course_id', COURSE_ID)
    .eq('slug', lesson.slug)
    .single();

  if (error || !data) {
    console.error(`  ✗ Not found: ${lesson.slug}`, error?.message);
    return;
  }

  const existing: any[] = Array.isArray(data.quiz_questions) ? data.quiz_questions : [];
  const existingIds = new Set(existing.map((q: any) => q.id));
  const toAdd = lesson.quiz_questions.filter((q: any) => !existingIds.has(q.id));

  if (toAdd.length === 0) {
    console.log(`  ✓ Already at standard (${existing.length} questions)`);
    return;
  }

  const merged = [...existing, ...toAdd];
  const { error: updateError } = await db
    .from('course_lessons')
    .update({ quiz_questions: merged, updated_at: new Date().toISOString() })
    .eq('id', data.id);

  if (updateError) {
    console.error(`  ✗ Update failed:`, updateError.message);
  } else {
    console.log(`  ✓ ${existing.length} → ${merged.length} questions`);
  }
}

async function main() {
  console.log('Patching barber module 6 (Chemical Services) quiz questions...\n');
  for (const lesson of LESSONS) await patchLesson(lesson);
  console.log('\nDone.');
}

main().catch(console.error);
