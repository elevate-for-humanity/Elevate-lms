/**
 * lib/lms/simulations/welding-simulation.ts
 *
 * Weld Booth Lab — the hands-on simulation for the Welding Foundations
 * course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract: authored config in the lesson's content_json.experience
 * .simulation, int-encoded responses, server-side scoring through the
 * learner interactions API, results recorded in interaction_progress.
 *
 * The learner runs one complete booth job: PPE and booth check, a hot-work
 * fire decision, machine setup for GMAW, the squareness calculation from
 * the fabrication lesson, bead-defect recognition, a finished-coupon
 * visual inspection, and the disposition of a cracked weld. Content is
 * drawn from the course's own lessons (welding-01, -02, -04, -08, -10,
 * -11, -13) and the standards they teach: OSHA 29 CFR 1910 Subpart Q,
 * ANSI/AWS Z49.1, and AWS D1.1 visual acceptance criteria.
 *
 * Hard fails mirror the real rules: striking an arc with unprotected
 * combustibles in the hot-work zone (1910.252 / lesson welding-02), and
 * accepting or concealing a crack (cracks are never acceptable under the
 * visual criteria taught in welding-10).
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const WELDING_WELD_BOOTH_SIM_ID = 'welding-weld-booth-lab';

export const WELDING_WELD_BOOTH_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: WELDING_WELD_BOOTH_SIM_ID,
  title: 'Weld Booth Lab — Set Up, Weld, and Inspect a Coupon',
  description:
    'Run one complete booth job the way the course teaches it: check your PPE and the booth, make the hot-work call, set the machine for the process, prove the frame square with the diagonal, read the bead, inspect the finished coupon against the visual criteria, and disposition what you find. The lab is scored against the course lessons and the standards behind them.',
  setting:
    'Booth 3, morning shift. Your job card: a GMAW fillet coupon on 1/4-inch mild steel, plus a 36 in × 48 in rectangular frame to tack up and check for square.',
  badges: ['OSHA 29 CFR 1910 Subpart Q', 'ANSI/AWS Z49.1', 'AWS D1.1 visual criteria'],
  objectives: [
    'PPE and booth readiness',
    'Hot-work fire prevention',
    'Machine setup and polarity',
    'Measurement and squareness',
    'Bead and defect recognition',
    'Visual inspection judgment',
  ],
  instructions: [
    'Two choices in this lab score 0 outright, because they break the rules the course is built on: striking an arc with unprotected combustibles inside the hot-work zone, and accepting or hiding a crack in a finished weld.',
    'Judge every inspection item the way visual testing is taught: against the observation in front of you, not how the part looks overall.',
  ],
  steps: [
    {
      kind: 'inspect',
      id: 'ppe-booth-check',
      title: 'PPE and booth check',
      prompt:
        'Walk your booth and gear before anything is powered. For each observation, decide: is it a defect you must act on before welding, or is it serviceable — ready as it stands?',
      objective: 'PPE and booth readiness',
      pointsEach: 3,
      items: [
        {
          id: 'helmet-shade',
          label: 'Helmet filter shade',
          observation:
            'Auto-darkening helmet set to shade 11 for the planned amperage, and it darkens on the test strike.',
          defect: false,
        },
        {
          id: 'cracked-lens',
          label: 'Helmet cover lens',
          observation: 'The outer cover lens is cracked through, with a spatter pit burned into the filter.',
          defect: true,
        },
        {
          id: 'synthetic-shirt',
          label: 'Shirt for the shift',
          observation: 'Your work shirt for today is a polyester athletic shirt — it fits fine and is clean.',
          defect: true,
        },
        {
          id: 'gauntlets',
          label: 'Gloves',
          observation: 'Leather gauntlet gloves, cuffs over the jacket sleeves, no holes in the fingers.',
          defect: false,
        },
        {
          id: 'fume-extraction',
          label: 'Fume extraction',
          observation:
            'The extraction arm is positioned so the plume rises into the hood, away from your breathing zone.',
          defect: false,
        },
        {
          id: 'galvanized-stock',
          label: 'Stock on the table',
          observation:
            'A galvanized bracket is in today\'s weld pile. No respirator is staged and no one has planned for zinc fume.',
          defect: true,
        },
        {
          id: 'lighter',
          label: 'Pockets',
          observation: 'You find your cigarette lighter still in your shirt pocket from break.',
          defect: true,
        },
        {
          id: 'fire-gear',
          label: 'Fire gear',
          observation:
            'A charged extinguisher hangs at the booth entrance and the fire watch is posted for the hot work.',
          defect: false,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'hot-work-call',
      title: 'The hot-work call',
      prompt:
        'Cardboard boxes and a solvent-soaked rag bin sit about 20 feet from your booth and cannot be moved — production needs them there. The job is due today. What do you do?',
      objective: 'Hot-work fire prevention',
      options: [
        'Cover the combustibles with a welding blanket, keep the extinguisher and fire watch in place, and weld',
        'Strike the arc — the parts are small and you will be done in a minute',
        'Weld, but keep one eye on the boxes between passes',
      ],
      correct: 0,
      hardFailOptions: [1],
      hardFailMessage:
        'Combustibles within the hot-work zone (35 feet under OSHA 29 CFR 1910.252) must be removed or protected before an arc is struck — a short job is still hot work, and sparks travel farther than the bead. The course\'s fire-prevention lesson (welding-02) is explicit: protect or move the combustibles, keep the extinguisher and fire watch in place, then weld. This attempt cannot pass.',
      points: 10,
    },
    {
      kind: 'decide',
      id: 'machine-setup',
      title: 'Machine setup for the coupon',
      prompt:
        'The coupon is GMAW (MIG) on 1/4-inch mild steel with solid wire and gas shielding. Which machine setup matches the process?',
      objective: 'Machine setup and polarity',
      options: [
        'Constant-voltage (CV) output, DC electrode positive (DCEP)',
        'Constant-current (CC) output, DC electrode negative (DCEN)',
        'Constant-voltage (CV) output, DC electrode negative (DCEN)',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'calculate',
      id: 'diagonal-check',
      title: 'Prove the frame square',
      prompt:
        'The frame measures 36 inches by 48 inches. Equal diagonals prove a rectangular frame is square. What must each diagonal measure, in inches, for this frame to be square?',
      objective: 'Measurement and squareness',
      answer: 60,
      unit: 'in',
      tolerancePct: 1,
      points: 10,
      explanation:
        'The diagonal is the hypotenuse: √(36² + 48²) = √(1296 + 2304) = √3600 = 60 inches — the 3-4-5 triangle scaled by 12. Measure both diagonals; if they differ, the frame is racked by that difference and gets pulled square before tacking (welding-11).',
    },
    {
      kind: 'decide',
      id: 'bead-reading',
      title: 'Read the bead',
      prompt:
        'Your practice bead shows a groove melted into the base metal right at the weld toe, left unfilled, and the bead looks narrow and ropey. What are you looking at, and what produced it?',
      objective: 'Bead and defect recognition',
      options: [
        'Undercut — excessive current and travel speed melted the toe faster than the bead filled it',
        'Porosity — gas trapped as the metal solidified, from contamination or lost shielding',
        'Overlap — weld metal rolled over the toe without fusing to it',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'inspect',
      id: 'coupon-inspection',
      title: 'Inspect the finished coupon',
      prompt:
        'The coupon is cool and cleaned. Inspect it the way visual testing is taught: against the acceptance criteria, finding by finding. Flag every finding that is a defect requiring repair or rejection; pass what meets the criteria.',
      objective: 'Visual inspection judgment',
      pointsEach: 3,
      items: [
        {
          id: 'surface-pores',
          label: 'Bead face',
          observation: 'A cluster of round surface pores breaks through the middle third of the bead.',
          defect: true,
        },
        {
          id: 'uniform-ripple',
          label: 'Bead profile',
          observation: 'Ripple pattern is even and consistent along the full length of the pass.',
          defect: false,
        },
        {
          id: 'toe-undercut',
          label: 'Weld toe',
          observation: 'A sharp groove runs along one toe, deeper than the visual criteria allow for this joint.',
          defect: true,
        },
        {
          id: 'wet-edges',
          label: 'Fusion at the edges',
          observation: 'Both edges of the bead wet smoothly into the base metal with no rolled-over lip.',
          defect: false,
        },
        {
          id: 'crater-crack',
          label: 'Stop crater',
          observation: 'A short crack runs out of the crater at the end of the pass.',
          defect: true,
        },
        {
          id: 'reinforcement',
          label: 'Reinforcement',
          observation: 'Bead reinforcement is slight and uniform, inside the profile limits on the criteria sheet.',
          defect: false,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'crack-disposition',
      title: 'Disposition the crack',
      prompt:
        'You have confirmed a crack at the stop crater. The coupon is due at the end of shift and the rest of the weld looks clean. What is the correct disposition?',
      objective: 'Visual inspection judgment',
      options: [
        'Remove the cracked metal completely, repair the weld, re-inspect, and document the finding',
        'Accept it — a short crack at the crater is cosmetic and the rest of the weld is sound',
        'Grind the surface smooth so the crack no longer shows, and turn the coupon in',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'Cracks are the most serious finding in visual inspection (welding-10): a crack is never within acceptance criteria, and grinding the surface smooth only hides it while the crack remains in the joint. The correct disposition is to remove the cracked metal completely, repair, re-inspect, and document. This attempt cannot pass.',
      points: 12,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Welding safety and PPE — eyes, skin, lungs, and the work area (welding-01)',
      coverage: 'full',
      note: 'The eight-item PPE and booth check is judged observation by observation, including the galvanized-fume and lighter-in-pocket traps the lesson names.',
    },
    {
      topic: 'Fire prevention, hot-work permits, and the fire watch (welding-02)',
      coverage: 'full',
      note: 'The hot-work decision hard-fails the attempt if the learner strikes an arc with unprotected combustibles in the zone.',
    },
    {
      topic: 'Equipment setup and machine settings (welding-04)',
      coverage: 'applied',
      note: 'The learner must match GMAW to CV output and DCEP from the lesson\'s power-source and polarity teaching.',
    },
    {
      topic: 'Fabrication workflow and measurement (welding-11)',
      coverage: 'applied',
      note: 'The squareness proof is worked as the lesson teaches it: equal diagonals, computed for a 36 in × 48 in frame.',
    },
    {
      topic: 'Striking an arc and running a bead (welding-08)',
      coverage: 'applied',
      note: 'The bead-reading step tests the lesson\'s defect signatures — undercut from current and speed — against porosity and overlap.',
    },
    {
      topic: 'Defect recognition and visual inspection (welding-10)',
      coverage: 'full',
      note: 'The coupon inspection and crack disposition exercise VT judgment against acceptance criteria; accepting or concealing a crack hard-fails.',
    },
    {
      topic: 'Capstone practical: produce and inspect a weld coupon (welding-13)',
      coverage: 'embedded',
      note: 'The whole lab is structured as the capstone job: set up, weld, inspect, and disposition one coupon.',
    },
  ],
};
