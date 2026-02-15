import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { geocodeAddress, buildAddressString, isGeocodingResult } from '@/lib/geo/geocode';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { shop_id, retry } = await req.json();

    if (!shop_id) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    // Get shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, address1, address2, city, state, zip')
      .eq('id', shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Clear failed status if retrying
    if (retry) {
      await supabase
        .from('shops')
        .update({ geocode_failed_at: null, geocode_error: null })
        .eq('id', shop_id);
    }

    // Build address string
    const address = buildAddressString({
      address1: shop.address1,
      address2: shop.address2,
      city: shop.city,
      state: shop.state,
      zip: shop.zip,
    });

    if (!address || address.length < 5) {
      await supabase
        .from('shops')
        .update({
          geocode_failed_at: new Date().toISOString(),
          geocode_error: 'Insufficient address data',
        })
        .eq('id', shop_id);

      return NextResponse.json({ success: false, error: 'Insufficient address data' });
    }

    // Geocode
    const result = await geocodeAddress(address);

    if (isGeocodingResult(result)) {
      await supabase
        .from('shops')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
          geocoded_at: new Date().toISOString(),
          geocode_source: result.source,
          geocode_failed_at: null,
          geocode_error: null,
        })
        .eq('id', shop_id);

      return NextResponse.json({
        success: true,
        latitude: result.latitude,
        longitude: result.longitude,
        source: result.source,
      });
    } else {
      await supabase
        .from('shops')
        .update({
          geocode_failed_at: new Date().toISOString(),
          geocode_error: result.error,
        })
        .eq('id', shop_id);

      return NextResponse.json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Geocode error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
