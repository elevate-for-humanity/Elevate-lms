/**
 * PARIS Instructional Designer AI
 * 
 * This AI ensures educational soundness of all courses.
 * - Validates learning objectives
 * - Maps competencies
 * - Checks accessibility
 * - Ensures prerequisite chains
 * - Validates Bloom's taxonomy
 */

export interface InstructionalDesignResult {
  isSound: boolean;
  score: number;
  issues: InstructionalIssue[];
  recommendations: string[];
  competencyCoverage: CompetencyCoverage;
}

export interface InstructionalIssue {
  type: 'objective' | 'competency' | 'accessibility' | 'prerequisite' | 'sequence';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  suggestion: string;
}

export interface CompetencyCoverage {
  total: number;
  covered: number;
  percentage: number;
  gaps: string[];
}

export interface LearningObjective {
  id: string;
  lessonId: string;
  objective: string;
  bloomLevel: BloomLevel;
  competencyId?: string;
}

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

/**
 * Validate instructional design of a course
 */
export function validateInstructionalDesign(params: {
  lessons: Lesson[];
  competencies: Competency[];
  prerequisites: Record<string, string[]>;
}): InstructionalDesignResult {
  const issues: InstructionalIssue[] = [];
  const competencyCoverage: CompetencyCoverage = { total: 0, covered: 0, percentage: 0, gaps: [] };

  // Check learning objectives
  const objectiveIssues = validateLearningObjectives(params.lessons);
  issues.push(...objectiveIssues);

  // Check competency coverage
  const coverage = validateCompetencyCoverage(params.lessons, params.competencies);
  competencyCoverage.total = coverage.total;
  competencyCoverage.covered = coverage.covered;
  competencyCoverage.percentage = coverage.percentage;
  competencyCoverage.gaps = coverage.gaps;

  // Check prerequisite chains
  const prereqIssues = validatePrerequisites(params.lessons, params.prerequisites);
  issues.push(...prereqIssues);

  // Check accessibility
  const accessibilityIssues = validateAccessibility(params.lessons);
  issues.push(...accessibilityIssues);

  // Calculate overall score
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;

  let score = 100;
  score -= criticalCount * 20;
  score -= highCount * 10;
  score -= mediumCount * 5;
  score = Math.max(0, score);

  const recommendations = issues.map(i => i.suggestion);

  return {
    isSound: score >= 80 && criticalCount === 0,
    score,
    issues,
    recommendations,
    competencyCoverage,
  };
}

/**
 * Validate learning objectives follow Bloom's taxonomy
 */
function validateLearningObjectives(lessons: Lesson[]): InstructionalIssue[] {
  const issues: InstructionalIssue[] = [];

  for (const lesson of lessons) {
    if (!lesson.objectives || lesson.objectives.length === 0) {
      issues.push({
        type: 'objective',
        severity: 'critical',
        description: `Lesson "${lesson.title}" has no learning objectives`,
        location: lesson.id,
        suggestion: `Add 2-5 measurable learning objectives using action verbs from Bloom's taxonomy`,
      });
      continue;
    }

    for (const objective of lesson.objectives) {
      const bloomLevel = classifyBloomLevel(objective);
      
      if (bloomLevel === 'remember') {
        issues.push({
          type: 'objective',
          severity: 'medium',
          description: `Objective "${objective}" is at the remember level`,
          location: lesson.id,
          suggestion: `Use higher-order verbs like apply, analyze, or evaluate`,
        });
      }

      if (!isMeasurable(objective)) {
        issues.push({
          type: 'objective',
          severity: 'high',
          description: `Objective "${objective}" is not measurable`,
          location: lesson.id,
          suggestion: `Use action verbs like "identify", "calculate", "demonstrate"`,
        });
      }
    }
  }

  return issues;
}

/**
 * Classify Bloom's taxonomy level from verb
 */
function classifyBloomLevel(objective: string): BloomLevel {
  const lower = objective.toLowerCase();

  if (/\b(remember|recall|list|define|identify|recite|repeat)\b/.test(lower)) {
    return 'remember';
  }
  if (/\b(explain|describe|summarize|classify|interpret|compare)\b/.test(lower)) {
    return 'understand';
  }
  if (/\b(apply|use|demonstrate|calculate|illustrate|solve)\b/.test(lower)) {
    return 'apply';
  }
  if (/\b(analyze|examine|differentiate|distinguish|investigate)\b/.test(lower)) {
    return 'analyze';
  }
  if (/\b(evaluate|assess|judge|critique|justify)\b/.test(lower)) {
    return 'evaluate';
  }
  if (/\b(create|design|develop|construct|formulate)\b/.test(lower)) {
    return 'create';
  }

  return 'remember';
}

