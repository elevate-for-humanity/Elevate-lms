/**
 * lib/curriculum/blueprints/plumbing.ts
 *
 * Plumbing Technician Certificate — NCCER Level 1 aligned.
 * SOC: 47-2152.00
 */
import type { CredentialBlueprint } from './types';

export const plumbingBlueprint: CredentialBlueprint = {
  id: 'plumbing-v1',
  version: '1.0.0',
  credentialSlug: 'plumbing-technician',
  credentialTitle: 'Plumbing Technician Certificate — NCCER Level 1',
  credentialCode: 'NCCER-PL1',
  state: 'IN',
  programSlug: 'plumbing',
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
    instructorName: 'Kevin Marsh',
    instructorTitle: 'Master Plumber & NCCER Certified Instructor',
    instructorImagePath: '/images/instructors/kevin-marsh.jpg',
    topBarColor: '#0ea5e9',
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
    { assessmentType: 'module', scope: 'all', minQuestions: 5, maxQuestions: 10, passingThreshold: 0.75 },
    { assessmentType: 'final', scope: 'all', minQuestions: 40, maxQuestions: 60, passingThreshold: 0.75 },
  ],

  modules: [
    {
      slug: 'plumbing-safety-tools',
      title: 'Plumbing Safety & Hand Tools',
      orderIndex: 1,
      domainKey: 'safety',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 6 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'osha_safety', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'hand_tools', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'ppe', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'plumb-osha-safety', title: 'OSHA Safety Standards for Plumbing and Construction', order: 1, domainKey: 'safety' },
        { slug: 'plumb-ppe', title: 'Personal Protective Equipment for Plumbing Work', order: 2, domainKey: 'safety' },
        { slug: 'plumb-hand-tools', title: 'Hand Tools: Pipe Wrenches, Reamers, and Cutters', order: 3, domainKey: 'safety' },
        { slug: 'plumb-power-tools', title: 'Power Tools: Pipe Threaders, Drills, and Saws', order: 4, domainKey: 'safety' },
        { slug: 'plumb-confined-space', title: 'Confined Space Entry and Trench Safety', order: 5, domainKey: 'safety' },
        { slug: 'plumb-hazard-communication', title: 'Hazard Communication and Chemical Safety in Plumbing', order: 6, domainKey: 'safety' },
        { slug: 'plumb-safety-checkpoint', title: 'Plumbing Safety & Tools — Checkpoint', order: 7, domainKey: 'safety' },
      ],
    },
    {
      slug: 'plumbing-theory',
      title: 'Plumbing Theory & Codes',
      orderIndex: 2,
      domainKey: 'theory',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 6 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'ipc_code', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'water_theory', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'math', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'plumb-water-properties', title: 'Properties of Water: Pressure, Flow, and Temperature', order: 1, domainKey: 'theory' },
        { slug: 'plumb-codes-overview', title: 'Indiana Plumbing Codes and IPC Overview', order: 2, domainKey: 'theory' },
        { slug: 'plumb-drainage-theory', title: 'Drainage Theory: Gravity, Slope, and Venting Principles', order: 3, domainKey: 'theory' },
        { slug: 'plumb-math', title: 'Plumbing Math: Measurements, Pipe Sizing, and Offsets', order: 4, domainKey: 'theory' },
        { slug: 'plumb-plans-reading', title: 'Reading Plumbing Blueprints and Isometric Drawings', order: 5, domainKey: 'theory' },
        { slug: 'plumb-permits', title: 'Permits, Inspections, and Code Compliance', order: 6, domainKey: 'theory' },
        { slug: 'plumb-theory-checkpoint', title: 'Plumbing Theory & Codes — Checkpoint', order: 7, domainKey: 'theory' },
      ],
    },
    {
      slug: 'plumbing-pipes-fittings',
      title: 'Pipe Types, Fittings & Joining Methods',
      orderIndex: 3,
      domainKey: 'pipes',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'pipe_types', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'joining', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'soldering', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'plumb-copper-pipe', title: 'Copper Pipe: Types, Cutting, and Soldering', order: 1, domainKey: 'pipes' },
        { slug: 'plumb-pvc-cpvc', title: 'PVC and CPVC Pipe: Cutting, Cementing, and Scheduling', order: 2, domainKey: 'pipes' },
        { slug: 'plumb-pex-pipe', title: 'PEX Tubing: Installation, Expansion, and Press Fittings', order: 3, domainKey: 'pipes' },
        { slug: 'plumb-cast-iron', title: 'Cast Iron and ABS Pipe: No-Hub Connections', order: 4, domainKey: 'pipes' },
        { slug: 'plumb-threaded-pipe', title: 'Threaded Pipe and Galvanized Steel Work', order: 5, domainKey: 'pipes' },
        { slug: 'plumb-joining-lab', title: 'Pipe Joining Methods — Lab', order: 6, domainKey: 'pipes' },
        { slug: 'plumb-pipes-checkpoint', title: 'Pipe Types & Fittings — Checkpoint', order: 7, domainKey: 'pipes' },
      ],
    },
    {
      slug: 'plumbing-supply-drain',
      title: 'Water Supply & Drain-Waste-Vent Systems',
      orderIndex: 4,
      domainKey: 'systems',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: true, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'lab', requiredCount: 1 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'water_supply', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'dwv', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'rough_in', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'plumb-water-supply', title: 'Residential Water Supply Systems: Main, Shut-Off, and Distribution', order: 1, domainKey: 'systems' },
        { slug: 'plumb-water-heaters', title: 'Water Heater Types: Tank, Tankless, and Installation', order: 2, domainKey: 'systems' },
        { slug: 'plumb-drain-systems', title: 'Drain-Waste-Vent System Design and Installation', order: 3, domainKey: 'systems' },
        { slug: 'plumb-trap-vent', title: 'Traps, Vents, and Wet Venting Techniques', order: 4, domainKey: 'systems' },
        { slug: 'plumb-rough-in', title: 'Rough-In Plumbing: Positioning Drains and Supplies', order: 5, domainKey: 'systems' },
        { slug: 'plumb-systems-lab', title: 'DWV and Supply Rough-In — Lab', order: 6, domainKey: 'systems' },
        { slug: 'plumb-systems-checkpoint', title: 'Water Supply & DWV — Checkpoint', order: 7, domainKey: 'systems' },
      ],
    },
    {
      slug: 'plumbing-fixtures-appliances',
      title: 'Fixtures, Appliances & Commercial Systems',
      orderIndex: 5,
      domainKey: 'fixtures',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: false,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'fixture_installation', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'backflow', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'commercial', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'plumb-toilets-sinks', title: 'Toilet and Sink Installation: Rough-In and Set', order: 1, domainKey: 'fixtures' },
        { slug: 'plumb-showers-tubs', title: 'Shower and Bathtub Installation and Trim', order: 2, domainKey: 'fixtures' },
        { slug: 'plumb-backflow', title: 'Backflow Prevention Devices and Cross-Connection Control', order: 3, domainKey: 'fixtures' },
        { slug: 'plumb-commercial-systems', title: 'Commercial Plumbing Systems: Larger Buildings and Multi-Story', order: 4, domainKey: 'fixtures' },
        { slug: 'plumb-gas-piping', title: 'Introduction to Gas Piping and CSST', order: 5, domainKey: 'fixtures' },
        { slug: 'plumb-fixtures-checkpoint', title: 'Fixtures & Commercial Systems — Checkpoint', order: 6, domainKey: 'fixtures' },
      ],
    },
    {
      slug: 'plumbing-exam-prep',
      title: 'Indiana Plumbing License Exam Prep',
      orderIndex: 6,
      domainKey: 'exam_prep',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 4 }, { lessonType: 'checkpoint', requiredCount: 1 }, { lessonType: 'exam', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'license_exam', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'career_readiness', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'plumb-indiana-license', title: 'Indiana Plumbing Apprentice and Journeyman License Requirements', order: 1, domainKey: 'exam_prep' },
        { slug: 'plumb-code-review', title: 'IPC Code Review: High-Frequency Exam Topics', order: 2, domainKey: 'exam_prep' },
        { slug: 'plumb-math-review', title: 'Plumbing Math Review: Pipe Sizing and Drainage Calculations', order: 3, domainKey: 'exam_prep' },
        { slug: 'plumb-career-paths', title: 'Plumbing Career Paths: Apprenticeship, Union, and Contractor', order: 4, domainKey: 'exam_prep' },
        { slug: 'plumb-business', title: 'Plumbing Business Basics: Bidding, Estimates, and Licensing', order: 5, domainKey: 'exam_prep' },
        { slug: 'plumb-exam-checkpoint', title: 'License Exam Prep — Checkpoint', order: 6, domainKey: 'exam_prep' },
        { slug: 'plumb-final-exam', title: 'Plumbing Technology Comprehensive Final Examination', order: 7, domainKey: 'exam_prep' },
      ],
    },
  ],
};
