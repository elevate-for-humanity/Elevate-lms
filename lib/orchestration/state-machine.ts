/**
 * UNIVERSAL STATE MACHINE
 *
 * This is the orchestration layer that makes dashboards act like staff.
 *
 * Rules:
 * - State determines visibility
 * - Progression is enforced
 * - One dominant action per state
 * - Locked sections until prerequisites met
 */

// ============================================================================
// STUDENT STATES
// ============================================================================

export type StudentState =
  | 'not_onboarded'
  | 'onboarded_not_eligible'
  | 'eligible_not_enrolled'
  | 'enrolled_not_active'
  | 'active'
  | 'completed_not_certified'
  | 'certified_not_placed'
  | 'placed';

export interface StudentStateData {
  state: StudentState;
  dominantAction: {
    label: string;
    href: string;
    description: string;
  };
  availableSections: string[];
  lockedSections: Array<{
    id: string;
    label: string;
    reason: string;
  }>;
  progressPercentage: number;
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

export function getStudentState(data: {
  hasCompletedOrientation: boolean;
  isEligibilityVerified: boolean;
  hasActiveEnrollment: boolean;
  enrollmentStatus?: string;
  courseProgress?: number;
  hasCertification: boolean;
  hasJobPlacement: boolean;
}): StudentStateData {
  // State 1: Not Onboarded
  if (!data.hasCompletedOrientation) {
    return {
      state: 'not_onboarded',
      dominantAction: {
        label: 'Complete Orientation',
        href: '/lms/orientation',
        description: 'Required before accessing programs',
      },
      availableSections: ['orientation'],
      lockedSections: [
        {
          id: 'programs',
          label: 'Browse Programs',
          reason: 'Complete orientation first',
        },
        {
          id: 'funding',
          label: 'Apply for Funding',
          reason: 'Complete orientation first',
        },
        {
          id: 'courses',
          label: 'My Courses',
          reason: 'Complete orientation first',
        },
        {
          id: 'certificates',
          label: 'Certificates',
          reason: 'Complete orientation first',
        },
        {
          id: 'placement',
          label: 'Job Placement',
          reason: 'Complete orientation first',
        },
      ],
      progressPercentage: 0,
      alerts: [
        {
          type: 'warning',
          message: 'Complete orientation to unlock all features',
        },
      ],
    };
  }

  // State 2: Onboarded, Not Eligible
  if (!data.isEligibilityVerified) {
    return {
      state: 'onboarded_not_eligible',
      dominantAction: {
        label: 'Verify Eligibility',
        href: '/lms/eligibility',
        description: 'Check if you qualify for free training',
      },
      availableSections: ['orientation', 'eligibility', 'programs-view'],
      lockedSections: [
        {
          id: 'enroll',
          label: 'Enroll in Programs',
          reason: 'Verify eligibility first',
        },
        {
          id: 'funding',
          label: 'Apply for Funding',
          reason: 'Verify eligibility first',
        },
        {
          id: 'courses',
          label: 'My Courses',
          reason: 'Enroll in a program first',
        },
        {
          id: 'certificates',
          label: 'Certificates',
          reason: 'Complete courses first',
        },
        {
          id: 'placement',
          label: 'Job Placement',
          reason: 'Earn certification first',
        },
      ],
      progressPercentage: 15,
      alerts: [
        {
          type: 'info',
          message: 'Verify eligibility to apply for programs',
        },
      ],
    };
  }

  // State 3: Eligible, Not Enrolled
  if (!data.hasActiveEnrollment) {
    return {
      state: 'eligible_not_enrolled',
      dominantAction: {
        label: 'Choose Your Program',
        href: '/programs',
        description: 'Browse 20+ training programs',
      },
      availableSections: ['orientation', 'eligibility', 'programs', 'funding'],
      lockedSections: [
        {
          id: 'courses',
          label: 'My Courses',
          reason: 'Enroll in a program first',
        },
        {
          id: 'certificates',
          label: 'Certificates',
          reason: 'Complete courses first',
        },
        {
          id: 'placement',
          label: 'Job Placement',
          reason: 'Earn certification first',
        },
      ],
      progressPercentage: 30,
      alerts: [
        {
          type: 'info',
          message: 'You qualify for free training! Choose a program to begin.',
        },
      ],
    };
  }

  // State 4: Enrolled, Not Active
  if (data.enrollmentStatus === 'pending') {
    return {
      state: 'enrolled_not_active',
      dominantAction: {
        label: 'Complete Prerequisites',
        href: '/lms/prerequisites',
        description: 'Finish required setup to start coursework',
      },
      availableSections: ['orientation', 'eligibility', 'programs', 'funding', 'prerequisites'],
      lockedSections: [
        {
          id: 'courses',
          label: 'My Courses',
          reason: 'Complete prerequisites first',
        },
        {
          id: 'certificates',
          label: 'Certificates',
          reason: 'Complete courses first',
        },
        {
          id: 'placement',
          label: 'Job Placement',
          reason: 'Earn certification first',
        },
      ],
      progressPercentage: 45,
      alerts: [
        {
          type: 'warning',
          message: 'Complete prerequisites to start coursework',
        },
      ],
    };
  }

  // State 5: Active (In Progress)
  if (data.enrollmentStatus === 'active' && !data.hasCertification) {
    const courseProgress = data.courseProgress || 0;
    return {
      state: 'active',
      dominantAction: {
        label: 'Continue Learning',
        href: '/lms/courses',
        description: `You're ${courseProgress}% complete`,
      },
      availableSections: ['orientation', 'programs', 'courses', 'progress', 'support'],
      lockedSections: [
        {
          id: 'certification',
          label: 'Certification Exam',
          reason: `Complete coursework (${courseProgress}% done)`,
        },
        {
          id: 'placement',
          label: 'Job Placement',
          reason: 'Earn certification first',
        },
      ],
      progressPercentage: 50 + courseProgress * 0.3, // 50-80%
      alerts:
        courseProgress < 50
          ? [
              {
                type: 'info',
                message: "Keep going! You're making progress.",
              },
            ]
          : [
              {
                type: 'info',
                message: "You're over halfway there!",
              },
            ],
    };
  }

  // State 6: Completed, Not Certified
  if (data.enrollmentStatus === 'completed' && !data.hasCertification) {
    return {
      state: 'completed_not_certified',
      dominantAction: {
        label: 'Schedule Certification Exam',
        href: '/lms/certification',
        description: 'Final step to earn your credential',
      },
      availableSections: ['orientation', 'programs', 'courses', 'certification', 'support'],
      lockedSections: [
        {
          id: 'placement',
          label: 'Job Placement',
          reason: 'Pass certification exam first',
        },
      ],
      progressPercentage: 85,
      alerts: [
        {
          type: 'warning',
          message: 'Schedule your certification exam to complete your training',
        },
      ],
    };
  }

  // State 7: Certified, Not Placed
  if (data.hasCertification && !data.hasJobPlacement) {
    return {
      state: 'certified_not_placed',
      dominantAction: {
        label: 'Find Employment',
        href: '/lms/placement',
        description: 'Connect with employers hiring in your field',
      },
      availableSections: [
        'orientation',
        'programs',
        'courses',
        'certificates',
        'placement',
        'support',
      ],
      lockedSections: [],
      progressPercentage: 95,
      alerts: [
        {
          type: 'info',
          message: "Congratulations on earning your certification! Let's find you a job.",
        },
      ],
    };
  }

  // State 8: Placed (Success)
  return {
    state: 'placed',
    dominantAction: {
      label: 'View Your Success Story',
      href: '/lms/success',
      description: 'You did it! Share your journey.',
    },
    availableSections: [
      'orientation',
      'programs',
      'courses',
      'certificates',
      'placement',
      'support',
      'alumni',
    ],
    lockedSections: [],
    progressPercentage: 100,
    alerts: [
      {
        type: 'info',
        message: "Congratulations! You've completed your journey from training to employment.",
      },
    ],
  };
}

// ============================================================================
// PROGRAM HOLDER STATES
// ============================================================================

export type ProgramHolderState =
  | 'not_verified'
  | 'verified_no_students'
  | 'active_compliant'
  | 'active_at_risk'
  | 'active_non_compliant';

export interface ProgramHolderStateData {
  state: ProgramHolderState;
  dominantAction: {
    label: string;
    href: string;
    description: string;
  };
  availableSections: string[];
  lockedSections: Array<{
    id: string;
    label: string;
    reason: string;
  }>;
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    actionLabel?: string;
    actionHref?: string;
  }>;
  metrics: {
    activeStudents: number;
    atRiskStudents: number;
    pendingVerifications: number;
    overdueReports: number;
  };
}

