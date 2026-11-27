import 'server-only';

import workbook from '@/lib/lms/hvac-workbook-content.json';
import { subcooling, superheat } from '@/lib/lms/hvac-system-model';
import type { HVAC_PRACTICAL_SOURCE_ALLOCATION } from '@/lib/lms/hvac-practical-plan';
import type {
  HvacSimulationAction,
  HvacSimulationControl,
  HvacSimulationFeedback,
  HvacSimulationPanel,
  HvacSimulationReading,
  HvacSimulationView,
} from '@/lib/lms/hvac-simulation-types';

/** These authored teaching models never operate equipment or issue credentials. */
export const HVAC_SIMULATION_VERSION = 'v1';
export const HVAC_SIMULATION_PASSING_SCORE = 80;
export const HVAC_SIMULATION_MAX_ACTIONS = 300;

type Requirement = { controlId: string; value: string | number };
type Choice = {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
  safety?: boolean;
};
type Stage = {
  id: string;
  title: string;
  prompt: string;
  requirements: Requirement[];
  options: Choice[];
  observationRequired: boolean;
};
type Source = { label: string; url: string };

export type HvacSimulationDefinition = {
  id: string;
  version: string;
  lessonId: string;
  chapter: number;
  title: string;
  scenario: string;
  objective: string;
  panel: HvacSimulationPanel;
  controls: HvacSimulationControl[];
  stages: Stage[];
  sources: Source[];
};

export type HvacSimulationState = {
  stageIndex: number;
  controls: Record<string, string | number>;
  observed: boolean;
  mistakes: number;
  actionsProcessed: number;
  feedback: HvacSimulationFeedback | null;
};

export class HvacSimulationActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HvacSimulationActionError';
  }
}

const sources = {
  certification: {
    label: 'EPA: Section 608 certification categories',
    url: 'https://www.epa.gov/section608/section-608-technician-certification-requirements',
  },
  topics: {
    label: 'EPA: Section 608 test topics',
    url: 'https://www.epa.gov/section608/test-topics',
  },
  service: {
    label: 'EPA: Stationary refrigeration service practices',
    url: 'https://www.epa.gov/section608/stationary-refrigeration-service-practice-requirements',
  },
  venting: {
    label: 'EPA: Refrigerant venting prohibition',
    url: 'https://www.epa.gov/section608/stationary-refrigeration-prohibition-venting-refrigerants',
  },
  sales: {
    label: 'EPA: Refrigerant sales restrictions',
    url: 'https://www.epa.gov/section608/refrigerant-sales-restriction',
  },
  electrical: {
    label: 'OSHA: Electrical work practices',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333',
  },
  energy: {
    label: 'OSHA: Control of hazardous energy',
    url: 'https://www.osha.gov/control-hazardous-energy/',
  },
  ohm: {
    label: "Fluke: Ohm's law",
    url: 'https://www.fluke.com/en-us/learn/blog/electrical/what-is-ohms-law',
  },
  clamp: {
    label: 'Fluke: Current-clamp measurement principles',
    url: 'https://www.fluke.com/en-us/learn/blog/clamps/using-accessory-current-clamps-with-fluke-dmms',
  },
  temperatures: {
    label: 'Copeland: Superheat and subcooling measurements',
    url: 'https://copeland.custhelp.com/app/answers/detail/a_id/955/~/operating-superheat%2C-subcooling-and-net-oil-pressure',
  },
  vacuum: {
    label: 'Fieldpiece: Vacuum measurement and verification',
    url: 'https://www.fieldpiece.com/news-articles/vacuum-pump-best-practices-tips-and-tricks/',
  },
  hotwork: {
    label: 'OSHA: Fire prevention during hot work',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.352',
  },
  pumpDown: {
    label: 'Daikin: Equipment-specific pump-down limitations and service procedure',
    url: 'https://www.daikinac.com/docs/default-source/dvpec/sm-rsd6215001r8.pdf',
  },
  brazing: {
    label: 'Trane: Refrigerant-line brazing and component heat protection',
    url: 'https://elibrary.tranetechnologies.com/public/residential-hvac/Literature/Service%20Facts/ODR-SVN006B-EN_08232025.pdf',
  },
  purge: {
    label: 'Harris Products Group: Nitrogen purge and brazing quality',
    url: 'https://qacd10.harrisproductsgroup.com/en/Resources/Knowledge-Center/Articles/Nitrogen-Purge-and-Brazing',
  },
  ladders: {
    label: 'OSHA: Construction ladder requirements',
    url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1053',
  },
  emergency: {
    label: 'American Red Cross: First aid response steps',
    url: 'https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps',
  },
} satisfies Record<string, Source>;

const choice = (
  id: string,
  label: string,
  correct: boolean,
  feedback: string,
  safety = false,
): Choice => ({ id, label, correct, feedback, ...(safety ? { safety } : {}) });
const at = (controlId: string, value: string | number): Requirement => ({ controlId, value });
const select = (
  id: string,
  label: string,
  value: string,
  options: Record<string, string>,
): HvacSimulationControl => ({
  id,
  label,
  type: 'select',
  value,
  options: Object.entries(options).map(([optionValue, optionLabel]) => ({
    value: optionValue,
    label: optionLabel,
  })),
});
const range = (
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  unit: string,
): HvacSimulationControl => ({ id, label, type: 'range', value, min, max, step, unit });
const stage = (
  id: string,
  title: string,
  prompt: string,
  requirements: Requirement[],
  options: Choice[],
): Stage => ({ id, title, prompt, requirements, options, observationRequired: true });
function simulation(
  chapter: number,
  title: string,
  objective: string,
  scenario: string,
  panel: HvacSimulationPanel,
  controls: HvacSimulationControl[],
  stages: Stage[],
  references: Source[],
): HvacSimulationDefinition {
  const lesson = workbook.chapters.find((entry) => entry.number === chapter);
  if (!lesson) throw new Error(`Missing canonical HVAC chapter ${chapter}`);
  return {
    id: `hvac-sim:chapter-${String(chapter).padStart(2, '0')}:${HVAC_SIMULATION_VERSION}`,
    version: HVAC_SIMULATION_VERSION,
    lessonId: lesson.lesson_id,
    chapter,
    title,
    objective,
    scenario: `${scenario} All readings and records in this activity are simulated. Equipment-specific instructions and supervised physical assessment remain separate.`,
    panel,
    controls,
    stages,
    sources: references,
  };
}

