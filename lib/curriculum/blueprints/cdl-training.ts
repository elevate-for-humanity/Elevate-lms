/**
 * lib/curriculum/blueprints/cdl-training.ts
 *
 * CDL Class A Training — DOT/FMCSA aligned.
 * SOC: 53-3032.00
 */
import type { CredentialBlueprint } from './types';

export const cdlTrainingBlueprint: CredentialBlueprint = {
  id: 'cdl-class-a-v1',
  version: '1.0.0',
  credentialSlug: 'cdl-class-a',
  credentialTitle: 'Commercial Driver\'s License — Class A',
  credentialCode: 'CDL-A',
  state: 'IN',
  programSlug: 'cdl-training',
  trackVariants: ['standard'],
  status: 'active',
  skipLqs: true,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 42,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 6,
  expectedLessonCount: 42,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'James Holloway',
    instructorTitle: 'CDL Certified Instructor & Fleet Safety Expert',
    instructorImagePath: '/images/instructors/james-holloway.jpg',
    topBarColor: '#f59e0b',
    accentColor: '#6b7280',
    backgroundColor: '#1e293b',
    ttsVoice: 'echo',
    ttsSpeed: 0.9,
    slideCount: 5,
    segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
    generateDalleImage: true,
    dalleImageStyle: 'natural',
    width: 1920,
    height: 1080,
  },

  assessmentRules: [
    { assessmentType: 'module', scope: 'all', minQuestions: 5, maxQuestions: 10, passingThreshold: 0.8 },
    { assessmentType: 'final', scope: 'all', minQuestions: 30, maxQuestions: 50, passingThreshold: 0.8 },
  ],

  modules: [
    {
      slug: 'cdl-regulations-safety',
      title: 'DOT Regulations & Driver Safety',
      orderIndex: 1,
      domainKey: 'regulations',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 6 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'fmcsr', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'hos', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'dot_compliance', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cdl-fmcsr-overview', title: 'FMCSR Overview: Federal Motor Carrier Safety Regulations', order: 1, domainKey: 'regulations' },
        { slug: 'cdl-hours-of-service', title: 'Hours of Service (HOS) Rules and Logbook Requirements', order: 2, domainKey: 'regulations' },
        { slug: 'cdl-driver-qualifications', title: 'Driver Qualification Requirements and Medical Certification', order: 3, domainKey: 'regulations' },
        { slug: 'cdl-drug-alcohol', title: 'DOT Drug and Alcohol Testing Programs', order: 4, domainKey: 'regulations' },
        { slug: 'cdl-accident-procedures', title: 'Accident Reporting Procedures and Post-Accident Testing', order: 5, domainKey: 'regulations' },
        { slug: 'cdl-defensive-driving', title: 'Defensive Driving Strategies and Hazard Perception', order: 6, domainKey: 'regulations' },
        { slug: 'cdl-regulations-checkpoint', title: 'DOT Regulations & Safety — Checkpoint', order: 7, domainKey: 'regulations' },
      ],
    },
    {
      slug: 'cdl-vehicle-inspection',
      title: 'Pre-Trip Vehicle Inspection',
      orderIndex: 2,
      domainKey: 'inspection',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'pre_trip', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'en_route', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'post_trip', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cdl-pre-trip-overview', title: 'Pre-Trip Inspection Overview and Scoring', order: 1, domainKey: 'inspection' },
        { slug: 'cdl-engine-compartment', title: 'Engine Compartment Inspection: Fluids, Belts, and Leaks', order: 2, domainKey: 'inspection' },
        { slug: 'cdl-cab-inspection', title: 'Cab Inspection: Gauges, Controls, and Safety Equipment', order: 3, domainKey: 'inspection' },
        { slug: 'cdl-lights-brakes', title: 'Lights, Brakes, and Coupling System Inspection', order: 4, domainKey: 'inspection' },
        { slug: 'cdl-tires-wheels', title: 'Tires, Wheels, and Trailer Inspection', order: 5, domainKey: 'inspection' },
        { slug: 'cdl-inspection-lab', title: 'Pre-Trip Walk-Around Inspection Practice — Lab', order: 6, domainKey: 'inspection' },
        { slug: 'cdl-inspection-checkpoint', title: 'Pre-Trip Vehicle Inspection — Checkpoint', order: 7, domainKey: 'inspection' },
      ],
    },
    {
      slug: 'cdl-basic-vehicle-control',
      title: 'Basic Vehicle Control & Maneuvering',
      orderIndex: 3,
      domainKey: 'vehicle_control',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'shifting', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'backing', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'turning', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cdl-shifting', title: 'Shifting Techniques: Manual Transmission Mastery', order: 1, domainKey: 'vehicle_control' },
        { slug: 'cdl-backing-straight', title: 'Straight-Line and Offset Backing', order: 2, domainKey: 'vehicle_control' },
        { slug: 'cdl-parallel-parking', title: 'Parallel Parking and Alley Docking', order: 3, domainKey: 'vehicle_control' },
        { slug: 'cdl-turning', title: 'Turning Techniques: Right, Left, and Wide Turns', order: 4, domainKey: 'vehicle_control' },
        { slug: 'cdl-coupling-uncoupling', title: 'Coupling and Uncoupling Procedures', order: 5, domainKey: 'vehicle_control' },
        { slug: 'cdl-control-lab', title: 'Basic Vehicle Control Skills — Lab', order: 6, domainKey: 'vehicle_control' },
        { slug: 'cdl-control-checkpoint', title: 'Basic Vehicle Control — Checkpoint', order: 7, domainKey: 'vehicle_control' },
      ],
    },
    {
      slug: 'cdl-road-skills',
      title: 'Road Skills & Highway Driving',
      orderIndex: 4,
      domainKey: 'road_skills',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'highway_driving', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'night_driving', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'adverse_conditions', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cdl-highway-driving', title: 'Highway and Freeway Driving Techniques', order: 1, domainKey: 'road_skills' },
        { slug: 'cdl-city-driving', title: 'City Driving: Intersections, Traffic, and Pedestrians', order: 2, domainKey: 'road_skills' },
        { slug: 'cdl-night-driving', title: 'Night Driving and Low-Visibility Conditions', order: 3, domainKey: 'road_skills' },
        { slug: 'cdl-weather-driving', title: 'Driving in Adverse Weather: Rain, Snow, and Ice', order: 4, domainKey: 'road_skills' },
        { slug: 'cdl-mountain-driving', title: 'Mountain Driving, Grades, and Escape Ramps', order: 5, domainKey: 'road_skills' },
        { slug: 'cdl-road-checkpoint', title: 'Road Skills & Highway Driving — Checkpoint', order: 6, domainKey: 'road_skills' },
      ],
    },
    {
      slug: 'cdl-cargo-hazmat',
      title: 'Cargo Handling & Hazmat Basics',
      orderIndex: 5,
      domainKey: 'cargo',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: false,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'cargo_securement', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'hazmat_intro', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cdl-cargo-loading', title: 'Cargo Loading, Weight Distribution, and Securement', order: 1, domainKey: 'cargo' },
        { slug: 'cdl-cargo-inspection', title: 'Cargo Inspection and Documentation', order: 2, domainKey: 'cargo' },
        { slug: 'cdl-hazmat-classes', title: 'Hazmat Endorsement: Classes, Placards, and Regulations', order: 3, domainKey: 'cargo' },
        { slug: 'cdl-hazmat-handling', title: 'Safe Handling and Emergency Response for Hazmat', order: 4, domainKey: 'cargo' },
        { slug: 'cdl-special-cargo', title: 'Oversized Loads, Tankers, and Special Cargo', order: 5, domainKey: 'cargo' },
        { slug: 'cdl-cargo-checkpoint', title: 'Cargo & Hazmat — Checkpoint', order: 6, domainKey: 'cargo' },
      ],
    },
    {
      slug: 'cdl-exam-prep',
      title: 'CDL Written & Road Test Preparation',
      orderIndex: 6,
      domainKey: 'exam_prep',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 4 }, { lessonType: 'checkpoint', requiredCount: 1 }, { lessonType: 'exam', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'written_test', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'road_test_prep', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'career_readiness', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'cdl-written-test-overview', title: 'CDL Knowledge Test: General, Combination, and Endorsement', order: 1, domainKey: 'exam_prep' },
        { slug: 'cdl-skills-test-overview', title: 'CDL Skills Test: Pre-Trip, Basic Control, and On-Road', order: 2, domainKey: 'exam_prep' },
        { slug: 'cdl-common-test-mistakes', title: 'Common Test Mistakes and How to Avoid Them', order: 3, domainKey: 'exam_prep' },
        { slug: 'cdl-job-readiness', title: 'CDL Job Readiness: Resume, Driving Record, and Applications', order: 4, domainKey: 'exam_prep' },
        { slug: 'cdl-trucking-industry', title: 'The Trucking Industry: Employers, Pay, and Career Growth', order: 5, domainKey: 'exam_prep' },
        { slug: 'cdl-test-prep-checkpoint', title: 'CDL Test Preparation — Checkpoint', order: 6, domainKey: 'exam_prep' },
        { slug: 'cdl-final-exam', title: 'CDL Comprehensive Final Examination', order: 7, domainKey: 'exam_prep' },
      ],
    },
  ],
};
