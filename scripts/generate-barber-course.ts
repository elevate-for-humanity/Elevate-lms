/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

type LessonKind =
  | 'theory'
  | 'demo'
  | 'practice'
  | 'safety'
  | 'disinfection'
  | 'chemical'
  | 'checkpoint';

type ModuleSeed = {
  moduleSlug: string;
  moduleTitle: string;
  moduleOrder: number;
  courseSlug: string;
  lessons: LessonSeed[];
};

type LessonSeed = {
  slug: string;
  title: string;
  objective: string;
  durationMinutes: number;
  lessonOrder: number;
  kind: LessonKind;
  tools?: string[];
  keywords?: string[];
  procedure?: string[];
  safetyNotes?: string[];
  competencyChecks?: string[];
  quizQuestions?: CheckpointQuestion[];
};

type CheckpointQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  rationale: string;
};

type BlueprintLesson = {
  slug: string;
  title: string;
  objective: string;
  durationMinutes: number;
  lessonType: 'lesson' | 'checkpoint';
  lessonOrder: number;
  content: string;
  vocabulary: string[];
  tools: string[];
  safetyWarnings: string[];
  competencyChecks: string[];
  quiz?: { passingScore: number; questions: CheckpointQuestion[] };
};

const OUT_DIR = path.resolve(process.cwd(), 'scripts/generated');
const OUT_FILE = path.join(OUT_DIR, 'barber-course.generated.ts');

const UNIVERSAL_SAFETY_WARNINGS = [
  'Wash or sanitize hands before and after the service.',
  'Use clean, disinfected, and properly stored tools and implements.',
  'Discard single-use items immediately after use.',
  'Do not use broken, cracked, or contaminated implements.',
];

const UNIVERSAL_DISINFECTION_CHECKS = [
  'Pre-clean visible debris before disinfecting.',
  'Follow manufacturer contact time / dwell time exactly.',
  'Discard single-use items after one use.',
  'Do not attempt to disinfect porous items that cannot be properly cleaned.',
  'Change disinfectant solution at least every 24 hours or sooner if contaminated.',
  'Maintain correct cleaning -> disinfecting -> dry/storage sequence.',
];

const BLOOD_EXPOSURE_PROTOCOL = [
  'Stop service and put on gloves.',
  'Apply pressure as needed and use antiseptic according to allowed procedure.',
  'Double-bag contaminated waste if required by regulation.',
  'Clean and disinfect all exposed nonporous surfaces and implements.',
  'Discard single-use contaminated materials immediately.',
  'Wash hands after glove removal.',
];

const CHEMICAL_CHECKS = [
  'Identify contraindications before starting the service.',
  'Use PPE and ensure proper ventilation.',
  'Perform patch test when required.',
  'Perform strand test when required.',
  'Follow timing decision rules based on hair condition and manufacturer directions.',
  'Complete neutralization / rinsing sequence in correct order.',
];

const CLIPPER_CHECKS = [
  'Pre-clean clipper blade and remove visible debris.',
  'Use approved clipper disinfectant according to label directions.',
  'Allow full contact time before reuse or storage.',
];

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))];
}

function buildVocabulary(seed: LessonSeed): string[] {
  const byKind: Record<LessonKind, string[]> = {
    theory: ['consultation', 'sectioning', 'elevation', 'distribution'],
    demo: ['demonstration', 'control', 'tension', 'precision'],
    practice: ['repetition', 'consistency', 'balance', 'finish'],
    safety: ['PPE', 'sanitation', 'infection control', 'exposure incident'],
    disinfection: ['pre-clean', 'contact time', 'disinfectant', 'single-use', 'porous', 'blood exposure', 'EPA registration'],
    chemical: ['contraindication', 'patch test', 'strand test', 'processing', 'neutralization', 'ventilation'],
    checkpoint: ['review', 'mastery', 'competency', 'application'],
  };
  return dedupe([...(seed.keywords ?? []), ...byKind[seed.kind]]);
}

function buildTools(seed: LessonSeed): string[] {
  const byKind: Record<LessonKind, string[]> = {
    theory: ['Notebook', 'Pen'],
    demo: ['Mannequin', 'Clips', 'Comb'],
    practice: ['Mannequin', 'Cape', 'Comb', 'Shears'],
    safety: ['Gloves', 'Hand sanitizer', 'Disinfectant'],
    disinfection: ['Gloves', 'EPA-registered disinfectant', 'Cleaning brush', 'Soap or detergent', 'Paper towels', 'Labeled container'],
    chemical: ['Gloves', 'Cape', 'Timer', 'Applicator bottle or bowl and brush', 'Manufacturer directions', 'Patch test materials', 'Strand test materials'],
    checkpoint: ['Quiz form'],
  };
  return dedupe([...(seed.tools ?? []), ...byKind[seed.kind]]);
}

