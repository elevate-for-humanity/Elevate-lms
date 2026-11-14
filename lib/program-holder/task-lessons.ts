/** Route-specific orientation content. These lessons never mutate work records. */
export type HolderTaskLesson = {
  path: string;
  title: string;
  image: string;
  imageAlt: string;
  scenes?: [string, string, string];
  assignment: string;
  steps: [string, string, string];
  check: string;
};

export const holderTaskLessons: HolderTaskLesson[] = [
  {
    path: 'gary-launch',
    title: 'IMPACT partnership meeting',
    image: 'business-meeting.webp',
    imageAlt: 'Workforce partners discussing training and referrals',
    assignment: 'Introduce Elevate and leave with the local partnership setup steps.',
    steps: [
      'Use the meeting script and Provider Location ID 10001138 for the lookup.',
      'Ask the liaison about eligible courses and local partnership setup requirements.',
      'Record the named contact, required documents and follow-up appointment.',
    ],
    check:
      'Provider-location approval is separate from course approval and participant authorization. Get the local setup checklist and the next meeting date.',
  },
  {
    path: 'handbook',
    title: 'Handbook',
    image: 'orientation-page-1.webp',
    imageAlt: 'Participants reviewing orientation information',
    assignment: 'Review the operating instructions for your current responsibility.',
    steps: [
      'Find the relevant handbook section.',
      'Read its requirements and the assigned program instructions.',
      'Use the matching task tab to complete the required work.',
    ],
    check:
      'The handbook is a reference. Review the current agreement for your actual scope and ask Elevate about conflicts.',
  },
  {
    path: 'airscript',
    title: 'AirScript',
    image: 'office-admin-desk.jpg',
    imageAlt: 'Office workstation for preparing a guided script',
    assignment: 'Prepare and review the script needed for your next interaction.',
    steps: [
      'Open the available script workspace.',
      'Draft instructions using verified program and participant information.',
      'Review the script before using it in a call or meeting.',
    ],
    check:
      'A draft is not a sent message or an official approval. Verify names, requirements and next steps before use.',
  },

  {
    path: 'students/pending',
    title: 'Applicants',
    image: 'career-counseling.jpg',
    imageAlt: 'Career adviser meeting with a participant',
    assignment: 'Contact an assigned applicant and document their next step.',
    steps: [
      'Choose an applicant awaiting contact.',
      'Use Phone or Email to discuss their program and next required step.',
      'Record the contact outcome and next follow-up date.',
    ],
    check:
      'Confirm the saved outcome appears on the correct applicant. Funding approval must come from the responsible agency.',
  },
  {
    path: 'students/at-risk',
    title: 'Student follow-up',
    image: 'student-support-hero.webp',
    imageAlt: 'Student receiving support with their training',
    assignment: 'Help a flagged student resolve their next barrier.',
    steps: [
      'Open the flagged student and review the reason for follow-up.',
      'Contact the student and agree on a specific next action.',
      'Save the barrier, action, responsible person and follow-up date.',
    ],
    check:
      'Confirm the notes are saved. Escalate unresolved access, safety or funding issues to Elevate.',
  },
  {
    path: 'students',
    title: 'Students',
    scenes: ['student-support-page-1.webp', 'career-counseling.jpg', 'student-support-hero.webp'],
    image: 'student-support-page-1.webp',
    imageAlt: 'Learner and adviser reviewing training progress',
    assignment: 'Review a student’s progress and record the next action.',
    steps: [
      'Find an assigned learner by name or email.',
      'Review their dates, course progress and supporting records.',
      'Record the follow-up or request a correction with source evidence.',
    ],
    check:
      'Check the correct student record. A scheduled end date is different from an actual completion date.',
  },
  {
    path: 'hours',
    title: 'Training hours',
    scenes: ['training-cohort.webp', 'instructor-hero.webp', 'office-admin-desk.jpg'],
    image: 'training-cohort.webp',
    imageAlt: 'Participants in a supervised training session',
    assignment: 'Record actual training or review a submitted hour entry.',
    steps: [
      'Select the assigned student and program.',
      'Enter actual dates, hours, activities and supporting details.',
      'Submit the entry, or verify a submitted entry against its evidence.',
    ],
    check: 'Check the saved history and review status. Submission is separate from verification.',
  },
  {
    path: 'programs',
    title: 'Programs and courses',
    image: 'instructor-hero.webp',
    imageAlt: 'Instructor supporting a classroom training session',
    assignment: 'Open the assigned course and identify the learner’s next lesson.',
    steps: [
      'Choose a program assigned to your organization.',
      'Open its curriculum, course assignment and requirements.',
      'Confirm the learner can locate the next lesson and required work.',
    ],
    check:
      'Use only the assigned program curriculum. Report a missing course or access issue before instruction is affected.',
  },
  {
    path: 'documents',
    title: 'Documents',
    scenes: ['office-admin-desk.jpg', 'programs-admin-signmou-hero.jpg', 'programs-admin-signmou-hero.jpg'],
    image: 'office-admin-desk.jpg',
    imageAlt: 'Organized office workspace for reviewing records',
    assignment: 'Submit or correct a requested document.',
    steps: [
      'Read the requested document type and any correction notes.',
      'Upload the current document in its protected form.',
      'Confirm it appears with the correct document type and review status.',
    ],
    check:
      'Pending review is not approval. Do not repeatedly upload a file that is already awaiting review.',
  },
  {
    path: 'compliance',
    title: 'Compliance',
    image: 'programs-admin-signmou-hero.jpg',
    imageAlt: 'Compliance and training records review',
    assignment: 'Resolve the next incomplete compliance requirement.',
    steps: [
      'Read the incomplete requirement and its owner.',
      'Provide the requested record or complete its assigned action.',
      'Review the saved status and route unresolved items to Elevate.',
    ],
    check:
      'Keep submitted, approved and missing records distinct. Do not mark another party’s action complete.',
  },
  {
    path: 'reports',
    title: 'Progress reports',
    scenes: [
      'student-support-page-1.webp',
      'office-admin-desk.jpg',
      'calendar-hero.webp',
    ],
    image: 'calendar-hero.webp',
    imageAlt: 'Instructor reviewing a printed training schedule and records',
    assignment: 'Submit a weekly progress report for an active student.',
    steps: [
      'Choose the active student and reporting period.',
      'Record lessons, attendance, progress, barriers and next-week goals.',
      'Review the evidence, submit and check the submitted report history.',
    ],
    check:
      'Complete a report for each active student each Friday. Record only supported dates, scores and outcomes.',
  },
  {
    path: 'meetings',
    title: 'Calendar and video',
    scenes: ['business-meeting.webp', 'office-admin-desk.jpg', 'business-meeting.webp'],
    image: 'business-meeting.webp',
    imageAlt: 'Professionals meeting around a shared workspace',
    assignment: 'Schedule a meeting and check its saved calendar details.',
    steps: [
      'Review your calendar and choose the student, date and local time.',
      'Choose an available meeting method and save the appointment.',
      'Confirm the saved meeting, invitation status and join details.',
    ],
    check:
      'Use the video room controls to test microphone, camera and screen sharing. A saved appointment does not confirm an invitation was delivered.',
  },
  {
    path: 'phone',
    title: 'Phone',
    image: 'phone-support-coordinator-v2.webp',
    imageAlt: 'Workforce coordinator using a headset for participant phone support',
    assignment: 'Check your extension, microphone and availability before calling.',
    steps: [
      'Confirm your assigned extension and phone connection status.',
      'Check the microphone, speaker and availability controls.',
      'Call the intended participant and document the outcome.',
    ],
    check:
      'A visible dialer is not proof of a working call. Confirm connection status and use the device checks before an appointment.',
  },
  {
    path: 'email',
    title: 'Email',
    image: 'office-admin-desk.jpg',
    imageAlt: 'Office workstation for written participant follow-up',
    assignment: 'Prepare a follow-up to the correct student from your assigned mailbox.',
    steps: [
      'Confirm your assigned From address and open Compose.',
      'Use Choose a student or office contact to add the intended recipient.',
      'Review the recipient, subject and next-step instructions before sending.',
    ],
    check:
      'Confirm the sent conversation. Provider acceptance does not prove delivery or that the recipient read it.',
  },
  {
    path: 'inbox',
    title: 'Office messages',
    image: 'office-admin-desk.jpg',
    imageAlt: 'Office workspace for participant communication',
    assignment: 'Review a message and document the next response.',
    steps: [
      'Open the relevant participant conversation.',
      'Read the latest message and confirm the intended recipient.',
      'Reply with a clear next action and follow-up date.',
    ],
    check:
      'Confirm the saved message. Keep private student information in authorized conversations.',
  },
  {
    path: 'career',
    title: 'Career services',
    image: 'career-services-hero.webp',
    imageAlt: 'Job seeker receiving career services',
    assignment: 'Connect a student with their next career preparation step.',
    steps: [
      'Review the available opportunities and career support.',
      'Help the learner identify a relevant opening or preparation task.',
      'Have the learner use their own account for personal submissions.',
    ],
    check:
      'Confirm the next action with the learner. Do not promise employment or submit personal materials without authority.',
  },
  {
    path: 'community',
    title: 'Community',
    image: 'community-page-2.webp',
    imageAlt: 'Community members learning and connecting',
    assignment: 'Share a useful program update or respond to an appropriate question.',
    steps: [
      'Choose the relevant program discussion.',
      'Prepare a professional update, question or resource.',
      'Review the audience and privacy before posting.',
    ],
    check: 'Keep grades, vouchers, private documents and individual barriers out of public posts.',
  },
  {
    path: 'payouts',
    title: 'Payments and invoices',
    image: 'finance-accounting.webp',
    imageAlt: 'Administrative workspace for financial records',
    assignment: 'Review payment readiness against your signed agreement.',
    steps: [
      'Review the agreement, addendum and applicable payment milestones.',
      'Check required evidence, invoices and payout setup.',
      'Review the actual payment status and request any needed correction.',
    ],
    check:
      'A completed lesson, enrollment or invoice alone does not authorize payment. Authorized Elevate administrators manage releases.',
  },
  {
    path: 'sign-mou',
    title: 'Your agreement',
    image: 'programs-admin-signmou-hero.jpg',
    imageAlt: 'Organized agreement and business document folders',
    assignment: 'Read your assigned terms and sign only when you understand them.',
    steps: [
      'Open the agreement assigned to your organization.',
      'Read responsibilities, scope, payment terms and any addendum.',
      'Use the signature form and confirm the recorded acceptance.',
    ],
    check:
      'Watching PARIS does not sign anything. Your acceptance and Elevate countersignature are separate records.',
  },
  {
    path: 'rights-responsibilities',
    title: 'Your responsibilities',
    image: 'programs-admin-signmou-hero.jpg',
    imageAlt: 'Organized agreement and business document folders',
    assignment: 'Review your role and identify the next required action.',
    steps: [
      'Read your assigned scope and responsibilities.',
      'Review the actual agreement and role-specific training.',
      'Use the relevant task tab to complete outstanding requirements.',
    ],
    check:
      'Your signed agreement controls your scope. Ask Elevate to clarify any missing or conflicting assignment.',
  },
  {
    path: 'settings',
    title: 'Office setup',
    image: 'office-admin-desk.jpg',
    imageAlt: 'Organized professional office workstation',
    assignment: 'Check your profile and communication preferences.',
    steps: [
      'Review your name, contact information and profile image.',
      'Check notification and communication preferences.',
      'Save changes and verify they appear correctly.',
    ],
    check:
      'Use Calendar and video for appointments, Phone for calls, and Email for your mailbox. Device permissions are checked on the device you will use.',
  },
  {
    path: 'how-to-use',
    title: 'Start here',
    image: 'orientation-page-1.webp',
    imageAlt: 'Participants learning how to use their training workspace',
    assignment: 'Choose one tab and complete its first assignment.',
    steps: [
      'Use Home to review only your to-dos and alerts.',
      'Choose the tab for the work you need to do.',
      'Watch that tab’s PARIS lesson, then complete its assignment.',
    ],
    check:
      'Each tab has its own tools. Watching a guide does not change official records or complete an assignment.',
  },
  {
    path: 'verification',
    title: 'Verification',
    image: 'programs-admin-signmou-hero.jpg',
    imageAlt: 'Staff verifying training and organizational records',
    assignment: 'Review the verification request and provide its required evidence.',
    steps: [
      'Read the request and the record it applies to.',
      'Provide the requested evidence through the protected workflow.',
      'Check the review status and any correction notes.',
    ],
    check: 'Submission is not approval. The authorized reviewer makes the verification decision.',
  },
  {
    path: 'documentation',
    title: 'Reference library',
    image: 'office-admin-desk.jpg',
    imageAlt: 'Office records organized for reference',
    assignment: 'Find the reference needed for your current task.',
    steps: [
      'Identify the topic you need help with.',
      'Open the applicable reference or program instructions.',
      'Return to the relevant task tab to do the work.',
    ],
    check:
      'Use the current assigned program and agreement. Ask Elevate about conflicting reference material.',
  },
];

/** Match the most specific tab. Live room and career detail pages keep their own workspace. */
export function getHolderTaskLesson(pathname: string): HolderTaskLesson | undefined {
  const relative = pathname.replace(/^\/program-holder\/?/, '').replace(/\/$/, '');
  return holderTaskLessons.find((lesson) => lesson.path === relative);
}
