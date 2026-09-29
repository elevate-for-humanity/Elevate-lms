import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateMediaDiscoveryResult, UltimateMediaPort } from '../core/ports';
import {
  attachStoredLicensedMedia,
  recommendLicensedMediaForCourse,
  storedLicensedMediaMetadata,
} from '@/lib/media/licensed-course-media';

type RecordLike = Record<string, any>;

function firstRecord(value: unknown): RecordLike {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === 'object' ? (row as RecordLike) : {};
}

export class UltimatePlatformMedia implements UltimateMediaPort {
  constructor(private db: SupabaseClient) {}

  async find(input: any): Promise<UltimateMediaDiscoveryResult> {
    const courseId = input.courseId ?? input.artifacts?.courseId;
    if (!courseId) {
      return { policy: 'licensed-first', licensedSuggestions: [], readyAssets: [], storyboard: input.storyboard ?? null };
    }
    const licensed = await recommendLicensedMediaForCourse({ db: this.db as any, courseId }).catch(() => []);
    const { data, error } = await this.db
      .from('course_videos')
      .select('id,title,video_url,storage_path,status,asset_role,entitlement_id,lesson_id,licensed_media_entitlements(provider,provider_item_id,item_url,metadata)')
      .eq('course_id', courseId)
      .eq('status', 'ready')
      .eq('asset_role', 'source_broll')
      .not('entitlement_id', 'is', null)
      .limit(20);
    if (error) throw error;

    const readyAssets = await Promise.all((data ?? []).map(async (asset: RecordLike) => {
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
        public_url: publicUrl,
        mime_type: metadata.mime_type,
        provider: entitlement.provider ?? 'envato',
        provider_item_id: entitlement.provider_item_id,
        license_evidence_url: entitlement.item_url,
      };
    }));

    return {
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
      .select('id,lesson_id,status,entitlement_id,licensed_media_entitlements!inner(metadata)')
      .eq('course_id', courseId)
      .in('status', ['suggested', 'approved']);
    if (error) throw error;

    let attached = 0;
    let pending = 0;
    for (const match of matches ?? []) {
      const entitlement = firstRecord(match.licensed_media_entitlements);
      if (!storedLicensedMediaMetadata(entitlement.metadata)) {
        pending += 1;
        continue;
      }

      if (match.status === 'suggested') {
        const { error: promoteError } = await this.db
          .from('course_lesson_media_matches')
          .update({
            status: 'approved',
            approved_by: course?.created_by ?? null,
            approved_at: new Date().toISOString(),
            failure_reason: null,
          })
          .eq('id', match.id)
          .eq('status', 'suggested');
        if (promoteError) throw promoteError;
      }

      await attachStoredLicensedMedia({
        db: this.db,
        matchId: String(match.id),
        courseId,
        lessonId: String(match.lesson_id),
        actorId: String(course?.created_by ?? ''),
      });
      attached += 1;
    }
    return { attached, pending };
  }

  async store(input: any) {
    return this.acquire(input);
  }
}
