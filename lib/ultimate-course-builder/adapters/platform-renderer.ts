import type { UltimateRenderPort } from '../core/ports';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MIN_LESSON_VIDEO_SCENES, type MediaDirectorInput } from '@/lib/video/media-director';

type RecordLike = Record<string, any>;

type VisualCandidate = {
  url: string;
  kind: 'image' | 'video';
  provider: string;
  providerItemId?: string;
  licenseEvidenceUrl?: string;
};

function record(value: unknown): RecordLike {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordLike) : {};
}

function publicCourseMediaUrl(value: unknown): string | null {
  const path = typeof value === 'string' ? value.trim() : '';
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return base ? `${base}/storage/v1/object/public/course-videos/${path.replace(/^\/+/, '')}` : null;
}

function mediaKind(url: string, mimeType?: unknown): VisualCandidate['kind'] | null {
  const mime = typeof mimeType === 'string' ? mimeType.toLowerCase() : '';
  if (mime.startsWith('video/') || /\.(mp4|webm)(?:[?#]|$)/i.test(url)) return 'video';
  if (mime.startsWith('image/') || /\.(jpe?g|png|webp)(?:[?#]|$)/i.test(url)) return 'image';
  return null;
}

function visualAssignment(input: any): RecordLike {
  return record(
    input.artifacts?.visual_assignment?.media ??
      input.artifacts?.scene_construction?.scenes?.media?.media ??
      input.artifacts?.scene_construction?.scenes?.media ??
      input.media,
  );
}

/** Checkpointed visual assignments contain short-lived signed URLs. Renew them
 * from the licensed storage path at the point of rendering, including resumes
 * that skip visual_assignment entirely. Never fall back to an expired URL. */
export async function refreshLicensedVisualUrls(input: any, db: SupabaseClient): Promise<any> {
  const assignment = visualAssignment(input);
  if (!Array.isArray(assignment.readyAssets)) return input;
  const readyAssets = await Promise.all(assignment.readyAssets.map(async (value: unknown) => {
    const asset = record(value);
    if (!asset.storage_path) {
      if (typeof asset.public_url === 'string' && asset.public_url.includes('/object/sign/')) {
        throw new Error(`ULTIMATE_LICENSED_VISUAL_STORAGE_PATH_REQUIRED:${String(asset.id ?? 'unknown')}`);
      }
      return asset;
    }
    const { data, error } = await db.storage
      .from('course_videos')
      .createSignedUrl(String(asset.storage_path), 60 * 60);
    if (error || !data?.signedUrl) {
      throw new Error(`ULTIMATE_LICENSED_VISUAL_URL_REFRESH_FAILED:${String(asset.id ?? asset.storage_path)}`);
    }
    return { ...asset, public_url: data.signedUrl };
  }));
  return {
    ...input,
    artifacts: {
      ...input.artifacts,
      visual_assignment: {
        ...input.artifacts?.visual_assignment,
        media: { ...assignment, readyAssets },
      },
    },
  };
}

function visualCandidates(input: any): VisualCandidate[] {
  const assignment = visualAssignment(input);
  const lessonId = String(input.lessonId ?? '');
  const candidates: VisualCandidate[] = [];

  for (const asset of Array.isArray(assignment.readyAssets) ? assignment.readyAssets : []) {
    const row = record(asset);
    if (row.lesson_id && String(row.lesson_id) !== lessonId) continue;
    const url = publicCourseMediaUrl(row.public_url);
    const kind = url ? mediaKind(url, row.mime_type) : null;
    if (!url || !kind || !row.entitlement_id) continue;
    candidates.push({
      url,
      kind,
      provider: String(row.provider ?? 'envato'),
      providerItemId: row.provider_item_id ? String(row.provider_item_id) : undefined,
      licenseEvidenceUrl: row.license_evidence_url ? String(row.license_evidence_url) : undefined,
    });
  }

  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      if (seen.has(candidate.url)) return false;
      seen.add(candidate.url);
      return true;
    })
    .sort((left, right) => Number(right.kind === 'image') - Number(left.kind === 'image'));
}

function rawStoryboard(input: any): RecordLike {
  const raw =
    input.artifacts?.storyboard?.storyboard ??
    input.artifacts?.synchronization?.timeline?.scenes?.storyboard?.storyboard ??
    input.artifacts?.scene_construction?.scenes?.storyboard?.storyboard ??
    input.storyboard;
  const board = Array.isArray(raw) ? { scenes: raw } : record(raw);
  if (!Array.isArray(board.scenes) || board.scenes.length < 2) {
    throw new Error('ULTIMATE_RENDER_MULTISCENE_STORYBOARD_REQUIRED');
  }
  if (board.scenes.length < MIN_LESSON_VIDEO_SCENES) {
    throw new Error(
      `ULTIMATE_RENDER_SCENE_COUNT_REQUIRED:${board.scenes.length}:${MIN_LESSON_VIDEO_SCENES}`,
    );
  }
  return board;
}

function resolvedVisualUrl(value: unknown): string | null {
  const scene = record(value);
  for (const candidate of [scene.sourceVideoUrl, scene.referenceImageUrl]) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue;
    try {
      const url = new URL(candidate.trim());
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
    } catch {
      // Keep checking the remaining resolved visual fields.
    }
  }
  return null;
}

export function requireResolvedVisualEvidence(sceneData: unknown): {
  visualAssetCount: number;
  distinctShots: number;
} {
  const scenes = Array.isArray(record(sceneData).scenes) ? record(sceneData).scenes : [];
  if (scenes.length < MIN_LESSON_VIDEO_SCENES) {
    throw new Error(
      `ULTIMATE_RENDER_SCENE_COUNT_REQUIRED:${scenes.length}:${MIN_LESSON_VIDEO_SCENES}`,
    );
  }
  const urls = scenes.map(resolvedVisualUrl);
  const missing = urls
    .map((url, index) => (url ? null : index + 1))
    .filter((index): index is number => index !== null);
  if (missing.length) {
    throw new Error(`ULTIMATE_RENDER_VISUAL_ASSETS_MISSING:${missing.join(',')}`);
  }
  const distinctShots = new Set(urls).size;
  if (distinctShots < MIN_LESSON_VIDEO_SCENES) {
    throw new Error(
      `ULTIMATE_RENDER_DISTINCT_VISUALS_REQUIRED:${distinctShots}:${MIN_LESSON_VIDEO_SCENES}`,
    );
  }
  return { visualAssetCount: urls.length, distinctShots };
}

function sceneType(index: number, total: number) {
  if (index === 0) return 'problem_hook';
  if (index === total - 1) return 'memory_recap';
  if (index === 1) return 'mental_model';
  if (index === 2) return 'worked_example';
  return 'field_scenario';
}

export function prepareUltimateStoryboardInput(input: any): MediaDirectorInput {
  const board = rawStoryboard(input);
  const candidates = visualCandidates(input);
  if (candidates.length < board.scenes.length) {
    throw new Error(`ULTIMATE_ENVATO_VISUALS_REQUIRED:${candidates.length}:${board.scenes.length}`);
  }
  const scenes = board.scenes.map((value: unknown, index: number) => {
    const scene = record(value);
    const teachingPoint = String(
      scene.teachingPoint ?? scene.dialogue ?? scene.narration ?? scene.action ?? '',
    ).trim();
    const visualRequirement = String(
      scene.visualRequirement ??
        scene.requiredVisualEvidence ??
        scene.required_visual_evidence ??
        teachingPoint,
    ).trim();
    const candidate = candidates[index];
    return {
      ...scene,
      subject: String(scene.title ?? scene.subject ?? input.courseTitle ?? 'Lesson'),
      action: teachingPoint || visualRequirement,
      dialogue: teachingPoint || visualRequirement,
      required_visual_evidence: visualRequirement || teachingPoint,
      scene_type: scene.scene_type ?? scene.sceneType ?? sceneType(index, board.scenes.length),
      media_source: candidate
        ? 'elevate-owned'
        : ['worked_example', 'memory_recap'].includes(
              String(scene.scene_type ?? scene.sceneType ?? sceneType(index, board.scenes.length)),
            )
          ? 'elevate-motion'
          : 'pexels',
      review_status: candidate ? 'approved' : 'draft',
      ...(candidate?.kind === 'video' ? { source_video_url: candidate.url } : {}),
      ...(candidate?.kind === 'image' ? { reference_image_url: candidate.url } : {}),
      ...(candidate
        ? {
            resolved_provider: candidate.provider,
            resolved_model: candidate.kind === 'video' ? 'licensed-video' : 'licensed-image',
            source_provider_item_id: candidate.providerItemId,
            source_license_evidence_url: candidate.licenseEvidenceUrl,
          }
        : {}),
    };
  });
  const script = scenes
    .map((scene: RecordLike) => scene.dialogue)
    .filter(Boolean)
    .join('\n\n');
  return {
    title: String(board.title ?? input.courseTitle ?? input.lessonId ?? 'Lesson'),
    objective: String(board.objective ?? scenes[0]?.action ?? input.courseTitle ?? 'Lesson'),
    script,
    defaultDurationSeconds: 8,
    sceneData: {
      ...board,
      version: '1.0',
      width: Number(board.width ?? 1920),
      height: Number(board.height ?? 1080),
      fps: Number(board.fps ?? 30),
      scenes,
    },
  };
}

function instructorFor(courseTitle: string): string {
  if (/cosmetology|beauty/i.test(courseTitle)) return 'avery-brooks';
  if (/barber/i.test(courseTitle)) return 'james-williams';
  return 'marcus-johnson';
}

export class UltimatePlatformRenderer implements UltimateRenderPort {
  constructor(private db?: SupabaseClient) {}

  async render(input: any) {
    const prepared = prepareUltimateStoryboardInput(
      this.db ? await refreshLicensedVisualUrls(input, this.db) : input,
    );
    const [{ directMedia }, { renderStoryboardVideo }] = await Promise.all([
      import('@/lib/video/media-director'),
      import('@/lib/video/remotion-render'),
    ]);
    const storyboard = directMedia(prepared);
    const courseTitle = String(input.courseTitle ?? prepared.title);
    const result = await renderStoryboardVideo({
      lessonId: String(input.lessonId),
      courseTitle,
      storyboard,
      instructorId: instructorFor(courseTitle),
      ultimateStrict: true,
      requireVisualEvidence: true,
    });
    if (!result.success || !result.videoUrl) {
      throw new Error(`ULTIMATE_VIDEO_RENDER_FAILED:${result.error ?? 'missing video URL'}`);
    }
    const visualEvidence = requireResolvedVisualEvidence(result.sceneData);
    return {
      ...result,
      layoutVersion: 2,
      captionsUrl: result.sceneData?.captionUrl,
      transcriptUrl: result.sceneData?.transcriptUrl,
      ...visualEvidence,
      licensedFirst: true,
    };
  }
}
