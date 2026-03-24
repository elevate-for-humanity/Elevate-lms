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

import type { CredentialBlueprint, BlueprintVideoConfig } from './types';

// Locked video format — matches the 6 produced HVAC lesson videos exactly.
// Do not change without regenerating all lesson videos.
const HVAC_VIDEO_CONFIG: BlueprintVideoConfig = {
  template:            'elevate-slide',
  instructorName:      'Marcus Johnson',
  instructorTitle:     'Master HVAC Technician',
  instructorImagePath: '/images/team/instructors/instructor-trades.jpg',
  topBarColor:         '#f97316',
  accentColor:         '#3b82f6',
  backgroundColor:     '#0f172a',
  ttsVoice:            'onyx',
  ttsSpeed:            0.85,
  slideCount:          5,
  segments:            ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage:  true,
  dalleImageStyle:     'natural',
  width:               1920,
  height:              1080,
};

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

  // 11 modules, 60 pre-defined lessons (including 11 checkpoints + 1 final exam).
  expectedModuleCount: 11,
  expectedLessonCount: 60,

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
      domainKey: 'hvac_foundations',
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
      lessons: [
        { slug: 'hvac-foundations-01', title: 'Introduction to HVAC Systems',          order: 1, domainKey: 'hvac_foundations' },
        { slug: 'hvac-foundations-02', title: 'Heating, Cooling, and Ventilation Basics', order: 2, domainKey: 'hvac_foundations' },
        { slug: 'hvac-foundations-03', title: 'Common Components and System Types',    order: 3, domainKey: 'hvac_foundations' },
        { slug: 'hvac-foundations-04', title: 'Career Paths and EPA 608 Overview',     order: 4, domainKey: 'hvac_foundations' },
        { slug: 'hvac-foundations-checkpoint', title: 'Module 1 Checkpoint Quiz',      order: 5, domainKey: 'hvac_foundations' },
      ],
    },

    {
      slug: 'hvac-safety-tools',
      title: 'Safety, Tools, and Professional Practice',
      orderIndex: 2,
      domainKey: 'hvac_safety',
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
      lessons: [
        { slug: 'hvac-safety-01', title: 'HVAC Safety Fundamentals',                    order: 1, domainKey: 'hvac_safety' },
        { slug: 'hvac-safety-02', title: 'PPE, Lockout/Tagout, and Hazard Awareness',   order: 2, domainKey: 'hvac_safety' },
        { slug: 'hvac-safety-03', title: 'Hand Tools and Power Tools',                  order: 3, domainKey: 'hvac_safety' },
        { slug: 'hvac-safety-04', title: 'Meters, Gauges, and Diagnostic Instruments',  order: 4, domainKey: 'hvac_safety' },
        { slug: 'hvac-safety-05', title: 'Workplace Professionalism and Documentation', order: 5, domainKey: 'hvac_safety' },
        { slug: 'hvac-safety-checkpoint', title: 'Module 2 Checkpoint Quiz',            order: 6, domainKey: 'hvac_safety' },
      ],
    },

    {
      slug: 'hvac-basic-science',
      title: 'Basic Science for HVAC',
      orderIndex: 3,
      domainKey: 'hvac_science',
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
      lessons: [
        { slug: 'hvac-science-01', title: 'Heat, Temperature, and Transfer',            order: 1, domainKey: 'hvac_science' },
        { slug: 'hvac-science-02', title: 'Pressure and Vacuum Basics',                 order: 2, domainKey: 'hvac_science' },
        { slug: 'hvac-science-03', title: 'States of Matter and Refrigerant Behavior',  order: 3, domainKey: 'hvac_science' },
        { slug: 'hvac-science-04', title: 'Measurement Concepts for HVAC',              order: 4, domainKey: 'hvac_science' },
        { slug: 'hvac-science-05', title: 'Applied Science Scenarios',                  order: 5, domainKey: 'hvac_science' },
        { slug: 'hvac-science-checkpoint', title: 'Module 3 Checkpoint Quiz',           order: 6, domainKey: 'hvac_science' },
      ],
    },

    {
      slug: 'refrigeration-cycle',
      title: 'Refrigeration Cycle and System Components',
      orderIndex: 4,
      domainKey: 'refrigeration_cycle',
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
      lessons: [
        { slug: 'refrig-cycle-01', title: 'The Refrigeration Cycle Explained',   order: 1, domainKey: 'refrigeration_cycle' },
        { slug: 'refrig-cycle-02', title: 'Compressors and Their Function',       order: 2, domainKey: 'refrigeration_cycle' },
        { slug: 'refrig-cycle-03', title: 'Condensers and Heat Rejection',        order: 3, domainKey: 'refrigeration_cycle' },
        { slug: 'refrig-cycle-04', title: 'Metering Devices and Flow Control',    order: 4, domainKey: 'refrigeration_cycle' },
        { slug: 'refrig-cycle-05', title: 'Evaporators and Heat Absorption',      order: 5, domainKey: 'refrigeration_cycle' },
        { slug: 'refrig-cycle-06', title: 'Reading the Whole System',             order: 6, domainKey: 'refrigeration_cycle' },
        { slug: 'refrig-cycle-checkpoint', title: 'Module 4 Checkpoint Quiz',     order: 7, domainKey: 'refrigeration_cycle' },
      ],
    },

    {
      slug: 'refrigerant-handling',
      title: 'Refrigerants, Recovery, Recycling, and Charging',
      orderIndex: 5,
      domainKey: 'refrigerant_handling',
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
      lessons: [
        { slug: 'refrig-handling-01', title: 'Refrigerant Types and Characteristics',       order: 1, domainKey: 'refrigerant_handling' },
        { slug: 'refrig-handling-02', title: 'Environmental Impact and Regulatory Context', order: 2, domainKey: 'refrigerant_handling' },
        { slug: 'refrig-handling-03', title: 'Recovery, Recycling, and Reclamation',        order: 3, domainKey: 'refrigerant_handling' },
        { slug: 'refrig-handling-04', title: 'Cylinder Safety and Refrigerant Handling',    order: 4, domainKey: 'refrigerant_handling' },
        { slug: 'refrig-handling-05', title: 'Evacuation and Charging Fundamentals',        order: 5, domainKey: 'refrigerant_handling' },
        { slug: 'refrig-handling-06', title: 'Common Handling Errors',                      order: 6, domainKey: 'refrigerant_handling' },
        { slug: 'refrig-handling-checkpoint', title: 'Module 5 Checkpoint Quiz',            order: 7, domainKey: 'refrigerant_handling' },
      ],
    },

    {
      slug: 'epa-608-regulations',
      title: 'EPA 608 Regulatory Core',
      orderIndex: 6,
      domainKey: 'epa608_regulations',
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
      lessons: [
        { slug: 'epa-regs-01', title: 'EPA 608 Regulatory Framework',          order: 1, domainKey: 'epa608_regulations' },
        { slug: 'epa-regs-02', title: 'Technician Certification Rules',         order: 2, domainKey: 'epa608_regulations' },
        { slug: 'epa-regs-03', title: 'Prohibited Practices and Violations',    order: 3, domainKey: 'epa608_regulations' },
        { slug: 'epa-regs-04', title: 'Recordkeeping and Compliance Basics',    order: 4, domainKey: 'epa608_regulations' },
        { slug: 'epa-regs-05', title: 'Regulation Review Drill',                order: 5, domainKey: 'epa608_regulations' },
        { slug: 'epa-regs-checkpoint', title: 'Module 6 Checkpoint Quiz',       order: 6, domainKey: 'epa608_regulations' },
      ],
    },

    {
      slug: 'epa-608-type-1',
      title: 'Type I — Small Appliances',
      orderIndex: 7,
      domainKey: 'epa608_type1',
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
      lessons: [
        { slug: 'type1-01', title: 'What Counts as Type I Equipment',    order: 1, domainKey: 'epa608_type1' },
        { slug: 'type1-02', title: 'Type I Recovery Requirements',       order: 2, domainKey: 'epa608_type1' },
        { slug: 'type1-03', title: 'Servicing Small Appliances Safely',  order: 3, domainKey: 'epa608_type1' },
        { slug: 'type1-04', title: 'Type I Exam Scenarios',              order: 4, domainKey: 'epa608_type1' },
        { slug: 'type1-checkpoint', title: 'Module 7 Checkpoint Quiz',   order: 5, domainKey: 'epa608_type1' },
      ],
    },

    {
      slug: 'epa-608-type-2',
      title: 'Type II — High-Pressure Appliances',
      orderIndex: 8,
      domainKey: 'epa608_type2',
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
      lessons: [
        { slug: 'type2-01', title: 'Understanding Type II Appliances',                  order: 1, domainKey: 'epa608_type2' },
        { slug: 'type2-02', title: 'Recovery and Leak Repair Requirements',             order: 2, domainKey: 'epa608_type2' },
        { slug: 'type2-03', title: 'Service Procedures for High-Pressure Systems',      order: 3, domainKey: 'epa608_type2' },
        { slug: 'type2-04', title: 'Type II Exam Scenarios',                            order: 4, domainKey: 'epa608_type2' },
        { slug: 'type2-checkpoint', title: 'Module 8 Checkpoint Quiz',                  order: 5, domainKey: 'epa608_type2' },
      ],
    },

    {
      slug: 'epa-608-type-3',
      title: 'Type III — Low-Pressure Appliances',
      orderIndex: 9,
      domainKey: 'epa608_type3',
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
      lessons: [
        { slug: 'type3-01', title: 'Understanding Type III Appliances',          order: 1, domainKey: 'epa608_type3' },
        { slug: 'type3-02', title: 'Low-Pressure System Service Rules',          order: 2, domainKey: 'epa608_type3' },
        { slug: 'type3-03', title: 'Recovery and Evacuation for Type III',       order: 3, domainKey: 'epa608_type3' },
        { slug: 'type3-04', title: 'Type III Exam Scenarios',                    order: 4, domainKey: 'epa608_type3' },
        { slug: 'type3-checkpoint', title: 'Module 9 Checkpoint Quiz',           order: 5, domainKey: 'epa608_type3' },
      ],
    },

    {
      slug: 'epa-608-universal-review',
      title: 'Universal Certification Review',
      orderIndex: 10,
      domainKey: 'epa608_universal',
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
      lessons: [
        { slug: 'universal-01', title: 'Universal Exam Structure and Strategy',  order: 1, domainKey: 'epa608_universal' },
        { slug: 'universal-02', title: 'Cross-Type Review and Comparison',       order: 2, domainKey: 'epa608_universal' },
        { slug: 'universal-03', title: 'Common Mistakes and Trap Questions',     order: 3, domainKey: 'epa608_universal' },
        { slug: 'universal-checkpoint', title: 'Module 10 Checkpoint Quiz',      order: 4, domainKey: 'epa608_universal' },
      ],
    },

    {
      slug: 'final-assessment',
      title: 'Final Assessment and Remediation',
      orderIndex: 11,
      domainKey: 'epa608_final',
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
      lessons: [
        { slug: 'final-practice-exam',    title: 'Final EPA 608 Practice Exam',      order: 1, domainKey: 'epa608_final' },
        { slug: 'final-score-review',     title: 'Score Review and Weakness Analysis', order: 2, domainKey: 'epa608_final' },
        { slug: 'final-remediation',      title: 'Targeted Remediation Lesson',       order: 3, domainKey: 'epa608_final' },
        { slug: 'final-epa608-exam',      title: 'EPA 608 Final Exam',                order: 4, domainKey: 'epa608_final' },
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

  videoConfig: HVAC_VIDEO_CONFIG,
};

// ── Hard guard — fail at module load, not at runtime ─────────────────────────

const _actualModuleCount = HVAC_EPA608_BLUEPRINT.modules.length;
if (_actualModuleCount !== HVAC_EPA608_BLUEPRINT.expectedModuleCount) {
  throw new Error(
    `hvac-epa608 blueprint invalid: expected ${HVAC_EPA608_BLUEPRINT.expectedModuleCount} modules, got ${_actualModuleCount}`
  );
}

const _actualLessonCount = HVAC_EPA608_BLUEPRINT.modules.reduce(
  (sum, m) => sum + (m.lessons?.length ?? 0), 0
);
if (_actualLessonCount !== HVAC_EPA608_BLUEPRINT.expectedLessonCount) {
  throw new Error(
    `hvac-epa608 blueprint invalid: expected ${HVAC_EPA608_BLUEPRINT.expectedLessonCount} lessons, got ${_actualLessonCount}`
  );
}