export const HVAC_SIMULATION_DEFINITIONS: readonly HvacSimulationDefinition[] = [
  simulation(
    1,
    'Build the training work order',
    'Distinguish study, simulation, observed skill and external examination evidence.',
    'A fictional learner has completed an online exercise and is arranging an equipment lab. Route each piece of evidence to the correct next step.',
    'workflow',
    [
      select('evidence', 'Evidence on the work order', 'simulation', {
        lesson: 'Lesson studied',
        simulation: 'Simulation completed',
        observed: 'Instructor-observed task',
        exam: 'External exam result',
      }),
      select('appointment', 'Supervised lab appointment', 'pending', {
        pending: 'Not confirmed',
        confirmed: 'Confirmed with instructor',
      }),
      select('examRecord', 'External credential record', 'unverified', {
        unverified: 'Not verified',
        verified: 'Verified by the issuing organization',
      }),
    ],
    [
      stage(
        'evidence',
        'Classify the evidence',
        'Select Simulation completed and inspect the work order. What does this establish?',
        [at('evidence', 'simulation')],
        [
          choice(
            'a',
            'An external EPA credential',
            false,
            'A simulation result is practice evidence. The external examination has its own verified result.',
          ),
          choice(
            'b',
            'Completion of this simulated practice activity',
            true,
            'Record the activity as simulated practice; it does not establish observed equipment performance.',
          ),
          choice(
            'c',
            'Every physical task has been observed',
            false,
            'An instructor must actually observe a physical task before that record is made.',
          ),
        ],
      ),
      stage(
        'appointment',
        'Prepare the physical appointment',
        'Set the supervised appointment to Confirmed with instructor, then inspect the updated work order. What comes next?',
        [at('appointment', 'confirmed')],
        [
          choice(
            'a',
            'Follow the confirmed instructor plan for the scheduled lab',
            true,
            'A confirmed arrangement identifies the next supervised training step. Attendance is recorded when it occurs.',
          ),
          choice(
            'b',
            'Backdate the lab hours to today',
            false,
            'A scheduled appointment is not completed attendance.',
          ),
          choice(
            'c',
            'Work alone because the online practice passed',
            false,
            'Practice does not remove the need for the agreed supervision.',
            true,
          ),
        ],
      ),
      stage(
        'credential',
        'Report the credential accurately',
        'Select External exam result but leave its record Not verified. Inspect the evidence status. What should the learner report?',
        [at('evidence', 'exam'), at('examRecord', 'unverified')],
        [
          choice(
            'a',
            'Universal certification earned',
            false,
            'That claim requires the actual verified examination result.',
          ),
          choice(
            'b',
            'All program requirements waived',
            false,
            'Program requirements are not waived by changing an evidence label.',
          ),
          choice(
            'c',
            'External credential verification is still pending',
            true,
            'Keep the pending status until the issuing organization supplies the credential evidence.',
          ),
        ],
      ),
    ],
    [sources.certification],
  ),

  simulation(
    2,
    'Trace the system and isolate hazards',
    'Connect component function, cooling mode and safe work authorization.',
    'Explore a simplified split system. The instructor has supplied a deenergized teaching diagram; the authorization control describes a fictional work order.',
    'system',
    [
      select('component', 'Component to inspect', 'compressor', {
        compressor: 'Compressor',
        condenser: 'Outdoor coil',
        metering: 'Metering device',
        evaporator: 'Indoor coil',
      }),
      select('mode', 'Operating mode on the diagram', 'cooling', {
        cooling: 'Cooling',
        heating: 'Heat-pump heating',
      }),
      select('isolation', 'Hazardous-energy verification', 'unverified', {
        unverified: 'Not verified',
        verified: 'Verified by qualified supervisor',
      }),
    ],
    [
      stage(
        'authorization',
        'Check the work boundary',
        'Inspect the work authorization while energy verification is Not verified. Which action is supported?',
        [at('isolation', 'unverified')],
        [
          choice(
            'a',
            'Treat thermostat off as verified isolation',
            false,
            'An operating control does not establish hazardous-energy isolation.',
            true,
          ),
          choice(
            'b',
            'Stop physical work and obtain the required qualified verification',
            true,
            'The diagram can be studied now; physical access requires the actual energy-control procedure.',
          ),
          choice(
            'c',
            'Open a panel to see whether the fan stops',
            false,
            'Do not use exposure to hazardous parts as a test of isolation.',
            true,
          ),
        ],
      ),
      stage(
        'indoor',
        'Follow heat into the refrigerant',
        'Set Cooling, Indoor coil and verified supervision. Inspect the component function.',
        [at('mode', 'cooling'), at('component', 'evaporator'), at('isolation', 'verified')],
        [
          choice(
            'a',
            'This coil absorbs heat from indoor air in the cooling model',
            true,
            'The indoor evaporator absorbs heat as refrigerant evaporates.',
          ),
          choice(
            'b',
            'The coil creates cold without moving heat',
            false,
            'Cooling moves heat out of the space; it does not manufacture a substance called cold.',
          ),
          choice(
            'c',
            'The coil compresses vapor',
            false,
            'Compression is the compressor function.',
          ),
        ],
      ),
      stage(
        'outdoor',
        'Follow heat out of the refrigerant',
        'Select Outdoor coil while Cooling remains selected. Inspect its changed role.',
        [at('mode', 'cooling'), at('component', 'condenser')],
        [
          choice(
            'a',
            'It meters refrigerant into the low side',
            false,
            'The metering device performs that function.',
          ),
          choice(
            'b',
            'It certifies that the charge is correct',
            false,
            'Naming a component does not establish the charge condition.',
          ),
          choice(
            'c',
            'It rejects heat to outdoor air in this mode',
            true,
            'The condenser rejects absorbed heat plus compressor work. Reversing a heat pump changes coil roles.',
          ),
        ],
      ),
    ],
    [sources.topics, sources.electrical],
  ),

  simulation(
    3,
    'Operate the virtual meter bench',
    'Predict and measure current in an ideal resistive circuit and recognize clamp cancellation.',
    'This isolated mathematical bench contains a DC source, switch and resistive load. It is not a model of a compressor motor or permission to test live equipment.',
    'electrical',
    [
      range('voltage', 'Bench supply', 24, 12, 24, 12, 'V'),
      range('resistance', 'Load resistance', 12, 6, 24, 6, 'Ω'),
      select('switch', 'Virtual switch', 'open', { open: 'Open', closed: 'Closed' }),
      select('meter', 'Instrument mode', 'current', {
        current: 'Current',
        voltage: 'Voltage across load',
        resistance: 'Resistance (isolated bench only)',
      }),
      select('clamp', 'Clamp position', 'single', {
        single: 'One conductor',
        both: 'Both outgoing and return conductors',
      }),
    ],
    [
      stage(
        'open',
        'Observe an open circuit',
        'Use 24 V, 12 Ω, an open switch and Current mode. Run the check. What does the current show?',
        [at('voltage', 24), at('resistance', 12), at('switch', 'open'), at('meter', 'current')],
        [
          choice(
            'a',
            '2 A because the supply label says 24 V',
            false,
            'An open switch interrupts the complete path, so this ideal circuit has no load current.',
          ),
          choice(
            'b',
            '0 A through the open path',
            true,
            'The source voltage alone does not create current without a closed path.',
          ),
          choice(
            'c',
            'The full building is proven deenergized',
            false,
            'The virtual bench cannot verify any real electrical equipment.',
            true,
          ),
        ],
      ),
      stage(
        'closed',
        'Measure a complete circuit',
        'Close the switch with the clamp on one conductor. Keep 24 V, 12 Ω and Current mode; inspect the new reading.',
        [
          at('voltage', 24),
          at('resistance', 12),
          at('switch', 'closed'),
          at('meter', 'current'),
          at('clamp', 'single'),
        ],
        [
          choice(
            'a',
            '2 A, from 24 ÷ 12',
            true,
            'For this resistive teaching circuit, I = V/R = 2 A.',
          ),
          choice(
            'b',
            '12 A, from the resistance label',
            false,
            'Resistance is measured in ohms; calculate current by dividing volts by ohms.',
          ),
          choice(
            'c',
            '288 A, from multiplying the labels',
            false,
            'Use I = V/R for current in this model.',
          ),
        ],
      ),
      stage(
        'resistance',
        'Change one variable',
        'Increase resistance to 24 Ω while keeping 24 V, the switch closed and the clamp on one conductor. Inspect the reading.',
        [
          at('voltage', 24),
          at('resistance', 24),
          at('switch', 'closed'),
          at('meter', 'current'),
          at('clamp', 'single'),
        ],
        [
          choice(
            'a',
            'Current doubles to 4 A',
            false,
            'At unchanged voltage, greater resistance reduces current in this model.',
          ),
          choice(
            'b',
            'The reading cannot change',
            false,
            'Resistance is one of the variables controlling current.',
          ),
          choice(
            'c',
            'Current falls to 1 A',
            true,
            'Doubling resistance at fixed voltage halves current here.',
          ),
        ],
      ),
      stage(
        'clamp',
        'Detect a misleading setup',
        'Place the clamp around both outgoing and return conductors without changing the circuit. Inspect the displayed and actual currents.',
        [
          at('voltage', 24),
          at('resistance', 24),
          at('switch', 'closed'),
          at('meter', 'current'),
          at('clamp', 'both'),
        ],
        [
          choice(
            'a',
            'The zero clamp display proves no current exists',
            false,
            'Opposing currents can cancel in the clamp; this setup cannot establish that the load is off.',
          ),
          choice(
            'b',
            'The opposing fields cancel; the circuit still carries 1 A',
            true,
            'The instrument setup matters. A normal single-load measurement uses the appropriate conductor arrangement for the instrument.',
          ),
          choice(
            'c',
            'The clamp has removed current from the wire',
            false,
            'Moving the virtual clamp has not opened the circuit.',
          ),
        ],
      ),
    ],
    [sources.ohm, sources.clamp, sources.electrical],
  ),

  simulation(
    4,
    'Respond to furnace safety states',
    'Interpret a simplified heating sequence without bypassing protective controls.',
    'A conceptual furnace controller receives a heat request, checks the modeled airflow condition and requires flame proof. The case is intentionally simplified; actual sequences come from the exact appliance instructions.',
    'furnace',
    [
      select('request', 'Thermostat request', 'on', {
        off: 'No heat request',
        on: 'Heat requested',
      }),
      select('vent', 'Simulated vent/airflow condition', 'restricted', {
        clear: 'Verified clear in the case',
        restricted: 'Restricted / airflow not proven',
      }),
      select('flame', 'Flame-proof signal', 'lost', {
        lost: 'Not proven',
        proven: 'Proven in the case',
      }),
    ],
    [
      stage(
        'airflow',
        'Read the blocked sequence',
        'Request heat with Restricted airflow and inspect the controller. What should happen next?',
        [at('request', 'on'), at('vent', 'restricted')],
        [
          choice(
            'a',
            'Bridge the safety input to force heating',
            false,
            'A safety input must not be bypassed to make the sequence continue.',
            true,
          ),
          choice(
            'b',
            'Stop the sequence and investigate the airflow fault under the actual service procedure',
            true,
            'The modeled safety gate remains closed; a heat request does not override it.',
          ),
          choice(
            'c',
            'Increase fuel flow until a flame appears',
            false,
            'A missing prerequisite is not corrected by adding fuel.',
            true,
          ),
        ],
      ),
      stage(
        'flame',
        'Observe a second failure state',
        'Set airflow to Verified clear but leave flame Not proven. Inspect the changed controller state.',
        [at('request', 'on'), at('vent', 'clear'), at('flame', 'lost')],
        [
          choice(
            'a',
            'Keep requesting fuel with no flame proof',
            false,
            'The simulated fuel request is stopped when flame is not proven.',
            true,
          ),
          choice(
            'b',
            'Treat the fault as successful heating',
            false,
            'The required flame evidence is absent.',
          ),
          choice(
            'c',
            'Recognize flame failure and follow qualified diagnostic instructions',
            true,
            'Record the failed proof condition and the control response instead of bypassing it.',
          ),
        ],
      ),
      stage(
        'permitted',
        'Recognize a permitted model sequence',
        'Set the flame signal to Proven while heat is requested and airflow is clear. Inspect the new state.',
        [at('request', 'on'), at('vent', 'clear'), at('flame', 'proven')],
        [
          choice(
            'a',
            'The teaching model now permits heating; real startup still needs the specified checks',
            true,
            'All modeled inputs are present. This simplified result is not a combustion or field safety certification.',
          ),
          choice(
            'b',
            'The model has verified carbon monoxide levels',
            false,
            'No combustion measurement is modeled here.',
          ),
          choice(
            'c',
            'All furnace designs use these exact timings',
            false,
            'Timings and tests depend on the appliance; this model makes no universal timing claim.',
          ),
        ],
      ),
    ],
    [sources.energy, sources.topics],
  ),

  simulation(
    5,
    'Read the virtual temperature manifold',
    'Calculate superheat and subcooling from paired temperatures.',
    'The training card supplies saturation temperatures from a hypothetical correctly selected refrigerant reference at each measurement location. Change one temperature and watch the computed differences; no charging target is implied.',
    'manifold',
    [
      range('suctionSaturation', 'Suction saturation reference', 40, 20, 60, 1, '°F'),
      range('suctionLine', 'Suction-line temperature', 55, 30, 90, 1, '°F'),
      range('condensingSaturation', 'Liquid-side saturation reference', 105, 80, 130, 1, '°F'),
      range('liquidLine', 'Liquid-line temperature', 95, 60, 110, 1, '°F'),
    ],
    [
      stage(
        'superheat',
        'Read the initial superheat',
        'Set suction saturation to 40°F and suction line to 55°F. Inspect both readings and their difference.',
        [at('suctionSaturation', 40), at('suctionLine', 55)],
        [
          choice(
            'a',
            '95°F of superheat',
            false,
            'Superheat is a difference, not the sum of the two temperatures.',
          ),
          choice(
            'b',
            '15°F of superheat',
            true,
            '55 − 40 = 15°F above the saturation reference at that location.',
          ),
          choice(
            'c',
            '−15°F of superheat',
            false,
            'Subtract saturation temperature from the measured vapor temperature.',
          ),
        ],
      ),
      stage(
        'response',
        'Predict a changed vapor temperature',
        'Raise only the suction-line temperature to 60°F, keeping its saturation reference at 40°F. Inspect again.',
        [at('suctionSaturation', 40), at('suctionLine', 60)],
        [
          choice('a', '20°F of superheat', true, 'The modeled difference rises by 5°F to 20°F.'),
          choice(
            'b',
            'The difference remains 15°F',
            false,
            'The measured line temperature changed while the reference stayed fixed.',
          ),
          choice(
            'c',
            'This alone proves refrigerant must be added',
            false,
            'A calculated value must be interpreted with operating conditions and the exact equipment method.',
          ),
        ],
      ),
      stage(
        'subcooling',
        'Calculate on the liquid side',
        'Set liquid-side saturation to 105°F and liquid line to 100°F. Inspect the liquid-side difference.',
        [at('condensingSaturation', 105), at('liquidLine', 100)],
        [
          choice(
            'a',
            '205°F of subcooling',
            false,
            'The liquid-side result is also a temperature difference.',
          ),
          choice(
            'b',
            '−5°F of subcooling',
            false,
            'For subcooling, subtract liquid temperature from its saturation reference.',
          ),
          choice(
            'c',
            '5°F of subcooling, to be compared with the equipment-specific method',
            true,
            '105 − 100 = 5°F. The simulator has not supplied a field charging target.',
          ),
        ],
      ),
      stage(
        'phase-check',
        'Recognize an inconsistent phase assumption',
        'Set suction saturation to 40°F and suction line to 30°F; set liquid-side saturation to 105°F and liquid line to 110°F. Inspect both negative differences and the interpretation flag.',
        [
          at('suctionSaturation', 40),
          at('suctionLine', 30),
          at('condensingSaturation', 105),
          at('liquidLine', 110),
        ],
        [
          choice(
            'a',
            'Treat both negative values as normal superheated vapor and subcooled liquid',
            false,
            'Those phase descriptions are inconsistent with the negative differences at the supplied reference points.',
          ),
          choice(
            'b',
            'Verify refrigerant/reference selection, measurement location and state before interpreting charge',
            true,
            'The arithmetic remains visible, but negative differences do not describe positive superheat or positive subcooling. Investigate the assumptions and measurements.',
          ),
          choice(
            'c',
            'Automatically add refrigerant until the numbers turn positive',
            false,
            'A warning is a reason to check the measurement and equipment method, not a charging command.',
          ),
        ],
      ),
    ],
    [sources.temperatures],
  ),

  simulation(
    6,
    'Prevent an unsupported refrigerant release',
    'Use refrigerant identification and the work boundary to choose a supported handling decision.',
    'A fictional R-410A service order arrives with an unreadable label. The release control shows a proposed action only; it never opens a real valve.',
    'safety',
    [
      select('refrigerant', 'Refrigerant identity in the case', 'unknown', {
        unknown: 'Unknown',
        r410a: 'R-410A verified from the case record',
        r22: 'R-22 verified from the case record',
      }),
      select('release', 'Proposed refrigerant path', 'contained', {
        contained: 'Remain contained / approved recovery path',
        atmosphere: 'Intentional atmospheric release requested',
      }),
      select('handling', 'Handling arrangement', 'unverified', {
        unverified: 'Equipment and supervision unverified',
        verified: 'Compatible equipment and qualified arrangement verified',
      }),
    ],
    [
      stage(
        'identity',
        'Check the unknown material',
        'Leave identity Unknown and inspect the readiness board. What is the supported next step?',
        [at('refrigerant', 'unknown')],
        [
          choice(
            'a',
            'Guess from the cylinder color',
            false,
            'The simulation has no reliable identity evidence. Appearance alone does not resolve compatibility.',
          ),
          choice(
            'b',
            'Stop handling and obtain reliable identification and instructions',
            true,
            'Resolve the material and equipment requirements before choosing a handling route.',
          ),
          choice(
            'c',
            'Mix it into the nearest recovery container',
            false,
            'An unidentified material is not a basis for mixing refrigerants.',
            true,
          ),
        ],
      ),
      stage(
        'release',
        'Reject a venting shortcut',
        'Select verified R-410A and Intentional atmospheric release requested. Inspect the warning.',
        [at('refrigerant', 'r410a'), at('release', 'atmosphere')],
        [
          choice(
            'a',
            'Reject intentional venting and plan the applicable recovery route',
            true,
            'The R-410A case is subject to the venting prohibition; a faster service call is not an exception.',
          ),
          choice(
            'b',
            'Release it because it does not deplete ozone',
            false,
            'Lack of ozone depletion does not permit intentional venting of the R-410A in this case.',
            true,
          ),
          choice(
            'c',
            'Call the release an incidental loss to make it permitted',
            false,
            'Renaming an intentional release does not change the action.',
            true,
          ),
        ],
      ),
      stage(
        'plan',
        'Prepare a supported handoff',
        'Select the contained/recovery path and verify the compatible equipment and qualified arrangement in the fictional case. Inspect readiness.',
        [at('refrigerant', 'r410a'), at('release', 'contained'), at('handling', 'verified')],
        [
          choice(
            'a',
            'Declare the physical recovery completed',
            false,
            'Planning and simulated readiness are not physical completion.',
          ),
          choice(
            'b',
            'Use the same settings for every refrigerant',
            false,
            'Compatibility and procedures depend on the material and equipment.',
          ),
          choice(
            'c',
            'Hand off the identified, contained job to the authorized procedure',
            true,
            'The work order now records the evidence needed for the next qualified step.',
          ),
        ],
      ),
    ],
    [sources.venting, sources.service],
  ),

  simulation(
    7,
    'Manage the recovery cylinder work card',
    'Calculate mass headroom and prevent unsupported mixing or purchases.',
    'This fictional cylinder card supplies a 12 kg tare and a 32 kg maximum permitted gross mass for this exercise only. Those values are not a rule for other cylinders or refrigerants.',
    'recovery',
    [
      range('grossMass', 'Simulated scale: gross mass', 32, 12, 36, 1, 'kg'),
      select('contents', 'Cylinder contents', 'identified', {
        identified: 'Same identified refrigerant',
        mixed: 'Mixed or unidentified material',
      }),
      select('purchaser', 'Purchaser eligibility evidence', 'unverified', {
        unverified: 'Not verified',
        verified: 'Required evidence verified in the case',
      }),
    ],
    [
      stage(
        'limit',
        'Read the supplied cylinder limit',
        'Set gross mass to 32 kg and inspect the remaining headroom. What should the operator plan?',
        [at('grossMass', 32)],
        [
          choice(
            'a',
            'Add another 12 kg because that is the tare',
            false,
            'Tare is the empty-cylinder mass; it is not additional capacity.',
            true,
          ),
          choice(
            'b',
            'Stop adding mass because this case has no remaining headroom',
            true,
            'The exercise limit and current gross mass are both 32 kg.',
          ),
          choice(
            'c',
            'Ignore the scale once the cylinder feels cool',
            false,
            'Temperature by touch does not replace the supplied mass limit.',
            true,
          ),
        ],
      ),
      stage(
        'headroom',
        'Calculate an alternate cylinder condition',
        'Move the fictional gross mass to 24 kg and inspect the recalculated headroom.',
        [at('grossMass', 24)],
        [
          choice(
            'a',
            '8 kg of headroom under the supplied exercise limit',
            true,
            '32 − 24 = 8 kg. Real limits must be established from the cylinder and refrigerant requirements.',
          ),
          choice(
            'b',
            '20 kg of headroom because tare is subtracted twice',
            false,
            'Compare the current gross mass directly with the supplied maximum gross mass.',
          ),
          choice(
            'c',
            '24 kg of remaining capacity',
            false,
            '24 kg is the current gross mass, not the remaining headroom.',
          ),
        ],
      ),
      stage(
        'contents',
        'Handle uncertain contents',
        'Change contents to Mixed or unidentified material and inspect the work card.',
        [at('contents', 'mixed')],
        [
          choice(
            'a',
            'Add a known refrigerant so the mixture has a label',
            false,
            'Adding known material does not identify or separate the existing mixture.',
            true,
          ),
          choice(
            'b',
            'Treat the mixture as pure because its pressure seems plausible',
            false,
            'A plausible pressure does not prove purity.',
          ),
          choice(
            'c',
            'Segregate and label the uncertainty for the appropriate recovery/reclamation decision',
            true,
            'Do not represent unidentified or mixed material as a known reusable refrigerant.',
          ),
        ],
      ),
      stage(
        'purchase',
        'Verify purchasing evidence',
        'Leave purchaser eligibility Not verified. Inspect the evidence status before authorizing a fictional restricted sale.',
        [at('purchaser', 'unverified')],
        [
          choice(
            'a',
            'Approve because the customer completed this simulator',
            false,
            'This activity does not establish eligibility to purchase restricted refrigerant.',
          ),
          choice(
            'b',
            'Obtain and verify the applicable eligibility evidence first',
            true,
            'A simulated course result is separate from the purchasing evidence required for the transaction.',
          ),
          choice(
            'c',
            'Record a credential number that looks valid',
            false,
            'Never invent credential evidence.',
          ),
        ],
      ),
    ],
    [sources.service, sources.sales],
  ),

  simulation(
    8,
    'Choose the small-appliance recovery path',
    'Use the appliance definition, equipment status and compressor condition together.',
    'The initial teaching appliance is factory assembled, charged and hermetically sealed, with 4 lb of refrigerant. Change the record to see why equipment classification and recovery decisions require actual facts.',
    'recovery',
    [
      range('charge', 'Nameplate charge in the case', 4, 1, 10, 1, 'lb'),
      select('assembly', 'Appliance construction record', 'factory', {
        factory: 'Factory assembled, charged and hermetically sealed',
        field: 'Field assembled system',
      }),
      select('compressor', 'Appliance compressor', 'inoperative', {
        operating: 'Operating',
        inoperative: 'Inoperative',
      }),
      select('equipment', 'Recovery equipment qualification', 'unknown', {
        unknown: 'Certification/compatibility unverified',
        verified: 'Certification/compatibility verified',
      }),
    ],
    [
      stage(
        'classify',
        'Classify the supplied appliance',
        'Use a 4 lb factory assembled, charged and sealed appliance and inspect its classification.',
        [at('charge', 4), at('assembly', 'factory')],
        [
          choice(
            'a',
            'Type III solely because it is indoors',
            false,
            'Location does not establish a low-pressure appliance classification.',
          ),
          choice(
            'b',
            'The supplied record fits the small-appliance category for this exercise',
            true,
            'The case supplies the construction and charge facts needed for the small-appliance definition.',
          ),
          choice(
            'c',
            'All systems below 5 lb are small appliances regardless of construction',
            false,
            'Charge quantity alone does not supply every part of the definition.',
          ),
        ],
      ),
      stage(
        'equipment',
        'Check the recovery tool',
        'Keep equipment qualification Unverified and inspect the readiness result.',
        [at('equipment', 'unknown')],
        [
          choice(
            'a',
            'Verify the applicable equipment certification, compatibility and instructions',
            true,
            'Do not select a recovery method before the tool and appliance requirements are known.',
          ),
          choice(
            'b',
            'Use any pump with a hose connection',
            false,
            'A connection that fits does not prove suitable recovery equipment.',
            true,
          ),
          choice(
            'c',
            'Skip recovery because the appliance is small',
            false,
            'Small size does not itself remove the applicable recovery requirement.',
            true,
          ),
        ],
      ),
      stage(
        'compressor',
        'Respond to an inoperative compressor',
        'Set recovery equipment to Verified and the appliance compressor to Inoperative. Inspect the changed work card.',
        [at('equipment', 'verified'), at('compressor', 'inoperative')],
        [
          choice(
            'a',
            'Assume the appliance compressor will move refrigerant',
            false,
            'The case explicitly says that compressor is inoperative.',
          ),
          choice(
            'b',
            'Use one recovery percentage for every tool and condition',
            false,
            'The applicable procedure depends on facts including equipment and compressor status.',
          ),
          choice(
            'c',
            'Use the documented method for this tool and inoperative-compressor condition',
            true,
            'Record both conditions and follow the applicable recovery criteria; the simulator does not perform recovery.',
          ),
        ],
      ),
    ],
    [sources.service, sources.topics],
  ),

  simulation(
    9,
    'Interpret pressure and vacuum trends',
    'Distinguish a changing measurement from a proven cause and choose the next verification.',
    'The selectable specimens produce artificial time samples at fixed modeled temperature. The pressure-test example starts at 150 psig; the vacuum example starts at 400 microns. These are example inputs, never prescribed test or evacuation targets. The pump-down work card concerns an equipment-specific containment decision, not compressor or valve operation.',
    'vacuum',
    [
      select('measurement', 'Measurement mode', 'pressure', {
        pressure: 'Pressure-test trend',
        vacuum: 'Isolated vacuum trend',
      }),
      select('specimen', 'Instructor-set specimen', 'leak', {
        leak: 'Known training leak',
        moisture: 'Teaching outgassing sample series',
        sealed: 'Stable comparison specimen',
      }),
      range('elapsed', 'Selected sample time', 5, 0, 10, 1, 'min'),
      select('pump', 'Vacuum pump state', 'isolated', {
        isolated: 'Isolated for the observation',
        running: 'Running',
      }),
      select('handlingPlan', 'Refrigerant handling method on the work card', 'pump-down', {
        'pump-down': 'Equipment-specific pump-down within the appliance',
        'external-recovery': 'Recovery into a suitable external container',
      }),
      select('pumpDownSuitability', 'Pump-down suitability in the case', 'unverified', {
        unverified: 'Manufacturer method and containment suitability unverified',
        verified: 'Manufacturer method and containment suitability verified',
        unsuitable: 'Pump-down unsuitable for this appliance or job',
      }),
      select('containment', 'Refrigerant containment verification', 'unverified', {
        unverified: 'Not verified for opening the intended section',
        verified: 'Required verification recorded by qualified supervisor in case',
      }),
    ],
    [
      stage(
        'pressure',
        'Read a changing pressure',
        'Select Pressure-test trend, Known training leak and 5 minutes. Inspect the values.',
        [at('measurement', 'pressure'), at('specimen', 'leak'), at('elapsed', 5)],
        [
          choice(
            'a',
            'The pressure is unchanged',
            false,
            'The model shows a decline from the starting pressure.',
          ),
          choice(
            'b',
            'Investigate the pressure loss and test setup using the approved method',
            true,
            'This fixed-temperature case loses pressure. Field interpretation also needs temperature, setup and equipment context.',
          ),
          choice(
            'c',
            'Use oxygen to accelerate the next test',
            false,
            'Do not improvise a test gas or procedure.',
            true,
          ),
        ],
      ),
      stage(
        'vacuum',
        'Change to a vacuum observation',
        'Select Isolated vacuum trend with the training leak, 5 minutes and the pump Isolated. Compare the initial, previous-minute and selected-time samples.',
        [
          at('measurement', 'vacuum'),
          at('specimen', 'leak'),
          at('elapsed', 5),
          at('pump', 'isolated'),
        ],
        [
          choice(
            'a',
            'The rise requires investigating leaks or the setup before acceptance',
            true,
            'A rising isolated reading is not a stable acceptance result; use the equipment procedure to isolate the cause.',
          ),
          choice(
            'b',
            'The low starting value proves the system is ready',
            false,
            'The trend after isolation matters, not only the initial number.',
          ),
          choice(
            'c',
            'Report the pump running as an isolated decay test',
            false,
            'Pump-on and isolated observations represent different conditions.',
          ),
        ],
      ),
      stage(
        'outgassing',
        'Compare a different set of samples',
        'Keep vacuum mode and the pump Isolated; select Teaching outgassing sample series at 10 minutes. Compare the selected-time sample with the previous-minute sample and their difference.',
        [
          at('measurement', 'vacuum'),
          at('specimen', 'moisture'),
          at('elapsed', 10),
          at('pump', 'isolated'),
        ],
        [
          choice(
            'a',
            'Every rise has exactly one possible cause',
            false,
            'Moisture, outgassing, setup leakage and appliance leakage can affect field readings.',
          ),
          choice(
            'b',
            'Automatically approve the equipment because this sample changed less',
            false,
            'The appropriate manufacturer criteria still need to be checked.',
          ),
          choice(
            'c',
            'Record the different samples and investigate under the actual criteria',
            true,
            'The displayed samples develop comparison skill. A smaller last-interval change does not by itself prove the cause or satisfy an equipment acceptance criterion.',
          ),
        ],
      ),
      stage(
        'stable',
        'Document the comparison',
        'Select Stable comparison specimen, vacuum mode, 10 minutes and the pump Isolated. Inspect the new reading.',
        [
          at('measurement', 'vacuum'),
          at('specimen', 'sealed'),
          at('elapsed', 10),
          at('pump', 'isolated'),
        ],
        [
          choice(
            'a',
            'Record the stable modeled trend and compare real readings with the specified procedure',
            true,
            'Document instrument, location, duration and conditions. No physical test has been completed here.',
          ),
          choice(
            'b',
            'Use 400 microns and 10 minutes for every appliance',
            false,
            'Those are teaching inputs, not a universal evacuation specification.',
          ),
          choice(
            'c',
            'Certify that the learner has pressure-tested equipment',
            false,
            'An interactive trend is not an instructor-observed physical task.',
          ),
        ],
      ),
      stage(
        'pump-down-scope',
        'Distinguish pump-down from external recovery',
        'Select Equipment-specific pump-down and verify manufacturer method/suitability in the fictional case. Inspect the handling-method card. What is the intended boundary?',
        [at('handlingPlan', 'pump-down'), at('pumpDownSuitability', 'verified')],
        [
          choice(
            'a',
            'Every pump-down removes refrigerant into an external recovery cylinder',
            false,
            'External recovery and internal pump-down containment are different processes.',
          ),
          choice(
            'b',
            'The supported pump-down moves refrigerant into the manufacturer-designated part of this appliance',
            true,
            'Suitability and permitted containment are appliance-specific. This is not evidence that all refrigerant has been recovered externally.',
          ),
          choice(
            'c',
            'Pump-down is interchangeable with deep evacuation using a vacuum pump',
            false,
            'These are different operations with different equipment and verification requirements.',
          ),
        ],
      ),
      stage(
        'pump-down-suitability',
        'Stop an unsupported pump-down plan',
        'Keep Pump-down selected and change suitability to Unsuitable for this appliance or job. Inspect the stop indication.',
        [at('handlingPlan', 'pump-down'), at('pumpDownSuitability', 'unsuitable')],
        [
          choice(
            'a',
            'Stop that method and obtain a supported refrigerant-management plan',
            true,
            'Do not force pump-down where the appliance, charge containment or work scope does not support it.',
          ),
          choice(
            'b',
            'Run the compressor until an arbitrary pressure is reached',
            false,
            'A guessed endpoint does not establish suitability and can create dangerous operating conditions.',
            true,
          ),
          choice(
            'c',
            'Reuse the valve sequence from a different equipment model',
            false,
            'The control sequence and limitations must come from the exact approved method.',
            true,
          ),
        ],
      ),
      stage(
        'pump-down-alternative',
        'Select the external recovery alternative',
        'Select Recovery into an external container, keep pump-down Unsuitable, and leave containment Not verified. Inspect the changed work card.',
        [
          at('handlingPlan', 'external-recovery'),
          at('pumpDownSuitability', 'unsuitable'),
          at('containment', 'unverified'),
        ],
        [
          choice(
            'a',
            'A method selection proves physical recovery has happened',
            false,
            'This is a work-plan decision; no refrigerant has been moved by the simulator.',
          ),
          choice(
            'b',
            'Open the intended section now because the plan has a name',
            false,
            'The required actual recovery and verification have not been documented.',
            true,
          ),
          choice(
            'c',
            'Arrange compatible recovery equipment and the applicable qualified recovery/verification process',
            true,
            'Use the supported alternative and retain the actual handling record before the next physical task.',
          ),
        ],
      ),
      stage(
        'pump-down-containment',
        'Verify before opening a section',
        'Return to Pump-down with suitability Verified but containment Not verified for opening the intended section. Inspect the remaining barrier.',
        [
          at('handlingPlan', 'pump-down'),
          at('pumpDownSuitability', 'verified'),
          at('containment', 'unverified'),
        ],
        [
          choice(
            'a',
            'Keep the physical work stopped until the exact procedure and containment verification are complete',
            true,
            'A suitable plan alone does not prove safe containment or isolation. Qualified verification is a separate requirement.',
          ),
          choice(
            'b',
            'Remove piping while the compressor continues running',
            false,
            'Do not open an unverified circuit or improvise a running-compressor procedure.',
            true,
          ),
          choice(
            'c',
            'Award the physical pump-down skill from this simulation',
            false,
            'Observed physical performance and sign-off remain separate from this decision exercise.',
          ),
        ],
      ),
    ],
    [sources.vacuum, sources.service, sources.pumpDown],
  ),

  simulation(
    10,
    'Model air ingress on a low-pressure system',
    'Use absolute pressure and leakage to predict flow direction.',
    'A simplified vessel is surrounded by air at 14.7 psia. Compare its internal pressure with that outside value. This model does not prescribe pressurization, heating, purging or recovery settings.',
    'vacuum',
    [
      range('internalPressure', 'Internal absolute pressure', 5, 2, 18, 1, 'psia'),
      select('seal', 'Vessel boundary', 'leak', {
        leak: 'Leak path present',
        sealed: 'Leak path closed in the model',
      }),
      select('purge', 'Purge activity shown on work card', 'off', {
        off: 'Not observed',
        active: 'Repeated activity observed',
      }),
    ],
    [
      stage(
        'direction',
        'Compare inside and outside',
        'Use 5 psia inside with a leak path present. Inspect the pressure difference and predicted direction.',
        [at('internalPressure', 5), at('seal', 'leak')],
        [
          choice(
            'a',
            'Only refrigerant can move outward through this path',
            false,
            'The modeled outside pressure is higher than the inside pressure.',
          ),
          choice(
            'b',
            'Air tends to enter through the leak path',
            true,
            'The pressure difference supports inward flow in this low-pressure case.',
          ),
          choice(
            'c',
            'Absolute pressure cannot be compared',
            false,
            'Both values use the same absolute-pressure reference.',
          ),
        ],
      ),
      stage(
        'purge',
        'Interpret repeated purge activity',
        'Keep the 5 psia leaking vessel and select Repeated activity observed. Inspect the work card.',
        [at('internalPressure', 5), at('seal', 'leak'), at('purge', 'active')],
        [
          choice(
            'a',
            'Investigate the air-ingress source instead of treating purge activity as a repair',
            true,
            'Removing noncondensables does not by itself repair the path admitting them.',
          ),
          choice(
            'b',
            'The purge system has permanently sealed the leak',
            false,
            'The simulated leak path remains open.',
          ),
          choice(
            'c',
            'Raise the actual vessel to the slider value without instructions',
            false,
            'The slider is a model variable, not a field pressure command.',
            true,
          ),
        ],
      ),
      stage(
        'boundary',
        'Remove the modeled path',
        'Close the leak path in the model while keeping 5 psia inside. Inspect the predicted ingress.',
        [at('internalPressure', 5), at('seal', 'sealed')],
        [
          choice(
            'a',
            'The pressure difference alone forces air through a perfect boundary',
            false,
            'This model needs a flow path as well as a pressure difference.',
          ),
          choice(
            'b',
            'This proves all field leak checks are complete',
            false,
            'Changing a virtual boundary is not a real leak test.',
          ),
          choice(
            'c',
            'Modeled ingress stops; actual repair and verification remain physical work',
            true,
            'The comparison explains why locating and verifying the leak matters.',
          ),
        ],
      ),
    ],
    [sources.topics, sources.service],
  ),

  simulation(
    11,
    'Route the EPA equipment cases',
    'Choose the equipment-specific certification category using supplied case facts.',
    'Three fictional service cards identify their appliance categories explicitly. Match the category to the relevant EPA examination preparation path; this exercise is not the certifying exam.',
    'workflow',
    [
      select('appliance', 'Service card', 'small', {
        small: 'Defined small appliance',
        high: 'High-pressure stationary appliance, not a small appliance',
        low: 'Low-pressure stationary appliance',
      }),
      select('record', 'Evidence being reviewed', 'practice', {
        practice: 'Internal practice result',
        official: 'Separate verified external exam result',
      }),
    ],
    [
      stage(
        'small',
        'Route the first service card',
        'Select the Defined small appliance card and inspect the category label.',
        [at('appliance', 'small')],
        [
          choice('a', 'Type II preparation', false, 'This card is expressly a small appliance.'),
          choice(
            'b',
            'Type I preparation',
            true,
            'Type I corresponds to the supplied small-appliance case.',
          ),
          choice('c', 'Type III preparation', false, 'The card is not a low-pressure appliance.'),
        ],
      ),
      stage(
        'high',
        'Route the second service card',
        'Select the High-pressure stationary appliance card and inspect it.',
        [at('appliance', 'high')],
        [
          choice(
            'a',
            'Type II preparation',
            true,
            'Type II corresponds to this high-pressure stationary appliance case.',
          ),
          choice(
            'b',
            'Type I because it has a compressor',
            false,
            'A compressor does not establish the small-appliance definition.',
          ),
          choice(
            'c',
            'Type III because the suction reading may be lower',
            false,
            'A single operating reading does not replace the appliance category.',
          ),
        ],
      ),
      stage(
        'low',
        'Route the third service card',
        'Select Low-pressure stationary appliance and keep the evidence Internal practice result. Inspect both labels.',
        [at('appliance', 'low'), at('record', 'practice')],
        [
          choice(
            'a',
            'Type I and certification already issued',
            false,
            'Both the equipment category and credential claim are unsupported.',
          ),
          choice(
            'b',
            'Type II and no further assessment needed',
            false,
            'This card is the low-pressure category and the record is practice only.',
          ),
          choice(
            'c',
            'Type III preparation; certification needs the separate verified exam',
            true,
            'Use the existing practice tests to prepare and retain the distinction from the actual credential.',
          ),
        ],
      ),
    ],
    [sources.certification],
  ),

  simulation(
    12,
    'Collect evidence before changing charge',
    'Combine instrument choice, airflow observations and leak evidence.',
    'A fictional cooling complaint has three selectable instructor cases. Displayed temperatures and detector indications are teaching values; they do not substitute for an actual refrigerant chart or charging procedure.',
    'manifold',
    [
      select('case', 'Instructor case', 'airflow', {
        airflow: 'Restricted indoor airflow',
        leak: 'Suspected refrigerant leak',
        comparison: 'Comparison readings',
      }),
      select('tool', 'Virtual instrument', 'temperature', {
        temperature: 'Temperature and airflow observations',
        manifold: 'Paired saturation/line-temperature display',
        detector: 'Compatible leak detector',
      }),
      select('detectorLocation', 'Detector observation location', 'background', {
        background: 'Room background',
        fitting: 'Suspected fitting',
      }),
    ],
    [
      stage(
        'airflow',
        'Begin with the observed complaint',
        'Select Restricted indoor airflow and Temperature and airflow observations. Inspect the evidence.',
        [at('case', 'airflow'), at('tool', 'temperature')],
        [
          choice(
            'a',
            'Add refrigerant because the room is warm',
            false,
            'A comfort complaint and restricted airflow do not establish a charge shortage.',
          ),
          choice(
            'b',
            'Investigate the airflow restriction before drawing a charging conclusion',
            true,
            'The visible evidence points to an airflow issue that can also affect refrigerant-side readings.',
          ),
          choice(
            'c',
            'Ignore airflow whenever a manifold is available',
            false,
            'A refrigerant instrument does not eliminate the need for airside evidence.',
          ),
        ],
      ),
      stage(
        'detector',
        'Localize the leak indication',
        'Select Suspected refrigerant leak, Compatible leak detector and Suspected fitting. Inspect the changed indication.',
        [at('case', 'leak'), at('tool', 'detector'), at('detectorLocation', 'fitting')],
        [
          choice(
            'a',
            'Document and confirm the indication under the approved detection/repair process',
            true,
            'A localized indication guides verification. It does not authorize guessing a final charge amount.',
          ),
          choice(
            'b',
            'Replace all components immediately',
            false,
            'The observation should support a focused, confirmed finding.',
          ),
          choice(
            'c',
            'Vent the remaining refrigerant to make a repair faster',
            false,
            'The service plan must use the applicable refrigerant handling procedure.',
            true,
          ),
        ],
      ),
      stage(
        'compare',
        'Read the comparison instrument',
        'Select Comparison readings and the Paired saturation/line-temperature display. Inspect superheat and subcooling.',
        [at('case', 'comparison'), at('tool', 'manifold')],
        [
          choice(
            'a',
            'These model readings are universal charge targets',
            false,
            'They are example observations; no equipment-specific target is supplied.',
          ),
          choice(
            'b',
            'A normal-looking number proves the leak was repaired',
            false,
            'A repair requires its own specified verification.',
          ),
          choice(
            'c',
            'Record the values and compare them with the actual equipment method and conditions',
            true,
            'Use the identified equipment, refrigerant and conditions to interpret measurements.',
          ),
        ],
      ),
    ],
    [sources.temperatures, sources.vacuum, sources.service],
  ),

  simulation(
    13,
    'Plan airflow and a supervised line-set task',
    'Compare modeled airflow loss and complete a simulated brazing preparation, process, inspection and verification sequence.',
    'The airflow example applies an explicitly idealized percentage loss to a normalized blower input: delivery = input × (1 − loss/100). It is not a physical blockage percentage or a fan curve. The fictional brazing job card lets you compare preparation, process-control and joint-verification states without operating a torch or specifying field settings.',
    'airflow',
    [
      range('blower', 'Blower teaching input', 80, 40, 100, 10, '%'),
      range('restriction', 'Modeled airflow loss', 60, 0, 100, 10, '% of input'),
      select('hotwork', 'Hot-work area in the job card', 'uncontrolled', {
        uncontrolled: 'Combustible hazards uncontrolled',
        protected: 'Required fire protections verified',
      }),
      select('preparation', 'Line-set preparation record', 'pending', {
        pending: 'Preparation and supervisor pending',
        ready: 'Preparation and supervisor confirmed',
      }),
      select('jointPreparation', 'Joint preparation and fit', 'pending', {
        pending: 'Cleaning, fit, material and isolation checks incomplete',
        ready: 'Required cleaning, fit, material and isolation checks verified',
      }),
      select('processPlan', 'Brazing process controls', 'missing', {
        missing: 'Purge/oxidation control, heat protection or procedure missing',
        verified: 'Specified purge, heat protection and brazing procedure verified',
      }),
      select('jointInspection', 'Post-cooling visual joint inspection', 'pending', {
        pending: 'Not inspected',
        defect: 'Visible workmanship concern identified',
        acceptable: 'No visual concern in the teaching specimen',
      }),
      select('leakVerification', 'Specified post-joint leak verification', 'pending', {
        pending: 'Not performed in the case',
        failed: 'Leak indication recorded',
        passed: 'Required test and acceptance evidence recorded in case',
      }),
    ],
    [
      stage(
        'restricted',
        'Measure the restricted model',
        'Set blower input to 80% and modeled airflow loss to 60% of that input. Inspect the 32% reference delivery.',
        [at('blower', 80), at('restriction', 60)],
        [
          choice(
            'a',
            'The lower airflow proves a refrigerant leak',
            false,
            'The modeled change is in the air path.',
          ),
          choice(
            'b',
            'The chosen 60% loss leaves 40% of the 80% input: 32% reference delivery',
            true,
            'This explicit teaching relationship shows a loss calculation. Real restriction, static pressure and fan performance require equipment data.',
          ),
          choice(
            'c',
            'Every building needs this blower setting',
            false,
            'The percentage is a normalized teaching control, not a sizing recommendation.',
          ),
        ],
      ),
      stage(
        'comparison',
        'Compare with a clear path',
        'Keep the blower input at 80% and reduce modeled airflow loss to 0%. Inspect the changed delivery.',
        [at('blower', 80), at('restriction', 0)],
        [
          choice(
            'a',
            'The delivery improves in this comparison; actual design and startup data still govern',
            true,
            'Changing one modeled variable makes the cause and effect visible.',
          ),
          choice(
            'b',
            'The online result completes a duct installation',
            false,
            'Physical installation and startup must be observed and documented separately.',
          ),
          choice(
            'c',
            'The building load has been calculated',
            false,
            'This model has no building load calculation.',
          ),
        ],
      ),
      stage(
        'hotwork',
        'Stop an unprepared hot-work task',
        'Select Combustible hazards uncontrolled. Inspect the line-set work status.',
        [at('hotwork', 'uncontrolled')],
        [
          choice(
            'a',
            'Begin brazing and ask for protection later',
            false,
            'Resolve fire hazards before the supervised task begins.',
            true,
          ),
          choice(
            'b',
            'Use a small flame so hazards no longer matter',
            false,
            'Reducing flame size is not a substitute for the required protections.',
            true,
          ),
          choice(
            'c',
            'Stop the task and establish the required fire precautions',
            true,
            'Plan protection, appropriate equipment and any required fire-watch arrangement before hot work.',
          ),
        ],
      ),
      stage(
        'joint-preparation',
        'Prepare the simulated joint',
        'Set fire protections Verified, preparation/supervisor Confirmed, and joint cleaning, fit, material and isolation checks Verified. Inspect the joint-preparation card.',
        [at('hotwork', 'protected'), at('preparation', 'ready'), at('jointPreparation', 'ready')],
        [
          choice(
            'a',
            'Advance to the specified process-control review after verifying preparation',
            true,
            'Correct material, fit and preparation are prerequisites. The next stage checks the procedure and protective controls; it does not start a real torch.',
          ),
          choice(
            'b',
            'Mark the physical joint accepted without inspecting it',
            false,
            'Joint workmanship and system checks require actual evidence.',
          ),
          choice(
            'c',
            'Skip equipment instructions because the simulated card is green',
            false,
            'The real task remains governed by its equipment and safety instructions.',
            true,
          ),
        ],
      ),
      stage(
        'brazing-process',
        'Control the simulated brazing process',
        'Keep preparation and fire protections ready. Set specified purge, component heat protection and brazing procedure to Verified, then inspect the process card.',
        [
          at('hotwork', 'protected'),
          at('preparation', 'ready'),
          at('jointPreparation', 'ready'),
          at('processPlan', 'verified'),
        ],
        [
          choice(
            'a',
            'Use an arbitrary torch setting because all joint materials respond identically',
            false,
            'Material, filler, component limits and the specified procedure govern the actual process.',
            true,
          ),
          choice(
            'b',
            'Follow the approved process while maintaining its oxidation control, heat protection and supervision',
            true,
            'The model records process readiness. It supplies no universal purge flow, flame setting, heating time or joint temperature.',
          ),
          choice(
            'c',
            'Stop protective measures immediately when the filler first appears to flow',
            false,
            'Follow the full prescribed process, including its cooling and protection requirements; do not improvise an early stop.',
          ),
        ],
      ),
      stage(
        'joint-inspection',
        'Reject a visible workmanship concern',
        'Select Visible workmanship concern identified in the post-cooling joint inspection. Inspect the acceptance indication.',
        [
          at('jointPreparation', 'ready'),
          at('processPlan', 'verified'),
          at('jointInspection', 'defect'),
        ],
        [
          choice(
            'a',
            'Hold acceptance and arrange the instructor-approved correction and repeat inspection',
            true,
            'A visible concern needs qualified evaluation. Do not hide it or represent the joint as accepted.',
          ),
          choice(
            'b',
            'Cover the joint so the concern is no longer visible',
            false,
            'Concealing a defect is not a repair.',
          ),
          choice(
            'c',
            'Skip inspection because process controls were checked earlier',
            false,
            'A correct plan does not prove the completed joint has acceptable workmanship.',
          ),
        ],
      ),
      stage(
        'joint-verification',
        'Separate appearance from leak verification',
        'Select No visual concern, then set post-joint leak verification to Leak indication recorded. Inspect the conflicting evidence.',
        [at('jointInspection', 'acceptable'), at('leakVerification', 'failed')],
        [
          choice(
            'a',
            'Approve the joint because it looks smooth',
            false,
            'An acceptable appearance does not override a failed verification result.',
          ),
          choice(
            'b',
            'Increase the real test pressure beyond component limits',
            false,
            'Never invent or exceed the actual approved test conditions.',
            true,
          ),
          choice(
            'c',
            'Reject acceptance, correct under the qualified process and repeat the specified verification',
            true,
            'Document the failed result and correction. Visual inspection and leak verification provide different evidence.',
          ),
        ],
      ),
      stage(
        'handoff',
        'Complete the simulated joint record',
        'Keep the preparation, process and fire controls verified. Select No visual concern and Required test and acceptance evidence recorded. Inspect the final job card.',
        [
          at('hotwork', 'protected'),
          at('preparation', 'ready'),
          at('jointPreparation', 'ready'),
          at('processPlan', 'verified'),
          at('jointInspection', 'acceptable'),
          at('leakVerification', 'passed'),
        ],
        [
          choice(
            'a',
            'Record the completed simulation sequence and retain actual physical brazing/sign-off as a separate requirement',
            true,
            'The full virtual sequence now has preparation, process, inspection and verification evidence. No real joint was made or certified.',
          ),
          choice(
            'b',
            'Issue an instructor physical-skill sign-off automatically',
            false,
            'Only the actual observed performance can support that sign-off.',
          ),
          choice(
            'c',
            'Reuse this model as the pressure or heating specification for any equipment',
            false,
            'The activity supplies no field settings; the exact equipment and approved task procedure remain authoritative.',
          ),
        ],
      ),
    ],
    [sources.hotwork, sources.energy, sources.brazing, sources.purge],
  ),

  simulation(
    14,
    'Work a changing cooling complaint',
    'Test one diagnostic explanation at a time and report uncertainty honestly.',
    'A fictional customer reports weak cooling. Switch the instructor-set airside faults, compare the observed consequences and decide what the available evidence supports.',
    'airflow',
    [
      select('filter', 'Indoor air path', 'blocked', {
        blocked: 'Filter obstructed',
        clear: 'Filter clear',
      }),
      select('condenser', 'Outdoor heat-rejection path', 'clear', {
        blocked: 'Outdoor coil obstructed',
        clear: 'Outdoor coil clear',
      }),
      select('request', 'Cooling request', 'on', {
        on: 'Cooling requested',
        off: 'No cooling request',
      }),
      select('chargeEvidence', 'Equipment-specific charge evidence', 'unknown', {
        unknown: 'Not collected',
        collected: 'Measurements collected for qualified review',
      }),
    ],
    [
      stage(
        'indoor',
        'Start with direct evidence',
        'Use an obstructed filter, clear outdoor coil and a cooling request. Inspect the comparison readings.',
        [at('filter', 'blocked'), at('condenser', 'clear'), at('request', 'on')],
        [
          choice(
            'a',
            'Replace the compressor before checking the filter',
            false,
            'Start with the supported observation rather than an expensive unsupported diagnosis.',
          ),
          choice(
            'b',
            'Investigate the observed indoor airflow restriction',
            true,
            'The modeled evidence identifies an airside restriction; document it and follow the authorized inspection plan.',
          ),
          choice(
            'c',
            'Promise a refrigerant refill will fix the complaint',
            false,
            'No charge evidence has been collected.',
          ),
        ],
      ),
      stage(
        'outdoor',
        'Recognize a different cause',
        'Set the filter Clear and the outdoor coil Obstructed, leaving the cooling request on. Inspect the changed result.',
        [at('filter', 'clear'), at('condenser', 'blocked'), at('request', 'on')],
        [
          choice(
            'a',
            'Investigate the outdoor heat-rejection restriction',
            true,
            'The case changed. Reassess the evidence instead of repeating the first diagnosis.',
          ),
          choice(
            'b',
            'The first filter diagnosis must still explain everything',
            false,
            'A good diagnostic process updates when observations change.',
          ),
          choice(
            'c',
            'Disable a protective control to keep cooling',
            false,
            'Do not bypass a protective control to force continued operation.',
            true,
          ),
        ],
      ),
      stage(
        'uncertainty',
        'Decide what is still unknown',
        'Set both air paths Clear while charge evidence remains Not collected. Inspect the work card.',
        [at('filter', 'clear'), at('condenser', 'clear'), at('chargeEvidence', 'unknown')],
        [
          choice(
            'a',
            'Claim the charge is correct without measurements',
            false,
            'Clearing two airside observations does not measure charge.',
          ),
          choice(
            'b',
            'Claim an unverified leak as the final cause',
            false,
            'The model has supplied no verified leak evidence.',
          ),
          choice(
            'c',
            'Explain the findings and obtain the next authorized measurements',
            true,
            'Separate what you observed from what still needs testing and customer authorization.',
          ),
        ],
      ),
    ],
    [sources.topics, sources.temperatures],
  ),

  simulation(
    15,
    'Make the construction area ready',
    'Recognize a defective ladder, unverified energy and an obstructed path.',
    'Inspect a fictional job-site board before the instructor starts a training task. Changing a status updates the model only; it does not inspect or isolate real equipment.',
    'safety',
    [
      select('ladder', 'Ladder condition', 'damaged', {
        damaged: 'Damaged rung identified',
        inspected: 'Suitable inspected ladder supplied',
      }),
      select('energy', 'Hazardous-energy status', 'unverified', {
        unverified: 'Not verified',
        isolated: 'Qualified procedure and verification recorded',
      }),
      select('walkway', 'Access path', 'obstructed', {
        obstructed: 'Loose materials obstruct the path',
        clear: 'Access path cleared in the case',
      }),
    ],
    [
      stage(
        'ladder',
        'Respond to a damaged rung',
        'Select Damaged rung identified and inspect the hazard board.',
        [at('ladder', 'damaged')],
        [
          choice(
            'a',
            'Use the ladder if the task is short',
            false,
            'Task duration does not repair a structural defect.',
            true,
          ),
          choice(
            'b',
            'Identify and withdraw the defective ladder from service',
            true,
            'Use the actual workplace process to remove the unsafe ladder and obtain suitable equipment.',
          ),
          choice(
            'c',
            'Hide the defect from the next worker',
            false,
            'The defect must remain visible and be acted on, not concealed.',
            true,
          ),
        ],
      ),
      stage(
        'energy',
        'Check energy before access',
        'Select a suitable inspected ladder, but leave energy Not verified. Inspect the next barrier.',
        [at('ladder', 'inspected'), at('energy', 'unverified')],
        [
          choice(
            'a',
            'Require the actual qualified energy-control and verification procedure',
            true,
            'Correcting one hazard does not resolve the separate energy hazard.',
          ),
          choice(
            'b',
            'Treat an off thermostat as sufficient',
            false,
            'An operating control is not the required verification of deenergization.',
            true,
          ),
          choice(
            'c',
            'Assume another worker already checked',
            false,
            'The work record must establish the applicable verification.',
          ),
        ],
      ),
      stage(
        'access',
        'Clear the final access problem',
        'Record qualified energy verification and a Clear access path, with the inspected ladder still selected. Inspect the board.',
        [at('ladder', 'inspected'), at('energy', 'isolated'), at('walkway', 'clear')],
        [
          choice(
            'a',
            'This activity issues an OSHA card',
            false,
            'This internal scenario does not issue an external OSHA training card.',
          ),
          choice(
            'b',
            'No further workplace-specific safety assessment is needed',
            false,
            'The board covers selected hazards, not every possible job condition.',
          ),
          choice(
            'c',
            'Take the prepared plan to the supervisor for the actual task assessment',
            true,
            'The model is ready for discussion; the real site and assigned task still require their own checks.',
          ),
        ],
      ),
    ],
    [sources.ladders, sources.electrical],
  ),

  simulation(
    16,
    'Coordinate the emergency response',
    'Choose scene safety, emergency activation and a trained response handoff.',
    'In this fictional exercise, a coworker is unresponsive and is not breathing normally. An electrical hazard is initially present. The controls do not contact emergency services or activate an AED. For an actual emergency, call emergency services immediately.',
    'safety',
    [
      select('scene', 'Scene safety in the exercise', 'unsafe', {
        unsafe: 'Electrical hazard still present',
        safe: 'Scene confirmed safe by the qualified responder',
      }),
      select('help', 'Emergency call status in the exercise', 'pending', {
        pending: 'Not activated',
        called: 'Emergency services activated; dispatcher responding',
      }),
      select('aed', 'AED response in the exercise', 'requested', {
        requested: 'AED requested from a named responder',
        available: 'AED available with responder',
      }),
    ],
    [
      stage(
        'scene',
        'Avoid becoming another casualty',
        'Inspect the board with the electrical hazard Still present. What is the immediate safe decision?',
        [at('scene', 'unsafe')],
        [
          choice(
            'a',
            'Touch the person before the electrical danger is controlled',
            false,
            'Do not enter an unsafe electrical scene or touch a person exposed to that hazard.',
            true,
          ),
          choice(
            'b',
            'Keep clear of the hazard and activate the emergency response',
            true,
            'Scene safety and urgent emergency activation come first; obtain qualified help to control the hazard.',
          ),
          choice(
            'c',
            'Wait until the end of the shift to tell someone',
            false,
            'The exercise describes a life-threatening emergency requiring immediate response.',
            true,
          ),
        ],
      ),
      stage(
        'activate',
        'Direct a specific response',
        'Set the scene Confirmed safe, leaving emergency services Not activated. Inspect the response board.',
        [at('scene', 'safe'), at('help', 'pending')],
        [
          choice(
            'a',
            'Direct a responder to call emergency services and obtain an AED now',
            true,
            'Use a clear assignment and confirm the action; follow the dispatcher and the responder training.',
          ),
          choice(
            'b',
            'Spend several minutes completing a course form first',
            false,
            'Documentation must not delay the emergency response.',
            true,
          ),
          choice(
            'c',
            'Assume someone else must have called',
            false,
            'Confirm that emergency services have actually been activated.',
          ),
        ],
      ),
      stage(
        'handoff',
        'Use the available trained support',
        'Set emergency services Activated and AED Available, with the scene Safe. Inspect the response status.',
        [at('scene', 'safe'), at('help', 'called'), at('aed', 'available')],
        [
          choice(
            'a',
            'Treat this simulation as CPR certification',
            false,
            'This scenario is not a CPR skills assessment or credential.',
          ),
          choice(
            'b',
            'Delay assistance until the online simulation is finished',
            false,
            'A real response must never wait for an online activity.',
            true,
          ),
          choice(
            'c',
            'Follow dispatcher/AED instructions and provide care appropriate to training',
            true,
            'This activity rehearses coordination. Learn and demonstrate physical CPR/AED skills through the approved training process.',
          ),
        ],
      ),
    ],
    [sources.emergency],
  ),

  simulation(
    17,
    'Deliver an evidence-based customer handoff',
    'Explain findings, obtain authorization and report completion status accurately.',
    'A fictional service report has an initial complaint, a proposed repair and training records. Change the evidence statuses and choose the statement the customer can rely on.',
    'workflow',
    [
      select('diagnosis', 'Diagnostic evidence', 'unsupported', {
        unsupported: 'Possible cause; tests still pending',
        supported: 'Findings supported by recorded tests',
      }),
      select('approval', 'Customer repair authorization', 'pending', {
        pending: 'Not yet authorized',
        approved: 'Authorized scope recorded',
      }),
      select('credential', 'External credential evidence', 'unverified', {
        unverified: 'Not verified in the record',
        verified: 'Issuing-organization evidence verified',
      }),
    ],
    [
      stage(
        'findings',
        'Describe what is known',
        'Inspect the report while diagnostic tests are Still pending. Which wording fits the evidence?',
        [at('diagnosis', 'unsupported')],
        [
          choice(
            'a',
            'The compressor is definitely defective',
            false,
            'The case does not support a definite component diagnosis.',
          ),
          choice(
            'b',
            'Here is the observed symptom and the next test needed to evaluate the possible cause',
            true,
            'Give the customer a supported observation and the reason for the next step.',
          ),
          choice(
            'c',
            'The most expensive repair is guaranteed to solve it',
            false,
            'Cost and certainty are not diagnostic evidence.',
          ),
        ],
      ),
      stage(
        'authorization',
        'Agree on the repair scope',
        'Set findings Supported by tests while customer authorization remains Not yet authorized. Inspect the work order.',
        [at('diagnosis', 'supported'), at('approval', 'pending')],
        [
          choice(
            'a',
            'Explain the supported findings, proposed scope and price, then obtain authorization',
            true,
            'A clear work order records the agreed next step before work outside the existing authorization.',
          ),
          choice(
            'b',
            'Treat a simulation button as the real customer signature',
            false,
            'No real customer has authorized work through this training exercise.',
          ),
          choice(
            'c',
            'Perform unrelated repairs without documenting them',
            false,
            'Stay within the agreed scope and keep an accurate record.',
          ),
        ],
      ),
      stage(
        'record',
        'Separate training from the external credential',
        'Set the repair scope Authorized but keep the external credential Not verified. Inspect the two separate statuses.',
        [at('approval', 'approved'), at('credential', 'unverified')],
        [
          choice(
            'a',
            'The customer authorization proves EPA certification',
            false,
            'A repair authorization and an external credential are different records.',
          ),
          choice(
            'b',
            'A completed simulation proves every physical skill',
            false,
            'A virtual practice result does not establish observed physical performance.',
          ),
          choice(
            'c',
            'Report the documented work status and keep credential verification pending',
            true,
            'Accurate handoff preserves the distinction between work evidence, training and independently issued credentials.',
          ),
        ],
      ),
    ],
    [sources.certification],
  ),
];

