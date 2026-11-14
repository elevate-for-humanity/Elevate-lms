const GENERAL_MILESTONES = [
  'Orientation and program requirements',
  'Core concepts and terminology',
  'Guided practice and skill development',
  'Applied assignments and problem solving',
  'Competency review and feedback',
  'Completion evidence and career readiness',
] as const;

const HVAC_MILESTONES = [
  'Orientation and workplace safety',
  'Tools, equipment, and system fundamentals',
  'Installation and preventive maintenance',
  'Diagnostics and troubleshooting',
  'Refrigerant handling and environmental rules',
  'Employer engagement and job readiness',
] as const;

// An unfamiliar/new program gets neutral progress categories, never trade-specific requirements.
export function trainingMilestones(programSlug?: string | null): readonly string[] {
  return programSlug === 'hvac-technician' ? HVAC_MILESTONES : GENERAL_MILESTONES;
}
