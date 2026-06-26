/**
 * nail-technician Blueprint
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 *
 * Version: 1.0.0
 */
/**
 * lib/curriculum/blueprints/nail-technician.ts
 *
 * Nail Technician Apprenticeship — Indiana Board of Cosmetology and Barbering aligned.
 * SOC: 39-5092.00
 * Indiana requires 600 hours of training for nail technician license.
 *
 * Blueprint aligns to IPLA (Indiana Professional Licensing Agency) nail technology standards.
 */

import type { CredentialBlueprint } from './types';

export const nailTechnicianBlueprint: CredentialBlueprint = {
  id: 'nail-technician-indiana-v1',
  version: '1.0.0',
  credentialSlug: 'nail-technician-indiana',
  credentialTitle: 'Indiana Nail Technician License',
  credentialCode: 'IN-NAIL',
  state: 'Indiana',
  programSlug: 'nail-technician-apprenticeship',
  trackVariants: ['apprenticeship', 'standard'],
  status: 'active',
  skipLqs: false,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 25,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 6,
  expectedLessonCount: 22,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Jennifer Park',
    instructorTitle: 'Licensed Nail Technician & Salon Owner',
    topBarColor: '#f43f5e',
    accentColor: '#fb7185',
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
      slug: 'nail-orientation',
      title: 'Program Orientation & Professional Standards',
      orderIndex: 1,
      domainKey: 'orientation',
      minLessons: 3,
      maxLessons: 4,
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
        { slug: 'nail-welcome', title: 'Welcome to Nail Technician Apprenticeship', order: 1, domainKey: 'orientation' },
        { slug: 'nail-license-requirements', title: 'Indiana Nail Technician License Requirements', order: 2, domainKey: 'orientation' },
        { slug: 'nail-orientation-checkpoint', title: 'Orientation & Professional Standards — Checkpoint', order: 3, domainKey: 'orientation' },
      ],
    },
    {
      slug: 'nail-infection-control',
      title: 'Sanitation, Infection Control & Safety',
      orderIndex: 2,
      domainKey: 'safety',
      minLessons: 4,
      maxLessons: 5,
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
        { slug: 'nail-infection-control', title: 'Infection Control in Nail Services', order: 1, domainKey: 'safety' },
        { slug: 'nail-sanitation-procedures', title: 'Sanitation and Disinfection for Nail Salons', order: 2, domainKey: 'safety' },
        { slug: 'nail-tool-sanitization', title: 'Tool and Equipment Sanitization', order: 3, domainKey: 'safety' },
        { slug: 'nail-safety-checkpoint', title: 'Safety & Infection Control — Checkpoint', order: 4, domainKey: 'safety' },
      ],
    },
    {
      slug: 'nail-anatomy',
      title: 'Nail Anatomy & Disorders',
      orderIndex: 3,
      domainKey: 'anatomy',
      minLessons: 4,
      maxLessons: 5,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'anatomy', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'disorders', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'nail-anatomy', title: 'Nail Anatomy and Structure', order: 1, domainKey: 'anatomy' },
        { slug: 'nail-disorders', title: 'Common Nail Disorders and Diseases', order: 2, domainKey: 'anatomy' },
        { slug: 'nail-referral', title: 'When to Refer Clients to a Physician', order: 3, domainKey: 'anatomy' },
        { slug: 'nail-anatomy-checkpoint', title: 'Nail Anatomy & Disorders — Checkpoint', order: 4, domainKey: 'anatomy' },
      ],
    },
    {
      slug: 'nail-manicure',
      title: 'Manicure Services',
      orderIndex: 4,
      domainKey: 'manicure',
      minLessons: 5,
      maxLessons: 7,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'manicuring', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'client_consultation', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'nail-manicure-consultation', title: 'Client Consultation for Manicures', order: 1, domainKey: 'manicure' },
        { slug: 'nail-basic-manicure', title: 'Basic Manicure Procedure', order: 2, domainKey: 'manicure' },
        { slug: 'nail-spa-manicure', title: 'Spa Manicure Services', order: 3, domainKey: 'manicure' },
        { slug: 'nail-manicure-lab', title: 'Manicure — Hands-On Practice', order: 4, domainKey: 'manicure' },
        { slug: 'nail-manicure-checkpoint', title: 'Manicure Services — Checkpoint', order: 5, domainKey: 'manicure' },
      ],
    },
    {
      slug: 'nail-pedicure',
      title: 'Pedicure Services',
      orderIndex: 5,
      domainKey: 'pedicure',
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
        { competencyKey: 'pedicuring', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        { slug: 'nail-pedicure-procedure', title: 'Pedicure Procedure', order: 1, domainKey: 'pedicure' },
        { slug: 'nail-spa-pedicure', title: 'Spa Pedicure Services', order: 2, domainKey: 'pedicure' },
        { slug: 'nail-pedicure-lab', title: 'Pedicure — Hands-On Practice', order: 3, domainKey: 'pedicure' },
        { slug: 'nail-pedicure-checkpoint', title: 'Pedicure Services — Checkpoint', order: 4, domainKey: 'pedicure' },
      ],
    },
    {
      slug: 'nail-enhancements',
      title: 'Nail Enhancements',
      orderIndex: 6,
      domainKey: 'enhancements',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: true,
      isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'nail_art', isCritical: false, minimumTouchpoints: 2 },
        { competencyKey: 'product_knowledge', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'nail-product-knowledge', title: 'Nail Product Knowledge', order: 1, domainKey: 'enhancements' },
        { slug: 'nail-sculpture', title: 'Sculptured Nails', order: 2, domainKey: 'enhancements' },
        { slug: 'nail-gel-acrylic', title: 'Gel and Acrylic Application', order: 3, domainKey: 'enhancements' },
        { slug: 'nail-fill-repair', title: 'Fill-ins and Repairs', order: 4, domainKey: 'enhancements' },
        { slug: 'nail-enhancement-lab', title: 'Nail Enhancements — Hands-On Practice', order: 5, domainKey: 'enhancements' },
      ],
    },
    {
      slug: 'nail-final-exam',
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
        { slug: 'nail-final-exam', title: 'Nail Technician Final Examination', order: 1, domainKey: 'exam' },
      ],
    },
  ],
};
