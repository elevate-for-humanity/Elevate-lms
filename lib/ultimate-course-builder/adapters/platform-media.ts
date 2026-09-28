import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateMediaDiscoveryResult, UltimateMediaPort } from '../core/ports';
import { recommendLicensedMediaForCourse } from '@/lib/media/licensed-course-media';

type RecordLike = Record<string, any>;

function firstRecord(value: unknown): RecordLike {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === 'object' ? (row as RecordLike) : {};
}

export class UltimatePlatformMedia implements UltimateMediaPort {
  constructor(private db: SupabaseClient) {}

  async find(input: any): Promise<UltimateMediaDiscoveryResult> {
    const courseId = input.courseId ?? input.artifacts?.courseId;
    const lessonId = input.competency?.id ?? input.lessonId;
    if (!courseId) {
      return {
        policy: 'licensed-first',
        licensedSuggestions: [],
        readyAssets: [],
        storyboard: input.storyboard ?? null,
      };
    }
    const licensed = await recommendLicensedMediaForCourse({
      db: this.db as any,
      courseId,
    }).catch(() => []);
    let readyAssetQuery = this.db
      .from('course_videos')
      .select(
        'id,title,video_url,storage_path,status,asset_role,entitlement_id,lesson_id,licensed_media_entitlements(provider,provider_item_id,item_url,metadata)',
      )
      .eq('course_id', courseId)
      .eq('status', 'ready')
      .eq('asset_role', 'source_broll')
      .not('entitlement_id', 'is', null);
    if (lessonId) readyAssetQuery = readyAssetQuery.eq('lesson_id', String(lessonId));
    const { data, error } = await readyAssetQuery.limit(20);
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
          public_url: publicUrl,
          mime_type: metadata.mime_type,
          provider: entitlement.provider ?? 'envato',
          provider_item_id: entitlement.provider_item_id,
          license_evidence_url: entitlement.item_url,
        };
      }),
    );

    return {
      policy: 'licensed-first',
      licensedSuggestions: licensed,
      readyAssets: readyAssets.filter((asset) => Boolean(asset.public_url)),
      storyboard: input.storyboard ?? null,
    };
  }

  async acquire(input: any) {
    return input;
  }

  async store(input: any) {
    return input;
  }
}
