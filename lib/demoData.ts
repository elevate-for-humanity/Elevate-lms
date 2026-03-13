/**
 * Demo Data for Platform Demonstrations
 * Realistic data showcasing the learner experience
 */

// Programs
export const demoPrograms = [
  {
    id: 'barber-apprenticeship',
    name: 'USDOL Registered Barber Apprenticeship',
    description: 'Fee-based barber training within a USDOL Registered Apprenticeship framework. Combines Milady theory instruction with supervised practical training at approved partner shops.',
    duration: '15-18 months',
    format: 'Hybrid (Online Theory + Shop Training)',
    modules: 12,
    completedModules: 7,
    status: 'active',
    nextLesson: 'Module 8: Men\'s Haircutting Techniques',
    schedule: 'Theory: Self-paced online | Practical: 20+ hrs/week at training site',
    certification: 'Indiana Barber License Eligible',
    fundingEligible: ['Self-Pay', 'Klarna/Afterpay/Zip Financing', 'Payment Plans'],
    totalHours: 2000,
    completedHours: 847,
  },
  {
    id: 'cna-training',
    name: 'Certified Nursing Assistant (CNA)',
    description: 'State-approved CNA training program meeting Indiana requirements for certification examination.',
    duration: '6-8 weeks',
    format: 'Hybrid (Online + Clinical)',
    modules: 8,
    completedModules: 8,
    status: 'completed',
    nextLesson: null,
    schedule: 'Flexible scheduling with clinical rotations',
    certification: 'CNA State Certification',
    fundingEligible: ['WIOA', 'Employer Sponsorship'],
    totalHours: 120,
    completedHours: 120,
  },
  {
    id: 'hvac-technician',
    name: 'HVAC Technician Training',
    description: 'Comprehensive HVAC training covering installation, maintenance, and repair of heating and cooling systems.',
    duration: '6-12 months',
    format: 'Hybrid (Online + Hands-On Labs)',
    modules: 10,
    completedModules: 4,
    status: 'active',
    nextLesson: 'Module 5: Refrigeration Fundamentals',
    schedule: 'Evening and weekend options available',
    certification: 'EPA 608 Certification + Program Certificate',
    fundingEligible: ['WIOA', 'Apprenticeship Grants'],
    totalHours: 400,
    completedHours: 156,
  },
];

// Learner Profile
export const demoLearner = {
  id: 'learner-2847',
  name: 'Darius Williams',
  email: 'd.williams@email.com',
  enrolledProgram: demoPrograms[0],
  progress: {
    overallPercent: 42,
    modulesCompleted: 7,
    totalModules: 12,
    hoursCompleted: 847,
    totalHours: 2000,
    lastActivity: '3 hours ago',
  },
  funding: {
    status: 'Self-Pay (Active)',
    type: 'Payment Plan',
    note: 'Monthly payments via Klarna/Afterpay/Zip - 4 of 12 payments completed',
  },
  support: {
    mentor: 'James Carter, Master Barber (15+ years)',
    careerServices: 'Job placement assistance, shop partnership network, business planning',
    nextMilestone: 'Complete 1,000 practical hours by March 15',
  },
  upcomingEvents: [
    { date: 'Today', event: 'Practical Training Session', time: '9:00 AM - 5:00 PM' },
    { date: 'Thursday', event: 'Theory Quiz: Sanitation & Safety', time: '7:00 PM' },
    { date: 'Saturday', event: 'Skills Assessment: Fades & Tapers', time: '10:00 AM' },
  ],
  achievements: [
    { name: 'First 500 Hours', date: 'Dec 2024', icon: '🎯' },
    { name: 'Theory Modules 1-6 Complete', date: 'Nov 2024', icon: '📚' },
    { name: 'Safety Certification', date: 'Oct 2024', icon: '✅' },
  ],
  trainingLog: [
    { date: 'Jan 13', hours: 8, type: 'OJT', location: 'Elite Cuts Barbershop', verified: true },
    { date: 'Jan 12', hours: 6, type: 'OJT', location: 'Elite Cuts Barbershop', verified: true },
    { date: 'Jan 11', hours: 8, type: 'OJT', location: 'Elite Cuts Barbershop', verified: true },
    { date: 'Jan 10', hours: 2, type: 'RTI', location: 'Online - Milady Module 7', verified: true },
  ],
};

