import type { SupabaseClient } from '@supabase/supabase-js';

/** Provision a missing site only from the apprentice's existing active shop.
 * Existing site policy (including a disabled site) always wins. No coordinates,
 * partner relationship, radius override, or identity approval come from callers.
 */
export async function provisionMissingTimeclockSite(db: SupabaseClient, shopId: string) {
  const { data: existing, error: existingError } = await db.from('apprentice_sites')
    .select('id').eq('shop_id', shopId).limit(1);
  if (existingError) throw existingError;
  if (existing?.length) return;

  const { data: shop, error: shopError } = await db.from('shops')
    .select('id,name,active,partner_id,latitude,longitude')
    .eq('id', shopId).eq('active', true).maybeSingle();
  if (shopError) throw shopError;
  if (!shop?.active || !shop.partner_id || shop.latitude == null || shop.longitude == null) return;
  const lat = Number(shop.latitude);
  const lng = Number(shop.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return;

  // Stable primary key makes simultaneous first loads idempotent. Do not update
  // any existing row; the table's established radius and active defaults apply.
  const { error } = await db.from('apprentice_sites').upsert({
    id: shop.id,
    shop_id: shop.id,
    partner_id: shop.partner_id,
    name: shop.name,
    latitude: lat,
    longitude: lng,
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}
