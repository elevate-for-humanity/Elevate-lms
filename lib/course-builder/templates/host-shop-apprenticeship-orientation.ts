import type { CourseTemplate } from '@/lib/course-builder/schema';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export const HOST_SHOP_ORIENTATION_SLUG = 'host-shop-apprenticeship-orientation';
export const HOST_SHOP_ORIENTATION_VERSION = '2026.08.19-registered-contract-v3';

export function getApprenticeApplicationUrl(programSlug: string) {
  return `https://www.elevateforhumanity.org/apply/student?program=${encodeURIComponent(programSlug)}`;
}

// Compatibility export for existing Barber-specific links. New runtime code
// should call getApprenticeApplicationUrl with the resolved occupation slug.
export const BARBER_APPRENTICE_APPLICATION_URL = getApprenticeApplicationUrl('barber-apprenticeship');

const lesson = (slug: string, title: string, order: number, html: string, objectives: string[]) => ({
  slug, title, type: 'reading' as const, order, durationMinutes: 15, learningObjectives: objectives,
  content: html, renderedHtml: html, isRequired: true, approved: true, generationStatus: 'published' as const,
  hourCategory: 'didactic' as const, deliveryMethod: 'online_async' as const, evidenceType: 'attestation' as const,
  activities: [{ type: 'reading' as const, label: 'Required orientation' }],
});
const module = (slug: string, title: string, order: number, domainKey: string, html: string, objectives: string[]) => ({
  slug, title, order, orderIndex: order, domainKey, targetHours: 0.25, quizRequired: false, practicalRequired: false,
  lessons: [lesson(`${slug}-lesson`, title, 1, html, objectives)],
});

