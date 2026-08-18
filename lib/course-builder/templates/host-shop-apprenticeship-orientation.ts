import type { CourseTemplate } from '@/lib/course-builder/schema';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';

const BARBER = RAPIDS_CONFIG.programs.barber;

export const HOST_SHOP_ORIENTATION_SLUG = 'host-shop-apprenticeship-orientation';
export const HOST_SHOP_ORIENTATION_VERSION = '2026.08.18';
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

export const HOST_SHOP_APPRENTICESHIP_ORIENTATION: CourseTemplate = {
  title: 'Host Shop Apprenticeship Orientation',
  slug: HOST_SHOP_ORIENTATION_SLUG,
  programSlug: 'host-shop-apprenticeship',
  courseSlug: HOST_SHOP_ORIENTATION_SLUG,
  description: 'Required operating orientation for approved Host Shops and supervisors before apprentice-management tools are unlocked.',
  credentialTarget: 'INTERNAL',
  minimumHours: 2,
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
    governingBody: 'Elevate for Humanity / Registered Apprenticeship Sponsor',
    governingRegion: 'Program jurisdiction and approved Host Shop state',
    governingStandardVersion: HOST_SHOP_ORIENTATION_VERSION,
    retentionPolicyDays: 2555,
    auditNotes: 'Required Host Shop operating orientation and electronic acknowledgment.',
  },
  modules: [
    module('roles-and-structure', '1. Sponsor, Host Shop & Apprentice Roles', 1, 'host-shop-governance', `<h2>One registered program</h2><p>Elevate/2Exclusive remains the registered apprenticeship sponsor. The Host Shop provides the approved worksite, qualified supervision, paid OJL, accurate records, and competency verification. The shop does not create a separate apprenticeship or issue a sponsor certificate.</p><p>The Barber Apprenticeship operating target is <strong>${BARBER.totalHours.toLocaleString()} OJL hours</strong> plus <strong>${BARBER.relatedInstructionHours} RTI hours</strong>. The Prestige Elevation Barber Curriculum supplies the RTI sequence; the Host Shop supplies supervised hands-on application.</p>`, ['Explain sponsor and Host Shop responsibilities', 'Distinguish RTI from OJL', 'Identify supervision and documentation duties']),
    module('shop-economics', '2. How the Host Shop Makes Money', 2, 'host-shop-economics', `<h2>Business value without free labor</h2><p>Apprentices may increase supervised service capacity, customer retention, retail opportunities, and the shop's future licensed workforce as their skills progress. Revenue is not guaranteed.</p><p>Evaluate apprentice-related revenue against apprentice wages, payroll taxes, supplies, insurance, supervision time, rent, merchant fees, rework, and other overhead. Never treat apprenticeship participation as a promise of profit or unpaid labor.</p><p>Core apprenticeship compliance tools are included. Optional business services such as payroll setup, QuickBooks support, CRM, website, marketing, automation, and additional business tools may be offered separately.</p>`, ['Identify legitimate sources of shop value', 'Calculate contribution after labor and operating costs', 'Separate required apprenticeship tools from optional upgrades']),
    module('recruiting-employment-payroll', '3. Recruiting, Employment, Wages & Payroll', 3, 'host-shop-employment', `<h2>Recruiting</h2><p>Host Shops may recruit candidates, but every candidate must use the official application: <a href="${BARBER_APPRENTICE_APPLICATION_URL}">${BARBER_APPRENTICE_APPLICATION_URL}</a>. Do not create a parallel enrollment or promise registration before sponsor approval.</p><h2>Employment and compensation</h2><p>The apprentice is a paid worker. Document the employment classification, base/hourly rate, commission structure if used, pay frequency, and registered progressive wage schedule. Commission is a method of compensation; it does not automatically determine worker classification.</p><h2>Payroll evidence</h2><p>Maintain payroll records that prove the apprentice was paid. Payroll evidence may be reconciled against approved OJL time. QuickBooks/payroll setup can be offered as an optional business service, but apprenticeship compliance cannot depend on buying an upgrade.</p>`, ['Use the canonical apprentice application', 'Document employment and progressive wages', 'Maintain payroll evidence tied to paid OJL']),
    module('hands-on-teaching', '4. RTI, OJL & Hands-On Teaching', 4, 'host-shop-instruction', `<h2>Follow the same eight-module sequence as the apprentice</h2><ol><li>Infection Control & Safety</li><li>Hair Science & Scalp Analysis</li><li>Tools, Equipment & Ergonomics</li><li>Haircutting Techniques</li><li>Shaving & Beard Services</li><li>Chemical Services</li><li>Professional & Business Skills</li><li>State Board Preparation</li></ol><p>Use apprentice RTI progress to guide shop-floor coaching. Progress from observation to supervised practice to demonstrated competency. Never advance production speed ahead of safety, sanitation, legal scope, or supervisor readiness.</p>`, ['Align hands-on coaching to Prestige RTI', 'Sequence supervised practice safely', 'Use competency evidence instead of attendance alone']),
    module('geofence-timeclock-progress', '5. Geofencing, Timeclock & Progress Monitoring', 5, 'host-shop-timeclock', `<h2>Geofenced time is the OJL evidence layer</h2><p>The apprentice must clock in and out through the platform at the approved Host Shop site. GPS coordinates are required and server-side timeclock logic validates the submitted location against the approved site geofence and GPS accuracy requirements.</p><p>The Host Shop must maintain an accurate approved shop location and must not ask an apprentice to bypass, spoof, backdate, or falsify location/time records. Use the Host Shop Board to monitor active apprentices, OJL totals, attendance, competencies, documents, and pending actions.</p>`, ['Explain geofenced clock-in/clock-out', 'Protect geofence and time-record integrity', 'Monitor apprentice progress from the Host Shop Board']),
    module('hours-competencies', '6. Approving OJL Hours & Competencies', 6, 'host-shop-documentation', `<h2>Approve only supported work</h2><p>Review pending OJL entries regularly. Approve only hours actually worked under the authorized placement. Reject inaccurate, duplicate, off-site, unsupported, or otherwise invalid entries with a reason.</p><p>A competency sign-off is stronger than attendance. Sign only when the apprentice has demonstrated the skill safely and consistently at the required level. Supporting evidence may include supervisor observation, service/practice logs, sanitation/tool checklists, permitted work photos, correction notes, and required documents.</p>`, ['Approve or reject OJL accurately', 'Apply a consistent competency sign-off standard', 'Identify acceptable supporting evidence']),
    module('transfer-state-rules', '7. Transfer Credit & State/Jurisdiction Rules', 7, 'host-shop-transfer-credit', `<h2>Host Shops do not award transfer credit</h2><p>Do not promise a candidate a specific number of transfer hours. Transfer credit depends on documented prior education/work, the registered program standards, sponsor review, and the rules that govern the apprentice's jurisdiction.</p><p>The platform may display a configured maximum for a state/program, but only approved sponsor documentation changes the apprentice's credited hours. If a state rule and the registered program standard differ, escalate the record for compliance review rather than changing hours locally.</p>`, ['Explain who can approve transfer credit', 'Use state/program limits as review controls rather than promises', 'Escalate conflicts instead of editing credited hours locally']),
    module('compliance-signoff', '8. Documentation, Escalation & Final Sign-Off', 8, 'host-shop-compliance', `<h2>Keep the Host Shop approval current</h2><p>Maintain the MOU, licenses, insurance, workers compensation information where applicable, supervisor information, payroll evidence, attendance, OJL hours, competencies, and corrective records.</p><p>Contact Elevate before continuing when the qualified supervisor, shop location, ownership, license, insurance, apprentice employment, schedule, or placement materially changes, or when there is a serious safety, wage, harassment, discrimination, conduct, or documentation concern.</p><p>The authorized representative must electronically acknowledge paid-worker rules, no revenue guarantee, truthful OJL/competency records, geofence integrity, progressive wages, sponsor-controlled transfer credit, and the required documentation duties before operational dashboard access is unlocked.</p>`, ['Maintain required Host Shop records', 'Recognize conditions requiring sponsor escalation', 'Complete the binding orientation acknowledgment']),
  ],
};
