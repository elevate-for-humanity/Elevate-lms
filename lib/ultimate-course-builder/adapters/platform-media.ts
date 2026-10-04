import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateMediaDiscoveryResult, UltimateMediaPort } from '../core/ports';
import {
  attachStoredLicensedMedia,
  licensedMediaBelongsToCourse,
  recommendLicensedMediaForCourse,
  storedLicensedMediaMetadata,
} from '@/lib/media/licensed-course-media';

import { buildSceneAssignments } from '../instructional/scene-assignments';
import { selectApprovedAcquisitionMatches } from '../instructional/acquisition-selection';
import { requestMediaDependency } from '../worker/request-media-dependency';

type RecordLike = Record<string, any>;

function firstRecord(value: unknown): RecordLike {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === 'object' ? (row as RecordLike) : {};
}

/** A terms page alone is not proof that a particular item was licensed. */
export function observedLicenseEvidence(entitlement: RecordLike): string | undefined {
  const metadata = firstRecord(entitlement.metadata);
  const document = entitlement.license_document_url ?? metadata.license_evidence_url ?? metadata.licenseEvidenceUrl;
  if (typeof document === 'string' && document.trim()) return document.trim();
  const observed = metadata.licenseObserved === true ||
    String(metadata.licenseVerificationStatus ?? '').startsWith('license_observed') ||
    metadata.licenseVerificationStatus === 'verified_item_detail_banner';
  // Keep the observed item, capture time and workspace in the ready asset too;
  // the shared terms URL must never manufacture a license observation.
  if (observed && metadata.licenseObservedAt && entitlement.provider_item_id && metadata.licenseTermsUrl)
    return String(metadata.licenseTermsUrl);
  return undefined;
}

export function canAutoApproveLicensedMediaMatch(match: RecordLike, courseId: string): boolean {
  if (String(match.status ?? '') !== 'suggested') return false;
  if (!(Number(match.match_score ?? 0) > 0)) return false;
  if (!Array.isArray(match.match_reasons) || match.match_reasons.length === 0) return false;
  const entitlement = firstRecord(match.licensed_media_entitlements);
  if (String(entitlement.provider ?? '') !== 'envato') return false;
  const metadata = firstRecord(entitlement.metadata);
  if (!licensedMediaBelongsToCourse(metadata, courseId)) return false;
  if (!observedLicenseEvidence(entitlement)) return false;
  const stored = Boolean(storedLicensedMediaMetadata(metadata));
  const retrievableWorkspaceAsset =
    (typeof metadata.assetUrl === 'string' || typeof metadata.asset_url === 'string') &&
    String(metadata.assetUrl ?? metadata.asset_url).trim().startsWith('https://') &&
    (metadata.licenseObserved === true ||
      String(metadata.licenseVerificationStatus ?? '').startsWith('license_observed') ||
      String(metadata.licenseVerificationStatus ?? '') === 'verified_item_detail_banner');
  return stored || retrievableWorkspaceAsset;
}

export class UltimatePlatformMedia implements UltimateMediaPort {
  constructor(private db: SupabaseClient) {}

