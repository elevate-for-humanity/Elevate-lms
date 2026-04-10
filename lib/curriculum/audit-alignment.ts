/**
 * lib/curriculum/audit-alignment.ts
 *
 * Content-level alignment audit for PRS (Peer Recovery Specialist) curriculum.
 *
 * The structural audit in lib/services/credential-alignment-audit.ts checks
 * whether rows exist. This audit checks whether the content of those rows
 * actually teaches what the exam tests.
 *
 * Four fixes over the structural audit:
 *
 *   Fix 1 — Phrase-level competency detection
 *     A lesson is not "covering" a competency just because it mentions a keyword.
 *     Detection requires a phrase cluster (2+ co-occurring terms from the
 *     competency's required phrase set) within a 50-word window.
 *
 *   Fix 2 — Concept stuffing penalty
 *     A lesson that claims more than MAX_COMPETENCIES_PER_LESSON competencies
 *     is penalized. Coverage credit is reduced proportionally. A lesson
 *     claiming 8 competencies covers none of them adequately.
 *
 *   Fix 3 — Exam relevance recognizes comparative reasoning
 *     Some PRS exam questions test the ability to distinguish between two
 *     similar concepts (e.g. peer support vs. therapy, boundaries vs. dual
 *     relationships). A lesson that only defines one side of a distinction
 *     fails exam relevance even if it mentions both terms.
 *
 *   Fix 4 — Per-competency gate evaluates every claimed competency
 *     The structural audit only checks the primary credential domain.
 *     This audit evaluates every competency the lesson claims to cover
 *     and fails the lesson if any claimed competency is not adequately taught.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fix 2: Maximum competencies a single lesson may claim before stuffing penalty */
const MAX_COMPETENCIES_PER_LESSON = 3;

/** Fix 1: Minimum co-occurring phrase hits required within a window */
const MIN_PHRASE_CLUSTER_HITS = 2;

/** Fix 1: Word window for phrase co-occurrence check */
const PHRASE_WINDOW_WORDS = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompetencyAuditResult {
  competencyKey: string;
  competencyName: string;
  /** Fix 1: phrase cluster found in lesson content */
  phraseClusterDetected: boolean;
  /** Fix 3: lesson teaches the distinction, not just one side */
  distinctionTaught: boolean;
  /** Fix 3: lesson avoids the known distractor pattern */
  distractorAvoided: boolean;
  /** Whether this competency passes all gates */
  passes: boolean;
  /** Specific failure reason if passes === false */
  failureReason: string | null;
}

export interface LessonAuditResult {
  lessonId: string;
  lessonTitle: string;
  programSlug: string;
  /** All competency keys this lesson claims to cover */
  claimedCompetencies: string[];
  /** Fix 2: stuffing penalty applied */
  stuffingPenalty: boolean;
  /** Fix 2: effective coverage credit (0–1) after stuffing penalty */
  coverageCredit: number;
  /** Fix 4: result for every claimed competency */
  competencyResults: CompetencyAuditResult[];
  /** Fix 4: lesson fails if ANY claimed competency fails */
  passes: boolean;
  failureReasons: string[];
  /** Exam profile was present and used in evaluation */
  examProfileUsed: boolean;
  /** Lesson was evaluated against its exam profile */
  examProfileAligned: boolean;
}

export interface ProgramAlignmentAudit {
  auditedAt: string;
  programSlug: string;
  totalLessons: number;
  passingLessons: number;
  failingLessons: number;
  stuffedLessons: number;
  missingExamProfiles: string[];
  lessons: LessonAuditResult[];
  /** True only when every lesson passes and no exam profiles are missing */
  isAligned: boolean;
}

// ─── Phrase cluster detection (Fix 1) ────────────────────────────────────────

/**
 * Returns true if at least MIN_PHRASE_CLUSTER_HITS phrases from the required
 * set co-occur within a PHRASE_WINDOW_WORDS sliding window in the text.
 *
 * This prevents single-keyword matches from counting as competency coverage.
 */
