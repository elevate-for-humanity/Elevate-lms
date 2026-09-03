/**
 * lib/video/pexels-matcher.ts
 *
 * Script-aware Pexels video matcher for course lesson media.
 *
 * For each lesson it:
 *   1. Builds a ranked query from lesson title + objective + content keywords
 *   2. Searches Pexels Videos API with multiple query variations
 *   3. Scores every candidate on keyword density, duration fit, orientation, resolution
 *   4. Auto-approves clips that hit the confidence threshold
 *   5. Optionally writes approved video_url back to course_lessons in DB
 *
 * Auto-approval threshold: 0.70 (70% confidence) — tune via AUTO_APPROVE_THRESHOLD.
 * A clip that does not hit the threshold is flagged `needsReview: true` but still
 * returned so the caller can surface it in the admin dashboard.
 */

import { logger } from '@/lib/logger';

// ── Config ────────────────────────────────────────────────────────────────────

const PEXELS_VIDEOS_API = 'https://api.pexels.com/videos/search';
const AUTO_APPROVE_THRESHOLD = 0.70;

// Target clip duration range in seconds (covers typical lesson segments)
const IDEAL_MIN_DURATION = 20;
const IDEAL_MAX_DURATION = 120;

// Stop words stripped before scoring
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'have', 'he', 'her', 'his', 'how', 'i', 'in', 'is', 'it', 'its',
  'of', 'on', 'or', 'our', 'that', 'the', 'their', 'there', 'they', 'this',
  'to', 'was', 'we', 'what', 'when', 'which', 'who', 'will', 'with', 'you',
]);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LessonInput {
  id?: string;
  slug: string;
  title: string;
  objective?: string | null;
  content?: string | null;
  script?: string | null;
  programSlug?: string;
}

export interface PexelsClip {
  pexelsId: number;
  pexelsUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
  quality: 'hd' | 'sd' | 'mobile' | string;
  photographer: string;
  searchQuery: string;
}

export interface MatchResult {
  lesson: LessonInput;
  clip: PexelsClip | null;
  confidence: number;         // 0.0 – 1.0
  autoApproved: boolean;
  needsReview: boolean;
  reason: string;             // Human-readable explanation
  appliedToDb: boolean;       // true if video_url was written to course_lessons
  error?: string;
}

// ── Keyword extraction ─────────────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')          // strip HTML
    .replace(/[^a-z0-9\s-]/g, ' ')    // strip punctuation
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 20);                      // top 20 unique-ish terms
}

function buildQueries(lesson: LessonInput, programSlug?: string): string[] {
  const titleWords = extractKeywords(lesson.title);
  const objectiveWords = lesson.objective ? extractKeywords(lesson.objective) : [];
  const scriptWords = lesson.script ? extractKeywords(lesson.script).slice(0, 5) : [];
  const contentWords = lesson.content ? extractKeywords(lesson.content).slice(0, 5) : [];

  // Program context words (e.g. "barber", "welding", "medical")
  const programWord = programSlug
    ? programSlug.split('-')[0]   // "barber-apprenticeship" → "barber"
    : '';

  // Build 3 ranked queries: specific → mid → broad
  const specific = [programWord, ...titleWords.slice(0, 3)].filter(Boolean).join(' ');
  const mid = [programWord, titleWords[0], objectiveWords[0]].filter(Boolean).join(' ');
  const broad = [programWord, scriptWords[0] || contentWords[0] || titleWords[0]]
    .filter(Boolean)
    .join(' ');

  return [...new Set([specific, mid, broad].filter(Boolean))];
}

// ── Scoring ───────────────────────────────────────────────────────────────────

interface RawPexelsVideo {
  id: number;
  url: string;
  duration: number;
  image: string;
  user: { name: string };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number | null;
    height: number | null;
    link: string;
  }>;
}

