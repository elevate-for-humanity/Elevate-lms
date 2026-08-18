import type { CredentialBlueprint } from './types';

const module = (
  slug: string,
  title: string,
  orderIndex: number,
  domainKey: string,
  lessons: Array<{ slug: string; title: string; content: string }>,
) => ({
  slug,
  title,
  orderIndex,
  domainKey,
  minLessons: 3,
  maxLessons: 3,
  quizRequired: true,
  practicalRequired: false,
  isCritical: true,
  requiredLessonTypes: [
    { lessonType: 'lesson', requiredCount: 2 },
    { lessonType: 'checkpoint', requiredCount: 1 },
  ],
  competencies: [],
  lessons: lessons.map((lesson, index) => ({
    slug: index === 2 ? `${lesson.slug}-checkpoint` : lesson.slug,
    title: lesson.title,
    order: index + 1,
    domainKey,
    durationMinutes: index === 2 ? 10 : 15,
    content: lesson.content,
    passingScore: index === 2 ? 80 : undefined,
  })),
});

export const hostShopApprenticeshipOrientationBlueprint: CredentialBlueprint = {
  id: 'host-shop-apprenticeship-orientation-v1',
  version: '1.0.0',
  credentialSlug: 'host-shop-apprenticeship-orientation',
  credentialTitle: 'Host Shop Apprenticeship Orientation',
  credentialCode: 'HOST-ORI-001',
  state: 'multi-state',
  programSlug: 'host-shop-apprenticeship-orientation',
  programType: 'internal-compliance',
  targetRole: 'host_shop',
  status: 'active',
  sourceAuthority: 'Elevate for Humanity registered apprenticeship operating requirements',
  expectedModuleCount: 7,
  expectedLessonCount: 21,
  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 21,
    requiresFinalExam: false,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
    passingScore: 80,
  },
  assessmentRules: [
    { assessmentType: 'module', scope: 'all', minQuestions: 5, maxQuestions: 10, passingThreshold: 0.8 },
  ],
  modules: [
    module('roles-and-economics', 'Program Roles & Host Shop Economics', 1, 'host_roles', [
      { slug: 'registered-apprenticeship-basics', title: 'Registered Apprenticeship Basics', content: 'Explain sponsor-of-record responsibilities, Host Shop responsibilities, supervision, paid employment, RTI, and OJL.' },
      { slug: 'how-host-shop-makes-money', title: 'How the Host Shop Makes Money', content: 'Explain legitimate service capacity, customer retention, retail opportunities, operating costs, supervision costs, and why revenue is not guaranteed.' },
      { slug: 'roles-economics-review', title: 'Roles & Economics Checkpoint', content: 'Verify understanding of sponsor/Host Shop duties and responsible shop economics.' },
    ]),
    module('recruiting-and-employment', 'Recruiting, Employment & Wages', 2, 'employment', [
      { slug: 'recruit-an-apprentice', title: 'Recruit and Sign Up an Apprentice', content: 'Use the canonical apprentice application. The Host Shop may recruit and refer candidates but does not create a competing enrollment record or promise acceptance.' },
      { slug: 'w2-commission-progressive-wages', title: 'W-2, Commission & Progressive Wages', content: 'Teach paid-worker requirements, documented compensation structures, progressive wage schedules, and that commission does not by itself determine worker classification.' },
      { slug: 'employment-review', title: 'Employment & Wages Checkpoint', content: 'Verify recruiting, employment, compensation, and wage-schedule responsibilities.' },
    ]),
    module('payroll-and-records', 'Payroll, Proof of Pay & Records', 3, 'payroll', [
      { slug: 'payroll-proof-of-pay', title: 'Payroll and Proof of Pay', content: 'Maintain payroll evidence showing apprentice compensation and reconcile payroll records with verified OJL activity when required.' },
      { slug: 'core-vs-upgrades', title: 'Core Tools vs. Optional Upgrades', content: 'Core apprenticeship compliance tools are included. Optional payroll setup, QuickBooks support, CRM, website, marketing, automation, and business tools may be offered separately.' },
      { slug: 'payroll-review', title: 'Payroll & Records Checkpoint', content: 'Verify payroll evidence, documentation, and core-versus-upgrade understanding.' },
    ]),
    module('training-structure', 'RTI, OJL & Hands-On Teaching', 4, 'training_structure', [
      { slug: 'ojl-rti-structure', title: '2,000 OJL / 144 RTI Structure', content: 'Coordinate the approved barber apprenticeship OJL requirements with the Prestige Elevation Barber Curriculum RTI sequence.' },
      { slug: 'hands-on-syllabus', title: 'Hands-On Teaching Syllabus', content: 'Sequence sanitation, consultation, tools, haircutting, shaving/beard services, chemical services, professionalism/business skills, and state-board preparation alongside RTI.' },
      { slug: 'training-structure-review', title: 'Training Structure Checkpoint', content: 'Verify RTI/OJL distinctions and hands-on teaching responsibilities.' },
    ]),
    module('time-progress-hours', 'Geofencing, Progress & Hour Approval', 5, 'time_progress', [
      { slug: 'geofenced-timeclock', title: 'Geofenced Timeclock', content: 'Apprentices clock in and out at the approved site. GPS coordinates and accuracy are validated server-side against the approved shop geofence.' },
      { slug: 'monitor-approve-progress', title: 'Monitor Progress and Approve Hours', content: 'Use the Host Shop Board to monitor OJL, attendance, competencies, and pending hours. Approve only accurate supported entries and reject inaccurate entries with a reason.' },
      { slug: 'time-progress-review', title: 'Time & Progress Checkpoint', content: 'Verify geofence integrity, progress monitoring, hour approval, and competency sign-off.' },
    ]),
    module('transfer-and-state-rules', 'Transfer Credit & State Rules', 6, 'transfer_credit', [
      { slug: 'transfer-credit-principles', title: 'Transfer Credit Principles', content: 'Do not promise transfer hours. Credit depends on documented prior training/work, sponsor review, and the governing state/jurisdiction.' },
      { slug: 'state-specific-review', title: 'State-Specific Apprenticeship Rules', content: 'Host Shops must follow the approved registered-program standards and applicable state rules for the apprentice location. Elevate determines and documents approved transfer credit.' },
      { slug: 'transfer-state-review', title: 'Transfer & State Rules Checkpoint', content: 'Verify the Host Shop understands it cannot independently grant or promise transfer credit.' },
    ]),
    module('compliance-and-signoff', 'Documentation, Compliance & Final Sign-Off', 7, 'compliance', [
      { slug: 'documentation-compliance', title: 'Documentation & Compliance', content: 'Maintain required MOU, licenses, insurance, payroll evidence, attendance, OJL hours, competencies, and corrective records.' },
      { slug: 'final-acknowledgment', title: 'Final Host Shop Acknowledgment', content: 'The authorized representative acknowledges paid-worker rules, truthful OJL records, geofence integrity, progressive wages, no revenue guarantee, and sponsor-controlled transfer credit.' },
      { slug: 'orientation-final-review', title: 'Orientation Final Checkpoint', content: 'Confirm readiness to operate the Host Shop apprenticeship workflow before dashboard access is unlocked.' },
    ]),
  ],
};

const moduleCount = hostShopApprenticeshipOrientationBlueprint.modules.length;
const lessonCount = hostShopApprenticeshipOrientationBlueprint.modules.reduce((sum, item) => sum + (item.lessons?.length ?? 0), 0);
if (moduleCount !== hostShopApprenticeshipOrientationBlueprint.expectedModuleCount || lessonCount !== hostShopApprenticeshipOrientationBlueprint.expectedLessonCount) {
  throw new Error(`Host Shop orientation blueprint count mismatch: ${moduleCount} modules / ${lessonCount} lessons`);
}

export default hostShopApprenticeshipOrientationBlueprint;
