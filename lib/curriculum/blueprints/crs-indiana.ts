/**
 * lib/curriculum/blueprints/crs-indiana.ts
 *
 * Canonical blueprint for Indiana Certified Recovery Specialist (CRS).
 * Credential authority: Indiana Division of Mental Health and Addiction (DMHA)
 *   via Indiana Affiliation of Recovery Residences (INARR).
 *
 * CRS is distinct from PRS (Peer Recovery Specialist). CRS is a broader
 * recovery support credential; PRS is the peer-specific track. Both are
 * issued under DMHA authority in Indiana.
 *
 * Training provider approval: submit to info@inarr.org + DMHA@fssa.in.gov.
 * Fee waiver request pending (Selfish Inc. / Elevate for Humanity partnership).
 *
 * Design: fixed spine, flexible ribs.
 *   - 8 modules, fixed order, fixed competency coverage.
 *   - Lesson count per module is bounded (min/max).
 *   - Generator may expand lessons inside bounds; may not invent modules.
 *
 * Slugs are the durable identity. Do not change slugs after lessons are seeded.
 * Titles are display text and may be updated without breaking the builder.
 *
 * DMHA CRS competency domains (source: Indiana CRS Training Standards):
 *   1. Recovery Support Fundamentals
 *   2. Advocacy and Systems Navigation
 *   3. Mentoring and Peer Relationships
 *   4. Education and Recovery Learning
 *   5. Recovery and Wellness Support
 *   6. Ethics and Professional Responsibility
 *   7. Cultural Responsiveness and Trauma-Informed Practice
 *   8. Professional Growth, Self-Care, and Workforce Readiness
 */

import type { CredentialBlueprint } from './types';

