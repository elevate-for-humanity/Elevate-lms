import type { UltimateRenderPort } from '../core/ports';
import type { SupabaseClient } from '@supabase/supabase-js';
import { prepareTeachingPhotos } from './teaching-photos';
import { materializeInstructionalVisualAssets } from './instructional-visual-assets';
import { MIN_LESSON_VIDEO_SCENES, type MediaDirectorInput } from '@/lib/video/media-director';

type RecordLike = Record<string, any>;

type VisualCandidate = {
  ownedInstructional?: boolean;
  assetId?: string;
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
  const readyAssets = await Promise.all(
    assignment.readyAssets.map(async (value: unknown) => {
      const asset = record(value);
      if (!asset.storage_path) {
        if (typeof asset.public_url === 'string' && asset.public_url.includes('/object/sign/')) {
          throw new Error(
            `ULTIMATE_LICENSED_VISUAL_STORAGE_PATH_REQUIRED:${String(asset.id ?? 'unknown')}`,
          );
        }
        return asset;
      }
      const { data, error } = await db.storage
        .from('course_videos')
        .createSignedUrl(String(asset.storage_path), 60 * 60);
      if (error || !data?.signedUrl) {
        throw new Error(
          `ULTIMATE_LICENSED_VISUAL_URL_REFRESH_FAILED:${String(asset.id ?? asset.storage_path)}`,
        );
      }
      return { ...asset, public_url: data.signedUrl };
    }),
  );
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
  const candidates: VisualCandidate[] = [];

  for (const asset of Array.isArray(assignment.readyAssets) ? assignment.readyAssets : []) {
    const row = record(asset);
    const url = publicCourseMediaUrl(row.public_url);
    const kind = url ? mediaKind(url, row.mime_type) : null;
    const ownedAssignment = assignment.assignments?.find(
      (a: any) =>
        a.sceneId === row.instructional_scene_id &&
        a.assetId === row.id &&
        a.assetId === `instructional:${a.sceneId}` &&
        a.assignmentMethod === 'instructional-render' &&
        a.generatedInstructionalVisual === true,
    );
    if (
      !url ||
      !kind ||
      (!row.entitlement_id &&
        !(
          row.owned_instructional_visual === true &&
          row.provider === 'remotion' &&
          ownedAssignment
        ))
    )
      continue;
    candidates.push({
      ownedInstructional: row.owned_instructional_visual === true && Boolean(ownedAssignment),
      assetId: String(row.id ?? ''),
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
      // Assignments bind an asset record, not a URL. Several approved lesson
      // records can reference the same licensed file; dropping their IDs makes
      // a valid saved assignment impossible to resolve. Distinct-shot quality
      // remains enforced against the rendered URLs by requireResolvedVisualEvidence.
      const identity = candidate.assetId || candidate.url;
      if (seen.has(identity)) return false;
      seen.add(identity);
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
  // Expiring signatures do not turn one stored clip into distinct footage.
  const distinctShots = new Set(urls.map(url => url!.split(/[?#]/)[0])).size;
  if (distinctShots < MIN_LESSON_VIDEO_SCENES)
    throw new Error(`ULTIMATE_RENDER_DISTINCT_VISUALS_REQUIRED:${distinctShots}:${MIN_LESSON_VIDEO_SCENES}`);
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
    const assignment = visualAssignment(input).assignments?.find(
      (a: any) => a.sceneId === scene.id,
    );
    const candidate = assignment
      ? candidates.find((c) => c.assetId === assignment.assetId)
      : undefined;
    // Scene-to-asset evidence is an authority boundary. A missing mapping
    // cannot be repaired by rotating through unrelated licensed stock.
    if (!assignment || !candidate)
      throw new Error(`ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED:${scene.id}`);
    const physicalDemonstration = (input.requiresPhysicalDemonstration ?? input.requiresPracticalEvidence) === true &&
      [scene.stage, scene.title, scene.sceneType, scene.scene_type].some(value =>
        /^(demonstration|guided_practice|independent_practice|mistake_and_correction|mistake and correction)$/.test(String(value ?? '').trim().toLowerCase()));
    if (physicalDemonstration && candidate.kind !== 'video')
      throw new Error(`ULTIMATE_PRACTICAL_DEMONSTRATION_VIDEO_REQUIRED:${scene.id}`);
    const resolvedCandidate = candidate;
    if (!resolvedCandidate) throw new Error(`ULTIMATE_RENDER_VISUAL_ASSETS_MISSING:${scene.id}`);
    return {
      ...scene,
      physical_demonstration: physicalDemonstration,
      subject: String(scene.title ?? scene.subject ?? input.courseTitle ?? 'Lesson'),
      action: teachingPoint || visualRequirement,
      dialogue: teachingPoint || visualRequirement,
      required_visual_evidence: visualRequirement || teachingPoint,
      scene_type: scene.scene_type ?? scene.sceneType ?? sceneType(index, board.scenes.length),
      // Never fall back to generic stock footage when a licensed asset is unavailable.
      media_source: 'elevate-owned',
      review_status: resolvedCandidate ? 'approved' : 'draft',
      ...(resolvedCandidate?.kind === 'video' ? { source_video_url: resolvedCandidate.url } : {}),
      ...(resolvedCandidate?.kind === 'image' ? { reference_image_url: resolvedCandidate.url } : {}),
      ...(resolvedCandidate
        ? {
            resolved_provider: resolvedCandidate.provider,
            resolved_model: resolvedCandidate.ownedInstructional
              ? 'script-bound-instructional-image'
              : resolvedCandidate.kind === 'video'
                ? 'licensed-video'
                : 'licensed-image',
            source_provider_item_id: resolvedCandidate.providerItemId,
            source_license_evidence_url: resolvedCandidate.licenseEvidenceUrl,
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
    requiredSceneCount: 13,
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
    if (input.lessonPresentation === 'approved-premium-v1' &&
        (!input.presentationContract?.approvedReferenceVideo?.assetId ||
         !/^[a-f0-9]{64}$/i.test(input.presentationContract?.approvedReferenceVideo?.sha256 ?? '')))
      throw new Error('ULTIMATE_APPROVED_REFERENCE_REQUIRED');
    const { uploadCourseVideosObject } = await import('@/lib/video/upload-lesson-media');
    const photographed = this.db ? await prepareTeachingPhotos(input,this.db) : input;
    const materialized = await materializeInstructionalVisualAssets(
      photographed,
      uploadCourseVideosObject,
    );
    const prepared = prepareUltimateStoryboardInput(
      this.db ? await refreshLicensedVisualUrls(materialized, this.db) : materialized,
    );
    const [{ directMedia }, { renderStoryboardVideo }] = await Promise.all([
      import('@/lib/video/media-director'),
      import('@/lib/video/remotion-render'),
    ]);
    const storyboard = directMedia(prepared);
    const teachingPhotos = rawStoryboard(materialized).scenes.map((scene:any)=>materialized.teachingPhotos?.[scene.id]);
    if(input.lessonPresentation === 'approved-premium-v1') storyboard.scenes.forEach((scene:any,index:number)=>{
      if(!scene.sourceVideoUrl) scene.referenceImageUrl=teachingPhotos[index]?.[0]?.imageUrl;
    });
    // Presentation instructions are course data, never a barber-specific constant.
    // Preserve the owner's approved reference identity through the render result.
    const presentation = record(input.presentationContract ?? input.artifacts?.presentation_contract);
    const reference = record(presentation.approvedReferenceVideo);
    if (Object.keys(reference).length &&
        (!String(reference.assetId ?? '').trim() || !String(reference.sha256 ?? '').match(/^[a-f0-9]{64}$/i)))
      throw new Error('ULTIMATE_APPROVED_REFERENCE_ASSET_ID_AND_HASH_REQUIRED');
    const visualStyle = record(presentation.visualStyle);
    if (Object.keys(visualStyle).length &&
        (visualStyle.cropMode && !['contain','cover-safe'].includes(visualStyle.cropMode) ||
         visualStyle.transition && !['cut','crossfade'].includes(visualStyle.transition)))
      throw new Error('ULTIMATE_APPROVED_VISUAL_STYLE_UNSUPPORTED');
    const courseTitle = String(input.courseTitle ?? prepared.title);
    const result = await renderStoryboardVideo({
      lessonId: String(input.lessonId),
      courseTitle,
      storyboard,
      instructorId: instructorFor(courseTitle),
      ultimateStrict: true,
      lessonPresentation: input.lessonPresentation,
      visualStyle,
      teachingPhotos,
      requireVisualEvidence: true,
      narrationSegments: input.artifacts?.natural_narration?.narration?.segments,
    });
    if (!result.success || !result.videoUrl) {
      throw new Error(`ULTIMATE_VIDEO_RENDER_FAILED:${result.error ?? 'missing video URL'}`);
    }
    const visualEvidence = requireResolvedVisualEvidence(result.sceneData);
    return {
      ...result,
      layoutVersion: input.lessonPresentation === 'approved-premium-v1' ? 3 : 2,
      provider: 'remotion',
      providerModel: 'SlideLesson-blueprint-v3',
      captionsUrl: result.sceneData?.captionUrl,
      transcriptUrl: result.sceneData?.transcriptUrl,
      ...visualEvidence,
      licensedFirst: true,
      ...(reference.assetId ? {approvedReferenceAssetId: String(reference.assetId), approvedReferenceSha256: String(reference.sha256)} : {}),
      ...(Object.keys(visualStyle).length ? {requestedVisualStyle: visualStyle} : {}),
    };
  }
}
