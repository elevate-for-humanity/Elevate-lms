/** Shared public schedule for the combined forklift/manufacturing program.
 * These are planned instructional hours, never automatically credited seat time.
 */
export const FORKLIFT_MANUFACTURING = {
  slug: 'forklift',
  courseSlug: 'forklift-manufacturing-operations-48h',
  title: 'Forklift and Manufacturing Operations',
  onlineHours: 48,
  employerWeeks: { min: 2, max: 4 },
  duration: '48 online hours + practical training (2–4 weeks estimated)',
  schedule: 'Planning example: at 24 online hours per week, complete 2 weeks online, followed by an estimated 2–4 weeks of supervised practical training. The practical phase may take longer until skills are demonstrated. Its actual clock hours, training site and schedule must be confirmed with a qualified training partner or employer before enrollment.',
  subtitle: 'Build forklift knowledge, assembly skills, and quality-inspection judgment through lessons, interactive scenarios, and a working portfolio. The practical phase requires actual equipment, supervised practice and a qualified training partner or employer.',
  partnerReadiness: 'Elevate provides classroom and online instruction and is not a fully equipped forklift training facility. We are arranging a paid hands-on training partner. The partner, equipment, location, qualified instructors, practical hours and student costs have not yet been confirmed.',
  blocks: [
    { id: 'forklift', title: 'Forklift foundations', hours: 8, lessons: 4, topics: ['Operator responsibilities and equipment limits', 'Capacity-plate and load decisions', 'Inspection and workplace hazard recognition', 'Incident reporting and employer evaluation preparation'] },
    { id: 'assembly', title: 'Assembly and production', hours: 16, lessons: 8, topics: ['Work instructions, drawings, and revision control', 'Parts, quantities, kits, and traceability', 'Assembly sequence and production records', 'Defect escalation and shift handoffs'] },
    { id: 'quality', title: 'Quality inspection', hours: 24, lessons: 12, topics: ['Measurement, units, and specified tolerances', 'Inspection plans and measuring-tool selection', 'Defect classification and nonconforming material', 'Evidence-based quality records and a final job packet'] },
  ],
  virtualActivities: [
    'Review a fictional capacity plate and explain a load decision.',
    'Identify inspection defects and choose a safe escalation.',
    'Put a documented assembly process in the correct sequence.',
    'Calculate limits and compare measurements with a drawing.',
    'Classify defects, reconcile a lot, and document a hold.',
    'Complete a production and quality handoff with traceable records.',
  ],
  practicalDisclosure: 'Online simulations are knowledge and decision-making practice. They do not replace equipment demonstrations, supervised operation, workplace evaluation, or employer authorization. A qualified training partner or employer must document actual practical instruction and demonstrated skills. The employer remains responsible for workplace evaluation and authorization to operate its equipment.',
  credentialDisclosure: 'Elevate records completion of its online learning, workbook and assessments. These internal records are not external industry credentials. Practical training and workplace evaluation must be documented separately under 29 CFR 1910.178(l). An external credential and testing arrangement have not yet been confirmed; no external credential is awarded by finishing these online exercises.',
  fundingDisclosure: 'This combined program is not currently listed as an approved Elevate ETPL/WIOA program. Tuition, employer sponsorship, and any future agency funding must be confirmed for this exact program before enrollment.',
  sources: [
    { title: 'OSHA powered industrial truck training requirements', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.178' },
    { title: 'Indiana INTraining and ETPL program requirements', url: 'https://www.in.gov/dwd/files/activepolicies/2020-17-TAC3_WIOA_INTraining_ETPL_Procedural_Guidance.pdf' },
  ],
} as const;