export function getProgramHolderState(data: {
  isVerified: boolean;
  activeStudents: number;
  atRiskStudents: number;
  pendingVerifications: number;
  overdueReports: number;
  complianceScore: number;
}): ProgramHolderStateData {
  // State 1: Not Verified
  if (!data.isVerified) {
    return {
      state: 'not_verified',
      dominantAction: {
        label: 'Complete Verification',
        href: '/program-holder/verification',
        description: 'Required before accepting students',
      },
      availableSections: ['verification', 'documentation'],
      lockedSections: [
        {
          id: 'students',
          label: 'Manage Students',
          reason: 'Complete verification first',
        },
        {
          id: 'reports',
          label: 'Submit Reports',
          reason: 'Complete verification first',
        },
        {
          id: 'compliance',
          label: 'Compliance Dashboard',
          reason: 'Complete verification first',
        },
      ],
      alerts: [
        {
          type: 'error',
          message: 'Verification required to accept students',
          actionLabel: 'Start Verification',
          actionHref: '/program-holder/verification',
        },
      ],
      metrics: {
        activeStudents: 0,
        atRiskStudents: 0,
        pendingVerifications: 0,
        overdueReports: 0,
      },
    };
  }

  // State 2: Verified, No Students
  if (data.activeStudents === 0) {
    return {
      state: 'verified_no_students',
      dominantAction: {
        label: 'Accept Your First Student',
        href: '/program-holder/students/pending',
        description: 'Review pending student applications',
      },
      availableSections: ['verification', 'documentation', 'students', 'training'],
      lockedSections: [
        {
          id: 'reports',
          label: 'Submit Reports',
          reason: 'No active students yet',
        },
        {
          id: 'compliance',
          label: 'Compliance Dashboard',
          reason: 'No active students yet',
        },
      ],
      alerts: [
        {
          type: 'info',
          message: "You're verified! Ready to accept students.",
        },
      ],
      metrics: {
        activeStudents: 0,
        atRiskStudents: 0,
        pendingVerifications: 0,
        overdueReports: 0,
      },
    };
  }

  // State 3: Active, Non-Compliant (CRITICAL)
  if (data.overdueReports > 0 || data.complianceScore < 70) {
    return {
      state: 'active_non_compliant',
      dominantAction: {
        label: 'Fix Compliance Issues',
        href: '/program-holder/compliance',
        description: 'URGENT: Address overdue requirements',
      },
      availableSections: ['students', 'reports', 'compliance', 'documentation', 'support'],
      lockedSections: [],
      alerts: [
        {
          type: 'error',
          message: `${data.overdueReports} overdue report${data.overdueReports > 1 ? 's' : ''}. Immediate action required.`,
          actionLabel: 'View Reports',
          actionHref: '/program-holder/reports',
        },
        {
          type: 'error',
          message: `Compliance score: ${data.complianceScore}%. Must be above 70%.`,
          actionLabel: 'Fix Issues',
          actionHref: '/program-holder/compliance',
        },
      ],
      metrics: {
        activeStudents: data.activeStudents,
        atRiskStudents: data.atRiskStudents,
        pendingVerifications: data.pendingVerifications,
        overdueReports: data.overdueReports,
      },
    };
  }

  // State 4: Active, At Risk
  if (data.atRiskStudents > 0 || data.pendingVerifications > 5) {
    return {
      state: 'active_at_risk',
      dominantAction: {
        label: 'Address At-Risk Students',
        href: '/program-holder/students/at-risk',
        description: `${data.atRiskStudents} student${data.atRiskStudents > 1 ? 's' : ''} need attention`,
      },
      availableSections: ['students', 'reports', 'compliance', 'documentation', 'support'],
      lockedSections: [],
      alerts: [
        {
          type: 'warning',
          message: `${data.atRiskStudents} student${data.atRiskStudents > 1 ? 's are' : ' is'} at risk of dropping out`,
          actionLabel: 'View Students',
          actionHref: '/program-holder/students/at-risk',
        },
        ...(data.pendingVerifications > 5
          ? [
              {
                type: 'warning' as const,
                message: `${data.pendingVerifications} verifications pending`,
                actionLabel: 'Review',
                actionHref: '/program-holder/verification',
              },
            ]
          : []),
      ],
      metrics: {
        activeStudents: data.activeStudents,
        atRiskStudents: data.atRiskStudents,
        pendingVerifications: data.pendingVerifications,
        overdueReports: data.overdueReports,
      },
    };
  }

  // State 5: Active, Compliant (GOOD)
  return {
    state: 'active_compliant',
    dominantAction: {
      label: 'Manage Students',
      href: '/program-holder/students',
      description: `${data.activeStudents} active student${data.activeStudents > 1 ? 's' : ''}`,
    },
    availableSections: [
      'students',
      'reports',
      'compliance',
      'documentation',
      'support',
      'training',
    ],
    lockedSections: [],
    alerts:
      data.pendingVerifications > 0
        ? [
            {
              type: 'info',
              message: `${data.pendingVerifications} verification${data.pendingVerifications > 1 ? 's' : ''} pending review`,
              actionLabel: 'Review',
              actionHref: '/program-holder/verification',
            },
          ]
        : [
            {
              type: 'info',
              message: 'All systems operational. Great work!',
            },
          ],
    metrics: {
      activeStudents: data.activeStudents,
      atRiskStudents: data.atRiskStudents,
      pendingVerifications: data.pendingVerifications,
      overdueReports: data.overdueReports,
    },
  };
}

