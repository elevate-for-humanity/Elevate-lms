import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface DashboardHeroAsset {
  id: string;
  url: string;
  alt: string;
}

/** Assets are selected in Supabase, so new photos require no source deployment. */
export async function getAdminDashboardHeroAssets(): Promise<DashboardHeroAsset[]> {
  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('media_assets')
      .select('id,title,public_url,metadata')
      .eq('asset_type', 'image')
      .is('deleted_at', null)
      .contains('tags', ['admin-dashboard-hero'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .abortSignal(AbortSignal.timeout(8000));
    if (error) return [];
    return (data ?? []).flatMap((asset) => {
      if (!asset.public_url || !asset.title) return [];
      try {
        const url = new URL(asset.public_url);
        if (url.protocol !== 'https:' || url.username || url.password) return [];
        const metadata = asset.metadata as Record<string, unknown> | null;
        const alt =
          typeof metadata?.alt === 'string' && metadata.alt.trim() ? metadata.alt : asset.title;
        return [{ id: asset.id, url: url.href, alt }];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
