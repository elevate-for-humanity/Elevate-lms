/**
 * WIOA (Workforce Innovation & Opportunity Act) Compliance System
 * Full implementation for workforce boards, WIOA tracking, and DOL reporting
 */

export interface WIOAParticipant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn?: string; // Encrypted

  // Eligibility
  eligibilityStatus: 'eligible' | 'ineligible' | 'pending';
  eligibilityDate?: string;
  eligibilityBarriers: WIOABarrier[];
  priorityOfService: boolean; // Veteran, low-income, etc.

  // Demographics (PIRL required)
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  race: string[];
  ethnicity: 'hispanic' | 'non-hispanic';
  veteranStatus: boolean;
  disabilityStatus: boolean;
  englishLanguageLearner: boolean;

  // Education
  highestEducation:
    | 'less-than-hs'
    | 'hs-diploma'
    | 'ged'
    | 'some-college'
    | 'associates'
    | 'bachelors'
    | 'graduate';

  // Employment
  employmentStatus: 'employed' | 'unemployed' | 'not-in-labor-force';
  dislocatedWorker: boolean;
  lowIncome: boolean;
  receivingPublicAssistance: boolean;

  // Program
  enrollmentDate: string;
  exitDate?: string;
  programType: 'adult' | 'dislocated-worker' | 'youth';
  fundingStream: 'wioa-adult' | 'wioa-dw' | 'wioa-youth' | 'tanf' | 'snap' | 'other';
}

export interface WIOABarrier {
  type:
    | 'basic-skills-deficient'
    | 'english-language-learner'
    | 'homeless'
    | 'offender'
    | 'low-income'
    | 'cultural'
    | 'disability'
    | 'single-parent'
    | 'displaced-homemaker'
    | 'long-term-unemployed';
  verified: boolean;
  verificationDate?: string;
  notes?: string;
}

export interface IndividualEmploymentPlan {
  id: string;
  participantId: string;
  createdDate: string;
  updatedDate: string;

  // Career Goals
  careerGoal: string;
  targetOccupation: string;
  targetIndustry: string;
  targetWage: number;

  // Assessment Results
  assessments: WIOAAssessment[];

  // Services Planned
  plannedServices: WIOAService[];

  // Milestones
  milestones: IEPMilestone[];

  // Case Manager
  caseManagerId: string;
  caseManagerName: string;

  status: 'active' | 'completed' | 'exited';
}

export interface WIOAAssessment {
  type: 'basic-skills' | 'occupational-skills' | 'work-readiness' | 'career-interest';
  name: string;
  date: string;
  score?: number;
  results: string;
  recommendations: string[];
}

export interface WIOAService {
  id: string;
  serviceType: 'career-services' | 'training-services' | 'supportive-services';
  serviceName: string;
  description: string;
  provider: string;
  startDate: string;
  endDate?: string;
  cost: number;
  fundingSource: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  outcomes?: string;
}

export interface IEPMilestone {
  id: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
  notes?: string;
}

export interface EmploymentOutcome {
  participantId: string;

  // Employment at Exit
  employedAtExit: boolean;
  exitDate: string;

  // Job Details
  employer?: string;
  jobTitle?: string;
  occupation?: string; // SOC code
  industry?: string; // NAICS code
  hourlyWage?: number;
  hoursPerWeek?: number;
  benefits: boolean;

  // Follow-up (2nd & 4th quarter)
  employed2ndQuarter?: boolean;
  employed4thQuarter?: boolean;
  wage2ndQuarter?: number;
  wage4thQuarter?: number;

  // Credential Attainment
  credentialAttained: boolean;
  credentialType?: 'diploma' | 'certificate' | 'license' | 'degree' | 'apprenticeship';
  credentialName?: string;
  credentialDate?: string;

  // Measurable Skills Gains
  measurableSkillsGain: boolean;
  skillsGainType?:
    | 'educational'
    | 'training'
    | 'secondary-diploma'
    | 'secondary-ged'
    | 'postsecondary';
}

export interface WIOAPerformanceMetrics {
  programYear: string;

  // Primary Indicators
  employmentRate2ndQuarter: number;
  employmentRate4thQuarter: number;
  medianEarnings2ndQuarter: number;
  credentialAttainmentRate: number;
  measurableSkillsGainRate: number;

  // Effectiveness in Serving Employers
  employerSatisfaction?: number;
  employerRetention?: number;

  // Counts
  totalParticipants: number;
  totalExiters: number;
  totalEmployed: number;
  totalCredentials: number;
}

/**
 * WIOA Eligibility Determination
 */
