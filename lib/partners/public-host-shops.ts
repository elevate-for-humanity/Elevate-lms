import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';

export type PublicHostShopMedia = { url: string; alt?: string; source?: string };

export type PublicHostShop = {
  id: string;
  public_slug: string;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  flyer_url: string | null;
  website_url: string | null;
  website: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  programs: unknown;
  featured: boolean | null;
  display_order: number | null;
  public_profile_published_at: string | null;
  media_gallery: PublicHostShopMedia[] | null;
  video_url: string | null;
  source_url: string | null;
  google_maps_url: string | null;
  media_verified_at: string | null;
};

export async function listPublicHostShops(): Promise<PublicHostShop[]> {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('public_host_shops')
    .select('*')
    .order('featured', { ascending: false, nullsFirst: false })
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('display_name', { ascending: true });

  if (error) throw new Error(`PUBLIC_HOST_SHOPS_LIST_FAILED:${error.message}`);
  return (data ?? []) as PublicHostShop[];
}

export async function getPublicHostShopBySlug(slug: string): Promise<PublicHostShop | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('public_host_shops')
    .select('*')
    .eq('public_slug', normalized)
    .maybeSingle();

  if (error) throw new Error(`PUBLIC_HOST_SHOP_LOOKUP_FAILED:${error.message}`);
  return (data as PublicHostShop | null) ?? null;
}
