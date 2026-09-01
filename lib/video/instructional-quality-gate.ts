import type { MediaStoryboard } from './media-director';

export interface InstructionalQualityInput {
  courseTitle: string;
  lessonTitle: string;
  lessonType?: string | null;
  evidenceType?: string | null;
  script: string;
  instructor: { id: string; title: string; specialty: string };
  storyboard: MediaStoryboard;
}

export interface InstructionalQualityEvidence {
  wordCount: number;
  minimumWordCount: number;
  courseDomain: 'cosmetology' | 'barbering' | 'general';
  demonstrationClaimed: boolean;
  demonstrationScenes: number;
  titleKeywordCoverage: number;
}

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function domain(courseTitle: string): InstructionalQualityEvidence['courseDomain'] {
  const title = courseTitle.toLowerCase();
  if (/cosmetolog|beauty/.test(title)) return 'cosmetology';
  if (/barber/.test(title)) return 'barbering';
  return 'general';
}

function minimumWords(input: InstructionalQualityInput): number {
  const kind = `${input.lessonType ?? ''} ${input.evidenceType ?? ''} ${input.lessonTitle}`.toLowerCase();
  if (/checkpoint|quiz|exam|review/.test(kind)) return 120;
  if (/practical|lab|hands-on|procedure|demonstration/.test(kind)) return 220;
  return 180;
}

function keywordCoverage(title: string, script: string): number {
  const ignored = new Set(['and', 'the', 'for', 'with', 'to', 'of', 'a', 'an', 'in', 'on']);
  const expected = [...new Set(words(title).filter((word) => word.length > 2 && !ignored.has(word)))];
  if (!expected.length) return 1;
  const delivered = new Set(words(script));
  return expected.filter((word) => delivered.has(word)).length / expected.length;
}

export function instructionalQualityFailures(input: InstructionalQualityInput): {
  evidence: InstructionalQualityEvidence;
  failures: string[];
} {
  const failures: string[] = [];
  const scriptWords = words(input.script);
  const courseDomain = domain(input.courseTitle);
  const minimumWordCount = minimumWords(input);
  const combinedInstructor = `${input.instructor.id} ${input.instructor.title} ${input.instructor.specialty}`.toLowerCase();
  // A competency phrase such as "demonstrate mastery" is not a promise that
  // the learner will see a visual procedure. Require an explicit viewing cue
  // or a first-person demonstration promise before enforcing sourced/close-up
  // visual evidence.
  const demonstrationClaimed = /\b(watch|observe|you (?:can|will) see|here (?:is|you see)|(?:i|we) (?:will|'ll) demonstrate|this demonstration|shown? (?:here|on screen))\b/i.test(input.script);
  const demonstrationScenes = input.storyboard.scenes.filter((scene) =>
    Boolean(scene.requiredVisualEvidence) &&
    (/close-up|extreme-close-up/.test(scene.shotSize) || Boolean(scene.referenceImageUrl || scene.sourceVideoUrl)),
  ).length;
  const titleKeywordCoverage = keywordCoverage(input.lessonTitle, input.script);

  if (scriptWords.length < minimumWordCount) {
    failures.push(`instruction is too short (${scriptWords.length} words; minimum ${minimumWordCount})`);
  }
  if (titleKeywordCoverage < 0.5) {
    failures.push(`narration does not sufficiently cover the lesson title (${Math.round(titleKeywordCoverage * 100)}%)`);
  }
  if (courseDomain === 'cosmetology' && /\bbarber|barbering\b/.test(`${input.script} ${combinedInstructor}`.toLowerCase())) {
    failures.push('cosmetology lesson contains a barbering instructor or trade identity');
  }
  if (courseDomain === 'barbering' && /cosmetology education specialist/.test(combinedInstructor)) {
    failures.push('barbering lesson contains a cosmetology instructor identity');
  }
  if (demonstrationClaimed && demonstrationScenes < 1) {
    failures.push('narration claims a visual demonstration but no close-up or sourced demonstration scene exists');
  }
  if (/remember, practice makes perfect[\s\S]*take notes[\s\S]*let'?s get started/i.test(input.script)) {
    failures.push('generic lesson-template narration must be replaced with topic-specific instruction');
  }

  return {
    evidence: {
      wordCount: scriptWords.length,
      minimumWordCount,
      courseDomain,
      demonstrationClaimed,
      demonstrationScenes,
      titleKeywordCoverage,
    },
    failures,
  };
}

export function enforceInstructionalQuality(input: InstructionalQualityInput): InstructionalQualityEvidence {
  const result = instructionalQualityFailures(input);
  if (result.failures.length) {
    throw new Error(`Instructional quality gate failed: ${result.failures.join('; ')}`);
  }
  return result.evidence;
}
