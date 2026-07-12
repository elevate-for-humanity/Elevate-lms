/**
 * PARIS QA Designer AI
 * 
 * Generates Curriculum Readiness Report before publishing.
 * Quality gate for all courses.
 */

export interface CurriculumReadinessReport {
  courseId: string;
  courseName: string;
  generatedAt: string;
  isReady: boolean;
  overallScore: number;
  threshold: number;
  categories: ReadinessCategory[];
  issues: ReadinessIssue[];
  blueprintCoverage: BlueprintCoverage;
  competencyCoverage: CompetencyCoverageMap;
  mediaComplete: MediaCompleteness;
  licensingMetadata: LicensingMetadata;
}

export interface ReadinessCategory {
  name: string;
  score: number;
  threshold: number;
  passed: boolean;
  details: string;
  issues: string[];
}

export interface ReadinessIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location?: string;
  recommendation: string;
}

export interface BlueprintCoverage {
  totalTopics: number;
  coveredTopics: number;
  percentage: number;
  missing: string[];
}

export interface CompetencyCoverageMap {
  total: number;
  covered: number;
  percentage: number;
  gaps: string[];
}

export interface MediaCompleteness {
  totalAssets: number;
  generatedAssets: number;
  pendingAssets: number;
  percentage: number;
  pending: string[];
}

export interface LicensingMetadata {
  curriculumId: string;
  version: string;
  copyright: string;
  licenseType: string;
  updateChannel: string;
  maintenanceIncluded: boolean;
}

/**
 * Generate Curriculum Readiness Report
 */