function detectPhraseCluster(text: string, requiredPhrases: string[]): boolean {
  if (!text || requiredPhrases.length === 0) return false;

  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/);

  // For each window position, count how many required phrases appear
  for (let i = 0; i <= words.length - PHRASE_WINDOW_WORDS; i++) {
    const window = words.slice(i, i + PHRASE_WINDOW_WORDS).join(' ');
    let hits = 0;
    for (const phrase of requiredPhrases) {
      if (window.includes(phrase.toLowerCase())) {
        hits++;
        if (hits >= MIN_PHRASE_CLUSTER_HITS) return true;
      }
    }
  }

  // Also check the full text for short documents
  if (words.length < PHRASE_WINDOW_WORDS) {
    let hits = 0;
    for (const phrase of requiredPhrases) {
      if (normalized.includes(phrase.toLowerCase())) hits++;
    }
    return hits >= MIN_PHRASE_CLUSTER_HITS;
  }

  return false;
}

// ─── Stuffing penalty (Fix 2) ────────────────────────────────────────────────

/**
 * Returns the coverage credit for a lesson based on how many competencies
 * it claims. Lessons claiming more than MAX_COMPETENCIES_PER_LESSON get
 * reduced credit — they cannot adequately teach all claimed competencies.
 *
 * Credit schedule:
 *   1–3 competencies: 1.0 (full credit)
 *   4 competencies:   0.75
 *   5 competencies:   0.5
 *   6+:               0.25 (stuffed — nearly worthless for any single competency)
 */
function computeCoverageCredit(claimedCount: number): number {
  if (claimedCount <= MAX_COMPETENCIES_PER_LESSON) return 1.0;
  if (claimedCount === 4) return 0.75;
  if (claimedCount === 5) return 0.5;
  return 0.25;
}

// ─── Distinction check (Fix 3) ───────────────────────────────────────────────

/**
 * Returns true if the lesson text teaches both sides of a distinction.
 *
 * A distinction is defined in the exam profile as two concept sets.
 * The lesson must contain phrase clusters for BOTH sides, not just one.
 *
 * Example: "peer support vs. therapy"
 *   Side A phrases: ["peer support", "lived experience", "peer specialist"]
 *   Side B phrases: ["therapy", "clinical", "licensed", "treatment"]
 *
 * A lesson that only defines peer support without contrasting it with
 * clinical therapy fails this check — the exam tests the distinction.
 */
function detectDistinctionTaught(
  text: string,
  sideAPhrases: string[],
  sideBPhrases: string[]
): boolean {
  const sideAPresent = detectPhraseCluster(text, sideAPhrases);
  const sideBPresent = detectPhraseCluster(text, sideBPhrases);
  return sideAPresent && sideBPresent;
}

/**
 * Returns true if the lesson does NOT reproduce the known distractor pattern.
 *
 * Distractor patterns are phrases that appear in wrong-answer choices on the
 * exam. If a lesson teaches the distractor as if it were correct, students
 * will be primed to choose the wrong answer.
 */
function detectDistractorAvoided(text: string, distractorPhrases: string[]): boolean {
  if (!distractorPhrases.length) return true;
  const normalized = text.toLowerCase();
  // Fail if the lesson presents the distractor without explicit correction
  for (const phrase of distractorPhrases) {
    const idx = normalized.indexOf(phrase.toLowerCase());
    if (idx === -1) continue;
    // Check if the surrounding context contains a correction signal
    const context = normalized.slice(Math.max(0, idx - 100), idx + 200);
    const correctionSignals = [
      'however', 'but', 'not', 'incorrect', 'wrong', 'mistake',
      'avoid', 'do not', "don't", 'rather than', 'instead',
      'common misconception', 'it is important to note',
    ];
    const hasCorrectionSignal = correctionSignals.some(s => context.includes(s));
    if (!hasCorrectionSignal) return false;
  }
  return true;
}

// ─── Per-competency gate (Fix 4) ─────────────────────────────────────────────

/**
 * Evaluates a single competency against lesson content and its exam profile.
 *
 * Fix 4: This is called for EVERY competency the lesson claims, not just
 * the primary domain. A lesson fails if any claimed competency fails.
 */