// Sample Employer Profile
export const demoEmployer = {
  id: 'employer-001',
  company: 'Metro Healthcare Partners',
  industry: 'Healthcare',
  openRoles: [
    { title: 'CNA - Day Shift', location: 'Downtown Campus', status: 'Active' },
    { title: 'CNA - Night Shift', location: 'West Campus', status: 'Active' },
    { title: 'Medical Assistant', location: 'Main Office', status: 'Pending' },
  ],
  candidates: [
    { name: 'Sarah M.', program: 'CNA Training', status: 'Interview Scheduled', match: 95 },
    { name: 'James T.', program: 'CNA Training', status: 'Application Review', match: 88 },
    { name: 'Lisa R.', program: 'Medical Assistant', status: 'Screening', match: 82 },
  ],
  hiringSupport: {
    incentive: 'May be eligible for up to $5,000 per hire',
    maxTotal: 'Up to $50,000 total per year',
    disclaimer: 'Eligibility and approval requirements apply. Contact your workforce representative for details.',
    programs: ['Work Opportunity Tax Credit', 'On-the-Job Training Reimbursement', 'Apprenticeship Tax Credits'],
  },
  apprenticeship: {
    active: true,
    registeredWith: 'State Apprenticeship Agency',
    currentApprentices: 3,
    structure: 'Structured training plan with wage progression',
  },
};

// Sample Admin Dashboard Data
export const demoAdminDashboard = {
  summary: {
    activePrograms: 12,
    totalEnrollments: 'Multiple cohorts',
    completionRate: 'Tracked per program',
    activePartners: 8,
  },
  enrollmentPipeline: [
    { stage: 'Intake', count: 'New applications', color: 'bg-slate-500' },
    { stage: 'Eligibility Review', count: 'Pending verification', color: 'bg-yellow-500' },
    { stage: 'Enrolled', count: 'Active learners', color: 'bg-blue-500' },
    { stage: 'In Progress', count: 'Currently training', color: 'bg-green-500' },
    { stage: 'Completed', count: 'Program graduates', color: 'bg-purple-500' },
  ],
  recentActivity: [
    { action: 'New enrollment', detail: 'Barber Apprenticeship cohort', time: '2 hours ago' },
    { action: 'Completion', detail: 'CNA Training - 8 graduates', time: '1 day ago' },
    { action: 'Partner added', detail: 'New employer partner onboarded', time: '2 days ago' },
    { action: 'Report generated', detail: 'Monthly compliance export', time: '3 days ago' },
  ],
  alerts: [
    { type: 'info', message: 'Quarterly reporting deadline approaching' },
    { type: 'success', message: 'All active programs meeting completion targets' },
  ],
  compliance: {
    note: 'Reporting requirements vary by funding source and region',
    exports: ['Enrollment reports', 'Completion certificates', 'Attendance records', 'Outcome tracking'],
  },
};

// Funding Options (for display purposes)
export const fundingOptions = [
  {
    name: 'WIOA (Workforce Innovation and Opportunity Act)',
    description: 'Federal funding for eligible adults and dislocated workers',
    eligibility: 'Income and employment status requirements apply',
  },
  {
    name: 'WRG (Workforce Readiness Grant)',
    description: 'State-level funding for workforce training programs',
    eligibility: 'Varies by state and program',
  },
  {
    name: 'JRI (Job Ready Indy)',
    description: 'Funding for reentry and justice-impacted populations',
    eligibility: 'Justice system involvement required',
  },
  {
    name: 'Apprenticeship Grants',
    description: 'Federal and state funding for registered apprenticeships',
    eligibility: 'Must be enrolled in registered apprenticeship program',
  },
];