export const crsIndianaBlueprint: CredentialBlueprint = {
  id: 'crs-indiana',
  version: '1.0.0',
  credentialSlug: 'crs',
  credentialTitle: 'Certified Recovery Specialist',
  state: 'IN',
  programSlug: 'certified-recovery-specialist',
  credentialCode: 'IN-CRS',
  trackVariants: ['standard'],
  status: 'active',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 60,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 8,
  expectedLessonCount: 40,

  modules: [
    // ── Module 1 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-foundations',
      title: 'Recovery Support Fundamentals',
      orderIndex: 1,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'foundations',
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'concept',     requiredCount: 2 },
        { lessonType: 'quiz',        requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'crs_role_definition',           isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'recovery_definitions_models',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'recovery_capital_concepts',     isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'professional_boundaries_intro', isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'The Role of a Certified Recovery Specialist',
        'Definitions and Models of Recovery',
        'Recovery Capital: Building on Strengths',
        'Person-Centered and Self-Directed Support',
        'Professional Boundaries in Recovery Work',
      ],
      lessons: [
        { slug: 'crs-role-of-certified-recovery-specialist',      title: 'The Role of a Certified Recovery Specialist',      order: 1, domainKey: 'foundations' },
        { slug: 'crs-definitions-and-models-of-recovery',         title: 'Definitions and Models of Recovery',               order: 2, domainKey: 'foundations' },
        { slug: 'crs-recovery-capital-building-on-strengths',     title: 'Recovery Capital: Building on Strengths',          order: 3, domainKey: 'foundations' },
        { slug: 'crs-person-centered-and-self-directed-support',  title: 'Person-Centered and Self-Directed Support',        order: 4, domainKey: 'foundations' },
        { slug: 'crs-professional-boundaries-in-recovery-work',   title: 'Professional Boundaries in Recovery Work',         order: 5, domainKey: 'foundations' },
      ],
    },

    // ── Module 2 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-advocacy',
      title: 'Advocacy and Systems Navigation',
      orderIndex: 2,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'advocacy',
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 1 },
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'scenario',   requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'self_advocacy_empowerment',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'systems_navigation',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'rights_responsibilities',    isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'reducing_system_barriers',   isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Advocacy in Recovery Systems',
        'Navigating Indiana Community Resources',
        'Supporting Access to Treatment and Services',
        'Empowerment and Informed Choice',
        'Reducing Barriers and System Friction',
      ],
      lessons: [
        { slug: 'crs-advocacy-in-recovery-systems',              title: 'Advocacy in Recovery Systems',              order: 1, domainKey: 'advocacy' },
        { slug: 'crs-navigating-indiana-community-resources',    title: 'Navigating Indiana Community Resources',    order: 2, domainKey: 'advocacy' },
        { slug: 'crs-supporting-access-to-treatment-services',   title: 'Supporting Access to Treatment and Services', order: 3, domainKey: 'advocacy' },
        { slug: 'crs-empowerment-and-informed-choice',           title: 'Empowerment and Informed Choice',           order: 4, domainKey: 'advocacy' },
        { slug: 'crs-reducing-barriers-and-system-friction',     title: 'Reducing Barriers and System Friction',     order: 5, domainKey: 'advocacy' },
      ],
    },

    // ── Module 3 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-mentoring',
      title: 'Mentoring and Peer Relationships',
      orderIndex: 3,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: false,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'mentoring',
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'lab',       requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'active_listening_empathy',  isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'motivational_support',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'self_disclosure_practice',  isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'rapport_trust_building',    isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Building Trust in Recovery Relationships',
        'Using Self-Disclosure Appropriately',
        'Communication Skills for Recovery Support',
        'Motivational Support and Encouragement',
        'Maintaining Mutuality and Respect',
      ],
      lessons: [
        { slug: 'crs-building-trust-in-recovery-relationships',  title: 'Building Trust in Recovery Relationships',  order: 1, domainKey: 'mentoring' },
        { slug: 'crs-using-self-disclosure-appropriately',       title: 'Using Self-Disclosure Appropriately',       order: 2, domainKey: 'mentoring' },
        { slug: 'crs-communication-skills-for-recovery-support', title: 'Communication Skills for Recovery Support', order: 3, domainKey: 'mentoring' },
        { slug: 'crs-motivational-support-and-encouragement',    title: 'Motivational Support and Encouragement',    order: 4, domainKey: 'mentoring' },
        { slug: 'crs-maintaining-mutuality-and-respect',         title: 'Maintaining Mutuality and Respect',         order: 5, domainKey: 'mentoring' },
      ],
    },

    // ── Module 4 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-education',
      title: 'Education and Recovery Learning',
      orderIndex: 4,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'education',
      requiredLessonTypes: [
        { lessonType: 'concept',  requiredCount: 2 },
        { lessonType: 'scenario', requiredCount: 1 },
        { lessonType: 'quiz',     requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'recovery_models_education',  isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'stages_of_change',           isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'wellness_self_care',         isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'relapse_prevention_tools',   isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Recovery Education and Wellness Planning',
        'Teaching Self-Advocacy Skills',
        'Sharing Tools for Relapse Prevention',
        'Supporting Goal Setting and Action Steps',
        'Introducing Recovery Capital Concepts',
      ],
      lessons: [
        { slug: 'crs-recovery-education-and-wellness-planning',  title: 'Recovery Education and Wellness Planning',  order: 1, domainKey: 'education' },
        { slug: 'crs-teaching-self-advocacy-skills',             title: 'Teaching Self-Advocacy Skills',             order: 2, domainKey: 'education' },
        { slug: 'crs-sharing-tools-for-relapse-prevention',      title: 'Sharing Tools for Relapse Prevention',      order: 3, domainKey: 'education' },
        { slug: 'crs-supporting-goal-setting-and-action-steps',  title: 'Supporting Goal Setting and Action Steps',  order: 4, domainKey: 'education' },
        { slug: 'crs-introducing-recovery-capital-concepts',     title: 'Introducing Recovery Capital Concepts',     order: 5, domainKey: 'education' },
      ],
    },

    // ── Module 5 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-wellness-support',
      title: 'Recovery and Wellness Support',
      orderIndex: 5,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'recovery_support',
      requiredLessonTypes: [
        { lessonType: 'concept',  requiredCount: 2 },
        { lessonType: 'scenario', requiredCount: 1 },
        { lessonType: 'quiz',     requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'stages_of_change_application',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'wellness_dimensions',               isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'crisis_awareness_referral',         isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'community_integration_supports',    isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Stages of Change and Recovery Readiness',
        'Wellness Dimensions in Recovery Support',
        'Supporting Crisis Awareness and Referral',
        'Community Integration and Natural Supports',
        'Supporting Long-Term Recovery Maintenance',
      ],
      lessons: [
        { slug: 'crs-stages-of-change-and-recovery-readiness',    title: 'Stages of Change and Recovery Readiness',    order: 1, domainKey: 'recovery_support' },
        { slug: 'crs-wellness-dimensions-in-recovery-support',    title: 'Wellness Dimensions in Recovery Support',    order: 2, domainKey: 'recovery_support' },
        { slug: 'crs-supporting-crisis-awareness-and-referral',   title: 'Supporting Crisis Awareness and Referral',   order: 3, domainKey: 'recovery_support' },
        { slug: 'crs-community-integration-and-natural-supports', title: 'Community Integration and Natural Supports', order: 4, domainKey: 'recovery_support' },
        { slug: 'crs-supporting-long-term-recovery-maintenance',  title: 'Supporting Long-Term Recovery Maintenance',  order: 5, domainKey: 'recovery_support' },
      ],
    },

    // ── Module 6 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-ethics',
      title: 'Ethics and Professional Responsibility',
      orderIndex: 6,
      minLessons: 3,
      maxLessons: 5,
      quizRequired: false,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'ethics',
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'concept',    requiredCount: 1 },
        { lessonType: 'scenario',   requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'crs_code_of_ethics',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'confidentiality_hipaa',      isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'dual_relationships',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'scope_of_role_referral',     isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Ethical Standards in Recovery Support',
        'Confidentiality and Privacy (HIPAA/42 CFR Part 2)',
        'Boundaries and Dual Relationships',
        'Scope of Role and Appropriate Referral',
        'Documentation, Professionalism, and Accountability',
      ],
      lessons: [
        { slug: 'crs-ethical-standards-in-recovery-support',              title: 'Ethical Standards in Recovery Support',              order: 1, domainKey: 'ethics' },
        { slug: 'crs-confidentiality-and-privacy-hipaa-42cfr',            title: 'Confidentiality and Privacy (HIPAA/42 CFR Part 2)',   order: 2, domainKey: 'ethics' },
        { slug: 'crs-boundaries-and-dual-relationships',                  title: 'Boundaries and Dual Relationships',                  order: 3, domainKey: 'ethics' },
        { slug: 'crs-scope-of-role-and-appropriate-referral',             title: 'Scope of Role and Appropriate Referral',             order: 4, domainKey: 'ethics' },
        { slug: 'crs-documentation-professionalism-and-accountability',   title: 'Documentation, Professionalism, and Accountability', order: 5, domainKey: 'ethics' },
      ],
    },

    // ── Module 7 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-cultural-trauma',
      title: 'Cultural Responsiveness and Trauma-Informed Practice',
      orderIndex: 7,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'cultural_responsiveness',
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'safety',    requiredCount: 1 },
        { lessonType: 'lab',       requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'cultural_humility',              isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'equity_inclusive_practice',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'trauma_informed_principles',     isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'avoiding_retraumatization',      isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Cultural Humility in Recovery Support',
        'Equity, Access, and Inclusive Practice',
        'Trauma-Informed Principles for Recovery Work',
        'Avoiding Retraumatization in Support Settings',
        'Supporting Diverse Recovery Pathways',
      ],
      lessons: [
        { slug: 'crs-cultural-humility-in-recovery-support',             title: 'Cultural Humility in Recovery Support',             order: 1, domainKey: 'cultural_responsiveness' },
        { slug: 'crs-equity-access-and-inclusive-practice',              title: 'Equity, Access, and Inclusive Practice',            order: 2, domainKey: 'cultural_responsiveness' },
        { slug: 'crs-trauma-informed-principles-for-recovery-work',      title: 'Trauma-Informed Principles for Recovery Work',      order: 3, domainKey: 'cultural_responsiveness' },
        { slug: 'crs-avoiding-retraumatization-in-support-settings',     title: 'Avoiding Retraumatization in Support Settings',     order: 4, domainKey: 'cultural_responsiveness' },
        { slug: 'crs-supporting-diverse-recovery-pathways',              title: 'Supporting Diverse Recovery Pathways',              order: 5, domainKey: 'cultural_responsiveness' },
      ],
    },

    // ── Module 8 ─────────────────────────────────────────────────────────────
    {
      slug: 'crs-professional-growth',
      title: 'Professional Growth, Self-Care, and Workforce Readiness',
      orderIndex: 8,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'professional_growth',
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'practicum',   requiredCount: 1 },
        { lessonType: 'review',      requiredCount: 1 },
        { lessonType: 'final_exam',  requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'self_care_burnout_prevention',  isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'reflective_practice',           isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'crs_exam_readiness',            isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'career_pathways_crs',           isCritical: true, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Self-Care and Burnout Prevention',
        'Reflective Practice and Continuous Improvement',
        'Teamwork and Collaboration in Service Settings',
        'Career Pathways for Certified Recovery Specialists',
        'CRS Exam Preparation and Certification Process',
      ],
      lessons: [
        { slug: 'crs-self-care-and-burnout-prevention',               title: 'Self-Care and Burnout Prevention',               order: 1, domainKey: 'professional_growth' },
        { slug: 'crs-reflective-practice-and-continuous-improvement', title: 'Reflective Practice and Continuous Improvement', order: 2, domainKey: 'professional_growth' },
        { slug: 'crs-teamwork-and-collaboration-in-service-settings', title: 'Teamwork and Collaboration in Service Settings', order: 3, domainKey: 'professional_growth' },
        { slug: 'crs-career-pathways-for-certified-recovery-specialists', title: 'Career Pathways for Certified Recovery Specialists', order: 4, domainKey: 'professional_growth' },
        { slug: 'crs-exam-preparation-and-certification-process',     title: 'CRS Exam Preparation and Certification Process', order: 5, domainKey: 'professional_growth' },
      ],
    },
  ],

  assessmentRules: [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 8,
      maxQuestions: 15,
      passingThreshold: 0.70,
    },
    {
      assessmentType: 'final',
      scope: 'crs-professional-growth',
      minQuestions: 50,
      maxQuestions: 75,
      passingThreshold: 0.80,
      distributionConstraints: {
        'foundations':             0.15,
        'advocacy':                0.15,
        'mentoring':               0.15,
        'recovery_support':        0.15,
        'ethics':                  0.15,
        'cultural_responsiveness': 0.15,
        'professional_growth':     0.10,
      },
    },
  ],
};

// ── Hard guards — fail at module load, not at runtime ────────────────────────

const _actualModuleCount = crsIndianaBlueprint.modules.length;
const _actualLessonCount = crsIndianaBlueprint.modules.reduce(
  (sum, m) => sum + (m.lessons?.length ?? 0), 0
);

if (_actualModuleCount !== crsIndianaBlueprint.expectedModuleCount) {
  throw new Error(
    `crs-indiana blueprint invalid: expected ${crsIndianaBlueprint.expectedModuleCount} modules, got ${_actualModuleCount}`
  );
}

if (_actualLessonCount !== crsIndianaBlueprint.expectedLessonCount) {
  throw new Error(
    `crs-indiana blueprint invalid: expected ${crsIndianaBlueprint.expectedLessonCount} lessons, got ${_actualLessonCount}`
  );
}
