/**
 * lib/lms/simulations/cosmetology-simulation.ts
 *
 * Salon Client Lab — the hands-on client-service simulation for the
 * Cosmetology Apprenticeship course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract: authored config in the lesson's content_json.experience
 * .simulation, int-encoded responses, server-side scoring through the
 * learner interactions API, results recorded in interaction_progress.
 * It replaces the one-question workbook self-check as the course's scored
 * simulation: a full client visit — station reset, consultation, hair and
 * scalp analysis, the skin-test/strand-test decision, a label mixing
 * calculation, and service documentation.
 *
 * Content is drawn from the course's own lessons: Infection Control
 * Fundamentals, Sanitation and Disinfection Procedures, Hair and Scalp
 * Analysis, Single-Process Color, and Client Consultation and Needs
 * Assessment. The hard fail mirrors those lessons exactly: a chemical
 * service never proceeds on an irritated or damaged scalp or after a
 * concerning reaction — the service is deferred and the referral /
 * infection-control procedure is followed instead. Prices and ratios in
 * the scenario are fictional training material, as in the forklift lab.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const COSMETOLOGY_SALON_CLIENT_SIM_ID = 'cosmetology-salon-client-lab';

export const COSMETOLOGY_SALON_CLIENT_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: COSMETOLOGY_SALON_CLIENT_SIM_ID,
  title: 'Salon Client Lab — Consultation, Color, and Infection Control',
  description:
    'Take one color client through the full visit the way the course teaches it: reset the station to infection-control standard, run the consultation, analyze the hair and scalp, make the skin-test and strand-test calls, mix to the label, and close with documentation and aftercare. The lab is scored against the course lessons.',
  setting:
    'Your next client is a first-time color booking: single-process color, no service record on file. Your previous client has just left the chair.',
  badges: ['Indiana State Board sanitation rules', 'EPA-registered disinfectants', 'Client consultation'],
  objectives: [
    'Infection control and station reset',
    'Client consultation',
    'Testing before chemical services',
    'Safe service judgment',
    'Label calculations',
    'Documentation and aftercare',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: proceeding with a chemical service on an irritated or damaged scalp. The course rule is to defer the service and follow the referral and infection-control procedure — never to work around the patch or rely on the client\'s consent.',
    'Disinfection in this lab means the full sequence the lessons teach: clean first, then the EPA-registered product, at its labeled dilution, for its full contact time. A quick spray is not disinfection.',
  ],
  steps: [
    {
      kind: 'inspect',
      id: 'station-reset',
      title: 'Reset the station between clients',
      prompt:
        'Your last client has left. Judge each part of the reset: is it a defect that would expose the next client, or is it serviceable — done to standard?',
      objective: 'Infection control and station reset',
      pointsEach: 3,
      items: [
        {
          id: 'combs-immersed',
          label: 'Combs and brushes',
          observation:
            'Cleaned to remove hair and debris, then fully immersed in an EPA-registered disinfectant for the label\'s full contact time.',
          defect: false,
        },
        {
          id: 'shears-sprayed',
          label: 'Shears',
          observation: 'Wiped off, given one quick spray of disinfectant, and put straight back in the drawer.',
          defect: true,
        },
        {
          id: 'chair-handles',
          label: 'Chair, table, and handles',
          observation: 'Cleaned and disinfected with an EPA-registered disinfectant according to the manufacturer\'s instructions.',
          defect: false,
        },
        {
          id: 'saved-file',
          label: 'Single-use nail file',
          observation: 'Kept in an envelope with the client\'s name on it, to use again at her next visit.',
          defect: true,
        },
        {
          id: 'double-strength',
          label: 'Disinfectant solution',
          observation: 'Mixed at double the label concentration "so it works better," in an unlabeled bottle.',
          defect: true,
        },
        {
          id: 'hands-washed',
          label: 'Your hands',
          observation: 'Washed with soap and water before greeting the next client.',
          defect: false,
        },
        {
          id: 'laundry',
          label: 'Used towels and cape',
          observation: 'Placed in the closed container for laundering, out of the clean work area.',
          defect: false,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'consultation-opening',
      title: 'Open the consultation',
      prompt:
        'Your color client sits down with a photo on her phone and says, "I want exactly this." What does a course-standard consultation do first?',
      objective: 'Client consultation',
      options: [
        'Ask open-ended questions about what she likes, her routine, and her concerns; listen actively, analyze, and document — including what the photo can and cannot promise for her hair',
        'Agree to the photo and start mixing — she has clearly decided what she wants',
        'Tell her the photo is unrealistic and choose a safer style for her instead',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'skin-vs-strand',
      title: 'Skin test or strand test?',
      prompt:
        'This is her first service with this color line, and her record shows no documented reaction history yet. Which testing does the course require before the color service?',
      objective: 'Testing before chemical services',
      options: [
        'Both: the skin allergy test per the product instructions (reaction risk) and a strand test (color response and hair condition) — they answer different questions',
        'A strand test only — if the strand responds well, allergy safety is established',
        'Neither — she has colored her hair at home for years without a problem she remembers',
      ],
      correct: 0,
      points: 12,
    },
    {
      kind: 'decide',
      id: 'irritated-scalp',
      title: 'The scalp finding',
      prompt:
        'During analysis you find an irritated, broken patch of skin at her nape. She waves it off: "It doesn\'t hurt — just go ahead, I need this done today." What do you do?',
      objective: 'Safe service judgment',
      options: [
        'Defer the chemical service, describe what you observed without diagnosing it, and follow the salon\'s referral and infection-control procedure',
        'Proceed, but keep the color off the broken patch',
        'Proceed as booked — the client has consented and the appointment is hers',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'The course\'s rule is absolute: do not proceed with a chemical service after a concerning reaction or on an irritated or damaged scalp, and never scrape or manipulate irritated, broken, or visibly infected skin. Working around the patch still exposes broken skin to a chemical service, and a client\'s consent does not transfer the professional\'s duty. Defer the service, describe the observation without diagnosing, and follow the referral and infection-control procedure. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'calculate',
      id: 'mix-ratio',
      title: 'Mix to the label',
      prompt:
        'The color line\'s label specifies a mix ratio of 1 : 1.5 (color : developer). You weigh out 40 grams of color. How many grams of developer does the label call for?',
      objective: 'Label calculations',
      answer: 60,
      unit: 'g',
      tolerancePct: 1,
      points: 10,
      explanation:
        'The ratio means every 1 part color takes 1.5 parts developer: 40 g × 1.5 = 60 g of developer. The label — not habit — sets the formulation; mixing off-ratio changes the product\'s behavior and voids the instructions the service is judged against.',
    },
    {
      kind: 'decide',
      id: 'close-the-visit',
      title: 'Close the visit',
      prompt:
        'The service is complete and the result evaluated. The next client is already waiting. What closes this visit to standard?',
      objective: 'Documentation and aftercare',
      options: [
        'Document the service — formulation, timing, tests, and result — and give the client label-consistent aftercare before the next client sits down',
        'Skip the record this once; you will remember her formula at the retouch',
        'Document only the total charge; formulas belong in your head, not the file',
      ],
      correct: 0,
      points: 8,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Infection Control Fundamentals',
      coverage: 'full',
      note: 'The station reset is judged item by item against the EPA-registered disinfectant sequence the lesson teaches.',
    },
    {
      topic: 'Sanitation and Disinfection Procedures',
      coverage: 'full',
      note: 'Cleaning before disinfection, label dilution, and full contact time are the scored distinctions; the quick-spray and double-strength traps come straight from the lesson.',
    },
    {
      topic: 'Hair and Scalp Analysis',
      coverage: 'applied',
      note: 'The scalp finding step exercises the lesson\'s contraindication rule: observe, do not diagnose, defer and refer.',
    },
    {
      topic: 'Single-Process Color',
      coverage: 'applied',
      note: 'Skin test versus strand test, documented reaction history, label mixing, and the defer rule are all scored from this lesson.',
    },
    {
      topic: 'Client Consultation and Needs Assessment',
      coverage: 'full',
      note: 'Open-ended questions, active listening, realistic expectations, and documentation structure the consultation steps.',
    },
  ],
};
