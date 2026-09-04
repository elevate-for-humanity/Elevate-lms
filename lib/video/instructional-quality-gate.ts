import type { MediaStoryboard } from './media-director';

export interface InstructionalQualityInput {
  courseTitle: string;
  lessonTitle: string;
  lessonType?: string | null;
  evidenceType?: string | null;
  script: string;
  learningObjectives?: string[];
  instructor: { id: string; title: string; specialty: string };
  storyboard: MediaStoryboard;
}

export interface InstructionalQualityEvidence {
  wordCount: number;
  minimumWordCount: number;
  courseDomain: 'cosmetology' | 'barbering' | 'hvac_epa608' | 'general';
  demonstrationClaimed: boolean;
  demonstrationScenes: number;
  titleKeywordCoverage: number;
  sceneTypeCoverage: number;
  hasMentalModel: boolean;
  hasWorkedExample: boolean;
  hasMemoryRecap: boolean;
  hasKnowledgeCheck: boolean;
  hasSafetyScene: boolean;
  objectiveCoverage: number;
  sceneNarrationAlignment: number;
  instructionLeakageDetected: boolean;
}

const IGNORED_WORDS = new Set(['and', 'the', 'for', 'with', 'to', 'of', 'a', 'an', 'in', 'on', 'this', 'that', 'will', 'your', 'you']);

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function domain(courseTitle: string): InstructionalQualityEvidence['courseDomain'] {
  const title = courseTitle.toLowerCase();
  if (/cosmetolog|beauty/.test(title)) return 'cosmetology';
  if (/barber/.test(title)) return 'barbering';
  if (/hvac|epa 608|refriger/.test(title)) return 'hvac_epa608';
  return 'general';
}

function minimumWords(input: InstructionalQualityInput): number {
  const kind = `${input.lessonType ?? ''} ${input.evidenceType ?? ''} ${input.lessonTitle}`.toLowerCase();
  if (/checkpoint|quiz|exam|review/.test(kind)) return 120;
  if (/practical|lab|hands-on|procedure|demonstration/.test(kind)) return 220;
  return 180;
}

function keywordCoverage(title: string, script: string): number {
  const expected = [...new Set(words(title).filter((word) => word.length > 2 && !IGNORED_WORDS.has(word)))];
  if (!expected.length) return 1;
  const delivered = new Set(words(script));
  return expected.filter((word) => delivered.has(word)).length / expected.length;
}

function objectivesCoverage(objectives: string[], script: string): number {
  if (!objectives.length) return 1;
  return objectives.filter((objective) => keywordCoverage(objective, script) >= 0.5).length / objectives.length;
}

function containsBarberTradeIdentity(script: string, instructor: string): boolean {
  // Indiana's licensing agency legitimately includes "Cosmetology and Barbering"
  // in its name. Exclude that regulator reference while continuing to reject an
  // actual barber instructor, barbering credential, or barber-trade narration.
  const narrationWithoutAgencyNames = script
    .replace(/\bindiana state board of cosmetology and barbering\b/gi, '')
    .replace(/\bstate board of cosmetology and barbering\b/gi, '');
  const barberIdentity = /\b(?:master |licensed |student |apprentice )?barber(?:ing)?(?: instructor| educator| specialist| license| credential| apprenticeship| program| trade| career| services?)?\b/i;
  return barberIdentity.test(instructor) || barberIdentity.test(narrationWithoutAgencyNames);
}

function sceneAlignment(storyboard: MediaStoryboard): number {
  if (!storyboard.scenes.length) return 0;
  const aligned = storyboard.scenes.filter((scene) => {
    const visualTerms = [...new Set(words(`${scene.action} ${scene.requiredVisualEvidence ?? ''}`)
      .filter((word) => word.length > 3 && !IGNORED_WORDS.has(word)))];
    if (!visualTerms.length) return false;
    const narration = new Set(words(scene.dialogue ?? ''));
    return visualTerms.filter((word) => narration.has(word)).length / visualTerms.length >= 0.3;
  }).length;
  return aligned / storyboard.scenes.length;
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
  const sceneTypes = new Set<string>(input.storyboard.scenes.flatMap((scene) => scene.sceneType ? [scene.sceneType] : []));
  const requiredTypes = ['mental_model', 'system_diagram', 'worked_example', 'memory_recap', 'knowledge_check'];
  const sceneTypeCoverage = requiredTypes.filter((type) => sceneTypes.has(type)).length / requiredTypes.length;
  const hasMentalModel = sceneTypes.has('mental_model');
  const hasWorkedExample = sceneTypes.has('worked_example') || sceneTypes.has('field_scenario');
  const hasMemoryRecap = sceneTypes.has('memory_recap');
  const hasKnowledgeCheck = sceneTypes.has('knowledge_check');
  const hasSafetyScene = sceneTypes.has('safety_warning') || input.storyboard.scenes.some((scene) => scene.procedurePhase === 'safety');
  const learningObjectives = (input.learningObjectives ?? []).filter((value) => value.trim().length > 0);
  const objectiveCoverage = objectivesCoverage(learningObjectives, input.script);
  const sceneNarrationAlignment = sceneAlignment(input.storyboard);
  const instructionLeakageDetected = /\b(the narration should|the script should|apply this to .{0,160} by identifying|end with the action the learner|as an ai|return (?:valid )?json|prompt engineering)\b/i.test(input.script);

  if (scriptWords.length < minimumWordCount) {
    failures.push(`instruction is too short (${scriptWords.length} words; minimum ${minimumWordCount})`);
  }
  if (titleKeywordCoverage < 0.5) {
    failures.push(`narration does not sufficiently cover the lesson title (${Math.round(titleKeywordCoverage * 100)}%)`);
  }
  if (instructionLeakageDetected) failures.push('narration contains internal generation instructions');
  if (objectiveCoverage < 1) {
    failures.push(`narration covers only ${Math.round(objectiveCoverage * 100)}% of stated learning objectives`);
  }
  if (sceneNarrationAlignment < 0.75) {
    failures.push(`only ${Math.round(sceneNarrationAlignment * 100)}% of scenes visually align with their narration`);
  }
  if (courseDomain === 'cosmetology' && containsBarberTradeIdentity(input.script, combinedInstructor)) {
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
  if (courseDomain === 'hvac_epa608') {
    if (!hasMentalModel) failures.push('HVAC instruction must include a memorable mental-model scene');
    if (!sceneTypes.has('system_diagram')) failures.push('HVAC instruction must include an exact system-diagram scene');
    if (!hasWorkedExample) failures.push('HVAC instruction must include a worked example or field scenario');
    if (!hasMemoryRecap) failures.push('HVAC instruction must include a memory recap');
    if (!hasKnowledgeCheck) failures.push('HVAC instruction must include an application-based knowledge check');
    const safetyRelevant = /recover|refrigerant|electrical|voltage|pressure|cylinder|service|procedure/i.test(`${input.lessonTitle} ${input.script}`);
    if (safetyRelevant && !hasSafetyScene) failures.push('safety-sensitive HVAC instruction must include an explicit safety-warning scene');
  }

  return {
    evidence: {
      wordCount: scriptWords.length,
      minimumWordCount,
      courseDomain,
      demonstrationClaimed,
      demonstrationScenes,
      titleKeywordCoverage,
      sceneTypeCoverage,
      hasMentalModel,
      hasWorkedExample,
      hasMemoryRecap,
      hasKnowledgeCheck,
      hasSafetyScene,
      objectiveCoverage,
      sceneNarrationAlignment,
      instructionLeakageDetected,
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
