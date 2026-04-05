/**
 * lib/curriculum/blueprints/ccma.ts
 *
 * Blueprint for the Certified Clinical Medical Assistant (CCMA) program.
 *
 * Learning model mirrors the NHA CCMA product suite (April 2026 proposal):
 *   - Online Study Guide: 13 instructional modules
 *   - MA SkillsBuilder™ Clinical Plus: 12 clinical skills + 13 foundational modules
 *   - MA SkillsBuilder™ Administrative Plus: 7 admin skills + 7 foundational modules
 *   - Core Learning: Medical Terminology (25 modules) + Anatomy & Physiology (16 modules)
 *   - PersonAbility™: professional/communication skills
 *   - Principles of Health Coaching: 4 modules
 *   - CCMA Certification Exam
 *
 * Blueprint structure maps NHA's product modules → Elevate LMS modules.
 * Content (script_text, quiz_questions) is authored in curriculum_lessons.
 * NHA exam fee: $165. Per-learner discounted package: $704.80.
 */

import type { CredentialBlueprint, BlueprintVideoConfig } from './types';

const CCMA_VIDEO_CONFIG: BlueprintVideoConfig = {
  videoGenerator: 'runway',
  template: 'elevate-slide',
  instructorName: 'Dr. Aisha Williams',
  instructorTitle: 'Certified Clinical Medical Assistant Instructor',
  instructorImagePath: '/images/team/instructors/instructor-medical.jpg',
  topBarColor: '#0ea5e9',
  accentColor: '#6366f1',
  backgroundColor: '#0f172a',
  ttsVoice: 'nova',
  ttsSpeed: 0.85,
  slideCount: 5,
  segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage: true,
  dalleImageStyle: 'natural',
  width: 1920,
  height: 1080,
};

