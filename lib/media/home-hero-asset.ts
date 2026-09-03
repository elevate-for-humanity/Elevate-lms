import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export interface ApprovedHomeHeroAsset {
  id: string;
  publicUrl: string;
  transcript?: string;
}

export async function getApprovedHomeHeroAsset(): Promise<ApprovedHomeHeroAsset | null> {
  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('media_assets')
      .select('id, transcript, metadata, created_at')
      .eq('status', 'active')
      .contains('metadata', { kind: 'homepage-hero-commercial', homepage_hero: true, approved: true, qa_approved: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    const publicUrl = (data.metadata as Record<string, unknown> | null)?.public_url;
    if (typeof publicUrl !== 'string' || !publicUrl.startsWith('https://')) return null;
    return {
      id: data.id,
      publicUrl,
      transcript: data.transcript || undefined,
    };
  } catch {
    return null;
  }
}
