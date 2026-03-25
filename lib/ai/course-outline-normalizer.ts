/**
 * Post-response normalizer for AI-generated course outlines.
 *
 * Runs AFTER JSON parse, BEFORE schema validation.
 * Fixes deterministic structural problems that the model produces inconsistently:
 *
 *   1. step_type coercion — "lecture", "video", "reading" → "lesson"
 *   2. order_index resequencing — renumbers all rows 1..N in module/lesson order
 *   3. slug sanitization — lowercases, replaces spaces/underscores with hyphens,
 *      deduplicates by appending -2, -3, etc.
 *   4. compliance_status enforcement — always set to "draft_for_human_review"
 *
 * What the normalizer does NOT fix (these remain hard validator failures):
 *   - Missing top-level keys (course, modules, lessons, checkpoints, exams)
 *   - Wrong module count
 *   - Wrong lesson count per module (< 4 or > 6)
 *   - Missing or misplaced checkpoints
 *   - Empty learning_points, scenarios, assessment questions
 *   - Exam question_count < 25
 *
 * The normalizer handles model inconsistency.
 * The validator handles model failure.
 * They are not the same thing.
 */

const STEP_TYPE_ALIASES: Record<string, string> = {
  lecture: 'lesson',
  video: 'lesson',
  reading: 'lesson',
  content: 'lesson',
  activity: 'lesson',
  module: 'lesson',
  quiz: 'checkpoint',
  test: 'checkpoint',
  assessment: 'checkpoint',
  final: 'exam',
  'final-exam': 'exam',
  certification: 'exam',
};

const VALID_STEP_TYPES = new Set(['lesson', 'checkpoint', 'exam']);

function sanitizeSlug(raw: string): string {
  return String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric except spaces and hyphens
    .replace(/[\s_]+/g, '-')         // spaces and underscores → hyphens
    .replace(/-{2,}/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens
}

function deduplicateSlugs(lessons: Record<string, unknown>[]): void {
  const seen = new Map<string, number>();
  for (const lesson of lessons) {
    const slug = lesson.slug as string;
    if (seen.has(slug)) {
      const count = seen.get(slug)! + 1;
      seen.set(slug, count);
      lesson.slug = `${slug}-${count}`;
    } else {
      seen.set(slug, 1);
    }
  }
}

function resequenceOrderIndex(lessons: Record<string, unknown>[]): void {
  // Sort by module_index first, then by existing order_index within module
  lessons.sort((a, b) => {
    const modDiff = (a.module_index as number) - (b.module_index as number);
    if (modDiff !== 0) return modDiff;
    // Within module: lessons first, then checkpoints, then exams
    const typeOrder = { lesson: 0, checkpoint: 1, exam: 2 };
    const typeDiff = (typeOrder[a.step_type as keyof typeof typeOrder] ?? 0) -
                     (typeOrder[b.step_type as keyof typeof typeOrder] ?? 0);
    if (typeDiff !== 0) return typeDiff;
    return (a.order_index as number) - (b.order_index as number);
  });
  lessons.forEach((l, i) => { l.order_index = i + 1; });
}

export interface NormalizationLog {
  step_type_coercions: string[];
  slug_sanitizations: string[];
  slug_deduplicates: string[];
  order_index_resequenced: boolean;
  compliance_status_enforced: boolean;
}

export function normalizeCourseOutline(
  raw: unknown
): { normalized: unknown; log: NormalizationLog } {
  const log: NormalizationLog = {
    step_type_coercions: [],
    slug_sanitizations: [],
    slug_deduplicates: [],
    order_index_resequenced: false,
    compliance_status_enforced: false,
  };

  // If not an object, return as-is — validator will reject it
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { normalized: raw, log };
  }

  const p = raw as Record<string, unknown>;

  // ── 1. Enforce compliance_status ─────────────────────────────────────────
  if (p.course && typeof p.course === 'object' && !Array.isArray(p.course)) {
    const course = p.course as Record<string, unknown>;
    if (course.compliance_status !== 'draft_for_human_review') {
      course.compliance_status = 'draft_for_human_review';
      log.compliance_status_enforced = true;
    }
  }

  // ── 2. Normalize lessons array ────────────────────────────────────────────
  if (!Array.isArray(p.lessons)) return { normalized: p, log };

  const lessons = p.lessons as Record<string, unknown>[];

  // 2a. Coerce step_type aliases
  for (const lesson of lessons) {
    const raw_type = String(lesson.step_type ?? '').toLowerCase().trim();
    if (!VALID_STEP_TYPES.has(raw_type)) {
      const coerced = STEP_TYPE_ALIASES[raw_type] ?? 'lesson';
      log.step_type_coercions.push(`"${lesson.slug}": "${raw_type}" → "${coerced}"`);
      lesson.step_type = coerced;
    }
  }

  // 2b. Sanitize slugs
  const slugsBefore = lessons.map(l => l.slug as string);
  for (const lesson of lessons) {
    const original = lesson.slug as string;
    const sanitized = sanitizeSlug(original);
    if (sanitized !== original) {
      log.slug_sanitizations.push(`"${original}" → "${sanitized}"`);
      lesson.slug = sanitized;
    }
  }

  // 2c. Deduplicate slugs
  const slugsBeforeDedup = lessons.map(l => l.slug as string);
  deduplicateSlugs(lessons);
  const slugsAfterDedup = lessons.map(l => l.slug as string);
  for (let i = 0; i < lessons.length; i++) {
    if (slugsBeforeDedup[i] !== slugsAfterDedup[i]) {
      log.slug_deduplicates.push(`"${slugsBeforeDedup[i]}" → "${slugsAfterDedup[i]}"`);
    }
  }

  // 2d. Resequence order_index
  const originalIndices = lessons.map(l => l.order_index);
  resequenceOrderIndex(lessons);
  const newIndices = lessons.map(l => l.order_index);
  if (JSON.stringify(originalIndices) !== JSON.stringify(newIndices)) {
    log.order_index_resequenced = true;
  }

  return { normalized: p, log };
}
