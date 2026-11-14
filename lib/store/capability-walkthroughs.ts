export type WorkflowSlide = { title: string; action: string; record: string; result: string };

// Illustrative workflow states, never customer records or live execution claims.
const workflows: Record<string, [string, string, string][]> = {
  website_builder: [['Describe the business', 'Request a three-page cleaning company website.', 'Business brief → draft pages'], ['Review and edit', 'Change the hero and add a booking call to action.', 'Draft → reviewed preview'], ['Save and publish', 'Save your changes, review mobile layout, then publish in your workspace.', 'Saved draft → published site']],
  crm: [['Capture a lead', 'Add Sample Cleaning Co. and a request for a quote.', 'New inquiry'], ['Qualify the opportunity', 'Assign an owner and record the next follow-up.', 'Qualified → follow-up assigned'], ['Track the result', 'Move the opportunity as the sales conversation progresses.', 'Pipeline stage → activity history']],
  booking: [['Set availability', 'Choose the service, appointment duration and available hours.', 'Consultation · 30 minutes'], ['Choose a time', 'A visitor selects an available appointment.', 'Selected slot → booking request'], ['Review the calendar', 'Review the appointment and any changes in the calendar.', 'Appointment record']],
  forms: [['Choose intake fields', 'Collect the information needed for an inquiry.', 'Name · service · message'], ['Submit an inquiry', 'Complete the intake form with sample information.', 'Submitted form'], ['Review the record', 'Find the submission and assign a follow-up.', 'Intake → accountable next step']],
  email_marketing: [['Choose an audience', 'Select contacts who can receive your campaign.', 'Audience → campaign draft'], ['Review the message', 'Check content, links and recipients before sending.', 'Draft → reviewed email'], ['Track delivery', 'Review provider delivery results and failures.', 'Delivery status → follow-up']],
  sms: [['Prepare a reminder', 'Select an opted-in contact and write a reminder.', 'Consented recipient → draft'], ['Check the message', 'Review timing and content before sending.', 'Approved reminder'], ['Review delivery', 'Check the messaging provider result; carrier fees and policies apply.', 'Sent or failed → recorded status']],
  invoicing: [['Choose the purchase', 'Review the product, amount and billing period.', 'Selected offer → invoice'], ['Pay securely', 'Open the provider payment link and complete payment.', 'Open invoice → provider payment'], ['Verify access', 'Confirmed payment activates the purchased entitlement.', 'Paid → delivery status']],
  sam_gov_manager: [['Create an entity record', 'Record business details and existing UEI/CAGE information when available.', 'Sample Business LLC · preparation'], ['Organize documents', 'Associate supporting documents and review stored alerts.', 'Entity → documents and reminders'], ['Continue on SAM.gov', 'Complete official registration or renewal on SAM.gov; Elevate cannot issue federal approval.', 'Prepared record → official process']],
  grants_discovery: [['Find opportunities', 'Review grant opportunities relevant to the organization.', 'Opportunity list'], ['Save a grant', 'Keep an opportunity with its deadline and eligibility requirements.', 'Saved opportunity → deadline'], ['Manage the application', 'Track preparation and progress; an award is not guaranteed.', 'Saved grant → application workflow']],
  course_builder: [['Plan the course', 'Describe the audience and learning outcomes.', 'Brief → course outline'], ['Build lessons', 'Generate and review lessons, media and assessments within your credit allowance.', 'Outline → reviewed lessons'], ['Publish and deliver', 'Publish completed content and verify learner access.', 'Reviewed course → LMS delivery']],
  course_factory: [['Define the program', 'Choose the intended audience and outcomes.', 'Program brief'], ['Review generated content', 'Review every lesson, assessment and media output before release.', 'Generation → reviewed content'], ['Deliver learning', 'Publish completed content and check learner progress.', 'Published course → progress record']],
  lms: [['Open learning', 'An enrolled learner opens an assigned course.', 'Assigned course'], ['Complete a lesson', 'Read or watch the lesson and complete its assessment.', 'Lesson → assessment result'], ['Review progress', 'View recorded completion and credential requirements.', 'Progress → completion status']],
  student_management: [['Review enrollment', 'Open a learner record and confirm the assigned program.', 'Sample Learner · enrollment'], ['Record attendance', 'Review attendance and progress information.', 'Attendance → progress record'], ['Review transcript', 'Check completed learning and transcript entries.', 'Learner → transcript']],
  testing_center: [['Choose an exam', 'Review the exam and available scheduling options.', 'Exam selection'], ['Schedule testing', 'Confirm the testing appointment and applicable payment.', 'Exam → appointment'], ['Track credentials', 'Review recorded results and credential status.', 'Testing record → credential']],
  workforce: [['Open a participant', 'Review the participant program and case record.', 'Sample Participant · program'], ['Record services', 'Document services, case notes and progress.', 'Service → case history'], ['Review outcomes', 'Review recorded outcomes and reporting requirements.', 'Case history → outcome report']],
  apprenticeship: [['Set up the apprenticeship', 'Review the apprentice, employer and program requirements.', 'Sample Apprentice · host employer'], ['Review hours', 'Record and verify OJT and related instruction hours.', 'Submitted hours → verification'], ['Track completion', 'Review competencies and progress against program requirements.', 'Verified hours → progress']],
  employer_portal: [['Post a role', 'Enter the role and hiring requirements.', 'Sample employer · open role'], ['Review applicants', 'Review candidate records and interview next steps.', 'Applicants → interview'], ['Track requests', 'Follow the status of workforce and hiring requests.', 'Employer request → status']],
  compliance: [['Choose a record', 'Review the applicable program and evidence requirements.', 'Program → checklist'], ['Review evidence', 'Check documents and identify missing information.', 'Evidence → review findings'], ['Resolve findings', 'Assign corrective work and retain its history.', 'Finding → accountable resolution']],
};
const assistants: Record<string, [string, string, string]> = {
  ai_paris: ['Sales and intake', 'Ask what a new customer needs and collect relevant intake details.', 'Inquiry → qualified next step'],
  ai_ellie: ['Learning and support', 'Ask for help locating a course or understanding an enrollment step.', 'Learner question → guidance'],
  ai_lizzy: ['Operations', 'Ask for help reviewing a document or administrative queue.', 'Operations request → proposed next action'],
  ai_zora: ['Compliance', 'Ask for a review of a sample checklist and missing evidence.', 'Checklist → review findings'],
  ai_orchestrator: ['Task routing', 'Describe work that requires more than one specialist assistant.', 'Request → specialist routing'],
};
export function capabilityWalkthrough(key: string, name: string): WorkflowSlide[] {
  const assistant = assistants[key];
  const rows = workflows[key] || (assistant ? [
    ['Describe the request', assistant[1], `${assistant[0]} · sample request`],
    ['Review the response', 'Check the assistant response against your source information before acting.', assistant[2]],
    ['Choose the next action', 'Review proposed actions and confirm the result in your workspace. Voice and provider availability depend on configuration.', 'Reviewed response → next step'],
  ] : [
    ['Choose the task', `Open ${name} and select the work you want to perform.`, 'Sample workspace · selected task'],
    ['Review the proposed changes', 'Review inputs, permissions and applicable usage limits before continuing.', 'Inputs → reviewed action'],
    ['Verify the outcome', 'Confirm the resulting record and status in your workspace before relying on it.', 'Action → recorded result'],
  ]);
  return rows.map(([title, action, result], index) => ({ title, action, record: `${name} · sample ${index + 1}`, result }));
}
