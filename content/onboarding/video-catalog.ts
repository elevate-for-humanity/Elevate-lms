/**
 * Onboarding Video Catalog
 * 
 * Defines all required onboarding videos for students, apprentices,
 * testing candidates, and staff.
 */

export type Audience =
  | 'STUDENT'
  | 'APPRENTICE'
  | 'TESTING_CANDIDATE'
  | 'RECRUITER'
  | 'ADMISSIONS'
  | 'INSTRUCTOR'
  | 'PROGRAM_HOLDER'
  | 'HOST_SHOP'
  | 'MENTOR'
  | 'FINANCE'
  | 'COMPLIANCE';

export interface OnboardingVideoDefinition {
  id: string;
  title: string;
  description: string;
  audience: Audience[];
  required: boolean;
  sequence: number;
  estimatedMinutes: number;
  voice: string;
  searchTerms: string[];
  script: string;
  acknowledgmentRequired?: boolean;
}

export const ONBOARDING_VIDEO_CATALOG: OnboardingVideoDefinition[] = [
  // ============================================
  // EVERY STUDENT / APPRENTICE / TESTING CANDIDATE
  // ============================================
  {
    id: 'welcome-to-elevate',
    title: 'Welcome to Elevate for Humanity',
    description: 'Introduces the student to the organization and training experience.',
    audience: ['STUDENT', 'APPRENTICE', 'TESTING_CANDIDATE'],
    required: true,
    sequence: 1,
    estimatedMinutes: 3,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'career training students',
      'adult education classroom',
      'career success',
    ],
    script: `
Welcome to Elevate for Humanity. You have taken an important step toward
building new skills, earning industry-recognized credentials, and moving
toward a sustainable career.


Your dashboard will guide you through onboarding, documents, courses,
appointments, messages, payments, and program requirements.


Complete every item listed in your onboarding checklist. Contact your
admissions representative or instructor when you need assistance.


We are here to help you complete your program, earn your credentials,
and move into employment or advancement.
    `.trim(),
  },
  {
    id: 'dashboard-tour',
    title: 'How to Use Your Dashboard',
    description: 'Explains dashboard navigation and required actions.',
    audience: ['STUDENT', 'APPRENTICE', 'TESTING_CANDIDATE'],
    required: true,
    sequence: 2,
    estimatedMinutes: 4,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'student using laptop',
      'online learning dashboard',
      'career training computer',
    ],
    script: `
Your dashboard is your central workspace.


The Next Action section shows the most important task you need to complete.
The Onboarding section shows required videos, forms, signatures, and
documents. The Courses section opens your learning materials. The Calendar
shows classes, appointments, deadlines, and testing dates.


Use Messages to communicate with admissions, instructors, and support.
Use the Digital Binder to upload and review your documents.


A green status means complete. Yellow means action is still required.
Red means the item is overdue or blocking your progress.
    `.trim(),
  },
  {
    id: 'digital-binder',
    title: 'Using Your Digital Binder',
    description: 'Explains document uploads, reviews, and privacy.',
    audience: ['STUDENT', 'APPRENTICE', 'TESTING_CANDIDATE'],
    required: true,
    sequence: 3,
    estimatedMinutes: 4,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'uploading documents laptop',
      'secure digital documents',
      'student paperwork',
    ],
    script: `
Your Digital Binder stores the records required for your application,
funding, enrollment, training, testing, and completion.


Upload clear and complete files. Make sure all four corners of a document
are visible and the information can be read.


An uploaded document is not automatically approved. Staff may approve it,
reject it, request a clearer copy, or ask for additional information.


Your documents are private. Only authorized staff and partners should have
access based on their assigned role.
    `.trim(),
  },
  {
    id: 'funding-and-payments',
    title: 'Funding and Payment Responsibilities',
    description: 'Explains funding approval and student balances.',
    audience: ['STUDENT', 'APPRENTICE'],
    required: true,
    sequence: 4,
    estimatedMinutes: 5,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'education financial counseling',
      'student financial planning',
      'career training consultation',
    ],
    script: `
Submitting an application for funding does not guarantee approval.


Your dashboard will show whether your funding is being screened, requires
documents, has been submitted, has been approved, or has been denied.


Do not rely on funding until an authorized approval has been recorded.
When funding does not cover the full cost, your account will show the
remaining student balance and available payment options.


Complete all funding requests by their deadlines. A delayed authorization
may delay your enrollment or program start.
    `.trim(),
    acknowledgmentRequired: true,
  },
  {
    id: 'attendance-and-participation',
    title: 'Attendance and Participation',
    description: 'Explains attendance, absences, and progress obligations.',
    audience: ['STUDENT', 'APPRENTICE'],
    required: true,
    sequence: 5,
    estimatedMinutes: 4,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'adult students classroom',
      'career training attendance',
      'vocational classroom',
    ],
    script: `
Regular attendance and active participation are required.


Attend scheduled classes, complete online lessons, submit assignments, and
communicate promptly when an emergency prevents attendance.


Repeated absences, missing assignments, or failure to participate may place
your enrollment, funding, apprenticeship standing, or completion date at risk.


Review your dashboard regularly. Alerts may be created when your attendance
or progress falls below program requirements.
    `.trim(),
    acknowledgmentRequired: true,
  },
  {
    id: 'technology-readiness',
    title: 'Technology Setup and Support',
    description: 'Explains device, browser, email, and support requirements.',
    audience: ['STUDENT', 'APPRENTICE', 'TESTING_CANDIDATE'],
    required: true,
    sequence: 6,
    estimatedMinutes: 4,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'student laptop learning',
      'computer setup education',
      'online class technology',
    ],
    script: `
You need reliable access to your dashboard, email, and course materials.


Use a supported web browser and keep it updated. Confirm that you can sign
in, play videos, upload documents, receive email, and complete assignments.


Never share your password or verification code. Contact technical support
when you cannot access the system. Include the page, time, and error message
when requesting help.
    `.trim(),
  },
  {
    id: 'student-handbook',
    title: 'Student Handbook and Conduct',
    description: 'Explains behavior, integrity, and acknowledgment requirements.',
    audience: ['STUDENT', 'APPRENTICE'],
    required: true,
    sequence: 7,
    estimatedMinutes: 5,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'student handbook',
      'professional classroom conduct',
      'career education orientation',
    ],
    script: `
The Student Handbook explains your rights, responsibilities, attendance
standards, academic expectations, complaint procedures, privacy protections,
and conduct requirements.


Treat students, staff, instructors, employers, mentors, and partners
professionally. Harassment, threats, falsification, cheating, and misuse of
the platform are prohibited.


Watching this video does not replace reading the handbook. You must review
and electronically acknowledge the current handbook before onboarding can
be completed.
    `.trim(),
    acknowledgmentRequired: true,
  },
  {
    id: 'career-services',
    title: 'Career Services and Employment Support',
    description: 'Explains placement support and student responsibilities.',
    audience: ['STUDENT', 'APPRENTICE'],
    required: true,
    sequence: 8,
    estimatedMinutes: 4,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'career counselor student',
      'job interview training',
      'resume career services',
    ],
    script: `
Career services can support resume preparation, interview practice,
credential presentation, job leads, employer connections, and follow-up.


Employment is not guaranteed. You must participate actively, respond to
communications, attend scheduled interviews, maintain accurate contact
information, and meet employer requirements.


Your dashboard will display career-readiness tasks and placement activity.
    `.trim(),
  },
  {
    id: 'credentials-and-certificates',
    title: 'Credentials, Exams, and Certificates',
    description: 'Explains certification process and exam requirements.',
    audience: ['STUDENT', 'APPRENTICE'],
    required: true,
    sequence: 9,
    estimatedMinutes: 5,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'certification exam preparation',
      'professional credentials',
      'career certification',
    ],
    script: `
Your program leads to industry-recognized credentials and certifications.


Understand which exams are required, when they are scheduled, and what you
must do to register and prepare.


Your dashboard tracks credential eligibility, exam dates, results, and
certificates earned.


Failure to meet exam requirements or deadlines may delay your completion.
    `.trim(),
  },
  {
    id: 'graduation-requirements',
    title: 'Graduation and Completion Requirements',
    description: 'Explains requirements for program completion.',
    audience: ['STUDENT', 'APPRENTICE'],
    required: true,
    sequence: 10,
    estimatedMinutes: 4,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'graduation ceremony',
      'program completion',
      'career milestone',
    ],
    script: `
To complete your program, you must meet all academic, attendance, and
financial requirements.


Review your dashboard for outstanding requirements, pending tasks,
and deadlines.


Contact your instructor or advisor if you have questions about what is
required for completion.


Upon completion, you will receive your credential, transcript, and
access to alumni services.
    `.trim(),
  },

  // ============================================
  // APPRENTICE-SPECIFIC
  // ============================================
  {
    id: 'apprenticeship-overview',
    title: 'Understanding Your Apprenticeship',
    description: 'Explains RTI, OJL, competencies, and supervision.',
    audience: ['APPRENTICE'],
    required: true,
    sequence: 11,
    estimatedMinutes: 6,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'barber apprentice training',
      'workplace mentor training',
      'earn while you learn',
    ],
    script: `
A registered apprenticeship combines paid on-the-job learning with related
technical instruction.


OJL is the supervised work experience completed with an approved employer
or host shop. RTI is the classroom or online instruction assigned through
your training program.


You must complete the required hours, competencies, instruction, evaluations,
and documentation. Logging an hour does not automatically approve it. Your
mentor or authorized supervisor must verify submitted hours.


Your dashboard shows completed hours, remaining hours, RTI progress,
competencies, evaluations, and outstanding requirements.
    `.trim(),
    acknowledgmentRequired: true,
  },
  {
    id: 'apprentice-timekeeping',
    title: 'Logging and Verifying Apprentice Hours',
    description: 'Explains time clock and hour approval.',
    audience: ['APPRENTICE', 'MENTOR', 'HOST_SHOP'],
    required: true,
    sequence: 12,
    estimatedMinutes: 5,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'employee time clock',
      'mentor reviewing work',
      'apprentice workplace training',
    ],
    script: `
Clock in only when approved apprenticeship work begins and clock out when it
ends. Select the correct work process or competency for the activity
performed.


Do not enter hours you did not work. Do not allow another person to clock in
or submit time for you.


Submitted hours move to mentor verification. Approved hours count toward
progress. Rejected hours return with a reason and must be corrected when
appropriate.


The system retains an audit trail of entries, edits, approvals, and
rejections.
    `.trim(),
    acknowledgmentRequired: true,
  },
  {
    id: 'host-shop-responsibilities',
    title: 'Host Shop Rules and Responsibilities',
    description: 'Explains host shop obligations and expectations.',
    audience: ['APPRENTICE', 'HOST_SHOP'],
    required: true,
    sequence: 13,
    estimatedMinutes: 5,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'workplace training supervisor',
      'employer mentorship',
      'apprentice supervision',
    ],
    script: `
As a host shop, you agree to provide supervised on-the-job training that
meets program standards.


Provide safe working conditions, assign qualified mentors, and ensure
the apprentice receives training in all required work processes.


Maintain accurate time records and complete mentor verifications promptly.


Report any concerns about apprentice progress, attendance, or conduct to
the program coordinator.
    `.trim(),
    acknowledgmentRequired: true,
  },
  {
    id: 'competency-tracking',
    title: 'How to Track Competencies',
    description: 'Explains competency checklist and verification.',
    audience: ['APPRENTICE', 'MENTOR'],
    required: true,
    sequence: 14,
    estimatedMinutes: 4,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'skills competency checklist',
      'apprentice evaluation',
      'occupational skills training',
    ],
    script: `
Your competency checklist shows every skill required for your occupation.


Work with your mentor to complete each competency. Document the date,
work process, and supervisor verification.


Competencies are verified by your mentor before they count toward
completion.


Your dashboard tracks completed competencies and shows which skills
still need to be demonstrated.
    `.trim(),
  },
  {
    id: 'wage-progression',
    title: 'Apprentice Wage Progression',
    description: 'Explains wage increases and progression requirements.',
    audience: ['APPRENTICE'],
    required: true,
    sequence: 15,
    estimatedMinutes: 3,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'apprentice wage increase',
      'earn while you learn',
      'career advancement',
    ],
    script: `
Registered apprentices earn progressively higher wages as they advance through
the program.


Wage increases are tied to hours completed, competencies verified, and
RTI passed.


Your employer determines wage increase schedules within program guidelines.


Track your progression on your dashboard. Notify your coordinator if
wage issues arise.
    `.trim(),
  },

  // ============================================
  // TESTING CANDIDATE-SPECIFIC
  // ============================================
  {
    id: 'testing-overview',
    title: 'Testing Requirements and Process',
    description: 'Explains testing eligibility and procedures.',
    audience: ['TESTING_CANDIDATE'],
    required: true,
    sequence: 11,
    estimatedMinutes: 5,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'certification exam testing center',
      'professional licensing exam',
      'testing procedures',
    ],
    script: `
Testing candidates complete certification exams through approved testing centers.


Your dashboard shows your testing eligibility, scheduled appointments, and
results.


Arrive early with required identification. Follow all testing center rules.


Results are recorded and credentials are issued upon passing.
    `.trim(),
  },
  {
    id: 'testing-id-requirements',
    title: 'ID Verification Requirements',
    description: 'Explains required identification for testing.',
    audience: ['TESTING_CANDIDATE'],
    required: true,
    sequence: 12,
    estimatedMinutes: 2,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'government issued ID',
      'testing identification',
      'identity verification',
    ],
    script: `
You must present valid government-issued photo identification before testing.


Acceptable forms include a driver's license, state ID, passport, or military
ID.


The name on your ID must match your registration exactly.


Contact the testing coordinator if you have questions about identification
requirements.
    `.trim(),
    acknowledgmentRequired: true,
  },

  // ============================================
  // STAFF AND PARTNER TRAINING
  // ============================================
  {
    id: 'recruiter-training',
    title: 'Recruiter Dashboard Training',
    description: 'Training for admissions recruiters on the platform.',
    audience: ['RECRUITER', 'ADMISSIONS'],
    required: true,
    sequence: 1,
    estimatedMinutes: 15,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'admissions training',
      'recruitment software',
      'applicant tracking',
    ],
    script: `
This training covers the recruiter dashboard, lead management, and
application review workflows.


Learn how to review applications, request documents, communicate with
applicants, and track recruitment metrics.


Follow all compliance procedures and documentation requirements.


Contact your supervisor with questions about recruitment policies.
    `.trim(),
  },
  {
    id: 'instructor-training',
    title: 'Instructor Dashboard Training',
    description: 'Training for instructors on the platform.',
    audience: ['INSTRUCTOR'],
    required: true,
    sequence: 1,
    estimatedMinutes: 20,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'instructor training',
      'teaching platform',
      'student management',
    ],
    script: `
This training covers the instructor dashboard, course management, and
student engagement tools.


Learn how to create lessons, track attendance, grade assignments, and
communicate with students.


Follow all academic policies and documentation requirements.


Contact your program coordinator with questions about instructional policies.
    `.trim(),
  },
  {
    id: 'host-shop-dashboard-training',
    title: 'Host Shop Dashboard Training',
    description: 'Training for host shop supervisors on the platform.',
    audience: ['HOST_SHOP'],
    required: true,
    sequence: 1,
    estimatedMinutes: 15,
    voice: 'en-US-GuyNeural',
    searchTerms: [
      'employer apprenticeship portal',
      'supervisor training',
      'workplace training management',
    ],
    script: `
This training covers the host shop dashboard, apprentice management, and
time verification workflows.


Learn how to verify apprentice hours, complete evaluations, and track
competency progress.


Follow all apprenticeship program requirements and reporting deadlines.


Contact your program coordinator with questions about apprenticeship policies.
    `.trim(),
  },
  {
    id: 'mentor-verification-training',
    title: 'Mentor Verification Training',
    description: 'Training for apprenticeship mentors on verification.',
    audience: ['MENTOR'],
    required: true,
    sequence: 1,
    estimatedMinutes: 10,
    voice: 'en-US-JennyNeural',
    searchTerms: [
      'mentor training',
      'apprentice supervision',
      'skill verification',
    ],
    script: `
This training covers mentor verification requirements and procedures.


Learn how to review and approve apprentice hour logs, evaluate competencies,
and provide constructive feedback.


Accurate and timely verification is essential for apprentice progression.


Contact your supervisor with questions about verification policies.
    `.trim(),
    acknowledgmentRequired: true,
  },
];

/**
 * Get videos for a specific audience
 */
export function getVideosForAudience(audience: Audience): OnboardingVideoDefinition[] {
  return ONBOARDING_VIDEO_CATALOG
    .filter(video => video.audience.includes(audience))
    .sort((a, b) => a.sequence - b.sequence);
}

/**
 * Get total estimated time for audience onboarding
 */
export function getTotalOnboardingTime(audience: Audience): number {
  return getVideosForAudience(audience)
    .filter(video => video.required)
    .reduce((total, video) => total + video.estimatedMinutes, 0);
}

/**
 * Get video by ID
 */
export function getVideoById(id: string): OnboardingVideoDefinition | undefined {
  return ONBOARDING_VIDEO_CATALOG.find(video => video.id === id);
}
