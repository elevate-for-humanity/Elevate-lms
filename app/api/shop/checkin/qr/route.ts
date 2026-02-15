import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shop for this user
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check for existing valid code
    const { data: existingCode } = await supabase
      .from('shop_checkin_codes')
      .select('code, expires_at')
      .eq('shop_id', shop.id)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (existingCode) {
      // Get today's check-ins
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('checkin_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .gte('checkin_time', today);

      return NextResponse.json({
        qrCode: existingCode.code,
        shopId: shop.id,
        shopName: shop.name,
        expiresAt: existingCode.expires_at,
        todayCheckIns: count || 0,
      });
    }

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const { error: insertError } = await supabase
      .from('shop_checkin_codes')
      .insert({
        shop_id: shop.id,
        code: code,
        expires_at: expiresAt,
        created_by: user.id,
      });

    if (insertError) {
      logger.error('Error creating code:', insertError);
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    return NextResponse.json({
      qrCode: code,
      shopId: shop.id,
      shopName: shop.name,
      expiresAt: expiresAt,
      todayCheckIns: 0,
    });
  } catch (error) {
    logger.error('QR code generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Force generate new code
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shop for this user
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Invalidate existing codes
    await supabase
      .from('shop_checkin_codes')
      .update({ expires_at: new Date().toISOString() })
      .eq('shop_id', shop.id)
      .gt('expires_at', new Date().toISOString());

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('shop_checkin_codes')
      .insert({
        shop_id: shop.id,
        code: code,
        expires_at: expiresAt,
        created_by: user.id,
      });

    if (insertError) {
      logger.error('Error creating code:', insertError);
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    return NextResponse.json({
      qrCode: code,
      shopId: shop.id,
      shopName: shop.name,
      expiresAt: expiresAt,
      todayCheckIns: 0,
    });
  } catch (error) {
    logger.error('QR code generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