function buildSafetyWarnings(seed: LessonSeed): string[] {
  const warnings = [...UNIVERSAL_SAFETY_WARNINGS, ...(seed.safetyNotes ?? [])];
  if (seed.kind === 'disinfection' || seed.kind === 'safety') warnings.push(...BLOOD_EXPOSURE_PROTOCOL);
  if (seed.kind === 'chemical') warnings.push(
    "Wear gloves and protect the client's skin and clothing.",
    'Do not proceed if contraindications or scalp irritation are present.',
    'Follow manufacturer directions exactly. Do not guess on timing or mixing.',
    'Ensure adequate ventilation throughout the service.',
  );
  return dedupe(warnings);
}

function buildCompetencyChecks(seed: LessonSeed): string[] {
  const checks = [...(seed.competencyChecks ?? [])];
  if (seed.kind === 'disinfection' || seed.kind === 'safety') {
    checks.push(...UNIVERSAL_DISINFECTION_CHECKS);
    const text = (seed.title + ' ' + seed.objective + ' ' + (seed.procedure ?? []).join(' ')).toLowerCase();
    if (/clipper|trimmer|liner|detailer|blade/.test(text)) checks.push(...CLIPPER_CHECKS);
    checks.push(...BLOOD_EXPOSURE_PROTOCOL);
  }
  if (seed.kind === 'chemical') checks.push(...CHEMICAL_CHECKS);
  return dedupe(checks);
}

function buildProcedure(seed: LessonSeed): string[] {
  if (seed.procedure?.length) return seed.procedure;
  const byKind: Record<LessonKind, string[]> = {
    theory: ['Define the core concept and explain why it matters in client results.', 'Identify the tools, terms, and decision points used in the service.', 'Break down the service into preparation, execution, and finish.', 'Review common mistakes and the correction strategy for each one.'],
    demo: ['Prepare station, tools, and client protection.', 'Demonstrate body position, hand position, and tool control.', 'Show the service in sequence while explaining why each step matters.', 'Pause at key checkpoints to show quality-control standards.'],
    practice: ['Set up tools and client protection.', 'Complete the service in correct sequence.', 'Check symmetry, cleanliness, and finish.', 'Self-evaluate and correct visible errors before final presentation.'],
    safety: ['Set up a clean work area and gather required PPE.', 'Identify contamination risks before starting.', 'Perform the service while maintaining infection-control rules.', 'Dispose, clean, disinfect, and store items correctly at the end.'],
    disinfection: ['Put on gloves and separate soiled items from clean items.', 'Pre-clean visible debris with soap/detergent and water or approved cleaner.', 'Fully immerse or saturate nonporous items with EPA-registered disinfectant.', 'Leave items wet for full manufacturer contact time.', 'Remove, rinse if required, dry, and store in a clean covered container.', 'Discard single-use and porous items that cannot be safely disinfected.', 'Follow blood-exposure protocol immediately if an exposure incident occurs.'],
    chemical: ['Complete consultation and identify contraindications.', 'Drape client, apply PPE, and ensure ventilation.', 'Perform patch test or strand test when required.', 'Apply product using manufacturer directions and control timing based on hair condition.', 'Monitor processing and do not exceed safe limits.', 'Rinse, neutralize, and finish in exact sequence required for the service.'],
    checkpoint: ['Complete the checkpoint and review incorrect responses before progressing.'],
  };
  return byKind[seed.kind];
}

