/**
 * HVAC curriculum seed — EPA 608 Universal
 *
 * Reads lesson definitions from lms-data/courses/program-hvac.ts
 * and writes them into curriculum_lessons + curriculum_quizzes via
 * CurriculumGenerator.
 *
 * Domain mapping (EPA-608 credential, 4 domains @ 25% each):
 *   core      — mod-1 (Safety), mod-2 (Fundamentals), mod-3 (Refrigeration Basics),
 *               mod-4 (Electrical), mod-10 (Cert Prep)
 *   type_i    — mod-5 (Small Appliances / Type I systems)
 *   type_ii   — mod-6 (Cooling Systems / Type II high-pressure), mod-8 (Installation)
 *   type_iii  — mod-7 (Ductwork / Type III low-pressure), mod-9 (Maintenance)
 *
 * Run:
 *   npx tsx scripts/seed-hvac-curriculum.ts
 *   npx tsx scripts/seed-hvac-curriculum.ts --force
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { CurriculumGenerator } from '../lib/services/curriculum-generator';
import type { QuizDef } from '../lib/services/curriculum-generator';
import { hvacCourse } from '../lms-data/courses/program-hvac';

const HVAC_PROGRAM_ID    = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
const EPA608_CRED_ID     = 'd37ae8a2-9297-44d1-83db-fa7ef375b796';
const HVAC_COURSE_ID     = 'f0593164-55be-5867-98e7-8a86770a8dd0';

// Domain mapping rationale:
//   core     — safety, fundamentals, refrigeration basics, electrical, cert prep
//              (EPA 608 Core covers refrigerant handling rules and environmental law)
//   type_i   — small appliances (≤5 lbs refrigerant): window units, dehumidifiers,
//              household refrigerators — mod-5 (Heating Systems) covers heat pumps
//              which include small-appliance refrigerant circuits
//   type_ii  — high-pressure systems (R-22, R-410A): residential/commercial A/C,
//              cooling systems, installation
//   type_iii — low-pressure systems (R-11, R-123): large chillers, ductwork,
//              maintenance of low-pressure equipment
const MODULE_DOMAIN_MAP: Record<string, string> = {
  'hvac-mod-1':  'core',
  'hvac-mod-2':  'core',
  'hvac-mod-3':  'core',
  'hvac-mod-4':  'core',
  'hvac-mod-5':  'type_i',   // Heating Systems incl. heat pumps (small-appliance circuits)
  'hvac-mod-6':  'type_ii',  // Cooling Systems (high-pressure R-410A)
  'hvac-mod-7':  'type_iii', // Ductwork (low-pressure distribution)
  'hvac-mod-8':  'type_ii',  // Installation (high-pressure system commissioning)
  'hvac-mod-9':  'type_iii', // Maintenance (low-pressure system service)
  'hvac-mod-10': 'core',     // Certification Prep
};

// Quiz questions keyed by lesson id, aligned to EPA-608 exam blueprint.
const QUIZ_QUESTIONS: Record<string, Omit<QuizDef, 'quizOrder'>[]> = {
  // mod-1: Safety & Tools (core)
  'hvac-1-4': [
    {
      question: 'Which PPE is required when working with refrigerants?',
      options: ['Safety glasses only', 'Safety glasses and chemical-resistant gloves', 'Hard hat and steel-toed boots', 'Hearing protection only'],
      correctAnswer: 1,
      explanation: 'Refrigerants can cause frostbite and eye injury. Safety glasses and chemical-resistant gloves are required minimum PPE.',
    },
    {
      question: 'Before working on an HVAC system, a technician should always:',
      options: ['Start the system to identify problems', 'Lock out and tag out the electrical supply', 'Remove all refrigerant immediately', 'Check the thermostat setting'],
      correctAnswer: 1,
      explanation: 'Lockout/tagout (LOTO) procedures prevent accidental energization and are required by OSHA before servicing electrical equipment.',
    },
  ],

  // mod-2: HVAC Fundamentals (core)
  'hvac-2-4': [
    {
      question: 'The refrigeration cycle moves heat by:',
      options: ['Generating cold air inside the system', 'Absorbing heat in the evaporator and rejecting it at the condenser', 'Burning fuel to create cooling', 'Circulating chilled water through ductwork'],
      correctAnswer: 1,
      explanation: 'Refrigeration does not create cold — it moves heat from inside to outside by absorbing it at the evaporator and releasing it at the condenser.',
    },
    {
      question: 'SEER stands for:',
      options: ['System Efficiency Energy Rating', 'Seasonal Energy Efficiency Ratio', 'Standard Equipment Efficiency Review', 'Seasonal Equipment Energy Requirement'],
      correctAnswer: 1,
      explanation: 'SEER (Seasonal Energy Efficiency Ratio) measures cooling output over a typical cooling season divided by total electric energy input.',
    },
  ],

  // mod-3: Refrigeration Basics (core)
  'hvac-3-4': [
    {
      question: 'Under the Clean Air Act Section 608, technicians who purchase refrigerants in containers larger than 2 lbs must be:',
      options: ['Licensed by the state', 'EPA 608 certified', 'OSHA 10 certified', 'Registered with the manufacturer'],
      correctAnswer: 1,
      explanation: 'EPA Section 608 requires certification for technicians who purchase or handle refrigerants in containers larger than 2 lbs.',
    },
    {
      question: 'Which refrigerant is classified as an HFC and has zero ozone depletion potential?',
      options: ['R-22', 'R-11', 'R-410A', 'R-123'],
      correctAnswer: 2,
      explanation: 'R-410A is an HFC with zero ozone depletion potential (ODP). R-22 is an HCFC being phased out due to its ODP.',
    },
    {
      question: 'The global warming potential (GWP) of a refrigerant measures:',
      options: ['How quickly it evaporates at room temperature', 'Its heat-trapping effect relative to CO2 over 100 years', 'Its toxicity level in enclosed spaces', 'Its flammability classification'],
      correctAnswer: 1,
      explanation: 'GWP compares the heat-trapping ability of a greenhouse gas to CO2 over a 100-year period.',
    },
  ],

  // mod-4: Electrical Basics (core)
  'hvac-4-5': [
    {
      question: 'Ohm\'s Law states that voltage equals:',
      options: ['Current divided by resistance', 'Current multiplied by resistance', 'Power divided by current', 'Resistance divided by power'],
      correctAnswer: 1,
      explanation: 'Ohm\'s Law: V = I × R (Voltage = Current × Resistance).',
    },
    {
      question: 'A multimeter set to measure AC voltage should be connected:',
      options: ['In series with the load', 'In parallel with the load', 'Between the ground and neutral only', 'After the disconnect switch only'],
      correctAnswer: 1,
      explanation: 'Voltage is measured in parallel (across) the component. Connecting in series would interrupt the circuit.',
    },
  ],

  // mod-5: Heating Systems / Type I (type_i)
  // Type I covers small appliances (≤5 lbs refrigerant) including heat pumps
  // in small-appliance configurations and household refrigeration circuits.
  'hvac-5-5': [
    {
      question: 'Type I certification covers technicians who service:',
      options: [
        'High-pressure systems using R-410A',
        'Low-pressure systems using R-11 or R-123',
        'Small appliances containing 5 lbs or less of refrigerant',
        'All refrigerant types universally',
      ],
      correctAnswer: 2,
      explanation: 'Type I certification covers small appliances — systems manufactured, charged, and hermetically sealed at the factory with 5 lbs or less of refrigerant.',
    },
    {
      question: 'When disposing of a small appliance, the technician must:',
      options: [
        'Vent the refrigerant since the amount is small',
        'Recover the refrigerant using approved equipment before disposal',
        'Return the appliance to the manufacturer',
        'Remove the compressor and discard the rest',
      ],
      correctAnswer: 1,
      explanation: 'Venting is illegal regardless of charge size. Refrigerant must be recovered from small appliances before disposal.',
    },
    {
      question: 'A heat pump in heating mode moves heat:',
      options: [
        'From inside the building to the outside',
        'From the outside air or ground into the building',
        'By burning fuel to generate warmth',
        'By circulating hot water through radiators',
      ],
      correctAnswer: 1,
      explanation: 'In heating mode, a heat pump reverses the refrigeration cycle to extract heat from outdoor air or the ground and move it inside.',
    },
  ],

  // mod-6: Cooling Systems / Type II (type_ii)
  'hvac-6-5': [
    {
      question: 'Type II certification covers technicians who service:',
      options: ['Systems with 5 lbs or less of refrigerant', 'High-pressure appliances using refrigerants like R-22 and R-410A', 'Low-pressure appliances using R-11 or R-123', 'All refrigerant types universally'],
      correctAnswer: 1,
      explanation: 'Type II certification covers high-pressure appliances, which include most residential and commercial systems using R-22, R-410A, and R-134a.',
    },
    {
      question: 'When recovering refrigerant from a high-pressure system, the technician must:',
      options: ['Vent the refrigerant to the atmosphere if the amount is small', 'Use EPA-approved recovery equipment and store in approved cylinders', 'Mix recovered refrigerant with new refrigerant before reuse', 'Return the system to the manufacturer for recovery'],
      correctAnswer: 1,
      explanation: 'Venting refrigerant is illegal under Section 608. Technicians must use approved recovery equipment and store refrigerant in approved cylinders.',
    },
    {
      question: 'The required level of evacuation for a system with a compressor displacement above 200 cc/rev is:',
      options: ['0 microns', '500 microns', '1000 microns', '2500 microns'],
      correctAnswer: 1,
      explanation: 'EPA requires systems with compressor displacement above 200 cc/rev to be evacuated to 500 microns before charging.',
    },
  ],

  // mod-9: Maintenance (type_iii)
  'hvac-9-5': [
    {
      question: 'Type III certification covers technicians who service:',
      options: ['High-pressure systems using R-410A', 'Low-pressure appliances using refrigerants like R-11, R-113, and R-123', 'Small appliances with 5 lbs or less of refrigerant', 'All refrigerant types universally'],
      correctAnswer: 1,
      explanation: 'Type III covers low-pressure appliances, which typically use R-11, R-113, or R-123 and operate below atmospheric pressure.',
    },
    {
      question: 'Low-pressure systems are unique because they:',
      options: ['Operate at pressures above 200 psi', 'Can draw air and moisture into the system if not properly maintained', 'Use only HFC refrigerants', 'Require no recovery equipment'],
      correctAnswer: 1,
      explanation: 'Low-pressure systems operate below atmospheric pressure, so leaks draw air and moisture in rather than pushing refrigerant out.',
    },
  ],

  // mod-10: Certification Prep (core)
  'hvac-10-4': [
    {
      question: 'The EPA 608 Universal certification allows a technician to service:',
      options: ['Only Type I small appliances', 'Only high-pressure systems', 'All types of refrigerant-containing equipment', 'Only systems using HFC refrigerants'],
      correctAnswer: 2,
      explanation: 'Universal certification covers Type I, Type II, and Type III equipment — all refrigerant-containing systems.',
    },
    {
      question: 'Under Section 608, the de minimis exemption allows venting of:',
      options: ['Any amount of refrigerant during normal service', 'Refrigerant mixed with nitrogen during pressure testing', 'Small amounts of refrigerant released during good-faith recovery attempts', 'Refrigerant from systems with less than 1 lb charge'],
      correctAnswer: 2,
      explanation: 'The de minimis exemption covers refrigerant released during good-faith attempts at recovery, not intentional venting.',
    },
    {
      question: 'Refrigerant cylinders must be stored:',
      options: ['In direct sunlight to prevent condensation', 'Away from heat sources, in a cool ventilated area, valve-end up', 'Horizontally to prevent pressure buildup', 'In sealed rooms with no ventilation'],
      correctAnswer: 1,
      explanation: 'Cylinders must be stored upright (valve-end up), away from heat sources, in cool ventilated areas to prevent pressure buildup and leaks.',
    },
  ],
};

async function main() {
  const mode = process.argv.includes('--force') ? 'force' : 'seed_missing';
  console.log(`Seeding HVAC curriculum (mode: ${mode})`);

  const gen = new CurriculumGenerator(HVAC_PROGRAM_ID, EPA608_CRED_ID, mode as 'seed_missing' | 'force');
  await gen.loadExistingSlugs();

  for (const [modIndex, mod] of hvacCourse.modules.entries()) {
    const domainKey = MODULE_DOMAIN_MAP[mod.id];
    if (!domainKey) {
      console.warn(`No domain mapping for module ${mod.id} — skipping`);
      continue;
    }

    await gen.upsertModule({
      slug:        mod.id,
      title:       mod.title,
      description: mod.description,
      orderIndex:  modIndex + 1,
    });

    for (const [lessonIndex, lesson] of mod.lessons.entries()) {
      const lessonSlug   = `${mod.id}-${lesson.id}`;
      const rawQuizzes   = QUIZ_QUESTIONS[lesson.id];
      const quizzes      = rawQuizzes?.map((q, i) => ({ ...q, quizOrder: i }));
      // Module-boundary quiz lessons gate the next module
      const isCheckpoint = lesson.type === 'quiz';

      await gen.upsertLesson({
        lessonSlug,
        lessonTitle:         lesson.title,
        moduleSlug:          mod.id,
        moduleTitle:         mod.title,
        courseId:            HVAC_COURSE_ID,
        durationMinutes:     lesson.durationMinutes ?? 30,
        lessonOrder:         lessonIndex + 1,
        moduleOrder:         modIndex + 1,
        credentialDomainKey: domainKey,
        stepType:            isCheckpoint ? 'checkpoint' : 'lesson',
        passingScore:        isCheckpoint ? 80 : 0,
        quizzes,
      });
    }
  }

  const summary = gen.summarize();
  console.log('\nSeed complete:');
  console.log(`  modules:  ${summary.modulesUpserted}`);
  console.log(`  lessons:  ${summary.lessonsUpserted} written, ${summary.lessonsSkipped} skipped`);
  console.log(`  quizzes:  ${summary.quizzesUpserted} written`);
  if (summary.errors.length > 0) {
    console.error('\nErrors:');
    summary.errors.forEach(e => console.error(' ', e));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
