export interface InstructionalScriptRepairInput {
  lessonTitle: string;
  lessonType?: string | null;
  evidenceType?: string | null;
  baseScript: string;
  content: unknown;
  contentJson: unknown;
}

export interface InstructionalScriptRepairResult {
  script: string;
  repaired: boolean;
  wordCount: number;
  minimumWordCount: number;
  maximumWordCount: number;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Legacy authored-course payloads sometimes flattened storyboard/LMS control
 * metadata into the narration string. Those tokens are useful to builders but
 * must never be spoken to learners. Only activate this cleanup when an
 * unmistakable control marker is present so normal instructional words such as
 * "diagram", "practice", or "summary" remain untouched in ordinary lessons.
 */
function stripLegacyAuthoringMetadata(value: string): string {
  const hasLegacyMarkers =
    /\b(?:knowledge-check-\d+|repository_blueprint|course_lessons|readingGuide\.summary|learning_objectives|preAssessment|video_url|knowledgeChecks|practicalTask|quiz_questions|pre_assessment|review_exam|original_capture|licensed_demonstration)\b/i.test(
      value,
    );
  if (!hasLegacyMarkers) return value;

  return value
    // A flattened LMS step map is pure navigation metadata and is always a
    // tail artifact, never part of the lesson's teaching script.
    .replace(/\bIntroduction\s+readingGuide\.summary\b[\s\S]*$/gi, ' ')
    .replace(/\bknowledge-check-\d+\b/gi, ' ')
    .replace(/\b(?:repository_blueprint|course_lessons)\b/gi, ' ')
    .replace(/\b(?:animated-text|technical-diagram|equipment-image|screen-demonstration)\b/gi, ' ')
    .replace(/\bInstructor\s+Objective\b/gi, ' ')
    .replace(/\bInstructor and lesson roadmap\b/gi, ' ')
    .replace(/\bapproved lesson source\b/gi, ' ')
    .replace(/\bThree sourced teaching points\b/gi, ' ')
    .replace(/\bKey concept\b/gi, ' ')
    .replace(/\bCorrect sequence\b/gi, ' ')
    .replace(/\bLabeled sequence diagram\b/gi, ' ')
    .replace(/\bCorrect\s+Needs correction\b/gi, ' ')
    .replace(/\bSide-by-side correct and incorrect examples\b/gi, ' ')
    .replace(/\bYour turn\b/gi, ' ')
    .replace(/\bDecision and evidence checklist\b/gi, ' ')
    .replace(/\bLesson recap\s+Three takeaways and completed-work evidence\b/gi, ' ')
    // These are scene-purpose labels from the same flattened timeline. Restrict
    // removal to cases where the next token begins a learner-facing sentence.
    .replace(/\b(?:introduction|explanation|diagram|demonstration|practice|summary)\b(?=\s+[A-Z])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes Course Builder production directions that may exist in legacy
 * reading guides or job payloads. These are authoring metadata, never learner
 * narration. The quality gate remains the final fail-closed boundary.
 */
function sanitizeInternalInstructions(value: string): string {
  return stripLegacyAuthoringMetadata(value)
    .replace(
      /\bApply this to\b[\s\S]{0,1200}?\bchecking the result against the stated objective\.\s*/gi,
      ' ',
    )
    .replace(
      /\bThe instructor should model one concrete example,?\s*name the decision criteria,?\s*and close clip \d+ with an observable learner action\.\s*/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNarration(value: string): string {
  return sanitizeInternalInstructions(decodeHtml(value));
}

function words(value: string): string[] {
  return value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [];
}

function dedupeTeachingSegments(value: string): string {
  const seen = new Set<string>();
  return value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => {
      const tokens = words(segment);
      if (tokens.length < 6) return true;
      const key = tokens.join(' ').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function minimumWords(input: InstructionalScriptRepairInput): number {
  const kind = `${input.lessonType ?? ''} ${input.evidenceType ?? ''} ${input.lessonTitle}`.toLowerCase();
  if (/checkpoint|quiz|exam|review/.test(kind)) return 120;
  if (/practical|lab|hands-on|procedure|demonstration/.test(kind)) return 220;
  return 180;
}

function maximumWords(input: InstructionalScriptRepairInput): number {
  const kind = `${input.lessonType ?? ''} ${input.evidenceType ?? ''} ${input.lessonTitle}`.toLowerCase();
  if (/checkpoint|quiz|exam|review/.test(kind)) return 520;
  if (/practical|lab|hands-on|procedure|demonstration/.test(kind)) return 780;
  return 700;
}

function boundNarration(value: string, maximumWordCount: number): string {
  if (words(value).length <= maximumWordCount) return value;

  // Never trim learner narration at an arbitrary token boundary. The previous
  // word-slice implementation could cut a sentence in half and then splice the
  // recap bridge directly into the fragment (for example, "apply soothing aloe
  // vera gel or chamomile Now, connect..."). Keep only complete sentences so
  // production TTS, captions, and storyboard dialogue remain grammatical.
  const sentences = value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length < 2) {
    const clipped = value.split(/\s+/).filter(Boolean).slice(0, maximumWordCount).join(' ').trim();
    return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
  }

  const recapBudget = Math.min(120, Math.floor(maximumWordCount * 0.2));
  const teachingBudget = maximumWordCount - recapBudget;
  const teaching: string[] = [];
  let teachingWords = 0;
  let cursor = 0;

  for (; cursor < sentences.length; cursor += 1) {
    const sentence = sentences[cursor];
    const sentenceWords = words(sentence).length;
    if (teaching.length > 0 && teachingWords + sentenceWords > teachingBudget) break;
    teaching.push(sentence);
    teachingWords += sentenceWords;
    if (teachingWords >= teachingBudget) {
      cursor += 1;
      break;
    }
  }

  const recap: string[] = [];
  let recapWords = 0;
  for (let index = sentences.length - 1; index >= cursor; index -= 1) {
    const sentence = sentences[index];
    const sentenceWords = words(sentence).length;
    if (recap.length > 0 && recapWords + sentenceWords > recapBudget) break;
    recap.unshift(sentence);
    recapWords += sentenceWords;
    if (recapWords >= recapBudget) break;
  }

  if (!recap.length) return teaching.join(' ').trim();
  return [
    teaching.join(' '),
    'Now, connect those steps to the lesson objective and check your understanding.',
    recap.join(' '),
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function readingGuideParts(contentJson: Record<string, unknown>): string[] {
  const experience = record(contentJson.experience);
  const guide = record(experience.readingGuide);
  const sections = Array.isArray(guide.sections) ? guide.sections : [];
  const parts = [guide.summary]
    .concat(sections.flatMap((section) => {
      const row = record(section);
      return [row.heading, row.body];
    }))
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return parts;
}

function checkpointParts(contentJson: Record<string, unknown>): string[] {
  const experience = record(contentJson.experience);
  const checks = Array.isArray(experience.knowledgeChecks) ? experience.knowledgeChecks : [];
  return checks.flatMap((check, index) => {
    const row = record(check);
    const options = Array.isArray(row.options)
      ? row.options.filter((value): value is string => typeof value === 'string')
      : [];
    const correctIndex = typeof row.correct === 'number' ? row.correct : -1;
    const correct = options[correctIndex];
    return [
      typeof row.question === 'string' ? `Review question ${index + 1}: ${row.question}` : '',
      correct ? `The correct response is ${correct}.` : '',
      typeof row.explanation === 'string' ? row.explanation : '',
    ].filter(Boolean);
  });
}

function uniqueParts(parts: string[]): string[] {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const normalized = normalizeNarration(part);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).map(normalizeNarration);
}

/**
 * Expands undersized canonical narration from the lesson's governed content.
 * It never invents filler: HTML, reading-guide instruction, and checkpoint
 * explanations are the only repair sources. Legacy authoring directions are
 * stripped before any text can become learner-facing narration.
 */
export function repairInstructionalScript(
  input: InstructionalScriptRepairInput,
): InstructionalScriptRepairResult {
  const minimumWordCount = minimumWords(input);
  const decodedBaseScript = decodeHtml(input.baseScript);
  const sanitizedBaseScript = sanitizeInternalInstructions(decodedBaseScript);
  const baseScript = dedupeTeachingSegments(sanitizedBaseScript);
  const baseWordCount = words(baseScript).length;
  const baseWasSanitized = baseScript !== decodedBaseScript;
  const maximumWordCount = maximumWords(input);
  if (baseWordCount >= minimumWordCount) {
    const boundedScript = boundNarration(baseScript, maximumWordCount);
    const boundedWordCount = words(boundedScript).length;
    return {
      script: boundedScript,
      repaired: baseWasSanitized || boundedScript !== baseScript,
      wordCount: boundedWordCount,
      minimumWordCount,
      maximumWordCount,
    };
  }

  const content = record(input.content);
  const contentJson = record(input.contentJson);
  const html = typeof content.html === 'string' ? content.html : '';
  const isCheckpoint = /checkpoint|quiz|exam|review/i.test(
    `${input.lessonType ?? ''} ${input.lessonTitle}`,
  );
  const parts = uniqueParts([
    `Today's lesson is ${input.lessonTitle}.`,
    baseScript,
    html,
    ...readingGuideParts(contentJson),
    ...(isCheckpoint ? checkpointParts(contentJson) : []),
  ]);

  // Preserve learner-facing punctuation while expanding undersized narration.
  // Converting the governed parts to bare word tokens here destroys sentence
  // boundaries, which can create malformed recap splices and truncated TTS.
  // boundNarration already enforces the maximum at complete sentence edges.
  const script = dedupeTeachingSegments(parts.join(' '));
  const boundedScript = boundNarration(script, maximumWordCount);
  const wordCount = words(boundedScript).length;
  return {
    script: boundedScript,
    repaired: boundedScript !== decodedBaseScript,
    wordCount,
    minimumWordCount,
    maximumWordCount,
  };
}