function buildContent(seed: LessonSeed): string {
  const tools = buildTools(seed);
  const procedure = buildProcedure(seed);
  const safetyWarnings = buildSafetyWarnings(seed);
  const checks = buildCompetencyChecks(seed);
  const sections: string[] = [
    `Tools: ${tools.join(' · ')}`,
    '',
    'Procedure',
    procedure.map((s, i) => `${i + 1}. ${s}`).join('\n'),
  ];
  if (safetyWarnings.length) sections.push('', 'Safety / Infection Control', safetyWarnings.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  if (checks.length) sections.push('', 'Competency Checks', checks.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  return sections.join('\n');
}

function assertSeed(seed: LessonSeed): void {
  for (const key of ['slug', 'title', 'objective']) {
    if (!(seed as Record<string, unknown>)[key]) throw new Error(`Missing "${key}" on ${seed.slug || '[unknown]'}`);
  }
  if (seed.kind === 'checkpoint' && !seed.quizQuestions?.length) throw new Error(`Checkpoint ${seed.slug} missing quizQuestions.`);
  if (seed.kind === 'chemical') {
    const text = JSON.stringify(seed).toLowerCase();
    for (const signal of ['patch', 'strand', 'neutral', 'vent']) {
      if (!text.includes(signal)) console.warn(`[WARN] Chemical lesson ${seed.slug} may be missing "${signal}".`);
    }
  }
}

function generateLesson(seed: LessonSeed): BlueprintLesson {
  assertSeed(seed);
  const lesson: BlueprintLesson = {
    slug: seed.slug,
    title: seed.title,
    objective: seed.objective,
    durationMinutes: seed.durationMinutes,
    lessonType: seed.kind === 'checkpoint' ? 'checkpoint' : 'lesson',
    lessonOrder: seed.lessonOrder,
    content: buildContent(seed),
    vocabulary: buildVocabulary(seed),
    tools: buildTools(seed),
    safetyWarnings: buildSafetyWarnings(seed),
    competencyChecks: buildCompetencyChecks(seed),
  };
  if (seed.kind === 'checkpoint') lesson.quiz = { passingScore: 80, questions: seed.quizQuestions ?? [] };
  return lesson;
}

function toTsObject(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, `'`);
}

function safeConstName(slug: string): string { return slug.replace(/[^a-zA-Z0-9]+/g, '_'); }
function escapeQuote(value: string): string { return value.replace(/'/g, "\\'"); }

function renderModule(moduleSeed: ModuleSeed): string {
  const lessons = moduleSeed.lessons.sort((a, b) => a.lessonOrder - b.lessonOrder).map(generateLesson);
  return `export const ${safeConstName(moduleSeed.moduleSlug)} = {
  moduleSlug: '${moduleSeed.moduleSlug}',
  moduleTitle: '${escapeQuote(moduleSeed.moduleTitle)}',
  moduleOrder: ${moduleSeed.moduleOrder},
  courseSlug: '${moduleSeed.courseSlug}',
  lessons: ${toTsObject(lessons)}
};`;
}

function renderFile(modules: ModuleSeed[]): string {
  return `/* AUTO-GENERATED FILE. Do not hand-edit generated output. */\n\n${modules.map(renderModule).join('\n\n')}\n\nexport const generatedBarberCourseModules = [\n${modules.map((m) => `  ${safeConstName(m.moduleSlug)}`).join(',\n')}\n];\n`;
}

const seeds: ModuleSeed[] = [
  {
    moduleSlug: 'barber-module-4',
    moduleTitle: 'Sanitation, Disinfection, and Safe Work Practices',
    moduleOrder: 4,
    courseSlug: 'barber-apprenticeship',
    lessons: [
      { slug: 'barber-lesson-22', title: 'Cleaning vs. Disinfecting', objective: 'Differentiate cleaning, disinfecting, and safe storage of barber implements.', durationMinutes: 20, lessonOrder: 22, kind: 'disinfection', tools: ['EPA-registered disinfectant', 'Brush', 'Gloves', 'Paper towels'], keywords: ['cleaning', 'disinfecting', 'storage'], procedure: ['Separate soiled tools from clean tools before beginning.', 'Pre-clean visible debris from implements using soap or detergent and water.', 'Apply or immerse in EPA-registered disinfectant for full contact time.', 'Remove, dry, and store tools in a clean covered container.', 'Discard porous or single-use items that cannot be safely disinfected.'] },
      { slug: 'barber-lesson-23', title: 'Blood Exposure Procedure', objective: 'Demonstrate the correct response to a minor blood-exposure incident during a barber service.', durationMinutes: 20, lessonOrder: 23, kind: 'safety', tools: ['Gloves', 'Antiseptic', 'Bandage', 'Disinfectant', 'Biohazard bag if required'], keywords: ['blood exposure', 'exposure incident', 'cleanup'], procedure: ['Stop the service immediately and put on gloves.', 'Address the injury according to permitted first-aid procedure.', 'Bag contaminated waste and isolate exposed implements.', 'Clean and disinfect all affected nonporous surfaces and tools.', 'Wash hands after glove removal and reset the station before resuming.'], competencyChecks: ['States the stop-service rule immediately upon exposure.'] },
      { slug: 'barber-lesson-24', title: 'Single-Use, Porous, and Multiuse Items', objective: 'Classify barber tools and materials correctly as single-use, porous, or reusable nonporous items.', durationMinutes: 20, lessonOrder: 24, kind: 'theory', tools: ['Sample implements', 'Waste container', 'Covered storage container'], keywords: ['single-use', 'porous', 'multiuse', 'nonporous'], procedure: ['Identify each item by material and intended use.', 'Separate disposable items from reusable nonporous implements.', 'Explain why porous items cannot be safely disinfected once contaminated.', 'Store only clean, dry, disinfected reusable implements for the next service.'], competencyChecks: ['Correctly discards single-use items after one use.', 'Explains why porous items are not returned to service once contaminated.'] },
      { slug: 'barber-lesson-25', title: 'Clipper, Trimmer, and Blade Sanitation', objective: 'Perform correct pre-cleaning and disinfecting steps for clippers, trimmers, and detachable blades.', durationMinutes: 20, lessonOrder: 25, kind: 'disinfection', tools: ['Clipper', 'Trimmer', 'Blade brush', 'Approved clipper disinfectant', 'Gloves'], keywords: ['clipper', 'trimmer', 'blade', 'contact time'], procedure: ['Turn off and unplug the tool before cleaning.', 'Brush away loose hair and visible debris from the blade area.', 'Pre-clean the blade according to manufacturer directions.', 'Apply approved clipper disinfectant so the blade remains wet for full contact time.', 'Allow blade to dry before reuse or storage.'] },
      { slug: 'barber-lesson-27', title: 'Workstation Reset Between Clients', objective: 'Reset the barber station safely and completely between clients.', durationMinutes: 20, lessonOrder: 27, kind: 'practice', tools: ['Disinfectant', 'Clean towels', 'Waste container', 'Covered storage'], keywords: ['station reset', 'between clients', 'sequence'], procedure: ['Remove used linens, disposables, and visible debris from the station.', 'Clean and disinfect nonporous surfaces using full label contact time.', 'Replace only with clean towels, disinfected implements, and fresh disposables.', 'Confirm the station is dry, organized, and ready for the next client.'], competencyChecks: ['Follows correct sequence without returning a contaminated item to the clean area.'] },
      { slug: 'barber-module-4-checkpoint', title: 'Module 4 Checkpoint', objective: 'Demonstrate mastery of infection control, disinfection, and exposure procedures.', durationMinutes: 15, lessonOrder: 28, kind: 'checkpoint', quizQuestions: [{ id: 'm4-q1', prompt: 'What must happen before a nonporous implement is disinfected?', options: ['It must be sharpened', 'It must be pre-cleaned of visible debris', 'It must be stored dry for 10 minutes', 'It must be wrapped in a towel'], answer: 'It must be pre-cleaned of visible debris', rationale: 'Disinfection is not effective on visibly soiled implements.' }, { id: 'm4-q2', prompt: 'What does contact time mean?', options: ['How long the service lasts', 'How long the tool stays in storage', 'How long the disinfectant must remain wet on the surface or implement', 'How long the client waits before checkout'], answer: 'How long the disinfectant must remain wet on the surface or implement', rationale: 'Label contact time is the required dwell time for effective disinfection.' }, { id: 'm4-q3', prompt: 'Which item must be discarded after one use?', options: ['Metal guard', 'Straight razor handle', 'Neck strip', 'Shears'], answer: 'Neck strip', rationale: 'A neck strip is single-use and must be discarded after use.' }, { id: 'm4-q4', prompt: 'What is the correct first step during a blood exposure incident?', options: ['Continue service quickly', 'Stop service and put on gloves', 'Disinfect the floor first', 'Throw away all tools immediately'], answer: 'Stop service and put on gloves', rationale: 'Service stops first, then protective response begins.' }, { id: 'm4-q5', prompt: 'How often should disinfectant solution be changed at minimum?', options: ['Every 24 hours or sooner if contaminated', 'Once per week', 'Only when empty', 'Every 3 days'], answer: 'Every 24 hours or sooner if contaminated', rationale: 'Fresh solution is required to maintain effectiveness.' }] },
    ],
  },
  {
    moduleSlug: 'barber-module-6',
    moduleTitle: 'Chemical Services Foundations',
    moduleOrder: 6,
    courseSlug: 'barber-apprenticeship',
    lessons: [
      { slug: 'barber-lesson-35', title: 'Chemical Service Safety Screening', objective: 'Identify contraindications and determine whether a chemical service can proceed safely.', durationMinutes: 25, lessonOrder: 35, kind: 'chemical', tools: ['Client record', 'Gloves', 'Cape', 'Manufacturer directions'], keywords: ['contraindications', 'consultation', 'patch test', 'ventilation'], procedure: ['Review client history, scalp condition, and prior chemical services.', 'Identify contraindications such as irritation, open skin, incompatible prior services, or unknown metallic salts.', 'Drape client, wear gloves, and ensure proper ventilation before handling product.', 'Decide whether service may proceed, requires modification, or must be refused.'], competencyChecks: ['Names at least three contraindications that require delay or refusal of service.'] },
      { slug: 'barber-lesson-36', title: 'Patch Test and Strand Test', objective: 'Perform patch testing and strand testing correctly before selected chemical services.', durationMinutes: 25, lessonOrder: 36, kind: 'chemical', tools: ['Test materials', 'Timer', 'Gloves', 'Manufacturer directions'], keywords: ['patch test', 'strand test', 'allergy', 'elasticity'], procedure: ['Set up the test area using gloves and product directions.', 'Perform a patch test when required and document timing and client response.', 'Perform a strand test to evaluate hair reaction, strength, and expected processing behavior.', 'Use test results to confirm, modify, or decline the planned service.'] },
      { slug: 'barber-lesson-37', title: 'Processing Control and Timing Decisions', objective: 'Adjust processing decisions based on hair condition, test results, and manufacturer directions.', durationMinutes: 25, lessonOrder: 37, kind: 'chemical', tools: ['Timer', 'Sectioning clips', 'Manufacturer directions', 'Gloves'], keywords: ['processing', 'timing', 'decision rules', 'hair condition'], procedure: ['Section the hair and apply product as directed.', 'Use IF/THEN timing rules: IF hair is fragile or compromised, THEN reduce processing and monitor more frequently.', 'Use IF/THEN timing rules: IF strand test shows poor resilience, THEN stop and reformulate or refuse the service.', 'Monitor continuously and do not exceed manufacturer limits.'], competencyChecks: ['Uses explicit IF/THEN timing language tied to hair condition and strand test results.'] },
      { slug: 'barber-lesson-38', title: 'Rinsing, Neutralizing, and Finishing', objective: 'Complete the rinse and neutralization sequence in the correct order for chemical services.', durationMinutes: 25, lessonOrder: 38, kind: 'chemical', tools: ['Timer', 'Neutralizer if required', 'Towels', 'Gloves'], keywords: ['neutralization', 'rinsing', 'sequence', 'post-service care'], procedure: ['Rinse thoroughly according to service requirements before applying any post-process product.', 'Apply neutralizer exactly as directed when required for the service.', 'Verify the neutralization sequence is complete before final styling.', 'Review home-care and reservice timing with the client.'], competencyChecks: ['Explains why the neutralization sequence cannot be abbreviated or rearranged.'] },
      { slug: 'barber-module-6-checkpoint', title: 'Module 6 Checkpoint', objective: 'Demonstrate safe chemical-service decision making and sequence control.', durationMinutes: 15, lessonOrder: 39, kind: 'checkpoint', quizQuestions: [{ id: 'm6-q1', prompt: 'Which condition is a contraindication to proceeding with a chemical service?', options: ['Healthy scalp and no history concerns', 'Open lesion or active scalp irritation', 'Client asks for a shorter haircut', 'Hair is slightly damp'], answer: 'Open lesion or active scalp irritation', rationale: 'A visible scalp issue can require postponement or refusal of service.' }, { id: 'm6-q2', prompt: 'Why is a strand test useful?', options: ['It replaces manufacturer directions', 'It shows how the hair is likely to react before the full service', 'It disinfects the hair', 'It makes patch tests unnecessary'], answer: 'It shows how the hair is likely to react before the full service', rationale: 'A strand test helps predict behavior, timing, and safety.' }, { id: 'm6-q3', prompt: 'What should you do if the strand test shows the hair is too weak for the planned service?', options: ['Proceed anyway but process longer', 'Ignore the result if the client insists', 'Stop and modify or refuse the service', 'Add more product immediately'], answer: 'Stop and modify or refuse the service', rationale: 'Weak test results override the original service plan.' }] },
    ],
  },
];

function main(): void {
  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_FILE, renderFile(seeds), 'utf8');
  console.log(`Generated: ${OUT_FILE}`);
  console.log('\nNext steps:');
  console.log('1. Review scripts/generated/barber-course.generated.ts');
  console.log('2. Merge lessons into lib/curriculum/blueprints/barber-apprenticeship.ts');
  console.log('3. Run: pnpm tsx scripts/verify-barber-course.ts');
}

main();