function evaluateCompetency(
  lessonText: string,
  competencyKey: string,
  competencyName: string,
  examProfile: {
    required_phrases: string[];
    distinction_side_a: string[];
    distinction_side_b: string[];
    distractor_phrases: string[];
    requires_distinction: boolean;
  } | null
): CompetencyAuditResult {
  if (!examProfile) {
    return {
      competencyKey,
      competencyName,
      phraseClusterDetected: false,
      distinctionTaught: false,
      distractorAvoided: false,
      passes: false,
      failureReason: `No exam profile found for competency "${competencyKey}" — cannot evaluate`,
    };
  }

  // Fix 1: phrase cluster
  const phraseClusterDetected = detectPhraseCluster(lessonText, examProfile.required_phrases);

  // Fix 3: distinction
  const distinctionTaught = examProfile.requires_distinction
    ? detectDistinctionTaught(lessonText, examProfile.distinction_side_a, examProfile.distinction_side_b)
    : true; // not all competencies require a distinction

  // Fix 3: distractor
  const distractorAvoided = detectDistractorAvoided(lessonText, examProfile.distractor_phrases);

  const passes = phraseClusterDetected && distinctionTaught && distractorAvoided;

  let failureReason: string | null = null;
  if (!passes) {
    const reasons: string[] = [];
    if (!phraseClusterDetected) {
      reasons.push(`phrase cluster not detected (need ${MIN_PHRASE_CLUSTER_HITS}+ co-occurring phrases from: ${examProfile.required_phrases.slice(0, 3).join(', ')})`);
    }
    if (!distinctionTaught) {
      reasons.push(`distinction not taught — lesson must contrast both sides (${examProfile.distinction_side_a[0]} vs ${examProfile.distinction_side_b[0]})`);
    }
    if (!distractorAvoided) {
      reasons.push(`distractor pattern reproduced without correction (${examProfile.distractor_phrases[0]})`);
    }
    failureReason = reasons.join('; ');
  }

  return {
    competencyKey,
    competencyName,
    phraseClusterDetected,
    distinctionTaught,
    distractorAvoided,
    passes,
    failureReason,
  };
}

// ─── Main audit function ──────────────────────────────────────────────────────

/**
 * Runs the content-level alignment audit for a program.
 *
 * Requires:
 *   - curriculum_lessons rows with content_body and competency_keys[]
 *   - competency_exam_profiles rows for each competency key
 *
 * Returns a full audit with per-lesson, per-competency results.
 */
