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
 *   - 10 modules, fixed order, fixed competency coverage.
 *   - Lesson count per module is bounded (min/max).
 *   - lessons[] slugs match live curriculum_lessons rows exactly (hvac-lesson-1…95).
 *   - Content and quiz_questions are sourced from curriculum_lessons at seed time.
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

  // 10 modules, 95 lessons — slugs match live curriculum_lessons rows exactly.
  expectedModuleCount: 10,
  expectedLessonCount: 95,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 95,
    requiresFinalExam: true,
    requiresUniversalReview: true,
    generatorMode: 'fixed',
  },

  modules: [
    {
      slug: 'hvac-module-1',
      title: 'Module 1: HVAC Foundations & Orientation',
      orderIndex: 1,
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'hvac_foundations',
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'concept',     requiredCount: 2 },
        { lessonType: 'quiz',        requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'hvac_career_scope',          isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_system_categories',     isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_core_terminology',      isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_system_functions',      isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Welcome to HVAC Technician Training',
        'WIOA Funding, Attendance & Support Services',
        'HVAC Career Pathways',
        'Orientation Quiz',
        'How HVAC Systems Work',
        'HVAC Tools & Equipment',
        'PPE & Shop Safety',
        'System Components Identification',
        'HVAC Fundamentals Quiz',
        'Voltage, Current, Resistance & Ohms Law',
      ],
      lessons: [
        { slug: 'hvac-lesson-1',  title: 'Welcome to HVAC Technician Training',      order: 1,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-2',  title: 'WIOA Funding, Attendance & Support Services', order: 2, domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-3',  title: 'HVAC Career Pathways',                     order: 3,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-4',  title: 'Orientation Quiz',                         order: 4,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-5',  title: 'How HVAC Systems Work',                    order: 5,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-6',  title: 'HVAC Tools & Equipment',                   order: 6,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-7',  title: 'PPE & Shop Safety',                        order: 7,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-8',  title: 'System Components Identification',         order: 8,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-9',  title: 'HVAC Fundamentals Quiz',                   order: 9,  domainKey: 'hvac_foundations' },
        { slug: 'hvac-lesson-10', title: 'Voltage, Current, Resistance & Ohms Law',  order: 10, domainKey: 'hvac_foundations' },
      ],
    },

    {
      slug: 'hvac-module-2',
      title: 'Module 2: Electrical & Heating Systems',
      orderIndex: 2,
      domainKey: 'hvac_electrical',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 2 },
        { lessonType: 'lab',       requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'hvac_electrical_fundamentals', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_wiring_diagrams',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_heating_systems',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_combustion_analysis',     isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Reading Wiring Diagrams & Schematics',
        'Multimeter & Amp Clamp Lab',
        'Capacitors, Contactors & Relays',
        'Electrical Basics Quiz',
        'Gas Furnace Operation',
        'Electric Heat & Heat Strips',
        'Heat Pump Heating Mode',
        'Combustion Analysis',
        'Furnace Inspection Lab',
        'Heating Systems Quiz',
      ],
      lessons: [
        { slug: 'hvac-lesson-11', title: 'Reading Wiring Diagrams & Schematics', order: 1,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-12', title: 'Multimeter & Amp Clamp Lab',           order: 2,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-13', title: 'Capacitors, Contactors & Relays',      order: 3,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-14', title: 'Electrical Basics Quiz',               order: 4,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-15', title: 'Gas Furnace Operation',                order: 5,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-16', title: 'Electric Heat & Heat Strips',          order: 6,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-17', title: 'Heat Pump Heating Mode',               order: 7,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-18', title: 'Combustion Analysis',                  order: 8,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-19', title: 'Furnace Inspection Lab',               order: 9,  domainKey: 'hvac_electrical' },
        { slug: 'hvac-lesson-20', title: 'Heating Systems Quiz',                 order: 10, domainKey: 'hvac_electrical' },
      ],
    },

    {
      slug: 'hvac-module-3',
      title: 'Module 3: Cooling Systems & EPA 608 Core',
      orderIndex: 3,
      domainKey: 'refrigeration_cycle',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 2 },
        { lessonType: 'lab',        requiredCount: 1 },
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'refrigeration_cycle_overview',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigerant_environmental_impact',isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'epa608_regulatory_framework',     isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigerant_categories',          isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'The Refrigeration Cycle',
        'Pressure-Temperature Relationship',
        'Compressor Types & Operation',
        'Metering Devices',
        'Superheat & Subcooling Lab',
        'Cooling Systems Quiz + Cumulative Mastery',
        'Ozone Layer & Environmental Impact',
        'Clean Air Act Section 608',
        'Refrigerant Safety',
        'Refrigerant Types & Classifications',
      ],
      lessons: [
        { slug: 'hvac-lesson-21', title: 'The Refrigeration Cycle',                                    order: 1,  domainKey: 'refrigeration_cycle' },
        { slug: 'hvac-lesson-22', title: 'Pressure-Temperature Relationship',                          order: 2,  domainKey: 'refrigeration_cycle' },
        { slug: 'hvac-lesson-23', title: 'Compressor Types & Operation',                               order: 3,  domainKey: 'refrigeration_cycle' },
        { slug: 'hvac-lesson-24', title: 'Metering Devices',                                           order: 4,  domainKey: 'refrigeration_cycle' },
        { slug: 'hvac-lesson-25', title: 'Superheat & Subcooling Lab',                                 order: 5,  domainKey: 'refrigeration_cycle' },
        { slug: 'hvac-lesson-26', title: 'Cooling Systems Quiz + Cumulative Mastery (Modules 1-5)',    order: 6,  domainKey: 'refrigeration_cycle' },
        { slug: 'hvac-lesson-27', title: 'Ozone Layer & Environmental Impact',                         order: 7,  domainKey: 'epa608_regulations' },
        { slug: 'hvac-lesson-28', title: 'Clean Air Act Section 608',                                  order: 8,  domainKey: 'epa608_regulations' },
        { slug: 'hvac-lesson-29', title: 'Refrigerant Safety',                                         order: 9,  domainKey: 'refrigerant_handling' },
        { slug: 'hvac-lesson-30', title: 'Refrigerant Types & Classifications',                        order: 10, domainKey: 'refrigerant_handling' },
      ],
    },

    {
      slug: 'hvac-module-4',
      title: 'Module 4: EPA 608 Type I & Type II',
      orderIndex: 4,
      domainKey: 'refrigerant_handling',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 2 },
        { lessonType: 'concept',    requiredCount: 2 },
        { lessonType: 'quiz',       requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'recovery_recycling_reclamation',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type1_appliance_scope',           isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type1_recovery_requirements',     isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type2_appliance_scope',           isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Pressure-Temperature Fundamentals',
        'Recovery, Recycling & Reclamation',
        'Refrigerant Sales Restrictions',
        'EPA 608 Core Practice Exam',
        'Small Appliance Systems',
        'Type I Recovery Requirements',
        'Self-Contained Recovery Equipment',
        'Leak Repair Exemptions',
        'EPA 608 Type I Practice Exam',
        'High-Pressure System Overview',
      ],
      lessons: [
        { slug: 'hvac-lesson-31', title: 'Pressure-Temperature Fundamentals',    order: 1,  domainKey: 'refrigerant_handling' },
        { slug: 'hvac-lesson-32', title: 'Recovery, Recycling & Reclamation',    order: 2,  domainKey: 'refrigerant_handling' },
        { slug: 'hvac-lesson-33', title: 'Refrigerant Sales Restrictions',       order: 3,  domainKey: 'epa608_regulations' },
        { slug: 'hvac-lesson-34', title: 'EPA 608 Core Practice Exam',           order: 4,  domainKey: 'epa608_regulations' },
        { slug: 'hvac-lesson-35', title: 'Small Appliance Systems',              order: 5,  domainKey: 'epa608_type1' },
        { slug: 'hvac-lesson-36', title: 'Type I Recovery Requirements',         order: 6,  domainKey: 'epa608_type1' },
        { slug: 'hvac-lesson-37', title: 'Self-Contained Recovery Equipment',    order: 7,  domainKey: 'epa608_type1' },
        { slug: 'hvac-lesson-38', title: 'Leak Repair Exemptions',               order: 8,  domainKey: 'epa608_type1' },
        { slug: 'hvac-lesson-39', title: 'EPA 608 Type I Practice Exam',         order: 9,  domainKey: 'epa608_type1' },
        { slug: 'hvac-lesson-40', title: 'High-Pressure System Overview',        order: 10, domainKey: 'epa608_type2' },
      ],
    },

    {
      slug: 'hvac-module-5',
      title: 'Module 5: EPA 608 Type II & Type III',
      orderIndex: 5,
      domainKey: 'epa608_type2',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'procedure',  requiredCount: 1 },
        { lessonType: 'lab',        requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'type2_recovery_leak_rules',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type2_service_procedures',    isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type3_appliance_scope',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'type3_recovery_requirements', isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Type II Recovery Requirements',
        'Leak Detection Methods',
        'Evacuation Procedures',
        'Leak Repair Requirements',
        'Recovery Equipment Lab',
        'EPA 608 Type II Practice Exam',
        'Low-Pressure System Overview',
        'Type III Recovery Requirements',
        'Purge Units & Air Removal',
        'Water in Low-Pressure Systems',
      ],
      lessons: [
        { slug: 'hvac-lesson-41', title: 'Type II Recovery Requirements',    order: 1,  domainKey: 'epa608_type2' },
        { slug: 'hvac-lesson-42', title: 'Leak Detection Methods',           order: 2,  domainKey: 'epa608_type2' },
        { slug: 'hvac-lesson-43', title: 'Evacuation Procedures',            order: 3,  domainKey: 'epa608_type2' },
        { slug: 'hvac-lesson-44', title: 'Leak Repair Requirements',         order: 4,  domainKey: 'epa608_type2' },
        { slug: 'hvac-lesson-45', title: 'Recovery Equipment Lab',           order: 5,  domainKey: 'epa608_type2' },
        { slug: 'hvac-lesson-46', title: 'EPA 608 Type II Practice Exam',    order: 6,  domainKey: 'epa608_type2' },
        { slug: 'hvac-lesson-47', title: 'Low-Pressure System Overview',     order: 7,  domainKey: 'epa608_type3' },
        { slug: 'hvac-lesson-48', title: 'Type III Recovery Requirements',   order: 8,  domainKey: 'epa608_type3' },
        { slug: 'hvac-lesson-49', title: 'Purge Units & Air Removal',        order: 9,  domainKey: 'epa608_type3' },
        { slug: 'hvac-lesson-50', title: 'Water in Low-Pressure Systems',    order: 10, domainKey: 'epa608_type3' },
      ],
    },

    {
      slug: 'hvac-module-6',
      title: 'Module 6: EPA 608 Type III & Universal Review',
      orderIndex: 6,
      domainKey: 'epa608_type3',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'regulation', requiredCount: 1 },
        { lessonType: 'review',     requiredCount: 2 },
        { lessonType: 'quiz',       requiredCount: 5 },
      ],
      competencies: [
        { competencyKey: 'type3_service_procedures',           isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'universal_cross_domain_integration', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'epa608_regulatory_framework',        isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'refrigerant_handling',               isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Rupture Disc & Pressure Relief',
        'EPA 608 Type III Practice Exam',
        'Core Section Review',
        'Type I, II, III Comparison Chart',
        'Full-Length Practice Exam Core',
        'Full-Length Practice Exam Type I',
        'Full-Length Practice Exam Type II',
        'Full-Length Practice Exam Type III',
        'EPA 608 Universal Full Practice Exam',
        'Refrigerant Charging Methods',
      ],
      lessons: [
        { slug: 'hvac-lesson-51', title: 'Rupture Disc & Pressure Relief',              order: 1,  domainKey: 'epa608_type3' },
        { slug: 'hvac-lesson-52', title: 'EPA 608 Type III Practice Exam',              order: 2,  domainKey: 'epa608_type3' },
        { slug: 'hvac-lesson-53', title: 'Core Section Review',                         order: 3,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-54', title: 'Type I, II, III Comparison Chart',            order: 4,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-55', title: 'Full-Length Practice Exam Core',              order: 5,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-56', title: 'Full-Length Practice Exam Type I',            order: 6,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-57', title: 'Full-Length Practice Exam Type II',           order: 7,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-58', title: 'Full-Length Practice Exam Type III',          order: 8,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-59', title: 'EPA 608 Universal Full Practice Exam',        order: 9,  domainKey: 'epa608_universal' },
        { slug: 'hvac-lesson-60', title: 'Refrigerant Charging Methods',                order: 10, domainKey: 'refrigerant_handling' },
      ],
    },

    {
      slug: 'hvac-module-7',
      title: 'Module 7: Refrigeration Diagnostics & Installation',
      orderIndex: 7,
      domainKey: 'hvac_diagnostics',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lab',       requiredCount: 2 },
        { lessonType: 'concept',   requiredCount: 2 },
        { lessonType: 'procedure', requiredCount: 1 },
        { lessonType: 'quiz',      requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'refrigeration_symptom_diagnosis', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'evacuation_charging',             isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_installation',               isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_system_startup',             isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'System Diagnostics with Gauges',
        'Leak Detection Lab',
        'Recovery & Evacuation Lab',
        'Refrigeration Diagnostics Quiz',
        'Ductwork Design & Installation',
        'Equipment Sizing Manual J Basics',
        'Brazing & Soldering',
        'Line Set Installation',
        'System Startup Procedures',
        'Installation Quiz',
      ],
      lessons: [
        { slug: 'hvac-lesson-61', title: 'System Diagnostics with Gauges',       order: 1,  domainKey: 'hvac_diagnostics' },
        { slug: 'hvac-lesson-62', title: 'Leak Detection Lab',                   order: 2,  domainKey: 'hvac_diagnostics' },
        { slug: 'hvac-lesson-63', title: 'Recovery & Evacuation Lab',            order: 3,  domainKey: 'hvac_diagnostics' },
        { slug: 'hvac-lesson-64', title: 'Refrigeration Diagnostics Quiz',       order: 4,  domainKey: 'hvac_diagnostics' },
        { slug: 'hvac-lesson-65', title: 'Ductwork Design & Installation',       order: 5,  domainKey: 'hvac_installation' },
        { slug: 'hvac-lesson-66', title: 'Equipment Sizing Manual J Basics',     order: 6,  domainKey: 'hvac_installation' },
        { slug: 'hvac-lesson-67', title: 'Brazing & Soldering',                  order: 7,  domainKey: 'hvac_installation' },
        { slug: 'hvac-lesson-68', title: 'Line Set Installation',                order: 8,  domainKey: 'hvac_installation' },
        { slug: 'hvac-lesson-69', title: 'System Startup Procedures',            order: 9,  domainKey: 'hvac_installation' },
        { slug: 'hvac-lesson-70', title: 'Installation Quiz',                    order: 10, domainKey: 'hvac_installation' },
      ],
    },

    {
      slug: 'hvac-module-8',
      title: 'Module 8: Troubleshooting & OSHA Safety',
      orderIndex: 8,
      domainKey: 'hvac_troubleshooting',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept',   requiredCount: 2 },
        { lessonType: 'scenario',  requiredCount: 1 },
        { lessonType: 'safety',    requiredCount: 2 },
        { lessonType: 'quiz',      requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'hvac_troubleshooting_method',  isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_customer_communication',  isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_safety_procedures',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'osha_compliance',              isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Systematic Troubleshooting Method',
        'Common AC Failures',
        'Common Heating Failures',
        'Troubleshooting Scenarios Lab',
        'Customer Communication',
        'Troubleshooting Quiz + Cumulative Mastery',
        'OSHA 30-Hour Construction — CareerSafe',
        'Fall Protection',
        'Electrical Safety',
        'Hazard Communication HazCom',
      ],
      lessons: [
        { slug: 'hvac-lesson-71', title: 'Systematic Troubleshooting Method',                          order: 1,  domainKey: 'hvac_troubleshooting' },
        { slug: 'hvac-lesson-72', title: 'Common AC Failures',                                         order: 2,  domainKey: 'hvac_troubleshooting' },
        { slug: 'hvac-lesson-73', title: 'Common Heating Failures',                                    order: 3,  domainKey: 'hvac_troubleshooting' },
        { slug: 'hvac-lesson-74', title: 'Troubleshooting Scenarios Lab',                              order: 4,  domainKey: 'hvac_troubleshooting' },
        { slug: 'hvac-lesson-75', title: 'Customer Communication',                                     order: 5,  domainKey: 'hvac_troubleshooting' },
        { slug: 'hvac-lesson-76', title: 'Troubleshooting Quiz + Cumulative Mastery (Modules 1-13)',   order: 6,  domainKey: 'hvac_troubleshooting' },
        { slug: 'hvac-lesson-77', title: 'OSHA 30-Hour Construction — CareerSafe',                     order: 7,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-78', title: 'Fall Protection',                                            order: 8,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-79', title: 'Electrical Safety',                                          order: 9,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-80', title: 'Hazard Communication HazCom',                               order: 10, domainKey: 'hvac_safety' },
      ],
    },

    {
      slug: 'hvac-module-9',
      title: 'Module 9: OSHA, CPR & Professional Certifications',
      orderIndex: 9,
      domainKey: 'hvac_safety',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'safety',    requiredCount: 2 },
        { lessonType: 'concept',   requiredCount: 2 },
        { lessonType: 'quiz',      requiredCount: 2 },
      ],
      competencies: [
        { competencyKey: 'osha_compliance',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'first_aid_cpr',            isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_customer_service',    isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_career_readiness',    isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'PPE Selection & Use',
        'Confined Spaces & Excavations',
        'Fire Prevention & Welding Safety',
        'OSHA 30 Final Exam',
        'CPR/First Aid/AED Certification — CareerSafe',
        'First Aid Basics',
        'CPR Skills Assessment',
        'Rise Up Customer Service & Sales',
        'Rise Up Assessment',
        'HVAC Resume Workshop',
      ],
      lessons: [
        { slug: 'hvac-lesson-81', title: 'PPE Selection & Use',                              order: 1,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-82', title: 'Confined Spaces & Excavations',                    order: 2,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-83', title: 'Fire Prevention & Welding Safety',                 order: 3,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-84', title: 'OSHA 30 Final Exam',                               order: 4,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-85', title: 'CPR/First Aid/AED Certification — CareerSafe',     order: 5,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-86', title: 'First Aid Basics',                                 order: 6,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-87', title: 'CPR Skills Assessment',                            order: 7,  domainKey: 'hvac_safety' },
        { slug: 'hvac-lesson-88', title: 'Rise Up Customer Service & Sales',                 order: 8,  domainKey: 'hvac_career' },
        { slug: 'hvac-lesson-89', title: 'Rise Up Assessment',                               order: 9,  domainKey: 'hvac_career' },
        { slug: 'hvac-lesson-90', title: 'HVAC Resume Workshop',                             order: 10, domainKey: 'hvac_career' },
      ],
    },

    {
      slug: 'hvac-module-10',
      title: 'Module 10: Career Readiness & Program Completion',
      orderIndex: 10,
      domainKey: 'hvac_career',
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 2 },
        { lessonType: 'quiz',    requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hvac_career_readiness',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'hvac_job_search',         isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'hvac_employer_relations', isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Interview Skills for Trades',
        'Employer Partner Introductions',
        'OJT Internship Orientation',
        'Program Completion Checklist',
        'Career Readiness Quiz',
      ],
      lessons: [
        { slug: 'hvac-lesson-91', title: 'Interview Skills for Trades',    order: 1, domainKey: 'hvac_career' },
        { slug: 'hvac-lesson-92', title: 'Employer Partner Introductions', order: 2, domainKey: 'hvac_career' },
        { slug: 'hvac-lesson-93', title: 'OJT Internship Orientation',     order: 3, domainKey: 'hvac_career' },
        { slug: 'hvac-lesson-94', title: 'Program Completion Checklist',   order: 4, domainKey: 'hvac_career' },
        { slug: 'hvac-lesson-95', title: 'Career Readiness Quiz',          order: 5, domainKey: 'hvac_career' },
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
