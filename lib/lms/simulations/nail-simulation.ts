/**
 * lib/lms/simulations/nail-simulation.ts
 *
 * Nail Station Lab — the hands-on client-service simulation for the Nail
 * Technician Apprenticeship course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract. One appointment end to end: station sanitation and chemical
 * safety, observation before service, living-tissue protection, consented
 * charges, and inventory discipline. Content is drawn from the course's
 * own lessons: Nail-station sanitation and chemical safety; Hand and nail
 * observation before service; Cuticle care and living-tissue protection;
 * Appointments, consented charges and receipts; Inventory, expiry and
 * replenishment.
 *
 * The hard fail mirrors the observation lesson verbatim: never apply an
 * enhancement over an unexplained painful, lifted, or discolored nail —
 * covering a suspicious change delays attention and obscures later
 * observations. Prices are fictional training material, as in the
 * forklift lab.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const NAIL_STATION_SIM_ID = 'nail-station-lab';

export const NAIL_STATION_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: NAIL_STATION_SIM_ID,
  title: 'Nail Station Lab — Sanitation, Observation, and the Service Decision',
  description:
    'Set up the station to sanitation and chemical-safety standard, observe the hands and nails before any product is applied, protect living tissue in cuticle work, confirm the consented charges, and handle an expired product correctly. The lab is scored against the course lessons.',
  setting:
    'Your first client of the day wants a full enhancement set. The station was left as the evening shift closed it.',
  badges: ['Station sanitation', 'Observation before service', 'Chemical safety'],
  objectives: [
    'Station sanitation and chemical safety',
    'Observation before service',
    'Living-tissue protection',
    'Consented charges',
    'Inventory and expiry discipline',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: applying an enhancement over an unexplained painful, lifted, or discolored nail. Observe first; covering a suspicious change can delay attention and obscure later observations.',
    'Single-use porous files and buffers are not made reusable by spraying, and chemicals are never mixed or used from an unlabeled container.',
  ],
  steps: [
    {
      kind: 'inspect',
      id: 'station-sanitation',
      title: 'Set up the station',
      prompt:
        'Check the station against the sanitation lesson before the client sits down. Flag every defect; pass what meets standard.',
      objective: 'Station sanitation and chemical safety',
      pointsEach: 3,
      items: [
        {
          id: 'sprayed-file',
          label: 'Porous file from yesterday',
          observation: 'A used porous file was sprayed with disinfectant and set out for today\'s first client.',
          defect: true,
        },
        {
          id: 'mixed-chemicals',
          label: 'Soak solution',
          observation: 'Two products were mixed together "for a stronger soak," in the station\'s soak bowl.',
          defect: true,
        },
        {
          id: 'unlabeled-bottle',
          label: 'Spray bottle',
          observation: 'A spray bottle of clear liquid has no label; everyone "knows what it is."',
          defect: true,
        },
        {
          id: 'ventilation-sds',
          label: 'Ventilation and safety data',
          observation: 'Ventilation is running at the work area and safety data sheets are accessible at the station.',
          defect: false,
        },
        {
          id: 'clean-used-separate',
          label: 'Tool storage',
          observation: 'Clean tools and used tools sit in separate, protected locations.',
          defect: false,
        },
        {
          id: 'foot-spa-wipe',
          label: 'Foot-spa cleaning',
          observation: 'The foot spa was surface-wiped only; its written procedure for internal parts was not followed.',
          defect: true,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'observation-decision',
      title: 'The observation',
      prompt:
        'Before service you inspect the nails under good light: one nail is lifted and discolored, and the client says it has been sore. She asks you to "just put the enhancement over it — no one will see it." What do you do?',
      objective: 'Observation before service',
      options: [
        'Do not apply the enhancement over that nail: record the client\'s report separately from your visible findings, modify or defer the service, and recommend medical assessment — without diagnosing what it is',
        'Apply the enhancement; the client has asked for it and the soreness is probably nothing',
        'Apply it but thinner, so it is easier to remove if the nail gets worse',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'The observation lesson\'s rule is direct: do not apply an enhancement over an unexplained painful, lifted, or discolored nail, and do not diagnose fungus or any other condition. A cosmetic practitioner can decide to modify or defer a service while recommending medical assessment; covering a suspicious change can delay attention and obscure later observations. Document the decision before any product application. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'decide',
      id: 'cuticle-care',
      title: 'Cuticle care',
      prompt:
        'During the manicure, the cuticle work reaches the living tissue at the nail fold. What does the course require?',
      objective: 'Living-tissue protection',
      options: [
        'Work only on the non-living cuticle tissue as taught, protect the living tissue, and stop rather than cut or tear living skin',
        'Trim the living tissue neatly — a clean line is the professional finish',
        'Push through minor bleeding; it stops quickly and the service should not be interrupted',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'calculate',
      id: 'consented-charges',
      title: 'Confirm the charges',
      prompt:
        'The appointment lesson requires charges the client has consented to, confirmed before the service is finalized: manicure $40, gel finish add-on $15, and a take-home oil at $9. What total do you confirm with the client?',
      objective: 'Consented charges',
      answer: 64,
      unit: 'dollars',
      tolerancePct: 1,
      points: 10,
      explanation:
        '$40 + $15 + $9 = $64. Consented charges are confirmed with the client and receipted — an add-on agreed mid-service still belongs in the confirmed total, not as a surprise at the register.',
    },
    {
      kind: 'decide',
      id: 'expired-product',
      title: 'The expired product',
      prompt:
        'Stocking the station, you find a enhancement liquid two months past its expiry date, nearly full. What does inventory discipline require?',
      objective: 'Inventory and expiry discipline',
      options: [
        'Remove it from service, record it, and replenish through the normal procedure — expired product is not used on clients',
        'Use it first before opening the new bottle; expiry dates are conservative',
        'Move it to the back of the shelf so it is used last',
      ],
      correct: 0,
      points: 8,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Nail-station sanitation and chemical safety',
      coverage: 'full',
      note: 'The station inspection scores single-use discipline, no mixing, labeling, ventilation, clean/used separation, and the foot-spa written procedure.',
    },
    {
      topic: 'Hand and nail observation before service',
      coverage: 'full',
      note: 'The observation step is the lab\'s hard fail and reproduces the lesson\'s rule and reasoning; it is also the attach lesson.',
    },
    {
      topic: 'Cuticle care and living-tissue protection',
      coverage: 'applied',
      note: 'The cuticle step scores the living-tissue boundary the lesson draws.',
    },
    {
      topic: 'Appointments, consented charges and receipts',
      coverage: 'applied',
      note: 'The charges step requires the confirmed, consented total the lesson describes.',
    },
    {
      topic: 'Inventory, expiry and replenishment',
      coverage: 'applied',
      note: 'The expired-product step scores removal and recording over use-it-first habits.',
    },
  ],
};