function scoreCandidates(
  candidates: Array<{ video: RawPexelsVideo; query: string }>,
  keywords: string[],
): { video: RawPexelsVideo; score: number; query: string } | null {
  if (!candidates.length) return null;

  let best: { video: RawPexelsVideo; score: number; query: string } | null = null;

  for (const { video, query } of candidates) {
    let score = 0;

    // 1. Keyword density: how many lesson keywords appear in the Pexels URL slug
    const urlText = video.url.toLowerCase();
    const keywordHits = keywords.filter((kw) => urlText.includes(kw)).length;
    const keywordScore = Math.min(keywordHits / Math.max(keywords.length, 1), 1);
    score += keywordScore * 0.50;  // 50% weight

    // 2. Query match (first query is most specific — reward it)
    const queryIndex = candidates.findIndex((c) => c.query === query);
    const queryScore = queryIndex === 0 ? 1.0 : queryIndex === 1 ? 0.6 : 0.3;
    score += queryScore * 0.20;    // 20% weight

    // 3. Duration fit
    const dur = video.duration;
    let durationScore = 0;
    if (dur >= IDEAL_MIN_DURATION && dur <= IDEAL_MAX_DURATION) {
      durationScore = 1.0;
    } else if (dur < IDEAL_MIN_DURATION) {
      durationScore = dur / IDEAL_MIN_DURATION;
    } else {
      durationScore = IDEAL_MAX_DURATION / dur;
    }
    score += durationScore * 0.15; // 15% weight

    // 4. Resolution: HD preferred
    const hasHd = video.video_files.some(
      (f) => f.quality === 'hd' && (f.width ?? 0) >= 1280,
    );
    score += (hasHd ? 1.0 : 0.4) * 0.15; // 15% weight

    if (!best || score > best.score) {
      best = { video, score, query };
    }
  }

  return best;
}

// ── Pexels fetch ──────────────────────────────────────────────────────────────

async function fetchPexelsVideos(
  query: string,
  apiKey: string,
  perPage = 5,
): Promise<RawPexelsVideo[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: 'landscape',
  });

  const res = await fetch(`${PEXELS_VIDEOS_API}?${params}`, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    logger.warn('[pexels-matcher] API error', { status: res.status, query });
    return [];
  }

  const data = (await res.json()) as { videos?: RawPexelsVideo[] };
  return data.videos ?? [];
}

function getBestFile(video: RawPexelsVideo): {
  url: string;
  quality: string;
  width: number;
  height: number;
} {
  const ordered = [...video.video_files]
    .filter((f) => f.link && f.width && f.height)
    .sort((a, b) => {
      const qOrder: Record<string, number> = { hd: 3, sd: 2, mobile: 1 };
      const qA = qOrder[a.quality] ?? 0;
      const qB = qOrder[b.quality] ?? 0;
      if (qB !== qA) return qB - qA;
      return (b.width ?? 0) - (a.width ?? 0);
    });

  if (!ordered.length) return { url: '', quality: 'unknown', width: 0, height: 0 };
  const best = ordered[0];
  return {
    url: best.link,
    quality: best.quality,
    width: best.width ?? 0,
    height: best.height ?? 0,
  };
}

// ── Main matcher ──────────────────────────────────────────────────────────────

export interface PexelsMatchOptions {
  apiKey: string;
  /** Supabase admin client — required if applyToDb is true */
  supabase?: any;
  /** Write approved video_url to course_lessons.video_url */
  applyToDb?: boolean;
  /** Override auto-approval confidence threshold (default: 0.70) */
  threshold?: number;
  /** Delay between lessons in ms to avoid rate limiting */
  delayMs?: number;
  /** If true, reject clips outside the target duration band */
  strictDuration?: boolean;
}

/**
 * Match a single lesson to a Pexels video.
 */
