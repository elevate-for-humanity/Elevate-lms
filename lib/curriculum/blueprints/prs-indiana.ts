/**
 * lib/curriculum/blueprints/prs-indiana.ts
 *
 * Canonical blueprint for Indiana Certified Peer Recovery Specialist (CPRS).
 * Credential authority: Indiana Division of Mental Health and Addiction (DMHA).
 *
 * This is the single source of truth for PRS course structure.
 * The generator, builder, auditor, and hydration script all read this file.
 * Neither may infer structure from DB rows.
 *
 * Design: fixed spine, flexible ribs.
 *   - 8 modules, fixed order, fixed competency coverage.
 *   - Lesson count per module is bounded (min/max).
 *   - Generator may expand lessons inside bounds; may not invent modules.
 *
 * Slugs are the durable identity. Do not change slugs after lessons are seeded.
 * Titles are display text and may be updated without breaking the builder.
 */

import type { CredentialBlueprint } from './types';

export const prsIndianaBlueprint: CredentialBlueprint = {
  id: 'prs-indiana',
  version: '1.0.0',
  credentialSlug: 'prs',
  credentialTitle: 'Certified Peer Recovery Specialist',
  state: 'IN',
  programSlug: 'peer-recovery-specialist',
  credentialCode: 'IN-PRS',
  trackVariants: ['standard'],
  status: 'active',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 50,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 8,
  expectedLessonCount: 39,

  modules: [
    {
      slug: 'prs-introduction',
      title: 'Foundations of Peer Recovery Support',
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
        { competencyKey: 'prs_role_definition',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'recovery_oriented_principles', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'peer_support_history',         isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'professional_boundaries_intro',isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'The Role of a Peer Recovery Specialist',
        'History and Principles of Peer Support',
        'Recovery-Oriented Language and Perspective',
        'Lived Experience as a Professional Asset',
        'Person-Centered Support and Self-Determination',
      ],
      lessons: [
        { slug: 'role-of-peer-recovery-specialist',              title: 'The Role of a Peer Recovery Specialist',          order: 1, domainKey: 'foundations' },
        { slug: 'history-and-principles-of-peer-support',        title: 'History and Principles of Peer Support',          order: 2, domainKey: 'foundations' },
        { slug: 'recovery-oriented-language-and-perspective',    title: 'Recovery-Oriented Language and Perspective',      order: 3, domainKey: 'foundations' },
        { slug: 'lived-experience-as-a-professional-asset',      title: 'Lived Experience as a Professional Asset',        order: 4, domainKey: 'foundations' },
        { slug: 'person-centered-support-and-self-determination',title: 'Person-Centered Support and Self-Determination',  order: 5, domainKey: 'foundations' },
      ],
    },

    {
      slug: 'prs-advocacy',
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
        { competencyKey: 'systems_advocacy',           isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'rights_responsibilities',    isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'advocacy_practice',          isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Advocacy in Recovery Systems',
        'Navigating Community Resources',
        'Supporting Access to Services',
        'Empowerment and Informed Choice',
        'Reducing Barriers and System Friction',
      ],
      lessons: [
        { slug: 'advocacy-in-recovery-systems',          title: 'Advocacy in Recovery Systems',          order: 1, domainKey: 'advocacy' },
        { slug: 'navigating-community-resources',        title: 'Navigating Community Resources',        order: 2, domainKey: 'advocacy' },
        { slug: 'supporting-access-to-services',         title: 'Supporting Access to Services',         order: 3, domainKey: 'advocacy' },
        { slug: 'empowerment-and-informed-choice',       title: 'Empowerment and Informed Choice',       order: 4, domainKey: 'advocacy' },
        { slug: 'reducing-barriers-and-system-friction', title: 'Reducing Barriers and System Friction', order: 5, domainKey: 'advocacy' },
      ],
    },

    {
      slug: 'prs-peer-skills',
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
        { competencyKey: 'motivational_interviewing', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'sharing_story_effectively', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'rapport_trust_building',    isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Building Trust in Peer Relationships',
        'Using Self-Disclosure Appropriately',
        'Communication Skills for Peer Support',
        'Motivational Support and Encouragement',
        'Maintaining Mutuality and Respect',
      ],
      lessons: [
        { slug: 'building-trust-in-peer-relationships',   title: 'Building Trust in Peer Relationships',   order: 1, domainKey: 'mentoring' },
        { slug: 'using-self-disclosure-appropriately',    title: 'Using Self-Disclosure Appropriately',    order: 2, domainKey: 'mentoring' },
        { slug: 'communication-skills-for-peer-support',  title: 'Communication Skills for Peer Support',  order: 3, domainKey: 'mentoring' },
        { slug: 'motivational-support-and-encouragement', title: 'Motivational Support and Encouragement', order: 4, domainKey: 'mentoring' },
        { slug: 'maintaining-mutuality-and-respect',      title: 'Maintaining Mutuality and Respect',      order: 5, domainKey: 'mentoring' },
      ],
    },

    {
      slug: 'prs-recovery-wellness',
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
        { competencyKey: 'recovery_models',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'stages_of_change',     isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'wellness_self_care',   isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'relapse_prevention',   isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Recovery Education and Wellness Planning',
        'Teaching Self-Advocacy Skills',
        'Sharing Tools for Relapse Prevention',
        'Supporting Goal Setting and Action Steps',
        'Introducing Recovery Capital Concepts',
      ],
      lessons: [
        { slug: 'recovery-education-and-wellness-planning', title: 'Recovery Education and Wellness Planning', order: 1, domainKey: 'education' },
        { slug: 'teaching-self-advocacy-skills',            title: 'Teaching Self-Advocacy Skills',            order: 2, domainKey: 'education' },
        { slug: 'sharing-tools-for-relapse-prevention',     title: 'Sharing Tools for Relapse Prevention',     order: 3, domainKey: 'education' },
        { slug: 'supporting-goal-setting-and-action-steps', title: 'Supporting Goal Setting and Action Steps', order: 4, domainKey: 'education' },
        { slug: 'introducing-recovery-capital-concepts',    title: 'Introducing Recovery Capital Concepts',    order: 5, domainKey: 'education' },
      ],
    },

    {
      slug: 'prs-ethics',
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
        { competencyKey: 'prs_code_of_ethics',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'confidentiality_hipaa',   isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'dual_relationships',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'ethical_decision_making', isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Stages of Change and Recovery Readiness',
        'Wellness Dimensions in Peer Support',
        'Supporting Crisis Awareness and Referral',
        'Community Integration and Natural Supports',
        'Supporting Long-Term Recovery Maintenance',
      ],
      lessons: [
        { slug: 'stages-of-change-and-recovery-readiness',    title: 'Stages of Change and Recovery Readiness',    order: 1, domainKey: 'recovery_support' },
        { slug: 'wellness-dimensions-in-peer-support',        title: 'Wellness Dimensions in Peer Support',        order: 2, domainKey: 'recovery_support' },
        { slug: 'supporting-crisis-awareness-and-referral',   title: 'Supporting Crisis Awareness and Referral',   order: 3, domainKey: 'recovery_support' },
        { slug: 'community-integration-and-natural-supports', title: 'Community Integration and Natural Supports', order: 4, domainKey: 'recovery_support' },
        { slug: 'supporting-long-term-recovery-maintenance',  title: 'Supporting Long-Term Recovery Maintenance',  order: 5, domainKey: 'recovery_support' },
      ],
    },

    {
      slug: 'prs-resource-navigation',
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
        { competencyKey: 'community_resources_overview',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'resource_navigation_strategies', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'benefits_entitlements',          isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'resource_mapping',               isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Ethical Standards in Peer Support',
        'Confidentiality and Privacy',
        'Boundaries and Dual Relationships',
        'Scope of Role and Appropriate Referral',
        'Documentation, Professionalism, and Accountability',
      ],
      lessons: [
        { slug: 'ethical-standards-in-peer-support',               title: 'Ethical Standards in Peer Support',               order: 1, domainKey: 'ethics' },
        { slug: 'confidentiality-and-privacy',                     title: 'Confidentiality and Privacy',                     order: 2, domainKey: 'ethics' },
        { slug: 'boundaries-and-dual-relationships',               title: 'Boundaries and Dual Relationships',               order: 3, domainKey: 'ethics' },
        { slug: 'scope-of-role-and-appropriate-referral',          title: 'Scope of Role and Appropriate Referral',          order: 4, domainKey: 'ethics' },
        { slug: 'documentation-professionalism-and-accountability', title: 'Documentation, Professionalism, and Accountability', order: 5, domainKey: 'ethics' },
      ],
    },

    {
      slug: 'prs-crisis-support',
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
        { competencyKey: 'crisis_recognition_response', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'suicide_risk_awareness',      isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'de_escalation_techniques',    isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'safety_planning',             isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Cultural Humility in Peer Support',
        'Equity, Access, and Inclusive Practice',
        'Trauma-Informed Principles for Peer Work',
        'Avoiding Retraumatization in Support Settings',
        'Supporting Diverse Recovery Pathways',
      ],
      lessons: [
        { slug: 'cultural-humility-in-peer-support',             title: 'Cultural Humility in Peer Support',             order: 1, domainKey: 'cultural_responsiveness' },
        { slug: 'equity-access-and-inclusive-practice',          title: 'Equity, Access, and Inclusive Practice',        order: 2, domainKey: 'cultural_responsiveness' },
        { slug: 'trauma-informed-principles-for-peer-work',      title: 'Trauma-Informed Principles for Peer Work',      order: 3, domainKey: 'cultural_responsiveness' },
        { slug: 'avoiding-retraumatization-in-support-settings', title: 'Avoiding Retraumatization in Support Settings', order: 4, domainKey: 'cultural_responsiveness' },
        { slug: 'supporting-diverse-recovery-pathways',          title: 'Supporting Diverse Recovery Pathways',          order: 5, domainKey: 'cultural_responsiveness' },
      ],
    },

    {
      slug: 'prs-practicum-cert-prep',
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
        { competencyKey: 'practicum_readiness',       isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'field_hours_documentation', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'cprs_exam_readiness',       isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'competency_demonstration',  isCritical: true, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Self-Care and Burnout Prevention',
        'Reflective Practice and Continuous Improvement',
        'Teamwork and Collaboration in Service Settings',
        'Career Pathways for Peer Recovery Specialists',
      ],
      lessons: [
        { slug: 'self-care-and-burnout-prevention',               title: 'Self-Care and Burnout Prevention',               order: 1, domainKey: 'professional_growth' },
        { slug: 'reflective-practice-and-continuous-improvement', title: 'Reflective Practice and Continuous Improvement', order: 2, domainKey: 'professional_growth' },
        { slug: 'teamwork-and-collaboration-in-service-settings', title: 'Teamwork and Collaboration in Service Settings', order: 3, domainKey: 'professional_growth' },
        { slug: 'career-pathways-for-peer-recovery-specialists',  title: 'Career Pathways for Peer Recovery Specialists',  order: 4, domainKey: 'professional_growth' },
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
      scope: 'prs-practicum-cert-prep',
      minQuestions: 50,
      maxQuestions: 75,
      passingThreshold: 0.80,
      distributionConstraints: {
        'recovery_support':    0.20,
        'ethics_boundaries':   0.20,
        'advocacy_navigation': 0.20,
        'crisis_intervention': 0.20,
        'documentation':       0.20,
      },
    },
  ],
};

// ── Hard guards — fail at module load, not at runtime ────────────────────────

const _actualModuleCount = prsIndianaBlueprint.modules.length;
const _actualLessonCount = prsIndianaBlueprint.modules.reduce(
  (sum, m) => sum + (m.lessons?.length ?? 0), 0
);

if (_actualModuleCount !== prsIndianaBlueprint.expectedModuleCount) {
  throw new Error(
    `prs-indiana blueprint invalid: expected ${prsIndianaBlueprint.expectedModuleCount} modules, got ${_actualModuleCount}`
  );
}

if (_actualLessonCount !== prsIndianaBlueprint.expectedLessonCount) {
  throw new Error(
    `prs-indiana blueprint invalid: expected ${prsIndianaBlueprint.expectedLessonCount} lessons, got ${_actualLessonCount}`
  );
}
