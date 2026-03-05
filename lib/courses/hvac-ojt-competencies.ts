// lib/courses/hvac-ojt-competencies.ts
// Structured OJT competency checklist for employer-supervised field training.
// Aligned to the same measurable standards used in the online lab modules.
// Referenced by: OJT tracker UI, program page, employer training plan document.

export interface OjtCompetency {
  id: string;
  title: string;
  description: string;
  measurableStandard: string;
  weekRange: [number, number]; // OJT weeks (1-12)
  category: string;
  relatedLabId?: string; // Links back to online lab lesson
  estimatedHours: number;
}

export const OJT_CATEGORIES = [
  'Equipment Identification & Safety',
  'Airflow Diagnostics',
  'Electrical Diagnostics',
  'Refrigerant System Service',
  'Preventive Maintenance',
  'Troubleshooting',
  'Independent Service',
] as const;

export const HVAC_OJT_COMPETENCIES: OjtCompetency[] = [
  // ── Weeks 1–2: Equipment Identification & Jobsite Safety ──
  {
    id: 'ojt-01',
    title: 'Identify residential split system components',
    description: 'Locate and name compressor, condenser coil, evaporator coil, metering device, air handler, and refrigerant lines on a live system.',
    measurableStandard: '100% correct identification on 3 different systems',
    weekRange: [1, 2],
    category: 'Equipment Identification & Safety',
    relatedLabId: 'hvac-02-04', // System Components Identification lab
    estimatedHours: 4,
  },
  {
    id: 'ojt-02',
    title: 'Demonstrate PPE usage and jobsite safety',
    description: 'Arrive with required PPE (safety glasses, gloves, steel-toed boots). Follow lockout/tagout before working on equipment. Identify electrical hazards.',
    measurableStandard: 'Zero safety violations observed over 2-week period',
    weekRange: [1, 2],
    category: 'Equipment Identification & Safety',
    estimatedHours: 8,
  },
  {
    id: 'ojt-03',
    title: 'Read equipment nameplates and documentation',
    description: 'Locate model number, serial number, refrigerant type, charge amount, voltage, and amperage ratings from equipment nameplates.',
    measurableStandard: 'Correctly record all nameplate data on 5 different units',
    weekRange: [1, 2],
    category: 'Equipment Identification & Safety',
    estimatedHours: 3,
  },
  {
    id: 'ojt-04',
    title: 'Operate basic HVAC hand tools',
    description: 'Demonstrate proper use of tubing cutter, flaring tool, swaging tool, torque wrench, and hex key set.',
    measurableStandard: 'Correct technique observed on each tool',
    weekRange: [1, 2],
    category: 'Equipment Identification & Safety',
    estimatedHours: 5,
  },

  // ── Weeks 3–4: Airflow Diagnostics ──
  {
    id: 'ojt-05',
    title: 'Measure total external static pressure',
    description: 'Connect manometer to supply and return plenums. Record total external static pressure and compare to equipment rating.',
    measurableStandard: 'Reading within ±0.05 in. w.c. of supervisor reference',
    weekRange: [3, 4],
    category: 'Airflow Diagnostics',
    relatedLabId: 'hvac-12-04', // System Commissioning Lab
    estimatedHours: 6,
  },
  {
    id: 'ojt-06',
    title: 'Inspect ductwork for restrictions and leaks',
    description: 'Visually inspect accessible ductwork. Identify disconnected joints, crushed flex duct, missing insulation, and unsealed connections.',
    measurableStandard: 'Identify all planted defects on 2 inspection exercises',
    weekRange: [3, 4],
    category: 'Airflow Diagnostics',
    estimatedHours: 6,
  },
  {
    id: 'ojt-07',
    title: 'Measure temperature split across evaporator',
    description: 'Record supply and return air temperatures. Calculate temperature differential and compare to manufacturer specification.',
    measurableStandard: 'Within ±2°F of supervisor measurement',
    weekRange: [3, 4],
    category: 'Airflow Diagnostics',
    estimatedHours: 4,
  },
  {
    id: 'ojt-08',
    title: 'Inspect and replace air filters',
    description: 'Identify filter size, type (fiberglass, pleated, HEPA), and MERV rating. Remove, inspect, and replace filter following airflow direction arrows.',
    measurableStandard: 'Correct filter selection and installation on 3 systems',
    weekRange: [3, 4],
    category: 'Airflow Diagnostics',
    estimatedHours: 2,
  },

  // ── Weeks 5–6: Electrical Diagnostics ──
  {
    id: 'ojt-09',
    title: 'Measure voltage at disconnect and equipment',
    description: 'Use multimeter to verify line voltage at disconnect, contactor, and transformer. Confirm voltage within ±10% of nameplate.',
    measurableStandard: 'Readings within ±2V of supervisor reference on 5 systems',
    weekRange: [5, 6],
    category: 'Electrical Diagnostics',
    relatedLabId: 'hvac-03-03', // Multimeter & Amp Clamp Lab
    estimatedHours: 6,
  },
  {
    id: 'ojt-10',
    title: 'Test run and start capacitors',
    description: 'Safely discharge capacitor. Measure capacitance with multimeter. Determine pass/fail based on ±6% of rated value.',
    measurableStandard: 'Correct diagnosis on 5 capacitors (pass/fail)',
    weekRange: [5, 6],
    category: 'Electrical Diagnostics',
    relatedLabId: 'hvac-03-03',
    estimatedHours: 4,
  },
  {
    id: 'ojt-11',
    title: 'Check contactor and relay operation',
    description: 'Inspect contactor points for pitting. Measure coil voltage. Verify contact closure with multimeter.',
    measurableStandard: 'Correct assessment of contactor condition on 3 units',
    weekRange: [5, 6],
    category: 'Electrical Diagnostics',
    estimatedHours: 4,
  },
  {
    id: 'ojt-12',
    title: 'Verify thermostat wiring and operation',
    description: 'Identify R, Y, G, W, C, and O/B terminals. Verify correct wiring using wiring diagram. Test heating and cooling call.',
    measurableStandard: 'Correct terminal identification and function test on 3 systems',
    weekRange: [5, 6],
    category: 'Electrical Diagnostics',
    estimatedHours: 4,
  },

  // ── Weeks 7–8: Refrigerant System Service ──
  {
    id: 'ojt-13',
    title: 'Connect manifold gauges to a live system',
    description: 'Identify high-side and low-side service ports. Connect gauge hoses with correct routing. Read and record pressures.',
    measurableStandard: 'Zero cross-contamination, correct high/low identification on 3 systems',
    weekRange: [7, 8],
    category: 'Refrigerant System Service',
    relatedLabId: 'hvac-05-05', // Superheat & Subcooling Lab
    estimatedHours: 6,
  },
  {
    id: 'ojt-14',
    title: 'Calculate superheat and subcooling',
    description: 'Measure suction line temperature and pressure. Calculate superheat. Measure liquid line temperature and pressure. Calculate subcooling.',
    measurableStandard: 'Within ±2°F of supervisor calculation on 3 systems',
    weekRange: [7, 8],
    category: 'Refrigerant System Service',
    relatedLabId: 'hvac-05-05',
    estimatedHours: 8,
  },
  {
    id: 'ojt-15',
    title: 'Perform refrigerant recovery',
    description: 'Connect recovery machine. Recover refrigerant to required level per EPA regulations. Weigh recovered refrigerant and label cylinder.',
    measurableStandard: 'EPA-compliant procedure observed, correct recovery level achieved',
    weekRange: [7, 8],
    category: 'Refrigerant System Service',
    relatedLabId: 'hvac-08-06', // Recovery Equipment Lab
    estimatedHours: 6,
  },
  {
    id: 'ojt-16',
    title: 'Perform electronic leak detection',
    description: 'Use electronic leak detector to check all joints, valves, and connections on a charged system.',
    measurableStandard: 'Locate planted leak within 5 minutes',
    weekRange: [7, 8],
    category: 'Refrigerant System Service',
    relatedLabId: 'hvac-08-05', // Leak Detection Lab
    estimatedHours: 4,
  },

  // ── Weeks 9–10: Preventive Maintenance ──
  {
    id: 'ojt-17',
    title: 'Perform condenser coil cleaning',
    description: 'Inspect condenser coil for debris. Clean with coil cleaner and water. Verify improved airflow.',
    measurableStandard: 'Visible improvement in coil condition, no fin damage',
    weekRange: [9, 10],
    category: 'Preventive Maintenance',
    estimatedHours: 4,
  },
  {
    id: 'ojt-18',
    title: 'Inspect and clear condensate drain',
    description: 'Locate condensate drain line and trap. Check for blockage. Clear with nitrogen or wet/dry vacuum. Verify flow.',
    measurableStandard: 'Drain flows freely after service',
    weekRange: [9, 10],
    category: 'Preventive Maintenance',
    estimatedHours: 3,
  },
  {
    id: 'ojt-19',
    title: 'Complete preventive maintenance checklist',
    description: 'Perform full PM on a residential system: filter, coils, drain, electrical connections, refrigerant pressures, temperature split, safety controls.',
    measurableStandard: 'All checklist items completed with zero missed items',
    weekRange: [9, 10],
    category: 'Preventive Maintenance',
    estimatedHours: 8,
  },
  {
    id: 'ojt-20',
    title: 'Inspect electrical connections and tighten',
    description: 'Check all wire connections for corrosion, discoloration, or looseness. Tighten to manufacturer torque specification.',
    measurableStandard: 'All connections inspected and secured',
    weekRange: [9, 10],
    category: 'Preventive Maintenance',
    estimatedHours: 3,
  },

  // ── Week 11: Troubleshooting ──
  {
    id: 'ojt-21',
    title: 'Diagnose a no-cool service call',
    description: 'Apply systematic troubleshooting method: verify complaint, check thermostat, check power, check airflow, check refrigerant, identify root cause.',
    measurableStandard: 'Correct diagnosis within 30 minutes',
    weekRange: [11, 11],
    category: 'Troubleshooting',
    relatedLabId: 'hvac-13-04', // Troubleshooting Scenarios Lab
    estimatedHours: 6,
  },
  {
    id: 'ojt-22',
    title: 'Diagnose a no-heat service call',
    description: 'Check thermostat, power, gas supply, ignition system, flame sensor, limit switches. Identify root cause.',
    measurableStandard: 'Correct diagnosis within 30 minutes',
    weekRange: [11, 11],
    category: 'Troubleshooting',
    relatedLabId: 'hvac-13-04',
    estimatedHours: 6,
  },
  {
    id: 'ojt-23',
    title: 'Read and interpret wiring diagrams in the field',
    description: 'Locate wiring diagram on equipment. Trace circuit path for a specific component. Verify wiring matches diagram.',
    measurableStandard: 'Correctly trace 3 circuits on 2 different systems',
    weekRange: [11, 11],
    category: 'Troubleshooting',
    estimatedHours: 4,
  },

  // ── Week 12: Independent Service ──
  {
    id: 'ojt-24',
    title: 'Perform supervised independent service call',
    description: 'Complete a service call from arrival to departure: greet customer, diagnose issue, explain findings, perform repair, verify operation, document work.',
    measurableStandard: 'Supervisor rates satisfactory on professionalism, diagnosis, and repair',
    weekRange: [12, 12],
    category: 'Independent Service',
    relatedLabId: 'hvac-13-05', // Customer Communication Simulation
    estimatedHours: 8,
  },
  {
    id: 'ojt-25',
    title: 'Complete OJT documentation and hours log',
    description: 'Submit signed competency checklist, hours log, and supervisor evaluation. All 24 competencies verified.',
    measurableStandard: '24/24 competencies signed off, minimum 240 hours documented',
    weekRange: [12, 12],
    category: 'Independent Service',
    estimatedHours: 2,
  },
];

// Helpers
export const OJT_TOTAL_HOURS = HVAC_OJT_COMPETENCIES.reduce((s, c) => s + c.estimatedHours, 0);
export const OJT_COMPETENCY_COUNT = HVAC_OJT_COMPETENCIES.length;
export const OJT_DURATION_WEEKS = 12;

export function getOjtByWeek(week: number): OjtCompetency[] {
  return HVAC_OJT_COMPETENCIES.filter(c => week >= c.weekRange[0] && week <= c.weekRange[1]);
}

export function getOjtByCategory(category: string): OjtCompetency[] {
  return HVAC_OJT_COMPETENCIES.filter(c => c.category === category);
}
