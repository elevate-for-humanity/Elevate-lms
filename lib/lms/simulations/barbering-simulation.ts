/**
 * lib/lms/simulations/barbering-simulation.ts
 *
 * Barbershop Client Lab — the hands-on client-service simulation for the
 * Barber Apprenticeship course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract: authored config in the lesson's content_json.experience
 * .simulation, int-encoded responses, server-side scoring through the
 * learner interactions API, results recorded in interaction_progress.
 *
 * One client visit end to end: tool processing, the consultation, the
 * scalp finding, razor preparation, the price confirmation the
 * consultation lesson requires before work begins, and the client
 * record. Content is drawn from the course's own lessons: Clean tools or
 * equipment; Discuss service options or needs with clients;
 * Straight-Razor Shaving and Contour Work; Maintain client information
 * or service records.
 *
 * Hard fail mirrors the lessons: broken skin or a suspected contagious
 * condition pauses the service for qualified guidance and referral —
 * proceeding to meet the schedule is never the correct answer. Prices in
 * the scenario are fictional training material, as in the forklift lab.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const BARBERING_CLIENT_LAB_SIM_ID = 'barbering-client-lab';

export const BARBERING_CLIENT_LAB_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: BARBERING_CLIENT_LAB_SIM_ID,
  title: 'Barbershop Client Lab — Consultation, Tools, and the Razor',
  description:
    'Run one client visit the way the course teaches it: process the tools to standard, consult before you cut, make the safe call on a scalp finding, prepare the razor correctly, confirm the full price before work begins, and close with the client record. The lab is scored against the course lessons.',
  setting:
    'Saturday morning, your chair. A new client is booked for a cut and a straight-razor finish. The previous client\'s tools are still on your station.',
  badges: ['Tool cleaning & disinfection', 'Client consultation', 'Straight-razor safety'],
  objectives: [
    'Tool cleaning and disinfection',
    'Client consultation',
    'Safe service judgment',
    'Razor preparation',
    'Price confirmation',
    'Client records',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: proceeding with a service over broken skin or a suspected contagious condition. The course rule is to pause, describe the observation without diagnosing, and get qualified guidance or make the referral.',
    'Cleaning and disinfection are separate steps. A tool that looks clean has not necessarily been disinfected, and a used single-use blade is never made reusable by immersing it.',
  ],
  steps: [
    {
      kind: 'inspect',
      id: 'tool-processing',
      title: 'Process the previous client\'s tools',
      prompt:
        'Sort the station the way the tools lesson teaches. For each item, decide: is it a defect — processed wrong, unsafe for the next client — or serviceable, processed to standard?',
      objective: 'Tool cleaning and disinfection',
      pointsEach: 3,
      items: [
        {
          id: 'blade-reuse',
          label: 'Used disposable blade',
          observation: 'Immersed in disinfectant so it can be used on the next client — it looks clean.',
          defect: true,
        },
        {
          id: 'implements-disinfected',
          label: 'Reusable implements',
          observation: 'Cleaned of hair and debris first, then disinfected with the compatible product for its full labeled contact time.',
          defect: false,
        },
        {
          id: 'clipper-immersed',
          label: 'Electric clippers',
          observation: 'The whole clipper, housing and cord end, soaking in the disinfectant jar.',
          defect: true,
        },
        {
          id: 'sharps',
          label: 'Spent blades',
          observation: 'Every used blade from the morning is in the designated sharps container.',
          defect: false,
        },
        {
          id: 'dry-storage-only',
          label: 'Combs from the last client',
          observation: 'Placed unwashed into the dry storage container — the container is the processing, per the last barber.',
          defect: true,
        },
        {
          id: 'label-read',
          label: 'Disinfectant choice',
          observation: 'The product in use is labeled suitable for these implements, and its dilution and contact time are posted at the station.',
          defect: false,
        },
        {
          id: 'mixed-chemicals',
          label: 'Barbicide jar top-up',
          observation: 'Topped up with a second product "to make it stronger" when the level ran low.',
          defect: true,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'consultation',
      title: 'The consultation',
      prompt:
        'Your client shows a photo and asks for it "tidy and short-ish, like this." What does the course\'s consultation do before any cutting?',
      objective: 'Client consultation',
      options: [
        'Ask open questions, confirm what "tidy" and "short" mean as an actual outline and length, explain how his growth pattern and density differ from the photo, and agree scope, price, and maintenance before work begins',
        'Start cutting and check the length with him at the end — the photo is clear enough',
        'Promise the photo result exactly; he can judge the maintenance when he gets home',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'scalp-finding',
      title: 'The scalp finding',
      prompt:
        'With permission, you observe the scalp before the cut: there is broken skin with unusual irritation that could be contagious. The client is on his lunch break and asks you to just work around it. What do you do?',
      objective: 'Safe service judgment',
      options: [
        'Pause the service, describe the observation in plain language without diagnosing it, and follow qualified guidance — recommending a healthcare referral where the concern exceeds a barber\'s role',
        'Work carefully around the broken area and finish the cut — he is short on time',
        'Proceed as booked; noting it in his record afterwards covers the shop',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'Broken skin, unusual irritation, or a suspected contagious condition calls for a pause and qualified guidance rather than proceeding to meet the schedule. The barber observes and describes — never diagnoses — and recommends an appropriate healthcare referral when the concern exceeds the barber\'s role; razor work in particular never goes over broken, inflamed, or apparently infected skin. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'decide',
      id: 'razor-prep',
      title: 'Prepare the razor finish',
      prompt:
        'The cut is done (on a different day, scalp clear) and the client wants the straight-razor finish. Which preparation matches the course?',
      objective: 'Razor preparation',
      options: [
        'New single-use blade from the package, reusable holder processed to its requirements, hands washed, exposure-response supplies at hand, and the towel comfortably warm — not arbitrarily hot',
        'Yesterday\'s blade, disinfected by immersion overnight, so nothing is wasted',
        'Any blade that passes a visual check; the lather covers small nicks in the edge',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'calculate',
      id: 'price-confirmation',
      title: 'Confirm the price before work begins',
      prompt:
        'The agreed services: the cut at $35, a beard trim added at $15, and a styling product he is taking home at $10. The consultation lesson requires the full price confirmed before work begins. What total do you confirm with the client?',
      objective: 'Price confirmation',
      answer: 60,
      unit: 'dollars',
      tolerancePct: 1,
      points: 10,
      explanation:
        '$35 + $15 + $10 = $60. Confirming the approved price — including every added service — before work begins is part of the consultation, not the checkout: surprises at the register are consultation failures.',
    },
    {
      kind: 'decide',
      id: 'client-record',
      title: 'Close the visit',
      prompt:
        'The client is happy and rebooks in three weeks. What does the course require in his record?',
      objective: 'Client records',
      options: [
        'The services performed, products used, his preferences and any observations — recorded now, so the next visit starts from his record, not your memory',
        'Just the rebooking date; regulars do not need records',
        'Nothing — records are only for clients with complaints',
      ],
      correct: 0,
      points: 8,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Clean tools or equipment',
      coverage: 'full',
      note: 'The tool-processing inspection is judged against the lesson\'s sequence: sort, clean, disinfect per label, store — with the blade-reuse and clipper-immersion traps the lesson names.',
    },
    {
      topic: 'Discuss service options or needs with clients',
      coverage: 'full',
      note: 'Open questions, confirmed meanings, honest photo expectations, and agreed scope and price structure the consultation and price steps.',
    },
    {
      topic: 'Straight-Razor Shaving and Contour Work',
      coverage: 'applied',
      note: 'New single-use blade, sharps discipline, no shaving over broken or inflamed skin, and towel temperature judgment are scored from this lesson.',
    },
    {
      topic: 'Maintain client information or service records',
      coverage: 'applied',
      note: 'The closing step requires the full service record the lesson describes.',
    },
    {
      topic: 'Haircutting: Clippers, Shears, and Blending',
      coverage: 'partial',
      note: 'The lab frames the visit around a cut but scores the consultation and safety decisions, not cutting technique, which is assessed in the shop.',
    },
  ],
};
