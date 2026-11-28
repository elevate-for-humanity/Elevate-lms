/**
 * lib/lms/simulations/esthetician-simulation.ts
 *
 * Treatment Room Lab — the hands-on client-service simulation for the
 * Esthetician Apprenticeship course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract. One wax appointment end to end: the consultation that screens
 * for contraindications, room turnover, in-service judgment, skin
 * observation and referral, and the confidential record. Content is drawn
 * from the course's own lessons: Wax consultation and hair-removal
 * safety; Room turnover and contamination control; Skin observation and
 * referral decisions; Referral without diagnosis; Accurate confidential
 * client records.
 *
 * The hard fail mirrors the wax lesson verbatim: consent does not make a
 * contraindicated service appropriate — and the practitioner never
 * guesses a waiting interval for a medication or procedure.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const ESTHETICIAN_TREATMENT_ROOM_SIM_ID = 'esthetician-treatment-room-lab';

export const ESTHETICIAN_TREATMENT_ROOM_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: ESTHETICIAN_TREATMENT_ROOM_SIM_ID,
  title: 'Treatment Room Lab — Consult, Turn Over, Treat, Refer, Record',
  description:
    'Run one wax appointment the way the course teaches it: screen the consultation for contraindications, turn the room over to contamination-control standard, judge what happens mid-service, handle a concerning skin observation without diagnosing it, and close with the confidential record. The lab is scored against the course lessons.',
  setting:
    'A returning client is booked for a wax service. Her intake notes mention a new skin treatment she started last week.',
  badges: ['Wax consultation & safety', 'Contamination control', 'Referral without diagnosis'],
  objectives: [
    'Contraindication screening',
    'Room turnover and contamination control',
    'In-service safety judgment',
    'Observation and referral',
    'Confidential records',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: waxing a client whose consultation shows a contraindication because she consents and insists. The course rule is explicit — consent does not make a contraindicated service appropriate.',
    'Never guess a waiting interval for a medication or procedure. Follow current scope, the product label, and trainer protocol.',
  ],
  steps: [
    {
      kind: 'decide',
      id: 'wax-consultation',
      title: 'The consultation finding',
      prompt:
        'Her consultation reveals she began a skin-thinning treatment last week and had a strong reaction to wax once before. She says she understands the risk, signs the consent, and asks you to go ahead. What does the course require?',
      objective: 'Contraindication screening',
      options: [
        'Do not wax today: explain the concern and the alternatives, follow scope, the label, and trainer protocol for any waiting period rather than guessing one, and document the decision',
        'Proceed — a signed consent from an informed adult settles the question',
        'Proceed with a gentler technique and fewer passes to reduce the risk',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'The wax lesson\'s rule is explicit: consultation must identify recent exfoliation, skin-thinning treatments, fragile or broken skin, relevant medications, and previous reactions — and consent does not make a contraindicated service appropriate. A gentler technique does not remove the contraindication, and no practitioner guesses a waiting interval for a medication or procedure: scope, the wax label, and trainer protocol decide. Explain the expected sensation, aftercare, and alternatives; defer; document. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'inspect',
      id: 'room-turnover',
      title: 'Turn the room over',
      prompt:
        'Between clients, judge the room against the turnover lesson: clean storage separate, a prepared service zone, a closed collection area for used materials — and remember a surface can look clean while retaining contamination. Flag every defect.',
      objective: 'Room turnover and contamination control',
      pointsEach: 3,
      items: [
        {
          id: 'double-dip',
          label: 'Wax pot',
          observation: 'An applicator that has touched a client\'s skin goes back into the wax pot for the next pass.',
          defect: true,
        },
        {
          id: 'temperature-test',
          label: 'Wax temperature',
          observation: 'Temperature is checked using the manufacturer\'s method before the wax approaches the client.',
          defect: false,
        },
        {
          id: 'looks-clean',
          label: 'Treatment bed surface',
          observation: 'The surface was wiped until it looked clean and is recorded as disinfected — no disinfectant step was performed.',
          defect: true,
        },
        {
          id: 'closed-collection',
          label: 'Used materials',
          observation: 'Used applicators and strips are in the closed collection container, away from clean storage.',
          defect: false,
        },
        {
          id: 'broken-skin-plan',
          label: 'Service plan',
          observation: 'Today\'s plan includes waxing over a patch of broken, fragile skin the last practitioner noted.',
          defect: true,
        },
        {
          id: 'single-use-ready',
          label: 'Applicators',
          observation: 'A fresh set of single-use applicators is laid out in the prepared service zone.',
          defect: false,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'mid-service-stop',
      title: 'Mid-service: the skin answers',
      prompt:
        'On a later appointment (consultation clear), the wax feels excessively hot to the client and the skin begins to lift on the second pass over the same area. What do you do?',
      objective: 'In-service safety judgment',
      options: [
        'Stop: assess the skin, do not repeat passes over stressed skin, apply compatible aftercare, and document the area and the response',
        'Finish the area quickly with lighter pressure so the appointment stays on time',
        'Cool the wax slightly and continue over the same area to finish the job evenly',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'lesion-observation',
      title: 'The observation',
      prompt:
        'Under good light you notice a new, changing lesion on the client\'s shoulder — different from her baseline. She asks what it is and whether the facial will help it. What does the course require?',
      objective: 'Observation and referral',
      options: [
        'Record its location and observable features in neutral terms without diagnosing it, avoid treating over it, and explain that new or changing lesions need medical evaluation — recording the referral decision privately',
        'Reassure her it looks harmless and proceed; watching it over future visits is enough',
        'Apply the treatment over it and see whether it improves by the next appointment',
      ],
      correct: 0,
      points: 12,
    },
    {
      kind: 'decide',
      id: 'client-record',
      title: 'Close with the record',
      prompt:
        'The appointment ends. What belongs in her record?',
      objective: 'Confidential records',
      options: [
        'The service performed, the area treated and the skin\'s response, any deferral or referral decision — recorded accurately and kept confidential',
        'Just the service and the charge; skin responses are the practitioner\'s memory to keep',
        'A detailed note shared with the front desk team chat so everyone is aware',
      ],
      correct: 0,
      points: 8,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Wax consultation and hair-removal safety',
      coverage: 'full',
      note: 'Contraindication screening, the no-double-dip rule, temperature testing by the manufacturer method, and the mid-service stop are all scored from this lesson; it is also the attach lesson.',
    },
    {
      topic: 'Room turnover and contamination control',
      coverage: 'full',
      note: 'The turnover inspection scores the clean/service/collection zones and the cleaning-versus-disinfection distinction.',
    },
    {
      topic: 'Skin observation and referral decisions',
      coverage: 'full',
      note: 'The lesion step scores neutral observation, baseline comparison, and referral — never diagnosis or treatment-over.',
    },
    {
      topic: 'Referral without diagnosis',
      coverage: 'applied',
      note: 'Both the consultation deferral and the lesion referral apply the lesson\'s boundary.',
    },
    {
      topic: 'Accurate confidential client records',
      coverage: 'applied',
      note: 'The closing step scores what the record must hold and its confidentiality.',
    },
  ],
};
