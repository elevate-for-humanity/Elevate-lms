import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Enrollment Flow Microcopy
 * Centralized copy for the entire application → enrollment → LMS flow
 *
 * Usage: import { COPY } from '@/lib/copy/enrollment-flow'
 */

export const COPY = {
  // Program Page
  programPage: {
    heroHeadline: 'Welcome to ' + PLATFORM_DEFAULTS.orgName + '',
    heroSubtext:
      "If you're here, you're in the right place. This program is designed to take you from interested to enrolled, then into class with a clear next step at every stage.",
    ctaButton: 'Start Eligibility & Apply',
    ctaSubtext: 'See what you qualify for',
  },

  // Eligibility Screen
  eligibility: {
    header: "Let's match you to the fastest enrollment path.",
    helperText: 'Your answers help route you to funded options if you qualify.',
    description:
      "We're going to ask a few quick questions to match you with the right pathway: funded training (WIOA/WRG/JRI or partner funding), or self-pay / employer-pay. Answer honestly—this doesn't lock you in. It just routes you to the fastest approval path.",
    fundedOption: 'Funded Training',
    fundedDescription: 'WIOA, WRG, JRI, or partner-sponsored',
    selfPayOption: 'Self-Pay / Employer-Pay',
    selfPayDescription: 'Pay directly or through your employer',
    continueButton: 'Continue',
  },

  // Account Creation
  account: {
    header: 'Create your secure student account.',
    description:
      "To protect your application and documents, you'll create a secure account. This lets you save progress, upload required documents, and get status updates without calling or waiting.",
    createButton: 'Create Account',
    loginPrompt: 'Already have an account?',
    loginLink: 'Sign in',
  },

  // Application Form
  application: {
    header: 'Complete Your Application',
    description:
      "Enter your contact information, location, and the program you're applying for. If your training is funded, we'll also ask questions tied to eligibility. If you're self-pay, we'll focus on enrollment and payment options.",
    submitButton: 'Submit Application',
    saveProgress: 'Save & Continue Later',
    requiredNote: '* Required fields',
  },

  // Document Upload
  documents: {
    header: 'Upload required documents to stay on track.',
    description:
      "This step is what keeps your application moving. If any required document is missing, your application cannot be approved yet. Once your uploads are complete, you'll submit your application.",
    uploadButton: 'Upload Document',
    submitButton: 'Submit Application',
    missingWarning: 'Missing required documents will delay your approval.',
  },

  // Confirmation / Status
  confirmation: {
    header: 'Application Received',
    subtext: 'Application received. Next: Review & Enrollment Steps.',
    description:
      "Your application is received and time-stamped. You'll receive an email update. From here, your application moves into review.",
    whatNext: 'What happens next?',
    reviewProcess:
      "One of two things happens: you'll be approved and receive your next step to enroll, or we'll send you a request for any missing items.",
  },

  // Application Status Messages
  status: {
    pending: 'Your application is under review.',
    approved: "You're approved. Complete enrollment to unlock your class.",
    needsInfo: 'We need one more item to continue. Upload the requested document to resume review.',
    enrolled: "You're enrolled! Access your Student Portal to start.",
    denied: "Unfortunately, you don't qualify for this program at this time.",
  },

  // Enrollment Step
  enrollment: {
    fundedHeader: 'Complete Your Enrollment',
    fundedDescription:
      "You'll complete your enrollment agreement and we'll confirm your funding pathway. Once approved, your class access is unlocked.",
    fundedButton: 'Complete Enrollment',

    selfPayHeader: 'Enroll & Pay',
    selfPayDescription:
      "You'll be routed to secure checkout. Once payment is confirmed, the system automatically provisions your access and unlocks your course.",
    selfPayButton: 'Enroll Now (Secure Checkout)',

    employerPayHeader: 'Employer-Sponsored Enrollment',
    employerPayDescription:
      'Your employer will receive an invoice. Once payment is confirmed, your access is unlocked automatically.',
  },

  // Provisioning (behind the scenes messaging)
  provisioning: {
    inProgress: 'Setting up your student access...',
    complete: 'Access unlocked. Go to Student Portal to start.',
    description:
      "Our system creates your student access, assigns your course, and unlocks your learning dashboard. You don't have to wait for someone to manually add you.",
  },

  // LMS Entry
  lms: {
    welcomeHeader: 'Welcome to Your Student Portal',
    welcomeDescription:
      "You're in. From your Student Portal you can start your first lesson, track progress, upload required items, see deadlines and announcements, and complete quizzes and assessments.",
    startButton: 'Start First Lesson',
    dashboardButton: 'Go to Dashboard',
    completionNote:
      'When you complete the course requirements, your completion is recorded and your certificate is issued when applicable.',
  },

  // Support / Troubleshooting
  support: {
    accessIssue: "If you paid and don't see your course within a few minutes, don't repurchase.",
    restoreAccess: "Go to Student Portal → Purchases/Access and click 'Restore Access.'",
    contactSupport:
      "If it still doesn't appear, contact support with your email and we'll resolve it.",
    restoreButton: 'Restore Access',
  },

  // Video Script (30 seconds)
  videoScript: `Ready to start? Click 'Start Eligibility & Apply.' You'll answer a few quick questions so we can route you to funded options if you qualify, or self-pay if you don't. Then you'll create your student account, complete your application, and upload required documents. Once approved, you'll enroll—funded students complete enrollment steps, and self-pay students check out securely. After that, your LMS access is unlocked automatically and you can start class right away.`,
} as const;

/**
 * Program-specific copy overrides
 * Use: const copy = getProgramCopy('barber-apprenticeship')
 */
export const PROGRAM_COPY: Record<string, Partial<Record<keyof typeof COPY.programPage, string>>> = {
  'barber-apprenticeship': {
    heroHeadline: 'Barber Apprenticeship Program',
    heroSubtext:
      'Get licensed, get paid, and build a career in barbering. This program combines hands-on training with classroom instruction to prepare you for your state board exam.',
  },
  hvac: {
    heroHeadline: 'HVAC Technician Training',
    heroSubtext:
      'Learn to install, maintain, and repair heating and cooling systems. High-demand career with excellent earning potential.',
  },
  'tax-prep': {
    heroHeadline: 'Tax Preparation Certification',
    heroSubtext:
      'Become a certified tax preparer and start your own practice or work for an established firm. Flexible schedule, seasonal or year-round.',
  },
  cna: {
    heroHeadline: 'Certified Nursing Assistant Training',
    heroSubtext:
      'Start your healthcare career in weeks, not years. CNAs are in high demand at hospitals, nursing homes, and home health agencies.',
  },
};

export function getProgramCopy(programSlug: string) {
  const override = PROGRAM_COPY[programSlug] || {};
  return {
    ...COPY.programPage,
    ...override,
  };
}

export default COPY;
