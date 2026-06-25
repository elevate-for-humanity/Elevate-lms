/**
 * cna Blueprint
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 *
 * Version: 1.0.0
 */
/**
 * lib/curriculum/blueprints/cna.ts
 *
 * Certified Nursing Assistant (CNA) — Indiana Board of Nursing aligned.
 * SOC: 31-1131.00
 */
import type { CredentialBlueprint } from './types';

export const cnaBlueprint: CredentialBlueprint = {
  id: 'cna-indiana-v1',
  version: '1.0.0',
  credentialSlug: 'cna-indiana',
  credentialTitle: 'Indiana Certified Nursing Assistant',
  credentialCode: 'IN-CNA',
  state: 'IN',
  programSlug: 'cna',
  trackVariants: ['standard'],
  status: 'active',
  skipLqs: true,
  externalCourses: [
    {
      title: 'OSHA 10-Hour General Industry (CareerSafe)',
      provider: 'CareerSafe / OSHA',
      url: 'https://www.careersafeonline.com/courses/osha-10-hour-general-industry',
      required: true,
    },
  ],

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 55,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 7,
  expectedLessonCount: 49,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Lisa Thompson, RN',
    instructorTitle: 'Certified Nursing Assistant Program Director',
    instructorImagePath: '/images/instructors/lisa-thompson.jpg',
    topBarColor: '#0ea5e9',
    accentColor: '#6366f1',
    backgroundColor: '#0f172a',
    ttsVoice: 'nova',
    ttsSpeed: 0.9,
    slideCount: 5,
    segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
    generateDalleImage: true,
    dalleImageStyle: 'natural',
    width: 1920,
    height: 1080,
  },

  assessmentRules: [
    { assessmentType: 'module', scope: 'all', minQuestions: 5, maxQuestions: 10, passingThreshold: 0.7 },
    { assessmentType: 'final', scope: 'all', minQuestions: 25, maxQuestions: 50, passingThreshold: 0.75 },
  ],

  modules: [
    {
      slug: 'cna-orientation',
      title: 'Program Orientation & Role of the CNA',
      orderIndex: 1,
      domainKey: 'orientation',
      minLessons: 6,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'role_scope', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'professionalism', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'communication', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cna-welcome', title: 'Welcome to CNA Training & Program Overview', order: 1, domainKey: 'orientation' },
        { slug: 'cna-role-scope', title: 'Role and Scope of Practice of the CNA', order: 2, domainKey: 'orientation' },
        { slug: 'cna-communication', title: 'Professional Communication in Healthcare', order: 3, domainKey: 'orientation' },
        { slug: 'cna-patient-rights', title: 'Patient Rights, Dignity, and Person-Centered Care', order: 4, domainKey: 'orientation' },
        { slug: 'cna-hipaa', title: 'HIPAA and Confidentiality Basics', order: 5, domainKey: 'orientation' },
        { slug: 'cna-orientation-checkpoint', title: 'Orientation & Role of the CNA — Checkpoint', order: 6, domainKey: 'orientation' },
      ],
    },
    {
      slug: 'cna-infection-control',
      title: 'Infection Control & Safety',
      orderIndex: 2,
      domainKey: 'infection_control',
      minLessons: 6,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 4 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'hand_hygiene', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'ppe', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'standard_precautions', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cna-hand-hygiene', title: 'Hand Hygiene: The Foundation of Infection Prevention', order: 1, domainKey: 'infection_control' },
        { slug: 'cna-ppe', title: 'Personal Protective Equipment (PPE) Selection and Use', order: 2, domainKey: 'infection_control' },
        { slug: 'cna-standard-precautions', title: 'Standard and Transmission-Based Precautions', order: 3, domainKey: 'infection_control' },
        { slug: 'cna-isolation', title: 'Isolation Procedures and Protective Environment', order: 4, domainKey: 'infection_control' },
        { slug: 'cna-infection-control-lab', title: 'Infection Control Skills Practice — Lab', order: 5, domainKey: 'infection_control' },
        { slug: 'cna-infection-control-checkpoint', title: 'Infection Control & Safety — Checkpoint', order: 6, domainKey: 'infection_control' },
      ],
    },
    {
      slug: 'cna-patient-care',
      title: 'Basic Patient Care Skills',
      orderIndex: 3,
      domainKey: 'patient_care',
      minLessons: 8,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'lab', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'adl_assistance', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'vital_signs', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'positioning', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cna-activities-daily-living', title: 'Assisting with Activities of Daily Living (ADLs)', order: 1, domainKey: 'patient_care' },
        { slug: 'cna-bathing', title: 'Bathing Procedures: Bed Bath, Shower, and Tub', order: 2, domainKey: 'patient_care' },
        { slug: 'cna-oral-care', title: 'Oral Care and Denture Care', order: 3, domainKey: 'patient_care' },
        { slug: 'cna-dressing', title: 'Dressing and Grooming Assistance', order: 4, domainKey: 'patient_care' },
        { slug: 'cna-positioning', title: 'Positioning, Turning, and Transferring Patients Safely', order: 5, domainKey: 'patient_care' },
        { slug: 'cna-bedmaking', title: 'Occupied and Unoccupied Bed Making', order: 6, domainKey: 'patient_care' },
        { slug: 'cna-patient-care-lab', title: 'Basic Patient Care Skills — Lab', order: 7, domainKey: 'patient_care' },
        { slug: 'cna-patient-care-checkpoint', title: 'Basic Patient Care Skills — Checkpoint', order: 8, domainKey: 'patient_care' },
      ],
    },
    {
      slug: 'cna-vital-signs',
      title: 'Vital Signs & Clinical Measurements',
      orderIndex: 4,
      domainKey: 'vital_signs',
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'temperature', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'pulse', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'respiration', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'blood_pressure', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cna-temperature', title: 'Measuring Body Temperature: Methods and Normal Ranges', order: 1, domainKey: 'vital_signs' },
        { slug: 'cna-pulse-respiration', title: 'Pulse and Respiration Measurement', order: 2, domainKey: 'vital_signs' },
        { slug: 'cna-blood-pressure', title: 'Blood Pressure Measurement and Interpretation', order: 3, domainKey: 'vital_signs' },
        { slug: 'cna-weight-height', title: 'Weight, Height, and I&O Measurement', order: 4, domainKey: 'vital_signs' },
        { slug: 'cna-vital-signs-documentation', title: 'Documenting and Reporting Vital Signs', order: 5, domainKey: 'vital_signs' },
        { slug: 'cna-vital-signs-lab', title: 'Vital Signs Skills Practice — Lab', order: 6, domainKey: 'vital_signs' },
        { slug: 'cna-vital-signs-checkpoint', title: 'Vital Signs & Clinical Measurements — Checkpoint', order: 7, domainKey: 'vital_signs' },
      ],
    },
    {
      slug: 'cna-nutrition',
      title: 'Nutrition, Hydration & Elimination',
      orderIndex: 5,
      domainKey: 'nutrition',
      minLessons: 6,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'nutrition_basics', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'feeding_assistance', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'elimination_care', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cna-nutrition-basics', title: 'Nutrition, Hydration, and Special Diets', order: 1, domainKey: 'nutrition' },
        { slug: 'cna-feeding-assistance', title: 'Assisting with Meals and Feeding Techniques', order: 2, domainKey: 'nutrition' },
        { slug: 'cna-fluid-intake', title: 'Fluid Intake and Output Monitoring', order: 3, domainKey: 'nutrition' },
        { slug: 'cna-elimination-care', title: 'Bowel and Bladder Care and Catheter Assistance', order: 4, domainKey: 'nutrition' },
        { slug: 'cna-elimination-documentation', title: 'Documenting Elimination and Nutritional Status', order: 5, domainKey: 'nutrition' },
        { slug: 'cna-nutrition-checkpoint', title: 'Nutrition, Hydration & Elimination — Checkpoint', order: 6, domainKey: 'nutrition' },
      ],
    },
    {
      slug: 'cna-restorative-care',
      title: 'Restorative Care & Rehabilitation',
      orderIndex: 6,
      domainKey: 'restorative',
      minLessons: 6,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'range_of_motion', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'ambulation', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'restorative_principles', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cna-restorative-principles', title: 'Principles of Restorative and Rehabilitative Care', order: 1, domainKey: 'restorative' },
        { slug: 'cna-range-of-motion', title: 'Range of Motion Exercises: Active and Passive', order: 2, domainKey: 'restorative' },
        { slug: 'cna-ambulation', title: 'Ambulation Assistance and Gait Belt Use', order: 3, domainKey: 'restorative' },
        { slug: 'cna-assistive-devices', title: 'Use of Assistive Devices: Walkers, Canes, Wheelchairs', order: 4, domainKey: 'restorative' },
        { slug: 'cna-fall-prevention', title: 'Fall Prevention and Safe Environment Strategies', order: 5, domainKey: 'restorative' },
        { slug: 'cna-restorative-checkpoint', title: 'Restorative Care & Rehabilitation — Checkpoint', order: 6, domainKey: 'restorative' },
      ],
    },
    {
      slug: 'cna-state-board-prep',
      title: 'State Board Preparation & Final Exam',
      orderIndex: 7,
      domainKey: 'exam_prep',
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 4 }, { lessonType: 'checkpoint', requiredCount: 1 }, { lessonType: 'exam', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'written_exam_prep', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'skills_test_prep', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        { slug: 'cna-pearsonvue-overview', title: 'Indiana CNA Exam: Format, Registration, and Scoring', order: 1, domainKey: 'exam_prep' },
        { slug: 'cna-written-review', title: 'Written Exam Review: High-Yield Topics', order: 2, domainKey: 'exam_prep' },
        { slug: 'cna-skills-test-review', title: 'Skills Test Review: 22 Clinical Skills Overview', order: 3, domainKey: 'exam_prep' },
        { slug: 'cna-test-taking-strategies', title: 'Test-Taking Strategies and Exam Day Tips', order: 4, domainKey: 'exam_prep' },
        { slug: 'cna-career-readiness', title: 'Career Readiness: Job Search, Resume, and Interview', order: 5, domainKey: 'exam_prep' },
        { slug: 'cna-board-prep-checkpoint', title: 'State Board Prep — Checkpoint', order: 6, domainKey: 'exam_prep' },
        { slug: 'cna-final-exam', title: 'CNA Comprehensive Final Examination', order: 7, domainKey: 'exam_prep' },
      ],
    },
  ],
};
