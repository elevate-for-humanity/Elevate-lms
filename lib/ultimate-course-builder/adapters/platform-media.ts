import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateMediaDiscoveryResult, UltimateMediaPort } from '../core/ports';
import {
  attachStoredLicensedMedia,
  recommendLicensedMediaForCourse,
  storedLicensedMediaMetadata,
} from '@/lib/media/licensed-course-media';

import { buildSceneAssignments } from '../instructional/scene-assignments';
import { UltimateEnvatoMarketClient } from './envato-client';

type RecordLike = Record<string, any>;

function firstRecord(value: unknown): RecordLike {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === 'object' ? (row as RecordLike) : {};
}

export class UltimatePlatformMedia implements UltimateMediaPort {
  private envato = new UltimateEnvatoMarketClient();
  constructor(private db: SupabaseClient) {}

  private async acquireApprovedEnvatoMatch(match: RecordLike) {
    const entitlement = firstRecord(match.licensed_media_entitlements);
    const itemId = String(entitlement.provider_item_id ?? '').trim();
    if (!itemId || String(entitlement.provider ?? 'envato') !== 'envato') return false;
    const metadata = firstRecord(entitlement.metadata);
    const workspaceAssetUrl = String(metadata.assetUrl ?? metadata.asset_url ?? '').trim();
    const workspaceLicensed =
      metadata.licenseObserved === true ||
      String(metadata.licenseVerificationStatus ?? '').startsWith('license_observed');
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
      // Envato Market buyer/download requires a real marketplace item id.
      // Internal workspace UUIDs must never be sent to that endpoint.
      if (!/^\\d+$/.test(itemId))
        throw new Error('ULTIMATE_ENVATO_MARKET_ITEM_ID_REQUIRED');
      acquired = await this.envato.acquire({
        id: itemId,
        url: String(entitlement.item_url ?? ''),
        source: 'envato',
        licenseVerified: false,
        matchScore: Number(match.match_score ?? 1),
      });
    }
    const bytes = acquired?.download?.bytes;
    if (!(bytes instanceof Uint8Array) || !bytes.byteLength) throw new Error('ULTIMATE_ENVATO_DOWNLOAD_EMPTY');
    const mimeType = String(acquired.download.mimeType ?? 'video/mp4');
    const extension = mimeType.includes('quicktime') ? 'mov' : mimeType.includes('webm') ? 'webm' : 'mp4';
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
    const courseId = input.courseId ?? input.artifacts?.courseId;
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
        'id,title,video_url,storage_path,status,asset_role,entitlement_id,lesson_id,licensed_media_entitlements(provider,provider_item_id,item_url,metadata)',
      )
      .eq('course_id', courseId)
      .eq('status', 'ready')
      .eq('asset_role', 'source_broll')
      .not('entitlement_id', 'is', null)
      .order('id');
    if (error) throw error;

    const readyAssets = await Promise.all(
      (data ?? []).map(async (asset: RecordLike) => {
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
        return {
          ...asset,
          id: String(asset.id),
          public_url: publicUrl,
          mime_type: metadata.mime_type,
          provider: entitlement.provider ?? 'envato',
          provider_item_id: entitlement.provider_item_id,
          license_evidence_url: metadata.license_evidence_url ?? metadata.licenseEvidenceUrl,
          scene_id: metadata.scene_id,
          relevance_reason: metadata.relevance_reason,
          duration_seconds: metadata.duration_seconds ?? metadata.verifiedDurationSeconds ?? metadata.technicalQa?.durationSeconds,
          visual_coverage_verified: metadata.visual_coverage_verified === true,
          visual_requirements: metadata.visual_requirements,
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
      throw new Error(`ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED:${JSON.stringify({ assignments, gaps })}`);
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
      .select('id,lesson_id,status,entitlement_id,match_score,licensed_media_entitlements!inner(provider,provider_item_id,item_url,metadata)')
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
      const metadata = firstRecord(entitlement.metadata);
      const stored = Boolean(storedLicensedMediaMetadata(metadata));
      const retrievableWorkspaceAsset =
        typeof metadata.assetUrl === 'string' &&
        metadata.assetUrl.trim().startsWith('https://') &&
        (metadata.licenseObserved === true ||
          String(metadata.licenseVerificationStatus ?? '').startsWith('license_observed') ||
          String(metadata.licenseVerificationStatus ?? '') === 'verified_item_detail_banner');
      return stored || retrievableWorkspaceAsset;
    });
    const bestByLesson = new Map<string, RecordLike>();
    for (const match of usableMatches) {
      const lessonId = String(match.lesson_id);
      const current = bestByLesson.get(lessonId);
      if (!current || Number(match.match_score ?? 0) > Number(current.match_score ?? 0))
        bestByLesson.set(lessonId, match);
    }
    for (const match of bestByLesson.values()) {
      const entitlement = firstRecord(match.licensed_media_entitlements);
      if (match.status === 'suggested') {
        const { error: approveError } = await this.db
          .from('course_lesson_media_matches')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            failure_reason: null,
          })
          .eq('id', match.id)
          .eq('status', 'suggested');
        if (approveError) throw approveError;
        match.status = 'approved';
      }

      if (!storedLicensedMediaMetadata(entitlement.metadata)) {
        await this.acquireApprovedEnvatoMatch(match);
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
    pending = Math.max(0, usableMatches.length - attached);
    return { attached, pending };
  }

  async store(input: any) {
    return this.acquire(input);
  }
}