export function determineWIOAEligibility(participant: Partial<WIOAParticipant>): {
  eligible: boolean;
  programType: 'adult' | 'dislocated-worker' | 'youth' | 'none';
  reasons: string[];
} {
  const reasons: string[] = [];

  // Age check
  const age = calculateAge(participant.dateOfBirth!);

  // Youth (14-24)
  if (age >= 14 && age <= 24) {
    if (participant.eligibilityBarriers && participant.eligibilityBarriers.length > 0) {
      reasons.push('Meets youth eligibility: age 14-24 with barriers');
      return { eligible: true, programType: 'youth', reasons };
    }
  }

  // Adult (18+)
  if (age >= 18) {
    if (
      participant.employmentStatus === 'unemployed' ||
      participant.lowIncome ||
      participant.receivingPublicAssistance
    ) {
      reasons.push('Meets adult eligibility: 18+ and unemployed/low-income');
      return { eligible: true, programType: 'adult', reasons };
    }
  }

  // Dislocated Worker
  if (participant.dislocatedWorker) {
    reasons.push('Meets dislocated worker eligibility');
    return { eligible: true, programType: 'dislocated-worker', reasons };
  }

  reasons.push('Does not meet WIOA eligibility criteria');
  return { eligible: false, programType: 'none', reasons };
}

/**
 * Calculate Measurable Skills Gain
 */
export function calculateMeasurableSkillsGain(
  participant: WIOAParticipant,
  assessments: WIOAAssessment[],
): boolean {
  // Educational functioning level increase
  const basicSkillsAssessments = assessments
    .filter((a) => a.type === 'basic-skills')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (basicSkillsAssessments.length >= 2) {
    const first = basicSkillsAssessments[0];
    const last = basicSkillsAssessments[basicSkillsAssessments.length - 1];

    if (last.score && first.score && last.score > first.score) {
      return true; // Educational functioning level increase
    }
  }

  // Secondary diploma/GED
  if (participant.highestEducation === 'hs-diploma' || participant.highestEducation === 'ged') {
    return true;
  }

  // Postsecondary transcript/report card
  const occupationalAssessments = assessments.filter((a) => a.type === 'occupational-skills');
  if (occupationalAssessments.length > 0) {
    return true;
  }

  return false;
}

/**
 * Generate PIRL (Participant Individual Record Layout) Report
 */
export function generatePIRLReport(
  participant: WIOAParticipant,
  iep: IndividualEmploymentPlan,
  outcome: EmploymentOutcome,
) {
  return {
    // Section A: Participant Information
    participantId: participant.id,
    ssn: participant.ssn,
    firstName: participant.firstName,
    lastName: participant.lastName,
    dateOfBirth: participant.dateOfBirth,

    // Section B: Demographics
    gender: participant.gender,
    race: participant.race,
    ethnicity: participant.ethnicity,
    veteranStatus: participant.veteranStatus,
    disabilityStatus: participant.disabilityStatus,

    // Section C: Program Participation
    programType: participant.programType,
    enrollmentDate: participant.enrollmentDate,
    exitDate: participant.exitDate,
    fundingStream: participant.fundingStream,

    // Section D: Barriers to Employment
    barriers: participant.eligibilityBarriers.map((b) => b.type),

    // Section E: Services Received
    services: iep.plannedServices.map((s) => ({
      type: s.serviceType,
      name: s.serviceName,
      cost: s.cost,
      startDate: s.startDate,
      endDate: s.endDate,
    })),

    // Section F: Outcomes
    employedAtExit: outcome.employedAtExit,
    employed2ndQuarter: outcome.employed2ndQuarter,
    employed4thQuarter: outcome.employed4thQuarter,
    wage2ndQuarter: outcome.wage2ndQuarter,
    wage4thQuarter: outcome.wage4thQuarter,
    credentialAttained: outcome.credentialAttained,
    credentialType: outcome.credentialType,
    measurableSkillsGain: outcome.measurableSkillsGain,
  };
}

/**
 * Calculate WIOA Performance Metrics
 */
export function calculatePerformanceMetrics(
  participants: WIOAParticipant[],
  outcomes: EmploymentOutcome[],
): WIOAPerformanceMetrics {
  const exiters = participants.filter((p) => p.exitDate);
  const employed2nd = outcomes.filter((o) => o.employed2ndQuarter).length;
  const employed4th = outcomes.filter((o) => o.employed4thQuarter).length;
  const credentials = outcomes.filter((o) => o.credentialAttained).length;
  const skillsGains = outcomes.filter((o) => o.measurableSkillsGain).length;

  const wages2nd = outcomes.filter((o) => o.wage2ndQuarter).map((o) => o.wage2ndQuarter!);

  const medianWage =
    wages2nd.length > 0 ? wages2nd.sort((a, b) => a - b)[Math.floor(wages2nd.length / 2)] : 0;

  return {
    programYear: new Date().getFullYear().toString(),
    employmentRate2ndQuarter: exiters.length > 0 ? (employed2nd / exiters.length) * 100 : 0,
    employmentRate4thQuarter: exiters.length > 0 ? (employed4th / exiters.length) * 100 : 0,
    medianEarnings2ndQuarter: medianWage,
    credentialAttainmentRate: exiters.length > 0 ? (credentials / exiters.length) * 100 : 0,
    measurableSkillsGainRate:
      participants.length > 0 ? (skillsGains / participants.length) * 100 : 0,
    totalParticipants: participants.length,
    totalExiters: exiters.length,
    totalEmployed: employed2nd,
    totalCredentials: credentials,
  };
}

