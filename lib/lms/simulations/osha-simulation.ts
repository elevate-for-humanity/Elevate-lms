/**
 * lib/lms/simulations/osha-simulation.ts
 *
 * Workplace Hazard Inspection Lab — the hands-on simulation for the
 * Workplace Safety & OSHA Awareness course, built on the generic scenario
 * engine (lib/lms/scenario-simulation.ts) to the manifold gauge /
 * forklift lab contract: authored config in the lesson's
 * content_json.experience.simulation, int-encoded responses, server-side
 * scoring through the learner interactions API, results recorded in
 * interaction_progress. It attaches to the course's own "Workplace hazard
 * inspection simulation" lesson and runs the inspection that lesson
 * names.
 *
 * Content is drawn from the course's own lessons: Hazard recognition and
 * reporting (the supply-room walkthrough, including its distinction
 * between a physical hazard and a privacy concern), Selecting controls
 * and protective equipment (the hierarchy of controls; PPE as the last
 * line), and Worker rights and employer responsibilities. The hard fail
 * mirrors the controls lesson: a missing machine guard is never answered
 * by using the machine carefully.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const OSHA_HAZARD_INSPECTION_SIM_ID = 'osha-hazard-inspection-lab';

export const OSHA_HAZARD_INSPECTION_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: OSHA_HAZARD_INSPECTION_SIM_ID,
  title: 'Hazard Inspection Lab — Walk the Space, Rank the Risk, Choose the Control',
  description:
    'Inspect a supply room and work area the way the course teaches: find the hazards, separate safety hazards from other concerns, report in the right order, and choose controls from the top of the hierarchy — not the bottom. The lab is scored against the course lessons.',
  setting:
    'You are doing the weekly walkthrough of a supply room and packing area before the shift starts. What you find, and what you do about it, is the job.',
  badges: ['Hazard recognition', 'Hierarchy of controls', 'OSHA worker rights'],
  objectives: [
    'Hazard recognition',
    'Risk ranking and reporting order',
    'Hierarchy of controls',
    'PPE judgment',
    'Equipment hazard response',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: running a machine whose guard is missing. A control that changes the actual hazard is always more dependable than care, reminders, or PPE.',
    'Judge each walkthrough item as a physical safety hazard or not — the course separates safety hazards from other concerns (like a privacy issue), which are handled through their own procedures.',
  ],
  steps: [
    {
      kind: 'inspect',
      id: 'supply-room-walkthrough',
      title: 'The supply-room walkthrough',
      prompt:
        'Walk the room with fresh eyes — floors, exits, storage, equipment, chemicals. Flag every physical safety hazard; pass what is safe or is not a safety hazard at all.',
      objective: 'Hazard recognition',
      pointsEach: 3,
      items: [
        {
          id: 'cord-doorway',
          label: 'Doorway',
          observation: 'An extension cord runs across the doorway where staff carry boxes in and out.',
          defect: true,
        },
        {
          id: 'blocked-exit',
          label: 'Exit door',
          observation: 'Boxes are stacked in front of the exit door, narrowing the way out.',
          defect: true,
        },
        {
          id: 'leaking-bottle',
          label: 'Cleaning shelf',
          observation: 'A cleaning bottle is dripping onto the floor, leaving a wet patch.',
          defect: true,
        },
        {
          id: 'heavy-box-high',
          label: 'Top shelf',
          observation: 'A heavy box sits on the highest shelf and must be lifted down awkwardly, above shoulder height.',
          defect: true,
        },
        {
          id: 'confidential-document',
          label: 'Desk by the door',
          observation: 'A confidential document lies face-up on the desk where visitors pass.',
          defect: false,
        },
        {
          id: 'second-exit',
          label: 'Second exit and aisle',
          observation: 'The second exit is clear, its sign is lit, and the aisle to it is open.',
          defect: false,
        },
        {
          id: 'chemical-storage',
          label: 'Chemical storage',
          observation: 'Labeled bottles stand upright with caps on, in their designated storage area.',
          defect: false,
        },
        {
          id: 'wet-floor-sign',
          label: 'Mopped area',
          observation: 'A wet-floor sign stands at the freshly mopped section of the packing area.',
          defect: false,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'report-order',
      title: 'What gets reported first?',
      prompt:
        'Your walkthrough found the blocked exit and a small puddle near the sink. Both go on the report. Which do you escalate first, and why?',
      objective: 'Risk ranking and reporting order',
      options: [
        'The blocked exit — risk weighs likelihood and severity together, and a blocked way out in an emergency carries the severest consequence; report both, escalate the exit first',
        'The puddle — it is the one someone could slip on in the next five minutes',
        'Whichever is closest to the office; order does not matter if both are reported',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'solvent-controls',
      title: 'Choose the control: solvent vapor',
      prompt:
        'A degreasing solvent used at a bench gives off vapor that leaves workers light-headed by mid-shift. Which control does the hierarchy put first?',
      objective: 'Hierarchy of controls',
      options: [
        'Change the process itself — substitute a less hazardous product or enclose and ventilate the bench (elimination/substitution/engineering) before relying on anything worn or remembered',
        'Issue respirators and gloves and continue as before — PPE is the fastest fix',
        'Post a reminder sign and rotate workers more often',
      ],
      correct: 0,
      points: 12,
    },
    {
      kind: 'decide',
      id: 'ppe-judgment',
      title: 'PPE judgment',
      prompt:
        'Gloves are needed for a chemical task. Two kinds are on the shelf, and the crew usually grabs whichever is closest. What does the course require?',
      objective: 'PPE judgment',
      options: [
        'Selection follows the hazard assessment and the product\'s safety data — gloves chosen for one chemical may fail against another — plus fit, inspection before use, and replacement when damaged',
        'Any chemical glove works; the important thing is that hands are covered',
        'PPE settles it — with gloves on, the work area itself needs no further controls',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'missing-guard',
      title: 'The missing guard',
      prompt:
        'The packing machine\'s blade guard is missing — it was removed for cleaning and not refitted. The shift is behind schedule and the operator says she will "just be careful for this one run." What happens?',
      objective: 'Equipment hazard response',
      options: [
        'The machine stays out of service until the guard is refitted; report it and escalate — care is not a control',
        'Allow the one careful run, then refit the guard at break',
        'Tape a warning note on the machine and let the run proceed',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'An unguarded blade is a hazard that must be changed, not managed by attention. The hierarchy of controls ranks a guard — an engineering control that changes the actual hazard — above every administrative reminder and every piece of PPE, and PPE does not make an unsafe environment acceptable. "Being careful" and a warning note leave the blade exactly as dangerous as it was. The machine is removed from service and the missing guard reported and escalated. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'inspect',
      id: 'packing-area-check',
      title: 'The packing-area check',
      prompt:
        'Finish the walkthrough in the packing area. Flag every physical safety hazard; pass what meets standard.',
      objective: 'Hazard recognition',
      pointsEach: 3,
      items: [
        {
          id: 'frayed-cord',
          label: 'Workstation cord',
          observation: 'A power cord is frayed where it bends at the plug, with conductor showing.',
          defect: true,
        },
        {
          id: 'stacked-stable',
          label: 'Pallet stack',
          observation: 'Boxes are stacked square and stable, within the marked storage lines.',
          defect: false,
        },
        {
          id: 'spill-unmarked',
          label: 'Aisle floor',
          observation: 'An unmarked spill spreads across the walking aisle; no sign, no cleanup started.',
          defect: true,
        },
        {
          id: 'extinguisher-access',
          label: 'Fire extinguisher',
          observation: 'The extinguisher hangs on its marked mount, access clear, inspection tag current.',
          defect: false,
        },
        {
          id: 'overloaded-shelf',
          label: 'Storage rack',
          observation: 'A rack shelf bows under boxes stacked past its posted load limit.',
          defect: true,
        },
      ],
    },
  ],
  syllabusTopics: [
    {
      topic: 'Hazard recognition and reporting',
      coverage: 'full',
      note: 'Both walkthroughs score the lesson\'s own findings — cord, blocked egress, leak, awkward heavy load — plus its distinction between a safety hazard and a privacy concern.',
    },
    {
      topic: 'Selecting controls and protective equipment',
      coverage: 'full',
      note: 'The solvent and PPE steps score the hierarchy of controls and assessment-based PPE selection exactly as the lesson ranks them.',
    },
    {
      topic: 'Electrical, fire and equipment hazards',
      coverage: 'applied',
      note: 'The frayed cord and missing guard exercise equipment-hazard recognition and the out-of-service response.',
    },
    {
      topic: 'Slips, trips, falls and housekeeping',
      coverage: 'applied',
      note: 'The unmarked spill, cord placement, and stacking findings are judged against housekeeping standards.',
    },
    {
      topic: 'Workplace hazard inspection simulation',
      coverage: 'embedded',
      note: 'The lab is attached to this lesson and performs the inspection it names.',
    },
  ],
};
