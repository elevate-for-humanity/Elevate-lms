/**
 * esthetician Blueprint
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 *
 * Version: 1.0.0
 */
/**
 * lib/curriculum/blueprints/esthetician.ts
 *
 * Esthetician Apprenticeship — Indiana Board of Cosmetology and Barbering aligned.
 * SOC: 39-5094.00
 * Indiana requires 700 hours of training for esthetician license.
 *
 * Blueprint aligns to IPLA (Indiana Professional Licensing Agency) esthetics standards.
 */

import type { CredentialBlueprint } from './types';

export const estheticianBlueprint: CredentialBlueprint = {
  id: 'esthetician-indiana-v1',
  version: '1.0.0',
  credentialSlug: 'esthetician-indiana',
  credentialTitle: 'Indiana Esthetician License',
  credentialCode: 'IN-ESTH',
  state: 'Indiana',
  programSlug: 'esthetician-apprenticeship',
  trackVariants: ['apprenticeship', 'standard'],
  status: 'active',
  skipLqs: false,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 35,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 7,
  expectedLessonCount: 30,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Sarah Chen',
    instructorTitle: 'Licensed Esthetician & Spa Director',
    topBarColor: '#ec4899',
    accentColor: '#f472b6',
    backgroundColor: '#1e1b4b',
    ttsVoice: 'shimmer',
    ttsSpeed: 0.95,
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
      slug: 'esth-orientation',
      title: 'Program Orientation & Professional Standards',
      orderIndex: 1,
      domainKey: 'orientation',
      minLessons: 3,
      maxLessons: 5,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 2 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'professionalism', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'state_regulations', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esth-welcome', title: 'Welcome to Esthetician Apprenticeship', order: 1, domainKey: 'orientation' },
        { slug: 'esth-license-requirements', title: 'Indiana Esthetician License Requirements', order: 2, domainKey: 'orientation' },
        { slug: 'esth-orientation-checkpoint', title: 'Orientation & Professional Standards — Checkpoint', order: 3, domainKey: 'orientation' },
      ],
    },
    {
      slug: 'esth-infection-control',
      title: 'Sanitation, Infection Control & Safety',
      orderIndex: 2,
      domainKey: 'safety',
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'infection_control', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'safety_protocols', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esth-infection-control', title: 'Infection Control Fundamentals', order: 1, domainKey: 'safety' },
        { slug: 'esth-sanitation-procedures', title: 'Sanitation and Disinfection in Spa Settings', order: 2, domainKey: 'safety' },
        { slug: 'esth-spa-safety', title: 'Spa Safety and Emergency Procedures', order: 3, domainKey: 'safety' },
        { slug: 'esth-safety-checkpoint', title: 'Safety & Infection Control — Checkpoint', order: 4, domainKey: 'safety' },
      ],
    },
    {
      slug: 'esth-skin-science',
      title: 'Skin Science & Analysis',
      orderIndex: 3,
      domainKey: 'skincare',
      minLessons: 6,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'skin_analysis', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'anatomy', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esth-skin-anatomy', title: 'Skin Anatomy and Physiology', order: 1, domainKey: 'skincare' },
        { slug: 'esth-skin-types', title: 'Skin Types and Conditions', order: 2, domainKey: 'skincare' },
        { slug: 'esth-skin-analysis', title: 'Professional Skin Analysis', order: 3, domainKey: 'skincare' },
        { slug: 'esth-skin-analysis-lab', title: 'Skin Analysis — Hands-On Practice', order: 4, domainKey: 'skincare' },
        { slug: 'esth-skin-disorders', title: 'Common Skin Disorders and When to Refer', order: 5, domainKey: 'skincare' },
        { slug: 'esth-science-checkpoint', title: 'Skin Science & Analysis — Checkpoint', order: 6, domainKey: 'skincare' },
      ],
    },
    {
      slug: 'esth-facials',
      title: 'Facial Treatments',
      orderIndex: 4,
      domainKey: 'facials',
      minLessons: 6,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'facial_treatments', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'client_consultation', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esth-facial-consultation', title: 'Client Consultation for Facials', order: 1, domainKey: 'facials' },
        { slug: 'esth-basic-facial', title: 'Basic Facial Treatment Protocol', order: 2, domainKey: 'facials' },
        { slug: 'esth-facial-products', title: 'Facial Products and Ingredients', order: 3, domainKey: 'facials' },
        { slug: 'esth-advanced-facials', title: 'Advanced Facial Treatments', order: 4, domainKey: 'facials' },
        { slug: 'esth-facial-lab', title: 'Facial Treatments — Hands-On Practice', order: 5, domainKey: 'facials' },
        { slug: 'esth-facial-checkpoint', title: 'Facial Treatments — Checkpoint', order: 6, domainKey: 'facials' },
      ],
    },
    {
      slug: 'esth-hair-removal',
      title: 'Hair Removal Services',
      orderIndex: 5,
      domainKey: 'hairremoval',
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_removal', isCritical: false, minimumTouchpoints: 2 },
      ],
      lessons: [
        { slug: 'esth-hair-removal-methods', title: 'Hair Removal Methods Overview', order: 1, domainKey: 'hairremoval' },
        { slug: 'esth-waxing', title: 'Waxing Techniques', order: 2, domainKey: 'hairremoval' },
        { slug: 'esth-hair-removal-lab', title: 'Hair Removal — Hands-On Practice', order: 3, domainKey: 'hairremoval' },
        { slug: 'esth-hair-removal-checkpoint', title: 'Hair Removal — Checkpoint', order: 4, domainKey: 'hairremoval' },
      ],
    },
    {
      slug: 'esth-makeup',
      title: 'Makeup Application',
      orderIndex: 6,
      domainKey: 'makeup',
      minLessons: 4,
      maxLessons: 5,
      quizRequired: true,
      practicalRequired: true,
      isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 2 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'makeup_application', isCritical: false, minimumTouchpoints: 2 },
      ],
      lessons: [
        { slug: 'esth-makeup-fundamentals', title: 'Makeup Fundamentals and Color Theory', order: 1, domainKey: 'makeup' },
        { slug: 'esth-makeup-application', title: 'Professional Makeup Application', order: 2, domainKey: 'makeup' },
        { slug: 'esth-makeup-lab', title: 'Makeup Application — Hands-On Practice', order: 3, domainKey: 'makeup' },
        { slug: 'esth-makeup-checkpoint', title: 'Makeup Application — Checkpoint', order: 4, domainKey: 'makeup' },
      ],
    },
    {
      slug: 'esth-final-exam',
      title: 'Final Examination',
      orderIndex: 7,
      domainKey: 'exam',
      minLessons: 1,
      maxLessons: 2,
      quizRequired: false,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [],
      lessons: [
        { slug: 'esth-final-exam', title: 'Esthetician Final Examination', order: 1, domainKey: 'exam' },
      ],
    },
  ],
};