/**
 * WRG (Workforce Ready Grant) Eligibility
 */
export interface WRGEligibility {
  eligible: boolean;
  grantAmount: number;
  programType: 'short-term' | 'long-term' | 'apprenticeship';
  requirements: string[];
}

export function determineWRGEligibility(
  participant: WIOAParticipant,
  program: {
    duration: number; // weeks
    credentialType: string;
    inDemandOccupation: boolean;
  },
): WRGEligibility {
  const requirements: string[] = [];
  let eligible = true;
  let grantAmount: number;
  let programType: 'short-term' | 'long-term' | 'apprenticeship';

  // Must be Indiana resident
  requirements.push('Indiana resident');

  // Must be eligible for WIOA or meet income requirements
  if (!participant.eligibilityStatus || participant.eligibilityStatus === 'ineligible') {
    eligible = false;
    requirements.push('Must be WIOA eligible or meet income requirements');
  }

  // Program must lead to credential
  if (!program.credentialType) {
    eligible = false;
    requirements.push('Program must lead to industry-recognized credential');
  }

  // Must be in-demand occupation
  if (!program.inDemandOccupation) {
    eligible = false;
    requirements.push('Must be in high-demand occupation');
  }

  // Determine grant amount based on program length
  if (program.duration <= 12) {
    programType = 'short-term';
    grantAmount = 5000;
  } else if (program.duration <= 52) {
    programType = 'long-term';
    grantAmount = 7500;
  } else {
    programType = 'apprenticeship';
    grantAmount = 5000; // Per year
  }

  return {
    eligible,
    grantAmount,
    programType,
    requirements,
  };
}

/**
 * Apprenticeship Tracking
 */
export interface ApprenticeshipProgram {
  id: string;
  programName: string;
  occupation: string;
  dolRegistrationNumber: string;
  sponsor: string;

  // Requirements
  totalHours: number;
  otjHours: number; // On-the-job training
  rtiHours: number; // Related technical instruction
  duration: number; // months

  // Wage progression
  startingWage: number;
  journeyWorkerWage: number;
  wageSchedule: WageProgression[];

  status: 'active' | 'inactive' | 'pending-approval';
}

export interface WageProgression {
  period: number; // months
  percentage: number; // of journey worker wage
  minimumWage: number;
}

export interface ApprenticeshipEnrollment {
  id: string;
  apprenticeId: string;
  programId: string;
  employerId: string;

  startDate: string;
  expectedCompletionDate: string;
  completionDate?: string;

  // Progress
  otjHoursCompleted: number;
  rtiHoursCompleted: number;
  currentWage: number;

  // Evaluations
  evaluations: ApprenticeshipEvaluation[];

  status: 'active' | 'completed' | 'cancelled' | 'suspended';
}

export interface ApprenticeshipEvaluation {
  date: string;
  evaluatorName: string;
  competenciesAssessed: string[];
  overallRating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
}

/**
 * Calculate apprenticeship completion percentage
 */
export function calculateApprenticeshipProgress(
  enrollment: ApprenticeshipEnrollment,
  program: ApprenticeshipProgram,
): {
  otjProgress: number;
  rtiProgress: number;
  overallProgress: number;
  onTrack: boolean;
} {
  const otjProgress = (enrollment.otjHoursCompleted / program.otjHours) * 100;
  const rtiProgress = (enrollment.rtiHoursCompleted / program.rtiHours) * 100;
  const overallProgress =
    ((enrollment.otjHoursCompleted + enrollment.rtiHoursCompleted) /
      (program.otjHours + program.rtiHours)) *
    100;

  // Check if on track based on time elapsed
  const startDate = new Date(enrollment.startDate);
  const now = new Date();
  const monthsElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const expectedProgress = (monthsElapsed / program.duration) * 100;

  const onTrack = overallProgress >= expectedProgress - 10; // 10% tolerance

  return {
    otjProgress,
    rtiProgress,
    overallProgress,
    onTrack,
  };
}

/**
 * Helper: Calculate age
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Export for DOL reporting
 */
export function exportDOLReport(
  participants: WIOAParticipant[],
  ieps: IndividualEmploymentPlan[],
  outcomes: EmploymentOutcome[],
) {
  return participants
    .map((p) => {
      const iep = ieps.find((i) => i.participantId === p.id);
      const outcome = outcomes.find((o) => o.participantId === p.id);

      if (!iep || !outcome) return null;

      return generatePIRLReport(p, iep, outcome);
    })
    .filter(Boolean);
}