/**
 * Check if objective is measurable
 */
function isMeasurable(objective: string): boolean {
  const actionVerbs = [
    'identify', 'define', 'list', 'describe', 'explain', 'demonstrate',
    'calculate', 'apply', 'analyze', 'evaluate', 'create', 'design',
    'compare', 'contrast', 'classify', 'predict', 'solve', 'assess',
  ];
  
  const lower = objective.toLowerCase();
  return actionVerbs.some(verb => lower.includes(verb));
}

/**
 * Validate competency coverage
 */
function validateCompetencyCoverage(
  lessons: Lesson[],
  competencies: Competency[]
): { total: number; covered: number; percentage: number; gaps: string[] } {
  const gaps: string[] = [];
  let covered = 0;

  for (const competency of competencies) {
    const isCovered = lessons.some(lesson => 
      lesson.competencies?.includes(competency.id)
    );

    if (isCovered) {
      covered++;
    } else {
      gaps.push(competency.id);
    }
  }

  const percentage = competencies.length > 0 
    ? Math.round((covered / competencies.length) * 100) 
    : 100;

  return {
    total: competencies.length,
    covered,
    percentage,
    gaps,
  };
}

/**
 * Validate prerequisite chains
 */
function validatePrerequisites(
  lessons: Lesson[],
  prerequisites: Record<string, string[]>
): InstructionalIssue[] {
  const issues: InstructionalIssue[] = [];

  for (const [lessonId, prereqs] of Object.entries(prerequisites)) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) continue;

    for (const prereq of prereqs) {
      const prereqLesson = lessons.find(l => l.id === prereq);
      
      if (!prereqLesson) {
        issues.push({
          type: 'prerequisite',
          severity: 'high',
          description: `Prerequisite "${prereq}" for "${lesson.title}" not found`,
          location: lessonId,
          suggestion: `Add the missing prerequisite lesson or remove from chain`,
        });
      }
    }
  }

  return issues;
}

/**
 * Validate accessibility
 */
function validateAccessibility(lessons: Lesson[]): InstructionalIssue[] {
  const issues: InstructionalIssue[] = [];

  for (const lesson of lessons) {
    if (!lesson.content) continue;

    // Check for images without alt text indicators
    const hasImages = /!\[.*\]/.test(lesson.content);
    const hasAltText = /\(alt=/.test(lesson.content);

    if (hasImages && !hasAltText) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        description: `Lesson "${lesson.title}" may have images without alt text`,
        location: lesson.id,
        suggestion: `Add descriptive alt text for all images`,
      });
    }

    // Check for video without captions
    if (lesson.videoUrl && !lesson.captions) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        description: `Lesson "${lesson.title}" has video without captions`,
        location: lesson.id,
        suggestion: `Add video captions for accessibility`,
      });
    }
  }

  return issues;
}

/**
 * Generate learning objectives for a lesson
 */
export function generateLearningObjectives(params: {
  lessonTitle: string;
  topic: string;
  competencyIds: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}): LearningObjective[] {
  const objectives: LearningObjective[] = [];
  const bloomVerbs = {
    beginner: ['identify', 'define', 'list', 'describe'],
    intermediate: ['apply', 'demonstrate', 'calculate', 'explain'],
    advanced: ['analyze', 'evaluate', 'create', 'design'],
  };

  const verbs = bloomVerbs[params.difficulty];

  // Generate 3-5 objectives
  for (let i = 0; i < 4; i++) {
    const verb = verbs[i % verbs.length];
    objectives.push({
      id: `lo-${params.lessonTitle.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      lessonId: params.lessonTitle,
      objective: `The learner will ${verb} ${params.topic}`,
      bloomLevel: difficultyToBloom(params.difficulty, i),
      competencyId: params.competencyIds[i % params.competencyIds.length],
    });
  }

  return objectives;
}

function difficultyToBloom(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  index: number
): BloomLevel {
  const levels: BloomLevel[] = ['remember', 'understand', 'apply', 'analyze'];
  
  if (difficulty === 'beginner') return levels.slice(0, 2)[index % 2];
  if (difficulty === 'intermediate') return levels.slice(1, 3)[index % 2];
  return levels.slice(2, 4)[index % 2];
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  captions?: string;
  objectives?: string[];
  competencies?: string[];
}

interface Competency {
  id: string;
  name: string;
  description: string;
  domain?: string;
}
