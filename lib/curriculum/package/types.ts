/**
 * lib/curriculum/package/types.ts
 *
 * Layer 2: Curriculum Package Generation
 * 
 * Extends Layer 1 (course-generator.ts) to produce the complete approval package:
 * - Instructor guides
 * - Student workbooks  
 * - Slide decks
 * - Skills checklists
 * - Practical rubrics
 * - Lab activities
 * - Syllabus
 * - Approval packet
 */

// ─── Hour Categories ───────────────────────────────────────────────────────────

export type HourCategory = 
  | 'lecture'        // Didactic instruction
  | 'lab'           // Supervised hands-on practice
  | 'clinical'      // Real-world supervised practice
  | 'externship'    // Unsupervised field work
  | 'simulation'    // Mannequin/simulator practice
  | 'assessment';   // Testing and evaluation

export interface ClockHourBreakdown {
  category: HourCategory;
  hours: number;
  description: string;
}

export interface ModuleHourBreakdown {
  moduleSlug: string;
  moduleTitle: string;
  lectureHours: number;
  labHours: number;
  clinicalHours: number;
  externshipHours: number;
  simulationHours: number;
  assessmentHours: number;
  totalHours: number;
}

// ─── Skills Checklist ─────────────────────────────────────────────────────────

export interface SkillsChecklistItem {
  id: string;
  stepNumber: number;
  task: string;
  competencyArea: string;
  isRequired: boolean;
  observationCriteria: string;
  method: 'observation' | 'demonstration' | 'verbal';
  passingCriteria: string;
}

export interface SkillsChecklist {
  moduleSlug: string;
  moduleTitle: string;
  checklistItems: SkillsChecklistItem[];
  totalTasks: number;
  requiredTasks: number;
  estimatedMinutes: number;
}

// ─── Practical Rubric ──────────────────────────────────────────────────────────

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number; // 0-100, must sum to 100
  levels: {
    excellent: { score: number; description: string };
    satisfactory: { score: number; description: string };
    needsImprovement: { score: number; description: string };
    unsatisfactory: { score: number; description: string };
  };
}

export interface PracticalRubric {
  moduleSlug: string;
  moduleTitle: string;
  rubricTitle: string;
  criteria: RubricCriterion[];
  passingScore: number; // percentage
  totalPoints: number;
}

// ─── Lab Activity ─────────────────────────────────────────────────────────────

export interface LabMaterial {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface LabProcedure {
  step: number;
  instruction: string;
  duration: number; // minutes
  safetyWarning?: string;
  competencyVerified?: string;
}

export interface LabActivity {
  moduleSlug: string;
  lessonTitle: string;
  labTitle: string;
  learningObjectives: string[];
  materials: LabMaterial[];
  procedures: LabProcedure[];
  safetyRequirements: string[];
  cleanupInstructions: string;
  assessmentCriteria: string[];
  estimatedMinutes: number;
}

// ─── Instructor Guide ─────────────────────────────────────────────────────────

export interface InstructorGuideModule {
  moduleSlug: string;
  moduleTitle: string;
  moduleOverview: string;
  learningObjectives: string[];
  preparationSteps: string[];
  equipmentNeeded: string[];
  preClassAssignments: string[];
  lectureOutline: {
    topic: string;
    duration: number; // minutes
    teachingNotes: string;
    discussionQuestions: string[];
    activities: string[];
  }[];
  labGuidance?: {
    description: string;
    instructorRole: string;
    commonErrors: string[];
    tips: string[];
  };
  assessmentGuidance: {
    quizNotes: string;
    checkpointNotes: string;
    remediationStrategies: string[];
  };
  additionalResources: string[];
}

export interface InstructorGuide {
  programTitle: string;
  programHours: number;
  instructorName?: string;
  version: string;
  modules: InstructorGuideModule[];
  totalLectureHours: number;
  totalLabHours: number;
  totalClinicalHours: number;
}

// ─── Student Workbook ──────────────────────────────────────────────────────────

export interface WorkbookLesson {
  lessonSlug: string;
  lessonTitle: string;
  lessonObjectives: string[];
  keyTerms: { term: string; definition: string }[];
  notesSection: string; // Template for note-taking
  practiceExercises: {
    question: string;
    answer?: string;
  }[];
  reflectionQuestions: string[];
  selfCheckQuiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface StudentWorkbook {
  programTitle: string;
  programHours: number;
  version: string;
  lessons: WorkbookLesson[];
}

// ─── Syllabus ─────────────────────────────────────────────────────────────────

export interface SyllabusSection {
  title: string;
  content: string;
}

export interface Syllabus {
  programTitle: string;
  programDescription: string;
  credentialAwarded: string;
  totalClockHours: number;
  gradingPolicy: {
    component: string;
    weight: number;
  }[];
  attendancePolicy: string;
  participationPolicy: string;
  academicIntegrityPolicy: string;
  withdrawalPolicy: string;
  requiredMaterials: string[];
  technicalRequirements: string[];
  instructorInformation: {
    name: string;
    email: string;
    officeHours?: string;
  };
  courseSchedule: {
    week: number;
    topic: string;
    readings?: string;
    assignments?: string;
  }[];
  sections: SyllabusSection[];
}

// ─── Approval Packet ──────────────────────────────────────────────────────────

export interface ApprovalPacketSection {
  title: string;
  type: 'content' | 'document' | 'link' | 'table';
  required: boolean;
  content?: string;
  filePath?: string;
  tableData?: Record<string, unknown>[];
}

export interface ApprovalPacket {
  programTitle: string;
  credentialCode: string;
  state: string;
  generatedAt: string;
  version: string;
  sections: ApprovalPacketSection[];
  
  // Summaries
  totalHours: number;
  hourBreakdown: ModuleHourBreakdown[];
  competencyCoverage: {
    competency: string;
    coveredBy: string[];
    assessedBy: string[];
  }[];
  
  // Documents included
  documents: {
    name: string;
    type: 'instructor_guide' | 'student_workbook' | 'syllabus' | 'skills_checklist' | 'rubric' | 'lab_activity' | 'approval_form';
    path?: string;
    generated: boolean;
  }[];
  
  // Validation
  validationResult: {
    passed: boolean;
    missingItems: string[];
    warnings: string[];
  };
}

// ─── Full Curriculum Package ───────────────────────────────────────────────────

export interface CurriculumPackage {
  programId: string;
  programTitle: string;
  credentialCode: string;
  state: string;
  generatedAt: string;
  version: string;
  
  // Layer 1 output (lesson content, quizzes, competencies)
  lessonContent: boolean;
  competencyMapping: boolean;
  
  // Layer 2 output (approval package)
  instructorGuides: InstructorGuide | null;
  studentWorkbooks: StudentWorkbook | null;
  syllabus: Syllabus | null;
  skillsChecklists: SkillsChecklist[];
  practicalRubrics: PracticalRubric[];
  labActivities: LabActivity[];
  clockHourBreakdown: ModuleHourBreakdown[];
  
  // Layer 3 output (validation)
  validationResult: {
    hoursReconcile: boolean;
    competenciesCovered: boolean;
    assessmentsAligned: boolean;
    documentsComplete: boolean;
    approvalChecklistPassed: boolean;
  };
  
  // Export
  exportFormats: ('pdf' | 'docx' | 'zip')[];
  exportPath?: string;
}
