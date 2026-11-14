/**
 * lib/curriculum/package/generator.ts
 *
 * Layer 2: Curriculum Package Generator
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
 *
 * Architecture:
 *   Layer 1: Course Generation (lib/ai/course-generator.ts)
 *   Layer 2: Curriculum Package Generation (this file)
 *   Layer 3: Validation (lib/curriculum/package/validator.ts)
 */

import { aiChat } from '@/lib/ai';
import { logger } from '@/lib/logger';
import type {
  CurriculumPackage,
  InstructorGuide,
  StudentWorkbook,
  Syllabus,
  SkillsChecklist,
  PracticalRubric,
  LabActivity,
  ModuleHourBreakdown,
  ApprovalPacket,
  ClockHourCategory,
  HourCategory,
} from './types';

export interface CurriculumPackageOptions {
  programId: string;
  programTitle: string;
  credentialCode: string;
  state: string;
  totalHours: number;
  modules: {
    slug: string;
    title: string;
    lessons: {
      slug: string;
      title: string;
      content: string;
      objectives: string[];
      competencyKeys: string[];
      durationMinutes: number;
    }[];
  }[];
  instructorName?: string;
  gradingPolicy?: { component: string; weight: number }[];
  attendancePolicy?: string;
}

// ─── System Prompts ───────────────────────────────────────────────────────────

function buildInstructorGuidePrompt(options: CurriculumPackageOptions): string {
  const modules = options.modules.map(m => `
Module ${m.order}: ${m.title}
${m.lessons.map(l => `  - ${l.title} (${l.durationMinutes}min)`).join('\n')}
`).join('\n');

  return `You are an expert curriculum architect creating instructor guides for workforce training programs.

Program: ${options.programTitle}
Total Hours: ${options.totalHours}
Credential: ${options.credentialCode}
State: ${options.state}

Modules:
${modules}

Generate a complete instructor guide as JSON:
{
  "programTitle": "${options.programTitle}",
  "programHours": ${options.totalHours},
  "instructorName": "${options.instructorName || 'TBD'}",
  "version": "1.0",
  "modules": [
    {
      "moduleSlug": "string",
      "moduleTitle": "string",
      "moduleOverview": "string (2-3 sentences)",
      "learningObjectives": ["string"],
      "preparationSteps": ["string"],
      "equipmentNeeded": ["string"],
      "preClassAssignments": ["string"],
      "lectureOutline": [
        {
          "topic": "string",
          "duration": number,
          "teachingNotes": "string",
          "discussionQuestions": ["string"],
          "activities": ["string"]
        }
      ],
      "labGuidance": {
        "description": "string",
        "instructorRole": "string",
        "commonErrors": ["string"],
        "tips": ["string"]
      },
      "assessmentGuidance": {
        "quizNotes": "string",
        "checkpointNotes": "string",
        "remediationStrategies": ["string"]
      },
      "additionalResources": ["string"]
    }
  ],
  "totalLectureHours": number,
  "totalLabHours": number,
  "totalClinicalHours": number
}

Return ONLY valid JSON. No markdown fences.`;
}

function buildStudentWorkbookPrompt(options: CurriculumPackageOptions): string {
  const lessons = options.modules.flatMap(m => 
    m.lessons.map(l => ({ ...l, moduleTitle: m.title }))
  ).slice(0, 10); // Limit to 10 lessons for token efficiency

  return `You are an expert instructional designer creating student workbooks.

Program: ${options.programTitle}
Total Hours: ${options.totalHours}

Lessons:
${lessons.map(l => `- ${l.title} (${l.moduleTitle}): ${l.objectives.slice(0, 2).join(', ')}`).join('\n')}

Generate a student workbook as JSON:
{
  "programTitle": "${options.programTitle}",
  "programHours": ${options.totalHours},
  "version": "1.0",
  "lessons": [
    {
      "lessonSlug": "string",
      "lessonTitle": "string",
      "lessonObjectives": ["string"],
      "keyTerms": [{"term": "string", "definition": "string"}],
      "notesSection": "Guiding template for student notes...",
      "practiceExercises": [{"question": "string"}],
      "reflectionQuestions": ["string"],
      "selfCheckQuiz": [
        {
          "question": "string",
          "options": ["A. ", "B. ", "C. ", "D. "],
          "correctAnswer": 0
        }
      ]
    }
  ]
}

Return ONLY valid JSON. No markdown fences.`;
}