  private async acquireApprovedEnvatoMatch(match: RecordLike, courseId: string) {
    const entitlement = firstRecord(match.licensed_media_entitlements);
    const itemId = String(entitlement.provider_item_id ?? '').trim();
    if (!itemId || String(entitlement.provider ?? 'envato') !== 'envato') return false;
    const metadata = firstRecord(entitlement.metadata);
    if (!licensedMediaBelongsToCourse(metadata, courseId)) {
      throw new Error('ULTIMATE_ENVATO_COURSE_SCOPE_MISMATCH');
    }
    const workspaceAssetUrl = String(metadata.assetUrl ?? metadata.asset_url ?? '').trim();
    const workspaceLicensed =
      metadata.licenseObserved === true ||
      String(metadata.licenseVerificationStatus ?? '').startsWith('license_observed') ||
      String(metadata.licenseVerificationStatus ?? '') === 'verified_item_detail_banner';
    let acquired: any;
    if (workspaceAssetUrl && workspaceLicensed) {
      const response = await fetch(workspaceAssetUrl, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`ULTIMATE_ENVATO_WORKSPACE_ASSET_HTTP_${response.status}`);
      acquired = {
        download: {
          bytes: new Uint8Array(await response.arrayBuffer()),
          mimeType: response.headers.get('content-type') ?? metadata.mime_type ?? 'application/octet-stream',
        },
        licenseEvidence: {
          provider: 'envato',
          workspaceId: metadata.workspaceId ?? null,
          licenseObservedAt: metadata.licenseObservedAt ?? null,
          licenseTermsUrl: metadata.licenseTermsUrl ?? null,
          source: 'authenticated-envato-workspace',
        },
      };
    } else {
      throw new Error('ULTIMATE_ENVATO_WORKSPACE_ASSET_REQUIRED');
    }
    const bytes = acquired?.download?.bytes;
    if (!(bytes instanceof Uint8Array) || !bytes.byteLength) throw new Error('ULTIMATE_ENVATO_DOWNLOAD_EMPTY');
    const mimeType = String(acquired.download.mimeType ?? 'video/mp4');
    const extension = mimeType.includes('quicktime') ? 'mov' : mimeType.includes('webm') ? 'webm'
      : mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'mp4';
    const storagePath = `licensed-library/envato/${itemId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await this.db.storage.from('course_videos').upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { error: entitlementError } = await this.db
      .from('licensed_media_entitlements')
      .update({
        metadata: {
          ...metadata,
          storage_bucket: 'course_videos',
          storage_path: storagePath,
          mime_type: mimeType,
          file_size: bytes.byteLength,
          source_url: String(entitlement.item_url ?? ''),
          license_evidence_url:
            String(metadata.licenseTermsUrl ?? metadata.license_evidence_url ?? entitlement.item_url ?? ''),
          acquired_at: new Date().toISOString(),
          storageState: 'stored_secure_library',
          downloadState: 'stored',
          courseMediaImportState: 'secure_file_handoff_complete',
          acquisition: acquired.licenseEvidence ?? { provider: 'envato', itemId },
        },
      })
      .eq('id', match.entitlement_id);
    if (entitlementError) {
      await this.db.storage.from('course_videos').remove([storagePath]).catch(() => undefined);
      throw entitlementError;
    }
    return true;
  }

  async find(input: any): Promise<UltimateMediaDiscoveryResult> {
    const courseId = String(input?.courseId ?? input?.artifacts?.courseId ?? '').trim();
    if (!courseId) {
      return {
        policy: 'licensed-first',
        licensedSuggestions: [],
        readyAssets: [],
        storyboard: input.storyboard ?? null,
      };
    }
    const licensed = await recommendLicensedMediaForCourse({ db: this.db as any, courseId }).catch(
      () => [],
    );
    const { data, error } = await this.db
      .from('course_videos')
      .select(
        'id,title,video_url,storage_path,status,asset_role,entitlement_id,lesson_id,course_lesson_media_matches!course_video_id(lesson_id,match_score,match_reasons,search_query,status),licensed_media_entitlements(provider,provider_item_id,item_url,license_document_url,certificate_storage_path,metadata)',
      )
      .eq('course_id', courseId)
      .eq('status', 'ready')
      .eq('asset_role', 'source_broll')
      .not('entitlement_id', 'is', null)
      .order('id');
    if (error) throw error;

    const courseScopedData = (data ?? []).filter((asset: RecordLike) => {
      const entitlement = firstRecord(asset.licensed_media_entitlements);
      return licensedMediaBelongsToCourse(firstRecord(entitlement.metadata), courseId);
    });

    const readyAssets = await Promise.all(
      courseScopedData.map(async (asset: RecordLike) => {
        const entitlement = firstRecord(asset.licensed_media_entitlements);
        const metadata = firstRecord(entitlement.metadata);
        let publicUrl = typeof asset.video_url === 'string' ? asset.video_url : '';
        if (!publicUrl && asset.storage_path) {
          const { data: signed, error: signedError } = await this.db.storage
            .from('course_videos')
            .createSignedUrl(String(asset.storage_path), 60 * 60 * 24);
          if (signedError) throw signedError;
          publicUrl = signed?.signedUrl ?? '';
        }
        const matches = Array.isArray(asset.course_lesson_media_matches) ? asset.course_lesson_media_matches : [];
        const canonicalLessonId = input.profile?.canonicalLessonIds?.[input.competency?.id] ?? input.competency?.id;
        const match = firstRecord(matches.find((m: RecordLike) => String(m.lesson_id) === String(canonicalLessonId)));
        return {
          ...asset,
          id: String(asset.id),
          public_url: publicUrl,
          mime_type: metadata.mime_type,
          provider: entitlement.provider ?? 'envato',
          provider_item_id: entitlement.provider_item_id,
          content_sha256: metadata.courseReadySha256 ?? metadata.sha256,
          observed_visual_actions: metadata.visual_observation?.visibleActions,
          visual_observation: metadata.visual_observation,
          license_evidence_url: observedLicenseEvidence(entitlement),
          license_observation: { itemId: entitlement.provider_item_id, observedAt: metadata.licenseObservedAt,
            workspaceId: metadata.workspaceId, verificationStatus: metadata.licenseVerificationStatus },
          scene_id: metadata.scene_id,
          duration_seconds: metadata.duration_seconds ?? metadata.verifiedDurationSeconds ?? metadata.technicalQa?.durationSeconds,
          visual_coverage_verified: metadata.visual_coverage_verified === true,
          visual_requirements: metadata.visual_requirements,
          lesson_match_verified:
            ['approved', 'attached'].includes(String(match.status ?? '')) &&
            Number(match.match_score ?? 0) > 0,
          lesson_match_score: Number(match.match_score ?? 0),
          lesson_match_query: String(match.search_query ?? ''),
          lesson_match_reasons: Array.isArray(match.match_reasons) ? match.match_reasons : [],
          relevance_reason:
            metadata.relevance_reason ??
            (Array.isArray(match.match_reasons) ? match.match_reasons.join('; ') : ''),
        };
      }),
    );

    const scenes = input.storyboard?.storyboard?.scenes ?? [];
    const { assignments, gaps } = buildSceneAssignments(
      scenes,
      readyAssets,
      input.profile?.sceneAssignments?.[input.competency?.id] ?? [],
    );
    if (gaps.length) {
      const workspaceId = firstRecord(
        firstRecord(courseScopedData[0]?.licensed_media_entitlements).metadata,
      ).workspaceId;
      const acquisition = await requestMediaDependency(this.db, {
        courseId, competencyId: input.competency.id, lessonTitle: input.competency.title,
        gaps, ownerId: input.profile?.mediaAcquisitionOwnerId, workspaceUrl: typeof workspaceId === 'string' && /^[a-zA-Z0-9-]+$/.test(workspaceId)
          ? `https://app.envato.com/workspaces/${workspaceId}` : undefined,
      });
      throw new Error(`ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED:${JSON.stringify({ acquisition, assignments, gaps })}`);
    }
    return {
      assignments,
      policy: 'licensed-first',
      licensedSuggestions: licensed,
      readyAssets: readyAssets.filter((asset) => Boolean(asset.public_url)),
      storyboard: input.storyboard ?? null,
    };
  }

  async acquire(input: any) {
    // Active Ultimate media uses only the authenticated licensed workspace/library.
    const courseId = String(input?.courseId ?? input?.artifacts?.courseId ?? '').trim();
    if (!courseId) return { attached: 0, pending: 0 };

    const { data: course, error: courseError } = await this.db
      .from('courses')
      .select('created_by')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) throw courseError;

    const { data: matches, error } = await this.db
      .from('course_lesson_media_matches')
      .select('id,lesson_id,status,entitlement_id,match_score,match_reasons,licensed_media_entitlements!inner(provider,provider_item_id,item_url,license_document_url,metadata)')
      .eq('course_id', courseId)
      .in('status', ['suggested', 'approved']);
    if (error) throw error;

    let attached = 0;
    let pending = 0;
    // Only media that is already stored or has a verified retrievable workspace
    // asset may participate in automatic selection. Pending workspace handoff
    // records are evidence of intent, not usable media.
    const usableMatches = (matches ?? []).filter((match: RecordLike) => {
      const entitlement = firstRecord(match.licensed_media_entitlements);
      if (entitlement.provider !== 'envato') return false;
      const metadata = firstRecord(entitlement.metadata);
      if (!licensedMediaBelongsToCourse(metadata, courseId)) return false;
      const stored = Boolean(storedLicensedMediaMetadata(metadata));
      const retrievableWorkspaceAsset =
        (typeof metadata.assetUrl === 'string' || typeof metadata.asset_url === 'string') &&
        String(metadata.assetUrl ?? metadata.asset_url).trim().startsWith('https://') &&
        (metadata.licenseObserved === true ||
          String(metadata.licenseVerificationStatus ?? '').startsWith('license_observed') ||
          String(metadata.licenseVerificationStatus ?? '') === 'verified_item_detail_banner');
      return stored || retrievableWorkspaceAsset;
    });
    const eligibleMatches = usableMatches.filter(
      (match: RecordLike) =>
        String(match.status ?? '') === 'approved' ||
        canAutoApproveLicensedMediaMatch(match, courseId),
    );
    const selectedMatches = selectApprovedAcquisitionMatches(eligibleMatches);
    const acquiredEntitlements = new Set<string>();
    for (const match of selectedMatches) {
      if (String(match.status ?? '') === 'suggested') {
        const approvedBy =
          course?.created_by ?? input.profile?.mediaAcquisitionOwnerId ?? null;
        const { error: approveError } = await this.db
          .from('course_lesson_media_matches')
          .update({
            status: 'approved',
            approved_by: approvedBy,
            approved_at: new Date().toISOString(),
            failure_reason: null,
          })
          .eq('id', match.id)
          .eq('status', 'suggested');
        if (approveError) throw approveError;
        match.status = 'approved';
      }
      const entitlement = firstRecord(match.licensed_media_entitlements);
      const entitlementId = String(match.entitlement_id);
      if (!storedLicensedMediaMetadata(entitlement.metadata) && !acquiredEntitlements.has(entitlementId)) {
        await this.acquireApprovedEnvatoMatch(match, courseId);
        // The selected match snapshot remains stale after the first download.
        // Attachment reloads the persisted entitlement; another lesson using
        // the same approved source should not download/upload it again.
        acquiredEntitlements.add(entitlementId);
      }

      await attachStoredLicensedMedia({
        db: this.db,
        matchId: String(match.id),
        courseId,
        lessonId: String(match.lesson_id),
        actorId: course?.created_by ?? null,
      });
      attached += 1;
    }
    pending = Math.max(0, selectedMatches.length - attached);
    return { attached, pending };
  }

  async store(input: any) {
    return this.acquire(input);
  }
}
