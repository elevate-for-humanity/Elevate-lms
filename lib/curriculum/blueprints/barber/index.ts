/**
 * Barber Apprenticeship Blueprint
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 * 
 * Version: 1.0.0
 * License: Apprenticeship License
 * 
 * Canonical curriculum for Barber Apprenticeship program.
 * Use enrollment_type to enable/disable apprenticeship features.
 */
import type { CredentialBlueprint, BlueprintVideoConfig } from '../types';
import { barberModule1 } from './module-1';
import { barberModule2 } from './module-2';
import { barberModule3 } from './module-3';
import { barberModule4 } from './module-4';
import { barberModule5 } from './module-5';
import { barberModule6 } from './module-6';
import { barberModule7 } from './module-7';
import { barberModule8 } from './module-8';

const BARBER_VIDEO_CONFIG: BlueprintVideoConfig = {
  videoGenerator: 'runway',
  template: 'elevate-slide',
  instructorName: 'Brandon Williams',
  instructorTitle: 'Master Barber · 12 yrs',
  instructorImagePath: '/images/team/instructors/instructor-barber.jpg',
  topBarColor: '#ea580c',
  accentColor: '#0f172a',
  backgroundColor: '#ffffff',
  ttsVoice: 'onyx',
  ttsSpeed: 0.88,
  slideCount: 5,
  segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage: true,
  dalleImageStyle: 'natural',
};

export const barberApprenticeshipBlueprint: CredentialBlueprint = {
  id: 'barber-apprenticeship-v1',
  version: '1.0.0',
  credentialSlug: 'indiana-barber-license',
  credentialTitle: 'Indiana Registered Barber License',
  state: 'IN',
  programSlug: 'barber-apprenticeship',
  credentialCode: 'IN-BARBER',
  trackVariants: ['apprenticeship'],
  status: 'active',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 72,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 8,
  expectedLessonCount: 50,

  certificationPathway: {
    certificationBodyId: 'cb000000-0000-0000-0000-000000000006',
    credentialName: 'Indiana Registered Barber License Examination',
    credentialAbbrev: 'IN-BARBER-EXAM',
    examFeeCents: 6000,
    feePayer: 'student',
    eligibilityReview: true,
    isPrimary: true,
  },

  modules: [
    barberModule1,
    barberModule2,
    barberModule3,
    barberModule4,
    barberModule5,
    barberModule6,
    barberModule7,
    barberModule8,
  ],

  videoConfig: BARBER_VIDEO_CONFIG,

  assessmentRules: [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 5,
      maxQuestions: 10,
      passingThreshold: 0.7,
    },
    {
      assessmentType: 'final',
      scope: 'all',
      minQuestions: 25,
      maxQuestions: 50,
      passingThreshold: 0.7,
    },
  ],
};
