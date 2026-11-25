/**
 * David Nazario's HVAC practical syllabus, added alongside the existing
 * EPA 608 course. This plan is NOT an award of physical hands-on hours.
 *
 * Each module is delivered through the same instructor-led and virtual
 * curriculum. Simulation credit and physically observed skills remain separate.
 */
export const HVAC_PRACTICAL_COURSE_ID = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201' as const;

/** Exact transcription of the supplied instructor sheet; these are planned,
 * not earned, hours. The printed total disagrees with its individual rows. */
export const HVAC_PRACTICAL_SOURCE_ALLOCATION = [
  { topic: 'interplay_online', label: 'Interplay online', hours: 8 },
  { topic: 'split_system', label: 'Residential split-system', hours: 5 },
  { topic: 'gas_furnace', label: 'Gas furnace', hours: 5 },
  { topic: 'pressure_test', label: 'Pressure test', hours: 3 },
  { topic: 'vacuum', label: 'Vacuum', hours: 3 },
  { topic: 'digital_manifold', label: 'Digital manifold gauges', hours: 3 },
  { topic: 'recovery_cylinders', label: 'Recovery cylinders', hours: 2 },
  { topic: 'multimeter', label: 'Multimeters', hours: 2 },
  { topic: 'clamp_meter', label: 'Clamp meters', hours: 4 },
  { topic: 'leak_detector', label: 'Leak detectors', hours: 2 },
  { topic: 'pump_down', label: 'Pump down', hours: 1 },
  { topic: 'brazing', label: 'Braze', hours: 5 },
] as const;
export const HVAC_PRACTICAL_SOURCE_PRINTED_HOURS = 48;
export const HVAC_PRACTICAL_SOURCE_LISTED_HOURS = HVAC_PRACTICAL_SOURCE_ALLOCATION.reduce(
  (total, item) => total + item.hours,
  0,
);
export const HVAC_PRACTICAL_SOURCE_UNALLOCATED_HOURS =
  HVAC_PRACTICAL_SOURCE_PRINTED_HOURS - HVAC_PRACTICAL_SOURCE_LISTED_HOURS;

export type HvacPracticalMode = 'virtual_simulation' | 'instructor_led';
export type HvacPracticalTopic =
  | 'safety'
  | 'split_system'
  | 'gas_furnace'
  | 'pressure_test'
  | 'vacuum'
  | 'digital_manifold'
  | 'recovery_cylinders'
  | 'multimeter'
  | 'clamp_meter'
  | 'leak_detector'
  | 'pump_down'
  | 'brazing';

export type HvacPracticalModule = {
  id: string;
  title: string;
  proposedHours: number;
  topics: readonly HvacPracticalTopic[];
  simulationActivity: string;
  instructorActivity: string;
  competency: string;
  requiresPhysicalVerification: boolean;
};

/**
 * Allocation is PROPOSED and is independent of the source transcription above.
 * The photographed rows total 43 hours (including 8 online), although its
 * printed total is 48. The missing 5 hours require instructor clarification;
 * this proposed allocation must not be represented as his confirmed schedule.
 * No migration, enrollment, progress, or certification mutation occurs here.
 */