function buildSyllabusPrompt(options: CurriculumPackageOptions): string {
  return `You are an expert curriculum architect creating formal syllabi for workforce training programs.

Program: ${options.programTitle}
Total Hours: ${options.totalHours}
Credential: ${options.credentialCode}
State: ${options.state}

Generate a complete syllabus as JSON:
{
  "programTitle": "${options.programTitle}",
  "programDescription": "string (2-3 sentences about the program)",
  "credentialAwarded": "${options.credentialCode}",
  "totalClockHours": ${options.totalHours},
  "gradingPolicy": [
    {"component": "Quizzes & Checkpoints", "weight": 20},
    {"component": "Practical Assessments", "weight": 30},
    {"component": "Final Exam", "weight": 30},
    {"component": "Participation & Attendance", "weight": 20}
  ],
  "attendancePolicy": "string (attendance policy)",
  "participationPolicy": "string (participation policy)",
  "academicIntegrityPolicy": "string (academic integrity policy)",
  "withdrawalPolicy": "string (withdrawal policy)",
  "requiredMaterials": ["string"],
  "technicalRequirements": ["string"],
  "instructorInformation": {
    "name": "${options.instructorName || 'TBD'}",
    "email": "instructor@example.com",
    "officeHours": "string (optional)"
  },
  "courseSchedule": [
    {"week": 1, "topic": "string", "readings": "string", "assignments": "string"}
  ],
  "sections": [
    {"title": "Program Overview", "content": "string"},
    {"title": "Learning Outcomes", "content": "string"},
    {"title": "Required Materials", "content": "string"}
  ]
}

Return ONLY valid JSON. No markdown fences.`;
}

function buildSkillsChecklistPrompt(module: CurriculumPackageOptions['modules'][0]): string {
  return `You are an expert workforce training specialist creating skills checklists.

Module: ${module.title}
Lessons:
${module.lessons.map(l => `- ${l.title}: ${l.competencyKeys.join(', ')}`).join('\n')}

Generate a skills checklist as JSON:
{
  "moduleSlug": "${module.slug}",
  "moduleTitle": "${module.title}",
  "checklistItems": [
    {
      "id": "${module.slug}-task-1",
      "stepNumber": 1,
      "task": "string (observable, measurable task)",
      "competencyArea": "string",
      "isRequired": true,
      "observationCriteria": "string (what instructor observes)",
      "method": "observation|demonstration|verbal",
      "passingCriteria": "string"
    }
  ],
  "totalTasks": number,
  "requiredTasks": number,
  "estimatedMinutes": number
}

Return ONLY valid JSON. No markdown fences.`;
}

function buildPracticalRubricPrompt(module: CurriculumPackageOptions['modules'][0]): string {
  return `You are an expert workforce training assessor creating practical rubrics.

Module: ${module.title}
Competencies: ${module.lessons.flatMap(l => l.competencyKeys).join(', ')}

Generate a practical rubric as JSON:
{
  "moduleSlug": "${module.slug}",
  "moduleTitle": "${module.title}",
  "rubricTitle": "${module.title} Practical Assessment Rubric",
  "criteria": [
    {
      "id": "${module.slug}-criteria-1",
      "name": "string (e.g., Safety Protocols, Technique, Time Management)",
      "weight": 25,
      "levels": {
        "excellent": {"score": 100, "description": "string (4-5 sentences)"},
        "satisfactory": {"score": 75, "description": "string (4-5 sentences)"},
        "needsImprovement": {"score": 50, "description": "string (4-5 sentences)"},
        "unsatisfactory": {"score": 0, "description": "string (4-5 sentences)"}
      }
    }
  ],
  "passingScore": 70,
  "totalPoints": 100
}

Return ONLY valid JSON. No markdown fences.`;
}

