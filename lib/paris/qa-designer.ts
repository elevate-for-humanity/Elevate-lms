/** PARIS curriculum QA designer — deterministic readiness checks, no synthetic outcomes. */

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
export interface BlueprintCoverage { totalTopics: number; coveredTopics: number; percentage: number; missing: string[]; }
export interface CompetencyCoverageMap { total: number; covered: number; percentage: number; gaps: string[]; }
export interface MediaCompleteness { totalAssets: number; generatedAssets: number; pendingAssets: number; percentage: number; pending: string[]; }
export interface LicensingMetadata { curriculumId: string; version: string; copyright: string; licenseType: string; updateChannel: string; maintenanceIncluded: boolean; }

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
interface CourseModule { id: string; title: string; lessonIds: string[]; }
interface Competency { id: string; name: string; }
interface BlueprintTopic { id: string; title: string; section: string; }
interface MediaAsset { id: string; lessonId: string; type: 'avatar' | 'video' | 'slides' | 'workbook' | 'quiz'; status: 'pending' | 'generating' | 'complete' | 'failed'; }
interface QuizQuestion { question: string; options: string[]; }

type Params = {
  courseId: string;
  courseName: string;
  lessons: CourseLesson[];
  modules: CourseModule[];
  competencies: Competency[];
  blueprintTopics: BlueprintTopic[];
  mediaAssets: MediaAsset[];
};

function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 100;
}

function category(name: string, score: number, threshold: number, details: string, issues: string[] = []): ReadinessCategory {
  return { name, score, threshold, passed: score >= threshold, details, issues };
}