export function buildHostShopApprenticeshipOrientation(programSlug: string): CourseTemplate {
  const contract = getRegisteredProgramStandard(programSlug);
  if (!contract) throw new Error(`REGISTERED_PROGRAM_STANDARD_MISSING:${programSlug}`);
  const standard = contract.standard;
  const applicationUrl = getApprenticeApplicationUrl(contract.canonicalProgramSlug);
  const wageRows = [`<li><strong>Entry baseline:</strong> $${standard.startingHourlyRate.toFixed(2)}/hour</li>`, ...standard.wageMilestones.map((m) => `<li><strong>After ${m.completedCompetencies} completed competencies:</strong> baseline $${m.hourlyRate.toFixed(2)}/hour</li>`)].join('');
  const rtiRows = standard.relatedInstruction.map((item) => `<li>${item.title}: <strong>${item.hours} hours</strong></li>`).join('');
  const competencyRows = standard.competencies.map((item, index) => `<li><strong>${item.sourceLabel || index + 1}. ${item.category}</strong> — ${item.description}</li>`).join('');

  return {
    title: `${standard.occupationTitle} Host Shop Apprenticeship Orientation`,
    slug: `${HOST_SHOP_ORIENTATION_SLUG}-${contract.standardKey}`,
    programSlug: 'host-shop-apprenticeship',
    courseSlug: `${HOST_SHOP_ORIENTATION_SLUG}-${contract.standardKey}`,
    description: `Required Host Shop operating orientation grounded in the canonical registered-program contract for ${standard.occupationTitle}.`,
    credentialTarget: 'INTERNAL',
    minimumHours: 2.25,
    requiresFinalExam: false,
    finalExam: { required: false },
    certificateRequirements: { includeHours: false, includeCompetencies: false, includeInstructorVerification: false, includeCompletionDate: true, includeVerificationUrl: true },
    regulatory: {
      complianceProfileKey: 'internal_basic', credentialTarget: 'INTERNAL',
      governingBody: `U.S. Department of Labor Office of Apprenticeship / ${contract.sponsor.sponsor}`,
      governingRegion: 'Registered apprenticeship standards and approved Host Shop jurisdiction',
      governingStandardVersion: `${contract.sponsor.registrationNumber} revision ${contract.sponsor.revisionDate}`,
      retentionPolicyDays: 2555,
      auditNotes: 'Host Shop orientation consumes the canonical registered-program contract. Operational RAPIDS employer wage schedules and RTI providers are resolved from Supabase at runtime and must not be hard-coded into this template.',
    },
    modules: [
      module('dol-registered-contract', '1. The Registered Program Contract Is the Source of Truth', 1, 'dol-registered-contract', `<h2>The approved registered program controls the apprenticeship operating model</h2><p>${contract.sponsor.sponsor} is the registered sponsor under <strong>${contract.sponsor.registrationNumber}</strong>. ${standard.occupationTitle} is RAPIDS <strong>${standard.rapidsCode}</strong>, O*NET-SOC <strong>${standard.onetSocCode}</strong>, and <strong>${standard.approach}</strong>.</p><p>Completion is based on <strong>${contract.completion.competencyCount} approved competencies</strong> plus required RTI and sponsor requirements; there is no fabricated fixed OJL completion denominator.</p><p>The registered standard requires a <strong>${standard.apprenticeToMentorRatio} apprentice-to-mentor ratio</strong> and a <strong>${standard.probationaryHours}-hour probationary period</strong>.</p>`, ['Identify the registered program contract as the source of truth', 'Explain competency-based progression', 'Apply the approved mentor ratio and probationary period']),

      module('rti-requirements', '2. Required Related Technical Instruction (RTI)', 2, 'dol-rti', `<h2>${contract.completion.requiredRtiHours} hours of required RTI</h2><p>RTI may be delivered by one or more sponsor-authorized providers recorded in RAPIDS and the platform. Do not rely on a hard-coded provider name. The Host Shop should monitor verified RTI progress and align hands-on teaching to the apprentice&apos;s current theory.</p><ul>${rtiRows}</ul><p>The LMS curriculum and reports must map to these approved subjects and totals. A different internal course-hour number cannot override the registered requirement.</p>`, ['State the approved RTI total', 'Identify the registered RTI subject areas', 'Use verified RTI progress to sequence hands-on coaching']),

      module('competency-progress', '3. Competency Progress & Host Shop Sign-Off', 3, 'dol-competencies', `<h2>${contract.completion.competencyCount} registered competencies</h2><p>The Host Shop must observe and document the apprentice performing the approved work processes. Attendance or time at the shop does not by itself complete a competency.</p><ol>${competencyRows}</ol><p>Use the Host Shop competency tracker to record demonstrated progress. The assigned supervisor signs off only when the apprentice can safely and consistently perform the work to the expected standard.</p>`, ['Recognize the registered competencies', 'Distinguish attendance from demonstrated competency', 'Document competency evidence and supervisor verification']),

      module('wage-progression', '4. Progressive Wage Compliance', 4, 'dol-wages', `<h2>Wages advance with competency progress</h2><p>The occupation baseline is:</p><ul>${wageRows}</ul><p>The platform resolves any employer-specific RAPIDS wage schedule separately at runtime. The applicable required floor must reflect the registered employer schedule, occupation baseline, and any higher wage required by law.</p><p>Payroll evidence must be retained. Commission may be part of compensation where lawful, but it does not replace wage compliance.</p>`, ['Explain occupation baseline wage milestones', 'Recognize employer-specific RAPIDS wage schedules', 'Maintain payroll evidence and apply the controlling wage floor']),

      module('shop-economics', '5. How the Host Shop Makes Money', 5, 'host-shop-economics', `<h2>Business value without free labor</h2><p>As apprentices become competent, they may increase supervised service capacity, customer retention, retail sales, and the shop&apos;s future licensed workforce. Revenue is not guaranteed.</p><p>Evaluate apprentice-related revenue against wages, payroll taxes, supplies, insurance, required supervision, rent, merchant fees, rework, and other overhead. Never treat registered apprenticeship as unpaid labor.</p><p>Core compliance tools remain operational requirements. Optional payroll, QuickBooks, CRM, website, marketing, automation, and other business services may be sold separately.</p>`, ['Identify legitimate Host Shop value', 'Account for apprentice and supervision costs', 'Separate required compliance tools from optional business upgrades']),

      module('recruiting-employment-payroll', '6. Recruiting, Employment, Payroll & WIOA', 6, 'host-shop-employment', `<h2>Recruiting</h2><p>Host Shops may recruit candidates, but every candidate must complete the official apprentice application: <a href="${applicationUrl}">${applicationUrl}</a>.</p><h2>Employment and payroll</h2><p>The apprentice is a paid worker. Maintain the employment arrangement, pay frequency, applicable registered wage schedule, commission structure if lawful, and payroll evidence.</p><h2>WIOA workforce funding</h2><p>WIOA is not an automatic payment. ITA training, OJT reimbursement, and supportive services are separate authorizations with separate documentation. The appropriate workforce entity must determine eligibility and authorize funding before a cost is treated as funded. Never bill the same allowable cost to two funding sources.</p>`, ['Recruit through the canonical application', 'Maintain payroll evidence consistent with the controlling registered wage schedule', 'Explain ITA versus OJT funding', 'Require workforce authorization before claiming funding']),

      module('geofence-timeclock-progress', '7. Geofencing, Timeclock & Progress Monitoring', 7, 'host-shop-timeclock', `<h2>Time records support the apprenticeship record; they do not replace competency evidence</h2><p>The apprentice must clock in and out through the platform at the approved Host Shop site. GPS evidence is validated against the approved site geofence. Host Shops must not bypass, spoof, backdate, or falsify records.</p><p>Use the Host Shop dashboard to monitor verified RTI, ${contract.completion.competencyCount} registered competencies, probation, wage obligations, attendance, payroll/documentation evidence, and pending actions.</p>`, ['Protect geofence and time-record integrity', 'Monitor RTI and competency progress together', 'Use competency completion for registered-program reporting']),

      module('transfer-state-rules', '8. Transfer Credit & State/Jurisdiction Rules', 8, 'host-shop-transfer-credit', `<h2>Host Shops do not award transfer credit</h2><p>Prior education, training, work experience, or credentials must be documented and reviewed under registered standards and applicable jurisdiction rules. Only approved sponsor documentation changes the official apprentice record.</p><p>State licensing rules and registered apprenticeship standards serve different purposes. Do not substitute a school-hour rule for the registered competency/RTI requirements.</p>`, ['Explain who can approve prior-learning/experience credit', 'Keep state licensure rules separate from registered-program requirements', 'Escalate conflicts instead of editing records locally']),

      module('compliance-signoff', '9. Electronic Agreements, Documentation & Final Sign-Off', 9, 'host-shop-compliance', `<h2>Electronic records are the compliance record</h2><p>Required agreements and attestations—including the Host Shop MOU and orientation acknowledgment—must use the platform electronic-signature workflow so signer identity, agreement version, timestamp, IP address, user agent, and audit history are retained.</p><p>Keep MOU, licenses, insurance, workers compensation information where applicable, supervisor information, payroll evidence, RTI/progress records, geofenced OJL records, competency evidence, and corrective records current.</p><p>The authorized representative must maintain the ${standard.apprenticeToMentorRatio} ratio, honor the ${standard.probationaryHours}-hour probationary period, report truthful records, protect geofence integrity, follow the applicable employer wage schedule, and obtain workforce funding authorization before claiming reimbursement.</p>`, ['Use the canonical electronic-signature workflow', 'Maintain registered-program compliance evidence', 'Complete the Host Shop orientation acknowledgment before operational access']),
    ],
  };
}

// Backward-compatible export for existing seed/build consumers. Runtime Host
// Shop pages must build the orientation from the assigned occupation contract.
export const HOST_SHOP_APPRENTICESHIP_ORIENTATION = buildHostShopApprenticeshipOrientation('barber-apprenticeship');