export const CCMA_BLUEPRINT: CredentialBlueprint = {
  id: 'ccma-v1',
  version: '1.0.0',
  credentialSlug: 'ccma',
  credentialTitle: 'Certified Clinical Medical Assistant (CCMA)',
  state: 'federal',
  programSlug: 'medical-assistant',
  credentialCode: 'CCMA',
  trackVariants: ['standard'],
  status: 'draft',

  expectedModuleCount: 12,
  expectedLessonCount: 0, // content authored in curriculum_lessons

  contentSource: 'curriculum_lessons',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 120,
    requiresFinalExam: true,
    requiresUniversalReview: true,
    generatorMode: 'flexible',
  },

  videoConfig: CCMA_VIDEO_CONFIG,

  assessmentRules: [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 10,
      maxQuestions: 25,
      passingThreshold: 0.70,
    },
    {
      assessmentType: 'final',
      scope: 'ccma-exam',
      minQuestions: 150,
      maxQuestions: 150,
      passingThreshold: 0.70,
    },
  ],

  modules: [
    // ── NHA Study Guide: 13 instructional modules ─────────────────────────────
    {
      slug: 'ccma-m01-medical-law-ethics',
      title: 'Module 1: Medical Law & Ethics',
      orderIndex: 1,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'medical-law-ethics',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'hipaa-compliance', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'patient-rights', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['HIPAA & Patient Privacy', 'Medical Ethics & Scope of Practice', 'Legal Responsibilities of the MA', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m02-communication',
      title: 'Module 2: Communication & Customer Service',
      orderIndex: 2,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'communication',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'verbal-communication', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'written-communication', isCritical: false, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Verbal & Nonverbal Communication', 'Telephone & Written Communication', 'Patient Education Techniques', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m03-infection-control',
      title: 'Module 3: Infection Control & Safety',
      orderIndex: 3,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'infection-control',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'standard-precautions', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'ppe-usage', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Standard & Transmission-Based Precautions', 'Hand Hygiene & PPE', 'Sterilization & Disinfection', 'Infection Control Lab', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m04-patient-intake',
      title: 'Module 4: Patient Intake & Documentation',
      orderIndex: 4,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'patient-intake',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'medical-history', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'ehr-documentation', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Medical History & Chief Complaint', 'EHR Documentation Basics', 'Vital Signs Documentation', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m05-vital-signs',
      title: 'Module 5: Vital Signs & Measurements',
      orderIndex: 5,
      minLessons: 4,
      maxLessons: 7,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'vital-signs',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'blood-pressure', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'temperature-pulse-respiration', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'height-weight', isCritical: false, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Temperature, Pulse & Respiration', 'Blood Pressure Measurement', 'Height, Weight & BMI', 'Vital Signs Lab', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m06-clinical-procedures',
      title: 'Module 6: Clinical Procedures',
      orderIndex: 6,
      minLessons: 4,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'clinical-procedures',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 3 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'injections', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'wound-care', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'specimen-collection', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Injections & Immunizations', 'Wound Care & Dressing Changes', 'Specimen Collection & Handling', 'Assisting with Minor Surgery', 'Clinical Procedures Lab', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m07-phlebotomy',
      title: 'Module 7: Phlebotomy & Lab Procedures',
      orderIndex: 7,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'phlebotomy',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'venipuncture', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'capillary-puncture', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Venipuncture Technique', 'Capillary Puncture & Fingerstick', 'Lab Safety & CLIA Waived Tests', 'Phlebotomy Lab', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m08-pharmacology',
      title: 'Module 8: Pharmacology & Medication Administration',
      orderIndex: 8,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'pharmacology',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'drug-classifications', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'medication-math', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Drug Classifications & Actions', 'Medication Math & Dosage Calculations', 'Routes of Administration', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m09-ekg-basics',
      title: 'Module 9: EKG & Cardiology Basics',
      orderIndex: 9,
      minLessons: 3,
      maxLessons: 5,
      quizRequired: true,
      practicalRequired: true,
      isCritical: false,
      domainKey: 'ekg-cardiology',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'ekg-lead-placement', isCritical: true, minimumTouchpoints: 1 }, { competencyKey: 'cardiac-rhythms', isCritical: false, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Cardiac Anatomy & Physiology', 'EKG Lead Placement', 'Reading Basic Rhythms', 'EKG Lab', 'Module Checkpoint'],
    },
    {
      slug: 'ccma-m10-administrative',
      title: 'Module 10: Administrative & Office Procedures',
      orderIndex: 10,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'administrative',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'scheduling', isCritical: false, minimumTouchpoints: 1 }, { competencyKey: 'billing-coding', isCritical: false, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Scheduling & Appointment Management', 'Medical Billing & Coding Basics', 'Insurance & Prior Authorization', 'Module Checkpoint'],
    },
    // ── PersonAbility™ + Health Coaching ─────────────────────────────────────
    {
      slug: 'ccma-m11-professional-skills',
      title: 'Module 11: Professional Skills & Patient Communication',
      orderIndex: 11,
      minLessons: 3,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'professional-skills',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 2 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [{ competencyKey: 'patient-engagement', isCritical: false, minimumTouchpoints: 1 }, { competencyKey: 'health-coaching', isCritical: false, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['Patient Communication & Engagement', 'Health Coaching Fundamentals', 'Cultural Competency', 'Professionalism in Healthcare', 'Module Checkpoint'],
    },
    // ── CCMA Certification Exam ───────────────────────────────────────────────
    {
      slug: 'ccma-m12-exam-prep',
      title: 'Module 12: CCMA Exam Preparation & Certification',
      orderIndex: 12,
      minLessons: 2,
      maxLessons: 4,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'exam-prep',
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 1 }, { lessonType: 'exam', requiredCount: 1 }],
      competencies: [{ competencyKey: 'exam-readiness', isCritical: true, minimumTouchpoints: 1 }],
      suggestedLessonSkeleton: ['CCMA Exam Strategy & Test-Taking Tips', 'Comprehensive Practice Assessment', 'CCMA Certification Exam'],
    },
  ],
};