export const HVAC_PRACTICAL_MODULES: readonly HvacPracticalModule[] = [
  {
    id: 'hvac-practical-safety',
    title: 'Safety, equipment identification and isolation decisions',
    proposedHours: 4,
    topics: ['safety'],
    simulationActivity:
      'Identify hazards, choose protective measures and stop unsafe simulated actions',
    instructorActivity: 'Demonstrate workshop safety and assess hazard identification',
    competency: 'Choose safe procedures before beginning diagnostics',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-split',
    title: 'Residential split-system startup and diagnosis',
    proposedHours: 6,
    topics: ['split_system'],
    simulationActivity: 'Trace components, interpret operating conditions and diagnose a fault',
    instructorActivity: 'Demonstrate real split-system startup, shutdown and diagnostics',
    competency: 'Explain component operation and diagnostic sequence',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-furnace',
    title: 'Gas furnace sequence and fault analysis',
    proposedHours: 5,
    topics: ['gas_furnace'],
    simulationActivity: 'Interpret ignition and safety-state transitions in a virtual furnace',
    instructorActivity: 'Demonstrate controlled furnace troubleshooting with safety supervision',
    competency: 'Recognize fault conditions and appropriate stop-work decisions',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-electric',
    title: 'Electrical measurements and diagnostics',
    proposedHours: 6,
    topics: ['multimeter', 'clamp_meter'],
    simulationActivity:
      'Choose meter modes, simulated probe points and diagnose faults from readings',
    instructorActivity: 'Observe safe tool setup, meter selection and measurements',
    competency: 'Interpret voltage, current and resistance readings',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-manifold',
    title: 'Digital manifold measurements and refrigeration diagnostics',
    proposedHours: 5,
    topics: ['digital_manifold'],
    simulationActivity: 'Interpret simulated gauge readings and saturation-temperature references',
    instructorActivity: 'Demonstrate equipment-specific gauge use and recorded readings',
    competency: 'Use readings to support a defensible diagnosis',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-pressure-leak',
    title: 'Pressure-test reasoning and leak detection',
    proposedHours: 5,
    topics: ['pressure_test', 'leak_detector'],
    simulationActivity:
      'Interpret virtual test trends, identify suspected leaks and choose safe responses',
    instructorActivity: 'Observe approved pressure-test and detection procedures on equipment',
    competency: 'Distinguish leak evidence from unrelated system faults',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-vacuum',
    title: 'Evacuation and vacuum interpretation',
    proposedHours: 4,
    topics: ['vacuum'],
    simulationActivity:
      'Read virtual micron trends and distinguish moisture, leaks and stable evacuation',
    instructorActivity: 'Demonstrate equipment-specific evacuation and verification',
    competency: 'Interpret evacuation results without using simulated numbers as field targets',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-recovery',
    title: 'Recovery cylinders and pump-down concepts',
    proposedHours: 5,
    topics: ['recovery_cylinders', 'pump_down'],
    simulationActivity: 'Select compliant recovery decisions and identify cylinder safety hazards',
    instructorActivity: 'Demonstrate applicable recovery procedures and equipment handling',
    competency: 'Identify safe, compliant refrigerant handling decisions',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-brazing',
    title: 'Brazing and line-set preparation',
    proposedHours: 4,
    topics: ['brazing'],
    simulationActivity:
      'Sequence preparation, fire prevention and simulated joint-inspection decisions',
    instructorActivity: 'Observe actual joint preparation, brazing and quality inspection',
    competency: 'Recognize preparation, safety and workmanship requirements',
    requiresPhysicalVerification: true,
  },
  {
    id: 'hvac-practical-capstone',
    title: 'Integrated troubleshooting and competency review',
    proposedHours: 4,
    topics: ['split_system', 'gas_furnace', 'safety'],
    simulationActivity: 'Complete a scored, branching service-call case and record reasoning',
    instructorActivity: 'Conduct a supervised practical demonstration and independent review',
    competency: 'Apply safety, measurement and diagnosis to a complete scenario',
    requiresPhysicalVerification: true,
  },
] as const;

export const HVAC_PRACTICAL_PROPOSED_HOURS = HVAC_PRACTICAL_MODULES.reduce(
  (sum, module) => sum + module.proposedHours,
  0,
);

/**
 * Do not equate virtual minutes with physically observed hands-on credit.
 * Both modes require identity, enrollment, audit, and reviewer evidence before
 * any downstream credential or funding-hours determination.
 */
export const HVAC_PRACTICAL_HOUR_POLICY = {
  virtual_simulation: 'simulation_hours_only',
  instructor_led: 'physical_hours_require_observation',
  noAutomaticEquivalency: true,
  noAutomaticCertification: true,
} as const;

export function practicalModulesForTopic(topic: HvacPracticalTopic) {
  return HVAC_PRACTICAL_MODULES.filter((module) => module.topics.includes(topic));
}
