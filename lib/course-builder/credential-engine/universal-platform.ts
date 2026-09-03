/**
 * Universal Credential Platform
 * 
 * Complete platform for building ANY credential-aligned course.
 * This is the main orchestrator that ties everything together.
 */

import {
  UNIVERSAL_CREDENTIAL_REGISTRY,
  getCredential,
  getAvailableCredentials,
  searchCredentials,
  getCredentialsByCategory,
  getCredentialsByType,
  type CredentialDefinition,
  type CredentialCategory,
  type CredentialType,
} from './credential-registry-universal';

import {
  type ExamBlueprint,
  getBlueprint,
  getCriticalTopics,
} from './exam-blueprints';

import {
  type CourseType,
  detectCourseType,
  COURSE_TYPES,
} from './course-types';

import {
  getPrompts,
  getContentSystemPrompt,
  getInstructorSystemPrompt,
  type ContentPrompts,
} from './prompt-selector';

import {
  loadRagContext,
  buildRagPromptContext,
  enhanceWithRag,
  type RagContext,
} from './rag-engine';

import {
  validateCourse,
  generateQualityReport,
  type QualityScore,
  type ValidationResult,
} from './quality-validator';

export interface PlatformConfig {
  credentialSlug: string;
  courseTitle: string;
  courseDescription?: string;
  programSlug?: string;
}

export interface CourseBuild {
  // Course metadata
  credential: CredentialDefinition;
  blueprint?: ExamBlueprint;
  courseType: CourseType;
  
  // Content structure
  modules: ModuleBuild[];
  practiceExam: ExamBuild;
  
  // AI outputs
  instructor: InstructorBuild;
  media: MediaBuild;
  labs: LabBuild[];
  
  // Compliance
  compliance: ComplianceBuild;
  
  // Quality
  qualityScore: QualityScore;
  validation: ValidationResult;
  
  // Versions
  version: string;
  createdAt: string;
}

export interface ModuleBuild {
  id: string;
  title: string;
  examDomain: string;
  lessons: LessonBuild[];
  quiz: QuizBuild;
  flashcards: FlashcardBuild[];
}

export interface LessonBuild {
  id: string;
  title: string;
  content: string;  // Markdown
  videoScript?: string;
  duration?: number;
  keyTerms: string[];
  learningObjectives: string[];
}

export interface QuizBuild {
  questions: QuestionBuild[];
  passingScore: number;
  attempts: number;
}

