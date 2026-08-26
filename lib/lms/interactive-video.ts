import type { Checkpoint } from '@/components/lms/InteractiveVideoPlayer';

type UnknownRecord = Record<string, unknown>;

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface InteractiveVideoRuntime {
  checkpoints: Checkpoint[];
  transcript: TranscriptSegment[];
  validationErrors: string[];
}

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function timestamp(item: UnknownRecord, fallback: number): number {
  return number(item.timestamp ?? item.timestampSeconds ?? item.time ?? item.at) ?? fallback;
}

function normalizeTranscript(value: unknown): TranscriptSegment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = record(entry);
    if (!item) return [];
    const start = number(item.start);
    const end = number(item.end);
    const body = text(item.text);
    if (start === null || end === null || end < start || !body) return [];
    return [{ start, end, text: body }];
  });
}

export function normalizeInteractiveVideoExperience(value: unknown): InteractiveVideoRuntime {
  const experience = record(value) ?? {};
  const interactive = record(experience.interactiveVideo) ?? {};
  const rawCheckpoints = Array.isArray(interactive.checkpoints) ? interactive.checkpoints : [];
  const checkpoints: Checkpoint[] = [];
  const validationErrors: string[] = [];

  rawCheckpoints.forEach((entry, index) => {
    const item = record(entry);
    if (!item) {
      validationErrors.push(`Interactive checkpoint ${index + 1} must be an object.`);
      return;
    }

    const type = text(item.type);
    const at = timestamp(item, (index + 1) * 60);

    if (type === 'quiz') {
      const options = Array.isArray(item.options) ? item.options.map(text).filter(Boolean) : [];
      const answer = number(item.answer ?? item.correct ?? item.correctAnswer);
      const question = text(item.question);
      if (!question || options.length < 2 || answer === null || answer >= options.length) {
        validationErrors.push(`Quiz checkpoint ${index + 1} is missing a question, options, or valid answer.`);
        return;
      }
      checkpoints.push({ type: 'quiz', timestamp: at, question, options, answer, explanation: text(item.explanation) || undefined });
      return;
    }

    if (type === 'hotspot') {
      const prompt = text(item.prompt);
      const areas = Array.isArray(item.areas)
        ? item.areas.flatMap((area) => {
            const candidate = record(area);
            if (!candidate) return [];
            const label = text(candidate.label);
            if (!label) return [];
            return [{ label, correct: candidate.correct === true || candidate.isCorrect === true, info: text(candidate.info ?? candidate.feedback) }];
          })
        : [];
      if (!prompt || areas.length < 2 || !areas.some((area) => area.correct)) {
        validationErrors.push(`Hotspot checkpoint ${index + 1} requires a prompt and at least one correct area.`);
        return;
      }
      checkpoints.push({ type: 'hotspot', timestamp: at, prompt, areas });
      return;
    }

    if (type === 'scenario') {
      const situation = text(item.situation ?? item.context ?? item.question);
      const rawChoices = item.choices ?? item.options;
      const choices = Array.isArray(rawChoices)
        ? rawChoices.flatMap((choice) => {
            const candidate = record(choice);
            if (!candidate) return [];
            const choiceText = text(candidate.text);
            if (!choiceText) return [];
            return [{ text: choiceText, feedback: text(candidate.feedback), correct: candidate.correct === true || candidate.isCorrect === true }];
          })
        : [];
      if (!situation || choices.length < 2 || !choices.some((choice) => choice.correct)) {
        validationErrors.push(`Scenario checkpoint ${index + 1} requires a situation and at least one correct choice.`);
        return;
      }
      checkpoints.push({ type: 'scenario', timestamp: at, situation, choices });
      return;
    }

    if (type === 'reflection') {
      const prompt = text(item.prompt);
      if (!prompt) {
        validationErrors.push(`Reflection checkpoint ${index + 1} requires a prompt.`);
        return;
      }
      checkpoints.push({ type: 'reflection', timestamp: at, prompt, minChars: number(item.minChars) ?? undefined });
      return;
    }

    if (type === 'key-concept') {
      const concept = text(item.concept);
      if (!concept) {
        validationErrors.push(`Key-concept checkpoint ${index + 1} requires a concept.`);
        return;
      }
      checkpoints.push({ type: 'key-concept', timestamp: at, concept, bullets: Array.isArray(item.bullets) ? item.bullets.map(text).filter(Boolean) : undefined });
      return;
    }

    validationErrors.push(`Interactive checkpoint ${index + 1} has an unsupported type: ${type || 'missing'}.`);
  });

  const knowledgeChecks = Array.isArray(experience.knowledgeChecks) ? experience.knowledgeChecks : [];
  knowledgeChecks.forEach((entry, index) => {
    const item = record(entry);
    if (!item) return;
    const question = text(item.question);
    const options = Array.isArray(item.options) ? item.options.map(text).filter(Boolean) : [];
    const answer = number(item.correct ?? item.correctAnswer);
    if (!question || options.length < 2 || answer === null || answer >= options.length) return;
    if (checkpoints.some((checkpoint) => checkpoint.type === 'quiz' && checkpoint.question === question)) return;
    checkpoints.push({
      type: 'quiz',
      timestamp: timestamp(item, (index + 1) * 90),
      question,
      options,
      answer,
      explanation: text(item.explanation) || undefined,
    });
  });

  const transcript = normalizeTranscript(interactive.transcript ?? experience.transcript);
  checkpoints.sort((a, b) => a.timestamp - b.timestamp);

  return { checkpoints, transcript, validationErrors };
}