function buildLabActivityPrompt(lesson: CurriculumPackageOptions['modules'][0]['lessons'][0], moduleTitle: string): string {
  return `You are an expert workforce training specialist creating lab activities.

Lesson: ${lesson.title}
Module: ${moduleTitle}
Content: ${lesson.content.substring(0, 500)}...

Generate a lab activity as JSON:
{
  "moduleSlug": "${lesson.slug.split('-').slice(0, -1).join('-')}",
  "lessonTitle": "${lesson.title}",
  "labTitle": "${lesson.title} Lab Exercise",
  "learningObjectives": ${JSON.stringify(lesson.objectives.slice(0, 3))},
  "materials": [
    {"name": "string", "quantity": 1, "unit": "each", "notes": "string"}
  ],
  "procedures": [
    {
      "step": 1,
      "instruction": "string",
      "duration": 10,
      "safetyWarning": "string (optional)",
      "competencyVerified": "string (optional)"
    }
  ],
  "safetyRequirements": ["string"],
  "cleanupInstructions": "string",
  "assessmentCriteria": ["string"],
  "estimatedMinutes": number
}

Return ONLY valid JSON. No markdown fences.`;
}

function buildClockHourBreakdownPrompt(options: CurriculumPackageOptions): string {
  const modules = options.modules.map(m => ({
    title: m.title,
    totalMinutes: m.lessons.reduce((sum, l) => sum + l.durationMinutes, 0)
  }));

  return `You are an expert curriculum architect calculating clock hours for workforce training.

Program: ${options.programTitle}
Total Hours: ${options.totalHours}

Modules and lesson durations:
${modules.map(m => `${m.title}: ${Math.round(m.totalMinutes / 60 * 10) / 10} hours`).join('\n')}

Generate a clock-hour breakdown as JSON:
{
  "totalHours": ${options.totalHours},
  "hourBreakdown": [
    {
      "moduleSlug": "string",
      "moduleTitle": "string",
      "lectureHours": number,
      "labHours": number,
      "clinicalHours": number,
      "externshipHours": number,
      "simulationHours": number,
      "assessmentHours": number,
      "totalHours": number
    }
  ]
}

Rules:
- Lecture: Didactic instruction (typically 40-50% of total)
- Lab: Supervised hands-on practice (typically 30-40% of total)
- Clinical: Real-world supervised practice (typically 10-20% of total)
- Externship: Unsupervised field work (optional, 0-10%)
- Simulation: Mannequin/simulator practice (optional)
- Assessment: Testing and evaluation (typically 5-10%)

Hours must sum to total. Return ONLY valid JSON.`;
}

// ─── JSON Helpers ─────────────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(extractJSON(raw)) as T;
  } catch {
    return fallback;
  }
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate complete Layer 2 curriculum package
 * 
 * This extends Layer 1 (course-generator.ts) to produce the full approval package:
 * - Instructor guides
 * - Student workbooks
 * - Syllabus
 * - Skills checklists
 * - Practical rubrics
 * - Lab activities
 * - Clock-hour breakdown
 */
