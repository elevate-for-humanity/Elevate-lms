/**
 * lib/curriculum/blueprints/hvac-epa-608.ts
 *
 * Canonical blueprint for the HVAC / EPA Section 608 program.
 *
 * This is the structural authority for the HVAC course.
 * The generator reads this file. The auditor validates against it.
 * Do not change module order, required competencies, or quiz rules
 * without bumping the version string.
 *
 * Design: fixed spine, flexible ribs.
 *   - 11 modules, fixed order, fixed competency coverage.
 *   - Lesson count per module is bounded (min/max).
 *   - Generator may expand lessons inside bounds; may not invent modules.
 *
 * lessons[] is not pre-defined for HVAC — the generator produces lesson slugs
 * dynamically. expectedLessonCount is 0 for generation-rules blueprints.
 */

import type { CredentialBlueprint } from './types';

export const HVAC_EPA608_BLUEPRINT: CredentialBlueprint = {
  id: 'hvac-epa608-v1',
  version: '1.0.0',
  credentialSlug: 'epa-608',
  credentialTitle: 'EPA Section 608 Technician Certification',
  state: 'federal',
  programSlug: 'hvac-technician',
  credentialCode: 'EPA-608',
  trackVariants: ['type_i', 'type_ii', 'type_iii', 'universal'],
  status: 'active',

  // Generation-rules blueprint — lessons are produced by the generator, not pre-defined.
  expectedModuleCount: 11,
  expectedLessonCount: 0,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 80,
    requiresFinalExam: true,
    requiresUniversalReview: true,
    generatorMode: 'fixed',
  },

  modules: [
    {
      slug: 'hvac-foundations',
      title: 'HVAC Foundations and Career Orientation',
      orderIndex: 1,
      minLessons: 3,
      maxLessons: 5,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'concept',     requiredCount: 1 },
        { lessonType: 'quiz',        requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hvac_career_scope',          isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_system_categories',     isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_core_terminology',      isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_system_functions',      isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Introduction to HVAC Systems',
        'Heating, Cooling, and Ventilation Basics',
        'Common Components and System Types',
        'Career Paths and EPA 608 Overview',
        'Module Checkpoint Quiz',
      ],
    },

    {
      slug: 'hvac-safety-tools',
      title: 'Safety, Tools, and Professional Practice',
      orderIndex: 2,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'safety',    requiredCount: 1 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'concept',   requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hvac_safety_procedures',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_hazard_recognition',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_tool_identification',  isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_safe_handling',        isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'HVAC Safety Fundamentals',
        'PPE, Lockout/Tagout, and Hazard Awareness',
        'Hand Tools and Power Tools',
        'Meters, Gauges, and Diagnostic Instruments',
        'Workplace Professionalism and Documentation',
        'Module Checkpoint Quiz',
      ],
    },

    {
      slug: 'hvac-basic-science',
      title: 'Basic Science for HVAC',
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
        { competencyKey: 'hvac_heat_theory',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_pressure_theory',      isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_phase_change',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_measurement_concepts', isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Heat, Temperature, and Transfer',
        'Pressure and Vacuum Basics',
        'States of Matter and Refrigerant Behavior',
        'Measurement Concepts for HVAC',
        'Applied Science Scenarios',
        'Module Checkpoint Quiz',
      ],
    },

    {
      slug: 'refrigeration-cycle',
      title: 'Refrigeration Cycle and System Components',
      orderIndex: 4,
      minLessons: 5,
      maxLessons: 7,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 2 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'scenario',  requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'refrigeration_cycle_overview',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigeration_component_roles',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigerant_flow',                isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigeration_symptom_diagnosis', isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'The Refrigeration Cycle Explained',
        'Compressors and Their Function',
        'Condensers and Heat Rejection',
        'Metering Devices and Flow Control',
        'Evaporators and Heat Absorption',
        'Reading the Whole System',
        'Module Checkpoint Quiz',
      ],
    },

    {
      slug: 'refrigerant-handling',
      title: 'Refrigerants, Recovery, Recycling, and Charging',
      orderIndex: 5,
      minLessons: 5,
      maxLessons: 7,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 1 },
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'safety',     requiredCount: 1 },
        { lessonType: 'procedure',  requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'refrigerant_categories',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigerant_environmental_impact',isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'recovery_recycling_reclamation',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'cylinder_safety',                 isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'evacuation_charging',             isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Refrigerant Types and Characteristics',
        'Environmental Impact and Regulatory Context',
        'Recovery, Recycling, and Reclamation',
        'Cylinder Safety and Refrigerant Handling',
        'Evacuation and Charging Fundamentals',
        'Common Handling Errors',
        'Module Checkpoint Quiz',
      ],
    },

    {
      slug: 'epa-608-regulations',
      title: 'EPA 608 Regulatory Core',
      orderIndex: 6,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 2 },
        { lessonType: 'review',     requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'epa608_regulatory_framework',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'epa608_technician_certification',isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'epa608_prohibited_practices',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'epa608_recordkeeping',           isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'EPA 608 Regulatory Framework',
        'Technician Certification Rules',
        'Prohibited Practices and Violations',
        'Recordkeeping and Compliance Basics',
        'Regulation Review Drill',
        'Module Checkpoint Quiz',
      ],
    },

    {
      slug: 'epa-608-type-1',
      title: 'Type I — Small Appliances',
      orderIndex: 7,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'procedure',  requiredCount: 1 },
        { lessonType: 'scenario',   requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'type1_appliance_scope',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type1_recovery_requirements', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type1_service_rules',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type1_exam_patterns',         isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'What Counts as Type I Equipment',
        'Type I Recovery Requirements',
        'Servicing Small Appliances Safely',
        'Type I Exam Scenarios',
        'Type I Quiz',
      ],
    },

    {
      slug: 'epa-608-type-2',
      title: 'Type II — High-Pressure Appliances',
      orderIndex: 8,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'procedure',  requiredCount: 1 },
        { lessonType: 'scenario',   requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'type2_appliance_scope',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type2_recovery_leak_rules',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type2_service_procedures',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type2_exam_patterns',         isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Understanding Type II Appliances',
        'Recovery and Leak Repair Requirements',
        'Service Procedures for High-Pressure Systems',
        'Type II Exam Scenarios',
        'Type II Quiz',
      ],
    },

    {
      slug: 'epa-608-type-3',
      title: 'Type III — Low-Pressure Appliances',
      orderIndex: 9,
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'procedure',  requiredCount: 1 },
        { lessonType: 'scenario',   requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'type3_appliance_scope',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type3_recovery_requirements', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type3_service_procedures',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type3_exam_patterns',         isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Understanding Type III Appliances',
        'Low-Pressure System Service Rules',
        'Recovery and Evacuation for Type III',
        'Type III Exam Scenarios',
        'Type III Quiz',
      ],
    },

    {
      slug: 'epa-608-universal-review',
      title: 'Universal Certification Review',
      orderIndex: 10,
      minLessons: 3,
      maxLessons: 5,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'review',   requiredCount: 2 },
        { lessonType: 'scenario', requiredCount: 1 },
        { lessonType: 'quiz',     requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'universal_cross_domain_integration', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'universal_weak_area_identification', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'universal_exam_strategy',            isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Universal Exam Structure and Strategy',
        'Cross-Type Review and Comparison',
        'Common Mistakes and Trap Questions',
        'Universal Readiness Quiz',
      ],
    },

    {
      slug: 'final-assessment',
      title: 'Final Assessment and Remediation',
      orderIndex: 11,
      minLessons: 2,
      maxLessons: 4,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'final_exam',   requiredCount: 1 },
        { lessonType: 'remediation',  requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'full_course_readiness',    isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'remediation_completion',   isCritical: true, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Final EPA 608 Practice Exam',
        'Score Review and Weakness Analysis',
        'Targeted Remediation Lesson',
        'Retake or Mastery Check',
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
      assessmentType: 'type_specific',
      scope: 'epa-608-type-1',
      minQuestions: 10,
      maxQuestions: 20,
      passingThreshold: 0.75,
    },
    {
      assessmentType: 'type_specific',
      scope: 'epa-608-type-2',
      minQuestions: 10,
      maxQuestions: 20,
      passingThreshold: 0.75,
    },
    {
      assessmentType: 'type_specific',
      scope: 'epa-608-type-3',
      minQuestions: 10,
      maxQuestions: 20,
      passingThreshold: 0.75,
    },
    {
      assessmentType: 'universal_review',
      scope: 'epa-608-universal-review',
      minQuestions: 20,
      maxQuestions: 30,
      passingThreshold: 0.75,
    },
    {
      assessmentType: 'final',
      scope: 'final-assessment',
      minQuestions: 50,
      maxQuestions: 100,
      passingThreshold: 0.80,
      // Enforce balanced domain distribution — no domain may be < 15% of final exam
      distributionConstraints: {
        'epa608_regulatory_framework':    0.15,
        'refrigerant_handling':           0.15,
        'type1_appliance_scope':          0.10,
        'type2_appliance_scope':          0.15,
        'type3_appliance_scope':          0.10,
        'refrigeration_cycle_overview':   0.15,
        'hvac_safety_procedures':         0.10,
      },
    },
  ],
};

// ── Hard guard — fail at module load, not at runtime ─────────────────────────

const _actualModuleCount = HVAC_EPA608_BLUEPRINT.modules.length;
if (_actualModuleCount !== HVAC_EPA608_BLUEPRINT.expectedModuleCount) {
  throw new Error(
    `hvac-epa608 blueprint invalid: expected ${HVAC_EPA608_BLUEPRINT.expectedModuleCount} modules, got ${_actualModuleCount}`
  );
}
