// Public sample records shared by the demo workspaces and their visual previews.
// These values never represent production learners, jobs, or outcomes.

export const DEMO_STUDENTS = [
  { name: 'Jordan Sample', program: 'Barber Apprenticeship', status: 'Active', progress: 65 },
  { name: 'Maria Sample', program: 'HVAC Technician', status: 'Active', progress: 42 },
  { name: 'Alex Sample', program: 'Medical Assistant', status: 'Review', progress: 18 },
];

export const DEMO_CANDIDATES = [
  {
    name: 'Marcus Sample',
    program: 'Barber Apprenticeship',
    skills: ['Fades', 'Customer Service'],
  },
  { name: 'Sarah Sample', program: 'HVAC Technician', skills: ['EPA 608', 'Diagnostics'] },
  { name: 'David Sample', program: 'Medical Assistant', skills: ['Patient Care', 'CPR'] },
];

export const DEMO_COURSES = [
  { id: 'barber', title: 'Barber Fundamentals', progress: 65, duration: '15 weeks' },
  { id: 'hvac', title: 'HVAC Technician', progress: 30, duration: '12 weeks' },
];

export const DEMO_PROGRAM_ROWS = [
  ['Barber Apprenticeship', '28 participants', '94% attendance'],
  ['Cosmetology Apprenticeship', '17 participants', '91% attendance'],
  ['HVAC Technician', '22 participants', '88% attendance'],
] as const;