export interface QuestionBuild {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  rationale: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardBuild {
  id: string;
  term: string;
  definition: string;
  topic: string;
}

export interface ExamBuild {
  title: string;
  questions: QuestionBuild[];
  sections: { name: string; questionCount: number }[];
  passingScore: number;
  timeLimit?: number;
  isAdaptive: boolean;
}

export interface InstructorBuild {
  name: string;
  title: string;
  avatar: string;
  voice: string;
  personality: string;
  bio: string;
  expertise: string[];
  teachingStyle: string;
  experience: number;
}

export interface MediaBuild {
  videos: VideoBuild[];
  graphics: GraphicBuild[];
  slides: SlideBuild[];
}

export interface VideoBuild {
  id: string;
  lessonId: string;
  title: string;
  script: string;
  duration: number;
  hasAnimation: boolean;
  hasDemo: boolean;
  captions: string;
}

export interface GraphicBuild {
  id: string;
  type: 'diagram' | 'infographic' | 'chart' | 'illustration';
  title: string;
  description: string;
  lessonId: string;
}

export interface SlideBuild {
  id: string;
  title: string;
  content: string;
  image?: string;
  moduleId: string;
}

export interface LabBuild {
  id: string;
  title: string;
  competency: string;
  equipment: string[];
  steps: LabStepBuild[];
  rubric: RubricBuild;
  checklist: ChecklistBuild[];
}

export interface LabStepBuild {
  step: number;
  instruction: string;
  safetyNote?: string;
  timeEstimate?: number;
}

export interface RubricBuild {
  criteria: { name: string; points: number; description: string }[];
  totalPoints: number;
}

export interface ChecklistBuild {
  item: string;
  isRequired: boolean;
}

export interface ComplianceBuild {
  stateCompliance: { state: string; requirements: string[] }[];
  federalCompliance: string[];
  accessibility: { standard: string; level: string }[];
  wioaEligible: boolean;
  dolRegistered: boolean;
}

export interface BlueprintMonitorResult {
  credentialSlug: string;
  lastChecked: string;
  status: 'current' | 'updated' | 'error';
  changes?: string[];
  recommendedUpdates?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM CORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize a course build for a credential
 */
export function initializeCourseBuild(config: PlatformConfig): CourseBuild | null {
  const credential = getCredential(config.credentialSlug);
  if (!credential) {
    console.error(`Credential not found: ${config.credentialSlug}`);
    return null;
  }

  const blueprint = getBlueprint(config.credentialSlug);
  const courseType = detectCourseType(config.courseTitle);
  const ragContext = loadRagContext(config.credentialSlug);

  // Build modules based on exam sections
  const modules = buildModulesFromCredential(credential, blueprint);

  // Build practice exam
  const practiceExam = buildPracticeExam(credential, blueprint);

  // Build instructor
  const instructor = buildInstructor(credential);

  // Build media structure
  const media = buildMediaStructure(modules);

  // Build labs
  const labs = buildLabsFromCredential(credential);

  // Build compliance
  const compliance = buildCompliance(credential);

  // Initialize quality score
  const validation = {
    passed: false,
    scores: {
      overall: 0,
      blueprintCoverage: 0,
      competencyAlignment: 0,
      examReadiness: 0,
      handsOnCoverage: 0,
      accessibility: 0,
      instructionalDesign: 0,
    },
    issues: [],
    recommendations: [],
  };

  return {
    credential,
    blueprint: blueprint || undefined,
    courseType,
    modules,
    practiceExam,
    instructor,
    media,
    labs,
    compliance,
    qualityScore: validation.scores,
    validation,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Build modules from credential exam sections
 */
function buildModulesFromCredential(
  credential: CredentialDefinition,
  blueprint?: ExamBlueprint
): ModuleBuild[] {
  return credential.examSections.map((section, idx) => {
    const sectionTopics = blueprint?.topics.filter(t => t.section === section.name) || [];
    
    return {
      id: `module-${idx + 1}`,
      title: section.name,
      examDomain: section.name,
      lessons: buildLessonsFromSection(section.name, sectionTopics),
      quiz: {
        questions: [],
        passingScore: section.passingScore,
        attempts: 3,
      },
      flashcards: buildFlashcardsFromSection(section.name, sectionTopics),
    };
  });
}

/**
 * Build lessons for a section
 */
function buildLessonsFromSection(
  sectionName: string,
  topics: { id: string; title: string; content: string; keyFacts: string[] }[]
): LessonBuild[] {
  if (topics.length === 0) {
    // Generic lesson if no topics
    return [{
      id: `lesson-${sectionName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `${sectionName} Fundamentals`,
      content: '',
      keyTerms: [],
      learningObjectives: [],
    }];
  }

  return topics.map((topic, idx) => ({
    id: `lesson-${topic.id}`,
    title: topic.title,
    content: topic.content,
    videoScript: generateVideoScript(topic.title, topic.content),
    keyTerms: extractKeyTerms(topic.keyFacts),
    learningObjectives: generateLearningObjectives(topic.title, topic.keyFacts),
  }));
}

/**
 * Build flashcards from section
 */
function buildFlashcardsFromSection(
  sectionName: string,
  topics: { title: string; keyFacts: string[] }[]
): FlashcardBuild[] {
  const flashcards: FlashcardBuild[] = [];
  
  for (const topic of topics) {
    for (const fact of topic.keyFacts) {
      // Parse "term: definition" format
      const parts = fact.split(':');
      if (parts.length >= 2) {
        flashcards.push({
          id: `flashcard-${fact.slice(0, 20).replace(/\s+/g, '-')}`,
          term: parts[0].trim(),
          definition: parts.slice(1).join(':').trim(),
          topic: topic.title,
        });
      }
    }
  }
  
  return flashcards.slice(0, 30); // Limit to 30 flashcards per section
}

/**
 * Build practice exam
 */
function buildPracticeExam(
  credential: CredentialDefinition,
  blueprint?: ExamBlueprint
): ExamBuild {
  return {
    title: `${credential.name} Practice Exam`,
    questions: [],
    sections: credential.examSections.map(s => ({
      name: s.name,
      questionCount: s.questions,
    })),
    passingScore: credential.passingScore,
    timeLimit: credential.examFormat.includes('hour') ? 
      parseInt(credential.examFormat) * 60 : undefined,
    isAdaptive: false,
  };
}

/**
 * Build instructor profile
 */
function buildInstructor(credential: CredentialDefinition): InstructorBuild {
  const categoryInstructors: Record<CredentialCategory, InstructorBuild> = {
    healthcare: {
      name: 'Sarah Mitchell, RN, MSN',
      title: 'Healthcare Education Director',
      avatar: '/instructors/sarah-mitchell.jpg',
      voice: 'professional-caring',
      personality: 'Patient, encouraging, clinically experienced',
      bio: 'Registered nurse with 15 years of clinical experience and 8 years in healthcare education. Specialized in preparing students for NHA certification exams.',
      expertise: ['Patient Care', 'Clinical Procedures', 'Healthcare Regulations', 'NHA Exam Prep'],
      teachingStyle: 'Step-by-step mastery with real-world clinical scenarios',
      experience: 8,
    },
    trades: {
      name: 'Marcus Johnson, Master HVAC/R',
      title: 'Master HVAC Technician & Educator',
      avatar: '/instructors/marcus-johnson.jpg',
      voice: 'authoritative-practical',
      personality: 'Direct, practical, no-nonsense with 20 years in the field',
      bio: 'Master HVAC technician with 20 years of field experience in residential and commercial refrigeration. Licensed master technician and EPA 608 certified.',
      expertise: ['HVAC/R Systems', 'Refrigeration', 'EPA 608 Compliance', 'Troubleshooting'],
      teachingStyle: 'Real-world scenarios with hands-on demonstrations',
      experience: 20,
    },
    beauty: {
      name: 'Diane Torres, Master Barber',
      title: 'Master Barber & Industry Educator',
      avatar: '/instructors/diane-torres.jpg',
      voice: 'friendly-professional',
      personality: 'Warm, encouraging, deeply knowledgeable about the craft',
      bio: 'Master barber with 25 years of experience. Licensed in Indiana, former state board examiner, and DOL-approved apprenticeship instructor.',
      expertise: ['Men\'s Grooming', 'Traditional Barbering', 'State Board Prep', 'Apprenticeship Training'],
      teachingStyle: 'Cultural history meets modern technique',
      experience: 25,
    },
    workforce: {
      name: 'James Williams, CSP',
      title: 'Certified Safety Professional',
      avatar: '/instructors/james-williams.jpg',
      voice: 'clear-authoritative',
      personality: 'Engaging, safety-focused, compliance-minded',
      bio: 'Certified Safety Professional with 15 years of experience in workplace safety training. OSHA-authorized instructor.',
      expertise: ['OSHA Regulations', 'Workplace Safety', 'Emergency Response', 'Compliance'],
      teachingStyle: 'Regulation-focused with real incident examples',
      experience: 15,
    },
    technology: {
      name: 'Dr. Michael Chen',
      title: 'Technology Education Director',
      avatar: '/instructors/michael-chen.jpg',
      voice: 'clear-technical',
      personality: 'Patient, thorough, technically precise',
      bio: 'PhD in Information Systems with 12 years of teaching experience. Specialized in certification exam preparation.',
      expertise: ['IT Fundamentals', 'Certification Prep', 'Practical Applications'],
      teachingStyle: 'Conceptual foundation with hands-on practice',
      experience: 12,
    },
    food: {
      name: 'Chef Robert Martinez',
      title: 'Food Safety Director',
      avatar: '/instructors/robert-martinez.jpg',
      voice: 'friendly-experienced',
      personality: 'Warm, experienced, passionate about food safety',
      bio: 'Executive chef and food safety expert with 20 years in hospitality. ServSafe certified instructor.',
      expertise: ['Food Safety', 'HACCP', 'Kitchen Operations', 'ServSafe Prep'],
      teachingStyle: 'Real kitchen scenarios with food safety principles',
      experience: 20,
    },
    transportation: {
      name: 'David Anderson',
      title: 'Commercial Driver Training Director',
      avatar: '/instructors/david-anderson.jpg',
      voice: 'calm-patient',
      personality: 'Patient, methodical, safety-first',
      bio: 'CDL instructor with 18 years of commercial driving experience. Former fleet manager and driver trainer.',
      expertise: ['Commercial Driving', 'DOT Regulations', 'Pre-Trip Inspections', 'Defensive Driving'],
      teachingStyle: 'Systematic approach with safety emphasis',
      experience: 18,
    },
    business: {
      name: 'Lisa Thompson, MBA',
      title: 'Business Education Director',
      avatar: '/instructors/lisa-thompson.jpg',
      voice: 'professional-engaging',
      personality: 'Energetic, business-minded, results-focused',
      bio: 'MBA with 15 years of business education experience. Specialized in practical business skills.',
      expertise: ['Business Fundamentals', 'Communication', 'Management', 'Career Development'],
      teachingStyle: 'Real-world business scenarios with practical applications',
      experience: 15,
    },
    safety: {
      name: 'Chief Michael Torres',
      title: 'Fire & Safety Chief',
      avatar: '/instructors/michael-torres.jpg',
      voice: 'commanding-professional',
      personality: 'Commanding, safety-first, emergency experienced',
      bio: 'Retired fire chief with 25 years of experience. OSHA-authorized instructor and safety consultant.',
      expertise: ['Fire Safety', 'OSHA Compliance', 'Emergency Response', 'Workplace Safety'],
      teachingStyle: 'Emergency preparedness with regulatory compliance',
      experience: 25,
    },
    government: {
      name: 'Patricia Wilson, MPA',
      title: 'Government Programs Director',
      avatar: '/instructors/patricia-wilson.jpg',
      voice: 'professional-informed',
      personality: 'Knowledgeable, helpful, program-focused',
      bio: 'MPA with 15 years in workforce development. Expert in WIOA, TAA, and government training programs.',
      expertise: ['Workforce Development', 'Government Programs', 'Career Services', 'Program Compliance'],
      teachingStyle: 'Program-focused with career outcome emphasis',
      experience: 15,
    },
    employer: {
      name: 'Training Department AI',
      title: 'Corporate Training Specialist',
      avatar: '/instructors/corporate-trainer.jpg',
      voice: 'professional-corporate',
      personality: 'Professional, efficient, compliance-focused',
      bio: 'AI-generated instructor customized for employer-specific training needs.',
      expertise: ['Company Procedures', 'Compliance', 'Onboarding', 'Best Practices'],
      teachingStyle: 'Company-specific with regulatory compliance',
      experience: 0,
    },
  };

  return categoryInstructors[credential.category] || categoryInstructors.workforce;
}

/**
 * Build media structure
 */
function buildMediaStructure(modules: ModuleBuild[]): MediaBuild {
  const videos: VideoBuild[] = [];
  const graphics: GraphicBuild[] = [];
  const slides: SlideBuild[] = [];

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      videos.push({
        id: `video-${lesson.id}`,
        lessonId: lesson.id,
        title: lesson.title,
        script: lesson.videoScript || '',
        duration: 5, // 5 minutes default
        hasAnimation: true,
        hasDemo: mod.examDomain !== 'Core',
        captions: '',
      });

      graphics.push({
        id: `graphic-${lesson.id}`,
        type: 'diagram',
        title: `${lesson.title} Diagram`,
        description: 'Visual representation of key concepts',
        lessonId: lesson.id,
      });

      slides.push({
        id: `slide-${mod.id}-${lesson.id}`,
        title: lesson.title,
        content: lesson.content.slice(0, 200),
        moduleId: mod.id,
      });
    }
  }

  return { videos, graphics, slides };
}

/**
 * Build labs from credential
 */
function buildLabsFromCredential(credential: CredentialDefinition): LabBuild[] {
  // Labs are primarily for apprenticeship and trades
  if (credential.type !== 'apprenticeship' && credential.category !== 'trades') {
    return [];
  }

  const labTemplates: LabBuild[] = [
    {
      id: 'lab-fundamentals',
      title: 'Equipment Fundamentals Lab',
      competency: 'Demonstrate proper use of industry equipment',
      equipment: ['Safety equipment', 'Measuring tools', 'Hand tools'],
      steps: [],
      rubric: {
        criteria: [
          { name: 'Safety Compliance', points: 25, description: 'Follows all safety protocols' },
          { name: 'Tool Handling', points: 25, description: 'Proper tool use and care' },
          { name: 'Accuracy', points: 25, description: 'Precise measurements and procedures' },
          { name: 'Completion', points: 25, description: 'Finishes within time limit' },
        ],
        totalPoints: 100,
      },
      checklist: [
        { item: 'Safety glasses worn', isRequired: true },
        { item: 'Work area clean', isRequired: true },
        { item: 'Tools returned properly', isRequired: true },
      ],
    },
  ];

  return labTemplates;
}

/**
 * Build compliance information
 */
function buildCompliance(credential: CredentialDefinition): ComplianceBuild {
  const stateCompliance: { state: string; requirements: string[] }[] = [];
  const federalCompliance: string[] = [];

  if (credential.compliance) {
    for (const req of credential.compliance) {
      if (req.type === 'state' && req.states) {
        for (const state of req.states) {
          const existing = stateCompliance.find(s => s.state === state);
          if (existing) {
            existing.requirements.push(...req.requirements);
          } else {
            stateCompliance.push({ state, requirements: [...req.requirements] });
          }
        }
      } else if (req.type === 'federal') {
        federalCompliance.push(...req.requirements);
      }
    }
  }

  return {
    stateCompliance,
    federalCompliance,
    accessibility: [
      { standard: 'WCAG 2.1', level: 'AA' },
      { standard: 'Section 508', level: 'Compliant' },
    ],
    wioaEligible: credential.compliance?.some(c => c.type === 'wioa') || false,
    dolRegistered: credential.compliance?.some(c => c.type === 'dol') || false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function extractKeyTerms(keyFacts: string[]): string[] {
  const terms: string[] = [];
  for (const fact of keyFacts) {
    const match = fact.match(/^([A-Z][A-Za-z\s]+):/);
    if (match) {
      terms.push(match[1]);
    }
  }
  return [...new Set(terms)];
}

function generateLearningObjectives(title: string, keyFacts: string[]): string[] {
  return [
    `Define ${title}`,
    `Identify key ${title.split(' ')[0]} components`,
    `Apply ${title} principles in practice`,
    `Pass ${title}-related exam questions`,
  ];
}

function generateVideoScript(title: string, content: string): string {
  return `Welcome to this lesson on ${title}.

In this video, we'll cover the essential concepts you need to understand about ${title}.

[INTRO - 30 seconds]
Let's start with the basics...

[MAIN CONTENT - 4 minutes]
Now, let's dive deeper...

[EXAMPLES - 2 minutes]
Let me show you some real-world examples...

[CONCLUSION - 30 seconds]
To summarize, remember these key points...

[EXAM TIP - 30 seconds]
On the exam, watch out for...`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLUEPRINT MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Monitor credential for updates
 * (This would connect to external APIs in production)
 */
export async function monitorCredentialBlueprints(): Promise<BlueprintMonitorResult[]> {
  const results: BlueprintMonitorResult[] = [];
  
  for (const credential of getAvailableCredentials()) {
    // In production, this would check external APIs
    results.push({
      credentialSlug: credential.slug,
      lastChecked: new Date().toISOString(),
      status: 'current',
    });
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getCredential,
  getAvailableCredentials,
  searchCredentials,
  getCredentialsByCategory,
  getCredentialsByType,
  UNIVERSAL_CREDENTIAL_REGISTRY,
};