export async function matchLessonToVideo(
  lesson: LessonInput,
  options: PexelsMatchOptions,
): Promise<MatchResult> {
  const {
    apiKey,
    supabase,
    applyToDb = false,
    threshold = AUTO_APPROVE_THRESHOLD,
    strictDuration = false,
  } = options;

  const keywords = [
    ...extractKeywords(lesson.title),
    ...(lesson.objective ? extractKeywords(lesson.objective) : []),
    ...(lesson.script ? extractKeywords(lesson.script).slice(0, 10) : []),
  ];

  const queries = buildQueries(lesson, lesson.programSlug);
  const allCandidates: Array<{ video: RawPexelsVideo; query: string }> = [];

  for (const query of queries) {
    const videos = await fetchPexelsVideos(query, apiKey, 5);
    for (const v of videos) {
      allCandidates.push({ video: v, query });
    }
    // Small delay per query to be polite to the API
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!allCandidates.length) {
    return {
      lesson,
      clip: null,
      confidence: 0,
      autoApproved: false,
      needsReview: true,
      reason: 'No Pexels results returned for any query variant',
      appliedToDb: false,
    };
  }

  const best = scoreCandidates(allCandidates, keywords);
  if (!best) {
    return {
      lesson,
      clip: null,
      confidence: 0,
      autoApproved: false,
      needsReview: true,
      reason: 'Scoring produced no winner',
      appliedToDb: false,
    };
  }

  const file = getBestFile(best.video);
  const clip: PexelsClip = {
    pexelsId: best.video.id,
    pexelsUrl: best.video.url,
    videoUrl: file.url,
    thumbnailUrl: best.video.image,
    durationSeconds: best.video.duration,
    width: file.width,
    height: file.height,
    quality: file.quality,
    photographer: best.video.user?.name ?? '',
    searchQuery: best.query,
  };

  const autoApproved = best.score >= threshold;
  const durationIsIdeal =
    clip.durationSeconds >= IDEAL_MIN_DURATION && clip.durationSeconds <= IDEAL_MAX_DURATION;
  const needsReview = !autoApproved || (strictDuration && !durationIsIdeal);
  const approvedWithDuration = autoApproved && (!strictDuration || durationIsIdeal);

  let appliedToDb = false;

  if (approvedWithDuration && applyToDb && supabase && lesson.id && file.url) {
    try {
      const { error } = await supabase
        .from('course_lessons')
        .update({
          video_url: file.url,
          video_status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lesson.id);

      if (error) {
        logger.warn('[pexels-matcher] DB update failed', { id: lesson.id, error });
      } else {
        appliedToDb = true;
      }
    } catch (err) {
      logger.warn('[pexels-matcher] DB update threw', { id: lesson.id, err });
    }
  }

  return {
    lesson,
    clip,
    confidence: best.score,
    autoApproved: approvedWithDuration,
    needsReview,
    reason: approvedWithDuration
      ? `Auto-approved (confidence ${(best.score * 100).toFixed(0)}%) via query "${best.query}"`
      : strictDuration && !durationIsIdeal
        ? `Duration out of strict range (${clip.durationSeconds}s not in ${IDEAL_MIN_DURATION}-${IDEAL_MAX_DURATION}s)`
        : `Below threshold (${(best.score * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}%) — needs review`,
    appliedToDb,
  };
}

/**
 * Match all lessons in a list to Pexels videos.
 * Returns results in the same order as input.
 */
export async function matchAllLessonsToVideos(
  lessons: LessonInput[],
  options: PexelsMatchOptions,
): Promise<MatchResult[]> {
  const delayMs = options.delayMs ?? 500;
  const results: MatchResult[] = [];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    logger.info(`[pexels-matcher] ${i + 1}/${lessons.length} "${lesson.title}"`);

    try {
      const result = await matchLessonToVideo(lesson, options);
      results.push(result);
    } catch (err: any) {
      results.push({
        lesson,
        clip: null,
        confidence: 0,
        autoApproved: false,
        needsReview: true,
        reason: `Error: ${err?.message ?? 'unknown'}`,
        appliedToDb: false,
        error: err?.message,
      });
    }

    if (i < lessons.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Summarise a batch of match results into a dashboard-friendly object.
 */
export function summariseMatchResults(results: MatchResult[]) {
  const total = results.length;
  const autoApproved = results.filter((r) => r.autoApproved).length;
  const appliedToDb = results.filter((r) => r.appliedToDb).length;
  const needsReview = results.filter((r) => r.needsReview).length;
  const failed = results.filter((r) => !r.clip).length;
  const avgConfidence = total
    ? results.reduce((s, r) => s + r.confidence, 0) / total
    : 0;

  return {
    total,
    autoApproved,
    appliedToDb,
    needsReview,
    failed,
    avgConfidence: parseFloat(avgConfidence.toFixed(3)),
    successRate: total ? parseFloat(((autoApproved / total) * 100).toFixed(1)) : 0,
  };
}
