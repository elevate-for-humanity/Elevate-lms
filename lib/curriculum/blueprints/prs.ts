/**
 * lib/curriculum/blueprints/prs.ts
 *
 * Canonical blueprint for the Peer Recovery Specialist program.
 *
 * Credential authority: Indiana Division of Mental Health and Addiction (DMHA)
 * Credential: Certified Peer Recovery Specialist (CPRS)
 * Exam domains: 5 (recovery_support, ethics_boundaries, advocacy_navigation,
 *                   crisis_intervention, documentation)
 *
 * Design: fixed spine, flexible ribs.
 *   - 8 modules, fixed order, fixed competency coverage.
 *   - Lesson count per module is bounded (min/max).
 *   - Generator may expand lessons inside bounds; may not invent modules.
 */

import type { CredentialBlueprint } from './types';

export const PRS_BLUEPRINT: CredentialBlueprint = {
  slug: 'in-prs-v1',
  title: 'Peer Recovery Specialist — Indiana CPRS',
  version: '1.0.0',
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

  modules: [
    {
      slug: 'prs-introduction',
      title: 'Introduction to Peer Recovery',
      orderIndex: 1,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'concept',     requiredCount: 2 },
        { lessonType: 'quiz',        requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'prs_role_definition',        isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'recovery_oriented_principles',isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'peer_support_history',        isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'professional_boundaries_intro',isCritical: true, minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Peer Recovery Specialist Role',
        'Recovery-Oriented Principles',
        'History of the Peer Support Movement',
        'Professional Boundaries',
        'Introduction Quiz',
      ],
    },

    {
      slug: 'prs-ethics',
      title: 'Ethics and Professional Conduct',
      orderIndex: 2,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'concept',    requiredCount: 1 },
        { lessonType: 'scenario',   requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'prs_code_of_ethics',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'confidentiality_hipaa',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'dual_relationships',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'ethical_decision_making',     isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Code of Ethics for Peer Specialists',
        'Confidentiality and HIPAA',
        'Dual Relationships and Boundaries',
        'Ethical Dilemmas Practice',
        'Ethics Quiz',
      ],
    },

    {
      slug: 'prs-recovery-wellness',
      title: 'Recovery and Wellness',
      orderIndex: 3,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 2 },
        { lessonType: 'scenario',  requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'recovery_models',             isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'stages_of_change',            isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'wellness_self_care',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'relapse_prevention',          isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Models of Recovery',
        'Stages of Change',
        'Wellness and Self-Care',
        'Relapse Prevention',
        'Recovery Models Quiz',
      ],
    },

    {
      slug: 'prs-peer-skills',
      title: 'Peer Support Skills',
      orderIndex: 4,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: false,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'lab',       requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'active_listening_empathy',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'motivational_interviewing',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'sharing_story_effectively',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'rapport_trust_building',      isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Active Listening and Empathy',
        'Motivational Interviewing Basics',
        'Sharing Your Story Effectively',
        'Building Rapport and Trust',
        'Peer Support Practice Lab',
      ],
    },

    {
      slug: 'prs-advocacy',
      title: 'Advocacy and Empowerment',
      orderIndex: 5,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'regulation',requiredCount: 1 },
        { lessonType: 'scenario',  requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'self_advocacy_empowerment',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'systems_advocacy',            isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'rights_responsibilities',     isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'advocacy_practice',           isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Self-Advocacy and Empowerment',
        'Systems Advocacy',
        'Rights and Responsibilities',
        'Advocacy Practice Scenarios',
        'Advocacy Quiz',
      ],
    },

    {
      slug: 'prs-resource-navigation',
      title: 'Resource Navigation and Linkage',
      orderIndex: 6,
      minLessons: 3,
      maxLessons: 5,
      quizRequired: false,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'lab',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'community_resources_overview', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'resource_navigation_strategies',isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'benefits_entitlements',        isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'resource_mapping',             isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Community Resources Overview',
        'Resource Navigation Strategies',
        'Benefits and Entitlements',
        'Resource Mapping Practice',
      ],
    },

    {
      slug: 'prs-crisis-support',
      title: 'Crisis Support and Safety',
      orderIndex: 7,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'safety',    requiredCount: 1 },
        { lessonType: 'lab',       requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'crisis_recognition_response',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'suicide_risk_awareness',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'de_escalation_techniques',     isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'safety_planning',              isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Crisis Recognition and Response',
        'Suicide Risk Awareness',
        'De-Escalation Techniques',
        'Safety Planning',
        'Crisis Response Quiz',
      ],
    },

    {
      slug: 'prs-practicum-cert-prep',
      title: 'Field Practicum and Certification Prep',
      orderIndex: 8,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'practicum',   requiredCount: 1 },
        { lessonType: 'review',      requiredCount: 1 },
        { lessonType: 'final_exam',  requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'practicum_readiness',          isCritical: true,  minimumTouchpoints: 1 },
        { competencyKey: 'field_hours_documentation',    isCritical: true,  minimumTouchpoints: 1 },
        { competencyKey: 'cprs_exam_readiness',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'competency_demonstration',     isCritical: true,  minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Practicum Preparation',
        'Field Practicum Hours',
        'Certification Exam Overview',
        'Practice Exam',
        'Final Competency Assessment',
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
      // Balanced domain distribution across all 5 CPRS exam domains
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