export async function runContentAlignmentAudit(
  programSlug: string
): Promise<ProgramAlignmentAudit> {
  const db = await getAdminClient();
  const auditedAt = new Date().toISOString();

  const empty: ProgramAlignmentAudit = {
    auditedAt,
    programSlug,
    totalLessons: 0,
    passingLessons: 0,
    failingLessons: 0,
    stuffedLessons: 0,
    missingExamProfiles: [],
    lessons: [],
    isAligned: false,
  };

  if (!db) {
    logger.error('audit-alignment: database unavailable');
    return empty;
  }

  // Load program
  const { data: program } = await db
    .from('programs')
    .select('id, slug, name')
    .eq('slug', programSlug)
    .single();

  if (!program) {
    logger.error('audit-alignment: program not found', { programSlug });
    return empty;
  }

  // Load lessons with content and claimed competencies
  // script_text is the generated lesson body (existing column)
  // competency_keys and lesson_plan_id are added by the Phase 2 migration
  const { data: lessons, error: lessonErr } = await db
    .from('curriculum_lessons')
    .select('id, lesson_title, script_text, competency_keys, lesson_plan_id')
    .eq('program_id', program.id)
    .eq('status', 'published');

  if (lessonErr) {
    logger.error('audit-alignment: failed to load lessons', { lessonErr });
    return empty;
  }

  if (!lessons || lessons.length === 0) {
    return { ...empty, isAligned: false };
  }

  // Load all exam profiles for this program's competencies
  const allCompetencyKeys = [
    ...new Set(lessons.flatMap(l => (l.competency_keys as string[]) ?? [])),
  ];

  const { data: examProfiles } = await db
    .from('competency_exam_profiles')
    .select(
      'competency_key, competency_name, required_phrases, distinction_side_a, ' +
      'distinction_side_b, distractor_phrases, requires_distinction'
    )
    .in('competency_key', allCompetencyKeys.length ? allCompetencyKeys : ['__none__']);

  const profileByKey = new Map<string, typeof examProfiles extends (infer T)[] | null ? T : never>();
  for (const p of examProfiles ?? []) {
    profileByKey.set(p.competency_key, p);
  }

  // Identify missing exam profiles
  const missingExamProfiles = allCompetencyKeys.filter(k => !profileByKey.has(k));

  // Audit each lesson
  const lessonResults: LessonAuditResult[] = [];

  for (const lesson of lessons) {
    const claimedCompetencies: string[] = (lesson.competency_keys as string[]) ?? [];
    const lessonText = (lesson.script_text as string) ?? '';

    // Fix 2: stuffing penalty
    const stuffingPenalty = claimedCompetencies.length > MAX_COMPETENCIES_PER_LESSON;
    const coverageCredit = computeCoverageCredit(claimedCompetencies.length);

    // Fix 4: evaluate EVERY claimed competency
    const competencyResults: CompetencyAuditResult[] = claimedCompetencies.map(key => {
      const profile = profileByKey.get(key) ?? null;
      const name = profile?.competency_name ?? key;
      return evaluateCompetency(lessonText, key, name, profile);
    });

    const failureReasons: string[] = [];

    if (stuffingPenalty) {
      failureReasons.push(
        `Concept stuffing: lesson claims ${claimedCompetencies.length} competencies ` +
        `(max ${MAX_COMPETENCIES_PER_LESSON}), coverage credit reduced to ${coverageCredit}`
      );
    }

    // Fix 4: fail if ANY competency fails
    for (const cr of competencyResults) {
      if (!cr.passes && cr.failureReason) {
        failureReasons.push(`[${cr.competencyKey}] ${cr.failureReason}`);
      }
    }

    const examProfileUsed = competencyResults.some(cr => cr.phraseClusterDetected || cr.distinctionTaught);
    const examProfileAligned = competencyResults.every(cr => cr.passes);

    // A stuffed lesson fails even if individual competency checks pass
    const passes = failureReasons.length === 0 && !stuffingPenalty;

    lessonResults.push({
      lessonId: lesson.id,
      lessonTitle: lesson.lesson_title,
      programSlug,
      claimedCompetencies,
      stuffingPenalty,
      coverageCredit,
      competencyResults,
      passes,
      failureReasons,
      examProfileUsed,
      examProfileAligned,
    });
  }

  const passingLessons = lessonResults.filter(l => l.passes).length;
  const failingLessons = lessonResults.filter(l => !l.passes).length;
  const stuffedLessons = lessonResults.filter(l => l.stuffingPenalty).length;

  // Aligned only when: all lessons pass, no missing exam profiles
  const isAligned =
    failingLessons === 0 &&
    stuffedLessons === 0 &&
    missingExamProfiles.length === 0;

  return {
    auditedAt,
    programSlug,
    totalLessons: lessons.length,
    passingLessons,
    failingLessons,
    stuffedLessons,
    missingExamProfiles,
    lessons: lessonResults,
    isAligned,
  };
}

// ─── Report formatter ─────────────────────────────────────────────────────────

export function formatContentAuditReport(audit: ProgramAlignmentAudit): string {
  const lines: string[] = [
    `Content Alignment Audit — ${audit.programSlug}`,
    `Audited at: ${audit.auditedAt}`,
    '─'.repeat(60),
    `Total lessons:   ${audit.totalLessons}`,
    `Passing:         ${audit.passingLessons}`,
    `Failing:         ${audit.failingLessons}`,
    `Stuffed:         ${audit.stuffedLessons}`,
    `Missing profiles: ${audit.missingExamProfiles.length}`,
    `Aligned:         ${audit.isAligned ? 'YES' : 'NO'}`,
    '',
  ];

  if (audit.missingExamProfiles.length) {
    lines.push('Missing exam profiles (generator will fail loudly for these):');
    for (const k of audit.missingExamProfiles) {
      lines.push(`  ✗ ${k}`);
    }
    lines.push('');
  }

  for (const lesson of audit.lessons) {
    const status = lesson.passes ? '✅' : '❌';
    lines.push(`${status} ${lesson.lessonTitle}`);
    lines.push(`   Competencies claimed: ${lesson.claimedCompetencies.join(', ') || 'none'}`);

    if (lesson.stuffingPenalty) {
      lines.push(`   ⚠ STUFFING: ${lesson.claimedCompetencies.length} competencies claimed, credit = ${lesson.coverageCredit}`);
    }

    for (const cr of lesson.competencyResults) {
      const cStatus = cr.passes ? '✓' : '✗';
      lines.push(`   ${cStatus} [${cr.competencyKey}] ${cr.competencyName}`);
      if (!cr.passes && cr.failureReason) {
        lines.push(`       → ${cr.failureReason}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