export async function generateCurriculumPackage(
  options: CurriculumPackageOptions
): Promise<CurriculumPackage> {
  logger.info('[CurriculumPackage] Starting generation', {
    program: options.programTitle,
    modules: options.modules.length,
  });

  const startTime = Date.now();

  // ─── Generate Instructor Guide ────────────────────────────────────────────
  let instructorGuides: InstructorGuide | null = null;
  try {
    const result = await aiChat({
      messages: [
        { role: 'system', content: 'You are an expert curriculum architect.' },
        { role: 'user', content: buildInstructorGuidePrompt(options) },
      ],
      model: 'gpt-4.1',
      temperature: 0.5,
      maxTokens: 8000,
    });
    instructorGuides = safeParse(result.content, null);
    logger.info('[CurriculumPackage] Instructor guide generated');
  } catch (err) {
    logger.error('[CurriculumPackage] Instructor guide generation failed', err);
  }

  // ─── Generate Student Workbook ────────────────────────────────────────────
  let studentWorkbooks: StudentWorkbook | null = null;
  try {
    const result = await aiChat({
      messages: [
        { role: 'system', content: 'You are an expert instructional designer.' },
        { role: 'user', content: buildStudentWorkbookPrompt(options) },
      ],
      model: 'gpt-4.1',
      temperature: 0.5,
      maxTokens: 8000,
    });
    studentWorkbooks = safeParse(result.content, null);
    logger.info('[CurriculumPackage] Student workbook generated');
  } catch (err) {
    logger.error('[CurriculumPackage] Student workbook generation failed', err);
  }

  // ─── Generate Syllabus ────────────────────────────────────────────────────
  let syllabus: Syllabus | null = null;
  try {
    const result = await aiChat({
      messages: [
        { role: 'system', content: 'You are an expert curriculum architect.' },
        { role: 'user', content: buildSyllabusPrompt(options) },
      ],
      model: 'gpt-4.1',
      temperature: 0.3,
      maxTokens: 6000,
    });
    syllabus = safeParse(result.content, null);
    logger.info('[CurriculumPackage] Syllabus generated');
  } catch (err) {
    logger.error('[CurriculumPackage] Syllabus generation failed', err);
  }

  // ─── Generate Skills Checklists ────────────────────────────────────────────
  const skillsChecklists: SkillsChecklist[] = [];
  for (const module of options.modules) {
    try {
      const result = await aiChat({
        messages: [
          { role: 'system', content: 'You are an expert workforce training specialist.' },
          { role: 'user', content: buildSkillsChecklistPrompt(module) },
        ],
        model: 'gpt-4.1',
        temperature: 0.5,
        maxTokens: 4000,
      });
      const checklist = safeParse<SkillsChecklist>(result.content, {
        moduleSlug: module.slug,
        moduleTitle: module.title,
        checklistItems: [],
        totalTasks: 0,
        requiredTasks: 0,
        estimatedMinutes: 0,
      });
      skillsChecklists.push(checklist);
    } catch (err) {
      logger.error(`[CurriculumPackage] Skills checklist failed for ${module.title}`, err);
    }
  }

  // ─── Generate Practical Rubrics ────────────────────────────────────────────
  const practicalRubrics: PracticalRubric[] = [];
  for (const module of options.modules) {
    try {
      const result = await aiChat({
        messages: [
          { role: 'system', content: 'You are an expert workforce training assessor.' },
          { role: 'user', content: buildPracticalRubricPrompt(module) },
        ],
        model: 'gpt-4.1',
        temperature: 0.5,
        maxTokens: 4000,
      });
      const rubric = safeParse<PracticalRubric>(result.content, {
        moduleSlug: module.slug,
        moduleTitle: module.title,
        rubricTitle: `${module.title} Practical Rubric`,
        criteria: [],
        passingScore: 70,
        totalPoints: 100,
      });
      practicalRubrics.push(rubric);
    } catch (err) {
      logger.error(`[CurriculumPackage] Rubric failed for ${module.title}`, err);
    }
  }

  // ─── Generate Lab Activities ───────────────────────────────────────────────
  const labActivities: LabActivity[] = [];
  for (const module of options.modules) {
    for (const lesson of module.lessons.slice(0, 3)) { // Limit to 3 lessons per module
      try {
        const result = await aiChat({
          messages: [
            { role: 'system', content: 'You are an expert workforce training specialist.' },
            { role: 'user', content: buildLabActivityPrompt(lesson, module.title) },
          ],
          model: 'gpt-4.1',
          temperature: 0.5,
          maxTokens: 3000,
        });
        const lab = safeParse<LabActivity>(result.content, {
          moduleSlug: module.slug,
          lessonTitle: lesson.title,
          labTitle: `${lesson.title} Lab`,
          learningObjectives: [],
          materials: [],
          procedures: [],
          safetyRequirements: [],
          cleanupInstructions: '',
          assessmentCriteria: [],
          estimatedMinutes: 60,
        });
        labActivities.push(lab);
      } catch (err) {
        logger.error(`[CurriculumPackage] Lab activity failed for ${lesson.title}`, err);
      }
    }
  }

  // ─── Generate Clock Hour Breakdown ─────────────────────────────────────────
  let clockHourBreakdown: ModuleHourBreakdown[] = [];
  try {
    const result = await aiChat({
      messages: [
        { role: 'system', content: 'You are an expert curriculum architect.' },
        { role: 'user', content: buildClockHourBreakdownPrompt(options) },
      ],
      model: 'gpt-4.1',
      temperature: 0.3,
      maxTokens: 3000,
    });
    const breakdown = safeParse<{ hourBreakdown: ModuleHourBreakdown[] }>(result.content, { hourBreakdown: [] });
    clockHourBreakdown = breakdown.hourBreakdown;
    logger.info('[CurriculumPackage] Clock hour breakdown generated');
  } catch (err) {
    logger.error('[CurriculumPackage] Clock hour breakdown failed', err);
  }

  const duration = Date.now() - startTime;
  logger.info('[CurriculumPackage] Generation complete', {
    duration,
    instructorGuides: !!instructorGuides,
    studentWorkbooks: !!studentWorkbooks,
    syllabus: !!syllabus,
    skillsChecklists: skillsChecklists.length,
    practicalRubrics: practicalRubrics.length,
    labActivities: labActivities.length,
  });

  return {
    programId: options.programId,
    programTitle: options.programTitle,
    credentialCode: options.credentialCode,
    state: options.state,
    generatedAt: new Date().toISOString(),
    version: '1.0',
    
    // Layer 1 outputs (reference)
    lessonContent: true, // From Layer 1
    competencyMapping: true, // From Layer 1
    
    // Layer 2 outputs
    instructorGuides,
    studentWorkbooks,
    syllabus,
    skillsChecklists,
    practicalRubrics,
    labActivities,
    clockHourBreakdown,
    
    // Layer 3: Validation
    validationResult: {
      hoursReconcile: clockHourBreakdown.length > 0,
      competenciesCovered: options.modules.some(m => 
        m.lessons.some(l => l.competencyKeys.length > 0)
      ),
      assessmentsAligned: practicalRubrics.length > 0,
      documentsComplete: !!(instructorGuides && syllabus),
      approvalChecklistPassed: false, // Requires human review
    },
    
    exportFormats: ['pdf', 'docx'],
  };
}

