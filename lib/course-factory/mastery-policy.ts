import { LearningIntelligenceSchema, type LearningIntelligence } from './learning-intelligence';

export type LessonMasteryPolicy = {
  threshold: number;
  skills: LearningIntelligence['skills'];
  remediationTargets: string[];
  expertReviewRequired: boolean;
  automatedEvidenceReview: boolean;
};

function record(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function clampThreshold(value: unknown, fallback = 80): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(100, Math.round(numeric)));
}

export function normalizeStoredLessonContent(value: unknown): Record<string, any> {
  const stored = record(value);
  if (stored) return stored;
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    return record(JSON.parse(value)) ?? {};
  } catch {
    return { html: value };
  }
}

export function resolveStoredLessonExperience(
  contentJson: unknown,
  content: unknown,
): Record<string, any> | null {
  const json = record(contentJson) ?? {};
  const legacy = normalizeStoredLessonContent(content);
  return record(json.experience) ?? record(legacy.experience);
}

export function resolveLessonMasteryPolicy(
  experience: unknown,
  fallbackThreshold = 80,
): LessonMasteryPolicy {
  const source = record(experience) ?? {};
  const intelligenceResult = LearningIntelligenceSchema.safeParse(source.intelligence);
  const intelligence = intelligenceResult.success ? intelligenceResult.data : null;
  const threshold = clampThreshold(
    intelligence?.adaptivePath.masteryThreshold ??
      source.readiness?.masteryThreshold ??
      source.remediation?.passingScore,
    fallbackThreshold,
  );

  return {
    threshold,
    skills: intelligence?.skills ?? [],
    remediationTargets:
      intelligence?.adaptivePath.remediationTargets ??
      (Array.isArray(source.remediation?.objectiveMap)
        ? source.remediation.objectiveMap.map(String).filter(Boolean)
        : []),
    expertReviewRequired: intelligence?.collaboration.expertReviewRequired === true,
    automatedEvidenceReview: intelligence?.collaboration.automatedEvidenceReview === true,
  };
}

export function resolveDomainMasteryThresholds(
  lessons: Array<{
    domain_key?: unknown;
    content_json?: unknown;
    content?: unknown;
  }>,
  fallbackThreshold = 80,
): Map<string, number> {
  const thresholds = new Map<string, number>();
  for (const lesson of lessons) {
    const domain = String(lesson.domain_key ?? 'unmapped');
    const experience = resolveStoredLessonExperience(lesson.content_json, lesson.content);
    const threshold = resolveLessonMasteryPolicy(experience, fallbackThreshold).threshold;
    thresholds.set(domain, Math.max(thresholds.get(domain) ?? 0, threshold));
  }
  return thresholds;
}
