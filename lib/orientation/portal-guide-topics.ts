type Step = [title: string, instruction: string];
type Guide = { title: string; steps: Step[]; faq: Step[] };

const learner: Guide = {
  title: 'Learner',
  steps: [
    ['Start on your dashboard', 'Review your enrollment and open My Courses to resume your assigned lessons.'],
    ['Plan your week', 'Open Calendar and Assignments to check actual due dates. Open your assigned workbook and save your responses as you go.'],
    ['Check your progress', 'Review completed lessons and assessment results. Recorded online activity and instructor-verified hands-on hours are tracked separately.'],
    ['Review payments and get support', 'Open Payments for receipts or an open invoice when your enrollment gives you access to billing. Use Support for missing access or a blocked lesson.'],
  ],
  faq: [
    ['Where do I see my next assignment?', 'Open Calendar for due dates and Assignments for the full list. Use My Courses to reopen the lesson.'],
    ['Why is my course missing?', 'Check your enrollment status. Contact support with the program name if your assigned course still does not appear.'],
  ],
};

export const portalGuides: Record<string, Guide> = {
  student: learner,
  learner,
  apprentice: {
    title: 'Apprentice',
    steps: [
      ...learner.steps.slice(0, 2),
      ['Record hands-on training', 'Use the timeclock at your assigned training site. Check your hours after clock-out and use the status to see whether they are awaiting supervisor review.'],
      ['Review Appendix A progress', 'Open competencies and related instruction to see recorded evidence. Check with your mentor about practical evidence and with Elevate about sponsor verification.'],
    ],
    faq: [['Do online lessons count as on-the-job hours?', 'No. Follow your program’s related instruction schedule and keep those records separate from hands-on work.']],
  },
  workforce: {
    title: 'WorkOne and workforce',
    steps: [
      ['Start in the right workspace', 'Use WorkOne Student Results if you are a Career Navigator or Regional Lead. Use Workforce Overview if you have access to participant case management.'],
      ['Check your assigned region or caseload', 'If you have multiple regions, select the region before opening a student. In Workforce Overview, use Participants and its status filters.'],
      ['Review a record', 'In WorkOne Student Results, open the student ID to review recorded testing scores, progress, and earned credentials. In Workforce Overview, open a participant to review their enrollment and follow-ups.'],
      ['Use the correct action', 'Download the CSV for the current WorkOne results scope. If your access includes Attachment C, open a student, choose the enrollment, enter the authorization reference, and upload the signed FAA PDF.'],
      ['Follow up securely', 'Check the outcome before leaving the record. Use your approved workflow for case follow-up or a correction. Keep exported records in approved storage.'],
    ],
    faq: [
      ['Why is a participant missing?', 'Check the selected region or caseload. Ask the Elevate administrator to verify the approved assignment if the participant is still missing.'],
      ['What does “None recorded” mean?', 'The portal has no recorded result in that field. Use the case follow-up process to confirm what is outstanding.'],
      ['Who can submit or update an FAA?', 'A Regional Lead with FAA permission for that region can use the Attachment C controls for an eligible enrollment.'],
      ['What does the CSV include?', 'The CSV uses the current region and record filters. Confirm the scope before exporting and handle the file through your approved process.'],
    ],
  },
  host_shop: {
    title: 'Host Shop',
    steps: [
      ['Review shop readiness', 'Open Documents to check whether required files are missing, uploaded for review, or accepted. Open the agreement task for your authorized signer.'],
      ['Open an assigned apprentice', 'Use Apprentices and Programs & Standards for the student’s assigned occupation and syllabus.'],
      ['Record supervised practice', 'Open the Practical Service Log to save observed work for the selected apprentice. Review submitted hours in Hours to Review.'],
    ],
    faq: [['What happens after I upload a document?', 'The document is available for review. Use the document status to check whether it was accepted or needs replacement.']],
  },
  program_holder: {
    title: 'Program Holder',
    steps: [
      ['Review your programs', 'Use Programs to see your assigned delivery scope, syllabus, and course assignments.'],
      ['Review students and deadlines', 'Open Students for learner status and progress. Use Meetings for scheduled appointments and Hours for submitted records.'],
      ['Complete compliance tasks', 'Open Documents and Agreements to check what was received and what still needs action.'],
    ],
    faq: [['Where do I check an agreement?', 'Open Agreements or Sign MOU to review the current record and follow the signature instructions.']],
  },
  administrator: {
    title: 'Admin',
    steps: [
      ['Review what needs attention', 'Start on the Admin dashboard. Open the relevant admissions, learner, or operations queue from the navigation.'],
      ['Check the saved application', 'Open the applicant record, confirm their program and funding path, and check the enrollment status before taking action.'],
      ['Review learner records', 'Use Students or Apprenticeships to see the learner’s progress, documents, and hours. Use preview to inspect the dashboard experience.'],
      ['Verify operations', 'Use Notifications, Email, and billing tools to review saved messages, delivery status, and payments.'],
    ],
    faq: [['When do I approve state-funded enrollment?', 'Verify the funding and required enrollment evidence, then approve the enrollment in Admin.']],
  },
  instructor: {
    title: 'Instructor',
    steps: [
      ['Open your course', 'Open My Courses to view your assigned courses and course materials. Use your syllabus to structure each week.'],
      ['Review learner work', 'Open assignments, submissions, or the gradebook. Review progress and record hands-on evidence through the assigned process.'],
    ],
    faq: [['Why is a course missing?', 'Ask the program coordinator to verify your active instructor assignment for that course.']],
  },
  employer: {
    title: 'Employer',
    steps: [
      ['Review your openings', 'Open your employer dashboard and review the jobs or opportunities assigned to your account.'],
      ['Follow up on referrals', 'Use the relevant applicant or placement view to track next actions and update the records your role can manage.'],
    ],
    faq: [['Where do I get help with an applicant?', 'Use the communication tools in your portal to contact the team responsible for the referral.']],
  },
  admin: {
    title: 'Administration',
    steps: [['Review your queues', 'Open Admissions, Students, and Notifications to follow pending work and verify saved records.']],
    faq: [['Where do I review student activity?', 'Open the student record and review the available progress and attendance views.']],
  },
  staff: {
    title: 'Staff',
    steps: [['Check your work today', 'Open the staff dashboard, then review assigned tools and attendance work in the menu.']],
    faq: [['Why is a tool missing?', 'Contact your supervisor to verify your staff assignment.']],
  },
  case_manager: {
    title: 'Case Manager',
    steps: [['Check your caseload', 'Open Participants and review the enrollment, follow-ups, and approved supportive services for the selected participant.']],
    faq: [['Why is a participant missing?', 'Ask the portal administrator to confirm your case assignment.']],
  },
  workforce_board: {
    title: 'Workforce Board',
    steps: [['Review workforce outcomes', 'Use the dashboard and reporting menu to review the outcomes available to your organization.']],
    faq: [['How do I check the reporting scope?', 'Review the organization and program filters before exporting results.']],
  },
  provider: {
    title: 'Provider',
    steps: [['Open your assigned programs', 'Use the provider dashboard to review your assigned program and its available records.']],
    faq: [['Where do I ask about access?', 'Contact your program coordinator with the name of the program you are assigned to.']],
  },
  creator: {
    title: 'Creator Studio',
    steps: [['Open your project', 'Use the Creator dashboard to find your project. Review its preview before publishing.']],
    faq: [['Where do I continue drafting?', 'Open the existing project from your dashboard.']],
  },
  parent: {
    title: 'Parent',
    steps: [['Open your linked student', 'Use your portal to view the records your account is authorized to see.']],
    faq: [['Why is a record missing?', 'Ask learner support to verify your linked account and consent.']],
  },
  testing: {
    title: 'Testing Center',
    steps: [['Review your test records', 'Use the testing dashboard menu to open the appointment or exam record you need.']],
    faq: [['Where do I check an appointment?', 'Open the booking confirmation or contact the testing center if you cannot find it.']],
  },
};