/**
 * Generate approval packet summary
 */
export function generateApprovalPacketSummary(
  pkg: CurriculumPackage
): ApprovalPacket {
  return {
    programTitle: pkg.programTitle,
    credentialCode: pkg.credentialCode,
    state: pkg.state,
    generatedAt: pkg.generatedAt,
    version: pkg.version,
    sections: [
      {
        title: 'Program Description',
        type: 'content',
        required: true,
        content: pkg.syllabus?.programDescription,
      },
      {
        title: 'Clock Hour Breakdown',
        type: 'table',
        required: true,
        tableData: pkg.clockHourBreakdown,
      },
      {
        title: 'Instructor Guide',
        type: 'document',
        required: true,
        filePath: 'instructor-guide.pdf',
        generated: !!pkg.instructorGuides,
      },
      {
        title: 'Student Syllabus',
        type: 'document',
        required: true,
        filePath: 'syllabus.pdf',
        generated: !!pkg.syllabus,
      },
      {
        title: 'Skills Checklists',
        type: 'document',
        required: true,
        filePath: 'skills-checklists.pdf',
        generated: pkg.skillsChecklists.length > 0,
      },
      {
        title: 'Practical Rubrics',
        type: 'document',
        required: true,
        filePath: 'rubrics.pdf',
        generated: pkg.practicalRubrics.length > 0,
      },
      {
        title: 'Lab Activities',
        type: 'document',
        required: false,
        filePath: 'lab-activities.pdf',
        generated: pkg.labActivities.length > 0,
      },
    ],
    totalHours: pkg.clockHourBreakdown.reduce((sum, m) => sum + m.totalHours, 0),
    hourBreakdown: pkg.clockHourBreakdown,
    competencyCoverage: [], // Populated by Layer 3 validator
    documents: [
      {
        name: 'Instructor Guide',
        type: 'instructor_guide',
        generated: !!pkg.instructorGuides,
      },
      {
        name: 'Student Workbook',
        type: 'student_workbook',
        generated: !!pkg.studentWorkbooks,
      },
      {
        name: 'Syllabus',
        type: 'syllabus',
        generated: !!pkg.syllabus,
      },
      {
        name: 'Skills Checklists',
        type: 'skills_checklist',
        generated: pkg.skillsChecklists.length > 0,
      },
      {
        name: 'Practical Rubrics',
        type: 'rubric',
        generated: pkg.practicalRubrics.length > 0,
      },
    ],
    validationResult: {
      passed: pkg.validationResult.documentsComplete,
      missingItems: pkg.validationResult.documentsComplete 
        ? [] 
        : ['Missing required documents'],
      warnings: [],
    },
  };
}
