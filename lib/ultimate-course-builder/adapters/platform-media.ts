import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateMediaDiscoveryResult, UltimateMediaPort } from '../core/ports';
import { recommendLicensedMediaForCourse } from '@/lib/media/licensed-course-media';

export class UltimatePlatformMedia implements UltimateMediaPort {
  constructor(private db: SupabaseClient) {}

  async find(input: unknown): Promise<UltimateMediaDiscoveryResult> {
    const request = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
    const courseId = request.courseId ?? request.artifacts?.courseId;
    if (!courseId) {
      return { policy: 'licensed-first', licensedSuggestions: [], readyAssets: [], storyboard: request.storyboard ?? null };
    }
    const licensedSuggestions = await recommendLicensedMediaForCourse({
      db: this.db as any,
      courseId: String(courseId),
    }).catch(() => []);
    const { data, error } = await this.db
      .from('course_videos')
      .select('id,title,storage_path,status,asset_role,entitlement_id,lesson_id')
      .eq('course_id', String(courseId))
      .eq('status', 'ready')
      .limit(100);
    if (error) throw error;
    return {
      policy: 'licensed-first',
      licensedSuggestions: Array.isArray(licensedSuggestions) ? licensedSuggestions : [],
      readyAssets: data ?? [],
      storyboard: request.storyboard ?? null,
    };
  }

  async acquire(input: unknown): Promise<unknown> { return input; }
  async store(input: unknown): Promise<unknown> { return input; }
}