export function getHvacSimulationDefinition(
  lessonId: string,
): HvacSimulationDefinition | undefined {
  return HVAC_SIMULATION_DEFINITIONS.find((definition) => definition.lessonId === lessonId);
}

/** Exact topic coverage for the supplied outline; these links award no hours. */
export const HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE = {
  interplay_online: {
    delivery: 'external_provider',
    stages: [],
    note: 'Interplay online remains separate provider training; this course does not award its completion or time.',
  },
  split_system: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 2, stageId: 'indoor' },
      { chapter: 2, stageId: 'outdoor' },
      { chapter: 14, stageId: 'uncertainty' },
    ],
  },
  gas_furnace: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 4, stageId: 'airflow' },
      { chapter: 4, stageId: 'flame' },
      { chapter: 4, stageId: 'permitted' },
    ],
  },
  pressure_test: { delivery: 'native_simulation', stages: [{ chapter: 9, stageId: 'pressure' }] },
  vacuum: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 9, stageId: 'vacuum' },
      { chapter: 9, stageId: 'outgassing' },
      { chapter: 9, stageId: 'stable' },
    ],
  },
  digital_manifold: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 5, stageId: 'superheat' },
      { chapter: 5, stageId: 'subcooling' },
      { chapter: 5, stageId: 'phase-check' },
    ],
  },
  recovery_cylinders: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 7, stageId: 'limit' },
      { chapter: 7, stageId: 'headroom' },
      { chapter: 7, stageId: 'contents' },
    ],
  },
  multimeter: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 3, stageId: 'open' },
      { chapter: 3, stageId: 'closed' },
      { chapter: 3, stageId: 'resistance' },
    ],
  },
  clamp_meter: { delivery: 'native_simulation', stages: [{ chapter: 3, stageId: 'clamp' }] },
  leak_detector: { delivery: 'native_simulation', stages: [{ chapter: 12, stageId: 'detector' }] },
  pump_down: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 9, stageId: 'pump-down-scope' },
      { chapter: 9, stageId: 'pump-down-suitability' },
      { chapter: 9, stageId: 'pump-down-alternative' },
      { chapter: 9, stageId: 'pump-down-containment' },
    ],
  },
  brazing: {
    delivery: 'native_simulation',
    stages: [
      { chapter: 13, stageId: 'joint-preparation' },
      { chapter: 13, stageId: 'brazing-process' },
      { chapter: 13, stageId: 'joint-inspection' },
      { chapter: 13, stageId: 'joint-verification' },
      { chapter: 13, stageId: 'handoff' },
    ],
  },
} satisfies Record<
  (typeof HVAC_PRACTICAL_SOURCE_ALLOCATION)[number]['topic'],
  {
    delivery: 'native_simulation' | 'external_provider';
    stages: Array<{ chapter: number; stageId: string }>;
    note?: string;
  }
