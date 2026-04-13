/**
 * Expand checkpoints 6-7 to 10q and final exam to 25q.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-checkpoints-exam.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const EXTRA: Record<string, object[]> = {

  // ── Module 6 Checkpoint: Chemical Services (5q → 10q) ───────────────────────
  'barber-module-6-checkpoint': [
    {
      id: 'cs-q6',
      type: 'multiple_choice',
      question: 'Which chemical service permanently straightens tightly coiled hair by breaking disulfide bonds?',
      options: ['Texturizer', 'Relaxer', 'Keratin treatment', 'Temporary press'],
      correctAnswer: 1,
      explanation: 'A relaxer uses sodium hydroxide (lye) or guanidine (no-lye) to permanently break disulfide bonds in the cortex, straightening the hair. A texturizer uses the same chemistry but is left on for less time to loosen rather than fully straighten the curl.',
    },
    {
      id: 'cs-q7',
      type: 'multiple_choice',
      question: 'What is the purpose of a base cream applied before a relaxer service?',
      options: [
        'To help the relaxer penetrate faster',
        'To protect the scalp and skin from chemical burns',
        'To add moisture to the hair before processing',
        'To neutralize the relaxer after processing',
      ],
      correctAnswer: 1,
      explanation: 'Base cream (petroleum-based) is applied to the scalp, hairline, and ears before a relaxer to protect the skin from chemical burns. It does not affect the relaxer\'s action on the hair shaft.',
    },
    {
      id: 'cs-q8',
      type: 'multiple_choice',
      question: 'A client\'s scalp shows active abrasions or scratches. What should the barber do regarding a scheduled relaxer service?',
      options: [
        'Apply extra base cream and proceed',
        'Postpone the service — chemical relaxers on broken skin cause severe burns',
        'Use a no-lye relaxer instead, which is gentler',
        'Reduce processing time by half',
      ],
      correctAnswer: 1,
      explanation: 'Active scalp abrasions are a contraindication for all chemical services. Relaxer chemicals on broken skin cause severe chemical burns. The service must be postponed until the scalp has fully healed.',
    },
    {
      id: 'cs-q9',
      type: 'multiple_choice',
      question: 'On the color wheel, which color neutralizes unwanted orange tones in hair?',
      options: ['Red', 'Yellow', 'Blue', 'Green'],
      correctAnswer: 2,
      explanation: 'Blue is the complementary (opposite) color to orange on the color wheel. Blue-toned toners and toning shampoos neutralize brassy orange tones, which commonly appear when dark hair is lightened to a medium level.',
    },
    {
      id: 'cs-q10',
      type: 'multiple_choice',
      question: 'Which scalp treatment ingredient is most effective for addressing dandruff caused by Malassezia fungus?',
      options: ['Tea tree oil', 'Zinc pyrithione', 'Argan oil', 'Biotin'],
      correctAnswer: 1,
      explanation: 'Zinc pyrithione is an antifungal and antibacterial agent proven effective against Malassezia, the fungus associated with seborrheic dermatitis (dandruff). It is the active ingredient in many medicated dandruff shampoos.',
    },
  ],

  // ── Module 7 Checkpoint: Professional Skills (5q → 10q) ─────────────────────
  'barber-module-7-checkpoint': [
    {
      id: 'ps-q6',
      type: 'multiple_choice',
      question: 'A barber working as an independent contractor in a booth rental arrangement is responsible for:',
      options: [
        'Paying only the booth rental fee — the shop owner handles all taxes',
        'Self-employment taxes, their own supplies, and their own liability insurance',
        'Nothing beyond showing up — the shop owner covers all business expenses',
        'Paying the shop owner a percentage of each service',
      ],
      correctAnswer: 1,
      explanation: 'Booth renters are independent contractors. They pay self-employment tax (15.3%), purchase their own supplies, carry their own liability insurance, and are responsible for their own business expenses. The shop owner provides only the space.',
    },
    {
      id: 'ps-q7',
      type: 'multiple_choice',
      question: 'Which of the following best describes a "consultation card" in a professional barbershop?',
      options: [
        'A marketing flyer given to new clients',
        'A record of the client\'s service history, preferences, and health notes used to personalize each visit',
        'A card the client fills out to rate their experience',
        'A price list for services',
      ],
      correctAnswer: 1,
      explanation: 'A consultation card (client record card) documents service history, product preferences, health contraindications, and style notes. It allows the barber to deliver consistent, personalized service on every visit and is a professional best practice.',
    },
    {
      id: 'ps-q8',
      type: 'multiple_choice',
      question: 'What is the primary advantage of building a strong social media presence for a barber?',
      options: [
        'It replaces the need for walk-in clients',
        'It showcases work, attracts new clients, and builds a personal brand that generates referrals',
        'It allows the barber to charge higher prices automatically',
        'It is required by Indiana state law for licensed barbers',
      ],
      correctAnswer: 1,
      explanation: 'Social media (especially Instagram and TikTok) is the primary marketing tool for modern barbers. Before/after photos, reels, and client testimonials build credibility, attract new clients, and generate referrals — all at no cost beyond time.',
    },
    {
      id: 'ps-q9',
      type: 'multiple_choice',
      question: 'A client is unhappy with their haircut. What is the professional response?',
      options: [
        'Explain why the cut is correct and ask the client to reconsider',
        'Apologize, listen to the concern, offer to correct it at no charge, and document the feedback',
        'Offer a partial refund and end the conversation',
        'Refer the client to another barber',
      ],
      correctAnswer: 1,
      explanation: 'Professional client recovery: acknowledge the concern without defensiveness, offer to correct the issue at no charge, and document what happened to prevent recurrence. This approach retains the client and demonstrates professionalism.',
    },
    {
      id: 'ps-q10',
      type: 'multiple_choice',
      question: 'Which styling product provides the strongest hold with a high-shine finish?',
      options: ['Matte clay', 'Pomade', 'Sea salt spray', 'Dry shampoo'],
      correctAnswer: 1,
      explanation: 'Pomade provides strong hold with a high-shine, slick finish. It is ideal for classic styles like pompadours and slick-backs. Matte clay provides strong hold with no shine. Sea salt spray provides light hold with texture.',
    },
  ],

  // ── Final Exam: Indiana State Board (8q → 25q) ───────────────────────────────
  'barber-indiana-state-board-exam': [
    {
      id: 'ep-q9',
      type: 'multiple_choice',
      question: 'Which disinfectant concentration of Barbicide is required for proper tool disinfection?',
      options: [
        '1 oz Barbicide per gallon of water',
        '2 oz Barbicide per 32 oz of water (per manufacturer label)',
        '1 tablespoon per cup of water',
        'Full-strength, undiluted',
      ],
      correctAnswer: 1,
      explanation: 'Barbicide must be mixed per the manufacturer\'s label — typically 2 oz per 32 oz of water. Using incorrect concentrations (too dilute) renders it ineffective; too concentrated wastes product and may damage tools. Always follow label directions.',
    },
    {
      id: 'ep-q10',
      type: 'multiple_choice',
      question: 'The hair\'s ability to stretch and return to its original shape is called:',
      options: ['Porosity', 'Elasticity', 'Texture', 'Density'],
      correctAnswer: 1,
      explanation: 'Elasticity is the hair\'s ability to stretch under tension and return to its original length. Healthy hair can stretch up to 50% when wet. Poor elasticity indicates damaged cortex bonds and is a contraindication for chemical services.',
    },
    {
      id: 'ep-q11',
      type: 'multiple_choice',
      question: 'Which of the following is the correct order for a standard straight razor shave?',
      options: [
        'Apply lather → first pass with the grain → second pass across the grain → post-shave',
        'Hot towel → apply lather → first pass with the grain → second pass across the grain → post-shave',
        'Apply lather → shave against the grain → hot towel → post-shave',
        'Cold towel → apply lather → shave in any direction → post-shave',
      ],
      correctAnswer: 1,
      explanation: 'The correct sequence: hot towel to soften the beard → apply pre-shave and lather → first pass with the grain → re-lather → second pass across the grain → optional third pass against the grain → post-shave products. The hot towel step is essential for softening coarse facial hair.',
    },
    {
      id: 'ep-q12',
      type: 'multiple_choice',
      question: 'A client has pediculosis capitis. What must the barber do?',
      options: [
        'Shampoo the client\'s hair with a medicated shampoo and proceed',
        'Refuse service, disinfect all tools and surfaces the client contacted, and refer the client to a physician',
        'Use a fine-tooth comb to remove the lice and proceed with the service',
        'Wear gloves and proceed with a shorter service',
      ],
      correctAnswer: 1,
      explanation: 'Pediculosis capitis (head lice) is highly contagious. The barber must refuse service immediately, disinfect all surfaces and tools the client contacted, and refer the client to a physician for treatment. Proceeding with any service risks spreading lice to other clients.',
    },
    {
      id: 'ep-q13',
      type: 'multiple_choice',
      question: 'What is the function of the arrector pili muscle?',
      options: [
        'It pumps blood to the hair follicle',
        'It causes the hair to stand upright (goosebumps) in response to cold or fear',
        'It produces sebum',
        'It controls the hair growth cycle',
      ],
      correctAnswer: 1,
      explanation: 'The arrector pili is a small smooth muscle attached to each hair follicle. When it contracts (triggered by cold or adrenaline), it pulls the follicle upright, causing the hair to stand and creating goosebumps. It has no role in sebum production or the growth cycle.',
    },
    {
      id: 'ep-q14',
      type: 'multiple_choice',
      question: 'Which fade technique starts the fade line at the occipital bone or above?',
      options: ['Low fade', 'Mid fade', 'High fade', 'Skin fade'],
      correctAnswer: 2,
      explanation: 'A high fade starts at or above the occipital bone, leaving very little hair on the sides and back. A low fade starts just above the ear; a mid fade starts between the ear and the occipital bone. A skin fade refers to the closeness of the cut (down to skin), not the starting height.',
    },
    {
      id: 'ep-q15',
      type: 'multiple_choice',
      question: 'Indiana state law requires barbershops to maintain a disinfectant solution that is:',
      options: [
        'Changed weekly',
        'Changed daily or when visibly contaminated, whichever comes first',
        'Changed monthly',
        'Changed only when it changes color',
      ],
      correctAnswer: 1,
      explanation: 'Indiana state board rules require disinfectant solutions (such as Barbicide) to be changed daily or immediately when visibly contaminated (cloudy, contains debris). A contaminated solution cannot effectively disinfect tools.',
    },
    {
      id: 'ep-q16',
      type: 'multiple_choice',
      question: 'The parietal ridge is significant in haircutting because it:',
      options: [
        'Marks where the fade line must always be set',
        'Is the widest point of the head and the natural transition between the sides and the top',
        'Is where the occipital bone protrudes',
        'Determines the natural part line',
      ],
      correctAnswer: 1,
      explanation: 'The parietal ridge is the widest point of the head. It is the natural transition zone between the sides and the top. Fade lines that cross the parietal ridge require careful blending to avoid a visible shelf or weight line.',
    },
    {
      id: 'ep-q17',
      type: 'multiple_choice',
      question: 'Which of the following is a violation of Indiana barber law?',
      options: [
        'Performing a haircut service on a client with no scalp conditions',
        'Performing any barbering service without a valid Indiana barber license',
        'Using electric clippers on a client who requested scissors only',
        'Charging more than the posted price for a service',
      ],
      correctAnswer: 1,
      explanation: 'Performing barbering services without a valid Indiana license is a violation of the Indiana Barber Act, subject to fines and criminal penalties. Charging more than posted prices is also a violation, but unlicensed practice is the most serious offense.',
    },
    {
      id: 'ep-q18',
      type: 'multiple_choice',
      question: 'Which hair growth phase is the transitional phase where the follicle shrinks and detaches from the blood supply?',
      options: ['Anagen', 'Catagen', 'Telogen', 'Exogen'],
      correctAnswer: 1,
      explanation: 'Catagen is the brief transitional phase (2-3 weeks) where the follicle shrinks, detaches from the dermal papilla, and stops producing new hair. It accounts for about 1-3% of scalp hairs at any time.',
    },
    {
      id: 'ep-q19',
      type: 'multiple_choice',
      question: 'A barber accidentally cuts a client and blood is present. After controlling the bleeding, what must happen to all tools that contacted blood?',
      options: [
        'Rinse with water and continue using them',
        'Remove from service, pre-clean, and disinfect with an EPA-registered disinfectant before any further use',
        'Wipe with an alcohol pad and continue',
        'Discard all tools — they cannot be reused after blood contact',
      ],
      correctAnswer: 1,
      explanation: 'Any tool that contacts blood must be removed from service immediately, pre-cleaned to remove organic matter, then disinfected with an EPA-registered disinfectant for the full contact time. This is required by bloodborne pathogen protocols and Indiana state board rules.',
    },
    {
      id: 'ep-q20',
      type: 'multiple_choice',
      question: 'What does "with the grain" mean in straight razor shaving?',
      options: [
        'Shaving in the direction opposite to hair growth',
        'Shaving in the direction of hair growth',
        'Shaving across the hair growth direction at 90 degrees',
        'Shaving in circular motions',
      ],
      correctAnswer: 1,
      explanation: 'Shaving "with the grain" means moving the razor in the same direction the hair grows. This is the first and safest pass — it removes most of the hair with minimal skin irritation. Subsequent passes may go across or against the grain for a closer shave.',
    },
    {
      id: 'ep-q21',
      type: 'multiple_choice',
      question: 'Which of the following best describes androgenetic alopecia?',
      options: [
        'Hair loss caused by a fungal infection',
        'Hereditary, hormone-related hair loss following a predictable pattern',
        'Sudden patchy hair loss from an autoimmune response',
        'Hair loss caused by tight hairstyles',
      ],
      correctAnswer: 1,
      explanation: 'Androgenetic alopecia (male/female pattern baldness) is hereditary and driven by DHT (dihydrotestosterone) sensitivity in genetically predisposed follicles. It follows predictable patterns (Norwood scale for men). It is not contagious and does not require service refusal.',
    },
    {
      id: 'ep-q22',
      type: 'multiple_choice',
      question: 'A #0 clipper blade (no guard) cuts hair to approximately:',
      options: ['Skin level (0 mm)', '1/16 inch (1.5 mm)', '1/8 inch (3 mm)', '1/4 inch (6 mm)'],
      correctAnswer: 1,
      explanation: 'A #0 blade (bare blade, no guard) cuts to approximately 1/16 inch (1.5 mm) — very close but not to skin. A "skin fade" or "bald fade" uses the blade at an angle or with a zero-gap adjustment to cut closer to skin level.',
    },
    {
      id: 'ep-q23',
      type: 'multiple_choice',
      question: 'What is the primary purpose of a styptic pencil or powder in a barbershop?',
      options: [
        'To disinfect minor cuts',
        'To constrict blood vessels and stop minor bleeding from nicks',
        'To soothe razor burn',
        'To prevent infection in open wounds',
      ],
      correctAnswer: 1,
      explanation: 'Styptic pencils and powders contain aluminum sulfate or alum, which constrict blood vessels (vasoconstriction) to stop minor bleeding from nicks. They do not disinfect — a separate antiseptic is needed for infection prevention.',
    },
    {
      id: 'ep-q24',
      type: 'multiple_choice',
      question: 'Under Indiana law, how must a barber respond if asked to perform a service they are not trained to do safely?',
      options: [
        'Attempt the service and charge a lower price',
        'Decline the service and refer the client to a qualified professional',
        'Perform the service with the client\'s written consent',
        'Perform the service only if the client signs a waiver',
      ],
      correctAnswer: 1,
      explanation: 'Indiana barber law and professional ethics require barbers to practice only within their competence. Performing services outside one\'s training creates liability and risks client harm. The professional response is to decline and refer.',
    },
    {
      id: 'ep-q25',
      type: 'multiple_choice',
      question: 'Which of the following correctly describes the difference between sanitization and disinfection?',
      options: [
        'They are the same process with different names',
        'Sanitization reduces bacteria to safe levels on skin/food surfaces; disinfection destroys pathogens on non-living surfaces',
        'Disinfection is used on skin; sanitization is used on tools',
        'Sanitization is stronger than disinfection',
      ],
      correctAnswer: 1,
      explanation: 'Sanitization reduces microbial counts to safe levels on skin or food-contact surfaces (e.g., hand sanitizer). Disinfection destroys or inactivates pathogens on non-living surfaces (e.g., tools, counters) using EPA-registered chemicals. Disinfection is the standard for barbering tools.',
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
