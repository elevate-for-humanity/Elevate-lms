/**
 * PARIS Media Designer AI
 * 
 * Automatically decides what media each lesson needs.
 * No manual commands - AI decides based on content analysis.
 */


export interface MediaRequirements {
  lessonId: string;
  needsAvatar: boolean;
  needsNarration: boolean;
  needsDiagrams: boolean;
  needsVideo: boolean;
  needsSlides: boolean;
  needsWorkbook: boolean;
  needsQuiz: boolean;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface MediaAssets {
  avatar?: AvatarAsset;
  narration?: NarrationAsset;
  diagrams: DiagramAsset[];
  video?: VideoAsset;
  slides?: SlidesAsset;
  workbook?: WorkbookAsset;
  quiz?: QuizAsset;
}

export interface AvatarAsset {
  lessonId: string;
  script: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface NarrationAsset {
  lessonId: string;
  script: string;
  voice: 'professional' | 'friendly' | 'authoritative';
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface DiagramAsset {
  lessonId: string;
  type: 'process' | 'anatomy' | 'flowchart' | 'diagram' | 'chart';
  description: string;
  prompt: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface VideoAsset {
  lessonId: string;
  script: string;
  avatar: boolean;
  narration: boolean;
  demonstrations: string[];
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface SlidesAsset {
  lessonId: string;
  title: string;
  slides: Slide[];
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface Slide {
  title: string;
  content: string;
  imagePrompt?: string;
}

export interface WorkbookAsset {
  lessonId: string;
  title: string;
  chapters: WorkbookChapter[];
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface WorkbookChapter {
  title: string;
  exercises: Exercise[];
}

export interface Exercise {
  type: 'fill-blank' | 'multiple-choice' | 'matching' | 'short-answer' | 'practice';
  question: string;
  answer?: string;
}

export interface QuizAsset {
  lessonId: string;
  questions: QuizQuestion[];
  passingScore: number;
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  rationale: string;
}

/**
 * Analyze lesson content and determine what media is needed
 */
export function analyzeMediaRequirements(params: {
  lessonId: string;
  title: string;
  content: string;
  objectives: string[];
  competencyType: 'knowledge' | 'skill' | 'safety' | 'compliance';
}): MediaRequirements {
  const needs: MediaRequirements = {
    lessonId: params.lessonId,
    needsAvatar: true,
    needsNarration: true,
    needsDiagrams: false,
    needsVideo: false,
    needsSlides: false,
    needsWorkbook: true,
    needsQuiz: true,
    priority: 'high',
    reasoning: '',
  };

  const content = params.content.toLowerCase();
  const title = params.title.toLowerCase();

  // Check for process words
  if (/\b(process|procedure|steps|how to|sequence|workflow)\b/.test(content)) {
    needs.needsDiagrams = true;
    needs.needsVideo = true;
    needs.priority = 'high';
  }

  // Check for anatomy/structure words
  if (/\b(parts|components|anatomy|structure|diagram|system)\b/.test(content)) {
    needs.needsDiagrams = true;
    needs.needsVideo = true;
    needs.priority = 'high';
  }

  // Check for safety/compliance
  if (params.competencyType === 'safety' || params.competencyType === 'compliance') {
    needs.needsVideo = true;
    needs.needsSlides = true;
    needs.needsQuiz = true;
    needs.priority = 'high';
  }

  // Check for skill demonstration
  if (params.competencyType === 'skill') {
    needs.needsVideo = true;
    needs.needsWorkbook = true;
    needs.needsQuiz = true;
    needs.priority = 'high';
  }

  // Check for knowledge only
  if (params.competencyType === 'knowledge') {
    needs.needsSlides = true;
    needs.needsWorkbook = true;
    needs.needsQuiz = true;
    needs.priority = 'medium';
  }

  // Check for regulations
  if (/\b(osha|epa|federal|regulation|code|standard|requirement)\b/.test(content)) {
    needs.needsSlides = true;
    needs.needsQuiz = true;
    needs.priority = 'high';
  }

  // Build reasoning
  const reasons: string[] = [];
  if (needs.needsVideo) reasons.push('video demonstration recommended');
  if (needs.needsDiagrams) reasons.push('visual diagrams needed');
  if (needs.needsSlides) reasons.push('presentation slides recommended');
  if (needs.needsWorkbook) reasons.push('practice exercises recommended');

  needs.reasoning = reasons.join(', ');

  return needs;
}

/**
 * Generate all media for a lesson
 */
export async function generateLessonMedia(params: {
  lessonId: string;
  title: string;
  content: string;
  objectives: string[];
  competencyType: 'knowledge' | 'skill' | 'safety' | 'compliance';
}): Promise<MediaAssets> {
  const assets: MediaAssets = { diagrams: [] };

  // Analyze what media is needed
  const requirements = analyzeMediaRequirements(params);

  // Generate based on requirements
  if (requirements.needsAvatar) {
    assets.avatar = await generateAvatar(params);
  }

  if (requirements.needsNarration) {
    assets.narration = await generateNarrationAsset(params);
  }

  if (requirements.needsDiagrams) {
    assets.diagrams = await generateDiagrams(params);
  }

  if (requirements.needsVideo) {
    assets.video = await generateVideoAsset(params);
  }

  if (requirements.needsSlides) {
    assets.slides = await generateSlidesAsset(params);
  }

  if (requirements.needsWorkbook) {
    assets.workbook = await generateWorkbookAsset(params);
  }

  if (requirements.needsQuiz) {
    assets.quiz = await generateQuizAsset(params);
  }

  return assets;
}

/**
 * Generate AI avatar
 */
async function generateAvatar(params: {
  lessonId: string;
  title: string;
  content: string;
}): Promise<AvatarAsset> {
  const script = generateAvatarScript(params.content);

  return {
    lessonId: params.lessonId,
    script,
    status: 'pending',
  };
}

/**
 * Generate avatar narration script
 */
function generateAvatarScript(content: string): string {
  // Extract key concepts for avatar to discuss
  const keyPoints = extractKeyPoints(content, 5);
  
  let script = `Welcome to this lesson. `;
  
  for (let i = 0; i < keyPoints.length; i++) {
    script += `Let's talk about ${keyPoints[i]}. `;
  }
  
  script += `By the end of this lesson, you'll be able to demonstrate these concepts. Let's get started.`;
  
  return script;
}

/**
 * Extract key points from content
 */
function extractKeyPoints(content: string, count: number): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.length > 20);
  const keyTerms = ['important', 'key', 'critical', 'essential', 'must', 'always', 'never'];
  
  const scored = sentences.map(s => {
    let score = 0;
    for (const term of keyTerms) {
      if (s.toLowerCase().includes(term)) score++;
    }
    return { sentence: s.trim(), score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, count).map(s => s.sentence);
}

/**
 * Generate narration
 */
async function generateNarrationAsset(params: {
  lessonId: string;
  title: string;
  content: string;
}): Promise<NarrationAsset> {
  // Convert content to narration script
  const script = contentToNarration(params.content);

  return {
    lessonId: params.lessonId,
    script,
    voice: 'professional',
    status: 'pending',
  };
}

/**
 * Convert lesson content to narration
 */
function contentToNarration(content: string): string {
  const narration = content
    // Convert markdown headers to pauses
    .replace(/^##\s+(.+)$/gm, '\n$1.\n')
    // Convert lists to sequences
    .replace(/^-\s+(.+)$/gm, 'First, $1.')
    .replace(/^\d+\.\s+(.+)$/gm, 'Number $1,')
    // Add pauses for emphasis
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Clean up
    .replace(/\n{3,}/g, '\n\n');

  return narration.trim();
}

/**
 * Generate diagrams
 */
async function generateDiagrams(params: {
  lessonId: string;
  title: string;
  content: string;
}): Promise<DiagramAsset[]> {
  const diagrams: DiagramAsset[] = [];

  // Detect diagram type from content
  const content = params.content.toLowerCase();
  const title = params.title.toLowerCase();

  if (title.includes('cycle') || content.includes('refrigeration cycle')) {
    diagrams.push({
      lessonId: params.lessonId,
      type: 'process',
      description: ' refrigeration cycle diagram',
      prompt: `Professional HVAC diagram showing the refrigeration cycle: compressor, condenser, metering device, evaporator. Clean white background, labeled arrows showing refrigerant flow.`,
      status: 'pending',
    });
  }

  if (title.includes('system') || content.includes('components')) {
    diagrams.push({
      lessonId: params.lessonId,
      type: 'anatomy',
      description: ' system components diagram',
      prompt: `Educational diagram showing HVAC system components with labels. Clean, professional style suitable for training.`,
      status: 'pending',
    });
  }

  if (content.includes('pressure') || content.includes('temperature')) {
    diagrams.push({
      lessonId: params.lessonId,
      type: 'chart',
      description: ' pressure-temperature relationship chart',
      prompt: `PT chart or pressure-temperature relationship diagram for HVAC. Shows refrigerant pressures at various temperatures.`,
      status: 'pending',
    });
  }

  return diagrams;
}

/**
 * Generate video
 */
async function generateVideoAsset(params: {
  lessonId: string;
  title: string;
  content: string;
  objectives: string[];
}): Promise<VideoAsset> {
  const script = contentToVideoScript(params.content);
  const demonstrations = extractDemonstrations(params.content);

  return {
    lessonId: params.lessonId,
    script,
    avatar: true,
    narration: true,
    demonstrations,
    status: 'pending',
  };
}

/**
 * Convert content to video script
 */
function contentToVideoScript(content: string): string {
  const keyPoints = extractKeyPoints(content, 5);
  
  let script = `# ${keyPoints[0] || 'Introduction'}\n\n`;
  script += `Welcome to this lesson. `;
  
  for (const point of keyPoints) {
    script += `\n## ${point}\n\n`;
    script += `${point}. Let's see this in action.\n`;
  }
  
  script += `\n## Summary\n\n`;
  script += `To recap, we covered: ${keyPoints.join(', ')}. `;
  script += `\n## Next Steps\n\n`;
  script += `Now practice these concepts with the exercises.`;
  
  return script;
}

/**
 * Extract demonstrations from content
 */
function extractDemonstrations(content: string): string[] {
  const demonstrations: string[] = [];
  
  // Look for procedure words
  const procedures = content.match(/\b(check|test|measure|inspect|verify|demonstrate|perform|apply|install|connect|disconnect)\b[^.]+\./gi) || [];
  
  for (const proc of procedures.slice(0, 3)) {
    demonstrations.push(proc.trim());
  }
  
  return demonstrations;
}

/**
 * Generate slides
 */
async function generateSlidesAsset(params: {
  lessonId: string;
  title: string;
  content: string;
  objectives: string[];
}): Promise<SlidesAsset> {
  const slides: Slide[] = [];
  
  // Title slide
  slides.push({
    title: params.title,
    content: 'Learning Objectives:\n' + params.objectives.map(o => `• ${o}`).join('\n'),
  });
  
  // Key points
  const keyPoints = extractKeyPoints(params.content, 8);
  for (const point of keyPoints) {
    slides.push({
      title: 'Key Point',
      content: point,
    });
  }
  
  // Summary
  slides.push({
    title: 'Summary',
    content: keyPoints.slice(0, 3).join('\n\n'),
  });
  
  return {
    lessonId: params.lessonId,
    title: params.title,
    slides,
    status: 'pending',
  };
}

/**
 * Generate workbook
 */
async function generateWorkbookAsset(params: {
  lessonId: string;
  title: string;
  content: string;
  objectives: string[];
}): Promise<WorkbookAsset> {
  const chapters: WorkbookChapter[] = [];
  
  // Key points for exercises
  const keyPoints = extractKeyPoints(params.content, 4);
  
  const exercises: Exercise[] = keyPoints.map((point, i) => ({
    type: 'multiple-choice' as const,
    question: `Which of the following best describes: ${point.slice(0, 50)}...`,
    options: [
      point,
      'Something unrelated',
      'Another option',
      'None of the above',
    ],
    correctAnswer: 0,
    rationale: `This is the correct understanding of ${params.title}`,
  }));
  
  chapters.push({
    title: 'Knowledge Check',
    exercises,
  });
  
  // Practice exercises
  chapters.push({
    title: 'Practice Exercises',
    exercises: [
      {
        type: 'short-answer',
        question: 'Describe how you would apply the concepts from this lesson in a real-world scenario:',
      },
    ],
  });
  
  return {
    lessonId: params.lessonId,
    title: params.title,
    chapters,
    status: 'pending',
  };
}

/**
 * Generate quiz
 */
async function generateQuizAsset(params: {
  lessonId: string;
  title: string;
  content: string;
}): Promise<QuizAsset> {
  const keyPoints = extractKeyPoints(params.content, 10);
  
  const questions: QuizQuestion[] = keyPoints.map((point, i) => ({
    question: `Which statement about "${point.slice(0, 40)}..." is correct?`,
    options: [
      point,
      'This is incorrect',
      'This is also incorrect',
      'None of the above',
    ],
    correctAnswer: 0,
    rationale: `This is the correct understanding from the lesson.`,
  }));
  
  return {
    lessonId: params.lessonId,
    questions,
    passingScore: 70,
    status: 'pending',
  };
}
