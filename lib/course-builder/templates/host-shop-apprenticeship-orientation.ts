import type { CourseTemplate } from '@/lib/course-builder/schema';
import { APPENDIX_A_REGISTRATION, APPENDIX_A_STANDARDS } from '@/lib/compliance/appendix-a-standards';

const BARBER = APPENDIX_A_STANDARDS.barber;

export const HOST_SHOP_ORIENTATION_SLUG = 'host-shop-apprenticeship-orientation';
export const HOST_SHOP_ORIENTATION_VERSION = '2026.08.18-appendix-a';
export const BARBER_APPRENTICE_APPLICATION_URL =
  'https://www.elevateforhumanity.org/apply/student?program=barber-apprenticeship';

const lesson = (slug: string, title: string, order: number, html: string, objectives: string[]) => ({
  slug,
  title,
  type: 'reading' as const,
  order,
  durationMinutes: 15,
  learningObjectives: objectives,
  content: html,
  renderedHtml: html,
  isRequired: true,
  approved: true,
  generationStatus: 'published' as const,
  hourCategory: 'didactic' as const,
  deliveryMethod: 'online_async' as const,
  evidenceType: 'attestation' as const,
  activities: [{ type: 'reading' as const, label: 'Required orientation' }],
});

const module = (slug: string, title: string, order: number, domainKey: string, html: string, objectives: string[]) => ({
  slug,
  title,
  order,
  orderIndex: order,
  domainKey,
  targetHours: 0.25,
  quizRequired: false,
  practicalRequired: false,
  lessons: [lesson(`${slug}-lesson`, title, 1, html, objectives)],
});

const wageRows = [
  `<li><strong>Entry:</strong> Appendix A starting rate $${BARBER.startingHourlyRate.toFixed(2)}/hour</li>`,
  ...BARBER.wageMilestones.map((m) => `<li><strong>After ${m.completedCompetencies} completed competencies:</strong> Appendix A rate $${m.hourlyRate.toFixed(2)}/hour</li>`),
].join('');

const rtiRows = BARBER.relatedInstruction
  .map((item) => `<li>${item.title}: <strong>${item.hours} hours</strong></li>`)
  .join('');

const competencyRows = BARBER.competencies
  .map((item, index) => `<li><strong>${index + 1}. ${item.category}</strong> — ${item.description}</li>`)
  .join('');