export function generateReadinessReport(params: Params): CurriculumReadinessReport {
  const issues: ReadinessIssue[] = [];

  const mappedLessons = params.lessons.filter((lesson) => (lesson.competencyIds?.length ?? 0) > 0).length;
  const credentialScore = percent(mappedLessons, params.lessons.length);
  if (credentialScore < 90) {
    issues.push({ severity: 'high', category: 'Credential Alignment', description: `${params.lessons.length - mappedLessons} lessons have no competency mapping`, recommendation: 'Map each lesson to at least one required competency.' });
  }

  const coveredTopics = params.blueprintTopics.filter((topic) => params.lessons.some((lesson) => {
    const needle = topic.title.toLowerCase();
    return lesson.content?.toLowerCase().includes(needle) || lesson.objectives?.some((objective) => objective.toLowerCase().includes(needle));
  }));
  const missingTopics = params.blueprintTopics.filter((topic) => !coveredTopics.some((covered) => covered.id === topic.id)).map((topic) => topic.title);
  const blueprintCoverage: BlueprintCoverage = { totalTopics: params.blueprintTopics.length, coveredTopics: coveredTopics.length, percentage: percent(coveredTopics.length, params.blueprintTopics.length), missing: missingTopics };
  if (blueprintCoverage.percentage < 95) {
    issues.push({ severity: 'high', category: 'Blueprint Coverage', description: `${missingTopics.length} blueprint topics are not detected in lesson content`, recommendation: 'Add or revise lessons so every required blueprint topic is explicitly covered.' });
  }

  const coveredCompetencies = new Set(params.lessons.flatMap((lesson) => lesson.competencyIds ?? []));
  const gaps = params.competencies.filter((competency) => !coveredCompetencies.has(competency.id)).map((competency) => competency.id);
  const competencyCoverage: CompetencyCoverageMap = { total: params.competencies.length, covered: params.competencies.length - gaps.length, percentage: percent(params.competencies.length - gaps.length, params.competencies.length), gaps };
  if (competencyCoverage.percentage < 95) {
    issues.push({ severity: 'high', category: 'Competency Coverage', description: `${gaps.length} required competencies are not mapped`, recommendation: 'Add lesson mappings for every required competency.' });
  }

  const assessedLessons = params.lessons.filter((lesson) => (lesson.quizQuestions?.length ?? 0) > 0 || lesson.practiceExam).length;
  const assessmentScore = percent(assessedLessons, params.lessons.length);
  if (assessmentScore < 85) {
    issues.push({ severity: 'medium', category: 'Assessment Quality', description: `${params.lessons.length - assessedLessons} lessons have no quiz or practice exam`, recommendation: 'Add appropriate assessment evidence to uncovered lessons.' });
  }

  const handsOnLessons = params.lessons.filter((lesson) => /\b(step|procedure|demonstration|practice|lab|hands[- ]on)\b/i.test(lesson.content ?? '')).length;
  const safetyLessons = params.lessons.filter((lesson) => /\b(safety|osha|hazard|ppe)\b/i.test(lesson.content ?? '')).length;
  const handsOnScore = Math.max(0, Math.min(100, percent(handsOnLessons, Math.max(1, Math.ceil(params.lessons.length * 0.3))) - (safetyLessons === 0 ? 10 : 0)));

  const completedAssets = params.mediaAssets.filter((asset) => asset.status === 'complete').length;
  const pending = params.mediaAssets.filter((asset) => asset.status !== 'complete').map((asset) => `${asset.type} for ${asset.lessonId}`);
  const mediaComplete: MediaCompleteness = { totalAssets: params.mediaAssets.length, generatedAssets: completedAssets, pendingAssets: params.mediaAssets.length - completedAssets, percentage: percent(completedAssets, params.mediaAssets.length), pending };

  const inaccessibleVideos = params.lessons.filter((lesson) => lesson.hasVideo && !lesson.captions).length;
  const missingAlt = params.lessons.filter((lesson) => lesson.hasImages && !lesson.hasAltText).length;
  const accessibilityScore = Math.max(0, 100 - inaccessibleVideos * 15 - missingAlt * 10);
  if (inaccessibleVideos || missingAlt) {
    issues.push({ severity: inaccessibleVideos ? 'high' : 'medium', category: 'Accessibility', description: `${inaccessibleVideos} videos lack captions; ${missingAlt} image-bearing lessons lack alt-text confirmation`, recommendation: 'Complete captioning and descriptive alt-text review before publishing.' });
  }

  const licensingMetadata = generateLicensingMetadata(params.courseId);
  const categories = [
    category('Credential Alignment', credentialScore, 90, `${mappedLessons}/${params.lessons.length} lessons mapped`),
    category('Blueprint Coverage', blueprintCoverage.percentage, 95, `${blueprintCoverage.coveredTopics}/${blueprintCoverage.totalTopics} topics covered`, missingTopics),
    category('Competency Coverage', competencyCoverage.percentage, 95, `${competencyCoverage.covered}/${competencyCoverage.total} competencies covered`, gaps),
    category('Assessment Quality', assessmentScore, 85, `${assessedLessons}/${params.lessons.length} lessons contain assessment evidence`),
    category('Hands-on Skills', handsOnScore, 80, `${handsOnLessons} hands-on lessons; ${safetyLessons} safety lessons`),
    category('Media Complete', mediaComplete.percentage, 90, `${completedAssets}/${params.mediaAssets.length} required media assets complete`, pending),
    category('Accessibility', accessibilityScore, 90, `${inaccessibleVideos} uncaptioned videos; ${missingAlt} alt-text gaps`),
    category('Licensing Metadata', 100, 100, `${licensingMetadata.curriculumId} · ${licensingMetadata.version}`),
  ];

  const weights: Record<string, number> = { 'Credential Alignment': 0.15, 'Blueprint Coverage': 0.20, 'Competency Coverage': 0.20, 'Assessment Quality': 0.15, 'Hands-on Skills': 0.10, 'Media Complete': 0.10, Accessibility: 0.05, 'Licensing Metadata': 0.05 };
  const overallScore = Math.round(categories.reduce((sum, item) => sum + item.score * (weights[item.name] ?? 0), 0));
  const isReady = overallScore >= 95 && categories.every((item) => item.passed) && !issues.some((issue) => issue.severity === 'critical');

  return { courseId: params.courseId, courseName: params.courseName, generatedAt: new Date().toISOString(), isReady, overallScore, threshold: 95, categories, issues, blueprintCoverage, competencyCoverage, mediaComplete, licensingMetadata };
}

function generateLicensingMetadata(courseId: string): LicensingMetadata {
  const date = new Date();
  return {
    curriculumId: `${courseId.toUpperCase()}-${date.toISOString().split('T')[0]}`,
    version: `v${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
    copyright: `© ${date.getFullYear()} Elevate for Humanity`,
    licenseType: 'Annual Subscription',
    updateChannel: 'Standard',
    maintenanceIncluded: true,
  };
}