>;

const numeric = (controls: HvacSimulationState['controls'], id: string) => Number(controls[id]);
const reading = (
  id: string,
  label: string,
  value: string | number,
  unit?: string,
  status: HvacSimulationReading['status'] = 'neutral',
): HvacSimulationReading => ({ id, label, value, ...(unit ? { unit } : {}), status });
const rounded = (value: number, digits = 1) => Number(value.toFixed(digits));

/** Synthetic response models, not pressure/temperature tables or field setpoints. */
function modelReadings(
  definition: HvacSimulationDefinition,
  state: HvacSimulationState,
): HvacSimulationReading[] {
  const c = state.controls;
  switch (definition.chapter) {
    case 1:
      return [
        reading(
          'evidence',
          'Practice evidence',
          c.evidence === 'simulation'
            ? 'Simulation only'
            : c.evidence === 'observed'
              ? 'Physical observation record'
              : c.evidence === 'exam'
                ? 'External exam record'
                : 'Theory study',
        ),
        reading(
          'appointment',
          'Supervised appointment',
          c.appointment === 'confirmed' ? 'Confirmed in case' : 'Pending',
          undefined,
          c.appointment === 'confirmed' ? 'normal' : 'warning',
        ),
        reading(
          'credential',
          'Credential verification',
          c.examRecord === 'verified' ? 'Verified in fictional record' : 'Pending',
          undefined,
          c.examRecord === 'verified' ? 'normal' : 'warning',
        ),
      ];
    case 2: {
      const roles: Record<string, string> = {
        compressor: 'Raises vapor pressure',
        metering: 'Reduces pressure across restriction',
        condenser: c.mode === 'cooling' ? 'Rejects heat outdoors' : 'Absorbs heat outdoors',
        evaporator: c.mode === 'cooling' ? 'Absorbs heat indoors' : 'Rejects heat indoors',
      };
      return [
        reading('component', 'Component function in selected mode', roles[String(c.component)]),
        reading('mode', 'Diagram mode', c.mode === 'cooling' ? 'Cooling' : 'Heat-pump heating'),
        reading(
          'authorization',
          'Physical-work boundary',
          c.isolation === 'verified'
            ? 'Qualified verification recorded in case'
            : 'STOP: verification missing',
          undefined,
          c.isolation === 'verified' ? 'normal' : 'danger',
        ),
      ];
    }
    case 3: {
      const closed = c.switch === 'closed';
      const amps = closed ? numeric(c, 'voltage') / numeric(c, 'resistance') : 0;
      const meterValue =
        c.meter === 'current'
          ? c.clamp === 'both'
            ? 0
            : amps
          : c.meter === 'voltage'
            ? closed
              ? numeric(c, 'voltage')
              : 0
            : closed
              ? 'Unsafe mode for energized case'
              : numeric(c, 'resistance');
      const unit =
        c.meter === 'current'
          ? 'A'
          : c.meter === 'voltage'
            ? 'V'
            : typeof meterValue === 'number'
              ? 'Ω'
              : undefined;
      return [
        reading('supply', 'Bench source', numeric(c, 'voltage'), 'V'),
        reading('actual-current', 'Modeled load current', rounded(amps, 2), 'A'),
        reading(
          'meter',
          'Virtual instrument display',
          typeof meterValue === 'number' ? rounded(meterValue, 2) : meterValue,
          unit,
          typeof meterValue === 'string' ? 'danger' : 'normal',
        ),
        reading('path', 'Circuit path', closed ? 'Closed' : 'Open'),
      ];
    }
    case 4: {
      const requested = c.request === 'on';
      const clear = c.vent === 'clear';
      const proven = c.flame === 'proven';
      const result = !requested
        ? 'Idle'
        : !clear
          ? 'Stopped: airflow not proven'
          : !proven
            ? 'Stopped: flame not proven'
            : 'Heating permitted by modeled inputs';
      return [
        reading('heat-request', 'Heat request', requested ? 'Present' : 'Absent'),
        reading(
          'airflow-proof',
          'Modeled airflow proof',
          clear ? 'Present' : 'Missing',
          undefined,
          clear ? 'normal' : 'danger',
        ),
        reading(
          'flame-proof',
          'Flame proof',
          proven ? 'Present' : 'Missing',
          undefined,
          proven ? 'normal' : 'warning',
        ),
        reading(
          'sequence',
          'Controller state',
          result,
          undefined,
          requested && (!clear || !proven) ? 'danger' : 'normal',
        ),
      ];
    }
    case 5: {
      const vaporDifference = superheat(numeric(c, 'suctionLine'), numeric(c, 'suctionSaturation'));
      const liquidDifference = subcooling(
        numeric(c, 'condensingSaturation'),
        numeric(c, 'liquidLine'),
      );
      const requiresVerification = vaporDifference < 0 || liquidDifference < 0;
      return [
        reading(
          'suction-saturation',
          'Suction saturation reference',
          numeric(c, 'suctionSaturation'),
          '°F',
        ),
        reading('suction-temperature', 'Suction-line temperature', numeric(c, 'suctionLine'), '°F'),
        reading(
          'superheat',
          'Superheat',
          vaporDifference,
          '°F',
          vaporDifference < 0 ? 'warning' : 'neutral',
        ),
        reading(
          'liquid-saturation',
          'Liquid-side saturation reference',
          numeric(c, 'condensingSaturation'),
          '°F',
        ),
        reading('liquid-temperature', 'Liquid-line temperature', numeric(c, 'liquidLine'), '°F'),
        reading(
          'subcooling',
          'Subcooling',
          liquidDifference,
          '°F',
          liquidDifference < 0 ? 'warning' : 'neutral',
        ),
        reading(
          'phase-check',
          'Measurement interpretation',
          requiresVerification
            ? 'Negative difference: verify phase, refrigerant reference and measurement location before interpreting these as superheat or subcooling.'
            : 'Nonnegative arithmetic differences; actual phase, measurement validity and equipment targets still require verification.',
          undefined,
          requiresVerification ? 'warning' : 'neutral',
        ),
      ];
    }
    case 6: {
      const ready =
        c.refrigerant !== 'unknown' && c.release === 'contained' && c.handling === 'verified';
      return [
        reading(
          'identity',
          'Identified material',
          c.refrigerant === 'unknown' ? 'Unknown' : c.refrigerant === 'r410a' ? 'R-410A' : 'R-22',
          undefined,
          c.refrigerant === 'unknown' ? 'warning' : 'neutral',
        ),
        reading(
          'path',
          'Requested path',
          c.release === 'atmosphere'
            ? 'REJECT: intentional venting request'
            : 'Contained / recovery planning',
          undefined,
          c.release === 'atmosphere' ? 'danger' : 'normal',
        ),
        reading(
          'readiness',
          'Work order readiness',
          ready ? 'Ready for authorized handoff' : 'Resolve missing/unsafe conditions',
          undefined,
          ready ? 'normal' : 'warning',
        ),
      ];
    }
    case 7: {
      const gross = numeric(c, 'grossMass');
      return [
        reading('gross-mass', 'Gross mass', gross, 'kg'),
        reading('tare-mass', 'Supplied tare', 12, 'kg'),
        reading('material-mass', 'Material mass in case', gross - 12, 'kg'),
        reading(
          'headroom',
          'Headroom to supplied 32 kg limit',
          32 - gross,
          'kg',
          gross >= 32 ? 'danger' : 'normal',
        ),
        reading(
          'contents',
          'Contents handling',
          c.contents === 'mixed' ? 'Segregate / resolve identity' : 'Identified material',
          undefined,
          c.contents === 'mixed' ? 'warning' : 'normal',
        ),
        reading(
          'purchase',
          'Purchaser evidence',
          c.purchaser === 'verified' ? 'Verified in case' : 'Not verified',
          undefined,
          c.purchaser === 'verified' ? 'normal' : 'warning',
        ),
      ];
    }
    case 8: {
      const small = c.assembly === 'factory' && numeric(c, 'charge') <= 5;
      return [
        reading('charge', 'Case charge', numeric(c, 'charge'), 'lb'),
        reading(
          'category',
          'Supplied small-appliance definition',
          small ? 'Facts fit the case definition' : 'Facts do not establish this category',
          undefined,
          small ? 'normal' : 'warning',
        ),
        reading(
          'compressor',
          'Compressor condition',
          c.compressor === 'operating' ? 'Operating' : 'Inoperative',
        ),
        reading(
          'equipment',
          'Recovery tool evidence',
          c.equipment === 'verified' ? 'Verified in case' : 'Needs verification',
          undefined,
          c.equipment === 'verified' ? 'normal' : 'warning',
        ),
      ];
    }
    case 9: {
      const time = numeric(c, 'elapsed');
      const previousTime = Math.max(0, time - 1);
      const handlingReadings = [
        reading(
          'handling-method',
          'Selected refrigerant-handling plan',
          c.handlingPlan === 'pump-down'
            ? 'Pump-down: containment in a manufacturer-designated part of the system'
            : 'External recovery: transfer to a suitable recovery container',
        ),
        reading(
          'pump-down-eligibility',
          'Equipment-specific pump-down review',
          c.pumpDownSuitability === 'verified'
            ? 'Applicable procedure and system suitability verified in this fictional job card'
            : c.pumpDownSuitability === 'unsuitable'
              ? 'STOP: this case does not support pump-down; select a compatible alternative'
              : 'STOP: equipment procedure and system suitability are unverified',
          undefined,
          c.pumpDownSuitability === 'verified' ? 'normal' : 'danger',
        ),
        reading(
          'containment',
          'Refrigerant containment evidence',
          c.containment === 'verified'
            ? 'Documented only in the fictional job card; physical work still needs qualified verification'
            : 'STOP: containment is unverified; opening refrigerant piping is not authorized',
          undefined,
          c.containment === 'verified' ? 'normal' : 'danger',
        ),
      ];
      if (c.measurement === 'pressure') {
        const pressure = c.specimen === 'leak' ? 150 - 2.2 * time : 150;
        const previous = c.specimen === 'leak' ? 150 - 2.2 * previousTime : 150;
        return [
          reading('initial', 'Teaching initial pressure', 150, 'psig'),
          reading('previous', `Sample at ${previousTime} min`, rounded(previous), 'psig'),
          reading(
            'current',
            'Modeled current pressure',
            rounded(pressure),
            'psig',
            c.specimen === 'leak' && time > 0 ? 'warning' : 'neutral',
          ),
          reading(
            'sample-change',
            'Change from previous sample',
            rounded(pressure - previous),
            'psi',
          ),
          reading('change', 'Change from initial', rounded(pressure - 150), 'psi'),
          reading('elapsed', 'Selected sample time', time, 'min'),
          reading('conditions', 'Modeled temperature', 'Held constant for comparison'),
          ...handlingReadings,
        ];
      }
      const isolated = c.pump === 'isolated';
      const sampleAt = (minute: number) =>
        !isolated
          ? Math.max(120, 400 - minute * 28)
          : c.specimen === 'leak'
            ? 400 + 200 * minute
            : c.specimen === 'moisture'
              ? 400 + 50 * (1 - Math.exp(-minute / 2))
              : 400 + 2 * minute;
      const microns = sampleAt(time);
      const previous = sampleAt(previousTime);
      return [
        reading('initial', 'Teaching initial vacuum', 400, 'microns'),
        reading('previous', `Sample at ${previousTime} min`, rounded(previous), 'microns'),
        reading(
          'current',
          'Modeled vacuum',
          rounded(microns),
          'microns',
          c.specimen === 'leak' && isolated && time > 0 ? 'warning' : 'neutral',
        ),
        reading(
          'sample-change',
          'Change from previous sample',
          rounded(rounded(microns) - rounded(previous)),
          'microns',
        ),
        reading('elapsed', 'Selected sample time', time, 'min'),
        reading(
          'pump',
          'Pump condition',
          isolated ? 'Isolated observation' : 'Pump running: not an isolated test',
          undefined,
          isolated ? 'neutral' : 'warning',
        ),
        ...handlingReadings,
      ];
    }
    case 10: {
      const inside = numeric(c, 'internalPressure');
      const leaking = c.seal === 'leak';
      const inward = leaking && inside < 14.7;
      return [
        reading('inside', 'Inside absolute pressure', inside, 'psia'),
        reading('outside', 'Teaching outside pressure', 14.7, 'psia'),
        reading('difference', 'Outside minus inside', rounded(14.7 - inside), 'psi'),
        reading(
          'flow',
          'Modeled leak direction',
          !leaking ? 'No flow path' : inward ? 'Air moves inward' : 'Contents tend outward',
          undefined,
          leaking ? 'warning' : 'normal',
        ),
        reading(
          'purge',
          'Work-card observation',
          c.purge === 'active'
            ? 'Repeated purge activity: investigate cause'
            : 'No purge observation recorded',
        ),
      ];
    }
    case 11: {
      const category =
        c.appliance === 'small'
          ? 'Small appliance'
          : c.appliance === 'high'
            ? 'High-pressure stationary appliance'
            : 'Low-pressure stationary appliance';
      return [
        reading('equipment', 'Case equipment category', category),
        reading(
          'record',
          'Assessment evidence',
          c.record === 'official'
            ? 'Separate verified external result in case'
            : 'Internal practice only',
          undefined,
          c.record === 'practice' ? 'warning' : 'neutral',
        ),
        reading('authority', 'Simulator credential action', 'No credential issued'),
      ];
    }
    case 12: {
      const airflow = c.case === 'airflow';
      const leak = c.case === 'leak';
      const sat = airflow ? 28 : leak ? 30 : 40;
      const line = airflow ? 38 : leak ? 60 : 55;
      const indication = c.tool === 'detector' && leak && c.detectorLocation === 'fitting';
      if (c.tool === 'detector')
        return [
          reading(
            'location',
            'Detector location',
            c.detectorLocation === 'fitting' ? 'Suspected fitting' : 'Background',
          ),
          reading(
            'indicator',
            'Training detector indication',
            indication ? 'Localized indication' : 'No indication in selected location',
            undefined,
            indication ? 'warning' : 'neutral',
          ),
          reading(
            'meaning',
            'What this establishes',
            indication
              ? 'A location needing confirmation'
              : 'No proof that all locations are leak-free',
          ),
        ];
      if (c.tool === 'temperature')
        return [
          reading(
            'air-path',
            'Indoor airflow observation',
            airflow ? 'Restricted' : 'No restriction supplied in case',
            undefined,
            airflow ? 'warning' : 'neutral',
          ),
          reading('line-temperature', 'Teaching suction-line temperature', line, '°F'),
          reading('next', 'Charge conclusion from this tool alone', 'Not established'),
        ];
      return [
        reading('saturation', 'Supplied suction saturation', sat, '°F'),
        reading('line-temperature', 'Teaching suction-line temperature', line, '°F'),
        reading('superheat', 'Computed superheat', superheat(line, sat), '°F'),
        reading('subcooling', 'Computed subcooling from supplied liquid pair', leak ? 3 : 10, '°F'),
        reading('target', 'Equipment charging target', 'Not supplied: consult actual procedure'),
      ];
    }
    case 13: {
      const blower = numeric(c, 'blower');
      const restriction = numeric(c, 'restriction');
      const airflow = rounded(blower * (1 - restriction / 100));
      const prepared =
        c.hotwork === 'protected' && c.preparation === 'ready' && c.jointPreparation === 'ready';
      const processReady = prepared && c.processPlan === 'verified';
      const ready =
        processReady && c.jointInspection === 'acceptable' && c.leakVerification === 'passed';
      return [
        reading(
          'airflow',
          'Normalized modeled airflow',
          airflow,
          '% of reference',
          restriction > 0 ? 'warning' : 'neutral',
        ),
        reading('restriction', 'Modeled airflow loss', restriction, '% of input'),
        reading('blower', 'Blower input', blower, '%'),
        reading(
          'flow-model',
          'Teaching model',
          'Delivery = blower input × (1 − airflow loss/100); not a physical blockage or fan-curve model.',
        ),
        reading(
          'hotwork',
          'Hot-work planning',
          c.hotwork === 'protected'
            ? 'Protections verified in case'
            : 'STOP: fire hazards uncontrolled',
          undefined,
          c.hotwork === 'protected' ? 'normal' : 'danger',
        ),
        reading(
          'joint-preparation',
          'Brazing preparation review',
          prepared
            ? 'Fire protection, qualified supervision, isolation, cleaning, fit and compatible materials verified in the job card'
            : 'STOP: preparation, fire protection or qualified supervision is outstanding',
          undefined,
          prepared ? 'normal' : 'danger',
        ),
        reading(
          'brazing-process',
          'Approved process review',
          processReady
            ? 'Manufacturer-specific purge, heat protection, joining and cooling instructions verified in the job card'
            : 'STOP: verified preparation and an applicable approved process are required',
          undefined,
          processReady ? 'normal' : 'danger',
        ),
        reading(
          'joint-inspection',
          'Cooled-joint inspection result',
          c.jointInspection === 'acceptable'
            ? 'No visible defect reported in this fictional inspection; leak integrity is not established by appearance'
            : c.jointInspection === 'defect'
              ? 'STOP: visible defect reported; correction and reinspection required'
              : 'Inspection not yet recorded',
          undefined,
          c.jointInspection === 'acceptable'
            ? 'normal'
            : c.jointInspection === 'defect'
              ? 'danger'
              : 'warning',
        ),
        reading(
          'leak-verification',
          'Specified post-work test result',
          c.leakVerification === 'passed'
            ? 'Specified test passed in the fictional job card only'
            : c.leakVerification === 'failed'
              ? 'STOP: specified test failed; correction and repeat verification required'
              : 'Specified test not yet recorded',
          undefined,
          c.leakVerification === 'passed'
            ? 'normal'
            : c.leakVerification === 'failed'
              ? 'danger'
              : 'warning',
        ),
        reading(
          'handoff',
          'Virtual sequence handoff',
          ready
            ? 'Virtual preparation, process, inspection and verification complete; physical signoff remains separate'
            : 'Preparation, process, inspection or test verification remains outstanding',
          undefined,
          ready ? 'normal' : 'warning',
        ),
      ];
    }
    case 14: {
      const on = c.request === 'on';
      const restrictedIndoor = c.filter === 'blocked';
      const restrictedOutdoor = c.condenser === 'blocked';
      return [
        reading(
          'airflow',
          'Indoor delivery comparison',
          !on
            ? 'No cooling request'
            : restrictedIndoor
              ? 'Reduced by obstructed filter'
              : 'Air path clear in case',
          undefined,
          restrictedIndoor ? 'warning' : 'neutral',
        ),
        reading(
          'heat-rejection',
          'Outdoor rejection comparison',
          restrictedOutdoor ? 'Restricted by obstructed coil' : 'Air path clear in case',
          undefined,
          restrictedOutdoor ? 'warning' : 'neutral',
        ),
        reading(
          'capacity',
          'Synthetic relative cooling index',
          !on ? 0 : (restrictedIndoor ? 50 : 100) * (restrictedOutdoor ? 0.6 : 1),
          '% of reference',
        ),
        reading(
          'charge',
          'Charge evidence',
          c.chargeEvidence === 'collected'
            ? 'Recorded measurements awaiting interpretation'
            : 'Not collected',
          undefined,
          c.chargeEvidence === 'unknown' ? 'warning' : 'neutral',
        ),
      ];
    }
    case 15:
      return [
        reading(
          'ladder',
          'Ladder access',
          c.ladder === 'damaged'
            ? 'STOP: withdraw damaged ladder'
            : 'Suitable inspected ladder in case',
          undefined,
          c.ladder === 'damaged' ? 'danger' : 'normal',
        ),
        reading(
          'energy',
          'Energy access',
          c.energy === 'unverified'
            ? 'STOP: verification missing'
            : 'Qualified verification recorded',
          undefined,
          c.energy === 'unverified' ? 'danger' : 'normal',
        ),
        reading(
          'walkway',
          'Access path',
          c.walkway === 'obstructed' ? 'Obstructed' : 'Clear in case',
          undefined,
          c.walkway === 'obstructed' ? 'warning' : 'normal',
        ),
      ];
    case 16:
      return [
        reading(
          'scene',
          'Scene boundary',
          c.scene === 'unsafe' ? 'DO NOT ENTER: electrical hazard' : 'Safe scene confirmed in case',
          undefined,
          c.scene === 'unsafe' ? 'danger' : 'normal',
        ),
        reading(
          'help',
          'Simulated emergency activation',
          c.help === 'called' ? 'Dispatcher responding in exercise' : 'Immediate activation needed',
          undefined,
          c.help === 'called' ? 'normal' : 'danger',
        ),
        reading(
          'aed',
          'Simulated AED response',
          c.aed === 'available' ? 'Available with responder' : 'Requested from named responder',
          undefined,
          c.aed === 'available' ? 'normal' : 'warning',
        ),
        reading('real-call', 'Real emergency call', 'This app does not call emergency services'),
      ];
    case 17:
      return [
        reading(
          'findings',
          'Diagnostic statement',
          c.diagnosis === 'supported'
            ? 'Supported by recorded tests'
            : 'Possible cause; more evidence needed',
          undefined,
          c.diagnosis === 'supported' ? 'normal' : 'warning',
        ),
        reading(
          'scope',
          'Repair authorization',
          c.approval === 'approved' ? 'Agreed scope recorded in case' : 'Pending',
          undefined,
          c.approval === 'approved' ? 'normal' : 'warning',
        ),
        reading(
          'credential',
          'External credential status',
          c.credential === 'verified' ? 'Verified in fictional record' : 'Not verified',
          undefined,
          c.credential === 'verified' ? 'normal' : 'warning',
        ),
      ];
    default:
      throw new Error('No model exists for this HVAC chapter');
  }
}

