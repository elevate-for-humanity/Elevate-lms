import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shop for this user
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: shop.name || '',
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      zip: shop.zip || '',
      phone: shop.phone || '',
      email: shop.email || '',
      licenseNumber: shop.license_number || '',
      ownerName: shop.owner_name || '',
    });
  } catch (error) {
    logger.error('Shop details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _PUT(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, city, state, zip, phone, email, licenseNumber, ownerName } = body;

    // Get shop for this user
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Update shop
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        name: name,
        address: address,
        city: city,
        state: state,
        zip: zip,
        phone: phone,
        email: email,
        license_number: licenseNumber,
        owner_name: ownerName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id);

    if (updateError) {
      logger.error('Error updating shop:', updateError);
      return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Shop update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/shop/details', _GET);
export const PUT = withApiAudit('/api/shop/details', _PUT);
