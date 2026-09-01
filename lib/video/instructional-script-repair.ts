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

function words(value: string): string[] {
  return value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [];
}

function minimumWords(input: InstructionalScriptRepairInput): number {
  const kind = `${input.lessonType ?? ''} ${input.evidenceType ?? ''} ${input.lessonTitle}`.toLowerCase();
  if (/checkpoint|quiz|exam|review/.test(kind)) return 120;
  if (/practical|lab|hands-on|procedure|demonstration/.test(kind)) return 220;
  return 180;
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
    const normalized = decodeHtml(part);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).map(decodeHtml);
}

/**
 * Expands undersized canonical narration from the lesson's governed content.
 * It never invents filler: HTML, reading-guide instruction, and checkpoint
 * explanations are the only repair sources.
 */
export function repairInstructionalScript(
  input: InstructionalScriptRepairInput,
): InstructionalScriptRepairResult {
  const minimumWordCount = minimumWords(input);
  const baseScript = decodeHtml(input.baseScript);
  const baseWordCount = words(baseScript).length;
  if (baseWordCount >= minimumWordCount) {
    return { script: baseScript, repaired: false, wordCount: baseWordCount, minimumWordCount };
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

  // Bound repaired narration while retaining enough governed instruction to
  // satisfy the quality contract and produce a useful lesson-sized video.
  const repairedWords = words(parts.join(' ')).slice(0, Math.max(minimumWordCount + 80, 500));
  const script = repairedWords.join(' ');
  const wordCount = repairedWords.length;
  return {
    script,
    repaired: wordCount >= minimumWordCount && wordCount > baseWordCount,
    wordCount,
    minimumWordCount,
  };
}