// ============================================================================
// EMPLOYER STATES
// ============================================================================

export type EmployerState =
  | 'not_verified'
  | 'verified_no_postings'
  | 'active_hiring'
  | 'active_apprenticeship';

export interface EmployerStateData {
  state: EmployerState;
  dominantAction: {
    label: string;
    href: string;
    description: string;
  };
  availableSections: string[];
  lockedSections: Array<{
    id: string;
    label: string;
    reason: string;
  }>;
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

export function getEmployerState(data: {
  isVerified: boolean;
  activePostings: number;
  hasApprenticeshipProgram: boolean;
  pendingApplications: number;
}): EmployerStateData {
  if (!data.isVerified) {
    return {
      state: 'not_verified',
      dominantAction: {
        label: 'Complete Company Verification',
        href: '/employer/verification',
        description: 'Required before posting jobs',
      },
      availableSections: ['verification'],
      lockedSections: [
        {
          id: 'postings',
          label: 'Post Jobs',
          reason: 'Complete verification first',
        },
        {
          id: 'candidates',
          label: 'View Candidates',
          reason: 'Complete verification first',
        },
        {
          id: 'apprenticeship',
          label: 'Apprenticeship Program',
          reason: 'Complete verification first',
        },
      ],
      alerts: [
        {
          type: 'warning',
          message: 'Complete verification to access hiring tools',
        },
      ],
    };
  }

  if (data.activePostings === 0 && !data.hasApprenticeshipProgram) {
    return {
      state: 'verified_no_postings',
      dominantAction: {
        label: 'Post Your First Job',
        href: '/employer/postings/new',
        description: 'Connect with trained candidates',
      },
      availableSections: ['verification', 'postings', 'candidates', 'apprenticeship'],
      lockedSections: [],
      alerts: [
        {
          type: 'info',
          message: 'Post a job or start an apprenticeship program',
        },
      ],
    };
  }

  if (data.hasApprenticeshipProgram) {
    return {
      state: 'active_apprenticeship',
      dominantAction: {
        label: 'Manage Apprentices',
        href: '/employer/apprenticeship',
        description: 'Track progress and compliance',
      },
      availableSections: [
        'verification',
        'postings',
        'candidates',
        'apprenticeship',
        'compliance',
        'reports',
      ],
      lockedSections: [],
      alerts:
        data.pendingApplications > 0
          ? [
              {
                type: 'info',
                message: `${data.pendingApplications} new application${data.pendingApplications > 1 ? 's' : ''}`,
              },
            ]
          : [],
    };
  }

  return {
    state: 'active_hiring',
    dominantAction: {
      label: 'Review Applications',
      href: '/employer/applications',
      description: `${data.pendingApplications} pending`,
    },
    availableSections: ['verification', 'postings', 'candidates', 'apprenticeship'],
    lockedSections: [],
    alerts:
      data.pendingApplications > 0
        ? [
            {
              type: 'info',
              message: `${data.pendingApplications} new application${data.pendingApplications > 1 ? 's' : ''}`,
            },
          ]
        : [],
  };
}
