import type { ModuleSeed } from '../types';

export const module6: ModuleSeed = {
  slug: 'barber-module-6',
  title: 'Module 6: Chemical Services',
  moduleOrder: 6,
  objective: 'Apply chemical service knowledge including color theory, patch testing, relaxer chemistry, and scalp treatments with correct safety protocols.',
  lessons: [
    {
      slug: 'barber-lesson-35',
      title: 'Hair Color Theory',
      lessonOrder: 1,
      durationMin: 20,
      objective: 'Explain the color wheel and how it applies to hair color services.',
      style: 'theory',
      vocabulary: [
        { term: 'Primary colors', definition: 'Red, yellow, blue — the base colors from which all others are mixed.' },
        { term: 'Complementary colors', definition: 'Colors opposite each other on the color wheel. Used to neutralize unwanted tones.' },
        { term: 'Level system', definition: 'Scale of 1 (black) to 10 (lightest blonde) measuring hair color depth.' },
        { term: 'Developer', definition: 'Hydrogen peroxide solution that opens the cuticle and activates color.' },
      ],
      stateBoardFocus: ['color wheel', 'primary colors', 'complementary colors', 'hair color levels', 'types of hair color'],
      sections: [
        {
          type: 'text',
          heading: 'The Color Wheel',
          body: [
            'Primary colors: red, yellow, blue.',
            'Secondary colors are made by mixing two primaries: orange (red + yellow), green (yellow + blue), violet (blue + red).',
            'Complementary colors cancel each other out — used to neutralize unwanted tones. Example: violet cancels yellow brassiness.',
          ],
        },
        {
          type: 'table',
          heading: 'Hair Color Levels',
          rows: [
            { label: 'Level 1', value: 'Black' },
            { label: 'Level 4–5', value: 'Dark brown' },
            { label: 'Level 6–7', value: 'Medium brown to dark blonde' },
            { label: 'Level 8–9', value: 'Light blonde' },
            { label: 'Level 10', value: 'Lightest blonde' },
          ],
        },
        {
          type: 'table',
          heading: 'Types of Hair Color',
          rows: [
            { label: 'Temporary', value: 'Coats the cuticle. Washes out in 1–2 shampoos. No developer.' },
            { label: 'Semi-permanent', value: 'No developer. Lasts 4–6 weeks. Cannot lighten.' },
            { label: 'Demi-permanent', value: 'Low-volume developer. Lasts 6–8 weeks. Cannot lighten significantly.' },
            { label: 'Permanent', value: 'Opens cuticle with developer. Permanent change. Can lighten and deposit.' },
          ],
        },
        {
          type: 'callout',
          heading: 'NIC Exam Focus',
          tone: 'exam',
          body: [
            'Know the level system (1–10), the four types of color, and which complementary color neutralizes which unwanted tone. These are high-frequency written exam topics.',
          ],
        },
      ],
      competencyChecks: [
        'Identifies primary, secondary, and complementary colors',
        'States the hair color level system (1–10)',
        'Distinguishes temporary, semi-permanent, demi-permanent, and permanent color',
        'Identifies which complementary color neutralizes brassiness',
      ],
    },
    {
      slug: 'barber-lesson-36',
      title: 'Chemical Safety & Patch Testing',
      lessonOrder: 2,
      durationMin: 20,
      objective: 'Perform a patch test and identify chemical service contraindications.',
      style: 'practical',
      tools: ['Nitrile gloves', 'Protective apron', 'Eye protection', 'Patch test applicator'],
      sanitationNotes: [
        'Always wear nitrile gloves when handling chemical services.',
        'Ensure adequate ventilation in the service area.',
        'Dispose of chemical waste per manufacturer instructions.',
      ],
      stateBoardFocus: ['patch test', 'PPE for chemical services', 'contraindications', 'chemical safety'],
      sections: [
        {
          type: 'steps',
          heading: 'Patch Test Procedure',
          steps: [
            'Perform 24–48 hours before any chemical service.',
            'Apply a small amount of product behind the ear or inside the elbow.',
            'Leave uncovered for the required time.',
            'Inspect at 24 hours and again at 48 hours.',
            'If redness, swelling, itching, or burning occurs — do not proceed with the service.',
          ],
        },
        {
          type: 'table',
          heading: 'PPE for Chemical Services',
          rows: [
            { label: 'Nitrile gloves', value: 'Always. Latex gloves are not adequate — chemicals can permeate.' },
            { label: 'Protective apron', value: 'Protects clothing and skin from splashes.' },
            { label: 'Eye protection', value: 'Required when mixing or applying chemicals.' },
            { label: 'Ventilation', value: 'Ensure adequate airflow. Chemical fumes can cause respiratory irritation.' },
          ],
        },
        {
          type: 'callout',
          heading: 'Contraindications — Do Not Perform Chemical Services If',
          tone: 'warning',
          body: [
            'Client has scalp abrasions, open wounds, or active skin conditions.',
            'Client had a chemical service within the past 2–4 weeks (check manufacturer guidelines).',
            'Client has known allergies to ingredients in the product.',
            'Patch test showed a reaction.',
            'Scalp health is compromised.',
          ],
        },
      ],
      competencyChecks: [
        'Performs patch test 24–48 hours before chemical service',
        'Wears nitrile gloves, apron, and eye protection during chemical services',
        'Identifies all contraindications before proceeding',
        'Stops service if patch test shows any reaction',
      ],
    },
    {
      slug: 'barber-lesson-37',
      title: 'Relaxers & Texturizers',
      lessonOrder: 3,
      durationMin: 20,
      objective: 'Understand relaxer chemistry and application safety.',
      style: 'theory',
      vocabulary: [
        { term: 'Disulfide bonds', definition: 'Chemical bonds in the cortex that give hair its curl pattern. Relaxers break these bonds.' },
        { term: 'Lye relaxer', definition: 'Sodium hydroxide-based relaxer. Faster processing, stronger action.' },
        { term: 'No-lye relaxer', definition: 'Guanidine-based relaxer. Gentler, less scalp irritation.' },
        { term: 'Neutralizer', definition: 'Stops the relaxer process and restores the hair\'s pH.' },
        { term: 'Texturizer', definition: 'Same chemistry as a relaxer but shorter processing time — loosens curl without fully straightening.' },
      ],
      stateBoardFocus: ['relaxer chemistry', 'lye vs no-lye', 'neutralizer', 'scalp basing', 'application rules'],
      sections: [
        {
          type: 'text',
          heading: 'How Relaxers Work',
          body: [
            'Relaxers break the disulfide bonds in the cortex that give hair its curl pattern.',
            'The hair is then restructured in a straighter form.',
            'The neutralizer stops the process by restoring the hair\'s pH and re-forming bonds in the new position.',
          ],
        },
        {
          type: 'table',
          heading: 'Relaxer Types',
          rows: [
            { label: 'Lye (sodium hydroxide)', value: 'Faster processing. Stronger. More scalp irritation risk. Requires careful timing.' },
            { label: 'No-lye (guanidine)', value: 'Gentler. Less scalp irritation. May leave calcium deposits — requires chelating shampoo.' },
            { label: 'Texturizer', value: 'Same chemistry, shorter processing time. Loosens curl without fully straightening.' },
          ],
        },
        {
          type: 'steps',
          heading: 'Application Rules',
          steps: [
            'Never apply to a scratched, irritated, or broken scalp.',
            'Base the scalp with petroleum jelly before application to protect skin.',
            'Apply to new growth only — do not overlap onto previously relaxed hair.',
            'Process only to the manufacturer\'s recommended time. Do not guess.',
            'Neutralize thoroughly — this stops the chemical process. Insufficient neutralizing causes continued processing and breakage.',
          ],
        },
        {
          type: 'callout',
          heading: 'Critical Safety Rule',
          tone: 'warning',
          body: [
            'Never apply a relaxer to a scratched scalp. Instruct clients not to scratch their scalp for 48 hours before a relaxer service. Chemical burns on a broken scalp can be severe.',
          ],
        },
      ],
      competencyChecks: [
        'Explains how relaxers break disulfide bonds',
        'Distinguishes lye from no-lye relaxers',
        'States the purpose of the neutralizer',
        'Identifies the scalp basing requirement before application',
        'States the rule against applying to a scratched or broken scalp',
      ],
    },
    {
      slug: 'barber-lesson-38',
      title: 'Scalp Treatments',
      lessonOrder: 4,
      durationMin: 15,
      objective: 'Select and apply appropriate scalp treatments for common conditions.',
      style: 'practical',
      tools: ['Shampoo', 'Scalp treatment product', 'Applicator bottle', 'Gloves'],
      sanitationNotes: [
        'Shampoo bowl must be disinfected between clients.',
        'Use clean towels for every client.',
        'Wear gloves when applying medicated treatments.',
      ],
      stateBoardFocus: ['scalp treatment types', 'treatment application', 'product selection'],
      sections: [
        {
          type: 'table',
          heading: 'Scalp Treatment Types',
          rows: [
            { label: 'Moisturizing', value: 'For dry, flaky scalp. Restores hydration.' },
            { label: 'Clarifying', value: 'Removes product buildup and excess sebum.' },
            { label: 'Anti-dandruff', value: 'Contains zinc pyrithione or selenium sulfide. Reduces Malassezia yeast.' },
            { label: 'Stimulating', value: 'Increases circulation. Contains menthol or peppermint.' },
          ],
        },
        {
          type: 'steps',
          heading: 'Application Procedure',
          steps: [
            'Shampoo hair first to remove debris and open the scalp.',
            'Apply treatment directly to scalp in sections using an applicator bottle.',
            'Massage in with fingertip pressure — not fingernails.',
            'Process per manufacturer instructions.',
            'Rinse thoroughly — no product residue.',
          ],
        },
        {
          type: 'callout',
          heading: 'Referral Rule',
          tone: 'warning',
          body: [
            'Scalp treatments address cosmetic conditions. If a client has a medical scalp condition (severe seborrheic dermatitis, psoriasis flare, fungal infection), refer to a physician before performing any treatment.',
          ],
        },
      ],
      competencyChecks: [
        'Selects correct treatment type for the client\'s scalp condition',
        'Shampoos before applying treatment',
        'Uses fingertip pressure — not fingernails — during massage',
        'Rinses thoroughly with no product residue',
        'Refers client to physician when scalp condition is medical in nature',
      ],
    },
  ],
  checkpoint: {
    slug: 'barber-module-6-checkpoint',
    title: 'Chemical Services Checkpoint',
    lessonOrder: 5,
    durationMin: 20,
    objective: 'Demonstrate mastery of chemical service knowledge.',
    instructions: ['Answer all questions before reviewing results.', 'A score of 70% or higher is required to advance to Module 7.'],
    rubric: ['States patch test timing', 'Identifies types of hair color', 'Explains relaxer neutralizer purpose', 'Names PPE for chemical services', 'Identifies scalp treatment types'],
    quiz: {
      passingScore: 70,
      questions: [
        { prompt: 'How long before a chemical service should a patch test be performed?', choices: ['1 hour', '6 hours', '24–48 hours', '1 week'], answerIndex: 2, rationale: 'A patch test needs 24–48 hours to reveal any allergic reaction.' },
        { prompt: 'Which type of hair color requires a developer to open the cuticle?', choices: ['Temporary', 'Semi-permanent', 'Permanent', 'Rinse'], answerIndex: 2, rationale: 'Permanent color uses developer (hydrogen peroxide) to open the cuticle and deposit color.' },
        { prompt: 'What stops the chemical process during a relaxer service?', choices: ['Shampoo', 'Conditioner', 'Neutralizer', 'Water rinse'], answerIndex: 2, rationale: 'The neutralizer restores the hair\'s pH and stops the relaxer from processing.' },
        { prompt: 'Hair color level 1 represents:', choices: ['Lightest blonde', 'Medium brown', 'Dark brown', 'Black'], answerIndex: 3, rationale: 'Level 1 is the darkest — black. Level 10 is the lightest blonde.' },
        { prompt: 'Before applying a relaxer, the scalp should be:', choices: ['Scratched to open pores', 'Wet with water', 'Based with petroleum jelly', 'Treated with alcohol'], answerIndex: 2, rationale: 'Petroleum jelly protects the scalp from chemical burns during relaxer application.' },
        { prompt: 'Which complementary color neutralizes yellow/brassy tones?', choices: ['Red', 'Green', 'Orange', 'Violet'], answerIndex: 3, rationale: 'Violet is complementary to yellow on the color wheel and neutralizes brassiness.' },
      ],
    },
  },
};