export const HOST_SHOP_APPRENTICESHIP_ORIENTATION: CourseTemplate = {
  title: 'Host Shop Apprenticeship Orientation',
  slug: HOST_SHOP_ORIENTATION_SLUG,
  programSlug: 'host-shop-apprenticeship',
  courseSlug: HOST_SHOP_ORIENTATION_SLUG,
  description: 'Required Host Shop operating orientation grounded in the approved U.S. Department of Labor Appendix A for the registered Barber occupation.',
  credentialTarget: 'INTERNAL',
  minimumHours: 2.25,
  requiresFinalExam: false,
  finalExam: { required: false },
  certificateRequirements: {
    includeHours: false,
    includeCompetencies: false,
    includeInstructorVerification: false,
    includeCompletionDate: true,
    includeVerificationUrl: true,
  },
  regulatory: {
    complianceProfileKey: 'internal_basic',
    credentialTarget: 'INTERNAL',
    governingBody: 'U.S. Department of Labor Office of Apprenticeship / 2 Exclusive LLC-S',
    governingRegion: 'Registered apprenticeship standards and approved Host Shop jurisdiction',
    governingStandardVersion: `${APPENDIX_A_REGISTRATION.registrationNumber} Appendix A revision ${APPENDIX_A_REGISTRATION.revisionDate}`,
    retentionPolicyDays: 2555,
    auditNotes: 'Host Shop orientation must track the approved Appendix A; generic state-hour or marketing values must not replace Appendix A apprenticeship requirements.',
  },
  modules: [
    module('dol-appendix-a', '1. DOL Appendix A Is the Program Standard', 1, 'dol-appendix-a', `<h2>The approved Appendix A controls the apprenticeship operating model</h2><p>2 Exclusive LLC-S is the registered sponsor under registration <strong>${APPENDIX_A_REGISTRATION.registrationNumber}</strong>. For the Barber occupation, Appendix A identifies RAPIDS code <strong>${BARBER.rapidsCode}</strong>, O*NET-SOC <strong>${BARBER.onetSocCode}</strong>, and a <strong>${BARBER.approach}</strong> apprenticeship approach.</p><p>The Barber apprenticeship is not completed by substituting a generic state-school hour rule. DOL progress is based on successful completion of <strong>${BARBER.competencyCount} approved competencies</strong>, together with required RTI and sponsor requirements.</p><p>Appendix A requires a <strong>${BARBER.apprenticeToMentorRatio} apprentice-to-mentor ratio</strong> and establishes a <strong>${BARBER.probationaryHours}-hour probationary period</strong>. Host Shops must operate within those approved standards.</p>`, ['Identify Appendix A as the apprenticeship source of truth', 'Explain competency-based progression', 'Apply the approved mentor ratio and probationary period']),

    module('rti-requirements', '2. Required Related Technical Instruction (RTI)', 2, 'dol-rti', `<h2>${BARBER.relatedInstructionHours} hours of Appendix A RTI</h2><p>The approved Appendix A requires <strong>${BARBER.relatedInstructionHours} hours of related instruction</strong> through ${BARBER.rtiProvider}. The Host Shop should monitor RTI progress and align hands-on teaching to the apprentice's current theory.</p><ul>${rtiRows}</ul><p>The LMS curriculum and reports must map back to these Appendix A subjects and totals. A different internal course-hour number must not override the approved Appendix A requirement.</p>`, ['State the approved RTI total', 'Identify the Appendix A RTI subject areas', 'Use RTI progress to sequence hands-on coaching']),

    module('competency-progress', '3. DOL Competency Progress & Host Shop Sign-Off', 3, 'dol-competencies', `<h2>${BARBER.competencyCount} Appendix A competencies</h2><p>The Host Shop must observe and document the apprentice performing the approved work processes. Attendance or time at the shop does not by itself complete a competency.</p><ol>${competencyRows}</ol><p>Use the Host Shop competency tracker to record demonstrated progress. A supervisor should sign off only when the apprentice can safely and consistently perform the work to the expected standard. Geofenced time, service/practice records, supervisor observations, photos where permitted, and corrective notes can support the competency record.</p>`, ['Recognize all Appendix A barber competencies', 'Distinguish attendance from demonstrated competency', 'Document competency evidence and supervisor verification']),

    module('wage-progression', '4. Progressive Wage Schedule', 4, 'dol-wages', `<h2>Wages advance with competency progress</h2><p>Appendix A contains the following registered wage progression:</p><ul>${wageRows}</ul><p>The platform should use completed Appendix A competencies to identify the applicable registered wage milestone. The shop must also comply with all applicable federal, state, and local wage laws; if current law requires a higher rate than the Appendix A figure, the higher lawful rate controls.</p><p>Payroll evidence should be retained so wage payments can be reconciled with employment and approved apprenticeship activity. Commission may be part of compensation where lawful, but it does not replace compliance with the registered wage progression or applicable wage law.</p>`, ['Explain the Appendix A wage milestones', 'Tie wage progression to competency completion', 'Maintain payroll evidence and apply the higher lawful wage floor']),

    module('shop-economics', '5. How the Host Shop Makes Money', 5, 'host-shop-economics', `<h2>Business value without free labor</h2><p>As apprentices become competent, they may increase supervised service capacity, customer retention, retail sales, and the shop's future licensed workforce. Revenue is not guaranteed.</p><p>Evaluate apprentice-related revenue against wages, payroll taxes, supplies, insurance, required supervision, rent, merchant fees, rework, and other overhead. Never treat the registered apprenticeship as unpaid labor.</p><p>Core apprenticeship tools—orientation, apprentice monitoring, geofenced time, progress, competency verification, required documents, and compliance reporting—remain operational requirements. Optional business services such as payroll setup, QuickBooks support, CRM, website, marketing, automation, and other business tools may be sold separately.</p>`, ['Identify legitimate Host Shop value', 'Account for apprentice and supervision costs', 'Separate required compliance tools from optional business upgrades']),

    module('recruiting-employment-payroll', '6. Recruiting, Employment, Payroll & WIOA', 6, 'host-shop-employment', `<h2>Recruiting</h2><p>Host Shops may recruit candidates, but every candidate must complete the official apprentice application: <a href="${BARBER_APPRENTICE_APPLICATION_URL}">${BARBER_APPRENTICE_APPLICATION_URL}</a>. The shop must not create a competing enrollment record or promise registration before sponsor approval.</p><h2>Employment and payroll</h2><p>The apprentice is a paid worker. Maintain the employment arrangement, pay frequency, wage progression, commission structure if applicable, and payroll evidence. Hours, location evidence, competency progress, and payroll should tell a consistent story.</p><h2>WIOA workforce funding</h2><p>WIOA funding is not one automatic payment. Depending on participant and employer eligibility and local workforce authorization, WIOA may support eligible training through an Individual Training Account, an approved On-the-Job Training arrangement may reimburse an employer for authorized training wages, and eligible participants may receive other allowable workforce supports. These are separate authorizations with separate documentation.</p><p><strong>Do not promise WIOA funding.</strong> The appropriate WorkOne/workforce entity must determine eligibility and issue the required authorization or OJT agreement before Elevate or the Host Shop treats a cost as funded. Never bill the same allowable cost to two funding sources.</p><p>When an OJT reimbursement is authorized, the Host Shop should retain the agreement, approved training plan, payroll evidence, geofenced/approved time records, wage rate, and required reimbursement documentation.</p>`, ['Recruit through the canonical application', 'Maintain payroll evidence consistent with the Appendix A wage schedule', 'Explain ITA versus OJT funding', 'Require workforce authorization before claiming funding']),

    module('geofence-timeclock-progress', '7. Geofencing, Timeclock & Progress Monitoring', 7, 'host-shop-timeclock', `<h2>Time records support the apprenticeship record; they do not replace competency evidence</h2><p>The apprentice must clock in and out through the platform at the approved Host Shop site. GPS coordinates and accuracy are validated against the approved site geofence. Host Shops must not ask apprentices to bypass, spoof, backdate, or falsify location/time records.</p><p>Use the Host Shop Board to monitor RTI completion, Appendix A competency progress, probation status, wage milestone, attendance, payroll/documentation evidence, and pending actions. For this competency-based occupation, the progress dashboard should emphasize competencies completed out of ${BARBER.competencyCount}, not a generic completion percentage derived only from elapsed hours.</p>`, ['Protect geofence and time-record integrity', 'Monitor RTI and competency progress together', 'Use competency completion for DOL progress reporting']),

    module('transfer-state-rules', '8. Transfer Credit & State/Jurisdiction Rules', 8, 'host-shop-transfer-credit', `<h2>Host Shops do not award transfer credit</h2><p>Do not promise a candidate a specific transfer amount. Prior education, training, work experience, or credentials must be documented and reviewed under the registered standards and applicable jurisdiction rules. Only approved sponsor documentation changes the official apprentice record.</p><p>State licensing rules and the DOL registered apprenticeship standards serve different purposes. Do not substitute a school-hour rule for the approved Appendix A competency/RTI requirements. When rules appear to conflict, escalate for sponsor/compliance review.</p>`, ['Explain who can approve prior-learning/experience credit', 'Keep state licensure rules separate from DOL Appendix A', 'Escalate conflicts instead of editing records locally']),

    module('compliance-signoff', '9. Electronic Agreements, Documentation & Final Sign-Off', 9, 'host-shop-compliance', `<h2>Electronic records are the compliance record</h2><p>Required agreements and attestations—including the Host Shop MOU and orientation acknowledgment—must use the platform's electronic-signature workflow so signer identity, agreement version, signature timestamp, IP address, user agent, and audit history are retained. Evidence documents such as licenses, insurance, payroll records, and credentials are uploaded and verified rather than given a second unnecessary signature.</p><p>Keep the MOU, licenses, insurance, workers compensation information where applicable, supervisor information, payroll evidence, RTI/progress records, geofenced OJL records, Appendix A competency evidence, and corrective records current.</p><p>The authorized representative must acknowledge that the shop will operate to the approved Appendix A, pay lawful progressive wages, maintain the ${BARBER.apprenticeToMentorRatio} ratio, honor the ${BARBER.probationaryHours}-hour probationary period, report truthful records, protect geofence integrity, and obtain workforce funding authorization before claiming reimbursement.</p>`, ['Use the canonical electronic-signature workflow', 'Maintain Appendix A compliance evidence', 'Complete the Host Shop orientation acknowledgment before operational access']),
  ],
};
