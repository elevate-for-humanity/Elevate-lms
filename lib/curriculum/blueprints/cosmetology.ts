/**
 * cosmetology Blueprint
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 *
 * Version: 1.0.0
 */
/**
 * lib/curriculum/blueprints/cosmetology.ts
 *
 * Cosmetology Apprenticeship — Indiana Board of Cosmetology and Barbering aligned.
 * SOC: 39-5012.00
 * Indiana requires 2,000 hours of training for cosmetology license.
 *
 * Blueprint aligns to IPLA (Indiana Professional Licensing Agency) cosmetology standards.
 */

import type { CredentialBlueprint } from './types';

export const cosmetologyBlueprint: CredentialBlueprint = {
  id: 'cosmetology-indiana-v1',
  version: '1.0.0',
  credentialSlug: 'cosmetology-indiana',
  credentialTitle: 'Indiana Cosmetology License',
  credentialCode: 'IN-COSMO',
  state: 'Indiana',
  programSlug: 'cosmetology-apprenticeship',
  trackVariants: ['apprenticeship', 'standard'],
  status: 'active',
  skipLqs: false,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 50,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 8,
  expectedLessonCount: 40,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Maria Santos',
    instructorTitle: 'Licensed Cosmetologist & Salon Owner',
    topBarColor: '#9333ea',
    accentColor: '#c084fc',
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
      slug: 'cosmo-orientation',
      title: 'Program Orientation & Professional Standards',
      orderIndex: 1,
      domainKey: 'orientation',
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'professionalism', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'state_regulations', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'cosmo-welcome',
          title: 'Welcome to Cosmetology Apprenticeship',
          order: 1,
          domainKey: 'orientation',
        },
        {
          slug: 'cosmo-license-requirements',
          title: 'Indiana Cosmetology License Requirements',
          order: 2,
          domainKey: 'orientation',
        },
        {
          slug: 'cosmo-professional-ethics',
          title: 'Professional Ethics and Salon Conduct',
          order: 3,
          domainKey: 'orientation',
        },
        {
          slug: 'cosmo-orientation-checkpoint',
          title: 'Orientation & Professional Standards — Checkpoint',
          order: 4,
          domainKey: 'orientation',
        },
      ],
    },
    {
      slug: 'cosmo-safety-infection',
      title: 'Sanitation, Infection Control & Safety',
      orderIndex: 2,
      domainKey: 'safety',
      minLessons: 5,
      maxLessons: 8,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'infection_control', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'safety_protocols', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'cosmo-infection-control',
          title: 'Infection Control Fundamentals',
          order: 1,
          domainKey: 'safety',
        },
        {
          slug: 'cosmo-sanitation-procedures',
          title: 'Sanitation and Disinfection Procedures',
          order: 2,
          domainKey: 'safety',
        },
        {
          slug: 'cosmo-tool-sanitization',
          title: 'Tool and Equipment Sanitization',
          order: 3,
          domainKey: 'safety',
        },
        {
          slug: 'cosmo-salon-safety',
          title: 'Salon Safety and Emergency Procedures',
          order: 4,
          domainKey: 'safety',
        },
        {
          slug: 'cosmo-safety-checkpoint',
          title: 'Safety & Infection Control — Checkpoint',
          order: 5,
          domainKey: 'safety',
        },
      ],
    },
    {
      slug: 'cosmo-hair-services',
      title: 'Hair Care Services',
      orderIndex: 3,
      domainKey: 'hair',
      minLessons: 8,
      maxLessons: 12,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 6 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'haircutting', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'coloring', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'styling', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'cosmo-hair-analysis',
          title: 'Hair and Scalp Analysis',
          order: 1,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-shampooing',
          title: 'Shampooing and Conditioning',
          order: 2,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-haircutting',
          title: 'Haircutting Techniques',
          order: 3,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-haircutting-lab',
          title: 'Haircutting — Hands-On Practice',
          order: 4,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-hairstyling',
          title: 'Hairstyling and Blow-Drying',
          order: 5,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-updos',
          title: 'Updos and Special Occasion Styling',
          order: 6,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-chemical-hair',
          title: 'Chemical Texture Services (Perms & Relaxers)',
          order: 7,
          domainKey: 'hair',
        },
        {
          slug: 'cosmo-hair-checkpoint',
          title: 'Hair Care Services — Checkpoint',
          order: 8,
          domainKey: 'hair',
        },
      ],
    },
    {
      slug: 'cosmo-coloring',
      title: 'Hair Coloring Services',
      orderIndex: 4,
      domainKey: 'coloring',
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
        { competencyKey: 'coloring', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'product_knowledge', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'cosmo-color-theory',
          title: 'Color Theory Fundamentals',
          order: 1,
          domainKey: 'coloring',
        },
        {
          slug: 'cosmo-single-process',
          title: 'Single-Process Color',
          order: 2,
          domainKey: 'coloring',
        },
        {
          slug: 'cosmo-highlights',
          title: 'Highlights and Lowlights',
          order: 3,
          domainKey: 'coloring',
        },
        {
          slug: 'cosmo-color-correction',
          title: 'Color Correction Techniques',
          order: 4,
          domainKey: 'coloring',
        },
        {
          slug: 'cosmo-coloring-lab',
          title: 'Hair Coloring — Hands-On Practice',
          order: 5,
          domainKey: 'coloring',
        },
        {
          slug: 'cosmo-color-checkpoint',
          title: 'Hair Coloring — Checkpoint',
          order: 6,
          domainKey: 'coloring',
        },
      ],
    },
    {
      slug: 'cosmo-skin-care',
      title: 'Skin Care and Facials',
      orderIndex: 5,
      domainKey: 'skincare',
      minLessons: 5,
      maxLessons: 7,
      quizRequired: true,
      practicalRequired: true,
      isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'lab', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'skincare', isCritical: false, minimumTouchpoints: 2 },
        { competencyKey: 'facial_treatments', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'cosmo-skin-analysis',
          title: 'Skin Types and Analysis',
          order: 1,
          domainKey: 'skincare',
        },
        {
          slug: 'cosmo-facials',
          title: 'Facial Treatments',
          order: 2,
          domainKey: 'skincare',
        },
        {
          slug: 'cosmo-facial-massage',
          title: 'Facial Massage Techniques',
          order: 3,
          domainKey: 'skincare',
        },
        {
          slug: 'cosmo-facial-lab',
          title: 'Facial Services — Hands-On Practice',
          order: 4,
          domainKey: 'skincare',
        },
        {
          slug: 'cosmo-skincare-checkpoint',
          title: 'Skin Care — Checkpoint',
          order: 5,
          domainKey: 'skincare',
        },
      ],
    },
    {
      slug: 'cosmo-nail-care',
      title: 'Nail Care Services',
      orderIndex: 6,
      domainKey: 'nails',
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
        { competencyKey: 'manicuring', isCritical: false, minimumTouchpoints: 2 },
        { competencyKey: 'pedicuring', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'cosmo-nail-anatomy',
          title: 'Nail Anatomy and Disorders',
          order: 1,
          domainKey: 'nails',
        },
        {
          slug: 'cosmo-manicure',
          title: 'Manicure Services',
          order: 2,
          domainKey: 'nails',
        },
        {
          slug: 'cosmo-pedicure',
          title: 'Pedicure Services',
          order: 3,
          domainKey: 'nails',
        },
        {
          slug: 'cosmo-nail-checkpoint',
          title: 'Nail Care — Checkpoint',
          order: 4,
          domainKey: 'nails',
        },
      ],
    },
    {
      slug: 'cosmo-business',
      title: 'Salon Business and Client Relations',
      orderIndex: 7,
      domainKey: 'business',
      minLessons: 4,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'client_consultation', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'retail_sales', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'cosmo-client-consultation',
          title: 'Client Consultation and Needs Assessment',
          order: 1,
          domainKey: 'business',
        },
        {
          slug: 'cosmo-retail-products',
          title: 'Retail Product Recommendations',
          order: 2,
          domainKey: 'business',
        },
        {
          slug: 'cosmo-business-practices',
          title: 'Salon Business Practices',
          order: 3,
          domainKey: 'business',
        },
        {
          slug: 'cosmo-business-checkpoint',
          title: 'Business Practices — Checkpoint',
          order: 4,
          domainKey: 'business',
        },
      ],
    },
    {
      slug: 'cosmo-final-exam',
      title: 'Final Examination',
      orderIndex: 8,
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
        {
          slug: 'cosmo-final-exam',
          title: 'Cosmetology Final Examination',
          order: 1,
          domainKey: 'exam',
        },
      ],
    },
  ],
};