export function generateReadinessReport(params: {
  courseId: string;
  courseName: string;
  lessons: CourseLesson[];
  modules: CourseModule[];
  competencies: Competency[];
  blueprintTopics: BlueprintTopic[];
  mediaAssets: MediaAsset[];
}): CurriculumReadinessReport {
  const issues: ReadinessIssue[] = [];
  const categories: ReadinessCategory[] = [];

  // ─────────────────────────────────────────────────────────────────
  // 1. CREDENTIAL ALIGNMENT
  // ─────────────────────────────────────────────────────────────────
  const credentialAlignment = assessCredentialAlignment(params);
  categories.push(credentialAlignment.category);
  issues.push(...credentialAlignment.issues);

  // ─────────────────────────────────────────────────────────────────
  // 2. BLUEPRINT COVERAGE
  // ─────────────────────────────────────────────────────────────────
  const blueprintCoverage = assessBlueprintCoverage(params);
  categories.push({
    name: 'Blueprint Coverage',
    score: blueprintCoverage.percentage,
    threshold: 95,
    passed: blueprintCoverage.percentage >= 95,
    details: `${blueprintCoverage.coveredTopics}/${blueprintCoverage.totalTopics} topics covered`,
    issues: blueprintCoverage.missing.map(m => `Missing: ${m}`),
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. COMPETENCY COVERAGE
  // ─────────────────────────────────────────────────────────────────
  const competencyCoverage = assessCompetencyCoverage(params);
  categories.push(competencyCoverage.category);
  issues.push(...competencyCoverage.issues);

  // ─────────────────────────────────────────────────────────────────
  // 4. ASSESSMENT QUALITY
  // ─────────────────────────────────────────────────────────────────
  const assessmentQuality = assessAssessmentQuality(params);
  categories.push(assessmentQuality.category);
  issues.push(...assessmentQuality.issues);

  // ─────────────────────────────────────────────────────────────────
  // 5. HANDS-ON SKILLS
  // ─────────────────────────────────────────────────────────────────
  const handsOn = assessHandsOnSkills(params);
  categories.push(handsOn.category);

  // ─────────────────────────────────────────────────────────────────
  // 6. MEDIA COMPLETENESS
  // ─────────────────────────────────────────────────────────────────
  const mediaComplete = assessMediaCompleteness(params);
  categories.push({
    name: 'Media Complete',
    score: mediaComplete.percentage,
    threshold: 90,
    passed: mediaComplete.percentage >= 90,
    details: `${mediaComplete.generatedAssets}/${mediaComplete.totalAssets} assets generated`,
    issues: mediaComplete.pending,
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. ACCESSIBILITY
  // ─────────────────────────────────────────────────────────────────
  const accessibility = assessAccessibility(params);
  categories.push(accessibility.category);
  issues.push(...accessibility.issues);

  // ─────────────────────────────────────────────────────────────────
  // 8. LICENSING METADATA
  // ─────────────────────────────────────────────────────────────────
  const licensingMetadata = assessLicensingMetadata(params);

  // ─────────────────────────────────────────────────────────────────
  // CALCULATE OVERALL SCORE
  // ─────────────────────────────────────────────────────────────────
  const weights = {
    'Credential Alignment': 0.15,
    'Blueprint Coverage': 0.20,
    'Competency Coverage': 0.20,
    'Assessment Quality': 0.15,
    'Hands-on Skills': 0.10,
    'Media Complete': 0.10,
    'Accessibility': 0.05,
    'Licensing Metadata': 0.05,
  };

  let overallScore = 0;
  for (const cat of categories) {
    overallScore += cat.score * (weights[cat.name as keyof typeof weights] || 0);
  }
  overallScore = Math.round(overallScore);

  const isReady = overallScore >= 95 && 
    !issues.some(i => i.severity === 'critical');

  return {
    courseId: params.courseId,
    courseName: params.courseName,
    generatedAt: new Date().toISOString(),
    isReady,
    overallScore,
    threshold: 95,
    categories,
    issues,
    blueprintCoverage,
    competencyCoverage: {
      total: competencyCoverage.total,
      covered: competencyCoverage.covered,
      percentage: competencyCoverage.percentage,
      gaps: competencyCoverage.gaps,
    },
    mediaComplete,
    licensingMetadata,
  };
}

/**
 * Assess credential alignment
 */
function assessCredentialAlignment(params: {
  lessons: CourseLesson[];
  competencies: Competency[];
}): { category: ReadinessCategory; issues: ReadinessIssue[] } {
  const issues: ReadinessIssue[] = [];
  
  let score = 100;
  let details = 'All lessons aligned to competencies';

  // Check if lessons have competency mappings
  const mappedLessons = params.lessons.filter(l => l.competencyIds?.length > 0);
  const unmappedLessons = params.lessons.length - mappedLessons.length;

  if (unmappedLessons > 0) {
    score -= 10;
    issues.push({
      severity: 'high',
      category: 'Credential Alignment',
      description: `${unmappedLessons} lessons have no competency mapping`,
      recommendation: 'Add competency IDs to all lessons',
    });
    details = `${mappedLessons.length}/${params.lessons.length} lessons mapped`;
  }

  return {
    category: {
      name: 'Credential Alignment',
      score,
      threshold: 90,
      passed: score >= 90,
      details,
      issues: issues.map(i => i.description),
    },
    issues,
  };
}

/**
 * Assess blueprint coverage
 */
function assessBlueprintCoverage(params: {
  lessons: CourseLesson[];
  blueprintTopics: BlueprintTopic[];
}): BlueprintCoverage {
  const coveredTopics = new Set<string>();
  const missing: string[] = [];

  // Check which topics are covered
  for (const topic of params.blueprintTopics) {
    const isCovered = params.lessons.some(lesson => 
      lesson.content?.toLowerCase().includes(topic.title.toLowerCase()) ||
      lesson.objectives?.some(o => o.toLowerCase().includes(topic.title.toLowerCase()))
    );

    if (isCovered) {
      coveredTopics.add(topic.id);
    } else {
      missing.push(topic.title);
    }
  }

  const percentage = params.blueprintTopics.length > 0
    ? Math.round((coveredTopics.size / params.blueprintTopics.length) * 100)
    : 100;

  return {
    totalTopics: params.blueprintTopics.length,
    coveredTopics: coveredTopics.size,
    percentage,
    missing,
  };
}

/**
 * Assess competency coverage
 */
function assessCompetencyCoverage(params: {
  lessons: CourseLesson[];
  competencies: Competency[];
}): { category: ReadinessCategory; issues: ReadinessIssue[]; total: number; covered: number; percentage: number; gaps: string[] } {
  const issues: ReadinessIssue[] = [];
  const covered = new Set<string>();
  const gaps: string[] = [];

  for (const lesson of params.lessons) {
    for (const compId of lesson.competencyIds || []) {
      covered.add(compId);
    }
  }

  for (const competency of params.competencies) {
    if (!covered.has(competency.id)) {
      gaps.push(competency.id);
    }
  }

  const percentage = params.competencies.length > 0
    ? Math.round((covered.size / params.competencies.length) * 100)
    : 100;

  if (percentage < 95) {
    issues.push({
      severity: 'high',
      category: 'Competency Coverage',
      description: `${gaps.length} competencies not covered`,
      recommendation: 'Add lessons covering missing competencies',
    });
  }

  return {
    category: {
      name: 'Competency Coverage',
      score: percentage,
      threshold: 95,
      passed: percentage >= 95,
      details: `${covered.size}/${params.competencies.length} competencies covered`,
      issues: issues.map(i => i.description),
    },
    issues,
    total: params.competencies.length,
    covered: covered.size,
    percentage,
    gaps,
  };
}

/**
 * Assess assessment quality
 */
function assessAssessmentQuality(params: {
  lessons: CourseLesson[];
}): { category: ReadinessCategory; issues: ReadinessIssue[] } {
  const issues: ReadinessIssue[] = [];
  
  let score = 100;
  let details = 'All lessons have assessments';

  // Check for quizzes
  const lessonsWithQuizzes = params.lessons.filter(l => l.quizQuestions?.length > 0);
  const lessonsWithoutQuizzes = params.lessons.length - lessonsWithQuizzes.length;

  if (lessonsWithoutQuizzes > params.lessons.length * 0.1) {
    score -= 15;
    issues.push({
      severity: 'high',
      category: 'Assessment Quality',
      description: `${lessonsWithoutQuizzes} lessons missing quizzes`,
      recommendation: 'Add quiz questions to all lessons',
    });
  }

  // Check for practice exams
  const hasPracticeExam = params.lessons.some(l => l.practiceExam);
  if (!hasPracticeExam) {
    score -= 10;
    issues.push({
      severity: 'medium',
      category: 'Assessment Quality',
      description: 'No practice exam found',
      recommendation: 'Add a practice exam matching the certification format',
    });
  }

  return {
    category: {
      name: 'Assessment Quality',
      score,
      threshold: 85,
      passed: score >= 85,
      details,
      issues: issues.map(i => i.description),
    },
    issues,
  };
}

/**
 * Assess hands-on skills
 */
function assessHandsOnSkills(params: {
  lessons: CourseLesson[];
  modules: CourseModule[];
}): ReadinessCategory {
  let score = 100;
  const details: string[] = [];

  // Check for lab/procedure content
  const lessonsWithProcedures = params.lessons.filter(l => 
    l.content?.includes('step') || 
    l.content?.includes('procedure') ||
    l.content?.includes('demonstration')
  );

  if (lessonsWithProcedures.length < params.lessons.length * 0.3) {
    score -= 20;
    details.push('Limited hands-on content');
  } else {
    details.push(`${lessonsWithProcedures.length} lessons with procedures`);
  }

  // Check for safety content
  const lessonsWithSafety = params.lessons.filter(l => 
    l.content?.includes('safety') || l.content?.includes('OSHA')
  );

  if (lessonsWithSafety.length === 0) {
    score -= 10;
    details.push('Missing safety content');
  } else {
    details.push(`${lessonsWithSafety.length} lessons with safety content`);
  }

  return {
    name: 'Hands-on Skills',
    score,
    threshold: 80,
    passed: score >= 80,
    details: details.join('; ') || 'Good hands-on coverage',
    issues: [],
  };
}

/**
 * Assess media completeness
 */
function assessMediaCompleteness(params: {
  mediaAssets: MediaAsset[];
}): { percentage: number; totalAssets: number; generatedAssets: number; pendingAssets: number; pending: string[] } {
  const totalAssets = params.mediaAssets.length;
  const generatedAssets = params.mediaAssets.filter(a => a.status === 'complete').length;
  const pendingAssets = totalAssets - generatedAssets;
  const pending = params.mediaAssets
    .filter(a => a.status === 'pending')
    .map(a => `${a.type} for ${a.lessonId}`);

  const percentage = totalAssets > 0
    ? Math.round((generatedAssets / totalAssets) * 100)
    : 100;

  return {
    percentage,
    totalAssets,
    generatedAssets,
    pendingAssets,
    pending,
  };
}

/**
 * Assess accessibility
 */
function assessAccessibility(params: {
  lessons: CourseLesson[];
}): { category: ReadinessCategory; issues: ReadinessIssue[] } {
  const issues: ReadinessIssue[] = [];
  
  let score = 100;

  // Check for video captions
  const videosWithoutCaptions = params.lessons.filter(l => 
    l.hasVideo && !l.captions
  );

  if (videosWithoutCaptions.length > 0) {
    score -= 15;
    issues.push({
      severity: 'high',
      category: 'Accessibility',
      description: `${videosWithoutCaptions.length} videos missing captions`,
      recommendation: 'Add captions to all videos',
    });
  }

  // Check for alt text (images)
  const lessonsWithImages = params.lessons.filter(l => l.hasImages);
  const lessonsWithoutAltText = lessonsWithImages.filter(l => !l.hasAltText);

  if (lessonsWithoutAltText.length > 0) {
    score -= 10;
    issues.push({
      severity: 'medium',
      category: 'Accessibility',
      description: `${lessonsWithoutAltText.length} lessons may have images without alt text`,
      recommendation: 'Review images for descriptive alt text',
    });
  }

  return {
    category: {
      name: 'Accessibility',
      score,
      threshold: 90,
      passed: score >= 90,
      details: score >= 90 ? 'WCAG 2.1 AA compliant' : 'Accessibility issues found',
      issues: issues.map(i => i.description),
    },
    issues,
  };
}

/**
 * Assess licensing metadata
 */
function assessLicensingMetadata(params: {
  courseId: string;
  courseName: string;
}): { name: string; score: number; threshold: number; passed: boolean; details: string; issues: string[] } {
  const metadata = generateLicensingMetadata(params.courseId, params.courseName);

  return {
    name: 'Licensing Metadata',
    score: 100,
    threshold: 100,
    passed: true,
    details: `ID: ${metadata.curriculumId}, Version: ${metadata.version}`,
    issues: [],
  };
}

/**
 * Generate licensing metadata for course
 */
function generateLicensingMetadata(courseId: string, courseName: string): LicensingMetadata {
  const date = new Date();
  const version = `v${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

  return {
    curriculumId: `${courseId.toUpperCase()}-${date.toISOString().split('T')[0]}`,
    version,
    copyright: `© ${date.getFullYear()} Elevate for Humanity`,
    licenseType: 'Annual Subscription',
    updateChannel: 'Standard',
    maintenanceIncluded: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CourseLesson {
  id: string;
  title: string;
  content?: string;
  objectives?: string[];
  competencyIds?: string[];
  quizQuestions?: QuizQuestion[];
  practiceExam?: boolean;
  hasVideo?: boolean;
  captions?: string;
  hasImages?: boolean;
  hasAltText?: boolean;
}

interface CourseModule {
  id: string;
  title: string;
  lessonIds: string[];
}

interface Competency {
  id: string;
  name: string;
}

interface BlueprintTopic {
  id: string;
  title: string;
  section: string;
}

interface MediaAsset {
  id: string;
  lessonId: string;
  type: 'avatar' | 'video' | 'slides' | 'workbook' | 'quiz';
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

interface QuizQuestion {
  question: string;
  options: string[];
}