function initialState(definition: HvacSimulationDefinition): HvacSimulationState {
  return {
    stageIndex: 0,
    controls: Object.fromEntries(definition.controls.map((control) => [control.id, control.value])),
    observed: false,
    mistakes: 0,
    actionsProcessed: 0,
    feedback: null,
  };
}

function validateActionKeys(action: HvacSimulationAction) {
  if (!action || typeof action !== 'object' || Array.isArray(action))
    throw new HvacSimulationActionError('Invalid simulation action');
  const expected =
    action.type === 'set-control'
      ? ['type', 'controlId', 'value']
      : action.type === 'observe'
        ? ['type']
        : action.type === 'choose'
          ? ['type', 'stageId', 'optionId']
          : [];
  const actual = Object.keys(action);
  if (
    !expected.length ||
    actual.length !== expected.length ||
    actual.some((key) => !expected.includes(key))
  )
    throw new HvacSimulationActionError('Unexpected simulation action fields');
}

function validateControlValue(control: HvacSimulationControl, value: string | number) {
  if (control.type === 'select') {
    if (typeof value !== 'string' || !control.options?.some((option) => option.value === value))
      throw new HvacSimulationActionError('Invalid selection for this control');
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new HvacSimulationActionError('A finite numeric control value is required');
  if (
    control.min === undefined ||
    control.max === undefined ||
    control.step === undefined ||
    value < control.min ||
    value > control.max
  )
    throw new HvacSimulationActionError('Control value is outside the supported range');
  const steps = (value - control.min) / control.step;
  if (Math.abs(steps - Math.round(steps)) > 1e-8)
    throw new HvacSimulationActionError('Control value does not match the supported step');
}

export function applyHvacSimulationAction(
  definition: HvacSimulationDefinition,
  state: HvacSimulationState,
  action: HvacSimulationAction,
): HvacSimulationState {
  validateActionKeys(action);
  if (state.actionsProcessed >= HVAC_SIMULATION_MAX_ACTIONS)
    throw new HvacSimulationActionError(
      'This attempt reached its action limit. Start a new practice attempt.',
    );
  const currentStage = definition.stages[state.stageIndex];
  if (!currentStage)
    throw new HvacSimulationActionError(
      'This attempt is finished. Start a new practice attempt to continue.',
    );
  const next: HvacSimulationState = {
    ...state,
    controls: { ...state.controls },
    actionsProcessed: state.actionsProcessed + 1,
  };

  if (action.type === 'set-control') {
    const control = definition.controls.find((item) => item.id === action.controlId);
    if (!control) throw new HvacSimulationActionError('Unknown simulation control');
    validateControlValue(control, action.value);
    next.controls[control.id] = action.value;
    next.observed = false;
    next.feedback = {
      kind: 'info',
      message:
        'The teaching model has changed. Run the virtual check again before making the stage decision.',
    };
    return next;
  }

  if (action.type === 'observe') {
    next.observed = true;
    next.feedback = {
      kind: 'info',
      message:
        'Readings recorded for the current control settings. Use this evidence to answer the stage decision.',
    };
    return next;
  }

  if (action.stageId !== currentStage.id)
    throw new HvacSimulationActionError('This decision is not the current simulation stage');
  const selected = currentStage.options.find((option) => option.id === action.optionId);
  if (!selected) throw new HvacSimulationActionError('Unknown decision option');
  if (currentStage.observationRequired && !state.observed) {
    next.feedback = {
      kind: 'retry',
      message: 'Run the virtual check with the current settings before submitting the decision.',
    };
    return next;
  }
  const unmet = currentStage.requirements.find(
    (requirement) => state.controls[requirement.controlId] !== requirement.value,
  );
  if (unmet) {
    const control = definition.controls.find((item) => item.id === unmet.controlId);
    const target =
      control?.options?.find((option) => option.value === unmet.value)?.label ??
      `${unmet.value}${control?.unit ? ` ${control.unit}` : ''}`;
    next.feedback = {
      kind: 'retry',
      message: `For this comparison, set ${control?.label ?? unmet.controlId} to ${target}, then run the virtual check again.`,
    };
    return next;
  }
  if (!selected.correct) {
    next.mistakes += 1;
    next.feedback = { kind: selected.safety ? 'safety' : 'retry', message: selected.feedback };
    return next;
  }
  next.stageIndex += 1;
  next.observed = false;
  next.feedback = { kind: 'success', message: selected.feedback };
  return next;
}

export function replayHvacSimulation(
  definition: HvacSimulationDefinition,
  actions: HvacSimulationAction[],
): HvacSimulationState {
  if (!Array.isArray(actions) || actions.length > HVAC_SIMULATION_MAX_ACTIONS)
    throw new HvacSimulationActionError('Invalid or excessive simulation history');
  return actions.reduce(
    (state, action) => applyHvacSimulationAction(definition, state, action),
    initialState(definition),
  );
}

export function buildHvacSimulationView(
  definition: HvacSimulationDefinition,
  state: HvacSimulationState,
): HvacSimulationView {
  const currentStage = definition.stages[state.stageIndex];
  const finished = state.stageIndex === definition.stages.length;
  const score = finished ? Math.max(0, 100 - state.mistakes * 10) : null;
  return {
    id: definition.id,
    version: definition.version,
    lessonId: definition.lessonId,
    chapter: definition.chapter,
    title: definition.title,
    scenario: definition.scenario,
    objective: definition.objective,
    panel: definition.panel,
    controls: definition.controls.map((control) => ({
      ...control,
      value: state.controls[control.id],
      ...(control.options ? { options: control.options.map((option) => ({ ...option })) } : {}),
    })),
    readings: modelReadings(definition, state),
    stage: currentStage
      ? {
          id: currentStage.id,
          title: currentStage.title,
          prompt: currentStage.prompt,
          options: currentStage.options.map(({ id, label }) => ({ id, label })),
          observationRequired: currentStage.observationRequired,
        }
      : null,
    stageNumber: Math.min(state.stageIndex + 1, definition.stages.length),
    stageCount: definition.stages.length,
    observed: state.observed,
    finished,
    passed: finished && score !== null && score >= HVAC_SIMULATION_PASSING_SCORE,
    score,
    feedback: state.feedback ? { ...state.feedback } : null,
    sources: definition.sources.map((source) => ({ ...source })),
  };
}
