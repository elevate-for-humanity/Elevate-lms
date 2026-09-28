import type { UltimateRenderPort } from '../core/ports';
import type { MediaDirectorInput } from '@/lib/video/media-director';

type RecordLike = Record<string, any>;

type VisualCandidate = {
  url: string;
  kind: 'image' | 'video';
  provider: string;
  providerItemId?: string;
  licenseEvidenceUrl?: string;
};

function record(value: unknown): RecordLike {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RecordLike)
    : {};
}

function firstRecord(value: unknown): RecordLike {
  return Array.isArray(value) ? record(value[0]) : record(value);
}

function publicCourseMediaUrl(value: unknown): string | null {
  const path = typeof value === 'string' ? value.trim() : '';
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return base
    ? `${base}/storage/v1/object/public/course-videos/${path.replace(/^\/+/, '')}`
    : null;
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

function visualCandidates(input: any): VisualCandidate[] {
  const assignment = visualAssignment(input);
  const lessonId = String(input.lessonId ?? '');
  const candidates: VisualCandidate[] = [];

  for (const asset of Array.isArray(assignment.readyAssets) ? assignment.readyAssets : []) {
    const row = record(asset);
    if (row.lesson_id && String(row.lesson_id) !== lessonId) continue;
    const url = publicCourseMediaUrl(row.public_url ?? row.storage_path);
    const kind = url ? mediaKind(url, row.mime_type) : null;
    if (!url || !kind) continue;
    candidates.push({
      url,
      kind,
      provider: row.entitlement_id ? 'envato' : 'elevate-owned',
      providerItemId: row.entitlement_id ? String(row.entitlement_id) : undefined,
    });
  }

  for (const suggestion of Array.isArray(assignment.licensedSuggestions)
    ? assignment.licensedSuggestions
    : []) {
    const match = record(suggestion);
    if (String(match.lesson_id ?? '') !== lessonId) continue;
    if (!['approved', 'attached'].includes(String(match.status ?? ''))) continue;
    const entitlement = firstRecord(match.licensed_media_entitlements);
    const metadata = record(entitlement.metadata);
    const possibleUrls = [
      metadata.assetUrl,
      metadata.asset_url,
      metadata.storage_path,
      entitlement.thumbnail_url,
    ];
    for (const value of possibleUrls) {
      const url = publicCourseMediaUrl(value);
      const kind = url ? mediaKind(url, metadata.mime_type) : null;
      if (!url || !kind) continue;
      candidates.push({
        url,
        kind,
        provider: String(entitlement.provider ?? 'envato'),
        providerItemId: entitlement.provider_item_id
          ? String(entitlement.provider_item_id)
          : undefined,
        licenseEvidenceUrl: entitlement.item_url ? String(entitlement.item_url) : undefined,
      });
      break;
    }
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
  return board;
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
  const script = scenes.map((scene: RecordLike) => scene.dialogue).filter(Boolean).join('\n\n');
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
  async render(input: any) {
    const prepared = prepareUltimateStoryboardInput(input);
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
      ultimateStrict: false,
    });
    if (!result.success || !result.videoUrl) {
      throw new Error(`ULTIMATE_VIDEO_RENDER_FAILED:${result.error ?? 'missing video URL'}`);
    }
    return {
      ...result,
      captionsUrl: result.sceneData?.captionUrl,
      transcriptUrl: result.sceneData?.transcriptUrl,
      distinctShots: result.sceneData?.scenes.length ?? storyboard.scenes.length,
      licensedFirst: true,
    };
  }
}
